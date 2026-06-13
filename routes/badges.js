const express = require('express');
const { queryAll } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.get('/badges', requireAuth, async (req, res) => {
  const badges = queryAll(`SELECT b.*, ub.earned_at FROM badges b LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ? ORDER BY b.name`, [req.user.id]);
  res.json(badges);
});

router.get('/badges/all', async (req, res) => {
  const badges = queryAll(`SELECT b.*, (SELECT COUNT(*) FROM user_badges WHERE badge_id = b.id) as user_count FROM badges b ORDER BY b.name`);
  res.json(badges);
});

module.exports = router;
