import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getDb } from '../../db.js';

const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'Jméno je povinné.' })
    .min(2, 'Jméno musí mít alespoň 2 znaky.')
    .max(120, 'Jméno je příliš dlouhé.')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuální heslo je povinné.'),
  newPassword: z.string().min(6, 'Nové heslo musí mít alespoň 6 znaků.')
});

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at
  };
}

export async function updateProfile(userId, payload) {
  const { name } = updateProfileSchema.parse(payload || {});
  const db = await getDb();
  const result = await db.run('UPDATE users SET name = ? WHERE id = ?', name.trim(), userId);
  if (result.changes === 0) {
    const error = new Error('Uživatel nebyl nalezen.');
    error.status = 404;
    throw error;
  }
  const user = await db.get('SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?', userId);
  return mapUser(user);
}

export async function changePassword(userId, payload) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(payload || {});
  const db = await getDb();
  const user = await db.get('SELECT id, password_hash FROM users WHERE id = ?', userId);
  if (!user) {
    const error = new Error('Uživatel nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) {
    const error = new Error('Aktuální heslo není správné.');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', passwordHash, userId);
}
