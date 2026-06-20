// Storage Provider Abstraction Layer
// Provider-based architecture for multi-cloud storage support

import { supabase } from '../lib/supabase';

// ─── Provider Interface ─────────────────────────────────────

export interface BackupFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  downloadUrl: string;
  webViewLink?: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webViewLink?: string;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastTested: string | null;
  error: string | null;
}

export interface StorageProviderConfig {
  id?: string;
  name: string;
  providerType: StorageProviderType;
  isEnabled: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
}

export type StorageProviderType =
  | 'google_drive'
  | 'onedrive'
  | 'dropbox'
  | 'nas'
  | 'local'
  | 'supabase'
  | 's3'
  | 'gcs'
  | 'azure';

// ─── Abstract Storage Provider ─────────────────────────────────

export abstract class BaseStorageProvider {
  abstract name: string;
  abstract type: StorageProviderType;
  abstract config: StorageProviderConfig;

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<ConnectionStatus>;
  abstract isConnected(): Promise<boolean>;

  abstract createFolder(name: string, parentId?: string): Promise<string>;
  abstract getOrCreateFolder(path: string[]): Promise<string>;

  abstract uploadFile(
    fileName: string,
    content: string | ArrayBuffer,
    mimeType: string,
    folderId?: string
  ): Promise<UploadResult>;

  abstract downloadFile(fileId: string): Promise<ArrayBuffer>;
  abstract listFiles(folderId: string): Promise<BackupFile[]>;
  abstract deleteFile(fileId: string): Promise<boolean>;
  abstract getFile(fileId: string): Promise<BackupFile>;

  abstract getStorageUsed(): Promise<number>;
}

// ─── Google Drive Provider Implementation ─────────────────────────

export class GoogleDriveProvider extends BaseStorageProvider {
  name = 'Google Drive';
  type: StorageProviderType = 'google_drive';
  config: StorageProviderConfig;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  // Google Drive folder IDs
  private rootFolderId: string | null = null;
  private dailyFolderId: string | null = null;
  private weeklyFolderId: string | null = null;
  private monthlyFolderId: string | null = null;

  constructor(config: StorageProviderConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<boolean> {
    console.log('[GDRIVE] connect: Starting connection...');
    try {
      const { data: tokens, error } = await supabase
        .from('google_drive_tokens')
        .select('*')
        .eq('user_identifier', 'default')
        .single();

      if (error || !tokens) {
        console.error('[GDRIVE] connect: No tokens found', error);
        return false;
      }

      console.log('[GDRIVE] connect: Tokens loaded, token expiry:', tokens.token_expiry);
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.tokenExpiry = new Date(tokens.token_expiry);

      if (this.tokenExpiry && this.tokenExpiry <= new Date()) {
        console.log('[GDRIVE] connect: Token expired, refreshing...');
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          console.error('[GDRIVE] connect: Failed to refresh token');
          return false;
        }
      }

      await this.loadFolderStructure();
      console.log('[GDRIVE] connect: Folder structure loaded. Root:', this.rootFolderId);

      // Initialize folder structure if not exists
      if (!this.rootFolderId) {
        console.log('[GDRIVE] connect: No root folder, initializing...');
        const initialized = await this.initializeFolderStructure();
        if (!initialized) {
          console.error('[GDRIVE] connect: Failed to initialize folder structure');
          return false;
        }
        console.log('[GDRIVE] connect: Folder structure initialized');
      }

      return true;
    } catch (err) {
      console.error('[GDRIVE] connect: Exception', err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await supabase
      .from('google_drive_tokens')
      .delete()
      .eq('user_identifier', 'default');

    await supabase
      .from('google_drive_folders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.rootFolderId = null;
    this.dailyFolderId = null;
    this.weeklyFolderId = null;
    this.monthlyFolderId = null;
  }

  async testConnection(): Promise<ConnectionStatus> {
    try {
      const connected = await this.connect();
      if (!connected) {
        return {
          connected: false,
          lastTested: new Date().toISOString(),
          error: 'Failed to connect to Google Drive'
        };
      }

      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        return {
          connected: false,
          lastTested: new Date().toISOString(),
          error: 'Invalid access token'
        };
      }

      return {
        connected: true,
        lastTested: new Date().toISOString(),
        error: null
      };
    } catch (err) {
      return {
        connected: false,
        lastTested: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Connection test failed'
      };
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.accessToken) {
      return await this.connect();
    }

    if (this.tokenExpiry && this.tokenExpiry <= new Date()) {
      return await this.refreshAccessToken();
    }

    return true;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.error('[GDRIVE] refreshAccessToken: No refresh token available');
      return false;
    }

    console.log('[GDRIVE] refreshAccessToken: Refreshing token...');

    try {
      // Use Edge Function to refresh token (keeps client secret secure)
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-drive-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'refresh_token',
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        console.error('[GDRIVE] refreshAccessToken: Edge function failed', await response.text());
        return false;
      }

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
        console.log('[GDRIVE] refreshAccessToken: Token refreshed successfully');
        return true;
      }

      console.error('[GDRIVE] refreshAccessToken: No access token in response');
      return false;
    } catch (err) {
      console.error('[GDRIVE] refreshAccessToken: Error', err);
      return false;
    }
  }

  private async loadFolderStructure(): Promise<void> {
    console.log('[GDRIVE] loadFolderStructure: Loading...');
    const { data: folders, error } = await supabase
      .from('google_drive_folders')
      .select('*');

    if (error) {
      console.error('[GDRIVE] loadFolderStructure: Error loading folders', error);
      return;
    }

    if (folders) {
      for (const folder of folders) {
        console.log(`[GDRIVE] loadFolderStructure: Found folder ${folder.folder_type} = ${folder.folder_id}`);
        switch (folder.folder_type) {
          case 'root':
            this.rootFolderId = folder.folder_id;
            break;
          case 'daily':
            this.dailyFolderId = folder.folder_id;
            break;
          case 'weekly':
            this.weeklyFolderId = folder.folder_id;
            break;
          case 'monthly':
            this.monthlyFolderId = folder.folder_id;
            break;
        }
      }
    }
    console.log('[GDRIVE] loadFolderStructure: Loaded. Root:', this.rootFolderId, 'Daily:', this.dailyFolderId);
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    await this.isConnected();
    console.log(`[GDRIVE] createFolder: Creating "${name}" with parent:`, parentId || 'root');

    const body: Record<string, unknown> = {
      name,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentId) {
      body.parents = [parentId];
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GDRIVE] createFolder: Failed to create folder "${name}":`, errorText);
      throw new Error(`Failed to create folder: ${name} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[GDRIVE] createFolder: Created folder "${name}" with ID:`, data.id);
    return data.id;
  }

  async getOrCreateFolder(path: string[]): Promise<string> {
    await this.isConnected();
    console.log(`[GDRIVE] getOrCreateFolder: Path:`, path);

    let parentId: string | undefined;

    for (const folderName of path) {
      // Build query - if no parent, search in root (no parent filter)
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      console.log(`[GDRIVE] getOrCreateFolder: Searching for "${folderName}" with query:`, query);

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GDRIVE] getOrCreateFolder: Search failed:`, errorText);
        throw new Error(`Failed to search for folder: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[GDRIVE] getOrCreateFolder: Search result:`, data.files?.length || 0, 'folders found');

      if (data.files && data.files.length > 0) {
        parentId = data.files[0].id;
        console.log(`[GDRIVE] getOrCreateFolder: Found existing folder "${folderName}" with ID:`, parentId);
      } else {
        parentId = await this.createFolder(folderName, parentId);
      }
    }

    console.log(`[GDRIVE] getOrCreateFolder: Final folder ID:`, parentId);
    return parentId!;
  }

  async uploadFile(
    fileName: string,
    content: string | ArrayBuffer,
    mimeType: string,
    folderId?: string
  ): Promise<UploadResult> {
    console.log(`[GDRIVE] uploadFile: Starting upload of "${fileName}" (${mimeType}) to folder:`, folderId || 'root');
    try {
      await this.isConnected();

      const metadata: Record<string, unknown> = {
        name: fileName,
        mimeType
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

      const contentSize = typeof content === 'string' ? content.length : content.byteLength;
      console.log(`[GDRIVE] uploadFile: Content size:`, contentSize, 'bytes');

      const boundary = 'learning_vault_boundary_' + Math.random().toString(36).substring(2);
      let requestBody = '';

      requestBody += `--${boundary}\r\n`;
      requestBody += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
      requestBody += JSON.stringify(metadata) + '\r\n';

      requestBody += `--${boundary}\r\n`;
      requestBody += `Content-Type: ${mimeType}\r\n\r\n`;

      if (typeof content === 'string') {
        requestBody += content;
      } else {
        const decoder = new TextDecoder();
        requestBody += decoder.decode(content);
      }

      requestBody += `\r\n--${boundary}--`;

      console.log(`[GDRIVE] uploadFile: Sending multipart request...`);
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GDRIVE] uploadFile: Upload failed for "${fileName}":`, errorText);
        return {
          success: false,
          error: `Upload failed (${response.status}): ${errorText}`
        };
      }

      const data = await response.json();
      console.log(`[GDRIVE] uploadFile: Upload successful. File ID:`, data.id);
      return {
        success: true,
        fileId: data.id,
        fileName: data.name,
        webViewLink: data.webViewLink
      };
    } catch (err) {
      console.error(`[GDRIVE] uploadFile: Exception during upload:`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed'
      };
    }
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    await this.isConnected();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.arrayBuffer();
  }

  async listFiles(folderId: string): Promise<BackupFile[]> {
    await this.isConnected();

    const query = `'${folderId}' in parents and trashed=false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    const data = await response.json();
    return (data.files || []).map((file: Record<string, unknown>) => ({
      id: file.id as string,
      name: file.name as string,
      mimeType: file.mimeType as string,
      size: file.size as number || 0,
      createdTime: file.createdTime as string,
      modifiedTime: file.modifiedTime as string,
      downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      webViewLink: file.webViewLink as string
    }));
  }

  async deleteFile(fileId: string): Promise<boolean> {
    await this.isConnected();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    return response.ok || response.status === 204;
  }

  async getFile(fileId: string): Promise<BackupFile> {
    await this.isConnected();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get file');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      size: data.size || 0,
      createdTime: data.createdTime,
      modifiedTime: data.modifiedTime,
      downloadUrl: `https://www.googleapis.com/drive/v3/files/${data.id}?alt=media`,
      webViewLink: data.webViewLink
    };
  }

  async getStorageUsed(): Promise<number> {
    await this.isConnected();

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.storageQuota?.usageInDrive || 0;
  }

  getFolderId(type: 'root' | 'daily' | 'weekly' | 'monthly'): string | null {
    switch (type) {
      case 'root': return this.rootFolderId;
      case 'daily': return this.dailyFolderId;
      case 'weekly': return this.weeklyFolderId;
      case 'monthly': return this.monthlyFolderId;
    }
  }

  getFolderUrl(type: 'root' | 'daily' | 'weekly' | 'monthly' = 'root'): string | null {
    const folderId = this.getFolderId(type);
    if (!folderId) {
      console.log(`[GDRIVE] getFolderUrl: No folder ID for type ${type}`);
      return null;
    }
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  async initializeFolderStructure(): Promise<boolean> {
    console.log('[GDRIVE] initializeFolderStructure: Starting...');
    try {
      await this.isConnected();

      console.log('[GDRIVE] initializeFolderStructure: Creating root folder...');
      this.rootFolderId = await this.getOrCreateFolder(['Learning Vault Backups']);
      console.log('[GDRIVE] initializeFolderStructure: Root folder ID:', this.rootFolderId);

      console.log('[GDRIVE] initializeFolderStructure: Creating Daily folder...');
      this.dailyFolderId = await this.getOrCreateFolder(['Learning Vault Backups', 'Daily']);
      console.log('[GDRIVE] initializeFolderStructure: Daily folder ID:', this.dailyFolderId);

      console.log('[GDRIVE] initializeFolderStructure: Creating Weekly folder...');
      this.weeklyFolderId = await this.getOrCreateFolder(['Learning Vault Backups', 'Weekly']);
      console.log('[GDRIVE] initializeFolderStructure: Weekly folder ID:', this.weeklyFolderId);

      console.log('[GDRIVE] initializeFolderStructure: Creating Monthly folder...');
      this.monthlyFolderId = await this.getOrCreateFolder(['Learning Vault Backups', 'Monthly']);
      console.log('[GDRIVE] initializeFolderStructure: Monthly folder ID:', this.monthlyFolderId);

      // Store folder IDs in database
      console.log('[GDRIVE] initializeFolderStructure: Storing folder IDs in database...');
      const { error: upsertError } = await supabase.from('google_drive_folders').upsert([
        { folder_type: 'root', folder_id: this.rootFolderId, folder_name: 'Learning Vault Backups' },
        { folder_type: 'daily', folder_id: this.dailyFolderId, folder_name: 'Daily', parent_folder_id: this.rootFolderId },
        { folder_type: 'weekly', folder_id: this.weeklyFolderId, folder_name: 'Weekly', parent_folder_id: this.rootFolderId },
        { folder_type: 'monthly', folder_id: this.monthlyFolderId, folder_name: 'Monthly', parent_folder_id: this.rootFolderId }
      ], { onConflict: 'folder_type' });

      if (upsertError) {
        console.error('[GDRIVE] initializeFolderStructure: Failed to store folder IDs:', upsertError);
        return false;
      }

      console.log('[GDRIVE] initializeFolderStructure: Complete!');
      return true;
    } catch (err) {
      console.error('[GDRIVE] initializeFolderStructure: Exception:', err);
      return false;
    }
  }
}

// ─── Storage Provider Factory ─────────────────────────────────

let currentProvider: BaseStorageProvider | null = null;

export async function getStorageProvider(): Promise<BaseStorageProvider | null> {
  if (currentProvider) {
    return currentProvider;
  }

  const { data: provider } = await supabase
    .from('storage_providers')
    .select('*')
    .eq('is_connected', true)
    .single();

  if (!provider) {
    return null;
  }

  currentProvider = createProvider(provider.provider_type, {
    id: provider.id,
    name: provider.name,
    providerType: provider.provider_type,
    isEnabled: provider.is_default,
    settings: provider.settings
  });

  return currentProvider;
}

export function createProvider(
  type: StorageProviderType,
  config: StorageProviderConfig
): BaseStorageProvider {
  switch (type) {
    case 'google_drive':
      return new GoogleDriveProvider(config);
    case 'onedrive':
    case 'dropbox':
    case 'nas':
    case 'local':
    case 'supabase':
    case 's3':
    case 'gcs':
    case 'azure':
      throw new Error(`Provider type "${type}" not yet implemented`);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

export function setCurrentProvider(provider: BaseStorageProvider): void {
  currentProvider = provider;
}

export function clearCurrentProvider(): void {
  currentProvider = null;
}
