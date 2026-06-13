const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, execute } = require('../../db');
const { requireAdmin } = require('./auth');
const router = express.Router();

router.get('/admin-badges', requireAdmin, async (req, res) => {
  const badges = queryAll(`SELECT b.*, (SELECT COUNT(*) FROM user_badges WHERE badge_id = b.id) as user_count FROM badges b ORDER BY b.name`);
  res.json(badges);
});

router.post('/admin-badges', requireAdmin, async (req, res) => {
  const { name, slug, description } = req.body;
  const existing = queryOne('SELECT id FROM badges WHERE slug = ?', [slug]);
  if (existing) return res.status(400).json({ error: 'Badge já existe' });
  execute('INSERT INTO badges (id, name, slug, description) VALUES (?,?,?,?)', [uuidv4(), name, slug, description || '']);
  res.json({ ok: true });
});

module.exports = router;
