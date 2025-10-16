import { state } from '../state.js';
import { apiFetch } from './api.js';
import { clearChildren } from '../utils/dom.js';

export async function loadHelp() {
  try {
    const data = await apiFetch('/api/help');
    state.help = data;
  } catch (error) {
    console.error('Nepodařilo se načíst nápovědu', error);
    state.help = null;
  }
}

export function renderHelp(refs) {
  const container = refs.helpContent;
  if (!container) return;
  clearChildren(container);

  if (!state.help) {
    const header = document.createElement('header');
    header.innerHTML = '<h2>Centrum nápovědy</h2><p>Nepodařilo se načíst obsah.</p>';
    container.appendChild(header);
    return;
  }

  const header = document.createElement('header');
  header.innerHTML = `<h2>${state.help.title}</h2><p>${state.help.intro}</p>`;
  container.appendChild(header);

  (state.help.sections || []).forEach((section) => {
    const sectionEl = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = section.title;
    sectionEl.appendChild(title);

    const list = document.createElement('ul');
    (section.items || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    sectionEl.appendChild(list);
    container.appendChild(sectionEl);
  });
}
