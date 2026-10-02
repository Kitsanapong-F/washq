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
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'washq_db';

async function initDatabase() {
  console.log(`⏳ กำลังเชื่อมต่อ MySQL Server ที่ ${DB_HOST}:${DB_PORT} (User: ${DB_USER})...`);
  
  let connection;
  try {
    // เชื่อมต่อไปยัง MySQL Server โดยยังไม่ระบุฐานข้อมูล
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
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
    console.log(`📦 ตรวจสอบและสร้างฐานข้อมูล '${DB_NAME}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    // อ่าน schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log(`🔨 กำลังสร้าง Tables จาก database/schema.sql...`);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log(`✅ สร้าง Tables สำเร็จ`);
    } else {
      console.warn(`⚠️ ไม่พบไฟล์ ${schemaPath}`);
    }

    // อ่าน seeders.sql
    const seedersPath = path.resolve(__dirname, '../../database/seeders.sql');
    if (fs.existsSync(seedersPath)) {
      console.log(`🌱 กำลังนำเข้าข้อมูลทดสอบจาก database/seeders.sql...`);
      const seedersSql = fs.readFileSync(seedersPath, 'utf8');
      await connection.query(seedersSql);
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
