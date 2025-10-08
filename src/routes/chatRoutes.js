import express from 'express';

import { authMiddleware } from '../../auth.js';
import {
  listThreadsController,
  createThreadController,
  updateThreadController,
  deleteThreadController,
  clearThreadController,
  deleteAllController,
  listMessagesController,
  createMessageController,
  streamThreadsController,
  streamMessagesController
} from '../controllers/chatController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/threads/stream', streamThreadsController);
router.get('/threads', listThreadsController);
router.post('/threads', createThreadController);
router.patch('/threads/:id', updateThreadController);
router.delete('/threads/:id', deleteThreadController);
router.delete('/threads/:id/messages', clearThreadController);
router.delete('/history', deleteAllController);
router.get('/history', listMessagesController);
router.post('/messages', createMessageController);
router.get('/threads/:id/stream', streamMessagesController);

export { router };
