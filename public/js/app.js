/* ── App Router & Global Shell Controller ─────────────────── */

const ROUTES = {
  dashboard:       { label: 'Dashboard',      icon: '⚡', view: renderDashboard,     roles: ['student', 'admin'] },
  quizzes:         { label: 'Exam Catalog',   icon: '📚', view: renderQuizzes,       roles: ['student', 'admin'] },
  'live-room':     { label: 'Live Trivia Room', icon: '🎮', view: renderLiveRoom,     roles: ['student', 'admin'] },
  duel:            { label: '1v1 Duel Arena', icon: '⚔️', view: renderQuizDuel,      roles: ['student', 'admin'] },
  results:         { label: 'Performance',    icon: '📊', view: renderResults,       roles: ['student', 'admin'] },
  leaderboard:     { label: 'Leaderboard',    icon: '🏆', view: renderLeaderboard,   roles: ['student', 'admin'] },
  profile:         { label: 'My Profile',     icon: '👤', view: renderProfile,       roles: ['student', 'admin'] },
  'admin-quizzes': { label: 'Manage Exams',   icon: '⚙️', view: renderAdminQuizzes, roles: ['admin'] },
  'admin-users':   { label: 'User Directory', icon: '👥', view: renderAdminUsers,   roles: ['admin'] },
  // Hidden Internal Route Handlers
  'quiz-take':     { view: renderQuizTake,    roles: ['student', 'admin'] },
  'quiz-result':   { view: renderQuizResult,  roles: ['student', 'admin'] }
};

let currentRoute = 'dashboard';

function navigate(route, params = {}) {
  currentRoute = route;
  const user = getCurrentUser();

  SoundFX.playClick();

  // Highlight active nav item
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');

  // Render view
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '';

  const routeDef = ROUTES[route];
  if (routeDef && routeDef.roles.includes(user?.role)) {
    routeDef.view(main, params);
  } else {
    main.innerHTML = `
      <div class="view-page">
        <div class="view-header">
          <h1 class="view-title">Access Denied</h1>
        </div>
        <p style="color:var(--ink-70)">You do not have permission to view this section or the page does not exist.</p>
        <button class="btn btn-primary" style="margin-top:1rem" onclick="navigate('dashboard')">Back to Dashboard</button>
      </div>`;
  }
}

function initApp(user) {
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');

  applyTheme(localStorage.getItem('qm_theme') || user.theme || 'dark');
  buildSidebar(user);
  setupMobileMenu();
  setupThemeAndSoundToggles();
  navigate('dashboard');
}

function buildSidebar(user) {
  const nav = document.getElementById('sidebar-nav');
  const roleBadge = document.getElementById('user-role-badge');
  const avatar = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');

  if (roleBadge) roleBadge.textContent = user.role;
  if (avatar) avatar.textContent = user.avatar || user.name[0].toUpperCase();
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;

  // Gamification Pill update
  const levelEl = document.getElementById('sidebar-level');
  const xpEl = document.getElementById('sidebar-xp');
  const streakEl = document.getElementById('sidebar-streak');
  if (levelEl) levelEl.textContent = user.level || 'Scholar';
  if (xpEl) xpEl.textContent = `${(user.xp || 0).toLocaleString()} XP`;
  if (streakEl) streakEl.textContent = user.streak || 1;

  if (!nav) return;

  const mainSection = user.role === 'admin'
    ? `<div class="nav-section-title">General Portal</div>` : '';
  const adminSection = user.role === 'admin'
    ? `<div class="nav-section-title">Administration</div>` : '';

  let mainItems = '', adminItems = '';

  Object.entries(ROUTES).forEach(([key, def]) => {
    if (!def.label || !def.roles.includes(user.role)) return;

    const isAdmin = ['admin-quizzes', 'admin-users'].includes(key);
    const item = `
      <button class="nav-item" data-route="${key}" onclick="navigate('${key}')">
        <span class="nav-icon">${def.icon}</span>
        <span>${def.label}</span>
      </button>`;
    if (isAdmin) adminItems += item;
    else mainItems += item;
  });

  nav.innerHTML = (mainSection + mainItems) +
                  (user.role === 'admin' ? adminSection + adminItems : '');
}

function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

function setupThemeAndSoundToggles() {
  const themeBtns = [
    document.getElementById('theme-toggle-btn'),
    document.getElementById('theme-toggle-mobile'),
    document.getElementById('theme-toggle-auth')
  ];

  themeBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      SoundFX.playClick();
    });
  });

  const soundBtn = document.getElementById('sound-toggle-btn');
  soundBtn?.addEventListener('click', () => {
    const isMuted = SoundFX.isEnabled();
    SoundFX.setEnabled(!isMuted);
    updateSoundBtnState(!isMuted);
    showToast(!isMuted ? 'Sound FX Enabled' : 'Sound Muted', 'info');
  });

  updateSoundBtnState(SoundFX.isEnabled());
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('qm_theme', theme);

  const iconText = theme === 'dark' ? '☀️' : '🌙';
  const themeIcon = document.getElementById('theme-btn-icon');
  if (themeIcon) themeIcon.textContent = iconText;
  const authThemeIcon = document.querySelector('#theme-toggle-auth .theme-icon');
  if (authThemeIcon) authThemeIcon.textContent = iconText;
}

function updateSoundBtnState(enabled) {
  const icon = document.getElementById('sound-btn-icon');
  if (icon) icon.textContent = enabled ? '🔊' : '🔇';
}

/* ── Floating Scratchpad Drawer ─────────────────────────── */
function toggleScratchpad() {
  const drawer = document.getElementById('scratchpad-drawer');
  drawer?.classList.toggle('hidden');
  SoundFX.playClick();
}

/* ── Modal Controller ───────────────────────────────────── */
function openModal(html) {
  const content = document.getElementById('modal-content');
  const overlay = document.getElementById('modal-overlay');
  if (content && overlay) {
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    SoundFX.playClick();
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (overlay && content) {
    overlay.classList.add('hidden');
    content.innerHTML = '';
  }
}

document.getElementById('modal-close')?.addEventListener('click', closeModal);
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

/* ── Toast Notifications ────────────────────────────────── */
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast-msg ${type}`;
  toast.innerHTML = `<span>${icons[type] || '✦'}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

/* ── Utilities ──────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ── Bootstrap ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('qm_theme') || 'dark';
  applyTheme(savedTheme);

  // Initialize Offline Mode & Auto-Sync listener
  OfflineManager.init();

  if (!tryAutoLogin()) {
    document.getElementById('auth-screen')?.classList.remove('hidden');
  }
});
