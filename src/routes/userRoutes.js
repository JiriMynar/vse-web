import express from 'express';

import { authMiddleware } from '../../auth.js';
import { updateProfileController, changePasswordController } from '../controllers/userController.js';

const router = express.Router();

router.use(authMiddleware);
router.put('/me', updateProfileController);
router.post('/me/password', changePasswordController);

export { router };
