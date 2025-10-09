const authWrapper = document.getElementById('auth-wrapper');
const workspace = document.getElementById('workspace');
const workspaceUser = document.getElementById('workspace-user');
const viewTitle = document.getElementById('view-title');
const viewSubtitle = document.getElementById('view-subtitle');
const navButtons = document.querySelectorAll('.nav-item');
const navAdminButton = document.getElementById('nav-admin');
const logoutButton = document.getElementById('logout');
const themeToggle = document.getElementById('theme-toggle');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');

const createThreadButton = document.getElementById('create-thread');
const threadList = document.getElementById('thread-list');
const threadSearchInput = document.getElementById('thread-search');
const filterButtons = document.querySelectorAll('.chip');
const exportAllButton = document.getElementById('export-all');
const clearAllButton = document.getElementById('clear-all');
const chatHistory = document.getElementById('chat-history');
const chatEmpty = document.getElementById('chat-empty');
const chatForm = document.getElementById('chat-form');
const chatMessageInput = document.getElementById('chat-message');
const chatFeedback = document.getElementById('chat-feedback');
const enterToSendCheckbox = document.getElementById('enter-to-send');
const messageTemplate = document.getElementById('message-template');

const favoriteThreadButton = document.getElementById('favorite-thread');
const renameThreadButton = document.getElementById('rename-thread');
const exportThreadButton = document.getElementById('export-thread');
const clearThreadButton = document.getElementById('clear-thread');
const deleteThreadButton = document.getElementById('delete-thread');
const activeThreadTitle = document.getElementById('active-thread-title');
const activeThreadMeta = document.getElementById('active-thread-meta');
const insightMessages = document.getElementById('insight-messages');
const insightActivity = document.getElementById('insight-activity');
const insightFavorite = document.getElementById('insight-favorite');

const viewChat = document.getElementById('view-chat');
const viewProjects = document.getElementById('view-projects');
const viewAutomations = document.getElementById('view-automations');
const viewHelp = document.getElementById('view-help');
const viewProfile = document.getElementById('view-profile');
const viewAdmin = document.getElementById('view-admin');

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

const ENTER_TO_SEND_KEY = 'vse-enter-to-send';
const THEME_KEY = 'vse-theme';
const VIEW_TITLES = {
  chat: {
    title: 'Chat',
    subtitle: 'Spravujte konverzace a sledujte odpovědi v reálném čase.'
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
  adminUsers: []
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
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
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
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || 'Došlo k chybě při komunikaci se serverem.');
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function tryRefresh() {
  try {
    await apiFetch('/api/auth/refresh', { method: 'POST' });
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
    avatar.textContent = message.role === 'user' ? '👤' : '🤖';
    meta.textContent = `${message.role === 'user' ? 'Vy' : 'Asistent'} • ${dateTimeFormatter.format(new Date(message.created_at))}`;
    content.textContent = message.content;
    chatHistory.appendChild(node);
  });
  chatHistory.scrollTop = chatHistory.scrollHeight;
  renderThreadHeader();
}

function renderThreadHeader() {
  const thread = state.threads.find((t) => t.id === state.activeThreadId);
  if (!thread) {
    activeThreadTitle.textContent = 'Vyberte vlákno';
    activeThreadMeta.textContent = '';
    insightMessages.textContent = '0 zpráv';
    insightActivity.textContent = 'Žádná aktivita';
    insightFavorite.textContent = 'Neoblíbené';
    favoriteThreadButton.setAttribute('aria-pressed', 'false');
    favoriteThreadButton.textContent = '☆';
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
  favoriteThreadButton.setAttribute('aria-pressed', thread.is_favorite ? 'true' : 'false');
  favoriteThreadButton.textContent = thread.is_favorite ? '★' : '☆';
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
  });

  const meta = VIEW_TITLES[view] || VIEW_TITLES.chat;
  const { title, subtitle } = meta;
  viewTitle.textContent = title;
  viewSubtitle.textContent = subtitle;

  viewChat.classList.toggle('hidden', view !== 'chat');
  viewProjects.classList.toggle('hidden', view !== 'projects');
  viewAutomations.classList.toggle('hidden', view !== 'automations');
  viewHelp.classList.toggle('hidden', view !== 'help');
  if (viewProfile) {
    viewProfile.classList.toggle('hidden', view !== 'profile');
  }
  if (viewAdmin) {
    viewAdmin.classList.toggle('hidden', view !== 'admin');
  }

  if (view === 'projects') {
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
          state.messages.push({
            role: payload.message.role,
            content: payload.message.content,
            created_at: payload.message.created_at
          });
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
    workspace.classList.add('hidden');
    authWrapper.classList.remove('hidden');
    if (navAdminButton) {
      navAdminButton.classList.add('hidden');
    }
    showProfileMessage('');
    showAdminMessage('');
    if (state.threadStream) state.threadStream.close();
    if (state.messageStream) state.messageStream.close();
  });

  navButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const view = button.dataset.view;
      if (view === state.view) return;
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

  themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  createThreadButton.addEventListener('click', async () => {
    const thread = await apiFetch('/api/chat/threads', { method: 'POST', body: JSON.stringify({}) });
    state.activeThreadId = thread.thread.id;
    await loadThreads({ preserveActive: true });
    await loadMessages(state.activeThreadId);
    subscribeToMessages(state.activeThreadId);
  });

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

  favoriteThreadButton.addEventListener('click', async () => {
    if (!state.activeThreadId) return;
    const thread = state.threads.find((t) => t.id === state.activeThreadId);
    await apiFetch(`/api/chat/threads/${state.activeThreadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_favorite: !thread.is_favorite })
    });
    await loadThreads({ preserveActive: true });
  });

  renameThreadButton.addEventListener('click', async () => {
    if (!state.activeThreadId) return;
    const thread = state.threads.find((t) => t.id === state.activeThreadId);
    const newTitle = await openPrompt({ title: 'Přejmenovat vlákno', label: 'Nový název', defaultValue: thread.title });
    if (newTitle) {
      await apiFetch(`/api/chat/threads/${state.activeThreadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle })
      });
      await loadThreads({ preserveActive: true });
    }
  });

  exportThreadButton.addEventListener('click', () => {
    if (!state.activeThreadId) return;
    const thread = state.threads.find((t) => t.id === state.activeThreadId);
    const blob = new Blob([
      JSON.stringify({ thread, messages: state.messages }, null, 2)
    ], { type: 'application/json' });
    downloadBlob(blob, `thread-${thread.id}.json`);
  });

  clearThreadButton.addEventListener('click', async () => {
    if (!state.activeThreadId) return;
    await apiFetch(`/api/chat/threads/${state.activeThreadId}/messages`, { method: 'DELETE' });
    state.messages = [];
    renderMessages();
  });

  deleteThreadButton.addEventListener('click', async () => {
    if (!state.activeThreadId) return;
    await apiFetch(`/api/chat/threads/${state.activeThreadId}`, { method: 'DELETE' });
    await loadThreads({ preserveActive: true });
    if (state.activeThreadId) {
      await loadMessages(state.activeThreadId);
      subscribeToMessages(state.activeThreadId);
    }
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

  exportAllButton.addEventListener('click', () => {
    const blob = new Blob([
      JSON.stringify({ threads: state.threads }, null, 2)
    ], { type: 'application/json' });
    downloadBlob(blob, 'threads-export.json');
  });

  clearAllButton.addEventListener('click', async () => {
    await apiFetch('/api/chat/history', { method: 'DELETE' });
    await loadThreads();
    renderMessages();
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatMessageInput.value.trim();
    if (!message || !state.activeThreadId) {
      showChatFeedback('Vyberte prosím vlákno a zadejte zprávu.', 'error');
      return;
    }
    chatMessageInput.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;
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
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function bootstrap() {
  applyTheme(state.theme);
  enterToSendCheckbox.checked = state.enterToSend;
  initEventListeners();
  await tryRefresh();
  await loadWorkspace();
}

bootstrap();
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
