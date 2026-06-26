# Biometric Integration Guide

This guide explains how to integrate and use biometric devices (eSSL/ZKTeco compatible) with your gym management software.

## Overview

The biometric integration allows you to:
- Connect and manage biometric attendance devices
- Enroll members on biometric devices
- Sync attendance logs automatically
- View attendance history and statistics
- Track member check-ins and check-outs

## Prerequisites

1. **Biometric Device**: eSSL or ZKTeco compatible device
2. **Network Setup**: Device must be connected to the same network as your server
3. **Device Configuration**: Device should have a static IP address

## Database Setup

First, run the SQL script to create the necessary tables:

```bash
mysql -u your_username -p gym_db < backend/db/create-biometric-tables.sql
```

Or manually execute the SQL file in your MySQL client.

## Device Configuration

### Step 1: Configure Device Network Settings

1. Access your biometric device menu
2. Navigate to **Network Settings** or **Ethernet Settings**
3. Set a static IP address (e.g., `192.168.1.201`)
4. Set the port to `4370` (default)
5. Ensure DHCP is disabled if using static IP
6. Save settings

### Step 2: Add Device to Software

1. Log in to your gym management software
2. Navigate to **Biometric** from the sidebar (Admin only)
3. Click **Add Device**
4. Fill in the form:
   - **Device Name**: A friendly name (e.g., "Main Entrance")
   - **IP Address**: The device's IP address
   - **Port**: Usually 4370
   - Other fields are optional and can be auto-detected
5. Click **Add Device**

### Step 3: Test Connection

1. After adding the device, click **Test Connection**
2. If successful, device information will be auto-populated
3. Device status will change to "active"

## Enrolling Members

### Method 1: From Biometric Page

1. Go to **Biometric** → **Enrolled Members** tab
2. Members need to be enrolled manually on the device first
3. Then link them in the software using the enrollment API

### Method 2: From Members Page (Recommended)

1. Go to **Members** page
2. Select a member
3. Use the enrollment feature (if implemented in MemberForm)

### Enrollment Process

1. **On the Device**:
   - Navigate to user management
   - Add a new user with a unique User ID
   - Enroll fingerprint(s) or face(s)
   - Note the User ID assigned

2. **In the Software**:
   - Go to member's profile
   - Click "Enroll to Biometric"
   - Select the device
   - Enter the User ID from the device
   - Save enrollment

## Syncing Attendance

### Manual Sync

1. Go to **Biometric** → **Devices** tab
2. Click **Sync** button on the device card
3. Attendance logs will be downloaded and stored

### Automatic Sync (Recommended)

Set up a cron job to sync attendance automatically:

```javascript
// Add to backend/index.js or create a separate cron job file
cron.schedule("*/15 * * * *", async () => {
  // Sync all active devices every 15 minutes
  const [devices] = await db.query(
    "SELECT id FROM biometric_devices WHERE status = 'active'"
  );
  
  for (const device of devices) {
    try {
      await axios.post(`http://localhost:${PORT}/api/biometric/devices/${device.id}/sync`);
      console.log(`Synced device ${device.id}`);
    } catch (error) {
      console.error(`Failed to sync device ${device.id}:`, error.message);
    }
  }
});
```

## Viewing Attendance

1. Navigate to **Biometric** → **Attendance** tab
2. View all attendance logs with:
   - Date and time
   - Member name
   - Device name
   - Check-in/Check-out type
   - Verification method
   - Status

### Filtering Attendance

You can filter attendance by:
- Member
- Device
- Date range
- Check type

## API Endpoints

### Devices

- `GET /api/biometric/devices` - List all devices
- `POST /api/biometric/devices` - Add a device
- `PUT /api/biometric/devices/:id` - Update device
- `DELETE /api/biometric/devices/:id` - Delete device
- `POST /api/biometric/devices/:id/test` - Test connection
- `POST /api/biometric/devices/:id/sync` - Sync attendance

### Attendance

- `GET /api/biometric/attendance` - Get attendance logs
- `GET /api/biometric/attendance/stats` - Get statistics

### Members

- `GET /api/biometric/members` - Get enrolled members
- `POST /api/biometric/members/:memberId/enroll` - Enroll member
- `DELETE /api/biometric/members/:memberId/enroll/:deviceId` - Remove enrollment

## Troubleshooting

### Device Connection Failed

1. **Check Network**: Ensure device and server are on the same network
2. **Check IP**: Verify IP address is correct
3. **Check Port**: Default port is 4370
4. **Firewall**: Ensure port 4370 is not blocked
5. **Device Status**: Check if device is powered on and connected

### Attendance Not Syncing

1. **Check Device Status**: Ensure device is "active"
2. **Check Last Sync**: Verify last sync time
3. **Manual Sync**: Try manual sync first
4. **Check Logs**: Review server logs for errors
5. **Device Storage**: Some devices have limited storage - clear old logs

### Member Not Found in Attendance

1. **Check Enrollment**: Verify member is enrolled on the device
2. **Check User ID**: Ensure biometric_user_id matches device User ID
3. **Check Device**: Verify attendance is from the correct device

## Device Protocol Notes

The current implementation uses a simplified TCP/IP communication protocol. For production use with specific device models, you may need to:

1. **Use Device SDK**: Install device-specific SDK if available
2. **Protocol Documentation**: Refer to device manufacturer's protocol documentation
3. **Custom Implementation**: Implement device-specific packet structures

### Popular Libraries

- `node-zklib` - For ZKTeco devices
- `zk-attendance` - Another ZKTeco library
- Custom TCP/IP implementation (current approach)

## Security Considerations

1. **Network Security**: Keep biometric devices on a secure network
2. **Access Control**: Limit access to biometric management (Admin only)
3. **Data Privacy**: Attendance logs contain sensitive information
4. **Device Security**: Change default passwords on devices

## Future Enhancements

- Real-time attendance notifications
- Automatic check-in/check-out detection
- Attendance reports and analytics
- Integration with membership expiry
- Multi-device support with location tracking

## Support

For issues or questions:
- Check device manufacturer documentation
- Review server logs for error messages
- Contact support with device model and firmware version

