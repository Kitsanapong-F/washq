const { sendTestEmail, getEmailConfig } = require('../services/emailService');
const { checkAndSendBookingReminders } = require('../services/notificationScheduler');

// POST /api/notifications/test-email (ทดสอบการส่งอีเมล)
exports.testEmail = async (req, res) => {
  const email = req.body?.email || process.env.NOTIFICATION_RECIPIENT_EMAIL || '09chaisu@gmail.com';

  try {
    const result = await sendTestEmail(email);
    const config = getEmailConfig();

    res.json({
      message: result.mock
        ? 'จำลองการส่งอีเมลแจ้งเตือนสำเร็จ (Mock Mode - ตรวจสอบ Log บน Console)'
        : 'ส่งอีเมลแจ้งเตือนสำเร็จแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ',
      details: {
        to: email,
        smtpConfigured: !!(config.user && config.pass),
        smtpHost: config.host,
        result,
      },
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งอีเมลทดสอบ', error: error.message });
  }
};

// POST /api/notifications/trigger-reminders (กระตุ้นการตรวจสอบและส่งอีเมลแจ้งเตือนด้วยตนเอง)
exports.triggerReminders = async (req, res) => {
  try {
    await checkAndSendBookingReminders();
    res.json({ message: 'กระตุ้นการตรวจสอบคิวและส่งอีเมลแจ้งเตือนสำเร็จ' });
  } catch (error) {
    console.error('Trigger reminders error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบคิวแจ้งเตือน', error: error.message });
  }
};
