import express from 'express';

import { authMiddleware } from '../../auth.js';
import { helpController } from '../controllers/helpController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', helpController);

export { router };
