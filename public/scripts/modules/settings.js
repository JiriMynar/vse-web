import { state, STORAGE_KEYS, DEFAULTS } from '../state.js';
import { apiFetch } from './api.js';

function applyPreferences(preferences = {}) {
  const theme = preferences.theme === 'light' ? 'light' : preferences.theme === 'dark' ? 'dark' : DEFAULTS.theme;
  const enterToSend = typeof preferences.enterToSend === 'boolean' ? preferences.enterToSend : false;

  state.theme = theme;
  state.enterToSend = enterToSend;

  localStorage.setItem(STORAGE_KEYS.theme, theme);
  localStorage.setItem(STORAGE_KEYS.enterToSend, String(enterToSend));
}

function applyAgentkit(config = {}) {
  state.agentkit.workflowId = config.workflowId || '';
  state.agentkit.openaiApiKey = config.openaiApiKey || '';
  state.agentkit.chatkitApiBase = config.chatkitApiBase || '';

  localStorage.setItem(STORAGE_KEYS.agentkitWorkflow, state.agentkit.workflowId);
  localStorage.setItem(STORAGE_KEYS.agentkitOpenaiKey, state.agentkit.openaiApiKey);

  if (state.agentkit.chatkitApiBase) {
    localStorage.setItem(STORAGE_KEYS.agentkitChatkitBase, state.agentkit.chatkitApiBase);
  } else {
    localStorage.removeItem(STORAGE_KEYS.agentkitChatkitBase);
  }
}

export async function fetchUserSettings() {
  const data = await apiFetch('/api/users/me/settings');
  applyPreferences(data?.preferences || {});
  applyAgentkit(data?.agentkit || {});
  return data;
}

export async function updateUserPreferences(patch = {}) {
  const payload = {};
  if (patch.theme === 'dark' || patch.theme === 'light') {
    payload.theme = patch.theme;
  }
  if (typeof patch.enterToSend === 'boolean') {
    payload.enterToSend = patch.enterToSend;
  }

  if (!Object.keys(payload).length) {
    return;
  }

  const response = await apiFetch('/api/users/me/settings', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (response?.preferences) {
    applyPreferences(response.preferences);
  } else {
    applyPreferences(payload);
  }
}

export async function saveAgentkitSettings(config = {}) {
  const payload = {
    workflowId: typeof config.workflowId === 'string' ? config.workflowId : '',
    openaiApiKey: typeof config.openaiApiKey === 'string' ? config.openaiApiKey : '',
    chatkitApiBase: typeof config.chatkitApiBase === 'string' ? config.chatkitApiBase : ''
  };

  const response = await apiFetch('/api/users/me/agentkit', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (response?.agentkit) {
    applyAgentkit(response.agentkit);
    return response.agentkit;
  }

  applyAgentkit(payload);
  return payload;
}
