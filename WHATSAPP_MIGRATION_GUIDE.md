# 📱 Email to WhatsApp Migration Guide

## ✅ Changes Completed

Your gym management system has been successfully migrated from email to WhatsApp notifications!

### 1. **New WhatsApp Service Created**
- ✅ Created `backend/services/whatsappService.js` with all notification functions
- ✅ Uses Twilio WhatsApp API for reliable message delivery
- ✅ Supports all notification types:
  - Welcome messages for new members
  - Expiry reminders
  - Schedule booking confirmations
  - Schedule updates
  - Schedule cancellations
  - Payment confirmations
  - Custom messages

### 2. **Backend Routes Updated**
- ✅ `backend/routes/members.js` - Now uses WhatsApp instead of email
- ✅ `backend/routes/schedule.js` - Now uses WhatsApp instead of email
- ✅ `backend/index.js` - Cron job updated for WhatsApp expiry reminders

### 3. **Configuration Files Updated**
- ✅ `backend/package.json` - Added `twilio` dependency, removed `nodemailer`
- ✅ `production-env-template.txt` - Updated with WhatsApp/Twilio configuration
- ✅ `backend/env-example.txt` - Updated with WhatsApp/Twilio configuration

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install the `twilio` package (and remove `nodemailer` if it's no longer needed).

### Step 2: Set Up Twilio Account

1. **Create a Twilio Account**
   - Go to [https://www.twilio.com](https://www.twilio.com)
   - Sign up for a free account (includes trial credits)

2. **Get Your Twilio Credentials**
   - Account SID: Found in your Twilio Console Dashboard
   - Auth Token: Found in your Twilio Console Dashboard
   - WhatsApp Number: Twilio provides a sandbox number for testing (format: `whatsapp:+14155238886`)

3. **Enable WhatsApp in Twilio**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow the instructions to join the Twilio WhatsApp sandbox
   - For production, you'll need to request a WhatsApp Business API number

### Step 3: Configure Environment Variables

Update your `.env` file in the `backend` folder:

```env
# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_COUNTRY_CODE=91

# Gym Information
GYM_NAME=Your Gym Name Here
CONTACT_PHONE=+1234567890
```

**Important Notes:**
- `TWILIO_WHATSAPP_NUMBER`: Use the sandbox number for testing, or your approved WhatsApp Business number for production
- `WHATSAPP_COUNTRY_CODE`: Default is `91` (India). Change this to your country code if different (e.g., `1` for US, `44` for UK)

### Step 4: Phone Number Format

The system automatically formats phone numbers. Members' phone numbers should be stored in the `phone` field of the `members` table.

**Supported formats:**
- `9876543210` (will be formatted as `+919876543210`)
- `+919876543210` (will be used as is)
- `919876543210` (will be formatted as `+919876543210`)

### Step 5: Test the Integration

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Test a welcome message:**
   - Add a new member with a phone number
   - Check if the WhatsApp message is sent

3. **Test expiry reminders:**
   - The cron job runs daily at 10 AM
   - Or manually trigger: `GET /api/members/send-expiry-reminders`

## 📋 What Changed in the Code

### Database
- No database changes required! The system uses the existing `phone` field in the `members` table
- For schedule bookings, phone numbers are looked up from the `members` table using the member name

### API Endpoints
All endpoints remain the same, but now send WhatsApp messages instead of emails:
- `POST /api/members` - Sends welcome WhatsApp message
- `POST /api/members/send-welcome/:id` - Manual welcome message
- `POST /api/members/send-reminder/:id` - Manual expiry reminder
- `GET /api/members/send-expiry-reminders` - Bulk expiry reminders
- `POST /api/schedule` - Sends booking confirmation WhatsApp
- `PUT /api/schedule/:id` - Sends update WhatsApp
- `DELETE /api/schedule/:id` - Sends cancellation WhatsApp

## 🔄 Migration from Email

If you were previously using email:
- The `email` field in the database is still preserved (not removed)
- All notifications now use the `phone` field instead
- Make sure all members have valid phone numbers in the `phone` field

## 💰 Twilio Pricing

- **Trial Account**: Free credits for testing
- **Production**: Pay-as-you-go pricing
  - WhatsApp messages: ~$0.005 - $0.01 per message (varies by country)
  - Check [Twilio Pricing](https://www.twilio.com/pricing) for current rates

## 🆘 Troubleshooting

### Messages Not Sending

1. **Check Twilio Credentials**
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
   - Check Twilio Console for any errors

2. **Check Phone Number Format**
   - Ensure phone numbers are in correct format
   - Verify country code is set correctly

3. **Check Twilio Sandbox**
   - For testing, recipient must join Twilio WhatsApp sandbox
   - Send "join [your-sandbox-code]" to the Twilio WhatsApp number

4. **Check Logs**
   - Check backend console for error messages
   - Check Twilio Console → Monitor → Logs for delivery status

### Common Errors

- **"Invalid phone number"**: Phone number format is incorrect
- **"Unauthorized"**: Twilio credentials are wrong
- **"Message not delivered"**: Recipient hasn't joined Twilio sandbox (for testing)

## 📞 Support

For Twilio-specific issues:
- [Twilio Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio Support](https://support.twilio.com/)

---

**Migration completed successfully!** 🎉

Your gym management system now uses WhatsApp for all member notifications.

