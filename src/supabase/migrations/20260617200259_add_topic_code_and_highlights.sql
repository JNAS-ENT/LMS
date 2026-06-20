-- Topic code snippets table
CREATE TABLE topic_code (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'plaintext',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Topic highlights table
CREATE TABLE topic_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE topic_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_highlights ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "topic_code_select" ON topic_code FOR SELECT TO anon USING (true);
CREATE POLICY "topic_code_insert" ON topic_code FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "topic_code_update" ON topic_code FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "topic_code_delete" ON topic_code FOR DELETE TO anon USING (true);

CREATE POLICY "topic_highlights_select" ON topic_highlights FOR SELECT TO anon USING (true);
CREATE POLICY "topic_highlights_insert" ON topic_highlights FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "topic_highlights_update" ON topic_highlights FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "topic_highlights_delete" ON topic_highlights FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX idx_topic_code_topic ON topic_code(topic_id);
CREATE INDEX idx_topic_highlights_topic ON topic_highlights(topic_id);