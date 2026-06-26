const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM schedule");
    const bookings = {};
    results.forEach(row => {
      const date = new Date(row.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[date.getDay()];
      const time = row.time.slice(0, 5);
      const time12hr = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const key = `${day}-${time12hr}`;
      if (!bookings[key]) bookings[key] = [];
      bookings[key].push({
        id: row.id,
        member: row.member_name,
        category: row.category,
        trainer: row.trainer || "",
        phone: row.email || "",
      });
    });
    res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { day, time, member, category, trainer, phone, email } = req.body;
  const contactPhone = phone || email;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = days.indexOf(day);
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
  const time24hr = new Date(`2000-01-01 ${time}`).toTimeString().slice(0, 8);
  const sql = "INSERT INTO schedule (date, member_name, email, category, trainer, time) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [targetDate.toISOString().slice(0, 10), member, contactPhone || null, category, trainer, time24hr];
  try {
    const [result] = await db.query(sql, values);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { day, time, member, category, trainer, phone, email } = req.body;
  const contactPhone = phone || email;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = days.indexOf(day);
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
  const time24hr = new Date(`2000-01-01 ${time}`).toTimeString().slice(0, 8);

  try {
    const [oldBooking] = await db.query("SELECT * FROM schedule WHERE id = ?", [id]);
    if (oldBooking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const sql = "UPDATE schedule SET date = ?, member_name = ?, email = ?, category = ?, trainer = ?, time = ? WHERE id = ?";
    const values = [targetDate.toISOString().slice(0, 10), member, contactPhone || null, category, trainer, time24hr, id];
    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

async function verifyAdminPasskey(username, passkey) {
  const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
  const admin = rows[0];
  if (!admin) return false;
  const match = await bcrypt.compare(passkey, admin.passkey_hash);
  return match;
}

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [booking] = await db.query("SELECT * FROM schedule WHERE id = ?", [id]);
    if (booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const [result] = await db.query("DELETE FROM schedule WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting booking:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM schedule");
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    console.error('Error resetting schedule:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
