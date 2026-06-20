import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  FolderOpen,
  Settings,
  ChevronRight,
  Loader2,
  Trash2,
  ExternalLink,
  Shield,
  FileJson,
  FileText,
  Info
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  GoogleDriveProvider,
  setCurrentProvider,
  clearCurrentProvider
} from '../services/storage-provider';
import {
  createBackup,
  fetchBackupCenterData,
  restoreFromJSON,
  restoreFromGoogleDrive,
  listAvailableBackups,
  downloadLatestBackup,
  type BackupResult,
  type BackupCenterData,
  type BackupFileEntry
} from '../services/backup';
import type { BackupType } from '../types';

export default function BackupCenter() {
  const [data, setData] = useState<BackupCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [provider, setProvider] = useState<GoogleDriveProvider | null>(null);
  const [availableBackups, setAvailableBackups] = useState<BackupFileEntry[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showBackupConfirm, setShowBackupConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [oauthPending, setOauthPending] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const centerData = await fetchBackupCenterData();
      setData(centerData);

      // Initialize provider if connected
      if (centerData.connectionStatus === 'connected') {
        const gdriveProvider = new GoogleDriveProvider({
          name: 'Google Drive',
          providerType: 'google_drive',
          isEnabled: true
        });
        await gdriveProvider.connect();
        setProvider(gdriveProvider);
        setCurrentProvider(gdriveProvider);

        // Load available backups
        const backups = await listAvailableBackups(gdriveProvider);
        setAvailableBackups(backups);
      }
    } catch (err) {
      console.error('Failed to load backup center data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'google_drive_oauth' && oauthPending) {
      handleOAuthCallback(code);
    }
  }, [oauthPending]);

  const handleOAuthCallback = async (code: string) => {
    setActionLoading('oauth');
    setNotification(null);

    try {
      // Exchange code for tokens via Edge Function
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-drive-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirect_uri: window.location.origin + '/backup-center'
        })
      });

      if (!response.ok) {
        throw new Error('OAuth exchange failed');
      }

      setNotification({ type: 'success', message: 'Google Drive connected successfully!' });
      setOauthPending(false);

      // Reload data
      await loadData();

      // Clean up URL
      window.history.replaceState({}, '', '/backup-center');
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to connect Google Drive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const connectGoogleDrive = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setNotification({
        type: 'error',
        message: 'Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment.'
      });
      return;
    }

    setOauthPending(true);
    const redirectUri = `${window.location.origin}/backup-center`;
    const scope = 'https://www.googleapis.com/auth/drive.file';

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', 'google_drive_oauth');

    window.location.href = authUrl.toString();
  };

  const disconnectGoogleDrive = async () => {
    setActionLoading('disconnect');

    try {
      if (provider) {
        await provider.disconnect();
        clearCurrentProvider();
        setProvider(null);
      }

      setNotification({ type: 'success', message: 'Google Drive disconnected.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to disconnect Google Drive.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const runBackup = async (backupType: BackupType) => {
    setActionLoading(`backup-${backupType}`);
    setShowBackupConfirm(null);

    try {
      const result: BackupResult = await createBackup(backupType, provider || undefined);

      if (result.success) {
        setNotification({
          type: 'success',
          message: `Backup completed successfully. JSON: ${(result.jsonSize / 1024).toFixed(1)} KB, PDF: ${(result.pdfSize / 1024).toFixed(1)} KB`
        });
        await loadData();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Backup failed'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Backup failed'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const downloadBackupFiles = async () => {
    setActionLoading('download');

    try {
      const result = await downloadLatestBackup();
      if (!result) {
        throw new Error('Failed to generate backup');
      }

      // Download JSON
      const jsonBlob = new Blob([result.json], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = result.filename;
      jsonLink.click();
      URL.revokeObjectURL(jsonUrl);

      // Download PDF (text version)
      const pdfBlob = new Blob([result.pdf], { type: 'text/plain' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = result.filename.replace('.json', '.txt');
      pdfLink.click();
      URL.revokeObjectURL(pdfUrl);

      setNotification({ type: 'success', message: 'Backup files downloaded' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to download backup'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreFromFile = async (file: File) => {
    setActionLoading('restore');

    try {
      const text = await file.text();
      const result = await restoreFromJSON(text);

      if (result.success) {
        const totalImported = Object.values(result.importedCounts).reduce((a, b) => a + b, 0);
        setNotification({
          type: 'success',
          message: `Restored ${totalImported} items successfully.`
        });
        setShowRestoreModal(false);
        await loadData();
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Restore failed'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to restore'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreFromDrive = async (backup: BackupFileEntry) => {
    if (!provider) return;

    setActionLoading(`restore-${backup.id}`);

    try {
      const result = await restoreFromGoogleDrive(provider, backup.id);

      if (result.success) {
        const totalImported = Object.values(result.importedCounts).reduce((a, b) => a + b, 0);
        setNotification({
          type: 'success',
          message: `Restored ${totalImported} items from backup dated ${new Date(backup.backupDate).toLocaleDateString()}.`
        });
        setShowRestoreModal(false);
        await loadData();
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Restore failed'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to restore'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openBackupFolder = () => {
    console.log('[BACKUP CENTER] openBackupFolder: Opening Google Drive folder...');
    if (!provider) {
      console.error('[BACKUP CENTER] openBackupFolder: No provider connected');
      setNotification({
        type: 'error',
        message: 'Google Drive not connected'
      });
      return;
    }

    const folderUrl = provider.getFolderUrl('root');
    console.log('[BACKUP CENTER] openBackupFolder: Folder URL:', folderUrl);

    if (folderUrl) {
      window.open(folderUrl, '_blank');
      setNotification({
        type: 'success',
        message: 'Opening Google Drive folder in new tab...'
      });
    } else {
      // Folder doesn't exist, initialize it
      console.log('[BACKUP CENTER] openBackupFolder: No folder URL, initializing...');
      provider.initializeFolderStructure().then((success) => {
        if (success) {
          const newUrl = provider.getFolderUrl('root');
          if (newUrl) {
            window.open(newUrl, '_blank');
            setNotification({
              type: 'success',
              message: 'Created backup folder and opened in new tab'
            });
          }
        } else {
          setNotification({
            type: 'error',
            message: 'Failed to create backup folder'
          });
        }
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (data?.connectionStatus) {
      case 'connected': return <Cloud className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <CloudOff className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading backup center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Backup Center" subtitle="Enterprise backup and disaster recovery" />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center justify-between ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' :
              notification.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
              {notification.type === 'error' && <XCircle className="h-5 w-5" />}
              {notification.type === 'info' && <Info className="h-5 w-5" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded">
              <XCircle className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              data?.connectionStatus === 'connected' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {data?.connectionStatus === 'connected' ? (
                <Cloud className="h-8 w-8 text-green-600" />
              ) : (
                <CloudOff className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {data?.connectionStatus === 'connected' ? 'Google Drive Connected' : 'Google Drive Not Connected'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {data?.connectionStatus === 'connected'
                  ? 'Automatic backups will be synced to Google Drive'
                  : 'Connect Google Drive to enable automatic cloud backups'}
              </p>
              {data?.connectionStatus === 'connected' && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Your data is encrypted and stored securely
                </p>
              )}
            </div>
          </div>
          <div>
            {data?.connectionStatus === 'connected' ? (
              <button
                onClick={disconnectGoogleDrive}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'disconnect' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </button>
            ) : (
              <button
                onClick={connectGoogleDrive}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'oauth' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Connect Google Drive'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backup Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Backup Health</span>
            {data?.backupHealthStatus && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getHealthStatusColor(data.backupHealthStatus)}`}>
                {data.backupHealthStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data?.backupHealthStatus === 'healthy' ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : data?.backupHealthStatus === 'critical' ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            )}
            <div className="text-sm text-gray-600">
              <div>Last: {formatDate(data?.lastSuccessfulBackup)}</div>
              {data?.lastFailedBackup && (
                <div className="text-red-500">Failed: {formatDate(data.lastFailedBackup)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Next Scheduled Backup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Next Backup</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatDate(data?.nextScheduledBackup)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Automatic daily backup</div>
        </div>

        {/* Total Backups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total Backups</span>
            <HardDrive className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(data?.dailyBackupsCount || 0) + (data?.weeklyBackupsCount || 0) + (data?.monthlyBackupsCount || 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Daily: {data?.dailyBackupsCount || 0} | Weekly: {data?.weeklyBackupsCount || 0} | Monthly: {data?.monthlyBackupsCount || 0}
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Storage Used</span>
            {getConnectionStatusIcon()}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatBytes(data?.storageUsedBytes || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Est. 300 MB per year</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Run Backup Now */}
          <button
            onClick={() => setShowBackupConfirm('manual')}
            disabled={actionLoading !== null}
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {actionLoading?.startsWith('backup') ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 text-blue-600" />
            )}
            <div className="text-left">
              <div className="font-medium text-gray-900">Run Backup Now</div>
              <div className="text-xs text-gray-500">Create JSON + PDF</div>
            </div>
          </button>

          {/* Download Backup */}
          <button
            onClick={downloadBackupFiles}
            disabled={actionLoading !== null}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'download' ? (
              <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
            ) : (
              <Download className="h-5 w-5 text-gray-600" />
            )}
            <div className="text-left">
              <div className="font-medium text-gray-900">Download Backup</div>
              <div className="text-xs text-gray-500">Get JSON + PDF files</div>
            </div>
          </button>

          {/* Restore Backup */}
          <button
            onClick={() => setShowRestoreModal(true)}
            disabled={actionLoading !== null}
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            {actionLoading?.startsWith('restore') ? (
              <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 text-green-600" />
            )}
            <div className="text-left">
              <div className="font-medium text-gray-900">Restore Backup</div>
              <div className="text-xs text-gray-500">From file or Drive</div>
            </div>
          </button>

          {/* Open Folder */}
          <button
            onClick={openBackupFolder}
            disabled={actionLoading !== null || data?.connectionStatus !== 'connected'}
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <FolderOpen className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Open Folder</div>
              <div className="text-xs text-gray-500">View in Google Drive</div>
            </div>
          </button>
        </div>
      </div>

      {/* Backup Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          Automatic Backup Schedule
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Daily Backup</div>
                <div className="text-sm text-gray-500">Every 24 hours at 00:00</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Enabled</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Weekly Backup</div>
                <div className="text-sm text-gray-500">Every Sunday at 23:30 (keep 52)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Enabled</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Monthly Backup</div>
                <div className="text-sm text-gray-500">1st of each month (keep 12)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Enabled</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Backups */}
      {data?.recentBackups && data.recentBackups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Backups</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Cloud</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.recentBackups.map((backup) => (
                  <tr key={backup.id} className="border-b last:border-0">
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        backup.backup_type === 'daily' ? 'bg-blue-100 text-blue-700' :
                        backup.backup_type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                        backup.backup_type === 'monthly' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {backup.backup_type}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {backup.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : backup.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        <span className="capitalize">{backup.status}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">
                      {backup.file_size_bytes ? formatBytes(backup.file_size_bytes) : '-'}
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(backup.completed_at || backup.started_at)}
                    </td>
                    <td className="py-3">
                      {backup.json_uploaded && backup.pdf_uploaded ? (
                        <span className="text-green-600">Uploaded</span>
                      ) : (
                        <span className="text-gray-400">Local only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backup Confirmation Modal */}
      <ConfirmDialog
        isOpen={showBackupConfirm !== null}
        onClose={() => setShowBackupConfirm(null)}
        onConfirm={() => runBackup(showBackupConfirm as BackupType)}
        title="Create Backup"
        message="This will generate both JSON and PDF backup files and upload them to your connected storage provider."
        confirmText="Run Backup"
        confirmVariant="primary"
      />

      {/* Restore Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore from Backup"
      >
        <div className="space-y-6">
          {/* Restore from file */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Restore from Local File</h4>
            <label className="block">
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload JSON backup</p>
                  <p className="text-xs text-gray-400">or drag and drop</p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleRestoreFromFile(file);
                  }}
                />
              </div>
            </label>
          </div>

          {/* Restore from Drive */}
          {data?.connectionStatus === 'connected' && availableBackups.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-500" />
                Restore from Google Drive
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableBackups.map((backup) => (
                  <button
                    key={backup.id}
                    onClick={() => handleRestoreFromDrive(backup)}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="h-5 w-5 text-blue-500" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(backup.backupDate)} | {formatBytes(backup.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        backup.backupType === 'daily' ? 'bg-blue-100 text-blue-700' :
                        backup.backupType === 'weekly' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {backup.backupType}
                      </span>
                      {actionLoading === `restore-${backup.id}` && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Warning</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Restoring from backup will replace all existing data. Make sure to create a backup first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
