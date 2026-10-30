/* ── Exam Paper Generator & Bulk Question Importer/Exporter ────── */
const ExamExporter = (() => {
  function printWorksheet(quiz) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to print exam papers.', 'warning');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${quiz.title} — Official Examination Paper</title>
        <style>
          body { font-family: 'Georgia', serif; color: #111; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
          .meta-table { width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 14px; }
          .meta-table td { padding: 6px; border: 1px solid #ccc; }
          .q-block { margin-bottom: 25px; page-break-inside: avoid; }
          .q-text { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
          .q-opts { list-style: none; padding-left: 10px; }
          .q-opts li { margin-bottom: 6px; }
          .code-box { background: #f4f4f5; border: 1px solid #ddd; padding: 8px 12px; font-family: monospace; font-size: 13px; margin: 8px 0; }
          .key-section { margin-top: 50px; border-top: 2px dashed #666; padding-top: 30px; page-break-before: always; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px;text-align:right">
          <button onclick="window.print()" style="padding:10px 20px;font-size:16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Print Exam Paper (PDF)</button>
        </div>

        <div class="header">
          <div style="font-size:14px;letter-spacing:2px;text-transform:uppercase">QUIZMASTER ACADEMIC EVALUATION SYSTEM</div>
          <div class="title">${quiz.title}</div>
          <div style="font-size:14px;color:#555">Subject: ${quiz.category} · Difficulty: ${quiz.difficulty}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td><strong>Student Name:</strong> ___________________________</td>
            <td><strong>Roll / Student ID:</strong> ______________</td>
          </tr>
          <tr>
            <td><strong>Exam Duration:</strong> ${quiz.duration} Minutes</td>
            <td><strong>Total Marks:</strong> ${quiz.questions ? quiz.questions.length * 10 : 100}</td>
          </tr>
        </table>

        <div>
          ${(quiz.questions || []).map((q, i) => `
            <div class="q-block">
              <div class="q-text">Q${i + 1}. ${q.text}</div>
              ${q.codeSnippet ? `<pre class="code-box"><code>${q.codeSnippet}</code></pre>` : ''}
              <ul class="q-opts">
                ${q.options.map((opt, oIdx) => `
                  <li>[ &nbsp; ] <strong>${letters[oIdx]}.</strong> ${opt}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>

        <!-- Instructor Key Section -->
        <div class="key-section">
          <div style="font-size:18px;font-weight:bold;margin-bottom:15px">TEACHER'S OFFICIAL ANSWER KEY & EXPLANATIONS</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="background:#eee">
              <th style="padding:6px;border:1px solid #ccc;width:40px">Q#</th>
              <th style="padding:6px;border:1px solid #ccc">Correct Answer</th>
              <th style="padding:6px;border:1px solid #ccc">Explanation</th>
            </tr>
            ${(quiz.questions || []).map((q, i) => `
              <tr>
                <td style="padding:6px;border:1px solid #ccc;text-align:center"><strong>Q${i + 1}</strong></td>
                <td style="padding:6px;border:1px solid #ccc;color:#059669"><strong>Option ${letters[q.correctAnswer]}: ${q.options[q.correctAnswer]}</strong></td>
                <td style="padding:6px;border:1px solid #ccc;color:#444">${q.explanation || 'Direct factual question.'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  function downloadJSON(quiz) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quiz, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${quiz.title.replace(/\s+/g, '_')}_QuestionBank.json`);
    dlAnchor.click();
    showToast('Question Bank JSON exported!', 'success');
  }

  return { printWorksheet, downloadJSON };
})();
