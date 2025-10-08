import { getDb } from '../../db.js';

export async function healthController(req, res) {
  const db = await getDb();
  const usersRow = await db.get('SELECT COUNT(*) as count FROM users');
  const threadsRow = await db.get('SELECT COUNT(*) as count FROM chat_threads');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    metrics: {
      users: Number(usersRow?.count || 0),
      chatThreads: Number(threadsRow?.count || 0)
    }
  });
}
