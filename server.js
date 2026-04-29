const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'iusymarket-secret-key-2024-xyz',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Flash messages
app.use(flash());

// Global variables for views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const adminRouter = require('./routes/admin');

app.use('/', pagesRouter);
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/admin', adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`✨ iusymarket running at http://localhost:${PORT}`);
});
