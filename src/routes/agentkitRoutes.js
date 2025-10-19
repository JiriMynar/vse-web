import express from 'express';

import { authMiddleware } from '../../auth.js';
import { createAgentkitSessionController } from '../controllers/agentkitController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/create-session', createAgentkitSessionController);

export { router };
