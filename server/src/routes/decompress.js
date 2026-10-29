const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const engineService = require('../services/engineService');
const { insertJob } = require('../db/database');
const { verifyToken } = require('./auth');

const uploadsDir = path.join(__dirname, '..', '..', 'storage', 'uploads');
const outputsDir = path.join(__dirname, '..', '..', 'storage', 'outputs');

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 250 * 1024 * 1024 }
});

router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded for decompression.' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = verifyToken(token);
    const userId = decoded ? decoded.id : 'guest';

    const results = [];

    for (const file of req.files) {
      const jobId = crypto.randomUUID();

      // First inspect container metadata to get original filename
      let headerInfo = null;
      try {
        headerInfo = await engineService.getContainerInfo(file.path);
      } catch (e) {
        // Continue to attempt decompression which will give detailed error
      }

      const origName = (headerInfo && headerInfo.success && headerInfo.originalFilename)
        ? headerInfo.originalFilename
        : 'recovered_file';

      const outputFilename = `${jobId}_${origName}`;
      const outputPath = path.join(outputsDir, outputFilename);

      try {
        const engineResult = await engineService.decompress(file.path, outputPath);

        if (!engineResult.success) {
          insertJob({
            id: jobId,
            user_id: userId,
            type: 'decompress',
            original_filename: file.originalname,
            original_size: file.size,
            result_size: 0,
            algorithm: 'UNKNOWN',
            space_saved: 0,
            space_saved_percentage: 0,
            compression_ratio: 1.0,
            duration_ms: engineResult.durationMs || 0,
            status: 'failed',
            error_message: engineResult.errorMessage || 'Decompression failed',
            created_at: new Date().toISOString()
          });

          results.push({
            id: jobId,
            filename: file.originalname,
            success: false,
            errorMessage: engineResult.errorMessage
          });
          continue;
        }

        insertJob({
          id: jobId,
          user_id: userId,
          type: 'decompress',
          original_filename: engineResult.originalFilename,
          original_size: file.size,
          result_size: engineResult.recoveredSize,
          algorithm: engineResult.algorithm,
          space_saved: 0,
          space_saved_percentage: 0,
          compression_ratio: 1.0,
          duration_ms: engineResult.durationMs,
          checksum: engineResult.recoveredSha256,
          verified: engineResult.checksumVerified ? 1 : 0,
          status: 'completed',
          artifact_path: outputPath,
          created_at: new Date().toISOString()
        });

        results.push({
          id: jobId,
          inputFilename: file.originalname,
          originalFilename: engineResult.originalFilename,
          recoveredSize: engineResult.recoveredSize,
          durationMs: engineResult.durationMs,
          algorithm: engineResult.algorithm,
          recoveredSha256: engineResult.recoveredSha256,
          checksumVerified: engineResult.checksumVerified,
          downloadUrl: `/api/files/${outputFilename}/download?downloadName=${encodeURIComponent(engineResult.originalFilename)}`,
          success: true
        });

      } catch (err) {
        console.error('Decompression error:', err);
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
    console.error('Decompression endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
