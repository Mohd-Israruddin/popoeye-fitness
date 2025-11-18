# 🏋️ Gym Management Software

A comprehensive gym management system built with React and Node.js, featuring member management, email notifications, financial tracking, and more.

## ✨ Features

### 👥 Member Management
- Add, edit, and delete members
- Track membership packages and expiry dates
- Body measurements tracking
- Email notifications for welcome and expiry reminders
- Member search and filtering

### 💰 Financial Management
- Income and expense tracking
- Recurring transactions (salaries, subscriptions)
- Payment history
- Financial reports and insights

### 📧 Email System
- Welcome emails for new members
- Automatic expiry reminders (7, 5, 3, 2, 1 days before expiry)
- Custom email templates
- Gmail integration

### 🏢 Staff Management
- Staff profiles and roles
- Salary tracking
- Activity logging
- Staff login system

### 📦 Inventory Management
- Product tracking
- Sales management
- Low stock alerts
- Profit tracking

### 📅 Scheduling
- Class scheduling
- Trainer assignments
- Member bookings

### 📊 Dashboard & Analytics
- Real-time insights
- Member statistics
- Financial overview
- Expiring memberships alerts

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- Gmail account (for email functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gym-soft
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   ```

3. **Configure environment**
   ```bash
   cd backend
   cp env-example.txt .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   cd backend
   node setup-database.js
   ```

5. **Start the application**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm start
   
   # Frontend (Terminal 2)
   npm run dev
   ```

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Update your `.env` file:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   GYM_NAME=Your Gym Name
   CONTACT_PHONE=+1234567890
   ```

## 🗄️ Database Schema

The system includes comprehensive database tables:
- `members` - Member information and contact details
- `staff` - Staff profiles and roles
- `finances` - Income and expense tracking
- `inventory` - Product and sales management
- `schedule` - Class and appointment scheduling
- `enquiries` - Lead management
- `recurring_transactions` - Automated recurring payments
- `activity_logs` - System audit trail

## 🌐 Deployment

### Render.com Deployment
1. Push your code to GitHub
2. Connect your repository to Render.com
3. Use the provided `render.yaml` configuration
4. Set up environment variables
5. Deploy!

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔧 API Endpoints

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Add new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `POST /api/members/send-welcome/:id` - Send welcome email
- `POST /api/members/send-reminder/:id` - Send expiry reminder

### Finances
- `GET /api/finances` - Get financial records
- `POST /api/finances` - Add financial record
- `PUT /api/finances/:id` - Update financial record

### Staff
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Add new staff member
- `PUT /api/staff/:id` - Update staff member

## 🎯 Key Changes Made

### SMS to Email Migration
- ✅ Replaced WhatsApp/SMS functionality with email
- ✅ Updated database schema (whatsapp → email + phone)
- ✅ Created email service with Nodemailer
- ✅ Updated frontend forms and displays
- ✅ Modified cron jobs for email reminders
- ✅ Added email templates for welcome and expiry notifications

### Database Updates
- ✅ Added email and phone columns to members table
- ✅ Created migration scripts
- ✅ Updated all API endpoints
- ✅ Added proper indexes for performance

### Deployment Ready
- ✅ Created deployment configuration
- ✅ Added environment variable setup
- ✅ Created comprehensive deployment guide
- ✅ Added database setup automation

## 📱 Usage

1. **Admin Login**: Use the admin credentials to access the system
2. **Add Members**: Use the "Add New Member" button to register members
3. **Send Reminders**: Use "Send Email Reminders" for bulk notifications
4. **Track Finances**: Record income and expenses in the Finances section
5. **Manage Staff**: Add and manage staff members
6. **View Analytics**: Check the dashboard for insights

## 🔒 Security Features

- Admin authentication with passkey
- Staff role-based access
- Activity logging for audit trails
- Secure password handling
- CORS protection

## 🐛 Troubleshooting

### Common Issues:
1. **Email not sending**: Check Gmail App Password and EMAIL_USER/EMAIL_PASSWORD
2. **Database connection**: Verify DB credentials in .env
3. **Build errors**: Check Node.js version and dependencies
4. **CORS issues**: Ensure backend is running on correct port

## 📞 Support

For issues or questions:
1. Check the deployment guide
2. Verify environment variables
3. Check console logs for errors
4. Test locally before deploying

## 🎉 Success!

Your gym management software is now ready for production use with:
- ✅ Email-based member notifications
- ✅ Complete member and staff management
- ✅ Financial tracking and reporting
- ✅ Inventory management
- ✅ Automated reminders
- ✅ Professional dashboard
- ✅ Deployment-ready configuration

**Ready to serve your first client!** 🚀