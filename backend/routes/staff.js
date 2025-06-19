const express = require("express");
const router = express.Router();
const db = require("../db"); // assumes db is set up with mysql2/promise

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
  const { name, role, phone, email, address, photo } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO staff (name, role, phone, email, address, photo) VALUES (?, ?, ?, ?, ?, ?)",
      [name, role, phone, email, address, photo]
    );
    const [newStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [result.insertId]);
    res.status(201).json(newStaff[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add staff", details: err.message });
  }
});

// PUT update existing staff
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, phone, email, address, photo } = req.body;
  try {
    await db.query(
      "UPDATE staff SET name = ?, role = ?, phone = ?, email = ?, address = ?, photo = ? WHERE id = ?",
      [name, role, phone, email, address, photo, id]
    );
    const [updatedStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
    res.json(updatedStaff[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update staff", details: err.message });
  }
});

// DELETE staff
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM staff WHERE id = ?", [id]);
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete staff", details: err.message });
  }
});

module.exports = router;
