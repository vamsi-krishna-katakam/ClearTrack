import express from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { isAuthenticated, isManager } from '../middleware/auth.js';

const router = express.Router();

router.use(isAuthenticated, isManager);

router.get('/', employeeController.listEmployees);
router.get('/new', employeeController.showCreateForm);
router.post('/', employeeController.createEmployee);
router.get('/:id', employeeController.showEmployee);
router.get('/:id/edit', employeeController.showEditForm);
router.post('/:id', employeeController.updateEmployee);
router.post('/:id/deactivate', employeeController.deactivateEmployee);

export default router;
