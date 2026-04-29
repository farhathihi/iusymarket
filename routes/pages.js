const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');

// Landing page
router.get('/', (req, res) => {
  const db = getDb();
  const featuredProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 6').all();
  res.render('index', { title: 'iusymarket - Premium Nike Tech Fleece', products: featuredProducts });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', { title: 'About - iusymarket' });
});

// Help page
router.get('/help', (req, res) => {
  res.render('help', { title: 'Help - iusymarket' });
});

module.exports = router;
