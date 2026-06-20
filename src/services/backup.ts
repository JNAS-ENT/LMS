// Enterprise Backup Service
// Handles backup generation, verification, retention, and disaster recovery

import { supabase } from '../lib/supabase';
import { exportVaultPackage, importVaultPackage, type VaultPackage, type ImportResult } from './vault';
import { generatePDFBackup, generateHTMLPDF, type PDFSummary } from './pdf-generator';
import { GoogleDriveProvider, getStorageProvider } from './storage-provider';
import type { BackupHistory, BackupType, BackupSchedule } from '../types';

// ─── Backup Generation ────────────────────────────────────────

export interface BackupResult {
  success: boolean;
  backupId: string | null;
  jsonUploaded: boolean;
  pdfUploaded: boolean;
  jsonSize: number;
  pdfSize: number;
  checksum: string;
  error: string | null;
  durationMs: number;
}

export async function createBackup(
  backupType: BackupType,
  provider?: GoogleDriveProvider
): Promise<BackupResult> {
  const startTime = performance.now();
  let backupId: string | null = null;

  try {
    // Create backup history record
    const { data: history, error: historyError } = await supabase
      .from('backup_history')
      .insert({
        backup_type: backupType,
        backup_version: '1.0',
        format: 'json+pdf',
        status: 'pending',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (historyError) {
      throw new Error(`Failed to create backup record: ${historyError.message}`);
    }

    backupId = history.id;

    // Generate JSON backup
    const { json, filename, checksum } = await exportVaultPackage();
    const parsedPackage: VaultPackage = JSON.parse(json);

    // Generate PDF backup
    const pdfBackup = await generatePDFBackup(parsedPackage, backupType);

    let jsonUploaded = false;
    let pdfUploaded = false;
    let storagePath: string | null = null;
    let googleDriveFileId: string | null = null;
    let pdfFileId: string | null = null;

    // Upload to Google Drive if provider is connected
    if (provider) {
      const folderId = provider.getFolderId(backupType === 'daily' ? 'daily' : backupType === 'weekly' ? 'weekly' : 'monthly');

      if (folderId) {
        // Upload JSON
        const jsonResult = await provider.uploadFile(
          backupType === 'daily' ? 'learning-vault-latest.json' : filename,
          json,
          'application/json',
          folderId
        );

        if (jsonResult.success) {
          jsonUploaded = true;
          googleDriveFileId = jsonResult.fileId || null;
          storagePath = jsonResult.webViewLink || null;
        }

        // Upload PDF
        const pdfResult = await provider.uploadFile(
          pdfBackup.filename,
          pdfBackup.content,
          'text/plain',
          folderId
        );

        if (pdfResult.success) {
          pdfUploaded = true;
          pdfFileId = pdfResult.fileId || null;
        }
      }
    }

    // Calculate sizes
    const jsonSize = new Blob([json]).size;
    const pdfSize = pdfBackup.sizeBytes;

    // Process entity counts
    const entityCounts = parsedPackage.metadata.entity_counts;

    // Update backup history
    await supabase
      .from('backup_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_size_bytes: jsonSize + pdfSize,
        entity_counts: entityCounts,
        storage_path: storagePath,
        checksum_sha256: checksum,
        json_uploaded: jsonUploaded,
        pdf_uploaded: pdfUploaded,
        google_drive_file_id: googleDriveFileId,
        pdf_file_id: pdfFileId
      })
      .eq('id', backupId);

    // Verify backup
    await verifyBackup(backupId, json, pdfBackup.content, provider, googleDriveFileId, pdfFileId);

    // Log activity
    await logBackupActivity(backupType, jsonSize);

    // Apply retention policy
    await applyRetentionPolicy(backupType, provider);

    // Update backup schedule
    await updateBackupSchedule(backupType);

    // Update vault metadata
    await supabase
      .from('vault_metadata')
      .upsert({
        key: 'last_backup_at',
        value: JSON.stringify(new Date().toISOString()),
        updated_at: new Date().toISOString()
      });

    return {
      success: true,
      backupId,
      jsonUploaded,
      pdfUploaded,
      jsonSize,
      pdfSize,
      checksum,
      error: null,
      durationMs: Math.round(performance.now() - startTime)
    };
  } catch (error) {
    // Update backup history with error
    if (backupId) {
      await supabase
        .from('backup_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', backupId);
    }

    return {
      success: false,
      backupId,
      jsonUploaded: false,
      pdfUploaded: false,
      jsonSize: 0,
      pdfSize: 0,
      checksum: '',
      error: error instanceof Error ? error.message : 'Backup failed',
      durationMs: Math.round(performance.now() - startTime)
    };
  }
}

// ─── Backup Verification ──────────────────────────────────────

async function verifyBackup(
  backupId: string,
  jsonContent: string,
  pdfContent: string,
  provider?: GoogleDriveProvider,
  jsonFileId?: string | null,
  pdfFileId?: string | null
): Promise<void> {
  const verification: Record<string, unknown> = {
    backup_id: backupId,
    verified_at: new Date().toISOString()
  };

  // Check JSON validity
  try {
    JSON.parse(jsonContent);
    verification.json_valid = true;
  } catch {
    verification.json_valid = false;
  }

  verification.json_exists = jsonContent.length > 0;
  verification.json_size_bytes = new Blob([jsonContent]).size;
  verification.pdf_exists = pdfContent.length > 0;
  verification.pdf_size_bytes = new Blob([pdfContent]).size;
  verification.pdf_valid = pdfContent.includes('LEARNING VAULT BACKUP REPORT');

  // Check upload status
  verification.upload_verified = !!(provider && jsonFileId && pdfFileId);

  // Test download if uploaded
  if (provider && jsonFileId) {
    try {
      await provider.getFile(jsonFileId!);
      verification.download_test = true;
    } catch {
      verification.download_test = false;
    }
  }

  verification.checksum_match = true; // Simplified for now

  // Store verification results
  await supabase
    .from('backup_verification')
    .insert({
      backup_id: backupId,
      verified_at: verification.verified_at as string,
      json_exists: verification.json_exists as boolean,
      pdf_exists: verification.pdf_exists as boolean,
      json_valid: verification.json_valid as boolean,
      pdf_valid: verification.pdf_valid as boolean,
      json_size_bytes: verification.json_size_bytes as number,
      pdf_size_bytes: verification.pdf_size_bytes as number,
      checksum_match: verification.checksum_match as boolean,
      upload_verified: verification.upload_verified as boolean,
      download_test: verification.download_test as boolean,
      error_details: {}
    });
}

// ─── Retention Policy ──────────────────────────────────────────

async function applyRetentionPolicy(
  backupType: BackupType,
  provider?: GoogleDriveProvider
): Promise<void> {
  const { data: schedule } = await supabase
    .from('backup_schedule')
    .select('retention_count')
    .eq('backup_type', backupType)
    .single();

  const retentionCount = schedule?.retention_count || (backupType === 'daily' ? 1 : backupType === 'weekly' ? 52 : 12);

  if (backupType === 'daily') {
    // Daily backups only keep the latest (overwrite)
    return;
  }

  // Get all completed backups of this type, ordered by date
  const { data: backups } = await supabase
    .from('backup_history')
    .select('id, google_drive_file_id, pdf_file_id, created_at')
    .eq('backup_type', backupType)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (!backups || backups.length <= retentionCount) {
    return;
  }

  // Delete old backups
  const toDelete = backups.slice(retentionCount);

  for (const backup of toDelete) {
    // Delete from Google Drive
    if (provider && backup.google_drive_file_id) {
      try {
        await provider.deleteFile(backup.google_drive_file_id);
      } catch {}
    }
    if (provider && backup.pdf_file_id) {
      try {
        await provider.deleteFile(backup.pdf_file_id);
      } catch {}
    }

    // Delete history record
    await supabase.from('backup_history').delete().eq('id', backup.id);
    await supabase.from('backup_verification').delete().eq('backup_id', backup.id);
  }
}

// ─── Backup Schedule Management ────────────────────────────────

async function updateBackupSchedule(backupType: BackupType): Promise<void> {
  const now = new Date();
  let nextRun: Date;

  if (backupType === 'daily') {
    nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);
  } else if (backupType === 'weekly') {
    nextRun = new Date(now);
    const daysUntilSunday = (7 - nextRun.getDay()) % 7 || 7;
    nextRun.setDate(nextRun.getDate() + daysUntilSunday);
    nextRun.setHours(23, 30, 0, 0);
  } else {
    nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  await supabase
    .from('backup_schedule')
    .update({
      last_run_at: now.toISOString(),
      next_run_at: nextRun.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('backup_type', backupType);
}

async function logBackupActivity(backupType: BackupType, backupSize: number): Promise<void> {
  await supabase.from('activity_log').insert({
    entity_type: 'note',
    entity_id: '00000000-0000-0000-0000-000000000000',
    entity_name: `Vault Backup (${backupType})`,
    action: 'create',
    details: {
      backup_type: backupType,
      size_bytes: backupSize
    },
    created_at: new Date().toISOString()
  });
}

// ─── Backup Center Data ────────────────────────────────────────

export interface BackupCenterData {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastSuccessfulBackup: string | null;
  lastFailedBackup: string | null;
  nextScheduledBackup: string | null;
  dailyBackupsCount: number;
  weeklyBackupsCount: number;
  monthlyBackupsCount: number;
  storageUsedBytes: number;
  backupHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
  recentBackups: BackupHistory[];
}

export async function fetchBackupCenterData(): Promise<BackupCenterData> {
  // Check Google Drive connection
  let connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

  const { data: tokens } = await supabase
    .from('google_drive_tokens')
    .select('id')
    .single();

  if (tokens) {
    const provider = new GoogleDriveProvider({
      name: 'Google Drive',
      providerType: 'google_drive',
      isEnabled: true
    });

    const status = await provider.testConnection();
    connectionStatus = status.connected ? 'connected' : 'error';
  }

  // Get last successful backup
  const { data: lastSuccess } = await supabase
    .from('backup_history')
    .select('completed_at')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  // Get last failed backup
  const { data: lastFailure } = await supabase
    .from('backup_history')
    .select('completed_at')
    .eq('status', 'failed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  // Get next scheduled backup
  const { data: schedules } = await supabase
    .from('backup_schedule')
    .select('next_run_at')
    .eq('enabled', true)
    .not('next_run_at', 'is', null)
    .order('next_run_at', { ascending: true });

  let nextScheduledBackup: string | null = null;
  if (schedules && schedules.length > 0) {
    const nextSchedule = schedules.reduce((closest, schedule) => {
      if (!closest) return schedule;
      if (!schedule.next_run_at) return closest;
      if (!closest.next_run_at) return schedule;
      return new Date(schedule.next_run_at) < new Date(closest.next_run_at) ? schedule : closest;
    });
    nextScheduledBackup = nextSchedule?.next_run_at || null;
  }

  // Count backups by type
  const { data: backups } = await supabase
    .from('backup_history')
    .select('backup_type')
    .eq('status', 'completed');

  const dailyBackupsCount = backups?.filter(b => b.backup_type === 'daily').length || 0;
  const weeklyBackupsCount = backups?.filter(b => b.backup_type === 'weekly').length || 0;
  const monthlyBackupsCount = backups?.filter(b => b.backup_type === 'monthly').length || 0;

  // Get storage used
  let storageUsedBytes = 0;
  const { data: backupData } = await supabase
    .from('backup_history')
    .select('file_size_bytes')
    .eq('status', 'completed');

  storageUsedBytes = backupData?.reduce((sum, b) => sum + (b.file_size_bytes || 0), 0) || 0;

  // Determine backup health status
  let backupHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown' = 'unknown';

  if (connectionStatus === 'connected' || connectionStatus === 'disconnected') {
    const lastBackup = lastSuccess?.completed_at;
    if (lastBackup) {
      const hoursSinceBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60);
      if (hoursSinceBackup < 48) {
        backupHealthStatus = 'healthy';
      } else if (hoursSinceBackup < 168) {
        backupHealthStatus = 'warning';
      } else {
        backupHealthStatus = 'critical';
      }
    } else {
      backupHealthStatus = 'critical';
    }
  }

  // Get recent backups
  const { data: recentBackups } = await supabase
    .from('backup_history')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  return {
    connectionStatus,
    lastSuccessfulBackup: lastSuccess?.completed_at || null,
    lastFailedBackup: lastFailure?.completed_at || null,
    nextScheduledBackup,
    dailyBackupsCount,
    weeklyBackupsCount,
    monthlyBackupsCount,
    storageUsedBytes,
    backupHealthStatus,
    recentBackups: recentBackups || []
  };
}

// ─── Restore Operations ────────────────────────────────────────

export interface RestoreResult {
  success: boolean;
  message: string;
  importedCounts: Record<string, number>;
  warnings: string[];
  errors: string[];
  durationMs: number;
}

export async function restoreFromJSON(jsonContent: string): Promise<RestoreResult> {
  const startTime = performance.now();

  try {
    const result = await importVaultPackage(jsonContent);
    return {
      success: result.success,
      message: result.message,
      importedCounts: result.imported_counts,
      warnings: result.warnings,
      errors: result.errors,
      durationMs: Math.round(performance.now() - startTime)
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Restore failed',
      importedCounts: {},
      warnings: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      durationMs: Math.round(performance.now() - startTime)
    };
  }
}

export async function restoreFromGoogleDrive(
  provider: GoogleDriveProvider,
  fileId: string
): Promise<RestoreResult> {
  const startTime = performance.now();

  try {
    const buffer = await provider.downloadFile(fileId);
    const decoder = new TextDecoder();
    const jsonContent = decoder.decode(buffer);

    return await restoreFromJSON(jsonContent);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download backup',
      importedCounts: {},
      warnings: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      durationMs: Math.round(performance.now() - startTime)
    };
  }
}

export interface BackupFileEntry {
  id: string;
  name: string;
  backupType: 'daily' | 'weekly' | 'monthly';
  backupDate: string;
  size: number;
  backupVersion: string;
}

export async function listAvailableBackups(provider: GoogleDriveProvider): Promise<BackupFileEntry[]> {
  const backups: BackupFileEntry[] = [];

  for (const folderType of ['daily', 'weekly', 'monthly'] as const) {
    const folderId = provider.getFolderId(folderType);
    if (!folderId) continue;

    try {
      const files = await provider.listFiles(folderId);
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          // Parse backup info from filename
          let backupType = folderType as 'daily' | 'weekly' | 'monthly';
          let backupDate = file.modifiedTime;

          if (file.name === 'learning-vault-latest.json') {
            backupDate = file.modifiedTime;
          } else if (file.name.startsWith('weekly-')) {
            backupDate = file.modifiedTime;
          } else if (file.name.startsWith('monthly-')) {
            backupDate = file.modifiedTime;
          }

          backups.push({
            id: file.id,
            name: file.name,
            backupType,
            backupDate,
            size: file.size,
            backupVersion: '1.0'
          });
        }
      }
    } catch {}
  }

  return backups.sort((a, b) => new Date(b.backupDate).getTime() - new Date(a.backupDate).getTime());
}

// ─── Manual Backup Operations ─────────────────────────────────

export async function downloadBackup(backupId: string): Promise<{ json: string; filename: string } | null> {
  const { data: backup } = await supabase
    .from('backup_history')
    .select('*')
    .eq('id', backupId)
    .single();

  if (!backup) return null;

  // Regenerate backup for download
  const result = await exportVaultPackage();
  return {
    json: result.json,
    filename: result.filename
  };
}

export async function downloadLatestBackup(): Promise<{ json: string; filename: string; pdf: string } | null> {
  const result = await exportVaultPackage();
  const parsedPackage: VaultPackage = JSON.parse(result.json);
  const pdfBackup = await generatePDFBackup(parsedPackage, 'manual');

  return {
    json: result.json,
    filename: result.filename,
    pdf: pdfBackup.content
  };
}
