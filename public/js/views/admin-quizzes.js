/* ── Admin Quiz Management with AI Generator & Rich Editor ───── */

async function renderAdminQuizzes(container) {
  container.innerHTML = `
    <div class="view-page">
      <div class="view-header">
        <div>
          <h1 class="view-title">Assessment Management</h1>
          <p class="view-subtitle">Create, configure, AI-generate, and maintain student exams and question banks.</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-outline" onclick="showAIQuizModal()">
            <span>✨</span> AI Exam Generator
          </button>
          <button class="btn btn-primary btn-glow" onclick="showQuizEditorModal()">
            <span>+</span> Manual Quiz Builder
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Proctoring</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-q-table"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  try {
    const quizzes = await API.get('/quizzes');
    const tbody = document.getElementById('admin-q-table');

    tbody.innerHTML = quizzes.map(q => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.5rem">${q.icon || '📝'}</span>
            <div>
              <strong>${escHtml(q.title)}</strong>
              <div style="font-size:0.75rem;color:var(--ink-40)">
                ${q.questionCount} Questions · ${q.duration} Mins · Pass: ${q.passingScore}%
              </div>
            </div>
          </div>
        </td>
        <td><span class="pill-tag pill-category">${escHtml(q.category)}</span></td>
        <td><span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span></td>
        <td>
          ${q.proctored
            ? '<span class="pill-tag pill-proctored">🛡️ Proctored</span>'
            : '<span style="color:var(--ink-40);font-size:0.8rem">Standard</span>'}
        </td>
        <td>
          <span class="badge ${q.isPublished ? 'badge-pass' : 'badge-fail'}">
            ${q.isPublished ? 'PUBLISHED' : 'DRAFT'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="showQuizEditorModal('${q.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" title="Print Paper Worksheet" onclick="triggerPrintExam('${q.id}')">🖨️ Paper</button>
            <button class="btn btn-ghost btn-sm" title="Export JSON" onclick="triggerExportJSON('${q.id}')">💾 JSON</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--rose)" onclick="deleteQuizItem('${q.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    window.triggerPrintExam = async (id) => {
      try {
        const q = await API.get(`/quizzes/${id}`);
        ExamExporter.printWorksheet(q);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    window.triggerExportJSON = async (id) => {
      try {
        const q = await API.get(`/quizzes/${id}`);
        ExamExporter.downloadJSON(q);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    window.deleteQuizItem = async (id) => {
      if (!confirm('Permanently delete this assessment and its associated questions?')) return;
      try {
        await API.del(`/quizzes/${id}`);
        showToast('Assessment deleted', 'success');
        renderAdminQuizzes(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // AI Quiz Generator Modal
    window.showAIQuizModal = () => {
      openModal(`
        <div style="text-align:center;margin-bottom:1.5rem">
          <span style="font-size:3rem;display:block;margin-bottom:0.5rem">✨</span>
          <h2 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800">AI Exam Synthesizer</h2>
          <p style="color:var(--ink-70);font-size:0.85rem">Generate comprehensive, high-quality question banks automatically using AI algorithms.</p>
        </div>

        <form id="ai-generator-form" class="auth-form">
          <div class="field">
            <label>Subject / Topic Keywords</label>
            <input id="ai-topic" placeholder="e.g. React 18 & Redux Toolkit, Python AsyncIO, Docker Containers" required />
          </div>

          <div class="form-row">
            <div class="field">
              <label>Academic Category</label>
              <select id="ai-category">
                <option value="Computer Science">Computer Science</option>
                <option value="Programming">Programming</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>
            <div class="field">
              <label>Difficulty Tier</label>
              <select id="ai-difficulty">
                <option value="Easy">Easy (Fundamentals)</option>
                <option value="Medium" selected>Medium (Application)</option>
                <option value="Hard">Hard (Deep Mastery)</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Number of Questions to Generate</label>
            <select id="ai-count">
              <option value="4">4 Questions (Quick Quiz)</option>
              <option value="6" selected>6 Questions (Standard Test)</option>
              <option value="10">10 Questions (Comprehensive Exam)</option>
            </select>
          </div>

          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:1.5rem">
            <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-glow" id="btn-run-ai">
              <span>✨</span> Generate Exam
            </button>
          </div>
        </form>
      `);

      document.getElementById('ai-generator-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-run-ai');
        btn.classList.add('loading');
        btn.disabled = true;

        try {
          const payload = {
            topic: document.getElementById('ai-topic').value,
            category: document.getElementById('ai-category').value,
            difficulty: document.getElementById('ai-difficulty').value,
            count: document.getElementById('ai-count').value
          };

          const generatedQuiz = await API.post('/quizzes/generate-ai', payload);
          // Pass generated data straight to the editor for review!
          closeModal();
          showToast('AI Exam Synthesized successfully! Review & Save below.', 'success');
          showQuizEditorModal(null, generatedQuiz);
        } catch (err) {
          showToast('AI Generation failed: ' + err.message, 'error');
          btn.classList.remove('loading');
          btn.disabled = false;
        }
      };
    };

    // Full Manual / Edit Quiz Modal
    window.showQuizEditorModal = async (id, prefilledData = null) => {
      let quiz = prefilledData || {
        title: '',
        description: '',
        category: 'Programming',
        difficulty: 'Medium',
        duration: 15,
        passingScore: 70,
        negativeMarking: 0,
        proctored: false,
        icon: '⚡',
        tags: 'General, Exam',
        isPublished: true,
        questions: []
      };

      if (id && !prefilledData) {
        try {
          quiz = await API.get(`/quizzes/${id}`);
          if (Array.isArray(quiz.tags)) quiz.tags = quiz.tags.join(', ');
        } catch (e) {
          showToast(e.message, 'error');
          return;
        }
      }

      openModal(`
        <h2 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;margin-bottom:1.5rem">
          ${id ? 'Edit Assessment' : 'Create New Assessment'}
        </h2>

        <form id="quiz-editor-form" class="auth-form">
          <div class="form-row">
            <div class="field" style="flex:2">
              <label>Exam Title</label>
              <input id="q-title" value="${escHtml(quiz.title)}" placeholder="e.g. Modern Web Architecture" required />
            </div>
            <div class="field" style="flex:1">
              <label>Icon Emoji</label>
              <input id="q-icon" value="${escHtml(quiz.icon || '⚡')}" placeholder="⚡, 🧠, 🛡️" />
            </div>
          </div>

          <div class="field">
            <label>Executive Description</label>
            <textarea id="q-desc" placeholder="Brief outline of syllabus covered in this exam...">${escHtml(quiz.description || '')}</textarea>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Category</label>
              <input id="q-cat" value="${escHtml(quiz.category)}" placeholder="e.g. Computer Science" required />
            </div>
            <div class="field">
              <label>Difficulty</label>
              <select id="q-diff">
                <option value="Easy" ${quiz.difficulty==='Easy'?'selected':''}>Easy</option>
                <option value="Medium" ${quiz.difficulty==='Medium'?'selected':''}>Medium</option>
                <option value="Hard" ${quiz.difficulty==='Hard'?'selected':''}>Hard</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Duration (Minutes)</label>
              <input type="number" id="q-dur" value="${quiz.duration}" min="1" max="180" required />
            </div>
            <div class="field">
              <label>Passing Score (%)</label>
              <input type="number" id="q-pass" value="${quiz.passingScore}" min="10" max="100" required />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Negative Marking (per wrong answer)</label>
              <input type="number" step="0.05" id="q-neg" value="${quiz.negativeMarking || 0}" min="0" max="1" />
            </div>
            <div class="field">
              <label>Anti-Cheat Proctoring</label>
              <select id="q-proctor">
                <option value="true" ${quiz.proctored?'selected':''}>Enabled (Focus Tracking)</option>
                <option value="false" ${!quiz.proctored?'selected':''}>Disabled (Standard Mode)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Tags (comma-separated)</label>
              <input id="q-tags" value="${escHtml(quiz.tags || '')}" placeholder="React, Frontend, JavaScript" />
            </div>
            <div class="field">
              <label>Status</label>
              <select id="q-pub">
                <option value="true" ${quiz.isPublished?'selected':''}>Published (Active)</option>
                <option value="false" ${!quiz.isPublished?'selected':''}>Draft Mode (Hidden)</option>
              </select>
            </div>
          </div>

          <!-- Questions Stack -->
          <div style="margin:1.5rem 0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
              <h3 style="font-family:var(--font-display);font-size:1.2rem;font-weight:700">Exam Questions Stack</h3>
              <button type="button" class="btn btn-outline btn-sm" onclick="addQuestionItem()">+ Add Question</button>
            </div>
            <div id="q-items-container" style="display:flex;flex-direction:column;gap:16px"></div>
          </div>

          <div style="display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border-subtle);padding-top:1.5rem">
            <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-glow">Save Assessment →</button>
          </div>
        </form>
      `);

      window.editorQuizData = quiz;
      if (!window.editorQuizData.questions) window.editorQuizData.questions = [];

      window.renderQuestionsEditorStack = () => {
        const container = document.getElementById('q-items-container');
        if (!container) return;

        container.innerHTML = window.editorQuizData.questions.map((q, qIdx) => `
          <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--r-lg);padding:1.25rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="font-weight:800;color:var(--primary)">QUESTION #${qIdx + 1}</span>
              <button type="button" class="btn btn-ghost btn-sm" style="color:var(--rose)" onclick="removeQuestionItem(${qIdx})">Remove</button>
            </div>

            <div class="field">
              <input value="${escHtml(q.text)}" placeholder="Enter question statement..." oninput="window.editorQuizData.questions[${qIdx}].text = this.value" required />
            </div>

            <div class="field">
              <label style="font-size:0.75rem">Code Snippet (Optional)</label>
              <textarea style="font-family:var(--font-code);font-size:0.8rem;min-height:60px" placeholder="const x = 10; ..." oninput="window.editorQuizData.questions[${qIdx}].codeSnippet = this.value">${escHtml(q.codeSnippet || '')}</textarea>
            </div>

            <label style="font-size:0.75rem;font-weight:700;color:var(--ink-40);display:block;margin-bottom:6px">OPTIONS (Radio indicates correct answer)</label>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${(q.options || ['','','','']).map((opt, oIdx) => `
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="radio" name="q-correct-${qIdx}" ${q.correctAnswer === oIdx ? 'checked' : ''} onchange="window.editorQuizData.questions[${qIdx}].correctAnswer = ${oIdx}" />
                  <input style="flex:1" value="${escHtml(opt)}" placeholder="Option ${['A','B','C','D'][oIdx]}" oninput="window.editorQuizData.questions[${qIdx}].options[${oIdx}] = this.value" required />
                </div>
              `).join('')}
            </div>

            <div class="form-row" style="margin-top:10px">
              <div class="field">
                <label style="font-size:0.75rem">Hint (Optional)</label>
                <input value="${escHtml(q.hint || '')}" placeholder="Helpful nudge for students..." oninput="window.editorQuizData.questions[${qIdx}].hint = this.value" />
              </div>
              <div class="field">
                <label style="font-size:0.75rem">Explanation</label>
                <input value="${escHtml(q.explanation || '')}" placeholder="Why this option is correct..." oninput="window.editorQuizData.questions[${qIdx}].explanation = this.value" />
              </div>
            </div>
          </div>
        `).join('');
      };

      window.addQuestionItem = () => {
        window.editorQuizData.questions.push({
          text: '',
          codeSnippet: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          hint: '',
          explanation: ''
        });
        window.renderQuestionsEditorStack();
      };

      window.removeQuestionItem = (idx) => {
        window.editorQuizData.questions.splice(idx, 1);
        window.renderQuestionsEditorStack();
      };

      window.renderQuestionsEditorStack();

      document.getElementById('quiz-editor-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
          title: document.getElementById('q-title').value,
          icon: document.getElementById('q-icon').value || '⚡',
          description: document.getElementById('q-desc').value,
          category: document.getElementById('q-cat').value,
          difficulty: document.getElementById('q-diff').value,
          duration: document.getElementById('q-dur').value,
          passingScore: document.getElementById('q-pass').value,
          negativeMarking: document.getElementById('q-neg').value,
          proctored: document.getElementById('q-proctor').value === 'true',
          tags: document.getElementById('q-tags').value,
          isPublished: document.getElementById('q-pub').value === 'true',
          questions: window.editorQuizData.questions
        };

        if (payload.questions.length === 0) {
          showToast('Please add at least one question to the exam.', 'error');
          return;
        }

        try {
          if (id) {
            await API.put(`/quizzes/${id}`, payload);
          } else {
            await API.post('/quizzes', payload);
          }
          closeModal();
          showToast('Assessment saved successfully!', 'success');
          renderAdminQuizzes(container);
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
    };

  } catch (err) {
    container.innerHTML = `<div class="view-page"><div class="form-error">${err.message}</div></div>`;
  }
}
