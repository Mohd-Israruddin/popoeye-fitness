# Domain Setup Guide for Biometric Integration

## 🌐 Using Domain Names Instead of IP Addresses

Using a domain name instead of an IP address allows your biometric device to connect to your server from anywhere, even if your server's IP address changes.

---

## ✅ Benefits of Using Domain Names

1. **Works Everywhere**: Device can connect from any network
2. **Dynamic IP Support**: Works even if server IP changes
3. **Professional**: Easier to remember and manage
4. **Scalable**: Easy to switch servers without reconfiguring devices

---

## 📋 Step-by-Step Domain Setup

### Step 1: Get a Domain Name

**Option A: Use Existing Domain**
- If you already have a domain (e.g., `yourgym.com`)
- Create a subdomain: `api.yourgym.com` or `biometric.yourgym.com`

**Option B: Get Free Domain**
- Use services like:
  - **No-IP** (free dynamic DNS): https://www.noip.com
  - **DuckDNS** (free): https://www.duckdns.org
  - **Cloudflare** (free DNS): https://www.cloudflare.com

**Option C: Purchase Domain**
- Namecheap, GoDaddy, Google Domains, etc.

---

### Step 2: Configure DNS Records

#### For Production Server (Render, Heroku, etc.)

If your server is hosted on Render/Heroku with a domain:

1. **Get Your Server Domain:**
   - Render: `your-app.onrender.com`
   - Heroku: `your-app.herokuapp.com`
   - Custom domain: `api.yourgym.com`

2. **Use the Domain Directly:**
   - No DNS configuration needed if using platform domain
   - Just use: `your-app.onrender.com` (port 8081)

#### For Custom Domain

1. **Add A Record:**
   ```
   Type: A
   Name: api (or biometric)
   Value: YOUR_SERVER_IP_ADDRESS
   TTL: 3600 (or default)
   ```

2. **Or Use CNAME:**
   ```
   Type: CNAME
   Name: api (or biometric)
   Value: your-app.onrender.com
   TTL: 3600
   ```

---

### Step 3: Configure Device in Software

1. **Go to Biometric → Devices**
2. **Click "Add Device"**
3. **Check "Use Domain Name"**
4. **Enter Domain:**
   - For Render: `your-app.onrender.com`
   - For custom: `api.yourgym.com`
   - For No-IP: `yourname.ddns.net`
5. **Port:** `8081` (for Push Service)
6. **Save**

---

### Step 4: Configure Device Push Service

**On Your eSSL Biometric Device:**

1. Go to: **Menu → Cloud Server Setting**
2. **Enable Domain Name**: `ON` (if available)
3. **Server Mode**: `ADMS`
4. **Server Address**: Enter your domain (e.g., `api.yourgym.com`)
   - **DO NOT** include `http://` or port number
   - Just the domain: `api.yourgym.com`
5. **Server Port**: `8081`
6. **Enable Push Service**: `ON`
7. **Save Settings**

---

### Step 5: Verify DNS Resolution

**Test if domain resolves correctly:**

```bash
# Windows
nslookup api.yourgym.com
ping api.yourgym.com

# Linux/Mac
dig api.yourgym.com
ping api.yourgym.com
```

**Expected Result:**
- Should resolve to your server's IP address
- Ping should respond

---

### Step 6: Test Connection

1. **Check Server Logs:**
   ```bash
   # Should see:
   ✅ Biometric Push Service started on port 8081
   ```

2. **Make Test Check-in:**
   - Use biometric device
   - Check server logs for:
     ```
     📥 New connection from device: [IP]:xxxxx
     ✅ Processed 1 attendance record(s)
     ```

3. **Verify in Software:**
   - Go to **Biometric → Attendance**
   - Should see test check-in

---

## 🔧 Troubleshooting Domain Issues

### Domain Not Resolving

**Problem:** Device can't connect, DNS not resolving

**Solutions:**
1. **Check DNS Records:**
   - Verify A record or CNAME is correct
   - Wait for DNS propagation (can take up to 48 hours)

2. **Test DNS:**
   ```bash
   nslookup your-domain.com
   # Should return your server IP
   ```

3. **Check Domain Provider:**
   - Ensure DNS is active
   - Check for typos in domain name

### Device Can't Connect

**Problem:** Device shows connection error

**Solutions:**
1. **Verify Domain Format:**
   - ✅ Correct: `api.yourgym.com`
   - ❌ Wrong: `http://api.yourgym.com`
   - ❌ Wrong: `api.yourgym.com:8081`

2. **Check Port:**
   - Ensure port 8081 is open on server
   - Check firewall settings

3. **Test from Device Network:**
   - Device must be able to reach internet
   - Check device network settings

### Dynamic IP Changes

**Problem:** Server IP changes, device stops working

**Solutions:**
1. **Use Dynamic DNS (No-IP, DuckDNS):**
   - Automatically updates when IP changes
   - Free services available

2. **Use Platform Domain:**
   - Render/Heroku domains always work
   - No IP management needed

3. **Update DNS Record:**
   - Manually update A record when IP changes
   - Or use DNS API for automatic updates

---

## 📝 Example Configurations

### Example 1: Render.com Deployment

**Domain:** `gym-backend.onrender.com`

**Device Configuration:**
- Server Address: `gym-backend.onrender.com`
- Server Port: `8081`
- Enable Domain Name: `ON`

**Software Configuration:**
- Device Name: "Main Entrance"
- Domain: `gym-backend.onrender.com`
- Port: `8081`

### Example 2: Custom Domain

**Domain:** `api.yourgym.com`

**DNS Configuration:**
```
Type: A
Name: api
Value: 123.45.67.89 (your server IP)
```

**Device Configuration:**
- Server Address: `api.yourgym.com`
- Server Port: `8081`

### Example 3: No-IP Dynamic DNS

**Domain:** `yourgym.ddns.net`

**Device Configuration:**
- Server Address: `yourgym.ddns.net`
- Server Port: `8081`

---

## 🔒 Security Considerations

1. **Use HTTPS (if supported):**
   - Some devices support SSL/TLS
   - Encrypts data transmission

2. **Firewall Rules:**
   - Only allow port 8081 from trusted networks
   - Consider VPN for additional security

3. **Domain Validation:**
   - Verify device connections
   - Monitor for unauthorized access

---

## ✅ Checklist

- [ ] Domain name obtained/configured
- [ ] DNS records configured (A or CNAME)
- [ ] DNS resolves correctly (tested with nslookup)
- [ ] Device added in software with domain
- [ ] Device configured with domain name
- [ ] Port 8081 open on server
- [ ] Push Service running on server
- [ ] Test check-in successful
- [ ] Attendance appears in software

---

## 🆘 Need Help?

1. **DNS Issues:**
   - Check domain provider documentation
   - Verify DNS records are correct
   - Wait for DNS propagation

2. **Connection Issues:**
   - Verify server is running
   - Check firewall settings
   - Test port accessibility

3. **Device Issues:**
   - Check device network connectivity
   - Verify domain format in device
   - Check device logs/status

---

## 🎉 Success!

Once configured:
- ✅ Device connects automatically
- ✅ Works from anywhere
- ✅ Survives IP changes (with dynamic DNS)
- ✅ Professional setup

Your biometric integration is now accessible from anywhere! 🚀

