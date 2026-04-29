function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please login to access this page');
  res.redirect('/auth/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Admin only.');
  res.redirect('/');
}

function isGuest(req, res, next) {
  if (!req.session || !req.session.user) {
    return next();
  }
  res.redirect('/');
}

module.exports = { isAuthenticated, isAdmin, isGuest };
