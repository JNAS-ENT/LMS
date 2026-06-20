-- Google Drive Backup System
-- Extension for enterprise backup and disaster recovery

-- Google Drive OAuth tokens (encrypted storage)
CREATE TABLE IF NOT EXISTS google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL DEFAULT 'default',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  scope TEXT,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_identifier)
);

-- Backup schedule configuration
CREATE TABLE IF NOT EXISTS backup_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly')),
  enabled BOOLEAN DEFAULT true,
  scheduled_time TEXT NOT NULL, -- HH:MM format
  scheduled_day INTEGER DEFAULT 0, -- 0=Sunday for weekly, 1=1st of month for monthly
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  retention_count INTEGER DEFAULT 52, -- Keep N backups
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Google Drive folder structure tracking
CREATE TABLE IF NOT EXISTS google_drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_type TEXT NOT NULL CHECK (folder_type IN ('root', 'daily', 'weekly', 'monthly')),
  folder_id TEXT NOT NULL, -- Google Drive folder ID
  folder_name TEXT NOT NULL,
  parent_folder_id TEXT, -- Reference to parent folder in Google Drive
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(folder_type)
);

-- Backup verification log
CREATE TABLE IF NOT EXISTS backup_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES backup_history(id),
  verified_at TIMESTAMPTZ DEFAULT now(),
  json_exists BOOLEAN DEFAULT false,
  pdf_exists BOOLEAN DEFAULT false,
  json_valid BOOLEAN DEFAULT false,
  pdf_valid BOOLEAN DEFAULT false,
  json_size_bytes BIGINT,
  pdf_size_bytes BIGINT,
  checksum_match BOOLEAN DEFAULT false,
  upload_verified BOOLEAN DEFAULT false,
  download_test BOOLEAN DEFAULT false,
  error_details JSONB DEFAULT '{}'
);

-- Add new columns to backup_history
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS backup_version TEXT DEFAULT '1.0';
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT;
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS pdf_file_id TEXT;
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS json_uploaded BOOLEAN DEFAULT false;
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS pdf_uploaded BOOLEAN DEFAULT false;

-- Add columns to storage_providers for Google Drive
ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT false;
ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';
ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS last_connection_test TIMESTAMPTZ;
ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Enable RLS on new tables
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_verification ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_drive_tokens (anon access for single-user vault)
CREATE POLICY "select_gdrive_tokens" ON google_drive_tokens FOR SELECT
  TO authenticated, anon USING (true);
CREATE POLICY "insert_gdrive_tokens" ON google_drive_tokens FOR INSERT
  TO authenticated, anon WITH CHECK (true);
CREATE POLICY "update_gdrive_tokens" ON google_drive_tokens FOR UPDATE
  TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_gdrive_tokens" ON google_drive_tokens FOR DELETE
  TO authenticated, anon USING (true);

-- RLS policies for backup_schedule
CREATE POLICY "select_backup_schedule" ON backup_schedule FOR SELECT
  TO authenticated, anon USING (true);
CREATE POLICY "insert_backup_schedule" ON backup_schedule FOR INSERT
  TO authenticated, anon WITH CHECK (true);
CREATE POLICY "update_backup_schedule" ON backup_schedule FOR UPDATE
  TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_backup_schedule" ON backup_schedule FOR DELETE
  TO authenticated, anon USING (true);

-- RLS policies for google_drive_folders
CREATE POLICY "select_gdrive_folders" ON google_drive_folders FOR SELECT
  TO authenticated, anon USING (true);
CREATE POLICY "insert_gdrive_folders" ON google_drive_folders FOR INSERT
  TO authenticated, anon WITH CHECK (true);
CREATE POLICY "update_gdrive_folders" ON google_drive_folders FOR UPDATE
  TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_gdrive_folders" ON google_drive_folders FOR DELETE
  TO authenticated, anon USING (true);

-- RLS policies for backup_verification
CREATE POLICY "select_backup_verification" ON backup_verification FOR SELECT
  TO authenticated, anon USING (true);
CREATE POLICY "insert_backup_verification" ON backup_verification FOR INSERT
  TO authenticated, anon WITH CHECK (true);
CREATE POLICY "update_backup_verification" ON backup_verification FOR UPDATE
  TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_backup_verification" ON backup_verification FOR DELETE
  TO authenticated, anon USING (true);

-- Update RLS policies for storage_providers to allow anon
DROP POLICY IF EXISTS "select_storage_providers" ON storage_providers;
DROP POLICY IF EXISTS "insert_storage_providers" ON storage_providers;
DROP POLICY IF EXISTS "update_storage_providers" ON storage_providers;
DROP POLICY IF EXISTS "delete_storage_providers" ON storage_providers;

CREATE POLICY "select_storage_providers" ON storage_providers FOR SELECT
  TO authenticated, anon USING (true);
CREATE POLICY "insert_storage_providers" ON storage_providers FOR INSERT
  TO authenticated, anon WITH CHECK (true);
CREATE POLICY "update_storage_providers" ON storage_providers FOR UPDATE
  TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_storage_providers" ON storage_providers FOR DELETE
  TO authenticated, anon USING (true);

-- Insert default backup schedule configuration
INSERT INTO backup_schedule (backup_type, scheduled_time, scheduled_day, retention_count, enabled) VALUES
  ('daily', '00:00', 0, 1, true),
  ('weekly', '23:30', 0, 52, true),
  ('monthly', '00:00', 1, 12, true)
ON CONFLICT DO NOTHING;

-- Update vault metadata
INSERT INTO vault_metadata (key, value) VALUES
  ('backup_system_version', '"1.0"'),
  ('google_drive_enabled', 'false'),
  ('last_backup_at', 'null'),
  ('backup_storage_provider', '"local"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();