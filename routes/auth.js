const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDb } = require('../database/init');
const { isGuest } = require('../middleware/auth');

// Login page
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', { title: 'Sign In - iusymarket' });
});

// Process login
router.post('/login', isGuest, (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

    if (!user) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/auth/login');
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    req.flash('success', `Welcome back, ${user.username}!`);

    if (user.role === 'admin') {
      return res.redirect('/admin');
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/auth/login');
  }
});

// Register page
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', { title: 'Create Account - iusymarket' });
});

// Process registration
router.post('/register', isGuest, (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const db = getDb();

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/auth/register');
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters');
    return res.redirect('/auth/register');
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      req.flash('error', 'Username or email already exists');
      return res.redirect('/auth/register');
    }

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      username, email, hash, 'user'
    );

    req.flash('success', 'Account created successfully! Please sign in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
});

// Forgot password page
router.get('/forgot-password', isGuest, (req, res) => {
  res.render('auth/forgot-password', { title: 'Reset Password - iusymarket' });
});

// Process forgot password
router.post('/forgot-password', isGuest, (req, res) => {
  const { username, email, newPassword, confirmNewPassword } = req.body;
  const db = getDb();

  if (newPassword !== confirmNewPassword) {
    req.flash('error', 'New passwords do not match');
    return res.redirect('/auth/forgot-password');
  }

  if (newPassword.length < 6) {
    req.flash('error', 'Password must be at least 6 characters');
    return res.redirect('/auth/forgot-password');
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND email = ?').get(username, email);
    if (!user) {
      req.flash('error', 'No account found with that username and email');
      return res.redirect('/auth/forgot-password');
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);

    req.flash('success', 'Password reset successful! Please sign in with your new password.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Password reset failed. Please try again.');
    res.redirect('/auth/forgot-password');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
