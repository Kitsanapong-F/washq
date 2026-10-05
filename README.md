# WashQ - Smart Laundry Queue Reservation System
ระบบจองคิวเครื่องซักผ้าอัจฉริยะสำหรับหอพักนักศึกษา (WashQ)

[![Testing Status](https://img.shields.io/badge/Testing%20Sprint%203-33%2F33%20Passed%20(100%25)-success)](./TESTING.md)
[![Production Status](https://img.shields.io/badge/Production-Live%20on%20Render-blue)](https://washq-1.onrender.com)
[![MySQL](https://img.shields.io/badge/Database-Aiven%20Cloud%20MySQL%208.4-informational)](https://washq-n9fj.onrender.com/health)

### 🔗 ลิงก์ระบบและเอกสารสำคัญ (Important Links & Documentation)
- 🌐 **Frontend Application (สำหรับใช้งานจริง):** [https://washq-1.onrender.com](https://washq-1.onrender.com)
- ⚙️ **Backend REST API:** [https://washq-n9fj.onrender.com](https://washq-n9fj.onrender.com)
- 🩺 **API Health Check & Database Status:** [https://washq-n9fj.onrender.com/health](https://washq-n9fj.onrender.com/health)
- 📄 **รายงานผลการทดสอบฉบับเต็ม (Testing Report):** [TESTING.md](./TESTING.md)
- 📑 **เอกสารข้อกำหนด API (API Contract):** [API_CONTRACT.md](./API_CONTRACT.md)
- 📦 **เอกสารส่งมอบงานระบบ (Project Handover):** [HANDOVER.md](./HANDOVER.md)

---

## 📋 โครงสร้างโปรเจกต์ (Project Structure)

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
│   │   ├── components/             # UI Components (machines, admin, common)
│   │   ├── pages/                  # หน้าหลักของระบบ (Login, Dashboard, Admin)
│   │   ├── services/               # API Integration (Axios / Socket.io client)
│   │   ├── App.jsx                 # Routing และ Global State Setup
│   │   └── main.jsx                # React Entry Point
│   ├── .env.example                # ตัวอย่างการตั้งค่า Environment ฝั่ง Frontend
│   ├── Dockerfile                  # Container build config
│   ├── index.html
│   ├── vite.config.js              # Vite config (รองรับ 0.0.0.0 & WebSocket proxy)
│   └── package.json
├── api/                            # ฝั่งหลังบ้าน (Node.js + Express REST API)
│   ├── config/                     # ไฟล์ตั้งค่าระบบ (db pool, etc.)
│   ├── controllers/                # Business Logic (Auth, Machine, Booking)
│   ├── routes/                     # API Endpoints (/api/auth, /api/machines, etc.)
│   ├── scripts/
│   │   ├── init-db.js              # Script ติดตั้งและ Seed ฐานข้อมูลอัตโนมัติ
│   │   └── test-concurrent-booking.js # Script ทดสอบการจองพร้อมกัน (Race Condition Test)
│   ├── tests/                      # ชุดทดสอบอัตโนมัติ (Sprint 3)
│   │   ├── unit/                   # Unit Tests (auth.test.js, validation.test.js)
│   │   ├── integration/            # Integration Tests (api.integration.test.js)
│   │   └── concurrent/             # Concurrency Test (concurrentBooking.test.js)
│   ├── .env.example                # ตัวอย่างการตั้งค่า Environment ฝั่ง Backend
│   ├── Dockerfile                  # Container build config
│   ├── server.js                   # จุดเริ่มต้นเปิด Express App + Socket.io (Host 0.0.0.0)
│   └── package.json
├── scripts/
│   └── dev.js                      # Script รัน API + Frontend พร้อมกันใน Terminal เดียว
├── docker-compose.yml              # สำหรับรัน Full Stack หรือ Database ด้วย Docker
├── package.json                    # Workspace Scripts สะดวกสำหรับทีม
├── .env.example
├── .gitignore
├── TESTING.md                      # รายงานผลการทดสอบระบบและ Debugging ฉบับสมบูรณ์ (Sprint 3)
├── API_CONTRACT.md                 # ข้อกำหนดและข้อตกลง API Contract & Socket.io Events
├── HANDOVER.md                     # เอกสารส่งมอบงานระบบ (Project Handover Document)
└── README.md                       # คู่มือการติดตั้งและใช้งานโปรเจกต์
```

---

## 🚀 วิธีติดตั้งและรันโปรเจกต์ (สำหรับเพื่อนร่วมทีมที่ Clone ไป)

เมื่อเพื่อน Clone โปรเจกต์นี้จาก GitHub ไปลงเครื่องตัวเอง สามารถเลือกติดตั้งและรันได้ 2 วิธี:

### วิธีที่ 1: ติดตั้งแบบปกติ (Local Node.js + MySQL)

#### 1. ติดตั้ง Dependencies ทั้งหมดในคำสั่งเดียว
เปิด Terminal ที่ root folder (`washq/`):
```bash
npm run install:all
```
*(คำสั่งนี้จะรัน `npm install` ให้ทั้งในโฟลเดอร์ `api/` และ `frontend/`)*

#### 2. ตั้งค่า Environment Variables (`.env`)
คัดลอกไฟล์ตัวอย่างไปยัง `.env`:
- ในโฟลเดอร์ `api/`:
```bash
cp api/.env.example api/.env
```
เปิดไฟล์ `api/.env` แล้วปรับรหัสผ่าน MySQL (`DB_PASSWORD`) ให้ตรงกับเครื่องของตัวเอง:
```env
PORT=5000
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=washq_db
JWT_SECRET=washq_secret_key_2026
```

#### 3. สร้างและนำเข้าฐานข้อมูลอัตโนมัติ (Database Init & Seeders)
ไม่ต้องเข้าไปรัน SQL ใน phpMyAdmin เอง เพียงรันคำสั่ง:
```bash
npm run db:init
```
ระบบจะเชื่อมต่อ MySQL, สร้าง Database `washq_db`, สร้างตารางทั้งหมด และ Seed ข้อมูลตั้งต้นให้อัตโนมัติทันที

#### 4. เริ่มต้นรันระบบ (Run Dev Server)
รันทั้ง Backend API และ Frontend พร้อมกันใน Terminal เดียว:
```bash
npm run dev
```
หรือหากต้องการแยกรันคนละ Terminal:
- Terminal 1 (Backend): `npm run api` (พอร์ต 5000)
- Terminal 2 (Frontend): `npm run frontend` (พอร์ต 3000)

---

### วิธีที่ 2: รันผ่าน Docker (สภาพแวดล้อมเหมือนกัน 100% ทุกเครื่อง)

หากเพื่อนมี Docker Desktop ติดตั้งอยู่แล้ว สามารถรันระบบทั้งหมดได้ทันทีโดยไม่ต้องลง Node.js หรือ MySQL:

```bash
docker compose up -d
```
ระบบจะสร้าง Container สำหรับ:
- **MySQL Database (Port 3306)**: นำเข้า Schema และ Seeders ให้อัตโนมัติ
- **Backend API (Port 5000)**
- **Frontend Vite (Port 3000)**

*(หากต้องการหยุดทำงาน ให้ใช้คำสั่ง `docker compose down`)*

---

## 🌐 วิธีเปิดให้เพื่อนหรือคนอื่นในวง LAN เข้าใช้งานเว็บได้

เมื่อสั่งรันระบบ ระบบจะเปิดรับการเชื่อมต่อจากภายนอก (`0.0.0.0`) อัตโนมัติ:

### 1. เครื่องโฮสต์ (ผู้เปิดเซิร์ฟเวอร์)
ดูหมายเลข IP ในวง Wi-Fi / LAN ของเครื่องตัวเอง:
- **Windows**: เปิด Command Prompt พิมพ์ `ipconfig` (ดูค่า `IPv4 Address` เช่น `192.168.1.50`)
- **macOS / Linux**: พิมพ์ `ifconfig` หรือ `hostname -I`

### 2. เครื่องเพื่อน / มือถือ / แท็บเล็ต (ที่ต่อ Wi-Fi เดียวกัน)
เปิดเบราว์เซอร์แล้วพิมพ์:
```text
http://<IP_ADDRESS>:3000
```
*ตัวอย่าง:* `http://192.168.1.50:3000`

> **หมายเหตุ:**
> - ระบบ WebSocket (Socket.io) และ API Proxy ถูกตั้งค่าให้เชื่อมโยงผ่านพอร์ต 3000 โดยตรง ทำให้เครื่องคนอื่นสามารถดูสถานะเครื่องซักผ้าแบบ Real-time และกดจองคิวได้ทันที
> - หากเพื่อนเข้าไม่ได้ ให้ตรวจสอบ Firewall ของเครื่องผู้รันว่าได้อนุญาตพอร์ต 3000 หรือไม่

### 3. กรณีต้องการแชร์ให้เพื่อนนอกวง Wi-Fi (ผ่านอินเทอร์เน็ต)
สามารถใช้เครื่องมือฟรี เช่น Cloudflare Tunnel หรือ Localtunnel ได้ทันที:
```bash
npx localtunnel --port 3000
```
จะได้รับ URL สาธารณะ (Public URL) ส่งให้เพื่อนเข้าทดสอบจากที่ไหนก็ได้

---

## 🔑 ข้อมูลบัญชีผู้ใช้ทดสอบ (Test Accounts)

รหัสผ่านเริ่มต้นของทุกบัญชีคือ `123456`

| บทบาท (Role) | รหัสนักศึกษา / Username | รหัสผ่าน (Password) | รายละเอียด |
| :--- | :--- | :--- | :--- |
| **นักศึกษา (Student)** | `6512345678-9` | `123456` | นายสมชาย รักเรียน |
| **นักศึกษา (Student)** | `6512445890-1` | `123456` | นางสาวสมศรี เรียนดี |
| **ผู้ดูแลระบบ (Admin)** | `admin01` | `123456` | อาจารย์ธนากร กวยพูน |

---

## 🧪 รายงานผลการทดสอบระบบและแก้ไขข้อผิดพลาด (Sprint 3: Testing & Debugging Report)

> สำหรับรายงานผลการทดสอบฉบับเต็ม ตาราง Test Cases ละเอียด และ Raw Execution Logs สามารถดูได้ที่ [TESTING.md](./TESTING.md)

### 1. คำสั่งสำหรับรันชุดทดสอบ (How to Run Tests)

เปิด Terminal ที่ root folder (`washq/`):

```bash
# รันชุดทดสอบอัตโนมัติทั้งหมด (33 Test Cases)
npm test

# รันเฉพาะการทดสอบระดับหน่วย (Unit Tests: 16 Test Cases)
npm run test:unit

# รันเฉพาะการทดสอบระดับบูรณาการ (Integration Tests: 16 Test Cases)
npm run test:integration

# รันการทดสอบการแย่งจองคิวพร้อมกัน (Concurrent Booking / Race Condition Test)
npm run test:concurrent
```

---

### 2. สรุปผลการทดสอบภาพรวม (Test Execution Summary)

| ประเภทการทดสอบ (Test Category) | จำนวนเคส (Cases) | ผลลัพธ์ (Result) | อัตราความสำเร็จ (Pass Rate) |
| :--- | :---: | :---: | :---: |
| **Unit Testing (Auth, JWT, Security)** | 9 | ✅ ผ่านทั้งหมด (9/9) | 100% |
| **Unit Testing (Validation, Date, Time)** | 7 | ✅ ผ่านทั้งหมด (7/7) | 100% |
| **Integration Testing (API Endpoints & Database)** | 16 | ✅ ผ่านทั้งหมด (16/16) | 100% |
| **Concurrent Booking (Race Condition Test)** | 1 | ✅ ผ่านทั้งหมด (1/1) | 100% |
| **รวมชุดทดสอบอัตโนมัติทั้งหมด (Total Automated Tests)** | **33** | **✅ ผ่านทั้งหมด (33/33)** | **100%** |

---

### 3. ผลการทดสอบการจองพร้อมกัน (Concurrent Booking / Race Condition)

ทดสอบโดยจำลองผู้ใช้ 5 คนกดจองเครื่องเดียวกันและรอบเวลาเดียวกันในเสี้ยววินาทีเดียวกัน (`Promise.all`):

```text
============================================================
⚡ WASHQ - SPRINT 3: CONCURRENT BOOKING TEST
============================================================
- รหัสเครื่อง: เครื่องที่ 3 | วันที่: 2026-10-19 | ช่วงเวลา: 16:00 - 17:00 น.
- จำนวนคำขอพร้อมกัน: 5 คำขอ (ยิงพร้อมกันระดับ Millisecond)
------------------------------------------------------------
[คำขอที่ 1] ผู้ใช้ ID: 1 | สถานะ: ✅ สำเร็จ (201) | จองสำเร็จ (รหัส: RES-6143)
[คำขอที่ 2] ผู้ใช้ ID: 2 | สถานะ: ❌ ถูกปฏิเสธ (400) | ช่วงเวลานี้ถูกจองไปแล้ว
[คำขอที่ 3] ผู้ใช้ ID: 1 | สถานะ: ❌ ถูกปฏิเสธ (400) | ช่วงเวลานี้ถูกจองไปแล้ว
[คำขอที่ 4] ผู้ใช้ ID: 2 | สถานะ: ❌ ถูกปฏิเสธ (400) | ช่วงเวลานี้ถูกจองไปแล้ว
[คำขอที่ 5] ผู้ใช้ ID: 1 | สถานะ: ❌ ถูกปฏิเสธ (400) | ช่วงเวลานี้ถูกจองไปแล้ว
------------------------------------------------------------
🔍 สรุปผล: ได้รับอนุมัติ 1 รายการ | ปฏิเสธ 4 รายการ | บันทึกลง Database จริง 1 แถว
🎉 PASS: Zero Double-Booking ป้องกันการจองซ้ำซ้อนได้ 100%
============================================================
```

---

### 4. ผลการทดสอบการยอมรับของผู้ใช้งาน (User Acceptance Testing - UAT)

| รหัส UAT | บทบาท | สถานการณ์ทดสอบ (Scenario) | ผลลัพธ์ที่คาดหวัง | ผลการประเมิน |
| :---: | :---: | :--- | :--- | :---: |
| **UAT-01** | Student | เข้าสู่ระบบด้วยรหัสนักศึกษาและรหัสผ่าน | เข้าสู่หน้า Dashboard สำเร็จ แสดงข้อมูลถูกต้อง | **ผ่าน (PASS)** |
| **UAT-02** | Student | จองคิวเครื่องซักผ้าล่วงหน้าไม่เกิน 15 วัน | ได้รับรหัสคิว เช่น `RES-XXXX` และขึ้นบัตรคิวในหน้าแรก | **ผ่าน (PASS)** |
| **UAT-03** | Student | ยกเลิกคิวที่จองไว้ | บัตรคิวหายไป และรอบเวลาเปลี่ยนกลับมา "ว่าง" ทันที | **ผ่าน (PASS)** |
| **UAT-04** | Admin | ดูรายการคิวทั้งหมดและสั่งยกเลิกคิวของนักศึกษา | แสดงคิวทั้งหมด และสามารถกดยกเลิกคิวได้สำเร็จ | **ผ่าน (PASS)** |
| **UAT-05** | Admin | สลับสถานะเครื่องซักผ้าเป็น "ซ่อมบำรุง" | สถานะเปลี่ยนเป็นปิดปรับปรุง และหน้านักศึกษาปิดไม่ให้จอง | **ผ่าน (PASS)** |
| **UAT-06** | Realtime | นักศึกษาจองคิวขณะ Admin เปิดหน้าจออยู่ | หน้าจอ Admin ได้รับ Event อัปเดตข้อมูลทันทีโดยไม่ต้องรีเฟรช | **ผ่าน (PASS)** |

---

### 5. รายการจุดบกพร่องที่ได้รับการแก้ไข (Bug Fixing & Debugging Post-Mortem)

1. **MySQL 8.4 ANSI_QUOTES Incompatibility (Aiven Cloud):**
   - *ปัญหา:* คำสั่ง SQL ที่ใช้ double quotes `"` เช่น `status = "cancelled"` เกิด Error `Unknown column 'cancelled'` บน Aiven Cloud MySQL
   - *การแก้ไข:* เปลี่ยนเป็น Parameterized Query (`status = ?`) ทั้งหมดใน `bookingController.js`
2. **Supertest Port Conflict (`EADDRINUSE: :::5000`):**
   - *ปัญหา:* การรัน Jest หลายไฟล์ทำให้ `server.listen(5000)` ถูกเรียกซ้ำซ้อน
   - *การแก้ไข:* ครอบด้วย `if (require.main === module)` และ export `{ app, server, io }`
3. **15-Day Date Constraint & Past Date Blocking:**
   - *ปัญหา:* ผู้ใช้สามารถส่งคำขอนอกเหนือจากกรอบ 15 วัน หรือเลือกเวลาในอดีตได้หากยิงผ่าน API
   - *การแก้ไข:* เพิ่ม Business Validation ใน Controller และเขียน Unit Test ดักจับ
4. **WebSocket Connection Keep-Alive on Render Cloud:**
   - *ปัญหา:* การตัด Connection ของ Render เมื่อไม่มี Traffic
   - *การแก้ไข:* ตั้งค่า Reconnection Retry Strategy และ Fallback Polling ให้กับ Socket.io Client

---

### 6. สถานะการนำขึ้น Production (Deployment Status)

- **Frontend Application:** [https://washq-1.onrender.com](https://washq-1.onrender.com) (Render Static Site)
- **Backend API Server:** [https://washq-n9fj.onrender.com](https://washq-n9fj.onrender.com) (Render Web Service)
- **Production Database:** Aiven Cloud MySQL 8.4 (SSL Connection Active)
- **Health Check Endpoint:** [https://washq-n9fj.onrender.com/health](https://washq-n9fj.onrender.com/health) (Status: 200 OK)

