const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// POST /login - Unified ID-based login for admin and staff
router.post('/', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID is required.' });
  }

  // Try admin by admin_code
  let [rows] = await db.query('SELECT * FROM admin_settings WHERE admin_code = ?', [id]);
  let user = rows[0];
  if (user) {
    const token = jwt.sign({ id: user.id, admin_code: user.admin_code, username: user.username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, user: { id: user.id, admin_code: user.admin_code, username: user.username, role: 'admin' } });
  }

  // Try staff by staff_code
  [rows] = await db.query('SELECT * FROM staff WHERE staff_code = ?', [id]);
  user = rows[0];
  if (user) {
    const token = jwt.sign({ id: user.id, staff_code: user.staff_code, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, user: { id: user.id, staff_code: user.staff_code, username: user.username, role: user.role } });
  }

  return res.status(401).json({ error: 'Invalid ID.' });
});

module.exports = router; 