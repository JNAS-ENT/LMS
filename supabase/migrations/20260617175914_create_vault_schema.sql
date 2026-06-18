-- Knowledge Base Notes
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Python',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Journal Entries
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  topics_learned TEXT DEFAULT '',
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  key_insights TEXT DEFAULT '',
  action_items TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Code Snippets
CREATE TABLE code_snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'Python',
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Research Papers
CREATE TABLE research_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  pdf_link TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Active', 'Completed')),
  technologies TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  links TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Learning Roadmap
CREATE TABLE roadmap_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal TEXT NOT NULL,
  milestone TEXT DEFAULT '',
  target_date DATE,
  completion_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (completion_status IN ('Not Started', 'In Progress', 'Completed')),
  category TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookmarks
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Blogs' CHECK (category IN ('YouTube', 'GitHub', 'Courses', 'Blogs', 'Documentation')),
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quick Notes (sticky notes)
CREATE TABLE quick_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '#FFFFFF',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Learning Streak Tracker
CREATE TABLE streak_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  minutes_learned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_tracker ENABLE ROW LEVEL SECURITY;

-- Since this is a single-user system accessed via secret URL,
-- we use anon key access with RLS policies that allow all operations for anon users
-- The secret URL path serves as the access control mechanism

CREATE POLICY "notes_select" ON notes FOR SELECT TO anon USING (true);
CREATE POLICY "notes_insert" ON notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "notes_update" ON notes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "notes_delete" ON notes FOR DELETE TO anon USING (true);

CREATE POLICY "journal_select" ON journal_entries FOR SELECT TO anon USING (true);
CREATE POLICY "journal_insert" ON journal_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "journal_update" ON journal_entries FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "journal_delete" ON journal_entries FOR DELETE TO anon USING (true);

CREATE POLICY "code_select" ON code_snippets FOR SELECT TO anon USING (true);
CREATE POLICY "code_insert" ON code_snippets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "code_update" ON code_snippets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "code_delete" ON code_snippets FOR DELETE TO anon USING (true);

CREATE POLICY "papers_select" ON research_papers FOR SELECT TO anon USING (true);
CREATE POLICY "papers_insert" ON research_papers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "papers_update" ON research_papers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "papers_delete" ON research_papers FOR DELETE TO anon USING (true);

CREATE POLICY "projects_select" ON projects FOR SELECT TO anon USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "projects_update" ON projects FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "projects_delete" ON projects FOR DELETE TO anon USING (true);

CREATE POLICY "roadmap_select" ON roadmap_items FOR SELECT TO anon USING (true);
CREATE POLICY "roadmap_insert" ON roadmap_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "roadmap_update" ON roadmap_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "roadmap_delete" ON roadmap_items FOR DELETE TO anon USING (true);

CREATE POLICY "bookmarks_select" ON bookmarks FOR SELECT TO anon USING (true);
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "bookmarks_update" ON bookmarks FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE TO anon USING (true);

CREATE POLICY "quicknotes_select" ON quick_notes FOR SELECT TO anon USING (true);
CREATE POLICY "quicknotes_insert" ON quick_notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "quicknotes_update" ON quick_notes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "quicknotes_delete" ON quick_notes FOR DELETE TO anon USING (true);

CREATE POLICY "streak_select" ON streak_tracker FOR SELECT TO anon USING (true);
CREATE POLICY "streak_insert" ON streak_tracker FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "streak_update" ON streak_tracker FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "streak_delete" ON streak_tracker FOR DELETE TO anon USING (true);

-- Indexes for search performance
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_journal_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_code_language ON code_snippets(language);
CREATE INDEX idx_code_tags ON code_snippets USING GIN(tags);
CREATE INDEX idx_papers_tags ON research_papers USING GIN(tags);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_roadmap_status ON roadmap_items(completion_status);
CREATE INDEX idx_bookmarks_category ON bookmarks(category);
CREATE INDEX idx_streak_date ON streak_tracker(date DESC);
