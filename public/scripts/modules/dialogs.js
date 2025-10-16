export function openPrompt(refs, { title, label, defaultValue = '' }) {
  refs.promptTitle.textContent = title;
  refs.promptLabel.textContent = label;
  refs.promptInput.value = defaultValue;
  refs.promptDialog.returnValue = 'cancel';
  refs.promptDialog.showModal();
  refs.promptInput.focus();
  return new Promise((resolve) => {
    refs.promptDialog.addEventListener(
      'close',
      () => {
        if (refs.promptDialog.returnValue === 'confirm') {
          resolve(refs.promptInput.value.trim());
        } else {
          resolve(null);
        }
      },
      { once: true }
    );
  });
}

export function openProjectDialog(refs) {
  refs.projectForm.reset();
  refs.projectColorInput.value = '#2F80ED';
  refs.projectDialog.returnValue = 'cancel';
  refs.projectDialog.showModal();
  refs.projectNameInput.focus();
  return new Promise((resolve) => {
    refs.projectDialog.addEventListener(
      'close',
      () => {
        if (refs.projectDialog.returnValue === 'confirm') {
          resolve({
            name: refs.projectNameInput.value.trim(),
            description: refs.projectDescriptionInput.value.trim(),
            color: refs.projectColorInput.value
          });
        } else {
          resolve(null);
        }
      },
      { once: true }
    );
  });
}

export function openAutomationDialog(refs, defaults = {}) {
  refs.automationForm.reset();
  refs.automationNameInput.value = defaults.name || '';
  refs.automationTriggerInput.value = defaults.trigger || '';
  refs.automationConfigInput.value = defaults.config ? JSON.stringify(defaults.config, null, 2) : '';
  refs.automationActiveInput.checked = defaults.status === 'active';
  refs.automationDialog.returnValue = 'cancel';
  refs.automationDialog.showModal();
  refs.automationNameInput.focus();
  return new Promise((resolve) => {
    refs.automationDialog.addEventListener(
      'close',
      () => {
        if (refs.automationDialog.returnValue === 'confirm') {
          let config = null;
          const rawConfig = refs.automationConfigInput.value.trim();
          if (rawConfig) {
            try {
              config = JSON.parse(rawConfig);
            } catch (error) {
              alert('Konfigurace musí být validní JSON.');
              resolve(null);
              return;
            }
          }
          resolve({
            name: refs.automationNameInput.value.trim(),
            trigger: refs.automationTriggerInput.value.trim(),
            status: refs.automationActiveInput.checked ? 'active' : 'inactive',
            config
          });
        } else {
          resolve(null);
        }
      },
      { once: true }
    );
  });
}
