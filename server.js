import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

import { getDb } from './db.js';
import { authMiddleware, signToken, attachTokenCookie, clearTokenCookie } from './auth.js';
import { getBotResponse } from './chatService.js';
import { logger } from './logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Prosím vyplňte jméno, e-mail a heslo.' });
  }

  const db = await getDb();

  const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Uživatel s tímto e-mailem již existuje.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', email.toLowerCase(), passwordHash, name.trim());

  logger.info(`Registrace nového uživatele: ${email.toLowerCase()}`);

  const token = signToken({ id: result.lastID, email: email.toLowerCase(), name: name.trim() });
  attachTokenCookie(res, token);

  res.status(201).json({ message: 'Registrace proběhla úspěšně.', user: { id: result.lastID, email: email.toLowerCase(), name: name.trim() } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Zadejte e-mail a heslo.' });
  }

  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Nesprávné přihlašovací údaje.' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Nesprávné přihlašovací údaje.' });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  attachTokenCookie(res, token);

  res.json({ message: 'Přihlášení proběhlo úspěšně.', user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Byli jste odhlášeni.' });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = await db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', req.user.id);
  res.json({ user });
});

async function ensureDefaultThread(db, userId) {
  const existing = await db.get('SELECT id FROM chat_threads WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', userId);
  if (existing) {
    return existing.id;
  }

  const threadTitle = 'Nová konverzace';
  const result = await db.run('INSERT INTO chat_threads (user_id, title) VALUES (?, ?)', userId, threadTitle);

  await db.run('UPDATE chat_messages SET thread_id = ? WHERE user_id = ? AND (thread_id IS NULL OR thread_id = "")', result.lastID, userId);

  return result.lastID;
}

async function loadThreads(db, userId) {
  await ensureDefaultThread(db, userId);

  const threads = await db.all(
    `SELECT
        t.id,
        t.title,
        t.created_at,
        t.updated_at,
        t.is_favorite,
        COALESCE((SELECT created_at FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1), t.updated_at) AS last_activity,
        (SELECT role FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_role,
        (SELECT content FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*) FROM chat_messages WHERE thread_id = t.id) AS message_count
      FROM chat_threads t
      WHERE t.user_id = ?
      ORDER BY t.is_favorite DESC, last_activity DESC, t.id DESC
    `,
    userId
  );

  return threads.map((thread) => ({
    ...thread,
    is_favorite: Boolean(thread.is_favorite)
  }));
}

async function touchThread(db, threadId) {
  await db.run('UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', threadId);
}

app.get('/api/chat/threads', authMiddleware, async (req, res) => {
  const db = await getDb();
  const threads = await loadThreads(db, req.user.id);
  const activeThreadId = threads[0]?.id || null;
  res.json({ threads, activeThreadId });
});

app.post('/api/chat/threads', authMiddleware, async (req, res) => {
  const { title } = req.body || {};
  const db = await getDb();

  const baseTitle = title && title.trim() ? title.trim() : 'Nová konverzace';

  const result = await db.run('INSERT INTO chat_threads (user_id, title) VALUES (?, ?)', req.user.id, baseTitle);
  const [thread] = await loadThreads(db, req.user.id).then((threads) => threads.filter((t) => t.id === result.lastID));

  res.status(201).json({ thread });
});

app.patch('/api/chat/threads/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, is_favorite } = req.body || {};
  const db = await getDb();

  const thread = await db.get('SELECT * FROM chat_threads WHERE id = ? AND user_id = ?', id, req.user.id);
  if (!thread) {
    return res.status(404).json({ message: 'Vlákno nebylo nalezeno.' });
  }

  if (typeof title === 'string' && title.trim()) {
    await db.run('UPDATE chat_threads SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', title.trim(), id);
  }

  if (typeof is_favorite === 'boolean') {
    await db.run('UPDATE chat_threads SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', is_favorite ? 1 : 0, id);
  }

  const updatedThread = await db.get(
    `SELECT
        t.id,
        t.title,
        t.created_at,
        t.updated_at,
        t.is_favorite,
        COALESCE((SELECT created_at FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1), t.updated_at) AS last_activity,
        (SELECT role FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_role,
        (SELECT content FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*) FROM chat_messages WHERE thread_id = t.id) AS message_count
      FROM chat_threads t
      WHERE t.id = ?
    `,
    id
  );

  res.json({ thread: { ...updatedThread, is_favorite: Boolean(updatedThread.is_favorite) } });
});

app.delete('/api/chat/threads/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();

  const thread = await db.get('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?', id, req.user.id);
  if (!thread) {
    return res.status(404).json({ message: 'Vlákno nebylo nalezeno.' });
  }

  await db.run('DELETE FROM chat_messages WHERE thread_id = ?', id);
  await db.run('DELETE FROM chat_threads WHERE id = ?', id);

  const threads = await loadThreads(db, req.user.id);
  const activeThreadId = threads[0]?.id || null;

  res.json({ message: 'Vlákno bylo odstraněno.', threads, activeThreadId });
});

app.delete('/api/chat/threads/:id/messages', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();

  const thread = await db.get('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?', id, req.user.id);
  if (!thread) {
    return res.status(404).json({ message: 'Vlákno nebylo nalezeno.' });
  }

  await db.run('DELETE FROM chat_messages WHERE thread_id = ?', id);
  await touchThread(db, id);

  res.json({ message: 'Historie vlákna byla vymazána.' });
});

app.get('/api/chat/history', authMiddleware, async (req, res) => {
  const { threadId } = req.query;
  const db = await getDb();

  const threads = await loadThreads(db, req.user.id);
  const requestedThreadId = threadId ? Number(threadId) : threads[0]?.id;

  if (!requestedThreadId) {
    return res.json({ messages: [], threadId: null });
  }

  const thread = threads.find((t) => t.id === requestedThreadId);
  if (!thread) {
    return res.status(404).json({ message: 'Vlákno nebylo nalezeno.' });
  }

  const messages = await db.all(
    'SELECT id, role, content, created_at FROM chat_messages WHERE user_id = ? AND thread_id = ? ORDER BY id ASC',
    req.user.id,
    requestedThreadId
  );

  res.json({ messages, threadId: requestedThreadId });
});

app.delete('/api/chat/history', authMiddleware, async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM chat_messages WHERE user_id = ?', req.user.id);
  await db.run('DELETE FROM chat_threads WHERE user_id = ?', req.user.id);
  await ensureDefaultThread(db, req.user.id);
  res.json({ message: 'Veškerá historie byla vymazána.' });
});

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, threadId } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Zpráva musí obsahovat text.' });
  }

  const db = await getDb();

  let resolvedThreadId = Number(threadId);
  if (!resolvedThreadId) {
    resolvedThreadId = await ensureDefaultThread(db, req.user.id);
  }

  const thread = await db.get('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?', resolvedThreadId, req.user.id);
  if (!thread) {
    return res.status(404).json({ message: 'Vlákno nebylo nalezeno.' });
  }

  await db.run(
    'INSERT INTO chat_messages (user_id, thread_id, role, content) VALUES (?, ?, ?, ?)',
    req.user.id,
    resolvedThreadId,
    'user',
    message.trim()
  );

  const reply = await getBotResponse(message.trim());
  await db.run(
    'INSERT INTO chat_messages (user_id, thread_id, role, content) VALUES (?, ?, ?, ?)',
    req.user.id,
    resolvedThreadId,
    'assistant',
    reply
  );

  await touchThread(db, resolvedThreadId);

  const updatedThread = await db.get('SELECT updated_at FROM chat_threads WHERE id = ?', resolvedThreadId);

  res.json({ reply, threadId: resolvedThreadId, updated_at: updatedThread?.updated_at });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Něco se pokazilo.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(port, () => {
  logger.info(`Server naslouchá na portu ${port}`);
});
