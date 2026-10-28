# 📑 WashQ - เอกสารข้อตกลงและข้อกำหนด API (API Contract Specification)

> **โปรเจกต์:** WashQ - Smart Laundry Queue Reservation System
> **เวอร์ชันเอกสาร:** 1.0.0 (Sprint 3 Final Delivery)
> **สถานะ:** Active / Production Ready
> **วันที่มีผลบังคับใช้:** 6 ตุลาคม 2026

---

## 📌 สารบัญ (Table of Contents)
1. [ภาพรวมของข้อกำหนด (Overview & Conventions)](#1-ภาพรวมของข้อกำหนด-overview--conventions)
2. [สภาพแวดล้อมและการเชื่อมต่อ (Environments & Base URLs)](#2-สภาพแวดล้อมและการเชื่อมต่อ-environments--base-urls)
3. [ระบบรักษาความปลอดภัยและการยืนยันตัวตน (Authentication & Authorization)](#3-ระบบรักษาความปลอดภัยและการยืนยันตัวตน-authentication--authorization)
4. [โครงสร้างมาตรฐานข้อมูลตอบกลับ (Standard Response & Error Formats)](#4-โครงสร้างมาตรฐานข้อมูลตอบกลับ-standard-response--error-formats)
5. [สารบัญ Endpoints ทั้งหมด (API Catalog)](#5-สารบัญ-endpoints-ทั้งหมด-api-catalog)
6. [รายละเอียด Endpoints เชิงลึก (Endpoint Specifications)](#6-รายละเอียด-endpoints-เชิงลึก-endpoint-specifications)
   - [6.1 Health & System Check](#61-health--system-check)
   - [6.2 Authentication Module](#62-authentication-module)
   - [6.3 Machine Management Module](#63-machine-management-module)
   - [6.4 Booking Management Module](#64-booking-management-module)
   - [6.5 Notification & Email Module](#65-notification--email-module)
7. [ข้อกำหนดสัญญาณ Real-Time (Socket.io Event Contract)](#7-ข้อกำหนดสัญญาณ-real-time-socketio-event-contract)
8. [พจนานุกรมข้อมูล (Data Dictionary & Schemas)](#8-พจนานุกรมข้อมูล-data-dictionary--schemas)
9. [กฎเกณฑ์ทางธุรกิจและความถูกต้องของข้อมูล (Business & Validation Rules)](#9-กฎเกณฑ์ทางธุรกิจและความถูกต้องของข้อมูล-business--validation-rules)

---

## 1. ภาพรวมของข้อกำหนด (Overview & Conventions)

เอกสารฉบับนี้กำหนดมาตรฐานการสื่อสารระหว่างโปรแกรมฝั่งผู้ใช้งาน (Client / Frontend Web App) และเซิร์ฟเวอร์หลังบ้าน (API Backend Server) ของระบบจองคิวเครื่องซักผ้า WashQ โดยใช้สถาปัตยกรรม **RESTful API** ผ่านโพรโทคอล HTTPS และส่งข้อมูลในรูปแบบ **JSON (JavaScript Object Notation)** ร่วมกับการสื่อสารสองทิศทางแบบ **WebSocket (Socket.io)**

### ข้อตกลงมาตรฐาน:
- **Character Encoding:** `UTF-8`
- **Content-Type Header:** `application/json; charset=utf-8`
- **Timezone:** `Asia/Bangkok` (UTC+7)
- **Date Format:** มาตรฐาน ISO 8601 ส่วนวันที่ `YYYY-MM-DD` (เช่น `2026-10-19`)
- **Time Slot Format:** สตริงช่วงเวลาภาษาไทย `HH:mm - HH:mm น.` (เช่น `14:00 - 15:00 น.`)

---

## 2. สภาพแวดล้อมและการเชื่อมต่อ (Environments & Base URLs)

| สภาพแวดล้อม (Environment) | Base URL | คำอธิบาย |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:5000/api` | ทดสอบและพัฒนาระบบบนเครื่องคอมพิวเตอร์ผู้พัฒนา |
| **Production Cloud** | `https://washq-n9fj.onrender.com/api` | ระบบจริงบน Render Cloud Web Service |
| **Frontend Web App** | `https://washq-1.onrender.com` | หน้าต่างการใช้งานจริงสำหรับนักศึกษาและผู้ดูแลระบบ |

---

## 3. ระบบรักษาความปลอดภัยและการยืนยันตัวตน (Authentication & Authorization)

ระบบใช้มาตรฐาน **JSON Web Token (JWT)** ในการระบุตัวตนและควบคุมสิทธิ์การเข้าถึงข้อมูล (Role-Based Access Control: RBAC)

### 3.1 รูปแบบการส่ง Token ในคำขอ (Authorization Header)
Endpoint ที่ต้องใช้การยืนยันตัวตน ต้องแนบ Header ดังนี้:
```http
Authorization: Bearer <ACCESS_TOKEN>
```

### 3.2 โครงสร้าง Payload ของ Token
```json
{
  "userId": 1,
  "role": "student", // หรือ "admin"
  "name": "นายสมชาย รักเรียน",
  "iat": 1791216000,
  "exp": 1791302400  // อายุการใช้งาน 24 ชั่วโมง
}
```

### 3.3 ระดับสิทธิ์ผู้ใช้งาน (Roles & Permissions)
| บทบาท (Role) | สิทธิ์การเข้าถึง |
| :--- | :--- |
| `student` | ตรวจสอบสถานะเครื่อง, ดูตารางรอบเวลา, จองคิวตนเอง, ยกเลิกคิวตนเอง, ดูคิวของตนเอง |
| `admin` | สิทธิ์ทั้งหมดของนักศึกษา + ปรับเปลี่ยนสถานะเครื่อง (เช่น ปิดปรับปรุง), ดูคิวของทุกคน, ยกเลิกคิวแทนนักศึกษา |

---

## 4. โครงสร้างมาตรฐานข้อมูลตอบกลับ (Standard Response & Error Formats)

### 4.1 ข้อมูลตอบกลับเมื่อทำงานสำเร็จ (Success Response)
```json
{
  "message": "ข้อความแสดงผลสำเร็จ",
  "data": {} // หรือ Object / Array ของข้อมูลที่ร้องขอ
}
```

### 4.2 ข้อมูลตอบกลับเมื่อเกิดข้อผิดพลาด (Error Response)
```json
{
  "message": "คำอธิบายสาเหตุข้อผิดพลาดภาษาไทย"
}
```

### 4.3 รหัสสถานะ HTTP (HTTP Status Codes)
| HTTP Code | ความหมาย | กรณีการใช้งาน |
| :---: | :--- | :--- |
| **200 OK** | คำขอสำเร็จ | คืนข้อมูลสำเร็จ หรือ อัปเดตข้อมูลสำเร็จ |
| **201 Created** | สร้างข้อมูลสำเร็จ | สร้างรายการจองคิวใหม่สำเร็จ (`POST /api/bookings`) |
| **400 Bad Request** | ข้อมูลนำเข้าไม่ถูกต้อง | กรอกข้อมูลไม่ครบ, จองซ้ำรอบเวลาเดิม, จองย้อนหลัง |
| **401 Unauthorized** | ไม่ผ่านการยืนยันตัวตน | ไม่มี Token, รหัสผ่านผิด, ไม่พบบัญชีผู้ใช้ |
| **403 Forbidden** | ปฏิเสธการเข้าถึงสิทธิ์ | นักศึกษาพยายามเรียกใช้งาน Endpoint เฉพาะ Admin |
| **404 Not Found** | ไม่พบข้อมูลที่ต้องการ | ไม่พบ ID เครื่องซักผ้า หรือ ไม่พบรายการจอง |
| **500 Internal Error**| ข้อผิดพลาดเซิร์ฟเวอร์ | ฐานข้อมูลขัดข้อง หรือ ตรรกะระบบภายในผิดพลาด |

---

## 5. สารบัญ Endpoints ทั้งหมด (API Catalog)

| หมวดหมู่ | Method | Path | การยืนยันสิทธิ์ | คำอธิบายสั้น |
| :--- | :---: | :--- | :---: | :--- |
| **System** | `GET` | `/health` | Public | ตรวจสอบสถานะ API และการเชื่อมต่อฐานข้อมูล |
| **System** | `GET` | `/` | Public | ตรวจสอบว่า API Server กำลังทำงาน |
| **Auth** | `POST` | `/api/auth/login` | Public | ยืนยันตัวตนเข้าสู่ระบบ (นักศึกษา / ผู้ดูแลระบบ) |
| **Machines** | `GET` | `/api/machines` | Public | ดึงรายการเครื่องซักผ้าทั้งหมดพร้อมสถานะปัจจุบัน |
| **Machines** | `GET` | `/api/machines/:id` | Public | ดึงข้อมูลรายละเอียดของเครื่องซักผ้ารายตัว |
| **Machines** | `PUT` | `/api/machines/:id/status` | Admin | อัปเดตสถานะการทำงานของเครื่องซักผ้า |
| **Bookings** | `POST` | `/api/bookings` | User / Admin | ทำรายการจองคิวเครื่องซักผ้าใหม่ (Atomic Transaction) |
| **Bookings** | `GET` | `/api/bookings/all` | Public / Admin | ดึงรายการคิวจองทั้งหมดในระบบ |
| **Bookings** | `PUT` | `/api/bookings/:id/cancel` | User / Admin | ยกเลิกรายการจองคิว (โดยใช้ ID หรือ Reservation Code) |
| **Bookings** | `GET` | `/api/bookings/user/:userId/active` | User / Admin | ดึงรายการคิวที่ยังไม่หมดอายุของผู้ใช้รายบุคคล |
| **Notifications** | `POST` | `/api/notifications/test-email` | Public / Admin | ยิงทดสอบการส่งอีเมลแจ้งเตือนผ่าน SMTP |
| **Notifications** | `POST` | `/api/notifications/trigger-reminders` | Public / Admin | สั่งประมวลผลคิวเพื่อส่งอีเมลเตือนล่วงหน้าด้วยตนเอง |

---

## 6. รายละเอียด Endpoints เชิงลึก (Endpoint Specifications)

### 6.1 Health & System Check

#### `GET /health`
- **คำอธิบาย:** ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์และการเชื่อมโยงกับฐานข้อมูล
- **Request Headers:** ไม่ต้องการ
- **Response 200 OK:**
  ```json
  {
    "status": "ok",
    "database": "connected",
    "db_host": "washq-chaisu-e44a.c.aivencloud.com"
  }
  ```
- **Response 500 Internal Server Error:**
  ```json
  {
    "status": "error",
    "database": "disconnected",
    "error": "connect ECONNREFUSED 127.0.0.1:3306",
    "db_host": "localhost"
  }
  ```

---

### 6.2 Authentication Module

#### `POST /api/auth/login`
- **คำอธิบาย:** ตรวจสอบความถูกต้องของบัญชีผู้ใช้และออก JSON Web Token
- **Request Body:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :---: | :--- | :--- |
  | `student_code` | `string` | Yes | รหัสนักศึกษา หรือ Username แอดมิน | `"6512345678-9"` หรือ `"admin01"` |
  | `password` | `string` | Yes | รหัสผ่านผู้ใช้งาน | `"123456"` |
  | `role` | `string` | No | บทบาทที่ต้องการเข้าใช้งาน (`student` หรือ `admin`) | `"student"` |

- **Request Example:**
  ```json
  {
    "student_code": "6512345678-9",
    "password": "123456",
    "role": "student"
  }
  ```

- **Response 200 OK:**
  ```json
  {
    "message": "เข้าสู่ระบบสำเร็จ",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "student_code": "6512345678-9",
      "name": "นายสมชาย รักเรียน",
      "email": "somchai.r@student.rmutl.ac.th",
      "role": "student"
    }
  }
  ```

- **Response 400 Bad Request:**
  ```json
  {
    "message": "กรุณากรอกรหัสประจำตัวและรหัสผ่านให้ครบถ้วน"
  }
  ```

- **Response 401 Unauthorized:**
  ```json
  {
    "message": "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง"
  }
  ```

- **Response 403 Forbidden:**
  ```json
  {
    "message": "สิทธิ์การเข้าใช้งานไม่ถูกต้องกับประเภทบัญชี"
  }
  ```

---

### 6.3 Machine Management Module

#### `GET /api/machines`
- **คำอธิบาย:** ดึงรายการเครื่องซักผ้าทั้งหมดในระบบ เรียงตามหมายเลขเครื่อง
- **Response 200 OK:**
  ```json
  [
    {
      "machine_id": 1,
      "machine_name": "เครื่องซักผ้า 1",
      "type": "ฝาหน้า 10kg",
      "location": "อาคาร 3 ชั้น 1",
      "status": "available",
      "created_at": "2026-10-01T08:00:00.000Z",
      "updated_at": "2026-10-05T14:30:00.000Z"
    },
    {
      "machine_id": 2,
      "machine_name": "เครื่องซักผ้า 2",
      "type": "ฝาบน 12kg",
      "location": "อาคาร 3 ชั้น 1",
      "status": "booked",
      "created_at": "2026-10-01T08:00:00.000Z",
      "updated_at": "2026-10-05T14:35:00.000Z"
    }
  ]
  ```

---

#### `GET /api/machines/:id`
- **คำอธิบาย:** ดึงข้อมูลรายละเอียดของเครื่องซักผ้ารายเครื่อง
- **URL Parameters:**
  - `id` (`integer`, Required): รหัสเครื่องซักผ้า เช่น `1`
- **Response 200 OK:**
  ```json
  {
    "machine_id": 1,
    "machine_name": "เครื่องซักผ้า 1",
    "type": "ฝาหน้า 10kg",
    "location": "อาคาร 3 ชั้น 1",
    "status": "available",
    "created_at": "2026-10-01T08:00:00.000Z",
    "updated_at": "2026-10-05T14:30:00.000Z"
  }
  ```
- **Response 404 Not Found:**
  ```json
  {
    "message": "ไม่พบเครื่องซักผ้านี้ในระบบ"
  }
  ```

---

#### `PUT /api/machines/:id/status`
- **คำอธิบาย:** อัปเดตสถานะของเครื่องซักผ้า และกระจายสัญญาณ Socket.io อัตโนมัติ
- **URL Parameters:** `id` (`integer`, Required)
- **Request Body:**
  | Field | Type | Required | Allowed Values | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `status` | `string` | Yes | `'available'`, `'in_use'`, `'booked'`, `'maintenance'` | สถานะใหม่ที่ต้องการตั้ง |

- **Request Example:**
  ```json
  {
    "status": "maintenance"
  }
  ```

- **Response 200 OK:**
  ```json
  {
    "message": "อัปเดตสถานะเครื่องซักผ้าเรียบร้อยแล้ว"
  }
  ```
- **Response 400 Bad Request:**
  ```json
  {
    "message": "สถานะเครื่องซักผ้าไม่ถูกต้อง"
  }
  ```
- **Response 404 Not Found:**
  ```json
  {
    "message": "ไม่พบเครื่องซักผ้านี้ในระบบ"
  }
  ```

---

### 6.4 Booking Management Module

#### `POST /api/bookings`
- **คำอธิบาย:** ทำการจองคิวเครื่องซักผ้า ระบบทำงานภายใต้ ACID Transaction พร้อม **Row-Level Lock (`SELECT ... FOR UPDATE`)** เพื่อรับประกันความถูกต้อง 100% เมื่อมีคำขอยิงเข้ามาพร้อมกัน (Zero Double-Booking)
- **Request Body:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :---: | :--- | :--- |
  | `user_id` | `integer` | Yes | รหัสผู้ใช้งานที่ทำการจอง | `1` |
  | `machine_id` | `integer` | Yes | รหัสเครื่องซักผ้าที่ต้องการจอง | `3` |
  | `booking_date` | `string` | Yes | วันที่จอง รูปแบบ `YYYY-MM-DD` | `"2026-10-19"` |
  | `time_slot` | `string` | Yes | ช่วงเวลาที่ต้องการจอง | `"16:00 - 17:00 น."` |

- **Request Example:**
  ```json
  {
    "user_id": 1,
    "machine_id": 3,
    "booking_date": "2026-10-19",
    "time_slot": "16:00 - 17:00 น."
  }
  ```

- **Response 201 Created:**
  ```json
  {
    "message": "จองคิวสำเร็จ",
    "booking_code": "RES-6143",
    "details": {
      "machine_id": 3,
      "booking_date": "2026-10-19",
      "time_slot": "16:00 - 17:00 น."
    }
  }
  ```

- **Response 400 Bad Request (กรณีข้อมูลไม่ครบ):**
  ```json
  {
    "message": "กรุณากรอกข้อมูลการจองให้ครบถ้วน"
  }
  ```

- **Response 400 Bad Request (กรณีจองซ้อน - ถูกปฏิเสธ):**
  ```json
  {
    "message": "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น"
  }
  ```

- **Response 400 Bad Request (กรณีจองวันในอดีตหรือเวลาที่เลยไปแล้ว):**
  ```json
  {
    "message": "ไม่สามารถจองช่วงเวลาในอดีตได้"
  }
  ```

- **Response 400 Bad Request (กรณีจองเกินกรอบ 15 วัน):**
  ```json
  {
    "message": "สามารถจองคิวล่วงหน้าได้ไม่เกิน 15 วัน"
  }
  ```

- **Response 404 Not Found (กรณีไม่พบเครื่อง):**
  ```json
  {
    "message": "ไม่พบเครื่องซักผ้านี้"
  }
  ```

---

#### `GET /api/bookings/all`
- **คำอธิบาย:** ดึงรายการประวัติการจองคิวทั้งหมดในระบบ สำหรับหน้าแสดงตารางของ Admin หรือนำไปกรองรอบเวลา
- **Response 200 OK:**
  ```json
  [
    {
      "booking_id": 12,
      "booking_code": "RES-6143",
      "machine_id": 3,
      "student_code": "6512345678-9",
      "name": "นายสมชาย รักเรียน",
      "machine_name": "เครื่องซักผ้า 3",
      "booking_date": "2026-10-19",
      "time_slot": "16:00 - 17:00 น.",
      "status": "active"
    }
  ]
  ```

---

#### `PUT /api/bookings/:id/cancel`
- **คำอธิบาย:** ยกเลิกรายการจองคิว (รองรับการส่งทั้ง `booking_id` เป็นตัวเลข หรือ `booking_code` เช่น `RES-6143`)
- **URL Parameters:**
  - `id` (`string` หรือ `integer`, Required): รหัสคิว เช่น `12` หรือ `RES-6143`
- **Response 200 OK:**
  ```json
  {
    "message": "ยกเลิกรายการจองคิวเรียบร้อยแล้ว"
  }
  ```
- **Response 400 Bad Request (กรณียกเลิกซ้ำ):**
  ```json
  {
    "message": "รายการจองนี้ถูกยกเลิกไปแล้ว"
  }
  ```
- **Response 404 Not Found:**
  ```json
  {
    "message": "ไม่พบรายการจองนี้ในระบบ"
  }
  ```

---

#### `GET /api/bookings/user/:userId/active`
- **คำอธิบาย:** ดึงรายการคิวที่ยังไม่หมดอายุและมีสถานะ `active` ของผู้ใช้งานคนนั้นๆ
- **URL Parameters:**
  - `userId` (`integer`, Required): รหัสผู้ใช้งาน เช่น `1`
- **Response 200 OK:**
  ```json
  [
    {
      "id": 12,
      "booking_code": "RES-6143",
      "machine_id": 3,
      "machineName": "เครื่องซักผ้า 3",
      "location": "อาคาร 3 ชั้น 1",
      "timeSlot": "16:00 - 17:00 น.",
      "booking_date": "2026-10-19",
      "status": "active",
      "created_at": "2026-10-05T14:45:00.000Z"
    }
  ]
  ```

---

### 6.5 Notification & Email Module

#### `POST /api/notifications/test-email`
- **คำอธิบาย:** ส่งอีเมลทดสอบการแจ้งเตือนไปยังที่อยู่ที่ระบุ (หากไม่ได้ตั้งค่า SMTP จริง จะรันในโหมด Mock Console)
- **Request Body:**
  ```json
  {
    "email": "student@example.com"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "message": "ส่งอีเมลแจ้งเตือนสำเร็จแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ",
    "details": {
      "to": "student@example.com",
      "smtpConfigured": true,
      "smtpHost": "smtp.gmail.com"
    }
  }
  ```

---

#### `POST /api/notifications/trigger-reminders`
- **คำอธิบาย:** สั่งให้ระบบ Cron / Scheduler ตรวจสอบคิวในฐานข้อมูลทันที และส่งอีเมลเตือนก่อนถึงเวลาซักผ้า 15-30 นาที
- **Response 200 OK:**
  ```json
  {
    "message": "กระตุ้นการตรวจสอบคิวและส่งอีเมลแจ้งเตือนสำเร็จ"
  }
  ```

---

## 7. ข้อกำหนดสัญญาณ Real-Time (Socket.io Event Contract)

ระบบ WashQ ติดตั้ง **Socket.io** เพื่อให้ผู้ใช้ทุกคนเห็นสถานะของเครื่องซักผ้าและการจองคิวแบบปัจจุบันทันด่วน โดยไม่ต้องกดรีเฟรชหน้าจอ (F5)

### 7.1 ข้อมูลการเชื่อมต่อ (Client Connection)
```javascript
import { io } from 'socket.io-client';

const socket = io('https://washq-n9fj.onrender.com', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10
});
```

### 7.2 รายการ Event ที่ส่งจากเซิร์ฟเวอร์ (Server-to-Client Events)

| Event Name | เงื่อนไขที่ระบบส่งสัญญาณ | Payload ตัวอย่าง |
| :--- | :--- | :--- |
| **`booking_created`** | เมื่อมีผู้ใช้จองคิวสำเร็จ เพื่อให้หน้า TimeSlots ล็อกรอบเวลานี้ทันที | ```json { "machine_id": 3, "time_slot": "16:00 - 17:00 น.", "booking_date": "2026-10-19", "booking_code": "RES-6143" } ``` |
| **`booking_cancelled`** | เมื่อมีการยกเลิกคิว เพื่อให้รอบเวลากลับมาแสดงสถานะ "ว่าง" | ```json { "machine_id": 3, "booking_code": "RES-6143" } ``` |
| **`machine_status_updated`**| เมื่อสถานะเครื่องซักผ้าเปลี่ยน (เช่น จองแล้ว, ว่าง, หรือแอดมินปิดซ่อม) | ```json { "machine_id": 3, "status": "booked" } ``` |

---

## 8. พจนานุกรมข้อมูล (Data Dictionary & Schemas)

### 8.1 Schema ตาราง `users`
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `user_id` | `INT AUTO_INCREMENT` | No | PK | รหัสประจำตัวผู้ใช้ (Primary Key) |
| `student_code` | `VARCHAR(20)` | No | UNIQUE | รหัสนักศึกษา หรือ Username แอดมิน |
| `password_hash` | `VARCHAR(255)` | No | - | รหัสผ่านที่เข้ารหัสด้วย bcrypt |
| `email` | `VARCHAR(100)` | No | UNIQUE | อีเมลสำหรับรับการแจ้งเตือน |
| `name` | `VARCHAR(100)` | No | - | ชื่อ-นามสกุล |
| `role` | `ENUM('student', 'admin')` | Yes | `'student'` | สิทธิ์การเข้าใช้งานระบบ |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | วันเวลาที่สร้างบัญชี |
| `updated_at` | `TIMESTAMP` | Yes | `ON UPDATE` | วันเวลาที่แก้ไขข้อมูลล่าสุด |

### 8.2 Schema ตาราง `machines`
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `machine_id` | `INT AUTO_INCREMENT` | No | PK | รหัสเครื่องซักผ้า |
| `machine_name` | `VARCHAR(50)` | No | - | ชื่อเครื่อง เช่น "เครื่องซักผ้า 1" |
| `type` | `VARCHAR(50)` | Yes | `'ฝาหน้า 10kg'` | ประเภทและขนาดความจุ |
| `location` | `VARCHAR(100)` | Yes | `'อาคาร 3 ชั้น 1'`| ตำแหน่งที่ตั้งเครื่อง |
| `status` | `ENUM(...)` | Yes | `'available'` | สถานะ: `available`, `in_use`, `booked`, `maintenance` |

### 8.3 Schema ตาราง `bookings`
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `booking_id` | `INT AUTO_INCREMENT` | No | PK | รหัสการจองคิว |
| `booking_code` | `VARCHAR(20)` | No | UNIQUE | รหัสอ้างอิงบัตรคิว เช่น `RES-6143` |
| `user_id` | `INT` | No | FK | เชื่อมโยงกับ `users(user_id)` |
| `machine_id` | `INT` | No | FK | เชื่อมโยงกับ `machines(machine_id)` |
| `booking_date` | `DATE` | No | - | วันที่จองใช้งาน (`YYYY-MM-DD`) |
| `time_slot` | `VARCHAR(50)` | No | - | รอบเวลา เช่น `16:00 - 17:00 น.` |
| `status` | `ENUM(...)` | Yes | `'active'` | สถานะ: `active`, `cancelled`, `completed` |
| `reminder_sent`| `TINYINT(1)` | Yes | `0` | สถานะการส่งเมลเตือน (0: ยังไม่ส่ง, 1: ส่งแล้ว) |

---

## 9. กฎเกณฑ์ทางธุรกิจและความถูกต้องของข้อมูล (Business & Validation Rules)

1. **การจองล่วงหน้า (Forward Booking Window):**
   - อนุญาตให้จองคิวล่วงหน้าได้ไม่เกิน **15 วัน** นับจากวันที่ปัจจุบัน
2. **การบล็อกการจองย้อนหลัง (Past Time Slot Prevention):**
   - ไม่อนุญาตให้เลือกวันที่ย้อนหลังในอดีต (`date < today`)
   - หากเลือกจองในวันปัจจุบัน ("วันนี้") ระบบจะตรวจสอบเวลาตามเขตเวลาประเทศไทย (`Asia/Bangkok`) หากรอบเวลาเริ่มต้นก่อนเวลาปัจจุบัน คำขอจะถูกปฏิเสธด้วยรหัส **400 Bad Request**
3. **การป้องกัน Race Condition / Double Booking:**
   - การประมวลผลคำขอจองคิวทำงานด้วย Database Transaction พร้อมคำสั่ง `SELECT ... FOR UPDATE` ล็อกแถวของเครื่องซักผ้านั้นๆ ไว้ทันที ทำให้รับคำขอแรกได้เพียงคนเดียว และปฏิเสธคำขอที่ยิงชนพร้อมกันในเสี้ยววินาทีอย่างแม่นยำ
4. **การคำนวณสถานะเครื่องซักผ้าอัตโนมัติ:**
   - เมื่อจองคิวสำเร็จ เครื่องจะถูกอัปเดตสถานะเป็น `booked`
   - เมื่อยกเลิกคิว ระบบจะตรวจสอบว่าเครื่องนั้นยังมีคิวที่ `active` อยู่อีกหรือไม่ หากไม่มีจะเปลี่ยนกลับเป็น `available` ทันที
