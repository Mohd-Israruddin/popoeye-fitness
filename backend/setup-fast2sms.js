/**
 * Fast2SMS setup helper
 * Run: node setup-fast2sms.js
 * Optional test send: node setup-fast2sms.js --test 9876543210
 */
require('dotenv').config();
const axios = require('axios');
const {
  isConfigured,
  sendWelcomeMessage,
  sendExpiryReminderMessage,
} = require('./services/whatsappService');

const API_KEY = process.env.FAST2SMS_API_KEY;

async function checkWallet() {
  if (!API_KEY || API_KEY.includes('your_')) {
    console.log('❌ FAST2SMS_API_KEY is missing in backend/.env\n');
    return false;
  }

  try {
    const { data } = await axios.post(
      'https://www.fast2sms.com/dev/wallet',
      {},
      { headers: { authorization: API_KEY } }
    );

    if (data?.return === true || data?.return === 'true') {
      console.log(`✅ Wallet balance: ₹${data.wallet}`);
      return true;
    }

    console.log('⚠️ Wallet response:', data);
    return false;
  } catch (err) {
    console.error('❌ Wallet check failed:', err.response?.data?.message || err.message);
    return false;
  }
}

async function fetchWhatsAppDetails() {
  try {
    const { data } = await axios.get('https://www.fast2sms.com/dev/dlt_manager/whatsapp', {
      params: { type: 'template', authorization: API_KEY },
    });

    if (!data?.success || !data?.data?.length) {
      console.log('⚠️ No WhatsApp numbers/templates found. Enable WhatsApp in Fast2SMS panel first.');
      return;
    }

    console.log('\n📱 WhatsApp account(s):\n');

    for (const account of data.data) {
      console.log(`  Phone Number ID: ${account.phone_number_id}`);
      console.log(`  Number: ${account.number}`);
      console.log(`  Business name: ${account.verified_name}`);
      console.log(`  Status: ${account.connection_status}`);

      if (!process.env.FAST2SMS_PHONE_NUMBER_ID || process.env.FAST2SMS_PHONE_NUMBER_ID.includes('your_')) {
        console.log(`  → Add to .env: FAST2SMS_PHONE_NUMBER_ID=${account.phone_number_id}`);
      }

      if (account.templates?.length) {
        console.log('\n  Approved templates:');
        for (const t of account.templates) {
          const body = t.components?.find((c) => c.type === 'BODY');
          const preview = body?.text?.replace(/\s+/g, ' ').slice(0, 60) || '';
          console.log(`    message_id: ${t.message_id} | ${t.template_name} | ${t.category} | vars: ${t.var_count}`);
          if (preview) console.log(`      "${preview}..."`);
        }
        console.log('\n  → Map message_id values to .env:');
        console.log('     FAST2SMS_TEMPLATE_WELCOME=<message_id for welcome>');
        console.log('     FAST2SMS_TEMPLATE_EXPIRY=<message_id for expiry reminder>');
      } else {
        console.log('\n  ⚠️ No templates yet. Create 2 Utility templates in Fast2SMS WhatsApp Manager.');
      }

      console.log('');
    }
  } catch (err) {
    console.error('❌ Could not fetch WhatsApp details:', err.response?.data?.message || err.message);
  }
}

async function runTestSend(testPhone) {
  if (!isConfigured()) {
    console.log('❌ Configure FAST2SMS_API_KEY and FAST2SMS_PHONE_NUMBER_ID first.');
    return;
  }

  if (!process.env.FAST2SMS_TEMPLATE_WELCOME) {
    console.log('❌ Set FAST2SMS_TEMPLATE_WELCOME in .env first.');
    return;
  }

  console.log(`\n📤 Sending test welcome WhatsApp to ${testPhone}...`);

  const result = await sendWelcomeMessage({
    id: 0,
    name: 'Test Member',
    phone: testPhone,
    member_id: 'TEST001',
    package: '1 month',
    join_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    total_amount: 1000,
    paid_amount: 500,
  });

  if (result.success) {
    console.log('✅ Test message sent! Request ID:', result.requestId);
  } else {
    console.log('❌ Test failed:', result.error);
  }
}

async function main() {
  console.log('🔧 Fast2SMS WhatsApp Setup Check\n');

  const walletOk = await checkWallet();
  if (walletOk) await fetchWhatsAppDetails();

  console.log('\n📋 Required .env values:');
  console.log(`  FAST2SMS_API_KEY=${API_KEY?.includes('your_') ? '(not set)' : '✓ set'}`);
  console.log(`  FAST2SMS_PHONE_NUMBER_ID=${process.env.FAST2SMS_PHONE_NUMBER_ID?.includes('your_') ? '(not set)' : process.env.FAST2SMS_PHONE_NUMBER_ID || '(not set)'}`);
  console.log(`  FAST2SMS_TEMPLATE_WELCOME=${process.env.FAST2SMS_TEMPLATE_WELCOME || '(not set)'}`);
  console.log(`  FAST2SMS_TEMPLATE_EXPIRY=${process.env.FAST2SMS_TEMPLATE_EXPIRY || '(not set)'}`);
  console.log(`  GYM_NAME=${process.env.GYM_NAME}`);
  console.log(`  CONTACT_PHONE=${process.env.CONTACT_PHONE}`);

  const testPhone = process.argv.find((a) => a.startsWith('--test'));
  if (testPhone) {
    const phone = process.argv[process.argv.indexOf('--test') + 1];
    if (phone) await runTestSend(phone);
  } else {
    console.log('\n💡 After filling .env, test with:');
    console.log('   node setup-fast2sms.js --test YOUR_10_DIGIT_PHONE');
  }
}

main().catch(console.error);
