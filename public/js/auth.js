/* ── Auth Module ─────────────────────────────────────────── */
let currentUser = null;

function getCurrentUser() { return currentUser; }

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem('qm_user', JSON.stringify(user));
}

function fillDemo(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  document.getElementById('login-email').dispatchEvent(new Event('input'));
  document.getElementById('login-password').dispatchEvent(new Event('input'));
}

function showLogin() {
  document.getElementById('login-panel').classList.add('active');
  document.getElementById('register-panel').classList.remove('active');
}

function showRegister() {
  document.getElementById('register-panel').classList.add('active');
  document.getElementById('login-panel').classList.remove('active');
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  errEl.classList.add('hidden');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const { token, user } = await API.post('/auth/login', { email, password });
    API.setToken(token);
    setCurrentUser(user);
    initApp(user);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// Register form submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const errEl = document.getElementById('register-error');
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  errEl.classList.add('hidden');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const { token, user } = await API.post('/auth/register', { name, email, password });
    API.setToken(token);
    setCurrentUser(user);
    showToast('Account created! Welcome.', 'success');
    initApp(user);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

async function logout() {
  try { await API.post('/auth/logout'); } catch {}
  API.clearToken();
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showLogin();
  showToast('Signed out successfully.');
}

// Auto-login from saved token
function tryAutoLogin() {
  const token = API.getToken();
  const savedUser = localStorage.getItem('qm_user');
  if (token && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      initApp(user);
      return true;
    } catch {}
  }
  return false;
}
