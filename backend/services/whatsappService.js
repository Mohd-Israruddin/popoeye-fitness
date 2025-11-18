const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
  }
  
  return twilio(accountSid, authToken);
};

// Helper function to format phone number for WhatsApp
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If phone starts with country code, use as is
  // Otherwise, assume it's a local number and add country code from env
  if (cleaned.length >= 10) {
    // If it doesn't start with country code, add it
    if (!cleaned.startsWith(process.env.WHATSAPP_COUNTRY_CODE || '91')) {
      cleaned = (process.env.WHATSAPP_COUNTRY_CODE || '91') + cleaned;
    }
    return `whatsapp:+${cleaned}`;
  }
  
  return null;
};

// Send welcome WhatsApp message to new member
const sendWelcomeMessage = async (memberData) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+14155238886
    const toNumber = formatPhoneNumber(memberData.phone);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const message = `🎉 *Welcome to ${process.env.GYM_NAME || 'Our Gym'}!*

Dear ${memberData.name},

Welcome to our gym family! We're excited to have you join us.

*Your Membership Details:*
• Member ID: ${memberData.member_id}
• Package: ${memberData.package}
• Join Date: ${memberData.join_date}
• Expiry Date: ${memberData.expiry_date}
• Total Amount: ₹${memberData.total_amount}
• Paid Amount: ₹${memberData.paid_amount}

We look forward to helping you achieve your fitness goals!

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log('✅ Welcome WhatsApp message sent to', memberData.phone);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send welcome WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

// Send expiry reminder WhatsApp message
const sendExpiryReminderMessage = async (memberData, daysLeft) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = formatPhoneNumber(memberData.phone);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const message = `⏰ *Membership Expiry Reminder*

Dear ${memberData.name},

This is a friendly reminder that your gym membership will expire in *${daysLeft} day(s)* on *${memberData.expiry_date}*.

⚠️ *Action Required*
To continue enjoying our facilities, please renew your membership before the expiry date.

Contact us at ${process.env.CONTACT_PHONE || 'our gym'} for renewal assistance.

Thank you for being a valued member!

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log(`✅ Expiry reminder WhatsApp message sent to ${memberData.name} (${daysLeft} days left)`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error(`❌ Failed to send expiry reminder WhatsApp message to ${memberData.name}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send schedule booking confirmation WhatsApp message
const sendScheduleBookingMessage = async (bookingData) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = formatPhoneNumber(bookingData.phone);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const message = `✅ *Class Booking Confirmed!*

Dear ${bookingData.member_name},

Your class booking has been confirmed. We look forward to seeing you!

*Class Details:*
• Class: ${bookingData.category}
• Date: ${new Date(bookingData.date).toLocaleDateString()}
• Time: ${bookingData.time}
• Trainer: ${bookingData.trainer || 'TBA'}

📝 *Reminder:* Please arrive 10 minutes before your class starts.

If you need to cancel or reschedule, please contact us at ${process.env.CONTACT_PHONE || 'our gym'}.

Thank you for choosing ${process.env.GYM_NAME || 'our gym'}!

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log('✅ Schedule booking WhatsApp message sent to', bookingData.phone);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send schedule booking WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

// Send schedule update WhatsApp message
const sendScheduleUpdateMessage = async (bookingData, changes) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = formatPhoneNumber(bookingData.phone);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const message = `🔄 *Class Schedule Updated*

Dear ${bookingData.member_name},

Your class schedule has been updated. Here are the new details:

*Updated Class Details:*
• Class: ${bookingData.category}
• Date: ${new Date(bookingData.date).toLocaleDateString()}
• Time: ${bookingData.time}
• Trainer: ${bookingData.trainer || 'TBA'}

${changes ? `*Changes Made:*
${changes}` : ''}

If you have any questions about these changes, please contact us at ${process.env.CONTACT_PHONE || 'our gym'}.

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log('✅ Schedule update WhatsApp message sent to', bookingData.phone);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send schedule update WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

// Send schedule cancellation WhatsApp message
const sendScheduleCancellationMessage = async (bookingData) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = formatPhoneNumber(bookingData.phone);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const message = `❌ *Class Booking Cancelled*

Dear ${bookingData.member_name},

Your class booking has been cancelled. We're sorry for any inconvenience.

*Cancelled Class Details:*
• Class: ${bookingData.category}
• Date: ${new Date(bookingData.date).toLocaleDateString()}
• Time: ${bookingData.time}
• Trainer: ${bookingData.trainer || 'TBA'}

💡 *Need to reschedule?* Contact us at ${process.env.CONTACT_PHONE || 'our gym'} to book a new class.

We hope to see you in another class soon!

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log('✅ Schedule cancellation WhatsApp message sent to', bookingData.phone);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send schedule cancellation WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

// Send payment confirmation WhatsApp message
const sendPaymentConfirmationMessage = async (paymentData) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = formatPhoneNumber(paymentData.phone);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const message = `💰 *Payment Confirmation*

Dear ${paymentData.name},

Thank you for your payment! We have successfully received your payment and updated your account.

*Payment Details:*
• Member ID: ${paymentData.member_id}
• Payment Amount: ₹${paymentData.payment_amount}
• Payment Date: ${new Date(paymentData.payment_date).toLocaleDateString()}
• Payment Method: ${paymentData.payment_method || 'Cash'}
• Previous Due: ₹${paymentData.previous_due}
• Remaining Due: ₹${paymentData.remaining_due}

*Account Summary:*
• Total Amount: ₹${paymentData.total_amount}
• Total Paid: ₹${paymentData.total_paid}
• Remaining Due: ₹${paymentData.remaining_due}

${paymentData.remaining_due > 0 ? 
  '⚠️ *Note:* You still have a remaining balance. Please clear it before your membership expires.' :
  '✅ *Great!* Your account is fully paid up!'}

Thank you for being a valued member of ${process.env.GYM_NAME || 'our gym'}!

If you have any questions about this payment, please contact us at ${process.env.CONTACT_PHONE || 'our gym'}.

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log('✅ Payment confirmation WhatsApp message sent to', paymentData.phone);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send payment confirmation WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

// Send custom WhatsApp message
const sendCustomMessage = async (to, message) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const toNumber = formatPhoneNumber(to);
    
    if (!toNumber) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const fullMessage = `${message}

Best regards,
The ${process.env.GYM_NAME || 'Gym'} Team`;

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: fullMessage
    });

    console.log('✅ Custom WhatsApp message sent to', to);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send custom WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeMessage,
  sendExpiryReminderMessage,
  sendScheduleBookingMessage,
  sendScheduleUpdateMessage,
  sendScheduleCancellationMessage,
  sendPaymentConfirmationMessage,
  sendCustomMessage
};

