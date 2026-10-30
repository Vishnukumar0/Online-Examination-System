/* ── Proctored Quiz Taking Engine with Anti-Cheat & Tools ────── */

let activeQuizTimer = null;
let tabSwitchListener = null;

async function renderQuizTake(container, { id } = {}) {
  if (!id) { navigate('quizzes'); return; }

  container.innerHTML = `
    <div class="exam-layout">
      <div style="text-align:center;padding:4rem;color:var(--ink-40)">
        <div style="font-size:2.5rem;margin-bottom:1rem">🛡️</div>
        <p>Initializing secure examination environment…</p>
      </div>
    </div>`;

  try {
    const quiz = await API.get(`/quizzes/${id}`);
    startProctoredQuiz(container, quiz);
  } catch (err) {
    container.innerHTML = `
      <div class="exam-layout">
        <div class="form-error">${err.message}</div>
        <button class="btn btn-ghost" style="margin-top:1rem" onclick="navigate('quizzes')">← Back to Catalog</button>
      </div>`;
  }
}

function startProctoredQuiz(container, quiz) {
  // Clean up any stale timers/listeners
  if (activeQuizTimer) { clearInterval(activeQuizTimer); activeQuizTimer = null; }
  if (tabSwitchListener) {
    document.removeEventListener('visibilitychange', tabSwitchListener);
    window.removeEventListener('blur', tabSwitchListener);
    tabSwitchListener = null;
  }

  const totalQ = quiz.questions.length;
  const totalSeconds = quiz.duration * 60;
  let timeLeft = totalSeconds;
  let currentQ = 0;
  let tabSwitches = 0;
  let cameraStream = null;

  const answers = {};      // { [questionId]: selectedValue }
  const flagged = {};      // { [questionId]: boolean }
  const eliminated = {};   // { [questionId]: Set([optionIndex]) }
  const hintsUsed = {};    // { [questionId]: boolean }

  // Set up Anti-Cheat Lockdown (Copy-Paste / DevTools / Window Blur blocking)
  if (quiz.proctored) {
    AntiCheatSecurity.enableLockdown((count, reason) => {
      tabSwitches = count;
      const alertEl = document.getElementById('proctor-alert-count');
      if (alertEl) alertEl.textContent = `${count} Violation${count > 1 ? 's' : ''}`;
    });

    tabSwitchListener = () => {
      if (document.hidden || !document.hasFocus()) {
        AntiCheatSecurity.triggerViolation('Window blur / Tab switch detected');
      }
    };
    document.addEventListener('visibilitychange', tabSwitchListener);
    window.addEventListener('blur', tabSwitchListener);
  }

  function render() {
    container.innerHTML = `
      <div class="exam-layout">
        <!-- Top HUD Bar -->
        <div class="exam-hud-bar">
          <div class="exam-hud-left">
            <button class="btn btn-ghost btn-sm" onclick="confirmExitExam('${quiz.id}')">✕ Exit</button>
            <div class="exam-timer-chip" id="exam-timer">⏱ ${formatTime(timeLeft)}</div>
            ${quiz.proctored ? `
              <div class="proctor-alert-chip" title="Security Proctor active">
                <span>🛡️</span> <span id="proctor-alert-count">0 Violations</span>
              </div>
            ` : ''}
          </div>

          <div class="exam-hud-actions">
            <button class="hud-tool-btn" onclick="VoiceAssistant.readCurrentQuestion(quiz.questions[currentQ].text, quiz.questions[currentQ].options)" title="Listen to question (Text-to-Speech)">
              <span>🔊</span> Read Aloud
            </button>
            <button class="hud-tool-btn" id="btn-voice-cmd" onclick="toggleVoiceAnswering()" title="Answer via Voice commands">
              <span>🎙️</span> Voice Mode
            </button>
            <button class="hud-tool-btn" onclick="ScientificCalc.open()" title="Open Scientific Calculator">
              <span>🧮</span> Calculator
            </button>
            <button class="hud-tool-btn" onclick="toggleScratchpad()" title="Open scratchpad notes">
              <span>📝</span> Scratchpad
            </button>
            <button class="hud-tool-btn" id="btn-hint" onclick="revealHint()" title="Unlock Hint (-5% penalty)">
              <span>💡</span> Hint
            </button>
            ${quiz.proctored ? `
              <button class="hud-tool-btn" id="btn-cam-toggle" onclick="toggleCameraHUD()" title="Toggle Camera Proctoring View">
                <span>📹</span> Cam HUD
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Simulated Camera Proctoring Feed -->
        <div id="proctor-cam-box" class="proctor-cam-preview hidden">
          <div class="proctor-cam-label"><span>●</span> PROCTOR AI: ACTIVE</div>
          <video id="proctor-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>
        </div>

        <!-- Question Presentation Card -->
        <div class="exam-card" id="exam-card"></div>

        <!-- Question Matrix Grid / Navigation -->
        <div class="exam-matrix-footer">
          <button class="btn btn-ghost btn-sm" id="btn-prev" onclick="goPrevQuestion()" ${currentQ === 0 ? 'disabled' : ''}>
            ← Previous
          </button>

          <div class="q-matrix-chips" id="q-matrix"></div>

          <div style="display:flex;gap:8px">
            ${currentQ < totalQ - 1
              ? `<button class="btn btn-primary btn-sm" id="btn-next" onclick="goNextQuestion()">Next Question →</button>`
              : `<button class="btn btn-success btn-sm btn-glow" id="btn-submit" onclick="confirmSubmitExam()">Submit Examination ✓</button>`
            }
          </div>
        </div>
      </div>
    `;

    renderQuestion();
    renderMatrix();
    startCountdown();
  }

  function renderQuestion() {
    const q = quiz.questions[currentQ];
    const selected = answers[q.id];
    const isFlagged = Boolean(flagged[q.id]);
    const elimSet = eliminated[q.id] || new Set();
    const isHintUsed = Boolean(hintsUsed[q.id]);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const qType = q.type || 'single';

    const card = document.getElementById('exam-card');
    if (!card) return;

    let optionsHtml = '';

    if (qType === 'multiple') {
      const selectedSet = new Set(Array.isArray(selected) ? selected : []);
      optionsHtml = `
        <div style="font-size:0.8rem;color:var(--accent-cyan);font-weight:700;margin-bottom:8px">☑ MULTIPLE SELECT: Choose all options that apply</div>
        <div class="exam-options-stack">
          ${q.options.map((opt, idx) => {
            const isChecked = selectedSet.has(idx);
            return `
              <button class="exam-option-card ${isChecked ? 'selected' : ''}"
                onclick="toggleMultipleOption('${q.id}', ${idx})">
                <span class="opt-letter">${isChecked ? '✓' : '□'}</span>
                <span style="flex:1">${escHtml(opt)}</span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    } else if (qType === 'boolean') {
      optionsHtml = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <button class="exam-option-card ${selected === 0 ? 'selected' : ''}" style="justify-content:center;padding:1.5rem" onclick="selectOption('${q.id}', 0)">
            <span style="font-size:1.25rem;font-weight:800;color:var(--emerald)">✓ TRUE</span>
          </button>
          <button class="exam-option-card ${selected === 1 ? 'selected' : ''}" style="justify-content:center;padding:1.5rem" onclick="selectOption('${q.id}', 1)">
            <span style="font-size:1.25rem;font-weight:800;color:var(--rose)">✕ FALSE</span>
          </button>
        </div>
      `;
    } else if (qType === 'fill_blank') {
      optionsHtml = `
        <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--r-lg);padding:1.5rem">
          <label style="font-size:0.8rem;font-weight:700;color:var(--ink-40);text-transform:uppercase;display:block;margin-bottom:8px">TYPE YOUR ANSWER</label>
          <div class="input-with-icon">
            <span class="input-icon">✏️</span>
            <input value="${escHtml(selected || '')}" placeholder="Type the missing word or phrase..."
              oninput="handleFillBlankAnswer('${q.id}', this.value)"
              style="font-size:1.1rem;font-weight:600" />
          </div>
        </div>
      `;
    } else if (qType === 'ordering') {
      const order = Array.isArray(selected) ? selected : q.options.map((_, i) => i);
      if (answers[q.id] === undefined) answers[q.id] = order;

      optionsHtml = `
        <div style="font-size:0.8rem;color:var(--amber);font-weight:700;margin-bottom:8px">⇅ ARRANGE IN CORRECT ORDER (Use arrows to reorder items)</div>
        <div class="exam-options-stack">
          ${order.map((optIdx, pos) => `
            <div class="exam-option-card" style="justify-content:space-between">
              <div style="display:flex;align-items:center;gap:12px">
                <span class="opt-letter" style="background:var(--primary);color:#fff">${pos + 1}</span>
                <span>${escHtml(q.options[optIdx])}</span>
              </div>
              <div style="display:flex;gap:4px">
                <button class="btn btn-ghost btn-sm" onclick="moveOrderItem('${q.id}', ${pos}, -1)" ${pos === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn btn-ghost btn-sm" onclick="moveOrderItem('${q.id}', ${pos}, 1)" ${pos === order.length - 1 ? 'disabled' : ''}>▼</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // Standard Single Choice
      optionsHtml = `
        <div class="exam-options-stack">
          ${q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isElim = elimSet.has(idx);
            return `
              <button class="exam-option-card ${isSelected ? 'selected' : ''} ${isElim ? 'eliminated' : ''}"
                onclick="selectOption('${q.id}', ${idx})"
                oncontextmenu="event.preventDefault();toggleEliminateOption('${q.id}', ${idx})"
                tabindex="0">
                <span class="opt-letter">${letters[idx]}</span>
                <span style="flex:1">${escHtml(opt)}</span>
                <span style="font-size:0.75rem;opacity:0.6" title="Right-click to cross-out/eliminate">
                  ${isElim ? '✕ Eliminated' : ''}
                </span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="exam-card-header">
        <span class="exam-q-number">Question ${currentQ + 1} of ${totalQ} · <span style="text-transform:capitalize;color:var(--ink-40)">${qType.replace('_', ' ')}</span></span>
        <button class="flag-review-btn ${isFlagged ? 'flagged' : ''}" onclick="toggleFlag('${q.id}')">
          <span>${isFlagged ? '🚩' : '⚐'}</span>
          <span>${isFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
        </button>
      </div>

      <div class="exam-question-text">${escHtml(q.text)}</div>

      ${q.codeSnippet ? `
        <pre class="code-snippet-box"><code>${escHtml(q.codeSnippet)}</code></pre>
      ` : ''}

      ${isHintUsed && q.hint ? `
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--r-md);padding:10px 14px;font-size:0.85rem;color:var(--amber);margin-bottom:1.25rem">
          💡 <strong>Hint:</strong> ${escHtml(q.hint)}
        </div>
      ` : ''}

      ${optionsHtml}
    `;

    // Update hint button text
    const hintBtn = document.getElementById('btn-hint');
    if (hintBtn) {
      if (isHintUsed) {
        hintBtn.innerHTML = '<span>💡</span> Hint Active';
        hintBtn.disabled = true;
      } else if (!q.hint) {
        hintBtn.innerHTML = '<span>💡</span> No Hint';
        hintBtn.disabled = true;
      } else {
        hintBtn.innerHTML = '<span>💡</span> Unlock Hint (-5%)';
        hintBtn.disabled = false;
      }
    }
  }

  function renderMatrix() {
    const matrix = document.getElementById('q-matrix');
    if (!matrix) return;

    matrix.innerHTML = quiz.questions.map((q, i) => {
      const isAns = answers[q.id] !== undefined;
      const isFlag = Boolean(flagged[q.id]);
      const isCur = i === currentQ;
      return `
        <button class="matrix-dot ${isAns ? 'answered' : ''} ${isFlag ? 'flagged' : ''} ${isCur ? 'active' : ''}"
          onclick="jumpQuestion(${i})" title="Question ${i+1}">
          ${i + 1}
        </button>
      `;
    }).join('');
  }

  function startCountdown() {
    if (activeQuizTimer) clearInterval(activeQuizTimer);
    activeQuizTimer = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('exam-timer');
      if (timerEl) {
        timerEl.textContent = `⏱ ${formatTime(timeLeft)}`;
        if (timeLeft <= 60) {
          timerEl.classList.add('critical');
          if (timeLeft <= 30) SoundFX.playTimerTick();
        }
      }

      if (timeLeft <= 0) {
        clearInterval(activeQuizTimer);
        activeQuizTimer = null;
        showToast('Time limit reached! Submitting examination…', 'warning');
        submitFinalExam();
      }
    }, 1000);
  }

  window.toggleCameraHUD = async () => {
    const camBox = document.getElementById('proctor-cam-box');
    const video = document.getElementById('proctor-video');
    if (!camBox || !video) return;

    if (!camBox.classList.contains('hidden')) {
      camBox.classList.add('hidden');
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
      }
    } else {
      camBox.classList.remove('hidden');
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = cameraStream;
        showToast('📷 Camera Proctoring Active', 'info');
      } catch {
        showToast('Camera access denied or unavailable. Virtual proctoring enabled.', 'warning');
      }
    }
  };

  window.toggleVoiceAnswering = () => {
    VoiceAssistant.startVoiceCommands((cmd) => {
      const q = quiz.questions[currentQ];
      if (cmd.type === 'select') {
        window.selectOption(q.id, cmd.index);
      } else if (cmd.type === 'next') {
        window.goNextQuestion();
      } else if (cmd.type === 'prev') {
        window.goPrevQuestion();
      } else if (cmd.type === 'flag') {
        window.toggleFlag(q.id);
      } else if (cmd.type === 'submit') {
        window.confirmSubmitExam();
      }
    });
  };

  window.toggleMultipleOption = (qId, idx) => {
    let currentArr = Array.isArray(answers[qId]) ? [...answers[qId]] : [];
    if (currentArr.includes(idx)) {
      currentArr = currentArr.filter(i => i !== idx);
    } else {
      currentArr.push(idx);
    }
    answers[qId] = currentArr;
    SoundFX.playOptionSelect();
    renderQuestion();
    renderMatrix();
  };

  window.handleFillBlankAnswer = (qId, val) => {
    answers[qId] = val;
    renderMatrix();
  };

  window.moveOrderItem = (qId, fromPos, direction) => {
    let order = Array.isArray(answers[qId]) ? [...answers[qId]] : quiz.questions[currentQ].options.map((_, i) => i);
    const toPos = fromPos + direction;
    if (toPos < 0 || toPos >= order.length) return;

    const temp = order[fromPos];
    order[fromPos] = order[toPos];
    order[toPos] = temp;

    answers[qId] = order;
    SoundFX.playClick();
    renderQuestion();
    renderMatrix();
  };

  // Global window functions for the active exam
  window.selectOption = (qId, idx) => {
    answers[qId] = idx;
    SoundFX.playOptionSelect();
    renderQuestion();
    renderMatrix();
  };

  window.toggleFlag = (qId) => {
    flagged[qId] = !flagged[qId];
    SoundFX.playClick();
    renderQuestion();
    renderMatrix();
  };

  window.toggleEliminateOption = (qId, idx) => {
    if (!eliminated[qId]) eliminated[qId] = new Set();
    if (eliminated[qId].has(idx)) eliminated[qId].delete(idx);
    else eliminated[qId].add(idx);
    SoundFX.playClick();
    renderQuestion();
  };

  window.revealHint = () => {
    const q = quiz.questions[currentQ];
    if (!q.hint) return;
    hintsUsed[q.id] = true;
    SoundFX.playClick();
    showToast('Hint unlocked! (5% penalty applied to final score)', 'info');
    renderQuestion();
  };

  window.goNextQuestion = () => {
    if (currentQ < totalQ - 1) {
      currentQ++;
      SoundFX.playClick();
      updateNavButtons();
    }
  };

  window.goPrevQuestion = () => {
    if (currentQ > 0) {
      currentQ--;
      SoundFX.playClick();
      updateNavButtons();
    }
  };

  window.jumpQuestion = (idx) => {
    currentQ = idx;
    SoundFX.playClick();
    updateNavButtons();
  };

  function updateNavButtons() {
    renderQuestion();
    renderMatrix();
    const prev = document.getElementById('btn-prev');
    if (prev) prev.disabled = currentQ === 0;

    const next = document.getElementById('btn-next');
    if (currentQ < totalQ - 1) {
      if (!next) {
        const sub = document.getElementById('btn-submit');
        if (sub) {
          sub.outerHTML = `<button class="btn btn-primary btn-sm" id="btn-next" onclick="goNextQuestion()">Next Question →</button>`;
        }
      }
    } else {
      if (next) {
        next.outerHTML = `<button class="btn btn-success btn-sm btn-glow" id="btn-submit" onclick="confirmSubmitExam()">Submit Examination ✓</button>`;
      }
    }
  }

  window.confirmExitExam = () => {
    openModal(`
      <h2 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:8px">Exit Examination?</h2>
      <p style="color:var(--ink-70);margin-bottom:1.5rem">Your progress will be discarded and this attempt will not be recorded.</p>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-danger" onclick="doExitExam()">Discard & Exit</button>
        <button class="btn btn-ghost" onclick="closeModal()">Continue Test</button>
      </div>
    `);
  };

  window.doExitExam = () => {
    cleanupExamListeners();
    closeModal();
    navigate('quizzes');
  };

  window.confirmSubmitExam = () => {
    const unanswered = quiz.questions.filter(q => answers[q.id] === undefined).length;
    const flagCount = Object.values(flagged).filter(Boolean).length;

    openModal(`
      <h2 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:8px">Ready to Submit?</h2>
      <div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:1rem;margin-bottom:1.5rem;font-size:0.9rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span>Answered Questions:</span>
          <strong>${totalQ - unanswered} / ${totalQ}</strong>
        </div>
        ${unanswered > 0 ? `
          <div style="display:flex;justify-content:space-between;color:var(--rose);margin-bottom:6px">
            <span>Unanswered:</span>
            <strong>${unanswered} items</strong>
          </div>
        ` : ''}
        ${flagCount > 0 ? `
          <div style="display:flex;justify-content:space-between;color:var(--amber)">
            <span>Flagged for Review:</span>
            <strong>${flagCount} items</strong>
          </div>
        ` : ''}
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="closeModal()">Review Answers</button>
        <button class="btn btn-primary btn-glow" onclick="closeModal();submitFinalExam()">Confirm & Score →</button>
      </div>
    `);
  };

  async function submitFinalExam() {
    cleanupExamListeners();
    const timeTaken = totalSeconds - timeLeft;

    try {
      const payload = {
        answers,
        timeTaken,
        tabSwitches,
        hintsUsed
      };
      const result = await API.post(`/quizzes/${quiz.id}/submit`, payload);

      if (result.passed) {
        SoundFX.playFanfare();
        Confetti.launch(4000);
      } else {
        SoundFX.playWrong();
      }

      navigate('quiz-result', { result, quizTitle: quiz.title });
    } catch (err) {
      showToast('Submission error: ' + err.message, 'error');
    }
  }

  function cleanupExamListeners() {
    if (activeQuizTimer) { clearInterval(activeQuizTimer); activeQuizTimer = null; }
    if (tabSwitchListener) {
      document.removeEventListener('visibilitychange', tabSwitchListener);
      window.removeEventListener('blur', tabSwitchListener);
      tabSwitchListener = null;
    }
    AntiCheatSecurity.disableLockdown();
    VoiceAssistant.stopSpeaking();
    VoiceAssistant.stopListening();
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
  }

  window.submitFinalExam = submitFinalExam;

  render();
}
