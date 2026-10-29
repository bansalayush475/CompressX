# CompressX — Universal File Compression System

> **Tagline:** Maximum Compression. Instant Access. Zero Hassle.  
> **Core Capabilities:** Format-Preserving Compression (PDF, Images, Office Docs, Code, Data) + Custom C++17 Algorithmic Engine (Huffman / RLE)  
> **Cloud Backend:** Node.js, Express, Supabase (Cloud Storage & Database), SQLite  
> **Frontend:** React 19, TypeScript, Tailwind CSS, Cyber Obsidian Palette  
> **Repository:** [bansalayush475/CompressX](https://github.com/bansalayush475/CompressX)

---

## 1. System Overview

**CompressX** is a modern, high-performance file compression platform designed for maximum space reduction while retaining immediate file usability.

Unlike traditional archivers that require an explicit decompression step to view files, **CompressX delivers direct format-preserving compression**:
- **Images (PNG, JPG, WebP, GIF, AVIF, TIFF)**: Compress by 50% to 95%+ with adaptive quantization and resolution scaling—retaining the original image extension for direct viewing.
- **PDF Documents**: Convert ASCII85 streams to binary Flate, quantize vector coordinates, strip redundant catalog tables, and downsample embedded images for massive reductions.
- **Office Documents (.docx, .xlsx, .pptx)**: Re-deflate internal XML and recompress embedded media streams.
- **Code & Text (HTML, CSS, JS, JSON, CSV)**: Structural minification, whitespace normalizer, and deduplication.
- **Native C++17 Core Engine**: Full standalone C++17 binary implementing greedy Huffman Coding, Run-Length Encoding (RLE), and `.cpx` container serialization with SHA-256 validation.

---

## 2. Key Features

### 🎚️ Dynamic Compression Level Bar & Fine-Tune Slider
- **Unified Glowing Track**: The slider doubles as the visual progress bar, filling up dynamically with an emerald-to-cyan gradient.
- **Interactive Scale Markers**: Quick-click percentage checkpoints (`15%`, `30%`, `50%`, `70%`, `85%`, `95%`).
- **Direct Type % Input**: Type any exact reduction target between **10%** and **95%** in the numeric input box.
- **Real-Time Size Estimation**: Live preview calculating estimated compressed size (e.g. `128 KB → ~19 KB (-85%)`).
- **5 Progressive Presets**:
  - **Light (-30%)**: Minimal lossless compression, 100% resolution.
  - **Balanced (-50%)**: Standard compression, optimal balance.
  - **High (-70%)**: Web-optimized compression for fast sharing.
  - **Extra Small (-85%)**: High-efficiency compression for maximum space savings.
  - **Maximum (-95%)**: Aggressive compression with ultra-compact palette.

### ☁️ Supabase Cloud & Per-User Storage
- **Isolated User Directories**: Files are uploaded to Supabase Storage (`compressed-files`) partitioned under each user's ID:
  $$\text{Storage Path} = \texttt{\{user\_id\}/\{timestamp\}\_\{filename\}}$$
- **Cloud Database History**: Compression telemetry and direct public download links are recorded in the Supabase `history` table.
- **Ready SQL Configuration**: Standard setup queries provided in `supabase_setup.sql`.

### 🔒 Account Authentication & History Privacy
- **Native User Experience**: Clean, direct Create Account and Sign In flow without external redirects.
- **Strict User Isolation**: Users only view their own compressed files.
- **Clear All History**: One-click history purge removing records from both Supabase and local storage.

---

## 3. System Architecture

```
+-------------------------------------------------------------------------+
|                           CompressX Web UI                              |
|              (React 19 + TypeScript + Tailwind CSS + Lucide)            |
|                                                                         |
|  [Dynamic Level Slider]  [Type % Input]  [File Card]  [User History]    |
+------------------------------------+------------------------------------+
                                     |
                               HTTP REST APIs
                                     |
+------------------------------------v------------------------------------+
|                         Node.js Express Server                          |
|  - Multipart Upload Validation (Multer)                                 |
|  - Progressive Format Compressor (Sharp, PDF-Lib, AdmZip)               |
|  - Supabase Cloud Service (Storage + Database)                          |
|  - Persistent SQLite Fallback (`node:sqlite`)                           |
+------------------+----------------------------------+-------------------+
                   |                                  |
                   v                                  v
+----------------------------------+  +-----------------------------------+
|      Supabase Cloud Platform     |  |    Native C++17 Engine (`.exe`)   |
|  - Storage: `compressed-files/`  |  |  - Huffman Coding (Min-Heap Tree) |
|  - Database: `public.history`    |  |  - Run-Length Encoding (RLE)      |
|  - Per-User Partitioning         |  |  - SHA-256 Container Integrity    |
+----------------------------------+  +-----------------------------------+
```

---

## 4. Setup and Execution

### Prerequisites
- **Node.js** v18+ (tested on Node.js v24.20)
- **MinGW-w64** GCC / Clang with C++17 support (precompiled standalone executables included in `bin/`)

### Quick Start (Production Mode)

1. **Install dependencies:**
   ```powershell
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure environment:**
   Create `.env` or `server/.env` with your Supabase credentials:
   ```env
   SUPABASE_URL=https://pftaapxjnmetzgqyxvwb.supabase.co
   SUPABASE_ANON_KEY=your_publishable_key
   SUPABASE_SECRET_KEY=your_secret_key
   SUPABASE_BUCKET=compressed-files
   PORT=5000
   ```

3. **Build and launch:**
   ```powershell
   npm --prefix client run build
   node server/src/index.js
   ```

4. **Open in browser:**
   ```
   http://localhost:5000
   ```

---

## 5. Automated Test Suite (18/18 Passing)

Run the native C++ QA test runner covering all edge cases:
```powershell
.\bin\test_runner.exe
```

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

## 6. REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/compress` | `POST` | Compresses uploaded files preserving format based on target percentage. |
| `/api/auth/register` | `POST` | Registers a new user account. |
| `/api/auth/login` | `POST` | Authenticates user and returns session token. |
| `/api/jobs` | `GET` | Fetches authenticated user's private compression history. |
| `/api/jobs/clear/all`| `DELETE` | Purges all history records and local artifacts for the user. |
| `/api/jobs/:id` | `DELETE` | Deletes a single history job. |
| `/api/files/:filename/download` | `GET` | Direct local/cloud download endpoint. |
| `/api/health` | `GET` | Health endpoint verifying system and C++ engine status. |

---

## License
MIT License. Developed for universal high-efficiency file compression.
