
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { ensureWritableDir } from './pathUtils.js';

const dataDir = ensureWritableDir({ envVar: 'DATA_DIR', defaultSubdir: 'data' });

const dbPromise = open({
  filename: path.join(dataDir, 'app.db'),
  driver: sqlite3.Database
});

async function init() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  return db;
}

export async function getDb() {
  return init();
}
