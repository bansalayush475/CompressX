# CompressX — Universal File Compression and Decompression System

> **Tagline:** Compress Anything. Recover Everything.  
> **Category:** Data Structures and Algorithms (DSA), Binary File Processing, Optimization & Software Engineering  
> **Core Engine:** C++17 (Native Binary Execution)  
> **Backend:** Node.js, Express.js, SQLite (`node:sqlite`)  
> **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts  

---

## 1. System Overview

**CompressX** is an academic and enterprise-grade file compression, decompression, and algorithm benchmarking suite. Unlike superficial prototypes that display mock data or rely on black-box external utilities, CompressX features a **100% custom C++17 compression engine** built from algorithmic fundamentals.

CompressX processes **arbitrary binary payloads** regardless of file format or extension—from PDFs, compiled executables, and high-definition video to audio, raw byte streams, and UTF-8 text—guaranteeing **byte-for-byte lossless reconstruction** with cryptographic SHA-256 validation.

---

## 2. System Architecture

```
+-------------------------------------------------------------------------+
|                           CompressX Web UI                              |
|   (React 19 + TypeScript + Tailwind CSS + Lucide Icons + Recharts)      |
|                                                                         |
|  [Dashboard]  [Compress]  [Decompress]  [Compare]  [DSA Visualizer] ... |
+------------------------------------+------------------------------------+
                                     |
                               HTTP REST APIs
                                     |
+------------------------------------v------------------------------------+
|                         Node.js Express Server                          |
|  - Multipart Upload Validation (Multer)                                 |
|  - Persistent SQLite Job Database (`node:sqlite`)                       |
|  - Safe Process Orchestrator (`child_process.execFile`)                 |
+------------------------------------+------------------------------------+
                                     |
                         Direct Process Execution
                                     |
+------------------------------------v------------------------------------+
|                      CompressX Native C++ Engine                        |
|                                                                         |
|  +-------------------------+  +---------------------------------------+ |
|  |     Huffman Coding      |  |         Run-Length Encoding           | |
|  |  - Min-Priority Queue   |  |  - Lossless Packet Control Byte       | |
|  |  - Binary Prefix Tree   |  |  - Runs: 3 to 130 bytes               | |
|  |  - Streaming BitWriter  |  |  - Literals: 1 to 128 bytes           | |
|  +-------------------------+  +---------------------------------------+ |
|                                                                         |
|  +-------------------------+  +---------------------------------------+ |
|  |   Store (Uncompressed)  |  |      Automatic Selection Engine       | |
|  |  - Baseline Preservation|  |  - Compares complete container sizes  | |
|  |  - Zero transformation  |  |  - Deterministic tie-breaking         | |
|  +-------------------------+  +---------------------------------------+ |
|                                                                         |
|  +--------------------------------------------------------------------+ |
|  |             Custom .cpx Binary Container Serializer                | |
|  |   Magic 'CPX1' | Little-Endian | SHA-256 Cryptographic Checksum    | |
|  +--------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
```

---

## 3. Core Algorithms Implemented

### Algorithm A: Huffman Coding (Greedy Min-Heap & Binary Tree)
1. **Frequency Analysis**: Builds an exact 256-symbol byte frequency distribution in $O(n)$ time.
2. **Min-Priority Queue**: Inserts all distinct byte frequencies into a min-heap.
3. **Greedy Node Merging**: Repeatedly extracts the two smallest nodes, creates an internal parent node with their combined weight, and re-inserts into the heap in $O(k \log k)$ time.
4. **Prefix-Free Code Generation**: Traverses the binary tree assigning `'0'` to left edges and `'1'` to right edges, ensuring the Kraft-McMillan prefix-free condition.
5. **Bitstream Packing**: Encodes original bytes into variable-length bit codes and packs them into 8-bit bytes using custom `BitWriter` and `BitReader`.
6. **Edge Case Safety**: Explicitly supports empty files (0 bytes), single-distinct-symbol inputs (e.g. repeated single characters), embedded null bytes (`0x00`), and full 256-byte permutations.

### Algorithm B: Lossless Binary Run-Length Encoding (RLE)
Uses an unambiguous packet-based control-byte scheme:
- **Run Packet** (Bit 7 = 1): Header byte `0x80 | (runLen - 3)` followed by 1 byte value. Supports runs from 3 to 130 bytes. Runs $>130$ bytes are cleanly partitioned into contiguous run packets.
- **Literal Packet** (Bit 7 = 0): Header byte `(litLen - 1)` followed by `litLen` raw literal bytes (1 to 128 bytes).
- **Zero Ambiguity**: No escape character collisions or byte-stuffing corruptions on arbitrary binary streams.

### Algorithm C: Store Without Compression
Preserves original bytes within the `.cpx` container structure to provide an uncompressed baseline.

### Algorithm D: Automatic Compression Mode
Empirically encodes the input using Huffman, RLE, and Store strategies in memory, compares their complete serialized container sizes (including all headers, tree tables, and trailers), and chooses the optimal representation deterministically.

---

## 4. Custom `.cpx` Container Format Specification (Version 1)

Every `.cpx` file is self-contained, portable, and validated with an explicit little-endian byte layout:

| Byte Offset | Field Name | Data Type | Description |
|---|---|---|---|
| `0x00 - 0x03` | Magic Signature | 4 bytes | `0x43, 0x50, 0x58, 0x31` (`"CPX1"`) |
| `0x04 - 0x05` | Format Version | uint16_t | Container version (`1`) |
| `0x06` | Algorithm ID | uint8_t | `0`: Store, `1`: Huffman, `2`: RLE |
| `0x07` | Flags | uint8_t | Bits 0..3: Valid bits in last payload byte |
| `0x08 - 0x0F` | Original Size | uint64_t | Uncompressed byte count (little-endian) |
| `0x10 - 0x2F` | Original SHA-256 | 32 bytes | Cryptographic hash of original uncompressed input |
| `0x30 - 0x31` | Filename Length | uint16_t | Length of sanitized original filename |
| `0x32 - ...` | Original Filename | UTF-8 String | Sanitized basename (path traversal protected) |
| Next 4 bytes | Metadata Length | uint32_t | Length of algorithm metadata |
| Variable | Tree Metadata | Bytes | Pre-order bitstream of Huffman binary tree |
| Next 8 bytes | Payload Length | uint64_t | Size of compressed byte stream |
| Variable | Encoded Payload | Bytes | Compressed bitstream / packet bytes |
| Final 32 bytes | Trailer Checksum | 32 bytes | SHA-256 cryptographic hash over container |

---

## 5. Algorithmic Complexity

| Phase | Time Complexity | Auxiliary Space | Practical Notes |
|---|---|---|---|
| Byte Frequency Scan | $O(n)$ | $O(1)$ [256 counts] | Single linear pass over file bytes |
| Min-Heap Construction | $O(k \log k)$ | $O(k)$ | Alphabet size $k \le 256$, max 255 merges |
| Codebook Generation | $O(k)$ | $O(k)$ | Depth-first traversal of binary tree |
| Huffman Bitstream Encoding | $O(n)$ | $O(n)$ | Fast array lookup per byte + bit shifting |
| Huffman Bitstream Decoding | $O(n)$ | $O(n)$ | Bit-by-bit binary tree navigation to leaf |
| RLE Compression / Decompression | $O(n)$ | $O(n)$ | Single pass run / literal chunking |
| SHA-256 Integrity Hash | $O(n)$ | $O(1)$ | 64-byte block streaming hash |

---

## 6. Automated QA Test Suite (18/18 Passing)

The test runner (`bin/test_runner.exe`) executes 18 mandatory test cases covering every critical boundary condition:

- [x] **Test 1:** Empty input (0 bytes) roundtrip across all modes
- [x] **Test 2:** Single-byte input roundtrip
- [x] **Test 3:** Repeated bytes (500 identical 'A's)
- [x] **Test 4:** All 256 byte values present
- [x] **Test 5:** Random binary input (50,000 bytes)
- [x] **Test 6:** Text with punctuation, tabs, and newlines
- [x] **Test 7:** UTF-8 multi-byte characters and emojis
- [x] **Test 8:** Media pattern simulation roundtrip
- [x] **Test 9:** High-entropy already-compressed simulation
- [x] **Test 10:** Large file roundtrip (2 Megabytes)
- [x] **Test 11:** Malformed container signature rejection
- [x] **Test 12:** Truncated compressed file rejection
- [x] **Test 13:** Bit corruption SHA-256 mismatch detection
- [x] **Test 14:** Invalid container metadata safe rejection
- [x] **Test 15:** RLE runs exceeding 130 byte record length
- [x] **Test 16:** Path traversal prevention and filename sanitization
- [x] **Test 17:** Non-existent file error handling
- [x] **Test 18:** Auto mode size-expansion fallback

---

## 7. Setup and Execution Instructions

### Prerequisites
- **Node.js** v18+ (tested on Node.js v24.20)
- **C++ Compiler:** MinGW-w64 (GCC / Clang) supporting C++17 (pre-compiled binary already in `bin/`)

### Quick Start (Production Mode)

1. **Launch the application:**
   ```powershell
   node server/src/index.js
   ```

2. Open your web browser:
   ```
   http://localhost:5000
   ```
   The backend serves both the API endpoints and the pre-built React production frontend directly!

### Running the C++ Test Suite
```powershell
.\bin\test_runner.exe
```

### Development Mode (Concurrent Live Reload)
1. **Start Backend Server:**
   ```powershell
   cd server
   npm start
   ```

2. **Start Frontend Dev Server:**
   ```powershell
   cd client
   npm run dev
   ```
   Navigate to `http://localhost:3000`.

---

## 8. REST API Reference

- `POST /api/compress` — Accepts multipart form-data with files and selected algorithm. Returns file metrics and download links.
- `POST /api/decompress` — Accepts `.cpx` containers. Reconstructs files and validates SHA-256 hashes.
- `POST /api/compare` — Benchmarks Huffman, RLE, Store, and Auto against the same input.
- `POST /api/visualize` — Generates min-heap operation trace and binary tree hierarchy JSON.
- `GET /api/stats/dashboard` — Returns aggregate telemetry, algorithm distribution, and volume trends.
- `GET /api/jobs` — Queries persistent SQLite job audit logs (with search, filter, and pagination).
- `GET /api/jobs/export/csv` — Exports complete job history to downloadable CSV format.
- `GET /api/files/:filename/download` — Downloads compressed or recovered artifacts safely.
- `GET /api/health` — Returns system status and verifies C++ engine availability.
