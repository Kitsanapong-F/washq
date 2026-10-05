/**
 * Script: test-concurrent-booking.js
 * วัตถุประสงค์: จำลองสถานการณ์ผู้ใช้งาน 5 คน กดจองเครื่องซักผ้าเครื่องเดียวกัน
 * ในวันและช่วงเวลาเดียวกันพร้อมกันเสี้ยววินาที (Race Condition / Concurrency Test)
 * 
 * ผลลัพธ์ที่ถูกต้อง (Expected Result):
 * - คำขอแรกต้องจองสำเร็จ (HTTP 201) เพียง 1 คนเท่านั้น
 * - อีก 4 คำขอต้องถูกปฏิเสธ (HTTP 400) ด้วยข้อความ "ช่วงเวลานี้ถูกจองไปแล้ว"
 * - ป้องกันปัญหาการจองซ้ำซ้อน (No Double-Booking) ได้อย่างสมบูรณ์แบบ
 */

const http = require('http');
const pool = require('../config/db');
const { app, server } = require('../server');

const TEST_MACHINE_ID = 3;
const TEST_DATE = '2026-10-19';
const TEST_SLOT = '16:00 - 17:00 น.';
const NUM_CONCURRENT_USERS = 5;

// ฟังก์ชันส่ง Request จองคิวแบบอะซิงโครนัส
function sendBookingRequest(port, userId) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      user_id: userId,
      machine_id: TEST_MACHINE_ID,
      booking_date: TEST_DATE,
      time_slot: TEST_SLOT
    });

    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const durationMs = Date.now() - startTime;
        let json = {};
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({
          userId,
          status: res.statusCode,
          durationMs,
          body: json
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        userId,
        status: 500,
        error: err.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runConcurrentTest() {
  console.log('\n============================================================');
  console.log('⚡ WASHQ - SPRINT 3: CONCURRENT BOOKING TEST (ทดสอบการจองพร้อมกัน)');
  console.log('============================================================');
  console.log(`📌 พารามิเตอร์การทดสอบ:`);
  console.log(`   - รหัสเครื่องซักผ้า: เครื่องที่ ${TEST_MACHINE_ID}`);
  console.log(`   - วันที่จอง:         ${TEST_DATE}`);
  console.log(`   - ช่วงเวลา:         ${TEST_SLOT}`);
  console.log(`   - จำนวนคำขอพร้อมกัน: ${NUM_CONCURRENT_USERS} คน (จำลองกดพร้อมกันในเสี้ยววินาที)`);
  console.log('------------------------------------------------------------');

  let testServer;
  let testPort = 5055;

  try {
    // 1. เคลียร์คิวเดิมของช่วงเวลานี้ออกก่อน (ถ้ามี)
    await pool.query(
      'DELETE FROM bookings WHERE machine_id = ? AND booking_date = ? AND time_slot = ?',
      [TEST_MACHINE_ID, TEST_DATE, TEST_SLOT]
    );

    // 2. เปิดเซิร์ฟเวอร์ชั่วคราวบนพอร์ตเฉพาะสำหรับทดสอบ
    await new Promise((resolve) => {
      testServer = app.listen(testPort, '127.0.0.1', () => {
        resolve();
      });
    });

    console.log(`⏳ กำลังยิงคำขอ ${NUM_CONCURRENT_USERS} รายการพร้อมกัน (Promise.all)...`);

    // 3. ยิงคำขอ 5 คนพร้อมกันเป๊ะๆ ด้วย Promise.all
    const userIds = [1, 2, 1, 2, 1]; // จำลอง User หลายๆ คน
    const promises = userIds.map((uid, index) => sendBookingRequest(testPort, uid));
    const results = await Promise.all(promises);

    console.log('\n📊 รายงานผลลัพธ์คำขอแต่ละรายการ:');
    let successCount = 0;
    let rejectedCount = 0;
    let createdBookingCode = '';

    results.forEach((res, i) => {
      const isSuccess = res.status === 201;
      const statusIcon = isSuccess ? '✅ สำเร็จ (201)' : '❌ ถูกปฏิเสธ (400)';
      if (isSuccess) {
        successCount++;
        createdBookingCode = res.body.booking_code;
      } else {
        rejectedCount++;
      }

      console.log(`   [คำขอที่ ${i + 1}] ผู้ใช้ ID: ${res.userId} | สถานะ: ${statusIcon} | ใช้เวลา: ${res.durationMs}ms`);
      console.log(`              ข้อความ: "${res.body.message || ''}" ${res.body.booking_code ? `(รหัส: ${res.body.booking_code})` : ''}`);
    });

    // 4. ตรวจสอบในฐานข้อมูลจริงว่ามีบันทึกตรงกัน 1 รายการหรือไม่
    const [dbRows] = await pool.query(
      'SELECT booking_id, booking_code, user_id, status FROM bookings WHERE machine_id = ? AND booking_date = ? AND time_slot = ?',
      [TEST_MACHINE_ID, TEST_DATE, TEST_SLOT]
    );

    console.log('------------------------------------------------------------');
    console.log('🔍 สรุปการตรวจสอบผลลัพธ์ (Assertion Summary):');
    console.log(`   - จำนวนคำขอที่ได้รับอนุญาตให้จอง: ${successCount} รายการ (เป้าหมาย: 1)`);
    console.log(`   - จำนวนคำขอที่ถูกปฏิเสธป้องกันซ้ำ: ${rejectedCount} รายการ (เป้าหมาย: ${NUM_CONCURRENT_USERS - 1})`);
    console.log(`   - จำนวนแถวที่ถูกบันทึกลงฐานข้อมูลจริง: ${dbRows.length} แถว (เป้าหมาย: 1)`);

    // 5. Cleanup คิวที่สร้างขึ้นจากการทดสอบ
    if (createdBookingCode) {
      await pool.query('DELETE FROM bookings WHERE booking_code = ?', [createdBookingCode]);
    }

    if (successCount === 1 && rejectedCount === NUM_CONCURRENT_USERS - 1 && dbRows.length === 1) {
      console.log('\n🎉 PASS: ระบบผ่านการทดสอบการจองพร้อมกัน 100%!');
      console.log('   ไม่มีการจองซ้ำซ้อน (Zero Double-Booking) ระบบจัดการ Race Condition ได้อย่างถูกต้อง');
      console.log('============================================================\n');
      process.exitCode = 0;
    } else {
      console.error('\n🚨 FAIL: ระบบไม่ผ่านการทดสอบ พบการจองซ้ำซ้อนหรือผลลัพธ์ไม่ตรงตามเกณฑ์!');
      console.log('============================================================\n');
      process.exitCode = 1;
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดระหว่างรันการทดสอบ:', error);
    process.exitCode = 1;
  } finally {
    if (testServer) {
      testServer.close();
    }
    process.exit(process.exitCode || 0);
  }
}

runConcurrentTest();
