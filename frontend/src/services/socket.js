import io from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return undefined; // Local development via Vite proxy
};

export const createSocket = () => {
  const url = getSocketUrl();
  return io(url);
};
