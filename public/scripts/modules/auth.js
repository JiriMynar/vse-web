import { apiFetch } from './api.js';
import { toggleVisibility, setInputsDisabled, setButtonLoading, setMessage } from '../utils/dom.js';
import { setActiveTab } from './layout.js';

function toggleForms(mode, refs) {
  const isLogin = mode === 'login';
  toggleVisibility(refs.loginForm, isLogin);
  toggleVisibility(refs.registerForm, !isLogin);
  setActiveTab(isLogin ? refs.tabLogin : refs.tabRegister, isLogin ? refs.tabRegister : refs.tabLogin);
  setMessage(refs.authMessage, '');
}

export function initAuth(refs, loadWorkspace) {
  toggleForms('login', refs);

  refs.tabLogin?.addEventListener('click', () => toggleForms('login', refs));
  refs.tabRegister?.addEventListener('click', () => toggleForms('register', refs));

  refs.loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      setInputsDisabled(refs.loginForm, true);
      setButtonLoading(refs.loginForm.querySelector('button[type="submit"]'), true, 'Přihlašuji…');
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setMessage(refs.authMessage, 'Přihlášení proběhlo úspěšně.', 'success');
      await loadWorkspace();
    } catch (error) {
      setMessage(document.getElementById('auth-message'), error.message, 'error');
    } finally {
      setInputsDisabled(refs.loginForm, false);
      setButtonLoading(refs.loginForm.querySelector('button[type="submit"]'), false);
    }
  });

  refs.registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      setInputsDisabled(refs.registerForm, true);
      setButtonLoading(refs.registerForm.querySelector('button[type="submit"]'), true, 'Registruji…');
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      setMessage(refs.authMessage, 'Registrace proběhla úspěšně.', 'success');
      toggleForms('login', refs);
      await loadWorkspace();
    } catch (error) {
      setMessage(document.getElementById('auth-message'), error.message, 'error');
    } finally {
      setInputsDisabled(refs.registerForm, false);
      setButtonLoading(refs.registerForm.querySelector('button[type="submit"]'), false);
    }
  });
}
