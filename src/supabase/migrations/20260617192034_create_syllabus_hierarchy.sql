-- Subjects (top level)
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Modules (children of subjects)
CREATE TABLE modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Topics (children of modules)
CREATE TABLE topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subtopics (children of topics)
CREATE TABLE subtopics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;

-- RLS policies (anon access for single-user system)
CREATE POLICY "subjects_select" ON subjects FOR SELECT TO anon USING (true);
CREATE POLICY "subjects_insert" ON subjects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "subjects_update" ON subjects FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "subjects_delete" ON subjects FOR DELETE TO anon USING (true);

CREATE POLICY "modules_select" ON modules FOR SELECT TO anon USING (true);
CREATE POLICY "modules_insert" ON modules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "modules_update" ON modules FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "modules_delete" ON modules FOR DELETE TO anon USING (true);

CREATE POLICY "topics_select" ON topics FOR SELECT TO anon USING (true);
CREATE POLICY "topics_insert" ON topics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "topics_update" ON topics FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "topics_delete" ON topics FOR DELETE TO anon USING (true);

CREATE POLICY "subtopics_select" ON subtopics FOR SELECT TO anon USING (true);
CREATE POLICY "subtopics_insert" ON subtopics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "subtopics_update" ON subtopics FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "subtopics_delete" ON subtopics FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX idx_modules_subject ON modules(subject_id);
CREATE INDEX idx_topics_module ON topics(module_id);
CREATE INDEX idx_subtopics_topic ON subtopics(topic_id);
CREATE INDEX idx_subjects_order ON subjects(display_order);
CREATE INDEX idx_modules_order ON modules(display_order);
CREATE INDEX idx_topics_order ON topics(display_order);
CREATE INDEX idx_subtopics_order ON subtopics(display_order);
