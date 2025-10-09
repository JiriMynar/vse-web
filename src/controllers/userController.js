import { updateProfile, changePassword } from '../services/userService.js';
import { getSessionUser } from '../services/authService.js';

export async function updateProfileController(req, res, next) {
  try {
    const updated = await updateProfile(req.user.id, req.body || {});
    res.json({ message: 'Profil byl upraven.', user: updated });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(req, res, next) {
  try {
    await changePassword(req.user.id, req.body || {});
    const user = await getSessionUser(req.user.id);
    res.json({ message: 'Heslo bylo úspěšně změněno.', user });
  } catch (error) {
    next(error);
  }
}
