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
  TopicNote,
  TopicQuestion,
  TopicResource,
  TopicRevision,
  TopicCode,
  TopicHighlight,
  ActivityLogEntry,
  ActivityAction,
  EntityType,
  DeletedItem,
  Tag,
  TopicRelationship,
  RelationshipType,
  RelatedTopic,
  GlobalSearchResult,
  StorageProvider,
  VaultMetadata,
  BackupHistory,
  VaultPackage,
  ImportResult,
} from '../types';

// Re-export types for convenience
export type { StorageProvider, VaultMetadata, BackupHistory, VaultPackage, ImportResult } from '../types';

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

export async function logActivity(entityType: EntityType, entityId: string, entityName: string, action: ActivityAction, details: Record<string, unknown> = {}): Promise<void> {
  await supabase.from('activity_log').insert({ entity_type: entityType, entity_id: entityId, entity_name: entityName, action, details });
}

export async function fetchActivityLog(limit = 20): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchActivityStats(): Promise<{ today: number; week: number; month: number; notes: number; questions: number; resources: number; highlights: number; revisions: number }> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

  const [todayData, weekData, monthData] = await Promise.all([
    supabase.from('activity_log').select('action', { count: 'exact' }).gte('created_at', todayStart),
    supabase.from('activity_log').select('action', { count: 'exact' }).gte('created_at', weekStart),
    supabase.from('activity_log').select('action', { count: 'exact' }).gte('created_at', monthStart),
  ]);

  // Count by action type for timeline
  const [notesData, questionsData, resourcesData, highlightsData, revisionsData] = await Promise.all([
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('action', 'add_note'),
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('action', 'solve'),
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('action', 'add_resource'),
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('action', 'add_highlight'),
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('action', 'revise'),
  ]);

  return {
    today: todayData.count ?? 0,
    week: weekData.count ?? 0,
    month: monthData.count ?? 0,
    notes: notesData.count ?? 0,
    questions: questionsData.count ?? 0,
    resources: resourcesData.count ?? 0,
    highlights: highlightsData.count ?? 0,
    revisions: revisionsData.count ?? 0,
  };
}

export async function fetchContentStats(): Promise<{ notes: number; questions: number; resources: number; highlights: number; revisions: number; codeSnippets: number }> {
  const [notes, questions, resources, highlights, revisions, codeSnippets] = await Promise.all([
    supabase.from('topic_notes').select('id', { count: 'exact', head: true }),
    supabase.from('topic_questions').select('id', { count: 'exact', head: true }),
    supabase.from('topic_resources').select('id', { count: 'exact', head: true }),
    supabase.from('topic_highlights').select('id', { count: 'exact', head: true }),
    supabase.from('topic_revisions').select('id', { count: 'exact', head: true }),
    supabase.from('topic_code').select('id', { count: 'exact', head: true }),
  ]);
  return {
    notes: notes.count ?? 0,
    questions: questions.count ?? 0,
    resources: resources.count ?? 0,
    highlights: highlights.count ?? 0,
    revisions: revisions.count ?? 0,
    codeSnippets: codeSnippets.count ?? 0,
  };
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
  const fns: Partial<Record<EntityType, (id: string) => Promise<any>>> = {
    subject: restoreSubject, module: restoreModule, topic: restoreTopic, subtopic: restoreSubtopic,
  };
  const fn = fns[type];
  if (fn) await fn(id);
}

export async function permanentDeleteItem(id: string, type: EntityType): Promise<void> {
  const fns: Partial<Record<EntityType, (id: string) => Promise<void>>> = {
    subject: permanentDeleteSubject, module: permanentDeleteModule, topic: permanentDeleteTopic, subtopic: permanentDeleteSubtopic,
  };
  const fn = fns[type];
  if (fn) await fn(id);
}

// ─── Export / Import ───────────────────────────────────────────────

export async function exportSyllabusJSON(): Promise<string> {
  const [subjects, modules, topics, subtopics, topicNotes, questions, resources, revisions, code, highlights, notes, tags, relationships] = await Promise.all([
    supabase.from('subjects').select('*'),
    supabase.from('modules').select('*'),
    supabase.from('topics').select('*'),
    supabase.from('subtopics').select('*'),
    supabase.from('topic_notes').select('*'),
    supabase.from('topic_questions').select('*'),
    supabase.from('topic_resources').select('*'),
    supabase.from('topic_revisions').select('*'),
    supabase.from('topic_code').select('*'),
    supabase.from('topic_highlights').select('*'),
    supabase.from('notes').select('*'),
    supabase.from('tags').select('*'),
    supabase.from('topic_relationships').select('*'),
  ]);

  const exportData = {
    version: '1.2',
    exportedAt: new Date().toISOString(),
    subjects: subjects.data ?? [],
    modules: modules.data ?? [],
    topics: topics.data ?? [],
    subtopics: subtopics.data ?? [],
    topic_notes: topicNotes.data ?? [],
    topic_questions: questions.data ?? [],
    topic_resources: resources.data ?? [],
    topic_revisions: revisions.data ?? [],
    topic_code: code.data ?? [],
    topic_highlights: highlights.data ?? [],
    notes: notes.data ?? [],
    tags: tags.data ?? [],
    topic_relationships: relationships.data ?? [],
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
  await supabase.from('topic_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_highlights').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_code').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_revisions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_resources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topic_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('subtopics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
  await insertSafe('topic_notes', data.topic_notes);
  await insertSafe('topic_questions', data.topic_questions);
  await insertSafe('topic_resources', data.topic_resources);
  await insertSafe('topic_revisions', data.topic_revisions);
  await insertSafe('topic_code', data.topic_code);
  await insertSafe('topic_highlights', data.topic_highlights);
  await insertSafe('notes', data.notes);
  await insertSafe('tags', data.tags);
  await insertSafe('topic_relationships', data.topic_relationships);

  return { success: true, message: `Imported ${data.subjects.length} subjects, ${data.modules?.length ?? 0} modules, ${data.topics?.length ?? 0} topics.` };
}

// ─── Topic Workspace ────────────────────────────────────────────

// Topic Notes
export async function fetchTopicNotes(topicId: string): Promise<TopicNote[]> {
  console.log('[VAULT DEBUG] fetchTopicNotes called with topicId:', topicId);
  const { data, error } = await supabase.from('topic_notes').select('*').eq('topic_id', topicId).order('display_order');
  console.log('[VAULT DEBUG] fetchTopicNotes result:', { data, error });
  if (error) throw error;
  return data ?? [];
}

export async function createTopicNote(topicId: string, title: string, content = '', category = 'General', displayOrder = 0): Promise<TopicNote> {
  console.log('[VAULT DEBUG] createTopicNote called:', { topicId, title, content, category, displayOrder });
  const insertPayload = { topic_id: topicId, title, content, category, display_order: displayOrder };
  console.log('[VAULT DEBUG] Insert payload:', insertPayload);
  const { data, error } = await supabase.from('topic_notes').insert(insertPayload).select().single();
  console.log('[VAULT DEBUG] createTopicNote result:', { data, error });
  if (error) throw error;
  return data;
}

export async function updateTopicNote(id: string, updates: Partial<Pick<TopicNote, 'title' | 'content' | 'category' | 'display_order'>>): Promise<TopicNote> {
  const { data, error } = await supabase.from('topic_notes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicNote(id: string): Promise<void> {
  const { error } = await supabase.from('topic_notes').delete().eq('id', id);
  if (error) throw error;
}

// Questions
export async function fetchTopicQuestions(topicId: string): Promise<TopicQuestion[]> {
  const { data, error } = await supabase.from('topic_questions').select('*').eq('topic_id', topicId).order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function createTopicQuestion(topicId: string, question: string, answer = '', difficulty: TopicQuestion['difficulty'] = 'Medium', status: TopicQuestion['status'] = 'Open', displayOrder = 0): Promise<TopicQuestion> {
  const { data, error } = await supabase.from('topic_questions').insert({ topic_id: topicId, question, answer, difficulty, status, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicQuestion(id: string, updates: Partial<Pick<TopicQuestion, 'question' | 'answer' | 'difficulty' | 'status' | 'display_order'>>): Promise<TopicQuestion> {
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

export async function createTopicResource(topicId: string, title: string, url: string, resourceType: TopicResource['resource_type'] = 'Website', description = '', displayOrder = 0): Promise<TopicResource> {
  const { data, error } = await supabase.from('topic_resources').insert({ topic_id: topicId, title, url, resource_type: resourceType, description, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicResource(id: string, updates: Partial<Pick<TopicResource, 'title' | 'url' | 'resource_type' | 'description' | 'display_order'>>): Promise<TopicResource> {
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

export async function createTopicHighlight(topicId: string, content: string, highlightType: TopicHighlight['highlight_type'] = 'Key Concept', displayOrder = 0): Promise<TopicHighlight> {
  const { data, error } = await supabase.from('topic_highlights').insert({ topic_id: topicId, content, highlight_type: highlightType, display_order: displayOrder }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTopicHighlight(id: string, updates: Partial<Pick<TopicHighlight, 'content' | 'highlight_type' | 'display_order'>>): Promise<TopicHighlight> {
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

// ─── Tags ──────────────────────────────────────────────────────

export async function fetchAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createTag(name: string, color = '#6366f1'): Promise<Tag> {
  const { data, error } = await supabase.from('tags').insert({ name: name.toLowerCase().trim(), color }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTag(id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>): Promise<Tag> {
  const { data, error } = await supabase.from('tags').update({ ...updates }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

export async function searchTags(query: string): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').ilike('name', `%${query.toLowerCase()}%`).order('name').limit(20);
  if (error) throw error;
  return data ?? [];
}

// ─── Topic Relationships ─────────────────────────────────────────

export async function fetchTopicRelationships(topicId: string): Promise<RelatedTopic[]> {
  const { data, error } = await supabase
    .from('topic_relationships')
    .select('id, topic_id_a, topic_id_b, relationship_type')
    .or(`topic_id_a.eq.${topicId},topic_id_b.eq.${topicId}`);
  if (error) throw error;

  if (!data || data.length === 0) return [];

  const relatedIds = data.map(r => r.topic_id_a === topicId ? r.topic_id_b : r.topic_id_a);
  const { data: topics } = await supabase.from('topics').select('id, name').in('id', relatedIds);

  const topicMap = new Map((topics ?? []).map(t => [t.id, t.name]));

  return data.map(r => {
    const isA = r.topic_id_a === topicId;
    return {
      id: r.id,
      name: topicMap.get(isA ? r.topic_id_b : r.topic_id_a) || 'Unknown',
      relationship_type: r.relationship_type as RelationshipType,
      related_topic_id: isA ? r.topic_id_b : r.topic_id_a,
    };
  });
}

export async function createTopicRelationship(topicIdA: string, topicIdB: string, relationshipType: RelationshipType = 'related'): Promise<TopicRelationship> {
  const [a, b] = topicIdA < topicIdB ? [topicIdA, topicIdB] : [topicIdB, topicIdA];
  const { data, error } = await supabase.from('topic_relationships').insert({ topic_id_a: a, topic_id_b: b, relationship_type: relationshipType }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTopicRelationship(id: string): Promise<void> {
  const { error } = await supabase.from('topic_relationships').delete().eq('id', id);
  if (error) throw error;
}

export async function searchTopicsForRelationship(query: string, excludeId: string): Promise<{ id: string; name: string; moduleName?: string; subjectName?: string }[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, modules!inner(id, name, subjects!inner(id, name))')
    .ilike('name', `%${query}%`)
    .neq('id', excludeId)
    .is('deleted_at', null)
    .limit(20);
  if (error) throw error;

  return (data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    moduleName: t.modules?.name,
    subjectName: t.modules?.subjects?.name,
  }));
}

// ─── Global Search ──────────────────────────────────────────────

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: GlobalSearchResult[] = [];

  const { data: subjects } = await supabase.from('subjects').select('id, name, tags').ilike('name', `%${q}%`).is('deleted_at', null).limit(10);
  (subjects ?? []).forEach((s: any) => {
    results.push({ type: 'subject', id: s.id, title: s.name, tags: s.tags || [], matchedField: 'name' });
  });

  const { data: modules } = await supabase.from('modules').select('id, name, tags, subjects!inner(name)').ilike('name', `%${q}%`).is('deleted_at', null).limit(10);
  (modules ?? []).forEach((m: any) => {
    results.push({ type: 'module', id: m.id, title: m.name, tags: m.tags || [], matchedField: 'name', parentPath: m.subjects?.name });
  });

  const { data: topics } = await supabase.from('topics').select('id, name, tags, modules!inner(name, subjects!inner(name))').ilike('name', `%${q}%`).is('deleted_at', null).limit(10);
  (topics ?? []).forEach((t: any) => {
    results.push({ type: 'topic', id: t.id, title: t.name, tags: t.tags || [], matchedField: 'name', parentPath: `${t.modules?.subjects?.name} > ${t.modules?.name}` });
  });

  const { data: subtopics } = await supabase.from('subtopics').select('id, name, tags, topics!inner(name, modules!inner(name, subjects!inner(name)))').ilike('name', `%${q}%`).is('deleted_at', null).limit(10);
  (subtopics ?? []).forEach((st: any) => {
    results.push({ type: 'subtopic', id: st.id, title: st.name, tags: st.tags || [], matchedField: 'name', parentPath: `${st.topics?.modules?.subjects?.name} > ${st.topics?.modules?.name} > ${st.topics?.name}` });
  });

  const { data: notes } = await supabase.from('topic_notes').select('id, title, tags, topic_id, topics!inner(name)').or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(10);
  (notes ?? []).forEach((n: any) => {
    results.push({ type: 'note', id: n.id, title: n.title || 'Untitled Note', subtitle: n.topics?.name, tags: n.tags || [], matchedField: 'content' });
  });

  const { data: questions } = await supabase.from('topic_questions').select('id, question, tags, topic_id, topics!inner(name)').ilike('question', `%${q}%`).limit(10);
  (questions ?? []).forEach((qItem: any) => {
    results.push({ type: 'question', id: qItem.id, title: qItem.question, subtitle: qItem.topics?.name, tags: qItem.tags || [], matchedField: 'question' });
  });

  const { data: resources } = await supabase.from('topic_resources').select('id, title, url, tags, topic_id, topics!inner(name)').or(`title.ilike.%${q}%,url.ilike.%${q}%`).limit(10);
  (resources ?? []).forEach((r: any) => {
    results.push({ type: 'resource', id: r.id, title: r.title, subtitle: r.topics?.name, tags: r.tags || [], matchedField: 'title' });
  });

  const { data: highlights } = await supabase.from('topic_highlights').select('id, content, tags, highlight_type, topic_id, topics!inner(name)').ilike('content', `%${q}%`).limit(10);
  (highlights ?? []).forEach((h: any) => {
    results.push({ type: 'highlight', id: h.id, title: h.content.slice(0, 60) + (h.content.length > 60 ? '...' : ''), subtitle: `${h.highlight_type} - ${h.topics?.name}`, tags: h.tags || [], matchedField: 'content' });
  });

  return results;
}

// ─── Tag Statistics ─────────────────────────────────────────────

export async function fetchMostUsedTags(limit = 10): Promise<{ name: string; count: number }[]> {
  const { data: topicTags } = await supabase.from('topics').select('tags').is('deleted_at', null);
  const { data: noteTags } = await supabase.from('topic_notes').select('tags');
  const { data: questionTags } = await supabase.from('topic_questions').select('tags');
  const { data: resourceTags } = await supabase.from('topic_resources').select('tags');
  const { data: highlightTags } = await supabase.from('topic_highlights').select('tags');

  const tagCounts: Record<string, number> = {};

  const countTags = (items: any[] | null) => {
    (items ?? []).forEach(item => {
      (item.tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
  };

  countTags(topicTags);
  countTags(noteTags);
  countTags(questionTags);
  countTags(resourceTags);
  countTags(highlightTags);

  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function fetchRecentlyUpdatedTopics(limit = 5): Promise<{ id: string; name: string; subjectName: string; updated_at: string }[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, updated_at, modules!inner(name, subjects!inner(name))')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    subjectName: t.modules?.subjects?.name || '',
    updated_at: t.updated_at,
  }));
}

export async function fetchMostReferencedTopics(limit = 5): Promise<{ id: string; name: string; subjectName: string; referenceCount: number }[]> {
  const { data, error } = await supabase
    .from('topic_relationships')
    .select('topic_id_a, topic_id_b, topics_a:topics!topic_relationships_topic_id_a_fkey(id, name, modules!inner(name, subjects!inner(name))), topics_b:topics!topic_relationships_topic_id_b_fkey(id, name, modules!inner(name, subjects!inner(name)))');
  if (error) throw error;

  const counts: Record<string, { name: string; subjectName: string; count: number }> = {};

  (data ?? []).forEach((r: any) => {
    const idA = r.topic_id_a;
    const idB = r.topic_id_b;

    if (!counts[idA] && r.topics_a) {
      counts[idA] = { name: r.topics_a.name, subjectName: r.topics_a.modules?.subjects?.name || '', count: 0 };
    }
    if (!counts[idB] && r.topics_b) {
      counts[idB] = { name: r.topics_b.name, subjectName: r.topics_b.modules?.subjects?.name || '', count: 0 };
    }

    if (counts[idA]) counts[idA].count++;
    if (counts[idB]) counts[idB].count++;
  });

  return Object.entries(counts)
    .map(([id, data]) => ({ id, ...data, referenceCount: data.count }))
    .sort((a, b) => b.referenceCount - a.referenceCount)
    .slice(0, limit);
}

// ─── Storage Providers ─────────────────────────────────────────────

export async function fetchStorageProviders(): Promise<StorageProvider[]> {
  const { data, error } = await supabase.from('storage_providers').select('*').order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function createStorageProvider(provider: Partial<StorageProvider>): Promise<StorageProvider> {
  const { data, error } = await supabase.from('storage_providers').insert(provider).select().single();
  if (error) throw error;
  return data;
}

export async function updateStorageProvider(id: string, updates: Partial<StorageProvider>): Promise<StorageProvider> {
  const { data, error } = await supabase.from('storage_providers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStorageProvider(id: string): Promise<void> {
  const { error } = await supabase.from('storage_providers').delete().eq('id', id);
  if (error) throw error;
}

export async function setDefaultStorageProvider(id: string): Promise<void> {
  // First, unset all defaults
  await supabase.from('storage_providers').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  // Then set the selected one
  await supabase.from('storage_providers').update({ is_default: true }).eq('id', id);
}

// ─── Vault Metadata ────────────────────────────────────────────────

export async function fetchVaultMetadata(): Promise<VaultMetadata[]> {
  const { data, error } = await supabase.from('vault_metadata').select('*').order('key');
  if (error) throw error;
  return data ?? [];
}

export async function getVaultMetadataValue(key: string): Promise<string | null> {
  const { data, error } = await supabase.from('vault_metadata').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ? String(data.value) : null;
}

export async function setVaultMetadataValue(key: string, value: string): Promise<void> {
  await supabase.from('vault_metadata').upsert({ key, value: JSON.parse(value) }, { onConflict: 'key' });
}

// ─── Backup History ─────────────────────────────────────────────────

export async function fetchBackupHistory(limit = 20): Promise<BackupHistory[]> {
  const { data, error } = await supabase.from('backup_history').select('*').order('started_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createBackupRecord(backupType: 'manual' | 'daily' | 'weekly' | 'monthly'): Promise<string> {
  const { data, error } = await supabase.from('backup_history').insert({ backup_type: backupType, status: 'pending' }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function updateBackupRecord(id: string, updates: Partial<BackupHistory>): Promise<void> {
  await supabase.from('backup_history').update(updates).eq('id', id);
}

// ─── Complete Vault Package Export ──────────────────────────────────

async function computeChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function exportVaultPackage(): Promise<{ json: string; filename: string; checksum: string }> {
  const startTime = performance.now();
  const warnings: string[] = [];

  const [
    subjects, modules, topics, subtopics,
    topicNotes, questions, resources, revisions, code, highlights,
    notes, tags, relationships, storageProviders,
    journalEntries, codeSnippets, papers, projects, roadmapItems, bookmarks, quickNotes, streakDays,
    activityLog
  ] = await Promise.all([
    supabase.from('subjects').select('*'),
    supabase.from('modules').select('*'),
    supabase.from('topics').select('*'),
    supabase.from('subtopics').select('*'),
    supabase.from('topic_notes').select('*'),
    supabase.from('topic_questions').select('*'),
    supabase.from('topic_resources').select('*'),
    supabase.from('topic_revisions').select('*'),
    supabase.from('topic_code').select('*'),
    supabase.from('topic_highlights').select('*'),
    supabase.from('notes').select('*'),
    supabase.from('tags').select('*'),
    supabase.from('topic_relationships').select('*'),
    supabase.from('storage_providers').select('*'),
    supabase.from('journal_entries').select('*'),
    supabase.from('code_snippets').select('*'),
    supabase.from('research_papers').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('roadmap_items').select('*'),
    supabase.from('bookmarks').select('*'),
    supabase.from('quick_notes').select('*'),
    supabase.from('streak_tracker').select('*'),
    supabase.from('activity_log').select('*'),
  ]);

  const entityCounts = {
    subjects: subjects.data?.length ?? 0,
    modules: modules.data?.length ?? 0,
    topics: topics.data?.length ?? 0,
    subtopics: subtopics.data?.length ?? 0,
    topic_notes: topicNotes.data?.length ?? 0,
    topic_questions: questions.data?.length ?? 0,
    topic_resources: resources.data?.length ?? 0,
    topic_revisions: revisions.data?.length ?? 0,
    topic_code: code.data?.length ?? 0,
    topic_highlights: highlights.data?.length ?? 0,
    notes: notes.data?.length ?? 0,
    tags: tags.data?.length ?? 0,
    topic_relationships: relationships.data?.length ?? 0,
    storage_providers: storageProviders.data?.length ?? 0,
    journal_entries: journalEntries.data?.length ?? 0,
    code_snippets: codeSnippets.data?.length ?? 0,
    research_papers: papers.data?.length ?? 0,
    projects: projects.data?.length ?? 0,
    roadmap_items: roadmapItems.data?.length ?? 0,
    bookmarks: bookmarks.data?.length ?? 0,
    quick_notes: quickNotes.data?.length ?? 0,
    streak_tracker: streakDays.data?.length ?? 0,
    activity_log: activityLog.data?.length ?? 0,
  };

  const totalEntities = Object.values(entityCounts).reduce((a, b) => a + b, 0);

  const vaultPackage: VaultPackage = {
    version: '2.0',
    schema_version: '1.3',
    exported_at: new Date().toISOString(),
    exported_by: 'Learning Vault',
    app_name: 'Learning Vault',
    checksum: '',
    encryption: 'none',
    compression: 'zip',
    entities: {
      subjects: subjects.data ?? [],
      modules: modules.data ?? [],
      topics: topics.data ?? [],
      subtopics: subtopics.data ?? [],
      topic_notes: topicNotes.data ?? [],
      topic_questions: questions.data ?? [],
      topic_resources: resources.data ?? [],
      topic_revisions: revisions.data ?? [],
      topic_code: code.data ?? [],
      topic_highlights: highlights.data ?? [],
      notes: notes.data ?? [],
      tags: tags.data ?? [],
      topic_relationships: relationships.data ?? [],
      storage_providers: storageProviders.data ?? [],
      journal_entries: journalEntries.data ?? [],
      code_snippets: codeSnippets.data ?? [],
      research_papers: papers.data ?? [],
      projects: projects.data ?? [],
      roadmap_items: roadmapItems.data ?? [],
      bookmarks: bookmarks.data ?? [],
      quick_notes: quickNotes.data ?? [],
      streak_tracker: streakDays.data ?? [],
      activity_log: activityLog.data ?? [],
    },
    metadata: {
      total_entities: totalEntities,
      entity_counts: entityCounts,
      vault_version: '2.0',
      export_duration_ms: Math.round(performance.now() - startTime),
      warnings,
    },
  };

  const json = JSON.stringify(vaultPackage, null, 2);
  const checksum = await computeChecksum(json);
  vaultPackage.checksum = checksum;

  const finalJson = JSON.stringify(vaultPackage, null, 2);
  const finalChecksum = await computeChecksum(finalJson);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `learning-vault-${dateStr}.json`;

  return { json: finalJson, filename, checksum: finalChecksum };
}

// ─── Complete Vault Package Import ──────────────────────────────────

export async function importVaultPackage(json: string): Promise<ImportResult> {
  const startTime = performance.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  const importedCounts: Record<string, number> = {};

  let data: VaultPackage;
  try {
    data = JSON.parse(json);
  } catch {
    return { success: false, message: 'Invalid JSON file.', imported_counts: {}, warnings: [], errors: ['Failed to parse JSON'], duration_ms: Math.round(performance.now() - startTime) };
  }

  // Validate structure
  if (!data.version || !data.exported_at) {
    return { success: false, message: 'Invalid vault package. Missing version or export date.', imported_counts: {}, warnings: [], errors: ['Missing required fields'], duration_ms: Math.round(performance.now() - startTime) };
  }

  if (data.app_name !== 'Learning Vault') {
    warnings.push('This backup was exported from a different application or version.');
  }

  const tables = [
    { name: 'topic_relationships', data: data.entities.topic_relationships },
    { name: 'topic_highlights', data: data.entities.topic_highlights },
    { name: 'topic_code', data: data.entities.topic_code },
    { name: 'topic_revisions', data: data.entities.topic_revisions },
    { name: 'topic_resources', data: data.entities.topic_resources },
    { name: 'topic_questions', data: data.entities.topic_questions },
    { name: 'topic_notes', data: data.entities.topic_notes },
    { name: 'subtopics', data: data.entities.subtopics },
    { name: 'topics', data: data.entities.topics },
    { name: 'modules', data: data.entities.modules },
    { name: 'subjects', data: data.entities.subjects },
    { name: 'tags', data: data.entities.tags },
    { name: 'notes', data: data.entities.notes },
    { name: 'storage_providers', data: data.entities.storage_providers },
    { name: 'journal_entries', data: data.entities.journal_entries },
    { name: 'code_snippets', data: data.entities.code_snippets },
    { name: 'research_papers', data: data.entities.research_papers },
    { name: 'projects', data: data.entities.projects },
    { name: 'roadmap_items', data: data.entities.roadmap_items },
    { name: 'bookmarks', data: data.entities.bookmarks },
    { name: 'quick_notes', data: data.entities.quick_notes },
    { name: 'streak_tracker', data: data.entities.streak_tracker },
    { name: 'activity_log', data: data.entities.activity_log },
  ];

  // Clear existing data
  for (const t of tables) {
    await supabase.from(t.name).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Insert new data
  const insertSafe = async (table: string, items: any[]) => {
    if (!items?.length) return 0;
    try {
      const { error } = await supabase.from(table).insert(items);
      if (error) {
        errors.push(`Failed to insert into ${table}: ${error.message}`);
        return 0;
      }
      return items.length;
    } catch (e) {
      errors.push(`Exception inserting into ${table}`);
      return 0;
    }
  };

  // Insert in dependency order
  importedCounts.storage_providers = await insertSafe('storage_providers', data.entities.storage_providers);
  importedCounts.subjects = await insertSafe('subjects', data.entities.subjects);
  importedCounts.modules = await insertSafe('modules', data.entities.modules);
  importedCounts.topics = await insertSafe('topics', data.entities.topics);
  importedCounts.subtopics = await insertSafe('subtopics', data.entities.subtopics);
  importedCounts.topic_notes = await insertSafe('topic_notes', data.entities.topic_notes);
  importedCounts.topic_questions = await insertSafe('topic_questions', data.entities.topic_questions);
  importedCounts.topic_resources = await insertSafe('topic_resources', data.entities.topic_resources);
  importedCounts.topic_revisions = await insertSafe('topic_revisions', data.entities.topic_revisions);
  importedCounts.topic_code = await insertSafe('topic_code', data.entities.topic_code);
  importedCounts.topic_highlights = await insertSafe('topic_highlights', data.entities.topic_highlights);
  importedCounts.notes = await insertSafe('notes', data.entities.notes);
  importedCounts.tags = await insertSafe('tags', data.entities.tags);
  importedCounts.topic_relationships = await insertSafe('topic_relationships', data.entities.topic_relationships);
  importedCounts.journal_entries = await insertSafe('journal_entries', data.entities.journal_entries);
  importedCounts.code_snippets = await insertSafe('code_snippets', data.entities.code_snippets);
  importedCounts.research_papers = await insertSafe('research_papers', data.entities.research_papers);
  importedCounts.projects = await insertSafe('projects', data.entities.projects);
  importedCounts.roadmap_items = await insertSafe('roadmap_items', data.entities.roadmap_items);
  importedCounts.bookmarks = await insertSafe('bookmarks', data.entities.bookmarks);
  importedCounts.quick_notes = await insertSafe('quick_notes', data.entities.quick_notes);
  importedCounts.streak_tracker = await insertSafe('streak_tracker', data.entities.streak_tracker);
  importedCounts.activity_log = await insertSafe('activity_log', data.entities.activity_log);

  const totalImported = Object.values(importedCounts).reduce((a, b) => a + b, 0);

  return {
    success: errors.length === 0,
    message: `Imported ${totalImported} entities from vault package v${data.version}`,
    imported_counts: importedCounts,
    warnings,
    errors,
    duration_ms: Math.round(performance.now() - startTime),
  };
}
