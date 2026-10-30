/* ── Quizzes Catalog View ─────────────────────────────────── */

async function renderQuizzes(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">Assessment Catalog</h1>
          <p class="view-subtitle">Select a subject to test your proficiency, earn XP, and unlock certificates.</p>
        </div>
      </div>

      <!-- Filter & Search Controls -->
      <div style="display:flex;gap:12px;margin-bottom:2rem;flex-wrap:wrap;align-items:center">
        <div class="input-with-icon" style="flex:1;min-width:240px">
          <span class="input-icon">🔍</span>
          <input type="search" id="catalog-search" placeholder="Search by topic, keyword, or technology…" />
        </div>
        <select id="catalog-cat" style="min-width:160px">
          <option value="All">All Categories</option>
        </select>
        <select id="catalog-diff" style="min-width:160px">
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button class="btn btn-ghost" id="catalog-proctored-btn" style="padding:0.75rem 1rem">
          🛡️ Proctored Only
        </button>
      </div>

      <div class="quiz-catalog-grid" id="catalog-grid"></div>

      <div id="catalog-empty" class="hidden" style="text-align:center;padding:4rem;color:var(--ink-40)">
        <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
        <h3 style="color:var(--ink);font-size:1.25rem;font-weight:700">No Assessments Found</h3>
        <p style="margin-top:4px">Try adjusting your filters or search keywords.</p>
      </div>
    </div>`;

  try {
    const [quizzes, results] = await Promise.all([
      API.get('/quizzes'),
      API.get('/results/mine')
    ]);

    const attemptedMap = new Map();
    results.forEach(r => attemptedMap.set(r.quizId, r));

    // Populate category dropdown
    const categories = ['All', ...new Set(quizzes.map(q => q.category))];
    const catSelect = document.getElementById('catalog-cat');
    catSelect.innerHTML = categories.map(c => `<option value="${c}">${c === 'All' ? 'All Categories' : c}</option>`).join('');

    let proctoredFilter = false;

    function renderList() {
      const search = document.getElementById('catalog-search').value.toLowerCase().trim();
      const cat = catSelect.value;
      const diff = document.getElementById('catalog-diff').value;

      const filtered = quizzes.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(search) ||
                              (q.description || '').toLowerCase().includes(search) ||
                              (q.tags && q.tags.some(t => t.toLowerCase().includes(search)));
        const matchesCat = cat === 'All' || q.category === cat;
        const matchesDiff = diff === 'All' || q.difficulty === diff;
        const matchesProctor = !proctoredFilter || q.proctored;
        return matchesSearch && matchesCat && matchesDiff && matchesProctor;
      });

      const grid = document.getElementById('catalog-grid');
      const empty = document.getElementById('catalog-empty');

      if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
      } else {
        empty.classList.add('hidden');
        grid.innerHTML = filtered.map(q => {
          const attempt = attemptedMap.get(q.id);
          return `
            <div class="quiz-card-pro" onclick="showQuizBriefModal('${q.id}')">
              <div class="quiz-card-top-row">
                <span class="quiz-icon-badge">${q.icon || '⚡'}</span>
                <div class="quiz-badge-group">
                  ${q.proctored ? '<span class="pill-tag pill-proctored">🛡️ Proctored</span>' : ''}
                  <span class="pill-tag pill-category">${escHtml(q.category)}</span>
                  <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
                </div>
              </div>
              <div class="quiz-title-text">
                ${escHtml(q.title)}
                ${attempt ? `<span style="font-size:0.75rem;color:var(--emerald);font-weight:700;display:block;margin-top:2px">✓ Best: ${attempt.score}% (${attempt.passed ? 'PASSED' : 'FAILED'})</span>` : ''}
              </div>
              <div class="quiz-body-desc">${escHtml(q.description || '')}</div>
              <div class="quiz-meta-pills">
                <span>📋 ${q.questionCount} Questions</span>
                <span>⏱ ${q.duration} Mins</span>
                <span>🎯 Pass: ${q.passingScore}%</span>
                ${q.negativeMarking ? `<span style="color:var(--rose)">⚠ -${q.negativeMarking} Neg</span>` : ''}
              </div>
              <button class="btn ${attempt ? 'btn-outline' : 'btn-primary'} btn-sm btn-full" style="margin-top:4px"
                onclick="event.stopPropagation();showQuizBriefModal('${q.id}')">
                ${attempt ? 'Retake Assessment →' : 'Start Assessment →'}
              </button>
            </div>
          `;
        }).join('');
      }
    }

    document.getElementById('catalog-search').addEventListener('input', renderList);
    catSelect.addEventListener('change', renderList);
    document.getElementById('catalog-diff').addEventListener('change', renderList);

    const proctorBtn = document.getElementById('catalog-proctored-btn');
    proctorBtn.addEventListener('click', () => {
      proctoredFilter = !proctoredFilter;
      proctorBtn.classList.toggle('btn-primary', proctoredFilter);
      proctorBtn.classList.toggle('btn-ghost', !proctoredFilter);
      renderList();
    });

    renderList();

    // Quiz Launch Briefing Modal
    window.showQuizBriefModal = async (id) => {
      try {
        const q = await API.get(`/quizzes/${id}`);
        openModal(`
          <div style="text-align:center;margin-bottom:1.5rem">
            <span style="font-size:3.5rem;display:block;margin-bottom:0.5rem">${q.icon || '⚡'}</span>
            <h2 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800">${escHtml(q.title)}</h2>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
              <span class="pill-tag pill-category">${escHtml(q.category)}</span>
              <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
              ${q.proctored ? '<span class="pill-tag pill-proctored">🛡️ Anti-Cheat Proctored</span>' : ''}
            </div>
          </div>

          <p style="color:var(--ink-70);font-size:0.95rem;margin-bottom:1.5rem;text-align:center">${escHtml(q.description)}</p>

          <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--r-lg);padding:1.25rem;margin-bottom:1.5rem">
            <h4 style="font-size:0.85rem;font-weight:800;text-transform:uppercase;color:var(--primary);margin-bottom:10px">Examination Rules & Specs</h4>
            <ul style="list-style:none;display:flex;flex-direction:column;gap:8px;font-size:0.875rem;color:var(--ink-70)">
              <li>⏱ <strong>Duration:</strong> ${q.duration} Minutes total countdown.</li>
              <li>📋 <strong>Questions:</strong> ${q.questions ? q.questions.length : q.questionCount} Multiple-Choice items.</li>
              <li>🎯 <strong>Passing Grade:</strong> ${q.passingScore}% minimum required for Certificate.</li>
              ${q.negativeMarking ? `<li style="color:var(--rose)">⚠ <strong>Negative Marking:</strong> -${q.negativeMarking} deducted for each incorrect answer.</li>` : '<li>✓ No negative marking for wrong choices.</li>'}
              ${q.proctored ? '<li style="color:var(--amber)">🛡️ <strong>Anti-Cheat Active:</strong> Fullscreen mode is enforced. Tab switches will be tracked and penalized.</li>' : ''}
            </ul>
          </div>

          <div style="display:flex;gap:12px;justify-content:flex-end">
            <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary btn-glow" onclick="closeModal();navigate('quiz-take',{id:'${q.id}'})">
              I Understand, Begin Exam →
            </button>
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
