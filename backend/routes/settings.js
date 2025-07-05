const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// GET all settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE settings
router.post('/', async (req, res) => {
  const { gym_name, contact_email, contact_phone, opening_hours, notifications_enabled } = req.body;
  try {
    const [existing] = await db.query('SELECT COUNT(*) as count FROM settings');
    if (existing[0].count > 0) {
      await db.query(
        'UPDATE settings SET gym_name=?, contact_email=?, contact_phone=?, opening_hours=?, notifications_enabled=?',
        [gym_name, contact_email, contact_phone, opening_hours, notifications_enabled]
      );
    } else {
      await db.query(
        'INSERT INTO settings (gym_name, contact_email, contact_phone, opening_hours, notifications_enabled) VALUES (?, ?, ?, ?, ?)',
        [gym_name, contact_email, contact_phone, opening_hours, notifications_enabled]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHECK IF ADMIN EXISTS
router.get('/admin/exists', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM admin_settings');
    res.json({ exists: rows[0].count > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE ADMIN
router.post('/admin/create', async (req, res) => {
  const { username, admin_code } = req.body;
  if (!username || !admin_code) {
    return res.status(400).json({ error: 'Username and admin code are required.' });
  }
  try {
    // Check if admin already exists
    const [existing] = await db.query('SELECT COUNT(*) as count FROM admin_settings');
    if (existing[0].count > 0) {
      return res.status(400).json({ error: 'Admin already exists.' });
    }
    
    // Create admin with admin_code (no hashing needed)
    await db.query('INSERT INTO admin_settings (username, admin_code) VALUES (?, ?)', [username, admin_code]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESET ADMIN (Delete existing admin)
router.delete('/admin/reset', async (req, res) => {
  try {
    // Delete the admin - activity logs will have admin_id set to NULL automatically
    await db.query('DELETE FROM admin_settings');
    res.json({ success: true, message: 'Admin has been reset. You can now create a new admin.' });
  } catch (err) {
    console.error('Error resetting admin:', err);
    res.status(500).json({ error: err.message });
  }
});

// CHANGE ADMIN CODE (using phone verification)
router.post('/admin/change-admin-code', async (req, res) => {
  const { username, phone, new_admin_code } = req.body;
  if (!username || !phone || !new_admin_code) {
    return res.status(400).json({ error: 'Username, phone number, and new admin code are required.' });
  }
  try {
    console.log('Changing admin code for username:', username);
    
    // First verify the admin exists
    const [rows] = await db.query('SELECT * FROM admin_settings WHERE username=?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    
    // For now, we'll allow the change if username exists (phone verification can be added later)
    // In a real implementation, you might want to verify the phone number against the admin record
    const admin = rows[0];
    console.log('Admin found, updating admin_code...');
    
    // Update admin_code directly (no hashing needed)
    await db.query('UPDATE admin_settings SET admin_code=? WHERE id=?', [new_admin_code, admin.id]);
    
    console.log('Admin code updated successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('Error in change-admin-code:', err);
    res.status(500).json({ error: err.message });
  }
});

// VERIFY ADMIN CODE
router.post('/admin/verify-admin-code', async (req, res) => {
  const { username, admin_code } = req.body;
  if (!username || !admin_code) {
    return res.status(400).json({ success: false, error: 'Username and admin code required.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM admin_settings WHERE username=?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Admin not found.' });
    }
    const admin = rows[0];
    
    // Compare admin_code directly (no hashing)
    if (admin_code !== admin.admin_code) {
      return res.status(401).json({ success: false, error: 'Invalid admin code.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error in verify-admin-code:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get low stock threshold
router.get("/low-stock-threshold", async (req, res) => {
    try {
        const [rows] = await db.query('SELECT low_stock_threshold FROM settings LIMIT 1');
        const threshold = rows[0]?.low_stock_threshold || 5;
        res.json({ threshold });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching low stock threshold." });
    }
});

// Update low stock threshold
router.put("/low-stock-threshold", async (req, res) => {
    const { threshold, created_by } = req.body;
    
    if (!threshold || threshold < 1) {
        return res.status(400).json({ message: "Threshold must be at least 1." });
    }

    try {
        // Update or insert the threshold in settings table
        const [existing] = await db.query('SELECT COUNT(*) as count FROM settings');
        if (existing[0].count > 0) {
            await db.query('UPDATE settings SET low_stock_threshold = ?, updated_at = NOW()', [threshold]);
        } else {
            await db.query('INSERT INTO settings (low_stock_threshold) VALUES (?)', [threshold]);
        }
        
        res.json({ message: "Low stock threshold updated successfully.", threshold });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating low stock threshold." });
    }
});

// GET expense limit
router.get('/expense-limit', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT expense_limit FROM settings LIMIT 1');
    res.json({ limit: rows[0]?.expense_limit || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE expense limit
router.post('/expense-limit', async (req, res) => {
  const { limit } = req.body;
  if (limit === undefined || limit < 0) {
    return res.status(400).json({ error: 'Invalid expense limit amount.' });
  }
  try {
    const [result] = await db.query('UPDATE settings SET expense_limit=? LIMIT 1', [limit]);
    if (result.affectedRows === 0) {
      await db.query('INSERT INTO settings (expense_limit) VALUES (?)', [limit]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET dashboard layout
router.get('/dashboard-layout', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT dashboard_layout FROM settings LIMIT 1');
    res.json(rows[0]?.dashboard_layout || { lg: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST dashboard layout
router.post('/dashboard-layout', async (req, res) => {
  const { layout } = req.body;
  if (!layout) {
    return res.status(400).json({ error: 'Layout data is required.' });
  }
  try {
    const layoutString = JSON.stringify(layout);
    await db.query('UPDATE settings SET dashboard_layout=? LIMIT 1', [layoutString]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE ADMIN PASSKEY (keep for backward compatibility)
router.post('/admin/change-passkey', async (req, res) => {
  const { username, old_passkey, new_passkey } = req.body;
  if (!username || !old_passkey || !new_passkey) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM admin_settings WHERE username=?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    const admin = rows[0];
    if (old_passkey !== admin.admin_code) {
      return res.status(401).json({ error: 'Old admin code is incorrect.' });
    }
    await db.query('UPDATE admin_settings SET admin_code=? WHERE id=?', [new_passkey, admin.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in change-passkey:', err);
    res.status(500).json({ error: err.message });
  }
});

// RESET ADMIN PASSKEY (Simple reset without token)
router.post('/admin/reset-passkey', async (req, res) => {
  const { username, new_passkey } = req.body;
  if (!username || !new_passkey) {
    return res.status(400).json({ error: 'Username and new admin code are required.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM admin_settings WHERE username=?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    const admin = rows[0];
    await db.query('UPDATE admin_settings SET admin_code=? WHERE id=?', [new_passkey, admin.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in reset-passkey:', err);
    res.status(500).json({ error: err.message });
  }
});

// VERIFY ADMIN PASSKEY (keep for backward compatibility)
router.post('/admin/verify-passkey', async (req, res) => {
  const { username, passkey } = req.body;
  if (!username || !passkey) {
    return res.status(400).json({ success: false, error: 'Username and admin code required.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM admin_settings WHERE username=?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Admin not found.' });
    }
    const admin = rows[0];
    if (passkey !== admin.admin_code) {
      return res.status(401).json({ success: false, error: 'Invalid admin code.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 