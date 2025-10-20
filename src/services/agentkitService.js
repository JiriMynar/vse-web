import { z, ZodError } from 'zod';

import { logger } from '../../logger.js';

const DEFAULT_CHATKIT_BASE = (process.env.AGENTKIT_DEFAULT_BASE || 'https://api.openai.com/v1/chatkit')
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
    .url('Volitelná základní URL musí být platná URL (např. https://api.openai.com/v1/chatkit).')
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
  const sessionUrl = baseUrl.endsWith('/sessions') ? baseUrl : `${baseUrl}/sessions`;

  // Use payload values if available, otherwise fallback to environment variables
  const finalWorkflowId = data.workflowId || process.env.AGENTKIT_WORKFLOW_ID;
  const finalOpenaiApiKey = data.openaiApiKey || process.env.OPENAI_API_KEY;

  if (!finalWorkflowId || !finalOpenaiApiKey) {
    const err = new Error("Konfigurace Agentkit není kompletní. Chybí Workflow ID nebo OpenAI API klíč.");
    err.status = 400;
    throw err;
  }

  let response;
  try {
    response = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${finalOpenaiApiKey}`,
        'OpenAI-Beta': 'chatkit_beta=v1'
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

