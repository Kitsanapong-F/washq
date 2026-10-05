const request = require('supertest');
const { app } = require('../../server');
const pool = require('../../config/db');

jest.setTimeout(20000);

describe('Integration Tests: WashQ API Full System', () => {
  let studentToken = '';
  let adminToken = '';
  let studentUserId = null;
  let testBookingCode = '';

  beforeAll(async () => {
    // ตรวจสอบการเชื่อมต่อ Database
    const [rows] = await pool.query('SELECT 1 as test');
    expect(rows[0].test).toBe(1);
  });

  afterAll(async () => {
    // Cleanup any test booking left
    if (testBookingCode) {
      await pool.query('DELETE FROM bookings WHERE booking_code = ?', [testBookingCode]);
    }
  });

  describe('1. Authentication Endpoints (/api/auth)', () => {
    it('IT-AUTH-01: should login successfully as student with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          student_code: '6512345678-9',
          password: '123456',
          role: 'student'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('student_code', '6512345678-9');
      expect(res.body.user.role).toBe('student');

      studentToken = res.body.token;
      studentUserId = res.body.user.id || res.body.user.user_id;
    });

    it('IT-AUTH-02: should login successfully as admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          student_code: 'admin01',
          password: '123456',
          role: 'admin'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    it('IT-AUTH-03: should reject login with incorrect password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          student_code: '6512345678-9',
          password: 'WrongPassword!',
          role: 'student'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('IT-AUTH-04: should reject login with non-existent user (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          student_code: '9999999999-9',
          password: '123456',
          role: 'student'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('2. Machine Management Endpoints (/api/machines)', () => {
    it('IT-MACH-01: should return all machines with status and details', async () => {
      const res = await request(app).get('/api/machines');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('machine_id');
      expect(res.body[0]).toHaveProperty('machine_name');
      expect(res.body[0]).toHaveProperty('status');
    });

    it('IT-MACH-02: should return single machine by valid ID', async () => {
      const res = await request(app).get('/api/machines/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('machine_id', 1);
      expect(res.body).toHaveProperty('machine_name');
    });

    it('IT-MACH-03: should return 404 for non-existent machine ID', async () => {
      const res = await request(app).get('/api/machines/99999');
      expect(res.status).toBe(404);
    });

    it('IT-MACH-04: should update machine status (Admin)', async () => {
      const res = await request(app)
        .put('/api/machines/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'available' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('อัปเดตสถานะ');
    });

    it('IT-MACH-05: should reject invalid machine status with 400', async () => {
      const res = await request(app)
        .put('/api/machines/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status_xyz' });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Booking Lifecycle Endpoints (/api/bookings)', () => {
    const futureDate = '2026-10-18'; // วันที่ในอนาคต (ภายใน 15 วัน)
    const testSlot = '11:00 - 12:00 น.';

    it('IT-BOOK-01: should create a new booking successfully (201)', async () => {
      // ตรวจสอบและลบของเดิมถ้ามีค้าง
      await pool.query(
        'DELETE FROM bookings WHERE machine_id = ? AND booking_date = ? AND time_slot = ?',
        [1, futureDate, testSlot]
      );

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          user_id: studentUserId || 1,
          machine_id: 1,
          booking_date: futureDate,
          time_slot: testSlot
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('booking_code');
      expect(res.body.booking_code.startsWith('RES-')).toBe(true);

      testBookingCode = res.body.booking_code;
    });

    it('IT-BOOK-02: should reject duplicate booking for the same slot (400 Conflict/Double Booking)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          user_id: studentUserId || 1,
          machine_id: 1,
          booking_date: futureDate,
          time_slot: testSlot
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ช่วงเวลานี้ถูกจองไปแล้ว');
    });

    it('IT-BOOK-03: should reject booking with missing required fields (400)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          user_id: 1
          // Missing machine_id, booking_date, time_slot
        });

      expect(res.status).toBe(400);
    });

    it('IT-BOOK-04: should fetch user active bookings list', async () => {
      const res = await request(app)
        .get(`/api/bookings/user/${studentUserId || 1}/active`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.some(b => b.booking_code === testBookingCode);
      expect(found).toBe(true);
    });

    it('IT-BOOK-05: should cancel active booking successfully (200)', async () => {
      const res = await request(app)
        .put(`/api/bookings/${testBookingCode}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('ยกเลิกรายการจองคิวเรียบร้อย');
    });

    it('IT-BOOK-06: should reject cancelling an already cancelled booking (400)', async () => {
      const res = await request(app)
        .put(`/api/bookings/${testBookingCode}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ถูกยกเลิกไปแล้ว');
    });
  });

  describe('4. Health & System Endpoints', () => {
    it('IT-SYS-01: /health endpoint should return status ok and database connected', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('database', 'connected');
    });
  });
});
