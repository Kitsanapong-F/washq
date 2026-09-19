import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // จำลองข้อมูล Active Booking
  const [activeBooking, setActiveBooking] = useState({
    id: 'BK-001',
    machineName: 'เครื่องซักผ้า หมายเลข 01',
    timeSlot: 'วันนี้, 14:00 - 15:00 น.',
    note: 'รอเริ่มทำงาน (กรุณาสแกน QR ก่อน 14:10 น.)'
  });

  // จำลองข้อมูลรายการเครื่องซักผ้า
  const [machines] = useState([
    { id: 1, name: 'เครื่องซักผ้า 01', type: 'ฝาหน้า 10kg', status: 'available', text: 'พร้อมใช้งาน' },
    { id: 2, name: 'เครื่องซักผ้า 02', type: 'ฝาหน้า 10kg', status: 'in_use', text: 'เหลือเวลาอีก 25 นาที' },
    { id: 3, name: 'เครื่องซักผ้า 03', type: 'ฝาบน 12kg', status: 'booked', text: 'คิวถัดไป 10:30 น.' },
    { id: 4, name: 'เครื่องซักผ้า 04', type: 'ฝาบน 12kg', status: 'available', text: 'พร้อมใช้งาน' },
    { id: 5, name: 'เครื่องซักผ้า 05', type: 'ฝาบน 14kg', status: 'in_use', text: 'เหลือเวลาอีก 5 นาที' },
  ]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">ว่าง</span>;
      case 'in_use':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">กำลังใช้งาน</span>;
      case 'booked':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">ถูกจองแล้ว</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md md:max-w-4xl mx-auto min-h-screen bg-slate-50 p-4">
      {/* Header Profile */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-[#8B5A2B] font-bold text-sm">
            สม
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">สมชาย รักเรียน</h3>
            <p className="text-[10px] text-slate-500">รหัส: 6512345678-9 (หอพักชาย 1)</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Active Booking Banner (ถ้ามีคิว) */}
      {activeBooking && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold bg-[#8B5A2B] text-white px-2 py-0.5 rounded-full">
              คิวที่จองอยู่ปัจจุบัน
            </span>
            <span className="text-xs text-amber-900 font-semibold">{activeBooking.timeSlot}</span>
          </div>
          <h4 className="text-sm font-bold text-amber-950">{activeBooking.machineName}</h4>
          <p className="text-[11px] text-amber-800/80 mb-3">{activeBooking.note}</p>
          <button
            onClick={() => setActiveBooking(null)}
            className="w-full py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all"
          >
            ยกเลิกคิว
          </button>
        </div>
      )}

      {/* Machine List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-800">เครื่องซักผ้าทั้งหมด</h3>
          <div className="flex gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>ว่าง</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span>กำลังใช้งาน</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span>ถูกจองแล้ว</span>
          </div>
        </div>

        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-bold text-slate-800">{m.name}</h4>
                  {renderStatusBadge(m.status)}
                </div>
                <p className="text-[10px] text-slate-400">{m.text}</p>
              </div>
              <button
                onClick={() => navigate(`/time-slots/${m.id}`)}
                className="px-3 py-1.5 bg-[#8B5A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#724822] transition-all"
              >
                เลือกจอง
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
