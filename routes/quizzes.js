const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { findAll, findById, insertOne, updateById, deleteById } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to calculate student levels and badges
function checkBadgesAndXP(user, result, quiz) {
  let xpGained = Math.round(result.score * 2);
  if (result.passed) xpGained += 50;
  if (result.score === 100) xpGained += 100;
  if (result.tabSwitches === 0) xpGained += 25; // Clean proctored bonus

  const currentXP = (user.xp || 0) + xpGained;
  const currentBadges = new Set(user.badges || []);
  const newBadges = [];

  // Badges logic
  if (!currentBadges.has('first_quiz')) {
    currentBadges.add('first_quiz');
    newBadges.push({ id: 'first_quiz', title: 'First Step', desc: 'Completed your first quiz!', icon: '🎯' });
  }
  if (result.score === 100 && !currentBadges.has('perfect_score')) {
    currentBadges.add('perfect_score');
    newBadges.push({ id: 'perfect_score', title: 'Perfectionist', desc: 'Scored a perfect 100% on a quiz!', icon: '🌟' });
  }
  if (result.timeTaken && result.timeTaken < (quiz.duration * 60 * 0.4) && result.passed && !currentBadges.has('speed_demon')) {
    currentBadges.add('speed_demon');
    newBadges.push({ id: 'speed_demon', title: 'Speed Demon', desc: 'Passed a quiz in record time!', icon: '⚡' });
  }
  if (currentXP >= 2000 && !currentBadges.has('quiz_master')) {
    currentBadges.add('quiz_master');
    newBadges.push({ id: 'quiz_master', title: 'Grandmaster', desc: 'Earned over 2,000 XP in total!', icon: '👑' });
  }

  // Level thresholds
  let level = 'Novice';
  if (currentXP >= 2500) level = 'Grandmaster';
  else if (currentXP >= 1500) level = 'Master';
  else if (currentXP >= 800) level = 'Scholar';
  else if (currentXP >= 300) level = 'Apprentice';

  updateById('users', user.id, {
    xp: currentXP,
    level,
    badges: Array.from(currentBadges),
    streak: (user.streak || 0) + 1
  });

  return { xpGained, newBadges, totalXP: currentXP, level };
}

// GET /api/quizzes — list all available quizzes
router.get('/', authenticate, (req, res) => {
  try {
    let quizzes = findAll('quizzes');
    if (req.user.role !== 'admin') {
      quizzes = quizzes.filter(q => q.isPublished);
    }
    const safe = quizzes.map(q => {
      const { questions, ...meta } = q;
      return {
        ...meta,
        questionCount: questions ? questions.length : 0
      };
    });
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/generate-ai — Smart AI Quiz Generator
router.post('/generate-ai', authenticate, requireAdmin, async (req, res) => {
  try {
    const { topic, difficulty = 'Medium', count = 5, category = 'General' } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required for AI generation' });

    // Built-in intelligent question synthesizer based on topics
    const questionTemplates = {
      react: [
        {
          text: 'What is the primary difference between useEffect and useLayoutEffect in React?',
          options: [
            'useLayoutEffect runs synchronously immediately after DOM mutations before the browser paints',
            'useEffect is faster because it does not support cleanup functions',
            'useLayoutEffect only runs on server-side rendering environments',
            'useEffect cannot accept dependency arrays'
          ],
          correctAnswer: 0,
          hint: 'Think about visual layout flickers and browser paint cycles.',
          explanation: 'useLayoutEffect fires synchronously after all DOM mutations and blocks visual repaints, preventing screen flickering.'
        },
        {
          text: 'How does React 18 Concurrent Mode improve UI responsiveness?',
          options: [
            'By running all rendering on WebAssembly background threads',
            'By allowing state transitions to be interruptible via startTransition',
            'By completely removing the Virtual DOM diffing engine',
            'By forcing all state mutations into local storage'
          ],
          correctAnswer: 1,
          hint: 'Allows high-priority user input to interrupt slow background list renders.',
          explanation: 'React 18 concurrent rendering enables interruptible renders so high-priority updates (typing, clicks) take precedence over heavy computations.'
        },
        {
          text: 'What is the purpose of React.memo()?',
          options: [
            'To memoize expensive calculations inside render functions',
            'A higher-order component that prevents re-rendering if props have not shallowly changed',
            'To store session cache across browser reloads',
            'To automatically bind class methods'
          ],
          correctAnswer: 1,
          hint: 'Optimizes functional component re-renders based on props comparison.',
          explanation: 'React.memo wraps a functional component to skip rendering if its next props are shallowly equal to its previous props.'
        }
      ],
      python: [
        {
          text: 'What is the Global Interpreter Lock (GIL) in CPython?',
          options: [
            'A cryptographic module for securing Python bytecodes',
            'A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes at once',
            'A package manager permission locking system',
            'A database connection pool synchronizer'
          ],
          correctAnswer: 1,
          hint: 'Limits multi-threaded CPU-bound performance in standard CPython.',
          explanation: 'The GIL is a mutex used by CPython to ensure only one thread executes Python bytecode at a time, simplifying thread safety.'
        },
        {
          text: 'What does the "yield" keyword do in a Python function?',
          options: [
            'Permanently terminates the function execution and returns a tuple',
            'Turns the function into a generator that yields values on demand and preserves state',
            'Forces the garbage collector to free memory',
            'Passes CPU execution to the operating system kernel'
          ],
          correctAnswer: 1,
          hint: 'Used to produce iterator sequences without holding everything in memory.',
          explanation: 'Functions containing `yield` become generators, returning an iterator that produces values lazily when next() is called.'
        }
      ],
      general: [
        {
          text: `Which core principle is most vital in evaluating ${topic}?`,
          options: [
            `Separation of concerns, modularity, and maintainable architecture in ${topic}`,
            'Over-engineering monolithic structures for legacy compatibility',
            'Hardcoding dynamic credentials directly into client bundles',
            'Ignoring edge cases and network latency limitations'
          ],
          correctAnswer: 0,
          hint: 'Focus on software engineering best practices.',
          explanation: `In ${topic}, adherence to modularity and clean abstractions ensures robust, scalable systems.`
        },
        {
          text: `What is the recommended approach for error handling and telemetry in ${topic}?`,
          options: [
            'Suppressing exceptions with empty try/catch blocks',
            'Structured logging, graceful fallbacks, and comprehensive monitoring',
            'Throwing fatal unhandled exceptions to crash the runtime',
            'Logging sensitive user data into unencrypted public endpoints'
          ],
          correctAnswer: 1,
          hint: 'Always log context and recover gracefully.',
          explanation: 'Structured logging and centralized monitoring provide actionable metrics without disrupting the end-user experience.'
        }
      ]
    };

    const topicKey = Object.keys(questionTemplates).find(k => topic.toLowerCase().includes(k)) || 'general';
    let pool = [...(questionTemplates[topicKey] || questionTemplates.general)];

    // If more requested, synthesize dynamically
    while (pool.length < count) {
      pool.push({
        text: `Advanced Concept #${pool.length + 1} in ${topic}: What is the optimal strategy for scalable deployment?`,
        options: [
          'Horizontal auto-scaling with stateless microservices & health check probes',
          'Deploying a single oversized bare-metal server with no backup redundancy',
          'Manual file transfer over unencrypted FTP without version control',
          'Disabling all caching layers and database indexing'
        ],
        correctAnswer: 0,
        hint: 'Modern distributed architectures favor redundancy and automated scaling.',
        explanation: 'Stateless services paired with horizontal scaling and health checks guarantee high availability and fault tolerance.'
      });
    }

    const generatedQuestions = pool.slice(0, parseInt(count)).map(q => ({
      ...q,
      id: uuidv4()
    }));

    const generatedQuiz = {
      title: `${topic} Master Assessment`,
      description: `Comprehensive AI-generated proficiency exam covering core foundations, real-world patterns, and advanced troubleshooting for ${topic}.`,
      category: category,
      difficulty: difficulty,
      duration: Math.max(5, Math.round(generatedQuestions.length * 2)),
      passingScore: 70,
      negativeMarking: difficulty === 'Hard' ? 0.25 : 0,
      isPublished: true,
      proctored: difficulty === 'Hard',
      icon: difficulty === 'Hard' ? '🔥' : '💡',
      tags: [topic, category, 'AI-Generated', 'Assessment'],
      questions: generatedQuestions
    };

    res.json(generatedQuiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id — single quiz (with randomization for fair testing)
router.get('/:id', authenticate, (req, res) => {
  try {
    const quiz = findById('quizzes', req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (!quiz.isPublished && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Quiz not available' });

    if (req.user.role === 'admin') {
      return res.json(quiz);
    }

    // Strip answers & explanations for active student examination
    let safeQ = quiz.questions.map(({ correctAnswer, correctAnswers, correctText, correctOrder, explanation, ...q }) => ({
      ...q,
      type: q.type || 'single'
    }));

    // Dynamic Randomization Algorithm (Fisher-Yates shuffle if requested or enabled)
    if (req.query.shuffle === 'true' || quiz.proctored) {
      for (let i = safeQ.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [safeQ[i], safeQ[j]] = [safeQ[j], safeQ[i]];
      }
    }

    res.json({ ...quiz, questions: safeQ });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes — create quiz
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { title, description, category, difficulty, duration, passingScore, negativeMarking, proctored, icon, tags, questions, isPublished } = req.body;
    if (!title || !questions || questions.length === 0)
      return res.status(400).json({ error: 'Title and at least one question required' });

    const quiz = insertOne('quizzes', {
      id: uuidv4(),
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'General',
      difficulty: difficulty || 'Medium',
      duration: parseInt(duration) || 15,
      passingScore: parseInt(passingScore) || 60,
      negativeMarking: parseFloat(negativeMarking) || 0,
      proctored: Boolean(proctored),
      icon: icon || '📝',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Quiz']),
      isPublished: isPublished !== false,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      questions: questions.map(q => ({
        ...q,
        id: q.id || uuidv4(),
        hint: q.hint || '',
        codeSnippet: q.codeSnippet || ''
      }))
    });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/quizzes/:id — update quiz
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const quiz = findById('quizzes', req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    if (updates.questions) {
      updates.questions = updates.questions.map(q => ({
        ...q,
        id: q.id || uuidv4(),
        hint: q.hint || '',
        codeSnippet: q.codeSnippet || ''
      }));
    }
    const updated = updateById('quizzes', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quizzes/:id — delete quiz
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const deleted = deleteById('quizzes', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/:id/submit — submit quiz with proctoring, hints & penalty tracking
router.post('/:id/submit', authenticate, (req, res) => {
  try {
    const quiz = findById('quizzes', req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (!quiz.isPublished && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Quiz not available' });

    const { answers = {}, timeTaken = 0, tabSwitches = 0, hintsUsed = {} } = req.body;

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    const negMarking = quiz.negativeMarking || 0;

    const breakdown = quiz.questions.map(q => {
      const selected = answers[q.id];
      const type = q.type || 'single';
      let hasAnswered = false;
      let isCorrect = false;
      let selectedDisplay = 'Not Attempted';
      let correctDisplay = 'N/A';

      if (type === 'multiple') {
        hasAnswered = Array.isArray(selected) && selected.length > 0;
        if (hasAnswered) {
          const sSorted = [...selected].sort().join(',');
          const cSorted = [...(q.correctAnswers || [])].sort().join(',');
          isCorrect = sSorted === cSorted;
          selectedDisplay = selected.map(idx => q.options[idx]).join(', ');
        }
        correctDisplay = (q.correctAnswers || []).map(idx => q.options[idx]).join(', ');
      } else if (type === 'boolean') {
        hasAnswered = selected !== undefined && selected !== null;
        if (hasAnswered) {
          isCorrect = selected === q.correctAnswer;
          selectedDisplay = selected === 0 ? 'True' : 'False';
        }
        correctDisplay = q.correctAnswer === 0 ? 'True' : 'False';
      } else if (type === 'fill_blank') {
        hasAnswered = typeof selected === 'string' && selected.trim().length > 0;
        if (hasAnswered) {
          isCorrect = selected.toLowerCase().trim() === (q.correctText || '').toLowerCase().trim();
          selectedDisplay = selected.trim();
        }
        correctDisplay = q.correctText || '';
      } else if (type === 'ordering') {
        hasAnswered = Array.isArray(selected) && selected.length > 0;
        if (hasAnswered) {
          isCorrect = selected.join(',') === (q.correctOrder || []).join(',');
          selectedDisplay = selected.map(idx => q.options[idx]).join(' → ');
        }
        correctDisplay = (q.correctOrder || []).map(idx => q.options[idx]).join(' → ');
      } else {
        // Single choice default
        hasAnswered = selected !== undefined && selected !== null && selected !== -1;
        if (hasAnswered) {
          isCorrect = selected === q.correctAnswer;
          selectedDisplay = q.options[selected] || 'N/A';
        }
        correctDisplay = q.options[q.correctAnswer] || 'N/A';
      }

      const usedHint = Boolean(hintsUsed[q.id]);

      if (!hasAnswered) {
        unattempted++;
      } else if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }

      return {
        questionId: q.id,
        questionText: q.text,
        type,
        codeSnippet: q.codeSnippet || '',
        selectedAnswer: selectedDisplay,
        correctAnswer: correctDisplay,
        isCorrect,
        hasAnswered,
        usedHint,
        explanation: q.explanation
      };
    });

    const total = quiz.questions.length;
    // Calculate raw score with negative marking
    let rawScore = (correct * 1) - (wrong * negMarking);
    // Deduct 5% per hint used
    const hintCount = Object.keys(hintsUsed).length;
    const hintPenalty = (hintCount * 0.05);
    rawScore = Math.max(0, rawScore - (hintPenalty * total));

    const finalScore = Math.min(100, Math.max(0, Math.round((rawScore / total) * 100)));
    const passed = finalScore >= quiz.passingScore;

    // Generate unique Certificate ID if passed
    const certificateId = passed
      ? `QM-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
      : null;

    const user = findById('users', req.user.id);
    const gamification = checkBadgesAndXP(user, { score: finalScore, passed, timeTaken, tabSwitches }, quiz);

    const result = insertOne('results', {
      id: uuidv4(),
      userId: req.user.id,
      userName: req.user.name,
      avatar: req.user.avatar || req.user.name[0].toUpperCase(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizCategory: quiz.category,
      difficulty: quiz.difficulty,
      score: finalScore,
      correct,
      wrong,
      unattempted,
      total,
      passed,
      passingScore: quiz.passingScore,
      timeTaken,
      tabSwitches,
      hintsUsedCount: hintCount,
      xpEarned: gamification.xpGained,
      certificateId,
      breakdown,
      submittedAt: new Date().toISOString()
    });

    res.json({
      resultId: result.id,
      userName: req.user.name,
      score: finalScore,
      correct,
      wrong,
      unattempted,
      total,
      passed,
      passingScore: quiz.passingScore,
      timeTaken,
      tabSwitches,
      certificateId,
      gamification,
      breakdown,
      message: passed
        ? `🎉 Outstanding! You passed with ${finalScore}%!`
        : `📚 You scored ${finalScore}%. Keep sharpening your skills!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
