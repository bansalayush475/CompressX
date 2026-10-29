import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Archive,
  CheckCircle2,
  AlertCircle,
  Download,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { CompressionResultItem } from '../types';

export const CompressPage: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [algorithm, setAlgorithm] = useState<string>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<CompressionResultItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompress = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    try {
      const response = await api.compressFiles(selectedFiles, algorithm);
      setResults(response.results);
      setSelectedFiles([]); // clear uploaded list once processed
    } catch (err: any) {
      alert(`Compression failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const algorithms = [
    {
      id: 'auto',
      title: 'Automatic Mode (Recommended)',
      desc: 'Evaluates Huffman, RLE, and Store representations and selects the smallest valid output container.',
      badge: 'Smart'
    },
    {
      id: 'huffman',
      title: 'Huffman Coding',
      desc: 'Greedy prefix-free binary tree encoding based on symbol frequencies. Ideal for text and structured data.',
      badge: 'O(n)'
    },
    {
      id: 'rle',
      title: 'Run-Length Encoding (RLE)',
      desc: 'Lossless packet-based byte-run compression. Ideal for bitmaps, sparse arrays, and repeated byte sequences.',
      badge: 'Fast'
    },
    {
      id: 'store',
      title: 'Store (No Compression)',
      desc: 'Packages the raw binary stream inside the verified .cpx container format without transformation.',
      badge: '1:1'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          Drop any files here, or <span className="text-indigo-400 underline">browse</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Universal binary support: PDF, DOCX, Images, Video, Archives, Code, Executables, or raw binary.
        </p>
      </div>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Queued Files</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
                {selectedFiles.length}
              </span>
            </h4>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-400 hover:text-red-400 transition"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-md">{file.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm Selection */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Compression Algorithm Strategy
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {algorithms.map((algo) => {
            const active = algorithm === algo.id;
            return (
              <button
                key={algo.id}
                onClick={() => setAlgorithm(algo.id)}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  active
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white">{algo.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {algo.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{algo.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Processing in C++ Engine...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Compress {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} (.cpx)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Compression Completed</span>
          </h4>

          <div className="space-y-4">
            {results.map((res, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">{res.filename}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Algorithm: <span className="text-indigo-400 font-medium">{res.algorithm}</span> • Time: <span className="font-mono">{res.durationMs.toFixed(1)} ms</span>
                      </p>
                    </div>
                  </div>

                  {res.success && (
                    <a
                      href={res.downloadUrl}
                      download
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .cpx</span>
                    </a>
                  )}
                </div>

                {res.success ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Original Size</span>
                      <span className="font-bold text-white font-mono">{formatBytes(res.originalSize)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Compressed Size</span>
                      <span className="font-bold text-indigo-400 font-mono">{formatBytes(res.compressedSize)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Space Saved</span>
                      <span className={`font-bold font-mono ${res.spaceSaved >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {res.spaceSaved >= 0 ? `+${formatBytes(res.spaceSaved)} (${res.spaceSavedPercentage.toFixed(1)}%)` : formatBytes(res.spaceSaved)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Compression Ratio</span>
                      <span className="font-bold text-amber-400 font-mono">{res.compressionRatio.toFixed(2)}:1</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{res.errorMessage}</span>
                  </div>
                )}

                {res.originalSha256 && (
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">SHA-256: {res.originalSha256}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
