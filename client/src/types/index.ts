export interface Job {
  id: string;
  user_id?: string;
  type: 'compress' | 'decompress' | 'compare';
  original_filename: string;
  original_size: number;
  result_size: number;
  algorithm: string;
  space_saved: number;
  space_saved_percentage: number;
  compression_ratio: number;
  duration_ms: number;
  checksum: string;
  verified: number;
  status: 'completed' | 'failed' | 'processing';
  error_message?: string;
  artifact_path?: string;
  created_at: string;
}

export interface DashboardStats {
  totalFiles: number;
  successCount: number;
  failCount: number;
  totalOriginalBytes: number;
  totalResultBytes: number;
  totalSpaceSaved: number;
  avgRatio: number;
  algorithmDistribution: Array<{
    algorithm: string;
    count: number;
    spaceSaved: number;
  }>;
  recentActivity: Job[];
  historyTrend: Array<{
    date: string;
    jobsCount: number;
    originalBytes: number;
    compressedBytes: number;
  }>;
}

export interface CompressionResultItem {
  id: string;
  filename: string;
  downloadFilename?: string;
  originalSize: number;
  compressedSize: number;
  spaceSaved: number;
  spaceSavedPercentage: number;
  compressionRatio: number;
  durationMs: number;
  algorithm: string;
  originalSha256?: string;
  containerSha256?: string;
  downloadUrl: string;
  success: boolean;
  errorMessage?: string;
}

export interface DecompressionResultItem {
  id: string;
  inputFilename: string;
  originalFilename: string;
  recoveredSize: number;
  durationMs: number;
  algorithm: string;
  recoveredSha256: string;
  checksumVerified: boolean;
  downloadUrl: string;
  success: boolean;
  errorMessage?: string;
}

export interface AlgorithmComparisonItem {
  algorithmKey: string;
  algorithmName: string;
  inputSize: number;
  outputSize: number;
  spaceSaved: number;
  spaceSavedPercentage: number;
  compressionRatio: number;
  compressionTimeMs: number;
  decompressionTimeMs: number;
  verified: boolean;
  selectedInAuto: boolean;
}

export interface ComparisonReport {
  success: boolean;
  filename: string;
  originalSize: number;
  originalSha256: string;
  bestAlgorithm: string;
  items: AlgorithmComparisonItem[];
  errorMessage?: string;
}

export interface VisualizerSymbol {
  byteVal: number;
  label: string;
  hex: string;
  freq: number;
  percentage: number;
  code: string;
  codeLength: number;
}

export interface VisualizerStep {
  type: string;
  description: string;
  createdNodeId: number;
  activeNodeIds: number[];
  heapNodeIds: number[];
}

export interface VisualizerTreeNode {
  id: number;
  freq: number;
  isLeaf: boolean;
  code: string;
  label: string;
  byteVal?: number;
  hex?: string;
  left?: VisualizerTreeNode;
  right?: VisualizerTreeNode;
}

export interface VisualizerTrace {
  totalBytes: number;
  uniqueSymbols: number;
  entropy: number;
  avgCodeLength: number;
  symbols: VisualizerSymbol[];
  steps: VisualizerStep[];
  tree: VisualizerTreeNode;
}
