require("dotenv").config(); // 🔑 Load environment variables

const express = require("express");
const router = express.Router();
const db = require("../db");
const axios = require("axios");
const bcrypt = require("bcryptjs");

// ============================
// GET all members
// ============================
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM members");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// POST - Add a new member + welcome SMS
// ============================
router.post("/", async (req, res) => {
  const {
    member_id,
    name,
    whatsapp,
    join_date,
    expiry_date,
    package,
    total_amount,
    paid_amount,
    height,
    weight,
    chest,
    waist,
    hips,
    biceps,
    thighs,
    address,
    health_issues,
    blood_group,
    extra_details,
    created_by,
  } = req.body;

  const pending_amount = total_amount - paid_amount;

  const sql = `
    INSERT INTO members 
    (member_id, name, whatsapp, join_date, expiry_date, package, total_amount, paid_amount, pending_amount, height, weight, chest, waist, hips, biceps, thighs, address, health_issues, blood_group, extra_details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    member_id,
    name,
    whatsapp,
    join_date,
    expiry_date,
    package,
    total_amount,
    paid_amount,
    pending_amount,
    height,
    weight,
    chest,
    waist,
    hips,
    biceps,
    thighs,
    address,
    health_issues,
    blood_group,
    extra_details,
  ];

  try {
    const [result] = await db.query(sql, values);

    // ✅ Record finance transaction for membership payment
    let financeDate = join_date;
    if (!financeDate) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      today.setMinutes(today.getMinutes() - offset);
      financeDate = today.toISOString().slice(0, 10);
    }
    if (paid_amount && paid_amount > 0) {
      await db.query(
        `INSERT INTO finances (date, type, amount, category, payment, description)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          financeDate,
          "income",
          paid_amount,
          "Membership",
          "Cash",
          `Membership payment for ${name}`
        ]
      );
    }

    // ✅ Send Welcome SMS
    try {
      await axios.get("https://www.fast2sms.com/dev/bulkV2", {
        params: {
          authorization: process.env.FAST2SMS_API_KEY,
          sender_id: "FSTSMS",
          message: `Hi ${name}, welcome to the gym! Package: ${package}. Valid till ${expiry_date}.`,
          language: "english",
          route: "q",
          numbers: whatsapp,
        },
      });
      console.log("✅ Welcome SMS sent to", whatsapp);
    } catch (smsErr) {
      console.error("❌ SMS failed:", smsErr.message);
    }

    await logActivity(created_by, 'add', 'member', result.insertId, `Added member: ${name}`);

    res.json({ message: "✅ Member added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error inserting member:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// PUT - Update a member
// ============================
router.put("/:id", async (req, res) => {
  const {
    member_id,
    name,
    whatsapp,
    join_date,
    expiry_date,
    package,
    total_amount,
    paid_amount,
    height,
    weight,
    chest,
    waist,
    hips,
    biceps,
    thighs,
    address,
    health_issues,
    blood_group,
    extra_details,
    created_by,
    admin_code
  } = req.body;

  // Require admin_code for edit
  if (!admin_code) {
    return res.status(403).json({ message: 'Admin ID required.' });
  }
  const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [admin_code]);
  if (adminRows.length === 0) {
    return res.status(403).json({ message: 'Invalid admin ID.' });
  }

  const pending_amount = total_amount - paid_amount;

  const sql = `
    UPDATE members SET 
      member_id = ?, name = ?, whatsapp = ?, 
      join_date = ?, expiry_date = ?, package = ?, 
      total_amount = ?, paid_amount = ?, pending_amount = ?,
      height = ?, weight = ?, chest = ?, waist = ?, hips = ?, biceps = ?, thighs = ?,
      address = ?, health_issues = ?, blood_group = ?, extra_details = ?,
      updated_at = NOW()
    WHERE id = ?
  `;
  const values = [
    member_id,
    name,
    whatsapp,
    join_date,
    expiry_date,
    package,
    total_amount,
    paid_amount,
    pending_amount,
    height,
    weight,
    chest,
    waist,
    hips,
    biceps,
    thighs,
    address,
    health_issues,
    blood_group,
    extra_details,
    req.params.id,
  ];

  try {
    await db.query(sql, values);
    await logActivity(created_by, 'edit', 'member', req.params.id, `Edited member: ${name}`);
    res.json({ message: "✅ Member updated" });
  } catch (err) {
    console.error("❌ Error updating member:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// PUT - Update body measurements only
// ============================
router.put("/:id/measurements", async (req, res) => {
  const {
    height,
    weight,
    chest,
    waist,
    hips,
    biceps,
    thighs
  } = req.body;

  try {
    // Check if member exists
    const [memberCheck] = await db.query('SELECT id, name FROM members WHERE id = ?', [req.params.id]);
    if (memberCheck.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    const sql = `
      UPDATE members SET 
        height = ?, weight = ?, chest = ?, waist = ?, hips = ?, biceps = ?, thighs = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const values = [
      height || null,
      weight || null,
      chest || null,
      waist || null,
      hips || null,
      biceps || null,
      thighs || null,
      req.params.id,
    ];

    await db.query(sql, values);
    res.json({ message: "✅ Body measurements updated" });
  } catch (err) {
    console.error("❌ Error updating body measurements:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// DELETE - Delete a member
// ============================
router.delete('/:id', async (req, res) => {
  const { admin_code, staff_code, created_by } = req.body || {};
  console.log('DELETE /members/:id body:', req.body);
  let valid = false;
  if (admin_code) {
    const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [admin_code]);
    if (adminRows.length > 0) valid = true;
  }
  if (staff_code) {
    const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [staff_code]);
    if (staffRows.length > 0) valid = true;
  }
  if (!valid) {
    return res.status(403).json({ message: 'Valid admin or staff ID required.' });
  }
  try {
    await db.query('DELETE FROM members WHERE id = ?', [req.params.id]);
    await logActivity(created_by, 'delete', 'member', req.params.id, `Deleted member with id: ${req.params.id}`);
    res.json({ message: '🗑️ Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// POST - Delete multiple members
// ============================
router.post('/delete', async (req, res) => {
  const { ids, admin_code, staff_code } = req.body || {};
  console.log('POST /members/delete body:', req.body);
  let valid = false;
  if (admin_code) {
    const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [admin_code]);
    if (adminRows.length > 0) valid = true;
  }
  if (staff_code) {
    const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [staff_code]);
    if (staffRows.length > 0) valid = true;
  }
  if (!valid) {
    return res.status(403).json({ message: 'Valid admin or staff ID required.' });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No member IDs provided' });
  }
  const placeholders = ids.map(() => '?').join(',');
  const sql = `DELETE FROM members WHERE id IN (${placeholders})`;
  try {
    await db.query(sql, ids);
    // Log each deletion
    for (const memberId of ids) {
      await logActivity(admin_code || staff_code, 'delete', 'member', memberId, `Deleted member with id: ${memberId}`);
    }
    res.json({ message: `🗑️ Deleted ${ids.length} member(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// POST - Manual Welcome SMS
// ============================
router.post("/send-welcome/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT name, whatsapp, package, expiry_date FROM members WHERE id = ?",
      [req.params.id]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });

    const { name, whatsapp, package, expiry_date } = results[0];

    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        sender_id: "FSTSMS",
        message: `Hi ${name}, welcome to the gym! Package: ${package}. Valid till ${expiry_date}.`,
        language: "english",
        route: "q",
        numbers: whatsapp,
      },
    });

    res.json({ message: "✅ Welcome SMS sent manually." });
  } catch (err) {
    res.status(500).json({ error: "SMS failed", detail: err.message });
  }
});

// ============================
// POST - Manual Expiry Reminder
// ============================
router.post("/send-reminder/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT name, whatsapp, expiry_date FROM members WHERE id = ?",
      [req.params.id]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });

    const { name, whatsapp, expiry_date } = results[0];
    const daysLeft = Math.ceil(
      (new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        sender_id: "FSTSMS",
        message: `Reminder: Hi ${name}, your gym membership expires in ${daysLeft} day(s) on ${expiry_date}.`,
        language: "english",
        route: "q",
        numbers: whatsapp,
      },
    });

    res.json({ message: "✅ Reminder SMS sent manually." });
  } catch (err) {
    res.status(500).json({ error: "Reminder SMS failed", detail: err.message });
  }
});

// ============================
// GET - Bulk Expiry Reminder
// ============================
router.get("/send-expiry-reminders", async (req, res) => {
  const sql = `
    SELECT id, name, whatsapp, expiry_date FROM members
    WHERE DATEDIFF(expiry_date, CURDATE()) IN (7, 5, 3, 2, 1)
  `;

  try {
    const [members] = await db.query(sql);
    if (members.length === 0)
      return res.json({ message: "No expiring members found." });

    let sent = 0;

    for (const m of members) {
      const daysLeft = Math.ceil(
        (new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            authorization: process.env.FAST2SMS_API_KEY,
            sender_id: "FSTSMS",
            message: `Reminder: Hi ${m.name}, your gym membership expires in ${daysLeft} day(s) on ${m.expiry_date}.`,
            language: "english",
            route: "q",
            numbers: m.whatsapp,
          },
        });
        sent++;
      } catch (e) {
        console.error(`❌ Failed to send SMS to ${m.name}:`, e.message);
      }
    }

    res.json({ message: `✅ Sent ${sent} reminder(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get members whose expiry_date is within the next 7 days
router.get('/expiring-soon', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, expiry_date 
      FROM members 
      WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY expiry_date ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expiring members', details: error.message });
  }
});

// ============================
// GET - Payment history for a member
// ============================
router.get('/:id/payments', async (req, res) => {
  const memberId = req.params.id;
  try {
    // Get the member's name
    const [memberRows] = await db.query('SELECT name FROM members WHERE id = ?', [memberId]);
    if (memberRows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const memberName = memberRows[0].name;
    // Find all finance records for this member (category 'Membership' and description contains name)
    const [payments] = await db.query(
      `SELECT * FROM finances WHERE category = 'Membership' AND description LIKE ? ORDER BY date ASC`,
      [`%${memberName}%`]
    );
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// POST - Delete a single member (for frontend POST-based deletion)
// ============================
router.post('/delete-one', async (req, res) => {
  const { id, admin_code, staff_code } = req.body || {};
  console.log('POST /members/delete-one body:', req.body);
  let valid = false;
  if (admin_code) {
    const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [admin_code]);
    if (adminRows.length > 0) valid = true;
  }
  if (staff_code) {
    const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [staff_code]);
    if (staffRows.length > 0) valid = true;
  }
  if (!valid) {
    return res.status(403).json({ message: 'Valid admin or staff ID required.' });
  }
  if (!id) {
    return res.status(400).json({ error: 'No member ID provided' });
  }
  try {
    await db.query('DELETE FROM members WHERE id = ?', [id]);
    await logActivity(admin_code || staff_code, 'delete', 'member', id, `Deleted member with id: ${id}`);
    res.json({ message: '🗑️ Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to verify admin passkey
async function verifyAdminPasskey(username, passkey) {
  const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
  const admin = rows[0];
  if (!admin) return false;
  const match = await bcrypt.compare(passkey, admin.passkey_hash);
  return match;
}

// Helper to log activity
async function logActivity(created_by, action, target_type, target_id, details) {
  if (!created_by) return;
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
    // Optionally log or warn: could not find staff or admin for created_by
    console.warn('Could not log activity: created_by not found in staff or admin_settings');
  }
}

module.exports = router;
