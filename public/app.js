const authWrapper = document.getElementById('auth-wrapper');
const workspace = document.getElementById('workspace');
const workspaceUser = document.getElementById('workspace-user');
const viewTitle = document.getElementById('view-title');
const viewSubtitle = document.getElementById('view-subtitle');
const navButtons = document.querySelectorAll('.nav-item');
const navAdminButton = document.getElementById('nav-admin');
const logoutButton = document.getElementById('logout');
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = themeToggle ? themeToggle.querySelector('.icon') : null;
const workspaceSidebar = document.querySelector('.workspace-sidebar');
const workspaceMenuToggle = document.getElementById('workspace-menu-toggle');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const sidebarCloseButton = document.getElementById('sidebar-close');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');

const createThreadButton = document.getElementById('create-thread');
const threadList = document.getElementById('thread-list');
const threadSearchInput = document.getElementById('thread-search');
const filterButtons = document.querySelectorAll('.chip');
const chatHistory = document.getElementById('chat-history');
const chatEmpty = document.getElementById('chat-empty');
const chatForm = document.getElementById('chat-form');
const chatMessageInput = document.getElementById('chat-message');
const chatFeedback = document.getElementById('chat-feedback');
const enterToSendCheckbox = document.getElementById('enter-to-send');
const messageTemplate = document.getElementById('message-template');

const chatApiSettingsButton = document.getElementById('chat-api-settings');
const activeThreadTitle = document.getElementById('active-thread-title');
const activeThreadMeta = document.getElementById('active-thread-meta');
const insightMessages = document.getElementById('insight-messages');
const insightActivity = document.getElementById('insight-activity');
const insightFavorite = document.getElementById('insight-favorite');

const chatApiDialog = document.getElementById('chat-api-dialog');
const chatApiCloseButton = document.getElementById('chat-api-close');
const chatApiMessage = document.getElementById('chat-api-message');
const chatApiConnectorList = document.getElementById('chat-api-connector-list');
const chatApiConnectorTemplate = document.getElementById('chat-api-connector-template');

const viewChat = document.getElementById('view-chat');
const viewAgentkit = document.getElementById('view-agentkit');
const viewProjects = document.getElementById('view-projects');
const viewAutomations = document.getElementById('view-automations');
const viewHelp = document.getElementById('view-help');
const viewProfile = document.getElementById('view-profile');
const viewAdmin = document.getElementById('view-admin');

const agentkitMessage = document.getElementById('agentkit-message');
const agentkitPlaceholder = document.getElementById('agentkit-placeholder');
const agentkitChatContainer = document.getElementById('agentkit-chat-container');
const agentkitSettingsButton = document.getElementById('agentkit-settings-button');
const agentkitOpenSettingsButton = document.getElementById('agentkit-open-settings');
const agentkitSettingsDialog = document.getElementById('agentkit-settings-dialog');
const agentkitSettingsForm = document.getElementById('agentkit-settings-form');
const agentkitWorkflowInput = document.getElementById('agentkit-workflow-id');
const agentkitOpenaiKeyInput = document.getElementById('agentkit-openai-key');
const agentkitChatkitBaseInput = document.getElementById('agentkit-chatkit-base');
const agentkitSaveMessage = document.getElementById('agentkit-save-message');

const createProjectButton = document.getElementById('create-project');
const projectsEmpty = document.getElementById('projects-empty');
const projectGrid = document.getElementById('project-grid');
const projectCardTemplate = document.getElementById('project-card-template');
const projectDialog = document.getElementById('project-dialog');
const projectForm = document.getElementById('project-form');
const projectNameInput = document.getElementById('project-name');
const projectDescriptionInput = document.getElementById('project-description');
const projectColorInput = document.getElementById('project-color');

const automationProjectSelect = document.getElementById('automation-project');
const createAutomationButton = document.getElementById('create-automation');
const automationEmpty = document.getElementById('automation-empty');
const automationList = document.getElementById('automation-list');
const automationCardTemplate = document.getElementById('automation-card-template');
const automationDialog = document.getElementById('automation-dialog');
const automationForm = document.getElementById('automation-form');
const automationNameInput = document.getElementById('automation-name');
const automationTriggerInput = document.getElementById('automation-trigger');
const automationConfigInput = document.getElementById('automation-config');
const automationActiveInput = document.getElementById('automation-active');
const automationEmptyParagraph = automationEmpty.querySelector('p');
const automationEmptyDefaultText = automationEmptyParagraph ? automationEmptyParagraph.textContent : '';

const helpContent = document.getElementById('help-content');
const promptDialog = document.getElementById('prompt-dialog');
const promptTitle = document.getElementById('prompt-title');
const promptLabel = document.getElementById('prompt-label');
const promptInput = document.getElementById('prompt-input');
const profileMessage = document.getElementById('profile-message');
const profileNameForm = document.getElementById('profile-name-form');
const profileNameInput = document.getElementById('profile-name');
const profilePasswordForm = document.getElementById('profile-password-form');
const profileCurrentPasswordInput = document.getElementById('profile-current-password');
const profileNewPasswordInput = document.getElementById('profile-new-password');
const profileConfirmPasswordInput = document.getElementById('profile-confirm-password');
const adminMessage = document.getElementById('admin-message');
const adminUsersTable = document.getElementById('admin-users-table');
const adminUsersTableBody = adminUsersTable ? adminUsersTable.querySelector('tbody') : null;

const ENTER_TO_SEND_KEY = 'vse-enter-to-send';
const THEME_KEY = 'vse-theme';
const AGENTKIT_WORKFLOW_KEY = 'user_agentkit_workflow_id';
const AGENTKIT_OPENAI_KEY = 'user_openai_api_key';
const AGENTKIT_CHATKIT_BASE_KEY = 'user_chatkit_api_base';
const DEFAULT_CHATKIT_BASE = 'https://api.openai.com/v1/agentkit';
const CREATE_SESSION_ENDPOINT = '/api/create-session';

let agentkitSaveMessageTimeoutId = null;
const mobileSidebarMedia = window.matchMedia('(max-width: 1080px)');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const VIEW_TITLES = {
  chat: {
    title: 'Chat',
    subtitle: 'Spravujte konverzace a sledujte odpovědi v reálném čase.'
  },
  agentkit: {
    title: 'Agentkit',
    subtitle: 'Propojte Agentkit workflow a chatujte s vlastním agentem.'
  },
  projects: {
    title: 'Projekty',
    subtitle: 'Organizujte si jednotlivé moduly a připravte se na další nástroje.'
  },
  automations: {
    title: 'Automatizace',
    subtitle: 'Navrhujte workflow, které automatizují vaši práci.'
  },
  help: {
    title: 'Nápověda',
    subtitle: 'Zjistěte, jak fungují jednotlivé části platformy.'
  },
  profile: {
    title: 'Profil',
    subtitle: 'Spravujte své osobní údaje a zabezpečení účtu.'
  },
  admin: {
    title: 'Administrace',
    subtitle: 'Dozorujte uživatelské účty a obnovujte přístupy.'
  }
};

const storedAgentkitWorkflow = (localStorage.getItem(AGENTKIT_WORKFLOW_KEY) || '').trim();
const storedAgentkitOpenaiKey = (localStorage.getItem(AGENTKIT_OPENAI_KEY) || '').trim();
const storedAgentkitBase = (localStorage.getItem(AGENTKIT_CHATKIT_BASE_KEY) || '').trim();

const state = {
  user: null,
  view: 'chat',
  threads: [],
  filteredThreads: [],
  activeThreadId: null,
  threadFilter: 'all',
  threadSearch: '',
  messages: [],
  threadStream: null,
  messageStream: null,
  projects: [],
  automations: [],
  selectedProjectId: null,
  help: null,
  enterToSend: localStorage.getItem(ENTER_TO_SEND_KEY) === 'true',
  theme: localStorage.getItem(THEME_KEY) || 'dark',
  isLoading: false,
  adminUsers: [],
  chatApiConnectors: [],
  agentkit: {
    workflowId: storedAgentkitWorkflow,
    openaiApiKey: storedAgentkitOpenaiKey,
    chatkitApiBase: storedAgentkitBase,
    isMounted: false,
    isInitializing: false,
    instance: null,
    unmount: null,
    scriptPromise: null
  }
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat('cs', { numeric: 'auto' });
const dateTimeFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const isDark = theme === 'dark';
  const icon = isDark ? '🌙' : '☀️';
  const label = isDark ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv';
  if (themeToggleIcon) {
    themeToggleIcon.textContent = icon;
  } else if (themeToggle) {
    themeToggle.textContent = icon;
  }
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    themeToggle.title = label;
  }
}

// Responsivní navigace: správa mobilního menu a uzamčení pozadí během otevření.
function syncSidebarState(isOpen) {
  if (!workspace) return;
  workspace.classList.toggle('sidebar-open', isOpen);
  if (workspaceSidebar) {
    workspaceSidebar.setAttribute('data-open', isOpen ? 'true' : 'false');
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = !isOpen;
  }
  if (workspaceMenuToggle) {
    workspaceMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
  document.body.classList.toggle('lock-scroll', isOpen);
}

function openSidebar() {
  if (!mobileSidebarMedia.matches) return;
  syncSidebarState(true);
}

function closeSidebar({ restoreFocus = false } = {}) {
  syncSidebarState(false);
  if (restoreFocus && workspaceMenuToggle) {
    workspaceMenuToggle.focus();
  }
}

function toggleSidebar() {
  if (!workspace) return;
  const isOpen = workspace.classList.contains('sidebar-open');
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function handleSidebarBreakpointChange(event) {
  if (!event.matches) {
    // Návrat na desktop – vždy zavřeme overlay a obnovíme posun.
    closeSidebar();
  }
}

function toggleForms(mode) {
  if (mode === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
  authMessage.textContent = '';
}

function showAuthMessage(message, type = 'info') {
  authMessage.textContent = message;
  authMessage.className = `message ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`.trim();
}

function showChatFeedback(message, type = 'info') {
  chatFeedback.textContent = message;
  chatFeedback.className = `message ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`.trim();
  if (!message) {
    chatFeedback.classList.add('hidden');
  } else {
    chatFeedback.classList.remove('hidden');
  }
}

function setChatApiMessage(message, type = 'info') {
  if (!chatApiMessage) return;
  if (!message) {
    chatApiMessage.textContent = '';
    chatApiMessage.className = 'message hidden';
    return;
  }
  chatApiMessage.textContent = message;
  chatApiMessage.className = `message ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`.trim();
}

function setAgentkitStatus(message, type = 'info') {
  if (!agentkitMessage) return;
  if (!message) {
    agentkitMessage.textContent = '';
    agentkitMessage.className = 'message hidden';
    return;
  }
  agentkitMessage.textContent = message;
  agentkitMessage.className = `message ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`.trim();
}

function showProfileMessage(message, type = 'info') {
  if (!profileMessage) return;
  profileMessage.textContent = message;
  profileMessage.className = `message ${
    type === 'error' ? 'error' : type === 'success' ? 'success' : ''
  }`.trim();
  if (!message) {
    profileMessage.classList.add('hidden');
  } else {
    profileMessage.classList.remove('hidden');
  }
}

function showAdminMessage(message, type = 'info') {
  if (!adminMessage) return;
  adminMessage.textContent = message;
  adminMessage.className = `message ${
    type === 'error' ? 'error' : type === 'success' ? 'success' : ''
  }`.trim();
  if (!message) {
    adminMessage.classList.add('hidden');
  } else {
    adminMessage.classList.remove('hidden');
  }
}

function setInputsDisabled(form, disabled) {
  Array.from(form.elements).forEach((el) => {
    el.disabled = disabled;
  });
}

function setButtonLoading(button, loading, text) {
  if (!button) return;
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }
  button.textContent = loading && text ? text : button.dataset.originalText;
  button.disabled = loading;
}

async function apiFetch(url, options = {}) {
  const { skipAuthRefresh, ...fetchOptions } = options;
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) },
    ...fetchOptions
  });

  if (response.status === 401 && !skipAuthRefresh && !url.startsWith('/api/auth/refresh')) {
    const originalPayload = await response.clone().json().catch(() => ({}));
    try {
      await refreshSession();
      return apiFetch(url, { ...fetchOptions, skipAuthRefresh: true });
    } catch (refreshError) {
      if (!refreshError.status) {
        refreshError.status = 401;
      }
      if (!refreshError.message) {
        refreshError.message = originalPayload.message || 'Nejste přihlášen(a).';
      }
      throw refreshError;
    }
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || 'Došlo k chybě při komunikaci se serverem.');
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function refreshSession() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    return;
  }

  const payload = await response.json().catch(() => ({}));
  const error = new Error(payload.message || 'Přihlášení vypršelo, přihlaste se prosím znovu.');
  error.status = response.status;
  throw error;
}

async function tryRefresh() {
  try {
    await apiFetch('/api/auth/refresh', { method: 'POST', skipAuthRefresh: true });
  } catch (error) {
    console.error('Refresh token selhal', error);
  }
}

async function loadWorkspace() {
  try {
    state.isLoading = true;
    const [{ user }] = await Promise.all([
      apiFetch('/api/auth/me')
    ]);
    state.user = user;
    const roleLabel = user.isAdmin ? ' • Administrátor' : '';
    workspaceUser.textContent = `${user.name} (${user.email})${roleLabel}`;
    if (navAdminButton) {
      navAdminButton.classList.toggle('hidden', !user.isAdmin);
    }
    if (!user.isAdmin && state.view === 'admin') {
      state.view = 'chat';
    }
    renderProfile();
    authWrapper.classList.add('hidden');
    workspace.classList.remove('hidden');
    applyTheme(state.theme);
    enterToSendCheckbox.checked = state.enterToSend;
    await Promise.all([
      loadThreads({ subscribe: true }),
      loadProjects(),
      loadHelp()
    ]);
    if (state.user.isAdmin && state.view === 'admin') {
      await loadAdminUsers();
    }
    setView(state.view);
  } catch (error) {
    console.error(error);
    if (error.status && error.status !== 401) {
      showAuthMessage('Přihlášení vypršelo, přihlaste se prosím znovu.', 'error');
    }
    state.user = null;
    state.adminUsers = [];
    workspace.classList.add('hidden');
    authWrapper.classList.remove('hidden');
    if (navAdminButton) {
      navAdminButton.classList.add('hidden');
    }
    showProfileMessage('');
    showAdminMessage('');
  } finally {
    state.isLoading = false;
  }
}

async function loadThreads(options = {}) {
  const { subscribe = false, preserveActive = false } = options;
  const data = await apiFetch('/api/chat/threads');
  state.threads = data.threads;
  if (preserveActive && state.activeThreadId) {
    const exists = state.threads.some((thread) => thread.id === state.activeThreadId);
    state.activeThreadId = exists ? state.activeThreadId : data.activeThreadId;
  } else {
    state.activeThreadId = data.activeThreadId;
  }
  filterThreads();
  renderThreads();
  if (state.activeThreadId) {
    await loadMessages(state.activeThreadId);
    subscribeToMessages(state.activeThreadId);
  }
  if (subscribe) {
    subscribeToThreads();
  }
}

async function loadMessages(threadId) {
  const data = await apiFetch(`/api/chat/history?threadId=${threadId}`);
  state.messages = data.messages;
  state.activeThreadId = data.threadId;
  renderMessages();
}

async function sendMessage(message) {
  const payload = await apiFetch('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ message, threadId: state.activeThreadId })
  });
  const targetThreadId = payload.threadId || state.activeThreadId;
  if (targetThreadId) {
    await loadMessages(targetThreadId);
    subscribeToMessages(targetThreadId);
  }
  showChatFeedback('Odpověď byla odeslána.');
  return payload;
}

function filterThreads() {
  const query = state.threadSearch.toLowerCase();
  state.filteredThreads = state.threads.filter((thread) => {
    const matchesSearch = thread.title.toLowerCase().includes(query) || (thread.last_message || '').toLowerCase().includes(query);
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

function renderThreads() {
  threadList.innerHTML = '';
  if (!state.filteredThreads.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Žádná vlákna neodpovídají hledání.';
    threadList.appendChild(empty);
    return;
  }

  state.filteredThreads.forEach((thread) => {
    const button = document.createElement('button');
    button.dataset.threadId = thread.id;
    button.classList.toggle('active', thread.id === state.activeThreadId);

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = thread.title;

    const meta = document.createElement('span');
    meta.className = 'meta';
    const parts = [];
    if (thread.message_count) {
      parts.push(`${thread.message_count} zpráv`);
    }
    if (thread.last_activity) {
      parts.push(`Aktualizace ${formatRelativeTime(thread.last_activity)}`);
    }
    if (thread.is_favorite) {
      parts.push('★ Oblíbené');
    }
    meta.textContent = parts.join(' • ');

    const preview = document.createElement('span');
    preview.className = 'meta';
    preview.textContent = thread.last_message ? truncate(thread.last_message, 90) : 'Bez zpráv';

    button.append(title, meta, preview);
    const listItem = document.createElement('li');
    listItem.appendChild(button);
    threadList.appendChild(listItem);
  });

  renderThreadHeader();
}

function renderMessages() {
  chatHistory.innerHTML = '';
  if (!state.messages.length) {
    chatEmpty.classList.remove('hidden');
  } else {
    chatEmpty.classList.add('hidden');
  }

  state.messages.forEach((message) => {
    const node = messageTemplate.content.cloneNode(true);
    const root = node.querySelector('.chat-message');
    const avatar = root.querySelector('.avatar');
    const meta = root.querySelector('.meta');
    const content = root.querySelector('.content');
    if (root) {
      root.dataset.role = message.role;
    }
    avatar.textContent = message.role === 'user' ? '👤' : '🤖';
    meta.textContent = `${message.role === 'user' ? 'Vy' : 'Asistent'} • ${dateTimeFormatter.format(new Date(message.created_at))}`;
    content.textContent = message.content;
    chatHistory.appendChild(node);
  });
  const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
  chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior });
  renderThreadHeader();
}

function renderChatApiSettings() {
  if (!chatApiConnectorList || !chatApiConnectorTemplate) {
    return;
  }
  chatApiConnectorList.innerHTML = '';
  if (!state.chatApiConnectors.length) {
    setChatApiMessage('Žádné konektory nejsou dostupné.', 'info');
    return;
  }

  state.chatApiConnectors.forEach((connector) => {
    const fragment = chatApiConnectorTemplate.content.cloneNode(true);
    const section = fragment.querySelector('.api-connector');
    const nameEl = fragment.querySelector('.connector-name');
    const descriptionEl = fragment.querySelector('.connector-description');
    const statusEl = fragment.querySelector('.connector-status');
    const activeRadio = fragment.querySelector('.connector-active input');
    const form = fragment.querySelector('.connector-form');
    const fieldsContainer = fragment.querySelector('.connector-fields');
    const submitButton = form.querySelector('button[type="submit"]');
    const feedback = fragment.querySelector('.connector-feedback');

    section.dataset.provider = connector.provider;
    nameEl.textContent = connector.name;
    descriptionEl.textContent = connector.description;

    const sanitizedProvider = connector.provider.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');

    const updateStatus = () => {
      if (!statusEl) return;
      const parts = [];
      if (connector.isActive) {
        parts.push('Aktivní');
      }
      if (connector.hasKey) {
        const keyParts = ['Klíč uložen'];
        if (connector.keyPreview) {
          keyParts.push(`…${connector.keyPreview}`);
        }
        parts.push(keyParts.join(' '));
      } else {
        parts.push('Klíč není uložen');
      }
      if (connector.updatedAt) {
        parts.push(`aktualizováno ${formatRelativeTime(connector.updatedAt)}`);
      }
      statusEl.textContent = parts.join(' • ');
    };

    updateStatus();

    if (activeRadio) {
      activeRadio.value = connector.provider;
      activeRadio.checked = Boolean(connector.isActive);
      activeRadio.disabled = !connector.hasKey;
      activeRadio.title = connector.hasKey
        ? 'Používat tento konektor pro odpovědi asistenta.'
        : 'Nejprve uložte konfiguraci, poté jej můžete aktivovat.';

      activeRadio.addEventListener('change', async () => {
        if (!activeRadio.checked) {
          return;
        }
        if (!connector.hasKey) {
          activeRadio.checked = false;
          setChatApiMessage('Nejprve uložte konfiguraci vybraného konektoru.', 'error');
          return;
        }
        try {
          activeRadio.disabled = true;
          const response = await apiFetch('/api/chat/api-settings', {
            method: 'POST',
            body: JSON.stringify({ provider: connector.provider, isActive: true })
          });
          if (response?.connectors) {
            state.chatApiConnectors = response.connectors;
            renderChatApiSettings();
          }
          if (response?.message) {
            setChatApiMessage(response.message, 'success');
          }
        } catch (error) {
          activeRadio.checked = Boolean(connector.isActive);
          setChatApiMessage(error.message, 'error');
        } finally {
          if (document.body.contains(activeRadio)) {
            activeRadio.disabled = false;
          }
        }
      });
    }

    if (fieldsContainer) {
      fieldsContainer.innerHTML = '';
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

        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);

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
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!feedback) return;
      feedback.textContent = '';
      feedback.classList.add('hidden');

      const formData = new FormData(form);
      const payload = { provider: connector.provider, isActive: Boolean(activeRadio?.checked) };

      (connector.fields || []).forEach((field) => {
        const raw = formData.get(field.name);
        if (typeof raw !== 'string') {
          return;
        }
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
          renderChatApiSettings();
        }
        if (response?.message) {
          setChatApiMessage(response.message, 'success');
        }
      } catch (error) {
        feedback.textContent = error.message;
        feedback.className = 'connector-feedback message error';
        feedback.classList.remove('hidden');
      } finally {
        setInputsDisabled(form, false);
        setButtonLoading(submitButton, false);
      }
    });

    chatApiConnectorList.appendChild(fragment);
  });
}

async function loadChatApiSettings(options = {}) {
  if (!chatApiConnectorList) return;
  const { silent = false } = options;
  try {
    if (!silent) {
      setChatApiMessage('Načítám nastavení…');
    }
    const { connectors } = await apiFetch('/api/chat/api-settings');
    state.chatApiConnectors = connectors;
    renderChatApiSettings();
    if (!silent) {
      setChatApiMessage('');
    }
  } catch (error) {
    state.chatApiConnectors = [];
    chatApiConnectorList.innerHTML = '';
    setChatApiMessage(error.message, 'error');
    throw error;
  }
}

function renderThreadHeader() {
  const thread = state.threads.find((t) => t.id === state.activeThreadId);
  if (!thread) {
    activeThreadTitle.textContent = 'Vyberte vlákno';
    activeThreadMeta.textContent = '';
    insightMessages.textContent = '0 zpráv';
    insightActivity.textContent = 'Žádná aktivita';
    insightFavorite.textContent = 'Neoblíbené';
    chatForm.classList.add('hidden');
    return;
  }

  chatForm.classList.remove('hidden');
  activeThreadTitle.textContent = thread.title;
  const parts = [];
  if (thread.created_at) {
    parts.push(`Založeno ${dateTimeFormatter.format(new Date(thread.created_at))}`);
  }
  if (thread.last_activity) {
    parts.push(`Naposledy ${formatRelativeTime(thread.last_activity)}`);
  }
  activeThreadMeta.textContent = parts.join(' • ');
  insightMessages.textContent = `${thread.message_count || 0} zpráv`;
  insightActivity.textContent = thread.last_activity ? `Aktivita ${formatRelativeTime(thread.last_activity)}` : 'Žádná aktivita';
  insightFavorite.textContent = thread.is_favorite ? 'Oblíbené' : 'Neoblíbené';
}

function setView(view) {
  if (view === 'admin' && (!state.user || !state.user.isAdmin)) {
    view = 'chat';
  }

  state.view = view;
  navButtons.forEach((button) => {
    const targetView = button.dataset.view;
    if (targetView === 'admin') {
      button.classList.toggle('hidden', !state.user || !state.user.isAdmin);
    }
    button.classList.toggle('active', targetView === view);
    button.setAttribute('aria-current', targetView === view ? 'page' : 'false');
  });

  const meta = VIEW_TITLES[view] || VIEW_TITLES.chat;
  const { title, subtitle } = meta;
  viewTitle.textContent = title;
  viewSubtitle.textContent = subtitle;

  viewChat.classList.toggle('hidden', view !== 'chat');
  if (viewAgentkit) {
    viewAgentkit.classList.toggle('hidden', view !== 'agentkit');
  }
  viewProjects.classList.toggle('hidden', view !== 'projects');
  viewAutomations.classList.toggle('hidden', view !== 'automations');
  viewHelp.classList.toggle('hidden', view !== 'help');
  if (viewProfile) {
    viewProfile.classList.toggle('hidden', view !== 'profile');
  }
  if (viewAdmin) {
    viewAdmin.classList.toggle('hidden', view !== 'admin');
  }

  if (view === 'agentkit') {
    renderAgentkit();
  } else if (view === 'projects') {
    renderProjects();
  } else if (view === 'automations') {
    renderAutomations();
  } else if (view === 'help') {
    renderHelp();
  } else if (view === 'profile') {
    renderProfile();
  } else if (view === 'admin') {
    renderAdminUsers();
  }

  if (view !== 'agentkit') {
    setAgentkitStatus('');
  }

  if (mobileSidebarMedia.matches) {
    closeSidebar();
  }
}

function hasAgentkitConfig() {
  return Boolean(state.agentkit.workflowId && state.agentkit.openaiApiKey);
}

function persistAgentkitConfig(config) {
  localStorage.setItem(AGENTKIT_WORKFLOW_KEY, config.workflowId);
  localStorage.setItem(AGENTKIT_OPENAI_KEY, config.openaiApiKey);
  if (config.chatkitApiBase) {
    localStorage.setItem(AGENTKIT_CHATKIT_BASE_KEY, config.chatkitApiBase);
  } else {
    localStorage.removeItem(AGENTKIT_CHATKIT_BASE_KEY);
  }
}

function showAgentkitSaveFeedback(message) {
  if (!agentkitSaveMessage) return;
  if (agentkitSaveMessageTimeoutId) {
    clearTimeout(agentkitSaveMessageTimeoutId);
    agentkitSaveMessageTimeoutId = null;
  }
  if (!message) {
    agentkitSaveMessage.textContent = '';
    agentkitSaveMessage.classList.add('hidden');
    return;
  }
  agentkitSaveMessage.textContent = message;
  agentkitSaveMessage.classList.remove('hidden');
  agentkitSaveMessageTimeoutId = window.setTimeout(() => {
    if (agentkitSaveMessage) {
      agentkitSaveMessage.textContent = '';
      agentkitSaveMessage.classList.add('hidden');
    }
  }, 3000);
}

function fillAgentkitSettingsForm() {
  if (!agentkitWorkflowInput || !agentkitOpenaiKeyInput || !agentkitChatkitBaseInput) return;
  agentkitWorkflowInput.value = state.agentkit.workflowId || '';
  agentkitOpenaiKeyInput.value = state.agentkit.openaiApiKey || '';
  agentkitChatkitBaseInput.value = state.agentkit.chatkitApiBase || '';
}

function teardownAgentkit() {
  if (state.agentkit.unmount) {
    try {
      state.agentkit.unmount();
    } catch (error) {
      console.error('Agentkit unmount failed', error);
    }
  } else if (state.agentkit.instance) {
    try {
      if (typeof state.agentkit.instance.destroy === 'function') {
        state.agentkit.instance.destroy();
      } else if (typeof state.agentkit.instance.unmount === 'function') {
        state.agentkit.instance.unmount();
      }
    } catch (error) {
      console.error('Agentkit instance cleanup failed', error);
    }
  }
  state.agentkit.unmount = null;
  state.agentkit.instance = null;
  state.agentkit.isMounted = false;
  if (agentkitChatContainer) {
    agentkitChatContainer.innerHTML = '';
  }
}

function resolveAgentkitAdapter() {
  if (window.ChatKitUI && typeof window.ChatKitUI.mount === 'function') {
    return {
      mount: (container, options) => window.ChatKitUI.mount(container, options)
    };
  }
  if (window.ChatKit && typeof window.ChatKit.mount === 'function') {
    return {
      mount: (container, options) => window.ChatKit.mount(container, options)
    };
  }
  if (window.ChatKit && typeof window.ChatKit.createChatKit === 'function') {
    return {
      mount: (container, options) => window.ChatKit.createChatKit({ ...options, element: container })
    };
  }
  return null;
}

async function ensureChatKitLibrary() {
  if (resolveAgentkitAdapter()) {
    return;
  }
  if (state.agentkit.scriptPromise) {
    return state.agentkit.scriptPromise;
  }
  state.agentkit.scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-agentkit-script="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', () => {
        state.agentkit.scriptPromise = null;
        reject(new Error('Nepodařilo se načíst knihovnu ChatKit.'));
      }, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/chatkit.umd.js';
    script.async = true;
    script.dataset.agentkitScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      state.agentkit.scriptPromise = null;
      reject(new Error('Nepodařilo se načíst knihovnu ChatKit.'));
    };
    document.head.appendChild(script);
  });
  return state.agentkit.scriptPromise;
}

async function requestAgentkitClientSecret() {
  const payload = {
    workflowId: state.agentkit.workflowId,
    openaiApiKey: state.agentkit.openaiApiKey,
  };
  if (state.agentkit.chatkitApiBase) {
    payload.chatkitApiBase = state.agentkit.chatkitApiBase;
  }

  const response = await fetch(CREATE_SESSION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  if (!response.ok) {
    try {
      const errorJson = JSON.parse(text);
      if (errorJson?.error) {
        throw new Error(errorJson.error);
      }
    } catch (parseError) {
      // ignore JSON parse errors and fall back to default message
    }
    throw new Error('Nepodařilo se vytvořit sezení pro Agentkit chat.');
  }

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Odpověď služby Agentkit není validní JSON.');
  }
}

async function initializeAgentkitChat({ force = false } = {}) {
  if (!agentkitChatContainer || !hasAgentkitConfig()) {
    return;
  }

  if (state.agentkit.isInitializing) {
    return;
  }

  if (force && state.agentkit.isMounted) {
    teardownAgentkit();
  } else if (state.agentkit.isMounted) {
    return;
  }

  state.agentkit.isInitializing = true;
  setAgentkitStatus('Načítám Agentkit chat…');
  agentkitPlaceholder?.classList.add('hidden');
  agentkitChatContainer.classList.remove('hidden');
  agentkitChatContainer.innerHTML = '';

  try {
    await ensureChatKitLibrary();
    const adapter = resolveAgentkitAdapter();
    if (!adapter) {
      throw new Error('Knihovna ChatKit není dostupná.');
    }

    const mountResult = await adapter.mount(agentkitChatContainer, {
      workflowId: state.agentkit.workflowId,
      baseUrl: state.agentkit.chatkitApiBase || DEFAULT_CHATKIT_BASE,
      theme: document.documentElement.dataset.theme || state.theme,
      getClientSecret: async () => requestAgentkitClientSecret()
    });

    let unmountHandler = null;
    let instance = null;

    if (typeof mountResult === 'function') {
      unmountHandler = mountResult;
    } else if (mountResult && typeof mountResult.unmount === 'function') {
      unmountHandler = () => mountResult.unmount();
      instance = mountResult;
    } else if (mountResult && typeof mountResult.destroy === 'function') {
      unmountHandler = () => mountResult.destroy();
      instance = mountResult;
    } else if (window.ChatKitUI && typeof window.ChatKitUI.unmount === 'function') {
      unmountHandler = () => window.ChatKitUI.unmount(agentkitChatContainer);
    } else if (window.ChatKit && typeof window.ChatKit.unmount === 'function') {
      unmountHandler = () => window.ChatKit.unmount(agentkitChatContainer);
    }

    state.agentkit.unmount = unmountHandler;
    state.agentkit.instance = instance;
    state.agentkit.isMounted = true;
    setAgentkitStatus('');
  } catch (error) {
    console.error('Agentkit chat initialization failed', error);
    const message = error instanceof Error ? error.message : 'Nepodařilo se načíst Agentkit chat.';
    setAgentkitStatus(message, 'error');
    agentkitChatContainer.classList.add('hidden');
    state.agentkit.isMounted = false;
  } finally {
    state.agentkit.isInitializing = false;
  }
}

function renderAgentkit() {
  if (!viewAgentkit) return;
  const isVisible = state.view === 'agentkit';
  const hasConfig = hasAgentkitConfig();

  if (agentkitPlaceholder) {
    agentkitPlaceholder.classList.toggle('hidden', !isVisible || hasConfig);
  }

  if (!isVisible) {
    return;
  }

  if (!hasConfig) {
    teardownAgentkit();
    if (agentkitChatContainer) {
      agentkitChatContainer.classList.add('hidden');
    }
    setAgentkitStatus('Nejprve vyplňte workflow ID a OPENAI_API_KEY v nastavení.', 'info');
    return;
  }

  agentkitChatContainer?.classList.remove('hidden');
  setAgentkitStatus('');
  if (!state.agentkit.isMounted && !state.agentkit.isInitializing) {
    initializeAgentkitChat();
  }
}

function handleAgentkitConfigSaved() {
  const trimmedWorkflow = agentkitWorkflowInput ? agentkitWorkflowInput.value.trim() : '';
  const trimmedApiKey = agentkitOpenaiKeyInput ? agentkitOpenaiKeyInput.value.trim() : '';
  const trimmedBase = agentkitChatkitBaseInput ? agentkitChatkitBaseInput.value.trim() : '';

  state.agentkit.workflowId = trimmedWorkflow;
  state.agentkit.openaiApiKey = trimmedApiKey;
  state.agentkit.chatkitApiBase = trimmedBase;

  persistAgentkitConfig(state.agentkit);
  showAgentkitSaveFeedback('Konfigurace byla uložena.');

  fillAgentkitSettingsForm();
  renderAgentkit();

  if (!trimmedWorkflow || !trimmedApiKey) {
    teardownAgentkit();
    return;
  }

  if (state.view === 'agentkit') {
    initializeAgentkitChat({ force: true });
  }
}

function renderProjects() {
  projectGrid.innerHTML = '';
  if (!state.projects.length) {
    projectsEmpty.classList.remove('hidden');
    return;
  }
  projectsEmpty.classList.add('hidden');
  state.projects.forEach((project) => {
    const node = projectCardTemplate.content.cloneNode(true);
    const card = node.querySelector('.project-card');
    const badge = card.querySelector('.badge');
    const title = card.querySelector('.title');
    const meta = card.querySelector('.meta');
    const description = card.querySelector('.description');
    const statAutomations = card.querySelector('.stat.automations');
    const statRuns = card.querySelector('.stat.runs');
    const archiveButton = card.querySelector('[data-action="archive"]');

    badge.style.background = project.color || '#3b82f6';
    title.textContent = project.name;
    meta.textContent = project.status === 'archived' ? 'Archivováno' : `Aktualizace ${formatRelativeTime(project.updated_at)}`;
    description.textContent = project.description || 'Bez popisu';
    statAutomations.textContent = `${project.automation_count} automatizací`;
    statRuns.textContent = `${project.run_count} běhů`;

    archiveButton.addEventListener('click', async () => {
      await apiFetch(`/api/projects/${project.id}/archive`, { method: 'POST' });
      await loadProjects();
      renderProjects();
    });

    card.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      state.selectedProjectId = project.id;
      setView('automations');
      renderAutomations();
    });

    projectGrid.appendChild(node);
  });
}

function renderAutomations() {
  automationProjectSelect.innerHTML = '';
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Vyberte projekt';
  automationProjectSelect.appendChild(placeholderOption);

  state.projects.forEach((project) => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    if (project.id === state.selectedProjectId) {
      option.selected = true;
    }
    automationProjectSelect.appendChild(option);
  });

  if (!state.selectedProjectId) {
    automationEmpty.classList.remove('hidden');
    if (automationEmptyParagraph) {
      automationEmptyParagraph.textContent = automationEmptyDefaultText;
    }
    automationList.classList.add('hidden');
    return;
  }

  const automations = state.automations.filter((item) => item.project_id === state.selectedProjectId);
  if (!automations.length) {
    automationEmpty.classList.remove('hidden');
    if (automationEmptyParagraph) {
      automationEmptyParagraph.textContent = 'Pro tento projekt zatím nemáte žádné automatizace.';
    }
    automationList.classList.add('hidden');
    return;
  }

  automationEmpty.classList.add('hidden');
  automationList.classList.remove('hidden');
  automationList.innerHTML = '';
  automations.forEach((automation) => {
    const node = automationCardTemplate.content.cloneNode(true);
    const card = node.querySelector('.automation-card');
    const title = card.querySelector('.title');
    const status = card.querySelector('.status');
    const trigger = card.querySelector('.trigger');
    const config = card.querySelector('.config');
    const toggleButton = card.querySelector('[data-action="toggle"]');

    title.textContent = automation.name;
    status.textContent = automation.status === 'active' ? 'Aktivní' : 'Neaktivní';
    trigger.textContent = `Spouštěč: ${automation.trigger}`;
    config.textContent = automation.config ? JSON.stringify(automation.config, null, 2) : 'Bez konfigurace';
    toggleButton.textContent = automation.status === 'active' ? 'Deaktivovat' : 'Aktivovat';

    toggleButton.addEventListener('click', async () => {
      const nextStatus = automation.status === 'active' ? 'inactive' : 'active';
      await apiFetch(`/api/automations/${automation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      await loadAutomations(state.selectedProjectId);
      renderAutomations();
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      await apiFetch(`/api/automations/${automation.id}`, { method: 'DELETE' });
      await loadAutomations(state.selectedProjectId);
      renderAutomations();
    });

    automationList.appendChild(node);
  });
}

function renderProfile() {
  if (!state.user || !profileNameInput) return;
  profileNameInput.value = state.user.name || '';
  showProfileMessage('');
}

function renderAdminUsers() {
  if (!adminUsersTableBody) return;
  adminUsersTableBody.innerHTML = '';

  if (!state.adminUsers.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'Žádní uživatelé k zobrazení.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    adminUsersTableBody.appendChild(row);
    return;
  }

  state.adminUsers.forEach((user) => {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = user.id;
    row.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    row.appendChild(nameCell);

    const emailCell = document.createElement('td');
    emailCell.textContent = user.email;
    row.appendChild(emailCell);

    const roleCell = document.createElement('td');
    roleCell.textContent = user.isAdmin ? 'Administrátor' : 'Uživatel';
    row.appendChild(roleCell);

    const createdCell = document.createElement('td');
    createdCell.textContent = user.createdAt
      ? dateTimeFormatter.format(new Date(user.createdAt))
      : '—';
    row.appendChild(createdCell);

    const actionsCell = document.createElement('td');
    if (user.isAdmin) {
      actionsCell.textContent = '—';
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'actions';

      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'ghost';
      resetButton.dataset.action = 'reset';
      resetButton.dataset.userId = user.id;
      resetButton.textContent = 'Reset hesla';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.userId = user.id;
      deleteButton.textContent = 'Smazat účet';

      wrapper.appendChild(resetButton);
      wrapper.appendChild(deleteButton);
      actionsCell.appendChild(wrapper);
    }
    row.appendChild(actionsCell);

    adminUsersTableBody.appendChild(row);
  });
}

function renderHelp() {
  helpContent.innerHTML = '';
  if (!state.help) {
    const header = document.createElement('header');
    header.innerHTML = '<h2>Centrum nápovědy</h2><p>Nepodařilo se načíst obsah.</p>';
    helpContent.appendChild(header);
    return;
  }

  const header = document.createElement('header');
  header.innerHTML = `<h2>${state.help.title}</h2><p>${state.help.intro}</p>`;
  helpContent.appendChild(header);

  state.help.sections.forEach((section) => {
    const sectionEl = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = section.title;
    const list = document.createElement('ul');
    section.items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    sectionEl.append(title, list);
    helpContent.appendChild(sectionEl);
  });
}

async function loadProjects() {
  const data = await apiFetch('/api/projects');
  state.projects = data.projects;
}

async function loadAutomations(projectId) {
  if (!projectId) return;
  const data = await apiFetch(`/api/automations/project/${projectId}`);
  const sanitized = data.automations.map((item) => ({ ...item, config: item.config || null, project_id: projectId }));
  state.automations = state.automations.filter((item) => item.project_id !== projectId).concat(sanitized);
}

async function loadAdminUsers() {
  if (!state.user || !state.user.isAdmin) return;
  try {
    const data = await apiFetch('/api/admin/users');
    state.adminUsers = data.users || [];
    renderAdminUsers();
    if (state.adminUsers.length) {
      showAdminMessage('');
    } else {
      showAdminMessage('Žádní uživatelé zatím nejsou registrovaní.');
    }
  } catch (error) {
    showAdminMessage(error.message, 'error');
  }
}

async function loadHelp() {
  try {
    const data = await apiFetch('/api/help');
    state.help = data;
  } catch (error) {
    console.error('Nepodařilo se načíst nápovědu', error);
  }
}

function subscribeToThreads() {
  if (state.threadStream) {
    state.threadStream.close();
  }
  const stream = new EventSource('/api/chat/threads/stream', { withCredentials: true });
  stream.addEventListener('message', async (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (
        payload.type === 'thread-created' ||
        payload.type === 'thread-updated' ||
        payload.type === 'thread-activity' ||
        payload.type === 'thread-deleted' ||
        payload.type === 'threads-reset'
      ) {
        const currentThreadId = state.activeThreadId;
        await loadThreads({ subscribe: false, preserveActive: true });
        if (currentThreadId && currentThreadId === state.activeThreadId) {
          await loadMessages(currentThreadId);
          subscribeToMessages(currentThreadId);
        }
      }
    } catch (error) {
      console.error('Chyba při zpracování streamu vláken', error);
    }
  });
  stream.addEventListener('error', () => {
    stream.close();
    setTimeout(subscribeToThreads, 3000);
  });
  state.threadStream = stream;
}

function subscribeToMessages(threadId) {
  if (state.messageStream) {
    state.messageStream.close();
  }
  if (!threadId) return;
  const stream = new EventSource(`/api/chat/threads/${threadId}/stream`, { withCredentials: true });
  stream.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message-created') {
        if (payload.threadId === state.activeThreadId) {
          const messagePayload = payload.message;
          if (!messagePayload) {
            return;
          }
          if (typeof messagePayload.id !== 'undefined') {
            const exists = state.messages.some((item) => item.id === messagePayload.id);
            if (exists) {
              return;
            }
          }
          const incoming = { ...messagePayload };
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
          renderMessages();
        }
      }
      if (payload.type === 'messages-cleared') {
        if (payload.threadId === state.activeThreadId) {
          state.messages = [];
          renderMessages();
        }
      }
    } catch (error) {
      console.error('Chyba streamu zpráv', error);
    }
  });
  stream.addEventListener('error', () => {
    stream.close();
    setTimeout(() => subscribeToMessages(threadId), 3000);
  });
  state.messageStream = stream;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diff = date.getTime() - Date.now();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(seconds) < 60) {
    return relativeTimeFormatter.format(seconds, 'second');
  }
  if (Math.abs(minutes) < 60) {
    return relativeTimeFormatter.format(minutes, 'minute');
  }
  if (Math.abs(hours) < 24) {
    return relativeTimeFormatter.format(hours, 'hour');
  }
  return relativeTimeFormatter.format(days, 'day');
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function openPrompt({ title, label, defaultValue = '' }) {
  promptTitle.textContent = title;
  promptLabel.textContent = label;
  promptInput.value = defaultValue;
  promptDialog.returnValue = 'cancel';
  promptDialog.showModal();
  promptInput.focus();
  return new Promise((resolve) => {
    promptDialog.addEventListener('close', () => {
      if (promptDialog.returnValue === 'confirm') {
        resolve(promptInput.value.trim());
      } else {
        resolve(null);
      }
    }, { once: true });
  });
}

function openProjectDialog() {
  projectForm.reset();
  projectColorInput.value = '#2F80ED';
  projectDialog.returnValue = 'cancel';
  projectDialog.showModal();
  projectNameInput.focus();
  return new Promise((resolve) => {
    projectDialog.addEventListener('close', () => {
      if (projectDialog.returnValue === 'confirm') {
        resolve({
          name: projectNameInput.value.trim(),
          description: projectDescriptionInput.value.trim(),
          color: projectColorInput.value
        });
      } else {
        resolve(null);
      }
    }, { once: true });
  });
}

function openAutomationDialog(defaults = {}) {
  automationForm.reset();
  automationNameInput.value = defaults.name || '';
  automationTriggerInput.value = defaults.trigger || '';
  automationConfigInput.value = defaults.config ? JSON.stringify(defaults.config, null, 2) : '';
  automationActiveInput.checked = defaults.status === 'active';
  automationDialog.returnValue = 'cancel';
  automationDialog.showModal();
  automationNameInput.focus();
  return new Promise((resolve) => {
    automationDialog.addEventListener('close', () => {
      if (automationDialog.returnValue === 'confirm') {
        let config = null;
        if (automationConfigInput.value.trim()) {
          try {
            config = JSON.parse(automationConfigInput.value);
          } catch (error) {
            alert('Konfigurace musí být validní JSON.');
            resolve(null);
            return;
          }
        }
        resolve({
          name: automationNameInput.value.trim(),
          trigger: automationTriggerInput.value.trim(),
          status: automationActiveInput.checked ? 'active' : 'inactive',
          config
        });
      } else {
        resolve(null);
      }
    }, { once: true });
  });
}

function initEventListeners() {
  tabLogin.addEventListener('click', () => toggleForms('login'));
  tabRegister.addEventListener('click', () => toggleForms('register'));

  if (workspaceMenuToggle) {
    workspaceMenuToggle.addEventListener('click', toggleSidebar);
  }

  if (sidebarCloseButton) {
    sidebarCloseButton.addEventListener('click', () => closeSidebar({ restoreFocus: true }));
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => closeSidebar());
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && workspace && workspace.classList.contains('sidebar-open')) {
      closeSidebar({ restoreFocus: true });
    }
  });

  const mediaListener = (event) => handleSidebarBreakpointChange(event);
  if (typeof mobileSidebarMedia.addEventListener === 'function') {
    mobileSidebarMedia.addEventListener('change', mediaListener);
  } else if (typeof mobileSidebarMedia.addListener === 'function') {
    mobileSidebarMedia.addListener(mediaListener);
  }

  syncSidebarState(false);

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      setInputsDisabled(loginForm, true);
      setButtonLoading(loginForm.querySelector('button[type="submit"]'), true, 'Přihlašuji…');
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      showAuthMessage('Přihlášení proběhlo úspěšně.', 'success');
      await loadWorkspace();
    } catch (error) {
      showAuthMessage(error.message, 'error');
    } finally {
      setInputsDisabled(loginForm, false);
      setButtonLoading(loginForm.querySelector('button[type="submit"]'), false);
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      setInputsDisabled(registerForm, true);
      setButtonLoading(registerForm.querySelector('button[type="submit"]'), true, 'Registruji…');
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      showAuthMessage('Registrace proběhla úspěšně.', 'success');
      toggleForms('login');
      await loadWorkspace();
    } catch (error) {
      showAuthMessage(error.message, 'error');
    } finally {
      setInputsDisabled(registerForm, false);
      setButtonLoading(registerForm.querySelector('button[type="submit"]'), false);
    }
  });

  logoutButton.addEventListener('click', async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    state.user = null;
    state.adminUsers = [];
    state.chatApiConnectors = [];
    closeSidebar();
    workspace.classList.add('hidden');
    authWrapper.classList.remove('hidden');
    if (navAdminButton) {
      navAdminButton.classList.add('hidden');
    }
    showProfileMessage('');
    showAdminMessage('');
    if (state.threadStream) state.threadStream.close();
    if (state.messageStream) state.messageStream.close();
    if (chatApiDialog?.open) chatApiDialog.close();
    if (chatApiConnectorList) {
      chatApiConnectorList.innerHTML = '';
    }
    setChatApiMessage('');
    teardownAgentkit();
    setAgentkitStatus('');
    showAgentkitSaveFeedback('');
  });

  navButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const view = button.dataset.view;
      if (view === state.view) {
        if (mobileSidebarMedia.matches) {
          closeSidebar();
        }
        return;
      }
      if (view === 'admin' && (!state.user || !state.user.isAdmin)) return;
      if (view === 'automations' && state.selectedProjectId) {
        await loadAutomations(state.selectedProjectId);
      }
      if (view === 'admin') {
        await loadAdminUsers();
      }
      if (view === 'profile') {
        renderProfile();
      }
      setView(view);
    });
  });

  const openAgentkitSettings = () => {
    fillAgentkitSettingsForm();
    if (agentkitSettingsDialog) {
      agentkitSettingsDialog.returnValue = 'cancel';
      agentkitSettingsDialog.showModal();
    }
  };

  if (agentkitSettingsButton) {
    agentkitSettingsButton.addEventListener('click', openAgentkitSettings);
  }

  if (agentkitOpenSettingsButton) {
    agentkitOpenSettingsButton.addEventListener('click', openAgentkitSettings);
  }

  if (agentkitSettingsForm) {
    agentkitSettingsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (agentkitSettingsDialog) {
        agentkitSettingsDialog.returnValue = 'confirm';
        agentkitSettingsDialog.close();
      }
      handleAgentkitConfigSaved();
    });
  }

  if (agentkitSettingsDialog) {
    const cancelButton = agentkitSettingsDialog.querySelector('button[value="cancel"]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        agentkitSettingsDialog.returnValue = 'cancel';
        agentkitSettingsDialog.close();
      });
    }
    agentkitSettingsDialog.addEventListener('close', () => {
      fillAgentkitSettingsForm();
    });
  }

  themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    if (state.view === 'agentkit' && state.agentkit.isMounted) {
      initializeAgentkitChat({ force: true });
    }
  });

  createThreadButton.addEventListener('click', async () => {
    const thread = await apiFetch('/api/chat/threads', { method: 'POST', body: JSON.stringify({}) });
    state.activeThreadId = thread.thread.id;
    await loadThreads({ preserveActive: true });
    await loadMessages(state.activeThreadId);
    subscribeToMessages(state.activeThreadId);
  });

  if (chatApiSettingsButton) {
    chatApiSettingsButton.addEventListener('click', async () => {
      if (!chatApiDialog) return;
      chatApiDialog.showModal();
      if (chatApiConnectorList) {
        chatApiConnectorList.innerHTML = '';
      }
      state.chatApiConnectors = [];
      setChatApiMessage('Načítám nastavení…');
      try {
        await loadChatApiSettings();
      } catch (error) {
        console.error('Načtení nastavení konektorů selhalo:', error);
      }
    });
  }

  if (chatApiCloseButton && chatApiDialog) {
    chatApiCloseButton.addEventListener('click', () => {
      chatApiDialog.close();
    });
  }

  threadList.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const threadId = Number(button.dataset.threadId);
    state.activeThreadId = threadId;
    renderThreads();
    await loadMessages(threadId);
    subscribeToMessages(threadId);
  });

  threadSearchInput.addEventListener('input', () => {
    state.threadSearch = threadSearchInput.value;
    filterThreads();
    renderThreads();
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      state.threadFilter = button.dataset.filter || 'all';
      filterThreads();
      renderThreads();
    });
  });

  if (profileNameForm) {
    profileNameForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.user) return;
      const name = profileNameInput.value.trim();
      if (!name) {
        showProfileMessage('Jméno nemůže být prázdné.', 'error');
        return;
      }
      try {
        setInputsDisabled(profileNameForm, true);
        setButtonLoading(
          profileNameForm.querySelector('button[type="submit"]'),
          true,
          'Ukládám…'
        );
        const { user } = await apiFetch('/api/users/me', {
          method: 'PUT',
          body: JSON.stringify({ name })
        });
        state.user = user;
        const roleLabel = user.isAdmin ? ' • Administrátor' : '';
        workspaceUser.textContent = `${user.name} (${user.email})${roleLabel}`;
        renderProfile();
        showProfileMessage('Jméno bylo úspěšně aktualizováno.', 'success');
      } catch (error) {
        showProfileMessage(error.message, 'error');
      } finally {
        setInputsDisabled(profileNameForm, false);
        setButtonLoading(profileNameForm.querySelector('button[type="submit"]'), false);
      }
    });
  }

  if (profilePasswordForm) {
    profilePasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.user) return;
      const currentPassword = profileCurrentPasswordInput.value;
      const newPassword = profileNewPasswordInput.value;
      const confirmPassword = profileConfirmPasswordInput.value;
      if (newPassword !== confirmPassword) {
        showProfileMessage('Nové heslo se neshoduje s potvrzením.', 'error');
        return;
      }

      try {
        setInputsDisabled(profilePasswordForm, true);
        setButtonLoading(
          profilePasswordForm.querySelector('button[type="submit"]'),
          true,
          'Ukládám…'
        );
        await apiFetch('/api/users/me/password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        profilePasswordForm.reset();
        showProfileMessage('Heslo bylo úspěšně změněno.', 'success');
      } catch (error) {
        showProfileMessage(error.message, 'error');
      } finally {
        setInputsDisabled(profilePasswordForm, false);
        setButtonLoading(profilePasswordForm.querySelector('button[type="submit"]'), false);
      }
    });
  }

  if (adminUsersTableBody) {
    adminUsersTableBody.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const { action, userId } = button.dataset;
      const numericId = Number(userId);
      if (!numericId) return;
      const targetUser = state.adminUsers.find((user) => user.id === numericId);

      const resetConfirmMessage = 'Opravdu chcete vygenerovat nové heslo pro tento účet?';
      const deleteConfirmMessage = 'Opravdu chcete smazat tento účet? Tuto akci nelze vrátit.';

      if (action === 'reset' && !confirm(resetConfirmMessage)) {
        return;
      }
      if (action === 'delete' && !confirm(deleteConfirmMessage)) {
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Probíhá…';

      try {
        if (action === 'reset') {
          const { temporaryPassword } = await apiFetch(`/api/admin/users/${numericId}/reset-password`, {
            method: 'POST'
          });
          await loadAdminUsers();
          const name = targetUser ? targetUser.name : 'uživatele';
          showAdminMessage(
            `Nové dočasné heslo pro ${name} je: ${temporaryPassword}. Pošlete ho uživateli bezpečným kanálem.`,
            'success'
          );
        } else if (action === 'delete') {
          await apiFetch(`/api/admin/users/${numericId}`, { method: 'DELETE' });
          await loadAdminUsers();
          showAdminMessage('Uživatelský účet byl smazán.', 'success');
        }
      } catch (error) {
        showAdminMessage(error.message, 'error');
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatMessageInput.value.trim();
    if (!message || !state.activeThreadId) {
      showChatFeedback('Vyberte prosím vlákno a zadejte zprávu.', 'error');
      return;
    }
    chatMessageInput.value = '';
    const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
    chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior });
    try {
      state.messages.push({ role: 'user', content: message, created_at: new Date().toISOString() });
      renderMessages();
      await sendMessage(message);
    } catch (error) {
      showChatFeedback(error.message, 'error');
    }
  });

  chatMessageInput.addEventListener('keydown', (event) => {
    if (state.enterToSend && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  enterToSendCheckbox.addEventListener('change', () => {
    state.enterToSend = enterToSendCheckbox.checked;
    localStorage.setItem(ENTER_TO_SEND_KEY, state.enterToSend);
  });

  createProjectButton.addEventListener('click', async () => {
    const result = await openProjectDialog();
    if (!result || !result.name) return;
    await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(result)
    });
    await loadProjects();
    renderProjects();
  });

  projectDialog.querySelector('[value="cancel"]').addEventListener('click', () => {
    projectDialog.returnValue = 'cancel';
    projectDialog.close();
  });

  automationProjectSelect.addEventListener('change', async () => {
    const projectId = Number(automationProjectSelect.value);
    state.selectedProjectId = projectId || null;
    if (state.selectedProjectId) {
      await loadAutomations(state.selectedProjectId);
    }
    renderAutomations();
  });

  createAutomationButton.addEventListener('click', async () => {
    if (!state.selectedProjectId) {
      alert('Vyberte prosím projekt.');
      return;
    }
    const payload = await openAutomationDialog();
    if (!payload) return;
    await apiFetch(`/api/automations/project/${state.selectedProjectId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    await loadAutomations(state.selectedProjectId);
    renderAutomations();
  });

  automationDialog.querySelector('[value="cancel"]').addEventListener('click', () => {
    automationDialog.returnValue = 'cancel';
    automationDialog.close();
  });

  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    projectDialog.returnValue = 'confirm';
    projectDialog.close();
  });

  automationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    automationDialog.returnValue = 'confirm';
    automationDialog.close();
  });

  promptDialog.addEventListener('submit', (event) => {
    event.preventDefault();
    promptDialog.returnValue = 'confirm';
    promptDialog.close();
  });

  promptDialog.querySelector('[value="cancel"]').addEventListener('click', () => {
    promptDialog.returnValue = 'cancel';
    promptDialog.close();
  });

  fillAgentkitSettingsForm();
}

async function bootstrap() {
  applyTheme(state.theme);
  enterToSendCheckbox.checked = state.enterToSend;
  initEventListeners();
  await tryRefresh();
  await loadWorkspace();
}

bootstrap();
