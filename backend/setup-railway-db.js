/**
 * Run railway-init.sql against your Railway MySQL database.
 * Uses DB_* variables from backend/.env
 *
 * Usage: node setup-railway-db.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  };

  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  if (!config.host || !config.user || !config.password || !config.database) {
    console.error('❌ Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL in backend/.env');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'db', 'railway-init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log(`🔧 Connecting to ${config.host}:${config.port}...`);

  const connection = await mysql.createConnection(config);
  console.log('✅ Connected. Running railway-init.sql...');

  await connection.query(sql);

  const [tables] = await connection.query('SHOW TABLES');
  console.log(`✅ Done! ${tables.length} tables created:`);
  tables.forEach((row) => console.log('  -', Object.values(row)[0]));

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
