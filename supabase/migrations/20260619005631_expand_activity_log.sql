-- Drop existing check constraints and add new ones for expanded activity tracking
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_entity_type_check;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_action_check;

ALTER TABLE activity_log ADD CONSTRAINT activity_log_entity_type_check 
  CHECK (entity_type IN ('subject', 'module', 'topic', 'subtopic', 'note', 'question', 'resource', 'highlight', 'revision'));

ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_check 
  CHECK (action IN ('create', 'update', 'delete', 'restore', 'rename', 'move', 'solve', 'revise', 'add_note', 'add_question', 'add_resource', 'add_highlight'));

-- Create index for faster dashboard queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);