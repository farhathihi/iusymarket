const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/init');
const { isAdmin } = require('../middleware/auth');

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Admin dashboard
router.get('/', isAdmin, (req, res) => {
  const db = getDb();
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
  const recentProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 5').all();
  const recentUsers = db.prepare("SELECT * FROM users WHERE role = 'user' ORDER BY created_at DESC LIMIT 5").all();

  // Chart data: products added per month (last 6 months)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const count = db.prepare(
      "SELECT COUNT(*) as count FROM products WHERE strftime('%Y-%m', created_at) = ?"
    ).get(`${year}-${monthStr}`).count;
    chartData.push({ label: months[d.getMonth()], value: count });
  }

  // Chart data: users registered per month (last 6 months)
  const userChartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const count = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user' AND strftime('%Y-%m', created_at) = ?"
    ).get(`${year}-${monthStr}`).count;
    userChartData.push({ label: months[d.getMonth()], value: count });
  }

  res.render('admin/dashboard', {
    title: 'Dashboard - iusymarket Admin',
    totalProducts,
    totalUsers,
    recentProducts,
    recentUsers,
    chartData: JSON.stringify(chartData),
    userChartData: JSON.stringify(userChartData)
  });
});

// Product management
router.get('/products', isAdmin, (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.render('admin/products', { title: 'Manage Products - Admin', products });
});

// Add product form
router.get('/products/add', isAdmin, (req, res) => {
  res.render('admin/product-form', { title: 'Add Product - Admin', product: null, sizes: [], defects: [], gallery: [] });
});

// Process add product (multi-image)
router.post('/products/add', isAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 5 }]), (req, res) => {
  const { name, description, price, category, condition_status, sizes, defects } = req.body;
  const db = getDb();

  try {
    const image = req.files['image'] && req.files['image'][0] ? req.files['image'][0].filename : null;

    const result = db.prepare(
      'INSERT INTO products (name, description, price, image, category, condition_status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description, parseInt(price), image, category || 'Nike Tech Fleece', condition_status || 'New');

    const productId = result.lastInsertRowid;

    // Insert gallery images
    if (req.files['gallery']) {
      const insertImg = db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)');
      req.files['gallery'].forEach((f, i) => insertImg.run(productId, f.filename, i));
    }

    // Insert sizes
    if (sizes) {
      const sizeArr = Array.isArray(sizes) ? sizes : [sizes];
      const insertSize = db.prepare('INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)');
      sizeArr.forEach(s => {
        if (s.trim()) insertSize.run(productId, s.trim(), 1);
      });
    }

    // Insert defects
    if (defects) {
      const defectArr = Array.isArray(defects) ? defects : [defects];
      const insertDefect = db.prepare('INSERT INTO product_defects (product_id, description) VALUES (?, ?)');
      defectArr.forEach(d => {
        if (d.trim()) insertDefect.run(productId, d.trim());
      });
    }

    req.flash('success', 'Product added successfully!');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add product');
    res.redirect('/admin/products/add');
  }
});

// Edit product form
router.get('/products/edit/:id', isAdmin, (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  if (!product) {
    req.flash('error', 'Product not found');
    return res.redirect('/admin/products');
  }

  const sizes = db.prepare('SELECT * FROM product_sizes WHERE product_id = ?').all(product.id);
  const defects = db.prepare('SELECT * FROM product_defects WHERE product_id = ?').all(product.id);
  const gallery = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(product.id);

  res.render('admin/product-form', { title: 'Edit Product - Admin', product, sizes, defects, gallery });
});

// Process edit product (multi-image)
router.post('/products/edit/:id', isAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 5 }]), (req, res) => {
  const { name, description, price, category, condition_status, sizes, defects } = req.body;
  const db = getDb();
  const productId = req.params.id;

  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    let image = existing.image;
    if (req.files['image'] && req.files['image'][0]) {
      // Delete old image
      if (existing.image) {
        const oldPath = path.join(__dirname, '..', 'public', 'uploads', existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = req.files['image'][0].filename;
    }

    // Add new gallery images
    if (req.files['gallery']) {
      const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM product_images WHERE product_id = ?').get(productId);
      let startOrder = (maxOrder && maxOrder.m !== null) ? maxOrder.m + 1 : 0;
      const insertImg = db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)');
      req.files['gallery'].forEach((f, i) => insertImg.run(productId, f.filename, startOrder + i));
    }

    db.prepare(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, condition_status = ? WHERE id = ?'
    ).run(name, description, parseInt(price), image, category || 'Nike Tech Fleece', condition_status || 'New', productId);

    // Update sizes - delete old and insert new
    db.prepare('DELETE FROM product_sizes WHERE product_id = ?').run(productId);
    if (sizes) {
      const sizeArr = Array.isArray(sizes) ? sizes : [sizes];
      const insertSize = db.prepare('INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)');
      sizeArr.forEach(s => {
        if (s.trim()) insertSize.run(productId, s.trim(), 1);
      });
    }

    // Update defects - delete old and insert new
    db.prepare('DELETE FROM product_defects WHERE product_id = ?').run(productId);
    if (defects) {
      const defectArr = Array.isArray(defects) ? defects : [defects];
      const insertDefect = db.prepare('INSERT INTO product_defects (product_id, description) VALUES (?, ?)');
      defectArr.forEach(d => {
        if (d.trim()) insertDefect.run(productId, d.trim());
      });
    }

    req.flash('success', 'Product updated successfully!');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update product');
    res.redirect(`/admin/products/edit/${productId}`);
  }
});

// Delete product
router.post('/products/delete/:id', isAdmin, (req, res) => {
  const db = getDb();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (product && product.image) {
      const imgPath = path.join(__dirname, '..', 'public', 'uploads', product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    // Delete gallery images
    const galleryImgs = db.prepare('SELECT filename FROM product_images WHERE product_id = ?').all(req.params.id);
    galleryImgs.forEach(img => {
      const gPath = path.join(__dirname, '..', 'public', 'uploads', img.filename);
      if (fs.existsSync(gPath)) fs.unlinkSync(gPath);
    });

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    req.flash('success', 'Product deleted successfully!');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete product');
  }

  res.redirect('/admin/products');
});

// Delete single gallery image
router.post('/products/delete-image/:imgId', isAdmin, (req, res) => {
  const db = getDb();
  try {
    const img = db.prepare('SELECT * FROM product_images WHERE id = ?').get(req.params.imgId);
    if (img) {
      const imgPath = path.join(__dirname, '..', 'public', 'uploads', img.filename);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      db.prepare('DELETE FROM product_images WHERE id = ?').run(req.params.imgId);
    }
    req.flash('success', 'Image deleted');
  } catch (err) {
    req.flash('error', 'Failed to delete image');
  }
  res.redirect('back');
});

// User management
router.get('/users', isAdmin, (req, res) => {
  const db = getDb();
  const users = db.prepare("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC").all();
  res.render('admin/users', { title: 'Manage Users - Admin', users });
});

// Delete user (admin only, cannot delete self)
router.post('/users/delete/:id', isAdmin, (req, res) => {
  const db = getDb();
  try {
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) {
      req.flash('error', 'User not found');
    } else if (targetUser.id === req.session.userId) {
      req.flash('error', 'Cannot delete your own account');
    } else if (targetUser.role === 'admin') {
      req.flash('error', 'Cannot delete admin accounts');
    } else {
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      req.flash('success', `User "${targetUser.username}" deleted successfully`);
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete user');
  }
  res.redirect('/admin/users');
});

module.exports = router;
