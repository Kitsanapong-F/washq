import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, Info } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('student');
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!studentCode || !password) {
      setError('รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }

    setError('');
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Banner ด้านข้าง (Desktop Only) */}
        <div className="bg-[#8B5A2B] text-white p-8 hidden md:flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-100/20 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">W</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">RMUTL Dormitory Laundry System</h1>
            <p className="text-amber-100/80 text-sm mb-6">
              เพิ่มความสะดวกสบายในการซักผ้าหอพักด้วยระบบจองคิวเครื่องซักผ้าล่วงหน้า ตรวจสอบสถานะแบบออนไลน์ได้ทันที ตลอด 24 ชั่วโมง
            </p>
          </div>
          <div className="space-y-2 text-xs text-amber-100/70">
            <p>• สะดวก รวดเร็ว ไม่ต้องยืนรอ</p>
            <p>• แจ้งเตือนผ่านคิวได้อย่างแม่นยำ</p>
            <p>• สนับสนุนบริการนักศึกษา มทร.ล้านนา</p>
          </div>
        </div>

        {/* ฟอร์ม เข้าสู่ระบบ */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="text-center md:text-left mb-6">
            <h2 className="text-xl font-bold text-slate-900">ระบบจองเครื่องซักผ้าหอพัก</h2>
            <p className="text-xs text-slate-500">หอพักนักศึกษา มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา</p>
          </div>

          {/* สลับ Tab นักศึกษา / ผู้ดูแลระบบ */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'student' ? 'bg-[#8B5A2B] text-white shadow' : 'text-slate-600'
              }`}
            >
              นักศึกษา
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'admin' ? 'bg-[#8B5A2B] text-white shadow' : 'text-slate-600'
              }`}
            >
              ผู้ดูแลระบบ
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {role === 'student' ? 'รหัสนักศึกษา' : 'ชื่อผู้ใช้หรืออีเมลแอดมิน'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={role === 'student' ? 'เช่น 6512345678-9' : 'admin.laundry@rmutl.ac.th'}
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#8B5A2B] hover:bg-[#724822] text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <div className="mt-6 p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-tight">
              <strong>ข้อมูลเพิ่มเติม:</strong> ระบบรองรับการเข้าสู่ระบบสำหรับนักศึกษาและผู้ดูแลระบบ
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
