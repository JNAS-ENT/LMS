import { supabase } from '../lib/supabase';
import type {
  Note,
  JournalEntry,
  CodeSnippet,
  ResearchPaper,
  Project,
  RoadmapItem,
  Bookmark,
  QuickNote,
  StreakDay,
  Subject,
  Module,
  Topic,
  Subtopic,
  SyllabusNode,
  TopicQuestion,
  TopicResource,
  TopicRevision,
  TopicCode,
  TopicHighlight,
  ActivityLogEntry,
  ActivityAction,
  EntityType,
  DeletedItem,
} from '../types';

// ─── Notes ─────────────────────────────────────────────────────
export async function fetchNotes(category?: string): Promise<Note[]> {
  let q = supabase.from('notes').select('*').order('updated_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase.from('notes').insert(note).select().single();
  if (error) throw error;
  return data;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase.from('notes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Journal ───────────────────────────────────────────────────
export async function fetchJournalEntries(limit = 30): Promise<JournalEntry[]> {
  const { data, error } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchJournalEntry(date: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase.from('journal_entries').select('*').eq('entry_date', date).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertJournalEntry(entry: Partial<JournalEntry>): Promise<JournalEntry> {
  const { data, error } = await supabase.from('journal_entries').upsert(entry, { onConflict: 'entry_date' }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}

// ─── Code Snippets ─────────────────────────────────────────────
export async function fetchCodeSnippets(language?: string): Promise<CodeSnippet[]> {
  let q = supabase.from('code_snippets').select('*').order('updated_at', { ascending: false });
  if (language) q = q.eq('language', language);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createCodeSnippet(snippet: Partial<CodeSnippet>): Promise<CodeSnippet> {
  const { data, error } = await supabase.from('code_snippets').insert(snippet).select().single();
  if (error) throw error;
  return data;
}

export async function updateCodeSnippet(id: string, updates: Partial<CodeSnippet>): Promise<CodeSnippet> {
  const { data, error } = await supabase.from('code_snippets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCodeSnippet(id: string): Promise<void> {
  const { error } = await supabase.from('code_snippets').delete().eq('id', id);
  if (error) throw error;
}

// ─── Research Papers ───────────────────────────────────────────
export async function fetchPapers(): Promise<ResearchPaper[]> {
  const { data, error } = await supabase.from('research_papers').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPaper(paper: Partial<ResearchPaper>): Promise<ResearchPaper> {
  const { data, error } = await supabase.from('research_papers').insert(paper).select().single();
  if (error) throw error;
  return data;
}

export async function updatePaper(id: string, updates: Partial<ResearchPaper>): Promise<ResearchPaper> {
  const { data, error } = await supabase.from('research_papers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePaper(id: string): Promise<void> {
  const { error } = await supabase.from('research_papers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Projects ──────────────────────────────────────────────────
export async function fetchProjects(status?: string): Promise<Project[]> {
  let q = supabase.from('projects').select('*').order('updated_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(project).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase.from('projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Roadmap ──────────────────────────────────────────────────
export async function fetchRoadmapItems(): Promise<RoadmapItem[]> {
  const { data, error } = await supabase.from('roadmap_items').select('*').order('target_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRoadmapItem(item: Partial<RoadmapItem>): Promise<RoadmapItem> {
  const { data, error } = await supabase.from('roadmap_items').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoadmapItem(id: string, updates: Partial<RoadmapItem>): Promise<RoadmapItem> {
  const { data, error } = await supabase.from('roadmap_items').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRoadmapItem(id: string): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', id);
  if (error) throw error;
}

// ─── Bookmarks ────────────────────────────────────────────────
export async function fetchBookmarks(category?: string): Promise<Bookmark[]> {
  let q = supabase.from('bookmarks').select('*').order('updated_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createBookmark(bookmark: Partial<Bookmark>): Promise<Bookmark> {
  const { data, error } = await supabase.from('bookmarks').insert(bookmark).select().single();
  if (error) throw error;
  return data;
}

export async function updateBookmark(id: string, updates: Partial<Bookmark>): Promise<Bookmark> {
  const { data, error } = await supabase.from('bookmarks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBookmark(id: string): Promise<void> {
  const { error } = await supabase.from('bookmarks').delete().eq('id', id);
  if (error) throw error;
}

// ─── Quick Notes ──────────────────────────────────────────────
export async function fetchQuickNotes(): Promise<QuickNote[]> {
  const { data, error } = await supabase.from('quick_notes').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createQuickNote(note: Partial<QuickNote>): Promise<QuickNote> {
  const { data, error } = await supabase.from('quick_notes').insert(note).select().single();
  if (error) throw error;
  return data;
}

export async function updateQuickNote(id: string, updates: Partial<QuickNote>): Promise<QuickNote> {
  const { data, error } = await supabase.from('quick_notes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQuickNote(id: string): Promise<void> {
  const { error } = await supabase.from('quick_notes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Streak ───────────────────────────────────────────────────
export async function fetchStreakData(days = 30): Promise<StreakDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase.from('streak_tracker').select('*').gte('date', since.toISOString().split('T')[0]).order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertStreakDay(date: string, minutesLearned: number): Promise<StreakDay> {
  const { data, error } = await supabase.from('streak_tracker').upsert({ date, minutes_learned: minutesLearned }, { onConflict: 'date' }).select().single();
  if (error) throw error;
  return data;
}

// ─── Global Search ────────────────────────────────────────────
export interface SearchResult {
  type: 'subject' | 'module' | 'topic' | 'note' | 'journal' | 'code' | 'paper' | 'project' | 'bookmark';
  id: string;
  title: string;
  subtitle: string;
  updated_at: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const pattern = `%${query}%`;
  const results: SearchResult[] = [];

  const searches: { table: string; type: SearchResult['type']; titleCol: string; subtitleCol: string; extraFilter?: string }[] = [
    { table: 'subjects', type: 'subject', titleCol: 'name', subtitleCol: 'description', extraFilter: 'deleted_at IS NULL' },
    { table: 'modules', type: 'module', titleCol: 'name', subtitleCol: 'description', extraFilter: 'deleted_at IS NULL' },
    { table: 'topics', type: 'topic', titleCol: 'name', subtitleCol: 'description', extraFilter: 'deleted_at IS NULL' },
    { table: 'notes', type: 'note', titleCol: 'title', subtitleCol: 'category' },
    { table: 'journal_entries', type: 'journal', titleCol: 'entry_date', subtitleCol: 'topics_learned' },
    { table: 'code_snippets', type: 'code', titleCol: 'title', subtitleCol: 'language' },
    { table: 'research_papers', type: 'paper', titleCol: 'title', subtitleCol: 'authors' },
    { table: 'projects', type: 'project', titleCol: 'name', subtitleCol: 'status' },
    { table: 'bookmarks', type: 'bookmark', titleCol: 'title', subtitleCol: 'category' },
  ];

  const promises = searches.map(async (s) => {
    let q = supabase.from(s.table).select(`id, ${s.titleCol}, ${s.subtitleCol}, updated_at`).ilike(s.titleCol, pattern).limit(10);
    const { data, error } = await q;
    if (!error && data) {
      data.forEach((row: Record<string, unknown>) => {
        results.push({
          type: s.type,
          id: row.id as string,
          title: String(row[s.titleCol]),
          subtitle: String(row[s.subtitleCol] || ''),
          updated_at: row.updated_at as string,
        });
      });
    }
  });

  await Promise.all(promises);
  return results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

// ─── Syllabus ──────────────────────────────────────────────────

export async function fetchSyllabusTree(): Promise<SyllabusNode[]> {
  const [subjects, modules, topics, subtopics] = await Promise.all([
    supabase.from('subjects').select('*').is('deleted_at', null).order('display_order').then(r => r.data ?? []),
    supabase.from('modules').select('*').is('deleted_at', null).order('display_order').then(r => r.data ?? []),
    supabase.from('topics').select('*').is('deleted_at', null).order('display_order').then(r => r.data ?? []),
    supabase.from('subtopics').select('*').is('deleted_at', null).order('display_order').then(r => r.data ?? []),
  ]);

  return subjects.map((s: Subject) => ({
    level: 'subject' as const,
    data: s,
    children: modules
      .filter((m: Module) => m.subject_id === s.id)
      .map((m: Module) => ({
        level: 'module' as const,
        data: m,
        children: topics
          .filter((t: Topic) => t.module_id === m.id)
          .map((t: Topic) => ({
            level: 'topic' as const,
            data: t,
            children: subtopics
              .filter((st: Subtopic) => st.topic_id === t.id)
              .map((st: Subtopic) => ({
                level: 'subtopic' as const,
                data: st,
              })),
          })),
      })),
  }));
}

export async function fetchSyllabusCounts(): Promise<{ subjects: number; modules: number; topics: number; subtopics: number }> {
  const [s, m, t, st] = await Promise.all([
    supabase.from('subjects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('modules').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('topics').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('subtopics').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ]);
  return { subjects: s.count ?? 0, modules: m.count ?? 0, topics: t.count ?? 0, subtopics: st.count ?? 0 };
}

// ─── Activity Log ────────────────────────────────────────────────

async function logActivity(entityType: EntityType, entityId: string, entityName: string, action: ActivityAction, details: Record<string, unknown> = {}): Promise<void> {
  await supabase.from('activity_log').insert({ entity_type: entityType, entity_id: entityId, entity_name: entityName, action, details });
}

export async function fetchActivityLog(limit = 20): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ─── Subject CRUD ──────────────────────────────────────────────────

export async function createSubject(name: string, description = '', displayOrder = 0): Promise<Subject> {
  const { data, error } = await supabase.from('subjects').insert({ name, description, display_order: displayOrder }).select().single();
  if (error) throw error;
  await logActivity('subject', data.id, name, 'create');
  return data;
}

export async function updateSubject(id: string, updates: Partial<Pick<Subject, 'name' | 'description' | 'display_order'>>, oldName?: string): Promise<Subject> {
  const { data, error } = await supabase.from('subjects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  if (updates.name && oldName && updates.name !== oldName) {
    await logActivity('subject', id, updates.name, 'rename', { old_name: oldName });
  } else {
    await logActivity('subject', id, data.name, 'update', updates);
  }
  return data;
}

export async function softDeleteSubject(id: string): Promise<Subject> {
  // Soft delete all children first
  const modules = await supabase.from('modules').select('id').eq('subject_id', id).is('deleted_at', null);
  for (const m of modules.data ?? []) {
    await softDeleteModule(m.id);
  }
  const { data, error } = await supabase.from('subjects').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity('subject', id, data.name, 'delete');
  return data;
}

export async function restoreSubject(id: string): Promise<Subject> {
  const { data, error } = await supabase.from('subjects').update({ deleted_at: null }).eq('id', id).select().single();
  if (error) throw error;
  // Also restore all children
  const modules = await supabase.from('modules').select('id').eq('subject_id', id).not('deleted_at', 'is', null);
  for (const m of modules.data ?? []) {
    await restoreModule(m.id);
  }
  await logActivity('subject', id, data.name, 'restore');
  return data;
}

export async function permanentDeleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Module CRUD ───────────────────────────────────────────────────

export async function createModule(subjectId: string, name: string, description = '', displayOrder = 0): Promise<Module> {
  const { data, error } = await supabase.from('modules').insert({ subject_id: subjectId, name, description, display_order: displayOrder }).select().single();
  if (error) throw error;
  await logActivity('module', data.id, name, 'create', { subject_id: subjectId });
  return data;
}

export async function updateModule(id: string, updates: Partial<Pick<Module, 'name' | 'description' | 'display_order' | 'subject_id'>>, oldName?: string): Promise<Module> {
  const { data, error } = await supabase.from('modules').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  if (updates.name && oldName && updates.name !== oldName) {
    await logActivity('module', id, updates.name, 'rename', { old_name: oldName });
  } else {
    await logActivity('module', id, data.name, 'update', updates);
  }
  return data;
}

export async function softDeleteModule(id: string): Promise<Module> {
  // Soft delete all children first
  const topics = await supabase.from('topics').select('id').eq('module_id', id).is('deleted_at', null);
  for (const t of topics.data ?? []) {
    await softDeleteTopic(t.id);
  }
  const { data, error } = await supabase.from('modules').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity('module', id, data.name, 'delete');
  return data;
}

export async function restoreModule(id: string): Promise<Module> {
  const { data, error } = await supabase.from('modules').update({ deleted_at: null }).eq('id', id).select().single();
  if (error) throw error;
  const topics = await supabase.from('topics').select('id').eq('module_id', id).not('deleted_at', 'is', null);
  for (const t of topics.data ?? []) {
    await restoreTopic(t.id);
  }
  await logActivity('module', id, data.name, 'restore');
  return data;
}

export async function permanentDeleteModule(id: string): Promise<void> {
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) throw error;
}

// ─── Topic CRUD ─────────────────────────────────────────────────────

export async function createTopic(moduleId: string, name: string, description = '', displayOrder = 0): Promise<Topic> {
  const { data, error } = await supabase.from('topics').insert({ module_id: moduleId, name, description, display_order: displayOrder }).select().single();
  if (error) throw error;
  await logActivity('topic', data.id, name, 'create', { module_id: moduleId });
  return data;
}

export async function updateTopic(id: string, updates: Partial<Pick<Topic, 'name' | 'description' | 'display_order' | 'module_id' | 'status' | 'progress' | 'notes_content'>>, oldName?: string): Promise<Topic> {
  const { data, error } = await supabase.from('topics').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  if (updates.name && oldName && updates.name !== oldName) {
    await logActivity('topic', id, updates.name, 'rename', { old_name: oldName });
  } else if (Object.keys(updates).some(k => k !== 'updated_at')) {
    await logActivity('topic', id, data.name, 'update', updates);
  }
  return data;
}

export async function softDeleteTopic(id: string): Promise<Topic> {
  // Soft delete all children first
  const subtopics = await supabase.from('subtopics').select('id').eq('topic_id', id).is('deleted_at', null);
  for (const st of subtopics.data ?? []) {
    await softDeleteSubtopic(st.id);
  }
  const { data, error } = await supabase.from('topics').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity('topic', id, data.name, 'delete');
  return data;
}

export async function restoreTopic(id: string): Promise<Topic> {
  const { data, error } = await supabase.from('topics').update({ deleted_at: null }).eq('id', id).select().single();
  if (error) throw error;
  const subtopics = await supabase.from('subtopics').select('id').eq('topic_id', id).not('deleted_at', 'is', null);
  for (const st of subtopics.data ?? []) {
    await restoreSubtopic(st.id);
  }
  await logActivity('topic', id, data.name, 'restore');
  return data;
}

export async function permanentDeleteTopic(id: string): Promise<void> {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

// ─── Subtopic CRUD ──────────────────────────────────────────────────

export async function createSubtopic(topicId: string, name: string, description = '', displayOrder = 0): Promise<Subtopic> {
  const { data, error } = await supabase.from('subtopics').insert({ topic_id: topicId, name, description, display_order: displayOrder }).select().single();
  if (error) throw error;
  await logActivity('subtopic', data.id, name, 'create', { topic_id: topicId });
  return data;
}

export async function updateSubtopic(id: string, updates: Partial<Pick<Subtopic, 'name' | 'description' | 'display_order' | 'topic_id' | 'status' | 'progress' | 'notes_content'>>, oldName?: string): Promise<Subtopic> {
  const { data, error } = await supabase.from('subtopics').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  if (updates.name && oldName && updates.name !== oldName) {
    await logActivity('subtopic', id, updates.name, 'rename', { old_name: oldName });
  } else if (Object.keys(updates).some(k => k !== 'updated_at')) {
    await logActivity('subtopic', id, data.name, 'update', updates);
  }
  return data;
}

export async function softDeleteSubtopic(id: string): Promise<Subtopic> {
  const { data, error } = await supabase.from('subtopics').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity('subtopic', id, data.name, 'delete');
  return data;
}

export async function restoreSubtopic(id: string): Promise<Subtopic> {
  const { data, error } = await supabase.from('subtopics').update({ deleted_at: null }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity('subtopic', id, data.name, 'restore');
  return data;
}

export async function permanentDeleteSubtopic(id: string): Promise<void> {
  const { error } = await supabase.from('subtopics').delete().eq('id', id);
  if (error) throw error;
}

// ─── Recycle Bin ───────────────────────────────────────────────────

export async function fetchDeletedItems(): Promise<DeletedItem[]> {
  const [subjects, modules, topics, subtopics] = await Promise.all([
    supabase.from('subjects').select('id, name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('modules').select('id, name, subject_id, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('topics').select('id, name, module_id, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('subtopics').select('id, name, topic_id, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ]);

  const items: DeletedItem[] = [];

  for (const s of subjects.data ?? []) {
    items.push({ id: s.id, type: 'subject', name: s.name, deleted_at: s.deleted_at });
  }
  for (const m of modules.data ?? []) {
    const parent = subjects.data?.find((s: { id: string }) => s.id === m.subject_id);
    items.push({ id: m.id, type: 'module', name: m.name, parent_name: parent?.name, deleted_at: m.deleted_at });
  }
  for (const t of topics.data ?? []) {
    const parent = modules.data?.find((m: { id: string }) => m.id === t.module_id);
    items.push({ id: t.id, type: 'topic', name: t.name, parent_name: parent?.name, deleted_at: t.deleted_at });
  }
  for (const st of subtopics.data ?? []) {
    const parent = topics.data?.find((t: { id: string }) => t.id === st.topic_id);
    items.push({ id: st.id, type: 'subtopic', name: st.name, parent_name: parent?.name, deleted_at: st.deleted_at });
  }

  return items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
}

export async function restoreItem(id: string, type: EntityType): Promise<void> {
  const fns: Record<EntityType, (id: string) => Promise<any>> = {
    subject: restoreSubject, module: restoreModule, topic: restoreTopic, subtopic: restoreSubtopic,
  };
  await fns[type](id);
}

export async function permanentDeleteItem(id: string, type: EntityType): Promise<void> {
  const fns: Record<EntityType, (id: string) => Promise<void>> = {
    subject: permanentDeleteSubject, module: permanentDeleteModule, topic: permanentDeleteTopic, subtopic: permanentDeleteSubtopic,
  };
  await fns[type](id);
}

// ─── Export / Import ───────────────────────────────────────────────

export async function exportSyllabusJSON(): Promise<string> {
  const [subjects, modules, topics, subtopics, questions, resources, revisions, code, highlights, notes] = await Promise.all([
    supabase.from('subjects').select('*'),
    supabase.from('modules').select('*'),
    supabase.from('topics').select('*'),
    supabase.from('subtopics').select('*'),
    supabase.from('topic_questions').select('*'),
    supabase.from('topic_resources').select('*'),
    supabase.from('topic_revisions').select('*'),
    supabase.from('topic_code').select('*'),
    supabase.from('topic_highlights').select('*'),
    supabase.from('notes').select('*'),
  ]);

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    subjects: subjects.data ?? [],
    modules: modules.data ?? [],
    topics: topics.data ?? [],
    subtopics: subtopics.data ?? [],
    topic_questions: questions.data ?? [],
    topic_resources: resources.data ?? [],
    topic_revisions: revisions.data ?? [],
    topic_code: code.data ?? [],
    topic_highlights: highlights.data ?? [],
    notes: notes.data ?? [],
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importSyllabusJSON(json: string): Promise<{ success: boolean; message: string }> {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return { success: false, message: 'Invalid JSON file. Please select a valid backup file.' };
  }

  // Validate structure
  if (!data.version || !data.exportedAt) {
    return { success: false, message: 'Invalid backup file. Missing version or export date.' };
  }
  if (!Array.isArray(data.subjects)) {
    return { success: false, message: 'Invalid backup file. Missing subjects array.' };
  }

  // Clear existing data (order matters for foreign keys)
  await supabase.from('topic_highlights').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_code').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_revisions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_resources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('subtopics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert new data (order matters for foreign keys)
  const insertSafe = async (table: string, items: any[]) => {
    if (!items?.length) return;
    // Remove timestamps and ids that might conflict
    const cleaned = items.map((item: any) => {
      const { created_at, updated_at, id, ...rest } = item;
      return rest;
    });
    // Batch insert in chunks of 100
    for (let i = 0; i < cleaned.length; i += 100) {
      await supabase.from(table).insert(cleaned.slice(i, i + 100));
    }
  };

  // Insert in dependency order
  await insertSafe('subjects', data.subjects);
  await insertSafe('modules', data.modules);
  await insertSafe('topics', data.topics);
  await insertSafe('subtopics', data.subtopics);
  await insertSafe('topic_questions', data.topic_questions);
  await insertSafe('topic_resources', data.topic_resources);
  await insertSafe('topic_revisions', data.topic_revisions);
  await insertSafe('topic_code', data.topic_code);
  await insertSafe('topic_highlights', data.topic_highlights);
  await insertSafe('notes', data.notes);

  return { success: true, message: `Imported ${data.subjects.length} subjects, ${data.modules?.length ?? 0} modules, ${data.topics?.length ?? 0} topics.` };
}

// ─── Topic Workspace ────────────────────────────────────────────

// Questions
export async function fetchTopicQuestions(topicId: string): Promise<TopicQuestion[]> {
  const { data, error } = await supabase.from('topic_questions').select('*').eq('topic_id', topicId).order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function createTopicQuestion(topicId: string, question: string, answer = '', difficulty: TopicQuestion['difficulty'] = 'Medium', displayOrder = 0): Promise<TopicQuestion> {
  const { data, error } = await supabase.from('topic_questions').insert({ topic_id: topicId, question, answer, difficulty, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicQuestion(id: string, updates: Partial<Pick<TopicQuestion, 'question' | 'answer' | 'difficulty' | 'display_order'>>): Promise<TopicQuestion> {
  const { data, error } = await supabase.from('topic_questions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('topic_questions').delete().eq('id', id);
  if (error) throw error;
}

// Resources
export async function fetchTopicResources(topicId: string): Promise<TopicResource[]> {
  const { data, error } = await supabase.from('topic_resources').select('*').eq('topic_id', topicId).order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function createTopicResource(topicId: string, title: string, url: string, resourceType: TopicResource['resource_type'] = 'URL', displayOrder = 0): Promise<TopicResource> {
  const { data, error } = await supabase.from('topic_resources').insert({ topic_id: topicId, title, url, resource_type: resourceType, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicResource(id: string, updates: Partial<Pick<TopicResource, 'title' | 'url' | 'resource_type' | 'display_order'>>): Promise<TopicResource> {
  const { data, error } = await supabase.from('topic_resources').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicResource(id: string): Promise<void> {
  const { error } = await supabase.from('topic_resources').delete().eq('id', id);
  if (error) throw error;
}

// Revisions
export async function fetchTopicRevisions(topicId: string): Promise<TopicRevision[]> {
  const { data, error } = await supabase.from('topic_revisions').select('*').eq('topic_id', topicId).order('revision_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTopicRevision(topicId: string, revisionDate: string, confidenceScore = 50, revisionNotes = ''): Promise<TopicRevision> {
  const { data, error } = await supabase.from('topic_revisions').insert({ topic_id: topicId, revision_date: revisionDate, confidence_score: confidenceScore, revision_notes: revisionNotes }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicRevision(id: string, updates: Partial<Pick<TopicRevision, 'revision_date' | 'confidence_score' | 'revision_notes'>>): Promise<TopicRevision> {
  const { data, error } = await supabase.from('topic_revisions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicRevision(id: string): Promise<void> {
  const { error } = await supabase.from('topic_revisions').delete().eq('id', id);
  if (error) throw error;
}

// Dashboard learning stats
export async function fetchLearningStats(): Promise<{
  topicsCompleted: number;
  topicsLearning: number;
  topicsPending: number;
  overallProgress: number;
  revisionsDue: number;
}> {
  const [allTopics, todayRevisions] = await Promise.all([
    supabase.from('topics').select('status, progress').is('deleted_at', null).then(r => r.data ?? []),
    supabase.from('topic_revisions').select('revision_date').lte('revision_date', new Date().toISOString().split('T')[0]).then(r => r.data ?? []),
  ]);

  const completed = allTopics.filter((t: { status: string }) => t.status === 'Completed' || t.status === 'Revised' || t.status === 'Mastered').length;
  const learning = allTopics.filter((t: { status: string }) => t.status === 'Learning' || t.status === 'Practicing').length;
  const pending = allTopics.filter((t: { status: string }) => t.status === 'Not Started').length;
  const totalProgress = allTopics.reduce((sum: number, t: { progress: number }) => sum + t.progress, 0);
  const overallProgress = allTopics.length > 0 ? Math.round(totalProgress / allTopics.length) : 0;

  const revisionTopicIds = new Set(todayRevisions.map((r: { revision_date: string }) => r.revision_date));
  const revisionsDue = revisionTopicIds.size;

  return { topicsCompleted: completed, topicsLearning: learning, topicsPending: pending, overallProgress, revisionsDue };
}

// ─── Topic Code ────────────────────────────────────────────────

export async function fetchTopicCode(topicId: string): Promise<TopicCode[]> {
  const { data, error } = await supabase.from('topic_code').select('*').eq('topic_id', topicId).order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function createTopicCode(topicId: string, title = '', code = '', language = 'plaintext', displayOrder = 0): Promise<TopicCode> {
  const { data, error } = await supabase.from('topic_code').insert({ topic_id: topicId, title, code, language, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicCode(id: string, updates: Partial<Pick<TopicCode, 'title' | 'code' | 'language' | 'display_order'>>): Promise<TopicCode> {
  const { data, error } = await supabase.from('topic_code').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicCode(id: string): Promise<void> {
  const { error } = await supabase.from('topic_code').delete().eq('id', id);
  if (error) throw error;
}

// ─── Topic Highlights ──────────────────────────────────────────

export async function fetchTopicHighlights(topicId: string): Promise<TopicHighlight[]> {
  const { data, error } = await supabase.from('topic_highlights').select('*').eq('topic_id', topicId).order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function createTopicHighlight(topicId: string, content: string, displayOrder = 0): Promise<TopicHighlight> {
  const { data, error } = await supabase.from('topic_highlights').insert({ topic_id: topicId, content, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicHighlight(id: string, updates: Partial<Pick<TopicHighlight, 'content' | 'display_order'>>): Promise<TopicHighlight> {
  const { data, error } = await supabase.from('topic_highlights').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicHighlight(id: string): Promise<void> {
  const { error } = await supabase.from('topic_highlights').delete().eq('id', id);
  if (error) throw error;
}

// ─── Auto Status Detection ──────────────────────────────────────

export async function detectAndSetStatus(topicId: string): Promise<void> {
  const [topic, questions, revisions] = await Promise.all([
    supabase.from('topics').select('status, notes_content, progress').eq('id', topicId).is('deleted_at', null).single(),
    supabase.from('topic_questions').select('id', { count: 'exact', head: true }).eq('topic_id', topicId),
    supabase.from('topic_revisions').select('id').eq('topic_id', topicId),
  ]);

  if (topic.error) return;
  const t = topic.data;
  let newStatus: string = t.status;

  // 3+ revisions = Mastered
  if ((revisions.data?.length ?? 0) >= 3) {
    newStatus = 'Mastered';
  }
  // Has questions = Practicing
  else if ((questions.count ?? 0) > 0) {
    newStatus = 'Practicing';
  }
  // Has notes content = Learning
  else if (t.notes_content && t.notes_content.trim().length > 0) {
    newStatus = 'Learning';
  }
  // Nothing = Not Started
  else {
    newStatus = 'Not Started';
  }

  // Don't override Completed or Mastered unless rules say so
  // Completed is a manual toggle; auto-detection won't downgrade it
  if (t.status === 'Completed' && newStatus !== 'Mastered') {
    newStatus = 'Completed';
  }

  if (newStatus !== t.status) {
    // Calculate progress from status
    const progressMap: Record<string, number> = {
      'Not Started': 0,
      'Learning': 25,
      'Practicing': 50,
      'Completed': 75,
      'Revised': 85,
      'Mastered': 100,
    };
    const newProgress = Math.max(t.progress, progressMap[newStatus] ?? 0);
    await updateTopic(topicId, { status: newStatus as Topic['status'], progress: newProgress });
  }
}

// ─── Syllabus Import ────────────────────────────────────────────

export async function importSyllabusText(text: string): Promise<void> {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return;

  // Detect indent levels - support tabs or spaces
  const getIndent = (line: string): number => {
    const match = line.match(/^(\s*)/);
    if (!match) return 0;
    const ws = match[1];
    if (ws.includes('\t')) return ws.split('\t').length - 1;
    return Math.floor(ws.length / 2);
  };

  // Find minimum indent (the root level)
  const minIndent = Math.min(...lines.map(l => getIndent(l)));
  const normalizeIndent = (line: string) => getIndent(line) - minIndent;

  // Group lines by indent level
  interface HierarchyItem { name: string; indent: number; children: HierarchyItem[] }
  const stack: HierarchyItem[] = [];
  const roots: HierarchyItem[] = [];

  for (const line of lines) {
    const name = line.trim().replace(/^[-*•]+\s*/, ''); // strip bullet markers
    if (!name) continue;
    const indent = normalizeIndent(line);

    const item: HierarchyItem = { name, indent, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(item);
    } else {
      roots.push(item);
    }
    stack.push(item);
  }

  // Map indent levels to hierarchy: 0=subject, 1=module, 2=topic, 3=subtopic
  // If only 1 level used, treat as subjects
  // If 2 levels, treat as subject > topic
  // etc.
  const maxIndent = Math.max(...lines.map(l => normalizeIndent(l)));

  const levelMap = (indent: number): 'subject' | 'module' | 'topic' | 'subtopic' => {
    if (maxIndent === 0) return 'subject';
    if (maxIndent === 1) {
      if (indent === 0) return 'subject';
      return 'topic';
    }
    if (maxIndent === 2) {
      if (indent === 0) return 'subject';
      if (indent === 1) return 'module';
      return 'topic';
    }
    // 3+ levels
    if (indent === 0) return 'subject';
    if (indent === 1) return 'module';
    if (indent === 2) return 'topic';
    return 'subtopic';
  };

  // Get current max display orders
  const [existingSubjects, existingModules, existingTopics] = await Promise.all([
    supabase.from('subjects').select('display_order').order('display_order', { ascending: false }).limit(1),
    supabase.from('modules').select('display_order').order('display_order', { ascending: false }).limit(1),
    supabase.from('topics').select('display_order').order('display_order', { ascending: false }).limit(1),
  ]);
  let subjectOrder = (existingSubjects.data?.[0]?.display_order ?? -1) + 1;
  let moduleOrder = 0;
  let topicOrder = 0;

  async function processItem(item: HierarchyItem, parentId?: string): Promise<void> {
    const level = levelMap(item.indent);

    if (level === 'subject') {
      const s = await createSubject(item.name, '', subjectOrder++);
      for (const child of item.children) {
        await processItem(child, s.id);
      }
    } else if (level === 'module') {
      const m = await createModule(parentId!, item.name, '', moduleOrder++);
      for (const child of item.children) {
        await processItem(child, m.id);
      }
    } else if (level === 'topic') {
      const t = await createTopic(parentId!, item.name, '', topicOrder++);
      for (const child of item.children) {
        await processSubtopic(child, t.id);
      }
    }
  }

  async function processSubtopic(item: HierarchyItem, topicId: string): Promise<void> {
    const existing = await supabase.from('subtopics').select('display_order').eq('topic_id', topicId).order('display_order', { ascending: false }).limit(1);
    const order = (existing.data?.[0]?.display_order ?? -1) + 1;
    await createSubtopic(topicId, item.name, '', order);
    for (const child of item.children) {
      // Deeper than subtopic - still create as subtopic
      await processSubtopic(child, topicId);
    }
  }

  for (const root of roots) {
    moduleOrder = 0;
    topicOrder = 0;
    await processItem(root);
  }
}
