const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../db/database');

router.get('/dashboard', (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
