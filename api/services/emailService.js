const nodemailer = require('nodemailer');

// ตรวจสอบการตั้งค่า SMTP จาก Environment Variables
const getEmailConfig = () => {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"WashQ Smart Laundry" <no-reply@washq.rmutl.ac.th>',
  };
};

// สร้าง Nodemailer Transporter
const createTransporter = () => {
  const config = getEmailConfig();

  // ตรวจสอบว่ามีการตั้งค่า User และ Password หรือไม่
  if (config.user && config.pass) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  // หากไม่มีการระบุ SMTP Credentials ให้ใช้ Mock Transporter ใน Development
  return null;
};

/**
 * เทมเพลต HTML อีเมลแจ้งเตือนเมื่อถึงเวลาคิวที่จอง
 */
const generateReminderEmailHtml = (data) => {
  const {
    studentName,
    studentCode,
    bookingCode,
    machineName,
    machineType,
    location,
    bookingDate,
    timeSlot,
  } = data;

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>แจ้งเตือนถึงเวลาคิวซักผ้า - WashQ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Prompt', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #8B5A2B; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">WashQ</h1>
              <p style="color: #fde68a; margin: 4px 0 0; font-size: 13px;">ระบบจองคิวเครื่องซักผ้าอัจฉริยะ (หอพักนักศึกษา)</p>
            </td>
          </tr>

          <!-- Notification Banner -->
          <tr>
            <td style="padding: 24px 28px 12px; text-align: center;">
              <div style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 50px; font-weight: 600; font-size: 13px; margin-bottom: 12px;">
                🔔 ถึงเวลาที่คุณจองไว้แล้ว!
              </div>
              <h2 style="margin: 0 0 8px; font-size: 20px; color: #1e293b;">สวัสดีคุณ ${studentName || 'นักศึกษา'}</h2>
              <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                รอบเวลาที่คุณจองเครื่องซักผ้าไว้ได้มาถึงแล้ว กรุณานำผ้าไปยังเครื่องซักผ้าที่ระบุด้านล่างนี้
              </p>
            </td>
          </tr>

          <!-- Ticket Card -->
          <tr>
            <td style="padding: 12px 28px 24px;">
              <div style="background-color: #fdfaf6; border: 1.5px dashed #d97706; border-radius: 16px; padding: 20px;">
                <div style="text-align: center; margin-bottom: 16px; border-bottom: 1px solid #fde68a; padding-bottom: 12px;">
                  <span style="font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">รหัสการจองคิว</span>
                  <div style="font-size: 26px; font-weight: 800; color: #b45309; letter-spacing: 1px; margin-top: 2px;">
                    ${bookingCode}
                  </div>
                </div>

                <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
                  <tr>
                    <td style="color: #78716c; width: 35%;">🧺 เครื่องซักผ้า:</td>
                    <td style="font-weight: 600; color: #292524;">${machineName} <span style="font-size: 12px; font-weight: normal; color: #78716c;">(${machineType || 'ฝาหน้า 10kg'})</span></td>
                  </tr>
                  <tr>
                    <td style="color: #78716c;">📍 สถานที่:</td>
                    <td style="font-weight: 600; color: #292524;">${location || 'อาคารหอพัก'}</td>
                  </tr>
                  <tr>
                    <td style="color: #78716c;">⏰ รอบเวลา:</td>
                    <td style="font-weight: 700; color: #b45309;">${timeSlot}</td>
                  </tr>
                  <tr>
                    <td style="color: #78716c;">📅 วันที่:</td>
                    <td style="font-weight: 600; color: #292524;">${bookingDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #78716c;">👤 รหัสนักศึกษา:</td>
                    <td style="color: #292524;">${studentCode || '-'}</td>
                  </tr>
                </table>
              </div>

              <!-- Tip Box -->
              <div style="margin-top: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
                  💡 <strong>ข้อแนะนำ:</strong> กรุณาเริ่มใช้งานภายในเวลาของรอบที่กำหนด หากไม่เริ่มใช้งานตามเวลา อาจส่งผลกระทบต่อผู้ใช้งานในรอบถัดไป
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ WashQ • มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8;">
                หากมีข้อสงสัยหรือปัญหาการใช้งาน กรุณาติดต่อผู้ดูแลหอพัก
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * ส่งอีเมลแจ้งเตือนเมื่อถึงเวลาจอง
 */
const sendBookingReminderEmail = async (bookingData) => {
  const config = getEmailConfig();
  const transporter = createTransporter();

  const recipientEmail = process.env.NOTIFICATION_RECIPIENT_EMAIL || bookingData.email || '09chaisu@gmail.com';
  if (!recipientEmail) {
    console.warn(`[Email Service] ไม่พบที่อยู่อีเมลของผู้ใช้สำหรับคิว ${bookingData.bookingCode}`);
    return { success: false, message: 'Recipient email missing' };
  }

  const subject = `🔔 ถึงเวลาคิวซักผ้าของคุณแล้ว! [คิว: ${bookingData.bookingCode}] - WashQ`;
  const htmlContent = generateReminderEmailHtml(bookingData);

  // กรณีตั้งค่า SMTP สมบูรณ์
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: config.from,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      });

      console.log(`[Email Service] 📧 ส่งอีเมลแจ้งเตือนถึง ${recipientEmail} สำเร็จ (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[Email Service] ❌ เกิดข้อผิดพลาดในการส่งอีเมลถึง ${recipientEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // กรณี Development / ไม่ได้ตั้งค่า SMTP ใน .env
  console.log(`\n==========================================================`);
  console.log(`[Email Service (Development/Mock Mode)]`);
  console.log(`📬 ถึง:         ${recipientEmail} (${bookingData.studentName || 'นักศึกษา'})`);
  console.log(`📋 หัวข้อ:      ${subject}`);
  console.log(`🎫 รหัสคิว:     ${bookingData.bookingCode}`);
  console.log(`🧺 เครื่อง:     ${bookingData.machineName} (${bookingData.location})`);
  console.log(`⏰ รอบเวลา:     ${bookingData.timeSlot} (วันที่: ${bookingData.bookingDate})`);
  console.log(`💡 คำแนะนำ:     สามารถตั้งค่า SMTP_USER และ SMTP_PASS ใน api/.env เพื่อส่งอีเมลจริง`);
  console.log(`==========================================================\n`);

  return { success: true, mock: true, message: 'Mock email logged successfully' };
};

/**
 * ฟังก์ชันสำหรับทดสอบส่งอีเมล (สำหรับหน้า Admin หรือการตรวจเช็คระบบ)
 */
const sendTestEmail = async (targetEmail) => {
  const recipient = targetEmail || process.env.NOTIFICATION_RECIPIENT_EMAIL || '09chaisu@gmail.com';
  const testData = {
    email: recipient,
    studentName: 'ทดสอบ ระบบ',
    studentCode: '6500000000-0',
    bookingCode: 'RES-TEST',
    machineName: 'เครื่องซักผ้า 01',
    machineType: 'ฝาหน้า 10kg',
    location: 'อาคาร 3 ชั้น 1 (ชาย)',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '14:00 - 15:00 น.',
  };

  return await sendBookingReminderEmail(testData);
};

module.exports = {
  sendBookingReminderEmail,
  sendTestEmail,
  getEmailConfig,
};
