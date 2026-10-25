import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.get('/', isAuthenticated, dashboardController.showDashboard);

export default router;
