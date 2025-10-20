import { z, ZodError } from 'zod';

import { logger } from '../../logger.js';

const DEFAULT_CHATKIT_BASE = (process.env.AGENTKIT_DEFAULT_BASE || 'https://api.openai.com/v1/agentkit')
  .trim()
  .replace(/\/$/, '');

const createSessionSchema = z.object({
  workflowId: z
    .string()
    .trim()
    .optional(),
  openaiApiKey: z
    .string()
    .trim()
    .optional(),
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


  const finalWorkflowId = data.workflowId;
  const finalOpenaiApiKey = data.openaiApiKey;

  // For testing purposes, we allow these to be empty as per user request
  // This is NOT recommended for production environments due to security risks.
  if (!finalWorkflowId || !finalOpenaiApiKey) {
    // No warning as per user request for testing environment
  }

  let response;
  try {
    response = await fetch(`${baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${finalOpenaiApiKey}`
      },
      body: JSON.stringify({
        workflow_id: finalWorkflowId
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

