import api from './api';

export const bookingService = {
  getMachines: async () => {
    const response = await api.get('/machines');
    return response.data;
  },

  updateMachineStatus: async (id, status) => {
    const response = await api.put(`/machines/${id}/status`, { status });
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await api.get('/bookings/all');
    return response.data;
  },

  // ใส่ comma ปิดท้ายฟังก์ชันนี้ให้ถูกต้อง
  cancelBooking: async (bookingId) => {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  getUserActiveBooking: async (userId) => {
    const response = await api.get(`/bookings/user/${userId}/active`);
    return response.data;
  }
};
