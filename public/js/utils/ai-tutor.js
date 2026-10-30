/* ── Interactive AI Academic Coach & Tutor ─────────────────────── */
const AITutor = (() => {
  function openTutor(contextTopic = 'General Programming & Computer Science') {
    const user = getCurrentUser();

    openModal(`
      <div style="display:flex;flex-direction:column;height:520px;max-height:80vh">
        <div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border-subtle);padding-bottom:12px;margin-bottom:12px">
          <div style="width:40px;height:40px;border-radius:var(--r-full);background:linear-gradient(135deg,var(--primary) 0%,var(--accent-cyan) 100%);display:flex;align-items:center;justify-content:center;font-size:1.25rem">
            🤖
          </div>
          <div>
            <h3 style="font-family:var(--font-display);font-size:1.15rem;font-weight:800">QuizMaster AI Academic Coach</h3>
            <p style="font-size:0.75rem;color:var(--emerald);font-weight:600">● Online · Context: ${escHtml(contextTopic)}</p>
          </div>
        </div>

        <!-- Chat History Area -->
        <div id="ai-chat-history" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-right:4px;margin-bottom:12px">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="font-size:1.2rem">🤖</div>
            <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:10px 14px;font-size:0.875rem;line-height:1.5;max-width:85%">
              Hello <strong>${escHtml(user?.name ? user.name.split(' ')[0] : 'Scholar')}</strong>! I'm your AI Academic Coach. I can explain difficult exam concepts, generate mnemonics, debug code snippets, or create a personalized revision roadmap. Type any question or command (e.g. <code>/help</code>, <code>/clear</code>, <code>/quiz</code>). What would you like to explore?
            </div>
          </div>
        </div>

        <!-- Preset Quick Chips -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:8px">
          <button class="demo-chip" style="white-space:nowrap;padding:4px 10px;font-size:0.75rem" onclick="AITutor.askPrompt('Explain the JavaScript Event Loop with microtasks & macrotasks')">
            ⚡ Event Loop
          </button>
          <button class="demo-chip" style="white-space:nowrap;padding:4px 10px;font-size:0.75rem" onclick="AITutor.askPrompt('How does Binary Search achieve O(log n) complexity?')">
            🧠 Binary Search O(log n)
          </button>
          <button class="demo-chip" style="white-space:nowrap;padding:4px 10px;font-size:0.75rem" onclick="AITutor.askPrompt('/help')">
            ⚙️ /help Commands
          </button>
          <button class="demo-chip" style="white-space:nowrap;padding:4px 10px;font-size:0.75rem" onclick="AITutor.askPrompt('/clear')">
            🗑️ /clear Chat
          </button>
        </div>

        <!-- Input Bar -->
        <form id="ai-tutor-form" style="display:flex;gap:8px" onsubmit="AITutor.sendMessage(event)">
          <input id="ai-tutor-input" placeholder="Ask a question or type /help, /clear..." style="flex:1" autocomplete="off" required />
          <button type="submit" class="btn btn-primary btn-sm" id="ai-send-btn">
            <span>Send</span> →
          </button>
        </form>
      </div>
    `);
  }

  function appendMessage(sender, text) {
    const history = document.getElementById('ai-chat-history');
    if (!history) return;

    const isUser = sender === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.style.display = 'flex';
    msgDiv.style.gap = '10px';
    msgDiv.style.alignItems = 'flex-start';
    msgDiv.style.justifyContent = isUser ? 'flex-end' : 'flex-start';

    msgDiv.innerHTML = `
      ${!isUser ? '<div style="font-size:1.2rem">🤖</div>' : ''}
      <div style="background:${isUser ? 'var(--primary)' : 'var(--bg-elevated)'};color:${isUser ? '#fff' : 'var(--ink)'};border:1px solid ${isUser ? 'transparent' : 'var(--border-subtle)'};border-radius:var(--r-md);padding:10px 14px;font-size:0.875rem;line-height:1.5;max-width:85%">
        ${text}
      </div>
      ${isUser ? '<div style="font-size:1.2rem">👤</div>' : ''}
    `;

    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
  }

  async function sendMessage(e) {
    if (e) e.preventDefault();
    try {
      const input = document.getElementById('ai-tutor-input');
      if (!input || !input.value.trim()) {
        showToast('Please enter a question or command.', 'warning');
        return;
      }

      const query = input.value.trim();
      input.value = '';
      appendMessage('user', escHtml(query));
      if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();

      // AI Synthesis & Command Logic
      setTimeout(() => {
        try {
          const response = generateAIResponse(query);
          appendMessage('ai', response);
          if (typeof SoundFX !== 'undefined' && SoundFX.playCorrect) SoundFX.playCorrect();
        } catch (err) {
          console.error('AI Tutor Response Error:', err);
          appendMessage('ai', '⚠️ Sorry, I encountered an error processing your request. Please try again.');
          showToast('AI Tutor processing error', 'error');
        }
      }, 400);
    } catch (err) {
      console.error('AI Tutor Send Error:', err);
      showToast('Error sending message to AI Tutor', 'error');
    }
  }

  function askPrompt(promptText) {
    const input = document.getElementById('ai-tutor-input');
    if (input) {
      input.value = promptText;
      sendMessage();
    }
  }

  function generateAIResponse(q) {
    const lower = q.toLowerCase().trim();

    // Command handling
    if (lower === '/clear') {
      const history = document.getElementById('ai-chat-history');
      if (history) {
        history.innerHTML = `
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="font-size:1.2rem">🤖</div>
            <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:10px 14px;font-size:0.875rem;line-height:1.5;max-width:85%">
              Chat history cleared. How else can I assist your studies today?
            </div>
          </div>
        `;
      }
      return '🧹 Chat history has been cleared.';
    }

    if (lower === '/help' || lower === 'help') {
      return `<strong>🤖 AI Coach Command Directory:</strong><br><br>
      • <code>/help</code> - Display this help directory & commands.<br>
      • <code>/clear</code> - Clear chat history.<br>
      • <code>/quiz</code> - Get practice quiz recommendations.<br>
      • <code>/study</code> - Request a study plan or revision strategy.<br>
      • <code>/tips</code> - View top exam success tips.<br><br>
      You can also ask any programming, algorithms, database, or system design question directly!`;
    }

    if (lower === '/quiz' || lower.includes('practice quiz')) {
      return `<strong>💡 Practice Quiz Recommendation:</strong><br><br>
      Ready to test your knowledge? Head over to the <a href="#" onclick="navigate('quizzes'); closeModal(); return false;" style="color:var(--accent-cyan);font-weight:700">Exam Catalog</a> to take timed assessments in JavaScript, Data Structures, Cloud Computing, or Web Security!`;
    }

    if (lower === '/tips' || lower.includes('exam tips')) {
      return `<strong>🏆 Top Exam Success Tips:</strong><br><br>
      1. <strong>Read Carefully:</strong> Watch out for negated questions (e.g. "which of these is NOT...").<br>
      2. <strong>Time Management:</strong> Allocate time per question and flag difficult questions to review later.<br>
      3. <strong>Anti-Cheat Awareness:</strong> Ensure you remain in full-screen mode during proctored exams to avoid automated warnings.`;
    }

    if (lower.includes('event loop') || lower.includes('microtask')) {
      return `<strong>The JavaScript Event Loop:</strong><br><br>
      1. <strong>Call Stack:</strong> Executes synchronous code immediately (LIFO).<br>
      2. <strong>Microtask Queue:</strong> Handles <code>Promise.then()</code>, <code>async/await</code>, and <code>queueMicrotask</code>. Executes <em>immediately</em> after the current stack frame, before any UI repaints.<br>
      3. <strong>Macrotask Queue:</strong> Handles <code>setTimeout()</code>, <code>setInterval()</code>, and I/O. Runs one task per tick after microtasks are completely emptied!`;
    }

    if (lower.includes('binary search') || lower.includes('log n')) {
      return `<strong>Binary Search O(log n) Proof:</strong><br><br>
      Because the array is sorted, comparing the middle element allows us to discard <strong>half</strong> of the remaining search space with each comparison.<br>
      • Size sequence: N → N/2 → N/4 → ... → 1<br>
      • Solving $N / 2^k = 1$ yields $k = \\log_2(N)$ iterations in worst case!`;
    }

    if (lower.includes('study plan') || lower.includes('plan') || lower.includes('roadmap') || lower === '/study') {
      return `<strong>Structured 3-Day Mastery Roadmap:</strong><br><br>
      • <strong>Day 1 (Core Foundations):</strong> Review Dockerfiles, multi-stage builds, and container isolation principles. Take the practice test.<br>
      • <strong>Day 2 (Architecture & Kubernetes):</strong> Learn Ingress controllers, Services, Pods, and ReplicaSets. Practice debugging sample manifests.<br>
      • <strong>Day 3 (Security & CI/CD):</strong> Study rate-limiting, CSP headers, and automated testing pipelines. Attempt the final Proctored Certification Exam!`;
    }

    if (lower.includes('owasp') || lower.includes('security')) {
      return `<strong>OWASP Top Critical Web Vulnerabilities:</strong><br><br>
      1. <strong>Broken Access Control:</strong> Ensure authorization checks run server-side for every API route.<br>
      2. <strong>Cryptographic Failures:</strong> Always use bcrypt (cost factor >= 10) for passwords and HTTPS with TLS 1.3.<br>
      3. <strong>Injection (SQLi/Command):</strong> Use parameterized queries and prepared statements.<br>
      4. <strong>Insecure Design & SSRF:</strong> Restrict internal metadata access and validate remote URLs.`;
    }

    return `<strong>Academic Synthesis for: "${escHtml(q)}"</strong><br><br>
    Great inquiry! When approaching this topic in engineering assessments:<br>
    • <strong>Core Theorem:</strong> Focus on understanding the trade-offs between time vs space complexity and fault-tolerance.<br>
    • <strong>Best Practice:</strong> Always validate inputs, isolate side-effects into pure functions, and implement structured error recovery.<br>
    • <strong>Exam Tip:</strong> Pay close attention to boundary edge-cases (e.g. <code>null</code>, empty arrays, concurrent race conditions).`;
  }

  return { openTutor, sendMessage, askPrompt };
})();
