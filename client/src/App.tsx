import React, { useState, useEffect, useRef } from 'react';
import {
  Archive,
  History,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  Zap,
  Sliders,
  Flame,
  Sparkles,
  Image as ImageIcon,
  File,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Lock,
  Database,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from './services/api';
import { AuthModal } from './components/AuthModal';
import { CompressionResultItem, Job } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compress' | 'history'>('compress');
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Compression state with custom target percentage (default: 85%)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPercent, setTargetPercent] = useState<number>(85);
  const [compressing, setCompressing] = useState(false);
  const [compressResult, setCompressResult] = useState<CompressionResultItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('compressx_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      if (user) {
        loadHistory();
      } else {
        setJobs([]);
      }
    }
  }, [activeTab, user]);

  const loadHistory = async () => {
    if (!user) {
      setJobs([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const data = await api.getJobs();
      setJobs(data.jobs || []);
    } catch (e) {
      console.error(e);
      setJobs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('compressx_token');
    localStorage.removeItem('compressx_user');
    setUser(null);
    setJobs([]);
  };

  const handleClearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire compression history? This will permanently delete all your file records.')) return;
    try {
      await api.clearAllHistory();
      setJobs([]);
    } catch (e: any) {
      alert(`Failed to clear history: ${e.message}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate estimated target size based on selected file & percent
  const getEstimatedSize = () => {
    if (!selectedFile) return '0 B';
    const remainingFraction = Math.max(0.04, (100 - targetPercent) / 100);
    const estBytes = Math.round(selectedFile.size * remainingFraction);
    return formatBytes(estBytes);
  };

  const getLevelLabel = (pct: number) => {
    if (pct < 40) return 'Light';
    if (pct < 60) return 'Balanced';
    if (pct < 80) return 'High';
    if (pct < 90) return 'Extra Small';
    return 'Maximum';
  };

  const handlePercentInput = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setTargetPercent(10);
    } else {
      setTargetPercent(Math.max(10, Math.min(95, num)));
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setCompressing(true);
    setCompressResult(null);

    try {
      const res = await api.compressFiles([selectedFile], targetPercent);
      if (res.results.length > 0) {
        setCompressResult(res.results[0]);
        if (user) {
          loadHistory();
        }
      }
    } catch (err: any) {
      alert(`Compression failed: ${err.message}`);
    } finally {
      setCompressing(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Delete this history record?')) return;
    try {
      await api.deleteJob(id);
      loadHistory();
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  // Helper for file type info
  const getFileInfo = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(ext)) {
      return { icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: `${ext.toUpperCase()} Image` };
    }
    if (['pdf'].includes(ext)) {
      return { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'PDF Document' };
    }
    if (['docx', 'xlsx', 'pptx', 'doc', 'xls'].includes(ext)) {
      return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: `${ext.toUpperCase()} Document` };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: `${ext.toUpperCase()} Archive` };
    }
    return { icon: File, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: `${ext.toUpperCase() || 'DATA'} File` };
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setCompressResult(null);
    }
  };

  // Preset compression tiers
  const presetTiers = [
    { label: 'Light', pct: 30, hint: 'High Detail', desc: 'Minimal loss' },
    { label: 'Balanced', pct: 50, hint: 'Standard', desc: 'Best balance' },
    { label: 'High', pct: 70, hint: 'Web Ready', desc: 'Fast sharing' },
    { label: 'Extra Small', pct: 85, hint: 'Ultra Compact', desc: 'Max savings' },
    { label: 'Maximum', pct: 95, hint: 'Aggressive', desc: 'Smallest size' }
  ];

  // Aggregate stats for History tab
  const totalSavedBytes = jobs.reduce((acc, j) => acc + (j.space_saved || 0), 0);
  const totalOriginalBytes = jobs.reduce((acc, j) => acc + (j.original_size || 0), 0);
  const avgSavedPercent = totalOriginalBytes > 0 ? (totalSavedBytes / totalOriginalBytes) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-black relative overflow-x-hidden bg-cyber-grid">
      {/* Top Ambient Glow */}
      <div className="ambient-glow" />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/[0.08] bg-[#090c14]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-black/40">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
              CX
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                CompressX
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-mono">
                PRO
              </span>
            </div>
          </div>

          {/* Tab Switcher */}
          <nav className="flex items-center p-1 rounded-xl bg-[#0d121c] border border-white/[0.08] text-xs font-semibold shadow-inner">
            <button
              onClick={() => setActiveTab('compress')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                activeTab === 'compress'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-black font-bold shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Compress</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-black font-bold shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {user && jobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20 font-mono">
                  {jobs.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* User Account / Login */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d121c] border border-white/[0.08] text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                <span className="font-semibold text-slate-200 max-w-[130px] truncate">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#121722] transition border border-transparent hover:border-rose-500/20"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-5 md:p-8 flex flex-col justify-center relative z-10">
        {/* COMPRESS WORKSPACE */}
        {activeTab === 'compress' && (
          <div className="space-y-6">
            {/* Header Titles */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Format-Preserving High Efficiency Compression</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Compress Any File Instantly
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Dramatically reduces file size while retaining original formats. Ready to open and use directly without decompression!
              </p>
            </div>

            {/* Dropzone OR Selected File View */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`glass-panel glass-panel-interactive rounded-3xl p-8 text-center cursor-pointer relative overflow-hidden transition-all duration-300 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : ''
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setCompressResult(null);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-inner group">
                  <UploadCloud className="w-8 h-8 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Drop your file here, or <span className="text-emerald-400 underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-400">browse files</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  Images (PNG, JPG, WebP), PDFs, Office Docs (DOCX, PPTX), Code & Text
                </p>

                {/* Formats Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                  {[
                    { label: 'Images', ext: 'PNG • JPG • WebP', color: 'bg-emerald-400' },
                    { label: 'PDFs', ext: 'Documents & Slides', color: 'bg-rose-400' },
                    { label: 'Office', ext: 'Word • Excel • PPT', color: 'bg-blue-400' },
                    { label: 'Archives', ext: 'ZIP • Tar • Code', color: 'bg-amber-400' }
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e131d] border border-white/[0.06] text-[11px] text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
                      <span className="font-semibold text-slate-300">{f.label}</span>
                      <span className="text-slate-500 text-[10px]">({f.ext})</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mt-5 pt-3.5 border-t border-white/[0.06] text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct download in same format • No viewer plugins or extraction required</span>
                </div>
              </div>
            ) : (
              /* Selected File Card */
              <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5 min-w-0">
                  {(() => {
                    const info = getFileInfo(selectedFile.name);
                    const IconComponent = info.icon;
                    return (
                      <div className={`w-12 h-12 rounded-xl ${info.bg} ${info.border} border flex items-center justify-center shrink-0 shadow-inner`}>
                        <IconComponent className={`w-6 h-6 ${info.color}`} />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate max-w-[260px] md:max-w-[340px]">
                        {selectedFile.name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#131926] text-slate-300 border border-white/[0.06] font-mono shrink-0">
                        {getFileInfo(selectedFile.name).label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Original size: <span className="font-mono text-emerald-400 font-semibold">{formatBytes(selectedFile.size)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#141926] hover:bg-[#1a2133] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition shadow-sm cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setCompressResult(null);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#141926] transition border border-transparent hover:border-rose-500/20 cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setCompressResult(null);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Compression Settings Panel (Unified Slider & Preset Chips) */}
            {selectedFile && (
              <div className="glass-panel rounded-3xl p-6 md:p-7 space-y-6 shadow-2xl">
                {/* 1. Header with Status & Estimated Reduction */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Compression Intensity
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {getLevelLabel(targetPercent)} Profile (-{targetPercent}% reduction target)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Live Size Pill */}
                    <div className="px-3.5 py-1.5 rounded-xl bg-[#0d121c] border border-white/[0.08] text-right shadow-inner">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">
                        Estimated Size
                      </span>
                      <span className="text-xs font-extrabold font-mono text-emerald-400">
                        ~{getEstimatedSize()} <span className="text-slate-400 font-normal">(-{targetPercent}%)</span>
                      </span>
                    </div>

                    {/* Direct Percent Type Box */}
                    <div className="flex items-center gap-1.5 bg-[#0d121c] px-3 py-1.5 rounded-xl border border-white/[0.08] shadow-inner">
                      <span className="text-[11px] text-slate-400 font-medium">Type:</span>
                      <input
                        type="number"
                        min={10}
                        max={95}
                        value={targetPercent}
                        onChange={(e) => handlePercentInput(e.target.value)}
                        className="w-10 bg-transparent text-white font-mono font-extrabold text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded"
                      />
                      <span className="text-xs font-bold text-emerald-400">%</span>
                    </div>
                  </div>
                </div>

                {/* 2. UNIFIED INTERACTIVE SLIDER (Eliminates the duplicate target line!) */}
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={15}
                      max={95}
                      step={1}
                      value={targetPercent}
                      onChange={(e) => setTargetPercent(Number(e.target.value))}
                      className="cx-slider w-full"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${targetPercent}%, #171c28 ${targetPercent}%, #171c28 100%)`
                      }}
                    />
                  </div>

                  {/* Slider Percentage Scale Marks */}
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono px-1">
                    {[15, 30, 50, 70, 85, 95].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTargetPercent(val)}
                        className={`transition hover:text-emerald-400 cursor-pointer ${
                          Math.abs(targetPercent - val) <= 5 ? 'text-emerald-400 font-bold' : ''
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Preset Level Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {presetTiers.map((tier) => {
                    const isActive = targetPercent === tier.pct;
                    return (
                      <button
                        key={tier.pct}
                        onClick={() => setTargetPercent(tier.pct)}
                        className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-b from-[#132828] to-[#0a1618] border-emerald-500/70 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500/30'
                            : 'bg-[#0a0e16] border-white/[0.06] hover:border-white/[0.15] hover:bg-[#0f1420]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {tier.label}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
                              isActive
                                ? 'bg-emerald-400 text-black shadow-sm'
                                : 'bg-[#151c2a] text-slate-400'
                            }`}
                          >
                            -{tier.pct}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                          {tier.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 4. Action Compress Button */}
                <button
                  onClick={handleCompress}
                  disabled={compressing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  {compressing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Optimizing Stream (-{targetPercent}% Target)...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
                      <span>
                        Compress to ~{getEstimatedSize()} (-{targetPercent}% {getLevelLabel(targetPercent)})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Direct Download Result Card */}
            {compressResult && compressResult.success && (
              <div className="glass-panel border-emerald-500/40 rounded-3xl p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
                {/* Result Status Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        Compression Completed
                      </h4>
                      <p className="text-xs text-slate-400">
                        {compressResult.algorithm} • {compressResult.durationMs} ms
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                      Reduction Saved
                    </span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      -{compressResult.spaceSavedPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Before / After Comparison */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#090d14] border border-white/[0.06]">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Original</span>
                    <span className="font-mono text-slate-300 font-bold">{formatBytes(compressResult.originalSize)}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#090d14] border border-white/[0.06]">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Compressed</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatBytes(compressResult.compressedSize)}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#090d14] border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-emerald-400/90 block text-[11px] mb-0.5">Space Saved</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatBytes(compressResult.spaceSaved)}</span>
                  </div>
                </div>

                {/* Primary Download CTA */}
                <div className="space-y-2.5">
                  <a
                    href={compressResult.downloadUrl}
                    download
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download {compressResult.downloadFilename || compressResult.filename}</span>
                  </a>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Same format openable directly</span>
                    </span>
                    {compressResult.cloudUrl && (
                      <span className="text-emerald-400/90 font-medium">
                        ✓ Saved to Supabase Cloud
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY WORKSPACE */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {!user ? (
              /* Privacy Login Gate */
              <div className="glass-panel text-center py-16 rounded-3xl p-8 space-y-5 max-w-md mx-auto shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Sign In to Access History</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Compression records and files are strictly private to your account. Sign in to view your saved history and download previously compressed files.
                  </p>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              /* Authenticated User History */
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                      <span>Your Compressed Files</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                        {user.username}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Files stored in Supabase cloud and ready for instant download.</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {jobs.length > 0 && (
                      <button
                        onClick={handleClearAllHistory}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 transition cursor-pointer"
                        title="Clear all history records"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear History</span>
                      </button>
                    )}
                    <button
                      onClick={loadHistory}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0e131d] hover:bg-[#161c2b] text-slate-300 text-xs font-semibold border border-white/[0.08] transition cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* History Analytics Summary Bar (When jobs exist) */}
                {jobs.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass-panel p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Files</span>
                      <span className="text-base font-extrabold text-white font-mono">{jobs.length}</span>
                    </div>
                    <div className="glass-panel p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Saved</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">{formatBytes(totalSavedBytes)}</span>
                    </div>
                    <div className="glass-panel p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Avg Reduction</span>
                      <span className="text-base font-extrabold text-cyan-400 font-mono">-{avgSavedPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {loadingHistory ? (
                  <div className="text-center py-14">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2.5" />
                    <span className="text-xs text-slate-400">Loading your history...</span>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="glass-panel text-center py-14 rounded-3xl p-8 space-y-3">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">No compressed files yet for {user.username}</p>
                    <p className="text-xs text-slate-500">Compress your first file to see it here.</p>
                    <button
                      onClick={() => setActiveTab('compress')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-bold text-xs cursor-pointer shadow-md"
                    >
                      Compress a file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {jobs.map((job) => {
                      const ext = job.original_filename.substring(job.original_filename.lastIndexOf('.'));
                      const base = job.original_filename.substring(0, job.original_filename.lastIndexOf('.'));
                      const dlName = `${base}_compressed${ext}`;
                      const dlUrl = job.artifact_path?.startsWith('http')
                        ? job.artifact_path
                        : `/api/files/${job.id}_compressed${ext}/download?downloadName=${encodeURIComponent(dlName)}`;
                      const info = getFileInfo(job.original_filename);
                      const IconComp = info.icon;

                      return (
                        <div
                          key={job.id}
                          className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-emerald-500/40 transition duration-150 shadow-md"
                        >
                          <div className="flex items-center gap-3.5 truncate">
                            <div className={`w-10 h-10 rounded-xl ${info.bg} ${info.border} border flex items-center justify-center shrink-0 shadow-inner`}>
                              <IconComp className={`w-4 h-4 ${info.color}`} />
                            </div>
                            <div className="truncate">
                              <h4 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                                {job.original_filename}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {formatBytes(job.original_size)} → <span className="text-emerald-400 font-bold">{formatBytes(job.result_size)}</span>
                                {job.space_saved > 0 && (
                                  <span className="text-emerald-400 font-extrabold ml-1.5">
                                    (-{job.space_saved_percentage.toFixed(0)}%)
                                  </span>
                                )}{' '}
                                • <span className="text-slate-500">{new Date(job.created_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={dlUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black text-xs font-extrabold transition shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-[#141926] transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* System Status Footer */}
      <footer className="py-4 border-t border-white/[0.05] bg-[#07090f]/90 text-[11px] text-slate-500 px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>C++17 Engine Active</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Supabase Cloud Connected</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Verified</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/bansalayush475/CompressX"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>CompressX v2.4</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          if (activeTab === 'history') loadHistory();
        }}
      />
    </div>
  );
};

export default App;
