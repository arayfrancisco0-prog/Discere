const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.post('/ratings', requireAuth, async (req, res) => {
  const { course_id, score, comment } = req.body;
  const existing = queryOne('SELECT id FROM ratings WHERE user_id = ? AND course_id = ?', [req.user.id, course_id]);
  if (existing) {
    execute('UPDATE ratings SET score = ?, comment = ? WHERE user_id = ? AND course_id = ?', [score, comment || '', req.user.id, course_id]);
  } else {
    execute('INSERT INTO ratings (id, user_id, course_id, score, comment) VALUES (?,?,?,?,?)', [uuidv4(), req.user.id, course_id, score, comment || '']);
  }
  res.json({ ok: true });
});

module.exports = router;
