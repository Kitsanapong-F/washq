const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

let DB_HOST = process.env.DB_HOST || 'localhost';
let isExpiredAiven = DB_HOST === 'washq-chaisu-e44a.c.aivencloud.com';

if (isExpiredAiven) {
  // Cloud host ที่ปิดตัวไปแล้ว ให้สลับมาใช้ localhost อัตโนมัติเพื่อป้องกันระบบขัดข้อง
  DB_HOST = 'localhost';
}

const isCloudDB = DB_HOST && !['localhost', '127.0.0.1'].includes(DB_HOST);
const useSSL = process.env.DB_SSL === 'true' || isCloudDB;

let dbPort = 3306;
if (DB_HOST === 'localhost' || DB_HOST === '127.0.0.1') {
  dbPort = (process.env.DB_PORT && Number(process.env.DB_PORT) !== 26081) ? Number(process.env.DB_PORT) : 3306;
} else if (process.env.DB_PORT) {
  dbPort = Number(process.env.DB_PORT);
} else if (DB_HOST.includes('aivencloud.com')) {
  dbPort = 26081;
}

let dbUser = process.env.DB_USER || 'root';
if (DB_HOST === 'localhost' || DB_HOST === '127.0.0.1') {
  dbUser = (process.env.DB_USER === 'defaultdb' || !process.env.DB_USER) ? 'root' : process.env.DB_USER;
} else if (dbUser === 'defaultdb' || (DB_HOST.includes('aivencloud.com') && dbUser === 'root')) {
  dbUser = 'avnadmin';
}

let dbName = process.env.DB_NAME || 'washq_db';
if (DB_HOST === 'localhost' || DB_HOST === '127.0.0.1') {
  dbName = (process.env.DB_NAME === 'defaultdb' || !process.env.DB_NAME) ? 'washq_db' : process.env.DB_NAME;
} else if (DB_HOST.includes('aivencloud.com') && (dbName === 'washq_db' || !process.env.DB_NAME)) {
  dbName = 'defaultdb';
}

let dbPassword = process.env.DB_PASSWORD || '';
if ((DB_HOST === 'localhost' || DB_HOST === '127.0.0.1') && dbPassword.startsWith('AVNS_')) {
  // ถ้ารหัสผ่านยังเป็นค่าของ Cloud ที่ตายแล้ว ให้เคลียร์เป็นค่าว่างสำหรับ local root
  dbPassword = '';
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
