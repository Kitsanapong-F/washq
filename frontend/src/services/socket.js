import io from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL && typeof import.meta.env.VITE_SOCKET_URL === 'string' && import.meta.env.VITE_SOCKET_URL.trim()) {
    return import.meta.env.VITE_SOCKET_URL.trim();
  }
  const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl && typeof apiUrl === 'string' && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  // Fallback อัตโนมัติเมื่อรันบน Render Static Site (washq-1.onrender.com)
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://washq-n9fj.onrender.com';
  }
  return undefined; // Local development via Vite proxy
};

export const createSocket = () => {
  const url = getSocketUrl();
  return io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
};
