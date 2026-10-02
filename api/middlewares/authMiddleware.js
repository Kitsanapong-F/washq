const jwt = require('jsonwebtoken');

// ตรวจสอบ JWT Token จาก Request Header
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ (Token Missing)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'washq_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  }
};

// ตรวจสอบ Token แบบยืดหยุ่น (หากส่งมาจะ decode เก็บไว้ที่ req.user แต่ถ้าไม่ส่งก็ไม่ block)
exports.optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'washq_secret_key_2026');
      req.user = decoded;
    } catch (err) {
      // ไม่บังคับ error
    }
  }
  next();
};

// ตรวจสอบสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Role)
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
  next();
};
