const pool = require('../config/db');

// GET /api/machines
exports.getAllMachines = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM machines ORDER BY machine_id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลเครื่องซักผ้าได้' });
  }
};

// PUT /api/machines/:id/status (สำหรับ Admin ปรับ Manual)
exports.updateMachineStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query('UPDATE machines SET status = ? WHERE machine_id = ?', [status, id]);

    // แจ้งเตือน Real-time ผ่าน Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('machine_status_updated', { machineId: id, status });
    }

    res.json({ message: 'อัปเดตสถานะเครื่องซักผ้าเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'อัปเดตสถานะไม่สำเร็จ' });
  }
};
