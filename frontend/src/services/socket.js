import io from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  // Fallback อัตโนมัติสำหรับ Render Static Site
  if (typeof window !== 'undefined' && window.location.hostname.includes('washq-1.onrender.com')) {
    return 'https://washq-n9fj.onrender.com';
  }
  return undefined; // Local Vite proxy
};

export const createSocket = () => {
  const url = getSocketUrl();
  return io(url);
};
