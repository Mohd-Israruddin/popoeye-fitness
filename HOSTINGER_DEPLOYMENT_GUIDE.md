# 🚀 Hostinger Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ What You Need:
1. **Hostinger account** with hosting plan
2. **Domain name** (if you have one)
3. **Email credentials** (Gmail App Password)
4. **Database credentials** from Hostinger
5. **File Manager access** or FTP client

---

## 🗄️ Database Setup (Hostinger MySQL)

### Step 1: Create Database
1. Login to **Hostinger Control Panel**
2. Go to **MySQL Databases**
3. Create new database: `gym_software_db`
4. Create database user with full privileges
5. Note down:
   - Database name: `your_username_gym_software_db`
   - Username: `your_username_dbuser`
   - Password: `your_db_password`
   - Host: `localhost` (usually)

### Step 2: Import Database Schema
1. Go to **phpMyAdmin** in Hostinger
2. Select your database
3. Import the file: `complete-gym-database-schema.sql`
4. Run any migration files if needed

---

## 📁 File Upload

### Step 1: Prepare Files
```bash
# Build the frontend
npm run build

# This creates a 'dist' folder with production files
```

### Step 2: Upload to Hostinger
1. **Backend files** → Upload to root directory or `/api` folder:
   ```
   backend/
   ├── index.js
   ├── package.json
   ├── routes/
   ├── services/
   ├── db.js
   └── .env
   ```

2. **Frontend files** → Upload `dist/` contents to root or `/public` folder:
   ```
   dist/
   ├── index.html
   ├── assets/
   └── vite.svg
   ```

---

## ⚙️ Environment Configuration

### Create `.env` file in backend folder:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_username_dbuser
DB_PASSWORD=your_db_password
DB_NAME=your_username_gym_software_db

# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
GYM_NAME=Your Gym Name
CONTACT_PHONE=+1234567890

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=3000
NODE_ENV=production
```

---

## 🚀 Server Setup

### Option 1: Node.js Hosting (Recommended)
1. **Enable Node.js** in Hostinger control panel
2. Set **Node.js version** to 18.x or 20.x
3. Set **Startup file** to: `backend/index.js`
4. Set **App root directory** to: `/public_html/backend`

### Option 2: Shared Hosting (Alternative)
1. Upload files to `public_html`
2. Create `.htaccess` file for URL rewriting
3. Set up cron jobs for automated tasks

---

## 📝 .htaccess Configuration

Create `.htaccess` file in root directory:
```apache
RewriteEngine On

# Handle Angular/React routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# API routes
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ /backend/index.js [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

---

## 🔧 Package.json Scripts

Update your `package.json` in backend folder:
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "echo 'Backend build complete'",
    "install-deps": "npm install"
  }
}
```

---

## 📧 Email Configuration

### Gmail Setup (Already Done):
- ✅ Gmail App Password created
- ✅ Email service configured
- ✅ Templates ready

### Test Email:
```bash
# Test from your local machine first
curl -X POST http://localhost:5000/api/members/send-welcome/1
```

---

## 🗃️ Database Migration

### Run these SQL commands in phpMyAdmin:
```sql
-- 1. Create all tables
SOURCE complete-gym-database-schema.sql;

-- 2. Run migrations if needed
SOURCE backend/db/migrate-whatsapp-to-email-fixed.sql;

-- 3. Insert sample data (optional)
INSERT INTO admin_settings (admin_code) VALUES ('1234');
```

---

## 🧪 Testing After Deployment

### 1. Test Backend API:
```bash
# Test database connection
curl https://yourdomain.com/api/members

# Test email functionality
curl -X POST https://yourdomain.com/api/members/send-welcome/1
```

### 2. Test Frontend:
- Visit your domain
- Try logging in
- Test member management
- Test email sending

### 3. Test Email System:
- Add a new member
- Send welcome email
- Test payment confirmation
- Test schedule emails

---

## 🔒 Security Checklist

### ✅ Before Going Live:
- [ ] Change default admin code from '1234'
- [ ] Use strong JWT secret
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up proper file permissions
- [ ] Configure firewall rules
- [ ] Regular database backups

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check database credentials in `.env`
   - Verify database exists in Hostinger
   - Check host name (usually `localhost`)

2. **Email Not Sending:**
   - Verify Gmail App Password
   - Check EMAIL_USER in `.env`
   - Test with simple email first

3. **Frontend Not Loading:**
   - Check file upload paths
   - Verify `.htaccess` configuration
   - Check browser console for errors

4. **API Routes Not Working:**
   - Verify backend is running
   - Check Node.js configuration
   - Test API endpoints directly

### Hostinger Support:
- **Live Chat:** Available 24/7
- **Knowledge Base:** Extensive documentation
- **Ticket System:** For complex issues

---

## 🎯 Final Steps

### Day of Deployment:
1. **Morning:** Set up database and upload files
2. **Afternoon:** Configure environment and test
3. **Evening:** Final testing and go live!

### Post-Deployment:
1. **Monitor** for 24 hours
2. **Test** all features thoroughly
3. **Backup** database regularly
4. **Update** as needed

---

## 📱 Your Complete System Features:

✅ **Member Management** - Add, edit, delete members
✅ **Email Notifications** - Welcome, expiry, payment confirmations
✅ **Schedule Management** - Class bookings with email confirmations
✅ **Finance Tracking** - Automatic transaction recording
✅ **Staff Management** - Staff login and permissions
✅ **Inventory Management** - Product tracking
✅ **Business Insights** - Analytics and reports
✅ **Responsive Design** - Works on all devices

**Your gym software is ready for production! 🚀**

---

*Need help? Contact me anytime during deployment!*
