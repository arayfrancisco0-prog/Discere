const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryValue, execute } = require('../db');
const { requireAuth } = require('./auth');
const router = express.Router();

function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[a.length][b.length];
}

function similarityScore(studentCode, solutionCode) {
  const s = studentCode.replace(/\s+/g, ' ').trim();
  const sol = solutionCode.replace(/\s+/g, ' ').trim();
  if (s === sol) return 1;
  const dist = levenshteinDistance(s, sol);
  return Math.max(0, 1 - dist / Math.max(s.length, sol.length));
}

router.post('/exercises/evaluate', requireAuth, async (req, res) => {
  const { exercise_id, code } = req.body;

  const exercise = queryOne('SELECT * FROM exercises WHERE id = ?', [exercise_id]);
  if (!exercise) return res.status(404).json({ error: 'Exercício não encontrado' });

  const similarity = similarityScore(code, exercise.solution_code);
  let passed = 0;
  let score = 0;

  if (similarity >= 0.8) {
    passed = 1;
    score = exercise.points;
  } else if (similarity >= 0.5) {
    score = Math.round(exercise.points * 0.5);
  }

  execute('INSERT INTO exercise_results (id, user_id, exercise_id, score, passed, code) VALUES (?,?,?,?,?,?)',
    [uuidv4(), req.user.id, exercise_id, score, passed, code]);

  if (passed) {
    const sp = queryOne('SELECT id FROM student_profiles WHERE user_id = ?', [req.user.id]);
    if (sp) {
      execute('UPDATE student_profiles SET total_points = total_points + ? WHERE user_id = ?', [score, req.user.id]);
    }

    // Check for exercise badges
    const count = queryValue('SELECT COUNT(*) FROM exercise_results WHERE user_id = ? AND passed = 1', [req.user.id]);
    if (count === 1) {
      const badge = queryOne('SELECT id FROM badges WHERE slug = ?', ['first-exercise']);
      if (badge) {
        const has = queryOne('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?', [req.user.id, badge.id]);
        if (!has) execute('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?,?,?)', [uuidv4(), req.user.id, badge.id]);
      }
    }
    if (count >= 10) {
      const badge = queryOne('SELECT id FROM badges WHERE slug = ?', ['ten-exercises']);
      if (badge) {
        const has = queryOne('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?', [req.user.id, badge.id]);
        if (!has) execute('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?,?,?)', [uuidv4(), req.user.id, badge.id]);
      }
    }
  }

  res.json({ passed: !!passed, score, similarity: Math.round(similarity * 100) / 100 });
});

module.exports = router;
