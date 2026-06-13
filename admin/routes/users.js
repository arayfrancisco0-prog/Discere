const express = require('express');
const { queryAll, queryOne, execute } = require('../../db');
const { requireAdmin } = require('./auth');
const router = express.Router();

router.get('/users', requireAdmin, async (req, res) => {
  const users = queryAll('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  const user = queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.id === req.admin.id) return res.status(400).json({ error: 'Não pode excluir a si mesmo' });
  execute('DELETE FROM users WHERE id = ?', [user.id]);
  res.json({ ok: true });
});

module.exports = router;
