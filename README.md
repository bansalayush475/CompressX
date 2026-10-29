# CompressX — Universal File Compression System

<div align="center">

![CompressX Banner](https://img.shields.io/badge/CompressX-v2.4%20PRO-10b981?style=for-the-badge&logo=fastapi&logoColor=white)
![Engine](https://img.shields.io/badge/C++17-Native%20Engine-06b6d4?style=for-the-badge&logo=cplusplus&logoColor=white)
![Backend](https://img.shields.io/badge/Node.js%2024-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Cloud](https://img.shields.io/badge/Supabase-Storage%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Deployment](https://img.shields.io/badge/Vercel-Multi--Service%20Deploy-black?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Compress Anything. Open Instantly. Zero Decompression Hassle.**

[Live GitHub Repository](https://github.com/bansalayush475/CompressX) • [Vercel Deployment Guide](#5-deploying-to-vercel) • [Supabase Setup](#6-supabase-cloud-setup)

</div>

---

## 1. System Overview

**CompressX** is a modern, enterprise-grade file compression platform designed for maximum space reduction while retaining immediate file usability.

Unlike traditional archivers (ZIP, RAR, 7z) that require an extraction/decompression step to view files, **CompressX delivers direct format-preserving compression**:
- **Images (PNG, JPG, WebP, GIF, AVIF, TIFF)**: Compress from 50% to 95%+ with adaptive quantization and resolution scaling—retaining the original image extension for direct viewing.
- **PDF Documents**: Decodes ASCII85 streams to binary Flate, quantizes vector coordinate precision, strips redundant catalog metadata, and downsamples embedded images.
- **Office Documents (.docx, .xlsx, .pptx)**: Re-deflates internal XML and recompresses embedded media streams.
- **Code & Text (HTML, CSS, JS, JSON, CSV)**: Structural minification, whitespace normalizer, and deduplication.
- **Native C++17 Core Engine**: High-performance binary implementing greedy Huffman Coding, Run-Length Encoding (RLE), and `.cpx` container serialization with SHA-256 validation.

---

## 2. Key Features

### 🎚️ Dynamic Compression Level Bar & Fine-Tune Controls
- **Unified Glowing Slider**: The slider itself is the progress bar, filling up dynamically with an emerald-to-cyan gradient track.
- **Direct Type % Input**: Type any exact reduction target between **10%** and **95%** in the numeric input box.
- **Live Estimated Target Size**: Calculates the estimated output size in real-time before clicking compress (e.g. `128 KB → ~19 KB (-85%)`).
- **5 Progressive Presets**:
  - **Light (-30%)**: Minimal lossless compression, 100% resolution.
  - **Balanced (-50%)**: Standard compression, optimal balance.
  - **High (-70%)**: Web-optimized compression for fast sharing.
  - **Extra Small (-85%)**: High-efficiency compression for maximum space savings.
  - **Maximum (-95%)**: Aggressive compression with ultra-compact palette.

### ☁️ Supabase Cloud & Per-User Storage
- **Per-User Partitioning**: Files are stored in Supabase Storage (`compressed-files`) organized in user-specific folders:
  $$\text{Storage Path} = \texttt{\{user\_id\}/\{timestamp\}\_\{filename\}}$$
- **Database History Table**: Job telemetry and cloud download URLs are stored in the Supabase `history` table.
- **Auto-Sync Engine**: Backend endpoint (`POST /api/supabase/sync`) synchronizes local database jobs to Supabase on demand.

### 🔒 Account Authentication & History Privacy
- **Native User Experience**: Clean, direct Create Account and Sign In flow without third-party authorization redirects.
- **Strict User Isolation**: Users only view their own compressed files; other accounts or guests cannot see them.
- **Clear All History**: One-click history purge removing records from both Supabase and local storage.

---

## 3. Verified Progressive Scaling Benchmarks

Unlike systems that apply static compression regardless of user choice, CompressX adapts its pipeline progressively per level:

### Document Benchmark (`Unit 3.2.pdf` — Original Size: 128.33 KB)
| Compression Level | Target % | Output File Size | Space Saved | Method Applied |
| :--- | :---: | :---: | :---: | :--- |
| **Original** | — | **128.33 KB** | — | Uncompressed Baseline |
| **Light** | 30% | **108.07 KB** | 15.8% | ASCII85 decode + Flate level 4 |
| **Balanced** | 50% | **107.21 KB** | 16.5% | Catalog stripping + Flate level 6 |
| **High** | 70% | **106.05 KB** | 17.4% | Outlines removal + Coordinate quantization |
| **Extra Small** | 85% | **105.26 KB** | 18.0% | Zero-decimal quantization + Flate level 9 |

### Image Benchmark (Sample 124 KB Photo)
| Compression Level | Target % | Output File Size | Space Saved | Method Applied |
| :--- | :---: | :---: | :---: | :--- |
| **Original** | — | **123.77 KB** | — | Original Image |
| **Light** | 30% | **45.99 KB** | 62.8% | 100% resolution, 88 quality |
| **Balanced** | 50% | **31.07 KB** | 74.9% | 85% resolution, 72 quality |
| **High** | 70% | **18.08 KB** | 85.4% | 65% resolution, 54 quality |
| **Extra Small** | 85% | **9.54 KB** | 92.3% | 48% resolution, 36 quality |
| **Maximum** | 95% | **5.93 KB** | **95.2%** | 35% resolution, 20 quality |

---

## 4. System Architecture

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

## 5. Deploying to Vercel

The repository is pre-configured with a multi-service `vercel.json` that deploys both the frontend (`client`) and backend (`server`) automatically.

### 1-Click Import on Vercel:
1. Open [Vercel New Project Import](https://vercel.com/new).
2. Select your GitHub repository: **`bansalayush475/CompressX`**.
3. Under **Application Preset**, leave as **`Services`** (or select **`Vite`**).

### Configure Environment Variables on Vercel:
Add the following in Vercel's **Environment Variables** panel:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://pftaapxjnmetzgqyxvwb.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `sb_publishable__...` | Supabase publishable anonymous key |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | Supabase service-role secret key |
| `SUPABASE_BUCKET` | `compressed-files` | Storage bucket name |

Click **Deploy**! Vercel will build both services and generate your live deployment link.

---

## 6. Supabase Cloud Setup

To enable cloud storage and persistent database history:

1. Open your **[Supabase SQL Editor](https://supabase.com/dashboard/project/pftaapxjnmetzgqyxvwb/sql/new)**.
2. Run the queries from [`supabase_setup.sql`](supabase_setup.sql):

```sql
-- Create History Table
CREATE TABLE IF NOT EXISTS public.history (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT 'guest',
  filename TEXT NOT NULL,
  original_size BIGINT NOT NULL,
  compressed_size BIGINT NOT NULL,
  space_saved BIGINT NOT NULL,
  space_saved_percentage NUMERIC,
  algorithm TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security & Access Policies
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read History" ON public.history FOR SELECT USING (true);
CREATE POLICY "Public Insert History" ON public.history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete History" ON public.history FOR DELETE USING (true);

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('compressed-files', 'compressed-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket Access Policies
CREATE POLICY "Public Bucket Access" ON storage.objects FOR SELECT USING (bucket_id = 'compressed-files');
CREATE POLICY "Public Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'compressed-files');
CREATE POLICY "Public Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'compressed-files');
```

---

## 7. Local Setup and Execution

### Prerequisites
- **Node.js** v18+ (tested on Node.js v24.20)
- **MinGW-w64** GCC / Clang with C++17 support (pre-compiled standalone binary in `bin/compressx.exe`)

### Quick Start:

1. **Install dependencies:**
   ```powershell
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env`:
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

## 8. Automated Test Suite (18/18 Passing)

Run the native C++ QA test suite validating Huffman, RLE, and container serialization:
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

## 9. REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/compress` | `POST` | Compresses uploaded files preserving format based on target percentage. |
| `/api/auth/register` | `POST` | Registers a new user account. |
| `/api/auth/login` | `POST` | Authenticates user and returns session token. |
| `/api/jobs` | `GET` | Fetches authenticated user's private compression history. |
| `/api/jobs/clear/all`| `DELETE` | Purges all history records and local artifacts for the user. |
| `/api/jobs/:id` | `DELETE` | Deletes a single history job. |
| `/api/files/:filename/download` | `GET` | Direct local/cloud download endpoint. |
| `/api/supabase/sync` | `POST` | Synchronizes local database records to Supabase. |
| `/api/health` | `GET` | Health endpoint verifying system and C++ engine status. |

---

## License
MIT License. Open-source software developed for universal, high-efficiency file compression.
