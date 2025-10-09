import {
  listThreads,
  createThread,
  updateThread,
  deleteThread,
  clearThread,
  deleteAll,
  listMessages,
  createMessage,
  threadUpdateChannel,
  messageChannel
} from '../services/chatService.js';
import { subscribe } from '../lib/eventBus.js';
import { listChatApiSettings, upsertChatApiKey } from '../services/chatApiService.js';

export async function listThreadsController(req, res, next) {
  try {
    const payload = await listThreads(req.user.id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createThreadController(req, res, next) {
  try {
    const thread = await createThread(req.user.id, req.body);
    res.status(201).json({ thread });
  } catch (error) {
    next(error);
  }
}

export async function updateThreadController(req, res, next) {
  try {
    const thread = await updateThread(req.user.id, Number(req.params.id), req.body);
    res.json({ thread });
  } catch (error) {
    next(error);
  }
}

export async function deleteThreadController(req, res, next) {
  try {
    const { threads, activeThreadId } = await deleteThread(req.user.id, Number(req.params.id));
    res.json({ message: 'Vlákno bylo odstraněno.', threads, activeThreadId });
  } catch (error) {
    next(error);
  }
}

export async function clearThreadController(req, res, next) {
  try {
    await clearThread(req.user.id, Number(req.params.id));
    res.json({ message: 'Historie vlákna byla vymazána.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAllController(req, res, next) {
  try {
    const threadId = await deleteAll(req.user.id);
    res.json({ message: 'Veškerá historie byla vymazána.', threadId });
  } catch (error) {
    next(error);
  }
}

export async function listMessagesController(req, res, next) {
  try {
    const threadId = req.query.threadId ? Number(req.query.threadId) : undefined;
    const payload = await listMessages(req.user.id, threadId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createMessageController(req, res, next) {
  try {
    const payload = await createMessage(req.user.id, req.body);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function listChatApiSettingsController(req, res, next) {
  try {
    const connectors = await listChatApiSettings(req.user.id);
    res.json({ connectors });
  } catch (error) {
    next(error);
  }
}

export async function upsertChatApiKeyController(req, res, next) {
  try {
    const result = await upsertChatApiKey(req.user.id, req.body);
    res.json({
      message: result.message || 'Nastavení konektoru bylo uloženo.',
      connector: result.connector,
      connectors: result.connectors
    });
  } catch (error) {
    next(error);
  }
}

export function streamThreadsController(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  });
  res.flushHeaders?.();

  const unsubscribe = subscribe(threadUpdateChannel(req.user.id), (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
}

export function streamMessagesController(req, res) {
  const threadId = Number(req.params.id);
  res.set({
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  });
  res.flushHeaders?.();

  const unsubscribe = subscribe(messageChannel(threadId), (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
}
