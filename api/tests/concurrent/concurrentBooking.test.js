const request = require('supertest');
const { app } = require('../../server');
const pool = require('../../config/db');

jest.setTimeout(20000);

describe('Sprint 3: Concurrent Booking & Race Condition Test (ทดสอบการจองพร้อมกัน)', () => {
  const TEST_MACHINE_ID = 2;
  const TEST_DATE = '2026-10-20';
  const TEST_SLOT = '18:00 - 19:00 น.';
  let createdBookingCode = '';

  beforeAll(async () => {
    // ล้างข้อมูลรอบเวลานี้ก่อนทดสอบ
    await pool.query(
      'DELETE FROM bookings WHERE machine_id = ? AND booking_date = ? AND time_slot = ?',
      [TEST_MACHINE_ID, TEST_DATE, TEST_SLOT]
    );
  });

  afterAll(async () => {
    // ล้างข้อมูลคิวที่สร้างขึ้น
    if (createdBookingCode) {
      await pool.query('DELETE FROM bookings WHERE booking_code = ?', [createdBookingCode]);
    }
  });

  it('CT-01: should handle 5 simultaneous requests: exactly 1 succeeds (201) and 4 are rejected (400)', async () => {
    const userIds = [1, 2, 1, 2, 1];

    // ยิงคำขอ 5 ครั้งพร้อมกันเป๊ะๆ ด้วย Promise.all
    const promises = userIds.map((uid) =>
      request(app)
        .post('/api/bookings')
        .send({
          user_id: uid,
          machine_id: TEST_MACHINE_ID,
          booking_date: TEST_DATE,
          time_slot: TEST_SLOT
        })
    );

    const responses = await Promise.all(promises);

    const successes = responses.filter(r => r.status === 201);
    const rejected = responses.filter(r => r.status === 400);

    expect(successes.length).toBe(1);
    expect(rejected.length).toBe(4);

    createdBookingCode = successes[0].body.booking_code;
    expect(createdBookingCode).toBeDefined();
    expect(createdBookingCode.startsWith('RES-')).toBe(true);

    // ตรวจสอบข้อความเตือนของคำขอที่ถูกปฏิเสธ
    rejected.forEach(r => {
      expect(r.body.message).toContain('ช่วงเวลานี้ถูกจองไปแล้ว');
    });

    // ยืนยันในฐานข้อมูลจริงว่าถูกบันทึกเพียง 1 แถวเท่านั้น
    const [dbRows] = await pool.query(
      'SELECT booking_id, booking_code, status FROM bookings WHERE machine_id = ? AND booking_date = ? AND time_slot = ?',
      [TEST_MACHINE_ID, TEST_DATE, TEST_SLOT]
    );

    expect(dbRows.length).toBe(1);
    expect(dbRows[0].booking_code).toBe(createdBookingCode);
  });
});
