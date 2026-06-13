const express = require('express');
const { queryAll, execute } = require('../../db');
const { requireAdmin } = require('./auth');
const router = express.Router();

router.get('/admin-courses', requireAdmin, async (req, res) => {
  const courses = queryAll(`SELECT c.*, cat.name as category_name, u.name as teacher_name,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.teacher_id = u.id ORDER BY c.created_at DESC`);
  res.json(courses);
});

router.delete('/admin-courses/:id', requireAdmin, async (req, res) => {
  execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
