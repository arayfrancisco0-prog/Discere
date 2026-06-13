const express = require('express');
const { queryOne, execute } = require('../../db');
const { requireAdmin } = require('./auth');
const router = express.Router();

router.get('/settings', requireAdmin, async (req, res) => {
  const settings = queryOne('SELECT value FROM site_settings WHERE key = ?', ['welcomeVideo']);
  res.json({ welcomeVideo: settings ? settings.value : '' });
});

router.put('/settings', requireAdmin, async (req, res) => {
  const { welcomeVideo } = req.body;
  execute('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?,?)', ['welcomeVideo', welcomeVideo || '']);
  res.json({ ok: true });
});

module.exports = router;
