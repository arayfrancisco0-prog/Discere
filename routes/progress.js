const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryValue, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

router.put('/progress', requireAuth, async (req, res) => {
  const { lesson_id, course_id } = req.body;

  const existing = queryOne('SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [req.user.id, lesson_id]);
  if (!existing) {
    execute('INSERT INTO lesson_progress (id, user_id, lesson_id, completed) VALUES (?,?,?,1)', [uuidv4(), req.user.id, lesson_id]);
  }

  const totalLessons = queryValue('SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?', [course_id]);
  const completedLessons = queryValue(`SELECT COUNT(*) FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = ? AND lp.user_id = ? AND lp.completed = 1`, [course_id, req.user.id]);

  const total = totalLessons || 0;
  const completed = completedLessons || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (progress >= 100) {
    execute('UPDATE enrollments SET progress = ?, completed = 1, completed_at = datetime(\'now\') WHERE user_id = ? AND course_id = ?',
      [progress, req.user.id, course_id]);

    const cert = queryOne('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?', [req.user.id, course_id]);
    if (!cert) {
      const certId = uuidv4();
      const code = `DSC-${course_id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      execute('INSERT INTO certificates (id, user_id, course_id, code) VALUES (?,?,?,?)', [certId, req.user.id, course_id, code]);
      const courseTitle = queryValue('SELECT title FROM courses WHERE id = ?', [course_id]);
      execute('INSERT INTO notifications (id, user_id, type, title, message) VALUES (?,?,?,?,?)',
        [uuidv4(), req.user.id, 'success', 'Curso Concluído!', `Parabéns! Você concluiu "${courseTitle}". Seu certificado já está disponível.`]);
      execute('INSERT INTO activities (id, user_id, type, description) VALUES (?,?,?,?)',
        [uuidv4(), req.user.id, 'course_completed', `Completou o curso "${courseTitle}"`]);

      // Award course completed badge
      const badge = queryOne('SELECT id FROM badges WHERE slug = ?', ['course-completed']);
      if (badge) {
        const has = queryOne('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?', [req.user.id, badge.id]);
        if (!has) {
          execute('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?,?,?)', [uuidv4(), req.user.id, badge.id]);
        }
      }
    }
  } else {
    execute('UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?', [progress, req.user.id, course_id]);
  }

  res.json({ progress, completed: progress >= 100 });
});

module.exports = router;
