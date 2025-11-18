const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up database...');
    
    // Create connection without specifying database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' created/verified`);

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`✅ Connected to database '${process.env.DB_NAME}'`);

    // Read and execute the complete schema
    const schemaPath = path.join(__dirname, '..', 'complete-gym-database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
            console.warn(`⚠️ Warning: ${error.message}`);
          }
        }
      }
    }
    
    console.log('✅ Database schema created successfully');

    // Run migration if needed
    const migrationPath = path.join(__dirname, 'db', 'migrate-whatsapp-to-email.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('🔄 Running migration...');
      const migration = fs.readFileSync(migrationPath, 'utf8');
      const migrationStatements = migration.split(';').filter(stmt => stmt.trim());
      
      for (const statement of migrationStatements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
              console.warn(`⚠️ Migration warning: ${error.message}`);
            }
          }
        }
      }
      console.log('✅ Migration completed');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
