const express = require('express');
const bcrypt = require('bcryptjs');
const { findAll, findById, updateById, deleteById } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — current user profile with full gamification data
router.get('/me', authenticate, (req, res) => {
  const user = findById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/users/me — update profile & preferences
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, theme, soundEnabled, currentPassword, newPassword } = req.body;
    const user = findById('users', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = {};
    if (name) {
      updates.name = name.trim();
      updates.avatar = name.trim()[0].toUpperCase();
    }
    if (theme !== undefined) {
      updates.theme = theme;
    }
    if (soundEnabled !== undefined) {
      updates.soundEnabled = Boolean(soundEnabled);
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(401).json({ error: 'Current password incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = updateById('users', req.user.id, updates);
    const { password, ...safeUser } = updated;
    res.json({ message: 'Profile updated successfully', user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — admin: list all users with stats
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const users = findAll('users').map(({ password, ...u }) => u);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — admin: delete user
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account' });
    const deleted = deleteById('users', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role — admin: change role
router.put('/:id/role', authenticate, requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student'].includes(role))
      return res.status(400).json({ error: 'Role must be admin or student' });
    const updated = updateById('users', req.params.id, { role });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
