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

