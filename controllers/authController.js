import User from '../models/User.js';
import { logAudit } from '../services/auditService.js';

// Display Login Form
export function showLogin(req, res) {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { 
    title: 'Sign In',
    error: req.query.error === 'account_deactivated' ? 'Your account has been deactivated. Please contact your manager.' : null
  });
}

// Process Login submission
export async function handleLogin(req, res) {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.render('auth/login', {
      title: 'Sign In',
      error: 'User ID and password are required.',
      userId
    });
  }

  try {
    const user = await User.findOne({ userId: userId.trim().toLowerCase() });
    if (!user) {
      return res.render('auth/login', {
        title: 'Sign In',
        error: 'Invalid User ID or password.',
        userId
      });
    }

    if (user.isDeactivated) {
      return res.render('auth/login', {
        title: 'Sign In',
        error: 'Your account has been deactivated. Please contact your manager.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Sign In',
        error: 'Invalid User ID or password.',
        userId
      });
    }

    // Regenerate session to protect against session fixation attacks
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).send('Session initialization failed');
      }

      req.session.userId = user._id;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).render('errors/500');
        }

        if (user.mustChangePassword) {
          return res.redirect('/auth/change-password');
        }

        const returnUrl = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        res.redirect(returnUrl);
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('errors/500');
  }
}

// Process Logout
export function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
}

// Display First-Login / Reset Password Form
export function showChangePassword(req, res) {
  res.render('auth/change-password', {
    title: 'Change Password',
    isFirstLogin: req.user.mustChangePassword
  });
}

// Process Password Change
export async function handleChangePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    req.session.errorMsg = 'New password must be at least 6 characters.';
    return res.redirect('/auth/change-password');
  }

  if (newPassword !== confirmPassword) {
    req.session.errorMsg = 'New passwords do not match.';
    return res.redirect('/auth/change-password');
  }

  try {
    const user = await User.findById(req.user._id);

    // If not first login, verify current password
    if (!user.mustChangePassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        req.session.errorMsg = 'Current password is incorrect.';
        return res.redirect('/auth/change-password');
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await logAudit({
      actorId: user._id,
      action: 'USER_PASSWORD_CHANGED',
      targetType: 'User',
      targetId: user._id
    });

    req.session.successMsg = 'Password updated successfully.';
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).render('errors/500');
  }
}
