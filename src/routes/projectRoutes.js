import express from 'express';

import { authMiddleware } from '../../auth.js';
import {
  listProjectsController,
  createProjectController,
  updateProjectController,
  getProjectController,
  archiveProjectController,
  deleteProjectController
} from '../controllers/projectController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', listProjectsController);
router.post('/', createProjectController);
router.get('/:id', getProjectController);
router.patch('/:id', updateProjectController);
router.post('/:id/archive', archiveProjectController);
router.delete('/:id', deleteProjectController);

export { router };
