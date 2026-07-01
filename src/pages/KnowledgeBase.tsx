import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronRight, Trash2, BookOpen, FolderOpen, Layers, FileText,
  GripVertical, Search, Home, Pencil, Eye, StickyNote, HelpCircle,
  Link, RotateCcw, ExternalLink, Upload, Check, Undo, Archive, Download,
  FileArchive, Sparkles, BookMarked, BarChart3, Network,
} from 'lucide-react';
import {
  fetchSyllabusTree, createSubject, createModule, createTopic,
  createSubtopic, updateSubject, updateModule, updateTopic,
  updateSubtopic, softDeleteSubject, softDeleteModule, softDeleteTopic,
  softDeleteSubtopic, restoreItem, exportSyllabusJSON,
  detectAndSetStatus, importSyllabusText,
} from '../services/vault';
import type {
  SyllabusNode, Subject, Module, Topic, Subtopic, LearningStatus, EntityType,
} from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import {
  OverviewTab, NotesTab, QuestionsTab, ResourcesTab, AttachmentsTab,
  BookmarksTab, ResearchTab, RevisionTab, AITab, AnalyticsTab,
} from '../components/kb-workspace';
import { KnowledgeGraphTab } from '../components/kb-graph';

// ─── Constants ──────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = { subject: 'Subject', module: 'Module', topic: 'Topic', subtopic: 'Subtopic' };
const LEVEL_CHILD: Record<string, string> = { subject: 'module', module: 'topic', topic: 'subtopic' };
const LEVEL_ICONS: Record<string, React.ReactNode> = { subject: <BookOpen size={14} />, module: <FolderOpen size={14} />, topic: <Layers size={14} />, subtopic: <FileText size={14} /> };
const LEVEL_COLORS: Record<string, string> = { subject: 'text-gray-900 font-semibold', module: 'text-gray-800 font-medium', topic: 'text-gray-700', subtopic: 'text-gray-600' };
const LEVEL_BADGE_COLORS: Record<string, string> = { subject: 'bg-gray-900 text-white', module: 'bg-blue-100 text-blue-700', topic: 'bg-emerald-100 text-emerald-700', subtopic: 'bg-amber-100 text-amber-700' };
const INDENT: Record<string, number> = { subject: 0, module: 1, topic: 2, subtopic: 3 };
const STATUS_COLORS: Record<LearningStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600', Learning: 'bg-blue-100 text-blue-700',
  Practicing: 'bg-amber-100 text-amber-700', Completed: 'bg-emerald-100 text-emerald-700',
  Revised: 'bg-violet-100 text-violet-700', Mastered: 'bg-green-100 text-green-700',
};

const WORKSPACE_TABS = [
  { key: 'overview', label: 'Overview', icon: Eye },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'questions', label: 'Questions', icon: HelpCircle },
  { key: 'resources', label: 'Resources', icon: Link },
  { key: 'attachments', label: 'Files', icon: FileArchive },
  { key: 'bookmarks', label: 'Bookmarks', icon: BookMarked },
  { key: 'research', label: 'Research', icon: FileText },
  { key: 'revision', label: 'Revision', icon: RotateCcw },
  { key: 'ai', label: 'AI', icon: Sparkles },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'graph', label: 'Graph', icon: Network },
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

// ─── Topic Workspace (right panel) ──────────────────────────────

function TopicWorkspace({ node, tree, onNavigate, onUpdate }: {
  node: SyllabusNode; tree: SyllabusNode[]; onNavigate: (id: string) => void; onUpdate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => { setActiveTab('overview'); }, [node.data.id]);

  const breadcrumb = buildBreadcrumb(node, tree);
  const data = node.data as Topic | Subtopic;

  // Lazy-load tab content only when active to keep things fast
  const tabProps = { node, onUpdate, onNavigate: (tab: string) => setActiveTab(tab as TabKey) };

  return (
    <motion.div key={node.data.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
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

      <div className="px-5 pt-4 flex items-center gap-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${LEVEL_BADGE_COLORS[node.level]}`}>{node.level}</span>
        {(node.level === 'topic' || node.level === 'subtopic') && data.status !== 'Not Started' && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[data.status]}`}>{data.status}</span>
        )}
        {(node.level === 'topic' || node.level === 'subtopic') && (
          <span className="text-[10px] text-gray-400">{data.progress}%</span>
        )}
      </div>

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

      <div className="p-5">
        {activeTab === 'overview' && <OverviewTab {...tabProps} />}
        {activeTab === 'notes' && <NotesTab {...tabProps} />}
        {activeTab === 'questions' && <QuestionsTab {...tabProps} />}
        {activeTab === 'resources' && <ResourcesTab node={node} />}
        {activeTab === 'attachments' && <AttachmentsTab node={node} />}
        {activeTab === 'bookmarks' && <BookmarksTab node={node} />}
        {activeTab === 'research' && <ResearchTab node={node} />}
        {activeTab === 'revision' && <RevisionTab {...tabProps} />}
        {activeTab === 'ai' && <AITab node={node} />}
        {activeTab === 'analytics' && <AnalyticsTab node={node} />}
        {activeTab === 'graph' && <KnowledgeGraphTab node={node} tree={tree} onNavigate={onNavigate} />}
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
  const [mobileView, setMobileView] = useState<'tree' | 'workspace'>('tree');
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

  useEffect(() => { return () => { if (deletedToast) clearTimeout(deletedToast.timeout); }; }, [deletedToast]);

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
    if (id === 'root') { setSelected(null); setMobileView('tree'); return; }
    const findNode = (nodes: SyllabusNode[]): SyllabusNode | null => { for (const n of nodes) { if (n.data.id === id) return n; if (n.level !== 'subtopic') { const f = findNode((n as any).children ?? []); if (f) return f; } } return null; };
    const node = findNode(tree);
    if (node) {
      setSelected(node);
      setMobileView('workspace');
      const expandAncestors = (targetId: string) => { const ids = new Set(expanded); const walk = (nodes: SyllabusNode[]): boolean => { for (const n of nodes) { if (n.data.id === targetId) return true; if (n.level !== 'subtopic' && walk((n as any).children ?? [])) { ids.add(n.data.id); return true; } } return false; }; walk(tree); setExpanded(ids); };
      expandAncestors(id);
    }
  };

  const handleSelectNode = (node: SyllabusNode) => {
    setSelected(node);
    setMobileView('workspace');
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Knowledge Base" description="Your dynamic syllabus and learning structure" action={
        <div className="flex gap-2 flex-wrap">
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

      {/* Mobile view toggle */}
      <div className="flex lg:hidden mb-4 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setMobileView('tree')} className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${mobileView === 'tree' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Tree</button>
        <button onClick={() => setMobileView('workspace')} disabled={!selected} className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${mobileView === 'workspace' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'} disabled:opacity-40`}>Workspace</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Tree (left panel) */}
        <div className={`lg:col-span-3 ${mobileView === 'workspace' ? 'hidden lg:block' : ''}`}>
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
              <div className="space-y-0 max-h-[70vh] overflow-y-auto">
                {displayedTree.map(node => <TreeNode key={node.data.id} node={node} expanded={expanded} onToggle={toggle} selectedId={selected?.data.id ?? null} onSelect={handleSelectNode} onRename={handleRename} onDelete={handleSoftDelete} onAddChild={handleAddChild} onReorder={handleReorder} dragId={dragId} dragOverId={dragOverId} setDragId={setDragId} setDragOverId={setDragOverId} />)}
              </div>
            </div>
          )}
        </div>

        {/* Workspace (right panel) */}
        <div className={`lg:col-span-2 ${mobileView === 'tree' ? 'hidden lg:block' : ''}`}>
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
