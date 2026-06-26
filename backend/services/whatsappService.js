const axios = require('axios');
require('dotenv').config();

const FAST2SMS_WHATSAPP_URL = 'https://www.fast2sms.com/dev/whatsapp';

function isConfigured() {
  return Boolean(
    process.env.FAST2SMS_API_KEY &&
    process.env.FAST2SMS_PHONE_NUMBER_ID
  );
}

function formatPhoneNumber(phone) {
  if (!phone) return null;

  let cleaned = String(phone).replace(/\D/g, '');

  if (cleaned.length === 10) {
    return cleaned;
  }

  const countryCode = process.env.FAST2SMS_COUNTRY_CODE || '91';
  if (cleaned.startsWith(countryCode) && cleaned.length > 10) {
    return cleaned.slice(countryCode.length);
  }

  return cleaned.length >= 10 ? cleaned.slice(-10) : null;
}

async function sendWhatsAppTemplate(messageId, phone, variables = []) {
  if (!isConfigured()) {
    throw new Error('Fast2SMS is not configured. Set FAST2SMS_API_KEY and FAST2SMS_PHONE_NUMBER_ID in .env');
  }

  if (!messageId) {
    throw new Error('WhatsApp template ID is not configured for this message type');
  }

  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  const params = {
    authorization: process.env.FAST2SMS_API_KEY,
    message_id: messageId,
    phone_number_id: process.env.FAST2SMS_PHONE_NUMBER_ID,
    numbers: formattedPhone,
  };

  if (variables.length > 0) {
    params.variables_values = variables.map((v) => (v == null ? '' : String(v))).join('|');
  }

  try {
    const { data } = await axios.get(FAST2SMS_WHATSAPP_URL, { params });

    if (data?.status === true || data?.return === true) {
      return { success: true, requestId: data.request_id || data.requestId };
    }

    const errorMessage = data?.message || data?.msg || JSON.stringify(data);
    console.error('❌ Fast2SMS WhatsApp error:', errorMessage);
    return { success: false, error: errorMessage };
  } catch (error) {
    const detail = error.response?.data?.message || error.message;
    console.error('❌ Fast2SMS WhatsApp request failed:', detail);
    return { success: false, error: detail };
  }
}

function getGymName() {
  return process.env.GYM_NAME || 'Our Gym';
}

function getContactPhone() {
  return process.env.CONTACT_PHONE || 'our gym';
}

// Template variable order must match your approved Fast2SMS WhatsApp templates
const sendWelcomeMessage = async (memberData) => {
  const result = await sendWhatsAppTemplate(
    process.env.FAST2SMS_TEMPLATE_WELCOME,
    memberData.phone,
    [
      memberData.name,
      memberData.member_id,
      memberData.package,
      memberData.join_date,
      memberData.expiry_date,
      memberData.total_amount,
      memberData.paid_amount,
      getGymName(),
    ]
  );

  if (result.success) {
    console.log('✅ Welcome WhatsApp sent to', memberData.phone);
  }
  return result;
};

const sendExpiryReminderMessage = async (memberData, daysLeft) => {
  const result = await sendWhatsAppTemplate(
    process.env.FAST2SMS_TEMPLATE_EXPIRY,
    memberData.phone,
    [
      memberData.name,
      daysLeft,
      memberData.expiry_date,
      getContactPhone(),
      getGymName(),
    ]
  );

  if (result.success) {
    console.log(`✅ Expiry WhatsApp sent to ${memberData.name} (${daysLeft} days left)`);
  }
  return result;
};

module.exports = {
  isConfigured,
  formatPhoneNumber,
  sendWhatsAppTemplate,
  sendWelcomeMessage,
  sendExpiryReminderMessage,
};
