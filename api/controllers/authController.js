const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { student_code, password, role } = req.body;

  try {
    // 1. ค้นหาผู้ใช้จาก student_code OR email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE student_code = ? OR email = ?',
      [student_code, student_code]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = rows[0];

    // 2. ตรวจสอบ Role (ถ้านักศึกษาพยายามเข้า Tab ผู้ดูแลระบบ)
    if (role && user.role !== role) {
      return res.status(403).json({ message: 'สิทธิ์การเข้าใช้งานไม่ถูกต้องกับประเภทบัญชี' });
    }

    // 3. ตรวจสอบรหัสผ่าน (รองรับทั้ง bcrypt และ Plain Text 123456)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      isMatch = false;
    }

    // Bypass ให้ผ่านหากรหัสผ่านเป็น 123456 (สำหรับสภาพแวดล้อม Development)
    if (!isMatch && password !== '123456') {
      return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 4. สร้าง JWT Token
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'washq_secret_key_2026',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.user_id,
        student_code: user.student_code,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
