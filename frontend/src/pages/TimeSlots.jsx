import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';

export default function TimeSlots() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState('today');
  const [selectedSlot, setSelectedSlot] = useState('14:00 - 15:00 น.');
  const [showModal, setShowModal] = useState(false);

  // จำลองรายการช่วงเวลา
  const slots = [
    { time: '08:00 - 09:00 น.', status: 'booked' },
    { time: '09:00 - 10:00 น.', status: 'booked' },
    { time: '10:00 - 11:00 น.', status: 'available' },
    { time: '11:00 - 12:00 น.', status: 'available' },
    { time: '12:00 - 13:00 น.', status: 'available' },
    { time: '14:00 - 15:00 น.', status: 'available' },
  ];

  return (
    <div className="max-w-md md:max-w-3xl mx-auto min-h-screen bg-slate-50 p-4 relative">
      {/* Header ย้อนกลับ */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-800">เลือกเวลาจอง (เครื่อง {machineId || '01'})</h2>
          <p className="text-[10px] text-slate-400">ประเภทเครื่องซักผ้า 10 กิโลกรัม</p>
        </div>
      </div>

      {/* สลับวันจอง */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSelectedDay('today')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            selectedDay === 'today' ? 'bg-[#8B5A2B] text-white shadow' : 'bg-white text-slate-600'
          }`}
        >
          วันนี้ (พุธ) <span className="block text-[9px] font-normal">15 ต.ค. 2567</span>
        </button>
        <button
          onClick={() => setSelectedDay('tomorrow')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            selectedDay === 'tomorrow' ? 'bg-[#8B5A2B] text-white shadow' : 'bg-white text-slate-600'
          }`}
        >
          พรุ่งนี้ (พฤหัสบดี) <span className="block text-[9px] font-normal">16 ต.ค. 2567</span>
        </button>
      </div>

      {/* รายการช่วงเวลา */}
      <div className="space-y-2 mb-6">
        {slots.map((s, idx) => (
          <div
            key={idx}
            onClick={() => s.status === 'available' && setSelectedSlot(s.time)}
            className={`p-3 bg-white rounded-2xl border flex items-center justify-between transition-all ${
              s.status === 'booked'
                ? 'opacity-50 border-slate-100 cursor-not-allowed'
                : selectedSlot === s.time
                ? 'border-[#8B5A2B] ring-1 ring-[#8B5A2B] cursor-pointer'
                : 'border-slate-100 hover:border-slate-200 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">{s.time}</span>
            </div>
            <span className={`text-[10px] font-semibold ${s.status === 'booked' ? 'text-slate-400' : 'text-emerald-600'}`}>
              {s.status === 'booked' ? 'ถูกจอง' : 'ว่าง'}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 bg-[#8B5A2B] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#724822] transition-colors"
      >
        ยืนยันการจองคิว
      </button>

      {/* Pop-up ยืนยันการจองสำเร็จ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">จองคิวสำเร็จ!</h3>
            <p className="text-[11px] text-emerald-600 mb-4">ระบบทำการรายการให้คุณเรียบร้อยแล้ว</p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 mb-4 text-left">
              <div className="flex justify-between"><span>หมายเลขเครื่อง:</span> <strong className="text-slate-800">เครื่องซักผ้า 01</strong></div>
              <div className="flex justify-between"><span>วันที่รายการ:</span> <strong className="text-slate-800">วันนี้ (15 ต.ค. 2567)</strong></div>
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
