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

export function renderProjects(refs) {
  clearChildren(refs.projectGrid);
  if (!state.projects.length) {
    toggleVisibility(refs.projectsEmpty, true);
    toggleVisibility(refs.projectGrid, false);
    return;
  }
  toggleVisibility(refs.projectsEmpty, false);
  toggleVisibility(refs.projectGrid, true);

  state.projects.forEach((project) => {
    const node = refs.projectCardTemplate.content.cloneNode(true);
    const card = node.querySelector('.project-card');
    const badge = card.querySelector('.badge');
    const title = card.querySelector('.title');
    const meta = card.querySelector('.meta');
    const description = card.querySelector('.description');
    const status = card.querySelector('.status');
    const archiveButton = card.querySelector('[data-action="archive"]');

    badge.style.background = project.color || '#3b82f6';
    title.textContent = project.name;
    meta.textContent = project.status === 'archived'
      ? 'Archivováno'
      : `Aktualizace ${formatRelativeTime(project.updated_at)}`;
    description.textContent = project.description || 'Bez popisu';
    const statusLabel = project.status === 'archived' ? 'Archivováno' : project.status === 'draft' ? 'Koncept' : 'Aktivní';
    status.textContent = `Stav: ${statusLabel}`;
    archiveButton.disabled = project.status === 'archived';

    archiveButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (project.status === 'archived') {
        return;
      }
      await apiFetch(`/api/projects/${project.id}/archive`, { method: 'POST' });
      await fetchProjects();
      renderProjects(refs);
    });

    refs.projectGrid.appendChild(node);
  });
}

export async function loadProjectData(refs) {
  await fetchProjects();
  renderProjects(refs);
}

export async function handleProjectCreation(refs, payload) {
  await apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchProjects();
  renderProjects(refs);
}

export function initProjectInteractions(refs, { openProjectDialog }) {
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
}
