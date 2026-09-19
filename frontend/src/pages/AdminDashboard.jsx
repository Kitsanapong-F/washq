import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut } from 'lucide-react';
import { bookingService } from '../services/bookingService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMachines();
      setMachines(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setMachines(machines.map(m => m.machine_id === id ? { ...m, status: newStatus } : m));
  };

  const handleSaveStatus = async (id, status) => {
    try {
      await bookingService.updateMachineStatus(id, status);
      alert('อัปเดตสถานะเครื่องซักผ้าเรียบร้อยแล้ว');
      fetchMachines();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      {/* Top Bar */}
      <div className="bg-[#8B5A2B] text-white p-4 rounded-2xl flex flex-wrap justify-between items-center mb-6 shadow-md">
        <div>
          <h1 className="text-sm font-bold">RMUTL Laundry Admin</h1>
          <p className="text-[10px] text-amber-200">ระบบจัดการเครื่องซักผ้าหอพักนักศึกษา</p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button className="px-3 py-1 bg-amber-700 text-xs font-bold rounded-lg">หน้าหลัก & ปรับสถานะเครื่อง</button>
          <button onClick={() => navigate('/admin/queue')} className="px-3 py-1 bg-amber-900/40 text-xs text-amber-100 rounded-lg hover:bg-amber-800">
            รายการคิวจองทั้งหมด
          </button>
          <button onClick={handleLogout} className="p-1.5 bg-white/10 rounded-lg ml-2 hover:bg-rose-600 transition-colors">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-slate-500 font-semibold">จำนวนเครื่องทั้งหมด</p>
          <h3 className="text-xl font-bold text-slate-800">{machines.length} เครื่อง</h3>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-emerald-600 font-semibold">สถานะว่าง</p>
          <h3 className="text-xl font-bold text-emerald-600">{machines.filter(m => m.status === 'available').length} เครื่อง</h3>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-amber-600 font-semibold">ถูกจองแล้ว/กำลังใช้งาน</p>
          <h3 className="text-xl font-bold text-amber-600">{machines.filter(m => m.status === 'in_use' || m.status === 'booked').length} เครื่อง</h3>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-rose-600 font-semibold">ชำรุด/ปิดปรับปรุง</p>
          <h3 className="text-xl font-bold text-rose-600">{machines.filter(m => m.status === 'maintenance').length} เครื่อง</h3>
        </div>
      </div>

      {/* Machines List */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold text-slate-800">รายการเครื่องซักผ้าทั้งหมด</h2>
        <button onClick={fetchMachines} className="flex items-center gap-1 text-[11px] bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> รีเฟรชข้อมูล
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">กำลังโหลดรายการเครื่อง...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {machines.map((m) => (
            <div key={m.machine_id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-xs font-bold text-slate-800">{m.machine_name}</h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m.status}</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{m.location}</p>

                <label className="block text-[10px] font-semibold text-slate-600 mb-1">ปรับเปลี่ยนสถานะ (Manual):</label>
                <select
                  value={m.status}
                  onChange={(e) => handleStatusChange(m.machine_id, e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 mb-3 focus:outline-none"
                >
                  <option value="available">ว่าง</option>
                  <option value="in_use">กำลังใช้งาน</option>
                  <option value="booked">ถูกจองแล้ว</option>
                  <option value="maintenance">ชำรุด/ปิดปรับปรุง</option>
                </select>
              </div>

              <button
                onClick={() => handleSaveStatus(m.machine_id, m.status)}
                className="w-full py-1.5 bg-[#8B5A2B] text-white text-xs font-bold rounded-xl hover:bg-[#724822] transition-colors"
              >
                บันทึกสถานะ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
