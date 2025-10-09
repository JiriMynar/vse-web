import { z } from 'zod';

import { getDb } from '../../db.js';
import { encryptSecret, decryptSecret } from '../lib/crypto.js';

const connectors = [
  {
    provider: 'vse-chat',
    name: 'VŠE Chat API',
    description: 'Propojení testovacího chatu přes vlastní API klíč.'
  }
];

const saveSchema = z.object({
  provider: z.string().trim().min(1, 'Identifikátor konektoru je povinný.'),
  apiKey: z.string().trim().min(1, 'API klíč je povinný.')
});

function getConnectorDefinition(provider) {
  return connectors.find((connector) => connector.provider === provider);
}

export async function listChatApiSettings(userId) {
  const db = await getDb();
  const stored = await db.all(
    'SELECT provider, key_preview, updated_at FROM chat_api_credentials WHERE user_id = ?',
    userId
  );
  const index = new Map(stored.map((row) => [row.provider, row]));
  return connectors.map((connector) => {
    const record = index.get(connector.provider);
    return {
      ...connector,
      hasKey: Boolean(record),
      keyPreview: record?.key_preview || null,
      updatedAt: record?.updated_at || null
    };
  });
}

export async function upsertChatApiKey(userId, payload) {
  const data = saveSchema.parse(payload || {});
  const connector = getConnectorDefinition(data.provider);
  if (!connector) {
    const error = new Error('Požadovaný konektor nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  const db = await getDb();
  const encryptedKey = encryptSecret(data.apiKey);
  const keyPreview = data.apiKey.slice(-4).padStart(Math.min(data.apiKey.length, 4), '•');

  const existing = await db.get(
    'SELECT id FROM chat_api_credentials WHERE user_id = ? AND provider = ?',
    userId,
    data.provider
  );

  if (existing) {
    await db.run(
      'UPDATE chat_api_credentials SET encrypted_key = ?, key_preview = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      encryptedKey,
      keyPreview,
      existing.id
    );
  } else {
    await db.run(
      'INSERT INTO chat_api_credentials (user_id, provider, encrypted_key, key_preview) VALUES (?, ?, ?, ?)',
      userId,
      data.provider,
      encryptedKey,
      keyPreview
    );
  }

  const record = await db.get(
    'SELECT provider, key_preview, updated_at FROM chat_api_credentials WHERE user_id = ? AND provider = ?',
    userId,
    data.provider
  );

  return {
    ...connector,
    hasKey: true,
    keyPreview: record?.key_preview || null,
    updatedAt: record?.updated_at || null
  };
}

export async function resolveChatApiCredential(userId) {
  const db = await getDb();
  const record = await db.get(
    'SELECT provider, encrypted_key FROM chat_api_credentials WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
    userId
  );

  if (!record?.provider || !record?.encrypted_key) {
    return null;
  }

  const connector = getConnectorDefinition(record.provider);
  if (!connector) {
    return null;
  }

  try {
    const apiKey = decryptSecret(record.encrypted_key);
    if (!apiKey) {
      return null;
    }

    return { provider: record.provider, apiKey };
  } catch (error) {
    console.error('Nepodařilo se dešifrovat uložený API klíč:', error.message);
    return null;
  }
}
