import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import io from 'socket.io-client';

export default function TimeSlots() {
  const { machineId } = useParams();
  const navigate = useNavigate();

  // ฟังก์ชันแปลง Date เป็น YYYY-MM-DD ตาม Local Timezone (ป้องกันปัญหาวันทีถอยไป 1 วัน)
  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // สร้างรายการวันที่ล่วงหน้า 15 วัน (0 ถึง 14 วัน)
  const daysThai = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const monthsThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const availableDates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getLocalDateString(d);
    let label = '';
    if (i === 0) label = 'วันนี้';
    else if (i === 1) label = 'พรุ่งนี้';
    else label = `${daysThai[d.getDay()]} ${d.getDate()} ${monthsThai[d.getMonth()]}`;

    return {
      dateStr,
      label,
      dayNum: d.getDate(),
      dayName: daysThai[d.getDay()],
      monthName: monthsThai[d.getMonth()],
      index: i
    };
  });

  const [selectedDate, setSelectedDate] = useState(() => availableDates[0].dateStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  const baseSlots = [
    '08:00 - 09:00 น.',
    '09:00 - 10:00 น.',
    '10:00 - 11:00 น.',
    '11:00 - 12:00 น.',
    '12:00 - 13:00 น.',
    '14:00 - 15:00 น.',
    '15:00 - 16:00 น.',
  ];

  // ฟังก์ชันตรวจสอบว่ารอบเวลาเลยเวลาปัจจุบันไปแล้วหรือไม่ (เฉพาะกรณีเลือกวันที่เป็น "วันนี้")
  const isSlotPast = (slotStr, dateStr) => {
    if (!slotStr || !dateStr) return false;
    const now = new Date();
    const todayStr = getLocalDateString(now);

    // ตรวจสอบเฉพาะถ้าวันที่เลือกคือ "วันนี้"
    if (dateStr !== todayStr) {
      return false;
    }

    const match = slotStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;

    const slotHour = parseInt(match[1], 10);
    const slotMinute = parseInt(match[2], 10);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return currentHour > slotHour || (currentHour === slotHour && currentMinute >= slotMinute);
  };

  // ดึงรายการรอบเวลาที่ถูกจองแล้วของเครื่องนี้ในวันที่เลือก
  const fetchBookedSlots = async () => {
    setFetchingSlots(true);
    try {
      const allBookings = await bookingService.getAllBookings();

      // กรองเฉพาะคิว active ของเครื่องนี้ และตรงกับวันที่เลือก
      const activeForThisMachine = allBookings
        .filter(b =>
          String(b.machine_id) === String(machineId) &&
          String(b.booking_date).startsWith(selectedDate) &&
          b.status === 'active'
        )
        .map(b => b.time_slot);

      setBookedSlots(activeForThisMachine);

      // ถ้าไม่มี slot ที่เลือก หรือ slot ปัจจุบันถูกจองไปแล้ว หรือเลยเวลาไปแล้ว ให้เลือกอันว่างอันแรกแทน
      setSelectedSlot(prev => {
        const isSlotAvailable = (slot) => !activeForThisMachine.includes(slot) && !isSlotPast(slot, selectedDate);
        if (!prev || !isSlotAvailable(prev)) {
          const firstAvailable = baseSlots.find(isSlotAvailable);
          return firstAvailable || '';
        }
        return prev;
      });
    } catch (err) {
      console.error('Fetch booked slots error:', err);
    } finally {
      setFetchingSlots(false);
    }
  };

  useEffect(() => {
    fetchBookedSlots();

    // ดักฟังการเปลี่ยนแปลงแบบ Real-time ผ่าน Socket.io ทั้ง 2 ฝั่ง
    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

    socket.on('booking_created', () => {
      fetchBookedSlots();
    });

    socket.on('booking_cancelled', () => {
      fetchBookedSlots();
    });

    socket.on('machine_status_updated', () => {
      fetchBookedSlots();
    });

    return () => {
      socket.off('booking_created');
      socket.off('booking_cancelled');
      socket.off('machine_status_updated');
      socket.disconnect();
    };
  }, [machineId, selectedDate]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setError('กรุณาเลือกช่วงเวลาที่ต้องการจอง');
      return;
    }

    if (isSlotPast(selectedSlot, selectedDate)) {
      setError('ไม่สามารถจองช่วงเวลาในอดีตได้');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const result = await bookingService.createBooking({
        user_id: user.id || user.user_id || 1,
        machine_id: parseInt(machineId) || 1,
        booking_date: selectedDate,
        time_slot: selectedSlot
      });

      setBookingResult(result);
      setShowModal(true);
    } catch (err) {
      console.error('Booking Error:', err);
      setError(err.response?.data?.message || 'ไม่สามารถทำการจองได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const selectedDateObj = availableDates.find(d => d.dateStr === selectedDate);

  return (
    <div className="max-w-md md:max-w-3xl mx-auto min-h-screen bg-slate-50 p-4 relative">
      {/* Header ย้อนกลับ */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-100 transition-colors"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-800">เลือกเวลาจอง (เครื่อง {machineId || '01'})</h2>
          <p className="text-[10px] text-slate-400">เลือกวันที่และรอบเวลาที่ต้องการจองใช้งาน (ล่วงหน้าได้สูงสุด 15 วัน)</p>
        </div>
      </div>

      {/* เลือกวันที่ (15 วันล่วงหน้า แบบเลื่อนแนวนอน) */}
      <div className="mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-[#8B5A2B]" />
            <span>เลือกวันจอง (15 วันล่วงหน้า)</span>
          </div>
          <span className="text-[11px] font-semibold text-[#8B5A2B] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {selectedDateObj?.label || selectedDate}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
          {availableDates.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`shrink-0 w-16 py-2 px-1 rounded-xl text-center border transition-all ${
                  isSelected
                    ? 'bg-[#8B5A2B] text-white border-[#8B5A2B] shadow-md scale-102 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <span className="block text-[10px] font-medium opacity-80">{item.dayName}</span>
                <span className="block text-sm font-extrabold my-0.5">{item.dayNum}</span>
                <span className={`block text-[9px] truncate ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                  {item.index <= 1 ? item.label : item.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* รายการช่วงเวลา */}
      {fetchingSlots ? (
        <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100 mb-4">
          กำลังตรวจสอบสถานะรอบเวลา...
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {baseSlots.map((timeText, idx) => {
            const isBooked = bookedSlots.includes(timeText);
            const isPast = isSlotPast(timeText, selectedDate);
            const isDisabled = isBooked || isPast;
            const isSelected = selectedSlot === timeText;

            return (
              <div
                key={idx}
                onClick={() => !isDisabled && setSelectedSlot(timeText)}
                className={`p-3 bg-white rounded-2xl border flex items-center justify-between transition-all ${
                  isPast
                    ? 'opacity-40 border-slate-200 bg-slate-100/70 cursor-not-allowed select-none'
                    : isBooked
                    ? 'opacity-50 border-slate-100 bg-slate-100/50 cursor-not-allowed select-none'
                    : isSelected
                    ? 'border-[#8B5A2B] ring-1 ring-[#8B5A2B] cursor-pointer shadow-xs'
                    : 'border-slate-100 hover:border-slate-200 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`w-4 h-4 ${isPast ? 'text-slate-300' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold ${isPast ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {timeText}
                  </span>
                </div>
                {isPast ? (
                  <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    เลยเวลาแล้ว
                  </span>
                ) : isBooked ? (
                  <span className="text-[10px] font-semibold text-slate-400">
                    ถูกจองแล้ว
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600">
                    ว่าง
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleConfirmBooking}
        disabled={loading || fetchingSlots || !selectedSlot}
        className="w-full py-3 bg-[#8B5A2B] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#724822] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'กำลังบันทึกการจอง...' : (selectedSlot ? `ยืนยันการจองคิว (${selectedSlot})` : 'กรุณาเลือกรอบเวลา')}
      </button>

      {/* Pop-up ยืนยันการจองสำเร็จ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">จองคิวสำเร็จ!</h3>
            <p className="text-[11px] text-emerald-600 mb-4">
              รหัสการจอง: <strong>{bookingResult?.booking_code}</strong>
            </p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 mb-4 text-left">
              <div className="flex justify-between"><span>หมายเลขเครื่อง:</span> <strong className="text-slate-800">เครื่องซักผ้า {machineId}</strong></div>
              <div className="flex justify-between"><span>วันที่จอง:</span> <strong className="text-slate-800">{selectedDate} ({selectedDateObj?.label})</strong></div>
              <div className="flex justify-between"><span>ช่วงเวลาที่จอง:</span> <strong className="text-slate-800">{selectedSlot}</strong></div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2 bg-[#8B5A2B] text-white text-xs font-bold rounded-xl hover:bg-[#724822] transition-colors"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
