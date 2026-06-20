import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Shield, Check, X, FileJson, Calendar, Archive, AlertTriangle, HardDrive, Plus, Trash2, Star, History, Info, Cloud, Server, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { VAULT_SECRET } from '../lib/constants';
import {
  exportSyllabusJSON,
  importSyllabusJSON,
  exportVaultPackage,
  importVaultPackage,
  fetchStorageProviders,
  createStorageProvider,
  deleteStorageProvider,
  setDefaultStorageProvider,
  fetchBackupHistory,
  type StorageProvider,
  type BackupHistory,
  type ImportResult,
} from '../services/vault';

interface BackupInfo {
  lastBackup: string | null;
  fileName: string | null;
}

const PROVIDER_TYPES = [
  { value: 'local', label: 'Local Storage', icon: Server },
  { value: 'supabase', label: 'Supabase', icon: Cloud },
  { value: 's3', label: 'Amazon S3', icon: Cloud },
  { value: 'gcs', label: 'Google Cloud Storage', icon: Cloud },
  { value: 'azure', label: 'Azure Blob Storage', icon: Cloud },
  { value: 'dropbox', label: 'Dropbox', icon: Cloud },
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
  { value: 'onedrive', label: 'Microsoft OneDrive', icon: Cloud },
  { value: 'nas', label: 'NAS / Network Drive', icon: Server },
  { value: 'webdav', label: 'WebDAV', icon: Server },
  { value: 'other', label: 'Other', icon: HardDrive },
] as const;

export default function Settings() {
  const [showSecret, setShowSecret] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo>({ lastBackup: null, fileName: null });

  // Storage providers state
  const [storageProviders, setStorageProviders] = useState<StorageProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', provider_type: 'local' as const, base_path: '' });

  // Backup history
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Import result modal
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vault_backup_info');
    if (stored) {
      try {
        setBackupInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem('vault_backup_info');
      }
    }
    loadStorageProviders();
    loadBackupHistory();
  }, []);

  const loadStorageProviders = async () => {
    setLoadingProviders(true);
    try {
      const providers = await fetchStorageProviders();
      setStorageProviders(providers);
    } catch (err) {
      console.error('Failed to load storage providers:', err);
    }
    setLoadingProviders(false);
  };

  const loadBackupHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await fetchBackupHistory();
      setBackupHistory(history);
    } catch (err) {
      console.error('Failed to load backup history:', err);
    }
    setLoadingHistory(false);
  };

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
      const { json, filename } = await exportVaultPackage();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      saveBackupInfo(filename);
      showToast('success', 'Vault package exported successfully');
      loadBackupHistory();
    } catch (err) {
      console.error('Failed to export:', err);
      showToast('error', 'Failed to export vault package');
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
      const result = await importVaultPackage(text);
      setImportResult(result);
      if (result.success) {
        showToast('success', result.message);
        loadBackupHistory();
        loadStorageProviders();
      }
    } catch (err) {
      console.error('Failed to import:', err);
      showToast('error', 'Failed to import vault package');
    }
    setImporting(false);
    e.target.value = '';
  };

  const handleAddProvider = async () => {
    if (!newProvider.name.trim()) {
      showToast('error', 'Provider name is required');
      return;
    }
    try {
      await createStorageProvider({
        name: newProvider.name,
        provider_type: newProvider.provider_type,
        base_path: newProvider.base_path || null,
      });
      setShowAddProvider(false);
      setNewProvider({ name: '', provider_type: 'local', base_path: '' });
      loadStorageProviders();
      showToast('success', 'Storage provider added');
    } catch (err) {
      console.error('Failed to add provider:', err);
      showToast('error', 'Failed to add storage provider');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await deleteStorageProvider(id);
      loadStorageProviders();
      showToast('success', 'Storage provider deleted');
    } catch (err) {
      console.error('Failed to delete provider:', err);
      showToast('error', 'Failed to delete storage provider');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultStorageProvider(id);
      loadStorageProviders();
      showToast('success', 'Default storage provider updated');
    } catch (err) {
      console.error('Failed to set default:', err);
      showToast('error', 'Failed to set default provider');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Settings" description="Manage your vault configuration and disaster recovery" />

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

      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Complete</h3>
              <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className={`p-4 rounded-lg mb-4 ${importResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-medium ${importResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                {importResult.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">Completed in {importResult.duration_ms}ms</p>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Entities Imported</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(importResult.imported_counts).map(([key, count]) => (
                  (count as number) > 0 && (
                    <div key={key} className="flex justify-between px-2 py-1 bg-gray-50 rounded">
                      <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900">{count as number}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {importResult.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-amber-600 uppercase mb-2">Warnings</h4>
                <div className="space-y-1">
                  {importResult.warnings.map((w: string, i: number) => (
                    <p key={i} className="text-xs text-amber-700">{w}</p>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-red-600 uppercase mb-2">Errors</h4>
                <div className="space-y-1">
                  {importResult.errors.map((e: string, i: number) => (
                    <p key={i} className="text-xs text-red-700">{e}</p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setImportResult(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Storage Provider</h3>
              <button onClick={() => setShowAddProvider(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Name *</label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  placeholder="e.g., My NAS, AWS S3 Bucket"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                <select
                  value={newProvider.provider_type}
                  onChange={(e) => setNewProvider({ ...newProvider, provider_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
                >
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Base Path (optional)</label>
                <input
                  type="text"
                  value={newProvider.base_path}
                  onChange={(e) => setNewProvider({ ...newProvider, base_path: e.target.value })}
                  placeholder="/vault/backups or s3://bucket-name/path"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddProvider(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProvider}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
              >
                Add Provider
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="space-y-4">
        {/* Vault Package Export/Import */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Archive size={16} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Vault Package Export/Import</h3>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              Export a complete vault package with all your syllabus data, notes, resources, tags, relationships, journals, code snippets, and learning history.
              <strong className="block mt-1">Portable for 10+ years</strong> - no vendor lock-in, standard JSON format.
            </p>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || importing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Vault Package'}
            </button>
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
              <Upload size={16} />
              {importing ? 'Importing...' : 'Import Vault Package'}
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
              Importing will replace all existing data. Export a backup first to preserve your current vault.
            </p>
          </div>
        </div>

        {/* Storage Providers */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Storage Providers</h3>
            </div>
            <button
              onClick={() => setShowAddProvider(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                Configure storage providers for disaster recovery. Resources can reference these providers for
                relative path storage, enabling migration to any cloud or personal infrastructure.
              </p>
            </div>
          </div>

          {loadingProviders ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={20} className="text-gray-400 animate-spin" />
            </div>
          ) : storageProviders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HardDrive size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No storage providers configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {storageProviders.map((provider) => {
                const ProviderIcon = PROVIDER_TYPES.find(t => t.value === provider.provider_type)?.icon || HardDrive;
                return (
                  <div
                    key={provider.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      provider.is_default ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      provider.is_default ? 'bg-emerald-100' : 'bg-white border border-gray-200'
                    }`}>
                      <ProviderIcon size={14} className={provider.is_default ? 'text-emerald-600' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{provider.name}</p>
                        {provider.is_default && (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            <Star size={8} />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{PROVIDER_TYPES.find(t => t.value === provider.provider_type)?.label}</p>
                      {provider.base_path && (
                        <p className="text-[10px] text-gray-400 truncate font-mono">{provider.base_path}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!provider.is_default && (
                        <button
                          onClick={() => handleSetDefault(provider.id)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Set as default"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Backup History */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={16} className="text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Backup History</h3>
            </div>
            <button
              onClick={loadBackupHistory}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={20} className="text-gray-400 animate-spin" />
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No backup history yet</p>
              <p className="text-[10px] text-gray-300 mt-1">Export a vault package to create your first backup</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {backupHistory.map((backup) => (
                <div
                  key={backup.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    backup.status === 'completed' ? 'border-gray-200 bg-gray-50' :
                    backup.status === 'failed' ? 'border-red-200 bg-red-50' :
                    'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    backup.status === 'completed' ? 'bg-emerald-100' :
                    backup.status === 'failed' ? 'bg-red-100' :
                    'bg-amber-100'
                  }`}>
                    <Archive size={14} className={
                      backup.status === 'completed' ? 'text-emerald-600' :
                      backup.status === 'failed' ? 'text-red-600' :
                      'text-amber-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        backup.backup_type === 'manual' ? 'bg-gray-200 text-gray-700' :
                        backup.backup_type === 'daily' ? 'bg-blue-100 text-blue-700' :
                        backup.backup_type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {backup.backup_type}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        backup.status === 'completed' ? 'text-emerald-600' :
                        backup.status === 'failed' ? 'text-red-600' :
                        'text-amber-600'
                      }`}>
                        {backup.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(backup.started_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {backup.file_size_bytes && (
                    <span className="text-[10px] text-gray-400">
                      {(backup.file_size_bytes / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
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
            <p>Learning Vault v2.0</p>
            <p>A portable knowledge management system for lifelong learning with disaster recovery.</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">Built with React, TypeScript, Tailwind CSS, Supabase</p>
              <p className="text-[11px] text-gray-400">Designed for 10+ year portability - no vendor lock-in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
