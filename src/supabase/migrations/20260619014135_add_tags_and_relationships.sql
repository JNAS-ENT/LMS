-- Tags table for storing unique tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Item tags (polymorphic - can tag any entity)
CREATE TABLE IF NOT EXISTS item_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'module', 'topic', 'subtopic', 'note', 'question', 'resource', 'highlight')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tag_id, entity_type, entity_id)
);

-- Topic relationships (bidirectional)
CREATE TABLE IF NOT EXISTS topic_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id_a UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  topic_id_b UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'related' CHECK (relationship_type IN ('related', 'prerequisite', 'extension', 'alternative')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id_a, topic_id_b),
  CHECK (topic_id_a != topic_id_b)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "tags_select" ON tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "tags_insert" ON tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tags_update" ON tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tags_delete" ON tags FOR DELETE TO authenticated USING (true);

CREATE POLICY "item_tags_select" ON item_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "item_tags_insert" ON item_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "item_tags_delete" ON item_tags FOR DELETE TO authenticated USING (true);

CREATE POLICY "topic_relationships_select" ON topic_relationships FOR SELECT TO authenticated USING (true);
CREATE POLICY "topic_relationships_insert" ON topic_relationships FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "topic_relationships_delete" ON topic_relationships FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_tags_entity ON item_tags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_topic_relationships_a ON topic_relationships(topic_id_a);
CREATE INDEX IF NOT EXISTS idx_topic_relationships_b ON topic_relationships(topic_id_b);

-- Add tags column to subjects, modules for quick filtering
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE topic_notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE topic_questions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE topic_resources ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE topic_highlights ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';