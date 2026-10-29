import React, { useState } from 'react';
import {
  GitCompare,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Zap,
  Info,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ComparisonReport } from '../types';

export const ComparePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<ComparisonReport | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const runComparison = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setReport(null);

    try {
      const rep = await api.compareFile(selectedFile);
      setReport(rep);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const chartData = report?.items.map((item) => ({
    name: item.algorithmName.split('(')[0].trim(),
    outputSize: item.outputSize,
    compressionRatio: Number(item.compressionRatio.toFixed(2)),
    compressionTime: Number(item.compressionTimeMs.toFixed(2)),
    isBest: item.selectedInAuto
  })) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* File Selection Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <span>Algorithm Comparison Laboratory</span>
          </h3>
          <p className="text-xs text-slate-400">
            Benchmark Huffman Coding, RLE, Auto mode, and Store simultaneously against the exact same file bytes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 hover:border-slate-700 cursor-pointer transition">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300 truncate max-w-xs">
              {selectedFile ? selectedFile.name : 'Select file for empirical benchmark...'}
            </span>
            <input type="file" onChange={handleFileSelect} className="hidden" />
          </label>

          <button
            onClick={runComparison}
            disabled={!selectedFile || isProcessing}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Benchmarking Algorithms...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Execute Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Report */}
      {report && (
        <div className="space-y-8">
          {/* Winner Banner */}
          <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Optimal Strategy Selected
                </span>
                <h4 className="text-lg font-bold text-white mt-0.5">
                  {report.bestAlgorithm}
                </h4>
                <p className="text-xs text-slate-400">
                  Original Size: {formatBytes(report.originalSize)}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400 block">Original SHA-256</span>
              <span className="text-[11px] font-mono text-slate-300 truncate max-w-xs block">
                {report.originalSha256}
              </span>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Empirical Performance Metrics
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Algorithm</th>
                    <th className="py-3 px-3">Input Size</th>
                    <th className="py-3 px-3">Output Size</th>
                    <th className="py-3 px-3">Space Saved</th>
                    <th className="py-3 px-3">Ratio</th>
                    <th className="py-3 px-3">Comp. Time</th>
                    <th className="py-3 px-3">Decomp. Time</th>
                    <th className="py-3 px-3">Lossless Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {report.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/30 transition ${
                        item.selectedInAuto ? 'bg-indigo-500/5 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-white flex items-center gap-2">
                        {item.selectedInAuto && <Award className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{item.algorithmName}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{formatBytes(item.inputSize)}</td>
                      <td className="py-3 px-3 font-mono text-white font-bold">{formatBytes(item.outputSize)}</td>
                      <td className="py-3 px-3 font-mono">
                        {item.spaceSaved > 0 ? (
                          <span className="text-emerald-400">
                            +{formatBytes(item.spaceSaved)} ({item.spaceSavedPercentage.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {formatBytes(item.spaceSaved)} ({item.spaceSavedPercentage.toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-400">{item.compressionRatio.toFixed(2)}:1</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{item.compressionTimeMs.toFixed(2)} ms</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{item.decompressionTimeMs.toFixed(2)} ms</td>
                      <td className="py-3 px-3">
                        {item.verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Exact Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Mismatch
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualization Graph */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Container Output Size Comparison (Smaller is Better)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => formatBytes(v)} />
                  <Tooltip
                    formatter={(val: number) => formatBytes(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="outputSize" name="Output Size" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isBest ? '#10b981' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Academic Insight */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-200">Algorithm Transparency Note:</strong> By Shannon's Source Coding Theorem and the Pigeonhole Principle, no lossless algorithm can compress every possible input sequence. When high-entropy or pre-compressed data is processed, header and codebook overhead will increase the total size. CompressX's Automatic Mode transparently falls back to direct Store or the minimal container.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
