const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure storage directories exist
const storageDirs = [
  path.join(__dirname, '..', 'storage', 'uploads'),
  path.join(__dirname, '..', 'storage', 'outputs'),
  path.join(__dirname, '..', 'storage', 'temp')
];
for (const dir of storageDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  const enginePath = path.resolve(__dirname, '..', '..', 'bin', 'compressx.exe');
  const engineAvailable = fs.existsSync(enginePath);
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    engineAvailable,
    enginePath
  });
});

// Mount Routes
app.use('/api/supabase', require('./routes/supabaseConfig'));
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/compress', require('./routes/compress'));
app.use('/api/decompress', require('./routes/decompress'));
app.use('/api/compare', require('./routes/compare'));
app.use('/api/visualize', require('./routes/visualize'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/files', require('./routes/files'));

// Serve static frontend build if it exists
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[CompressX Backend] Listening on http://localhost:${PORT}`);
  console.log(`[CompressX Engine] Verified at: ${path.resolve(__dirname, '..', '..', 'bin', 'compressx.exe')}`);
});
