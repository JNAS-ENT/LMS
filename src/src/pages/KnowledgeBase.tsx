import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronRight, Trash2, BookOpen, FolderOpen, Layers, FileText,
  GripVertical, Search, Home, Pencil, Eye, StickyNote, HelpCircle,
  Link, RotateCcw, ExternalLink, Upload, Check, Copy, Undo, Archive, Database, Download,
} from 'lucide-react';
import {
  fetchSyllabusTree, createSubject, createModule, createTopic,
  createSubtopic, updateSubject, updateModule, updateTopic,
  updateSubtopic, softDeleteSubject, softDeleteModule, softDeleteTopic,
  softDeleteSubtopic, restoreItem, fetchTopicQuestions, createTopicQuestion,
  updateTopicQuestion, deleteTopicQuestion, fetchTopicResources,
  createTopicResource, updateTopicResource, deleteTopicResource,
  fetchTopicRevisions, createTopicRevision, updateTopicRevision,
  fetchTopicHighlights, createTopicHighlight, updateTopicHighlight, deleteTopicHighlight,
  fetchTopicNotes, createTopicNote, updateTopicNote, deleteTopicNote,
  exportSyllabusJSON,
  deleteTopicRevision, detectAndSetStatus, importSyllabusText,
} from '../services/vault';
import type {
  SyllabusNode, Subject, Module, Topic, Subtopic, LearningStatus,
  TopicNote, TopicQuestion, TopicResource, TopicRevision, TopicHighlight,
  Difficulty, QuestionStatus, ResourceType, HighlightType, EntityType,
} from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

// ─── Constants ──────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = { subject: 'Subject', module: 'Module', topic: 'Topic', subtopic: 'Subtopic' };
const LEVEL_CHILD: Record<string, string> = { subject: 'module', module: 'topic', topic: 'subtopic' };
const LEVEL_ICONS: Record<string, React.ReactNode> = { subject: <BookOpen size={14} />, module: <FolderOpen size={14} />, topic: <Layers size={14} />, subtopic: <FileText size={14} /> };
const LEVEL_COLORS: Record<string, string> = { subject: 'text-gray-900 font-semibold', module: 'text-gray-800 font-medium', topic: 'text-gray-700', subtopic: 'text-gray-600' };
const LEVEL_BADGE_COLORS: Record<string, string> = { subject: 'bg-gray-900 text-white', module: 'bg-blue-100 text-blue-700', topic: 'bg-emerald-100 text-emerald-700', subtopic: 'bg-amber-100 text-amber-700' };
const INDENT: Record<string, number> = { subject: 0, module: 1, topic: 2, subtopic: 3 };

const STATUS_OPTIONS: LearningStatus[] = ['Not Started', 'Learning', 'Practicing', 'Completed', 'Revised', 'Mastered'];
const STATUS_COLORS: Record<LearningStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600', Learning: 'bg-blue-100 text-blue-700',
  Practicing: 'bg-amber-100 text-amber-700', Completed: 'bg-emerald-100 text-emerald-700',
  Revised: 'bg-violet-100 text-violet-700', Mastered: 'bg-green-100 text-green-700',
};
const DIFFICULTY_COLORS: Record<Difficulty, string> = { Easy: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-red-100 text-red-700' };
const QUESTION_STATUS_COLORS: Record<QuestionStatus, string> = { Open: 'bg-gray-100 text-gray-700', Researching: 'bg-blue-100 text-blue-700', Solved: 'bg-emerald-100 text-emerald-700' };
const HIGHLIGHT_TYPE_COLORS: Record<HighlightType, string> = { 'Key Concept': 'bg-blue-100 text-blue-700', Formula: 'bg-violet-100 text-violet-700', 'Interview Question': 'bg-amber-100 text-amber-700', 'Important Note': 'bg-emerald-100 text-emerald-700' };
const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  'Google Drive': <ExternalLink size={14} />,
  PDF: <FileText size={14} />,
  YouTube: <ExternalLink size={14} />,
  GitHub: <ExternalLink size={14} />,
  Website: <Link size={14} />,
  Dataset: <Database size={14} />,
  'Research Paper': <FileText size={14} />,
};

const WORKSPACE_TABS = [
  { key: 'overview', label: 'Overview', icon: Eye },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'questions', label: 'Questions', icon: HelpCircle },
  { key: 'resources', label: 'Resources', icon: Link },
  { key: 'revision', label: 'Revision', icon: RotateCcw },
  { key: 'highlights', label: 'Highlights', icon: Check },
] as const;
type TabKey = (typeof WORKSPACE_TABS)[number]['key'];

// ─── Breadcrumb builder ─────────────────────────────────────────

function buildBreadcrumb(node: SyllabusNode, tree: SyllabusNode[]): { level: string; name: string; id: string }[] {
  const trail: { level: string; name: string; id: string }[] = [];
  const targetId = node.data.id;
  function walk(nodes: SyllabusNode[], path: { level: string; name: string; id: string }[]): boolean {
    for (const n of nodes) {
      const cur = [...path, { level: n.level, name: n.data.name, id: n.data.id }];
      if (n.data.id === targetId) { trail.push(...cur); return true; }
      if (n.level !== 'subtopic' && walk((n as any).children ?? [], cur)) return true;
    }
    return false;
  }
  walk(tree, []);
  return trail;
}

// ─── Inline edit component ──────────────────────────────────────

function InlineEdit({ value, onSave, className }: { value: string; onSave: (name: string, oldName: string) => void; className: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setText(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);
  const commit = () => { setEditing(false); const t = text.trim(); if (t && t !== value) onSave(t, value); else setText(value); };
  if (editing) return <input ref={ref} value={text} onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(value); setEditing(false); } }} className="bg-white border border-gray-300 rounded px-1.5 py-0 text-[13px] outline-none focus:ring-2 focus:ring-blue-300 w-full" onClick={e => e.stopPropagation()} />;
  return <span className={`cursor-text select-none truncate ${className}`} onDoubleClick={e => { e.stopPropagation(); setEditing(true); }} title="Double-click to rename">{value}</span>;
}

// ─── Overview Tab ───────────────────────────────────────────────

function OverviewTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const data = node.data as Topic | Subtopic;
  const [name, setName] = useState(data.name);
  const [desc, setDesc] = useState(data.description);
  const [status, setStatus] = useState<LearningStatus>(data.status);
  const [progress, setProgress] = useState(data.progress);
  const [editingName, setEditingName] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setName(data.name); setDesc(data.description); setStatus(data.status); setProgress(data.progress); setEditingName(false); }, [data.id, data.name, data.description, data.status, data.progress]);

  const autoSave = useCallback((field: string, value: string | number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const fn = node.level === 'topic' ? updateTopic : updateSubtopic;
      await fn(node.data.id, { [field]: value });
      if (node.level === 'topic') detectAndSetStatus(node.data.id);
      onUpdate();
    }, 400);
  }, [node.level, node.data.id, onUpdate]);

  const handleDescChange = (val: string) => { setDesc(val); autoSave('description', val); };

  const handleStatusChange = async (val: LearningStatus) => {
    setStatus(val);
    const pm: Record<string, number> = { 'Not Started': 0, Learning: 25, Practicing: 50, Completed: 75, Revised: 85, Mastered: 100 };
    const np = Math.max(progress, pm[val] ?? 0);
    setProgress(np);
    const fn = node.level === 'topic' ? updateTopic : updateSubtopic;
    await fn(node.data.id, { status: val, progress: np });
    onUpdate();
  };

  const handleProgressChange = async (val: number) => {
    setProgress(val);
    const fn = node.level === 'topic' ? updateTopic : updateSubtopic;
    await fn(node.data.id, { progress: val });
    onUpdate();
  };

  const commitName = async () => {
    setEditingName(false);
    const t = name.trim();
    if (t && t !== data.name) {
      const fn = node.level === 'topic' ? updateTopic : updateSubtopic;
      await fn(node.data.id, { name: t }); onUpdate();
    } else setName(data.name);
  };

  return (
    <div className="space-y-5">
      {/* Name */}
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

      {/* Status */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${status === s ? STATUS_COLORS[s] + ' ring-1 ring-current/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{s}</button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Auto-detected: no notes=Not Started, has notes=Learning, has questions=Practicing, 3+ revisions=Mastered</p>
      </div>

      {/* Progress */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 flex justify-between"><span>Progress</span><span className="text-gray-700">{progress}%</span></label>
        <input type="range" min={0} max={100} step={5} value={progress} onChange={e => handleProgressChange(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900" />
        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>0%</span><span>50%</span><span>100%</span></div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
        <textarea value={desc} onChange={e => handleDescChange(e.target.value)} placeholder="Add a description..." className="w-full h-28 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
      </div>
      <p className="text-[11px] text-gray-400">Changes save automatically</p>
    </div>
  );
}

// ─── Notes Tab ──────────────────────────────────────────────────

function NotesTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [notes, setNotes] = useState<TopicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { loadNotes(); }, [node.data.id]);

  const loadNotes = async () => {
    console.log('[NOTES DEBUG] loadNotes called for nodeId:', node.data.id);
    setLoading(true);
    try {
      const fetched = await fetchTopicNotes(node.data.id);
      console.log('[NOTES DEBUG] fetchTopicNotes returned:', fetched);
      setNotes(fetched);
    } catch (err) {
      console.error('[NOTES DEBUG] fetchTopicNotes error:', err);
      setNotes([]);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    console.log('[NOTES DEBUG] handleAdd called', { newTitle, newContent, newCategory, nodeId: node.data.id, nodeLevel: node.level });
    if (!newTitle.trim()) {
      console.log('[NOTES DEBUG] Title empty, returning early');
      return;
    }
    try {
      console.log('[NOTES DEBUG] Calling createTopicNote...');
      const result = await createTopicNote(node.data.id, newTitle, newContent, newCategory, notes.length);
      console.log('[NOTES DEBUG] createTopicNote result:', result);
      setNewTitle(''); setNewContent(''); setNewCategory('General'); setAdding(false);
      await loadNotes();
      console.log('[NOTES DEBUG] loadNotes completed');
      if (node.level === 'topic') detectAndSetStatus(node.data.id);
      onUpdate();
    } catch (err) {
      console.error('[NOTES DEBUG] Error in handleAdd:', err);
    }
  };

  const handleAutoSave = (id: string, field: 'title' | 'content' | 'category', value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateTopicNote(id, { [field]: value });
      loadNotes();
    }, 600);
  };

  const handleDelete = async (id: string) => {
    await deleteTopicNote(id);
    loadNotes();
    onUpdate();
  };

  const wordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

  if (loading) return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes ({notes.length})</label>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add Note</button>
      </div>
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Note title" className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your notes here... (Markdown supported)" className="w-full h-32 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          <div className="flex items-center gap-2">
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none">
              <option>General</option>
              <option>Concept</option>
              <option>Example</option>
              <option>Reference</option>
              <option>Summary</option>
            </select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}
      {notes.length === 0 && !adding ? (
        <div className="text-center py-8">
          <StickyNote size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 mb-3">No notes yet</p>
          <div className="text-left max-w-xs mx-auto bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Example notes for this topic:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-1"><span className="text-blue-500">-</span> Key definitions and terminology</li>
              <li className="flex items-start gap-1"><span className="text-blue-500">-</span> Summary of main concepts</li>
              <li className="flex items-start gap-1"><span className="text-blue-500">-</span> Important formulas or patterns</li>
              <li className="flex items-start gap-1"><span className="text-blue-500">-</span> Personal insights and connections</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <input value={n.title} onChange={e => { const v = e.target.value; setNotes(notes.map(x => x.id === n.id ? { ...x, title: v } : x)); handleAutoSave(n.id, 'title', v); }} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  <textarea value={n.content} onChange={e => { const v = e.target.value; setNotes(notes.map(x => x.id === n.id ? { ...x, content: v } : x)); handleAutoSave(n.id, 'content', v); }} className="w-full h-32 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                  <div className="flex items-center justify-between">
                    <select value={n.category} onChange={e => { const v = e.target.value; setNotes(notes.map(x => x.id === n.id ? { ...x, category: v } : x)); handleAutoSave(n.id, 'category', v); }} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none">
                      <option>General</option>
                      <option>Concept</option>
                      <option>Example</option>
                      <option>Reference</option>
                      <option>Summary</option>
                    </select>
                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Done</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{n.title}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{n.category}</span>
                    </div>
                    {n.content && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.content}</p>}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span>{wordCount(n.content)} words</span>
                      <span>Updated {new Date(n.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingId(n.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(n.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Questions Tab ──────────────────────────────────────────────

function QuestionsTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuestions(); }, [node.data.id]);

  const loadQuestions = async () => {
    setLoading(true);
    try { setQuestions(await fetchTopicQuestions(node.data.id)); } catch { setQuestions([]); }
    setLoading(false);
  };

  const handleAdd = async () => {
    await createTopicQuestion(node.data.id, 'New Question', '', 'Medium', 'Open', questions.length);
    loadQuestions();
    if (node.level === 'topic') detectAndSetStatus(node.data.id);
    onUpdate();
  };

  const handleUpdate = async (id: string, updates: Partial<Pick<TopicQuestion, 'question' | 'answer' | 'difficulty' | 'status' | 'display_order'>>) => {
    await updateTopicQuestion(id, updates);
    loadQuestions();
  };

  const handleDelete = async (id: string) => {
    await deleteTopicQuestion(id);
    loadQuestions();
    onUpdate();
  };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;

  // Question summary
  const openCount = questions.filter(q => q.status === 'Open').length;
  const researchingCount = questions.filter(q => q.status === 'Researching').length;
  const solvedCount = questions.filter(q => q.status === 'Solved').length;
  const completionPercent = questions.length > 0 ? Math.round((solvedCount / questions.length) * 100) : 0;

  return (
    <div>
      {/* Question Summary */}
      {questions.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Progress: {completionPercent}%</span>
            <span className="text-xs text-gray-500">{solvedCount}/{questions.length} solved</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {solvedCount > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(solvedCount / questions.length) * 100}%` }} />}
            {researchingCount > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(researchingCount / questions.length) * 100}%` }} />}
            {openCount > 0 && <div className="bg-gray-400 h-full" style={{ width: `${(openCount / questions.length) * 100}%` }} />}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Open: {openCount}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Researching: {researchingCount}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Solved: {solvedCount}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questions ({questions.length})</label>
        <button onClick={handleAdd} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>
      {questions.length === 0 ? (
        <div className="text-center py-8">
          <HelpCircle size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 mb-3">No questions yet</p>
          <div className="text-left max-w-xs mx-auto bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Try these question types:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-1"><span className="text-amber-500">?</span> Conceptual: What is X and why does it matter?</li>
              <li className="flex items-start gap-1"><span className="text-amber-500">?</span> Procedural: How do I implement X?</li>
              <li className="flex items-start gap-1"><span className="text-amber-500">?</span> Comparative: What is the difference between X and Y?</li>
              <li className="flex items-start gap-1"><span className="text-amber-500">?</span> Analytical: When should I use X over Y?</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => <QuestionCard key={q.id} question={q} onUpdate={handleUpdate} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, onUpdate, onDelete }: { question: TopicQuestion; onUpdate: (id: string, u: Partial<Pick<TopicQuestion, 'question' | 'answer' | 'difficulty' | 'status'>>) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(question.question);
  const [a, setA] = useState(question.answer);
  useEffect(() => { setQ(question.question); setA(question.answer); }, [question.question, question.answer]);
  const commit = () => { setEditing(false); onUpdate(question.id, { question: q, answer: a }); };

  if (editing) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Question..." className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
        <textarea value={a} onChange={e => setA(e.target.value)} placeholder="Answer..." className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-20" />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={question.difficulty} onChange={e => onUpdate(question.id, { difficulty: e.target.value as Difficulty })} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none"><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select>
          <select value={question.status} onChange={e => onUpdate(question.id, { status: e.target.value as QuestionStatus })} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none"><option value="Open">Open</option><option value="Researching">Researching</option><option value="Solved">Solved</option></select>
          <button onClick={commit} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">Save</button>
          <button onClick={() => { setEditing(false); setQ(question.question); setA(question.answer); }} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{q}</p>
          {a && <p className="text-xs text-gray-500 mt-1">{a}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${QUESTION_STATUS_COLORS[question.status]}`}>{question.status}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[question.difficulty]}`}>{question.difficulty}</span>
          <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={12} /></button>
          <button onClick={() => onDelete(question.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Resources Tab ──────────────────────────────────────────────

function ResourcesTab({ node }: { node: SyllabusNode }) {
  const [resources, setResources] = useState<TopicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<ResourceType>('Website');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => { loadResources(); }, [node.data.id]);

  const loadResources = async () => {
    setLoading(true);
    try { setResources(await fetchTopicResources(node.data.id)); } catch { setResources([]); }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    await createTopicResource(node.data.id, newTitle, newUrl, newType, newDesc, resources.length);
    setNewTitle(''); setNewUrl(''); setNewType('Website'); setNewDesc(''); setAdding(false);
    loadResources();
  };

  const handleDelete = async (id: string) => { await deleteTopicResource(id); loadResources(); };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;

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
          <div className="flex items-center gap-2">
            <select value={newType} onChange={e => setNewType(e.target.value as ResourceType)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none">
              <option value="Website">Website</option>
              <option value="Google Drive">Google Drive</option>
              <option value="PDF">PDF</option>
              <option value="YouTube">YouTube</option>
              <option value="GitHub">GitHub</option>
              <option value="Dataset">Dataset</option>
              <option value="Research Paper">Research Paper</option>
            </select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}
      {resources.length === 0 && !adding ? (
        <div className="text-center py-8">
          <Link size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 mb-3">No resources yet</p>
          <div className="text-left max-w-xs mx-auto bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Add valuable resources:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-1"><span className="text-cyan-500">-</span> YouTube tutorials and lectures</li>
              <li className="flex items-start gap-1"><span className="text-cyan-500">-</span> GitHub repositories and code examples</li>
              <li className="flex items-start gap-1"><span className="text-cyan-500">-</span> PDF papers and documentation</li>
              <li className="flex items-start gap-1"><span className="text-cyan-500">-</span> Google Drive notes and datasets</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="group flex items-start gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
              <span className="text-gray-500 shrink-0 mt-0.5">{RESOURCE_ICONS[r.resource_type]}</span>
              <div className="min-w-0 flex-1">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{r.title}</a>
                <p className="text-[10px] text-gray-400 truncate">{r.url}</p>
                {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{r.resource_type}</span>
              <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Revision Tab ───────────────────────────────────────────────

function RevisionTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [revisions, setRevisions] = useState<TopicRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newConfidence, setNewConfidence] = useState(50);
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => { loadRevisions(); }, [node.data.id]);

  const loadRevisions = async () => {
    setLoading(true);
    try { setRevisions(await fetchTopicRevisions(node.data.id)); } catch { setRevisions([]); }
    setLoading(false);
  };

  const handleAdd = async () => {
    await createTopicRevision(node.data.id, newDate, newConfidence, newNotes);
    setNewDate(new Date().toISOString().split('T')[0]); setNewConfidence(50); setNewNotes(''); setAdding(false);
    loadRevisions();
    if (node.level === 'topic') detectAndSetStatus(node.data.id);
    onUpdate();
  };

  const handleDelete = async (id: string) => { await deleteTopicRevision(id); loadRevisions(); onUpdate(); };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;

  return (
    <div>
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
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}
      {revisions.length === 0 && !adding ? (
        <div className="text-center py-8">
          <RotateCcw size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 mb-3">No revisions yet</p>
          <div className="text-left max-w-xs mx-auto bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Spaced repetition boosts retention:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-1"><span className="text-purple-500">1.</span> First revision: within 24 hours</li>
              <li className="flex items-start gap-1"><span className="text-purple-500">2.</span> Second revision: after 3 days</li>
              <li className="flex items-start gap-1"><span className="text-purple-500">3.</span> Third revision: after 1 week</li>
              <li className="flex items-start gap-1"><span className="text-purple-500">4.</span> 3+ revisions marks topic as Mastered!</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {revisions.map(r => (
            <div key={r.id} className="group flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
              <div className="shrink-0 text-center min-w-[48px]">
                <p className="text-xs font-medium text-gray-900">{new Date(r.revision_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-600">Confidence: {r.confidence_score}%</span>
                  <div className="w-16 h-1 bg-gray-200 rounded-full">
                    <div className={`h-1 rounded-full ${r.confidence_score >= 80 ? 'bg-emerald-500' : r.confidence_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.confidence_score}%` }} />
                  </div>
                </div>
                {r.revision_notes && <p className="text-xs text-gray-500">{r.revision_notes}</p>}
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Highlights Tab ───────────────────────────────────────────────

function HighlightsTab({ node, onUpdate }: { node: SyllabusNode; onUpdate: () => void }) {
  const [highlights, setHighlights] = useState<TopicHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<HighlightType>('Key Concept');

  useEffect(() => { loadHighlights(); }, [node.data.id]);

  const loadHighlights = async () => {
    setLoading(true);
    try { setHighlights(await fetchTopicHighlights(node.data.id)); } catch { setHighlights([]); }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    await createTopicHighlight(node.data.id, newContent, newType, highlights.length);
    setNewContent(''); setNewType('Key Concept'); setAdding(false);
    loadHighlights();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await deleteTopicHighlight(id);
    loadHighlights();
    onUpdate();
  };

  const typeCount = (type: HighlightType) => highlights.filter(h => h.highlight_type === type).length;

  if (loading) return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Highlights ({highlights.length})</label>
          <div className="flex gap-1">
            {(['Key Concept', 'Formula', 'Interview Question', 'Important Note'] as HighlightType[]).map(t => typeCount(t) > 0 && <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full ${HIGHLIGHT_TYPE_COLORS[t]}`}>{typeCount(t)}</span>)}
          </div>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"><Plus size={12} /> Add</button>
      </div>
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mb-3">
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Key concept, formula, or important note..." className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-20" autoFocus />
          <div className="flex items-center gap-2">
            <select value={newType} onChange={e => setNewType(e.target.value as HighlightType)} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none">
              <option value="Key Concept">Key Concept</option>
              <option value="Formula">Formula</option>
              <option value="Interview Question">Interview Question</option>
              <option value="Important Note">Important Note</option>
            </select>
            <button onClick={handleAdd} className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}
      {highlights.length === 0 && !adding ? (
        <div className="text-center py-8">
          <Check size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 mb-3">No highlights yet</p>
          <div className="text-left max-w-xs mx-auto bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-2">Capture what matters:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-1"><span className="text-blue-500">=</span> Key Concepts: Core ideas to remember</li>
              <li className="flex items-start gap-1"><span className="text-violet-500">=</span> Formulas: Equations and calculations</li>
              <li className="flex items-start gap-1"><span className="text-amber-500">=</span> Interview Questions: Common interview topics</li>
              <li className="flex items-start gap-1"><span className="text-emerald-500">=</span> Important Notes: Critical insights</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {highlights.map(h => (
            <div key={h.id} className="group flex items-start gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${HIGHLIGHT_TYPE_COLORS[h.highlight_type]}`}>{h.highlight_type}</span>
              <p className="text-sm text-gray-700 flex-1 min-w-0">{h.content}</p>
              <button onClick={() => handleDelete(h.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Topic Workspace (right panel) ──────────────────────────────

function TopicWorkspace({ node, tree, onNavigate, onUpdate }: {
  node: SyllabusNode; tree: SyllabusNode[]; onNavigate: (id: string) => void; onUpdate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => { setActiveTab('overview'); }, [node.data.id]);

  const breadcrumb = buildBreadcrumb(node, tree);
  const data = node.data as Topic | Subtopic;

  return (
    <motion.div key={node.data.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
      {/* Breadcrumb */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200/60">
        <nav className="flex items-center gap-1 flex-wrap">
          <button onClick={() => onNavigate('root')} className="text-gray-400 hover:text-gray-600 transition-colors" title="Back to tree"><Home size={13} /></button>
          {breadcrumb.map((crumb, i) => (
            <div key={crumb.id} className="flex items-center gap-1">
              <ChevronRight size={11} className="text-gray-300" />
              <button onClick={() => onNavigate(crumb.id)} className={`text-xs hover:text-gray-900 transition-colors ${i === breadcrumb.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{crumb.name}</button>
            </div>
          ))}
        </nav>
      </div>

      {/* Header with status badge */}
      <div className="px-5 pt-4 flex items-center gap-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${LEVEL_BADGE_COLORS[node.level]}`}>{node.level}</span>
        {(node.level === 'topic' || node.level === 'subtopic') && data.status !== 'Not Started' && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[data.status]}`}>{data.status}</span>
        )}
        {(node.level === 'topic' || node.level === 'subtopic') && (
          <span className="text-[10px] text-gray-400">{data.progress}%</span>
        )}
      </div>

      {/* Tabs */}
      <div className="px-5 mt-3">
        <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
          {WORKSPACE_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
                <Icon size={12} />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'overview' && <OverviewTab node={node} onUpdate={onUpdate} />}
        {activeTab === 'notes' && <NotesTab node={node} onUpdate={onUpdate} />}
        {activeTab === 'questions' && <QuestionsTab node={node} onUpdate={onUpdate} />}
        {activeTab === 'resources' && <ResourcesTab node={node} />}
        {activeTab === 'revision' && <RevisionTab node={node} onUpdate={onUpdate} />}
        {activeTab === 'highlights' && <HighlightsTab node={node} onUpdate={onUpdate} />}
      </div>
    </motion.div>
  );
}

// ─── Import Modal ────────────────────────────────────────────────

function ImportModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: () => void }) {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!text.trim()) return;
    setImporting(true); setError('');
    try { await importSyllabusText(text); setText(''); onImport(); onClose(); }
    catch { setError('Failed to import. Check your text format.'); }
    setImporting(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Syllabus">
      <p className="text-xs text-gray-500 mb-3">Paste a text hierarchy using indentation. Each indent level creates a new tier.</p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
        <p className="text-[11px] text-gray-500 font-medium mb-1">Example:</p>
        <pre className="text-[11px] text-gray-600 font-mono leading-relaxed">{"Artificial Intelligence\n  Machine Learning\n    Linear Regression\n    Logistic Regression\n  Deep Learning\n    Neural Networks\n    CNN"}</pre>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={"Subject\n  Module\n    Topic\n      Subtopic"} className="w-full h-48 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none leading-relaxed" />
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
        <button onClick={handleImport} disabled={importing || !text.trim()} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{importing ? 'Importing...' : 'Import'}</button>
      </div>
    </Modal>
  );
}

// ─── Tree Node ──────────────────────────────────────────────────

function TreeNode({ node, expanded, onToggle, selectedId, onSelect, onRename, onDelete, onAddChild, onReorder, dragId, dragOverId, setDragId, setDragOverId }: {
  node: SyllabusNode; expanded: Set<string>; onToggle: (id: string) => void; selectedId: string | null; onSelect: (node: SyllabusNode) => void;
  onRename: (node: SyllabusNode, name: string, oldName: string) => void; onDelete: (node: SyllabusNode) => void; onAddChild: (node: SyllabusNode) => void;
  onReorder: (dragId: string, dropId: string, level: string) => void; dragId: string | null; dragOverId: string | null; setDragId: (id: string | null) => void; setDragOverId: (id: string | null) => void;
}) {
  const isExpanded = expanded.has(node.data.id);
  const isSelected = selectedId === node.data.id;
  const hasChildren = node.level !== 'subtopic' && ((node as any).children?.length ?? 0) > 0;
  const indent = INDENT[node.level] * 20;
  const nodeData = node.data as Topic | Subtopic;
  const hasStatus = (node.level === 'topic' || node.level === 'subtopic') && nodeData.status !== 'Not Started';

  return (
    <div>
      <div draggable onDragStart={e => { e.dataTransfer.setData('text/plain', node.data.id); e.dataTransfer.effectAllowed = 'move'; setDragId(node.data.id); }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverId(node.data.id); }}
        onDrop={e => { e.preventDefault(); const fromId = e.dataTransfer.getData('text/plain'); if (fromId && fromId !== node.data.id) onReorder(fromId, node.data.id, node.level); setDragId(null); setDragOverId(null); }}
        onDragEnd={() => { setDragId(null); setDragOverId(null); }}
        onClick={() => onSelect(node)}
        className={`flex items-center gap-1 py-1.5 pr-2 rounded-lg cursor-pointer group transition-colors ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'} ${dragOverId === node.data.id && dragId !== node.data.id ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''}`}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        <span className="opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing text-gray-400 mr-0.5"><GripVertical size={12} /></span>
        {node.level !== 'subtopic' ? (
          <button onClick={e => { e.stopPropagation(); onToggle(node.data.id); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 shrink-0 transition-transform"><ChevronRight size={14} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} /></button>
        ) : <span className="w-5 shrink-0" />}
        <span className={`shrink-0 ${LEVEL_COLORS[node.level]}`}>{LEVEL_ICONS[node.level]}</span>
        <InlineEdit value={node.data.name} onSave={(name, old) => onRename(node, name, old)} className={`text-[13px] ${LEVEL_COLORS[node.level]}`} />
        {hasStatus && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[nodeData.status]}`}>{nodeData.status}</span>}
        {node.level !== 'subtopic' && <button onClick={e => { e.stopPropagation(); onAddChild(node); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" title={`Add ${LEVEL_LABELS[LEVEL_CHILD[node.level]]}`}><Plus size={13} /></button>}
        <button onClick={e => { e.stopPropagation(); onDelete(node); }} className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" title="Delete"><Trash2 size={13} /></button>
      </div>
      {hasChildren && isExpanded && (
        <AnimatePresence initial={false}>
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            {(node as any).children.map((child: SyllabusNode) => <TreeNode key={child.data.id} node={child} expanded={expanded} onToggle={onToggle} selectedId={selectedId} onSelect={onSelect} onRename={onRename} onDelete={onDelete} onAddChild={onAddChild} onReorder={onReorder} dragId={dragId} dragOverId={dragOverId} setDragId={setDragId} setDragOverId={setDragOverId} />)}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Main KnowledgeBase page ────────────────────────────────────

interface DeletedToast { id: string; type: EntityType; name: string; timeout: ReturnType<typeof setTimeout>; }

export default function KnowledgeBase() {
  const [tree, setTree] = useState<SyllabusNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SyllabusNode | null>(null);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletedToast, setDeletedToast] = useState<DeletedToast | null>(null);
  const initialExpandDone = useRef(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportSyllabusJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `learning-vault-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
    setExporting(false);
  };

  const loadTree = useCallback(async () => {
    const data = await fetchSyllabusTree();
    setTree(data);
    setLoading(false);
    if (!initialExpandDone.current && data.length > 0) {
      const ids = new Set<string>();
      const collect = (nodes: SyllabusNode[]) => { for (const n of nodes) { ids.add(n.data.id); if (n.level !== 'subtopic') collect((n as any).children ?? []); } };
      collect(data); setExpanded(ids); initialExpandDone.current = true;
    }
    return data;
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  // Clear toast on unmount
  useEffect(() => { return () => { if (deletedToast) clearTimeout(deletedToast.timeout); }; }, [deletedToast]);

  // Keep selected node in sync with tree data
  useEffect(() => {
    if (!selected) return;
    const findNode = (nodes: SyllabusNode[]): SyllabusNode | null => { for (const n of nodes) { if (n.data.id === selected.data.id) return n; if (n.level !== 'subtopic') { const f = findNode((n as any).children ?? []); if (f) return f; } } return null; };
    const updated = findNode(tree);
    if (updated) setSelected(updated);
  }, [tree]);

  const toggle = (id: string) => setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const handleRename = async (node: SyllabusNode, name: string, oldName: string) => {
    const fns: Record<string, (id: string, u: any, old?: string) => Promise<any>> = { subject: updateSubject, module: updateModule, topic: updateTopic, subtopic: updateSubtopic };
    await fns[node.level](node.data.id, { name }, oldName); loadTree();
  };

  const handleSoftDelete = async (node: SyllabusNode) => {
    const fns: Record<string, (id: string) => Promise<any>> = { subject: softDeleteSubject, module: softDeleteModule, topic: softDeleteTopic, subtopic: softDeleteSubtopic };
    await fns[node.level](node.data.id);
    if (selected?.data.id === node.data.id) setSelected(null);

    // Show toast with undo
    if (deletedToast) clearTimeout(deletedToast.timeout);
    const timeout = setTimeout(() => setDeletedToast(null), 5000);
    setDeletedToast({ id: node.data.id, type: node.level as EntityType, name: node.data.name, timeout });

    loadTree();
  };

  const handleUndoDelete = async () => {
    if (!deletedToast) return;
    await restoreItem(deletedToast.id, deletedToast.type);
    clearTimeout(deletedToast.timeout);
    setDeletedToast(null);
    loadTree();
  };

  const handleAddChild = async (parent: SyllabusNode) => {
    const childLevel = LEVEL_CHILD[parent.level]; const name = `New ${LEVEL_LABELS[childLevel]}`;
    const siblings = (parent as any).children ?? []; const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((c: SyllabusNode) => c.data.display_order)) + 1 : 0;
    if (parent.level === 'subject') await createModule(parent.data.id, name, '', maxOrder);
    else if (parent.level === 'module') await createTopic(parent.data.id, name, '', maxOrder);
    else if (parent.level === 'topic') await createSubtopic(parent.data.id, name, '', maxOrder);
    setExpanded(prev => new Set(prev).add(parent.data.id)); loadTree();
  };

  const handleAddSubject = async () => { const maxOrder = tree.length > 0 ? Math.max(...tree.map(n => n.data.display_order)) + 1 : 0; await createSubject('New Subject', '', maxOrder); loadTree(); };

  const handleReorder = async (fromId: string, toId: string, level: string) => {
    const findSiblings = (nodes: SyllabusNode[], targetId: string): SyllabusNode[] | null => { if (nodes.some(n => n.data.id === targetId)) return nodes; for (const n of nodes) { if (n.level !== 'subtopic') { const f = findSiblings((n as any).children ?? [], targetId); if (f) return f; } } return null; };
    const siblings = findSiblings(tree, toId); if (!siblings) return;
    const dropIndex = siblings.findIndex(n => n.data.id === toId); if (dropIndex === -1) return;
    const updateFn: Record<string, (id: string, u: any) => Promise<any>> = { subject: updateSubject, module: updateModule, topic: updateTopic, subtopic: updateSubtopic };
    await updateFn[level](fromId, { display_order: dropIndex });
    for (let i = dropIndex; i < siblings.length; i++) { if (siblings[i].data.id !== fromId) await updateFn[level](siblings[i].data.id, { display_order: i + 1 }); }
    loadTree();
  };

  const handleBreadcrumbNavigate = (id: string) => {
    if (id === 'root') { setSelected(null); return; }
    const findNode = (nodes: SyllabusNode[]): SyllabusNode | null => { for (const n of nodes) { if (n.data.id === id) return n; if (n.level !== 'subtopic') { const f = findNode((n as any).children ?? []); if (f) return f; } } return null; };
    const node = findNode(tree);
    if (node) {
      setSelected(node);
      const expandAncestors = (targetId: string) => { const ids = new Set(expanded); const walk = (nodes: SyllabusNode[]): boolean => { for (const n of nodes) { if (n.data.id === targetId) return true; if (n.level !== 'subtopic' && walk((n as any).children ?? [])) { ids.add(n.data.id); return true; } } return false; }; walk(tree); setExpanded(ids); };
      expandAncestors(id);
    }
  };

  const filterTree = (nodes: SyllabusNode[], query: string): SyllabusNode[] => {
    if (!query) return nodes; const q = query.toLowerCase();
    return nodes.reduce<SyllabusNode[]>((acc, node) => {
      const nameMatch = node.data.name.toLowerCase().includes(q) || node.data.description.toLowerCase().includes(q);
      const filteredChildren = node.level !== 'subtopic' ? filterTree((node as any).children ?? [], query) : [];
      if (nameMatch || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren } as SyllabusNode);
      return acc;
    }, []);
  };

  const displayedTree = filterTree(tree, search);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Knowledge Base" description="Your dynamic syllabus and learning structure" action={
        <div className="flex gap-2">
          <a href="/recycle-bin" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"><Archive size={16} />Recycle Bin</a>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"><Download size={16} />{exporting ? 'Exporting...' : 'Export'}</button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"><Upload size={16} />Import</button>
          <button onClick={handleAddSubject} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Add Subject</button>
        </div>
      } />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter syllabus..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Tree (left panel) */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>
          ) : displayedTree.length === 0 ? (
            <EmptyState icon={<BookOpen size={24} />} title={search ? 'No matches found' : 'No subjects yet'} description={search ? 'Try a different search term' : 'Create your first subject or import a syllabus'} action={!search ? <button onClick={handleAddSubject} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Add Subject</button> : undefined} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200/60 p-4">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-400">{tree.reduce((sum, s) => { const count = (n: SyllabusNode): number => { let c = 1; if (n.level !== 'subtopic') c += ((n as any).children ?? []).reduce((a: number, ch: SyllabusNode) => a + count(ch), 0); return c; }; return sum + count(s); }, 0)} items</span>
                <div className="flex gap-1">
                  <button onClick={() => { const ids = new Set<string>(); const collect = (nodes: SyllabusNode[]) => { for (const n of nodes) { ids.add(n.data.id); if (n.level !== 'subtopic') collect((n as any).children ?? []); } }; collect(tree); setExpanded(ids); }} className="text-[11px] px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">Expand All</button>
                  <button onClick={() => setExpanded(new Set())} className="text-[11px] px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">Collapse All</button>
                </div>
              </div>
              <div className="space-y-0">
                {displayedTree.map(node => <TreeNode key={node.data.id} node={node} expanded={expanded} onToggle={toggle} selectedId={selected?.data.id ?? null} onSelect={setSelected} onRename={handleRename} onDelete={handleSoftDelete} onAddChild={handleAddChild} onReorder={handleReorder} dragId={dragId} dragOverId={dragOverId} setDragId={setDragId} setDragOverId={setDragOverId} />)}
              </div>
            </div>
          )}
        </div>

        {/* Workspace (right panel) */}
        <div className="lg:col-span-2">
          {selected ? (
            <TopicWorkspace node={selected} tree={tree} onNavigate={handleBreadcrumbNavigate} onUpdate={loadTree} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200/60 p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-400"><Layers size={20} /></div>
              <p className="text-sm text-gray-500 mb-1">Select a topic to open workspace</p>
              <p className="text-xs text-gray-400">Click any item in the tree to view its details</p>
            </div>
          )}
        </div>
      </div>

      {/* Undo toast */}
      <AnimatePresence>
        {deletedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          >
            <Trash2 size={16} />
            <span className="text-sm">{deletedToast.name} deleted</span>
            <button onClick={handleUndoDelete} className="flex items-center gap-1 text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors">
              <Undo size={12} />
              Undo
            </button>
            <button onClick={() => { clearTimeout(deletedToast.timeout); setDeletedToast(null); }} className="text-xs text-gray-400 hover:text-white">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} onImport={loadTree} />
    </div>
  );
}
