import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { Job } from '../types';

export const HistoryPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [algorithm, setAlgorithm] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, [search, algorithm, status, sortBy, sortOrder]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.getJobs({
        search,
        algorithm,
        status,
        sortBy,
        sortOrder,
        limit: 100
      });
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job record?')) return;
    try {
      await api.deleteJob(id);
      if (selectedJob?.id === id) setSelectedJob(null);
      loadJobs();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Persistent Compression History</span>
          </h3>
          <p className="text-xs text-slate-400">
            Backed by local SQLite database. Track execution metrics, verification status, and space savings.
          </p>
        </div>

        <a
          href={api.getExportCsvUrl()}
          download
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export CSV Report</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or job ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Algorithms</option>
            <option value="HUFFMAN">Huffman Coding</option>
            <option value="RLE">Run-Length Encoding</option>
            <option value="STORE">Store Mode</option>
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="created_at">Sort by Date</option>
            <option value="original_size">Sort by File Size</option>
            <option value="space_saved">Sort by Space Saved</option>
            <option value="duration_ms">Sort by Duration</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No history records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Original Size</th>
                  <th className="py-3 px-4">Result Size</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Space Saved</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{job.original_filename}</span>
                    </td>
                    <td className="py-3 px-4 capitalize font-mono text-[11px] text-slate-400">
                      {job.type}
                    </td>
                    <td className="py-3 px-4 font-mono">{formatBytes(job.original_size)}</td>
                    <td className="py-3 px-4 font-mono">{formatBytes(job.result_size)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        {job.algorithm}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {job.space_saved > 0 ? (
                        <span className="text-emerald-400">+{formatBytes(job.space_saved)}</span>
                      ) : (
                        <span className="text-slate-500">{formatBytes(job.space_saved)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{job.duration_ms.toFixed(1)} ms</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => handleDelete(job.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base truncate max-w-[280px]">
                {selectedJob.original_filename}
              </h4>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Job Identifier:</span>
                <span className="font-mono text-slate-300 text-[11px]">{selectedJob.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Operation:</span>
                <span className="font-medium text-white capitalize">{selectedJob.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Selected Algorithm:</span>
                <span className="font-medium text-indigo-400">{selectedJob.algorithm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Original Size:</span>
                <span className="font-mono text-white">{formatBytes(selectedJob.original_size)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Result Size:</span>
                <span className="font-mono text-white">{formatBytes(selectedJob.result_size)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Net Space Saved:</span>
                <span className="font-mono text-emerald-400">{formatBytes(selectedJob.space_saved)} ({selectedJob.space_saved_percentage.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Compression Ratio:</span>
                <span className="font-mono text-amber-400">{selectedJob.compression_ratio.toFixed(2)}:1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Processing Time:</span>
                <span className="font-mono text-slate-300">{selectedJob.duration_ms.toFixed(1)} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Status:</span>
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedJob.status}
                </span>
              </div>
              {selectedJob.checksum && (
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">SHA-256 Checksum:</span>
                  <span className="font-mono text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded-lg block border border-slate-800">
                    {selectedJob.checksum}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
