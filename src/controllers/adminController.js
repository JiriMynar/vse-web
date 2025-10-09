import {
  listAllUsers,
  deleteUserAccount,
  resetUserPassword,
  updateUserRole,
  resetUserDatabase
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

export async function updateUserRoleController(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    const { role } = req.body || {};
    const user = await updateUserRole({ actorId: req.user.id, targetId, role });
    res.json({
      message: user.isAdmin
        ? 'Uživatel byl povýšen na administrátora.'
        : 'Role uživatele byla nastavena na "user".',
      user
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserDatabaseController(req, res, next) {
  try {
    await resetUserDatabase({ actorId: req.user.id });
    res.json({
      message:
        'Databáze uživatelů byla vymazána. Všechny účty kromě vašeho byly odstraněny a všichni uživatelé se musí znovu registrovat.'
    });
  } catch (error) {
    next(error);
  }
}
