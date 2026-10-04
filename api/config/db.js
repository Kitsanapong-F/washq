const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const isCloudDB = process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST);
const useSSL = process.env.DB_SSL === 'true' || isCloudDB;

const dbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : (process.env.PORT && Number(process.env.PORT) !== 5000 && Number(process.env.PORT) !== 3000 ? Number(process.env.PORT) : 3306);

const dbUser = (process.env.DB_USER === 'defaultdb' && process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))
  ? 'avnadmin'
  : (process.env.DB_USER || 'root');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  user: dbUser,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'washq_db',
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
