describe('Unit Tests: Booking Validation & Business Rules', () => {
  // ฟังก์ชันจำลองตรรกะของระบบจอง
  const isPastDate = (dateStr, thaiTodayStr) => {
    return dateStr < thaiTodayStr;
  };

  const isExceeding15Days = (dateStr, baseDate) => {
    const target = new Date(`${dateStr}T00:00:00`);
    const max = new Date(baseDate);
    max.setDate(max.getDate() + 15);
    return target > max;
  };

  const isPastTimeSlot = (timeSlotStr, currentHour, currentMinute) => {
    const match = String(timeSlotStr).match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const slotHour = parseInt(match[1], 10);
    const slotMinute = parseInt(match[2], 10);
    return currentHour > slotHour || (currentHour === slotHour && currentMinute >= slotMinute);
  };

  const generateBookingCode = () => {
    return `RES-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  describe('Booking Code Generation Format', () => {
    it('UT-VAL-01: should generate booking code with RES- prefix and 4 digits', () => {
      const code = generateBookingCode();
      expect(code).toMatch(/^RES-\d{4}$/);
    });

    it('UT-VAL-02: should generate different codes across consecutive calls', () => {
      const codes = new Set();
      for (let i = 0; i < 20; i++) {
        codes.add(generateBookingCode());
      }
      expect(codes.size).toBeGreaterThan(15);
    });
  });

  describe('Date Range Constraints (15-Day Policy)', () => {
    const thaiTodayStr = '2026-10-05';
    const baseDate = new Date('2026-10-05T00:00:00');

    it('UT-VAL-03: should reject past date', () => {
      expect(isPastDate('2026-10-04', thaiTodayStr)).toBe(true);
      expect(isPastDate('2026-09-01', thaiTodayStr)).toBe(true);
    });

    it('UT-VAL-04: should accept today and valid future dates within 15 days', () => {
      expect(isPastDate('2026-10-05', thaiTodayStr)).toBe(false);
      expect(isExceeding15Days('2026-10-05', baseDate)).toBe(false);

      expect(isPastDate('2026-10-15', thaiTodayStr)).toBe(false);
      expect(isExceeding15Days('2026-10-15', baseDate)).toBe(false);

      // วันที่ 15 จาก 2026-10-05 คือ 2026-10-20
      expect(isExceeding15Days('2026-10-20', baseDate)).toBe(false);
    });

    it('UT-VAL-05: should reject dates beyond 15 days into the future', () => {
      // วันที่ 16 (2026-10-21) ต้องถูกปฏิเสธ
      expect(isExceeding15Days('2026-10-21', baseDate)).toBe(true);
      expect(isExceeding15Days('2026-11-01', baseDate)).toBe(true);
    });
  });

  describe('Time Slot Past Check Logic', () => {
    it('UT-VAL-06: should flag slots earlier than current time as past', () => {
      const currentHour = 14;
      const currentMinute = 30;

      // 08:00 และ 14:00 ถือว่าผ่านไปแล้ว
      expect(isPastTimeSlot('08:00 - 09:00 น.', currentHour, currentMinute)).toBe(true);
      expect(isPastTimeSlot('14:00 - 15:00 น.', currentHour, currentMinute)).toBe(true);
    });

    it('UT-VAL-07: should allow upcoming slots on the same day', () => {
      const currentHour = 14;
      const currentMinute = 30;

      // 15:00 และ 16:00 ยังไม่ถึงเวลา
      expect(isPastTimeSlot('15:00 - 16:00 น.', currentHour, currentMinute)).toBe(false);
      expect(isPastTimeSlot('16:00 - 17:00 น.', currentHour, currentMinute)).toBe(false);
    });
  });
});
