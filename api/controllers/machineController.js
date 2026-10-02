const pool = require('../config/db');

// GET /api/machines
exports.getAllMachines = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM machines ORDER BY machine_id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Fetch machines error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องซักผ้า' });
  }
};

// PUT /api/machines/:id/status
exports.updateMachineStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['available', 'in_use', 'booked', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'สถานะเครื่องซักผ้าไม่ถูกต้อง' });
  }

  try {
    const [result] = await pool.query('UPDATE machines SET status = ? WHERE machine_id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบเครื่องซักผ้านี้ในระบบ' });
    }

    // ส่งสัญญาณ Real-time หาผู้ใช้ทุกคนผ่าน Socket.io (ทั้งฝั่ง Admin และ Student)
    const io = req.app.get('socketio');
    if (io) {
      io.emit('machine_status_updated', { machine_id: Number(id), status });
    }

    res.json({ message: 'อัปเดตสถานะเครื่องซักผ้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
};
