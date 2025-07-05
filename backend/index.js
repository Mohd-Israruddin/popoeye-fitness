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
const settingsRoutes = require('./routes/settings');
const recurringRoutes = require('./routes/recurring-transactions');
const enquiryRoutes = require('./routes/enquiries');
const insightsRoutes = require('./routes/insights');
const adminRoutes = require('./routes/admin');
const loginRoutes = require('./routes/login');

// ✅ Use routes
app.use("/api/members", memberRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/login', loginRoutes);

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("Gym Backend Running...");
});

// ✅ Cron Job: Automatic Expiry Reminder SMS (7, 5, 3, 2, 1 days)
cron.schedule("0 10 * * *", async () => {
  const daysArray = [1, 2, 3, 5, 7];
  const today = new Date();

  for (const daysLeft of daysArray) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysLeft);
    const formattedDate = targetDate.toISOString().split("T")[0];

    try {
      const [results] = await db.execute("SELECT name, whatsapp, expiry_date FROM members WHERE expiry_date = ?", [formattedDate]);
      
      if (results.length === 0) continue;

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
    } catch (err) {
      console.error(`❌ Database error in expiry reminder cron:`, err.message);
    }
  }
});

// ✅ Cron Job: Process recurring transactions daily at 9 AM
cron.schedule("0 9 * * *", async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/recurring/process-due');
    console.log(`💰 Processed recurring transactions: ${response.data.message}`);
  } catch (error) {
    console.error('❌ Failed to process recurring transactions:', error.message);
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
