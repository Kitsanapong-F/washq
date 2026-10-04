const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 1. ตรวจสอบไฟล์ .env หากยังไม่มี ให้คัดลอกจาก .env.example อัตโนมัติ
const envPath = path.resolve(__dirname, '../.env');
const envExamplePath = path.resolve(__dirname, '../.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('📄 สร้างไฟล์ api/.env จาก api/.env.example เรียบร้อยแล้ว');
}

require('dotenv').config({ path: envPath });

const DB_HOST = process.env.DB_HOST || 'localhost';
// หากไม่มี DB_PORT แต่มี PORT ที่เป็นพอร์ตฐานข้อมูล (เช่น 26081) ให้ปรับให้อัตโนมัติ
const DB_PORT = process.env.DB_PORT 
  ? Number(process.env.DB_PORT) 
  : (process.env.PORT && Number(process.env.PORT) !== 5000 && Number(process.env.PORT) !== 3000 ? Number(process.env.PORT) : 3306);
// หากเชื่อมต่อไป Aiven และใส่ user เป็น defaultdb ให้ปรับเป็น avnadmin อัตโนมัติ
const DB_USER = (process.env.DB_USER === 'defaultdb' && DB_HOST.includes('aivencloud.com')) ? 'avnadmin' : (process.env.DB_USER || 'root');
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'washq_db';

const isCloudDB = DB_HOST && !['localhost', '127.0.0.1'].includes(DB_HOST);
const useSSL = process.env.DB_SSL === 'true' || isCloudDB;

async function initDatabase() {
  console.log(`⏳ กำลังเชื่อมต่อ MySQL Server ที่ ${DB_HOST}:${DB_PORT} (User: ${DB_USER})...`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      multipleStatements: true
    });
  } catch (err) {
    console.error(`❌ ไม่สามารถเชื่อมต่อ MySQL Server ได้:`, err.message);
    console.error(`💡 คำแนะนำ:`);
    console.error(`   1. ตรวจสอบว่า MySQL Server กำลังทำงานอยู่หรือไม่ (เช่น XAMPP, Docker หรือ Local MySQL Service)`);
    console.error(`   2. ตรวจสอบ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD ในไฟล์ api/.env ให้ถูกต้อง`);
    process.exit(1);
  }

  try {
    console.log(`📦 ตรวจสอบและเชื่อมต่อฐานข้อมูล '${DB_NAME}'...`);
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    } catch (e) {
      // สำหรับ Cloud DB (เช่น Aiven) ที่ไม่อนุญาตให้รัน CREATE DATABASE ให้ข้ามไป USE
    }
    await connection.query(`USE \`${DB_NAME}\`;`);

    // อ่าน schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log(`🔨 กำลังสร้าง Tables จาก database/schema.sql...`);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      // ลบคำสั่ง CREATE DATABASE และ USE ออก เพื่อให้ทำงานได้ทั้ง Local และ Cloud DB (เช่น Aiven defaultdb)
      const cleanSchemaSql = schemaSql
        .replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/gi, '')
        .replace(/USE\s+[^;]+;/gi, '');
      await connection.query(cleanSchemaSql);
      console.log(`✅ สร้าง Tables สำเร็จ`);
    } else {
      console.warn(`⚠️ ไม่พบไฟล์ ${schemaPath}`);
    }

    // อ่าน seeders.sql
    const seedersPath = path.resolve(__dirname, '../../database/seeders.sql');
    if (fs.existsSync(seedersPath)) {
      console.log(`🌱 กำลังนำเข้าข้อมูลทดสอบจาก database/seeders.sql...`);
      const seedersSql = fs.readFileSync(seedersPath, 'utf8');
      const cleanSeedersSql = seedersSql.replace(/USE\s+[^;]+;/gi, '');
      await connection.query(cleanSeedersSql);
      console.log(`✅ นำเข้าข้อมูล Seeders สำเร็จ`);
    } else {
      console.warn(`⚠️ ไม่พบไฟล์ ${seedersPath}`);
    }

    console.log(`\n======================================================`);
    console.log(`🎉 เตรียมฐานข้อมูล WashQ พร้อมใช้งานเรียบร้อยแล้ว!`);
    console.log(`======================================================`);
    console.log(`👤 บัญชีทดสอบสำหรับเข้าสู่ระบบ (รหัสผ่านเริ่มต้น: 123456)`);
    console.log(`   - นักศึกษา 1:  รหัส '6512345678-9' | รหัสผ่าน '123456'`);
    console.log(`   - นักศึกษา 2:  รหัส '6512445890-1' | รหัสผ่าน '123456'`);
    console.log(`   - ผู้ดูแลระบบ: รหัส 'admin01'       | รหัสผ่าน '123456'`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error(`❌ เกิดข้อผิดพลาดในการรัน SQL Script:`, err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
