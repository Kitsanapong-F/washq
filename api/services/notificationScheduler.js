const cron = require('node-cron');
const pool = require('../config/db');
const { sendBookingReminderEmail } = require('./emailService');

// ฟังก์ชันแปลงวันเวลาปัจจุบันตามเขตเวลาประเทศไทย (Asia/Bangkok)
const getThaiCurrentDateTime = () => {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now); // 'YYYY-MM-DD'
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = parseInt(timeParts.find((p) => p.type === 'hour').value, 10);
  const minute = parseInt(timeParts.find((p) => p.type === 'minute').value, 10);

  return { dateStr, hour, minute, totalMinutes: hour * 60 + minute };
};

// ตรวจสอบและเพิ่มคอลัมน์ reminder_sent พร้อมอัปเดตอีเมลของผู้ใช้ทุกคนเป็น 09chaisu@gmail.com (Safe Migration)
const ensureReminderColumnExists = async () => {
  try {
    // 1. ตรวจสอบคอลัมน์ reminder_sent ในตาราง bookings
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'bookings' 
         AND COLUMN_NAME = 'reminder_sent'`
    );

    if (cols.length === 0) {
      await pool.query(`ALTER TABLE bookings ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0`);
      console.log(`[Notification Scheduler] 🛠️ เพิ่มคอลัมน์ 'reminder_sent' ในตาราง bookings สำเร็จ`);
    }

    // 2. ปลด UNIQUE constraint ของ email ในตาราง users (ถ้ามี) เพื่อให้ทุกคนใช้อีเมลเดียวกันได้
    try {
      await pool.query(`ALTER TABLE users DROP INDEX email`);
    } catch (e) {
      // ดัชนีอาจไม่มีอยู่แล้วหรือไม่ใช่ unique
    }

    // 3. ปรับอีเมลผู้ใช้ทุกคนเป็นอีเมลสำหรับรับการแจ้งเตือน
    const defaultNotificationEmail = process.env.NOTIFICATION_RECIPIENT_EMAIL || '09chaisu@gmail.com';
    await pool.query(`UPDATE users SET email = ?`, [defaultNotificationEmail]);
    console.log(`[Notification Scheduler] 📧 ตั้งค่าอีเมลแจ้งเตือนของทุกคนเป็น: ${defaultNotificationEmail}`);
  } catch (error) {
    console.error(`[Notification Scheduler] ⚠️ ไม่สามารถตรวจสอบโครงสร้างตารางได้:`, error.message);
  }
};

/**
 * ฟังก์ชันตรวจสอบและส่งอีเมลแจ้งเตือนสำหรับคิวที่ถึงเวลา
 */
const checkAndSendBookingReminders = async () => {
  try {
    const { dateStr, hour, minute, totalMinutes } = getThaiCurrentDateTime();

    // ดึงรายการจองวันนี้ที่ยัง active และยังไม่ได้ส่งอีเมลแจ้งเตือน
    const query = `
      SELECT 
        b.booking_id,
        b.booking_code,
        DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date,
        b.time_slot,
        u.name AS student_name,
        u.student_code,
        u.email,
        m.machine_name,
        m.type AS machine_type,
        m.location
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN machines m ON b.machine_id = m.machine_id
      WHERE DATE(b.booking_date) = ?
        AND b.status = 'active'
        AND (b.reminder_sent = 0 OR b.reminder_sent IS NULL)
    `;

    const [rows] = await pool.query(query, [dateStr]);

    if (!rows || rows.length === 0) {
      return;
    }

    for (const booking of rows) {
      // ตัวอย่าง time_slot: "08:00 - 09:00 น." หรือ "14:00 - 15:00"
      const matchStart = String(booking.time_slot).match(/(\d{1,2}):(\d{2})/);
      if (!matchStart) continue;

      const slotStartHour = parseInt(matchStart[1], 10);
      const slotStartMinute = parseInt(matchStart[2], 10);
      const slotStartTotalMinutes = slotStartHour * 60 + slotStartMinute;

      // ตรวจสอบเวลาสิ้นสุดของรอบ
      const matchEnd = String(booking.time_slot).match(/-\s*(\d{1,2}):(\d{2})/);
      let slotEndTotalMinutes = slotStartTotalMinutes + 60; // ค่าเริ่มต้น 60 นาที
      if (matchEnd) {
        const slotEndHour = parseInt(matchEnd[1], 10);
        const slotEndMinute = parseInt(matchEnd[2], 10);
        slotEndTotalMinutes = slotEndHour * 60 + slotEndMinute;
      }

      // เงื่อนไข: ถึงเวลาเริ่มต้นของรอบแล้ว และยังไม่หมดรอบเวลา
      const isTimeToNotify = totalMinutes >= slotStartTotalMinutes && totalMinutes < slotEndTotalMinutes;

      if (isTimeToNotify) {
        console.log(`[Notification Scheduler] 🔔 ถึงเวลาของคิว ${booking.booking_code} (${booking.time_slot}) กำลังส่งอีเมลแจ้งเตือน...`);

        // ส่งอีเมลแจ้งเตือน (ส่งหา 09chaisu@gmail.com สำหรับทุกคนตามที่กำหนด)
        const sendResult = await sendBookingReminderEmail({
          email: process.env.NOTIFICATION_RECIPIENT_EMAIL || booking.email || '09chaisu@gmail.com',
          studentName: booking.student_name,
          studentCode: booking.student_code,
          bookingCode: booking.booking_code,
          machineName: booking.machine_name,
          machineType: booking.machine_type,
          location: booking.location,
          bookingDate: booking.booking_date,
          timeSlot: booking.time_slot,
        });

        // อัปเดตสถานะในฐานข้อมูลว่าส่งแจ้งเตือนแล้ว ป้องกันการส่งซ้ำ
        await pool.query(
          `UPDATE bookings SET reminder_sent = 1 WHERE booking_id = ?`,
          [booking.booking_id]
        );
      }
    }
  } catch (error) {
    console.error(`[Notification Scheduler] ❌ เกิดข้อผิดพลาดขณะตรวจสอบคิวแจ้งเตือน:`, error.message);
  }
};

/**
 * เริ่มต้นระบบตรวจสอบการแจ้งเตือนอัตโนมัติ
 */
const startNotificationScheduler = async () => {
  console.log(`[Notification Scheduler] ⏰ เริ่มต้นระบบแจ้งเตือนอีเมลอัตโนมัติ (ตรวจเช็คทุกนาที)...`);

  // ตรวจสอบโครงสร้างตารางก่อนเริ่ม Cron Job
  await ensureReminderColumnExists();

  // ทำการตรวจสอบทันที 1 ครั้งเมื่อเปิดระบบ
  await checkAndSendBookingReminders();

  // ตั้งเวลาตรวจสอบทุกๆ 1 นาที (Cron Expression: * * * * *)
  cron.schedule('* * * * *', async () => {
    await checkAndSendBookingReminders();
  });
};

module.exports = {
  startNotificationScheduler,
  checkAndSendBookingReminders,
  getThaiCurrentDateTime,
};
