/* ── Global Leaderboard & Top Scorers Podium View ──────────── */

async function renderLeaderboard(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">Academic Leaderboard</h1>
          <p class="view-subtitle">Recognizing top scholars based on cumulative Experience Points (XP) and examination mastery.</p>
        </div>
      </div>
      <div id="lb-content-area"></div>
    </div>`;

  try {
    const [data, quizzes] = await Promise.all([
      API.get('/results/leaderboard'),
      API.get('/quizzes')
    ]);

    const user = getCurrentUser();
    const topThree = data.slice(0, 3);
    const rest = data.slice(3);

    // Podium HTML
    const podiumHtml = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;margin-bottom:2.5rem;align-items:flex-end">
        ${topThree[1] ? renderPodiumCard(topThree[1], 2, 'rank-silver', '🥈') : ''}
        ${topThree[0] ? renderPodiumCard(topThree[0], 1, 'rank-gold', '🥇', true) : ''}
        ${topThree[2] ? renderPodiumCard(topThree[2], 3, 'rank-bronze', '🥉') : ''}
      </div>
    `;

    document.getElementById('lb-content-area').innerHTML = `
      ${podiumHtml}

      <div style="display:flex;gap:12px;margin-bottom:1.5rem;align-items:center;flex-wrap:wrap">
        <div class="input-with-icon" style="flex:1;min-width:220px">
          <span class="input-icon">🔍</span>
          <input type="search" id="lb-search" placeholder="Search students by name…" />
        </div>
        <select id="lb-level-filter" style="min-width:160px">
          <option value="All">All Ranks</option>
          <option value="Grandmaster">Grandmaster</option>
          <option value="Master">Master</option>
          <option value="Scholar">Scholar</option>
          <option value="Apprentice">Apprentice</option>
          <option value="Novice">Novice</option>
        </select>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Scholar</th>
                <th>Academic Level</th>
                <th>Total XP</th>
                <th>Assessments</th>
                <th>Avg Accuracy</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody id="lb-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    function renderTableRows(items) {
      const tbody = document.getElementById('lb-table-body');
      if (!tbody) return;

      tbody.innerHTML = items.map((entry, idx) => {
        const isMe = entry.userId === user.id;
        const rank = idx + 1;
        return `
          <tr style="${isMe ? 'background:var(--primary-subtle)' : ''}">
            <td>
              <span class="rank-badge ${rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : ''}">
                ${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
              </span>
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:12px">
                <div class="avatar" style="width:34px;height:34px;font-size:0.8rem">${entry.avatar || entry.userName[0]}</div>
                <div>
                  <strong>${escHtml(entry.userName)}</strong>
                  ${isMe ? '<span style="color:var(--primary);font-size:0.75rem;font-weight:700;margin-left:6px">(You)</span>' : ''}
                </div>
              </div>
            </td>
            <td>
              <span class="pill-tag pill-category">${entry.level || 'Scholar'}</span>
            </td>
            <td><strong style="color:var(--amber)">⚡ ${(entry.xp || 0).toLocaleString()} XP</strong></td>
            <td style="color:var(--ink-70)">${entry.quizzesTaken} attempts</td>
            <td>
              <strong style="color:${entry.avgScore >= 75 ? 'var(--emerald)' : 'var(--amber)'}">${entry.avgScore}%</strong>
            </td>
            <td>🔥 ${entry.streak || 0}</td>
          </tr>
        `;
      }).join('');
    }

    renderTableRows(data);

    // Filtering
    function applyLBFilter() {
      const q = document.getElementById('lb-search').value.toLowerCase().trim();
      const level = document.getElementById('lb-level-filter').value;

      const filtered = data.filter(d => {
        const matchName = d.userName.toLowerCase().includes(q);
        const matchLevel = level === 'All' || d.level === level;
        return matchName && matchLevel;
      });
      renderTableRows(filtered);
    }

    document.getElementById('lb-search').addEventListener('input', applyLBFilter);
    document.getElementById('lb-level-filter').addEventListener('change', applyLBFilter);

  } catch (err) {
    document.getElementById('lb-content-area').innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

function renderPodiumCard(student, rank, rankClass, medalEmoji, isFirst = false) {
  return `
    <div class="metric-card" style="text-align:center;position:relative;border-color:${isFirst ? 'var(--border-glow)' : 'var(--border-subtle)'};transform:${isFirst ? 'scale(1.05)' : 'none'};box-shadow:${isFirst ? 'var(--shadow-glow)' : 'var(--shadow-sm)'}">
      <div style="font-size:2.5rem;margin-bottom:4px">${medalEmoji}</div>
      <div class="avatar lg" style="margin:0 auto 12px">${student.avatar || student.userName[0]}</div>
      <h3 style="font-family:var(--font-display);font-size:1.15rem;font-weight:800;margin-bottom:2px">${escHtml(student.userName)}</h3>
      <span class="pill-tag pill-category" style="margin-bottom:12px;display:inline-block">${student.level || 'Scholar'}</span>
      <div style="font-size:1.35rem;font-weight:800;color:var(--amber);font-family:var(--font-display)">
        ⚡ ${(student.xp || 0).toLocaleString()} XP
      </div>
      <div style="font-size:0.75rem;color:var(--ink-40);margin-top:4px">
        ${student.quizzesTaken} exams · ${student.avgScore}% avg accuracy
      </div>
    </div>
  `;
}
