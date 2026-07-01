/*
# Fix all topic_* tables to support subtopics

## Problem
All topic_* tables (questions, resources, revisions, attachments, bookmarks, 
code, highlights, ai_history) only have FK to `topics` table.
When editing a Subtopic, saves fail because the ID doesn't exist in `topics`.

## Solution
For each table:
1. Make topic_id nullable
2. Add subtopic_id column with FK to subtopics
3. Add CHECK constraint ensuring exactly one parent is set
4. Create index for subtopic lookups

## Tables Fixed
- topic_questions
- topic_resources
- topic_revisions
- topic_attachments
- topic_bookmarks
- topic_code
- topic_highlights
- topic_ai_history

*/

-- Fix topic_questions
ALTER TABLE topic_questions ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_questions ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_questions ADD CONSTRAINT topic_questions_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_questions_subtopic_id ON topic_questions(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_resources
ALTER TABLE topic_resources ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_resources ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_resources ADD CONSTRAINT topic_resources_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_resources_subtopic_id ON topic_resources(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_revisions
ALTER TABLE topic_revisions ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_revisions ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_revisions ADD CONSTRAINT topic_revisions_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_revisions_subtopic_id ON topic_revisions(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_attachments
ALTER TABLE topic_attachments ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_attachments ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_attachments ADD CONSTRAINT topic_attachments_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_attachments_subtopic_id ON topic_attachments(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_bookmarks
ALTER TABLE topic_bookmarks ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_bookmarks ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_bookmarks ADD CONSTRAINT topic_bookmarks_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_bookmarks_subtopic_id ON topic_bookmarks(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_code
ALTER TABLE topic_code ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_code ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_code ADD CONSTRAINT topic_code_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_code_subtopic_id ON topic_code(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_highlights
ALTER TABLE topic_highlights ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_highlights ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_highlights ADD CONSTRAINT topic_highlights_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_highlights_subtopic_id ON topic_highlights(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Fix topic_ai_history
ALTER TABLE topic_ai_history ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE topic_ai_history ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;
ALTER TABLE topic_ai_history ADD CONSTRAINT topic_ai_history_single_parent_check 
  CHECK ((topic_id IS NOT NULL AND subtopic_id IS NULL) OR (topic_id IS NULL AND subtopic_id IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_topic_ai_history_subtopic_id ON topic_ai_history(subtopic_id) WHERE subtopic_id IS NOT NULL;