require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../db");
const { createBiometricService } = require("../services/biometricService");
const { getPushService } = require("../services/pushService");

/* ============================
   DEVICES
============================ */

// Get all devices
router.get("/devices", async (req, res) => {
  try {
    const [devices] = await db.query(
      "SELECT * FROM biometric_devices ORDER BY created_at DESC"
    );
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add device
router.post("/devices", async (req, res) => {
  const { name, ip_address, server_domain, port = 4370 } = req.body;

  if (!name || (!ip_address && !server_domain)) {
    return res.status(400).json({ error: "Name and IP or Domain required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO biometric_devices (name, ip_address, server_domain, port)
       VALUES (?, ?, ?, ?)`,
      [name, ip_address || null, server_domain || null, port]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Test device connection (PULL – TCP 4370)
router.post("/devices/:id/test", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM biometric_devices WHERE id = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Device not found" });
    }

    const device = rows[0];

    const biometricService = createBiometricService(
      device.ip_address,
      device.port
    );

    const result = await biometricService.testConnection();

    // ✅ Mark device active if reachable
    if (result.success) {
      await db.query(
        `UPDATE biometric_devices
         SET status = 'active', last_sync = NOW()
         WHERE id = ?`,
        [device.id]
      );
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Test connection error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   ATTENDANCE LOGS
============================ */

// Get attendance logs
router.get("/attendance", async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT al.*, m.name AS member_name
       FROM attendance_logs al
       LEFT JOIN members m ON al.member_id = m.id
       ORDER BY al.check_time DESC
       LIMIT 100`
    );

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   ATTENDANCE STATS (FIXED)
============================ */

router.get("/attendance/stats", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (start_date) {
      whereClause += " AND DATE(check_time) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      whereClause += " AND DATE(check_time) <= ?";
      params.push(end_date);
    }

    const [[checkIns]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM attendance_logs
       ${whereClause} AND check_type = 'check_in'`,
      params
    );

    const [[checkOuts]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM attendance_logs
       ${whereClause} AND check_type = 'check_out'`,
      params
    );

    const [[uniqueMembers]] = await db.query(
      `SELECT COUNT(DISTINCT member_id) AS count
       FROM attendance_logs
       ${whereClause} AND member_id IS NOT NULL`,
      params
    );

    const [checkInsByDay] = await db.query(
      `SELECT DATE(check_time) AS date, COUNT(*) AS count
       FROM attendance_logs
       ${whereClause} AND check_type = 'check_in'
       GROUP BY DATE(check_time)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    res.json({
      totalCheckIns: checkIns?.count || 0,
      totalCheckOuts: checkOuts?.count || 0,
      uniqueMembers: uniqueMembers?.count || 0,
      checkInsByDay
    });
  } catch (err) {
    console.error("❌ Attendance stats error:", err);
    res.status(500).json({ error: "Failed to load attendance statistics" });
  }
});

/* ============================
   PUSH SERVICE (OPTIONAL)
============================ */

router.get("/push-service/status", (req, res) => {
  const pushService = getPushService();
  res.json(pushService.getStatus());
});

router.post("/push-service/start", async (req, res) => {
  try {
    const pushService = getPushService();
    await pushService.start();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/push-service/stop", async (req, res) => {
  try {
    const pushService = getPushService();
    await pushService.stop();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
