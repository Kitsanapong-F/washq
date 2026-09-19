import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, RefreshCw } from 'lucide-react';
import { bookingService } from '../services/bookingService';

export default function AdminQueue() {
  const navigate = useNavigate();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAllBookings();
      setQueues(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredQueues = queues.filter(q =>
    q.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.booking_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button onClick={() => navigate('/login')} className="p-1.5 bg-white/10 rounded-lg ml-2 hover:bg-rose-600">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">รายการคิวจองทั้งหมด</h2>
            <p className="text-[10px] text-slate-400">ตรวจสอบข้อมูลและสถานะการจองคิวเครื่องซักผ้า</p>
          </div>
          <button onClick={fetchBookings} className="p-2 border rounded-xl hover:bg-slate-50">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัสการจอง, รหัสนักศึกษา หรือหมายเลขเครื่อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">กำลังโหลดรายการคิว...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold">
                  <th className="py-2 px-3">รหัสการจอง</th>
                  <th className="py-2 px-3">รหัสนักศึกษา</th>
                  <th className="py-2 px-3">ชื่อผู้จอง</th>
                  <th className="py-2 px-3">เครื่อง</th>
                  <th className="py-2 px-3">วันที่/เวลา</th>
                  <th className="py-2 px-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredQueues.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-slate-400 text-xs">ไม่พบข้อมูลการจองคิว</td>
                  </tr>
                ) : (
                  filteredQueues.map((q) => (
                    <tr key={q.booking_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-800">{q.booking_code}</td>
                      <td className="py-3 px-3 text-slate-600">{q.student_code}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{q.name}</td>
                      <td className="py-3 px-3 text-slate-600">{q.machine_name}</td>
                      <td className="py-3 px-3 text-slate-600">{q.booking_date ? String(q.booking_date).split('T')[0] : ''} ({q.time_slot})</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
