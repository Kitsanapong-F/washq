const pool = require('../config/db');

// POST /api/bookings
exports.createBooking = async (req, res) => {
  const { user_id, machine_id, booking_date, time_slot } = req.body;

  try {
    // 1. ตรวจสอบว่ารอบเวลานี้มีคนจองแล้วหรือยัง
    const [existing] = await pool.query(
      'SELECT * FROM bookings WHERE machine_id = ? AND booking_date = ? AND time_slot = ? AND status = "active"',
      [machine_id, booking_date, time_slot]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น' });
    }

    // 2. สร้างสุ่มรหัสการจอง เช่น RES-1234
    const booking_code = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. บันทึกข้อมูลการจอง
    await pool.query(
      'INSERT INTO bookings (booking_code, user_id, machine_id, booking_date, time_slot, status) VALUES (?, ?, ?, ?, ?, "active")',
      [booking_code, user_id, machine_id, booking_date, time_slot]
    );

    // 4. อัปเดตสถานะเครื่องซักผ้าเป็น booked
    await pool.query('UPDATE machines SET status = "booked" WHERE machine_id = ?', [machine_id]);

    // แจ้งเตือน Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_created', { machine_id, time_slot });
    }

    res.status(201).json({
      message: 'จองคิวสำเร็จ',
      booking_code,
      details: { machine_id, booking_date, time_slot }
    });

  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการจองคิว' });
  }
};

// GET /api/bookings/all (สำหรับ Admin Queue)
exports.getAllBookings = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.booking_id, b.booking_code, u.student_code, u.name, m.machine_name, b.booking_date, b.time_slot, b.status
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN machines m ON b.machine_id = m.machine_id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลคิวจองไม่สำเร็จ' });
  }
};
