const db = require('./backend/db');

async function testAdminVerification() {
  console.log('Testing admin code verification...');
  
  // Test admin code
  const adminCode = '1234';
  console.log(`Testing admin code: ${adminCode}`);
  
  const [adminRows] = await db.query('SELECT * FROM admin_settings WHERE admin_code = ?', [adminCode]);
  console.log('Admin records found:', adminRows.length);
  
  if (adminRows.length > 0) {
    console.log('✅ Admin code verified successfully');
  } else {
    console.log('❌ Admin code not found');
  }
  
  // Test staff code (you'll need to replace with actual staff code)
  console.log('\nTesting staff code...');
  const [staffRows] = await db.query('SELECT * FROM staff WHERE staff_code IS NOT NULL LIMIT 1');
  if (staffRows.length > 0) {
    const staffCode = staffRows[0].staff_code;
    console.log(`Testing staff code: ${staffCode}`);
    
    const [staffCheck] = await db.query('SELECT * FROM staff WHERE staff_code = ?', [staffCode]);
    console.log('Staff records found:', staffCheck.length);
    
    if (staffCheck.length > 0) {
      console.log('✅ Staff code verified successfully');
    } else {
      console.log('❌ Staff code not found');
    }
  } else {
    console.log('No staff codes found in database');
  }
  
  process.exit(0);
}

testAdminVerification().catch(console.error); 