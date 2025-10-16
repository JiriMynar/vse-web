import { toggleActive } from '../utils/dom.js';

export const mobileSidebarMedia = window.matchMedia('(max-width: 1080px)');

function syncSidebarState(refs, isOpen) {
  const { workspaceSidebar, sidebarBackdrop, workspaceMenuToggle } = refs;
  workspaceSidebar?.classList.toggle('is-open', isOpen);
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = !isOpen;
    sidebarBackdrop.classList.toggle('is-visible', isOpen);
  }
  if (workspaceMenuToggle) {
    workspaceMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
  document.body.classList.toggle('lock-scroll', isOpen);
}

export function openSidebar(refs) {
  if (!mobileSidebarMedia.matches) return;
  syncSidebarState(refs, true);
}

export function closeSidebar(refs, { restoreFocus = false } = {}) {
  syncSidebarState(refs, false);
  if (restoreFocus && refs.workspaceMenuToggle) {
    refs.workspaceMenuToggle.focus();
  }
}

export function toggleSidebar(refs) {
  const isOpen = refs.workspaceSidebar?.classList.contains('is-open');
  if (isOpen) {
    closeSidebar(refs);
  } else {
    openSidebar(refs);
  }
}

export function initLayout(refs) {
  syncSidebarState(refs, false);

  if (refs.workspaceMenuToggle) {
    refs.workspaceMenuToggle.addEventListener('click', () => toggleSidebar(refs));
  }

  if (refs.sidebarCloseButton) {
    refs.sidebarCloseButton.addEventListener('click', () => closeSidebar(refs, { restoreFocus: true }));
  }

  if (refs.sidebarBackdrop) {
    refs.sidebarBackdrop.addEventListener('click', () => closeSidebar(refs));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && refs.workspaceSidebar?.classList.contains('is-open')) {
      closeSidebar(refs, { restoreFocus: true });
    }
  });

  const handleBreakpoint = (event) => {
    if (!event.matches) {
      closeSidebar(refs);
    }
  };

  if (typeof mobileSidebarMedia.addEventListener === 'function') {
    mobileSidebarMedia.addEventListener('change', handleBreakpoint);
  } else if (typeof mobileSidebarMedia.addListener === 'function') {
    mobileSidebarMedia.addListener(handleBreakpoint);
  }
}

export function setActiveTab(tabToActivate, tabToHide) {
  toggleActive(tabToActivate, true);
  toggleActive(tabToHide, false);
}
