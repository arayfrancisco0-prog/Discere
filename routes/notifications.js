const express = require('express');
const { queryAll, queryValue, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.get('/notifications', requireAuth, async (req, res) => {
  const notifications = queryAll('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
  const unread = queryValue('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read = 0', [req.user.id]);
  res.json({ notifications, unread_count: unread || 0 });
});

router.post('/notifications/read', requireAuth, async (req, res) => {
  const { id } = req.body;
  if (id) {
    execute('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
  } else {
    execute('UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user.id]);
  }
  res.json({ ok: true });
});

module.exports = router;
