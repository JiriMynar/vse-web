import express from 'express';

import { authMiddleware } from '../../auth.js';
import {
  registerController,
  loginController,
  logoutController,
  meController,
  refreshController
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/logout', logoutController);
router.get('/me', authMiddleware, meController);
router.post('/refresh', refreshController);

export { router };
