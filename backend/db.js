// backend/db.js
const mysql = require("mysql2/promise");
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+05:30",
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const db = mysql.createPool(poolConfig);


db.getConnection()
  .then(() => console.log("✅ Connected to MySQL database."))
  .catch((err) => console.error("❌ MySQL connection error:", err));

module.exports = db;