/* ── 1v1 Real-Time Quiz Duel Arena View ───────────────────────── */

let duelInterval = null;

async function renderQuizDuel(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">⚔️ Quiz Duel Arena (1v1 Battle)</h1>
          <p class="view-subtitle">Compete in rapid-fire 5-round head-to-head knowledge battles against elite academic opponents!</p>
        </div>
      </div>
      <div id="duel-arena-root"></div>
    </div>`;

  const user = getCurrentUser();
  const root = document.getElementById('duel-arena-root');

  // Opponent Roster
  const opponents = [
    { id: 'bot-ada', name: 'Ada Lovelace (AI)', title: 'Algorithm Prodigy', avatar: '👩‍💻', diff: 'Master', speed: 4500, accuracy: 0.85 },
    { id: 'bot-turing', name: 'Alan Turing (AI)', title: 'Logic Grandmaster', avatar: '👨‍🔬', diff: 'Grandmaster', speed: 3800, accuracy: 0.95 },
    { id: 'bot-neural', name: 'CyberBot 3000', title: 'Neural Speedster', avatar: '🤖', diff: 'Apprentice', speed: 5500, accuracy: 0.70 }
  ];

  // Lobby Screen
  root.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.2) 0%,rgba(236,72,153,0.15) 100%);border:1px solid var(--border-glow);border-radius:var(--r-xl);padding:2.5rem;text-align:center;margin-bottom:2rem">
      <span style="font-size:3.5rem;display:block;margin-bottom:0.5rem">⚔️</span>
      <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:800;margin-bottom:6px">Select Your Opponent</h2>
      <p style="color:var(--ink-70);max-width:550px;margin:0 auto 2rem">
        Answer rapidly to build <strong>Combo Multipliers (2x, 3x)</strong> and deal maximum intellectual damage before the 10-second round timer expires!
      </p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;margin-bottom:2rem">
        ${opponents.map(opp => `
          <div class="metric-card" style="text-align:center;cursor:pointer" onclick="startDuelMatch('${opp.id}')">
            <div style="font-size:3rem;margin-bottom:8px">${opp.avatar}</div>
            <h3 style="font-family:var(--font-display);font-size:1.25rem;font-weight:800">${escHtml(opp.name)}</h3>
            <span class="pill-tag pill-category" style="margin:6px 0 10px;display:inline-block">${opp.title}</span>
            <div style="font-size:0.8rem;color:var(--ink-40);margin-bottom:12px">Tier: ${opp.diff} · ${(opp.accuracy*100)}% Accuracy</div>
            <button class="btn btn-primary btn-sm btn-full btn-glow">Challenge to Duel ⚔️</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  window.startDuelMatch = async (oppId) => {
    const opp = opponents.find(o => o.id === oppId) || opponents[0];

    // Load duel question pool
    let quizzes = await API.get('/quizzes');
    let qPool = [];
    quizzes.forEach(q => {
      if (q.questions) qPool.push(...q.questions);
    });

    // Fallback if no questions
    if (qPool.length < 5) {
      qPool = [
        { text: 'Which data structure follows LIFO order?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswer: 1 },
        { text: 'What does "===" check in JavaScript?', options: ['Value only', 'Type only', 'Value and Type', 'Memory Address'], correctAnswer: 2 },
        { text: 'What is the worst-case time complexity of QuickSort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], correctAnswer: 2 },
        { text: 'What is the primary purpose of Docker?', options: ['Database storage', 'Application containerization', 'Network firewall', 'Operating system replacement'], correctAnswer: 1 },
        { text: 'Which HTTP status code signifies "Created"?', options: ['200', '201', '204', '400'], correctAnswer: 1 }
      ];
    }

    // Shuffle and pick 5 rapid-fire questions
    const matchQuestions = qPool.sort(() => 0.5 - Math.random()).slice(0, 5);
    runLiveDuel(root, user, opp, matchQuestions);
  };
}

function runLiveDuel(root, user, opp, questions) {
  let round = 0;
  let userScore = 0;
  let oppScore = 0;
  let combo = 0;
  let maxCombo = 0;
  let roundTimeLeft = 10;
  let roundTimer = null;
  let oppActionTimeout = null;

  function renderRound() {
    if (round >= questions.length) {
      finishDuel();
      return;
    }

    const q = questions[round];
    roundTimeLeft = 10;
    let roundAnswered = false;

    root.innerHTML = `
      <div style="max-width:800px;margin:0 auto">
        <!-- Live Side-by-Side Health/Score HUD -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-xl);padding:1.5rem;margin-bottom:1.5rem;box-shadow:var(--shadow-md)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <!-- User Side -->
            <div style="display:flex;align-items:center;gap:12px">
              <div class="avatar lg">${user.avatar || user.name[0]}</div>
              <div>
                <div style="font-weight:800;font-size:1.1rem">${escHtml(user.name.split(' ')[0])} (You)</div>
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--primary)">${userScore} PTS</div>
                ${combo > 1 ? `<span style="font-size:0.75rem;font-weight:800;color:var(--amber);background:var(--amber-subtle);padding:2px 8px;border-radius:99px">🔥 ${combo}x COMBO!</span>` : ''}
              </div>
            </div>

            <!-- Round & Timer Center -->
            <div style="text-align:center">
              <div style="font-size:0.75rem;font-weight:800;color:var(--ink-40);text-transform:uppercase">ROUND ${round + 1} OF 5</div>
              <div id="duel-countdown" style="font-family:var(--font-code);font-size:2rem;font-weight:800;color:var(--amber)">10s</div>
            </div>

            <!-- Opponent Side -->
            <div style="display:flex;align-items:center;gap:12px;text-align:right">
              <div>
                <div style="font-weight:800;font-size:1.1rem">${escHtml(opp.name)}</div>
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--rose)">${oppScore} PTS</div>
              </div>
              <div style="font-size:2.5rem">${opp.avatar}</div>
            </div>
          </div>

          <!-- Progress Bars -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="height:8px;background:var(--ink-06);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100, (userScore / 1000) * 100)}%;background:var(--primary);border-radius:99px;transition:width 0.3s"></div>
            </div>
            <div style="height:8px;background:var(--ink-06);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100, (oppScore / 1000) * 100)}%;background:var(--rose);border-radius:99px;transition:width 0.3s"></div>
            </div>
          </div>
        </div>

        <!-- Question Box -->
        <div class="exam-card" style="margin-bottom:1rem">
          <div class="exam-question-text" style="font-size:1.35rem">${escHtml(q.text)}</div>
          <div class="exam-options-stack" id="duel-options">
            ${q.options.map((opt, idx) => `
              <button class="exam-option-card" onclick="handleDuelAnswer(${idx})">
                <span class="opt-letter">${['A','B','C','D'][idx]}</span>
                <span>${escHtml(opt)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Start 10s Round Timer
    if (roundTimer) clearInterval(roundTimer);
    roundTimer = setInterval(() => {
      roundTimeLeft--;
      const cdEl = document.getElementById('duel-countdown');
      if (cdEl) cdEl.textContent = `${roundTimeLeft}s`;
      if (roundTimeLeft <= 3) SoundFX.playTimerTick();

      if (roundTimeLeft <= 0) {
        clearInterval(roundTimer);
        if (!roundAnswered) {
          combo = 0;
          SoundFX.playWrong();
          showToast('Time expired for Round ' + (round + 1) + '!', 'warning');
          advanceRound();
        }
      }
    }, 1000);

    // Opponent simulated behavior
    clearTimeout(oppActionTimeout);
    oppActionTimeout = setTimeout(() => {
      if (Math.random() < opp.accuracy) {
        oppScore += Math.round(150 + Math.random() * 50);
      }
    }, opp.speed);

    window.handleDuelAnswer = (idx) => {
      if (roundAnswered) return;
      roundAnswered = true;
      clearInterval(roundTimer);

      const isCorrect = idx === q.correctAnswer;
      if (isCorrect) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        const multiplier = combo > 2 ? 3 : combo > 1 ? 2 : 1;
        const speedBonus = roundTimeLeft * 15;
        const earned = (100 * multiplier) + speedBonus;
        userScore += earned;

        SoundFX.playCorrect();
        showToast(`💥 Strike! +${earned} PTS (${multiplier}x Combo)`, 'success');
      } else {
        combo = 0;
        SoundFX.playWrong();
        showToast('Missed strike!', 'error');
      }

      // Highlight options
      const optBtns = document.querySelectorAll('#duel-options .exam-option-card');
      optBtns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correctAnswer) btn.classList.add('selected');
        else if (i === idx) btn.style.borderColor = 'var(--rose)';
      });

      setTimeout(advanceRound, 1200);
    };

    function advanceRound() {
      round++;
      renderRound();
    }
  }

  function finishDuel() {
    clearInterval(roundTimer);
    clearTimeout(oppActionTimeout);

    const victory = userScore >= oppScore;
    if (victory) {
      SoundFX.playFanfare();
      Confetti.launch(4000);
    } else {
      SoundFX.playWrong();
    }

    const xpEarned = victory ? 350 : 100;

    root.innerHTML = `
      <div style="max-width:600px;margin:0 auto;text-align:center;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-xl);padding:3rem 2rem;box-shadow:var(--shadow-lg)">
        <span style="font-size:4.5rem;display:block;margin-bottom:1rem">${victory ? '🏆' : '💀'}</span>
        <h2 style="font-family:var(--font-display);font-size:2.25rem;font-weight:800;margin-bottom:8px">
          ${victory ? 'VICTORY ACHIEVED!' : 'DEFEAT'}
        </h2>
        <p style="color:var(--ink-70);font-size:1.1rem;margin-bottom:2rem">
          ${victory ? `You defeated ${opp.name} with superior speed and accuracy!` : `${opp.name} took the crown this time.`}
        </p>

        <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:2rem">
          <div>
            <span style="font-size:0.8rem;color:var(--ink-40);font-weight:700">YOUR SCORE</span>
            <div style="font-size:2.25rem;font-weight:800;color:var(--primary);font-family:var(--font-display)">${userScore}</div>
          </div>
          <div style="border-left:1px solid var(--border-subtle)"></div>
          <div>
            <span style="font-size:0.8rem;color:var(--ink-40);font-weight:700">OPPONENT</span>
            <div style="font-size:2.25rem;font-weight:800;color:var(--rose);font-family:var(--font-display)">${oppScore}</div>
          </div>
        </div>

        <div class="result-badges-row">
          <div class="reward-badge-chip">
            <span>⚡</span> +${xpEarned} XP Awarded
          </div>
          <div class="reward-badge-chip" style="color:var(--accent-cyan)">
            <span>🔥</span> Max Combo: ${maxCombo}x
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-primary btn-glow" onclick="navigate('duel')">Rematch / Next Battle →</button>
          <button class="btn btn-ghost" onclick="navigate('dashboard')">Back to Dashboard</button>
        </div>
      </div>
    `;
  }

  renderRound();
}
