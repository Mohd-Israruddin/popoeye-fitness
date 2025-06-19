require("dotenv").config(); // 🔑 Load environment variables

const express = require("express");
const router = express.Router();
const db = require("../db");
const axios = require("axios");

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
  } = req.body;

  const pending_amount = total_amount - paid_amount;

  const sql = `
    INSERT INTO members 
    (member_id, name, whatsapp, join_date, expiry_date, package, total_amount, paid_amount, pending_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
  ];

  try {
    const [result] = await db.query(sql, values);

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
  } = req.body;

  const pending_amount = total_amount - paid_amount;

  const sql = `
    UPDATE members SET 
      member_id = ?, name = ?, whatsapp = ?, 
      join_date = ?, expiry_date = ?, package = ?, 
      total_amount = ?, paid_amount = ?, pending_amount = ?
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
    req.params.id,
  ];

  try {
    await db.query(sql, values);
    res.json({ message: "✅ Member updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// DELETE - Delete a member
// ============================
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM members WHERE id = ?", [req.params.id]);
    res.json({ message: "🗑️ Member deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// POST - Delete multiple members
// ============================
router.post("/delete", async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No member IDs provided" });
  }

  const placeholders = ids.map(() => "?").join(",");
  const sql = `DELETE FROM members WHERE id IN (${placeholders})`;

  try {
    await db.query(sql, ids);
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

module.exports = router;
