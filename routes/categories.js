const express = require('express');
const { queryAll } = require('../db');
const router = express.Router();

router.get('/categories', async (req, res) => {
  const cats = queryAll(`SELECT cat.*, (SELECT COUNT(*) FROM courses WHERE category_id = cat.id) as course_count FROM categories cat ORDER BY cat.name`);
  res.json(cats);
});

module.exports = router;
