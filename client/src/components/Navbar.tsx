import React from 'react';
import {
  LayoutDashboard,
  Archive,
  ArchiveRestore,
  GitCompare,
  History,
  Binary,
  Settings,
  Info,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  engineHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, engineHealthy }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'compress', label: 'Compress Files', icon: Archive },
    { id: 'decompress', label: 'Decompress Files', icon: ArchiveRestore },
    { id: 'compare', label: 'Compare Algorithms', icon: GitCompare },
    { id: 'visualizer', label: 'DSA Visualizer', icon: Binary },
    { id: 'history', label: 'Compression History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl tracking-tighter">
            CX
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              CompressX
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-medium border border-indigo-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-normal truncate max-w-[140px]">
              Compress Anything. Recover Everything.
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine Status Footer */}
      <div className="p-4 m-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium">C++ Engine</span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${engineHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={engineHealthy ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
              {engineHealthy ? 'Active' : 'Offline'}
            </span>
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          C++17 binary-safe engine with SHA-256 container validation.
        </p>
      </div>
    </aside>
  );
};
