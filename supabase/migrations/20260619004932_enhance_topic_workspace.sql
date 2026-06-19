-- Add topic_notes table for multiple notes per topic
CREATE TABLE IF NOT EXISTS topic_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE topic_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for topic_notes
CREATE POLICY "topic_notes_select" ON topic_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "topic_notes_insert" ON topic_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "topic_notes_update" ON topic_notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "topic_notes_delete" ON topic_notes FOR DELETE TO authenticated USING (true);

-- Add status column to topic_questions
ALTER TABLE topic_questions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Researching', 'Solved'));

-- Add description column to topic_resources
ALTER TABLE topic_resources ADD COLUMN IF NOT EXISTS description TEXT;

-- Drop old check constraint and add new one for resource_type
ALTER TABLE topic_resources DROP CONSTRAINT IF EXISTS topic_resources_resource_type_check;
ALTER TABLE topic_resources ADD CONSTRAINT topic_resources_resource_type_check 
  CHECK (resource_type IN ('Google Drive', 'PDF', 'YouTube', 'GitHub', 'Website', 'Dataset', 'Research Paper'));

-- Add highlight_type column to topic_highlights
ALTER TABLE topic_highlights ADD COLUMN IF NOT EXISTS highlight_type TEXT NOT NULL DEFAULT 'Key Concept' 
  CHECK (highlight_type IN ('Key Concept', 'Formula', 'Interview Question', 'Important Note'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_topic_notes_topic_id ON topic_notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_questions_status ON topic_questions(status);
CREATE INDEX IF NOT EXISTS idx_topic_highlights_type ON topic_highlights(highlight_type);