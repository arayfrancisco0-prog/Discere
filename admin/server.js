const express = require('express');
const path = require('path');
const cors = require('cors');
const { getDb, saveDb } = require('../db');
const { createSchema } = require('../schema');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auto-save database after mutations
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (req.method !== 'GET') {
      try { saveDb(); } catch (e) { console.error('Save error:', e); }
    }
    return originalJson(body);
  };
  next();
});

// Admin routes
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const categoriesRoutes = require('./routes/categories');
const badgesRoutes = require('./routes/badges');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api', statsRoutes);
app.use('/api', usersRoutes);
app.use('/api', coursesRoutes);
app.use('/api', categoriesRoutes);
app.use('/api', badgesRoutes);
app.use('/api', settingsRoutes);

// SPA fallback - serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  const db = await getDb();
  await createSchema(db);
  saveDb();
  app.listen(PORT, () => {
    console.log(`Admin panel running at http://localhost:${PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
