import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import io from 'socket.io-client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
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
      setUser(storedUser);

      const machineData = await bookingService.getMachines();
      setMachines(machineData);

      const userId = storedUser.id || storedUser.user_id;
      if (userId) {
        const bookingData = await bookingService.getUserActiveBooking(userId);
        setActiveBooking(bookingData);
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
    const socket = io('http://localhost:5000');

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

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    if (!window.confirm('คุณต้องการยกเลิกการจองคิวนี้ใช่หรือไม่?')) return;

    try {
      const bookingId = activeBooking.booking_code || activeBooking.id;

      if (!bookingId) {
        alert('ไม่พบรหัสการจองคิว');
        return;
      }

      await bookingService.cancelBooking(bookingId);
      setActiveBooking(null);
      fetchDashboardData();
      alert('ยกเลิกรายการจองคิวเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Cancel booking error:', error);
      alert(error.response?.data?.message || 'ไม่สามารถยกเลิกคิวได้ กรุณาลองใหม่อีกครั้ง');
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

      {/* Active Booking Banner */}
      {activeBooking && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold bg-[#8B5A2B] text-white px-2 py-0.5 rounded-full">
              คิวที่จองอยู่ปัจจุบัน ({activeBooking.booking_code})
            </span>
            <span className="text-xs text-amber-900 font-semibold">{activeBooking.timeSlot}</span>
          </div>
          <h4 className="text-sm font-bold text-amber-950">{activeBooking.machineName}</h4>
          <p className="text-[11px] text-amber-800/80 mb-3">
            {activeBooking.booking_date
              ? `วันที่: ${formatLocalDate(activeBooking.booking_date)}`
              : 'รอเริ่มทำงาน'}
          </p>
          <button
            onClick={handleCancelBooking}
            className="w-full py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all"
          >
            ยกเลิกคิว
          </button>
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
