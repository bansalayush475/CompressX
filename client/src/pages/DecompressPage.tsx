import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  ArchiveRestore,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  X,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { DecompressionResultItem } from '../types';

export const DecompressPage: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<DecompressionResultItem[]>([]);
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

  const handleDecompress = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    try {
      const response = await api.decompressFiles(selectedFiles);
      setResults(response.results);
      setSelectedFiles([]);
    } catch (err: any) {
      alert(`Decompression failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
          accept=".cpx"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-16 h-16 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
          <ArchiveRestore className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          Upload .cpx container files for lossless recovery
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          CompressX verifies magic signature, container headers, payloads, and verifies SHA-256 byte-for-byte.
        </p>
      </div>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Ready for Decompression</span>
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
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                    <ArchiveRestore className="w-4 h-4" />
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

          <div className="flex justify-end pt-2">
            <button
              onClick={handleDecompress}
              disabled={isProcessing}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition shadow-lg shadow-violet-600/30 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Decoding & Verifying SHA-256...</span>
                </>
              ) : (
                <>
                  <ArchiveRestore className="w-4 h-4" />
                  <span>Decompress & Verify ({selectedFiles.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Decompression Results */}
      {results.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Recovered Files</span>
          </h4>

          <div className="space-y-4">
            {results.map((res, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">{res.originalFilename || res.inputFilename}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Recovered from: <span className="font-mono text-slate-300">{res.inputFilename}</span> • Time: <span className="font-mono">{res.durationMs.toFixed(1)} ms</span>
                      </p>
                    </div>
                  </div>

                  {res.success && (
                    <a
                      href={res.downloadUrl}
                      download
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>

                {res.success ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Recovered Size</span>
                      <span className="font-bold text-white font-mono">{formatBytes(res.recoveredSize)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Algorithm Used</span>
                      <span className="font-bold text-indigo-400">{res.algorithm}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Integrity Verification</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Exact SHA-256 Match
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{res.errorMessage}</span>
                  </div>
                )}

                {res.recoveredSha256 && (
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">SHA-256: {res.recoveredSha256}</span>
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
