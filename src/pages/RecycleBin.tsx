import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, Download, Upload, BookOpen, FolderOpen, Layers, FileText, Archive, Check, X } from 'lucide-react';
import {
  fetchDeletedItems, restoreItem, permanentDeleteItem,
  exportSyllabusJSON, importSyllabusJSON,
} from '../services/vault';
import type { DeletedItem, EntityType } from '../types';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { timeAgo } from '../lib/utils';

const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  subject: <BookOpen size={16} />,
  module: <FolderOpen size={16} />,
  topic: <Layers size={16} />,
  subtopic: <FileText size={16} />,
  note: <FileText size={16} />,
  question: <AlertTriangle size={16} />,
  resource: <Archive size={16} />,
  highlight: <Check size={16} />,
  revision: <RotateCcw size={16} />,
  code: <FileText size={16} />,
};

const TYPE_COLORS: Record<EntityType, string> = {
  subject: 'bg-gray-100 text-gray-700',
  module: 'bg-blue-100 text-blue-700',
  topic: 'bg-emerald-100 text-emerald-700',
  subtopic: 'bg-amber-100 text-amber-700',
  note: 'bg-purple-100 text-purple-700',
  question: 'bg-orange-100 text-orange-700',
  resource: 'bg-cyan-100 text-cyan-700',
  highlight: 'bg-pink-100 text-pink-700',
  revision: 'bg-indigo-100 text-indigo-700',
  code: 'bg-slate-100 text-slate-700',
};

export default function RecycleBin() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<DeletedItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeletedItem | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchDeletedItems();
      setItems(data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreItem(restoreTarget.id, restoreTarget.type);
      setRestoreTarget(null);
      loadItems();
    } catch (err) {
      console.error('Failed to restore:', err);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      await permanentDeleteItem(deleteTarget.id, deleteTarget.type);
      setDeleteTarget(null);
      loadItems();
    } catch (err) {
      console.error('Failed to delete permanently:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportSyllabusJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `learning-vault-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'Backup exported successfully');
    } catch (err) {
      console.error('Failed to export:', err);
      showToast('error', 'Failed to export backup');
    }
    setExporting(false);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const result = await importSyllabusJSON(text);
        if (result.success) {
          showToast('success', result.message);
          loadItems();
        } else {
          showToast('error', result.message);
        }
      } catch (err) {
        console.error('Failed to import:', err);
        showToast('error', 'Failed to import backup. Make sure the file is a valid backup.');
      }
      setImporting(false);
    };
    input.click();
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Recycle Bin"
        description="Restore deleted items or permanently remove them"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={exporting || importing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Backup'}
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50">
              <Upload size={16} />
              {importing ? 'Importing...' : 'Import Backup'}
              <input
                type="file"
                accept=".json"
                disabled={importing}
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        }
      />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-amber-800">Deleted items are stored here</p>
            <p className="text-xs text-amber-700 mt-0.5">Items are moved here when deleted. Use Restore to bring them back, or Permanently Delete to remove them forever.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Archive size={24} />}
          title="Recycle bin is empty"
          description="Deleted items will appear here"
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 p-2 rounded-lg ${TYPE_COLORS[item.type]}`}>
                      {TYPE_ICONS[item.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{item.type}</span>
                        {item.parent_name && (
                          <>
                            <span>/</span>
                            <span className="truncate">{item.parent_name}</span>
                          </>
                        )}
                        <span className="text-gray-400">deleted {timeAgo(item.deleted_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setRestoreTarget(item)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                      Delete Forever
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Item"
        message={`Restore "${restoreTarget?.name ?? ''}"? It will be returned to its original location.`}
        confirmLabel="Restore"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Delete Permanently"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete Forever"
        variant="danger"
      />
    </div>
  );
}
