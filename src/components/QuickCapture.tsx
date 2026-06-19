import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, HelpCircle, Link, Check, ChevronRight, StickyNote } from 'lucide-react';
import {
  fetchSyllabusTree,
  createTopicNote,
  createTopicQuestion,
  createTopicResource,
  createTopicHighlight,
  logActivity,
} from '../services/vault';
import type { SyllabusNode, ResourceType, HighlightType } from '../types';

type CaptureType = 'note' | 'question' | 'resource' | 'highlight' | null;

const CAPTURE_TYPES: { key: CaptureType; label: string; icon: React.ReactNode }[] = [
  { key: 'note', label: 'Note', icon: <StickyNote size={18} /> },
  { key: 'question', label: 'Question', icon: <HelpCircle size={18} /> },
  { key: 'resource', label: 'Resource', icon: <Link size={18} /> },
  { key: 'highlight', label: 'Highlight', icon: <Check size={18} /> },
];

const RESOURCE_TYPES: ResourceType[] = ['Website', 'Google Drive', 'PDF', 'YouTube', 'GitHub', 'Dataset', 'Research Paper'];
const HIGHLIGHT_TYPES: HighlightType[] = ['Key Concept', 'Formula', 'Interview Question', 'Important Note'];

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>(null);
  const [tree, setTree] = useState<SyllabusNode[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // Form fields
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('Website');
  const [highlightContent, setHighlightContent] = useState('');
  const [highlightType, setHighlightType] = useState<HighlightType>('Key Concept');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadTree();
  }, [open]);

  const loadTree = async () => {
    const data = await fetchSyllabusTree();
    setTree(data);
  };

  const resetForm = () => {
    setCaptureType(null);
    setSelectedSubject('');
    setSelectedModule('');
    setSelectedTopic('');
    setNoteTitle('');
    setNoteContent('');
    setQuestionText('');
    setResourceTitle('');
    setResourceUrl('');
    setResourceType('Website');
    setHighlightContent('');
    setHighlightType('Key Concept');
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const getSelectedTopicName = () => {
    for (const subject of tree) {
      if (subject.data.id !== selectedSubject) continue;
      for (const module of (subject as any).children || []) {
        if (module.data.id !== selectedModule) continue;
        for (const topic of (module as any).children || []) {
          if (topic.data.id === selectedTopic) return topic.data.name;
        }
      }
    }
    return '';
  };

  const handleSave = async () => {
    if (!selectedTopic || !captureType) return;

    setSaving(true);
    try {
      const topicName = getSelectedTopicName();

      if (captureType === 'note') {
        if (!noteTitle.trim()) return;
        await createTopicNote(selectedTopic, noteTitle, noteContent, 'Quick Capture');
        await logActivity('add_note', selectedTopic, noteTitle, { topic_id: selectedTopic, topic_name: topicName });
      } else if (captureType === 'question') {
        if (!questionText.trim()) return;
        await createTopicQuestion(selectedTopic, questionText, '', 'Medium', 'Open');
        await logActivity('add_question', selectedTopic, questionText, { topic_id: selectedTopic, topic_name: topicName });
      } else if (captureType === 'resource') {
        if (!resourceTitle.trim() || !resourceUrl.trim()) return;
        await createTopicResource(selectedTopic, resourceTitle, resourceUrl, resourceType, '');
        await logActivity('add_resource', selectedTopic, resourceTitle, { topic_id: selectedTopic, topic_name: topicName, resource_type: resourceType });
      } else if (captureType === 'highlight') {
        if (!highlightContent.trim()) return;
        await createTopicHighlight(selectedTopic, highlightContent, highlightType);
        await logActivity('add_highlight', selectedTopic, highlightContent.slice(0, 50), { topic_id: selectedTopic, topic_name: topicName, highlight_type: highlightType });
      }

      handleClose();
    } catch (err) {
      console.error('Failed to save:', err);
    }
    setSaving(false);
  };

  const modules = tree.find(s => s.data.id === selectedSubject)?.children || [];
  const topics = modules.find(m => m.data.id === selectedModule)?.children || [];

  const canSave = () => {
    if (!selectedTopic || !captureType) return false;
    if (captureType === 'note') return noteTitle.trim().length > 0;
    if (captureType === 'question') return questionText.trim().length > 0;
    if (captureType === 'resource') return resourceTitle.trim().length > 0 && resourceUrl.trim().length > 0;
    if (captureType === 'highlight') return highlightContent.trim().length > 0;
    return false;
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
        title="Quick Capture"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Capture</h2>
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Capture Type Selection */}
                {!captureType && (
                  <div className="grid grid-cols-2 gap-2">
                    {CAPTURE_TYPES.map(type => (
                      <button
                        key={type.key}
                        onClick={() => setCaptureType(type.key)}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                      >
                        <div className="text-gray-600">{type.icon}</div>
                        <span className="text-sm font-medium text-gray-700">{type.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Topic Selection */}
                {captureType && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={e => { setSelectedSubject(e.target.value); setSelectedModule(''); setSelectedTopic(''); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                      >
                        <option value="">Select subject...</option>
                        {tree.map(s => (
                          <option key={s.data.id} value={s.data.id}>{s.data.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedSubject && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Module</label>
                        <select
                          value={selectedModule}
                          onChange={e => { setSelectedModule(e.target.value); setSelectedTopic(''); }}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                        >
                          <option value="">Select module...</option>
                          {modules.map(m => (
                            <option key={m.data.id} value={m.data.id}>{m.data.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedModule && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Topic</label>
                        <select
                          value={selectedTopic}
                          onChange={e => setSelectedTopic(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                        >
                          <option value="">Select topic...</option>
                          {topics.map(t => (
                            <option key={t.data.id} value={t.data.id}>{t.data.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Form Fields */}
                    {selectedTopic && (
                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        {captureType === 'note' && (
                          <>
                            <input
                              value={noteTitle}
                              onChange={e => setNoteTitle(e.target.value)}
                              placeholder="Note title"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              autoFocus
                            />
                            <textarea
                              value={noteContent}
                              onChange={e => setNoteContent(e.target.value)}
                              placeholder="Note content (optional)"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-24"
                            />
                          </>
                        )}

                        {captureType === 'question' && (
                          <textarea
                            value={questionText}
                            onChange={e => setQuestionText(e.target.value)}
                            placeholder="Your question..."
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-24"
                            autoFocus
                          />
                        )}

                        {captureType === 'resource' && (
                          <>
                            <input
                              value={resourceTitle}
                              onChange={e => setResourceTitle(e.target.value)}
                              placeholder="Resource title"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              autoFocus
                            />
                            <input
                              value={resourceUrl}
                              onChange={e => setResourceUrl(e.target.value)}
                              placeholder="URL"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <select
                              value={resourceType}
                              onChange={e => setResourceType(e.target.value as ResourceType)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                              {RESOURCE_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </>
                        )}

                        {captureType === 'highlight' && (
                          <>
                            <textarea
                              value={highlightContent}
                              onChange={e => setHighlightContent(e.target.value)}
                              placeholder="Key concept, formula, or important note..."
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-24"
                              autoFocus
                            />
                            <select
                              value={highlightType}
                              onChange={e => setHighlightType(e.target.value as HighlightType)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                              {HIGHLIGHT_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {captureType && (
                <div className="p-4 border-t border-gray-200 flex items-center gap-2">
                  <button
                    onClick={() => setCaptureType(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave() || saving}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
