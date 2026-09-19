import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';

export default function AdminQueue() {
  const navigate = useNavigate();

  const queues = [
    { id: 'RES-9982', studentId: '65123456-7', name: 'นายสมชาย ใจดี', machine: 'เครื่องซักผ้า 02', time: '13:00 - 14:00', status: 'กำลังใช้งาน' },
    { id: 'RES-9981', studentId: '65124458-9', name: 'นางสาวสมศรี เรียนดี', machine: 'เครื่องซักผ้า 03', time: '14:15 - 15:15', status: 'รอเข้าใช้งาน' },
    { id: 'RES-9980', studentId: '64112233-4', name: 'นายมานพ อดทน', machine: 'เครื่องซักผ้า 05', time: '14:30 - 15:30', status: 'จองแล้ว' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="bg-[#8B5A2B] text-white p-4 rounded-2xl flex flex-wrap justify-between items-center mb-6 shadow-md">
        <div>
          <h1 className="text-sm font-bold">RMUTL Laundry Admin</h1>
          <p className="text-[10px] text-amber-200">ระบบจัดการเครื่องซักผ้าหอพักนักศึกษา</p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button onClick={() => navigate('/admin/dashboard')} className="px-3 py-1 bg-amber-900/40 text-xs text-amber-100 rounded-lg hover:bg-amber-800">
            หน้าหลัก & ปรับสถานะเครื่อง
          </button>
          <button className="px-3 py-1 bg-amber-700 text-xs font-bold rounded-lg">รายการคิวจองทั้งหมด</button>
          <button onClick={() => navigate('/login')} className="p-1.5 bg-white/10 rounded-lg ml-2">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 mb-1">รายการคิวจองทั้งหมด</h2>
        <p className="text-[10px] text-slate-400 mb-4">ตรวจสอบข้อมูลและสถานะการจองคิวเครื่องซักผ้า</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัสนักศึกษา หรือหมายเลขเครื่อง..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold">
                <th className="py-2 px-3">รหัสการจอง</th>
                <th className="py-2 px-3">รหัสนักศึกษา</th>
                <th className="py-2 px-3">ชื่อผู้จอง</th>
                <th className="py-2 px-3">ชื่อเครื่อง</th>
                <th className="py-2 px-3">ช่วงเวลา</th>
                <th className="py-2 px-3">สถานะการจอง</th>
                <th className="py-2 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {queues.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-bold text-slate-800">{q.id}</td>
                  <td className="py-3 px-3 text-slate-600">{q.studentId}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{q.name}</td>
                  <td className="py-3 px-3 text-slate-600">{q.machine}</td>
                  <td className="py-3 px-3 text-slate-600">{q.time}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-600">
                      ยกเลิกการจอง
                    </button>
                    <button className="px-2.5 py-1 bg-[#8B5A2B] text-white text-[10px] font-bold rounded-lg hover:bg-[#724822]">
                      เสร็จสิ้น
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
