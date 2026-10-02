# WashQ - Smart Laundry Queue Reservation System
ระบบจองคิวเครื่องซักผ้าอัจฉริยะสำหรับหอพักนักศึกษา (WashQ)

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
│   │   └── init-db.js              # Script ติดตั้งและ Seed ฐานข้อมูลอัตโนมัติ
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
