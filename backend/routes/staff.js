const express = require("express");
const router = express.Router();
const db = require("../db"); // assumes db is set up with mysql2/promise
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

// Place this FIRST:
router.get('/logs', async (req, res) => {
  const { staff_id, action, target_type, start_date, end_date, search } = req.query;
  try {
    let sql = `SELECT l.*, 
      CASE 
        WHEN s.name IS NOT NULL THEN CONCAT(s.name, ' (Staff)')
        WHEN a.username IS NOT NULL THEN CONCAT(a.username, ' (Admin)')
        ELSE 'Unknown' END AS name_with_role
      FROM activity_logs l
      LEFT JOIN staff s ON l.staff_id = s.id
      LEFT JOIN admin_settings a ON l.admin_id = a.id
      WHERE 1=1`;
    let params = [];
    if (staff_id) {
      sql += ' AND (l.staff_id = ? OR l.admin_id = ?)';
      params.push(staff_id, staff_id);
    }
    if (action) {
      sql += ' AND l.action = ?';
      params.push(action);
    }
    if (target_type) {
      sql += ' AND l.target_type = ?';
      params.push(target_type);
    }
    if (start_date) {
      sql += ' AND l.timestamp >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND l.timestamp <= ?';
      params.push(end_date);
    }
    if (search) {
      sql += ' AND l.details LIKE ?';
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY l.timestamp DESC';
    const [logs] = await db.query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all staff
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM staff");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff", details: err.message });
  }
});

// GET single staff by ID (optional)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Staff not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff", details: err.message });
  }
});

// POST add new staff
router.post("/", async (req, res) => {
  const { name, role, phone, email, address, status, salary, staff_code } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO staff (name, staff_code, role, phone, email, address, status, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, staff_code, role, phone, email, address, status, salary || 0]
    );
    const [newStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [result.insertId]);
    const { id: newStaffId } = newStaff[0];

    // If salary is provided, create a recurring transaction
    if (salary && Number(salary) > 0) {
      const today = new Date();
      // Helper to format date to YYYY-MM-DD
      const toSQLDate = (date) => date.toISOString().slice(0, 10);
      const nextDueDate = new Date(new Date().setMonth(today.getMonth() + 1));

      const recurringTransaction = {
        name: `Salary for ${name}`,
        type: 'expense',
        amount: salary,
        category: 'Staff Salary',
        payment: 'Bank Transfer',
        description: `Monthly salary for ${name} (Staff ID: ${newStaffId})`,
        frequency: 'monthly',
        start_date: toSQLDate(today),
        next_due_date: toSQLDate(nextDueDate),
        staff_id: newStaffId,
        is_active: true,
      };

      const columns = Object.keys(recurringTransaction);
      const values = Object.values(recurringTransaction);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO recurring_transactions (${columns.join(', ')}) VALUES (${placeholders})`;
      await db.query(sql, values);

      // Immediately register the first salary payment in finances
      const financeTransaction = {
        date: toSQLDate(today),
        type: 'expense',
        amount: salary,
        category: 'Staff Salary',
        payment: 'Bank Transfer',
        description: `Salary for ${name} (Staff ID: ${newStaffId}) [Auto-generated from recurring transaction]`
      };
      const fCols = Object.keys(financeTransaction);
      const fVals = Object.values(financeTransaction);
      const fPlaceholders = fCols.map(() => '?').join(', ');
      const fSql = `INSERT INTO finances (${fCols.join(', ')}) VALUES (${fPlaceholders})`;
      await db.query(fSql, fVals);
    }

    res.status(201).json(newStaff[0]);
  } catch (err) {
    console.error("Error in POST /staff:", err);
    res.status(500).json({ error: "Failed to add staff", details: err.message });
  }
});

// Helper to verify admin/staff code
async function verifyAdminCode(code) {
  // Check for admin_code first
  const [adminRows] = await db.query('SELECT * FROM admin_settings WHERE admin_code = ?', [code]);
  
  if (adminRows.length > 0) {
    return true;
  }
  
  // Check for staff_code if admin_code not found
  const [staffRows] = await db.query('SELECT * FROM staff WHERE staff_code = ?', [code]);
  
  if (staffRows.length > 0) {
    return true;
  }
  
  return false;
}

// PUT update existing staff
router.put("/:id", async (req, res) => {
  const { admin_code, ...updateData } = req.body;
  if (!admin_code) {
    return res.status(403).json({ message: 'Admin code required.' });
  }
  const valid = await verifyAdminCode(admin_code);
  if (!valid) {
    return res.status(403).json({ message: 'Invalid admin code.' });
  }
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE staff SET name = ?, staff_code = ?, role = ?, phone = ?, email = ?, address = ?, status = ?, salary = ? WHERE id = ?",
      [updateData.name, updateData.staff_code, updateData.role, updateData.phone, updateData.email, updateData.address, updateData.status, updateData.salary || 0, id]
    );
    // If salary was updated, also update the corresponding recurring transaction
    if (updateData.salary !== undefined) {
      await db.query(
        "UPDATE recurring_transactions SET amount = ? WHERE staff_id = ? AND category = 'Staff Salary'",
        [updateData.salary || 0, id]
      );
    }
    const [updatedStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
    res.json(updatedStaff[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update staff", details: err.message });
  }
});

// PUT update salary status
router.put("/:id/salary-status", async (req, res) => {
  const { salary_status } = req.body;
  const { id } = req.params;
  
  if (!salary_status) {
    return res.status(400).json({ message: 'Salary status is required.' });
  }
  
  try {
    await db.query("UPDATE staff SET salary_status = ? WHERE id = ?", [salary_status, id]);
    const [updatedStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
    
    if (updatedStaff.length === 0) {
      return res.status(404).json({ message: 'Staff not found.' });
    }
    
    res.json(updatedStaff[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update salary status", details: err.message });
  }
});

// PUT update staff code
router.put("/:id/code", async (req, res) => {
  const { staff_code } = req.body;
  const { id } = req.params;
  
  if (!staff_code) {
    return res.status(400).json({ message: 'Staff code is required.' });
  }
  
  try {
    await db.query("UPDATE staff SET staff_code = ? WHERE id = ?", [staff_code, id]);
    const [updatedStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
    
    if (updatedStaff.length === 0) {
      return res.status(404).json({ message: 'Staff not found.' });
    }
    
    res.json({ message: 'Staff code updated successfully.', staff: updatedStaff[0] });
  } catch (err) {
    console.error("Error updating staff code:", err);
    res.status(500).json({ error: "Failed to update staff code", details: err.message });
  }
});

// POST alternative for delete (for clients that can't send body with DELETE)
router.post('/:id/delete', async (req, res) => {
  console.log('POST /staff/:id/delete - Request body:', req.body);
  console.log('POST /staff/:id/delete - Request params:', req.params);
  
  const { admin_code } = req.body;
  console.log('Extracted admin_code:', admin_code);
  
  if (!admin_code) {
    console.log('No admin_code provided');
    return res.status(403).json({ message: 'Admin code required.' });
  }
  
  const valid = await verifyAdminCode(admin_code);
  console.log('Admin code validation result:', valid);
  
  if (!valid) {
    console.log('Invalid admin code');
    return res.status(403).json({ message: 'Invalid admin code.' });
  }
  
  const { id } = req.params;
  console.log('Deleting staff with ID:', id);
  
  try {
    // First, delete related activity logs
    await db.query("DELETE FROM activity_logs WHERE staff_id = ?", [id]);
    console.log('Deleted related activity logs');
    
    // Then delete the staff member
    await db.query("DELETE FROM staff WHERE id = ?", [id]);
    console.log('Staff deleted successfully');
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    console.error('Error deleting staff:', err);
    res.status(500).json({ error: "Failed to delete staff", details: err.message });
  }
});

// DELETE staff
router.delete("/:id", async (req, res) => {
  console.log('DELETE /staff/:id - Request body:', req.body);
  console.log('DELETE /staff/:id - Request params:', req.params);
  
  const { admin_code } = req.body;
  console.log('Extracted admin_code:', admin_code);
  
  if (!admin_code) {
    console.log('No admin_code provided');
    return res.status(403).json({ message: 'Admin code required.' });
  }
  
  const valid = await verifyAdminCode(admin_code);
  console.log('Admin code validation result:', valid);
  
  if (!valid) {
    console.log('Invalid admin code');
    return res.status(403).json({ message: 'Invalid admin code.' });
  }
  
  const { id } = req.params;
  console.log('Deleting staff with ID:', id);
  
  try {
    await db.query("DELETE FROM staff WHERE id = ?", [id]);
    console.log('Staff deleted successfully');
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    console.error('Error deleting staff:', err);
    res.status(500).json({ error: "Failed to delete staff", details: err.message });
  }
});

// ============================
// POST - Staff Login
// ============================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const [rows] = await db.query('SELECT * FROM staff WHERE username = ?', [username]);
  const staff = rows[0];
  if (!staff) return res.status(401).json({ error: 'Invalid credentials.' });
  const match = await bcrypt.compare(password, staff.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
  // Generate JWT
  const token = jwt.sign({ id: staff.id, username: staff.username, role: staff.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, staff: { id: staff.id, name: staff.name, username: staff.username, role: staff.role } });
});



// ============================
// POST - Log Staff Activity
// ============================
router.post('/:id/log', async (req, res) => {
  const { action, target_type, target_id, details } = req.body;
  try {
    let staffId = null, adminId = null;
    const [staffRows] = await db.query('SELECT id FROM staff WHERE id = ?', [req.params.id]);
    if (staffRows.length > 0) {
      staffId = staffRows[0].id;
    } else {
      const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE id = ?', [req.params.id]);
      if (adminRows.length > 0) adminId = adminRows[0].id;
    }
    if (staffId) {
      await db.query(
        'INSERT INTO activity_logs (staff_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
        [staffId, action, target_type, target_id, details || null]
      );
    } else if (adminId) {
      await db.query(
        'INSERT INTO activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
        [adminId, action, target_type, target_id, details || null]
      );
    } else {
      return res.status(400).json({ error: 'No matching staff or admin for log.' });
    }
    res.json({ message: 'Activity logged.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
