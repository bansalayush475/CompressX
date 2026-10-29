const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const outputsDir = path.resolve(__dirname, '..', '..', 'storage', 'outputs');

router.get('/:filename/download', (req, res) => {
  // Prevent path traversal
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(outputsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Requested file was not found or has expired.' });
  }

  const downloadName = req.query.downloadName || safeFilename;
  res.download(filePath, downloadName, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Download failed.' });
    }
  });
});

module.exports = router;
