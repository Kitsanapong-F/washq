const pool = require('../config/db');

// POST /api/bookings (สร้างรายการจองคิว)
exports.createBooking = async (req, res) => {
  const { user_id, machine_id, booking_date, time_slot } = req.body;

  if (!user_id || !machine_id || !booking_date || !time_slot) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลการจองให้ครบถ้วน' });
  }

  try {
    // ตัดเอาเฉพาะรูปแบบ YYYY-MM-DD ชัวร์ๆ
    const cleanDate = String(booking_date).split('T')[0];

    // ตรวจสอบความถูกต้องของวันที่ (ไม่ย้อนหลัง และจองล่วงหน้าได้ไม่เกิน 15 วัน)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 15);

    const reqDate = new Date(`${cleanDate}T00:00:00`);
    if (isNaN(reqDate.getTime())) {
      return res.status(400).json({ message: 'รูปแบบวันที่ไม่ถูกต้อง' });
    }

    // ตรวจสอบเวลาปัจจุบันตามเขตเวลา Asia/Bangkok
    const now = new Date();
    const thaiDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
    const thaiTimeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);
    const currentHour = parseInt(thaiTimeParts.find(p => p.type === 'hour').value, 10);
    const currentMinute = parseInt(thaiTimeParts.find(p => p.type === 'minute').value, 10);

    // หากวันที่เลือกเป็นอดีต
    if (cleanDate < thaiDateStr || reqDate < today) {
      return res.status(400).json({ message: 'ไม่สามารถจองช่วงเวลาในอดีตได้' });
    }

    if (reqDate > maxDate) {
      return res.status(400).json({ message: 'สามารถจองคิวล่วงหน้าได้ไม่เกิน 15 วัน' });
    }

    // หากเป็นวันที่ "วันนี้" ให้ตรวจสอบว่ารอบเวลา (time slot) เลยเวลาปัจจุบันไปแล้วหรือไม่
    if (cleanDate === thaiDateStr) {
      const match = String(time_slot).match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const slotHour = parseInt(match[1], 10);
        const slotMinute = parseInt(match[2], 10);

        if (currentHour > slotHour || (currentHour === slotHour && currentMinute >= slotMinute)) {
          return res.status(400).json({ message: 'ไม่สามารถจองช่วงเวลาในอดีตได้' });
        }
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // ล็อกแถวเครื่องซักผ้าเพื่อป้องกัน Race Condition (Zero Double-Booking)
      const [machines] = await conn.query('SELECT machine_id FROM machines WHERE machine_id = ? FOR UPDATE', [machine_id]);
      if (machines.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ message: 'ไม่พบเครื่องซักผ้านี้' });
      }

      // 1. ตรวจสอบว่ารอบเวลานี้ในวันที่กำหนด มีคนจองไปแล้วหรือยัง
      const [existing] = await conn.query(
        'SELECT * FROM bookings WHERE machine_id = ? AND DATE(booking_date) = ? AND time_slot = ? AND status = ?',
        [machine_id, cleanDate, time_slot, 'active']
      );

      if (existing.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น' });
      }

      // 2. สุ่มรหัสการจอง เช่น RES-1234
      const booking_code = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. บันทึกข้อมูลการจองลงตาราง bookings
      await conn.query(
        'INSERT INTO bookings (booking_code, user_id, machine_id, booking_date, time_slot, status) VALUES (?, ?, ?, ?, ?, ?)',
        [booking_code, user_id, machine_id, cleanDate, time_slot, 'active']
      );

      // 4. อัปเดตสถานะเครื่องซักผ้าเป็น booked
      await conn.query('UPDATE machines SET status = ? WHERE machine_id = ?', ['booked', machine_id]);

      await conn.commit();
      conn.release();

      // แจ้งเตือน Real-time ผ่าน Socket.io ทั้ง 2 ฝั่ง (Dashboard, TimeSlots, Admin)
      const io = req.app.get('socketio');
      if (io) {
        io.emit('booking_created', { machine_id: Number(machine_id), time_slot, booking_date: cleanDate, booking_code });
        io.emit('machine_status_updated', { machine_id: Number(machine_id), status: 'booked' });
      }

      return res.status(201).json({
        message: 'จองคิวสำเร็จ',
        booking_code,
        details: { machine_id: Number(machine_id), booking_date: cleanDate, time_slot }
      });

    } catch (txError) {
      await conn.rollback();
      conn.release();
      throw txError;
    }

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
      'SELECT machine_id, booking_code, status FROM bookings WHERE booking_code = ? OR booking_id = ?',
      [id, id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้ในระบบ' });
    }

    const { machine_id, booking_code, status: currentStatus } = bookings[0];

    if (currentStatus === 'cancelled') {
      return res.status(400).json({ message: 'รายการจองนี้ถูกยกเลิกไปแล้ว' });
    }

    // 2. อัปเดตสถานะ booking เป็น cancelled โดยอิงจาก booking_code
    await pool.query(
      'UPDATE bookings SET status = ? WHERE booking_code = ?',
      ['cancelled', booking_code]
    );

    // 3. ตรวจสอบว่ายังมีคิว active อื่นของเครื่องนี้อยู่อีกหรือไม่
    const [otherActive] = await pool.query(
      'SELECT booking_id FROM bookings WHERE machine_id = ? AND status = ?',
      [machine_id, 'active']
    );

    const newMachineStatus = otherActive.length > 0 ? 'booked' : 'available';
    await pool.query('UPDATE machines SET status = ? WHERE machine_id = ?', [newMachineStatus, machine_id]);

    // แจ้งเตือน Real-time ผ่าน Socket.io ทั้ง 2 ฝั่ง
    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_cancelled', { machine_id: Number(machine_id), booking_code });
      io.emit('machine_status_updated', { machine_id: Number(machine_id), status: newMachineStatus });
    }

    res.json({ message: 'ยกเลิกรายการจองคิวเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการยกเลิกคิว' });
  }
};

// GET /api/bookings/user/:userId/active (ดึงคิวที่จองอยู่ทั้งหมดของนักศึกษา)
exports.getUserActiveBooking = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT
        b.booking_id AS id,
        b.booking_code,
        b.machine_id,
        m.machine_name AS machineName,
        m.location,
        b.time_slot AS timeSlot,
        DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date,
        b.status,
        b.created_at
      FROM bookings b
      JOIN machines m ON b.machine_id = m.machine_id
      WHERE b.user_id = ? AND b.status = 'active'
      ORDER BY b.booking_date ASC, b.time_slot ASC, b.created_at DESC
    `, [userId]);

    res.json(rows);
  } catch (error) {
    console.error('Fetch active bookings error:', error);
    res.status(500).json({ message: 'ดึงข้อมูลคิวปัจจุบันไม่สำเร็จ' });
  }
};
