-- Add status and progress columns to topics table
ALTER TABLE topics ADD COLUMN status TEXT NOT NULL DEFAULT 'Not Started';
ALTER TABLE topics ADD COLUMN progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE topics ADD COLUMN notes_content TEXT DEFAULT '';

-- Add status and progress columns to subtopics table
ALTER TABLE subtopics ADD COLUMN status TEXT NOT NULL DEFAULT 'Not Started';
ALTER TABLE subtopics ADD COLUMN progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE subtopics ADD COLUMN notes_content TEXT DEFAULT '';

-- Topic questions table
CREATE TABLE topic_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Topic resources table
CREATE TABLE topic_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'URL' CHECK (resource_type IN ('PDF', 'URL', 'YouTube', 'GitHub')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Topic revisions table
CREATE TABLE topic_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  revision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  revision_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE topic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_revisions ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables (anon access)
CREATE POLICY "topic_questions_select" ON topic_questions FOR SELECT TO anon USING (true);
CREATE POLICY "topic_questions_insert" ON topic_questions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "topic_questions_update" ON topic_questions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "topic_questions_delete" ON topic_questions FOR DELETE TO anon USING (true);

CREATE POLICY "topic_resources_select" ON topic_resources FOR SELECT TO anon USING (true);
CREATE POLICY "topic_resources_insert" ON topic_resources FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "topic_resources_update" ON topic_resources FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "topic_resources_delete" ON topic_resources FOR DELETE TO anon USING (true);

CREATE POLICY "topic_revisions_select" ON topic_revisions FOR SELECT TO anon USING (true);
CREATE POLICY "topic_revisions_insert" ON topic_revisions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "topic_revisions_update" ON topic_revisions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "topic_revisions_delete" ON topic_revisions FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX idx_topic_questions_topic ON topic_questions(topic_id);
CREATE INDEX idx_topic_resources_topic ON topic_resources(topic_id);
CREATE INDEX idx_topic_revisions_topic ON topic_revisions(topic_id);
CREATE INDEX idx_topic_revisions_date ON topic_revisions(revision_date);
