import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { fetchProjects, createProject, updateProject, deleteProject } from '../services/vault';
import type { Project } from '../types';
import { PROJECT_STATUSES, type ProjectStatus } from '../lib/constants';
import { timeAgo, formatDate } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-gray-100 text-gray-600',
  Active: 'bg-blue-50 text-blue-600',
  Completed: 'bg-emerald-50 text-emerald-600',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planned');
  const [technologies, setTechnologies] = useState('');
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');

  const loadProjects = useCallback(async () => {
    const data = await fetchProjects(statusFilter === 'All' ? undefined : statusFilter);
    setProjects(data);
  }, [statusFilter]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setDescription(''); setStatus('Planned');
    setTechnologies(''); setNotes(''); setLinks('');
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setName(p.name); setDescription(p.description); setStatus(p.status);
    setTechnologies(p.technologies.join(', ')); setNotes(p.notes); setLinks(p.links);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const techs = technologies.split(',').map((t) => t.trim()).filter(Boolean);
    if (editing) {
      await updateProject(editing.id, { name, description, status, technologies: techs, notes, links });
    } else {
      await createProject({ name, description, status, technologies: techs, notes, links });
    }
    setShowModal(false);
    loadProjects();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
    loadProjects();
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Projects" description="Track your personal projects"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={16} />New Project
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        {(['All', ...PROJECT_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={24} />} title="No projects found" description="Create your first project" action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} />Create Project</button>
        } />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {projects.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-sm transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit3 size={14} /></button>
                    <button onClick={() => setDeleteId(p.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
                {p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.technologies.map((t) => (
                      <span key={t} className="text-[11px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {p.links && (
                    <a href={p.links} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <ExternalLink size={10} />Link
                    </a>
                  )}
                  <span className="text-[11px] text-gray-400 ml-auto">{timeAgo(p.updated_at)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'New Project'}>
        <div className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
            className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
          <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Technologies (comma separated)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes"
            className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
          <input type="url" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Links (URL)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Project" message="Are you sure you want to delete this project?" />
    </div>
  );
}
