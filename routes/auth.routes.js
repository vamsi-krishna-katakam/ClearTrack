import express from 'express';
import * as authController from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.get('/login', authController.showLogin);
router.post('/login', authController.handleLogin);
router.get('/logout', authController.handleLogout);

router.get('/change-password', isAuthenticated, authController.showChangePassword);
router.post('/change-password', isAuthenticated, authController.handleChangePassword);

export default router;
