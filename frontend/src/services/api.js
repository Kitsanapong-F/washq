import axios from 'axios';

export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // Fallback อัตโนมัติเมื่อรันบน Render Static Site (washq-1.onrender.com)
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://washq-n9fj.onrender.com/api';
  }

  // Local development ผ่าน Vite proxy
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // 30s timeout สำหรับรอ Free tier cold start
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor จัดการกรณี 401 Unauthorized ให้ล้าง Session และกลับไปหน้า Login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
