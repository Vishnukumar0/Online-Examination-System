/* ── Performance, Results & Certificate View ──────────────── */

// Global Certificate Generator Modal
window.showCertificateModal = (certId, quizTitle, score, customStudentName) => {
  const currentUser = getCurrentUser();
  const studentName = customStudentName || currentUser?.name || 'Student Scholar';

  openModal(`
    <div style="text-align:center;margin-bottom:1rem">
      <h2 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800">Official Certificate of Mastery</h2>
      <p style="color:var(--ink-70);font-size:0.85rem">Issued by QuizMaster Pro Academic Examination Board</p>
    </div>

    <div style="background:#000;border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-lg);margin-bottom:1.5rem">
      <canvas id="cert-canvas" style="width:100%;height:auto;display:block"></canvas>
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end">
      <button class="btn btn-primary" onclick="downloadCertPNG('${escHtml(studentName)}')">
        <span>💾</span> Download High-Res PNG
      </button>
      <button class="btn btn-ghost" onclick="window.print()">
        <span>🖨</span> Print / Save PDF
      </button>
    </div>
  `);

  setTimeout(() => {
    const canvas = document.getElementById('cert-canvas');
    if (canvas) {
      CertificateGenerator.generate(canvas, {
        studentName,
        quizTitle,
        score,
        date: new Date().toLocaleDateString(),
        certificateId: certId
      });
    }
  }, 50);
};

window.downloadCertPNG = (name) => {
  const canvas = document.getElementById('cert-canvas');
  if (canvas) {
    const cleanName = (name || getCurrentUser()?.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    CertificateGenerator.downloadPNG(canvas, `QuizMaster_Certificate_${cleanName}.png`);
    showToast('Certificate downloaded successfully!', 'success');
  }
};

function renderQuizResult(container, { result, quizTitle } = {}) {
  if (!result) { navigate('results'); return; }

  const passed = result.passed;
  const user = getCurrentUser();
  const studentName = result.userName || user?.name || 'Student Scholar';

  container.innerHTML = `
    <div class="result-container">
      <div class="result-hero-card">
        <div class="result-score-ring" id="result-radial-meter"></div>

        <h1 class="result-headline">${result.message}</h1>
        <p class="result-subhead">
          You answered <strong>${result.correct}</strong> correctly out of <strong>${result.total}</strong> questions
          ${result.timeTaken ? ` in <strong>${formatTime(result.timeTaken)}</strong>` : ''}.
        </p>

        <!-- Unlocked Rewards & Gamification -->
        <div class="result-badges-row">
          <div class="reward-badge-chip">
            <span>⚡</span> +${result.gamification ? result.gamification.xpGained : Math.round(result.score * 1.5)} XP Earned
          </div>
          ${result.tabSwitches === 0 ? `
            <div class="reward-badge-chip" style="color:var(--accent-cyan)">
              <span>🛡️</span> Zero Proctor Violations
            </div>
          ` : `
            <div class="reward-badge-chip" style="color:var(--rose)">
              <span>⚠</span> ${result.tabSwitches} Focus Warnings
            </div>
          `}
        </div>

        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          ${result.certificateId ? `
            <button class="btn btn-primary btn-glow" onclick="showCertificateModal('${result.certificateId}', '${escHtml(quizTitle || result.quizTitle)}', ${result.score}, '${escHtml(studentName)}')">
              <span>📜</span> View Official Certificate
            </button>
          ` : ''}
          <button class="btn btn-outline" onclick="navigate('quizzes')">Browse More Exams</button>
          <button class="btn btn-ghost" onclick="navigate('results')">View Performance History</button>
        </div>
      </div>

      <!-- Breakdown with Filters -->
      <div style="margin-bottom:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
          <h3 style="font-family:var(--font-display);font-size:1.35rem;font-weight:700">Detailed Question Analysis</h3>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm active" id="btn-filter-all" onclick="filterBreakdown('all')">All (${result.breakdown.length})</button>
            <button class="btn btn-ghost btn-sm" id="btn-filter-wrong" onclick="filterBreakdown('wrong')">Incorrect (${result.wrong || 0})</button>
          </div>
        </div>

        <div class="breakdown-list" id="breakdown-container"></div>
      </div>
    </div>
  `;

  ChartRenderer.renderRadialScore('result-radial-meter', result.score, 160);

  function renderBreakdownItems(filter = 'all') {
    const parent = document.getElementById('breakdown-container');
    if (!parent) return;

    const items = result.breakdown.filter(item => {
      if (filter === 'wrong') return !item.isCorrect;
      return true;
    });

    if (items.length === 0) {
      parent.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--ink-40);background:var(--bg-surface);border-radius:var(--r-lg)">No items matching this filter.</div>`;
      return;
    }

    parent.innerHTML = items.map((item, i) => {
      let stateClass = 'is-unattempted';
      if (item.hasAnswered) {
        stateClass = item.isCorrect ? 'is-correct' : 'is-wrong';
      }

      return `
        <div class="breakdown-row ${stateClass}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
            <div class="breakdown-title">
              <span style="color:var(--ink-40);margin-right:6px">Q${i + 1}.</span> ${escHtml(item.questionText)}
            </div>
            <span class="badge ${item.isCorrect ? 'badge-pass' : 'badge-fail'}">
              ${item.isCorrect ? '✓ CORRECT' : '✕ INCORRECT'}
            </span>
          </div>

          ${item.codeSnippet ? `
            <pre class="code-snippet-box"><code>${escHtml(item.codeSnippet)}</code></pre>
          ` : ''}

          <div class="breakdown-answers-grid">
            <div class="answer-chip-box your-ans">
              <span style="font-size:0.75rem;color:var(--ink-40);display:block;margin-bottom:2px">YOUR SUBMISSION</span>
              <strong>${escHtml(item.selectedAnswer)}</strong>
            </div>
            <div class="answer-chip-box correct-ans">
              <span style="font-size:0.75rem;opacity:0.8;display:block;margin-bottom:2px">VERIFIED ANSWER</span>
              <strong>${escHtml(item.correctAnswer)}</strong>
            </div>
          </div>

          ${item.explanation ? `
            <div class="explanation-banner">
              💡 <strong>Technical Rationale:</strong> ${escHtml(item.explanation)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  window.filterBreakdown = (type) => {
    document.querySelectorAll('#btn-filter-all, #btn-filter-wrong').forEach(btn => btn.classList.remove('btn-primary'));
    const active = type === 'all' ? document.getElementById('btn-filter-all') : document.getElementById('btn-filter-wrong');
    active?.classList.add('btn-primary');
    renderBreakdownItems(type);
  };

  renderBreakdownItems('all');
}

async function renderResults(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">Performance Analytics</h1>
          <p class="view-subtitle">Review your past examination scores, accuracy trends, and verified certificates.</p>
        </div>
      </div>
      <div id="results-content-area"></div>
    </div>`;

  try {
    const results = await API.get('/results/mine');
    const user = getCurrentUser();

    if (results.length === 0) {
      document.getElementById('results-content-area').innerHTML = `
        <div style="text-align:center;padding:5rem;background:var(--bg-surface);border-radius:var(--r-xl);border:1px dashed var(--border-subtle)">
          <div style="font-size:3.5rem;margin-bottom:1rem">📊</div>
          <h3 style="font-size:1.5rem;font-weight:700">No Assessment Records Yet</h3>
          <p style="color:var(--ink-70);margin-top:4px;margin-bottom:1.5rem">Complete your first test to unlock performance analytics and certificates.</p>
          <button class="btn btn-primary" onclick="navigate('quizzes')">Browse Exams →</button>
        </div>
      `;
      return;
    }

    const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    const bestScore = Math.max(...results.map(r => r.score));
    const passedCount = results.filter(r => r.passed).length;
    const certCount = results.filter(r => r.certificateId).length;

    document.getElementById('results-content-area').innerHTML = `
      <div class="metrics-grid" style="margin-bottom:2rem">
        <div class="metric-card">
          <div class="metric-top"><span class="metric-label">Cumulative Attempts</span><div class="metric-icon-wrap">📝</div></div>
          <div class="metric-value">${results.length}</div>
        </div>
        <div class="metric-card">
          <div class="metric-top"><span class="metric-label">Average Accuracy</span><div class="metric-icon-wrap">📊</div></div>
          <div class="metric-value" style="color:var(--primary)">${avgScore}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-top"><span class="metric-label">High Score</span><div class="metric-icon-wrap">🌟</div></div>
          <div class="metric-value" style="color:var(--emerald)">${bestScore}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-top"><span class="metric-label">Certificates Earned</span><div class="metric-icon-wrap">📜</div></div>
          <div class="metric-value" style="color:var(--amber)">${certCount}</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Assessment Name</th>
                <th>Score</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Certificate</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${results.map((r, i) => `
                <tr style="cursor:pointer" onclick="showResultModal('${r.id}')">
                  <td style="color:var(--ink-40);font-weight:700">${i + 1}</td>
                  <td><strong>${escHtml(r.quizTitle)}</strong></td>
                  <td><strong style="color:${r.passed ? 'var(--emerald)' : 'var(--rose)'}">${r.score}%</strong></td>
                  <td><span class="badge ${r.passed ? 'badge-pass' : 'badge-fail'}">${r.passed ? 'PASSED' : 'FAILED'}</span></td>
                  <td style="color:var(--ink-70)">${r.timeTaken ? formatTime(r.timeTaken) : '—'}</td>
                  <td>
                    ${r.certificateId ? `
                      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showCertificateModal('${r.certificateId}', '${escHtml(r.quizTitle)}', ${r.score}, '${escHtml(r.userName || user?.name)}')">
                        📜 View
                      </button>
                    ` : '<span style="color:var(--ink-40);font-size:0.75rem">—</span>'}
                  </td>
                  <td style="color:var(--ink-40)">${formatDate(r.submittedAt)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showResultModal('${r.id}')">Analysis</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Global Modal Handler for Result Detail
    window.showResultModal = async (id) => {
      try {
        const res = await API.get(`/results/${id}`);
        openModal(`
          <h2 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;margin-bottom:4px">${escHtml(res.quizTitle)}</h2>
          <p style="color:var(--ink-70);font-size:0.85rem;margin-bottom:1.5rem">Attempted by <strong>${escHtml(res.userName || user?.name)}</strong> on ${formatDate(res.submittedAt)}</p>

          <div class="metrics-grid" style="grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:1.5rem">
            <div style="background:var(--bg-elevated);padding:10px;border-radius:var(--r-md);text-align:center">
              <span style="font-size:0.75rem;color:var(--ink-40)">Score</span>
              <div style="font-size:1.5rem;font-weight:800;color:${res.passed ? 'var(--emerald)' : 'var(--rose)'}">${res.score}%</div>
            </div>
            <div style="background:var(--bg-elevated);padding:10px;border-radius:var(--r-md);text-align:center">
              <span style="font-size:0.75rem;color:var(--ink-40)">Correct</span>
              <div style="font-size:1.5rem;font-weight:800">${res.correct}/${res.total}</div>
            </div>
            <div style="background:var(--bg-elevated);padding:10px;border-radius:var(--r-md);text-align:center">
              <span style="font-size:0.75rem;color:var(--ink-40)">Time</span>
              <div style="font-size:1.5rem;font-weight:800">${formatTime(res.timeTaken || 0)}</div>
            </div>
          </div>

          <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:10px">
            ${res.breakdown.map((item, i) => `
              <div style="background:var(--bg-elevated);border-left:3px solid ${item.isCorrect ? 'var(--emerald)' : 'var(--rose)'};border-radius:var(--r-md);padding:12px;font-size:0.85rem">
                <div style="font-weight:700;margin-bottom:4px">Q${i+1}. ${escHtml(item.questionText)}</div>
                <div style="color:${item.isCorrect ? 'var(--emerald)' : 'var(--rose)'}">
                  ${item.isCorrect ? '✓' : '✕'} Your answer: <strong>${escHtml(item.selectedAnswer)}</strong>
                </div>
                ${!item.isCorrect ? `<div style="color:var(--emerald);margin-top:2px">✓ Correct: <strong>${escHtml(item.correctAnswer)}</strong></div>` : ''}
              </div>
            `).join('')}
          </div>
        `);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

  } catch (err) {
    container.innerHTML = `<div class="view-page"><div class="form-error">${err.message}</div></div>`;
  }
}
