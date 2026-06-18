import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Map, Trash2, Edit3, GripVertical } from 'lucide-react';
import { fetchRoadmapItems, createRoadmapItem, updateRoadmapItem, deleteRoadmapItem } from '../services/vault';
import type { RoadmapItem } from '../types';
import { ROADMAP_STATUSES, type RoadmapStatus } from '../lib/constants';
import { formatDate } from '../lib/utils';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-50 text-blue-600',
  'Completed': 'bg-emerald-50 text-emerald-600',
};

const STATUS_BAR: Record<string, string> = {
  'Not Started': 'bg-gray-200',
  'In Progress': 'bg-blue-400',
  'Completed': 'bg-emerald-500',
};

export default function LearningRoadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [goal, setGoal] = useState('');
  const [milestone, setMilestone] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [completionStatus, setCompletionStatus] = useState<RoadmapStatus>('Not Started');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  const loadItems = useCallback(async () => {
    const data = await fetchRoadmapItems();
    setItems(data);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const openCreate = () => {
    setEditing(null);
    setGoal(''); setMilestone(''); setTargetDate(''); setCompletionStatus('Not Started');
    setCategory(''); setNotes('');
    setShowModal(true);
  };

  const openEdit = (item: RoadmapItem) => {
    setEditing(item);
    setGoal(item.goal); setMilestone(item.milestone);
    setTargetDate(item.target_date || '');
    setCompletionStatus(item.completion_status);
    setCategory(item.category); setNotes(item.notes);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!goal.trim()) return;
    const data = {
      goal, milestone, target_date: targetDate || null,
      completion_status: completionStatus, category, notes,
    };
    if (editing) {
      await updateRoadmapItem(editing.id, data);
    } else {
      await createRoadmapItem(data);
    }
    setShowModal(false);
    loadItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRoadmapItem(deleteId);
    setDeleteId(null);
    loadItems();
  };

  const cycleStatus = async (item: RoadmapItem) => {
    const order: RoadmapStatus[] = ['Not Started', 'In Progress', 'Completed'];
    const idx = order.indexOf(item.completion_status);
    const next = order[(idx + 1) % order.length];
    await updateRoadmapItem(item.id, { completion_status: next });
    loadItems();
  };

  const completedCount = items.filter((i) => i.completion_status === 'Completed').length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // Kanban columns
  const kanbanColumns = ROADMAP_STATUSES.map((status) => ({
    status,
    items: items.filter((i) => i.completion_status === status),
  }));

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Learning Roadmap" description="Plan your long-term learning goals"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />Add Goal
          </button>
        }
      />

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/60 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Overall Progress</span>
            <span className="text-xs font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-[11px] text-gray-400">
            <span>{completedCount} completed</span>
            <span>{items.filter((i) => i.completion_status === 'In Progress').length} in progress</span>
            <span>{items.filter((i) => i.completion_status === 'Not Started').length} not started</span>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setViewMode('list')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          List
        </button>
        <button onClick={() => setViewMode('kanban')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Kanban
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Map size={24} />} title="No goals yet" description="Create your first learning goal" action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Add Goal</button>
        } />
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => (
            <div key={col.status} className="bg-gray-50 rounded-xl p-3 min-h-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${STATUS_BAR[col.status]}`} />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.status}</h3>
                <span className="text-[11px] text-gray-400 ml-auto">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-200/60 p-3 hover:shadow-sm transition-shadow group">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 flex-1 mr-2">{item.goal}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Edit3 size={12} /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {item.milestone && <p className="text-xs text-gray-500 mb-1">{item.milestone}</p>}
                    {item.target_date && <p className="text-[11px] text-gray-400">{formatDate(item.target_date)}</p>}
                    <button onClick={() => cycleStatus(item)} className="mt-2 text-[11px] text-gray-500 hover:text-gray-700 transition-colors">
                      Move to next status →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-lg border border-gray-200/60 p-4 hover:shadow-sm transition-shadow group flex items-center gap-4"
              >
                <button onClick={() => cycleStatus(item)} className="shrink-0" title="Cycle status">
                  <span className={`w-3 h-3 rounded-full block ${STATUS_BAR[item.completion_status]}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.goal}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.milestone && <span className="text-xs text-gray-500">{item.milestone}</span>}
                    {item.target_date && <span className="text-[11px] text-gray-400">{formatDate(item.target_date)}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.completion_status]}`}>{item.completion_status}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Edit3 size={14} /></button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Goal' : 'New Goal'}>
        <div className="space-y-4">
          <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <input type="text" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="Milestone"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <select value={completionStatus} onChange={(e) => setCompletionStatus(e.target.value as RoadmapStatus)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            {ROADMAP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes"
            className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Goal" message="Are you sure you want to delete this learning goal?" />
    </div>
  );
}
