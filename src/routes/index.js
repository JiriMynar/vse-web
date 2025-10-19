import express from 'express';

import { router as authRouter } from './authRoutes.js';
import { router as chatRouter } from './chatRoutes.js';
import { router as projectRouter } from './projectRoutes.js';
import { router as helpRouter } from './helpRoutes.js';
import { router as adminRouter } from './adminRoutes.js';
import { router as userRouter } from './userRoutes.js';
import { router as agentkitRouter } from './agentkitRoutes.js';
import { healthRouter } from './statusRoutes.js';

export function registerRoutes(app) {
  const api = express.Router();

  api.use('/auth', authRouter);
  api.use('/users', userRouter);
  api.use('/chat', chatRouter);
  api.use('/projects', projectRouter);
  api.use('/help', helpRouter);
  api.use('/admin', adminRouter);
  api.use('/', agentkitRouter);

  app.use('/api', healthRouter);
  app.use('/api', api);
}
