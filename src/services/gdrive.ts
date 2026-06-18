// Google Drive integration placeholder
// Modular service layer for future GDrive integration

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
}

export const googleDriveService = {
  uploadFile: async (_file: File, _parentId?: string): Promise<DriveUploadResult> => {
    throw new Error('Google Drive not configured. Set up OAuth credentials in settings.');
  },

  listFiles: async (_query?: string): Promise<DriveFile[]> => {
    throw new Error('Google Drive not configured. Set up OAuth credentials in settings.');
  },

  getFile: async (_fileId: string): Promise<DriveFile> => {
    throw new Error('Google Drive not configured. Set up OAuth credentials in settings.');
  },

  viewPdf: async (_fileId: string): Promise<string> => {
    throw new Error('Google Drive not configured. Set up OAuth credentials in settings.');
  },

  syncDocuments: async (): Promise<{ synced: number; errors: number }> => {
    throw new Error('Google Drive not configured. Set up OAuth credentials in settings.');
  },

  isAuthenticated: (): boolean => {
    return false;
  },
};
