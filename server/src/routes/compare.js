const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const engineService = require('../services/engineService');

const uploadsDir = path.join(__dirname, '..', '..', 'storage', 'uploads');
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 100 * 1024 * 1024 }
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided for comparison.' });
  }

  try {
    const report = await engineService.compare(req.file.path);
    if (!report.success) {
      return res.status(400).json({ error: report.errorMessage || 'Comparison failed' });
    }
    report.originalFilename = req.file.originalname;
    res.json(report);
  } catch (err) {
    console.error('Compare route error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
});

module.exports = router;
