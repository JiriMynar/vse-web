import { state, VIEW_TITLES } from '../state.js';
import { toggleActive, toggleVisibility } from '../utils/dom.js';
import { closeSidebar, mobileSidebarMedia } from './layout.js';

const viewMap = {
  chat: 'viewChat',
  agentkit: 'viewAgentkit',
  projects: 'viewProjects',
  help: 'viewHelp',
  profile: 'viewProfile',
  admin: 'viewAdmin'
};

export function setView(view, refs, renderers = {}) {
  if (view === 'admin' && (!state.user || !state.user.isAdmin)) {
    view = 'chat';
  }
  state.view = view;

  refs.navButtons.forEach((button) => {
    const targetView = button.dataset.view;
    const isActive = targetView === view;
    toggleActive(button, isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
    if (targetView === 'admin') {
      toggleVisibility(button, Boolean(state.user?.isAdmin));
    }
  });

  const metadata = VIEW_TITLES[view] || VIEW_TITLES.chat;
  refs.viewTitle.textContent = metadata.title;
  refs.viewSubtitle.textContent = metadata.subtitle;

  Object.entries(viewMap).forEach(([key, refName]) => {
    const panel = refs[refName];
    if (!panel) return;
    const isActive = key === view;
    toggleActive(panel, isActive);
    toggleVisibility(panel, isActive, { hiddenClass: 'visually-hidden' });
  });

  if (typeof renderers[view] === 'function') {
    renderers[view]();
  }

  if (view !== 'agentkit' && typeof renderers.agentkitCleanup === 'function') {
    renderers.agentkitCleanup();
  }

  if (mobileSidebarMedia.matches) {
    closeSidebar(refs);
  }
}

export function initNavigation(refs, renderers = {}) {
  refs.navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.view;
      if (target === state.view) {
        if (mobileSidebarMedia.matches) {
          closeSidebar(refs);
        }
        return;
      }
      if (target === 'admin' && (!state.user || !state.user.isAdmin)) {
        return;
      }
      setView(target, refs, renderers);
    });
  });
}
