import {
  listAllUsers,
  deleteUserAccount,
  resetUserPassword
} from '../services/adminService.js';

export async function listUsersController(req, res, next) {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    await deleteUserAccount({ actorId: req.user.id, targetId });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function resetUserPasswordController(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    const password = await resetUserPassword({ actorId: req.user.id, targetId });
    res.json({ message: 'Heslo bylo obnoveno.', temporaryPassword: password });
  } catch (error) {
    next(error);
  }
}
