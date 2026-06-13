const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('./auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedVideo = /\.(mp4|webm|ogg)$/i;
    const allowedImage = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowedVideo.test(file.originalname) || allowedImage.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado'));
    }
  }
});

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
