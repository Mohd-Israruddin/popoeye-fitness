const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your email password or app password
    }
  });
};

// Send welcome email to new member
const sendWelcomeEmail = async (memberData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: memberData.email,
      subject: `Welcome to ${process.env.GYM_NAME || 'Our Gym'}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ${process.env.GYM_NAME || 'Our Gym'}!</h2>
          <p>Dear ${memberData.name},</p>
          <p>Welcome to our gym family! We're excited to have you join us.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Membership Details:</h3>
            <p><strong>Member ID:</strong> ${memberData.member_id}</p>
            <p><strong>Package:</strong> ${memberData.package}</p>
            <p><strong>Join Date:</strong> ${memberData.join_date}</p>
            <p><strong>Expiry Date:</strong> ${memberData.expiry_date}</p>
            <p><strong>Total Amount:</strong> ₹${memberData.total_amount}</p>
            <p><strong>Paid Amount:</strong> ₹${memberData.paid_amount}</p>
          </div>
          
          <p>We look forward to helping you achieve your fitness goals!</p>
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to', memberData.email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send expiry reminder email
const sendExpiryReminderEmail = async (memberData, daysLeft) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: memberData.email,
      subject: `Membership Expiry Reminder - ${daysLeft} day(s) left`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Membership Expiry Reminder</h2>
          <p>Dear ${memberData.name},</p>
          <p>This is a friendly reminder that your gym membership will expire in <strong>${daysLeft} day(s)</strong> on <strong>${memberData.expiry_date}</strong>.</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Action Required</h3>
            <p>To continue enjoying our facilities, please renew your membership before the expiry date.</p>
            <p>Contact us at ${process.env.CONTACT_PHONE || 'our gym'} for renewal assistance.</p>
          </div>
          
          <p>Thank you for being a valued member!</p>
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Expiry reminder email sent to ${memberData.name} (${daysLeft} days left)`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send expiry reminder email to ${memberData.name}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send schedule booking confirmation email
const sendScheduleBookingEmail = async (bookingData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: bookingData.email,
      subject: `Class Booking Confirmed - ${process.env.GYM_NAME || 'Gym'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Class Booking Confirmed!</h2>
          <p>Dear ${bookingData.member_name},</p>
          <p>Your class booking has been confirmed. We look forward to seeing you!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Class Details:</h3>
            <p><strong>Class:</strong> ${bookingData.category}</p>
            <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${bookingData.time}</p>
            <p><strong>Trainer:</strong> ${bookingData.trainer || 'TBA'}</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>📝 Reminder:</strong> Please arrive 10 minutes before your class starts.</p>
            <p>If you need to cancel or reschedule, please contact us at ${process.env.CONTACT_PHONE || 'our gym'}.</p>
          </div>
          
          <p>Thank you for choosing ${process.env.GYM_NAME || 'our gym'}!</p>
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Schedule booking email sent to', bookingData.email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send schedule booking email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send schedule update email
const sendScheduleUpdateEmail = async (bookingData, changes) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: bookingData.email,
      subject: `Class Schedule Updated - ${process.env.GYM_NAME || 'Gym'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF9800;">Class Schedule Updated</h2>
          <p>Dear ${bookingData.member_name},</p>
          <p>Your class schedule has been updated. Here are the new details:</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Updated Class Details:</h3>
            <p><strong>Class:</strong> ${bookingData.category}</p>
            <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${bookingData.time}</p>
            <p><strong>Trainer:</strong> ${bookingData.trainer || 'TBA'}</p>
          </div>
          
          ${changes ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #495057; margin-top: 0;">Changes Made:</h4>
            <p>${changes}</p>
          </div>
          ` : ''}
          
          <p>If you have any questions about these changes, please contact us at ${process.env.CONTACT_PHONE || 'our gym'}.</p>
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Schedule update email sent to', bookingData.email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send schedule update email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send schedule cancellation email
const sendScheduleCancellationEmail = async (bookingData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: bookingData.email,
      subject: `Class Booking Cancelled - ${process.env.GYM_NAME || 'Gym'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Class Booking Cancelled</h2>
          <p>Dear ${bookingData.member_name},</p>
          <p>Your class booking has been cancelled. We're sorry for any inconvenience.</p>
          
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #721c24; margin-top: 0;">Cancelled Class Details:</h3>
            <p><strong>Class:</strong> ${bookingData.category}</p>
            <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${bookingData.time}</p>
            <p><strong>Trainer:</strong> ${bookingData.trainer || 'TBA'}</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>💡 Need to reschedule?</strong> Contact us at ${process.env.CONTACT_PHONE || 'our gym'} to book a new class.</p>
          </div>
          
          <p>We hope to see you in another class soon!</p>
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Schedule cancellation email sent to', bookingData.email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send schedule cancellation email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (paymentData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: paymentData.email,
      subject: `Payment Confirmation - ${process.env.GYM_NAME || 'Gym'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Payment Confirmation</h2>
          <p>Dear ${paymentData.name},</p>
          <p>Thank you for your payment! We have successfully received your payment and updated your account.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Payment Details:</h3>
            <p><strong>Member ID:</strong> ${paymentData.member_id}</p>
            <p><strong>Payment Amount:</strong> ₹${paymentData.payment_amount}</p>
            <p><strong>Payment Date:</strong> ${new Date(paymentData.payment_date).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${paymentData.payment_method || 'Cash'}</p>
            <p><strong>Previous Due:</strong> ₹${paymentData.previous_due}</p>
            <p><strong>Remaining Due:</strong> ₹${paymentData.remaining_due}</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>📊 Account Summary:</strong></p>
            <p>Total Amount: ₹${paymentData.total_amount}</p>
            <p>Total Paid: ₹${paymentData.total_paid}</p>
            <p>Remaining Due: ₹${paymentData.remaining_due}</p>
            ${paymentData.remaining_due > 0 ? 
              '<p style="color: #ff9800;"><strong>Note:</strong> You still have a remaining balance. Please clear it before your membership expires.</p>' :
              '<p style="color: #4CAF50;"><strong>✅ Great!</strong> Your account is fully paid up!</p>'
            }
          </div>
          
          <p>Thank you for being a valued member of ${process.env.GYM_NAME || 'our gym'}!</p>
          <p>If you have any questions about this payment, please contact us at ${process.env.CONTACT_PHONE || 'our gym'}.</p>
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Payment confirmation email sent to', paymentData.email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send payment confirmation email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send custom email
const sendCustomEmail = async (to, subject, message) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${message}
          <p>Best regards,<br>The ${process.env.GYM_NAME || 'Gym'} Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Custom email sent to', to);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send custom email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendExpiryReminderEmail,
  sendScheduleBookingEmail,
  sendScheduleUpdateEmail,
  sendScheduleCancellationEmail,
  sendPaymentConfirmationEmail,
  sendCustomEmail
};
