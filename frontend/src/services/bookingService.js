import api from './api';

export const bookingService = {
  // ดึงรายการเครื่องซักผ้าทั้งหมด
  getMachines: async () => {
    const response = await api.get('/machines');
    return response.data;
  },

  // ปรับสถานะเครื่องซักผ้า (สำหรับ Admin)
  updateMachineStatus: async (id, status) => {
    const response = await api.put(`/machines/${id}/status`, { status });
    return response.data;
  },

  // สร้างรายการจองคิว
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // ดึงรายการคิวทั้งหมด (สำหรับ Admin Queue)
  getAllBookings: async () => {
    const response = await api.get('/bookings/all');
    return response.data;
  }
};
