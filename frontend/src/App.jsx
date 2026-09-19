import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<div className="p-8 text-center text-sm font-bold">หน้า Admin Dashboard (กำลังพัฒนา)</div>} />
        </Routes>
      </div>
    </Router>
  );
}
