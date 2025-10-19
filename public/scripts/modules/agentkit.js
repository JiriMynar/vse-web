import { state, STORAGE_KEYS, DEFAULTS } from '../state.js';
import { toggleVisibility, setMessage } from '../utils/dom.js';
import { apiFetch } from './api.js';

let saveMessageTimeout = null;

function hasConfig() {
  return Boolean(state.agentkit.workflowId && state.agentkit.openaiApiKey);
}

function persistConfig(config) {
  localStorage.setItem(STORAGE_KEYS.agentkitWorkflow, config.workflowId);
  localStorage.setItem(STORAGE_KEYS.agentkitOpenaiKey, config.openaiApiKey);
  if (config.chatkitApiBase) {
    localStorage.setItem(STORAGE_KEYS.agentkitChatkitBase, config.chatkitApiBase);
  } else {
    localStorage.removeItem(STORAGE_KEYS.agentkitChatkitBase);
  }
}

function getAdapter() {
  if (window.ChatKitUI?.createChat) {
    return window.ChatKitUI;
  }
  if (window.ChatKit?.createChat) {
    return window.ChatKit;
  }
  throw new Error('Nebyl nalezen Agentkit UI adaptér.');
}

async function loadAgentkitScript(baseUrl) {
  if (state.agentkit.scriptPromise) {
    return state.agentkit.scriptPromise;
  }
  const normalized = (baseUrl || DEFAULTS.chatkitBase).replace(/\/$/, '');
  const src = `${normalized}/ui.js`;
  state.agentkit.scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Nepodařilo se načíst Agentkit UI.'));
    document.head.appendChild(script);
  });
  return state.agentkit.scriptPromise;
}

async function requestClientSecret() {
  const workflowId = state.agentkit.workflowId?.trim();
  const apiKey = state.agentkit.openaiApiKey?.trim();
  const baseUrl = state.agentkit.chatkitApiBase?.trim();

  if (!workflowId || !apiKey) {
    throw new Error('Konfigurace Agentkit není kompletní.');
  }

  const body = {
    workflowId,
    openaiApiKey: apiKey,
    ...(baseUrl ? { chatkitApiBase: baseUrl } : {})
  };

  const payload = await apiFetch('/api/create-session', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (!payload?.client_secret?.value) {
    throw new Error('Server nevrátil client secret pro Agentkit.');
  }
  return payload.client_secret.value;
}

export function fillAgentkitSettingsForm(refs) {
  if (!refs.agentkitWorkflowInput || !refs.agentkitOpenaiKeyInput || !refs.agentkitChatkitBaseInput) return;
  refs.agentkitWorkflowInput.value = state.agentkit.workflowId || '';
  refs.agentkitOpenaiKeyInput.value = state.agentkit.openaiApiKey || '';
  refs.agentkitChatkitBaseInput.value = state.agentkit.chatkitApiBase || '';
}

export function showAgentkitSaveFeedback(refs, message) {
  const target = refs.agentkitSaveMessage;
  if (!target) return;
  if (saveMessageTimeout) {
    clearTimeout(saveMessageTimeout);
    saveMessageTimeout = null;
  }
  if (!message) {
    target.textContent = '';
    toggleVisibility(target, false);
    return;
  }
  target.textContent = message;
  toggleVisibility(target, true);
  saveMessageTimeout = window.setTimeout(() => {
    target.textContent = '';
    toggleVisibility(target, false);
  }, 3000);
}

export function teardownAgentkit(refs) {
  if (state.agentkit.unmount) {
    try {
      state.agentkit.unmount();
    } catch (error) {
      console.error('Agentkit unmount failed', error);
    }
  }
  state.agentkit.unmount = null;
  state.agentkit.instance = null;
  state.agentkit.isMounted = false;
  state.agentkit.scriptPromise = null;
  if (refs.agentkitChatContainer) {
    refs.agentkitChatContainer.innerHTML = '';
    toggleVisibility(refs.agentkitChatContainer, false);
  }
}

function setAgentkitStatus(refs, message, type = 'info') {
  setMessage(refs.agentkitMessage, message, type);
}

export function renderAgentkit(refs) {
  const isVisible = state.view === 'agentkit';
  toggleVisibility(refs.agentkitPlaceholder, isVisible && !hasConfig());
  if (!isVisible) {
    return;
  }
  if (!hasConfig()) {
    teardownAgentkit(refs);
    setAgentkitStatus(refs, 'Nejprve vyplňte workflow ID a OPENAI_API_KEY v nastavení.', 'info');
    return;
  }
  toggleVisibility(refs.agentkitChatContainer, true);
  setAgentkitStatus(refs, '');
  if (!state.agentkit.isMounted && !state.agentkit.isInitializing) {
    initializeAgentkitChat(refs);
  }
}

async function initializeAgentkitChat(refs, options = {}) {
  if (!refs.agentkitChatContainer) return;
  if (state.agentkit.isInitializing) return;
  const { force = false } = options;
  if (state.agentkit.isMounted && !force) {
    return;
  }

  state.agentkit.isInitializing = true;
  toggleVisibility(refs.agentkitPlaceholder, false);
  toggleVisibility(refs.agentkitChatContainer, true);
  setAgentkitStatus(refs, 'Inicializuji Agentkit chat…', 'info');

  try {
    if (!window.ChatKitUI && !window.ChatKit) {
      await loadAgentkitScript(state.agentkit.chatkitApiBase || DEFAULTS.chatkitBase);
    }

    const adapter = await getAdapter();
    const mountResult = await adapter.createChat({
      element: refs.agentkitChatContainer,
      workflowId: state.agentkit.workflowId,
      getClientSecret: requestClientSecret,
      apiKey: state.agentkit.openaiApiKey,
      apiBaseUrl: state.agentkit.chatkitApiBase || undefined
    });

    let unmountHandler = null;
    if (typeof mountResult === 'function') {
      unmountHandler = mountResult;
    } else if (mountResult && typeof mountResult.unmount === 'function') {
      unmountHandler = () => mountResult.unmount();
      state.agentkit.instance = mountResult;
    } else if (mountResult && typeof mountResult.destroy === 'function') {
      unmountHandler = () => mountResult.destroy();
      state.agentkit.instance = mountResult;
    } else if (window.ChatKitUI?.unmount) {
      unmountHandler = () => window.ChatKitUI.unmount(refs.agentkitChatContainer);
    } else if (window.ChatKit?.unmount) {
      unmountHandler = () => window.ChatKit.unmount(refs.agentkitChatContainer);
    }

    state.agentkit.unmount = unmountHandler;
    state.agentkit.isMounted = true;
    setAgentkitStatus(refs, '');
  } catch (error) {
    console.error('Agentkit chat initialization failed', error);
    const message = error instanceof Error ? error.message : 'Nepodařilo se načíst Agentkit chat.';
    setAgentkitStatus(refs, message, 'error');
    toggleVisibility(refs.agentkitChatContainer, false);
    state.agentkit.isMounted = false;
  } finally {
    state.agentkit.isInitializing = false;
  }
}

export function saveAgentkitConfig(refs) {
  const trimmedWorkflow = refs.agentkitWorkflowInput?.value.trim() || '';
  const trimmedApiKey = refs.agentkitOpenaiKeyInput?.value.trim() || '';
  const trimmedBase = refs.agentkitChatkitBaseInput?.value.trim() || '';

  state.agentkit.workflowId = trimmedWorkflow;
  state.agentkit.openaiApiKey = trimmedApiKey;
  state.agentkit.chatkitApiBase = trimmedBase;

  persistConfig(state.agentkit);
  showAgentkitSaveFeedback(refs, 'Konfigurace byla uložena.');
  fillAgentkitSettingsForm(refs);
  renderAgentkit(refs);

  if (!trimmedWorkflow || !trimmedApiKey) {
    teardownAgentkit(refs);
    return;
  }

  if (state.view === 'agentkit') {
    initializeAgentkitChat(refs, { force: true });
  }
}

export function initAgentkit(refs) {
  refs.agentkitSettingsButton?.addEventListener('click', () => {
    refs.agentkitSettingsDialog?.showModal();
  });

  refs.agentkitOpenSettingsButton?.addEventListener('click', () => {
    refs.agentkitSettingsDialog?.showModal();
  });

  if (refs.agentkitSettingsDialog) {
    const cancelButton = refs.agentkitSettingsDialog.querySelector('button[value="cancel"]');
    cancelButton?.addEventListener('click', () => {
      refs.agentkitSettingsDialog.returnValue = 'cancel';
      refs.agentkitSettingsDialog.close();
    });
    refs.agentkitSettingsDialog.addEventListener('close', () => {
      fillAgentkitSettingsForm(refs);
    });
  }

  refs.agentkitSettingsForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    refs.agentkitSettingsDialog.returnValue = 'confirm';
    refs.agentkitSettingsDialog.close();
    saveAgentkitConfig(refs);
  });

  fillAgentkitSettingsForm(refs);
}

export function resetAgentkitMessages(refs) {
  if (state.view !== 'agentkit') {
    setAgentkitStatus(refs, '');
    showAgentkitSaveFeedback(refs, '');
  }
}
