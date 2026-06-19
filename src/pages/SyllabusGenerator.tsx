import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Layers, TrendingUp, FileText, Plus, Trash2, Check, ChevronDown, ChevronRight, Pencil, Download, Upload, AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  createSubject, createModule, createTopic, createSubtopic, fetchSyllabusTree, logActivity,
} from '../services/vault';
import { SYLLABUS_TEMPLATES } from '../lib/constants';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface PreviewModule {
  name: string;
  topics: { name: string; subtopics: string[] }[];
  edit: boolean;
}

interface PreviewSubject {
  name: string;
  difficulty: Difficulty;
  modules: PreviewModule[];
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-red-100 text-red-700',
};

export default function SyllabusGenerator() {
  const [step, setStep] = useState<'select' | 'customize' | 'preview' | 'importing'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [preview, setPreview] = useState<PreviewSubject | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [importComplete, setImportComplete] = useState(false);

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = SYLLABUS_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      const subtopicMap: Record<Difficulty, string[]> = {
        Beginner: ['Overview', 'Key Concepts', 'Examples'],
        Intermediate: ['Overview', 'Key Concepts', 'Implementation', 'Best Practices'],
        Advanced: ['Overview', 'Deep Dive', 'Advanced Implementation', 'Optimization', 'Research'],
      };

      const previewData: PreviewSubject = {
        name: customSubjectName || template.subject,
        difficulty,
        modules: template.modules.map(m => ({
          name: m.name,
          topics: m.topics.map(t => ({
            name: t,
            subtopics: subtopicMap[difficulty],
          })),
          edit: false,
        })),
      };
      setPreview(previewData);
      setExpandedModules(new Set(previewData.modules.map((_, i) => i)));
      setStep('customize');
    }
  };

  const handleUpdateSubjectName = (name: string) => {
    setCustomSubjectName(name);
    if (preview) {
      setPreview({ ...preview, name });
    }
  };

  const handleUpdateDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    const subtopicMap: Record<Difficulty, string[]> = {
      Beginner: ['Overview', 'Key Concepts', 'Examples'],
      Intermediate: ['Overview', 'Key Concepts', 'Implementation', 'Best Practices'],
      Advanced: ['Overview', 'Deep Dive', 'Advanced Implementation', 'Optimization', 'Research'],
    };

    if (preview) {
      setPreview({
        ...preview,
        difficulty: diff,
        modules: preview.modules.map(m => ({
          ...m,
          topics: m.topics.map(t => ({
            ...t,
            subtopics: subtopicMap[diff],
          })),
        })),
      });
    }
  };

  const toggleModuleExpand = (idx: number) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedModules(newSet);
  };

  const handleEditModuleName = (moduleIdx: number, newName: string) => {
    if (!preview) return;
    const newModules = [...preview.modules];
    newModules[moduleIdx] = { ...newModules[moduleIdx], name: newName };
    setPreview({ ...preview, modules: newModules });
  };

  const handleEditTopicName = (moduleIdx: number, topicIdx: number, newName: string) => {
    if (!preview) return;
    const newModules = [...preview.modules];
    newModules[moduleIdx].topics[topicIdx].name = newName;
    setPreview({ ...preview, modules: newModules });
  };

  const handleAddModule = () => {
    if (!preview) return;
    const subtopicMap: Record<Difficulty, string[]> = {
      Beginner: ['Overview', 'Key Concepts', 'Examples'],
      Intermediate: ['Overview', 'Key Concepts', 'Implementation', 'Best Practices'],
      Advanced: ['Overview', 'Deep Dive', 'Advanced Implementation', 'Optimization', 'Research'],
    };
    setPreview({
      ...preview,
      modules: [
        ...preview.modules,
        {
          name: 'New Module',
          topics: [{ name: 'New Topic', subtopics: subtopicMap[preview.difficulty] }],
          edit: true,
        },
      ],
    });
  };

  const handleAddTopic = (moduleIdx: number) => {
    if (!preview) return;
    const subtopicMap: Record<Difficulty, string[]> = {
      Beginner: ['Overview', 'Key Concepts', 'Examples'],
      Intermediate: ['Overview', 'Key Concepts', 'Implementation', 'Best Practices'],
      Advanced: ['Overview', 'Deep Dive', 'Advanced Implementation', 'Optimization', 'Research'],
    };
    const newModules = [...preview.modules];
    newModules[moduleIdx].topics.push({ name: 'New Topic', subtopics: subtopicMap[preview.difficulty] });
    setPreview({ ...preview, modules: newModules });
  };

  const handleDeleteModule = (moduleIdx: number) => {
    if (!preview) return;
    const newModules = preview.modules.filter((_, i) => i !== moduleIdx);
    setPreview({ ...preview, modules: newModules });
  };

  const handleDeleteTopic = (moduleIdx: number, topicIdx: number) => {
    if (!preview) return;
    const newModules = [...preview.modules];
    newModules[moduleIdx].topics = newModules[moduleIdx].topics.filter((_, i) => i !== topicIdx);
    setPreview({ ...preview, modules: newModules });
  };

  const handleImport = async () => {
    if (!preview) return;

    setStep('importing');
    setImportProgress({ current: 0, total: 0, message: 'Starting import...' });

    try {
      // Create subject
      setImportProgress({ current: 0, total: 1 + preview.modules.length, message: `Creating subject: ${preview.name}` });
      const subject = await createSubject(preview.name, `${preview.difficulty} level syllabus`);
      await logActivity('subject', subject.id, subject.name, 'create', { template: selectedTemplate, difficulty: preview.difficulty });

      let topicCount = 0;
      let subtopicCount = 0;

      // Create modules and their topics
      for (let mIdx = 0; mIdx < preview.modules.length; mIdx++) {
        const m = preview.modules[mIdx];
        setImportProgress({
          current: mIdx + 1,
          total: preview.modules.length,
          message: `Creating module ${mIdx + 1}/${preview.modules.length}: ${m.name}`,
        });

        const module = await createModule(subject.id, m.name, '', mIdx);
        await logActivity('module', module.id, module.name, 'create', { subject_id: subject.id });

        // Create topics for this module
        for (let tIdx = 0; tIdx < m.topics.length; tIdx++) {
          const t = m.topics[tIdx];
          const topic = await createTopic(module.id, t.name, '', tIdx);
          await logActivity('topic', topic.id, topic.name, 'create', { module_id: module.id, subject_id: subject.id });
          topicCount++;

          // Create subtopics
          for (let sIdx = 0; sIdx < t.subtopics.length; sIdx++) {
            const subtopic = await createSubtopic(topic.id, t.subtopics[sIdx], '', sIdx);
            await logActivity('subtopic', subtopic.id, subtopic.name, 'create', { topic_id: topic.id, module_id: module.id, subject_id: subject.id });
            subtopicCount++;
          }
        }
      }

      setImportProgress({
        current: preview.modules.length,
        total: preview.modules.length,
        message: `Complete! Created 1 subject, ${preview.modules.length} modules, ${topicCount} topics, ${subtopicCount} subtopics`,
      });
      setImportComplete(true);
    } catch (err) {
      console.error('Import failed:', err);
      setImportProgress({ current: 0, total: 0, message: 'Import failed. Please try again.' });
    }
  };

  const handleStartOver = () => {
    setStep('select');
    setSelectedTemplate(null);
    setCustomSubjectName('');
    setDifficulty('Intermediate');
    setPreview(null);
    setExpandedModules(new Set());
    setImportProgress(null);
    setImportComplete(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Syllabus Generator"
        description="Create structured learning paths from predefined templates"
        action={
          <Link to="/knowledge-base" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <BookOpen size={16} /> Knowledge Base
          </Link>
        }
      />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Template */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Custom Subject Name (Optional)</label>
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)}
                  placeholder="Leave empty to use template name"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Difficulty Level</label>
                <div className="flex gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${difficulty === d ? `${DIFFICULTY_COLORS[d]} font-medium` : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Affects the number of subtopics generated per topic</p>
              </div>

              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Select a Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SYLLABUS_TEMPLATES.map(template => (
                  <button
                    key={template.name}
                    onClick={() => handleSelectTemplate(template.name)}
                    className="group bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <span className="font-medium text-gray-900">{template.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{template.modules.length} modules, {template.modules.reduce((acc, m) => acc + m.topics.length, 0)} topics</p>
                    <div className="flex flex-wrap gap-1">
                      {template.modules.slice(0, 3).map(m => (
                        <span key={m.name} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{m.name}</span>
                      ))}
                      {template.modules.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">+{template.modules.length - 3} more</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Customize & Preview */}
          {(step === 'customize' || step === 'preview') && preview && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={preview.name}
                        onChange={e => handleUpdateSubjectName(e.target.value)}
                        className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                      />
                      <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[preview.difficulty]}`}>{preview.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={preview.difficulty}
                        onChange={e => handleUpdateDifficulty(e.target.value as Difficulty)}
                        className="text-xs bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {preview.modules.length} modules, {preview.modules.reduce((acc, m) => acc + m.topics.length, 0)} topics
                  </p>
                </div>

                {/* Modules */}
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {preview.modules.map((m, mIdx) => (
                    <div key={mIdx} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => toggleModuleExpand(mIdx)} className="text-gray-400 hover:text-gray-600">
                          {expandedModules.has(mIdx) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <input
                          type="text"
                          value={m.name}
                          onChange={e => handleEditModuleName(mIdx, e.target.value)}
                          className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                        />
                        <button onClick={() => handleAddTopic(mIdx)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Add topic">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => handleDeleteModule(mIdx)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete module">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {expandedModules.has(mIdx) && (
                        <div className="ml-6 space-y-1">
                          {m.topics.map((t, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2 group">
                              <Layers size={12} className="text-gray-400" />
                              <input
                                type="text"
                                value={t.name}
                                onChange={e => handleEditTopicName(mIdx, tIdx, e.target.value)}
                                className="text-sm text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                              />
                              <span className="text-xs text-gray-400">{t.subtopics.length} subtopics</span>
                              <button onClick={() => handleDeleteTopic(mIdx, tIdx)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100" title="Delete topic">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Module Button */}
                <div className="p-4 border-t border-gray-200">
                  <button onClick={handleAddModule} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <Plus size={14} /> Add Module
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6">
                <button onClick={handleStartOver} className="text-sm text-gray-600 hover:text-gray-900">
                  Start Over
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('preview')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={preview.modules.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload size={16} /> Import to Knowledge Base
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12"
            >
              {!importComplete ? (
                <>
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-600">{importProgress?.message}</p>
                  {importProgress && importProgress.total > 0 && (
                    <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto mt-4">
                      <div
                        className="h-2 bg-gray-900 rounded-full transition-all"
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Complete!</h3>
                  <p className="text-sm text-gray-600 mb-6">{importProgress?.message}</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleStartOver} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                      Create Another
                    </button>
                    <Link to="/knowledge-base" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
                      <BookOpen size={16} /> Go to Knowledge Base
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
