const express = require('express');
const { queryOne, queryValue, queryAll } = require('../../db');
const { requireAdmin } = require('./auth');
const router = express.Router();

router.get('/stats', requireAdmin, async (req, res) => {
  const stats = {
    total_users: queryValue('SELECT COUNT(*) FROM users') || 0,
    total_students: queryValue('SELECT COUNT(*) FROM users WHERE role = ?', ['STUDENT']) || 0,
    total_teachers: queryValue('SELECT COUNT(*) FROM users WHERE role = ?', ['TEACHER']) || 0,
    total_courses: queryValue('SELECT COUNT(*) FROM courses') || 0,
    published_courses: queryValue('SELECT COUNT(*) FROM courses WHERE published = 1') || 0,
    total_enrollments: queryValue('SELECT COUNT(*) FROM enrollments') || 0,
    total_categories: queryValue('SELECT COUNT(*) FROM categories') || 0,
    total_certificates: queryValue('SELECT COUNT(*) FROM certificates') || 0,
  };

  const recent_users = queryAll('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
  const recent_courses = queryAll('SELECT c.id, c.title, c.created_at, u.name as teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id ORDER BY c.created_at DESC LIMIT 5');

  res.json({ ...stats, recent_users, recent_courses });
});

module.exports = router;
