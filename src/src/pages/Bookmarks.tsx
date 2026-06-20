import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Bookmark, Trash2, Edit3, ExternalLink, Youtube, Github, GraduationCap, BookOpen, FileQuestion } from 'lucide-react';
import { fetchBookmarks, createBookmark, updateBookmark, deleteBookmark } from '../services/vault';
import type { Bookmark as BookmarkType } from '../types';
import { BOOKMARK_CATEGORIES, type BookmarkCategory } from '../lib/constants';
import { timeAgo } from '../lib/utils';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const CAT_ICONS: Record<string, React.ReactNode> = {
  YouTube: <Youtube size={14} className="text-red-500" />,
  GitHub: <Github size={14} />,
  Courses: <GraduationCap size={14} className="text-blue-500" />,
  Blogs: <BookOpen size={14} className="text-emerald-500" />,
  Documentation: <FileQuestion size={14} className="text-amber-500" />,
};

const CAT_COLORS: Record<string, string> = {
  YouTube: 'bg-red-50 text-red-600',
  GitHub: 'bg-gray-100 text-gray-700',
  Courses: 'bg-blue-50 text-blue-600',
  Blogs: 'bg-emerald-50 text-emerald-600',
  Documentation: 'bg-amber-50 text-amber-600',
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [filtered, setFiltered] = useState<BookmarkType[]>([]);
  const [category, setCategory] = useState<BookmarkCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BookmarkType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [cat, setCat] = useState<BookmarkCategory>('Blogs');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const loadBookmarks = useCallback(async () => {
    const data = await fetchBookmarks(category === 'All' ? undefined : category);
    setBookmarks(data);
  }, [category]);

  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  useEffect(() => {
    let result = bookmarks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [bookmarks, search]);

  const openCreate = () => {
    setEditing(null);
    setTitle(''); setUrl(''); setCat(category !== 'All' ? category as BookmarkCategory : 'Blogs');
    setDescription(''); setTags([]);
    setShowModal(true);
  };

  const openEdit = (b: BookmarkType) => {
    setEditing(b);
    setTitle(b.title); setUrl(b.url); setCat(b.category);
    setDescription(b.description); setTags(b.tags);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;
    if (editing) {
      await updateBookmark(editing.id, { title, url, category: cat, description, tags });
    } else {
      await createBookmark({ title, url, category: cat, description, tags });
    }
    setShowModal(false);
    loadBookmarks();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBookmark(deleteId);
    setDeleteId(null);
    loadBookmarks();
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Bookmarks" description="Save useful resources and links"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />Add Bookmark
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bookmarks..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as BookmarkCategory | 'All')}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
          <option value="All">All Categories</option>
          {BOOKMARK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Bookmark size={24} />} title="No bookmarks found" description="Save your first resource" action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Add Bookmark</button>
        } />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((b) => (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-lg border border-gray-200/60 p-4 hover:shadow-sm transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${CAT_COLORS[b.category]}`}>
                    {CAT_ICONS[b.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a href={b.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                        {b.title}
                      </a>
                      <ExternalLink size={12} className="text-gray-400 shrink-0" />
                    </div>
                    {b.description && <p className="text-xs text-gray-500 truncate mt-0.5">{b.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${CAT_COLORS[b.category]}`}>{b.category}</span>
                      {b.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-gray-400 mr-2">{timeAgo(b.updated_at)}</span>
                    <button onClick={() => openEdit(b)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button>
                    <button onClick={() => setDeleteId(b.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Bookmark' : 'New Bookmark'}>
        <div className="space-y-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <select value={cat} onChange={(e) => setCat(e.target.value as BookmarkCategory)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            {BOOKMARK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <TagInput tags={tags} onChange={setTags} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Bookmark" message="Are you sure you want to delete this bookmark?" />
    </div>
  );
}
