import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

import { getDb } from './db.js';
import { logger } from './logger.js';
import { ensureWritableDir } from './pathUtils.js';

const TOKEN_COOKIE = 'token';
const REFRESH_COOKIE = 'refresh_token';
const defaultSecret = 'change-me-secret';
const MIN_SECRET_LENGTH = 32;
const SECRET_FILE_NAME = 'jwt_secret';

let cachedSecret;
let secretFilePath;

function resolveSecretFilePath() {
  if (!secretFilePath) {
    const dir = ensureWritableDir({
      envVar: 'DATA_DIR',
      defaultSubdir: 'data',
      requireEnv: true,
      purpose: 'tajné klíče'
    });
    secretFilePath = path.join(dir, SECRET_FILE_NAME);
  }
  return secretFilePath;
}

function isValidSecret(value) {
  return typeof value === 'string' && value.trim().length >= MIN_SECRET_LENGTH;
}

function readSecretFromDisk() {
  try {
    const fileSecret = fs.readFileSync(resolveSecretFilePath(), 'utf8').trim();
    if (isValidSecret(fileSecret)) {
      return fileSecret;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn(`Čtení tajného klíče JWT selhalo: ${error.message}`);
    }
  }
  return null;
}

function persistSecretToDisk(secret) {
  try {
    fs.writeFileSync(resolveSecretFilePath(), secret, { mode: 0o600 });
  } catch (error) {
    logger.warn(`Uložení tajného klíče JWT selhalo: ${error.message}`);
  }
}

function generateSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function getSecret() {
  if (cachedSecret) {
    return cachedSecret;
  }

  const envSecret = process.env.JWT_SECRET;
  if (envSecret) {
    const trimmed = envSecret.trim();
    if (!isValidSecret(trimmed) || trimmed === defaultSecret) {
      throw new Error('JWT_SECRET musí být nastaven na alespoň 32 znaků a odlišný od výchozí hodnoty.');
    }
    cachedSecret = trimmed;
    return cachedSecret;
  }

  const storedSecret = readSecretFromDisk();
  if (storedSecret) {
    cachedSecret = storedSecret;
    return cachedSecret;
  }

  const generatedSecret = generateSecret();
  cachedSecret = generatedSecret;
  persistSecretToDisk(generatedSecret);
  if (process.env.NODE_ENV === 'production') {
    logger.warn('JWT_SECRET nebyl nastaven, byl automaticky vygenerován a uložen.');
  }
  return cachedSecret;
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
    req.user = { ...data, isAdmin: Boolean(data.isAdmin) };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Neplatný nebo expirovaný token.' });
  }
}


  res.cookie(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 15 * 60 * 1000
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: refreshExpiresAt.getTime() - Date.now()
  });
}


  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure,
    sameSite
  });
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite
  });
}

export function getRefreshTokenFromRequest(req) {
  return req.cookies[REFRESH_COOKIE];
}
