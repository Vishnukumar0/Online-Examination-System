/* ── Dashboard View with Deep Analytics & Gamification ──────── */

async function renderDashboard(container) {
  const user = getCurrentUser();
  container.innerHTML = `
    <div class="view-page">
      <div id="dash-loader" style="text-align:center;padding:4rem;color:var(--ink-40)">
        <div style="font-size:2.5rem;margin-bottom:1rem">⚡</div>
        <p>Loading your academic command center…</p>
      </div>
      <div id="dash-content" class="hidden"></div>
    </div>`;

  try {
    const [quizzes, results, stats, meData] = await Promise.all([
      API.get('/quizzes'),
      API.get('/results/mine'),
      user.role === 'admin' ? API.get('/results/stats') : Promise.resolve(null),
      API.get('/users/me').catch(() => user)
    ]);

    // Update session user with latest XP/Level
    setCurrentUser(meData);

    const totalAttempts = results.length;
    const avgScore = totalAttempts
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalAttempts)
      : 0;
    const passedAttempts = results.filter(r => r.passed).length;
    const perfectScores = results.filter(r => r.score === 100).length;

    // Badges definition
    const allBadges = [
      { id: 'first_quiz', name: 'First Step', icon: '🎯', desc: 'Completed your first assessment' },
      { id: 'perfect_score', name: 'Perfectionist', icon: '🌟', desc: 'Scored 100% on any exam' },
      { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Finished under 40% time limit' },
      { id: 'streak_7', name: '7-Day Fire', icon: '🔥', desc: 'Maintained a 7-day study streak' },
      { id: 'quiz_master', name: 'Grandmaster', icon: '👑', desc: 'Accumulated 2,000+ XP' }
    ];

    const userBadgesSet = new Set(meData.badges || []);

    const badgesHtml = allBadges.map(b => {
      const unlocked = userBadgesSet.has(b.id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-elevated);border:1px solid ${unlocked ? 'var(--border-glow)' : 'var(--border-subtle)'};border-radius:var(--r-md);opacity:${unlocked ? '1' : '0.45'}" title="${b.desc}">
          <span style="font-size:1.5rem">${b.icon}</span>
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:${unlocked ? 'var(--ink)' : 'var(--ink-40)'}">${b.name}</div>
            <div style="font-size:0.7rem;color:var(--ink-40)">${unlocked ? 'Unlocked ✓' : 'Locked 🔒'}</div>
          </div>
        </div>`;
    }).join('');

    // XP calculation to next rank
    const xp = meData.xp || 0;
    let nextLevel = 'Apprentice';
    let nextThreshold = 300;
    let progressPercent = (xp / 300) * 100;

    if (xp >= 2500) {
      nextLevel = 'Legend';
      nextThreshold = 5000;
      progressPercent = 100;
    } else if (xp >= 1500) {
      nextLevel = 'Grandmaster';
      nextThreshold = 2500;
      progressPercent = ((xp - 1500) / 1000) * 100;
    } else if (xp >= 800) {
      nextLevel = 'Master';
      nextThreshold = 1500;
      progressPercent = ((xp - 800) / 700) * 100;
    } else if (xp >= 300) {
      nextLevel = 'Scholar';
      nextThreshold = 800;
      progressPercent = ((xp - 300) / 500) * 100;
    }

    let statsRowHtml = '';
    if (user.role === 'admin' && stats) {
      statsRowHtml = `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Enrolled Students</span><div class="metric-icon-wrap">👥</div></div>
            <div class="metric-value">${stats.totalUsers}</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Published Exams</span><div class="metric-icon-wrap">📚</div></div>
            <div class="metric-value" style="color:var(--accent-cyan)">${stats.totalQuizzes}</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Exam Submissions</span><div class="metric-icon-wrap">📝</div></div>
            <div class="metric-value" style="color:var(--primary)">${stats.totalAttempts}</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Overall Pass Rate</span><div class="metric-icon-wrap">🎯</div></div>
            <div class="metric-value" style="color:var(--emerald)">${stats.passRate}%</div>
          </div>
        </div>`;
    } else {
      statsRowHtml = `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Assessments Taken</span><div class="metric-icon-wrap">📋</div></div>
            <div class="metric-value">${totalAttempts}</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Average Score</span><div class="metric-icon-wrap">📊</div></div>
            <div class="metric-value" style="color:${avgScore >= 75 ? 'var(--emerald)' : 'var(--amber)'}">${avgScore}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Passed Exams</span><div class="metric-icon-wrap">🏆</div></div>
            <div class="metric-value" style="color:var(--emerald)">${passedAttempts}</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">Perfect 100% Runs</span><div class="metric-icon-wrap">🌟</div></div>
            <div class="metric-value" style="color:var(--amber)">${perfectScores}</div>
          </div>
        </div>`;
    }

    const availableQuizzes = quizzes.filter(q => !results.find(r => r.quizId === q.id));

    document.getElementById('dash-loader').classList.add('hidden');
    const content = document.getElementById('dash-content');
    content.classList.remove('hidden');

    content.innerHTML = `
      <!-- Top Gamification Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <h2>Welcome back, ${escHtml(meData.name.split(' ')[0])}! 🚀</h2>
          <p>You are ranked as <strong style="color:var(--accent-cyan)">${meData.level || 'Scholar'}</strong> with <strong style="color:var(--amber)">${(meData.xp || 0).toLocaleString()} XP</strong>. Keep up your ${meData.streak || 1}-day active streak!</p>
          <div style="margin-top:14px;max-width:380px">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:700;color:var(--ink-70);margin-bottom:4px">
              <span>PROGRESS TO ${nextLevel.toUpperCase()}</span>
              <span>${Math.round(progressPercent)}%</span>
            </div>
            <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${progressPercent}%;background:linear-gradient(90deg,var(--primary) 0%,var(--accent-cyan) 100%);border-radius:99px"></div>
            </div>
          </div>
        </div>
        <div class="hero-stats-row">
          <div class="hero-stat-badge">
            <div class="badge-val">🔥 ${meData.streak || 1}</div>
            <div class="badge-lbl">Day Streak</div>
          </div>
          <div class="hero-stat-badge">
            <div class="badge-val">⚡ ${(meData.xp || 0).toLocaleString()}</div>
            <div class="badge-lbl">Experience Points</div>
          </div>
        </div>
      </div>

      ${statsRowHtml}

      <!-- Analytics Charts Row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;margin-bottom:2rem">
        <div class="metric-card">
          <div style="font-size:1rem;font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
            <span>📊</span> Score Distribution
          </div>
          <div id="chart-score-dist" style="min-height:200px"></div>
        </div>
        <div class="metric-card">
          <div style="font-size:1rem;font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
            <span>🎯</span> Category Mastery
          </div>
          <div id="chart-category-donut" style="min-height:200px;display:flex;align-items:center;justify-content:center"></div>
        </div>
      </div>

      <!-- Achievements Showcase -->
      <div style="margin-bottom:2.5rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700">Achievement Badges</h3>
          <span style="font-size:0.8rem;color:var(--ink-40);font-weight:600">${userBadgesSet.size} of ${allBadges.length} Unlocked</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px">
          ${badgesHtml}
        </div>
      </div>

      <!-- Recommended Exams -->
      <div style="margin-bottom:2.5rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
          <div>
            <h3 style="font-family:var(--font-display);font-size:1.35rem;font-weight:700">Recommended Assessments</h3>
            <p style="font-size:0.85rem;color:var(--ink-40)">Hand-picked to elevate your mastery</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="navigate('quizzes')">View Full Catalog →</button>
        </div>
        <div class="quiz-catalog-grid">
          ${(availableQuizzes.length ? availableQuizzes.slice(0, 3) : quizzes.slice(0, 3)).map(q => renderQuizCardHTML(q)).join('')}
        </div>
      </div>

      <!-- Recent History Table -->
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700">Recent Test Attempts</h3>
          ${results.length ? `<button class="btn btn-ghost btn-sm" onclick="navigate('results')">Detailed History →</button>` : ''}
        </div>
        ${results.length ? `
          <div class="table-card">
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>XP Earned</th>
                    <th>Completed On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${results.slice(0, 5).map(r => `
                    <tr>
                      <td><strong>${escHtml(r.quizTitle)}</strong></td>
                      <td><strong style="color:${r.passed ? 'var(--emerald)' : 'var(--rose)'}">${r.score}%</strong></td>
                      <td><span class="badge ${r.passed ? 'badge-pass' : 'badge-fail'}">${r.passed ? 'PASSED' : 'FAILED'}</span></td>
                      <td style="color:var(--amber);font-weight:700">+${r.xpEarned || Math.round(r.score * 1.5)} XP</td>
                      <td style="color:var(--ink-40)">${formatDate(r.submittedAt)}</td>
                      <td>
                        <button class="btn btn-ghost btn-sm" onclick="showResultModal('${r.id}')">Analysis</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div style="text-align:center;padding:3rem;background:var(--bg-surface);border-radius:var(--r-lg);border:1px dashed var(--border-subtle)">
            <p style="color:var(--ink-70);margin-bottom:1rem">You haven't attempted any assessments yet.</p>
            <button class="btn btn-primary btn-sm" onclick="navigate('quizzes')">Take First Exam</button>
          </div>
        `}
      </div>
    `;

    // Render Charts
    const scoreData = [
      { label: '0-20%', value: results.filter(r => r.score <= 20).length, color: 'var(--rose)' },
      { label: '21-40%', value: results.filter(r => r.score > 20 && r.score <= 40).length, color: '#fb7185' },
      { label: '41-60%', value: results.filter(r => r.score > 40 && r.score <= 60).length, color: 'var(--amber)' },
      { label: '61-80%', value: results.filter(r => r.score > 60 && r.score <= 80).length, color: 'var(--primary)' },
      { label: '81-100%', value: results.filter(r => r.score > 80).length, color: 'var(--emerald)' }
    ];
    ChartRenderer.renderBarChart('chart-score-dist', scoreData);

    // Group categories
    const catMap = {};
    quizzes.forEach(q => {
      catMap[q.category] = (catMap[q.category] || 0) + 1;
    });
    const donutColors = ['var(--primary)', 'var(--accent-cyan)', 'var(--accent-purple)', 'var(--emerald)', 'var(--amber)'];
    const donutData = Object.keys(catMap).map((cat, i) => ({
      label: cat,
      value: catMap[cat],
      color: donutColors[i % donutColors.length]
    }));
    ChartRenderer.renderDonut('chart-category-donut', donutData);

  } catch (err) {
    const loader = document.getElementById('dash-loader');
    if (loader) loader.innerHTML = `<div class="form-error">${err.message}</div>`;
    else container.innerHTML = `<div class="view-page"><div class="form-error">${err.message}</div></div>`;
  }
}

function renderQuizCardHTML(q) {
  return `
    <div class="quiz-card-pro" onclick="navigate('quiz-take', { id: '${q.id}' })">
      <div class="quiz-card-top-row">
        <span class="quiz-icon-badge">${q.icon || '⚡'}</span>
        <div class="quiz-badge-group">
          ${q.proctored ? '<span class="pill-tag pill-proctored">🛡️ Proctored</span>' : ''}
          <span class="pill-tag pill-category">${escHtml(q.category)}</span>
          <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
        </div>
      </div>
      <div class="quiz-title-text">${escHtml(q.title)}</div>
      <div class="quiz-body-desc">${escHtml(q.description || '')}</div>
      <div class="quiz-meta-pills">
        <span>📋 ${q.questionCount || (q.questions ? q.questions.length : 0)} Questions</span>
        <span>⏱ ${q.duration} Mins</span>
        <span>🎯 Pass: ${q.passingScore}%</span>
      </div>
      <button class="btn btn-primary btn-sm btn-full" style="margin-top:4px" onclick="event.stopPropagation();navigate('quiz-take',{id:'${q.id}'})">
        Launch Assessment →
      </button>
    </div>`;
}
