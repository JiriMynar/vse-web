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
    'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 0)',
    normalizedEmail,
    passwordHash,
    name.trim()
  );

  const user = { id: result.lastID, email: normalizedEmail, name: name.trim(), is_admin: 0 };
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
  const user = await db.get('SELECT id, email, name, is_admin FROM users WHERE id = ?', userId);
  if (!user) {
    const error = new Error('Uživatel již neexistuje.');
    error.status = 404;
    throw error;
  }

  const normalizedUser = normalizeUser(user);
  const accessToken = signToken({
    id: normalizedUser.id,
    email: normalizedUser.email,
    name: normalizedUser.name,
    isAdmin: normalizedUser.isAdmin
  });
  return { user: normalizedUser, accessToken, refreshToken: token, refreshExpiresAt: expiresAt };
}

export async function getSessionUser(userId) {
  const db = await getDb();
  const user = await db.get('SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?', userId);
  if (!user) {
    return null;
  }
  return { ...normalizeUser(user), createdAt: user.created_at };
}

export function attachAuthCookies(req, res, authPayload) {
  attachTokenCookies(req, res, authPayload.accessToken, authPayload.refreshToken, authPayload.refreshExpiresAt);
}

export function logoutUser(req, res, refreshToken) {
  clearTokenCookies(req, res);
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

function normalizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: Boolean(row.is_admin)
  };
}

function issueTokensForUser(user) {
  const normalized = normalizeUser(user);
  const payload = {
    id: normalized.id,
    email: normalized.email,
    name: normalized.name,
    isAdmin: normalized.isAdmin
  };
  const accessToken = signToken(payload, '15m');
  const refreshToken = randomBytes(40).toString('hex');
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return persistRefreshToken(user.id, refreshToken, refreshExpiresAt).then(() => ({
    user: normalized,
    accessToken,
    refreshToken,
    refreshExpiresAt
  }));
}
