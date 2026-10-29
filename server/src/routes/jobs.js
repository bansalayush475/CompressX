const express = require('express');
const router = express.Router();
const { listJobs, getJobById, deleteJob } = require('../db/database');
const { verifyToken } = require('./auth');
const supabaseService = require('../services/supabaseService');

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = verifyToken(token);
    const userId = decoded ? decoded.id : (req.query.userId || null);

    // 1. Try Supabase history
    if (supabaseService.isConfigured()) {
      try {
        const sbHistory = await supabaseService.getUserHistory(userId);
        if (sbHistory && sbHistory.length > 0) {
          const mappedJobs = sbHistory.map(h => ({
            id: h.id,
            user_id: h.user_id,
            type: 'compress',
            original_filename: h.filename,
            original_size: Number(h.original_size),
            result_size: Number(h.compressed_size),
            algorithm: h.algorithm || 'Optimized',
            space_saved: Number(h.space_saved),
            space_saved_percentage: Number(h.space_saved_percentage || 0),
            duration_ms: 0,
            status: 'completed',
            artifact_path: h.file_url,
            file_url: h.file_url,
            created_at: h.created_at
          }));
          return res.json({ jobs: mappedJobs, total: mappedJobs.length });
        }
      } catch (sbErr) {
        console.warn('[Supabase History] Read notice:', sbErr.message);
      }
    }

    // 2. Fallback to local SQLite
    const { search, algorithm, status, sortBy, sortOrder, limit, offset } = req.query;
    const data = listJobs({
      userId,
      search,
      algorithm,
      status,
      sortBy,
      sortOrder,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = verifyToken(token);
    const userId = decoded ? decoded.id : null;

    if (supabaseService.isConfigured()) {
      await supabaseService.deleteHistoryRow(req.params.id, userId);
    }

    deleteJob(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
