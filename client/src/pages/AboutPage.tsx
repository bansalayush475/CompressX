import React from 'react';
import {
  Info,
  Binary,
  Code2,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-300 text-xs leading-relaxed">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-lg">
            CX
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">CompressX</h3>
            <p className="text-xs text-indigo-400 font-medium">Compress Anything. Recover Everything.</p>
          </div>
        </div>
        <p className="text-slate-400 mt-2">
          Universal File Compression and Decompression System Using Data Structures and Algorithms. Developed as a production-quality academic system in C++17, Node.js/Express, and React/TypeScript.
        </p>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2.5">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Problem Statement</span>
          </h4>
          <p className="text-slate-400">
            File formats across modern computing contain diverse entropy characteristics. Traditional utilities often treat compression as a black box without transparency. CompressX provides universal arbitrary byte-safe file handling, rigorous lossless recovery, empirical algorithm comparison, and transparent visual education of underlying data structures.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2.5">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Core Objectives</span>
          </h4>
          <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
            <li>Implement binary-safe Huffman Coding using Min-Heaps and Binary Trees from scratch in C++.</li>
            <li>Implement lossless packet-based Run-Length Encoding (RLE).</li>
            <li>Provide byte-for-byte SHA-256 cryptographic verification for every operation.</li>
            <li>Eliminate dummy prototypes with empirical algorithm benchmarking.</li>
            <li>Visualize step-by-step priority queue extractions and prefix-tree generation.</li>
          </ul>
        </div>
      </div>

      {/* Custom Container Format Specification */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Custom .cpx Container Specification (Version 1)</span>
        </h4>
        <p className="text-slate-400">
          CompressX packages compressed streams into a self-contained, portable, endian-explicit binary container:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
          <div>[0x00 - 0x03] Magic Bytes: 0x43, 0x50, 0x58, 0x31 ("CPX1")</div>
          <div>[0x04 - 0x05] Format Version: uint16_t (1)</div>
          <div>[0x06]        Algorithm ID: uint8_t (0: Store, 1: Huffman, 2: RLE)</div>
          <div>[0x07]        Flags: uint8_t (Bits 0..3: valid bits in final payload byte)</div>
          <div>[0x08 - 0x0F] Original Uncompressed Size: uint64_t (little-endian)</div>
          <div>[0x10 - 0x2F] Original File SHA-256: 32 raw cryptographic hash bytes</div>
          <div>[0x30 - 0x31] Original Filename Length: uint16_t</div>
          <div>[Variable]    Original Filename: UTF-8 sanitized basename</div>
          <div>[0x00 - 0x03] Tree Metadata Length: uint32_t</div>
          <div>[Variable]    Tree Structure / Codebook Bitstream (Pre-order traversal)</div>
          <div>[0x00 - 0x07] Encoded Payload Length: uint64_t</div>
          <div>[Variable]    Encoded Payload Bitstream</div>
          <div>[Trailer 32B] Container Integrity Checksum: SHA-256 over entire preceding container</div>
        </div>
      </div>

      {/* Algorithm Complexity Analysis */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-4 h-4 text-amber-400" />
          <span>Algorithmic Complexity Analysis</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Time Complexity</th>
                <th className="py-2.5 px-3">Space Complexity</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              <tr>
                <td className="py-2.5 px-3 text-white">Frequency Histogram</td>
                <td className="py-2.5 px-3 text-emerald-400">O(n)</td>
                <td className="py-2.5 px-3 text-indigo-400">O(1) [256 bytes]</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Single linear pass over input stream</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white">Min-Heap Tree Build</td>
                <td className="py-2.5 px-3 text-emerald-400">O(k log k)</td>
                <td className="py-2.5 px-3 text-indigo-400">O(k)</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">For alphabet size $k \le 256$, $\le 255$ merge steps</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white">Code Generation</td>
                <td className="py-2.5 px-3 text-emerald-400">O(k)</td>
                <td className="py-2.5 px-3 text-indigo-400">O(k)</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Depth-first traversal assigning '0' and '1'</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white">Payload Encoding</td>
                <td className="py-2.5 px-3 text-emerald-400">O(n)</td>
                <td className="py-2.5 px-3 text-indigo-400">O(n)</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Lookup and bit packing into bytes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white">Payload Decoding</td>
                <td className="py-2.5 px-3 text-emerald-400">O(n)</td>
                <td className="py-2.5 px-3 text-indigo-400">O(n)</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Traverse binary tree until leaf reached</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white">RLE Compression</td>
                <td className="py-2.5 px-3 text-emerald-400">O(n)</td>
                <td className="py-2.5 px-3 text-indigo-400">O(n)</td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Single pass grouping runs and literals</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated QA Test Suite Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Automated Engine Verification (18/18 Tests Passing)</span>
        </h4>
        <p className="text-slate-400">
          The standalone test runner (<code className="text-indigo-300">bin/test_runner.exe</code>) validates all critical boundary conditions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 1: Empty input (0 bytes)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 2: Single-byte input</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 3: Repeated bytes (500 'A's)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 4: All 256 byte values present</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 5: Random binary input (50 KB)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 6: Punctuation & Whitespace</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 7: Multi-byte UTF-8 & Emoji</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 8: Media pattern simulation</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 9: High-entropy binary simulation</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 10: Multi-megabyte (2 MB) roundtrip</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 11: Corrupted signature rejection</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 12: Truncated container detection</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 13: Bit corruption SHA-256 detection</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 14: Invalid tree metadata safe rejection</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 15: RLE runs exceeding 130 byte record</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 16: Path traversal & filename sanitization</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 17: Non-existent file error handling</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 18: Auto mode size-expansion fallback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
