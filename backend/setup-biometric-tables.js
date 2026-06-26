// Script to set up biometric integration database tables
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupBiometricTables() {
  let connection;
  
  try {
    console.log('🔧 Setting up biometric integration tables...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'gym_db',
      multipleStatements: true
    });

    console.log(`✅ Connected to database '${process.env.DB_NAME || 'gym_db'}'`);

    // Read and execute the biometric tables SQL
    const sqlPath = path.join(__dirname, 'db', 'create-biometric-tables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the entire SQL file as multiple statements
    // MySQL2 supports multiple statements when multipleStatements: true
    try {
      await connection.query(sql);
      console.log('✅ Biometric tables SQL executed successfully');
    } catch (error) {
      // If it fails, try executing statements one by one
      console.log('⚠️  Trying to execute statements individually...');
      
      // Remove comments and split by semicolon
      const cleanSql = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
        .join('\n');
      
      // Split by semicolon but keep CREATE TABLE blocks together
      const statements = [];
      let currentStatement = '';
      let inCreateTable = false;
      
      for (const line of cleanSql.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        currentStatement += line + '\n';
        
        if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
          inCreateTable = true;
        }
        
        if (trimmed.endsWith(';') && !inCreateTable) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        } else if (trimmed.endsWith(';') && inCreateTable && trimmed.includes(')')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
          inCreateTable = false;
        }
      }
      
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      console.log(`📝 Found ${statements.length} SQL statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement && statement.length > 5) { // Minimum valid statement
          try {
            await connection.query(statement);
            console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
          } catch (error) {
            // Ignore errors for tables/indexes that already exist
            if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                error.code === 'ER_DUP_KEYNAME' ||
                error.code === 'ER_DUP_ENTRY' ||
                error.message.includes('already exists') ||
                error.message.includes('Duplicate') ||
                error.message.includes('Duplicate key')) {
              console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
            } else {
              console.error(`❌ Error executing statement ${i + 1}:`, error.message);
              // Don't throw, continue with other statements
            }
          }
        }
      }
    }

    // Check if domain support migration is needed
    const migrationPath = path.join(__dirname, 'db', 'add-domain-support.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('\n🔧 Checking for domain support migration...');
      
      // Check if server_domain column exists
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'biometric_devices' 
        AND COLUMN_NAME = 'server_domain'
      `, [process.env.DB_NAME || 'gym_db']);

      if (columns.length === 0) {
        console.log('📝 Applying domain support migration...');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        const migrationStatements = migrationSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of migrationStatements) {
          if (statement.trim()) {
            try {
              await connection.query(statement);
            } catch (error) {
              if (error.code === 'ER_DUP_KEYNAME' || 
                  error.message.includes('already exists') ||
                  error.message.includes('Duplicate')) {
                console.log(`⚠️  Migration statement skipped (already exists)`);
              } else {
                console.warn(`⚠️  Migration warning: ${error.message.split('\n')[0]}`);
              }
            }
          }
        }
        console.log('✅ Domain support migration applied');
      } else {
        console.log('✅ Domain support already exists');
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('biometric_devices', 'member_biometric_ids', 'attendance_logs')
    `, [process.env.DB_NAME || 'gym_db']);

    console.log(`✅ Found ${tables.length} biometric tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    if (tables.length === 3) {
      console.log('\n🎉 Biometric integration tables set up successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Start your backend server: npm start');
      console.log('   2. Go to Biometric → Devices in your software');
      console.log('   3. Add your biometric device');
      console.log('   4. Configure device push service');
    } else {
      console.warn(`⚠️  Expected 3 tables, found ${tables.length}`);
    }

  } catch (error) {
    console.error('❌ Error setting up biometric tables:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
setupBiometricTables()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

