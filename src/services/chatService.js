import { z } from 'zod';

import { getDb } from '../../db.js';
import { getBotResponse } from '../../chatService.js';
import { resolveChatApiCredential } from './chatApiService.js';
import { emitEvent } from '../lib/eventBus.js';

const threadUpdateChannel = (userId) => `threads:${userId}`;
const messageChannel = (threadId) => `thread:${threadId}`;

const threadSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  is_favorite: z.boolean().optional()
});

const messageSchema = z.object({
  message: z.string().trim().min(1, 'Zpráva musí obsahovat text.'),
  threadId: z.number({ coerce: true }).optional()
});

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function generateThreadTitleFromMessage(message) {
  if (!message) {
    return 'Nová konverzace';
  }
  const normalized = normalizeWhitespace(message.split('\n').find((line) => line.trim()) || message);
  if (!normalized) {
    return 'Nová konverzace';
  }
  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return capitalized.length > 80 ? `${capitalized.slice(0, 77).trimEnd()}…` : capitalized;
}

async function getThreadSummary(db, threadId) {
  const row = await db.get(
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
    threadId
  );

  if (!row) {
    return null;
  }

  return { ...row, is_favorite: Boolean(row.is_favorite) };
}

export async function ensureDefaultThread(db, userId) {
  const existing = await db.get('SELECT id FROM chat_threads WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', userId);
  if (existing) {
    return existing.id;
  }

  const threadTitle = 'Nová konverzace';
  const result = await db.run('INSERT INTO chat_threads (user_id, title) VALUES (?, ?)', userId, threadTitle);
  await db.run(
    'UPDATE chat_messages SET thread_id = ? WHERE user_id = ? AND (thread_id IS NULL OR thread_id = "")',
    result.lastID,
    userId
  );
  return result.lastID;
}

export async function loadThreads(db, userId) {
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

export async function listThreads(userId) {
  const db = await getDb();
  const threads = await loadThreads(db, userId);
  const activeThreadId = threads[0]?.id || null;
  return { threads, activeThreadId };
}

export async function createThread(userId, payload = {}) {
  const db = await getDb();
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'Nová konverzace';
  const result = await db.run('INSERT INTO chat_threads (user_id, title) VALUES (?, ?)', userId, title);
  const [thread] = await loadThreads(db, userId).then((threads) => threads.filter((t) => t.id === result.lastID));
  emitEvent(threadUpdateChannel(userId), { type: 'thread-created', thread });
  return thread;
}

export async function updateThread(userId, threadId, payload) {
  const db = await getDb();
  const data = threadSchema.parse(payload || {});
  const thread = await db.get('SELECT * FROM chat_threads WHERE id = ? AND user_id = ?', threadId, userId);
  if (!thread) {
    const error = new Error('Vlákno nebylo nalezeno.');
    error.status = 404;
    throw error;
  }

  if (data.title) {
    await db.run('UPDATE chat_threads SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', data.title, threadId);
  }
  if (typeof data.is_favorite === 'boolean') {
    await db.run('UPDATE chat_threads SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', data.is_favorite ? 1 : 0, threadId);
  }

  const updatedThread = await getThreadSummary(db, threadId);
  if (!updatedThread) {
    const error = new Error('Vlákno nebylo nalezeno.');
    error.status = 404;
    throw error;
  }

  emitEvent(threadUpdateChannel(userId), { type: 'thread-updated', thread: updatedThread });
  return updatedThread;
}

export async function deleteThread(userId, threadId) {
  const db = await getDb();
  const thread = await db.get('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?', threadId, userId);
  if (!thread) {
    const error = new Error('Vlákno nebylo nalezeno.');
    error.status = 404;
    throw error;
  }

  await db.run('DELETE FROM chat_messages WHERE thread_id = ?', threadId);
  await db.run('DELETE FROM chat_threads WHERE id = ?', threadId);
  emitEvent(threadUpdateChannel(userId), { type: 'thread-deleted', threadId });
  return listThreads(userId);
}

export async function clearThread(userId, threadId) {
  const db = await getDb();
  const thread = await db.get('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?', threadId, userId);
  if (!thread) {
    const error = new Error('Vlákno nebylo nalezeno.');
    error.status = 404;
    throw error;
  }

  await db.run('DELETE FROM chat_messages WHERE thread_id = ?', threadId);
  await db.run('UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', threadId);
  emitEvent(messageChannel(threadId), { type: 'messages-cleared', threadId });
}

export async function deleteAll(userId) {
  const db = await getDb();
  await db.run('DELETE FROM chat_messages WHERE user_id = ?', userId);
  await db.run('DELETE FROM chat_threads WHERE user_id = ?', userId);
  const threadId = await ensureDefaultThread(db, userId);
  emitEvent(threadUpdateChannel(userId), { type: 'threads-reset' });
  return threadId;
}

export async function listMessages(userId, threadId) {
  const db = await getDb();
  const threads = await loadThreads(db, userId);
  const requestedThreadId = threadId || threads[0]?.id;
  if (!requestedThreadId) {
    return { messages: [], threadId: null };
  }

  const thread = threads.find((t) => t.id === requestedThreadId);
  if (!thread) {
    const error = new Error('Vlákno nebylo nalezeno.');
    error.status = 404;
    throw error;
  }

  const messages = await db.all(
    'SELECT id, role, content, created_at FROM chat_messages WHERE user_id = ? AND thread_id = ? ORDER BY id ASC',
    userId,
    requestedThreadId
  );
  return { messages, threadId: requestedThreadId };
}

export async function createMessage(userId, payload) {
  const { message, threadId } = messageSchema.parse(payload || {});
  const db = await getDb();
  let resolvedThreadId = threadId;
  if (!resolvedThreadId) {
    resolvedThreadId = await ensureDefaultThread(db, userId);
  }

  const thread = await db.get('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?', resolvedThreadId, userId);
  if (!thread) {
    const error = new Error('Vlákno nebylo nalezeno.');
    error.status = 404;
    throw error;
  }

  const { count } = await db.get(
    'SELECT COUNT(*) AS count FROM chat_messages WHERE thread_id = ?',
    resolvedThreadId
  );
  const existingMessagesCount = Number(count ?? 0);

  const userInsert = await db.run(
    'INSERT INTO chat_messages (user_id, thread_id, role, content) VALUES (?, ?, ?, ?)',
    userId,
    resolvedThreadId,
    'user',
    message
  );

  const userMessage = await db.get(
    'SELECT id, role, content, created_at FROM chat_messages WHERE id = ?',
    userInsert.lastID
  );

  if (userMessage) {
    emitEvent(messageChannel(resolvedThreadId), {
      type: 'message-created',
      threadId: resolvedThreadId,
      message: userMessage
    });
  }

  if (existingMessagesCount === 0) {
    const newTitle = generateThreadTitleFromMessage(message);
    await db.run('UPDATE chat_threads SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', newTitle, resolvedThreadId);
    const updatedThread = await getThreadSummary(db, resolvedThreadId);
    if (updatedThread) {
      emitEvent(threadUpdateChannel(userId), { type: 'thread-updated', thread: updatedThread });
    }
  }

  const credential = await resolveChatApiCredential(userId);
  const reply = await getBotResponse(message, {
    apiKey: credential?.apiKey,
    provider: credential?.provider,
    config: credential?.config
  });
  const assistantInsert = await db.run(
    'INSERT INTO chat_messages (user_id, thread_id, role, content) VALUES (?, ?, ?, ?)',
    userId,
    resolvedThreadId,
    'assistant',
    reply
  );
  await db.run('UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', resolvedThreadId);

  const assistantMessage = await db.get(
    'SELECT id, role, content, created_at FROM chat_messages WHERE id = ?',
    assistantInsert.lastID
  );

  if (assistantMessage) {
    emitEvent(messageChannel(resolvedThreadId), {
      type: 'message-created',
      threadId: resolvedThreadId,
      message: assistantMessage
    });
  }
  emitEvent(threadUpdateChannel(userId), { type: 'thread-activity', threadId: resolvedThreadId });

  return { reply, threadId: resolvedThreadId };
}

export { threadUpdateChannel, messageChannel };
