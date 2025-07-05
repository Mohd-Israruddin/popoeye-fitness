const express = require("express");
const router = express.Router();
const db = require("../db"); // Must be mysql2/promise-based pool
const bcrypt = require("bcryptjs");

// ✅ GET all finances
router.get("/", async (req, res) => {
  try {
    const { limit, page } = req.query;

    if (limit && page) {
      // Handle paginated requests
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const limitNum = parseInt(limit, 10);

      const [[{ 'COUNT(*)': totalItems }]] = await db.execute("SELECT COUNT(*) FROM finances");
      const [rows] = await db.execute(
        "SELECT * FROM finances ORDER BY date DESC LIMIT ? OFFSET ?",
        [String(limitNum), String(offset)]
      );
      
      res.json({ finances: rows, totalItems });
    } else {
      // Handle non-paginated requests for backward compatibility
      const [rows] = await db.execute("SELECT * FROM finances ORDER BY date DESC");
      res.json(rows);
    }
  } catch (error) {
    console.error("❌ Error fetching finances:", error.message, error.stack);
    res.status(500).json({ error: "Failed to fetch finances." });
  }
});

// ✅ ADD new finance entry
router.post("/", async (req, res) => {
  let { date, type, amount, category, payment, description, created_by } = req.body;
  console.log('Received date (POST /finances):', date);
  // Use the date string as-is, no conversion

  if (!date || !type || !amount || !category || !payment) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO finances (date, type, amount, category, payment, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [date, type, amount, category, payment, description || null, created_by || null]
    );

    const [inserted] = await db.execute("SELECT * FROM finances WHERE id = ?", [result.insertId]);

    // Log to activity_logs if created_by is present
    if (created_by) {
      try {
        // Find staff id by staff_code or admin_code
        let staffId = null, adminId = null;
        const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [created_by]);
        if (staffRows.length > 0) {
          staffId = staffRows[0].id;
        } else {
          const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [created_by]);
          if (adminRows.length > 0) adminId = adminRows[0].id;
        }
        if (staffId) {
          await db.query(
            'INSERT INTO activity_logs (staff_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [staffId, 'add', 'finance', inserted[0].id, `Added finance: ${type} ₹${amount} (${category})`]
          );
        } else if (adminId) {
          await db.query(
            'INSERT INTO activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, 'add', 'finance', inserted[0].id, `Added finance: ${type} ₹${amount} (${category})`]
          );
        } else {
          // Optionally log or warn: could not find staff or admin for created_by
          console.warn('Could not log activity: created_by not found in staff or admin_settings');
        }
      } catch (logErr) {
        console.error('Failed to log finance addition to activity_logs:', logErr.message);
      }
    }

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("❌ Error adding finance entry:", error.message);
    res.status(500).json({ error: "Failed to add finance entry." });
  }
});

// ✅ UPDATE finance
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  let { date, type, amount, category, payment, description, admin_code } = req.body;
  console.log('Received date (PUT /finances/:id):', date);
  
  if (!admin_code) {
    return res.status(403).json({ message: 'Admin passkey required.' });
  }
  
  const valid = await verifyAdminPasskey('admin', admin_code);
  if (!valid) {
    return res.status(403).json({ message: 'Invalid admin passkey.' });
  }
  
  // Use the date string as-is, no conversion

  try {
    await db.execute(
      `UPDATE finances SET date=?, type=?, amount=?, category=?, payment=?, description=? WHERE id=?`,
      [date, type, amount, category, payment, description || null, id]
    );

    res.json({ message: "Finance entry updated successfully." });
  } catch (error) {
    console.error("❌ Error updating entry:", error.message);
    res.status(500).json({ error: "Failed to update entry." });
  }
});

// Helper to verify admin/staff code
async function verifyAdminPasskey(username, passkey) {
  console.log('Verifying admin/staff code:', passkey);
  
  // Check for admin_code first
  const [adminRows] = await db.query('SELECT * FROM admin_settings WHERE admin_code = ?', [passkey]);
  console.log('Found admin records:', adminRows.length);
  
  if (adminRows.length > 0) {
    console.log('Admin code verified successfully');
    return true;
  }
  
  // Check for staff_code if admin_code not found
  const [staffRows] = await db.query('SELECT * FROM staff WHERE staff_code = ?', [passkey]);
  console.log('Found staff records:', staffRows.length);
  
  if (staffRows.length > 0) {
    console.log('Staff code verified successfully');
    return true;
  }
  
  console.log('No matching admin or staff code found');
  return false;
}

// POST alternative for delete (for clients that can't send body with DELETE)
router.post('/:id/delete', async (req, res) => {
  console.log('POST /finances/:id/delete - Request body:', req.body);
  console.log('POST /finances/:id/delete - Request params:', req.params);
  
  const { admin_code } = req.body;
  console.log('Extracted admin_code:', admin_code);
  
  if (!admin_code) {
    console.log('No admin_code provided');
    return res.status(403).json({ message: 'Admin passkey required.' });
  }
  
  const valid = await verifyAdminPasskey('admin', admin_code);
  console.log('Admin code validation result:', valid);
  
  if (!valid) {
    console.log('Invalid admin code');
    return res.status(403).json({ message: 'Invalid admin passkey.' });
  }
  
  const { id } = req.params;
  console.log('Deleting finance with ID:', id);
  
  try {
    await db.execute("DELETE FROM finances WHERE id = ?", [id]);
    console.log('Finance deleted successfully');
    res.json({ message: "Finance entry deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting entry:", error.message);
    res.status(500).json({ error: "Failed to delete entry." });
  }
});

// ✅ DELETE finance
router.delete("/:id", async (req, res) => {
  const { username, passkey } = req.body;
  if (!username || !passkey) {
    return res.status(403).json({ message: 'Admin passkey required.' });
  }
  const valid = await verifyAdminPasskey(username, passkey);
  if (!valid) {
    return res.status(403).json({ message: 'Invalid admin passkey.' });
  }
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM finances WHERE id = ?", [id]);
    res.json({ message: "Finance entry deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting entry:", error.message);
    res.status(500).json({ error: "Failed to delete entry." });
  }
});

module.exports = router;
