import {
  listProjects,
  createProject,
  updateProject,
  getProjectById,
  archiveProject,
  deleteProject
} from '../services/projectService.js';

export async function listProjectsController(req, res, next) {
  try {
    const projects = await listProjects(req.user.id);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
}

export async function createProjectController(req, res, next) {
  try {
    const project = await createProject(req.user.id, req.body);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(req, res, next) {
  try {
    const project = await updateProject(req.user.id, Number(req.params.id), req.body);
    res.json({ project });
  } catch (error) {
    next(error);
  }
}

export async function getProjectController(req, res, next) {
  try {
    const project = await getProjectById(req.user.id, Number(req.params.id));
    res.json({ project });
  } catch (error) {
    next(error);
  }
}

export async function archiveProjectController(req, res, next) {
  try {
    const project = await archiveProject(req.user.id, Number(req.params.id));
    res.json({ project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectController(req, res, next) {
  try {
    await deleteProject(req.user.id, Number(req.params.id));
    res.json({ message: 'Projekt byl odstraněn.' });
  } catch (error) {
    next(error);
  }
}
