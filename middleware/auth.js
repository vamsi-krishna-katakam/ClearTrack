import User from '../models/User.js';

// Middleware to verify session and attach authenticated user
export async function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.isDeactivated) {
      req.session.destroy();
      return res.redirect('/auth/login?error=account_deactivated');
    }

    req.user = user;
    res.locals.user = user;

    // Enforce temporary password change on first login
    if (user.mustChangePassword && !req.path.startsWith('/auth/change-password') && !req.path.startsWith('/auth/logout')) {
      return res.redirect('/auth/change-password');
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Middleware to restrict access to Managers only
export function isManager(req, res, next) {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  return res.status(403).render('errors/403', { 
    title: 'Access Denied', 
    message: 'Manager permissions required to view this page.' 
  });
}

// Pass session & flash data to EJS templates
export function populateLocals(req, res, next) {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  res.locals.successMsg = req.session.successMsg || null;
  res.locals.errorMsg = req.session.errorMsg || null;
  
  delete req.session.successMsg;
  delete req.session.errorMsg;
  next();
}
