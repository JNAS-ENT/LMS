import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { fetchPapers, createPaper, updatePaper, deletePaper } from '../services/vault';
import type { ResearchPaper } from '../types';
import { timeAgo } from '../lib/utils';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResearchPapers() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [filtered, setFiltered] = useState<ResearchPaper[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResearchPaper | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPaper, setViewPaper] = useState<ResearchPaper | null>(null);

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfLink, setPdfLink] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const loadPapers = useCallback(async () => {
    const data = await fetchPapers();
    setPapers(data);
  }, []);

  useEffect(() => { loadPapers(); }, [loadPapers]);

  useEffect(() => {
    let result = papers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [papers, search]);

  const openCreate = () => {
    setEditing(null);
    setTitle(''); setAuthors(''); setSummary(''); setNotes(''); setPdfLink(''); setTags([]);
    setShowModal(true);
  };

  const openEdit = (p: ResearchPaper) => {
    setEditing(p);
    setTitle(p.title); setAuthors(p.authors); setSummary(p.summary); setNotes(p.notes); setPdfLink(p.pdf_link); setTags(p.tags);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editing) {
      await updatePaper(editing.id, { title, authors, summary, notes, pdf_link: pdfLink, tags });
    } else {
      await createPaper({ title, authors, summary, notes, pdf_link: pdfLink, tags });
    }
    setShowModal(false);
    loadPapers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deletePaper(deleteId);
    setDeleteId(null);
    loadPapers();
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Research Papers" description="Track papers you read and study"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />Add Paper
          </button>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search papers..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={24} />} title="No papers found" description="Add your first research paper" action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Add Paper</button>
        } />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-sm transition-shadow cursor-pointer group"
                onClick={() => setViewPaper(p)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{p.title}</h3>
                    {p.authors && <p className="text-xs text-gray-500">{p.authors}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.pdf_link && (
                      <a href={p.pdf_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                {p.summary && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{p.summary}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{t}</span>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400">{timeAgo(p.updated_at)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* View Paper */}
      <Modal open={!!viewPaper} onClose={() => setViewPaper(null)} title={viewPaper?.title || ''} wide>
        {viewPaper && (
          <div className="space-y-4">
            {viewPaper.authors && <p className="text-sm text-gray-500">{viewPaper.authors}</p>}
            {viewPaper.pdf_link && (
              <a href={viewPaper.pdf_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
                <ExternalLink size={14} />View PDF
              </a>
            )}
            {viewPaper.summary && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Summary</p>
                <div className="prose prose-sm max-w-none prose-gray">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewPaper.summary}</ReactMarkdown>
                </div>
              </div>
            )}
            {viewPaper.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">My Notes</p>
                <div className="prose prose-sm max-w-none prose-gray">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewPaper.notes}</ReactMarkdown>
                </div>
              </div>
            )}
            {viewPaper.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewPaper.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Paper' : 'New Paper'} wide>
        <div className="space-y-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paper title"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Authors"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <input type="url" value={pdfLink} onChange={(e) => setPdfLink(e.target.value)} placeholder="PDF Link (URL)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Paper summary (Markdown supported)"
            className="w-full h-28 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your notes and key learnings (Markdown supported)"
            className="w-full h-28 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
          <TagInput tags={tags} onChange={setTags} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Paper" message="Are you sure you want to delete this paper?" />
    </div>
  );
}
