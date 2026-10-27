const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const nodemailer = require('nodemailer');

const recipient = process.argv[2] || process.env.NOTIFICATION_RECIPIENT_EMAIL || '09chaisu@gmail.com';

console.log('====================================================');
console.log('📧 WashQ - ระบบทดสอบการส่งอีเมลจริง (Live SMTP Test)');
console.log('====================================================');
console.log(`📤 ผู้ส่ง (From):     ${process.env.EMAIL_FROM || process.env.SMTP_USER}`);
console.log(`📬 ผู้รับ (To):       ${recipient}`);
console.log(`⚙️ เซิร์ฟเวอร์ SMTP:   ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
console.log(`👤 บัญชีผู้ส่ง SMTP:  ${process.env.SMTP_USER}`);
console.log('----------------------------------------------------');
console.log('⏳ กำลังเชื่อมต่อ Gmail SMTP และส่งอีเมล...');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const mailOptions = {
  from: `"WashQ Smart Laundry" <${process.env.SMTP_USER}>`,
  to: recipient,
  subject: '🔔 ทดสอบระบบส่งอีเมลแจ้งเตือน WashQ สำเร็จ!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #8B5A2B; text-align: center;">WashQ Smart Laundry System</h2>
      <p style="text-align: center; font-size: 14px; color: #555;">ระบบจองคิวเครื่องซักผ้าอัจฉริยะ (หอพักนักศึกษา)</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <div style="background-color: #fcf8f2; border: 1px dashed #8B5A2B; padding: 15px; border-radius: 8px; text-align: center;">
        <h3 style="color: #27ae60; margin: 0 0 10px 0;">🎉 ส่งอีเมลสำเร็จแล้ว 100%!</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>ผู้รับ:</strong> ${recipient}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>เวลาที่ส่ง:</strong> ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #7f8c8d;">ระบบอีเมลแจ้งเตือนคิวเครื่องซักผ้าพร้อมใช้งานสำหรับการแจ้งเตือนนักศึกษา</p>
      </div>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 25px;">อีเมลนี้ส่งอัตโนมัติจากระบบ WashQ ทดสอบระบบส่งจริง</p>
    </div>
  `,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ ส่งอีเมลไม่สำเร็จ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } else {
    console.log('🎉 ส่งอีเมลจริงสำเร็จเรียบร้อยแล้ว!');
    console.log('🆔 Message ID:', info.messageId);
    console.log(`📬 เช็คอีเมลได้เลยที่: ${recipient} (หากไม่เจอให้ดูที่กล่องข้อความขยะ/Spam ด้วยนะครับ)`);
    console.log('====================================================');
    process.exit(0);
  }
});
