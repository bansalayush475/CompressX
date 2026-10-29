const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');

router.get('/config', (req, res) => {
  res.json(supabaseService.getConfig());
});

router.post('/config', (req, res) => {
  const { url, anonKey, bucket } = req.body;
  if (!url || !anonKey) {
    return res.status(400).json({ error: 'Supabase URL and Anon Key are required.' });
  }

  try {
    const config = supabaseService.updateConfig(url, anonKey, bucket);
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sql', (req, res) => {
  const sql = `
-- CompressX Supabase Setup Script

-- 1. Create History Table
CREATE TABLE IF NOT EXISTS history (
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

-- 2. Open Access Policy for History Table
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Access" ON history FOR ALL USING (true) WITH CHECK (true);

-- 3. Storage Setup Note:
-- Create a public Storage bucket named "compressed-files" in your Supabase dashboard:
-- Storage -> New Bucket -> Name: "compressed-files" -> Toggle "Public bucket" ON.
  `.trim();

  res.type('text/plain').send(sql);
});

module.exports = router;
