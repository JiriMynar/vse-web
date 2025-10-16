export function toggleVisibility(element, show, { hiddenClass = 'visually-hidden' } = {}) {
  if (!element) return;
  element.classList.toggle(hiddenClass, !show);
}

export function toggleActive(element, active, { activeClass = 'is-active' } = {}) {
  if (!element) return;
  element.classList.toggle(activeClass, active);
}

export function clearChildren(node) {
  if (!node) return;
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function setInputsDisabled(form, disabled) {
  if (!form) return;
  Array.from(form.elements).forEach((element) => {
    element.disabled = disabled;
  });
}

export function setButtonLoading(button, loading, text) {
  if (!button) return;
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
  if (!element) return;
  if (!message) {
    element.textContent = '';
    element.className = 'message';
    element.classList.remove('is-visible');
    return;
  }
  element.textContent = message;
  const base = ['message', 'is-visible'];
  if (type === 'error') base.push('message--error');
  if (type === 'success') base.push('message--success');
  if (type === 'info') base.push('message--info');
  element.className = base.join(' ');
}
