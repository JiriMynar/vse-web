function isElement(node) {
  return node instanceof Element;
}

export function toggleVisibility(element, show, { hiddenClass = 'visually-hidden' } = {}) {
  if (!isElement(element)) return;
  element.classList.toggle(hiddenClass, !show);
}

export function toggleActive(element, active, { activeClass = 'is-active' } = {}) {
  if (!isElement(element)) return;
  element.classList.toggle(activeClass, active);
}

export function clearChildren(node) {
  if (!(node instanceof Node)) return;
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function setInputsDisabled(form, disabled) {
  if (!(form instanceof HTMLFormElement)) return;
  Array.from(form.elements).forEach((element) => {
    element.disabled = disabled;
  });
}

export function setButtonLoading(button, loading, text) {
  if (!(button instanceof HTMLElement)) return;
  if (!button.dataset.originalLabel) {
    button.dataset.originalLabel = button.textContent.trim();
  }
  if (loading && text) {
    button.textContent = text;
  } else {
    button.textContent = button.dataset.originalLabel;
  }
  button.disabled = Boolean(loading);
}

export function setMessage(element, message, type = 'info') {
  if (!isElement(element)) return;

  if (!element.dataset.messageBaseClass) {
    element.dataset.messageBaseClass = element.className;
  }

  const baseClasses = element.dataset.messageBaseClass
    .split(' ')
    .filter(Boolean);

  if (!baseClasses.includes('message')) {
    baseClasses.push('message');
  }

  if (!message) {
    element.textContent = '';
    element.className = baseClasses.join(' ');
    return;
  }

  element.textContent = message;

  const classSet = new Set(baseClasses);
  classSet.add('is-visible');

  if (type === 'error') classSet.add('message--error');
  if (type === 'success') classSet.add('message--success');
  if (type === 'info') classSet.add('message--info');

  element.className = Array.from(classSet).join(' ');
}
