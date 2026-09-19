import api from './api';

export const authService = {
  login: async (studentCode, password, role) => {
    const response = await api.post('/auth/login', {
      student_code: studentCode,
      password: password,
      role: role
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
