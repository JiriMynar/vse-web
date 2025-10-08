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
    CREATE TABLE IF NOT EXISTS chat_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_favorite INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      thread_id INTEGER,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
    );
  `);

  const columns = await db.all('PRAGMA table_info(chat_messages);');
  const hasThreadColumn = columns.some((column) => column.name === 'thread_id');
  if (!hasThreadColumn) {
    await db.exec('ALTER TABLE chat_messages ADD COLUMN thread_id INTEGER REFERENCES chat_threads(id);');
  }

  return db;
}

export async function getDb() {
  return init();
}
