# Biometric Integration - How It Works

## Two Integration Methods

Your eSSL biometric device supports **TWO** integration methods:

### Method 1: PULL Method (Currently Implemented)
**How it works:**
- Your **server connects** to the device via TCP/IP on port **4370**
- Server **pulls/requests** attendance data from the device
- Requires periodic sync (manual or scheduled)

**Current Status:** ✅ Basic structure implemented (needs protocol completion)

### Method 2: PUSH Method (Recommended - Better!)
**How it works:**
- Device **automatically pushes** attendance data to your server
- Device connects to your server on port **8081** (Push Service port)
- **Real-time** attendance updates
- No need to manually sync

**Current Status:** ⚠️ Need to implement Push Service endpoint

---

## Your Device Configuration

Based on your device screenshots:

```
Device IP: 192.168.1.201
TCP Port: 4370 (for PULL method)
Push Service Port: 8081 (for PUSH method)
Server Mode: ADMS
Push Service Version: 2.0.33S-20220613
```

---

## Which Method Should You Use?

### Use PUSH Method If:
- ✅ You want real-time attendance updates
- ✅ You want automatic data transfer
- ✅ Your server has a public IP or is accessible from device network
- ✅ You want less server load (device initiates connection)

### Use PULL Method If:
- ✅ Your server is behind NAT/firewall
- ✅ You want to control when data is synced
- ✅ You prefer scheduled syncs
- ✅ Device cannot reach your server directly

**Recommendation:** Use **PUSH Method** for better real-time experience!

---

## Next Steps

### Option A: Set Up PUSH Method (Recommended)

1. **Configure Device Push Service:**
   - Go to device menu → Cloud Server Setting
   - Set Server Mode: **ADMS** (already set)
   - Set Server Address: **Your server IP** (e.g., `192.168.1.100` or public IP)
   - Set Server Port: **8081**
   - Enable Push Service: **ON**

2. **Set Up Push Service Endpoint** (I'll create this)
   - Server will listen on port 8081
   - Receive attendance data automatically
   - Store in database

3. **Test:**
   - Make a test check-in on device
   - Data should appear in your software automatically

### Option B: Complete PULL Method

1. **Install Device SDK:**
   ```bash
   npm install node-zklib
   ```
   OR use device-specific SDK

2. **Complete Protocol Implementation:**
   - Implement proper packet structure
   - Handle device-specific commands
   - Test connection and data retrieval

3. **Set Up Scheduled Sync:**
   - Configure cron job to sync every 15-30 minutes

---

## Current Implementation Status

✅ **Completed:**
- Database tables created
- Backend routes structure
- Frontend UI components
- Basic TCP/IP connection framework

⚠️ **Needs Completion:**
- **PULL Method:** Device protocol implementation (packet structure)
- **PUSH Method:** Push Service endpoint (port 8081 listener)

---

## Recommended Next Steps

1. **Set up PUSH Method** (I'll create the endpoint)
2. **Configure device** to push to your server
3. **Test with real check-ins**
4. **If PUSH doesn't work**, fall back to PULL method with SDK

