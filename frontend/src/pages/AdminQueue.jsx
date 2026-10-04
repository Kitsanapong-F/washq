import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, RefreshCw } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import io from 'socket.io-client';
import Swal from 'sweetalert2';

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

  const handleCancelBooking = async (queueItem) => {
    const isObject = typeof queueItem === 'object' && queueItem !== null;
    const bookingCode = isObject ? queueItem.booking_code : queueItem;
    if (!bookingCode) return;

    const studentName = isObject && queueItem.name ? queueItem.name : '';
    const studentCode = isObject && queueItem.student_code ? queueItem.student_code : '';
    const machineName = isObject && queueItem.machine_name ? queueItem.machine_name : '';
    const timeSlot = isObject && queueItem.time_slot ? queueItem.time_slot : '';

    const result = await Swal.fire({
      title: 'ยืนยันการยกเลิกคิว?',
      html: `
        <div style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 8px;">
          คุณต้องการยกเลิกการจองคิวนี้ใช่หรือไม่?
          <div style="margin: 12px 0 6px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; text-align: left;">
            <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 3px;">
              🎫 รหัสคิว: <span style="color: #b45309;">${bookingCode}</span>
            </div>
            ${studentCode || studentName ? `
            <div style="font-size: 13px; color: #64748b;">
              👤 นักศึกษา: <span style="font-weight: 600; color: #334155;">${studentName} (${studentCode})</span>
            </div>` : ''}
            ${machineName ? `
            <div style="font-size: 13px; color: #64748b;">
              🧺 เครื่อง: <span style="font-weight: 600; color: #334155;">${machineName}</span>
            </div>` : ''}
            ${timeSlot ? `
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
              ⏰ ช่วงเวลา: <span style="font-weight: 600; color: #334155;">${timeSlot}</span>
            </div>` : ''}
          </div>
          <span style="font-size: 12px; color: #94a3b8;">ระบบจะปรับสถานะคิวเป็นยกเลิก และแจ้งเตือนไปยังผู้ใช้แบบ Real-time</span>
        </div>
      `,
      icon: 'warning',
      iconColor: '#f59e0b',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยืนยันการยกเลิก',
      cancelButtonText: 'ย้อนกลับ',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-3xl shadow-2xl p-6 font-sans',
        title: 'text-lg font-bold text-slate-800',
        confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-transform active:scale-95',
        cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-transform active:scale-95',
      },
      buttonsStyling: true,
    });

    if (result.isConfirmed) {
      try {
        await bookingService.cancelBooking(bookingCode);
        await Swal.fire({
          icon: 'success',
          iconColor: '#10b981',
          title: 'ยกเลิกคิวสำเร็จ!',
          text: `รายการจองคิว ${bookingCode} ถูกยกเลิกเรียบร้อยแล้ว`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'ตกลง',
          timer: 2200,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-3xl shadow-2xl p-6 font-sans',
            title: 'text-lg font-bold text-slate-800',
            confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm',
          }
        });
        fetchBookings();
      } catch (err) {
        console.error('Cancel booking error:', err);
        await Swal.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'ไม่สามารถยกเลิกคิวได้',
          text: err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
          confirmButtonColor: '#6b7280',
          confirmButtonText: 'ปิด',
          customClass: {
            popup: 'rounded-3xl shadow-2xl p-6 font-sans',
            title: 'text-lg font-bold text-slate-800',
            confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm',
          }
        });
      }
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
                            onClick={() => handleCancelBooking(q)}
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
