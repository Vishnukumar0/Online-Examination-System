/* ── Profile & Account Management View ─────────────────────── */

async function renderProfile(container) {
  container.innerHTML = `
    <div class="view-page">
      <div id="prof-loading" style="text-align:center;padding:4rem;color:var(--ink-40)">
        <p>Loading profile details…</p>
      </div>
      <div id="prof-content" class="hidden"></div>
    </div>`;

  try {
    const user = await API.get('/users/me');
    setCurrentUser(user);

    document.getElementById('prof-loading').classList.add('hidden');
    const content = document.getElementById('prof-content');
    content.classList.remove('hidden');

    const badges = [
      { id: 'first_quiz', name: 'First Step', icon: '🎯', desc: 'Completed your first assessment' },
      { id: 'perfect_score', name: 'Perfectionist', icon: '🌟', desc: 'Scored 100% on an exam' },
      { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Finished in record time' },
      { id: 'streak_7', name: '7-Day Fire', icon: '🔥', desc: '7-day active study streak' },
      { id: 'quiz_master', name: 'Grandmaster', icon: '👑', desc: '2,000+ XP milestone' }
    ];

    const userBadges = new Set(user.badges || []);

    content.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Scholar Profile & Settings</h1>
          <p class="view-subtitle">Manage your personal credentials, study preferences, and view earned milestones.</p>
        </div>
      </div>

      <!-- Identity Banner -->
      <div class="metric-card" style="margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:1.5rem">
          <div class="avatar lg">${user.avatar || user.name[0]}</div>
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <h2 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800">${escHtml(user.name)}</h2>
              <span class="pill-tag pill-category">${user.level || 'Scholar'}</span>
            </div>
            <p style="color:var(--ink-70);font-size:0.9rem;margin-top:2px">
              ${escHtml(user.email)} · <strong style="color:var(--amber)">⚡ ${(user.xp || 0).toLocaleString()} XP</strong> · 🔥 ${user.streak || 1}-day streak
            </p>
          </div>
        </div>

        <button class="btn btn-danger btn-sm" onclick="logout()">
          <span>⎋</span> Sign Out
        </button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px">
        <!-- Edit Profile Form -->
        <div class="metric-card">
          <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;margin-bottom:1rem">Account Settings</h3>
          <form id="profile-edit-form" class="auth-form">
            <div class="field">
              <label>Full Name</label>
              <input id="prof-name" value="${escHtml(user.name)}" required />
            </div>

            <div class="field">
              <label>Registered Email</label>
              <input value="${escHtml(user.email)}" disabled style="opacity:0.6;cursor:not-allowed" />
            </div>

            <div class="field">
              <label>Current Password (only to change)</label>
              <input type="password" id="prof-curr-pass" placeholder="••••••••" />
            </div>

            <div class="field">
              <label>New Security Password</label>
              <input type="password" id="prof-new-pass" placeholder="Minimum 6 characters" />
            </div>

            <button type="submit" class="btn btn-primary btn-glow" style="margin-top:10px">
              Save Profile Updates →
            </button>
          </form>
        </div>

        <!-- Earned Achievements Shelf -->
        <div class="metric-card">
          <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;margin-bottom:1rem">Earned Milestones</h3>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${badges.map(b => {
              const unlocked = userBadges.has(b.id);
              return `
                <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid ${unlocked ? 'var(--border-glow)' : 'var(--border-subtle)'};opacity:${unlocked ? '1' : '0.45'}">
                  <span style="font-size:1.75rem">${b.icon}</span>
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:0.9rem">${b.name}</div>
                    <div style="font-size:0.75rem;color:var(--ink-40)">${b.desc}</div>
                  </div>
                  <span style="font-size:0.75rem;font-weight:700;color:${unlocked ? 'var(--emerald)' : 'var(--ink-40)'}">
                    ${unlocked ? 'UNLOCKED ✓' : 'LOCKED 🔒'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('profile-edit-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const payload = {
          name: document.getElementById('prof-name').value
        };

        const newPass = document.getElementById('prof-new-pass').value;
        const currPass = document.getElementById('prof-curr-pass').value;

        if (newPass) {
          payload.currentPassword = currPass;
          payload.newPassword = newPass;
        }

        const { user: updated } = await API.put('/users/me', payload);
        setCurrentUser(updated);
        buildSidebar(updated);
        showToast('Profile updated successfully!', 'success');
        renderProfile(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

  } catch (err) {
    container.innerHTML = `<div class="view-page"><div class="form-error">${err.message}</div></div>`;
  }
}
