import React, { useState, useEffect, useRef } from 'react';
import {
  Binary,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Upload,
  Code2,
  TreePine,
  Layers,
  Info,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { VisualizerTrace, VisualizerTreeNode, VisualizerStep } from '../types';

export const VisualizerPage: React.FC = () => {
  const [inputText, setInputText] = useState('ABRACADABRA');
  const [trace, setTrace] = useState<VisualizerTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1000); // ms per step
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchTrace(inputText);
  }, []);

  const fetchTrace = async (text: string, file?: File) => {
    setLoading(true);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const data = await api.visualize({ file, text: file ? undefined : text });
      setTrace(data);
      setCurrentStepIndex(0);
    } catch (err: any) {
      alert(`Visualizer failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      fetchTrace('', e.target.files[0]);
    }
  };

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (!trace || prev >= trace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, trace]);

  const step: VisualizerStep | undefined = trace?.steps[currentStepIndex];

  // Recursive tree rendering component
  const renderTreeNode = (node?: VisualizerTreeNode) => {
    if (!node) return null;

    const isLeaf = node.isLeaf;
    return (
      <div className="flex flex-col items-center">
        <div
          className={`px-3 py-2 rounded-xl text-center shadow-lg transition-all border ${
            isLeaf
              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
              : 'bg-slate-800/80 border-slate-700 text-slate-200'
          }`}
        >
          <div className="text-[11px] font-bold">
            {isLeaf ? (
              <span className="text-white font-mono">{node.label}</span>
            ) : (
              <span className="text-slate-400">Merged</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">w={node.freq}</div>
          {node.code && (
            <div className="mt-1 px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
              {node.code}
            </div>
          )}
        </div>

        {/* Children Branches */}
        {(!isLeaf && (node.left || node.right)) && (
          <div className="flex items-start gap-4 mt-3 pt-3 border-t border-slate-700/60 relative">
            {node.left && (
              <div className="flex flex-col items-center relative">
                <span className="absolute -top-3 text-[10px] font-mono text-emerald-400 font-bold bg-slate-900 px-1 rounded">
                  0
                </span>
                {renderTreeNode(node.left)}
              </div>
            )}
            {node.right && (
              <div className="flex flex-col items-center relative">
                <span className="absolute -top-3 text-[10px] font-mono text-amber-400 font-bold bg-slate-900 px-1 rounded">
                  1
                </span>
                {renderTreeNode(node.right)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Input & Presets Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Binary className="w-5 h-5 text-indigo-400" />
              <span>Interactive Huffman DSA Visualizer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Observe min-priority queue extraction, greedy node pairing, and binary prefix tree generation.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            {['ABRACADABRA', 'MISSISSIPPI', 'HELLO WORLD', 'COMPRESSX'].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setInputText(preset);
                  fetchTrace(preset);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                  inputText === preset
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type arbitrary text to analyze..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            onClick={() => fetchTrace(inputText)}
            disabled={loading || !inputText}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition disabled:opacity-50"
          >
            Analyze Text
          </button>
          <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 cursor-pointer transition flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      )}

      {trace && !loading && (
        <>
          {/* Information Theory Analytics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Input Symbols</span>
              <span className="text-xl font-bold text-white font-mono">{trace.totalBytes}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Distinct Symbols (Alphabet)</span>
              <span className="text-xl font-bold text-indigo-400 font-mono">{trace.uniqueSymbols}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Shannon Entropy H(X)</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{trace.entropy} bits</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Average Code Length L</span>
              <span className="text-xl font-bold text-amber-400 font-mono">{trace.avgCodeLength} bits</span>
            </div>
          </div>

          {/* Min-Heap Step-by-Step Simulation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Step {currentStepIndex + 1} of {trace.steps.length}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {step?.description || 'Building min-heap...'}
                </h4>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                  title="Previous Step"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition"
                  title={isPlaying ? 'Pause' : 'Play Simulation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCurrentStepIndex((prev) => Math.min(trace.steps.length - 1, prev + 1))}
                  disabled={currentStepIndex >= trace.steps.length - 1}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                  title="Next Step"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Speed Selector */}
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700 focus:outline-none"
                >
                  <option value={2000}>0.5x</option>
                  <option value={1000}>1.0x</option>
                  <option value={500}>2.0x</option>
                  <option value={250}>4.0x</option>
                </select>
              </div>
            </div>

            {/* Min-Heap Priority Queue State */}
            <div>
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Min-Heap Priority Queue Contents
              </h5>
              <div className="flex flex-wrap gap-2">
                {step?.heapNodeIds.map((nodeId, idx) => {
                  const isActive = step.activeNodeIds.includes(nodeId);
                  const isCreated = step.createdNodeId === nodeId;
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-all ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 scale-105 shadow-md shadow-amber-500/20'
                          : isCreated
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 scale-105 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      Node #{nodeId}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tree View */}
            <div>
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Huffman Binary Tree Hierarchy (0 = Left, 1 = Right)
              </h5>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto min-h-[220px] flex justify-center items-center">
                {renderTreeNode(trace.tree)}
              </div>
            </div>
          </div>

          {/* Symbol Codebook Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Generated Symbol Codebook (Prefix-Free)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Hex</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Probability</th>
                    <th className="py-2.5 px-3">Huffman Code</th>
                    <th className="py-2.5 px-3">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {trace.symbols.map((sym, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono text-white font-bold">{sym.label}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{sym.hex}</td>
                      <td className="py-2.5 px-3 font-mono">{sym.freq}</td>
                      <td className="py-2.5 px-3 font-mono">{sym.percentage.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-400 font-bold">{sym.code}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{sym.codeLength} bits</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational DSA Theory Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>DSA Theory & Complexity Analysis</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-white block">Greedy Strategy</span>
                <p>
                  At every step, the algorithm extracts the two least-frequent nodes and unites them into a parent. This locally optimal choice guarantees a globally minimal external path weight.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-white block">Min-Priority Queue</span>
                <p>
                  Maintains tree nodes in $O(\log k)$ extraction and insertion time. For alphabet size $k \le 256$, tree construction takes $O(k \log k)$ operations.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-white block">Prefix-Free Property</span>
                <p>
                  No codeword is a prefix of any other codeword. This allows instantaneous sequential decoding using a bitstream traversal without lookup ambiguity.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
