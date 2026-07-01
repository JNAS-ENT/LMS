/*
# JNAS LMS - Workspaces and Notebooks Schema

## Overview
Creates the core tables for JNAS LMS - a personal learning workspace system.
Each workspace belongs to a user and contains notebooks, videos, documents, etc.
Uses unique table names to avoid conflicts with existing schema.

## New Tables

### 1. workspaces
- Main learning workspace container (renamed from 'topics' to avoid conflict)
- Owner-scoped with user_id defaulting to auth.uid()
- Contains title, description, color for organization

### 2. workspace_notebooks  
- Notes within each workspace
- Supports title, content, tags, importance
- Soft delete with deleted_at
- Version tracking via workspace_notebook_versions

### 3. workspace_notebook_versions
- Stores version history for notebooks
- Enables rollback to previous versions

### 4. workspace_videos
- YouTube video learning content
- Stores transcript, AI summary, key points, chapters, flashcards, etc.

### 5. workspace_documents
- Uploaded documents (PDF, DOCX, etc.)
- Stores file metadata, summary, highlights, keywords

### 6. workspace_captures
- Quick capture for ideas, URLs, code, images
- Can be linked to workspace or standalone

### 7. workspace_history
- Learning activity tracking
- Records notes created, videos added, etc.

### 8. workspace_tasks
- Tasks within workspaces
- Status: pending, in_progress, completed

### 9. workspace_ai_outputs
- AI transformation results
- Can be saved as notebooks

## Security
- RLS enabled on all tables
- Owner-scoped policies (auth.uid() = user_id)
- Child tables scope through parent ownership check
*/

-- Create workspaces table (main topic/workspace container)
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'blue',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_notebooks table
CREATE TABLE IF NOT EXISTS workspace_notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  tags text[] DEFAULT '{}',
  importance int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create workspace_notebook_versions table
CREATE TABLE IF NOT EXISTS workspace_notebook_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES workspace_notebooks(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  version_number int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create workspace_videos table
CREATE TABLE IF NOT EXISTS workspace_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url text NOT NULL,
  video_id text NOT NULL,
  title text,
  thumbnail_url text,
  duration int,
  transcript text,
  ai_summary text,
  key_points jsonb,
  chapters jsonb,
  quotes jsonb,
  questions jsonb,
  flashcards jsonb,
  action_items jsonb,
  learning_notes text,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_documents table
CREATE TABLE IF NOT EXISTS workspace_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_path text NOT NULL,
  file_size int NOT NULL,
  metadata jsonb,
  summary text,
  highlights text,
  keywords text[],
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_captures table
CREATE TABLE IF NOT EXISTS workspace_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  capture_type text NOT NULL CHECK (capture_type IN ('text', 'url', 'code', 'image')),
  content text NOT NULL,
  metadata jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create workspace_history table
CREATE TABLE IF NOT EXISTS workspace_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  related_id uuid,
  duration_seconds int,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create workspace_tasks table
CREATE TABLE IF NOT EXISTS workspace_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_ai_outputs table
CREATE TABLE IF NOT EXISTS workspace_ai_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  input_text text NOT NULL,
  transformation_type text NOT NULL,
  output_text text NOT NULL,
  model_used text,
  saved_as_notebook_id uuid REFERENCES workspace_notebooks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_notebook_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_ai_outputs ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
DROP POLICY IF EXISTS "select_own_workspaces" ON workspaces;
CREATE POLICY "select_own_workspaces" ON workspaces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workspaces" ON workspaces;
CREATE POLICY "insert_own_workspaces" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workspaces" ON workspaces;
CREATE POLICY "update_own_workspaces" ON workspaces FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workspaces" ON workspaces;
CREATE POLICY "delete_own_workspaces" ON workspaces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Workspace_notebooks policies (scoped through workspaces)
DROP POLICY IF EXISTS "select_own_notebooks" ON workspace_notebooks;
CREATE POLICY "select_own_notebooks" ON workspace_notebooks FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_notebooks.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_notebooks" ON workspace_notebooks;
CREATE POLICY "insert_own_notebooks" ON workspace_notebooks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_notebooks.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_notebooks" ON workspace_notebooks;
CREATE POLICY "update_own_notebooks" ON workspace_notebooks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_notebooks.workspace_id AND workspaces.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_notebooks.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_notebooks" ON workspace_notebooks;
CREATE POLICY "delete_own_notebooks" ON workspace_notebooks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_notebooks.workspace_id AND workspaces.user_id = auth.uid())
  );

-- Workspace_notebook_versions policies (scoped through notebooks)
DROP POLICY IF EXISTS "select_own_notebook_versions" ON workspace_notebook_versions;
CREATE POLICY "select_own_notebook_versions" ON workspace_notebook_versions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workspace_notebooks
      JOIN workspaces ON workspaces.id = workspace_notebooks.workspace_id
      WHERE workspace_notebooks.id = workspace_notebook_versions.notebook_id AND workspaces.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_notebook_versions" ON workspace_notebook_versions;
CREATE POLICY "insert_own_notebook_versions" ON workspace_notebook_versions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_notebooks
      JOIN workspaces ON workspaces.id = workspace_notebooks.workspace_id
      WHERE workspace_notebooks.id = workspace_notebook_versions.notebook_id AND workspaces.user_id = auth.uid()
    )
  );

-- Workspace_videos policies (scoped through workspaces)
DROP POLICY IF EXISTS "select_own_videos" ON workspace_videos;
CREATE POLICY "select_own_videos" ON workspace_videos FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_videos.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_videos" ON workspace_videos;
CREATE POLICY "insert_own_videos" ON workspace_videos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_videos.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_videos" ON workspace_videos;
CREATE POLICY "update_own_videos" ON workspace_videos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_videos.workspace_id AND workspaces.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_videos.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_videos" ON workspace_videos;
CREATE POLICY "delete_own_videos" ON workspace_videos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_videos.workspace_id AND workspaces.user_id = auth.uid())
  );

-- Workspace_documents policies
DROP POLICY IF EXISTS "select_own_documents" ON workspace_documents;
CREATE POLICY "select_own_documents" ON workspace_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_documents.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_documents" ON workspace_documents;
CREATE POLICY "insert_own_documents" ON workspace_documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_documents.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_documents" ON workspace_documents;
CREATE POLICY "update_own_documents" ON workspace_documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_documents.workspace_id AND workspaces.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_documents.workspace_id AND workspaces.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_documents" ON workspace_documents;
CREATE POLICY "delete_own_documents" ON workspace_documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_documents.workspace_id AND workspaces.user_id = auth.uid())
  );

-- Workspace_captures policies
DROP POLICY IF EXISTS "select_own_captures" ON workspace_captures;
CREATE POLICY "select_own_captures" ON workspace_captures FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_captures" ON workspace_captures;
CREATE POLICY "insert_own_captures" ON workspace_captures FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_captures" ON workspace_captures;
CREATE POLICY "update_own_captures" ON workspace_captures FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_captures" ON workspace_captures;
CREATE POLICY "delete_own_captures" ON workspace_captures FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Workspace_history policies
DROP POLICY IF EXISTS "select_own_history" ON workspace_history;
CREATE POLICY "select_own_history" ON workspace_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_history" ON workspace_history;
CREATE POLICY "insert_own_history" ON workspace_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Workspace_tasks policies
DROP POLICY IF EXISTS "select_own_tasks" ON workspace_tasks;
CREATE POLICY "select_own_tasks" ON workspace_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON workspace_tasks;
CREATE POLICY "insert_own_tasks" ON workspace_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON workspace_tasks;
CREATE POLICY "update_own_tasks" ON workspace_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON workspace_tasks;
CREATE POLICY "delete_own_tasks" ON workspace_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Workspace_ai_outputs policies
DROP POLICY IF EXISTS "select_own_ai_outputs" ON workspace_ai_outputs;
CREATE POLICY "select_own_ai_outputs" ON workspace_ai_outputs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_outputs" ON workspace_ai_outputs;
CREATE POLICY "insert_own_ai_outputs" ON workspace_ai_outputs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_outputs" ON workspace_ai_outputs;
CREATE POLICY "delete_own_ai_outputs" ON workspace_ai_outputs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notebooks_workspace_id ON workspace_notebooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_created_at ON workspace_notebooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notebooks_deleted_at ON workspace_notebooks(deleted_at);

CREATE INDEX IF NOT EXISTS idx_notebook_versions_notebook_id ON workspace_notebook_versions(notebook_id);

CREATE INDEX IF NOT EXISTS idx_videos_workspace_id ON workspace_videos(workspace_id);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON workspace_documents(workspace_id);

CREATE INDEX IF NOT EXISTS idx_captures_user_id ON workspace_captures(user_id);

CREATE INDEX IF NOT EXISTS idx_history_user_id ON workspace_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON workspace_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON workspace_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON workspace_tasks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON workspace_ai_outputs(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_workspaces_at ON workspaces;
CREATE TRIGGER update_workspaces_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();

DROP TRIGGER IF EXISTS update_notebooks_at ON workspace_notebooks;
CREATE TRIGGER update_notebooks_at
  BEFORE UPDATE ON workspace_notebooks
  FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();

DROP TRIGGER IF EXISTS update_videos_at ON workspace_videos;
CREATE TRIGGER update_videos_at
  BEFORE UPDATE ON workspace_videos
  FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();

DROP TRIGGER IF EXISTS update_documents_at ON workspace_documents;
CREATE TRIGGER update_documents_at
  BEFORE UPDATE ON workspace_documents
  FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();

DROP TRIGGER IF EXISTS update_tasks_at ON workspace_tasks;
CREATE TRIGGER update_tasks_at
  BEFORE UPDATE ON workspace_tasks
  FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();