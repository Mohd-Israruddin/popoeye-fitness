const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// GET /api/admin - for health check or info
router.get('/', (req, res) => {
  res.json({ message: 'Admin API is running. Use POST /api/admin/login to log in.' });
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, passkey } = req.body;
  const [rows] = await db.query('SELECT * FROM admin_settings WHERE username = ?', [username]);
  const admin = rows[0];
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const match = await bcrypt.compare(passkey, admin.passkey);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: admin.id, username: admin.username, role: 'admin' } });
});

// GET /exists - Check if any admin exists
router.get('/exists', async (req, res) => {
  const [rows] = await db.query('SELECT COUNT(*) as count FROM admin_settings');
  res.json({ exists: rows[0].count > 0 });
});

// POST /setup - Create the first admin (only if none exists)
router.post('/setup', async (req, res) => {
  const { admin_code, username, email, phone } = req.body;
  if (!admin_code || !username || !email) {
    return res.status(400).json({ error: 'admin_code, username, and email are required.' });
  }
  // Check if any admin exists
  const [rows] = await db.query('SELECT COUNT(*) as count FROM admin_settings');
  if (rows[0].count > 0) {
    return res.status(403).json({ error: 'Admin already exists.' });
  }
  // Insert new admin
  await db.query(
    'INSERT INTO admin_settings (admin_code, username, email, phone) VALUES (?, ?, ?, ?)',
    [admin_code, username, email, phone || null]
  );
  res.json({ message: 'Admin created successfully.' });
});

// List all admins (for log filter dropdown)
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username FROM admin_settings');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 