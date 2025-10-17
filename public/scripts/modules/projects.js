import { state } from '../state.js';
import { apiFetch } from './api.js';
import { toggleVisibility, clearChildren } from '../utils/dom.js';
import { formatRelativeTime } from '../utils/datetime.js';

async function fetchProjects() {
  try {
    const { projects } = await apiFetch('/api/projects');
    state.projects = projects;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw error;
    }
    const message = error?.message
      ? `Nepodařilo se načíst projekty: ${error.message}`
      : 'Nepodařilo se načíst projekty.';
    const contextualError = new Error(message);
    if (typeof error?.status === 'number') {
      contextualError.status = error.status;
    }
    throw contextualError;
  }
}

async function fetchAutomations(projectId) {
  if (!projectId) {
    state.automations = [];
    return;
  }
  try {
    const { automations } = await apiFetch(`/api/automations/project/${projectId}`);
    state.automations = automations;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw error;
    }
    const message = error?.message
      ? `Nepodařilo se načíst automatizace: ${error.message}`
      : 'Nepodařilo se načíst automatizace.';
    const contextualError = new Error(message);
    if (typeof error?.status === 'number') {
      contextualError.status = error.status;
    }
    throw contextualError;
  }
}

export function renderProjects(refs) {
  clearChildren(refs.projectGrid);
  if (!state.projects.length) {
    toggleVisibility(refs.projectsEmpty, true);
    return;
  }
  toggleVisibility(refs.projectsEmpty, false);

  state.projects.forEach((project) => {
    const node = refs.projectCardTemplate.content.cloneNode(true);
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

    archiveButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      await apiFetch(`/api/projects/${project.id}/archive`, { method: 'POST' });
      await fetchProjects();
      renderProjects(refs);
    });

    card.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      state.selectedProjectId = project.id;
      renderAutomations(refs);
    });

    refs.projectGrid.appendChild(node);
  });
}

export function renderAutomations(refs) {
  clearChildren(refs.automationProjectSelect);
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Vyberte projekt';
  refs.automationProjectSelect.appendChild(placeholderOption);

  state.projects.forEach((project) => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    if (project.id === state.selectedProjectId) {
      option.selected = true;
    }
    refs.automationProjectSelect.appendChild(option);
  });

  if (!state.selectedProjectId) {
    toggleVisibility(refs.automationEmpty, true);
    toggleVisibility(refs.automationList, false);
    if (refs.automationEmptyParagraph) {
      refs.automationEmptyParagraph.textContent = 'Automatizace se zobrazí po výběru projektu s definovanými workflow.';
    }
    return;
  }

  const automations = state.automations.filter((item) => item.project_id === state.selectedProjectId);
  if (!automations.length) {
    toggleVisibility(refs.automationEmpty, true);
    toggleVisibility(refs.automationList, false);
    if (refs.automationEmptyParagraph) {
      refs.automationEmptyParagraph.textContent = 'Pro tento projekt zatím nemáte žádné automatizace.';
    }
    return;
  }

  toggleVisibility(refs.automationEmpty, false);
  toggleVisibility(refs.automationList, true);
  clearChildren(refs.automationList);

  automations.forEach((automation) => {
    const node = refs.automationCardTemplate.content.cloneNode(true);
    const card = node.querySelector('.automation-card');
    const title = card.querySelector('.title');
    const status = card.querySelector('.status');
    const trigger = card.querySelector('.trigger');
    const config = card.querySelector('.config');
    const toggleButton = card.querySelector('[data-action="toggle"]');
    const deleteButton = card.querySelector('[data-action="delete"]');

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
      await fetchAutomations(state.selectedProjectId);
      renderAutomations(refs);
    });

    deleteButton.addEventListener('click', async () => {
      await apiFetch(`/api/automations/${automation.id}`, { method: 'DELETE' });
      await fetchAutomations(state.selectedProjectId);
      renderAutomations(refs);
    });

    refs.automationList.appendChild(node);
  });
}

export async function loadProjectData(refs, { withAutomations = false } = {}) {
  await fetchProjects();
  if (withAutomations && state.selectedProjectId) {
    await fetchAutomations(state.selectedProjectId);
  }
  renderProjects(refs);
  renderAutomations(refs);
}

export async function handleProjectCreation(refs, payload) {
  await apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchProjects();
  renderProjects(refs);
}

export async function handleAutomationCreation(refs, payload) {
  if (!state.selectedProjectId) {
    throw new Error('Vyberte prosím projekt.');
  }
  await apiFetch(`/api/automations/project/${state.selectedProjectId}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchAutomations(state.selectedProjectId);
  renderAutomations(refs);
}

export function initProjectInteractions(refs, { openProjectDialog, openAutomationDialog }) {
  refs.createProjectButton?.addEventListener('click', async () => {
    const result = await openProjectDialog();
    if (!result || !result.name) return;
    await handleProjectCreation(refs, result);
  });

  refs.projectDialog?.querySelector('[value="cancel"]')?.addEventListener('click', () => {
    refs.projectDialog.returnValue = 'cancel';
    refs.projectDialog.close();
  });

  refs.projectForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    refs.projectDialog.returnValue = 'confirm';
    refs.projectDialog.close();
  });

  refs.automationProjectSelect?.addEventListener('change', async () => {
    const projectId = Number(refs.automationProjectSelect.value);
    state.selectedProjectId = projectId || null;
    if (state.selectedProjectId) {
      await fetchAutomations(state.selectedProjectId);
    }
    renderAutomations(refs);
  });

  refs.createAutomationButton?.addEventListener('click', async () => {
    if (!state.selectedProjectId) {
      alert('Vyberte prosím projekt.');
      return;
    }
    const payload = await openAutomationDialog();
    if (!payload) return;
    await handleAutomationCreation(refs, payload);
  });

  refs.automationDialog?.querySelector('[value="cancel"]')?.addEventListener('click', () => {
    refs.automationDialog.returnValue = 'cancel';
    refs.automationDialog.close();
  });

  refs.automationForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    refs.automationDialog.returnValue = 'confirm';
    refs.automationDialog.close();
  });
}
