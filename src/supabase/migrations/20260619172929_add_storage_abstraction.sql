-- Storage abstraction layer for portability
-- Allows resources to reference storage providers (local, cloud, NAS, etc.)

CREATE TABLE IF NOT EXISTS storage_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('local', 'supabase', 's3', 'gcs', 'azure', 'dropbox', 'google_drive', 'onedrive', 'nas', 'webdav', 'other')),
  base_path TEXT,
  external_url_base TEXT,
  credentials_ref TEXT,
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vault metadata for backup tracking and versioning
CREATE TABLE IF NOT EXISTS vault_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Backup history tracking
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'daily', 'weekly', 'monthly')),
  format TEXT NOT NULL DEFAULT 'json',
  file_size_bytes BIGINT,
  entity_counts JSONB DEFAULT '{}',
  storage_provider_id UUID REFERENCES storage_providers(id),
  storage_path TEXT,
  checksum_sha256 TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT
);

-- Add storage provider reference to resources
ALTER TABLE topic_resources ADD COLUMN IF NOT EXISTS storage_provider_id UUID REFERENCES storage_providers(id);
ALTER TABLE topic_resources ADD COLUMN IF NOT EXISTS relative_path TEXT;
ALTER TABLE topic_resources ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Add content_hash to other tables for integrity checking
ALTER TABLE topic_notes ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE topic_code ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Enable RLS on new tables
ALTER TABLE storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for storage_providers
CREATE POLICY "select_storage_providers" ON storage_providers FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_storage_providers" ON storage_providers FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_storage_providers" ON storage_providers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_storage_providers" ON storage_providers FOR DELETE
  TO authenticated USING (true);

-- RLS policies for vault_metadata
CREATE POLICY "select_vault_metadata" ON vault_metadata FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_vault_metadata" ON vault_metadata FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_vault_metadata" ON vault_metadata FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_vault_metadata" ON vault_metadata FOR DELETE
  TO authenticated USING (true);

-- RLS policies for backup_history
CREATE POLICY "select_backup_history" ON backup_history FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_backup_history" ON backup_history FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_backup_history" ON backup_history FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_backup_history" ON backup_history FOR DELETE
  TO authenticated USING (true);

-- Insert default storage provider (Supabase built-in)
INSERT INTO storage_providers (name, provider_type, is_default, settings)
VALUES ('Default Supabase Storage', 'supabase', true, '{"description": "Built-in Supabase storage"}')
ON CONFLICT DO NOTHING;

-- Insert vault version metadata
INSERT INTO vault_metadata (key, value)
VALUES ('vault_version', '"2.0"'), ('schema_version', '"1.3"'), ('created_at', to_jsonb(now()))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();