const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');

// Product listing
router.get('/', (req, res) => {
  const db = getDb();
  const { search, category } = req.query;

  let query = 'SELECT * FROM products';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR description LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const products = db.prepare(query).all(...params);
  res.render('products/index', { title: 'Products - iusymarket', products, search: search || '' });
});

// Product detail
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  if (!product) {
    req.flash('error', 'Product not found');
    return res.redirect('/products');
  }

  const sizes = db.prepare('SELECT * FROM product_sizes WHERE product_id = ? ORDER BY size').all(product.id);
  const defects = db.prepare('SELECT * FROM product_defects WHERE product_id = ?').all(product.id);
  const gallery = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(product.id);

  res.render('products/detail', {
    title: `${product.name} - iusymarket`,
    product,
    sizes,
    defects,
    gallery
  });
});

module.exports = router;
