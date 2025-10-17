import { apiFetch } from './api.js';
import { toggleVisibility, setInputsDisabled, setButtonLoading, setMessage } from '../utils/dom.js';
import { setActiveTab } from './layout.js';

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

function toggleForms(mode, refs) {
  const isLogin = mode === 'login';
  toggleVisibility(refs.loginForm, isLogin);
  toggleVisibility(refs.registerForm, !isLogin);
  setActiveTab(isLogin ? refs.tabLogin : refs.tabRegister, isLogin ? refs.tabRegister : refs.tabLogin);
  const authMessage = resolveAuthMessage(refs);
  if (authMessage) {
    setMessage(authMessage, "");
  }
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
      const workspaceLoaded = await loadWorkspace();
      if (!workspaceLoaded) {
        return;
      }

    } catch (error) {
      const authMessage = resolveAuthMessage(refs);
      if (authMessage) {
        setMessage(authMessage, error.message, "error");
      }
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
      const workspaceLoaded = await loadWorkspace();
      if (!workspaceLoaded) {
        toggleForms('login', refs);
        return;
      }

    } catch (error) {
      const authMessage = resolveAuthMessage(refs);
      if (authMessage) {
        setMessage(authMessage, error.message, "error");
      }
    } finally {
      setInputsDisabled(refs.registerForm, false);
      setButtonLoading(refs.registerForm.querySelector('button[type="submit"]'), false);
    }
  });
}
