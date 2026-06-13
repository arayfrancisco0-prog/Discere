const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.post('/certificates', requireAuth, async (req, res) => {
  const { course_id } = req.body;
  const existing = queryOne('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?', [req.user.id, course_id]);
  if (existing) return res.json(existing);

  const certId = uuidv4();
  const code = `DSC-${course_id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  execute('INSERT INTO certificates (id, user_id, course_id, code) VALUES (?,?,?,?)', [certId, req.user.id, course_id, code]);
  res.json({ id: certId, code });
});

router.get('/certificates', requireAuth, async (req, res) => {
  const certs = queryAll(`SELECT cert.*, c.title as course_title, c.slug as course_slug FROM certificates cert JOIN courses c ON cert.course_id = c.id WHERE cert.user_id = ? ORDER BY cert.issued_at DESC`, [req.user.id]);
  res.json(certs);
});

module.exports = router;
