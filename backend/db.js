// backend/db.js
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "shazeb786", // your actual MySQL password
  database: "gym_db",     // your actual database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


db.getConnection()
  .then(() => console.log("✅ Connected to MySQL database."))
  .catch((err) => console.error("❌ MySQL connection error:", err));

module.exports = db;