const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { compressFileDirect } = require('../services/directCompressor');
const { insertJob } = require('../db/database');
const { verifyToken } = require('./auth');
const supabaseService = require('../services/supabaseService');

const uploadsDir = path.join(__dirname, '..', '..', 'storage', 'uploads');
const outputsDir = path.join(__dirname, '..', '..', 'storage', 'outputs');

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 250 * 1024 * 1024 }
});

router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = verifyToken(token);
    const userId = decoded ? decoded.id : 'guest';

    const percent = req.body.percent !== undefined && req.body.percent !== '' 
      ? Number(req.body.percent) 
      : (req.body.strength || req.body.algorithm || 85);

    const results = [];

    for (const file of req.files) {
      const jobId = crypto.randomUUID();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const downloadFilename = `${baseName}_compressed${ext}`;
      const outputFilename = `${jobId}_compressed${ext}`;
      const outputPath = path.join(outputsDir, outputFilename);

      const startTime = Date.now();

      try {
        const compResult = await compressFileDirect(
          file.path,
          outputPath,
          file.originalname,
          percent
        );

        const durationMs = Date.now() - startTime;

        // 1. Try uploading to Supabase Storage under user_id folder
        let cloudUrl = null;
        if (supabaseService.isConfigured()) {
          cloudUrl = await supabaseService.uploadToStorage(outputPath, downloadFilename, userId);
        }

        const localDownloadUrl = `/api/files/${outputFilename}/download?downloadName=${encodeURIComponent(downloadFilename)}`;
        const finalDownloadUrl = cloudUrl || localDownloadUrl;

        // 2. Save in Supabase History table
        if (supabaseService.isConfigured()) {
          await supabaseService.insertHistoryRow({
            id: jobId,
            user_id: userId,
            original_filename: file.originalname,
            original_size: compResult.originalSize,
            result_size: compResult.compressedSize,
            space_saved: compResult.spaceSaved,
            space_saved_percentage: compResult.spaceSavedPercentage,
            algorithm: compResult.method,
            file_url: finalDownloadUrl,
            created_at: new Date().toISOString()
          });
        }

        // 3. Save in local SQLite
        insertJob({
          id: jobId,
          user_id: userId,
          type: 'compress',
          original_filename: file.originalname,
          original_size: compResult.originalSize,
          result_size: compResult.compressedSize,
          algorithm: compResult.method,
          space_saved: compResult.spaceSaved,
          space_saved_percentage: compResult.spaceSavedPercentage,
          compression_ratio: compResult.compressionRatio,
          duration_ms: durationMs,
          checksum: '',
          verified: 1,
          status: 'completed',
          artifact_path: outputPath,
          created_at: new Date().toISOString()
        });

        results.push({
          id: jobId,
          filename: file.originalname,
          downloadFilename: downloadFilename,
          originalSize: compResult.originalSize,
          compressedSize: compResult.compressedSize,
          spaceSaved: compResult.spaceSaved,
          spaceSavedPercentage: compResult.spaceSavedPercentage,
          compressionRatio: compResult.compressionRatio,
          durationMs: durationMs,
          algorithm: compResult.method,
          downloadUrl: finalDownloadUrl,
          cloudUrl: cloudUrl,
          success: true
        });

      } catch (err) {
        console.error('File compression error:', err);
        results.push({
          id: jobId,
          filename: file.originalname,
          success: false,
          errorMessage: err.message
        });
      } finally {
        if (fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (e) {}
        }
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Compression endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
