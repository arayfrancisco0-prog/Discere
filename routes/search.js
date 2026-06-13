const express = require('express');
const { queryAll } = require('../db');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const courses = queryAll(`SELECT c.*, cat.name as category_name, u.name as teacher_name,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE c.published = 1 AND (c.title LIKE ? OR c.description LIKE ? OR cat.name LIKE ?)
    ORDER BY c.created_at DESC LIMIT 20`,
    [`%${q}%`, `%${q}%`, `%${q}%`]);
  res.json(courses);
});

module.exports = router;
