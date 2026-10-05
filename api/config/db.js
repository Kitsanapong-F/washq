const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

// ตัดช่องว่างส่วนเกิน (whitespace) เพื่อป้องกันข้อผิดพลาดเวลาอ่าน Environment Variables
const DB_HOST = (process.env.DB_HOST || 'localhost').trim();
const isCloudDB = DB_HOST && !['localhost', '127.0.0.1'].includes(DB_HOST);
const useSSL = process.env.DB_SSL === 'true' || isCloudDB;

let dbPort = 3306;
if (process.env.DB_PORT) {
  dbPort = Number(String(process.env.DB_PORT).trim());
} else if (DB_HOST.includes('aivencloud.com')) {
  dbPort = 26081;
}

let dbUser = (process.env.DB_USER || 'root').trim();
if (dbUser === 'defaultdb' || (DB_HOST.includes('aivencloud.com') && dbUser === 'root')) {
  dbUser = 'avnadmin';
}

let dbName = (process.env.DB_NAME || 'washq_db').trim();
if (DB_HOST.includes('aivencloud.com') && (dbName === 'washq_db' || !process.env.DB_NAME)) {
  dbName = 'defaultdb';
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: dbPort,
  user: dbUser,
  password: (process.env.DB_PASSWORD || '').trim(),
  database: dbName,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
