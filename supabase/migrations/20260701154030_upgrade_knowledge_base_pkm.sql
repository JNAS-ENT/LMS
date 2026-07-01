/*
# Enterprise Knowledge Base PKM Upgrade

This migration upgrades the Knowledge Base from a simple topic editor into a
complete Personal Knowledge Management (PKM) system. It preserves all existing
data and adds the missing schema required for unlimited notes, attachments,
AI history, version history, an expanded question bank, and a richer revision
manager.

## 1. topic_notes — extended for unlimited rich notes
New columns added to the existing `topic_notes` table (no existing data lost):
- `author` (text, default 'You') — who wrote the note
- `color_label` (text, default 'none') — color label for visual sorting
- `pinned` (boolean, default false) — pinned to top
- `favorite` (boolean, default false) — starred/favorited
- `archived` (boolean, default false) — archived (hidden from timeline)
- `deleted_at` (timestamptz, nullable) — soft delete timestamp

## 2. topic_questions — expanded question bank
New columns added:
- `question_type` (text, default 'Theory') — Theory | MCQ | Coding | Interview | Practice
- `explanation` (text, default '') — answer explanation
- `options` (jsonb, nullable) — MCQ options array
- `correct_option` (integer, nullable) — index of correct MCQ option

## 3. topic_revisions — richer revision manager
New columns added:
- `next_revision_date` (date, nullable) — next scheduled revision
- `interval_days` (integer, default 1) — spacing interval for spaced repetition
- `revision_number` (integer, default 0) — sequential revision count (computed)

## 4. topic_attachments — NEW table
Stores metadata for note/topic-level file attachments.
- `id`, `topic_id` (FK topics), `note_id` (FK topic_notes, nullable)
- `filename`, `file_type` (PDF/PPT/DOCX/Excel/Image/Audio/Video/ZIP)
- `file_url`, `file_size_bytes`, `mime_type`
- `display_order`, `created_at`, `updated_at`, `deleted_at`

## 5. topic_ai_history — NEW table
Records AI assistant interactions per topic.
- `id`, `topic_id` (FK topics)
- `action` (summarize | explain | interview | mcqs | flashcards | revision_notes | missing_topics | learning_path | chat)
- `prompt`, `response` (markdown)
- `created_at`

## 6. topic_note_versions — NEW table
Version history snapshots for notes (every edit creates a revision).
- `id`, `note_id` (FK topic_notes ON DELETE CASCADE)
- `title`, `content`, `category`, `tags` (snapshot)
- `version_number` (integer), `edited_by`, `created_at`

## 7. topic_bookmarks — NEW table
Per-topic bookmarked links (distinct from global bookmarks).
- `id`, `topic_id` (FK topics)
- `title`, `url`, `category` (Link | YouTube | GitHub | Documentation | Research Paper | Google Drive)
- `description`, `created_at`, `updated_at`

## 8. Data migration — preserve existing single-note data
For every topic/subtopic that has `notes_content` populated but NO existing
`topic_notes` row, insert one `topic_notes` row carrying that content so the
existing single-note data is preserved in the new multi-note world. A topic
that already has topic_notes rows is left untouched (no duplicates).

## 9. Indexes
- `topic_notes(topic_id, created_at DESC)` — timeline ordering
- `topic_notes(pinned DESC, created_at DESC)` — pinned-first display
- `topic_notes(deleted_at)` — filter soft-deleted
- `topic_attachments(topic_id)`, `topic_attachments(note_id)`
- `topic_ai_history(topic_id, created_at DESC)`
- `topic_note_versions(note_id, version_number DESC)`
- `topic_bookmarks(topic_id)`
- `topic_questions(topic_id, question_type)`

## 10. Security (RLS)
All new tables get RLS enabled with anon+authenticated CRUD policies (the app
is single-tenant, no sign-in — data is intentionally shared). Existing tables
already have RLS; new columns do not change that.
*/

-- ─── 1. Extend topic_notes ───────────────────────────────────────
ALTER TABLE topic_notes
  ADD COLUMN IF NOT EXISTS author text NOT NULL DEFAULT 'You',
  ADD COLUMN IF NOT EXISTS color_label text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ─── 2. Extend topic_questions ───────────────────────────────────
ALTER TABLE topic_questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'Theory',
  ADD COLUMN IF NOT EXISTS explanation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS options jsonb,
  ADD COLUMN IF NOT EXISTS correct_option integer;

-- ─── 3. Extend topic_revisions ───────────────────────────────────
ALTER TABLE topic_revisions
  ADD COLUMN IF NOT EXISTS next_revision_date date,
  ADD COLUMN IF NOT EXISTS interval_days integer NOT NULL DEFAULT 1;

-- ─── 4. topic_attachments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  note_id uuid REFERENCES topic_notes(id) ON DELETE SET NULL,
  filename text NOT NULL,
  file_type text NOT NULL DEFAULT 'PDF',
  file_url text NOT NULL DEFAULT '',
  file_size_bytes bigint,
  mime_type text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE topic_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_attachments" ON topic_attachments;
CREATE POLICY "anon_select_attachments" ON topic_attachments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attachments" ON topic_attachments;
CREATE POLICY "anon_insert_attachments" ON topic_attachments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attachments" ON topic_attachments;
CREATE POLICY "anon_update_attachments" ON topic_attachments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attachments" ON topic_attachments;
CREATE POLICY "anon_delete_attachments" ON topic_attachments FOR DELETE
  TO anon, authenticated USING (true);

-- ─── 5. topic_ai_history ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_ai_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT 'chat',
  prompt text NOT NULL DEFAULT '',
  response text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE topic_ai_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ai_history" ON topic_ai_history;
CREATE POLICY "anon_select_ai_history" ON topic_ai_history FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_history" ON topic_ai_history;
CREATE POLICY "anon_insert_ai_history" ON topic_ai_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_history" ON topic_ai_history;
CREATE POLICY "anon_delete_ai_history" ON topic_ai_history FOR DELETE
  TO anon, authenticated USING (true);

-- ─── 6. topic_note_versions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES topic_notes(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  tags text[] NOT NULL DEFAULT '{}',
  version_number integer NOT NULL DEFAULT 1,
  edited_by text NOT NULL DEFAULT 'You',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE topic_note_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_note_versions" ON topic_note_versions;
CREATE POLICY "anon_select_note_versions" ON topic_note_versions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_note_versions" ON topic_note_versions;
CREATE POLICY "anon_insert_note_versions" ON topic_note_versions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_note_versions" ON topic_note_versions;
CREATE POLICY "anon_delete_note_versions" ON topic_note_versions FOR DELETE
  TO anon, authenticated USING (true);

-- ─── 7. topic_bookmarks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'Link',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE topic_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_topic_bookmarks" ON topic_bookmarks;
CREATE POLICY "anon_select_topic_bookmarks" ON topic_bookmarks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_topic_bookmarks" ON topic_bookmarks;
CREATE POLICY "anon_insert_topic_bookmarks" ON topic_bookmarks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_topic_bookmarks" ON topic_bookmarks;
CREATE POLICY "anon_update_topic_bookmarks" ON topic_bookmarks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_topic_bookmarks" ON topic_bookmarks;
CREATE POLICY "anon_delete_topic_bookmarks" ON topic_bookmarks FOR DELETE
  TO anon, authenticated USING (true);

-- ─── 8. Data migration: preserve existing single-note data ───────
-- For each topic with notes_content but no topic_notes rows, create one.
INSERT INTO topic_notes (topic_id, title, content, category, display_order, author)
SELECT t.id, 'Migrated Note', t.notes_content, 'General', 0, 'You'
FROM topics t
WHERE COALESCE(t.notes_content, '') <> ''
  AND NOT EXISTS (SELECT 1 FROM topic_notes tn WHERE tn.topic_id = t.id);

-- ─── 9. Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_topic_notes_timeline ON topic_notes (topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_notes_pinned ON topic_notes (pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_notes_deleted ON topic_notes (deleted_at);
CREATE INDEX IF NOT EXISTS idx_topic_attachments_topic ON topic_attachments (topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_attachments_note ON topic_attachments (note_id);
CREATE INDEX IF NOT EXISTS idx_topic_ai_history_topic ON topic_ai_history (topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_note_versions_note ON topic_note_versions (note_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_topic_bookmarks_topic ON topic_bookmarks (topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_questions_type ON topic_questions (topic_id, question_type);
