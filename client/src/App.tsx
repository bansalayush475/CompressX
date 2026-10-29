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
  Percent,
  Sparkles,
  Image as ImageIcon,
  File,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Lock
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
      return { icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: `${ext.toUpperCase()} Image` };
    }
    if (['pdf'].includes(ext)) {
      return { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'PDF Document' };
    }
    if (['docx', 'xlsx', 'pptx', 'doc', 'xls'].includes(ext)) {
      return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: `${ext.toUpperCase()} Document` };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: `${ext.toUpperCase()} Archive` };
    }
    return { icon: File, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: `${ext.toUpperCase() || 'DATA'} File` };
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
    { label: 'Light', pct: 30, hint: 'High Quality', desc: 'Minimal loss' },
    { label: 'Balanced', pct: 50, hint: 'Standard', desc: 'Best balance' },
    { label: 'High', pct: 70, hint: 'Web Optimized', desc: 'Fast sharing' },
    { label: 'Extra Small', pct: 85, hint: 'Ultra Compact', desc: 'Max savings' },
    { label: 'Maximum', pct: 95, hint: 'Aggressive', desc: 'Smallest size' }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col antialiased selection:bg-teal-500 selection:text-black">
      {/* Top Header */}
      <header className="h-16 border-b border-[#171b26] bg-[#0c0e17]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center font-black text-black text-sm shadow-md shadow-emerald-500/25">
              CX
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">CompressX</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-mono">
                PRO
              </span>
            </div>
          </div>

          {/* Navigation Switcher */}
          <nav className="flex items-center p-1 rounded-xl bg-[#090a10] border border-[#171b26] text-xs font-medium">
            <button
              onClick={() => setActiveTab('compress')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'compress'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Compress</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {user && jobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121622] border border-[#212638] text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-200 max-w-[120px] truncate">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-[#121622] transition border border-transparent hover:border-red-500/20"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-5 md:p-8 flex flex-col justify-center">
        {/* COMPRESS WORKSPACE */}
        {activeTab === 'compress' && (
          <div className="space-y-6">
            {/* Header Titles */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Universal File Compression
              </h2>
              <p className="text-xs text-slate-400">
                Compress files directly while preserving the original format. Ready to open instantly!
              </p>
            </div>

            {/* Dropzone OR Selected File View */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-[#1e2434] hover:border-emerald-500/40 bg-[#0c0e17]/80 hover:bg-[#101320]'
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3.5 border border-emerald-500/20 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Drop your file here, or <span className="text-emerald-400 underline underline-offset-2">browse</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Images (PNG, JPG, WebP), PDFs, Office Docs (DOCX, PPTX), Code & Text
                </p>

                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#171b26]/70 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Format-preserving • Instant direct download • Zero decompression needed</span>
                </div>
              </div>
            ) : (
              /* Selected File Card */
              <div className="bg-[#0c0e17] border border-[#1e2434] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5 min-w-0">
                  {(() => {
                    const info = getFileInfo(selectedFile.name);
                    const IconComponent = info.icon;
                    return (
                      <div className={`w-11 h-11 rounded-xl ${info.bg} ${info.border} border flex items-center justify-center shrink-0`}>
                        <IconComponent className={`w-5 h-5 ${info.color}`} />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-sm truncate max-w-[280px] md:max-w-[340px]">
                        {selectedFile.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                        {getFileInfo(selectedFile.name).label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Original size: <span className="font-mono text-slate-300 font-medium">{formatBytes(selectedFile.size)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-300 hover:text-white text-xs font-medium border border-[#212638] transition"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setCompressResult(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-[#141824] transition"
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
              <div className="bg-[#0c0e17] border border-[#1e2434] rounded-3xl p-6 space-y-6 shadow-xl">
                {/* 1. Header with Status & Estimated Reduction */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#171b26]">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Target Compression Level
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {getLevelLabel(targetPercent)} Intensity (-{targetPercent}% reduction target)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Live Size Pill */}
                    <div className="px-3 py-1.5 rounded-xl bg-[#121622] border border-[#212638] text-right">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">
                        Estimated Size
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        ~{getEstimatedSize()} <span className="text-slate-400 font-normal">(-{targetPercent}%)</span>
                      </span>
                    </div>

                    {/* Direct Percent Type Box */}
                    <div className="flex items-center gap-1 bg-[#121622] px-2.5 py-1.5 rounded-xl border border-[#212638]">
                      <span className="text-[11px] text-slate-400 font-medium">Type:</span>
                      <input
                        type="number"
                        min={10}
                        max={95}
                        value={targetPercent}
                        onChange={(e) => handlePercentInput(e.target.value)}
                        className="w-9 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded"
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
                        className={`transition hover:text-emerald-400 ${
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
                        className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                          isActive
                            ? 'bg-gradient-to-b from-[#142325] to-[#0d161a] border-emerald-500/60 shadow-md shadow-emerald-500/10'
                            : 'bg-[#090a10] border-[#171b26] hover:border-[#2a3245] hover:bg-[#10131d]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {tier.label}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              isActive
                                ? 'bg-emerald-500 text-black'
                                : 'bg-[#141824] text-slate-400'
                            }`}
                          >
                            -{tier.pct}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2 block">
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
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {compressing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
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
              <div className="bg-[#0c0e17] border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in">
                {/* Result Status Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#171b26]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Compression Completed Successfully
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
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      -{compressResult.spaceSavedPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Before / After Comparison */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#090a10] border border-[#171b26]">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Original</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatBytes(compressResult.originalSize)}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#090a10] border border-[#171b26]">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Compressed</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatBytes(compressResult.compressedSize)}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#090a10] border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-emerald-400/80 block text-[11px] mb-0.5">Total Saved</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatBytes(compressResult.spaceSaved)}</span>
                  </div>
                </div>

                {/* Primary Download CTA */}
                <div className="space-y-2">
                  <a
                    href={compressResult.downloadUrl}
                    download
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download {compressResult.downloadFilename || compressResult.filename}</span>
                  </a>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
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
              <div className="text-center py-16 bg-[#0c0e17] border border-[#1e2434] rounded-3xl p-8 space-y-4 max-w-md mx-auto shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sign In to View History</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Compression history is strictly private and tied to your account. Sign in to access your previous files and cloud downloads.
                  </p>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              /* Authenticated User History */
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Your Compressed Files</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {user.username}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">Files stored in Supabase cloud and ready for instant download.</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {jobs.length > 0 && (
                      <button
                        onClick={handleClearAllHistory}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition cursor-pointer"
                        title="Clear all history records"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear History</span>
                      </button>
                    )}
                    <button
                      onClick={loadHistory}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#1a2030] text-slate-300 text-xs border border-[#212638] transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs text-slate-400">Loading your history...</span>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12 bg-[#0c0e17] border border-dashed border-[#1e2434] rounded-3xl p-8 space-y-3">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">No compressed files yet for {user.username}</p>
                    <p className="text-xs text-slate-500">Compress your first file to see it here.</p>
                    <button
                      onClick={() => setActiveTab('compress')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold text-xs cursor-pointer"
                    >
                      Compress a file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                          className="p-4 rounded-2xl bg-[#0c0e17] border border-[#1e2434] flex items-center justify-between gap-4 hover:border-emerald-500/40 transition shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 truncate">
                            <div className={`w-10 h-10 rounded-xl ${info.bg} ${info.border} border flex items-center justify-center shrink-0`}>
                              <IconComp className={`w-4 h-4 ${info.color}`} />
                            </div>
                            <div className="truncate">
                              <h4 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
                                {job.original_filename}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {formatBytes(job.original_size)} → <span className="text-emerald-400 font-semibold">{formatBytes(job.result_size)}</span>
                                {job.space_saved > 0 && (
                                  <span className="text-emerald-400 font-semibold ml-1.5">
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black text-xs font-bold transition shadow-sm shadow-emerald-500/20"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-[#141824] transition cursor-pointer"
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
