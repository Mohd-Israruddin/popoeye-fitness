const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// GET all enquiries
router.get("/", async (req, res) => {
  try {
    const [enquiries] = await db.query("SELECT * FROM enquiries ORDER BY enquiry_date DESC");
    res.json(enquiries);
  } catch (err) {
    console.error("Error fetching enquiries:", err);
    res.status(500).json({ message: "Failed to fetch enquiries." });
  }
});

// POST a new enquiry
router.post("/", async (req, res) => {
  const { name, phone, email, source, interest, status, follow_up_date, notes, created_by } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone number are required." });
  }

  // Convert empty string to NULL for date fields
  const processedFollowUpDate = follow_up_date && follow_up_date.trim() !== '' ? follow_up_date : null;

  try {
    const [result] = await db.query(
      "INSERT INTO enquiries (name, phone, email, source, interest, status, follow_up_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, phone, email, source, interest, status || 'New', processedFollowUpDate, notes]
    );
    
    // Log activity if created_by is provided
    if (created_by) {
      await logActivity(created_by, 'add', 'enquiry', result.insertId, `Added enquiry: ${name} (${phone})`);
    }
    
    res.status(201).json({ id: result.insertId, message: "Enquiry added successfully." });
  } catch (err) {
    console.error("Error adding enquiry:", err);
    res.status(500).json({ message: "Failed to add enquiry." });
  }
});

// Helper to verify admin/staff code
async function verifyAdminCode(code) {
  console.log('Verifying admin/staff code:', code);
  
  // Check for admin_code first
  const [adminRows] = await db.query('SELECT * FROM admin_settings WHERE admin_code = ?', [code]);
  console.log('Found admin records:', adminRows.length);
  
  if (adminRows.length > 0) {
    console.log('Admin code verified successfully');
    return true;
  }
  
  // Check for staff_code if admin_code not found
  const [staffRows] = await db.query('SELECT * FROM staff WHERE staff_code = ?', [code]);
  console.log('Found staff records:', staffRows.length);
  
  if (staffRows.length > 0) {
    console.log('Staff code verified successfully');
    return true;
  }
  
  console.log('No matching admin or staff code found');
  return false;
}

// Helper to log activity
async function logActivity(created_by, action, target_type, target_id, details) {
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
        [staffId, action, target_type, target_id, details]
      );
    } else if (adminId) {
      await db.query(
        'INSERT INTO activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
        [adminId, action, target_type, target_id, details]
      );
    } else {
      console.warn('Could not log activity: created_by not found in staff or admin_settings');
    }
  } catch (logErr) {
    console.error('Failed to log activity:', logErr.message);
  }
}

// PUT (update) an existing enquiry - now requires admin/staff code
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, source, interest, status, follow_up_date, notes, created_by } = req.body;

  console.log('PUT request for enquiry ID:', id);
  console.log('Received created_by:', created_by);

  // Verify admin/staff code
  if (!created_by) {
    console.log('Missing created_by');
    return res.status(403).json({ message: 'Admin/Staff code required for editing enquiries.' });
  }
  
  const valid = await verifyAdminCode(created_by);
  console.log('Verification result:', valid);
  
  if (!valid) {
    return res.status(403).json({ message: 'Invalid admin/staff code.' });
  }

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone number are required." });
  }

  // Convert empty string to NULL for date fields
  const processedFollowUpDate = follow_up_date && follow_up_date.trim() !== '' ? follow_up_date : null;

  // Determine updater's name
  let updater = 'admin';
  const [adminRows] = await db.query('SELECT username FROM admin_settings WHERE admin_code = ?', [created_by]);
  if (adminRows.length > 0) {
    updater = adminRows[0].username;
  } else {
    const [staffRows] = await db.query('SELECT name FROM staff WHERE staff_code = ?', [created_by]);
    if (staffRows.length > 0) {
      updater = staffRows[0].name;
    }
  }

  try {
    const [result] = await db.query(
      "UPDATE enquiries SET name = ?, phone = ?, email = ?, source = ?, interest = ?, status = ?, follow_up_date = ?, notes = ?, updated_at = NOW(), updated_by = ? WHERE id = ?",
      [name, phone, email, source, interest, status, processedFollowUpDate, notes, updater, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Enquiry not found." });
    }
    
    // Log activity
    await logActivity(created_by, 'edit', 'enquiry', id, `Updated enquiry: ${name} (${phone})`);
    
    res.json({ message: "Enquiry updated successfully." });
  } catch (err) {
    console.error("Error updating enquiry:", err);
    res.status(500).json({ message: "Failed to update enquiry." });
  }
});

// DELETE an enquiry
router.delete("/:id", async (req, res) => {
  const { created_by } = req.body;
  if (!created_by) {
    return res.status(403).json({ message: 'Admin/Staff code required.' });
  }
  const valid = await verifyAdminCode(created_by);
  if (!valid) {
    return res.status(403).json({ message: 'Invalid admin/staff code.' });
  }
  const { id } = req.params;

  try {
    // Get enquiry details before deletion for logging
    const [enquiryRows] = await db.query("SELECT name, phone FROM enquiries WHERE id = ?", [id]);
    const enquiryName = enquiryRows.length > 0 ? enquiryRows[0].name : 'Unknown';
    const enquiryPhone = enquiryRows.length > 0 ? enquiryRows[0].phone : 'Unknown';
    
    const [result] = await db.query("DELETE FROM enquiries WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Enquiry not found." });
    }
    
    // Log activity
    await logActivity(created_by, 'delete', 'enquiry', id, `Deleted enquiry: ${enquiryName} (${enquiryPhone})`);
    
    res.json({ message: "Enquiry deleted successfully." });
  } catch (err) {
    console.error("Error deleting enquiry:", err);
    res.status(500).json({ message: "Failed to delete enquiry." });
  }
});

module.exports = router; 