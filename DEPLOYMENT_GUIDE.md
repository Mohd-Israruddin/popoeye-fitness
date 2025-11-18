# Gym Management Software - Deployment Guide

## 🚀 Quick Deployment to Render.com

### Prerequisites
1. GitHub account with your code repository
2. Render.com account
3. Gmail account for email functionality

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure all files are committed

### Step 2: Deploy to Render.com

#### Option A: Using render.yaml (Recommended)
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to deploy

#### Option B: Manual Setup
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the backend service:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
   - **Plan**: Free

5. Create a PostgreSQL database:
   - Click "New +" → "PostgreSQL"
   - Name: `gym-database`
   - Plan: Free

6. Deploy the frontend:
   - Click "New +" → "Static Site"
   - Connect your repository
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Step 3: Configure Environment Variables

#### Backend Environment Variables:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<from your PostgreSQL database>
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
GYM_NAME=Your Gym Name
CONTACT_PHONE=+1234567890
JWT_SECRET=your-super-secret-jwt-key
```

#### Frontend Environment Variables:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 4: Set Up Gmail for Email Functionality

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD` environment variable

### Step 5: Database Setup

1. After deployment, your database will be automatically created
2. Run the database schema:
   ```sql
   -- Use the complete-gym-database-schema.sql file
   -- This will create all necessary tables
   ```

3. Run the migration script if needed:
   ```sql
   -- Use migrate-whatsapp-to-email.sql if migrating from WhatsApp to email
   ```

### Step 6: Test Your Deployment

1. **Backend Test**: Visit `https://your-backend-url.onrender.com`
   - Should show "Gym Backend Running..."

2. **Frontend Test**: Visit your frontend URL
   - Should load the gym management interface

3. **Email Test**: Try adding a new member with an email address
   - Check if welcome email is sent

## 🔧 Local Development Setup

### Backend Setup
```bash
cd backend
npm install
cp env-example.txt .env
# Edit .env with your configuration
npm start
```

### Frontend Setup
```bash
npm install
npm run dev
```

## 📧 Email Configuration

### Gmail Setup
1. Use your Gmail address as `EMAIL_USER`
2. Generate an App Password (not your regular password)
3. Use the App Password as `EMAIL_PASSWORD`

### Other Email Providers
You can modify `backend/services/emailService.js` to use other providers:
- Outlook/Hotmail
- Yahoo Mail
- Custom SMTP servers

## 🗄️ Database Configuration

### Local MySQL
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gym_db
```

### Production PostgreSQL (Render)
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## 🚨 Important Notes

1. **Email Limits**: Gmail has sending limits (500 emails/day for free accounts)
2. **Database**: Free PostgreSQL on Render has connection limits
3. **Sleep Mode**: Free services on Render sleep after 15 minutes of inactivity
4. **Security**: Change default passwords and JWT secrets in production

## 🔍 Troubleshooting

### Common Issues:

1. **Email not sending**:
   - Check Gmail App Password
   - Verify EMAIL_USER and EMAIL_PASSWORD
   - Check Gmail sending limits

2. **Database connection failed**:
   - Verify DATABASE_URL
   - Check if database is created
   - Run schema creation script

3. **Frontend not loading**:
   - Check VITE_API_URL
   - Verify backend is running
   - Check CORS settings

4. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for syntax errors

## 📞 Support

If you encounter issues:
1. Check the Render logs
2. Verify environment variables
3. Test locally first
4. Check the console for error messages

## 🎉 Success!

Once deployed, your gym management software will be available at:
- **Frontend**: `https://your-frontend-url.onrender.com`
- **Backend API**: `https://your-backend-url.onrender.com`

You can now manage members, send email reminders, track finances, and more!
