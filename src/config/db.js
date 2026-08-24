const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 25691,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+00:00',
  dateStrings: true,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = { pool };
