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
    try {
      const { data: tokens, error } = await supabase
        .from('google_drive_tokens')
        .select('*')
        .eq('user_identifier', 'default')
        .single();

      if (error || !tokens) {
        return false;
      }

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.tokenExpiry = new Date(tokens.token_expiry);

      if (this.tokenExpiry && this.tokenExpiry <= new Date()) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          return false;
        }
      }

      await this.loadFolderStructure();
      return true;
    } catch {
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
      return false;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      await supabase
        .from('google_drive_tokens')
        .update({
          access_token: this.accessToken,
          token_expiry: this.tokenExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_identifier', 'default');

      return true;
    } catch {
      return false;
    }
  }

  private async loadFolderStructure(): Promise<void> {
    const { data: folders } = await supabase
      .from('google_drive_folders')
      .select('*');

    if (folders) {
      for (const folder of folders) {
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
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    await this.isConnected();

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
      throw new Error(`Failed to create folder: ${name}`);
    }

    const data = await response.json();
    return data.id;
  }

  async getOrCreateFolder(path: string[]): Promise<string> {
    await this.isConnected();

    let parentId: string | undefined;

    for (const folderName of path) {
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'${parentId ? ` and '${parentId}' in parents` : ''} and trashed=false`;

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search for folder');
      }

      const data = await response.json();

      if (data.files && data.files.length > 0) {
        parentId = data.files[0].id;
      } else {
        parentId = await this.createFolder(folderName, parentId);
      }
    }

    return parentId!;
  }

  async uploadFile(
    fileName: string,
    content: string | ArrayBuffer,
    mimeType: string,
    folderId?: string
  ): Promise<UploadResult> {
    try {
      await this.isConnected();

      const metadata: Record<string, unknown> = {
        name: fileName,
        mimeType
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

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
        return {
          success: false,
          error: `Upload failed: ${errorText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        fileId: data.id,
        fileName: data.name,
        webViewLink: data.webViewLink
      };
    } catch (err) {
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

  async initializeFolderStructure(): Promise<boolean> {
    try {
      await this.isConnected();

      this.rootFolderId = await this.getOrCreateFolder(['Learning Vault Backups']);
      this.dailyFolderId = await this.getOrCreateFolder(['Learning Vault Backups', 'Daily']);
      this.weeklyFolderId = await this.getOrCreateFolder(['Learning Vault Backups', 'Weekly']);
      this.monthlyFolderId = await this.getOrCreateFolder(['Learning Vault Backups', 'Monthly']);

      await supabase.from('google_drive_folders').upsert([
        { folder_type: 'root', folder_id: this.rootFolderId, folder_name: 'Learning Vault Backups' },
        { folder_type: 'daily', folder_id: this.dailyFolderId, folder_name: 'Daily', parent_folder_id: this.rootFolderId },
        { folder_type: 'weekly', folder_id: this.weeklyFolderId, folder_name: 'Weekly', parent_folder_id: this.rootFolderId },
        { folder_type: 'monthly', folder_id: this.monthlyFolderId, folder_name: 'Monthly', parent_folder_id: this.rootFolderId }
      ], { onConflict: 'folder_type' });

      return true;
    } catch {
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
