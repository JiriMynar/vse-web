import { z, ZodError } from 'zod';

import { logger } from '../../logger.js';

const DEFAULT_CHATKIT_BASE = (process.env.AGENTKIT_DEFAULT_BASE || 'https://api.openai.com/v1/agentkit')
  .trim()
  .replace(/\/$/, '');

const createSessionSchema = z.object({
  workflowId: z
    .string({ required_error: 'workflowId je povinný parametr.' })
    .trim()
    .min(1, 'workflowId je povinný parametr.'),
  openaiApiKey: z
    .string({ required_error: 'OPENAI_API_KEY je povinný parametr.' })
    .trim()
    .min(1, 'OPENAI_API_KEY je povinný parametr.'),
  chatkitApiBase: z
    .string()
    .trim()
    .url('Volitelná základní URL musí být platná URL (např. https://api.openai.com/v1/agentkit).')
    .optional()
});

function normalizeBaseUrl(value) {
  const trimmed = value ? value.trim() : '';
  return (trimmed || DEFAULT_CHATKIT_BASE).replace(/\/$/, '');
}

export async function createAgentkitSession(payload = {}) {
  let data;
  try {
    data = createSessionSchema.parse({
      ...payload,
      chatkitApiBase:
        typeof payload.chatkitApiBase === 'string' && payload.chatkitApiBase.trim().length > 0
          ? payload.chatkitApiBase
          : undefined
    });
  } catch (error) {
    if (error instanceof ZodError && error.issues.length) {
      const validationError = new Error(error.issues[0].message);
      validationError.status = 400;
      throw validationError;
    }
    throw error;
  }

  const baseUrl = normalizeBaseUrl(data.chatkitApiBase);

  let response;
  try {
    response = await fetch(`${baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.openaiApiKey}`
      },
      body: JSON.stringify({
        workflow_id: data.workflowId
      })
    });
  } catch (error) {
    logger.error(`Nepodařilo se kontaktovat Agentkit API: ${error.message}`);
    const err = new Error('Nepodařilo se kontaktovat Agentkit API.');
    err.status = 502;
    throw err;
  }

  const text = await response.text();

  if (!response.ok) {
    logger.warn(
      `Agentkit vrátil chybu ${response.status}: ${text.slice(0, 500)}`
    );
    const err = new Error('Vytvoření sezení se nezdařilo.');
    err.status = response.status;
    err.details = text;
    throw err;
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    logger.error('Agentkit odpověděl nevalidním JSONem.', error);
    const err = new Error('Odpověď služby Agentkit není validní JSON.');
    err.status = 502;
    err.details = text;
    throw err;
  }

  if (!json?.client_secret?.value) {
    const err = new Error('Odpověď služby Agentkit neobsahuje client secret.');
    err.status = 502;
    err.details = text;
    throw err;
  }

  return json;
}
