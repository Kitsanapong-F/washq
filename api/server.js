const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const apiRoutes = require('./routes/api'); // Import routes

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.set('socketio', io);

app.get('/', (req, res) => {
  res.json({ message: 'WashQ API Server is running successfully!' });
});
// ใช้งาน API Routes
app.use('/api', apiRoutes);

// Centralized Error Handler Middleware
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// Notification Scheduler (ระบบแจ้งเตือน Email เมื่อถึงเวลาจอง)
const { startNotificationScheduler } = require('./services/notificationScheduler');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 WashQ API Server running at:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`   - Network: http://${iface.address}:${PORT}`);
        }
      }
    }
  } catch (err) {
    // Ignore network interface discovery errors
  }

  // เริ่มต้นระบบตรวจสอบและส่งอีเมลแจ้งเตือนเมื่อถึงเวลา
  startNotificationScheduler().catch((err) => {
    console.error('❌ ไม่สามารถเริ่มระบบ Notification Scheduler ได้:', err.message);
  });
});


