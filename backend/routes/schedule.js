const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all bookings, grouped as { "Mon-6:00 AM": [...] }
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM schedule");
    const bookings = {};
    results.forEach(row => {
      const key = `${row.day}-${row.time}`;
      if (!bookings[key]) bookings[key] = [];
      bookings[key].push({
        member: row.member,
        category: row.category,
        trainer: row.trainer || "",
      });
    });
    res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST a new booking
router.post("/", async (req, res) => {
  console.log("Received body:", req.body); // Debug log
  const { day, time, member, category, trainer } = req.body;
  const sql = "INSERT INTO schedule (day, time, member, category, trainer) VALUES (?, ?, ?, ?, ?)";
  const values = [day, time, member, category, trainer];
  try {
    const [result] = await db.query(sql, values);
    console.log("Insert result:", result); // Log insert result
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Insert error:", err); // Log insert error
    return res.status(500).json({ error: err.message });
  }
});

// DELETE all bookings (reset schedule)
router.delete("/", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM schedule");
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
