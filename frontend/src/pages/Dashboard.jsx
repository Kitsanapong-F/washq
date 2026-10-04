import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { createSocket } from '../services/socket';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันแปลงวันที่ให้ตรงตาม Local Timezone (ป้องกันวันที่ถอยหลังไป 1 วัน)
  const formatLocalDate = (dateString) => {
    if (!dateString) return '';
    // กรณี dateString มาในรูปแบบ YYYY-MM-DD
    const dateOnly = String(dateString).split('T')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!storedUser || (!storedUser.id && !storedUser.user_id && !storedUser.student_code)) {
        navigate('/login');
        return;
      }
      setUser(storedUser);

      const machineData = await bookingService.getMachines();
      setMachines(Array.isArray(machineData) ? machineData : []);

      const userId = storedUser.id || storedUser.user_id;
      if (userId) {
        const bookingData = await bookingService.getUserActiveBooking(userId);
        setActiveBookings(Array.isArray(bookingData) ? bookingData : (bookingData ? [bookingData] : []));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // สร้าง Socket Connection
    const socket = createSocket();

    // ดักฟัง Event จาก Socket.io แบบ Real-time
    socket.on('booking_created', () => {
      fetchDashboardData();
    });

    socket.on('booking_cancelled', () => {
      fetchDashboardData();
    });

    socket.on('machine_status_updated', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('booking_created');
      socket.off('booking_cancelled');
      socket.off('machine_status_updated');
      socket.disconnect();
    };
  }, []);

  const handleCancelBooking = async (booking) => {
    if (!booking) return;
    const bookingId = booking.booking_code || booking.id;
    const machineName = booking.machineName || 'เครื่องซักผ้า';

    const result = await Swal.fire({
      title: 'ยืนยันการยกเลิกคิว?',
      html: `
        <div style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 8px;">
          คุณต้องการยกเลิกการจองคิวนี้ใช่หรือไม่?
          <div style="margin: 12px 0 6px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; text-align: left;">
            <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 3px;">
              🎫 รหัสคิว: <span style="color: #b45309;">${bookingId}</span>
            </div>
            <div style="font-size: 13px; color: #64748b;">
              🧺 เครื่อง: <span style="font-weight: 600; color: #334155;">${machineName}</span>
            </div>
            ${booking.timeSlot ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px;">⏰ ช่วงเวลา: <span style="font-weight: 600; color: #334155;">${booking.timeSlot}</span></div>` : ''}
          </div>
          <span style="font-size: 12px; color: #94a3b8;">เมื่อยกเลิกแล้ว ช่วงเวลานี้จะเปิดว่างให้ผู้อื่นสามารถจองได้ทันที</span>
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
        await bookingService.cancelBooking(bookingId);
        await Swal.fire({
          icon: 'success',
          iconColor: '#10b981',
          title: 'ยกเลิกคิวสำเร็จ!',
          text: `รายการจองคิว ${bookingId} ถูกยกเลิกเรียบร้อยแล้ว`,
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
        fetchDashboardData();
      } catch (error) {
        console.error('Cancel booking error:', error);
        await Swal.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'ไม่สามารถยกเลิกคิวได้',
          text: error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
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

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">ว่าง</span>;
      case 'in_use':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">กำลังใช้งาน</span>;
      case 'booked':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">ถูกจองแล้ว</span>;
      case 'maintenance':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">ชำรุด/ปิดปรับปรุง</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md md:max-w-4xl mx-auto min-h-screen bg-slate-50 p-4">
      {/* Header Profile */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-[#8B5A2B] font-bold text-sm">
            {user?.name ? user.name.charAt(0) : 'ส'}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">{user?.name || 'นักศึกษา'}</h3>
            <p className="text-[10px] text-slate-500">
              รหัส: {user?.student_code || 'N/A'} {user?.email ? `(${user.email})` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
          title="ออกจากระบบ"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Active Bookings List (รองรับดูหลายรายการ) */}
      {activeBookings && activeBookings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700">
              รายการคิวที่จองอยู่ของคุณ ({activeBookings.length} รายการ)
            </h3>
          </div>
          <div className="space-y-3">
            {activeBookings.map((b) => (
              <div key={b.booking_code || b.id} className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold bg-[#8B5A2B] text-white px-2 py-0.5 rounded-full">
                    คิวที่จอง ({b.booking_code})
                  </span>
                  <span className="text-xs text-amber-900 font-semibold">{b.timeSlot}</span>
                </div>
                <h4 className="text-sm font-bold text-amber-950">{b.machineName}</h4>
                <p className="text-[11px] text-amber-800/80 mb-3">
                  {b.location ? `${b.location} • ` : ''}
                  {b.booking_date ? `วันที่: ${formatLocalDate(b.booking_date)}` : 'รอเริ่มทำงาน'}
                </p>
                <button
                  onClick={() => handleCancelBooking(b)}
                  className="w-full py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all shadow-xs"
                >
                  ยกเลิกคิวนี้
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Machine List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">เครื่องซักผ้าทั้งหมด</h3>
            <button
              onClick={fetchDashboardData}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>ว่าง</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span>กำลังใช้งาน</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span>ถูกจองแล้ว</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">กำลังโหลดข้อมูลเครื่องซักผ้า...</div>
        ) : (
          <div className="space-y-3">
            {machines.map((m) => (
              <div key={m.machine_id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-800">{m.machine_name}</h4>
                    {renderStatusBadge(m.status)}
                  </div>
                  <p className="text-[10px] text-slate-400">{m.type || 'ฝาหน้า 10kg'} • {m.location || 'อาคาร 3 ชั้น 1'}</p>
                </div>
                <button
                  disabled={m.status === 'maintenance'}
                  onClick={() => navigate(`/time-slots/${m.machine_id}`)}
                  className="px-3 py-1.5 bg-[#8B5A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#724822] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                >
                  {m.status === 'maintenance' ? 'ปิดบริการ' : 'เลือกจอง'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
