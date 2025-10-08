import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getDb } from '../../db.js';
import {
  signToken,
  attachTokenCookies,
  clearTokenCookies,
  persistRefreshToken,
  rotateRefreshToken,
  getRefreshTokenFromRequest
} from '../../auth.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky.'),
  email: z.string().email('Zadejte platnou e-mailovou adresu.'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků.')
});

const loginSchema = z.object({
  email: z.string().email('Zadejte platnou e-mailovou adresu.'),
  password: z.string().min(1, 'Heslo je povinné.')
});

export async function registerUser(payload) {
  const { name, email, password } = registerSchema.parse(payload);
  const db = await getDb();
  const normalizedEmail = email.toLowerCase();

  const existing = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);
  if (existing) {
    const error = new Error('Uživatel s tímto e-mailem již existuje.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.run(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    normalizedEmail,
    passwordHash,
    name.trim()
  );

  const user = { id: result.lastID, email: normalizedEmail, name: name.trim() };
  return issueTokensForUser(user);
}

export async function loginUser(payload) {
  const { email, password } = loginSchema.parse(payload);
  const db = await getDb();
  const normalizedEmail = email.toLowerCase();

  const user = await db.get('SELECT * FROM users WHERE email = ?', normalizedEmail);
  if (!user) {
    const error = new Error('Nesprávné přihlašovací údaje.');
    error.status = 401;
    throw error;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const error = new Error('Nesprávné přihlašovací údaje.');
    error.status = 401;
    throw error;
  }

  return issueTokensForUser(user);
}

export async function refreshSession(req) {
  const currentToken = getRefreshTokenFromRequest(req);
  if (!currentToken) {
    const error = new Error('Chybí refresh token.');
    error.status = 401;
    throw error;
  }

  const { userId, token, expiresAt } = await rotateRefreshToken(currentToken);
  const db = await getDb();
  const user = await db.get('SELECT id, email, name FROM users WHERE id = ?', userId);
  if (!user) {
    const error = new Error('Uživatel již neexistuje.');
    error.status = 404;
    throw error;
  }

  const accessToken = signToken({ id: user.id, email: user.email, name: user.name });
  return { user, accessToken, refreshToken: token, refreshExpiresAt: expiresAt };
}

export async function getSessionUser(userId) {
  const db = await getDb();
  return db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', userId);
}

export function attachAuthCookies(res, authPayload) {
  attachTokenCookies(res, authPayload.accessToken, authPayload.refreshToken, authPayload.refreshExpiresAt);
}

export function logoutUser(res, refreshToken) {
  clearTokenCookies(res);
  if (refreshToken) {
    revokeToken(refreshToken).catch(() => {});
  }
}

async function revokeToken(token) {
  try {
    const db = await getDb();
    await db.run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = ?', token);
  } catch (error) {
    // Ignore revoke errors in background
  }
}

function issueTokensForUser(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  const accessToken = signToken(payload, '15m');
  const refreshToken = randomBytes(40).toString('hex');
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return persistRefreshToken(user.id, refreshToken, refreshExpiresAt).then(() => ({
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
    refreshExpiresAt
  }));
}
