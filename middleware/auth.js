const jwt = require('jsonwebtoken');
const { findById } = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'quiz_app_secret_2024_final_project';

function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findById('users', decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, requireAdmin, generateToken, JWT_SECRET };
