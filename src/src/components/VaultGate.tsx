import { useState, useEffect } from 'react';
import { VAULT_SECRET } from '../lib/constants';
import { Brain, Lock } from 'lucide-react';

interface VaultGateProps {
  children: React.ReactNode;
  vaultId: string;
}

export default function VaultGate({ children, vaultId }: VaultGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('vault_unlocked');
    if (saved === vaultId) setUnlocked(true);
  }, [vaultId]);

  const handleUnlock = () => {
    if (input === vaultId) {
      sessionStorage.setItem('vault_unlocked', vaultId);
      setUnlocked(true);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Learning Vault</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your vault key to access</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Vault key"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              />
            </div>
            <button
              onClick={handleUnlock}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Unlock Vault
            </button>
          </div>
          {input && input !== vaultId && (
            <p className="text-xs text-red-500 mt-3 text-center">Incorrect vault key</p>
          )}
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-4">
          Your vault key is your secret URL path
        </p>
      </div>
    </div>
  );
}

export { VAULT_SECRET };
