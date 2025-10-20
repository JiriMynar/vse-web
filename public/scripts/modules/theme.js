import { state, STORAGE_KEYS } from '../state.js';
import { updateUserPreferences } from './settings.js';

function updateThemeIcon(themeToggle) {
  if (!themeToggle) return;
  const icon = themeToggle.querySelector('use');
  const isDark = state.theme === 'dark';
  if (icon) {
    icon.setAttribute('href', isDark ? '#icon-moon' : '#icon-sun');
  }
  const accessibleLabel = isDark ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv';
  themeToggle.setAttribute('aria-label', accessibleLabel);
  themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  themeToggle.title = accessibleLabel;
}

export function applyTheme(theme, refs) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  updateThemeIcon(refs.themeToggle);
}

export function initTheme(refs, onThemeChange) {
  applyTheme(state.theme, refs);
  if (!refs.themeToggle) return;
  refs.themeToggle.addEventListener('click', async () => {
    const previousTheme = state.theme;
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, refs);
    if (typeof onThemeChange === 'function') {
      onThemeChange(nextTheme);
    }

    try {
      await updateUserPreferences({ theme: nextTheme });
    } catch (error) {
      console.error('Uložení nastavení motivu selhalo:', error);
      applyTheme(previousTheme, refs);
      if (typeof onThemeChange === 'function') {
        onThemeChange(previousTheme);
      }
    }
  });
}
