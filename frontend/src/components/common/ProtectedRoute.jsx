import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    user = null;
  }

  // หากยังไม่ได้เข้าสู่ระบบ ให้ส่งไปหน้า Login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // หากเป็นหน้าระดับ Admin แต่ Role ไม่ใช่ admin ให้ส่งกลับหน้า Dashboard นักศึกษา
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
