import { z } from 'zod';

import { getDb } from '../../db.js';
import { encryptSecret, decryptSecret } from '../lib/crypto.js';
import { logger } from '../../logger.js';

const preferenceSchema = z
  .object({
    theme: z.enum(['light', 'dark']).optional(),
    enterToSend: z.boolean().optional()
  })
  .partial();

const defaultPreferences = {
  theme: 'dark',
  enterToSend: false
};

const agentkitSchema = z
  .object({
    workflowId: z.string().trim().max(255).optional(),
    openaiApiKey: z.string().trim().max(4096).optional(),
    chatkitApiBase: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) => !value || /^https?:\/\//i.test(value),
        'Volitelná základní URL musí být platná URL (např. https://api.openai.com/v1/agentkit).'
      )
      .optional()
  })
  .partial();

const defaultAgentkitSettings = {
  workflowId: '',
  openaiApiKey: '',
  chatkitApiBase: ''
};

function applyPreferenceDefaults(preferences = {}) {
  const merged = {
    ...defaultPreferences,
    ...preferences
  };
  return {
    theme: merged.theme === 'light' ? 'light' : 'dark',
    enterToSend: Boolean(merged.enterToSend)
  };
}

function normalizeBaseUrl(value) {
  if (!value) {
    return '';
  }
  return value.replace(/\/$/, '');
}

export async function getUserPreferences(userId) {
  const db = await getDb();
  const row = await db.get('SELECT data FROM user_preferences WHERE user_id = ?', userId);
  if (!row?.data) {
    return { ...defaultPreferences };
  }

  let parsed = {};
  try {
    parsed = JSON.parse(row.data);
  } catch (error) {
    logger.warn(
      `Neplatná podoba uložených uživatelských preferencí, používám výchozí hodnoty: ${error.message}`
    );
  }

  const validated = preferenceSchema.safeParse(parsed);
  if (!validated.success) {
    return { ...defaultPreferences };
  }

  return applyPreferenceDefaults(validated.data);
}

export async function updateUserPreferences(userId, payload = {}) {
  const parsed = preferenceSchema.parse(payload || {});
  if (!Object.keys(parsed).length) {
    return getUserPreferences(userId);
  }

  const current = await getUserPreferences(userId);
  const updated = applyPreferenceDefaults({
    ...current,
    ...parsed
  });

  const db = await getDb();
  await db.run(
    `INSERT INTO user_preferences (user_id, data)
     VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
    userId,
    JSON.stringify(updated)
  );

  return updated;
}

export async function getAgentkitSettings(userId) {
  const db = await getDb();
  const row = await db.get(
    'SELECT workflow_id, api_base, encrypted_api_key FROM agentkit_settings WHERE user_id = ?',
    userId
  );

  if (!row) {
    return { ...defaultAgentkitSettings };
  }

  let apiKey = '';
  if (row.encrypted_api_key) {
    try {
      apiKey = decryptSecret(row.encrypted_api_key) || '';
    } catch (error) {
      logger.warn(`Nepodařilo se dešifrovat uložený Agentkit API klíč: ${error.message}`);
    }
  }

  return {
    workflowId: row.workflow_id || '',
    chatkitApiBase: row.api_base || '',
    openaiApiKey: apiKey
  };
}

export async function updateAgentkitSettings(userId, payload = {}) {
  const parsed = agentkitSchema.parse(payload || {});

  const workflowId = parsed.workflowId || '';
  const chatkitApiBase = normalizeBaseUrl(parsed.chatkitApiBase || '');
  const openaiApiKey = parsed.openaiApiKey || '';
  const encryptedKey = openaiApiKey ? encryptSecret(openaiApiKey) : null;

  const db = await getDb();
  await db.run(
    `INSERT INTO agentkit_settings (user_id, workflow_id, api_base, encrypted_api_key)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       workflow_id = excluded.workflow_id,
       api_base = excluded.api_base,
       encrypted_api_key = excluded.encrypted_api_key,
       updated_at = CURRENT_TIMESTAMP`,
    userId,
    workflowId || null,
    chatkitApiBase || null,
    encryptedKey
  );

  return getAgentkitSettings(userId);
}

export async function getUserSettings(userId) {
  const [preferences, agentkit] = await Promise.all([
    getUserPreferences(userId),
    getAgentkitSettings(userId)
  ]);

  return { preferences, agentkit };
}
