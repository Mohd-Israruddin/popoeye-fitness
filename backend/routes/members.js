require("dotenv").config(); // 🔑 Load environment variables

const express = require("express");
const multer = require("multer");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const { sendWelcomeMessage, sendExpiryReminderMessage, shouldSendExpiryReminder } = require("../services/whatsappService");
const {
  generateMemberInvoicePdf,
} = require('../services/invoiceService');
const {
  isConfigured,
  uploadMemberPhoto,
  deleteImage,
  getPublicIdFromUrl,
} = require("../services/cloudinaryService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

(async () => {
  try {
    await db.query(
      `ALTER TABLE members ADD COLUMN personal_training ENUM('Yes', 'No') NOT NULL DEFAULT 'No'`
    );
    console.log('✅ Added personal_training column to members');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.error('❌ personal_training migration:', err.message);
    }
  }
})();

// ============================
// POST - Upload member photo to Cloudinary
// ============================
router.post("/photo/upload", upload.single("photo"), async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Cloudinary is not configured on the server." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No photo file provided." });
  }

  try {
    const memberId = req.body.member_id || null;
    const result = await uploadMemberPhoto(req.file.buffer, memberId);
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("❌ Photo upload failed:", err);
    res.status(500).json({ error: err.message || "Failed to upload photo." });
  }
});

async function getNextMemberId() {
  const [rows] = await db.query(
    `SELECT MAX(CAST(member_id AS UNSIGNED)) AS max_id FROM members WHERE member_id REGEXP '^[0-9]+$'`
  );
  const nextNum = (rows[0]?.max_id || 0) + 1;
  return String(nextNum).padStart(4, '0');
}

// ============================
// GET next member ID
// ============================
router.get("/next-id", async (req, res) => {
  try {
    const member_id = await getNextMemberId();
    res.json({ member_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
  const member_id = await getNextMemberId();
  const {
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
    photo,
    personal_training,
    created_by,
  } = req.body;

  const pending_amount = total_amount - paid_amount;
  const ptValue = personal_training === 'Yes' ? 'Yes' : 'No';

  const sql = `
    INSERT INTO members 
    (member_id, name, photo, email, phone, join_date, expiry_date, package, total_amount, paid_amount, pending_amount, height, weight, chest, waist, hips, biceps, thighs, address, health_issues, blood_group, extra_details, personal_training)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    member_id,
    name,
    photo || null,
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
    ptValue,
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

    // ✅ Send Welcome WhatsApp (if phone is provided)
    if (phone) {
      try {
        await sendWelcomeMessage({
          id: result.insertId,
          name,
          phone,
          member_id,
          package,
          join_date,
          expiry_date,
          total_amount,
          paid_amount,
        });
        console.log("✅ Welcome WhatsApp sent to", phone);
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
    photo,
    personal_training,
    created_by,
    admin_code,
    staff_code
  } = req.body;

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

  const pending_amount = total_amount - paid_amount;
  const ptValue = personal_training === 'Yes' ? 'Yes' : 'No';

  const sql = `
    UPDATE members SET 
      member_id = ?, name = ?, photo = ?, email = ?, phone = ?, 
      join_date = ?, expiry_date = ?, package = ?, 
      total_amount = ?, paid_amount = ?, pending_amount = ?,
      height = ?, weight = ?, chest = ?, waist = ?, hips = ?, biceps = ?, thighs = ?,
      address = ?, health_issues = ?, blood_group = ?, extra_details = ?, personal_training = ?,
      updated_at = NOW()
    WHERE id = ?
  `;
  const values = [
    member_id,
    name,
    photo || null,
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
    ptValue,
    req.params.id,
  ];

  try {
    // Get the old member data to check if payment amount changed
    const [oldMemberRows] = await db.query('SELECT paid_amount, total_amount, email, member_id, photo FROM members WHERE id = ?', [req.params.id]);
    const oldMember = oldMemberRows[0];
    
    await db.query(sql, values);

    if (photo && oldMember.photo && photo !== oldMember.photo) {
      const oldPublicId = getPublicIdFromUrl(oldMember.photo);
      if (oldPublicId) await deleteImage(oldPublicId);
    }
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
// POST - Manual Welcome WhatsApp
// ============================
router.post("/send-welcome/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT name, phone, package, expiry_date, member_id, join_date, total_amount, paid_amount FROM members WHERE id = ?",
      [req.params.id]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });

    const memberData = { ...results[0], id: req.params.id };

    if (!memberData.phone) {
      return res.status(400).json({ error: "Member has no phone number" });
    }

    const result = await sendWelcomeMessage(memberData);
    
    if (result.success) {
      res.json({ message: "✅ Welcome WhatsApp sent." });
    } else {
      res.status(500).json({ error: "WhatsApp failed", detail: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "WhatsApp failed", detail: err.message });
  }
});

// ============================
// POST - Manual Expiry Reminder WhatsApp
// ============================
router.post("/send-reminder/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT name, phone, expiry_date, package FROM members WHERE id = ?",
      [req.params.id]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });

    const { name, phone, expiry_date, package } = results[0];
    
    if (!phone) {
      return res.status(400).json({ error: "Member has no phone number" });
    }

    if (!shouldSendExpiryReminder(package)) {
      return res.status(400).json({
        error: "Expiry reminders are not sent for 1 day or 1 week packages",
      });
    }

    const daysLeft = Math.ceil(
      (new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const result = await sendExpiryReminderMessage({ name, phone, expiry_date }, daysLeft);
    
    if (result.success) {
      res.json({ message: "✅ Reminder WhatsApp sent." });
    } else {
      res.status(500).json({ error: "Reminder WhatsApp failed", detail: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "Reminder WhatsApp failed", detail: err.message });
  }
});

// ============================
// GET - Bulk Expiry Reminder WhatsApp
// ============================
router.get("/send-expiry-reminders", async (req, res) => {
  const sql = `
    SELECT id, name, phone, expiry_date, package FROM members
    WHERE DATEDIFF(expiry_date, CURDATE()) IN (7, 3, 1)
    AND phone IS NOT NULL AND phone != ''
    AND LOWER(TRIM(package)) NOT IN ('1 day', '1 week')
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
        const result = await sendExpiryReminderMessage(
          { name: m.name, phone: m.phone, expiry_date: m.expiry_date, package: m.package },
          daysLeft
        );
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

// ============================
// GET - Member invoice PDF (public link for WhatsApp)
router.get('/:id/invoice', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    generateMemberInvoicePdf(rows[0], res);
  } catch (err) {
    console.error('❌ Invoice PDF error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
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

// Endpoint to get members enrolled in personal training
router.get('/personal-training', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, member_id, phone, package, join_date, expiry_date, personal_training
      FROM members
      WHERE personal_training = 'Yes'
      ORDER BY name ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personal training members', details: error.message });
  }
});

// Endpoint to get members with pending/due payments
router.get('/due-payments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, member_id, total_amount, paid_amount,
        (total_amount - paid_amount) AS pending_amount
      FROM members
      WHERE (total_amount - paid_amount) > 0
      ORDER BY (total_amount - paid_amount) DESC, name ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch due payments', details: error.message });
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
