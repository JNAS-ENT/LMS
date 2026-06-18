import { useState, useEffect } from 'react';
import { Download, Upload, Shield, Check, X, FileJson, Calendar, Archive, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { VAULT_SECRET } from '../lib/constants';
import { exportSyllabusJSON, importSyllabusJSON } from '../services/vault';

interface BackupInfo {
  lastBackup: string | null;
  fileName: string | null;
}

export default function Settings() {
  const [showSecret, setShowSecret] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo>({ lastBackup: null, fileName: null });

  useEffect(() => {
    // Load backup info from localStorage
    const stored = localStorage.getItem('vault_backup_info');
    if (stored) {
      try {
        setBackupInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem('vault_backup_info');
      }
    }
  }, []);

  const saveBackupInfo = (fileName: string) => {
    const info = { lastBackup: new Date().toISOString(), fileName };
    localStorage.setItem('vault_backup_info', JSON.stringify(info));
    setBackupInfo(info);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
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
      const fileName = `learning-vault-backup-${date}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      saveBackupInfo(fileName);
      showToast('success', 'Backup exported successfully');
    } catch (err) {
      console.error('Failed to export:', err);
      showToast('error', 'Failed to export backup');
    }
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      showToast('error', 'Please select a .json backup file');
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importSyllabusJSON(text);
      if (result.success) {
        showToast('success', result.message);
      } else {
        showToast('error', result.message);
      }
    } catch (err) {
      console.error('Failed to import:', err);
      showToast('error', 'Failed to import backup');
    }
    setImporting(false);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" description="Manage your vault configuration" />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Backup & Restore */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Archive size={16} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Backup & Restore</h3>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              Export a complete backup of your syllabus, notes, questions, resources, and progress data.
              Import a backup file to restore all data. Note: Importing will replace all existing data.
            </p>
          </div>

          {/* Backup Status */}
          {backupInfo.lastBackup && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center gap-3">
              <FileJson size={20} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">Last Backup</p>
                <p className="text-xs text-gray-500 truncate">{backupInfo.fileName}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar size={12} />
                {new Date(backupInfo.lastBackup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          )}

          {/* Export/Import buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || importing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Backup'}
            </button>
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
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

          <div className="mt-3 flex items-start gap-2">
            <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500">
              Importing will replace all existing data. Make sure to export a backup first.
            </p>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Security</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Secret Vault URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono truncate">
                  {showSecret ? VAULT_SECRET : '\u2022'.repeat(VAULT_SECRET.length)}
                </div>
                <button onClick={() => setShowSecret(!showSecret)} className="px-3 py-2 bg-gray-100 text-sm rounded-lg hover:bg-gray-200 text-gray-700 transition-colors">
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Enable secret URL mode in deployment to restrict access</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">About</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Learning Vault v1.0</p>
            <p>A personal knowledge management system for tracking your learning journey.</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">Built with React, TypeScript, Tailwind CSS, Supabase</p>
              <p className="text-[11px] text-gray-400">Deployed on Cloudflare Pages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
