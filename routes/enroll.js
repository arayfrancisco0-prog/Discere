const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.post('/enroll', requireAuth, async (req, res) => {
  const { course_id } = req.body;
  const existing = queryOne('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [req.user.id, course_id]);
  if (existing) return res.status(400).json({ error: 'Já matriculado' });
  const id = uuidv4();
  execute('INSERT INTO enrollments (id, user_id, course_id) VALUES (?,?,?)', [id, req.user.id, course_id]);
  execute('INSERT INTO activities (id, user_id, type, description) VALUES (?,?,?,?)', [uuidv4(), req.user.id, 'enrollment', 'Matriculou-se em um curso']);

  // Check first-course badge
  const badge = queryOne('SELECT id FROM badges WHERE slug = ?', ['first-course']);
  if (badge) {
    const has = queryOne('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?', [req.user.id, badge.id]);
    if (!has) {
      execute('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?,?,?)', [uuidv4(), req.user.id, badge.id]);
    }
  }

  res.json({ id });
});

router.get('/enrollments', requireAuth, async (req, res) => {
  const enrollments = queryAll(`SELECT e.*, c.title as course_title, c.slug as course_slug, c.short_description,
    c.level, cat.name as category_name
    FROM enrollments e JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`, [req.user.id]);
  res.json(enrollments);
});

module.exports = router;
