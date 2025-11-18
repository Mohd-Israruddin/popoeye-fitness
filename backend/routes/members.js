require("dotenv").config(); // 🔑 Load environment variables

const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const { sendWelcomeMessage, sendExpiryReminderMessage, sendPaymentConfirmationMessage } = require("../services/whatsappService");

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
// POST - Add a new member + welcome email
// ============================
router.post("/", async (req, res) => {
  const {
    member_id,
    name,
    email,
    phone,
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
    (member_id, name, email, phone, join_date, expiry_date, package, total_amount, paid_amount, pending_amount, height, weight, chest, waist, hips, biceps, thighs, address, health_issues, blood_group, extra_details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    member_id,
    name,
    email,
    phone,
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

    // ✅ Send Welcome WhatsApp Message
    if (phone) {
      try {
        await sendWelcomeMessage({
          name,
          phone,
          member_id,
          package,
          join_date,
          expiry_date,
          total_amount,
          paid_amount
        });
        console.log("✅ Welcome WhatsApp message sent to", phone);
      } catch (whatsappErr) {
        console.error("❌ WhatsApp failed:", whatsappErr.message);
      }
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
    email,
    phone,
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
      member_id = ?, name = ?, email = ?, phone = ?, 
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
    email,
    phone,
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
    // Get the old member data to check if payment amount changed
    const [oldMemberRows] = await db.query('SELECT paid_amount, total_amount, email, member_id FROM members WHERE id = ?', [req.params.id]);
    const oldMember = oldMemberRows[0];
    
    await db.query(sql, values);
    await logActivity(created_by, 'edit', 'member', req.params.id, `Edited member: ${name}`);
    
    // Send payment confirmation email and create finance transaction if paid_amount increased
    if (paid_amount > oldMember.paid_amount) {
      const paymentAmount = paid_amount - oldMember.paid_amount;
      
      // Create finance transaction for the payment
      try {
        const financeSql = `
          INSERT INTO finances (date, type, amount, category, payment, description, created_by)
          VALUES (NOW(), 'income', ?, 'Membership', 'Cash', ?, ?)
        `;
        const financeValues = [
          paymentAmount,
          `Membership payment for ${name} (${member_id}) - Payment: ₹${paymentAmount}, Total Paid: ₹${paid_amount}`,
          created_by || 'admin'
        ];
        
        await db.query(financeSql, financeValues);
        console.log(`✅ Finance transaction created for payment: ₹${paymentAmount} from ${name}`);
      } catch (financeError) {
        console.error('Failed to create finance transaction:', financeError);
        // Don't fail the update if finance transaction fails
      }
      
      // Send payment confirmation WhatsApp message if phone exists
      if (phone) {
        const paymentData = {
          name: name,
          phone: phone,
          member_id: member_id,
          payment_amount: paymentAmount,
          payment_date: new Date().toISOString(),
          payment_method: 'Cash', // Default, can be made configurable
          previous_due: oldMember.total_amount - oldMember.paid_amount,
          remaining_due: total_amount - paid_amount,
          total_amount: total_amount,
          total_paid: paid_amount
        };
        
        try {
          await sendPaymentConfirmationMessage(paymentData);
          console.log(`✅ Payment confirmation WhatsApp message sent to ${name} (${phone})`);
        } catch (whatsappError) {
          console.error('Failed to send payment confirmation WhatsApp message:', whatsappError);
          // Don't fail the update if WhatsApp fails
        }
      }
    }
    
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
// POST - Manual Welcome WhatsApp Message
// ============================
router.post("/send-welcome/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT name, phone, package, expiry_date, member_id, join_date, total_amount, paid_amount FROM members WHERE id = ?",
      [req.params.id]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });

    const memberData = results[0];

    if (!memberData.phone) {
      return res.status(400).json({ error: "Member has no phone number" });
    }

    const result = await sendWelcomeMessage(memberData);
    
    if (result.success) {
      res.json({ message: "✅ Welcome WhatsApp message sent manually." });
    } else {
      res.status(500).json({ error: "WhatsApp failed", detail: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "WhatsApp failed", detail: err.message });
  }
});

// ============================
// POST - Manual Expiry Reminder
// ============================
router.post("/send-reminder/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT name, phone, expiry_date FROM members WHERE id = ?",
      [req.params.id]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });

    const { name, phone, expiry_date } = results[0];
    
    if (!phone) {
      return res.status(400).json({ error: "Member has no phone number" });
    }

    const daysLeft = Math.ceil(
      (new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const result = await sendExpiryReminderMessage({ name, phone, expiry_date }, daysLeft);
    
    if (result.success) {
      res.json({ message: "✅ Reminder WhatsApp message sent manually." });
    } else {
      res.status(500).json({ error: "Reminder WhatsApp failed", detail: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "Reminder WhatsApp failed", detail: err.message });
  }
});

// ============================
// GET - Bulk Expiry Reminder
// ============================
router.get("/send-expiry-reminders", async (req, res) => {
  const sql = `
    SELECT id, name, phone, expiry_date FROM members
    WHERE DATEDIFF(expiry_date, CURDATE()) IN (7, 5, 3, 2, 1)
    AND phone IS NOT NULL AND phone != ''
  `;

  try {
    const [members] = await db.query(sql);
    if (members.length === 0)
      return res.json({ message: "No expiring members with phone numbers found." });

    let sent = 0;

    for (const m of members) {
      const daysLeft = Math.ceil(
        (new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      try {
        const result = await sendExpiryReminderMessage({ name: m.name, phone: m.phone, expiry_date: m.expiry_date }, daysLeft);
        if (result.success) {
          sent++;
        }
      } catch (e) {
        console.error(`❌ Failed to send WhatsApp to ${m.name}:`, e.message);
      }
    }

    res.json({ message: `✅ Sent ${sent} reminder WhatsApp message(s)` });
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
