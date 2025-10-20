import { updateProfile, changePassword } from '../services/userService.js';
import { getSessionUser } from '../services/authService.js';
import {
  getUserSettings,
  updateUserPreferences,
  getAgentkitSettings,
  updateAgentkitSettings
} from '../services/userSettingsService.js';

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

export async function getUserSettingsController(req, res, next) {
  try {
    const settings = await getUserSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateUserPreferencesController(req, res, next) {
  try {
    const preferences = await updateUserPreferences(req.user.id, req.body || {});
    res.json({ message: 'Uživatelské preference byly uloženy.', preferences });
  } catch (error) {
    next(error);
  }
}

export async function getAgentkitSettingsController(req, res, next) {
  try {
    const agentkit = await getAgentkitSettings(req.user.id);
    res.json({ agentkit });
  } catch (error) {
    next(error);
  }
}

export async function updateAgentkitSettingsController(req, res, next) {
  try {
    const agentkit = await updateAgentkitSettings(req.user.id, req.body || {});
    res.json({ message: 'Konfigurace Agentkit byla uložena.', agentkit });
  } catch (error) {
    next(error);
  }
}
