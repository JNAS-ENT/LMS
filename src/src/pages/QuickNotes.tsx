import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, Trash2, X } from 'lucide-react';
import { fetchQuickNotes, createQuickNote, updateQuickNote, deleteQuickNote } from '../services/vault';
import type { QuickNote } from '../types';
import { NOTE_COLORS } from '../lib/constants';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

export default function QuickNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#FFFFFF');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    const data = await fetchQuickNotes();
    setNotes(data);
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    await createQuickNote({ content: newContent, color: newColor, position_x: 0, position_y: 0 });
    setNewContent('');
    setNewColor('#FFFFFF');
    setShowNew(false);
    loadNotes();
  };

  const handleUpdate = async (id: string, content: string) => {
    await updateQuickNote(id, { content });
    loadNotes();
  };

  const handleDelete = async (id: string) => {
    await deleteQuickNote(id);
    loadNotes();
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Quick Notes" description="Jot down thoughts instantly"
        action={
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />New Note
          </button>
        }
      />

      {/* New note form */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${newColor === c.value ? 'scale-110 border-gray-900' : 'border-gray-200'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <button onClick={() => setShowNew(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={14} /></button>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Type your note..."
              className="w-full h-24 bg-transparent text-sm focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-end mt-2">
              <button onClick={handleCreate} className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors">
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid */}
      {notes.length === 0 && !showNew ? (
        <EmptyState icon={<StickyNote size={24} />} title="No quick notes" description="Jot down a quick thought" action={
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />New Note</button>
        } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="rounded-xl border border-gray-200/60 p-4 shadow-sm hover:shadow-md transition-shadow group relative"
                style={{ backgroundColor: note.color }}
              >
                <button
                  onClick={() => handleDelete(note.id)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-black/5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
                {editingId === note.id ? (
                  <textarea
                    defaultValue={note.content}
                    onBlur={(e) => { handleUpdate(note.id, e.target.value); setEditingId(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) { handleUpdate(note.id, (e.target as HTMLTextAreaElement).value); setEditingId(null); } }}
                    className="w-full h-20 bg-transparent text-sm focus:outline-none resize-none"
                    autoFocus
                  />
                ) : (
                  <p
                    onClick={() => setEditingId(note.id)}
                    className="text-sm text-gray-800 whitespace-pre-wrap cursor-text min-h-[40px]"
                  >
                    {note.content}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-2">
                  {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
