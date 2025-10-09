import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getDb } from '../../db.js';
import { logger } from '../../logger.js';

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function resolveAdminConfig(options = {}) {
  const fallbackEmail = options.email ?? process.env.ADMIN_EMAIL ?? 'admin@admintes.cz';
  const email = normalizeEmail(fallbackEmail);

  if (!email) {
    throw new Error('Administrátorský e-mail není nastaven.');
  }

  const name = options.name ?? process.env.ADMIN_NAME ?? 'Admin';
  const password = options.password ?? process.env.ADMIN_PASSWORD ?? 'admintes';

  return { email, name, password };
}

function toUserPayload(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at
  };
}

export async function ensureAdminUser(options = {}) {
  const { email, name, password: predefinedPassword } = resolveAdminConfig(options);
  const db = await getDb();
  const existing = await db.get('SELECT * FROM users WHERE email = ?', email);

  if (existing) {
    if (!existing.is_admin) {
      await db.run('UPDATE users SET is_admin = 1 WHERE id = ?', existing.id);
      logger.info(`Aktualizován administrátorský účet ${email}.`);
    }
    return null;
  }

  const password = predefinedPassword || generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.run(
    'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)',
    email,
    passwordHash,
    name
  );

  if (predefinedPassword) {
    logger.warn(`Vytvořen administrátorský účet ${email} (ID ${result.lastID}).`);
    return null;
  }

  logger.warn(
    `Vytvořen nový administrátorský účet ${email} (ID ${result.lastID}). Dočasné heslo: ${password}`
  );
  return { email, password };
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

const updateUserRoleSchema = z.object({
  actorId: z.number().positive(),
  targetId: z.number().positive(),
  role: z.enum(['user', 'admin'])
});

export async function updateUserRole({ actorId, targetId, role }) {
  const { actorId: adminId, targetId: userId, role: desiredRole } = updateUserRoleSchema.parse({
    actorId,
    targetId,
    role
  });

  if (adminId === userId && desiredRole !== 'admin') {
    const error = new Error('Nelze odebrat administrátorská oprávnění vlastnímu účtu.');
    error.status = 400;
    throw error;
  }

  const db = await getDb();
  const user = await db.get('SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?', userId);
  if (!user) {
    const error = new Error('Uživatel nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  const makeAdmin = desiredRole === 'admin' ? 1 : 0;
  if (Number(user.is_admin) !== makeAdmin) {
    await db.run('UPDATE users SET is_admin = ? WHERE id = ?', makeAdmin, userId);
  }

  const updated = await db.get(
    'SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?',
    userId
  );
  return toUserPayload(updated);
}

const resetDatabaseSchema = z.object({
  actorId: z.number().positive()
});

export async function resetUserDatabase({ actorId }) {
  const { actorId: adminId } = resetDatabaseSchema.parse({ actorId });
  const db = await getDb();

  const actor = await db.get('SELECT * FROM users WHERE id = ?', adminId);
  if (!actor) {
    const error = new Error('Administrátorský účet nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  await db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const tablesToClear = [
      'automation_runs',
      'automations',
      'project_members',
      'projects',
      'chat_messages',
      'chat_threads',
      'refresh_tokens'
    ];

    for (const table of tablesToClear) {
      await db.run(`DELETE FROM ${table}`);
    }

    await db.run('DELETE FROM users');

    await db.run(
      'INSERT INTO users (id, email, password_hash, name, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      actor.id,
      actor.email,
      actor.password_hash,
      actor.name,
      1,
      actor.created_at
    );

    await db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('users','chat_messages','chat_threads','projects','project_members','automations','automation_runs','refresh_tokens')"
    );

    await db.exec('COMMIT;');
  } catch (error) {
    await db.exec('ROLLBACK;');
    throw error;
  }
}

function generatePassword() {
  return randomBytes(9)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12);
}
