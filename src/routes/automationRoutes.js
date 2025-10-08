import express from 'express';

import { authMiddleware } from '../../auth.js';
import {
  listAutomationsController,
  createAutomationController,
  updateAutomationController,
  getAutomationController,
  deleteAutomationController
} from '../controllers/automationController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/project/:projectId', listAutomationsController);
router.post('/project/:projectId', createAutomationController);
router.get('/:id', getAutomationController);
router.patch('/:id', updateAutomationController);
router.delete('/:id', deleteAutomationController);

export { router };
