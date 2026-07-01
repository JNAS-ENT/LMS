import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Pin, Star, Archive, RotateCcw, ExternalLink,
  FileText, FileCode, FileSpreadsheet, FileImage, FileVideo, FileArchive,
  Music, Sparkles, Clock, History, Search,
  Brain, BookOpen, HelpCircle, ListChecks, BarChart3,
  Link as LinkIcon, Youtube, Github, BookMarked, FolderOpen,
  TrendingUp, Award, CheckCircle2, AlertCircle, Download,
} from 'lucide-react';
import type {
  SyllabusNode, Topic, Subtopic, TopicNote, TopicNoteVersion, TopicQuestion,
  TopicResource, TopicRevision, TopicAttachment, TopicAIHistory, TopicBookmark,
  LearningStatus, Difficulty, QuestionStatus, ResourceType, QuestionType,
  AttachmentType, AIAction, TopicBookmarkCategory, NoteColorLabel,
} from '../types';
import {
  fetchTopicNotes, createTopicNote, updateTopicNote, softDeleteTopicNote,
  fetchNoteVersions, createNoteVersion, restoreNoteVersion,
  fetchTopicQuestions, createTopicQuestion, updateTopicQuestion, deleteTopicQuestion,
  fetchTopicResources, createTopicResource, deleteTopicResource,
  fetchTopicRevisions, createTopicRevision, deleteTopicRevision,
  fetchTopicAttachments, createTopicAttachment, deleteTopicAttachment,
  fetchTopicAIHistory, createTopicAIHistory, deleteTopicAIHistory,
  fetchTopicBookmarks, createTopicBookmark, deleteTopicBookmark,
  detectAndSetStatus, computeSpacedRepetitionInterval,
  exportTopicMarkdown, exportTopicCSV,
} from '../services/vault';
import { callAIAssistant } from '../services/ai';
import MarkdownEditor from './MarkdownEditor';

const STATUS_OPTIONS: LearningStatus[] = ['Not Started', 'Learning', 'Practicing', 'Completed', 'Revised', 'Mastered'];
const STATUS_COLORS: Record<LearningStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600', Learning: 'bg-blue-100 text-blue-700',
  Practicing: 'bg-amber-100 text-amber-700', Completed: 'bg-emerald-100 text-emerald-700',
  Revised: 'bg-violet-100 text-violet-700', Mastered: 'bg-green-100 text-green-700',
};
const DIFFICULTY_COLORS: Record<Difficulty, string> = { Easy: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-red-100 text-red-700' };
const QUESTION_STATUS_COLORS: Record<QuestionStatus, string> = { Open: 'bg-gray-100 text-gray-700', Researching: 'bg-blue-100 text-blue-700', Solved: 'bg-emerald-100 text-emerald-700' };
const QUESTION_TYPES: QuestionType[] = ['Theory', 'MCQ', 'Coding', 'Interview', 'Practice'];
const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  Theory: 'bg-blue-100 text-blue-700', MCQ: 'bg-violet-100 text-violet-700',
  Coding: 'bg-emerald-100 text-emerald-700', Interview: 'bg-amber-100 text-amber-700',
  Practice: 'bg-cyan-100 text-cyan-700',
};
const RESOURCE_TYPES: ResourceType[] = ['Website', 'Google Drive', 'PDF', 'YouTube', 'GitHub', 'Dataset', 'Research Paper'];
const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  'Google Drive': <FolderOpen size={14} />, PDF: <FileText size={14} />,
  YouTube: <Youtube size={14} />, GitHub: <Github size={14} />,
  Website: <LinkIcon size={14} />, Dataset: <FileSpreadsheet size={14} />,
  'Research Paper': <FileText size={14} />,
};
const ATTACHMENT_TYPES: AttachmentType[] = ['PDF', 'PPT', 'DOCX', 'Excel', 'Image', 'Audio', 'Video', 'ZIP'];
const ATTACHMENT_ICONS: Record<AttachmentType, React.ReactNode> = {
  PDF: <FileText size={16} />, PPT: <FileCode size={16} />, DOCX: <FileText size={16} />,
  Excel: <FileSpreadsheet size={16} />, Image: <FileImage size={16} />,
  Audio: <Music size={16} />, Video: <FileVideo size={16} />, ZIP: <FileArchive size={16} />,
};
const BOOKMARK_CATEGORIES: TopicBookmarkCategory[] = ['Link', 'YouTube', 'GitHub', 'Documentation', 'Research Paper', 'Google Drive'];
const BOOKMARK_ICONS: Record<TopicBookmarkCategory, React.ReactNode> = {
  Link: <LinkIcon size={14} />, YouTube: <Youtube size={14} />, GitHub: <Github size={14} />,
  Documentation: <BookOpen size={14} />, 'Research Paper': <FileText size={14} />,
  'Google Drive': <FolderOpen size={14} />,
};
const COLOR_LABELS: NoteColorLabel[] = ['none', 'yellow', 'green', 'blue', 'pink', 'orange', 'purple'];
const COLOR_LABEL_BG: Record<NoteColorLabel, string> = {
  none: 'bg-white', yellow: 'bg-amber-50 border-amber-200', green: 'bg-emerald-50 border-emerald-200',
  blue: 'bg-blue-50 border-blue-200', pink: 'bg-pink-50 border-pink-200',
  orange: 'bg-orange-50 border-orange-200', purple: 'bg-violet-50 border-violet-200',
};

const AI_ACTIONS: { action: AIAction; label: string; icon: React.ReactNode; desc: string }[] = [
  { action: 'summarize', label: 'Summarize Topic', icon: <FileText size={14} />, desc: 'Condensed key points' },
  { action: 'explain', label: 'Explain Simply', icon: <Brain size={14} />, desc: 'Plain-English breakdown' },
  { action: 'interview', label: 'Interview Questions', icon: <HelpCircle size={14} />, desc: 'Likely interview Qs' },
  { action: 'mcqs', label: 'Generate MCQs', icon: <ListChecks size={14} />, desc: 'Multiple-choice quiz' },
  { action: 'flashcards', label: 'Flash Cards', icon: <BookMarked size={14} />, desc: 'Active recall cards' },
  { action: 'revision_notes', label: 'Revision Notes', icon: <RotateCcw size={14} />, desc: 'Exam-focused review' },
  { action: 'missing_topics', label: 'Find Missing Topics', icon: <AlertCircle size={14} />, desc: 'Gaps in coverage' },
  { action: 'learning_path', label: 'Next Learning Path', icon: <TrendingUp size={14} />, desc: 'Suggested study plan' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function wordCount(text: string) { return text.trim() ? text.trim().split(/\s+/).length : 0; }

function Spinner() {
  return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;
}

// ─── Overview Tab ───────────────────────────────────────────────
export function OverviewTab({ node, onUpdate, onNavigate }: { node: SyllabusNode; onUpdate: () => void; onNavigate?: (tab: string) => void }) {
  const data = node.data as Topic | Subtopic;
  const [name, setName] = useState(data.name);
  const [desc, setDesc] = useState(data.description);
  const [status, setStatus] = useState<LearningStatus>(data.status);
  const [progress, setProgress] = useState(data.progress);
  const [editingName, setEditingName] = useState(false);
  const [stats, setStats] = useState({ notes: 0, questions: 0, resources: 0, revisions: 0, attachments: 0, bookmarks: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setName(data.name); setDesc(data.description); setStatus(data.status); setProgress(data.progress); setEditingName(false);
  }, [data.id, data.name, data.description, data.status, data.progress]);

  useEffect(() => {
    (async () => {
      const isSubtopic = node.level === 'subtopic';
      const [n, q, r, rev, a, b] = await Promise.all([
        fetchTopicNotes(node.data.id, isSubtopic).catch(() => []),
        fetchTopicQuestions(node.data.id, isSubtopic).catch(() => []),
        fetchTopicResources(node.data.id, isSubtopic).catch(() => []),
        fetchTopicRevisions(node.data.id, isSubtopic).catch(() => []),
        fetchTopicAttachments(node.data.id, isSubtopic).catch(() => []),
        fetchTopicBookmarks(node.data.id, isSubtopic).catch(() => []),
      ]);
      setStats({ notes: n.length, questions: q.length, resources: r.length, revisions: rev.length, attachments: a.length, bookmarks: b.length });
    })();
  }, [node.data.id]);

  const autoSave = useCallback((field: string, value: string | number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const fn = node.level === 'topic' ? (await import('../services/vault')).updateTopic : (await import('../services/vault')).updateSubtopic;
      await fn(node.data.id, { [field]: value });
      onUpdate();
    }, 400);
  }, [node.level, node.data.id, onUpdate]);

  const handleStatusChange = async (val: LearningStatus) => {
    setStatus(val);
    const pm: Record<string, number> = { 'Not Started': 0, Learning: 25, Practicing: 50, Completed: 75, Revised: 85, Mastered: 100 };
    const np = Math.max(progress, pm[val] ?? 0);
    setProgress(np);
    const { updateTopic, updateSubtopic } = await import('../services/vault');
    const fn = node.level === 'topic' ? updateTopic : updateSubtopic;
    await fn(node.data.id, { status: val, progress: np });
    onUpdate();
  };

  const commitName = async () => {
    setEditingName(false);
    const t = name.trim();
    if (t && t !== data.name) {
      const { updateTopic, updateSubtopic } = await import('../services/vault');
      const fn = node.level === 'topic' ? updateTopic : updateSubtopic;
      await fn(node.data.id, { name: t }); onUpdate();
    } else setName(data.name);
  };

  const handleExportMarkdown = async () => {
    const md = await exportTopicMarkdown(node.data.id, name);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const csv = await exportTopicCSV(node.data.id);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-notes.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        {editingName ? (
          <input value={name} onChange={e => setName(e.target.value)} onBlur={commitName} onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setName(data.name); setEditingName(false); } }} className="text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-300 w-full" autoFocus />
        ) : (
          <div className="flex items-center gap-2 group">
            <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
            <button onClick={() => setEditingName(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={13} /></button>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{node.level}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Notes', value: stats.notes, icon: <FileText size={14} />, color: 'text-blue-600' },
          { label: 'Questions', value: stats.questions, icon: <HelpCircle size={14} />, color: 'text-amber-600' },
          { label: 'Resources', value: stats.resources, icon: <LinkIcon size={14} />, color: 'text-cyan-600' },
          { label: 'Revisions', value: stats.revisions, icon: <RotateCcw size={14} />, color: 'text-violet-600' },
          { label: 'Attachments', value: stats.attachments, icon: <FileArchive size={14} />, color: 'text-emerald-600' },
          { label: 'Bookmarks', value: stats.bookmarks, icon: <BookMarked size={14} />, color: 'text-pink-600' },
        ].map(s => (
          <button key={s.label} onClick={() => onNavigate?.(s.label.toLowerCase())} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100 hover:border-gray-300 transition-colors">
            <div className={`flex items-center justify-center mb-0.5 ${s.color}`}>{s.icon}</div>
            <p className="text-lg font-semibold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${status === s ? STATUS_COLORS[s] + ' ring-1 ring-current/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 flex justify-between"><span>Progress</span><span className="text-gray-700">{progress}%</span></label>
        <input type="range" min={0} max={100} step={5} value={progress} onChange={e => { setProgress(Number(e.target.value)); autoSave('progress', Number(e.target.value)); }} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900" />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
        <textarea value={desc} onChange={e => { setDesc(e.target.value); autoSave('description', e.target.value); }} placeholder="Add a description..." className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Export Topic</label>
        <div className="flex gap-2">
          <button onClick={handleExportMarkdown} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"><Download size={12} /> Markdown</button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"><Download size={12} /> CSV</button>
        </div>
      </div>
    </div>
  );
}

// ─── Notes Tab (Timeline View) ──────────────────────────────────
export function NotesTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [notes, setNotes] = useState<TopicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newColor, setNewColor] = useState<NoteColorLabel>('none');
  const [showArchived, setShowArchived] = useState(false);
  const [historyNoteId, setHistoryNoteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadNotes = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      const fetched = await fetchTopicNotes(node.data.id, isSubtopic);
      setNotes(fetched);
    } catch { setNotes([]); }
    setLoading(false);
  };

  useEffect(() => { loadNotes(); }, [node.data.id]);

  const handleAdd = async () => {
    console.log('[NOTE] Step 1 - saveNote entered');
    const topicId = node.data.id;
    const isSubtopic = node.level === 'subtopic';
    if (!newTitle.trim()) {
      console.log('[NOTE] Validation FAILED - empty title');
      return;
    }
    console.log('[NOTE] Step 2 - Validation passed');
    console.log('[NOTE] Step 3 - Topic ID:', topicId, 'Is Subtopic:', isSubtopic);
    console.log('[NOTE] Step 4 - Note payload preparing');
    console.log('[NOTE] Step 5 - Executing Supabase insert/update');
    try {
      const createdNote = await createTopicNote(topicId, newTitle, newContent, newCategory, 0, isSubtopic);
      console.log('[NOTE] Step 6 - Supabase response:', createdNote);
      if (newColor !== 'none') {
        await updateTopicNote(createdNote.id, { color_label: newColor });
      }
      setNewTitle(''); setNewContent(''); setNewCategory('General'); setNewColor('none'); setAdding(false);
      console.log('[NOTE] Step 7 - Refreshing notes list');
      await loadNotes();
      if (node.level === 'topic') detectAndSetStatus(topicId);
      onUpdate();
      console.log('[NOTE] Step 8 - Save complete');
    } catch (error) {
      console.error('[NOTE ERROR]', error);
    }
  };

  const handleAutoSave = (id: string, field: 'title' | 'content' | 'category', value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // Create a version snapshot before saving if content changed
      if (field === 'content') {
        const note = notes.find(n => n.id === id);
        if (note) {
          const versions = await fetchNoteVersions(id);
          const nextVer = (versions[0]?.version_number ?? 0) + 1;
          await createNoteVersion(id, { title: note.title, content: note.content, category: note.category, tags: note.tags, version_number: nextVer });
        }
      }
      await updateTopicNote(id, { [field]: value });
      loadNotes();
    }, 800);
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    await updateTopicNote(id, { pinned: !pinned });
    loadNotes();
  };
  const handleToggleFavorite = async (id: string, favorite: boolean) => {
    await updateTopicNote(id, { favorite: !favorite });
    loadNotes();
  };
  const handleToggleArchive = async (id: string, archived: boolean) => {
    await updateTopicNote(id, { archived: !archived });
    loadNotes();
  };
  const handleColorChange = async (id: string, color: NoteColorLabel) => {
    await updateTopicNote(id, { color_label: color });
    loadNotes();
  };
  const handleDelete = async (id: string) => {
    await softDeleteTopicNote(id);
    loadNotes();
    onUpdate();
  };

  // Group notes by date for timeline
  const filtered = notes.filter(n => {
    if (filter && !n.title.toLowerCase().includes(filter.toLowerCase()) && !n.content.toLowerCase().includes(filter.toLowerCase())) return false;
    if (!showArchived && n.archived) return false;
    return true;
  });
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);
  const sorted = [...pinned, ...unpinned];
  const visible = sorted.slice(0, visibleCount);

  const grouped: { date: string; items: TopicNote[] }[] = [];
  for (const n of visible) {
    const dateKey = new Date(n.created_at).toDateString();
    const g = grouped.find(g => g.date === dateKey);
    if (g) g.items.push(n);
    else grouped.push({ date: dateKey, items: [n] });
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {historyNoteId && <VersionHistoryModal noteId={historyNoteId} onClose={() => setHistoryNoteId(null)} onRestored={() => { loadNotes(); }} />}

      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes ({notes.length})</label>
          <button onClick={() => setShowArchived(!showArchived)} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${showArchived ? 'bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
        </div>
        <button onClick={() => { console.log('[NOTE] Step 0 - Add Note clicked'); setAdding(true); }} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"><Plus size={12} /> Add Note</button>
      </div>

      {notes.length > 5 && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter notes..." className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
      )}

      {adding && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-4 overflow-hidden" onAnimationComplete={() => console.log('[NOTE] Step 1 - Editor opened')}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Note title" className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <MarkdownEditor value={newContent} onChange={setNewContent} placeholder="Write your notes in Markdown..." minHeight="160px" />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-1 focus:outline-none">
              <option>General</option><option>Concept</option><option>Example</option><option>Reference</option><option>Summary</option>
            </select>
            <div className="flex items-center gap-1">
              {COLOR_LABELS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} title={c} className={`w-4 h-4 rounded-full border-2 transition-all ${newColor === c ? 'border-gray-900 scale-110' : 'border-gray-200'} ${COLOR_LABEL_BG[c]}`} />
              ))}
            </div>
            <button onClick={() => { console.log('[NOTE] Step 0 - Save button clicked'); handleAdd(); }} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </motion.div>
      )}

      {sorted.length === 0 && !adding ? (
        <div className="text-center py-8">
          <FileText size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 mb-1">{filter ? 'No notes match your filter' : 'No notes yet'}</p>
          <p className="text-xs text-gray-400">Click "Add Note" to create your first note for this topic</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-1 z-10">
                <h3 className="text-sm font-semibold text-gray-700">{formatDate(group.items[0].created_at)}</h3>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map(n => (
                  <NoteCard key={n.id} note={n} editing={editingId === n.id}
                    onEdit={() => setEditingId(n.id)} onDone={() => setEditingId(null)}
                    onSave={handleAutoSave} onDelete={handleDelete}
                    onTogglePin={() => handleTogglePin(n.id, n.pinned)}
                    onToggleFavorite={() => handleToggleFavorite(n.id, n.favorite)}
                    onToggleArchive={() => handleToggleArchive(n.id, n.archived)}
                    onColorChange={(c) => handleColorChange(n.id, c)}
                    onShowHistory={() => setHistoryNoteId(n.id)}
                    onUpdateField={(field, val) => { setNotes(notes.map(x => x.id === n.id ? { ...x, [field]: val } : x)); }}
                  />
                ))}
              </div>
            </div>
          ))}
          {visibleCount < sorted.length && (
            <button onClick={() => setVisibleCount(visibleCount + 20)} className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              Load {Math.min(20, sorted.length - visibleCount)} more notes
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, editing, onEdit, onDone, onSave, onDelete, onTogglePin, onToggleFavorite, onToggleArchive, onColorChange, onShowHistory, onUpdateField }: {
  note: TopicNote; editing: boolean; onEdit: () => void; onDone: () => void;
  onSave: (id: string, field: 'title' | 'content' | 'category', value: string) => void;
  onDelete: (id: string) => void; onTogglePin: () => void; onToggleFavorite: () => void;
  onToggleArchive: () => void; onColorChange: (c: NoteColorLabel) => void;
  onShowHistory: () => void; onUpdateField: (field: string, val: any) => void;
}) {
  const [showColors, setShowColors] = useState(false);
  return (
    <div className={`rounded-lg p-3 border transition-colors ${COLOR_LABEL_BG[note.color_label]} ${note.pinned ? 'ring-1 ring-gray-300' : 'border-gray-200'} hover:border-gray-300`}>
      {editing ? (
        <div className="space-y-2">
          <input value={note.title} onChange={e => { onUpdateField('title', e.target.value); onSave(note.id, 'title', e.target.value); }} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <MarkdownEditor value={note.content} onChange={(v) => { onUpdateField('content', v); onSave(note.id, 'content', v); }} minHeight="200px" />
          <div className="flex items-center justify-between">
            <select value={note.category} onChange={e => { onUpdateField('category', e.target.value); onSave(note.id, 'category', e.target.value); }} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-1 focus:outline-none">
              <option>General</option><option>Concept</option><option>Example</option><option>Reference</option><option>Summary</option>
            </select>
            <button onClick={onDone} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Done</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {note.pinned && <Pin size={11} className="text-gray-500 fill-gray-400" />}
                {note.favorite && <Star size={11} className="text-amber-400 fill-amber-400" />}
                <h4 className="text-sm font-medium text-gray-900 truncate">{note.title}</h4>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{note.category}</span>
                {note.archived && <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-full">Archived</span>}
              </div>
              {note.content && (
                <div className="text-xs text-gray-600 mt-1 prose prose-xs max-w-none line-clamp-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5"><Clock size={10} />{formatTime(note.created_at)}</span>
                <span>{wordCount(note.content)} words</span>
                <span>by {note.author}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 mt-2 -mb-1">
            <button onClick={onEdit} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Edit"><Pencil size={12} /></button>
            <button onClick={onTogglePin} className={`p-1 rounded hover:bg-gray-100 ${note.pinned ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'}`} title="Pin"><Pin size={12} /></button>
            <button onClick={onToggleFavorite} className={`p-1 rounded hover:bg-gray-100 ${note.favorite ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`} title="Favorite"><Star size={12} /></button>
            <button onClick={onShowHistory} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Version History"><History size={12} /></button>
            <div className="relative">
              <button onClick={() => setShowColors(!showColors)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Color"><FileImage size={12} /></button>
              {showColors && (
                <div className="absolute top-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex gap-1 z-20">
                  {COLOR_LABELS.map(c => (
                    <button key={c} onClick={() => { onColorChange(c); setShowColors(false); }} className={`w-4 h-4 rounded-full border-2 border-gray-200 ${COLOR_LABEL_BG[c]} hover:scale-110 transition-transform`} title={c} />
                  ))}
                </div>
              )}
            </div>
            <button onClick={onToggleArchive} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Archive"><Archive size={12} /></button>
            <button onClick={() => onDelete(note.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Version History Modal ──────────────────────────────────────
function VersionHistoryModal({ noteId, onClose, onRestored }: { noteId: string; onClose: () => void; onRestored: () => void }) {
  const [versions, setVersions] = useState<TopicNoteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { const v = await fetchNoteVersions(noteId); setVersions(v); } catch { setVersions([]); }
      setLoading(false);
    })();
  }, [noteId]);

  const handleRestore = async (versionId: string) => {
    await restoreNoteVersion(noteId, versionId);
    onRestored();
    onClose();
  };

  const selected = versions.find(v => v.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><History size={16} /> Version History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-gray-100 overflow-y-auto p-2 space-y-1 shrink-0">
            {loading ? <Spinner /> : versions.length === 0 ? <p className="text-xs text-gray-400 p-2">No versions yet</p> :
              versions.map(v => (
                <button key={v.id} onClick={() => setSelectedId(v.id)} className={`w-full text-left p-2 rounded text-xs transition-colors ${selectedId === v.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                  <p className="font-medium text-gray-700">v{v.version_number}</p>
                  <p className="text-[10px] text-gray-400">{formatDate(v.created_at)} {formatTime(v.created_at)}</p>
                </button>
              ))
            }
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selected.title}</p>
                    <p className="text-[10px] text-gray-400">Version {selected.version_number} - {formatDate(selected.created_at)} {formatTime(selected.created_at)}</p>
                  </div>
                  <button onClick={() => handleRestore(selected.id)} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-1"><RotateCcw size={12} /> Restore</button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content || '(empty)'}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Select a version to view</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Questions Tab (Question Bank) ──────────────────────────────
export function QuestionsTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<QuestionType | 'All'>('All');
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newType, setNewType] = useState<QuestionType>('Theory');
  const [newDiff, setNewDiff] = useState<Difficulty>('Medium');

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      setQuestions(await fetchTopicQuestions(node.data.id, isSubtopic));
    } catch { setQuestions([]); }
    setLoading(false);
  };
  useEffect(() => { loadQuestions(); }, [node.data.id]);

  const handleAdd = async () => {
    if (!newQ.trim()) return;
    const isSubtopic = node.level === 'subtopic';
    await createTopicQuestion(node.data.id, newQ, '', newDiff, 'Open', questions.length, newType, '', null, null, isSubtopic);
    setNewQ(''); setNewType('Theory'); setNewDiff('Medium'); setAdding(false);
    loadQuestions();
    if (node.level === 'topic') detectAndSetStatus(node.data.id);
    onUpdate();
  };

  const handleUpdate = async (id: string, updates: any) => { await updateTopicQuestion(id, updates); loadQuestions(); };
  const handleDelete = async (id: string) => { await deleteTopicQuestion(id); loadQuestions(); onUpdate(); };

  const filtered = filterType === 'All' ? questions : questions.filter(q => q.question_type === filterType);
  const solved = questions.filter(q => q.status === 'Solved').length;

  if (loading) return <Spinner />;

  return (
    <div>
      {questions.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Progress: {questions.length > 0 ? Math.round((solved / questions.length) * 100) : 0}%</span>
            <span className="text-xs text-gray-500">{solved}/{questions.length} solved</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${questions.length > 0 ? (solved / questions.length) * 100 : 0}%` }} /></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questions ({filtered.length})</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="text-[11px] bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none">
            <option value="All">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"><Plus size={12} /> Add</button>
      </div>

      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Question..." className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={newType} onChange={e => setNewType(e.target.value as QuestionType)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-1">{QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <select value={newDiff} onChange={e => setNewDiff(e.target.value as Difficulty)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-1"><option>Easy</option><option>Medium</option><option>Hard</option></select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !adding ? (
        <div className="text-center py-8">
          <HelpCircle size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No questions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => <QCard key={q.id} q={q} onUpdate={handleUpdate} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}

function QCard({ q, onUpdate, onDelete }: { q: TopicQuestion; onUpdate: (id: string, u: any) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(q.question);
  const [answer, setAnswer] = useState(q.answer);
  const [explanation, setExplanation] = useState(q.explanation);
  useEffect(() => { setQuestion(q.question); setAnswer(q.answer); setExplanation(q.explanation); }, [q.question, q.answer, q.explanation]);
  const commit = () => { setEditing(false); onUpdate(q.id, { question, answer, explanation }); };

  if (editing) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
        <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer..." className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-20" />
        <textarea value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Explanation..." className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-16" />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={q.question_type} onChange={e => onUpdate(q.id, { question_type: e.target.value })} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">{QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          <select value={q.difficulty} onChange={e => onUpdate(q.id, { difficulty: e.target.value })} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5"><option>Easy</option><option>Medium</option><option>Hard</option></select>
          <select value={q.status} onChange={e => onUpdate(q.id, { status: e.target.value })} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5"><option>Open</option><option>Researching</option><option>Solved</option></select>
          <button onClick={commit} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
          <button onClick={() => { setEditing(false); setQuestion(q.question); setAnswer(q.answer); setExplanation(q.explanation); }} className="text-xs px-2 py-1 text-gray-500">Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{question}</p>
          {answer && <p className="text-xs text-gray-500 mt-1">{answer}</p>}
          {explanation && <p className="text-xs text-gray-400 mt-1 italic">{explanation}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${QUESTION_TYPE_COLORS[q.question_type]}`}>{q.question_type}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${QUESTION_STATUS_COLORS[q.status]}`}>{q.status}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span>
          <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"><Pencil size={12} /></button>
          <button onClick={() => onDelete(q.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Resources Tab ──────────────────────────────────────────────
export function ResourcesTab({ node }: { node: SyllabusNode }) {
  const [resources, setResources] = useState<TopicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<ResourceType>('Website');
  const [newDesc, setNewDesc] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      setResources(await fetchTopicResources(node.data.id, isSubtopic));
    } catch { setResources([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [node.data.id]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const isSubtopic = node.level === 'subtopic';
    await createTopicResource(node.data.id, newTitle, newUrl, newType, newDesc, resources.length, isSubtopic);
    setNewTitle(''); setNewUrl(''); setNewType('Website'); setNewDesc(''); setAdding(false); load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resources ({resources.length})</label>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-16" />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={newType} onChange={e => setNewType(e.target.value as ResourceType)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">{RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500">Cancel</button>
          </div>
        </div>
      )}
      {resources.length === 0 && !adding ? (
        <div className="text-center py-8"><LinkIcon size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No resources yet</p></div>
      ) : (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="group flex items-start gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
              <span className="text-gray-500 shrink-0 mt-0.5">{RESOURCE_ICONS[r.resource_type]}</span>
              <div className="min-w-0 flex-1">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block flex items-center gap-1">{r.title}<ExternalLink size={10} /></a>
                <p className="text-[10px] text-gray-400 truncate">{r.url}</p>
                {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{r.resource_type}</span>
              <button onClick={() => deleteTopicResource(r.id).then(load)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attachments Tab ────────────────────────────────────────────
export function AttachmentsTab({ node }: { node: SyllabusNode }) {
  const [attachments, setAttachments] = useState<TopicAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<AttachmentType>('PDF');

  const load = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      setAttachments(await fetchTopicAttachments(node.data.id, isSubtopic));
    } catch { setAttachments([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [node.data.id]);

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const isSubtopic = node.level === 'subtopic';
    await createTopicAttachment(node.data.id, newName, newType, newUrl, null, null, null, isSubtopic);
    setNewName(''); setNewUrl(''); setNewType('PDF'); setAdding(false); load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Attachments ({attachments.length})</label>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Filename" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="File URL (link to your file)" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={newType} onChange={e => setNewType(e.target.value as AttachmentType)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">{ATTACHMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500">Cancel</button>
          </div>
        </div>
      )}
      {attachments.length === 0 && !adding ? (
        <div className="text-center py-8"><FileArchive size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No attachments yet</p></div>
      ) : (
        <div className="space-y-2">
          {attachments.map(a => (
            <div key={a.id} className="group flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 transition-colors">
              <span className="text-gray-500 shrink-0">{ATTACHMENT_ICONS[a.file_type]}</span>
              <div className="min-w-0 flex-1">
                <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{a.filename}</a>
                <p className="text-[10px] text-gray-400">{a.file_type} {a.file_size_bytes ? `- ${(a.file_size_bytes / 1024).toFixed(0)} KB` : ''}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{a.file_type}</span>
              <button onClick={() => deleteTopicAttachment(a.id).then(load)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bookmarks Tab ──────────────────────────────────────────────
export function BookmarksTab({ node }: { node: SyllabusNode }) {
  const [bookmarks, setBookmarks] = useState<TopicBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCat, setNewCat] = useState<TopicBookmarkCategory>('Link');
  const [newDesc, setNewDesc] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      setBookmarks(await fetchTopicBookmarks(node.data.id, isSubtopic));
    } catch { setBookmarks([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [node.data.id]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const isSubtopic = node.level === 'subtopic';
    await createTopicBookmark(node.data.id, newTitle, newUrl, newCat, newDesc, isSubtopic);
    setNewTitle(''); setNewUrl(''); setNewCat('Link'); setNewDesc(''); setAdding(false); load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bookmarks ({bookmarks.length})</label>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={newCat} onChange={e => setNewCat(e.target.value as TopicBookmarkCategory)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">{BOOKMARK_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500">Cancel</button>
          </div>
        </div>
      )}
      {bookmarks.length === 0 && !adding ? (
        <div className="text-center py-8"><BookMarked size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No bookmarks yet</p></div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map(b => (
            <div key={b.id} className="group flex items-start gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
              <span className="text-gray-500 shrink-0 mt-0.5">{BOOKMARK_ICONS[b.category]}</span>
              <div className="min-w-0 flex-1">
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{b.title}</a>
                <p className="text-[10px] text-gray-400 truncate">{b.url}</p>
                {b.description && <p className="text-xs text-gray-500 mt-1">{b.description}</p>}
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{b.category}</span>
              <button onClick={() => deleteTopicBookmark(b.id).then(load)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Revision Tab (Revision Manager) ────────────────────────────
export function RevisionTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [revisions, setRevisions] = useState<TopicRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newConfidence, setNewConfidence] = useState(50);
  const [newNotes, setNewNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      setRevisions(await fetchTopicRevisions(node.data.id, isSubtopic));
    } catch { setRevisions([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [node.data.id]);

  const handleAdd = async () => {
    const isSubtopic = node.level === 'subtopic';
    await createTopicRevision(node.data.id, newDate, newConfidence, newNotes, isSubtopic);
    setNewDate(new Date().toISOString().split('T')[0]); setNewConfidence(50); setNewNotes(''); setAdding(false); load();
    if (node.level === 'topic') detectAndSetStatus(node.data.id);
    onUpdate();
  };

  if (loading) return <Spinner />;

  const lastRev = revisions[revisions.length - 1];
  const avgConfidence = revisions.length > 0 ? Math.round(revisions.reduce((s, r) => s + r.confidence_score, 0) / revisions.length) : 0;
  const nextInterval = computeSpacedRepetitionInterval(revisions.length + 1);

  return (
    <div>
      {revisions.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase">Revision Count</p>
            <p className="text-lg font-semibold text-gray-900">{revisions.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase">Avg Confidence</p>
            <p className="text-lg font-semibold text-gray-900">{avgConfidence}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase">Last Revision</p>
            <p className="text-sm font-medium text-gray-700">{lastRev ? formatDate(lastRev.revision_date) : '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase">Next Revision</p>
            <p className="text-sm font-medium text-gray-700">{revisions[0]?.next_revision_date ? formatDate(revisions[0].next_revision_date) : `+${nextInterval}d`}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revisions ({revisions.length})</label>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>

      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div>
            <label className="text-xs text-gray-500 flex justify-between mb-1"><span>Confidence</span><span>{newConfidence}%</span></label>
            <input type="range" min={0} max={100} step={5} value={newConfidence} onChange={e => setNewConfidence(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900" />
          </div>
          <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Revision notes..." className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-16" />
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {revisions.length === 0 && !adding ? (
        <div className="text-center py-8"><RotateCcw size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No revisions yet</p></div>
      ) : (
        <div className="space-y-2">
          {revisions.map((r, i) => (
            <div key={r.id} className="group flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
              <div className="shrink-0 text-center min-w-[44px]">
                <p className="text-[10px] text-gray-400">Rev</p>
                <p className="text-sm font-bold text-gray-900">{revisions.length - i}</p>
              </div>
              <div className="shrink-0 text-center min-w-[48px]">
                <p className="text-xs font-medium text-gray-900">{formatDate(r.revision_date)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-600">Confidence: {r.confidence_score}%</span>
                  <div className="w-16 h-1 bg-gray-200 rounded-full"><div className={`h-1 rounded-full ${r.confidence_score >= 80 ? 'bg-emerald-500' : r.confidence_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.confidence_score}%` }} /></div>
                  {r.next_revision_date && <span className="text-[10px] text-gray-400">Next: {formatDate(r.next_revision_date)}</span>}
                </div>
                {r.revision_notes && <p className="text-xs text-gray-500">{r.revision_notes}</p>}
              </div>
              <button onClick={() => deleteTopicRevision(r.id).then(load)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Research Tab ───────────────────────────────────────────────
export function ResearchTab({ node }: { node: SyllabusNode }) {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const topicName = node.data.name.toLowerCase();
      const { data } = await supabase.from('research_papers').select('*').order('created_at', { ascending: false });
      const matched = (data ?? []).filter((p: any) =>
        p.title?.toLowerCase().includes(topicName) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(topicName)) ||
        p.summary?.toLowerCase().includes(topicName),
      );
      setPapers(matched.length > 0 ? matched : (data ?? []).slice(0, 10));
    } catch { setPapers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [node.data.id]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      const { supabase } = await import('../lib/supabase');
      const tags = [node.data.name];
      await supabase.from('research_papers').insert({ title: newTitle, authors: newAuthors, pdf_link: newLink, summary: newSummary, tags });
      setNewTitle(''); setNewAuthors(''); setNewLink(''); setNewSummary(''); setAdding(false); load();
    } catch { /* ignore */ }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Research Papers ({papers.length})</label>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>
      <p className="text-[10px] text-gray-400 mb-3">Papers matching this topic by name or tags</p>
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Paper title" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <input value={newAuthors} onChange={e => setNewAuthors(e.target.value)} placeholder="Authors" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="PDF link URL" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <textarea value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="Summary" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-16" />
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500">Cancel</button>
          </div>
        </div>
      )}
      {papers.length === 0 && !adding ? (
        <div className="text-center py-8"><FileText size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No research papers yet</p></div>
      ) : (
        <div className="space-y-2">
          {papers.map(p => (
            <div key={p.id} className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{p.title}</h4>
                  {p.authors && <p className="text-[10px] text-gray-400 mt-0.5">{p.authors}</p>}
                  {p.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.summary}</p>}
                  {p.tags?.length > 0 && <div className="flex gap-1 mt-1.5 flex-wrap">{p.tags.map((t: string) => <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{t}</span>)}</div>}
                </div>
                {p.pdf_link && <a href={p.pdf_link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"><ExternalLink size={14} /></a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant Tab ───────────────────────────────────────────
export function AITab({ node }: { node: SyllabusNode }) {
  const [history, setHistory] = useState<TopicAIHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const isSubtopic = node.level === 'subtopic';
      setHistory(await fetchTopicAIHistory(node.data.id, isSubtopic));
    } catch { setHistory([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [node.data.id]);

  const runAction = async (action: AIAction) => {
    setBusy(true); setError('');
    try {
      const isSubtopic = node.level === 'subtopic';
      const res = await callAIAssistant(node.data.id, action);
      await createTopicAIHistory(node.data.id, action, '', res.response, isSubtopic);
      load();
    } catch (e: any) { setError(e.message || 'AI request failed'); }
    setBusy(false);
  };

  const handleChat = async () => {
    if (!chatPrompt.trim()) return;
    setBusy(true); setError('');
    try {
      const isSubtopic = node.level === 'subtopic';
      const res = await callAIAssistant(node.data.id, 'chat', chatPrompt);
      await createTopicAIHistory(node.data.id, 'chat', chatPrompt, res.response, isSubtopic);
      setChatPrompt(''); load();
    } catch (e: any) { setError(e.message || 'AI request failed'); }
    setBusy(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-violet-500" />
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Assistant</label>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {AI_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.action} onClick={() => runAction(a.action)} disabled={busy}
              className="flex items-start gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50/30 transition-all text-left disabled:opacity-50 group">
              <span className="text-violet-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{Icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800">{a.label}</p>
                <p className="text-[10px] text-gray-400">{a.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-3">
        <input value={chatPrompt} onChange={e => setChatPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleChat(); }} placeholder="Ask AI about this topic..." className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" disabled={busy} />
        <button onClick={handleChat} disabled={busy || !chatPrompt.trim()} className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50">Ask</button>
      </div>

      {error && <p className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">{error}</p>}
      {busy && <div className="flex items-center gap-2 text-xs text-gray-400 mb-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" /> Generating...</div>}

      {loading ? <Spinner /> : history.length === 0 ? (
        <div className="text-center py-8"><Brain size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No AI interactions yet</p><p className="text-xs text-gray-400 mt-1">Use the buttons above to generate summaries, questions, and more</p></div>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">{h.action.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400">{formatDate(h.created_at)} {formatTime(h.created_at)}</span>
                  <button onClick={() => deleteTopicAIHistory(h.id).then(load)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={11} /></button>
                </div>
              </div>
              {h.prompt && <p className="text-xs text-gray-500 italic mb-1">Q: {h.prompt}</p>}
              <div className="prose prose-sm max-w-none text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{h.response}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────────
export function AnalyticsTab({ node }: { node: SyllabusNode }) {
  const [data, setData] = useState({ notes: 0, questions: 0, solved: 0, resources: 0, revisions: 0, attachments: 0, bookmarks: 0, aiChats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const isSubtopic = node.level === 'subtopic';
      const [n, q, r, rev, a, b, ai] = await Promise.all([
        fetchTopicNotes(node.data.id, isSubtopic).catch(() => []),
        fetchTopicQuestions(node.data.id, isSubtopic).catch(() => []),
        fetchTopicResources(node.data.id, isSubtopic).catch(() => []),
        fetchTopicRevisions(node.data.id, isSubtopic).catch(() => []),
        fetchTopicAttachments(node.data.id, isSubtopic).catch(() => []),
        fetchTopicBookmarks(node.data.id, isSubtopic).catch(() => []),
        fetchTopicAIHistory(node.data.id, isSubtopic).catch(() => []),
      ]);
      setData({
        notes: n.length, questions: q.length, solved: q.filter((x: any) => x.status === 'Solved').length,
        resources: r.length, revisions: rev.length, attachments: a.length, bookmarks: b.length, aiChats: ai.length,
      });
      setLoading(false);
    })();
  }, [node.data.id]);

  if (loading) return <Spinner />;

  const stats = [
    { label: 'Notes Written', value: data.notes, icon: <FileText size={16} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Questions Total', value: data.questions, icon: <HelpCircle size={16} />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Questions Solved', value: data.solved, icon: <CheckCircle2 size={16} />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Resources', value: data.resources, icon: <LinkIcon size={16} />, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Revisions', value: data.revisions, icon: <RotateCcw size={16} />, color: 'text-violet-600 bg-violet-50' },
    { label: 'Attachments', value: data.attachments, icon: <FileArchive size={16} />, color: 'text-orange-600 bg-orange-50' },
    { label: 'Bookmarks', value: data.bookmarks, icon: <BookMarked size={16} />, color: 'text-pink-600 bg-pink-50' },
    { label: 'AI Chats', value: data.aiChats, icon: <Sparkles size={16} />, color: 'text-violet-600 bg-violet-50' },
  ];

  const completionRate = data.questions > 0 ? Math.round((data.solved / data.questions) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-gray-500" />
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Topic Analytics</label>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
      {data.questions > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 flex items-center gap-1"><Award size={12} /> Question Completion</span>
            <span className="text-xs text-gray-700 font-medium">{completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${completionRate}%` }} /></div>
        </div>
      )}
    </div>
  );
}
