import { state } from '../state.js';
import { apiFetch } from './api.js';
import { setInputsDisabled, setButtonLoading, setMessage } from '../utils/dom.js';

export function renderProfile(refs) {
  if (!state.user || !refs.profileNameInput) return;
  refs.profileNameInput.value = state.user.name || '';
  setMessage(refs.profileMessage, '');
}

export function initProfile(refs, updateWorkspaceUser) {
  refs.profileNameForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.user) return;
    const name = refs.profileNameInput.value.trim();
    if (!name) {
      setMessage(refs.profileMessage, 'Jméno nemůže být prázdné.', 'error');
      return;
    }
    try {
      setInputsDisabled(refs.profileNameForm, true);
      setButtonLoading(refs.profileNameForm.querySelector('button[type="submit"]'), true, 'Ukládám…');
      const { user } = await apiFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      state.user = user;
      updateWorkspaceUser(user);
      renderProfile(refs);
      setMessage(refs.profileMessage, 'Jméno bylo úspěšně aktualizováno.', 'success');
    } catch (error) {
      setMessage(refs.profileMessage, error.message, 'error');
    } finally {
      setInputsDisabled(refs.profileNameForm, false);
      setButtonLoading(refs.profileNameForm.querySelector('button[type="submit"]'), false);
    }
  });

  refs.profilePasswordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.user) return;
    const currentPassword = refs.profileCurrentPasswordInput.value;
    const newPassword = refs.profileNewPasswordInput.value;
    const confirmPassword = refs.profileConfirmPasswordInput.value;
    if (newPassword !== confirmPassword) {
      setMessage(refs.profileMessage, 'Nové heslo se neshoduje s potvrzením.', 'error');
      return;
    }
    try {
      setInputsDisabled(refs.profilePasswordForm, true);
      setButtonLoading(refs.profilePasswordForm.querySelector('button[type="submit"]'), true, 'Ukládám…');
      await apiFetch('/api/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      refs.profilePasswordForm.reset();
      setMessage(refs.profileMessage, 'Heslo bylo úspěšně změněno.', 'success');
    } catch (error) {
      setMessage(refs.profileMessage, error.message, 'error');
    } finally {
      setInputsDisabled(refs.profilePasswordForm, false);
      setButtonLoading(refs.profilePasswordForm.querySelector('button[type="submit"]'), false);
    }
  });
}
