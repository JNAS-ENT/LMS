import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Flame, Plus, Clock, TrendingUp, Layers,
  CheckCircle2, Loader2, Circle, RotateCcw, Target, Trash2, Activity,
  StickyNote, HelpCircle, Link, Check, BarChart3, Code2, Tag, GitBranch,
} from 'lucide-react';
import {
  fetchSyllabusCounts, fetchLearningStats, fetchSyllabusTree,
  fetchStreakData, fetchJournalEntries, upsertJournalEntry,
  fetchDeletedItems, fetchActivityLog, fetchActivityStats, fetchContentStats,
  fetchMostUsedTags, fetchRecentlyUpdatedTopics, fetchMostReferencedTopics,
} from '../services/vault';
import type { SyllabusNode, JournalEntry, DeletedItem, ActivityLogEntry } from '../types';
import { timeAgo } from '../lib/utils';
import Modal from '../components/Modal';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const ACTION_LABELS: Record<string, string> = {
  create: 'Created', update: 'Updated', delete: 'Deleted', restore: 'Restored', rename: 'Renamed', move: 'Moved',
  solve: 'Solved', revise: 'Revised', add_note: 'Added note', add_question: 'Asked', add_resource: 'Added resource', add_highlight: 'Highlighted',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'text-emerald-600', update: 'text-blue-600', delete: 'text-red-600', restore: 'text-violet-600', rename: 'text-amber-600', move: 'text-gray-600',
  solve: 'text-green-600', revise: 'text-purple-600', add_note: 'text-blue-500', add_question: 'text-amber-500', add_resource: 'text-cyan-600', add_highlight: 'text-pink-600',
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  subject: <BookOpen size={12} />, module: <Layers size={12} />, topic: <TrendingUp size={12} />, subtopic: <FileText size={12} />,
  note: <StickyNote size={12} />, question: <HelpCircle size={12} />, resource: <Link size={12} />, highlight: <Check size={12} />, revision: <RotateCcw size={12} />,
};

export default function Dashboard() {
  const [counts, setCounts] = useState({ subjects: 0, modules: 0, topics: 0, subtopics: 0 });
  const [learning, setLearning] = useState({ topicsCompleted: 0, topicsLearning: 0, topicsPending: 0, overallProgress: 0, revisionsDue: 0 });
  const [streak, setStreak] = useState(0);
  const [recentJournal, setRecentJournal] = useState<JournalEntry[]>([]);
  const [quickNote, setQuickNote] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [recentSubjects, setRecentSubjects] = useState<SyllabusNode[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [activityStats, setActivityStats] = useState({ today: 0, week: 0, month: 0, notes: 0, questions: 0, resources: 0, highlights: 0, revisions: 0 });
  const [contentStats, setContentStats] = useState({ notes: 0, questions: 0, resources: 0, highlights: 0, revisions: 0, codeSnippets: 0 });
  const [mostUsedTags, setMostUsedTags] = useState<{ name: string; count: number }[]>([]);
  const [recentlyUpdatedTopics, setRecentlyUpdatedTopics] = useState<{ id: string; name: string; subjectName: string; updated_at: string }[]>([]);
  const [mostReferencedTopics, setMostReferencedTopics] = useState<{ id: string; name: string; subjectName: string; referenceCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [syllabusCounts, learningStats, streakData, journal, tree, deleted, activity, stats, content, tags, recentTopics, refTopics] = await Promise.all([
      fetchSyllabusCounts().catch(() => ({ subjects: 0, modules: 0, topics: 0, subtopics: 0 })),
      fetchLearningStats().catch(() => ({ topicsCompleted: 0, topicsLearning: 0, topicsPending: 0, overallProgress: 0, revisionsDue: 0 })),
      fetchStreakData(365).catch(() => []),
      fetchJournalEntries(5).catch(() => []),
      fetchSyllabusTree().catch(() => []),
      fetchDeletedItems().catch(() => []),
      fetchActivityLog(20).catch(() => []),
      fetchActivityStats().catch(() => ({ today: 0, week: 0, month: 0, notes: 0, questions: 0, resources: 0, highlights: 0, revisions: 0 })),
      fetchContentStats().catch(() => ({ notes: 0, questions: 0, resources: 0, highlights: 0, revisions: 0, codeSnippets: 0 })),
      fetchMostUsedTags(8).catch(() => []),
      fetchRecentlyUpdatedTopics(5).catch(() => []),
      fetchMostReferencedTopics(5).catch(() => []),
    ]);
    setCounts(syllabusCounts);
    setLearning(learningStats);
    setRecentJournal(journal);
    setRecentSubjects(tree.slice(0, 5));
    setDeletedItems(deleted.slice(0, 3));
    setActivityLog(activity);
    setActivityStats(stats);
    setContentStats(content);
    setMostUsedTags(tags);
    setRecentlyUpdatedTopics(recentTopics);
    setMostReferencedTopics(refTopics);
    setLoading(false);

    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (streakData.some((s) => s.date === ds)) { count++; }
      else if (i > 0) { break; }
    }
    setStreak(count);
  }

  const handleQuickAdd = async () => {
    if (!quickNote.trim()) return;
    await upsertJournalEntry({ entry_date: new Date().toISOString().split('T')[0], notes: quickNote, time_spent_minutes: 0 });
    setQuickNote('');
    setShowQuickAdd(false);
    loadData();
  };

  const statCards = [
    { label: 'Subjects', value: counts.subjects, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Modules', value: counts.modules, icon: Layers, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Topics', value: counts.topics, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'Subtopics', value: counts.subtopics, icon: FileText, color: 'bg-violet-50 text-violet-600' },
  ];

  const learningCards = [
    { label: 'Completed', value: learning.topicsCompleted, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Learning', value: learning.topicsLearning, icon: Loader2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: learning.topicsPending, icon: Circle, color: 'bg-gray-100 text-gray-600' },
    { label: 'Revisions Due', value: learning.revisionsDue, icon: RotateCcw, color: 'bg-amber-50 text-amber-600' },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Syllabus counts */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200/60 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Learning progress */}
        <motion.div variants={item}>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Learning Progress</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {learningCards.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200/60 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Overall progress + streak + quick add */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Progress</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{learning.overallProgress}%</p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${learning.overallProgress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{learning.topicsCompleted} of {learning.topicsCompleted + learning.topicsLearning + learning.topicsPending} topics completed</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-orange-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Streak</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{streak}</p>
            <p className="text-xs text-gray-500 mt-1">{streak === 1 ? 'day' : 'days'} in a row</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus size={16} className="text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Add</span>
            </div>
            <button onClick={() => setShowQuickAdd(true)} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors w-full">
              <Plus size={14} />Add today's learning note
            </button>
          </div>
        </motion.div>

        {/* Learning Timeline */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-gray-400" />
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Timeline</h2>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-8 gap-3">
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{activityStats.today}</p>
              <p className="text-[10px] text-gray-500">Today</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{activityStats.week}</p>
              <p className="text-[10px] text-gray-500">This Week</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{activityStats.month}</p>
              <p className="text-[10px] text-gray-500">This Month</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center col-span-3 lg:col-span-1">
              <p className="text-xl font-bold text-blue-600">{activityStats.notes}</p>
              <p className="text-[10px] text-gray-500">Notes Added</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center">
              <p className="text-xl font-bold text-green-600">{activityStats.questions}</p>
              <p className="text-[10px] text-gray-500">Solved</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center">
              <p className="text-xl font-bold text-cyan-600">{activityStats.resources}</p>
              <p className="text-[10px] text-gray-500">Resources</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-3 text-center">
              <p className="text-xl font-bold text-purple-600">{activityStats.revisions}</p>
              <p className="text-[10px] text-gray-500">Revisions</p>
            </div>
          </div>
        </motion.div>

        {/* Learning Analytics */}
        <motion.div variants={item}>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Learning Analytics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <StickyNote size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{contentStats.notes}</p>
                <p className="text-[10px] text-gray-500">Total Notes</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <HelpCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{contentStats.questions}</p>
                <p className="text-[10px] text-gray-500">Questions</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Link size={18} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{contentStats.resources}</p>
                <p className="text-[10px] text-gray-500">Resources</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                <Check size={18} className="text-pink-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{contentStats.highlights}</p>
                <p className="text-[10px] text-gray-500">Highlights</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <RotateCcw size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{contentStats.revisions}</p>
                <p className="text-[10px] text-gray-500">Revisions</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Code2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{contentStats.codeSnippets}</p>
                <p className="text-[10px] text-gray-500">Code Snippets</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Knowledge Network Stats */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Most Used Tags */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={14} className="text-gray-400" />
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Most Used Tags</h3>
            </div>
            {mostUsedTags.length === 0 ? (
              <p className="text-sm text-gray-400">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mostUsedTags.map(t => (
                  <span key={t.name} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                    #{t.name} <span className="text-gray-400">({t.count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recently Updated Topics */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recently Updated</h3>
            </div>
            {recentlyUpdatedTopics.length === 0 ? (
              <p className="text-sm text-gray-400">No topics yet</p>
            ) : (
              <div className="space-y-2">
                {recentlyUpdatedTopics.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.subjectName}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(t.updated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Referenced Topics */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch size={14} className="text-gray-400" />
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Most Referenced</h3>
            </div>
            {mostReferencedTopics.length === 0 ? (
              <p className="text-sm text-gray-400">No relationships yet</p>
            ) : (
              <div className="space-y-2">
                {mostReferencedTopics.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.subjectName}</p>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full shrink-0">{t.referenceCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent activity and deleted items */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Activity (Last 20)</h3>
              <Activity size={14} className="text-gray-400" />
            </div>
            {activityLog.length === 0 ? (
              <p className="text-sm text-gray-400">No activity yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activityLog.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-gray-400 shrink-0">{ENTITY_ICONS[a.entity_type] || <Activity size={12} />}</span>
                      <span className={`text-xs font-medium ${ACTION_COLORS[a.action] || 'text-gray-600'}`}>{ACTION_LABELS[a.action] || a.action}</span>
                      <span className="text-sm text-gray-900 truncate">{a.entity_name}</span>
                      {a.details?.topic_name && <span className="text-xs text-gray-400">in {a.details.topic_name as string}</span>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Deleted */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recently Deleted</h3>
              <a href="/recycle-bin" className="text-xs text-blue-600 hover:underline">View All</a>
            </div>
            {deletedItems.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Trash2 size={14} />
                <span>No deleted items</span>
              </div>
            ) : (
              <div className="space-y-3">
                {deletedItems.map((d) => (
                  <div key={`${d.type}-${d.id}`} className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      <Trash2 size={12} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900 truncate">{d.name}</span>
                      <span className="text-xs text-gray-400 capitalize">({d.type})</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">{timeAgo(d.deleted_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Subjects & Journal */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Recent Subjects</h3>
            {recentSubjects.length === 0 ? (
              <p className="text-sm text-gray-400">No subjects yet</p>
            ) : (
              <div className="space-y-3">
                {recentSubjects.map((s) => (
                  <div key={s.data.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.data.name}</p>
                      <p className="text-xs text-gray-500">{(s as any).children?.length ?? 0} modules</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">{timeAgo(s.data.updated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200/60 p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Recent Journal</h3>
            {recentJournal.length === 0 ? (
              <p className="text-sm text-gray-400">No entries yet</p>
            ) : (
              <div className="space-y-3">
                {recentJournal.map((j) => (
                  <div key={j.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(j.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{j.topics_learned || j.notes || 'No topics'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-3">
                      <Clock size={10} />{j.time_spent_minutes}m
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick Add Note">
        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="What did you learn today?"
          className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
        />
        <div className="flex justify-end mt-4">
          <button onClick={handleQuickAdd} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">Save</button>
        </div>
      </Modal>
    </div>
  );
}
