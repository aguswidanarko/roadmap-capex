const express = require('express');
const bcrypt = require('bcryptjs');
const { db, logAudit } = require('./db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();
router.use(requireAuth);

// GET /audit-log - WEB-013
router.get('/audit-log', requireRole('admin', 'superadmin', 'operator'), (req, res) => {
  const limit = Number(req.query.limit) || 200;
  res.json(db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit));
});

// GET/POST /users - Super Admin only (BRD section 4, "opsional")
router.get('/users', requireRole('superadmin'), (req, res) => {
  res.json(db.prepare('SELECT id, username, full_name, role, scope_kebun, created_at FROM users ORDER BY id').all());
});

router.post('/users', requireRole('superadmin'), (req, res) => {
  const { username, password, full_name, role, scope_kebun } = req.body || {};
  if (!username || !password || !role) return res.status(400).json({ error: 'username, password, role required' });
  const info = db.prepare(`INSERT INTO users (username, password_hash, full_name, role, scope_kebun) VALUES (?,?,?,?,?)`)
    .run(username, bcrypt.hashSync(password, 8), full_name || username, role, scope_kebun || 'ALL');
  logAudit({ entity: 'users', recordId: info.lastInsertRowid, action: 'CREATE', newValue: { username, role }, user: req.user.username });
  res.status(201).json({ id: info.lastInsertRowid, username, role });
});

router.get('/me', (req, res) => res.json(req.user));

module.exports = router;
