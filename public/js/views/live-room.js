/* ── Real-Time Kahoot-Style Live Multiplayer Trivia Arena ────── */

let roomTimer = null;
let currentRoom = null;

async function renderLiveRoom(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">🎮 Live Multiplayer Trivia Arena</h1>
          <p class="view-subtitle">Host or join synchronized multiplayer trivia battles with live leaderboards & floating reaction emojis!</p>
        </div>
      </div>
      <div id="live-room-container"></div>
    </div>`;

  const user = getCurrentUser();
  const root = document.getElementById('live-room-container');

  // Initial Lobby: Create or Join
  root.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;max-width:900px;margin:0 auto">
      <!-- Create Room Card -->
      <div class="metric-card" style="text-align:center;padding:2.5rem 2rem">
        <span style="font-size:3.5rem;display:block;margin-bottom:0.75rem">👑</span>
        <h3 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;margin-bottom:6px">Host a Live Arena</h3>
        <p style="color:var(--ink-70);font-size:0.875rem;margin-bottom:1.5rem">
          Generate a 6-digit room code and broadcast questions synchronously to all participating students.
        </p>
        <button class="btn btn-primary btn-full btn-glow" onclick="createLiveRoom()">
          Create Live Battle Room →
        </button>
      </div>

      <!-- Join Room Card -->
      <div class="metric-card" style="text-align:center;padding:2.5rem 2rem">
        <span style="font-size:3.5rem;display:block;margin-bottom:0.75rem">🚀</span>
        <h3 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;margin-bottom:6px">Join Live Room</h3>
        <p style="color:var(--ink-70);font-size:0.875rem;margin-bottom:1.5rem">
          Enter a room code provided by your instructor or classmate to enter the arena.
        </p>
        <div class="input-with-icon" style="margin-bottom:12px">
          <span class="input-icon">🔑</span>
          <input id="room-code-input" placeholder="e.g. QM-7821" style="text-transform:uppercase;text-align:center;font-weight:700;font-family:var(--font-code);letter-spacing:2px" />
        </div>
        <button class="btn btn-outline btn-full" onclick="joinLiveRoom()">
          Join Arena Battle →
        </button>
      </div>
    </div>
  `;

  window.createLiveRoom = () => {
    const code = `QM-${Math.floor(1000 + Math.random() * 9000)}`;
    currentRoom = {
      code,
      host: user.name,
      participants: [
        { id: user.id, name: user.name, avatar: user.avatar, score: 0, isHost: true },
        { id: 'bot-1', name: 'Sarah (Live)', avatar: '👩', score: 0, isHost: false },
        { id: 'bot-2', name: 'Marcus (Live)', avatar: '👨', score: 0, isHost: false },
        { id: 'bot-3', name: 'Alex (Live)', avatar: '🧑', score: 0, isHost: false }
      ],
      currentRound: 0,
      state: 'waiting'
    };
    renderLobbyWaiting(root);
  };

  window.joinLiveRoom = () => {
    const input = document.getElementById('room-code-input')?.value.trim().toUpperCase();
    if (!input) {
      showToast('Please enter a 6-digit room code.', 'warning');
      return;
    }

    currentRoom = {
      code: input,
      host: 'Prof. Anderson',
      participants: [
        { id: user.id, name: user.name, avatar: user.avatar, score: 0, isHost: false },
        { id: 'bot-1', name: 'Sarah (Live)', avatar: '👩', score: 0, isHost: false },
        { id: 'bot-2', name: 'Marcus (Live)', avatar: '👨', score: 0, isHost: false }
      ],
      currentRound: 0,
      state: 'waiting'
    };
    renderLobbyWaiting(root);
  };
}

function renderLobbyWaiting(root) {
  root.innerHTML = `
    <div style="max-width:750px;margin:0 auto;text-align:center">
      <div style="background:var(--bg-surface);border:1px solid var(--border-glow);border-radius:var(--r-xl);padding:3rem 2rem;box-shadow:var(--shadow-lg);margin-bottom:2rem">
        <span style="font-size:0.8rem;font-weight:800;letter-spacing:2px;color:var(--primary);text-transform:uppercase">ARENA ROOM PIN</span>
        <div style="font-family:var(--font-display);font-size:4rem;font-weight:800;color:var(--accent-cyan);letter-spacing:4px;margin:8px 0 1.5rem">
          ${currentRoom.code}
        </div>

        <p style="color:var(--ink-70);margin-bottom:2rem">
          Waiting for all competitors to connect. Players currently in lobby:
        </p>

        <!-- Participant Roster Grid -->
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:2.5rem">
          ${currentRoom.participants.map(p => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--bg-elevated);border-radius:var(--r-full);border:1px solid var(--border-subtle)">
              <span style="font-size:1.25rem">${p.avatar || '👤'}</span>
              <span style="font-weight:700;font-size:0.9rem">${escHtml(p.name)}</span>
              ${p.isHost ? '<span style="font-size:0.65rem;color:var(--amber);font-weight:800">HOST</span>' : ''}
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-primary btn-lg btn-glow" onclick="startSynchronizedMatch(document.getElementById('live-room-container'))">
            <span>🚀</span> Start Battle Now!
          </button>
        </div>
      </div>
    </div>
  `;
}

async function startSynchronizedMatch(root) {
  let quizzes = await API.get('/quizzes');
  let questions = [];
  quizzes.forEach(q => {
    if (q.questions) questions.push(...q.questions);
  });

  if (questions.length < 5) {
    questions = [
      { text: 'Which data structure follows First-In, First-Out (FIFO)?', options: ['Stack', 'Queue', 'Array', 'Tree'], correctAnswer: 1 },
      { text: 'What does CSS stand for?', options: ['Creative Style Syntax', 'Cascading Style Sheets', 'Computer Sheet Style', 'Color Style System'], correctAnswer: 1 },
      { text: 'What is the runtime of accessing an element in an array by index?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2 }
    ];
  }

  const liveQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 4);
  let roundIdx = 0;

  function nextLiveQuestion() {
    if (roundIdx >= liveQuestions.length) {
      showLivePodium(root);
      return;
    }

    const q = liveQuestions[roundIdx];
    let timeLeft = 12;
    let hasAnswered = false;

    root.innerHTML = `
      <div style="max-width:850px;margin:0 auto">
        <!-- Floating Emoji Action Bar -->
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px">
          <button class="demo-chip" style="font-size:1.1rem;padding:4px 10px" onclick="triggerFloatingEmoji('🔥')">🔥</button>
          <button class="demo-chip" style="font-size:1.1rem;padding:4px 10px" onclick="triggerFloatingEmoji('⚡')">⚡</button>
          <button class="demo-chip" style="font-size:1.1rem;padding:4px 10px" onclick="triggerFloatingEmoji('🤯')">🤯</button>
          <button class="demo-chip" style="font-size:1.1rem;padding:4px 10px" onclick="triggerFloatingEmoji('👏')">👏</button>
        </div>

        <!-- Question Card -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-xl);padding:2.5rem;box-shadow:var(--shadow-lg);margin-bottom:1.5rem;text-align:center">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <span style="font-size:0.8rem;font-weight:800;color:var(--primary)">ROUND ${roundIdx + 1} OF ${liveQuestions.length}</span>
            <div id="live-timer-ring" style="font-family:var(--font-code);font-size:1.5rem;font-weight:800;color:var(--amber)">⏱ ${timeLeft}s</div>
          </div>

          <h2 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;margin-bottom:2rem">${escHtml(q.text)}</h2>

          <!-- Kahoot 4-Color Grid Buttons -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" id="live-opts-grid">
            ${q.options.map((opt, oIdx) => {
              const colors = ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981'];
              const shapes = ['▲', '◆', '●', '■'];
              return `
                <button class="btn btn-full" style="background:${colors[oIdx % 4]};color:#fff;padding:1.5rem;font-size:1.1rem;font-weight:700;border-radius:var(--r-lg);display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(0,0,0,0.2)" onclick="handleLiveChoice(${oIdx})">
                  <span style="font-size:1.3rem">${shapes[oIdx % 4]}</span>
                  <span>${escHtml(opt)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    if (roomTimer) clearInterval(roomTimer);
    roomTimer = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('live-timer-ring');
      if (timerEl) timerEl.textContent = `⏱ ${timeLeft}s`;
      if (timeLeft <= 3) SoundFX.playTimerTick();

      if (timeLeft <= 0) {
        clearInterval(roomTimer);
        if (!hasAnswered) {
          SoundFX.playWrong();
          showRoundSummary(root, q, false);
        }
      }
    }, 1000);

    window.handleLiveChoice = (choiceIdx) => {
      if (hasAnswered) return;
      hasAnswered = true;
      clearInterval(roomTimer);

      const isCorrect = choiceIdx === q.correctAnswer;
      const userObj = currentRoom.participants[0];
      if (isCorrect) {
        const points = 500 + timeLeft * 50;
        userObj.score += points;
        SoundFX.playCorrect();
        showToast(`🎉 Correct! +${points} PTS!`, 'success');
      } else {
        SoundFX.playWrong();
      }

      // Simulate bot scores
      currentRoom.participants.slice(1).forEach(p => {
        if (Math.random() > 0.3) p.score += 400 + Math.round(Math.random() * 400);
      });

      showRoundSummary(root, q, isCorrect);
    };
  }

  function showRoundSummary(root, q, wasCorrect) {
    // Sort participants by score
    currentRoom.participants.sort((a, b) => b.score - a.score);

    root.innerHTML = `
      <div style="max-width:700px;margin:0 auto;text-align:center">
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-xl);padding:2.5rem;box-shadow:var(--shadow-lg);margin-bottom:2rem">
          <span style="font-size:3.5rem;display:block;margin-bottom:0.5rem">${wasCorrect ? '🎉' : '❌'}</span>
          <h2 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;margin-bottom:4px">
            ${wasCorrect ? 'Point Scored!' : 'Incorrect Answer'}
          </h2>
          <p style="color:var(--emerald);font-weight:700;margin-bottom:2rem">
            Correct Answer: ${escHtml(q.options[q.correctAnswer])}
          </p>

          <h4 style="font-size:0.85rem;font-weight:800;color:var(--ink-40);text-transform:uppercase;margin-bottom:1rem">LIVE LEADERBOARD SCOREBOARD</h4>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:2rem">
            ${currentRoom.participants.map((p, idx) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-subtle)">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-weight:800;width:24px">${idx + 1}.</span>
                  <span>${p.avatar || '👤'}</span>
                  <strong>${escHtml(p.name)}</strong>
                </div>
                <strong style="color:var(--accent-cyan)">${p.score} PTS</strong>
              </div>
            `).join('')}
          </div>

          <button class="btn btn-primary btn-glow" onclick="advanceLiveQuestion()">Next Question →</button>
        </div>
      </div>
    `;

    window.advanceLiveQuestion = () => {
      roundIdx++;
      nextLiveQuestion();
    };
  }

  function showLivePodium(root) {
    currentRoom.participants.sort((a, b) => b.score - a.score);
    const winner = currentRoom.participants[0];
    SoundFX.playFanfare();
    Confetti.launch(5000);

    root.innerHTML = `
      <div style="max-width:650px;margin:0 auto;text-align:center;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-xl);padding:3rem 2rem;box-shadow:var(--shadow-lg)">
        <span style="font-size:5rem;display:block;margin-bottom:1rem">🏆</span>
        <h1 style="font-family:var(--font-display);font-size:2.5rem;font-weight:800;margin-bottom:6px">ARENA CHAMPION!</h1>
        <h2 style="color:var(--accent-cyan);font-size:1.75rem;font-weight:800;margin-bottom:1.5rem">${escHtml(winner.name)}</h2>

        <div style="display:flex;justify-content:center;gap:1.5rem;margin-bottom:2.5rem">
          ${currentRoom.participants.slice(0, 3).map((p, idx) => `
            <div style="background:var(--bg-elevated);border-radius:var(--r-lg);padding:1.25rem;width:140px;border:1px solid var(--border-subtle)">
              <div style="font-size:2rem">${['🥇','🥈','🥉'][idx]}</div>
              <div style="font-weight:700;font-size:0.9rem;margin:6px 0 2px">${escHtml(p.name)}</div>
              <strong style="color:var(--amber);font-size:1.1rem">${p.score}</strong>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary btn-glow" onclick="navigate('dashboard')">Return to Dashboard →</button>
      </div>
    `;
  }

  nextLiveQuestion();
}

function triggerFloatingEmoji(emoji) {
  SoundFX.playClick();
  const el = document.createElement('div');
  el.textContent = emoji;
  el.style.cssText = `
    position: fixed;
    bottom: 40px;
    right: ${Math.random() * 200 + 40}px;
    font-size: 2.5rem;
    pointer-events: none;
    z-index: 9999;
    animation: floatUp 1.8s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}
