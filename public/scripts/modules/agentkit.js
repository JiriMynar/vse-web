import { state, DEFAULTS } from '../state.js';
import { toggleVisibility, setMessage } from '../utils/dom.js';
import { apiFetch } from './api.js';
import { saveAgentkitSettings as persistAgentkitSettings } from './settings.js';

let saveMessageTimeout = null;

function hasConfig() {
  const workflowId = state.agentkit.workflowId?.trim();
  const apiKey = state.agentkit.openaiApiKey?.trim();
  return Boolean(workflowId && apiKey);
}

function resetInputValidity(input) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  input.setCustomValidity('');
  input.removeAttribute('aria-invalid');
}

function flagInputInvalid(input, message) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  input.setCustomValidity(message);
  input.setAttribute('aria-invalid', 'true');
}

function validateAgentkitInputs(refs) {
  const workflowInput = refs.agentkitWorkflowInput;
  const apiKeyInput = refs.agentkitOpenaiKeyInput;
  const baseInput = refs.agentkitChatkitBaseInput;

  const invalidFields = [];

  resetInputValidity(workflowInput);
  resetInputValidity(apiKeyInput);
  resetInputValidity(baseInput);

  if (workflowInput) {
    const value = workflowInput.value.trim();
    if (!value) {
      flagInputInvalid(workflowInput, 'Zadejte Workflow ID.');
      invalidFields.push(workflowInput);
    }
  }

  if (apiKeyInput) {
    const value = apiKeyInput.value.trim();
    if (!value) {
      flagInputInvalid(apiKeyInput, 'Zadejte OpenAI API klíč.');
      invalidFields.push(apiKeyInput);
    }
  }

  if (baseInput) {
    const value = baseInput.value.trim();
    if (value) {
      try {
        new URL(value);
      } catch (error) {
        flagInputInvalid(
          baseInput,
          'Základní URL musí být ve tvaru https://example.com/path.'
        );
        invalidFields.push(baseInput);
      }
    }
  }

  if (invalidFields.length > 0) {
    const firstInvalid = invalidFields[0];
    window.requestAnimationFrame(() => {
      firstInvalid.focus();
      firstInvalid.reportValidity();
    });
    return false;
  }

  return true;
}

async function persistConfig(config) {
  await persistAgentkitSettings(config);
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

function createScriptLoader(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('URL skriptu není definována.'));
      return;
    }

    const existing = document.querySelector(`script[data-agentkit-loader="${src}"]`);
    if (existing) {
      if (existing.dataset.agentkitLoaded === 'true' || window.ChatKitUI || window.ChatKit) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Nepodařilo se načíst Agentkit UI.')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.agentkitLoader = src;
    script.onload = () => {
      script.dataset.agentkitLoaded = 'true';
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('Nepodařilo se načíst Agentkit UI.'));
    };
    document.head.appendChild(script);
  });
}

async function loadAgentkitScript(baseUrl) {
  if (state.agentkit.scriptPromise) {
    return state.agentkit.scriptPromise;
  }

  const normalizedBase = typeof baseUrl === 'string' ? baseUrl.trim().replace(/\/$/, '') : '';
  const candidateBases = [
    normalizedBase,
    'https://cdn.jsdelivr.net/npm/@openai/chatkit@1.0.0',
    'https://cdn.jsdelivr.net/npm/@openai/chatkit@latest',
    'https://cdn.jsdelivr.net/npm/@openai/chatkit'
  ].filter(Boolean);

  const candidateScripts = [];
  const suffixes = ['/chatkit.js', '/dist/chatkit.js', '/dist/index.global.js'];
  for (const base of candidateBases) {
    const cleanedBase = base.replace(/\/$/, '');
    for (const suffix of suffixes) {
      candidateScripts.push(`${cleanedBase}${suffix}`);
    }
  }

  const uniqueCandidates = [...new Set(candidateScripts)];

  const loadPromise = (async () => {
    let lastError = null;
    for (const src of uniqueCandidates) {
      try {
        await createScriptLoader(src);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Nepodařilo se načíst Agentkit UI.');
      }
    }
    throw lastError || new Error('Nepodařilo se načíst Agentkit UI.');
  })();

  state.agentkit.scriptPromise = loadPromise;

  loadPromise.catch(() => {
    if (state.agentkit.scriptPromise === loadPromise) {
      state.agentkit.scriptPromise = null;
    }
  });

  return loadPromise;
}

async function requestClientSecret() {
  const workflowId = state.agentkit.workflowId?.trim();
  const apiKey = state.agentkit.openaiApiKey?.trim();
  const baseUrl = state.agentkit.chatkitApiBase?.trim();

  if (!workflowId || !apiKey) {
    throw new Error('Nejprve vyplňte Workflow ID a OpenAI API klíč v nastavení Agentkit.');
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
    setAgentkitStatus(refs, 'Nejprve vyplňte Workflow ID a OpenAI API klíč v nastavení.', 'info');
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

  if (!hasConfig()) {
    setAgentkitStatus(refs, 'Nejprve vyplňte Workflow ID a OpenAI API klíč v nastavení.', 'info');
    toggleVisibility(refs.agentkitPlaceholder, true);
    toggleVisibility(refs.agentkitChatContainer, false);
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
    toggleVisibility(refs.agentkitPlaceholder, true);
    state.agentkit.isMounted = false;
    state.agentkit.unmount = null;
    state.agentkit.instance = null;
  } finally {
    state.agentkit.isInitializing = false;
  }
}

export async function saveAgentkitConfig(refs) {
  const trimmedWorkflow = refs.agentkitWorkflowInput?.value.trim() || '';
  const trimmedApiKey = refs.agentkitOpenaiKeyInput?.value.trim() || '';
  const trimmedBase = refs.agentkitChatkitBaseInput?.value.trim() || '';

  const previousConfig = {
    workflowId: state.agentkit.workflowId,
    openaiApiKey: state.agentkit.openaiApiKey,
    chatkitApiBase: state.agentkit.chatkitApiBase
  };

  state.agentkit.workflowId = trimmedWorkflow;
  state.agentkit.openaiApiKey = trimmedApiKey;
  state.agentkit.chatkitApiBase = trimmedBase;

  try {
    await persistConfig({
      workflowId: trimmedWorkflow,
      openaiApiKey: trimmedApiKey,
      chatkitApiBase: trimmedBase
    });
    showAgentkitSaveFeedback(refs, 'Konfigurace byla uložena.');
    setAgentkitStatus(refs, '');
    fillAgentkitSettingsForm(refs);
    if (!trimmedWorkflow || !trimmedApiKey) {
      teardownAgentkit(refs);
      toggleVisibility(refs.agentkitPlaceholder, true);
      setAgentkitStatus(
        refs,
        'Pro zobrazení chatu je nutné zadat Workflow ID i OpenAI API klíč.',
        'info'
      );
      return;
    }
    renderAgentkit(refs);
  } catch (error) {
    console.error('Uložení Agentkit konfigurace selhalo:', error);
    state.agentkit.workflowId = previousConfig.workflowId;
    state.agentkit.openaiApiKey = previousConfig.openaiApiKey;
    state.agentkit.chatkitApiBase = previousConfig.chatkitApiBase;
    fillAgentkitSettingsForm(refs);
    showAgentkitSaveFeedback(refs, '');
    setAgentkitStatus(refs, error?.message || 'Nepodařilo se uložit konfiguraci.', 'error');
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

  refs.agentkitSettingsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const isValid = validateAgentkitInputs(refs);
    if (!isValid) {
      if (state.view === 'agentkit') {
        setAgentkitStatus(refs, 'Nejprve vyplňte povinná pole v nastavení Agentkit.', 'error');
      }
      return;
    }

    refs.agentkitSettingsDialog.returnValue = 'confirm';
    refs.agentkitSettingsDialog.close();
    await saveAgentkitConfig(refs);
  });

  [refs.agentkitWorkflowInput, refs.agentkitOpenaiKeyInput, refs.agentkitChatkitBaseInput]
    .filter((input) => input instanceof HTMLInputElement)
    .forEach((input) => {
      input.addEventListener('input', () => {
        resetInputValidity(input);
      });
    });

  fillAgentkitSettingsForm(refs);
}

export function resetAgentkitMessages(refs) {
  if (state.view !== 'agentkit') {
    setAgentkitStatus(refs, '');
    showAgentkitSaveFeedback(refs, '');
  }
}

