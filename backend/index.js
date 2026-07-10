// index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require("node-cron");
const axios = require("axios");
const { sendExpiryReminderMessage } = require("./services/whatsappService");
const { getPushService } = require("./services/pushService");

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
const biometricRoutes = require('./routes/biometric');

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
app.use('/api/biometric', biometricRoutes);

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("Gym Backend Running...");
});

// ✅ Cron Job: Automatic Expiry Reminder WhatsApp (7, 3, 1 days)
cron.schedule("0 10 * * *", async () => {
  const daysArray = [1, 3, 7];
  const today = new Date();

  for (const daysLeft of daysArray) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysLeft);
    const formattedDate = targetDate.toISOString().split("T")[0];

    try {
      const [results] = await db.execute(
        `SELECT name, phone, expiry_date, package FROM members
         WHERE expiry_date = ? AND phone IS NOT NULL AND phone != ''
         AND LOWER(TRIM(package)) NOT IN ('1 day', '1 week')`,
        [formattedDate]
      );
      
      if (results.length === 0) continue;

      for (const member of results) {
        try {
          const whatsappResult = await sendExpiryReminderMessage(
            {
              name: member.name,
              phone: member.phone,
              expiry_date: member.expiry_date,
              package: member.package,
            },
            daysLeft
          );
          if (whatsappResult.success) {
            console.log(`📱 Reminder WhatsApp sent to ${member.name} (${daysLeft} days left)`);
          } else {
            console.error(`❌ Reminder WhatsApp failed for ${member.name}:`, whatsappResult.error);
          }
        } catch (whatsappErr) {
          console.error(`❌ Reminder WhatsApp failed for ${member.name}:`, whatsappErr.message);
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
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const response = await axios.post(`${serverUrl}/api/recurring/process-due`);
    console.log(`💰 Processed recurring transactions: ${response.data.message}`);
  } catch (error) {
    console.error('❌ Failed to process recurring transactions:', error.message);
  }
});

// ✅ Start Push Service for biometric devices (port 8081)
const PUSH_SERVICE_PORT = process.env.PUSH_SERVICE_PORT || 8081;
const pushService = getPushService(PUSH_SERVICE_PORT);

pushService.start()
  .then(() => {
    console.log(`✅ Biometric Push Service started on port ${PUSH_SERVICE_PORT}`);
  })
  .catch((err) => {
    console.error(`❌ Failed to start Push Service:`, err.message);
    console.log(`⚠️  Push Service will not be available. You can use PULL method instead.`);
  });

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
