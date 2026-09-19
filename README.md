# washq

```text
washq/
├── .github/
│   └── CODEOWNERS                  # กำหนดผู้รับผิดชอบ Code Review
├── database/                       # จัดการฐานข้อมูล (Sprint 1)
│   ├── schema.sql                  # DDL สร้างตาราง users, machines, bookings
│   └── seeders.sql                 # Mock data สำหรับทดสอบระบบ
├── frontend/                       # ฝั่งผู้ใช้งาน / Admin UI (React + Vite)
│   ├── public/                     # Static assets (Favicon, logos)
│   ├── src/
│   │   ├── assets/                 # รูปภาพประกอบ, Stylesheet หลัก
│   │   ├── components/
│   │   │   ├── common/             # UI Reusable (Header, Navbar, Modal)
│   │   │   ├── machines/           # MachineCard, StatusBadge
│   │   │   └── admin/              # StatCard, MachineControl, QueueTable
│   │   ├── pages/                  # หน้าหลักของระบบ
│   │   │   ├── Login.jsx           # หน้า Login นักศึกษา / Admin (FR-1)
│   │   │   ├── Dashboard.jsx       # หน้าแสดงสถานะ Real-time & คิวปัจจุบัน (FR-2)
│   │   │   ├── TimeSlots.jsx       # หน้าเลือกรอบเวลาจองคิว (FR-3)
│   │   │   ├── AdminDashboard.jsx  # หน้าปรับสถานะเครื่องแบบ Manual (FR-5.3)
│   │   │   └── AdminQueue.jsx      # หน้าจัดการรายการคิวจองทั้งหมด (FR-5.3)
│   │   ├── services/               # API Integration (Axios / Socket.io client)
│   │   │   ├── api.js              # Axios Instance Config
│   │   │   ├── authService.js      # API ล็อกอิน/จัดการ Token
│   │   │   ├── machineService.js   # API ดึง/อัปเดตสถานะเครื่อง
│   │   │   └── bookingService.js   # API จอง/ยกเลิกคิว
│   │   ├── App.jsx                 # Routing และ Global State Setup
│   │   └── main.jsx                # React Entry Point
│   ├── index.html
│   └── package.json
├── api/                            # ฝั่งหลังบ้าน (Node.js + Express REST API)
│   ├── config/                     # ไฟล์ตั้งค่าระบบ
│   │   ├── db.js                   # MySQL / MariaDB Connection Pool
│   │   └── mailer.js               # Nodemailer Config (Email Notification)
│   ├── controllers/                # Business Logic หลัก
│   │   ├── authController.js       # Login, Password Hashing Verification
│   │   ├── machineController.js    # ดึงสถานะ Real-time, Admin Manual Reset
│   │   └── bookingController.js    # จองคิว (กัน Race Condition), ยกเลิกคิว
│   ├── models/                     # SQL Queries Execution
│   │   ├── userModel.js
│   │   ├── machineModel.js
│   │   └── bookingModel.js
│   ├── routes/                     # API Endpoints Route definitions
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── machineRoutes.js        # /api/machines
│   │   └── bookingRoutes.js        # /api/bookings
│   ├── middlewares/                # ตัวกรองข้อมูลและความปลอดภัย
│   │   ├── authMiddleware.js       # ตรวจสอบ JWT Token & Admin Role
│   │   └── errorHandler.js         # Centralized Error Handler
│   ├── utils/                      # Helper Functions
│   │   └── emailService.js         # ส่ง Email แจ้งเตือนเมื่อถึงคิว/ซักเสร็จ
│   ├── server.js                   # จุดเริ่มต้นเปิด Express App + Socket.io
│   └── package.json
├── .gitignore
└── README.md                       # คู่มือการติดตั้งและใช้งานโปรเจกต์
```
