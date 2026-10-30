/* ── Admin User Directory with CSV Export & Role Controls ─────── */

async function renderAdminUsers(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">User & Scholar Directory</h1>
          <p class="view-subtitle">Manage enrolled student accounts, promote administrators, and export institutional grading reports.</p>
        </div>
        <div>
          <a class="btn btn-outline" href="/api/results/export/csv" download="quiz_master_results_export.csv" target="_blank">
            <span>📥</span> Export Results (CSV)
          </a>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Scholar Name</th>
                <th>Email Address</th>
                <th>System Role</th>
                <th>Rank Tier</th>
                <th>Total XP</th>
                <th>Registered Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-users-table"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  try {
    const users = await API.get('/users');
    const me = getCurrentUser();
    const tbody = document.getElementById('admin-users-table');

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px">
            <div class="avatar" style="width:36px;height:36px;font-size:0.85rem">${u.avatar || u.name[0]}</div>
            <div>
              <strong>${escHtml(u.name)}</strong>
              ${u.id === me.id ? '<span style="color:var(--primary);font-size:0.75rem;font-weight:700;margin-left:6px">(You)</span>' : ''}
            </div>
          </div>
        </td>
        <td style="font-family:var(--font-code);font-size:0.85rem">${escHtml(u.email)}</td>
        <td>
          <select onchange="updateUserRole('${u.id}', this.value)" ${u.id === me.id ? 'disabled' : ''} style="padding:4px 8px;font-size:0.8rem">
            <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator</option>
          </select>
        </td>
        <td><span class="pill-tag pill-category">${u.level || 'Scholar'}</span></td>
        <td><strong style="color:var(--amber)">⚡ ${(u.xp || 0).toLocaleString()} XP</strong></td>
        <td style="color:var(--ink-40)">${formatDate(u.createdAt)}</td>
        <td>
          ${u.id !== me.id ? `
            <button class="btn btn-ghost btn-sm" style="color:var(--rose)" onclick="deleteUserItem('${u.id}')">Delete</button>
          ` : '<span style="color:var(--ink-40);font-size:0.75rem">—</span>'}
        </td>
      </tr>
    `).join('');

    window.updateUserRole = async (id, role) => {
      try {
        await API.put(`/users/${id}/role`, { role });
        showToast('Role updated successfully', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    window.deleteUserItem = async (id) => {
      if (!confirm('Permanently delete this user account and their test submissions?')) return;
      try {
        await API.del(`/users/${id}`);
        showToast('User deleted', 'success');
        renderAdminUsers(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

  } catch (err) {
    container.innerHTML = `<div class="view-page"><div class="form-error">${err.message}</div></div>`;
  }
}
