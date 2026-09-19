const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ตั้งค่า Socket.io สำหรับอัปเดต Real-time
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ส่งตัวแปร io ไปใช้ใน Controller ได้
app.set('socketio', io);

// Route ทดสอบเซิร์ฟเวอร์
app.get('/api/test', (req, res) => {
  res.json({ message: 'WashQ API Server พร้อมใช้งาน!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
