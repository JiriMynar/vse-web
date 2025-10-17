import { refs, initializeRefs } from './scripts/dom.js';
import { state } from './scripts/state.js';
import { apiFetch, tryRefresh } from './scripts/modules/api.js';
import { initTheme, applyTheme } from './scripts/modules/theme.js';
import { initLayout, closeSidebar, mobileSidebarMedia } from './scripts/modules/layout.js';
import { initAuth } from './scripts/modules/auth.js';
import { initChat, loadThreads, renderChatView, teardownChatStreams } from './scripts/modules/chat.js';
import {
  initAgentkit,
  renderAgentkit,
  showAgentkitSaveFeedback,
  teardownAgentkit,
  resetAgentkitMessages
} from './scripts/modules/agentkit.js';
import {
  loadProjectData,
  renderProjects,
  renderAutomations,
  initProjectInteractions
} from './scripts/modules/projects.js';
import { initProfile, renderProfile } from './scripts/modules/profile.js';
import { initAdmin, loadAdminUsers, renderAdminUsers } from './scripts/modules/admin.js';
import { loadHelp, renderHelp } from './scripts/modules/help.js';
import { openProjectDialog, openAutomationDialog } from './scripts/modules/dialogs.js';
import { initNavigation, setView } from './scripts/modules/navigation.js';
import { toggleVisibility, setMessage } from './scripts/utils/dom.js';

function resolveAuthMessage(refs) {
  const current = refs.authMessage;
  if (current instanceof Element) {
    return current;
  }
  const element = document.getElementById('auth-message');
  if (element instanceof Element) {
    refs.authMessage = element;
    return element;
  }
  return null;
}


function updateWorkspaceUser(user) {
  if (!refs.workspaceUser) return;
  const roleLabel = user.isAdmin ? ' • Administrátor' : '';
  refs.workspaceUser.textContent = `${user.name} (${user.email})${roleLabel}`;
  toggleVisibility(refs.navAdminButton, Boolean(user.isAdmin));
}

function toggleAuthVisibility(showAuth) {
  if (refs.authWrapper) {
    refs.authWrapper.hidden = !showAuth;
    refs.authWrapper.classList.toggle('visually-hidden', !showAuth);
  }
  if (refs.workspace) {
    refs.workspace.hidden = showAuth;
    refs.workspace.classList.toggle('visually-hidden', showAuth);
  }
}

async function loadWorkspace() {
  let userResolved = false;
  try {
    state.isLoading = true;
    const { user } = await apiFetch('/api/auth/me');
    userResolved = true;
    state.user = user;
    updateWorkspaceUser(user);
    refs.enterToSendCheckbox.checked = state.enterToSend;
    toggleAuthVisibility(false);
    applyTheme(state.theme, refs);
    setMessage(refs.workspaceMessage, '');

    if (!user.isAdmin && state.view === 'admin') {
      state.view = 'chat';
    }

    await Promise.all([
      loadThreads(refs, { subscribe: true }),
      loadProjectData(refs, { withAutomations: true }),
      loadHelp()
    ]);

    renderHelp(refs);
    renderProjects(refs);
    renderAutomations(refs);
    renderProfile(refs);

    if (state.user.isAdmin) {
      await loadAdminUsers(refs);
    } else {
      state.adminUsers = [];
      renderAdminUsers(refs);
    }

    setView(state.view, refs, viewRenderers);
    setMessage(refs.workspaceMessage, '');
  } catch (error) {
    console.error(error);
    }

    const authMessage = resolveAuthMessage(refs);
    if (authMessage) {
      setMessage(authMessage, '');
    }

    const fallbackMessage = error?.message
      ? `Nepodařilo se načíst pracovní plochu: ${error.message}`
      : 'Nepodařilo se načíst pracovní plochu. Zkuste to prosím znovu.';
    setMessage(refs.workspaceMessage, fallbackMessage, 'error');
  } finally {
    state.isLoading = false;
  }
}

async function handleLogout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  state.user = null;
  state.adminUsers = [];
  state.chatApiConnectors = [];
  teardownChatStreams();
  teardownAgentkit(refs);
  showAgentkitSaveFeedback(refs, '');
  setMessage(refs.workspaceMessage, '');
  if (refs.chatApiDialog?.open) {
    refs.chatApiDialog.close();
  }
  if (refs.chatApiConnectorList) {
    refs.chatApiConnectorList.innerHTML = '';
  }
  setMessage(refs.chatApiMessage, '');
  toggleAuthVisibility(true);
  if (mobileSidebarMedia.matches) {
    closeSidebar(refs);
  }
}

const viewRenderers = {
  chat: () => renderChatView(refs),
  agentkit: () => renderAgentkit(refs),
  projects: () => {
    renderProjects(refs);
    renderAutomations(refs);
  },
  automations: () => {
    renderProjects(refs);
    renderAutomations(refs);
  },
  help: () => renderHelp(refs),
  profile: () => renderProfile(refs),
  admin: () => renderAdminUsers(refs),
  agentkitCleanup: () => resetAgentkitMessages(refs)
};

function initializeDialogs() {
  refs.promptDialog?.addEventListener('submit', (event) => {
    event.preventDefault();
    refs.promptDialog.returnValue = 'confirm';
    refs.promptDialog.close();
  });

  refs.promptDialog?.querySelector('[value="cancel"]')?.addEventListener('click', () => {
    refs.promptDialog.returnValue = 'cancel';
    refs.promptDialog.close();
  });
}

function initializeWorkspace(refs) {
  if (refs.workspace) {
    refs.workspace.hidden = true;
  }
  initLayout(refs);
  initTheme(refs, () => {
    if (state.view === 'agentkit') {
      renderAgentkit(refs);
    }
  });
  initChat(refs);
  initAgentkit(refs);
  initProjectInteractions(refs, {
    openProjectDialog: () => openProjectDialog(refs),
    openAutomationDialog: () => openAutomationDialog(refs)
  });
  initProfile(refs, updateWorkspaceUser);
  initAdmin(refs);
  initNavigation(refs, viewRenderers);
  initAuth(refs, loadWorkspace);
  initializeDialogs();

  refs.logoutButton?.addEventListener('click', handleLogout);

  refs.workspaceMenuToggle?.setAttribute('aria-expanded', 'false');
}

document.addEventListener("DOMContentLoaded", async () => {
  initializeRefs();
  initializeWorkspace(refs);
  applyTheme(state.theme, refs);
  refs.enterToSendCheckbox.checked = state.enterToSend;
    const isAuthenticated = await tryRefresh();
    if (isAuthenticated) {
      toggleAuthVisibility(false);
    }
    if (!isAuthenticated) {
      await loadWorkspace();
    }
});
