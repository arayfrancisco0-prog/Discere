const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, execute } = require('../../db');
const { requireAdmin } = require('./auth');
const router = express.Router();

router.get('/admin-categories', requireAdmin, async (req, res) => {
  const cats = queryAll(`SELECT cat.*, (SELECT COUNT(*) FROM courses WHERE category_id = cat.id) as course_count FROM categories cat ORDER BY cat.name`);
  res.json(cats);
});

router.post('/admin-categories', requireAdmin, async (req, res) => {
  const { name, slug } = req.body;
  const existing = queryOne('SELECT id FROM categories WHERE slug = ? OR name = ?', [slug, name]);
  if (existing) return res.status(400).json({ error: 'Categoria já existe' });
  execute('INSERT INTO categories (id, name, slug) VALUES (?,?,?)', [uuidv4(), name, slug]);
  res.json({ ok: true });
});

router.delete('/admin-categories/:id', requireAdmin, async (req, res) => {
  const count = queryOne('SELECT COUNT(*) as c FROM courses WHERE category_id = ?', [req.params.id]);
  if (count && count.c > 0) return res.status(400).json({ error: 'Categoria possui cursos vinculados' });
  execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
