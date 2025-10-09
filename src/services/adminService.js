import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getDb } from '../../db.js';
import { logger } from '../../logger.js';

const ADMIN_EMAIL = 'j.mynar93@seznam.cz';

function toUserPayload(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at
  };
}

export async function ensureAdminUser() {
  const db = await getDb();
  const existing = await db.get('SELECT * FROM users WHERE email = ?', ADMIN_EMAIL);

  if (existing) {
    if (!existing.is_admin) {
      await db.run('UPDATE users SET is_admin = 1 WHERE id = ?', existing.id);
      logger.info(`Aktualizován administrátorský účet ${ADMIN_EMAIL}.`);
    }
    return null;
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const name = 'Administrátor';
  const result = await db.run(
    'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)',
    ADMIN_EMAIL,
    passwordHash,
    name
  );

  logger.warn(
    `Vytvořen nový administrátorský účet ${ADMIN_EMAIL} (ID ${result.lastID}). Dočasné heslo: ${password}`
  );
  return { email: ADMIN_EMAIL, password };
}

export async function listAllUsers() {
  const db = await getDb();
  const rows = await db.all(
    'SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at DESC'
  );
  return rows.map(toUserPayload);
}

const deleteUserSchema = z.object({
  actorId: z.number().positive(),
  targetId: z.number().positive()
});

export async function deleteUserAccount({ actorId, targetId }) {
  const { actorId: adminId, targetId: userId } = deleteUserSchema.parse({ actorId, targetId });

  if (adminId === userId) {
    const error = new Error('Administrátor nemůže odstranit vlastní účet.');
    error.status = 400;
    throw error;
  }

  const db = await getDb();
  const target = await db.get('SELECT id, is_admin FROM users WHERE id = ?', userId);
  if (!target) {
    const error = new Error('Uživatel nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  if (target.is_admin) {
    const error = new Error('Nelze odstranit jiného administrátora.');
    error.status = 403;
    throw error;
  }

  await db.run('DELETE FROM users WHERE id = ?', userId);
}

const resetPasswordSchema = z.object({
  actorId: z.number().positive(),
  targetId: z.number().positive()
});

export async function resetUserPassword({ actorId, targetId }) {
  const { actorId: adminId, targetId: userId } = resetPasswordSchema.parse({ actorId, targetId });

  const db = await getDb();
  const user = await db.get('SELECT id, is_admin FROM users WHERE id = ?', userId);
  if (!user) {
    const error = new Error('Uživatel nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  if (user.is_admin) {
    const error = new Error('Nelze resetovat heslo administrátorského účtu.');
    error.status = 403;
    throw error;
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', passwordHash, userId);

  return password;
}

function generatePassword() {
  return randomBytes(9)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12);
}
