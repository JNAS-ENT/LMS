/*
# Fix topic_notes to support both Topics and Subtopics

## Problem
The `topic_notes` table's `topic_id` column only references the `topics` table.
When viewing a Subtopic in the KnowledgeBase, the code passes the subtopic ID,
which fails the foreign key check because the ID doesn't exist in `topics`.

## Solution
1. Make `topic_id` nullable (for subtopic notes)
2. Add `subtopic_id` column (nullable, for subtopic notes)
3. Add foreign key to `subtopics` table
4. Add CHECK constraint ensuring exactly one of topic_id or subtopic_id is set
5. Create a partial unique index to enforce the constraint
6. Migrate existing data properly

## Changes
- ALTER `topic_notes` to add `subtopic_id` column
- Add foreign key constraint for `subtopic_id`
- Add validation constraint
- Update vault service to use correct column based on node type
*/

-- Step 1: Make topic_id nullable (for subtopic notes)
ALTER TABLE topic_notes ALTER COLUMN topic_id DROP NOT NULL;

-- Step 2: Add subtopic_id column
ALTER TABLE topic_notes ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE;

-- Step 3: Add CHECK constraint ensuring exactly one parent is set
ALTER TABLE topic_notes ADD CONSTRAINT topic_notes_single_parent_check 
  CHECK (
    (topic_id IS NOT NULL AND subtopic_id IS NULL) OR 
    (topic_id IS NULL AND subtopic_id IS NOT NULL)
  );

-- Step 4: Create index for subtopic lookups
CREATE INDEX IF NOT EXISTS idx_topic_notes_subtopic_id ON topic_notes(subtopic_id) WHERE subtopic_id IS NOT NULL;

-- Note: Existing notes will have topic_id set, so they will continue to work.
-- New notes for subtopics will have subtopic_id set instead.