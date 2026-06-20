import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Code2, Copy, Trash2, Edit3, Check } from 'lucide-react';
import { fetchCodeSnippets, createCodeSnippet, updateCodeSnippet, deleteCodeSnippet } from '../services/vault';
import type { CodeSnippet } from '../types';
import { CODE_LANGUAGES, type CodeLanguage } from '../lib/constants';
import { timeAgo } from '../lib/utils';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const LANG_COLORS: Record<string, string> = {
  Python: 'bg-blue-50 text-blue-600',
  SQL: 'bg-emerald-50 text-emerald-600',
  JavaScript: 'bg-amber-50 text-amber-600',
  Bash: 'bg-gray-100 text-gray-600',
  PowerShell: 'bg-violet-50 text-violet-600',
};

export default function CodeVault() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [filtered, setFiltered] = useState<CodeSnippet[]>([]);
  const [language, setLanguage] = useState<CodeLanguage | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CodeSnippet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewSnippet, setViewSnippet] = useState<CodeSnippet | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [lang, setLang] = useState<CodeLanguage>('Python');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');

  const loadSnippets = useCallback(async () => {
    const data = await fetchCodeSnippets(language === 'All' ? undefined : language);
    setSnippets(data);
  }, [language]);

  useEffect(() => { loadSnippets(); }, [loadSnippets]);

  useEffect(() => {
    let result = snippets;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [snippets, search]);

  const openCreate = () => {
    setEditing(null);
    setTitle(''); setCode(''); setLang(language !== 'All' ? language : 'Python');
    setDescription(''); setTags([]); setCategory('');
    setShowModal(true);
  };

  const openEdit = (s: CodeSnippet) => {
    setEditing(s);
    setTitle(s.title); setCode(s.code); setLang(s.language as CodeLanguage);
    setDescription(s.description); setTags(s.tags); setCategory(s.category);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) return;
    if (editing) {
      await updateCodeSnippet(editing.id, { title, code, language: lang, description, tags, category });
    } else {
      await createCodeSnippet({ title, code, language: lang, description, tags, category });
    }
    setShowModal(false);
    loadSnippets();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCodeSnippet(deleteId);
    setDeleteId(null);
    loadSnippets();
  };

  const copyCode = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Code Vault"
        description="Your reusable code snippets"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />
            New Snippet
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          />
        </div>
        <select
          value={language} onChange={(e) => setLanguage(e.target.value as CodeLanguage | 'All')}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        >
          <option value="All">All Languages</option>
          {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Code2 size={24} />} title="No snippets found" description="Save your first code snippet" action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Add Snippet</button>
        } />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((s) => (
              <motion.div
                key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-gray-200/60 overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LANG_COLORS[s.language] || 'bg-gray-100 text-gray-600'}`}>
                      {s.language}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{s.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button onClick={() => copyCode(s.id, s.code)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      {copiedId === s.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <pre className="bg-gray-950 text-gray-200 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{s.code}</code>
                  </pre>
                  {s.description && <p className="text-xs text-gray-500 mt-3">{s.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-1">
                      {s.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{t}</span>
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400">{timeAgo(s.updated_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Snippet' : 'New Snippet'} wide>
        <div className="space-y-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Snippet title"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <select value={lang} onChange={(e) => setLang(e.target.value as CodeLanguage)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here..."
            className="w-full h-48 bg-gray-950 text-gray-200 border border-gray-700 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-500/30 resize-none" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <TagInput tags={tags} onChange={setTags} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Snippet" message="Are you sure you want to delete this code snippet?" />
    </div>
  );
}
