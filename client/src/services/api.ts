import {
  DashboardStats,
  Job,
  CompressionResultItem,
  DecompressionResultItem,
  ComparisonReport,
  VisualizerTrace
} from '../types';

export const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('compressx_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async register(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats/dashboard`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async compressFiles(files: File[], algorithm: string): Promise<{ results: CompressionResultItem[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('algorithm', algorithm);

    const res = await fetch(`${API_BASE}/compress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Compression request failed');
    }
    return res.json();
  },

  async decompressFiles(files: File[]): Promise<{ results: DecompressionResultItem[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetch(`${API_BASE}/decompress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Decompression request failed');
    }
    return res.json();
  },

  async compareFile(file: File): Promise<ComparisonReport> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Comparison request failed');
    }
    return res.json();
  },

  async visualize(payload: { file?: File; text?: string }): Promise<VisualizerTrace> {
    let res: Response;
    if (payload.file) {
      const formData = new FormData();
      formData.append('file', payload.file);
      res = await fetch(`${API_BASE}/visualize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
    } else {
      res = await fetch(`${API_BASE}/visualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text: payload.text })
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Visualization generation failed');
    }
    return res.json();
  },

  async getJobs(params: {
    search?: string;
    algorithm?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ jobs: Job[]; total: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.algorithm) query.set('algorithm', params.algorithm);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/jobs?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch job history');
    return res.json();
  },

  async deleteJob(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete job');
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/jobs/export/csv`;
  }
};
