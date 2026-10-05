# 🧪 WashQ - รายงานผลการทดสอบระบบและการแก้ไขจุดบกพร่อง (Testing & Debugging Report)

> **Sprint 3: สัปดาห์ที่ 4 - Testing & Deployment**  
> **โปรเจกต์:** WashQ - Smart Laundry Queue Reservation System  
> **เอกสารประกอบ:** แผนการทดสอบ (Test Plan), แบบประเมิน (Test Cases), ผลการทดสอบ (Test Results), การทดสอบการจองพร้อมกัน (Concurrency Test), แบบทดสอบการยอมรับของผู้ใช้ (UAT) และ บันทึกการแก้ไขข้อผิดพลาด (Bug Fixing & Debugging Report)

---

## 📑 สารบัญ (Table of Contents)
1. [ภาพรวมของแผนการทดสอบ (Test Overview & Scope)](#1-ภาพรวมของแผนการทดสอบ-test-overview--scope)
2. [สภาพแวดล้อมและเครื่องมือที่ใช้ทดสอบ (Test Environment & Tools)](#2-สภาพแวดล้อมและเครื่องมือที่ใช้ทดสอบ-test-environment--tools)
3. [ตารางรายการทดสอบทั้งหมด (Test Case Matrix)](#3-ตารางรายการทดสอบทั้งหมด-test-case-matrix)
4. [ผลการทดสอบระดับหน่วย (Unit Testing Report)](#4-ผลการทดสอบระดับหน่วย-unit-testing-report)
5. [ผลการทดสอบระดับบูรณาการ (Integration Testing Report)](#5-ผลการทดสอบระดับบูรณาการ-integration-testing-report)
6. [การทดสอบการจองพร้อมกัน (Concurrent Booking / Race Condition Test)](#6-การทดสอบการจองพร้อมกัน-concurrent-booking--race-condition-test)
7. [การทดสอบการยอมรับของผู้ใช้งาน (User Acceptance Testing - UAT)](#7-การทดสอบการยอมรับของผู้ใช้งาน-user-acceptance-testing---uat)
8. [รายงานการแก้ไขจุดบกพร่อง (Bug Fixing & Debugging Report)](#8-รายงานการแก้ไขจุดบกพร่อง-bug-fixing--debugging-report)
9. [สถานะการติดตั้งขึ้นระบบจริง (Production Deployment Status)](#9-สถานะการติดตั้งขึ้นระบบจริง-production-deployment-status)
10. [สรุปผลการประเมิน (Conclusion)](#10-สรุปผลการประเมิน-conclusion)

---

## 1. ภาพรวมของแผนการทดสอบ (Test Overview & Scope)

การทดสอบใน Sprint 3 มุ่งเน้นการตรวจสอบความถูกต้อง ความมั่นคงปลอดภัย และความเสถียรของระบบอย่างรอบด้านตามข้อกำหนดการส่งมอบงานสัปดาห์ที่ 4:
- **Unit Testing:** ตรวจสอบตรรกะระดับฟังก์ชันย่อย เช่น การแฮชรหัสผ่าน (bcrypt), การเข้ารหัสและยืนยันตัวตน (JWT), Middleware สิทธิ์การเข้าถึง และฟังก์ชันตรวจสอบเงื่อนไขการจอง (Validation)
- **Integration Testing:** ตรวจสอบการทำงานประสานกันระหว่าง REST API Endpoints และฐานข้อมูลจริง (MySQL Cloud)
- **Concurrent Booking (Race Condition):** ทดสอบการกดจองคิวเครื่องเดียวกันและรอบเวลาเดียวกันจากผู้ใช้หลายรายพร้อมกันในเสี้ยววินาที เพื่อป้องกันการจองซ้อน (Double Booking)
- **User Acceptance Testing (UAT):** ตรวจสอบ Functional Scenario ตามมุมมองของผู้ใช้งานจริง (นักศึกษา และ ผู้ดูแลระบบ)
- **Bug Fixing & Debugging:** บันทึกสาเหตุ การแก้ไข และการทดสอบซ้ำของข้อผิดพลาดที่พบบน Production

---

## 2. สภาพแวดล้อมและเครื่องมือที่ใช้ทดสอบ (Test Environment & Tools)

| ประเภทเครื่องมือ | เครื่องมือ / ไลบรารี | เวอร์ชัน | วัตถุประสงค์การใช้งาน |
| :--- | :--- | :--- | :--- |
| **Test Runner & Framework** | Jest | `v30.5.2` | เฟรมเวิร์กหลักสำหรับรัน Assertions, Mocks และ Test Suites |
| **HTTP Integration Testing** | Supertest | `v7.3.1` | จำลอง HTTP Request/Response ยิงเข้า Express API โดยตรง |
| **Concurrency Simulation** | Node.js Asynchronous `Promise.all` | `v20.x` | จำลอง Concurrent Request ส่งพร้อมกันระดับ Millisecond |
| **Database Engine** | Aiven Cloud MySQL | `8.4.x` | ฐานข้อมูลทดสอบและ Production เชื่อมต่อผ่าน SSL (`ssl: { rejectUnauthorized: false }`) |
| **Server Engine** | Node.js + Express | `v20.x / 4.19.2` | RESTful API Engine |
| **Realtime Engine** | Socket.io Client / Server | `v4.7.5` | ทดสอบการส่ง Event ข้าม Client เมื่อสถานะเปลี่ยนแปลง |

---

## 3. ตารางรายการทดสอบทั้งหมด (Test Case Matrix)

### 3.1 Unit Test Cases (16 Test Cases)
| รหัสทดสอบ | รายการทดสอบ (Test Description) | ข้อมูลนำเข้า (Input) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ |
| :--- | :--- | :--- | :--- | :---: |
| **TC-UNIT-AUTH-01** | ตรวจสอบการเข้ารหัสรหัสผ่านด้วย `bcrypt.hash` | ข้อความรหัสผ่าน Plaintext | ได้ Salted Hash ความยาว 60 ตัวอักษร ขึ้นต้น `$2b$` | ✅ PASS |
| **TC-UNIT-AUTH-02** | ตรวจสอบการตรวจสอบรหัสผ่านที่ถูกต้องด้วย `bcrypt.compare` | Plaintext เดิม + Hash | คืนค่า `true` | ✅ PASS |
| **TC-UNIT-AUTH-03** | ตรวจสอบการปฏิเสธรหัสผ่านที่ไม่ถูกต้อง | Plaintext ผิด + Hash | คืนค่า `false` | ✅ PASS |
| **TC-UNIT-AUTH-04** | ตรวจสอบการสร้าง JWT Access Token | Payload `{ id, role, student_id }` | ได้ JWT String 3 ส่วนคั่นด้วยจุด (`.`) | ✅ PASS |
| **TC-UNIT-AUTH-05** | ตรวจสอบการถอดรหัสและยืนยันสิทธิ์ JWT ที่ถูกต้อง | Valid Token + Secret | ได้ Decoded Payload ตรงกับที่สร้างไว้ | ✅ PASS |
| **TC-UNIT-AUTH-06** | ตรวจสอบการปฏิเสธ JWT Token ที่ถูกปลอมแปลง | Tampered Token | โยนข้อผิดพลาด `JsonWebTokenError: invalid signature` | ✅ PASS |
| **TC-UNIT-AUTH-07** | ตรวจสอบ Middleware `verifyToken` เมื่อส่ง Token ครบถ้วน | Header `Bearer <valid_token>` | เรียก `next()` และแนบ `req.user` ถูกต้อง | ✅ PASS |
| **TC-UNIT-AUTH-08** | ตรวจสอบ Middleware `verifyToken` เมื่อไม่มี Authorization Header | ไม่มี Header | ส่งคืนสถานะ `401 Unauthorized` | ✅ PASS |
| **TC-UNIT-AUTH-09** | ตรวจสอบ Middleware `requireAdmin` ปฏิเสธผู้ใช้บทบาท student | `req.user = { role: 'student' }` | ส่งคืนสถานะ `403 Forbidden` | ✅ PASS |
| **TC-UNIT-VAL-01** | ตรวจสอบรูปแบบรหัสการจอง (Reservation Code Format) | สุ่มสร้างรหัสจองคิว | ตรงตาม Regex `^RES-[A-Z0-9]{4,6}$` | ✅ PASS |
| **TC-UNIT-VAL-02** | ตรวจสอบอนุญาตการจองล่วงหน้าในกรอบ 15 วัน | วันนี้ ถึง วันนี้ + 14 วัน | ฟังก์ชันคำนวณคืนค่าว่าอยู่ในช่วงที่อนุญาต | ✅ PASS |
| **TC-UNIT-VAL-03** | ตรวจสอบปฏิเสธการจองล่วงหน้าเกิน 15 วัน | วันที่ = วันนี้ + 16 วัน | ฟังก์ชันคำนวณปฏิเสธคำขอจอง | ✅ PASS |
| **TC-UNIT-VAL-04** | ตรวจสอบปฏิเสธการเลือกวันที่ย้อนหลังในอดีต | วันที่ = วันนี้ - 1 วัน | ฟังก์ชันคำนวณปฏิเสธคำขอจอง | ✅ PASS |
| **TC-UNIT-VAL-05** | ตรวจสอบการแปลงฟอร์แมตวันที่แบบ ISO เป็น `YYYY-MM-DD` | `new Date()` | สตริง 10 ตัวอักษร เช่น `2026-10-19` | ✅ PASS |
| **TC-UNIT-VAL-06** | ตรวจสอบการจัดรูปแบบช่วงเวลา (Time Slot Format) | ตัวเลขช่วงเวลา | สตริงตามฟอร์แมต `HH:mm - HH:mm น.` | ✅ PASS |
| **TC-UNIT-VAL-07** | ตรวจสอบการบล็อกรอบเวลาที่ผ่านไปแล้วในวันปัจจุบัน | เวลาปัจจุบัน 15:30 น., เลือกรอบ 14:00 น. | ฟังก์ชันตรวจจับว่ารอบเวลาหมดอายุแล้ว | ✅ PASS |

---

### 3.2 Integration Test Cases (16 Test Cases)
| รหัสทดสอบ | Endpoint / Feature | ข้อมูลนำเข้า (Input) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ |
| :--- | :--- | :--- | :--- | :---: |
| **TC-INT-AUTH-01** | `POST /api/auth/login` | รหัสนักศึกษาและรหัสผ่านถูกต้อง | ได้รับ HTTP 200, JWT token, ข้อมูล user | ✅ PASS |
| **TC-INT-AUTH-02** | `POST /api/auth/login` | ข้อมูลบัญชีผู้ดูแลระบบ (Admin) | ได้รับ HTTP 200, JWT token, `role: admin` | ✅ PASS |
| **TC-INT-AUTH-03** | `POST /api/auth/login` | รหัสผ่านไม่ถูกต้อง | ได้รับ HTTP 401: "รหัสผ่านไม่ถูกต้อง" | ✅ PASS |
| **TC-INT-AUTH-04** | `POST /api/auth/login` | รหัสนักศึกษาที่ไม่มีในระบบ | ได้รับ HTTP 404: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" | ✅ PASS |
| **TC-INT-MACH-01** | `GET /api/machines` | - | ได้รับ HTTP 200 และ Array เครื่องซักผ้าทั้งหมด | ✅ PASS |
| **TC-INT-MACH-02** | `GET /api/machines/:id` | `id = 1` | ได้รับ HTTP 200 และ Object ข้อมูลเครื่องซักผ้า | ✅ PASS |
| **TC-INT-MACH-03** | `GET /api/machines/:id` | `id = 999999` (ไม่มีอยู่จริง) | ได้รับ HTTP 404: "ไม่พบเครื่องซักผ้านี้" | ✅ PASS |
| **TC-INT-MACH-04** | `PATCH /api/machines/:id/status` | Token Admin, `status: maintenance` | ได้รับ HTTP 200 และสถานะเปลี่ยนเป็น maintenance | ✅ PASS |
| **TC-INT-MACH-05** | `PATCH /api/machines/:id/status` | Token Admin, `status: invalid_status` | ได้รับ HTTP 400: "สถานะไม่ถูกต้อง" | ✅ PASS |
| **TC-INT-BOOK-01** | `POST /api/bookings` | ข้อมูลจองคิวใหม่ที่ยังไม่มีใครจอง | ได้รับ HTTP 201, คืนค่า booking ID และ RES code | ✅ PASS |
| **TC-INT-BOOK-02** | `POST /api/bookings` | ข้อมูลจองซ้ำเครื่องเดิมและรอบเดิม | ได้รับ HTTP 400: "ช่วงเวลานี้ถูกจองไปแล้ว..." | ✅ PASS |
| **TC-INT-BOOK-03** | `POST /api/bookings` | ข้อมูลจองไม่ครบ (ขาด `machine_id`) | ได้รับ HTTP 400: "กรุณาระบุข้อมูลให้ครบถ้วน" | ✅ PASS |
| **TC-INT-BOOK-04** | `GET /api/bookings/user/:id/active` | `id = 1` | ได้รับ HTTP 200 พร้อม Array คิวที่ Active | ✅ PASS |
| **TC-INT-BOOK-05** | `PATCH /api/bookings/:id/cancel` | Booking ID ที่กำลัง Active | ได้รับ HTTP 200: "ยกเลิกการจองสำเร็จ" | ✅ PASS |
| **TC-INT-BOOK-06** | `PATCH /api/bookings/:id/cancel` | Booking ID เดิมที่ถูกยกเลิกไปแล้ว | ได้รับ HTTP 400: ปฏิเสธการยกเลิกซ้ำ | ✅ PASS |
| **TC-INT-SYS-01** | `GET /health` | - | ได้รับ HTTP 200, `status: ok, database: connected` | ✅ PASS |

---

### 3.3 Concurrency Test Case (1 Test Case)
| รหัสทดสอบ | รายการทดสอบ | เงื่อนไขจำลอง (Simulation Setup) | เกณฑ์การตัดสิน (Pass Criteria) | สถานะ |
| :--- | :--- | :--- | :--- | :---: |
| **TC-CONCUR-01** | ทดสอบการกดจองคิวพร้อมกัน (Race Condition Simulation) | 5 คำขอพร้อมกันในมิลลิวินาทีเดียวกัน บน Machine 3, Date 2026-10-19, Slot 16:00 - 17:00 น. | สำเร็จ 1 รายการ (201 Created), ปฏิเสธ 4 รายการ (400 Bad Request), บันทึกลงฐานข้อมูลเพียง 1 รายการ | ✅ PASS |

---

## 4. ผลการทดสอบระดับหน่วย (Unit Testing Report)

การทดสอบระดับหน่วย (Unit Tests) ดำเนินการทดสอบฟังก์ชันสำคัญโดยแยกส่วนออกจากระบบเครือข่าย เพื่อรับประกันความถูกต้องแม่นยำของ Business Logic และความปลอดภัย

```text
 PASS  tests/unit/auth.test.js
  Unit Tests: Authentication & Security Logic
    1. Password Hashing (bcrypt)
      ✓ TC-UNIT-AUTH-01: should hash a password correctly with bcrypt (73 ms)
      ✓ TC-UNIT-AUTH-02: should verify a correct password against hash (62 ms)
      ✓ TC-UNIT-AUTH-03: should reject an incorrect password (62 ms)
    2. JSON Web Token (JWT) Handling
      ✓ TC-UNIT-AUTH-04: should generate a valid JWT token string (2 ms)
      ✓ TC-UNIT-AUTH-05: should verify and decode a valid token correctly (1 ms)
      ✓ TC-UNIT-AUTH-06: should reject an altered / invalid token (1 ms)
    3. Middleware Protection Logic
      ✓ TC-UNIT-AUTH-07: verifyToken should pass valid authorization header (1 ms)
      ✓ TC-UNIT-AUTH-08: verifyToken should reject request missing auth header (1 ms)
      ✓ TC-UNIT-AUTH-09: requireAdmin should block non-admin users with 403 (1 ms)

 PASS  tests/unit/validation.test.js
  Unit Tests: Business Rules & Validation Logic
    1. Booking Code Generator Format
      ✓ TC-UNIT-VAL-01: should generate booking code with RES- prefix and valid pattern (1 ms)
    2. 15-Day Booking Window Validation
      ✓ TC-UNIT-VAL-02: should accept booking date within 15-day range (1 ms)
      ✓ TC-UNIT-VAL-03: should reject booking date beyond 15-day window (0 ms)
      ✓ TC-UNIT-VAL-04: should reject booking date in the past (1 ms)
    3. Time Slot Formatting & Expiration Rules
      ✓ TC-UNIT-VAL-05: should format date correctly as YYYY-MM-DD (0 ms)
      ✓ TC-UNIT-VAL-06: should format time slot range string correctly (1 ms)
      ✓ TC-UNIT-VAL-07: should identify whether a slot on today has already passed (1 ms)

Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        0.485 s
```

---

## 5. ผลการทดสอบระดับบูรณาการ (Integration Testing Report)

การทดสอบระดับบูรณาการ (Integration Tests) ทดสอบการทำงานจริงร่วมกับ Aiven Cloud MySQL Database ผ่าน HTTP Supertest เพื่อทดสอบ RESTful API Response Code, Data Payload และ Constraints

```text
 PASS  tests/integration/api.integration.test.js
  Integration Tests: WashQ API Full System
    1. Authentication Endpoints (/api/auth)
      ✓ IT-AUTH-01: should login student successfully and return JWT (285 ms)
      ✓ IT-AUTH-02: should login admin successfully and return admin role (180 ms)
      ✓ IT-AUTH-03: should reject login with wrong password with 401 (172 ms)
      ✓ IT-AUTH-04: should reject non-existent student id with 404 (160 ms)
    2. Machine Management Endpoints (/api/machines)
      ✓ IT-MACH-01: should return all machines with status and details (165 ms)
      ✓ IT-MACH-02: should return single machine by valid ID (162 ms)
      ✓ IT-MACH-03: should return 404 for non-existent machine ID (160 ms)
      ✓ IT-MACH-04: should update machine status (Admin) (175 ms)
      ✓ IT-MACH-05: should reject invalid machine status with 400 (155 ms)
    3. Booking Lifecycle Endpoints (/api/bookings)
      ✓ IT-BOOK-01: should create a new booking successfully (201) (195 ms)
      ✓ IT-BOOK-02: should reject duplicate booking for the same slot (400 Conflict/Double Booking) (165 ms)
      ✓ IT-BOOK-03: should reject booking with missing required fields (400) (150 ms)
      ✓ IT-BOOK-04: should fetch user active bookings list (160 ms)
      ✓ IT-BOOK-05: should cancel active booking successfully (200) (185 ms)
      ✓ IT-BOOK-06: should reject cancelling an already cancelled booking (400) (160 ms)
    4. Health & System Endpoints
      ✓ IT-SYS-01: /health endpoint should return status ok and database connected (155 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        2.872 s
```

---

## 6. การทดสอบการจองพร้อมกัน (Concurrent Booking / Race Condition Test)

### 6.1 สมมติฐานและความเสี่ยง (Hypothesis & Risk Analysis)
ในระบบจองคิวที่มีผู้ใช้งานจำนวนมาก ความเสี่ยงที่สำคัญที่สุดคือ **Race Condition (Double-Booking)** เกิดขึ้นเมื่อผู้ใช้อย่างน้อย 2 คน กดเลือกจองเครื่องเดียวกันและรอบเวลาเดียวกันในเวลาเสี้ยววินาทีเดียวกัน หากระบบหลังบ้านไม่มีการล็อกระดับฐานข้อมูล (Transaction Lock / Unique Key Check) อาจเกิดข้อผิดพลาดที่ทั้ง 2 คนได้รับคิวเดียวกัน

### 6.2 กลยุทธ์การทดสอบ (Testing Strategy)
สร้างสคริปต์อัตโนมัติ `api/scripts/test-concurrent-booking.js` โดยใช้เทคนิค `Promise.all` ส่ง HTTP Request จำนวน **5 คำขอพร้อมกัน** ไปยัง Endpoint `POST /api/bookings` เพื่อแย่งจอง:
- **เครื่อง:** เครื่องซักผ้าหมายเลข 3
- **วันที่:** `2026-10-19`
- **ช่วงเวลา:** `16:00 - 17:00 น.`

### 6.3 ผลการรันสคริปต์จริง (CLI Execution Log)
```text
============================================================
⚡ WASHQ - SPRINT 3: CONCURRENT BOOKING TEST (ทดสอบการจองพร้อมกัน)
============================================================
📌 พารามิเตอร์การทดสอบ:
   - รหัสเครื่องซักผ้า: เครื่องที่ 3
   - วันที่จอง:         2026-10-19
   - ช่วงเวลา:         16:00 - 17:00 น.
   - จำนวนคำขอพร้อมกัน: 5 คน (จำลองกดพร้อมกันในเสี้ยววินาที)
------------------------------------------------------------
⏳ กำลังยิงคำขอ 5 รายการพร้อมกัน (Promise.all)...

📊 รายงานผลลัพธ์คำขอแต่ละรายการ:
   [คำขอที่ 1] ผู้ใช้ ID: 1 | สถานะ: ✅ สำเร็จ (201) | ใช้เวลา: 271ms
              ข้อความ: "จองคิวสำเร็จ" (รหัส: RES-6143)
   [คำขอที่ 2] ผู้ใช้ ID: 2 | สถานะ: ❌ ถูกปฏิเสธ (400) | ใช้เวลา: 505ms
              ข้อความ: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น" 
   [คำขอที่ 3] ผู้ใช้ ID: 1 | สถานะ: ❌ ถูกปฏิเสธ (400) | ใช้เวลา: 514ms
              ข้อความ: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น" 
   [คำขอที่ 4] ผู้ใช้ ID: 2 | สถานะ: ❌ ถูกปฏิเสธ (400) | ใช้เวลา: 522ms
              ข้อความ: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น" 
   [คำขอที่ 5] ผู้ใช้ ID: 1 | สถานะ: ❌ ถูกปฏิเสธ (400) | ใช้เวลา: 593ms
              ข้อความ: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น" 
------------------------------------------------------------
🔍 สรุปการตรวจสอบผลลัพธ์ (Assertion Summary):
   - จำนวนคำขอที่ได้รับอนุญาตให้จอง: 1 รายการ (เป้าหมาย: 1)
   - จำนวนคำขอที่ถูกปฏิเสธป้องกันซ้ำ: 4 รายการ (เป้าหมาย: 4)
   - จำนวนแถวที่ถูกบันทึกลงฐานข้อมูลจริง: 1 แถว (เป้าหมาย: 1)

🎉 PASS: ระบบผ่านการทดสอบการจองพร้อมกัน 100%!
   ไม่มีการจองซ้ำซ้อน (Zero Double-Booking) ระบบจัดการ Race Condition ได้อย่างถูกต้อง
============================================================
```

### 6.4 การตรวจสอบความสมบูรณ์ของฐานข้อมูล (Database Integrity Verification)
จากการตรวจสอบตาราง `bookings` บนฐานข้อมูลจริง พบว่า:
1. แถวข้อมูลถูกบันทึกเพียง **1 แถว** (Reservation Code: `RES-6143`)
2. คำขอที่ตามมาอีก 4 รายการ ถูกตรวจพบและปฏิเสธด้วยข้อความตอบกลับ `ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกรอบอื่น` ทันที ป้องกันการสูญหายหรือทับซ้อนของข้อมูลได้ 100%

---

## 7. การทดสอบการยอมรับของผู้ใช้งาน (User Acceptance Testing - UAT)

การทดสอบ UAT จัดทำขึ้นเพื่อจำลองการใช้งานตามบทบาทของผู้ใช้งานจริง 2 กลุ่ม:

### 7.1 บุคคลทดสอบ (User Personas)
- **Persona A (นักศึกษา - Student):** นายสมชาย รักเรียน (รหัส: `6512345678-9`)
- **Persona B (ผู้ดูแลระบบ - Admin):** อาจารย์ธนากร กวยพูน (Username: `admin01`)

### 7.2 บันทึกผลการทดสอบ UAT (UAT Test Execution Sheet)

| รหัส UAT | บทบาท | ขั้นตอนการทดสอบ (Scenario & Steps) | ผลลัพธ์ที่คาดหวัง | ผลลัพธ์จริง | ผลการประเมิน |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **UAT-01** | Student | 1. เข้าหน้าเว็บ `https://washq-1.onrender.com`<br>2. กรอกรหัสนักศึกษาและรหัสผ่าน `123456`<br>3. กดปุ่ม "เข้าสู่ระบบ" | เข้าสู่หน้า Dashboard แสดงชื่อ-สกุล และรายการเครื่องซักผ้าถูกต้อง | เข้าสู่ระบบสำเร็จ แสดงแผงควบคุมและข้อมูลผู้ใช้ครบถ้วน | **ผ่าน (PASS)** |
| **UAT-02** | Student | 1. เลือกเครื่องซักผ้าที่สถานะ "ว่าง" (Available)<br>2. เลือกวันที่ต้องการจอง (ไม่เกิน 15 วันข้างหน้า)<br>3. เลือกรอบเวลาที่ต้องการ<br>4. กดยืนยันการจอง | ระบบสร้างรหัสคิว เช่น `RES-XXXX` และแสดงบัตรคิวในหน้า Dashboard | สร้างคิวสำเร็จ บัตรคิวแสดงรหัส วันที่ เวลา และสถานะ "รอดำเนินการ" | **ผ่าน (PASS)** |
| **UAT-03** | Student | 1. ตรวจสอบบัตรคิวที่จองไว้<br>2. กดปุ่ม "ยกเลิกการจอง"<br>3. ยืนยันการยกเลิก | บัตรคิวหายไปจากหน้าผู้ใช้ และรอบเวลาในหน้ารายการเปลี่ยนกลับมาเป็น "ว่าง" ทันที | คิวถูกยกเลิกสำเร็จ และสถานะอัปเดตแบบเรียลไทม์ | **ผ่าน (PASS)** |
| **UAT-04** | Admin | 1. เข้าสู่ระบบด้วยบัญชี `admin01`<br>2. ไปที่หน้า "รายการคิวทั้งหมด" (Queue Management)<br>3. ดูรายการจองของนักศึกษาทุกคน<br>4. กดปุ่มยกเลิกคิวที่มีปัญหา | แสดงรายการจองทั้งหมด และสามารถยกเลิกคิวได้ทันทีโดยมีการแจ้งเตือนยืนยัน | แสดงคิวทั้งหมดถูกต้อง สามารถสั่งยกเลิกคิวได้สำเร็จ | **ผ่าน (PASS)** |
| **UAT-05** | Admin | 1. ไปที่เมนู "จัดการเครื่องซักผ้า" (Machine Management)<br>2. เลือกเครื่องที่ต้องการแล้วเปลี่ยนสถานะเป็น "ซ่อมบำรุง" (Maintenance) | สถานะเครื่องเปลี่ยนเป็น Maintenance ทันที และหน้านักศึกษาถูกปิดไม่ให้กดจอง | เครื่องเปลี่ยนเป็นปิดปรับปรุง นักศึกษาไม่สามารถเลือกจองได้ | **ผ่าน (PASS)** |
| **UAT-06** | Student & Admin | 1. เปิดหน้าจอ Student และ Admin พร้อมกัน 2 หน้าจอ<br>2. Student กดจองคิวเครื่องซักผ้า | หน้าจอ Admin แสดงรายการจองใหม่ปรากฏขึ้นทันทีโดยไม่ต้องกดรีเฟรชหน้าจอ (F5) | Socket.io ส่งสัญญาณอัปเดตข้อมูลบนหน้าจอ Admin ทันที | **ผ่าน (PASS)** |

---

## 8. รายงานการแก้ไขจุดบกพร่อง (Bug Fixing & Debugging Report)

ตารางสรุปรายการจุดบกพร่องที่ตรวจพบบน Production และกระบวนการแก้ไขเชิงลึก:

### 🐛 Bug #1: ข้อผิดพลาด SQL ANSI Quotes ใน MySQL 8.4 (Aiven Cloud)
- **อาการ (Symptom):** เมื่อผู้ใช้กดยกเลิกการจองคิว หรือกดยืนยันการจอง ระบบแจ้งเตือน `500 Internal Server Error`
- **ข้อความ Error Log:**
  ```text
  code: 'ER_BAD_FIELD_ERROR',
  sqlMessage: "Unknown column 'cancelled' in 'field list'"
  ```
- **การวิเคราะห์สาเหตุ (Root Cause Analysis):**
  Aiven Cloud MySQL รันด้วยโหมด `ANSI_QUOTES` ตามมาตรฐาน ANSI SQL ซึ่งเครื่องหมายคำพูดคู่ (`"`) จะถูกตีความเป็นชื่อคอลัมน์ (Column Identifier) ไม่ใช่ค่าสตริง (String Literal) เมื่อคำสั่ง SQL เขียนว่า:
  `UPDATE bookings SET status = "cancelled" WHERE id = ?`
  MySQL จึงค้นหาคอลัมน์ชื่อ `cancelled` ส่งผลให้คำสั่งล้มเหลว
- **วิธีแก้ไข (Fix):**
  ปรับปรุงคำสั่ง SQL ทั้งหมดใน `api/controllers/bookingController.js` ให้ใช้ Parameterized Query (`?`) หรือใช้ Single Quotes (`'`) สำหรับ String Literals:
  ```javascript
  // ก่อนแก้ไข:
  await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id]);
  
  // หลังแก้ไข:
  await db.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', id]);
  ```
- **การทดสอบซ้ำ (Verification):** รัน Integration Test `IT-BOOK-05` และ `IT-BOOK-06` ผลการทดสอบผ่านฉลุย HTTP 200

---

### 🐛 Bug #2: ปัญหาพอร์ตชนกัน (Port Collision) ระหว่างรัน Supertest
- **อาการ (Symptom):** เมื่อรันชุดทดสอบด้วย Jest เกิดข้อผิดพลาด `Error: listen EADDRINUSE: address already in use :::5000`
- **การวิเคราะห์สาเหตุ (Root Cause Analysis):**
  ไฟล์ `api/server.js` มีคำสั่ง `server.listen(PORT)` ทำงานทันทีเมื่อไฟล์ถูก `require()` เข้ามาในชุดทดสอบ เมื่อ Jest รันหลาย Test Files พร้อมกันทำให้เกิดการพยายามเปิด Port 5000 ซ้ำซ้อน
- **วิธีแก้ไข (Fix):**
  เพิ่มเงื่อนไขตรวจสอบว่าไฟล์กำลังถูกรันเป็น Main Process หรือถูก Import ใน `api/server.js`:
  ```javascript
  if (require.main === module) {
    server.listen(PORT, HOST, () => {
      console.log(`🚀 WashQ Server is running on http://${HOST}:${PORT}`);
    });
  }
  module.exports = { app, server, io };
  ```
- **การทดสอบซ้ำ (Verification):** รัน Jest 4 Test Suites พร้อมกัน ผลลัพธ์ผ่านทั้งหมดโดยไม่มีการแย่งพอร์ต

---

### 🐛 Bug #3: การควบคุมเงื่อนไขการจองคิวล่วงหน้า (Booking Validation Constraint)
- **อาการ (Symptom):** ระบบเปิดให้ผู้ใช้งานสามารถเลือกวันในอดีต หรือเลือกวันล่วงหน้าเกิน 15 วันได้หากผู้ใช้ส่งคำขอผ่าน API โดยตรง
- **การวิเคราะห์สาเหตุ (Root Cause Analysis):**
  การตรวจสอบความถูกต้องมีเฉพาะที่ UI (Datepicker `min`/`max`) แต่ยังขาดการตรวจสอบในระดับ Backend Controller
- **วิธีแก้ไข (Fix):**
  เพิ่มฟังก์ชัน Business Validation ใน `api/controllers/bookingController.js` และสร้าง Unit Test `api/tests/unit/validation.test.js` เพื่อตรวจสอบ:
  1. วันที่ต้องไม่เป็นวันที่ผ่านมาแล้วในอดีต (`date < today`)
  2. วันที่ต้องไม่เกิน 15 วันนับจากวันปัจจุบัน (`date > maxDate`)
  3. หากเป็นวันปัจจุบัน รอบเวลาที่เริ่มก่อนเวลาปัจจุบันจะถูกปิดไม่ให้จอง
- **การทดสอบซ้ำ (Verification):** รัน Unit Test `TC-UNIT-VAL-02..04` ผลการทดสอบผ่าน 100%

---

### 🐛 Bug #4: การอัปเดตสถานะแบบ Real-time ข้ามเซิร์ฟเวอร์ (Socket.io Disconnect & Reconnect)
- **อาการ (Symptom):** ในสภาพแวดล้อม Render Free Tier เซิร์ฟเวอร์จะตัดการเชื่อมต่อ WebSocket เมื่อไม่มี Traffic เป็นเวลานาน ทำให้หน้าจอไม่ได้รับ Event อัปเดตคิวแบบอัตโนมัติ
- **การวิเคราะห์สาเหตุ (Root Cause Analysis):**
  การตั้งค่า Socket Client ฝั่ง Frontend ยังไม่มี Reconnection Handling และ Fallback Polling ที่เหมาะสม
- **วิธีแก้ไข (Fix):**
  ปรับแต่งการตั้งค่าการเชื่อมต่อใน Frontend ให้รองรับ `reconnection: true`, `reconnectionAttempts: 10`, `timeout: 10000` และรองรับ `transports: ['websocket', 'polling']`
- **การทดสอบซ้ำ (Verification):** ทดสอบผ่าน UAT-06 เปิดหน้าจอทิ้งไว้แล้วทดสอบจองคิว ข้อมูลอัปเดตตรงกันทันที

---

## 9. สถานะการติดตั้งขึ้นระบบจริง (Production Deployment Status)

ระบบ WashQ ได้รับการติดตั้งและเปิดให้บริการบน Production Cloud เรียบร้อยแล้ว:

| รายการระบบ (Component) | ผู้ให้บริการ (Platform) | URL / ที่อยู่เซิร์ฟเวอร์ | สถานะการทำงาน |
| :--- | :--- | :--- | :---: |
| **Frontend Web Application** | Render (Static Web Service) | [https://washq-1.onrender.com](https://washq-1.onrender.com) | 🟢 ออนไลน์ (Online) |
| **Backend REST API** | Render (Web Service) | [https://washq-n9fj.onrender.com](https://washq-n9fj.onrender.com) | 🟢 ออนไลน์ (Online) |
| **Cloud Database (MySQL 8.4)** | Aiven Cloud | `washq-chaisu-e44a.c.aivencloud.com:26081` | 🟢 ออนไลน์ (Online) |
| **API Health Check** | Render | `https://washq-n9fj.onrender.com/health` | 🟢 ทำงานปกติ (200 OK) |

---

## 10. สรุปผลการประเมิน (Conclusion)

จากการดำเนินการทดสอบระบบใน **Sprint 3 (สัปดาห์ที่ 4)** ทั้งหมด 33 Test Suites, การทดสอบ Concurrency Simulation และแบบประเมิน UAT สรุปผลได้ดังนี้:
1. **อัตราความสำเร็จของการทดสอบ (Pass Rate):** ผ่านการทดสอบ **100% (33/33 Tests Passed)**
2. **การป้องกัน Race Condition:** ผ่านการทดสอบการจองพร้อมกัน 5 คำขอในเสี้ยววินาที ระบบสามารถรับคำขอแรกและปฏิเสธคำขอที่เหลือได้อย่างแม่นยำ ไม่พบปัญหา Double-Booking
3. **การยอมรับของผู้ใช้ (UAT):** ผ่านการประเมินทั้ง 6 Scenarios รองรับทั้งนักศึกษาและผู้ดูแลระบบ
4. **ความพร้อมใช้งาน (Production Readiness):** ระบบถูก Deploy และตรวจสอบบนคลาวด์ พร้อมสำหรับการใช้งานจริงอย่างสมบูรณ์แบบ
