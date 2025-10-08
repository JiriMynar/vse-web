import {
  listAutomations,
  createAutomation,
  updateAutomation,
  getAutomationById,
  deleteAutomation
} from '../services/automationService.js';

export async function listAutomationsController(req, res, next) {
  try {
    const projectId = Number(req.params.projectId);
    const automations = await listAutomations(req.user.id, projectId);
    res.json({ automations });
  } catch (error) {
    next(error);
  }
}

export async function createAutomationController(req, res, next) {
  try {
    const projectId = Number(req.params.projectId);
    const automation = await createAutomation(req.user.id, projectId, req.body);
    res.status(201).json({ automation });
  } catch (error) {
    next(error);
  }
}

export async function updateAutomationController(req, res, next) {
  try {
    const automation = await updateAutomation(req.user.id, Number(req.params.id), req.body);
    res.json({ automation });
  } catch (error) {
    next(error);
  }
}

export async function getAutomationController(req, res, next) {
  try {
    const automation = await getAutomationById(req.user.id, Number(req.params.id));
    res.json({ automation });
  } catch (error) {
    next(error);
  }
}

export async function deleteAutomationController(req, res, next) {
  try {
    await deleteAutomation(req.user.id, Number(req.params.id));
    res.json({ message: 'Automatizace byla odstraněna.' });
  } catch (error) {
    next(error);
  }
}
