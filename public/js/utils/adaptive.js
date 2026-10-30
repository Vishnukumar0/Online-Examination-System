/* ── Computerized Adaptive Testing (CAT) Engine ───────────────
   Dynamically recalibrates question difficulty in real-time
   based on student accuracy per Item Response Theory (IRT).
───────────────────────────────────────────────────────────── */
const AdaptiveEngine = (() => {
  function calibrateNextQuestion(questionPool, history = [], currentTheta = 1.0) {
    // theta: student ability rating (0.5 = Easy, 1.0 = Medium, 1.8 = Hard)
    const answeredIds = new Set(history.map(h => h.questionId));
    const unasked = questionPool.filter(q => !answeredIds.has(q.id));

    if (unasked.length === 0) return { nextQuestion: null, currentTheta };

    // Calculate target difficulty based on last answer
    const lastAttempt = history[history.length - 1];
    let newTheta = currentTheta;

    if (lastAttempt) {
      if (lastAttempt.isCorrect) {
        newTheta = Math.min(2.5, currentTheta + 0.35); // Step up difficulty
      } else {
        newTheta = Math.max(0.3, currentTheta - 0.30); // Step down to diagnose foundation
      }
    }

    // Map theta to target difficulty label
    let targetDiff = 'Medium';
    if (newTheta < 0.8) targetDiff = 'Easy';
    else if (newTheta > 1.4) targetDiff = 'Hard';

    // Find best matching question in unasked pool
    let match = unasked.find(q => q.difficulty === targetDiff);
    if (!match) match = unasked[0];

    return {
      nextQuestion: match,
      currentTheta: Math.round(newTheta * 100) / 100,
      targetDiff,
      remainingCount: unasked.length
    };
  }

  function getAbilityDescription(theta) {
    if (theta >= 1.8) return { level: 'Grandmaster (Advanced)', color: 'var(--rose)' };
    if (theta >= 1.3) return { level: 'Master (Proficient)', color: 'var(--amber)' };
    if (theta >= 0.9) return { level: 'Scholar (Competent)', color: 'var(--primary)' };
    return { level: 'Apprentice (Foundational)', color: 'var(--emerald)' };
  }

  return { calibrateNextQuestion, getAbilityDescription };
})();
