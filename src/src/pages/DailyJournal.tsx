import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Clock, Lightbulb, ListTodo, BookOpen, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { fetchJournalEntries, upsertJournalEntry, deleteJournalEntry } from '../services/vault';
import type { JournalEntry } from '../types';
import { formatDate, formatDateLong } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

export default function DailyJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Editor form
  const [topicsLearned, setTopicsLearned] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [notes, setNotes] = useState('');
  const [keyInsights, setKeyInsights] = useState('');
  const [actionItems, setActionItems] = useState('');

  const loadEntries = useCallback(async () => {
    const data = await fetchJournalEntries(60);
    setEntries(data);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const found = entries.find((e) => e.entry_date === selectedDate);
    setCurrentEntry(found || null);
  }, [entries, selectedDate]);

  const openEditor = (date?: string) => {
    const d = date || selectedDate;
    setSelectedDate(d);
    const found = entries.find((e) => e.entry_date === d);
    setTopicsLearned(found?.topics_learned || '');
    setTimeSpent(found?.time_spent_minutes || 0);
    setNotes(found?.notes || '');
    setKeyInsights(found?.key_insights || '');
    setActionItems(found?.action_items || '');
    setShowEditor(true);
  };

  const handleSave = async () => {
    await upsertJournalEntry({
      entry_date: selectedDate,
      topics_learned: topicsLearned,
      time_spent_minutes: timeSpent,
      notes,
      key_insights: keyInsights,
      action_items: actionItems,
    });
    setShowEditor(false);
    loadEntries();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteJournalEntry(deleteId);
    setDeleteId(null);
    loadEntries();
  };

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Calendar helper
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const now = new Date(selectedDate);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const entryDates = new Set(entries.map((e) => e.entry_date));

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, date: dateStr, hasEntry: entryDates.has(dateStr) });
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateDate(-30)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
          <h3 className="text-sm font-semibold text-gray-900">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => navigateDate(30)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-[11px] text-gray-400 py-1">{d}</div>
          ))}
          {days.map((d, i) => (
            <div key={i} className="py-1">
              {d && (
                <button
                  onClick={() => setSelectedDate(d.date)}
                  className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors ${
                    d.date === selectedDate
                      ? 'bg-gray-900 text-white'
                      : d.hasEntry
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {d.day}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Daily Journal"
        description="Track your daily learning progress"
        action={
          <button onClick={() => openEditor()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />
            Today's Entry
          </button>
        }
      />

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Timeline
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Calendar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar or entry list */}
        <div className="lg:col-span-1">
          {viewMode === 'calendar' ? (
            renderCalendar()
          ) : (
            <div className="space-y-2">
              {entries.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays size={24} />}
                  title="No entries yet"
                  description="Start journaling your learning journey"
                />
              ) : (
                entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedDate(entry.entry_date)}
                    className={`w-full text-left bg-white rounded-lg border p-3 transition-all hover:shadow-sm ${
                      entry.entry_date === selectedDate ? 'border-gray-900' : 'border-gray-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{formatDate(entry.entry_date)}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />
                        {entry.time_spent_minutes}m
                      </div>
                    </div>
                    {entry.topics_learned && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{entry.topics_learned}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Selected entry detail */}
        <div className="lg:col-span-2">
          {currentEntry ? (
            <div className="bg-white rounded-xl border border-gray-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{formatDateLong(currentEntry.entry_date)}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditor(currentEntry.entry_date)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setDeleteId(currentEntry.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <BookOpen size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Topics Learned</p>
                    <p className="text-sm text-gray-900">{currentEntry.topics_learned || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Time Spent</p>
                    <p className="text-sm text-gray-900">{currentEntry.time_spent_minutes} minutes</p>
                  </div>
                </div>
              </div>

              {currentEntry.notes && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentEntry.notes}</p>
                </div>
              )}
              {currentEntry.key_insights && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb size={12} className="text-amber-500" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Insights</p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentEntry.key_insights}</p>
                </div>
              )}
              {currentEntry.action_items && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListTodo size={12} className="text-blue-500" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action Items</p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentEntry.action_items}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200/60 p-8 flex flex-col items-center justify-center min-h-[300px]">
              <CalendarDays className="text-gray-300 mb-3" size={32} />
              <p className="text-sm text-gray-500 mb-3">No entry for {formatDateLong(selectedDate)}</p>
              <button onClick={() => openEditor()} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
                Create Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Modal open={showEditor} onClose={() => setShowEditor(false)} title={`Journal Entry - ${formatDate(selectedDate)}`} wide>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Topics Learned</label>
            <input
              type="text"
              value={topicsLearned}
              onChange={(e) => setTopicsLearned(e.target.value)}
              placeholder="e.g. Transformer architecture, Attention mechanism"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Time Spent (minutes)</label>
            <input
              type="number"
              value={timeSpent}
              onChange={(e) => setTimeSpent(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn today?"
              className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Key Insights</label>
            <textarea
              value={keyInsights}
              onChange={(e) => setKeyInsights(e.target.value)}
              placeholder="What were your 'aha' moments?"
              className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Action Items</label>
            <textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="What will you do next?"
              className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowEditor(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
              Save Entry
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this journal entry?"
      />
    </div>
  );
}
