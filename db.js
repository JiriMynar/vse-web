import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { ensureWritableDir } from './pathUtils.js';

const dataDir = ensureWritableDir({
  envVar: 'DATA_DIR',
  defaultSubdir: 'data',
  requireEnv: true,
  purpose: 'databázi'
});

const dbPromise = open({
  filename: path.join(dataDir, 'app.db'),
  driver: sqlite3.Database
});

const migrations = [
  {
    version: 1,
    async up(db) {
      await db.exec('PRAGMA foreign_keys = ON;');
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

      await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);');
    }
  },
  {
    version: 2,
    async up(db) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT DEFAULT 'chat',
          status TEXT DEFAULT 'draft',
          color TEXT DEFAULT '#2F80ED',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(owner_id) REFERENCES users(id)
        );
      `);

      await db.exec(`
        CREATE TABLE IF NOT EXISTS project_members (
          project_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT DEFAULT 'editor',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(project_id, user_id),
          FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await db.exec('CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);');

    }
  },
  {
    version: 3,
    async up(db) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          replaced_by TEXT,
          revoked_at DATETIME,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await db.exec('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);');
    }
  },
  {
    version: 4,
    async up(db) {
      const columns = await db.all('PRAGMA table_info(users);');
      const hasIsAdmin = columns.some((column) => column.name === 'is_admin');
      if (!hasIsAdmin) {
        await db.exec(
          "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1));"
        );
      }
    }
  },
  {
    version: 5,
    async up(db) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS chat_api_credentials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          provider TEXT NOT NULL,
          encrypted_key TEXT NOT NULL,
          encrypted_config TEXT,
          is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
          key_preview TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, provider),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      `);

      await db.exec(
        'CREATE INDEX IF NOT EXISTS idx_chat_api_credentials_user ON chat_api_credentials(user_id)'
      );
    }
  },
  {
    version: 6,
    async up(db) {
      const columns = await db.all('PRAGMA table_info(chat_api_credentials);');
      const hasEncryptedConfig = columns.some((column) => column.name === 'encrypted_config');
      const hasIsActive = columns.some((column) => column.name === 'is_active');

      if (!hasEncryptedConfig) {
        await db.exec('ALTER TABLE chat_api_credentials ADD COLUMN encrypted_config TEXT;');
      }

      if (!hasIsActive) {
        await db.exec(
          'ALTER TABLE chat_api_credentials ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1));'
        );
      }

      await db.exec("UPDATE chat_api_credentials SET provider = 'openai-chat' WHERE provider = 'vse-chat'");

      if (!hasIsActive) {
        await db.exec(`
          UPDATE chat_api_credentials
          SET is_active = 1
          WHERE id IN (
            SELECT c.id
            FROM chat_api_credentials c
            WHERE c.updated_at = (
              SELECT MAX(updated_at)
              FROM chat_api_credentials c2
              WHERE c2.user_id = c.user_id
            )
          );
        `);
      }
    }
  }
];

async function migrate(db) {
  const [{ user_version: userVersion }] = await db.all('PRAGMA user_version;');

  for (const migration of migrations) {
    if (userVersion < migration.version) {
      await migration.up(db);
      await db.exec(`PRAGMA user_version = ${migration.version};`);
    }
  }
}

async function init() {
  const db = await dbPromise;
  await db.exec('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

export async function getDb() {
  return init();
}
