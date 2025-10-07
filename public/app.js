const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const chatForm = document.getElementById('chat-form');
const chatHistoryEl = document.getElementById('chat-history');
const chatSection = document.getElementById('chat-section');
const authSection = document.getElementById('auth-section');
const authMessage = document.getElementById('auth-message');
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const loginTab = document.getElementById('show-login');
const registerTab = document.getElementById('show-register');
const messageTemplate = document.getElementById('message-template');

loginTab.addEventListener('click', () => toggleForms('login'));
registerTab.addEventListener('click', () => toggleForms('register'));

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Přihlášení se nezdařilo.');
    }

    showAuthMessage('Přihlášení proběhlo úspěšně.', 'success');
    await loadUserAndChat();
  } catch (error) {
    showAuthMessage(error.message, 'error');
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registrace se nezdařila.');
    }

    showAuthMessage('Registrace proběhla úspěšně.', 'success');
    toggleForms('login');
    await loadUserAndChat();
  } catch (error) {
    showAuthMessage(error.message, 'error');
  }
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('chat-message');
  const message = input.value.trim();
  if (!message) {
    return;
  }

  appendMessage('user', message, new Date());
  input.value = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se získat odpověď od bota.');
    }

    appendMessage('assistant', data.reply, new Date());
  } catch (error) {
    appendMessage('assistant', error.message, new Date());
  }
});

logoutButton.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  chatSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  chatHistoryEl.innerHTML = '';
  showAuthMessage('Byli jste odhlášeni.', 'success');
});

async function loadUserAndChat() {
  try {
    const meResponse = await fetch('/api/me');
    if (!meResponse.ok) {
      throw new Error('Nepodařilo se načíst uživatele.');
    }
    const meData = await meResponse.json();
    const user = meData.user;

    if (user) {
      userInfo.textContent = `${user.name} • ${user.email}`;
      authSection.classList.add('hidden');
      chatSection.classList.remove('hidden');
      chatHistoryEl.innerHTML = '';

      const historyResponse = await fetch('/api/chat/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        (historyData.messages || []).forEach((msg) => {
          appendMessage(msg.role, msg.content, new Date(msg.created_at));
        });
        scrollToBottom();
      }
    }
  } catch (error) {
    authSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    console.error(error);
  }
}

function appendMessage(role, content, date) {
  const clone = messageTemplate.content.cloneNode(true);
  const messageEl = clone.querySelector('.chat-message');
  const metaEl = clone.querySelector('.meta');
  const bubbleEl = clone.querySelector('.bubble');

  messageEl.classList.add(role);
  bubbleEl.textContent = content;
  metaEl.textContent = `${role === 'user' ? 'Vy' : 'Bot'} • ${formatDate(date)}`;

  chatHistoryEl.appendChild(clone);
  scrollToBottom();
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
}

function scrollToBottom() {
  chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
}

function toggleForms(type) {
  if (type === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  }
  showAuthMessage('', '');
}

function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.style.color = type === 'success' ? '#047857' : '#dc2626';
}

loadUserAndChat();
