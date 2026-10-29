const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const engineService = require('../services/engineService');

const uploadsDir = path.join(__dirname, '..', '..', 'storage', 'uploads');
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    let result;
    if (req.file) {
      result = await engineService.visualize({ inputPath: req.file.path });
    } else if (req.body && req.body.text) {
      result = await engineService.visualize({ rawText: req.body.text });
    } else {
      return res.status(400).json({ error: 'Please upload a file or supply text for visualization.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Visualize route error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
});

module.exports = router;
