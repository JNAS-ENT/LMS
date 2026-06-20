-- Fix RLS policies for anon role access
-- The Learning Vault uses anon key authentication without user login,
-- so all RLS policies need to allow anon role instead of authenticated

-- Drop existing policies for topic_notes
DROP POLICY IF EXISTS topic_notes_select ON topic_notes;
DROP POLICY IF EXISTS topic_notes_insert ON topic_notes;
DROP POLICY IF EXISTS topic_notes_update ON topic_notes;
DROP POLICY IF EXISTS topic_notes_delete ON topic_notes;

-- Create new policies for topic_notes allowing anon
CREATE POLICY topic_notes_select ON topic_notes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_notes_insert ON topic_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_notes_update ON topic_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topic_notes_delete ON topic_notes FOR DELETE TO anon, authenticated USING (true);

-- Fix topic_questions
DROP POLICY IF EXISTS topic_questions_select ON topic_questions;
DROP POLICY IF EXISTS topic_questions_insert ON topic_questions;
DROP POLICY IF EXISTS topic_questions_update ON topic_questions;
DROP POLICY IF EXISTS topic_questions_delete ON topic_questions;

CREATE POLICY topic_questions_select ON topic_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_questions_insert ON topic_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_questions_update ON topic_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topic_questions_delete ON topic_questions FOR DELETE TO anon, authenticated USING (true);

-- Fix topic_resources
DROP POLICY IF EXISTS topic_resources_select ON topic_resources;
DROP POLICY IF EXISTS topic_resources_insert ON topic_resources;
DROP POLICY IF EXISTS topic_resources_update ON topic_resources;
DROP POLICY IF EXISTS topic_resources_delete ON topic_resources;

CREATE POLICY topic_resources_select ON topic_resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_resources_insert ON topic_resources FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_resources_update ON topic_resources FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topic_resources_delete ON topic_resources FOR DELETE TO anon, authenticated USING (true);

-- Fix topic_revisions
DROP POLICY IF EXISTS topic_revisions_select ON topic_revisions;
DROP POLICY IF EXISTS topic_revisions_insert ON topic_revisions;
DROP POLICY IF EXISTS topic_revisions_update ON topic_revisions;
DROP POLICY IF EXISTS topic_revisions_delete ON topic_revisions;

CREATE POLICY topic_revisions_select ON topic_revisions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_revisions_insert ON topic_revisions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_revisions_update ON topic_revisions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topic_revisions_delete ON topic_revisions FOR DELETE TO anon, authenticated USING (true);

-- Fix topic_code
DROP POLICY IF EXISTS topic_code_select ON topic_code;
DROP POLICY IF EXISTS topic_code_insert ON topic_code;
DROP POLICY IF EXISTS topic_code_update ON topic_code;
DROP POLICY IF EXISTS topic_code_delete ON topic_code;

CREATE POLICY topic_code_select ON topic_code FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_code_insert ON topic_code FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_code_update ON topic_code FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topic_code_delete ON topic_code FOR DELETE TO anon, authenticated USING (true);

-- Fix topic_highlights
DROP POLICY IF EXISTS topic_highlights_select ON topic_highlights;
DROP POLICY IF EXISTS topic_highlights_insert ON topic_highlights;
DROP POLICY IF EXISTS topic_highlights_update ON topic_highlights;
DROP POLICY IF EXISTS topic_highlights_delete ON topic_highlights;

CREATE POLICY topic_highlights_select ON topic_highlights FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_highlights_insert ON topic_highlights FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_highlights_update ON topic_highlights FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topic_highlights_delete ON topic_highlights FOR DELETE TO anon, authenticated USING (true);

-- Fix subjects
DROP POLICY IF EXISTS subjects_select ON subjects;
DROP POLICY IF EXISTS subjects_insert ON subjects;
DROP POLICY IF EXISTS subjects_update ON subjects;
DROP POLICY IF EXISTS subjects_delete ON subjects;

CREATE POLICY subjects_select ON subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY subjects_insert ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY subjects_update ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY subjects_delete ON subjects FOR DELETE TO anon, authenticated USING (true);

-- Fix modules
DROP POLICY IF EXISTS modules_select ON modules;
DROP POLICY IF EXISTS modules_insert ON modules;
DROP POLICY IF EXISTS modules_update ON modules;
DROP POLICY IF EXISTS modules_delete ON modules;

CREATE POLICY modules_select ON modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY modules_insert ON modules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY modules_update ON modules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY modules_delete ON modules FOR DELETE TO anon, authenticated USING (true);

-- Fix topics
DROP POLICY IF EXISTS topics_select ON topics;
DROP POLICY IF EXISTS topics_insert ON topics;
DROP POLICY IF EXISTS topics_update ON topics;
DROP POLICY IF EXISTS topics_delete ON topics;

CREATE POLICY topics_select ON topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topics_insert ON topics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topics_update ON topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY topics_delete ON topics FOR DELETE TO anon, authenticated USING (true);

-- Fix subtopics
DROP POLICY IF EXISTS subtopics_select ON subtopics;
DROP POLICY IF EXISTS subtopics_insert ON subtopics;
DROP POLICY IF EXISTS subtopics_update ON subtopics;
DROP POLICY IF EXISTS subtopics_delete ON subtopics;

CREATE POLICY subtopics_select ON subtopics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY subtopics_insert ON subtopics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY subtopics_update ON subtopics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY subtopics_delete ON subtopics FOR DELETE TO anon, authenticated USING (true);

-- Fix notes
DROP POLICY IF EXISTS notes_select ON notes;
DROP POLICY IF EXISTS notes_insert ON notes;
DROP POLICY IF EXISTS notes_update ON notes;
DROP POLICY IF EXISTS notes_delete ON notes;

CREATE POLICY notes_select ON notes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY notes_insert ON notes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY notes_update ON notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY notes_delete ON notes FOR DELETE TO anon, authenticated USING (true);

-- Fix journal_entries
DROP POLICY IF EXISTS journal_entries_select ON journal_entries;
DROP POLICY IF EXISTS journal_entries_insert ON journal_entries;
DROP POLICY IF EXISTS journal_entries_update ON journal_entries;
DROP POLICY IF EXISTS journal_entries_delete ON journal_entries;

CREATE POLICY journal_entries_select ON journal_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY journal_entries_insert ON journal_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY journal_entries_update ON journal_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY journal_entries_delete ON journal_entries FOR DELETE TO anon, authenticated USING (true);

-- Fix code_snippets
DROP POLICY IF EXISTS code_snippets_select ON code_snippets;
DROP POLICY IF EXISTS code_snippets_insert ON code_snippets;
DROP POLICY IF EXISTS code_snippets_update ON code_snippets;
DROP POLICY IF EXISTS code_snippets_delete ON code_snippets;

CREATE POLICY code_snippets_select ON code_snippets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY code_snippets_insert ON code_snippets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY code_snippets_update ON code_snippets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY code_snippets_delete ON code_snippets FOR DELETE TO anon, authenticated USING (true);

-- Fix research_papers
DROP POLICY IF EXISTS research_papers_select ON research_papers;
DROP POLICY IF EXISTS research_papers_insert ON research_papers;
DROP POLICY IF EXISTS research_papers_update ON research_papers;
DROP POLICY IF EXISTS research_papers_delete ON research_papers;

CREATE POLICY research_papers_select ON research_papers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY research_papers_insert ON research_papers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY research_papers_update ON research_papers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY research_papers_delete ON research_papers FOR DELETE TO anon, authenticated USING (true);

-- Fix projects
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;

CREATE POLICY projects_select ON projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY projects_insert ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY projects_update ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY projects_delete ON projects FOR DELETE TO anon, authenticated USING (true);

-- Fix roadmap_items
DROP POLICY IF EXISTS roadmap_items_select ON roadmap_items;
DROP POLICY IF EXISTS roadmap_items_insert ON roadmap_items;
DROP POLICY IF EXISTS roadmap_items_update ON roadmap_items;
DROP POLICY IF EXISTS roadmap_items_delete ON roadmap_items;

CREATE POLICY roadmap_items_select ON roadmap_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY roadmap_items_insert ON roadmap_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY roadmap_items_update ON roadmap_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY roadmap_items_delete ON roadmap_items FOR DELETE TO anon, authenticated USING (true);

-- Fix bookmarks
DROP POLICY IF EXISTS bookmarks_select ON bookmarks;
DROP POLICY IF EXISTS bookmarks_insert ON bookmarks;
DROP POLICY IF EXISTS bookmarks_update ON bookmarks;
DROP POLICY IF EXISTS bookmarks_delete ON bookmarks;

CREATE POLICY bookmarks_select ON bookmarks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY bookmarks_insert ON bookmarks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY bookmarks_update ON bookmarks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY bookmarks_delete ON bookmarks FOR DELETE TO anon, authenticated USING (true);

-- Fix quick_notes
DROP POLICY IF EXISTS quick_notes_select ON quick_notes;
DROP POLICY IF EXISTS quick_notes_insert ON quick_notes;
DROP POLICY IF EXISTS quick_notes_update ON quick_notes;
DROP POLICY IF EXISTS quick_notes_delete ON quick_notes;

CREATE POLICY quick_notes_select ON quick_notes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY quick_notes_insert ON quick_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY quick_notes_update ON quick_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY quick_notes_delete ON quick_notes FOR DELETE TO anon, authenticated USING (true);

-- Fix streak_tracker
DROP POLICY IF EXISTS streak_tracker_select ON streak_tracker;
DROP POLICY IF EXISTS streak_tracker_insert ON streak_tracker;
DROP POLICY IF EXISTS streak_tracker_update ON streak_tracker;
DROP POLICY IF EXISTS streak_tracker_delete ON streak_tracker;

CREATE POLICY streak_tracker_select ON streak_tracker FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY streak_tracker_insert ON streak_tracker FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY streak_tracker_update ON streak_tracker FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY streak_tracker_delete ON streak_tracker FOR DELETE TO anon, authenticated USING (true);

-- Fix activity_log
DROP POLICY IF EXISTS activity_log_select ON activity_log;
DROP POLICY IF EXISTS activity_log_insert ON activity_log;

CREATE POLICY activity_log_select ON activity_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY activity_log_insert ON activity_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Fix tags
DROP POLICY IF EXISTS tags_select ON tags;
DROP POLICY IF EXISTS tags_insert ON tags;
DROP POLICY IF EXISTS tags_update ON tags;
DROP POLICY IF EXISTS tags_delete ON tags;

CREATE POLICY tags_select ON tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY tags_insert ON tags FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY tags_update ON tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY tags_delete ON tags FOR DELETE TO anon, authenticated USING (true);

-- Fix item_tags
DROP POLICY IF EXISTS item_tags_select ON item_tags;
DROP POLICY IF EXISTS item_tags_insert ON item_tags;
DROP POLICY IF EXISTS item_tags_delete ON item_tags;

CREATE POLICY item_tags_select ON item_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY item_tags_insert ON item_tags FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY item_tags_delete ON item_tags FOR DELETE TO anon, authenticated USING (true);

-- Fix topic_relationships
DROP POLICY IF EXISTS topic_relationships_select ON topic_relationships;
DROP POLICY IF EXISTS topic_relationships_insert ON topic_relationships;
DROP POLICY IF EXISTS topic_relationships_delete ON topic_relationships;

CREATE POLICY topic_relationships_select ON topic_relationships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_relationships_insert ON topic_relationships FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY topic_relationships_delete ON topic_relationships FOR DELETE TO anon, authenticated USING (true);

-- Fix storage_providers
DROP POLICY IF EXISTS select_storage_providers ON storage_providers;
DROP POLICY IF EXISTS insert_storage_providers ON storage_providers;
DROP POLICY IF EXISTS update_storage_providers ON storage_providers;
DROP POLICY IF EXISTS delete_storage_providers ON storage_providers;

CREATE POLICY storage_providers_select ON storage_providers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY storage_providers_insert ON storage_providers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY storage_providers_update ON storage_providers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY storage_providers_delete ON storage_providers FOR DELETE TO anon, authenticated USING (true);

-- Fix vault_metadata
DROP POLICY IF EXISTS select_vault_metadata ON vault_metadata;
DROP POLICY IF EXISTS insert_vault_metadata ON vault_metadata;
DROP POLICY IF EXISTS update_vault_metadata ON vault_metadata;
DROP POLICY IF EXISTS delete_vault_metadata ON vault_metadata;

CREATE POLICY vault_metadata_select ON vault_metadata FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY vault_metadata_insert ON vault_metadata FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY vault_metadata_update ON vault_metadata FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY vault_metadata_delete ON vault_metadata FOR DELETE TO anon, authenticated USING (true);

-- Fix backup_history
DROP POLICY IF EXISTS select_backup_history ON backup_history;
DROP POLICY IF EXISTS insert_backup_history ON backup_history;
DROP POLICY IF EXISTS update_backup_history ON backup_history;
DROP POLICY IF EXISTS delete_backup_history ON backup_history;

CREATE POLICY backup_history_select ON backup_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY backup_history_insert ON backup_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY backup_history_update ON backup_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY backup_history_delete ON backup_history FOR DELETE TO anon, authenticated USING (true);