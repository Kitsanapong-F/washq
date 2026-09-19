const pool = require('../config/db');

// POST /api/bookings (สร้างรายการจองคิว)
exports.createBooking = async (req, res) => {
  const { user_id, machine_id, booking_date, time_slot } = req.body;

  try {
    // ตัดเอาเฉพาะรูปแบบ YYYY-MM-DD ชัวร์ๆ
    const cleanDate = String(booking_date).split('T')[0];

    // 1. ตรวจสอบว่ารอบเวลานี้ในวันที่กำหนด มีคนจองไปแล้วหรือยัง
    const [existing] = await pool.query(
      'SELECT * FROM bookings WHERE machine_id = ? AND DATE(booking_date) = ? AND time_slot = ? AND status = "active"',
      [machine_id, cleanDate, time_slot]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น' });
    }

    // 2. สุ่มรหัสการจอง เช่น RES-1234
    const booking_code = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. บันทึกข้อมูลการจองลงตาราง bookings
    await pool.query(
      'INSERT INTO bookings (booking_code, user_id, machine_id, booking_date, time_slot, status) VALUES (?, ?, ?, ?, ?, "active")',
      [booking_code, user_id, machine_id, cleanDate, time_slot]
    );

    // 4. อัปเดตสถานะเครื่องซักผ้าเป็น booked
    await pool.query('UPDATE machines SET status = "booked" WHERE machine_id = ?', [machine_id]);

    // แจ้งเตือน Real-time ผ่าน Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_created', { machine_id, time_slot, booking_date: cleanDate });
    }

    res.status(201).json({
      message: 'จองคิวสำเร็จ',
      booking_code,
      details: { machine_id, booking_date: cleanDate, time_slot }
    });

  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการจองคิว' });
  }
};

// GET /api/bookings/all (ดึงรายการคิวทั้งหมดสำหรับ Admin Queue หรือตรวจสอบสล็อต)
exports.getAllBookings = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.booking_id,
        b.booking_code,
        b.machine_id,
        u.student_code,
        u.name,
        m.machine_name,
        DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date,
        b.time_slot,
        b.status
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN machines m ON b.machine_id = m.machine_id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Fetch all bookings error:', error);
    res.status(500).json({ message: 'ดึงข้อมูลคิวจองไม่สำเร็จ' });
  }
};

// PUT /api/bookings/:id/cancel (ยกเลิกรายการจองคิว)
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. ค้นหาข้อมูลการจองเพื่อดูว่าใช้ booking_code หรือ booking_id
    const [bookings] = await pool.query(
      'SELECT machine_id, booking_code FROM bookings WHERE booking_code = ? OR booking_id = ?',
      [id, id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้ในระบบ' });
    }

    const { machine_id, booking_code } = bookings[0];

    // 2. อัปเดตสถานะ booking เป็น cancelled โดยอิงจาก booking_code
    await pool.query(
      'UPDATE bookings SET status = "cancelled" WHERE booking_code = ?',
      [booking_code]
    );

    // 3. คืนสถานะเครื่องซักผ้ากลับเป็น available
    await pool.query('UPDATE machines SET status = "available" WHERE machine_id = ?', [machine_id]);

    // แจ้งเตือน Real-time ผ่าน Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_cancelled', { machine_id, booking_code });
    }

    res.json({ message: 'ยกเลิกรายการจองคิวเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการยกเลิกคิว' });
  }
};

// GET /api/bookings/user/:userId/active (ดึงคิวที่จองอยู่ปัจจุบันของนักศึกษา)
exports.getUserActiveBooking = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT
        b.booking_id AS id,
        b.booking_code,
        m.machine_name AS machineName,
        b.time_slot AS timeSlot,
        DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date
      FROM bookings b
      JOIN machines m ON b.machine_id = m.machine_id
      WHERE b.user_id = ? AND b.status = 'active'
      ORDER BY b.created_at DESC
      LIMIT 1
    `, [userId]);

    if (rows.length === 0) {
      return res.json(null);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch active booking error:', error);
    res.status(500).json({ message: 'ดึงข้อมูลคิวปัจจุบันไม่สำเร็จ' });
  }
};
