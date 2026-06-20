-- Add soft delete columns to syllabus tables
ALTER TABLE subjects ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE modules ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE topics ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE subtopics ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add indexes for soft delete queries
CREATE INDEX idx_subjects_deleted ON subjects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_modules_deleted ON modules(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_topics_deleted ON topics(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_subtopics_deleted ON subtopics(deleted_at) WHERE deleted_at IS NOT NULL;

-- Activity log table
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'module', 'topic', 'subtopic')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'rename', 'move')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for activity log
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Enable RLS on activity log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity log
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT TO anon USING (true);
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT TO anon WITH CHECK (true);