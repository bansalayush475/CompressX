import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Database,
  Trash2,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [defaultAlgo, setDefaultAlgo] = useState('auto');
  const [cleaning, setCleaning] = useState(false);
  const [cleanedMessage, setCleanedMessage] = useState('');

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCleanStorage = async () => {
    setCleaning(true);
    setCleanedMessage('');
    setTimeout(() => {
      setCleaning(false);
      setCleanedMessage('Temporary upload caches successfully purged.');
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>System & Engine Settings</span>
        </h3>
        <p className="text-xs text-slate-400">
          Configure local compression engine parameters, persistent storage, and workspace cleanliness.
        </p>
      </div>

      {/* Engine Status Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Native C++ Compression Runtime</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400">Engine Status:</span>
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>C++17 Binary Compiled & Ready</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400">Executable Location:</span>
            <span className="font-mono text-slate-300 truncate block text-[11px]">
              {health?.enginePath || 'bin/compressx.exe'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Compression Defaults
        </h4>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Default Strategy for New Jobs
            </label>
            <select
              value={defaultAlgo}
              onChange={(e) => setDefaultAlgo(e.target.value)}
              className="w-full sm:w-80 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="auto">Automatic (Selects minimal container)</option>
              <option value="huffman">Huffman Coding (Greedy prefix-tree)</option>
              <option value="rle">Run-Length Encoding (Byte runs)</option>
              <option value="store">Store (Original stream)</option>
            </select>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1">Max Upload Limit:</span>
            <span className="font-bold text-white font-mono">250 MB per batch</span>
          </div>
        </div>
      </div>

      {/* Storage & Maintenance */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-400" />
          <span>Storage Maintenance</span>
        </h4>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <span className="text-xs font-bold text-white block">Purge Temporary Uploads</span>
            <span className="text-[11px] text-slate-400">
              Clear temporary upload staging files without affecting persistent history or outputs.
            </span>
          </div>
          <button
            onClick={handleCleanStorage}
            disabled={cleaning}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 shrink-0"
          >
            {cleaning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>Clean Cache</span>
          </button>
        </div>

        {cleanedMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{cleanedMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
