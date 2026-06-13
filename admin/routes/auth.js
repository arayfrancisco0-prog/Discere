const express = require('express');
const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');
const { queryOne, execute } = require('../../db');
const router = express.Router();

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'discere-admin-secret-2024');
const COOKIE_NAME = 'discere_admin_session';

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
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch { return null; }
}

async function requireAdmin(req, res, next) {
  const cookies = getCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  const payload = await verifySession(token);
  if (!payload) return res.status(401).json({ error: 'Sessão inválida' });
  if (payload.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  req.admin = payload;
  next();
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = queryOne('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'ADMIN']);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: 2 * 60 * 60 * 1000, path: '/' });
  res.json({ admin: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/check', requireAdmin, async (req, res) => {
  const user = queryOne('SELECT id, name, email, role FROM users WHERE id = ?', [req.admin.id]);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  res.json({ admin: user });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
