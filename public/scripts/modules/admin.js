import { state } from '../state.js';
import { apiFetch } from './api.js';
import { clearChildren, setMessage } from '../utils/dom.js';
import { formatDateTime } from '../utils/datetime.js';

export async function loadAdminUsers(refs) {
  if (!state.user || !state.user.isAdmin) return;
  try {
    const { users } = await apiFetch('/api/admin/users');
    state.adminUsers = users || [];
    renderAdminUsers(refs);
    if (state.adminUsers.length) {
      setMessage(refs.adminMessage, '');
    } else {
      setMessage(refs.adminMessage, 'Žádní uživatelé zatím nejsou registrovaní.', 'info');
    }
  } catch (error) {
    setMessage(refs.adminMessage, error.message, 'error');
  }
}

export function renderAdminUsers(refs) {
  const body = refs.adminUsersTableBody;
  if (!body) return;
  clearChildren(body);

  if (!state.adminUsers.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'Žádní uživatelé k zobrazení.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    body.appendChild(row);
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
    createdCell.textContent = user.created_at ? formatDateTime(user.created_at) : '';
    row.appendChild(createdCell);

    const actionsCell = document.createElement('td');
    actionsCell.style.display = 'flex';
    actionsCell.style.gap = '0.5rem';

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'button button--ghost';
    resetButton.textContent = 'Reset hesla';
    resetButton.dataset.action = 'reset';
    resetButton.dataset.userId = user.id;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button button--danger';
    deleteButton.textContent = 'Smazat';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.userId = user.id;

    actionsCell.append(resetButton, deleteButton);
    row.appendChild(actionsCell);

    body.appendChild(row);
  });
}

export function initAdmin(refs) {
  refs.adminUsersTableBody?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const userId = Number(button.dataset.userId);
    if (!userId) return;

    const targetUser = state.adminUsers.find((user) => user.id === userId);
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
        const { temporaryPassword } = await apiFetch(`/api/admin/users/${userId}/reset-password`, {
          method: 'POST'
        });
        await loadAdminUsers(refs);
        const name = targetUser ? targetUser.name : 'uživatele';
        setMessage(
          refs.adminMessage,
          `Nové dočasné heslo pro ${name} je: ${temporaryPassword}. Pošlete ho uživateli bezpečným kanálem.`,
          'success'
        );
      } else if (action === 'delete') {
        await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        await loadAdminUsers(refs);
        setMessage(refs.adminMessage, 'Uživatelský účet byl smazán.', 'success');
      }
    } catch (error) {
      setMessage(refs.adminMessage, error.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
