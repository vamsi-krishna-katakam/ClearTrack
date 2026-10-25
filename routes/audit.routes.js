import express from 'express';
import * as auditController from '../controllers/auditController.js';
import { isAuthenticated, isManager } from '../middleware/auth.js';

const router = express.Router();

router.get('/', isAuthenticated, isManager, auditController.listLogs);

export default router;
