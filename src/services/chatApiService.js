import { z } from 'zod';

import { getDb } from '../../db.js';
import { encryptSecret, decryptSecret } from '../lib/crypto.js';

const connectors = [
  {
    provider: 'openai-chat',
    name: 'OpenAI ChatGPT',
    description: 'Napojení na rozhraní OpenAI Chat Completions s možností výběru modelu a vlastní URL.',
    fields: [
      {
        name: 'apiKey',
        label: 'API klíč',
        placeholder: 'sk-…',
        required: true,
        secret: true,
        hint: 'Klíč je uložen šifrovaně a nebude nikdy zobrazen v plné podobě.'
      },
      {
        name: 'model',
        label: 'Model (volitelné)',
        placeholder: 'gpt-4o-mini',
        defaultValue: 'gpt-4o-mini',
        hint: 'Pokud pole necháte prázdné, použije se výchozí model gpt-4o-mini.'
      },
      {
        name: 'apiUrl',
        label: 'Vlastní API URL',
        placeholder: 'https://api.openai.com/v1/chat/completions',
        type: 'url',
        hint: 'Nechte prázdné pro standardní OpenAI endpoint.'
      }
    ]
  },
  {
    provider: 'ai-foundry',
    name: 'AI Foundry Agent',
    description: 'Připojení na agenty v AI Foundry pomocí REST API.',
    fields: [
      {
        name: 'apiKey',
        label: 'API klíč',
        placeholder: 'Vaše Foundry tokeny…',
        required: true,
        secret: true,
        hint: 'Klíč je šifrován a používá se pouze pro komunikaci s Foundry API.'
      },
      {
        name: 'baseUrl',
        label: 'Základní URL',
        placeholder: 'https://api.aifoundry.com',
        type: 'url',
        defaultValue: 'https://api.aifoundry.com',
        hint: 'Vložte vlastní hostitele pouze pokud používáte privátní Foundry deployment.'
      },
      {
        name: 'agentId',
        label: 'ID agenta',
        placeholder: 'agent_12345',
        required: true,
        hint: 'Najdete jej v detailu agenta ve vašem AI Foundry workspace.'
      }
    ]
  }
];

const baseSaveSchema = z
  .object({
    provider: z.string().trim().min(1, 'Identifikátor konektoru je povinný.'),
    isActive: z.boolean().optional()
  })
  .passthrough();

function getConnectorDefinition(provider) {
  return connectors.find((connector) => connector.provider === provider);
}

function fieldLabel(field) {
  return field.label || field.name;
}

function cloneFields(fields = []) {
  return fields.map((field) => ({ ...field }));
}

function applyConnectorDefaults(connector, config = {}) {
  const result = { ...config };
  for (const field of connector.fields || []) {
    if (result[field.name] === undefined && field.defaultValue !== undefined) {
      result[field.name] = field.defaultValue;
    }
  }
  return result;
}

function parseConnectorConfig(record) {
  if (!record) {
    return {};
  }

  const config = {};

  if (record.encrypted_config) {
    try {
      const decrypted = decryptSecret(record.encrypted_config);
      if (decrypted) {
        Object.assign(config, JSON.parse(decrypted));
      }
    } catch (error) {
      console.error('Nepodařilo se načíst konfiguraci konektoru:', error.message);
    }
  }

  if (!config.apiKey && record.encrypted_key) {
    try {
      const apiKey = decryptSecret(record.encrypted_key);
      if (apiKey) {
        config.apiKey = apiKey;
      }
    } catch (error) {
      console.error('Nepodařilo se dešifrovat uložený API klíč konektoru:', error.message);
    }
  }

  return config;
}

function maskSecretFields(connector, config = {}) {
  const safeConfig = {};
  for (const field of connector.fields || []) {
    if (field.secret) {
      continue;
    }
    if (config[field.name] !== undefined) {
      safeConfig[field.name] = config[field.name];
    }
  }
  return safeConfig;
}

function hasSecretConfigured(connector, config = {}) {
  return Boolean((connector.fields || []).find((field) => field.secret && config[field.name]));
}

function formatConnectorPayload(connector, record) {
  const rawConfig = applyConnectorDefaults(connector, parseConnectorConfig(record));
  return {
    provider: connector.provider,
    name: connector.name,
    description: connector.description,
    fields: cloneFields(connector.fields),
    hasKey: hasSecretConfigured(connector, rawConfig),
    keyPreview: record?.key_preview || null,
    updatedAt: record?.updated_at || null,
    isActive: Boolean(record?.is_active),
    config: maskSecretFields(connector, rawConfig)
  };
}

async function fetchConnectorRows(db, userId) {
  return db.all(
    `SELECT provider, encrypted_key, encrypted_config, key_preview, updated_at, is_active
     FROM chat_api_credentials
     WHERE user_id = ?`,
    userId
  );
}

export async function listChatApiSettings(userId) {
  const db = await getDb();
  const rows = await fetchConnectorRows(db, userId);
  const index = new Map(rows.map((row) => [row.provider, row]));
  return connectors.map((connector) => formatConnectorPayload(connector, index.get(connector.provider)));
}

export async function upsertChatApiKey(userId, payload) {
  const data = baseSaveSchema.parse(payload || {});
  const connector = getConnectorDefinition(data.provider);
  if (!connector) {
    const error = new Error('Požadovaný konektor nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  const db = await getDb();
  const existing = await db.get(
    `SELECT id, encrypted_key, encrypted_config, key_preview, is_active
     FROM chat_api_credentials
     WHERE user_id = ? AND provider = ?`,
    userId,
    data.provider
  );

  const existingConfig = applyConnectorDefaults(connector, parseConnectorConfig(existing));
  const config = { ...existingConfig };
  const fields = connector.fields || [];

  for (const field of fields) {
    if (!(field.name in data)) {
      continue;
    }

    const rawValue = data[field.name];
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) {
        if (field.secret) {
          if (!existingConfig[field.name]) {
            const error = new Error(`${fieldLabel(field)} je povinné.`);
            error.status = 400;
            throw error;
          }
          continue;
        }
        if (field.required && !existingConfig[field.name]) {
          const error = new Error(`${fieldLabel(field)} je povinné.`);
          error.status = 400;
          throw error;
        }
        delete config[field.name];
        continue;
      }

      if (field.type === 'url') {
        try {
          new URL(trimmed);
        } catch (error) {
          const validationError = new Error(`${fieldLabel(field)} musí být platná URL.`);
          validationError.status = 400;
          throw validationError;
        }
      }

      config[field.name] = trimmed;
      continue;
    }

    if (rawValue !== undefined && rawValue !== null) {
      config[field.name] = rawValue;
    }
  }

  const isNewRecord = !existing;
  if (isNewRecord) {
    for (const field of fields) {
      if (config[field.name] === undefined && field.defaultValue !== undefined) {
        config[field.name] = field.defaultValue;
      }
    }
  }

  for (const field of fields) {
    if (field.required && (config[field.name] === undefined || config[field.name] === '')) {
      const error = new Error(`${fieldLabel(field)} je povinné.`);
      error.status = 400;
      throw error;
    }
  }

  const secretField = fields.find((field) => field.secret);
  const secretValue = secretField ? config[secretField.name] : '';

  if (secretField && !secretValue) {
    const error = new Error(`${fieldLabel(secretField)} je povinné.`);
    error.status = 400;
    throw error;
  }

  const encryptedKey = encryptSecret(secretValue || '');
  const encryptedConfig = encryptSecret(JSON.stringify(config));
  const keyPreview = secretValue
    ? secretValue.slice(-4).padStart(Math.min(secretValue.length, 4), '•')
    : null;

  let nextIsActive = existing ? existing.is_active : 0;
  if (typeof data.isActive === 'boolean') {
    nextIsActive = data.isActive ? 1 : 0;
  }

  if (nextIsActive === 1 && !secretValue) {
    const error = new Error('Aktivní konektor musí mít platný API klíč.');
    error.status = 400;
    throw error;
  }

  if (nextIsActive === 1) {
    await db.run('UPDATE chat_api_credentials SET is_active = 0 WHERE user_id = ?', userId);
  }

  if (existing) {
    await db.run(
      `UPDATE chat_api_credentials
       SET encrypted_key = ?, encrypted_config = ?, key_preview = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      encryptedKey,
      encryptedConfig,
      keyPreview,
      nextIsActive,
      existing.id
    );
  } else {
    await db.run(
      `INSERT INTO chat_api_credentials (user_id, provider, encrypted_key, encrypted_config, key_preview, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      userId,
      data.provider,
      encryptedKey,
      encryptedConfig,
      keyPreview,
      nextIsActive
    );
  }

  const rows = await fetchConnectorRows(db, userId);
  const formatted = connectors.map((definition) =>
    formatConnectorPayload(definition, rows.find((row) => row.provider === definition.provider))
  );
  const updatedConnector = formatted.find((item) => item.provider === data.provider);

  return {
    message: nextIsActive ? 'Aktivní konektor byl aktualizován.' : 'Nastavení konektoru bylo uloženo.',
    connector: updatedConnector,
    connectors: formatted
  };
}

export async function resolveChatApiCredential(userId) {
  const db = await getDb();
  let record = await db.get(
    `SELECT provider, encrypted_key, encrypted_config
     FROM chat_api_credentials
     WHERE user_id = ? AND is_active = 1
     ORDER BY updated_at DESC
     LIMIT 1`,
    userId
  );

  if (!record) {
    record = await db.get(
      `SELECT provider, encrypted_key, encrypted_config
       FROM chat_api_credentials
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      userId
    );
  }

  if (!record?.provider) {
    return null;
  }

  const connector = getConnectorDefinition(record.provider);
  if (!connector) {
    return null;
  }

  const config = applyConnectorDefaults(connector, parseConnectorConfig(record));
  const apiKey = config.apiKey;

  if (!apiKey) {
    return null;
  }

  return { provider: record.provider, apiKey, config };
}

export { connectors };
