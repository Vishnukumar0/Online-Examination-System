const express = require('express');
const { findAll, findById, deleteById } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/results/mine — current user's results with stats
router.get('/mine', authenticate, (req, res) => {
  try {
    const results = findAll('results', r => r.userId === req.user.id);
    results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/leaderboard — top scorers with XP and ranks
router.get('/leaderboard', authenticate, (req, res) => {
  try {
    const results = findAll('results');
    const users = findAll('users');
    const quizzes = findAll('quizzes');

    // Aggregate user totals (best scores + total attempts + total XP)
    const userStats = {};

    users.forEach(u => {
      userStats[u.id] = {
        userId: u.id,
        userName: u.name,
        avatar: u.avatar || u.name[0].toUpperCase(),
        role: u.role,
        level: u.level || 'Novice',
        xp: u.xp || 0,
        streak: u.streak || 0,
        badges: u.badges || [],
        quizzesTaken: 0,
        totalScore: 0,
        bestScore: 0,
        quizzesPassed: 0,
        recentQuiz: '—'
      };
    });

    results.forEach(r => {
      if (userStats[r.userId]) {
        userStats[r.userId].quizzesTaken++;
        userStats[r.userId].totalScore += r.score;
        if (r.score > userStats[r.userId].bestScore) {
          userStats[r.userId].bestScore = r.score;
        }
        if (r.passed) {
          userStats[r.userId].quizzesPassed++;
        }
        userStats[r.userId].recentQuiz = r.quizTitle;
      }
    });

    const leaderboard = Object.values(userStats)
      .filter(u => u.role === 'student' || u.quizzesTaken > 0)
      .map(u => ({
        ...u,
        avgScore: u.quizzesTaken ? Math.round(u.totalScore / u.quizzesTaken) : 0
      }));

    // Sort primarily by XP, secondarily by avgScore
    leaderboard.sort((a, b) => b.xp - a.xp || b.avgScore - a.avgScore);
    res.json(leaderboard.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/certificate/:certId — Certificate verification
router.get('/certificate/:certId', (req, res) => {
  try {
    const result = findAll('results', r => r.certificateId === req.params.certId)[0];
    if (!result) return res.status(404).json({ error: 'Certificate not found or invalid' });

    res.json({
      certificateId: result.certificateId,
      studentName: result.userName,
      quizTitle: result.quizTitle,
      score: result.score,
      issuedAt: result.submittedAt,
      verified: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/export/csv — Admin export to CSV
router.get('/export/csv', authenticate, requireAdmin, (req, res) => {
  try {
    const results = findAll('results');
    const headers = ['Result ID', 'Student Name', 'Quiz Title', 'Score (%)', 'Passed', 'Time (s)', 'Tab Switches', 'Certificate ID', 'Date'];

    const rows = results.map(r => [
      `"${r.id}"`,
      `"${r.userName || ''}"`,
      `"${(r.quizTitle || '').replace(/"/g, '""')}"`,
      r.score,
      r.passed ? 'PASS' : 'FAIL',
      r.timeTaken || 0,
      r.tabSwitches || 0,
      `"${r.certificateId || 'N/A'}"`,
      `"${r.submittedAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="quiz_master_results_export.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/stats — admin deep analytics
router.get('/stats', authenticate, requireAdmin, (req, res) => {
  try {
    const results = findAll('results');
    const users = findAll('users');
    const quizzes = findAll('quizzes');

    const totalAttempts = results.length;
    const passed = results.filter(r => r.passed).length;
    const avgScore = results.length
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
      : 0;

    // Score distribution buckets for chart
    const scoreBuckets = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
    results.forEach(r => {
      if (r.score <= 20) scoreBuckets['0-20%']++;
      else if (r.score <= 40) scoreBuckets['21-40%']++;
      else if (r.score <= 60) scoreBuckets['41-60%']++;
      else if (r.score <= 80) scoreBuckets['61-80%']++;
      else scoreBuckets['81-100%']++;
    });

    // Category accuracy
    const categoryStats = {};
    results.forEach(r => {
      const cat = r.quizCategory || 'General';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { attempts: 0, totalScore: 0, passed: 0 };
      }
      categoryStats[cat].attempts++;
      categoryStats[cat].totalScore += r.score;
      if (r.passed) categoryStats[cat].passed++;
    });

    const categories = Object.keys(categoryStats).map(cat => ({
      name: cat,
      attempts: categoryStats[cat].attempts,
      avgScore: Math.round(categoryStats[cat].totalScore / categoryStats[cat].attempts),
      passRate: Math.round((categoryStats[cat].passed / categoryStats[cat].attempts) * 100)
    }));

    // Per-quiz breakdown
    const quizStats = quizzes.map(q => {
      const qResults = results.filter(r => r.quizId === q.id);
      return {
        quizId: q.id,
        quizTitle: q.title,
        category: q.category,
        difficulty: q.difficulty,
        attempts: qResults.length,
        avgScore: qResults.length
          ? Math.round(qResults.reduce((s, r) => s + r.score, 0) / qResults.length)
          : 0,
        passRate: qResults.length
          ? Math.round((qResults.filter(r => r.passed).length / qResults.length) * 100)
          : 0
      };
    });

    res.json({
      totalUsers: users.filter(u => u.role === 'student').length,
      totalQuizzes: quizzes.filter(q => q.isPublished).length,
      totalAttempts,
      passRate: totalAttempts ? Math.round((passed / totalAttempts) * 100) : 0,
      avgScore,
      scoreBuckets,
      categories,
      quizStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/:id — single result detail
router.get('/:id', authenticate, (req, res) => {
  try {
    const result = findById('results', req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    if (result.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/results/:id — admin delete
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const deleted = deleteById('results', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Result not found' });
    res.json({ message: 'Result deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
