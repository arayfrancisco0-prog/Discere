const express = require('express');
const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, execute } = require('../db');
const router = express.Router();

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'discere-jwt-secret-2024');
const COOKIE_NAME = 'discere_session';

function getCookies(req) {
  const c = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(kv => {
      const [k, v] = kv.trim().split('=');
      c[k] = v;
    });
  }
  return c;
}

async function createSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch { return null; }
}

async function requireAuth(req, res, next) {
  const cookies = getCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  const payload = await verifySession(token);
  if (!payload) return res.status(401).json({ error: 'Sessão inválida' });
  req.user = payload;
  next();
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Email ou senha inválidos' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Email ou senha inválidos' });

  const token = await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  const userRole = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
  execute('INSERT INTO users (id, name, email, password, role) VALUES (?,?,?,?,?)', [id, name, email, hashed, userRole]);
  if (userRole === 'STUDENT') {
    execute('INSERT INTO student_profiles (id, user_id) VALUES (?,?)', [uuidv4(), id]);
  } else {
    execute('INSERT INTO teachers (id, user_id) VALUES (?,?)', [uuidv4(), id]);
  }

  const token = await createSession({ id, email, name, role: userRole });
  res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
  res.json({ user: { id, name, email, role: userRole } });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = queryOne('SELECT id, name, email, role, avatar_url, bio, created_at, welcome_video_watched FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.json({ user: null });

  if (user.role === 'STUDENT') {
    const sp = queryOne('SELECT total_points, ranking FROM student_profiles WHERE user_id = ?', [user.id]);
    if (sp) user.studentProfile = { totalPoints: sp.total_points, ranking: sp.ranking };
  }
  res.json({ user });
});

module.exports = router;
module.exports.requireAuth = requireAuth;
