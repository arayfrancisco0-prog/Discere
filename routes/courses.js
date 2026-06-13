const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, queryValue, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.get('/courses', async (req, res) => {
  const { search, category, level } = req.query;
  let sql = `SELECT c.*, cat.name as category_name, u.name as teacher_name,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count,
    (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.teacher_id = u.id WHERE c.published = 1`;
  const params = [];
  if (search) { sql += ` AND (c.title LIKE ? OR c.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (category) { sql += ` AND cat.slug = ?`; params.push(category); }
  if (level) { sql += ` AND c.level = ?`; params.push(level); }
  sql += ` ORDER BY c.created_at DESC`;
  const courses = queryAll(sql, params);
  res.json(courses);
});

router.get('/courses/:slug', async (req, res) => {
  const course = queryOne(`SELECT c.*, cat.name as category_name, cat.slug as category_slug, u.name as teacher_name, u.avatar_url as teacher_avatar, u.bio as teacher_bio
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.teacher_id = u.id WHERE c.slug = ? AND c.published = 1`, [req.params.slug]);
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

  course.enrollment_count = queryValue('SELECT COUNT(*) FROM enrollments WHERE course_id = ?', [course.id]);

  const modules = queryAll('SELECT * FROM modules WHERE course_id = ? ORDER BY order_num', [course.id]);
  course.modules = modules.map(mod => {
    mod.lessons = queryAll('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_num', [mod.id]);
    mod.lessons = mod.lessons.map(lesson => {
      lesson.exercises = queryAll('SELECT * FROM exercises WHERE lesson_id = ? ORDER BY order_num', [lesson.id]);
      return lesson;
    });
    return mod;
  });

  const rating = queryOne('SELECT AVG(score) as avg_rating, COUNT(*) as rating_count FROM ratings WHERE course_id = ?', [course.id]);
  course.avg_rating = rating ? rating.avg_rating || 0 : 0;
  course.rating_count = rating ? rating.rating_count || 0 : 0;

  course.lesson_count = queryValue('SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?', [course.id]);
  course.exercise_count = queryValue('SELECT COUNT(*) FROM exercises e JOIN lessons l ON e.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?', [course.id]);

  res.json(course);
});

router.get('/courses/teacher/all', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  const courses = queryAll(`SELECT c.*, cat.name as category_name,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.teacher_id = ? ORDER BY c.created_at DESC`, [req.user.id]);
  res.json(courses);
});

router.post('/courses/create', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  const { title, slug, category_id, level, short_description, description } = req.body;
  const id = uuidv4();
  execute('INSERT INTO courses (id, title, slug, category_id, level, short_description, description, teacher_id, published) VALUES (?,?,?,?,?,?,?,?,0)',
    [id, title, slug, category_id, level, short_description || '', description || '', req.user.id]);
  res.json({ id });
});

router.put('/courses/update', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  const { id, title, slug, category_id, level, short_description, description, published } = req.body;
  execute(`UPDATE courses SET title=?, slug=?, category_id=?, level=?, short_description=?, description=?, published=?, updated_at=datetime('now') WHERE id=? AND teacher_id=?`,
    [title, slug, category_id, level, short_description || '', description || '', published ? 1 : 0, id, req.user.id]);
  res.json({ ok: true });
});

router.get('/courses/manage/:courseId', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  const course = queryOne('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [req.params.courseId, req.user.id]);
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

  const modules = queryAll('SELECT * FROM modules WHERE course_id = ? ORDER BY order_num', [course.id]);
  course.modules = modules.map(mod => {
    mod.lessons = queryAll('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_num', [mod.id]);
    mod.lessons = mod.lessons.map(lesson => {
      lesson.exercises = queryAll('SELECT * FROM exercises WHERE lesson_id = ? ORDER BY order_num', [lesson.id]);
      return lesson;
    });
    return mod;
  });

  res.json(course);
});

router.post('/courses/modules', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  const { course_id, title } = req.body;
  const maxOrder = queryValue('SELECT COALESCE(MAX(order_num),0) + 1 FROM modules WHERE course_id = ?', [course_id]);
  const order = maxOrder || 1;
  const id = uuidv4();
  execute('INSERT INTO modules (id, course_id, title, order_num) VALUES (?,?,?,?)', [id, course_id, title, order]);
  res.json({ id, order_num: order });
});

router.delete('/courses/modules/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  execute('DELETE FROM modules WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.post('/courses/lessons', requireAuth, async (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Acesso negado' });
  const { module_id, title, content, video_url, duration } = req.body;
  const maxOrder = queryValue('SELECT COALESCE(MAX(order_num),0) + 1 FROM lessons WHERE module_id = ?', [module_id]);
  const order = maxOrder || 1;
  const id = uuidv4();
  execute('INSERT INTO lessons (id, module_id, title, content, video_url, duration, order_num) VALUES (?,?,?,?,?,?,?)',
    [id, module_id, title, content || '', video_url || '', duration || 0, order]);
  res.json({ id, order_num: order });
});

router.get('/lessons/:lessonId', async (req, res) => {
  const lesson = queryOne(`SELECT l.*, m.title as module_title, m.course_id, c.title as course_title, c.slug as course_slug
    FROM lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id WHERE l.id = ?`, [req.params.lessonId]);
  if (!lesson) return res.status(404).json({ error: 'Aula não encontrada' });
  lesson.exercises = queryAll('SELECT * FROM exercises WHERE lesson_id = ? ORDER BY order_num', [lesson.id]);
  res.json(lesson);
});

module.exports = router;
