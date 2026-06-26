# Biometric Integration - Complete Setup Steps

## 🎯 Overview

Your eSSL biometric device can integrate in **TWO ways**:
1. **PUSH Method** (Recommended) - Device pushes data to your server automatically
2. **PULL Method** - Server pulls data from device periodically

---

## 📋 Step-by-Step Setup Guide

### Step 1: Database Setup ✅

Run the SQL script to create necessary tables:

```bash
# Windows (PowerShell)
mysql -u your_username -p gym_db < backend\db\create-biometric-tables.sql

# Linux/Mac
mysql -u your_username -p gym_db < backend/db/create-biometric-tables.sql
```

Or manually execute the SQL file in MySQL Workbench/phpMyAdmin.

**Expected Result:** Three new tables created:
- `biometric_devices`
- `member_biometric_ids`
- `attendance_logs`

---

### Step 2: Choose Integration Method

#### Option A: PUSH Method (Recommended) ⭐

**Advantages:**
- ✅ Real-time attendance updates
- ✅ Automatic data transfer
- ✅ No manual syncing needed

**Requirements:**
- Server must be accessible from device network
- Port 8081 must be open

**Setup:**

**Option 1: Using Domain Name (Recommended for Production) 🌐**

1. **Get a Domain Name:**
   - Use your existing domain (e.g., `api.yourgym.com`)
   - Or use Render/Heroku domain (e.g., `your-app.onrender.com`)
   - Or use free dynamic DNS (e.g., No-IP, DuckDNS)

2. **Configure Device Push Service:**
   - On your biometric device, go to: **Menu → Cloud Server Setting**
   - **Enable Domain Name**: `ON` (if available)
   - Set **Server Mode**: `ADMS` (should already be set)
   - Set **Server Address**: Your domain (e.g., `api.yourgym.com` or `your-app.onrender.com`)
     - **DO NOT** include `http://` or port
     - Just the domain name
   - Set **Server Port**: `8081`
   - **Enable Push Service**: `ON`
   - Save settings

3. **Add Device in Software:**
   - Go to **Biometric → Devices**
   - Click **Add Device**
   - Check **"Use Domain Name"**
   - Enter your domain
   - Port: `8081`

**Option 2: Using IP Address (For Local Network)**

1. **Find Your Server IP Address:**
   ```bash
   # On Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   
   # On Linux/Mac
   ifconfig
   # Or
   hostname -I
   ```

2. **Configure Device Push Service:**
   - On your biometric device, go to: **Menu → Cloud Server Setting**
   - Set **Server Mode**: `ADMS` (should already be set)
   - Set **Server Address**: Your server IP (e.g., `192.168.1.100`)
   - Set **Server Port**: `8081`
   - **Enable Push Service**: `ON`
   - Save settings

**📚 For detailed domain setup, see `DOMAIN_SETUP_GUIDE.md`**

3. **Start Your Backend Server:**
   ```bash
   cd backend
   npm start
   ```

   You should see:
   ```
   ✅ Biometric Push Service started on port 8081
   🚀 Backend running on http://localhost:5000
   ```

4. **Test Push Service:**
   - Make a test check-in on the biometric device
   - Check server logs - you should see:
     ```
     📥 New connection from device: 192.168.1.201:xxxxx
     ✅ Processed X attendance record(s)
     ```

5. **Verify in Software:**
   - Go to **Biometric → Attendance** tab
   - You should see the test check-in appear automatically

#### Option B: PULL Method

**Advantages:**
- ✅ Works behind firewalls/NAT
- ✅ You control sync timing
- ✅ More reliable for remote devices

**Setup:**

1. **Install Device SDK (if available):**
   ```bash
   cd backend
   npm install node-zklib
   # OR device-specific SDK
   ```

2. **Add Device in Software:**
   - Go to **Biometric → Devices**
   - Click **Add Device**
   - Enter:
     - Name: "Main Entrance"
     - IP: `192.168.1.201`
     - Port: `4370`
   - Click **Add Device**

3. **Test Connection:**
   - Click **Test Connection** on the device card
   - If successful, device info will be populated

4. **Sync Attendance:**
   - Click **Sync** button
   - Attendance logs will be downloaded

5. **Set Up Automatic Sync (Optional):**
   Add to `backend/index.js`:
   ```javascript
   // Sync every 15 minutes
   cron.schedule("*/15 * * * *", async () => {
     const [devices] = await db.query(
       "SELECT id FROM biometric_devices WHERE status = 'active'"
     );
     for (const device of devices) {
       try {
         await axios.post(`http://localhost:${PORT}/api/biometric/devices/${device.id}/sync`);
       } catch (error) {
         console.error(`Failed to sync device ${device.id}:`, error.message);
       }
     }
   });
   ```

---

### Step 3: Enroll Members

**On the Device:**
1. Go to device menu → User Management
2. Add new user
3. Assign a **User ID** (e.g., 1, 2, 3...)
4. Enroll fingerprint(s) or face(s)
5. **Note the User ID** assigned

**In the Software:**
1. Go to **Members** page
2. Find the member
3. Click **Enroll to Biometric** (if button exists)
   OR
4. Go to **Biometric → Enrolled Members**
5. Use enrollment API or manual entry

**Via API:**
```bash
POST /api/biometric/members/:memberId/enroll
{
  "device_id": 1,
  "biometric_user_id": 5,
  "password": null
}
```

---

### Step 4: Verify Integration

1. **Make Test Check-in:**
   - Use enrolled member's fingerprint/face on device
   - Check device screen for confirmation

2. **Check Software:**
   - **PUSH Method**: Should appear automatically within seconds
   - **PULL Method**: Click Sync button, then check Attendance tab

3. **Verify Data:**
   - Go to **Biometric → Attendance**
   - You should see:
     - Member name
     - Date & time
     - Check-in type
     - Device name

---

## 🔧 Troubleshooting

### Push Service Not Receiving Data

1. **Check Server Logs:**
   ```bash
   # Should see:
   ✅ Biometric Push Service started on port 8081
   ```

2. **Check Firewall:**
   ```bash
   # Windows
   netsh advfirewall firewall add rule name="Biometric Push" dir=in action=allow protocol=TCP localport=8081
   
   # Linux
   sudo ufw allow 8081/tcp
   ```

3. **Verify Device Settings:**
   - Server Address matches your server IP
   - Server Port is 8081
   - Push Service is enabled

4. **Test Connection:**
   ```bash
   # From device network, test if port is accessible
   telnet YOUR_SERVER_IP 8081
   ```

### Pull Method Not Working

1. **Check Device IP:**
   - Ping device: `ping 192.168.1.201`
   - Should respond

2. **Check Port:**
   - Device TCP Port should be 4370
   - Verify in device network settings

3. **Install SDK:**
   - Current implementation is basic
   - May need device-specific SDK
   - Check device documentation

### Members Not Appearing in Attendance

1. **Check Enrollment:**
   - Verify member is enrolled on device
   - Verify biometric_user_id matches device User ID

2. **Check Device:**
   - Ensure correct device is selected
   - Check device logs for attendance records

---

## 📝 Next Steps After Setup

1. **Enroll All Members:**
   - Enroll each member on device
   - Link them in software

2. **Monitor Attendance:**
   - Check Attendance tab regularly
   - Set up notifications (optional)

3. **Generate Reports:**
   - Use attendance data for reports
   - Track member visits

4. **Optimize:**
   - Set up automatic sync (PULL method)
   - Configure push service (PUSH method)
   - Add attendance analytics

---

## 🆘 Need Help?

1. Check device documentation for protocol details
2. Review server logs for errors
3. Test network connectivity
4. Verify database tables exist
5. Check device firmware version compatibility

---

## 📊 Current Status

✅ **Completed:**
- Database tables
- Backend routes
- Frontend UI
- Push Service endpoint (basic)
- Pull Service framework (basic)

⚠️ **May Need:**
- Device-specific protocol implementation
- SDK installation for Pull method
- Network configuration adjustments

---

## 🎉 You're Ready!

Once setup is complete:
- Members can check in/out using biometric device
- Attendance is automatically recorded
- View attendance in real-time
- Generate reports and analytics

Good luck! 🚀

