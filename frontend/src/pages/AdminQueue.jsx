import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, RefreshCw } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import io from 'socket.io-client';

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

    // ดักฟังการจอง/ยกเลิกคิวแบบ Real-time
    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

    socket.on('booking_created', () => {
      fetchBookings();
    });

    socket.on('booking_cancelled', () => {
      fetchBookings();
    });

    socket.on('machine_status_updated', () => {
      fetchBookings();
    });

    return () => {
      socket.off('booking_created');
      socket.off('booking_cancelled');
      socket.off('machine_status_updated');
      socket.disconnect();
    };
  }, []);

  const handleCancelBooking = async (bookingCode) => {
    if (!window.confirm(`คุณต้องการยกเลิกการจองคิว ${bookingCode} ใช่หรือไม่?`)) return;

    try {
      await bookingService.cancelBooking(bookingCode);
      alert(`ยกเลิกรายการจองคิว ${bookingCode} เรียบร้อยแล้ว`);
      fetchBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert('ไม่สามารถยกเลิกคิวได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredQueues = queues.filter(q =>
    q.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.booking_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">รอใช้งาน (Active)</span>;
      case 'cancelled':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">ยกเลิกแล้ว</span>;
      case 'completed':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">เสร็จสิ้น</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">{status}</span>;
    }
  };

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
          <button onClick={handleLogout} className="p-1.5 bg-white/10 rounded-lg ml-2 hover:bg-rose-600 transition-colors" title="ออกจากระบบ">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">รายการคิวจองทั้งหมด (Real-time)</h2>
            <p className="text-[10px] text-slate-400">ตรวจสอบข้อมูลและสถานะการจองคิวเครื่องซักผ้าแบบสด ไม่ต้องรีเฟรชหน้าจอ</p>
          </div>
          <button onClick={fetchBookings} className="p-2 border rounded-xl hover:bg-slate-50 transition-colors" title="รีเฟรชข้อมูล">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัสการจอง, รหัสนักศึกษา, ชื่อผู้จอง หรือหมายเลขเครื่อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B5A2B]"
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
                  <th className="py-2 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredQueues.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-slate-400 text-xs">ไม่พบข้อมูลการจองคิว</td>
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
                        {renderStatusBadge(q.status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {q.status === 'active' ? (
                          <button
                            onClick={() => handleCancelBooking(q.booking_code)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                          >
                            ยกเลิกคิว
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
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
