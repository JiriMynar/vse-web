import {
  registerUser,
  loginUser,
  refreshSession,
  getSessionUser,
  attachAuthCookies,
  logoutUser
} from '../services/authService.js';
import { getRefreshTokenFromRequest } from '../../auth.js';

export async function registerController(req, res, next) {
  try {
    const authPayload = await registerUser(req.body || {});
    attachAuthCookies(req, res, authPayload);
    res.status(201).json({ message: 'Registrace proběhla úspěšně.', user: authPayload.user });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const authPayload = await loginUser(req.body || {});
    attachAuthCookies(req, res, authPayload);
    res.json({ message: 'Přihlášení proběhlo úspěšně.', user: authPayload.user });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req, res, next) {
  try {
    const authPayload = await refreshSession(req);
    attachAuthCookies(req, res, authPayload);
    res.json({ message: 'Token byl obnoven.', user: authPayload.user });
  } catch (error) {
    next(error);
  }
}

export async function meController(req, res, next) {
  try {
    const user = await getSessionUser(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req, res, next) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    await logoutUser(req, res, refreshToken);
    res.json({ message: 'Byli jste odhlášeni.' });
  } catch (error) {
    next(error);
  }
}
