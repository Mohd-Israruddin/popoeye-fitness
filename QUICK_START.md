# Quick Start - Biometric Integration

## 🚀 Fast Setup (5 Minutes)

### 1. Database Setup (1 min)
```bash
mysql -u root -p gym_db < backend/db/create-biometric-tables.sql
```

### 2. Start Server (1 min)
```bash
cd backend
npm start
```

**Look for:**
```
✅ Biometric Push Service started on port 8081
🚀 Backend running on http://localhost:5000
```

### 3. Configure Device (2 min)

**Option A: Using Domain (Recommended) 🌐**

**On your eSSL device:**
1. Menu → **Cloud Server Setting**
2. **Enable Domain Name**: `ON` (if available)
3. Set **Server Address**: `YOUR_DOMAIN` (e.g., `api.yourgym.com` or `your-app.onrender.com`)
   - **DO NOT** include `http://` or port
   - Just the domain name
4. Set **Server Port**: `8081`
5. **Enable Push Service**: `ON`
6. Save

**In Software:**
- Go to **Biometric → Devices**
- Click **Add Device**
- Check **"Use Domain Name"**
- Enter your domain

**Option B: Using IP Address**

**On your eSSL device:**
1. Menu → **Cloud Server Setting**
2. Set **Server Address**: `YOUR_SERVER_IP` (e.g., `192.168.1.100`)
3. Set **Server Port**: `8081`
4. **Enable Push Service**: `ON`
5. Save

**📚 For domain setup details, see `DOMAIN_SETUP_GUIDE.md`**

### 4. Test (1 min)
1. Make a test check-in on device
2. Go to software: **Biometric → Attendance**
3. Should see attendance automatically! ✅

---

## 📍 Find Your Server IP

**Windows:**
```cmd
ipconfig
# Look for: IPv4 Address . . . . . . . . . . : 192.168.1.XXX
```

**Linux/Mac:**
```bash
hostname -I
# Or
ifconfig | grep "inet "
```

---

## 🔍 Verify It's Working

**Check Server Logs:**
```
📥 New connection from device: 192.168.1.201:xxxxx
✅ Processed 1 attendance record(s)
```

**Check Software:**
- Go to **Biometric → Attendance**
- See your test check-in

---

## ❌ Not Working?

### Push Service Not Starting?
- Check if port 8081 is available
- Check firewall settings
- Try different port in `.env`: `PUSH_SERVICE_PORT=8082`

### Device Not Connecting?
- Verify server IP is correct
- Check device and server are on same network
- Verify port 8081 is open

### No Attendance Data?
- Check device push service is enabled
- Verify member is enrolled
- Check server logs for errors

---

## 📚 Full Documentation

- **Detailed Setup**: See `SETUP_STEPS.md`
- **How It Works**: See `BIOMETRIC_INTEGRATION_EXPLAINED.md`
- **Complete Guide**: See `BIOMETRIC_INTEGRATION_GUIDE.md`

---

## 🎯 What You Get

✅ Real-time attendance tracking
✅ Automatic check-in/check-out detection
✅ Member attendance history
✅ Attendance statistics and reports

**That's it! You're done!** 🎉

