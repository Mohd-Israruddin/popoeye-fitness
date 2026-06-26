// Script to verify biometric tables structure
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'gym_db',
    });

    console.log('🔍 Verifying biometric integration tables...\n');

    // Check biometric_devices table
    const [devicesColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometric_devices'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'gym_db']);

    console.log('📋 biometric_devices table:');
    devicesColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check member_biometric_ids table
    const [memberColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'member_biometric_ids'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'gym_db']);

    console.log('\n📋 member_biometric_ids table:');
    memberColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check attendance_logs table
    const [attendanceColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance_logs'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'gym_db']);

    console.log('\n📋 attendance_logs table:');
    attendanceColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check indexes
    const [indexes] = await connection.query(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('biometric_devices', 'member_biometric_ids', 'attendance_logs')
      ORDER BY TABLE_NAME, INDEX_NAME
    `, [process.env.DB_NAME || 'gym_db']);

    console.log('\n📊 Indexes:');
    let currentTable = '';
    indexes.forEach(idx => {
      if (currentTable !== idx.TABLE_NAME) {
        console.log(`\n   ${idx.TABLE_NAME}:`);
        currentTable = idx.TABLE_NAME;
      }
      console.log(`     - ${idx.INDEX_NAME} on ${idx.COLUMN_NAME}`);
    });

    // Count records
    const [deviceCount] = await connection.query('SELECT COUNT(*) as count FROM biometric_devices');
    const [memberCount] = await connection.query('SELECT COUNT(*) as count FROM member_biometric_ids');
    const [attendanceCount] = await connection.query('SELECT COUNT(*) as count FROM attendance_logs');

    console.log('\n📈 Table Records:');
    console.log(`   - biometric_devices: ${deviceCount[0].count} devices`);
    console.log(`   - member_biometric_ids: ${memberCount[0].count} enrollments`);
    console.log(`   - attendance_logs: ${attendanceCount[0].count} records`);

    console.log('\n✅ All biometric tables verified successfully!');

  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyTables();

