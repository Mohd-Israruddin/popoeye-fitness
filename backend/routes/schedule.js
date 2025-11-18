const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const { sendScheduleBookingMessage, sendScheduleUpdateMessage, sendScheduleCancellationMessage } = require("../services/whatsappService");

// GET all bookings, grouped as { "Mon-6:00 AM": [...] }
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM schedule");
    const bookings = {};
    results.forEach(row => {
      // Convert date to day name and time to readable format
      const date = new Date(row.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[date.getDay()];
      const time = row.time.slice(0, 5); // "14:00:00" to "14:00"
      const time12hr = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const key = `${day}-${time12hr}`;
      if (!bookings[key]) bookings[key] = [];
      bookings[key].push({
        id: row.id,
        member: row.member_name,
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
  const { day, time, member, category, trainer, email } = req.body;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = days.indexOf(day);
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
  const time24hr = new Date(`2000-01-01 ${time}`).toTimeString().slice(0, 8);
  const sql = "INSERT INTO schedule (date, member_name, email, category, trainer, time) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [targetDate.toISOString().slice(0, 10), member, email, category, trainer, time24hr];
  try {
    const [result] = await db.query(sql, values);
    
    // Send booking confirmation WhatsApp message if phone is available
    // Look up phone number from members table
    try {
      const [memberRows] = await db.query("SELECT phone FROM members WHERE name = ? LIMIT 1", [member]);
      if (memberRows.length > 0 && memberRows[0].phone) {
        const bookingData = {
          member_name: member,
          phone: memberRows[0].phone,
          category: category,
          date: targetDate.toISOString().slice(0, 10),
          time: time,
          trainer: trainer
        };
        
        try {
          await sendScheduleBookingMessage(bookingData);
        } catch (whatsappError) {
          console.error('Failed to send booking WhatsApp message:', whatsappError);
          // Don't fail the booking if WhatsApp fails
        }
      }
    } catch (lookupError) {
      console.error('Failed to lookup member phone:', lookupError);
      // Don't fail the booking if lookup fails
    }
    
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT update a booking
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { day, time, member, category, trainer, email } = req.body;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = days.indexOf(day);
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
  const time24hr = new Date(`2000-01-01 ${time}`).toTimeString().slice(0, 8);
  
  try {
    // Get the old booking data for comparison
    const [oldBooking] = await db.query("SELECT * FROM schedule WHERE id = ?", [id]);
    if (oldBooking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const sql = "UPDATE schedule SET date = ?, member_name = ?, email = ?, category = ?, trainer = ?, time = ? WHERE id = ?";
    const values = [targetDate.toISOString().slice(0, 10), member, email, category, trainer, time24hr, id];
    const [result] = await db.query(sql, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Send update WhatsApp message if phone is available and booking was changed
    try {
      const [memberRows] = await db.query("SELECT phone FROM members WHERE name = ? LIMIT 1", [member]);
      if (memberRows.length > 0 && memberRows[0].phone) {
        const oldData = oldBooking[0];
        const changes = [];
        
        if (oldData.member_name !== member) changes.push(`Member: ${oldData.member_name} → ${member}`);
        if (oldData.category !== category) changes.push(`Class: ${oldData.category} → ${category}`);
        if (oldData.trainer !== trainer) changes.push(`Trainer: ${oldData.trainer || 'TBA'} → ${trainer || 'TBA'}`);
        if (oldData.date !== targetDate.toISOString().slice(0, 10)) changes.push(`Date: ${oldData.date} → ${targetDate.toISOString().slice(0, 10)}`);
        if (oldData.time !== time24hr) changes.push(`Time: ${oldData.time} → ${time24hr}`);
        
        if (changes.length > 0) {
          const bookingData = {
            member_name: member,
            phone: memberRows[0].phone,
            category: category,
            date: targetDate.toISOString().slice(0, 10),
            time: time,
            trainer: trainer
          };
          
          try {
            await sendScheduleUpdateMessage(bookingData, changes.join(', '));
          } catch (whatsappError) {
            console.error('Failed to send update WhatsApp message:', whatsappError);
            // Don't fail the update if WhatsApp fails
          }
        }
      }
    } catch (lookupError) {
      console.error('Failed to lookup member phone:', lookupError);
      // Don't fail the update if lookup fails
    }
    
    res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

// DELETE individual booking
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get booking data before deletion for WhatsApp notification
    const [booking] = await db.query("SELECT * FROM schedule WHERE id = ?", [id]);
    if (booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const [result] = await db.query("DELETE FROM schedule WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Send cancellation WhatsApp message if phone is available
    try {
      const [memberRows] = await db.query("SELECT phone FROM members WHERE name = ? LIMIT 1", [booking[0].member_name]);
      if (memberRows.length > 0 && memberRows[0].phone) {
        const bookingData = {
          member_name: booking[0].member_name,
          phone: memberRows[0].phone,
          category: booking[0].category,
          date: booking[0].date,
          time: booking[0].time,
          trainer: booking[0].trainer
        };
        
        try {
          await sendScheduleCancellationMessage(bookingData);
        } catch (whatsappError) {
          console.error('Failed to send cancellation WhatsApp message:', whatsappError);
          // Don't fail the deletion if WhatsApp fails
        }
      }
    } catch (lookupError) {
      console.error('Failed to lookup member phone:', lookupError);
      // Don't fail the deletion if lookup fails
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting booking:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE all bookings (reset schedule)
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
