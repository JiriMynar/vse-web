import express from 'express';

import { router as authRouter } from './authRoutes.js';
import { router as chatRouter } from './chatRoutes.js';
import { router as projectRouter } from './projectRoutes.js';
import { router as automationRouter } from './automationRoutes.js';
import { router as helpRouter } from './helpRoutes.js';
import { healthRouter } from './statusRoutes.js';

export function registerRoutes(app) {
  const api = express.Router();

  api.use('/auth', authRouter);
  api.use('/chat', chatRouter);
  api.use('/projects', projectRouter);
  api.use('/automations', automationRouter);
  api.use('/help', helpRouter);

  app.use('/api', healthRouter);
  app.use('/api', api);
}
