import { state, STORAGE_KEYS } from '../state.js';
import { apiFetch } from './api.js';
import {
  toggleVisibility,
  toggleActive,
  clearChildren,
  setInputsDisabled,
  setButtonLoading,
  setMessage
} from '../utils/dom.js';
import { formatRelativeTime, formatDateTime } from '../utils/datetime.js';
import { closeSidebar, mobileSidebarMedia } from './layout.js';
import { updateUserPreferences } from './settings.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function syncChatMenu(refs) {
  const isChatView = state.view === 'chat';
  toggleVisibility(refs.createThreadButton, isChatView);
  toggleVisibility(refs.workspaceHistoryButton, isChatView, { hiddenClass: 'visually-hidden' });

  if (!isChatView) {
    if (refs.workspaceHistoryPanel) {
      refs.workspaceHistoryPanel.classList.add('workspace-menu__panel--hidden');
      refs.workspaceHistoryPanel.setAttribute('aria-hidden', 'true');
    }
    if (refs.workspaceMenuPrimary) {
      refs.workspaceMenuPrimary.classList.remove('workspace-menu__panel--hidden');
      refs.workspaceMenuPrimary.setAttribute('aria-hidden', 'false');
    }
    if (refs.workspaceHistoryButton) {
      refs.workspaceHistoryButton.setAttribute('aria-expanded', 'false');
    }
    return;
  }

  const showHistory = state.activeSidebarPanel === 'history';
  toggleVisibility(refs.workspaceMenuPrimary, !showHistory, { hiddenClass: 'workspace-menu__panel--hidden' });
  toggleVisibility(refs.workspaceHistoryPanel, showHistory, { hiddenClass: 'workspace-menu__panel--hidden' });

  if (refs.workspaceMenuPrimary) {
    refs.workspaceMenuPrimary.setAttribute('aria-hidden', showHistory ? 'true' : 'false');
  }

  if (refs.workspaceHistoryPanel) {
    refs.workspaceHistoryPanel.setAttribute('aria-hidden', showHistory ? 'false' : 'true');
  }

  if (refs.workspaceHistoryButton) {
    refs.workspaceHistoryButton.setAttribute('aria-expanded', showHistory ? 'true' : 'false');
    toggleActive(refs.workspaceHistoryButton, showHistory);
  }
}

function filterThreads() {
  const query = state.threadSearch.toLowerCase();
  state.filteredThreads = state.threads.filter((thread) => {
    const matchesSearch =
      thread.title.toLowerCase().includes(query) || (thread.last_message || '').toLowerCase().includes(query);
    if (!matchesSearch) return false;
    if (state.threadFilter === 'favorites') {
      return thread.is_favorite;
    }
    if (state.threadFilter === 'recent') {
      if (!thread.last_activity) return false;
      const diff = Date.now() - new Date(thread.last_activity).getTime();
      return diff < 1000 * 60 * 60 * 24 * 3;
    }
    return true;
  });
}

function renderThreadHeader(refs) {
  const thread = state.threads.find((t) => t.id === state.activeThreadId);
  if (!thread) {
    refs.activeThreadTitle.textContent = 'Vyberte vlákno';
    refs.activeThreadMeta.textContent = '';
    toggleVisibility(refs.chatForm, false, { hiddenClass: 'visually-hidden' });
    return;
  }

  toggleVisibility(refs.chatForm, true, { hiddenClass: 'visually-hidden' });
  refs.activeThreadTitle.textContent = thread.title;
  const parts = [];
  if (thread.created_at) {
    parts.push(`Založeno ${formatDateTime(thread.created_at)}`);
  }
  if (thread.last_activity) {
    parts.push(`Naposledy ${formatRelativeTime(thread.last_activity)}`);
  }
  refs.activeThreadMeta.textContent = parts.join(' • ');
}

function renderThreads(refs) {
  clearChildren(refs.threadList);
  if (!state.filteredThreads.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'thread-card';
    emptyItem.textContent = 'Žádná vlákna neodpovídají filtru.';
    refs.threadList.appendChild(emptyItem);
    return;
  }

  state.filteredThreads.forEach((thread) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.threadId = String(thread.id);
    button.className = 'thread-card';

    const title = document.createElement('h3');
    title.className = 'thread-card__title';
    title.textContent = thread.title;

    toggleActive(button, thread.id === state.activeThreadId);
    button.append(title);
    item.appendChild(button);
    refs.threadList.appendChild(item);
  });
}

function renderMessages(refs) {
  clearChildren(refs.chatHistory);
  if (!state.messages.length) {
    toggleVisibility(refs.chatEmpty, true, { hiddenClass: 'visually-hidden' });
    return;
  }

  toggleVisibility(refs.chatEmpty, false, { hiddenClass: 'visually-hidden' });
  const fragment = document.createDocumentFragment();

  state.messages.forEach((message) => {
    const template = refs.messageTemplate?.content?.cloneNode(true);
    if (!template) return;
    const node = template.querySelector('.chat-message');
    const avatar = node.querySelector('.chat-message__avatar');
    const bubble = node.querySelector('.chat-message__bubble');
    const meta = node.querySelector('.chat-message__meta');
    const content = node.querySelector('.chat-message__content');

    const role = message.role || 'assistant';
    bubble.dataset.role = role;
    avatar.textContent = role === 'user' ? 'Vy' : 'AI';
    meta.textContent = message.created_at ? formatDateTime(message.created_at) : '';
    if (message.content) {
      content.textContent = message.content;
    } else if (Array.isArray(message.parts)) {
      content.textContent = message.parts.map((part) => part.text || '').join('\n');
    }

    fragment.appendChild(node);
  });

  refs.chatHistory.appendChild(fragment);
  const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
  refs.chatHistory.scrollTo({ top: refs.chatHistory.scrollHeight, behavior });
}

function renderChatFeedback(refs, message, type = 'info') {
  setMessage(refs.chatFeedback, message, type);
}

function renderChatApiSettings(refs) {
  const { chatApiConnectorList, chatApiConnectorTemplate, chatApiMessage } = refs;
  if (!chatApiConnectorList || !chatApiConnectorTemplate) return;

  clearChildren(chatApiConnectorList);
  state.chatApiConnectors.forEach((connector) => {
    const sanitizedProvider = connector.provider.replace(/[^a-z0-9_-]/gi, '-');
    const fragment = chatApiConnectorTemplate.content.cloneNode(true);
    const section = fragment.querySelector('.api-connector');
    const name = section.querySelector('.connector-name');
    const description = section.querySelector('.connector-description');
    const status = section.querySelector('.connector-status');
    const form = section.querySelector('.connector-form');
    const fieldsContainer = section.querySelector('.connector-fields');
    const submitButton = section.querySelector('button[type="submit"]');
    const feedback = section.querySelector('.connector-feedback');
    const radio = section.querySelector('input[type="radio"]');

    name.textContent = connector.name;
    description.textContent = connector.description;
    status.textContent = connector.isActive ? 'Aktivní' : 'Neaktivní';
    radio.value = connector.provider;
    radio.checked = connector.isActive;

    radio.addEventListener('change', async () => {
      try {
        setInputsDisabled(form, true);
        setButtonLoading(submitButton, true, 'Aktivuji…');
        await apiFetch('/api/chat/api-settings/active', {
          method: 'POST',
          body: JSON.stringify({ provider: connector.provider })
        });
        state.chatApiConnectors = state.chatApiConnectors.map((item) => ({
          ...item,
          isActive: item.provider === connector.provider
        }));
        renderChatApiSettings(refs);
      } catch (error) {
        setMessage(chatApiMessage, error.message, 'error');
      } finally {
        setInputsDisabled(form, false);
        setButtonLoading(submitButton, false);
      }
    });

    clearChildren(fieldsContainer);
    (connector.fields || []).forEach((field) => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'connector-field';

      const label = document.createElement('label');
      const fieldId = `chat-api-${sanitizedProvider}-${field.name}`;
      label.setAttribute('for', fieldId);
      label.textContent = field.label || field.name;

      const input = document.createElement('input');
      input.id = fieldId;
      input.name = field.name;
      input.type = field.secret ? 'password' : field.type === 'url' ? 'url' : 'text';
      input.placeholder = field.placeholder || '';
      input.autocomplete = field.secret ? 'off' : 'on';
      if (field.required && !connector.hasKey) {
        input.required = true;
      }

      const existingValue = connector.config ? connector.config[field.name] : undefined;
      if (field.secret) {
        input.value = '';
      } else if (existingValue !== undefined && existingValue !== null) {
        input.value = String(existingValue);
      }

      fieldWrapper.append(label, input);

      const hintText = field.hint || (field.secret
        ? 'Údaj je uložen šifrovaně a nebude nikdy zobrazen v plné podobě.'
        : '');
      if (hintText) {
        const hint = document.createElement('p');
        hint.className = 'connector-field-hint';
        hint.textContent = hintText;
        fieldWrapper.appendChild(hint);
      }

      fieldsContainer.appendChild(fieldWrapper);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage(feedback, '');
      const formData = new FormData(form);
      const payload = { provider: connector.provider, isActive: Boolean(radio.checked) };

      (connector.fields || []).forEach((field) => {
        const raw = formData.get(field.name);
        if (typeof raw !== 'string') return;
        const trimmed = raw.trim();
        if (trimmed) {
          payload[field.name] = trimmed;
        } else if (!field.secret && connector.config && connector.config[field.name] !== undefined) {
          payload[field.name] = '';
        }
      });

      try {
        setInputsDisabled(form, true);
        setButtonLoading(submitButton, true, 'Ukládám…');
        const response = await apiFetch('/api/chat/api-settings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (response?.connectors) {
          state.chatApiConnectors = response.connectors;
          renderChatApiSettings(refs);
        }
        if (response?.message) {
          setMessage(chatApiMessage, response.message, 'success');
        }
      } catch (error) {
        setMessage(feedback, error.message, 'error');
      } finally {
        setInputsDisabled(form, false);
        setButtonLoading(submitButton, false);
      }
    });

    chatApiConnectorList.appendChild(fragment);
  });
}

async function loadChatApiSettings(refs, options = {}) {
  if (!refs.chatApiConnectorList) return;
  const { silent = false } = options;
  try {
    if (!silent) {
      setMessage(refs.chatApiMessage, 'Načítám nastavení…', 'info');
    }
    const { connectors } = await apiFetch('/api/chat/api-settings');
    state.chatApiConnectors = connectors;
    renderChatApiSettings(refs);
    if (!silent) {
      setMessage(refs.chatApiMessage, '');
    }
  } catch (error) {
    state.chatApiConnectors = [];
    clearChildren(refs.chatApiConnectorList);
    setMessage(refs.chatApiMessage, error.message, 'error');
    throw error;
  }
}

function subscribeToThreads(refs) {
  const stream = new EventSource('/api/chat/threads/stream', { withCredentials: true });
  stream.addEventListener('message', async (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'threads-updated') {
        await loadThreads(refs, { preserveActive: true });
      }
    } catch (error) {
      console.error('Chyba streamu vláken', error);
    }
  });
  stream.addEventListener('error', () => {
    stream.close();
    setTimeout(() => subscribeToThreads(refs), 3000);
  });
  state.threadStream = stream;
}

function subscribeToMessages(refs, threadId) {
  if (state.messageStream) {
    state.messageStream.close();
  }
  const stream = new EventSource(`/api/chat/messages/stream?threadId=${threadId}`, { withCredentials: true });
  stream.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message-appended') {
        const incoming = { ...payload.message };
        if (typeof incoming.id !== 'undefined') {
          const numericId = Number(incoming.id);
          incoming.id = Number.isNaN(numericId) ? incoming.id : numericId;
        }
        state.messages.push(incoming);
        if (incoming.id) {
          state.messages.sort((a, b) => {
            if (a.id && b.id) {
              return a.id - b.id;
            }
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });
        }
        renderMessages(refs);
      }
      if (payload.type === 'messages-cleared' && payload.threadId === state.activeThreadId) {
        state.messages = [];
        renderMessages(refs);
      }
    } catch (error) {
      console.error('Chyba streamu zpráv', error);
    }
  });
  stream.addEventListener('error', () => {
    stream.close();
    setTimeout(() => subscribeToMessages(refs, threadId), 3000);
  });
  state.messageStream = stream;
}

export async function loadThreads(refs, options = {}) {
  const { subscribe = false, preserveActive = false } = options;
  let data;
  try {
    data = await apiFetch('/api/chat/threads');
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw error;
    }
    const message = error?.message
      ? `Nepodařilo se načíst chat: ${error.message}`
      : 'Nepodařilo se načíst chat.';
    const contextualError = new Error(message);
    if (typeof error?.status === 'number') {
      contextualError.status = error.status;
    }
    throw contextualError;
  }
  state.threads = data.threads;
  if (preserveActive && state.activeThreadId) {
    const exists = state.threads.some((thread) => thread.id === state.activeThreadId);
    state.activeThreadId = exists ? state.activeThreadId : data.activeThreadId;
  } else {
    state.activeThreadId = data.activeThreadId;
  }
  filterThreads();
  renderThreads(refs);
  renderThreadHeader(refs);
  if (state.activeThreadId) {
    await loadMessages(refs, state.activeThreadId);
    subscribeToMessages(refs, state.activeThreadId);
  }
  if (subscribe) {
    subscribeToThreads(refs);
  }
}

export async function loadMessages(refs, threadId) {
  try {
    const data = await apiFetch(`/api/chat/history?threadId=${threadId}`);
    state.messages = data.messages;
    state.activeThreadId = data.threadId;
    renderMessages(refs);
    renderThreadHeader(refs);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw error;
    }
    const message = error?.message
      ? `Nepodařilo se načíst historii konverzace: ${error.message}`
      : 'Nepodařilo se načíst historii konverzace.';
    const contextualError = new Error(message);
    if (typeof error?.status === 'number') {
      contextualError.status = error.status;
    }
    throw contextualError;
  }
}

export async function sendMessage(refs, message) {
  const payload = await apiFetch('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ message, threadId: state.activeThreadId })
  });
  const targetThreadId = payload.threadId || state.activeThreadId;
  if (targetThreadId) {
    await loadMessages(refs, targetThreadId);
    subscribeToMessages(refs, targetThreadId);
  }
  renderChatFeedback(refs, 'Odpověď byla odeslána.', 'success');
  return payload;
}

export function initChat(refs) {
  syncChatMenu(refs);

  refs.workspaceHistoryButton?.addEventListener('click', () => {
    if (state.activeSidebarPanel === 'history') return;
    state.activeSidebarPanel = 'history';
    syncChatMenu(refs);
    refs.threadSearch?.focus();
  });

  refs.workspaceHistoryBack?.addEventListener('click', () => {
    state.activeSidebarPanel = 'navigation';
    syncChatMenu(refs);
    refs.workspaceHistoryButton?.focus();
  });

  refs.threadList?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const threadId = Number(button.dataset.threadId);
    state.activeThreadId = threadId;
    renderThreads(refs);
    await loadMessages(refs, threadId);
    subscribeToMessages(refs, threadId);
    if (mobileSidebarMedia.matches) {
      closeSidebar(refs);
    }
  });

  refs.threadSearch?.addEventListener('input', (event) => {
    state.threadSearch = event.target.value.trim();
    filterThreads();
    renderThreads(refs);
  });

  refs.chatForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = refs.chatMessageInput.value.trim();
    if (!message || !state.activeThreadId) {
      renderChatFeedback(refs, 'Vyberte prosím vlákno a zadejte zprávu.', 'error');
      return;
    }
    refs.chatMessageInput.value = '';
    state.messages.push({ role: 'user', content: message, created_at: new Date().toISOString() });
    renderMessages(refs);
    try {
      await sendMessage(refs, message);
    } catch (error) {
      renderChatFeedback(refs, error.message, 'error');
    }
  });

  refs.chatMessageInput?.addEventListener('keydown', (event) => {
    if (state.enterToSend && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      refs.chatForm.requestSubmit();
    }
  });

  refs.enterToSendCheckbox?.addEventListener('change', async () => {
    const previousValue = state.enterToSend;
    const nextValue = Boolean(refs.enterToSendCheckbox.checked);
    state.enterToSend = nextValue;
    localStorage.setItem(STORAGE_KEYS.enterToSend, String(nextValue));

    try {
      await updateUserPreferences({ enterToSend: nextValue });
    } catch (error) {
      console.error('Uložení nastavení odesílání zpráv selhalo:', error);
      state.enterToSend = previousValue;
      refs.enterToSendCheckbox.checked = previousValue;
      localStorage.setItem(STORAGE_KEYS.enterToSend, String(previousValue));
      renderChatFeedback(refs, 'Nepodařilo se uložit nastavení Rádce.', 'error');
    }
  });

  refs.createThreadButton?.addEventListener('click', async () => {
    const thread = await apiFetch('/api/chat/threads', { method: 'POST', body: JSON.stringify({}) });
    state.activeThreadId = thread.thread.id;
    await loadThreads(refs, { preserveActive: true });
    await loadMessages(refs, state.activeThreadId);
    subscribeToMessages(refs, state.activeThreadId);
  });

  refs.chatApiSettingsButton?.addEventListener('click', async () => {
    if (!refs.chatApiDialog) return;
    refs.chatApiDialog.showModal();
    clearChildren(refs.chatApiConnectorList);
    state.chatApiConnectors = [];
    setMessage(refs.chatApiMessage, 'Načítám nastavení…', 'info');
    try {
      await loadChatApiSettings(refs);
    } catch (error) {
      console.error('Načtení nastavení konektorů selhalo:', error);
    }
  });

  refs.chatApiCloseButton?.addEventListener('click', () => {
    refs.chatApiDialog?.close();
  });
}

export function renderChatView(refs) {
  renderThreadHeader(refs);
  renderThreads(refs);
  renderMessages(refs);
  syncChatMenu(refs);
}

export function teardownChatStreams() {
  if (state.threadStream) {
    state.threadStream.close();
    state.threadStream = null;
  }
  if (state.messageStream) {
    state.messageStream.close();
    state.messageStream = null;
  }
}
