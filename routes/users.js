const express = require('express');
const { execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.put('/users/profile', requireAuth, async (req, res) => {
  const { name, bio } = req.body;
  execute('UPDATE users SET name = ?, bio = ? WHERE id = ?', [name, bio || '', req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
