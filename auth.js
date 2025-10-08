import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { getDb } from './db.js';

const TOKEN_COOKIE = 'token';
const REFRESH_COOKIE = 'refresh_token';
const defaultSecret = 'change-me-secret';

function getSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === defaultSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET musí být nastaven a odlišný od výchozí hodnoty.');
    }
  }

  return process.env.JWT_SECRET || defaultSecret;
}

export function signToken(payload, expiresIn = '15m') {
  const secret = getSecret();
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token) {
  const secret = getSecret();
  return jwt.verify(token, secret);
}

export async function persistRefreshToken(userId, token, expiresAt, replacedBy = null) {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.run(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at, replaced_by) VALUES (?, ?, ?, ?, ?)',
    id,
    userId,
    token,
    expiresAt.toISOString(),
    replacedBy
  );
  return id;
}

export async function revokeRefreshToken(token) {
  const db = await getDb();
  await db.run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = ?', token);
}

export async function rotateRefreshToken(oldToken) {
  const db = await getDb();
  const existing = await db.get('SELECT * FROM refresh_tokens WHERE token = ? AND revoked_at IS NULL', oldToken);
  if (!existing) {
    const error = new Error('Refresh token je neplatný.');
    error.status = 401;
    throw error;
  }

  if (new Date(existing.expires_at) < new Date()) {
    const error = new Error('Refresh token vypršel.');
    error.status = 401;
    throw error;
  }

  const newToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP, replaced_by = ? WHERE token = ?', newToken, oldToken);
  await persistRefreshToken(existing.user_id, newToken, expiresAt, null);

  return { userId: existing.user_id, token: newToken, expiresAt };
}

export function authMiddleware(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE] || (req.headers.authorization || '').replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Nejste přihlášen(a).' });
  }

  try {
    const data = verifyToken(token);
    req.user = data;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Neplatný nebo expirovaný token.' });
  }
}

export function attachTokenCookies(res, accessToken, refreshToken, refreshExpiresAt) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : 'lax',
    maxAge: refreshExpiresAt.getTime() - Date.now()
  });
}

export function clearTokenCookies(res) {
  const secure = process.env.NODE_ENV === 'production';
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : 'lax'
  });
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : 'lax'
  });
}

export function getRefreshTokenFromRequest(req) {
  return req.cookies[REFRESH_COOKIE];
}
