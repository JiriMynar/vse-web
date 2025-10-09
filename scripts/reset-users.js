#!/usr/bin/env node
import process from 'node:process';

import { getDb } from '../db.js';
import { ensureAdminUser, resetUserDatabase } from '../src/services/adminService.js';

async function main() {
  const emailArg = process.argv[2];
  const adminEmail = emailArg || process.env.ADMIN_EMAIL || 'j.mynar93@seznam.cz';

  const created = await ensureAdminUser();
  if (created) {
    console.log(
      `Byl vytvořen výchozí administrátor ${created.email} s dočasným heslem ${created.password}.`
    );
  }

  const db = await getDb();
  const admin = await db.get('SELECT * FROM users WHERE email = ?', adminEmail);

  if (!admin) {
    console.error(`Administrátorský účet s e-mailem ${adminEmail} nebyl nalezen.`);
    process.exitCode = 1;
    return;
  }

  if (!admin.is_admin) {
    console.error(`Účet ${adminEmail} nemá administrátorská oprávnění.`);
    process.exitCode = 1;
    return;
  }

  await resetUserDatabase({ actorId: admin.id });
  console.log(
    `Databáze uživatelů byla úspěšně vymazána. Administrátorský účet ${adminEmail} zůstal zachován.`
  );
}

main().catch((error) => {
  console.error('Reset databáze selhal:', error);
  process.exitCode = 1;
});
