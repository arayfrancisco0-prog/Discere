const express = require('express');
const path = require('path');
const cors = require('cors');
const { getDb, saveDb } = require('../db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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

const authRoutes = require('../routes/auth');
const courseRoutes = require('../routes/courses');
const categoryRoutes = require('../routes/categories');
const enrollRoutes = require('../routes/enroll');
const progressRoutes = require('../routes/progress');
const exerciseRoutes = require('../routes/exercises');
const badgeRoutes = require('../routes/badges');
const notificationRoutes = require('../routes/notifications');
const certificateRoutes = require('../routes/certificates');
const ratingRoutes = require('../routes/ratings');
const uploadRoutes = require('../routes/upload');
const searchRoutes = require('../routes/search');
const userRoutes = require('../routes/users');

app.use('/api/auth', authRoutes);
app.use('/api', courseRoutes);
app.use('/api', categoryRoutes);
app.use('/api', enrollRoutes);
app.use('/api', progressRoutes);
app.use('/api', exerciseRoutes);
app.use('/api', badgeRoutes);
app.use('/api', notificationRoutes);
app.use('/api', certificateRoutes);
app.use('/api', ratingRoutes);
app.use('/api', uploadRoutes);
app.use('/api', searchRoutes);
app.use('/api', userRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize DB at cold start
getDb().catch(err => console.error('DB init error:', err));

module.exports = app;
