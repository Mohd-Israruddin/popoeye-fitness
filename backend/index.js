// index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require("node-cron");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Import DB connection
const db = require("./db");

// ✅ Routes
const memberRoutes = require("./routes/members");
const financeRoutes = require("./routes/finances");
const inventoryRoutes = require("./routes/inventory");
const staffRoutes = require("./routes/staff");
const scheduleRoutes = require("./routes/schedule");

// ✅ Use routes
app.use("/api/members", memberRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/schedule", scheduleRoutes);

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("Gym Backend Running...");
});

// ✅ Cron Job: Automatic Expiry Reminder SMS (7, 5, 3, 2, 1 days)
cron.schedule("0 10 * * *", () => {
  const daysArray = [1, 2, 3, 5, 7];
  const today = new Date();

  daysArray.forEach((daysLeft) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysLeft);
    const formattedDate = targetDate.toISOString().split("T")[0];

    const sql = "SELECT name, whatsapp, expiry_date FROM members WHERE expiry_date = ?";
    db.query(sql, [formattedDate], async (err, results) => {
      if (err || results.length === 0) return;

      for (const member of results) {
        try {
          await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            params: {
              authorization: process.env.FAST2SMS_API_KEY,
              sender_id: "FSTSMS",
              message: `Hi ${member.name}, your gym membership expires in ${daysLeft} day(s) on ${member.expiry_date}.`,
              language: "english",
              route: "q",
              numbers: member.whatsapp,
            },
          });
          console.log(`⏰ Reminder sent to ${member.name} (${daysLeft} days left)`);
        } catch (smsErr) {
          console.error(`❌ Reminder SMS failed for ${member.name}:`, smsErr.message);
        }
      }
    });
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
