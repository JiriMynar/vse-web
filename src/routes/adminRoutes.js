import express from 'express';

import { authMiddleware } from '../../auth.js';
import { requireAdmin } from '../middleware/authorization.js';
import {
  listUsersController,
  deleteUserController,
  resetUserPasswordController
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authMiddleware, requireAdmin);
router.get('/users', listUsersController);
router.delete('/users/:id', deleteUserController);
router.post('/users/:id/reset-password', resetUserPasswordController);

export { router };
