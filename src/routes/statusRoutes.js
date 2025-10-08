import express from 'express';
import { healthController } from '../controllers/statusController.js';

const router = express.Router();

router.get('/health', healthController);

export { router as healthRouter };
