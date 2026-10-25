import express from 'express';
import * as taskController from '../controllers/taskController.js';
import { isAuthenticated, isManager } from '../middleware/auth.js';

const router = express.Router();

router.use(isAuthenticated);

// List tasks (role-aware: manager sees all with filters; employee sees assigned)
router.get('/', taskController.listTasks);

// Manager task creation
router.get('/new', isManager, taskController.showCreateForm);
router.post('/', isManager, taskController.createTask);

// Task details and interactions
router.get('/:id', taskController.showTask);
router.get('/:id/edit', isManager, taskController.showEditForm);
router.post('/:id', isManager, taskController.updateTask);

// Employee actions
router.post('/:id/progress', taskController.updateProgress);
router.post('/:id/evidence', taskController.submitEvidence);

// Manager review action
router.post('/:id/review', isManager, taskController.reviewTask);

export default router;
