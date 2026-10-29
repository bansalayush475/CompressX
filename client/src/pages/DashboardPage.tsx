import React, { useEffect, useState } from 'react';
import {
  FileText,
  HardDrive,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  FolderOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { DashboardStats, Job } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const isEmpty = !stats || stats.totalFiles === 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Processed Files</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalFiles ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">{stats?.successCount ?? 0} successful</span>
            <span>•</span>
            <span className="text-slate-500">{stats?.failCount ?? 0} failed</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Original Size</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatBytes(stats?.totalOriginalBytes ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Output: <span className="text-slate-200">{formatBytes(stats?.totalResultBytes ?? 0)}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Space Saved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatBytes(Math.max(0, stats?.totalSpaceSaved ?? 0))}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Net reduction across all jobs
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Compression Ratio</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.avgRatio ? `${stats.avgRatio}:1` : '1.00:1'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Input size / Output size ratio
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Compression History Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Start by compressing your first file using Huffman Coding, Run-Length Encoding, or Automatic mode.
            </p>
          </div>
          <button
            onClick={() => onNavigate('compress')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
          >
            <span>Compress Files Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Algorithm Distribution Chart */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Algorithm Usage Distribution
              </h3>
              <div className="h-64">
                {stats?.algorithmDistribution && stats.algorithmDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.algorithmDistribution}
                        dataKey="count"
                        nameKey="algorithm"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {stats.algorithmDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No algorithm statistics yet
                  </div>
                )}
              </div>
            </div>

            {/* Storage Volume Over Time */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Processed Data Volume
              </h3>
              <div className="h-64">
                {stats?.historyTrend && stats.historyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.historyTrend}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => formatBytes(val)} />
                      <Tooltip
                        formatter={(val: number) => formatBytes(val)}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="originalBytes" name="Original" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="compressedBytes" name="Compressed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No time trend data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Compression Operations
              </h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">File Name</th>
                    <th className="py-3 px-3">Original Size</th>
                    <th className="py-3 px-3">Result Size</th>
                    <th className="py-3 px-3">Algorithm</th>
                    <th className="py-3 px-3">Space Saved</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {stats?.recentActivity && stats.recentActivity.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate max-w-[200px]">{job.original_filename}</span>
                      </td>
                      <td className="py-3 px-3">{formatBytes(job.original_size)}</td>
                      <td className="py-3 px-3">{formatBytes(job.result_size)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                          {job.algorithm}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {job.space_saved > 0 ? (
                          <span className="text-emerald-400 font-medium">
                            +{formatBytes(job.space_saved)} ({job.space_saved_percentage.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {formatBytes(job.space_saved)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {job.duration_ms.toFixed(1)} ms
                      </td>
                      <td className="py-3 px-3">
                        {job.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
