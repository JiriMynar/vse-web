const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authSection = document.getElementById('auth-section');
const authMessage = document.getElementById('auth-message');
const loginTab = document.getElementById('show-login');
const registerTab = document.getElementById('show-register');
const loginSubmitButton = loginForm.querySelector('button[type="submit"]');
const registerSubmitButton = registerForm.querySelector('button[type="submit"]');

const appShell = document.getElementById('app-shell');
const userInfo = document.getElementById('user-info');
const themeToggle = document.getElementById('theme-toggle');
const newThreadButton = document.getElementById('new-thread');
const threadListEl = document.getElementById('thread-list');
const threadSearchInput = document.getElementById('thread-search');
const filterButtons = document.querySelectorAll('.filters .chip');
const exportAllButton = document.getElementById('export-all');
const logoutButton = document.getElementById('logout-button');

const chatSection = document.getElementById('chat-section');
const chatHistoryEl = document.getElementById('chat-history');
const chatEmptyState = document.getElementById('chat-empty-state');
const chatFeedback = document.getElementById('chat-feedback');
const messageTemplate = document.getElementById('message-template');
const chatForm = document.getElementById('chat-form');
const chatMessageInput = document.getElementById('chat-message');
const chatSubmitButton = chatForm.querySelector('button[type="submit"]');
const enterToSendCheckbox = document.getElementById('enter-to-send');

const activeThreadTitle = document.getElementById('active-thread-title');
const activeThreadMeta = document.getElementById('active-thread-meta');
const favoriteThreadButton = document.getElementById('favorite-thread');
const renameThreadButton = document.getElementById('rename-thread');
const exportThreadButton = document.getElementById('export-thread');
const clearThreadButton = document.getElementById('clear-thread');
const deleteThreadButton = document.getElementById('delete-thread');
const messageCountInsight = document.getElementById('message-count');
const lastActivityInsight = document.getElementById('last-activity');
const favoriteStatusInsight = document.getElementById('favorite-status');

const AUTH_MODE_KEY = 'vse-web-auth-mode';
const ENTER_TO_SEND_KEY = 'vse-web-enter-to-send';
const THEME_KEY = 'vse-web-theme';

const state = {
  user: null,
  threads: [],
  activeThreadId: null,
  filter: 'all',
  search: '',
  enterToSend: localStorage.getItem(ENTER_TO_SEND_KEY) === 'true',
  theme: localStorage.getItem(THEME_KEY) || 'dark'
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat('cs', { numeric: 'auto' });
const dateTimeFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

loginTab.addEventListener('click', () => toggleForms('login'));
registerTab.addEventListener('click', () => toggleForms('register'));

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    setButtonLoading(loginSubmitButton, true, 'Přihlašuji...');
    setInputsDisabled(loginForm, true);
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Přihlášení se nezdařilo.');
    }

    showAuthMessage('Přihlášení proběhlo úspěšně.', 'success');
    await loadWorkspace();
  } catch (error) {
    showAuthMessage(error.message, 'error');
  } finally {
    setInputsDisabled(loginForm, false);
    setButtonLoading(loginSubmitButton, false);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    setButtonLoading(registerSubmitButton, true, 'Registruji...');
    setInputsDisabled(registerForm, true);
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Registrace se nezdařila.');
    }

    showAuthMessage('Registrace proběhla úspěšně.', 'success');
    toggleForms('login', { clearMessage: false });
    await loadWorkspace();
  } catch (error) {
    showAuthMessage(error.message, 'error');
  } finally {
    setInputsDisabled(registerForm, false);
    setButtonLoading(registerSubmitButton, false);
  }
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = chatMessageInput.value.trim();

  if (!message || !state.activeThreadId) {
    if (!state.activeThreadId) {
      showChatFeedback('Vyberte prosím vlákno nebo založte nové.', 'error');
    }
    return;
  }

  appendMessage('user', message, new Date());
  chatMessageInput.value = '';
  resizeComposer();
  toggleChatForm(true);
  const typingIndicator = showTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, threadId: state.activeThreadId })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se získat odpověď od bota.');
    }

    appendMessage('assistant', data.reply, new Date());
    await refreshThreads(state.activeThreadId, { reloadMessages: false });
    showChatFeedback('Odpověď byla doručena.');
  } catch (error) {
    appendMessage('assistant', error.message, new Date());
    showChatFeedback(error.message, 'error');
  } finally {
    toggleChatForm(false);
    removeTypingIndicator(typingIndicator);
  }
});

chatMessageInput.addEventListener('input', resizeComposer);
chatMessageInput.addEventListener('keydown', (event) => {
  if (state.enterToSend && event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

enterToSendCheckbox.addEventListener('change', () => {
  state.enterToSend = enterToSendCheckbox.checked;
  localStorage.setItem(ENTER_TO_SEND_KEY, String(state.enterToSend));
});

threadSearchInput.addEventListener('input', () => {
  state.search = threadSearchInput.value.toLowerCase();
  renderThreads();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    state.filter = button.dataset.filter || 'all';
    renderThreads();
  });
});

threadListEl.addEventListener('click', async (event) => {
  const target = event.target.closest('button');
  if (!target) {
    return;
  }
  const threadId = Number(target.dataset.threadId);
  const action = target.dataset.action;

  if (!threadId && action !== 'create') {
    return;
  }

  if (action === 'select') {
    await setActiveThread(threadId);
  }

  if (action === 'favorite') {
    event.stopPropagation();
    await toggleFavorite(threadId);
  }

  if (action === 'delete') {
    event.stopPropagation();
    await deleteThread(threadId);
  }
});

newThreadButton.addEventListener('click', async () => {
  const desiredTitle = prompt('Jak se bude nové vlákno jmenovat?', 'Nový chat');
  await createThread(desiredTitle);
});

favoriteThreadButton.addEventListener('click', async () => {
  if (!state.activeThreadId) {
    return;
  }
  await toggleFavorite(state.activeThreadId, { toggleFromToolbar: true });
});

renameThreadButton.addEventListener('click', async () => {
  if (!state.activeThreadId) {
    return;
  }
  const thread = state.threads.find((t) => t.id === state.activeThreadId);
  const newTitle = prompt('Upravte název vlákna:', thread?.title || '');
  if (newTitle === null) {
    return;
  }
  const trimmed = newTitle.trim();
  if (!trimmed) {
    showChatFeedback('Název vlákna nesmí být prázdný.', 'error');
    return;
  }
  await updateThread(state.activeThreadId, { title: trimmed });
});

clearThreadButton.addEventListener('click', async () => {
  if (!state.activeThreadId) {
    return;
  }
  const confirmation = confirm('Opravdu chcete vymazat všechny zprávy v tomto vláknu?');
  if (!confirmation) {
    return;
  }
  await clearThread(state.activeThreadId);
});

deleteThreadButton.addEventListener('click', async () => {
  if (!state.activeThreadId) {
    return;
  }
  await deleteThread(state.activeThreadId);
});

exportThreadButton.addEventListener('click', async () => {
  if (!state.activeThreadId) {
    return;
  }
  await exportThread(state.activeThreadId);
});

exportAllButton.addEventListener('click', async () => {
  if (!state.threads.length) {
    showChatFeedback('Nemáte žádné vlákno k exportu.', 'error');
    return;
  }
  await exportAllThreads();
});

logoutButton.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  resetWorkspace();
  showAuthMessage('Byli jste odhlášeni.', 'info');
});

themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, state.theme);
  applyTheme();
});

initialize();

async function initialize() {
  applyTheme();
  enterToSendCheckbox.checked = state.enterToSend;

  const savedMode = localStorage.getItem(AUTH_MODE_KEY);
  if (savedMode === 'register') {
    toggleForms('register', { persist: false, clearMessage: false });
  } else {
    toggleForms('login', { persist: false, clearMessage: false });
  }

  await loadWorkspace();
}

async function loadWorkspace() {
  try {
    const meResponse = await fetch('/api/me');
    if (!meResponse.ok) {
      throw new Error('Nepodařilo se načíst uživatele.');
    }
    const meData = await meResponse.json();
    state.user = meData.user;
    if (!state.user) {
      throw new Error('Uživatel nebyl nalezen.');
    }

    userInfo.textContent = `${state.user.name} • ${state.user.email}`;
    authSection.classList.add('hidden');
    appShell.classList.remove('hidden');

    await refreshThreads(undefined, { reloadMessages: true });
    showChatFeedback('Načteno. Připraveni k práci!');
  } catch (error) {
    state.user = null;
    appShell.classList.add('hidden');
    authSection.classList.remove('hidden');
    chatHistoryEl.innerHTML = '';
    updateChatEmptyState();
    showAuthMessage(error.message || 'Nepodařilo se načíst relaci, přihlaste se prosím znovu.', 'error');
  }
}

async function refreshThreads(preferredActiveId, { reloadMessages = false } = {}) {
  try {
    const response = await fetch('/api/chat/threads');
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst vlákna.');
    }
    const data = await response.json();
    state.threads = (data.threads || []).map(normalizeThread);

    const fallbackId = state.threads[0]?.id || null;
    const resolvedId = preferredActiveId && state.threads.some((t) => t.id === preferredActiveId)
      ? preferredActiveId
      : data.activeThreadId && state.threads.some((t) => t.id === data.activeThreadId)
      ? data.activeThreadId
      : fallbackId;

    state.activeThreadId = resolvedId;
    renderThreads();
    updateThreadSummary();

    if (reloadMessages && state.activeThreadId) {
      await loadMessages(state.activeThreadId);
    } else {
      updateChatEmptyState();
    }
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

async function setActiveThread(threadId) {
  if (!threadId || state.activeThreadId === threadId) {
    return;
  }
  state.activeThreadId = threadId;
  renderThreads();
  updateThreadSummary();
  await loadMessages(threadId);
}

function renderThreads() {
  threadListEl.innerHTML = '';
  let filteredThreads = [...state.threads];

  if (state.filter === 'favorites') {
    filteredThreads = filteredThreads.filter((thread) => thread.is_favorite);
  }
  if (state.filter === 'recent') {
    filteredThreads = filteredThreads.slice(0, 5);
  }

  if (state.search) {
    filteredThreads = filteredThreads.filter((thread) => thread.title.toLowerCase().includes(state.search));
  }

  if (!filteredThreads.length) {
    const empty = document.createElement('p');
    empty.textContent = state.search ? 'Nic neodpovídá vyhledávání.' : 'Zatím nemáte žádná vlákna.';
    empty.className = 'thread-empty';
    threadListEl.appendChild(empty);
    return;
  }

  filteredThreads.forEach((thread) => {
    const item = document.createElement('div');
    item.className = `thread-item${thread.id === state.activeThreadId ? ' active' : ''}`;

    const selectButton = document.createElement('button');
    selectButton.className = 'thread-button';
    selectButton.dataset.threadId = String(thread.id);
    selectButton.dataset.action = 'select';
    selectButton.innerHTML = `
      <h3 class="thread-title">${escapeHtml(thread.title)}</h3>
      <p class="thread-meta">${formatMessageMeta(thread)}</p>
    `;

    const actions = document.createElement('div');
    actions.className = 'thread-actions';

    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'icon-button';
    favoriteButton.dataset.threadId = String(thread.id);
    favoriteButton.dataset.action = 'favorite';
    favoriteButton.setAttribute('aria-pressed', String(Boolean(thread.is_favorite)));
    favoriteButton.title = thread.is_favorite ? 'Odebrat z oblíbených' : 'Přidat k oblíbeným';
    favoriteButton.textContent = thread.is_favorite ? '★' : '☆';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-button';
    deleteButton.dataset.threadId = String(thread.id);
    deleteButton.dataset.action = 'delete';
    deleteButton.title = 'Smazat vlákno';
    deleteButton.textContent = '✕';

    actions.append(favoriteButton, deleteButton);
    item.append(selectButton, actions);
    threadListEl.appendChild(item);
  });
}

async function loadMessages(threadId) {
  try {
    const response = await fetch(`/api/chat/history?threadId=${threadId}`);
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst zprávy.');
    }
    const data = await response.json();
    chatHistoryEl.innerHTML = '';
    chatMessageInput.value = '';
    resizeComposer();

    (data.messages || []).forEach((message) => {
      appendMessage(message.role, message.content, message.created_at);
    });

    const thread = state.threads.find((t) => t.id === threadId);
    if (thread) {
      thread.message_count = data.messages?.length || 0;
      if (data.messages?.length) {
        const lastMessage = data.messages[data.messages.length - 1];
        thread.last_activity = lastMessage.created_at;
        thread.last_message = lastMessage.content;
        thread.last_role = lastMessage.role;
      }
    }

    updateChatEmptyState();
    updateThreadSummary();
    renderThreads();
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

function appendMessage(role, content, createdAt) {
  const clone = messageTemplate.content.cloneNode(true);
  const messageEl = clone.querySelector('.chat-message');
  const metaEl = clone.querySelector('.meta');
  const bubbleEl = clone.querySelector('.bubble');
  const avatarEl = clone.querySelector('.avatar');

  messageEl.classList.add(role);
  bubbleEl.textContent = content;
  metaEl.textContent = `${role === 'user' ? 'Vy' : 'Bot'} • ${formatDate(createdAt)}`;
  avatarEl.textContent = role === 'user' ? 'Vy' : 'AI';

  chatHistoryEl.appendChild(clone);
  scrollToBottom();
  updateChatEmptyState();
}

function showTypingIndicator() {
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message assistant typing';

  const avatarEl = document.createElement('div');
  avatarEl.className = 'avatar';
  avatarEl.textContent = 'AI';

  const contentEl = document.createElement('div');
  const metaEl = document.createElement('div');
  metaEl.className = 'meta';
  metaEl.textContent = 'Bot právě píše…';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'bubble';

  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'typing-dot';
    bubbleEl.appendChild(dot);
  }

  contentEl.append(metaEl, bubbleEl);
  messageEl.append(avatarEl, contentEl);
  chatHistoryEl.appendChild(messageEl);
  scrollToBottom();
  return messageEl;
}

function removeTypingIndicator(indicator) {
  if (indicator && indicator.parentElement) {
    indicator.remove();
    updateChatEmptyState();
  }
}

function toggleForms(type, { persist = true, clearMessage = true } = {}) {
  if (type === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  }
  if (persist) {
    localStorage.setItem(AUTH_MODE_KEY, type);
  }
  if (clearMessage) {
    showAuthMessage('', '');
  }
}

function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.classList.remove('success', 'error', 'info');
  if (message && type) {
    authMessage.classList.add(type);
  }
}

function showChatFeedback(message, type = 'info') {
  chatFeedback.textContent = message;
  chatFeedback.classList.remove('error');
  if (type === 'error') {
    chatFeedback.classList.add('error');
  }
}

function updateChatEmptyState() {
  const hasMessages = chatHistoryEl.querySelectorAll('.chat-message').length > 0;
  chatEmptyState.classList.toggle('hidden', hasMessages);
}

function toggleChatForm(disabled) {
  setButtonLoading(chatSubmitButton, disabled, disabled ? 'Odesílám...' : undefined);
  chatMessageInput.disabled = disabled;
}

function setInputsDisabled(container, disabled) {
  container.querySelectorAll('input').forEach((input) => {
    input.disabled = disabled;
  });
}

function setButtonLoading(button, isLoading, loadingLabel) {
  if (!button) {
    return;
  }
  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    if (loadingLabel) {
      button.textContent = loadingLabel;
    }
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
  } else {
    const original = button.dataset.originalText;
    if (original) {
      button.textContent = original;
      delete button.dataset.originalText;
    }
    button.removeAttribute('aria-busy');
    button.disabled = false;
  }
}

function scrollToBottom() {
  chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return dateTimeFormatter.format(d);
}

function formatMessageMeta(thread) {
  const relative = thread.last_activity ? formatRelative(thread.last_activity) : 'Bez aktivit';
  const count = thread.message_count || 0;
  return `${relative} • ${count} zpráv`;
}

function formatRelative(dateLike) {
  if (!dateLike) {
    return 'Bez aktivit';
  }
  const date = new Date(dateLike);
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);

  const ranges = [
    { unit: 'year', value: 60 * 60 * 24 * 365 },
    { unit: 'month', value: 60 * 60 * 24 * 30 },
    { unit: 'week', value: 60 * 60 * 24 * 7 },
    { unit: 'day', value: 60 * 60 * 24 },
    { unit: 'hour', value: 60 * 60 },
    { unit: 'minute', value: 60 },
    { unit: 'second', value: 1 }
  ];

  for (const range of ranges) {
    const delta = Math.round(diffSec / range.value);
    if (Math.abs(delta) >= 1) {
      return relativeTimeFormatter.format(delta, range.unit);
    }
  }
  return 'právě teď';
}

function normalizeThread(thread) {
  return {
    ...thread,
    id: Number(thread.id),
    is_favorite: Boolean(thread.is_favorite),
    message_count: Number(thread.message_count) || 0
  };
}

function updateThreadSummary() {
  const thread = state.threads.find((t) => t.id === state.activeThreadId);
  if (!thread) {
    activeThreadTitle.textContent = 'Vyberte si konverzaci';
    activeThreadMeta.textContent = '';
    favoriteThreadButton.setAttribute('aria-pressed', 'false');
    favoriteThreadButton.textContent = '☆';
    messageCountInsight.textContent = '0 zpráv';
    lastActivityInsight.textContent = 'Žádná aktivita';
    favoriteStatusInsight.textContent = 'Neoblíbené';
    chatForm.classList.add('hidden');
    return;
  }

  chatForm.classList.remove('hidden');
  activeThreadTitle.textContent = thread.title;
  activeThreadMeta.textContent = `Založeno ${formatDate(thread.created_at)} • ${formatMessageMeta(thread)}`;

  favoriteThreadButton.setAttribute('aria-pressed', String(thread.is_favorite));
  favoriteThreadButton.textContent = thread.is_favorite ? '★' : '☆';
  favoriteThreadButton.title = thread.is_favorite ? 'Odebrat z oblíbených' : 'Přidat k oblíbeným';

  messageCountInsight.textContent = `${thread.message_count || 0} zpráv`;
  lastActivityInsight.textContent = thread.last_activity ? formatRelative(thread.last_activity) : 'Žádná aktivita';
  favoriteStatusInsight.textContent = thread.is_favorite ? 'Oblíbené vlákno' : 'Neoblíbené';
}

async function createThread(title) {
  try {
    setButtonLoading(newThreadButton, true, 'Zakládám...');
    const response = await fetch('/api/chat/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Vlákno se nepodařilo vytvořit.');
    }
    const newThread = normalizeThread(data.thread);
    await refreshThreads(newThread.id, { reloadMessages: true });
    showChatFeedback('Nové vlákno bylo založeno.');
  } catch (error) {
    showChatFeedback(error.message, 'error');
  } finally {
    setButtonLoading(newThreadButton, false);
  }
}

async function toggleFavorite(threadId, { toggleFromToolbar = false } = {}) {
  try {
    const thread = state.threads.find((t) => t.id === threadId);
    if (!thread) {
      return;
    }
    const response = await fetch(`/api/chat/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: !thread.is_favorite })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se změnit oblíbenost.');
    }
    const updatedThread = normalizeThread(data.thread);
    state.threads = state.threads.map((t) => (t.id === threadId ? updatedThread : t));
    if (toggleFromToolbar) {
      showChatFeedback(updatedThread.is_favorite ? 'Vlákno bylo přidáno k oblíbeným.' : 'Vlákno bylo odebráno z oblíbených.');
    }
    renderThreads();
    updateThreadSummary();
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

async function updateThread(threadId, payload) {
  try {
    const response = await fetch(`/api/chat/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Vlákno se nepodařilo aktualizovat.');
    }
    const updatedThread = normalizeThread(data.thread);
    state.threads = state.threads.map((t) => (t.id === threadId ? updatedThread : t));
    renderThreads();
    updateThreadSummary();
    showChatFeedback('Vlákno bylo aktualizováno.');
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

async function clearThread(threadId) {
  try {
    setButtonLoading(clearThreadButton, true, 'Čistím...');
    const response = await fetch(`/api/chat/threads/${threadId}/messages`, {
      method: 'DELETE'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Historii vlákna se nepodařilo vymazat.');
    }
    await loadMessages(threadId);
    await refreshThreads(threadId, { reloadMessages: false });
    showChatFeedback('Historie vlákna byla odstraněna.');
  } catch (error) {
    showChatFeedback(error.message, 'error');
  } finally {
    setButtonLoading(clearThreadButton, false);
  }
}

async function deleteThread(threadId) {
  try {
    const thread = state.threads.find((t) => t.id === threadId);
    const confirmation = confirm(`Opravdu chcete smazat vlákno "${thread?.title || ''}"? Akce je nevratná.`);
    if (!confirmation) {
      return;
    }
    const response = await fetch(`/api/chat/threads/${threadId}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Vlákno se nepodařilo odstranit.');
    }
    await refreshThreads(data.activeThreadId, { reloadMessages: true });
    showChatFeedback('Vlákno bylo smazáno.');
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

async function exportThread(threadId) {
  try {
    const thread = state.threads.find((t) => t.id === threadId);
    const response = await fetch(`/api/chat/history?threadId=${threadId}`);
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst historii pro export.');
    }
    const data = await response.json();
    const exportData = {
      exportedAt: new Date().toISOString(),
      thread,
      messages: data.messages || []
    };
    downloadJson(exportData, `vse-chat-${thread?.title || 'vlákno'}-${Date.now()}.json`);
    showChatFeedback('Vlákno bylo exportováno do souboru.');
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

async function exportAllThreads() {
  try {
    const all = [];
    for (const thread of state.threads) {
      const response = await fetch(`/api/chat/history?threadId=${thread.id}`);
      if (!response.ok) {
        throw new Error('Export byl přerušen kvůli chybě při načítání historie.');
      }
      const data = await response.json();
      all.push({ thread, messages: data.messages || [] });
    }
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: state.user,
      threads: all
    };
    downloadJson(exportData, `vse-chat-export-${Date.now()}.json`);
    showChatFeedback('Všechny konverzace byly exportovány.');
  } catch (error) {
    showChatFeedback(error.message, 'error');
  }
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resetWorkspace() {
  state.threads = [];
  state.activeThreadId = null;
  chatHistoryEl.innerHTML = '';
  appShell.classList.add('hidden');
  authSection.classList.remove('hidden');
  renderThreads();
  updateThreadSummary();
  updateChatEmptyState();
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  themeToggle.textContent = state.theme === 'dark' ? '☀️' : '🌙';
  themeToggle.title = state.theme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv';
}

function resizeComposer() {
  chatMessageInput.style.height = 'auto';
  chatMessageInput.style.height = `${chatMessageInput.scrollHeight}px`;
}

function escapeHtml(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
