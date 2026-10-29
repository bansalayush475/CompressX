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
  ArrowRight,
  Sliders,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { api } from './services/api';
import { AuthModal } from './components/AuthModal';
import { CompressionResultItem, Job } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compress' | 'history'>('compress');
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Compression state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [strength, setStrength] = useState<string>('normal');
  const [compressing, setCompressing] = useState(false);
  const [compressResult, setCompressResult] = useState<CompressionResultItem | null>(null);
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
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getJobs();
      setJobs(data.jobs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('compressx_token');
    localStorage.removeItem('compressx_user');
    setUser(null);
    if (activeTab === 'history') loadHistory();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setCompressing(true);
    setCompressResult(null);

    try {
      const res = await api.compressFiles([selectedFile], strength);
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

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col antialiased selection:bg-teal-500 selection:text-black">
      {/* Top Header */}
      <header className="h-16 border-b border-[#1c2030] bg-[#0f111a]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          {/* Logo with Cyan-Emerald Gradient */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 flex items-center justify-center font-black text-black text-base shadow-md shadow-emerald-500/20">
              CX
            </div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              CompressX
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Cloud
              </span>
            </span>
          </div>

          {/* Tab Switcher */}
          <nav className="flex items-center p-1 rounded-xl bg-[#090a0f] border border-[#1c2030] text-xs font-medium">
            <button
              onClick={() => setActiveTab('compress')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition ${
                activeTab === 'compress'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Compress File</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* User Account / Login */}
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151824] border border-[#2a3147] text-xs">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-white">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-[#151824] transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
        {/* COMPRESS WORKSPACE */}
        {activeTab === 'compress' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Compress File Size</h2>
              <p className="text-xs text-slate-400">
                Choose any file, reduce its size, and download the same file format ready to open.
              </p>
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1c2030] hover:border-emerald-500/50 bg-[#0f111a]/80 hover:bg-[#151824] rounded-3xl p-8 text-center cursor-pointer transition-all shadow-sm"
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
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white">
                {selectedFile ? selectedFile.name : 'Click to choose file'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} • Click to pick another file`
                  : 'Images (JPG, PNG, WebP), PDFs, Documents, Code, or Text'}
              </p>
            </div>

            {/* Selected File & Compression Strength */}
            {selectedFile && (
              <div className="bg-[#0f111a] border border-[#1c2030] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Compression Level</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#090a0f] p-1 rounded-xl border border-[#1c2030] text-xs">
                    <button
                      onClick={() => setStrength('normal')}
                      className={`px-3 py-1 rounded-lg transition ${
                        strength === 'normal'
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Balanced
                    </button>
                    <button
                      onClick={() => setStrength('high')}
                      className={`px-3 py-1 rounded-lg transition ${
                        strength === 'high'
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      High
                    </button>
                    <button
                      onClick={() => setStrength('maximum')}
                      className={`px-3 py-1 rounded-lg transition ${
                        strength === 'maximum'
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Maximum
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCompress}
                  disabled={compressing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {compressing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Optimizing & Compressing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black" />
                      <span>Compress & Reduce Size</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Direct Download Card */}
            {compressResult && compressResult.success && (
              <div className="bg-[#0f111a] border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {compressResult.downloadFilename || compressResult.filename}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {compressResult.algorithm} • {compressResult.durationMs} ms
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Reduction</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      -{compressResult.spaceSavedPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#090a0f] border border-[#1c2030]">
                    <span className="text-slate-400 block mb-0.5">Original Size</span>
                    <span className="font-mono text-slate-300 font-medium">{formatBytes(compressResult.originalSize)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090a0f] border border-[#1c2030]">
                    <span className="text-slate-400 block mb-0.5">Compressed Size</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatBytes(compressResult.compressedSize)}</span>
                  </div>
                </div>

                {/* Big Direct Download Button */}
                <a
                  href={compressResult.downloadUrl}
                  download
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Compressed File ({compressResult.downloadFilename || compressResult.filename})</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* HISTORY WORKSPACE */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Your Compressed Files</h2>
                <p className="text-xs text-slate-400">Stored in Supabase cloud and ready for instant download.</p>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-400">Loading history...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-[#0f111a]/50 border border-dashed border-[#1c2030] rounded-3xl p-8 space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No compressed files yet</p>
                <p className="text-xs text-slate-500">Compress your first file to see it here.</p>
                <button
                  onClick={() => setActiveTab('compress')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-semibold text-xs"
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

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl bg-[#0f111a] border border-[#1c2030] flex items-center justify-between gap-4 hover:border-emerald-500/40 transition"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2.5 rounded-xl bg-[#151824] text-emerald-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
                            {job.original_filename}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {formatBytes(job.original_size)} → <span className="text-emerald-400 font-medium">{formatBytes(job.result_size)}</span>
                            {job.space_saved > 0 && (
                              <span className="text-emerald-400 font-medium ml-1">
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"
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
