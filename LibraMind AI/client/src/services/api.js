import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  add: (data) => api.post('/books', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/books/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/books/${id}`),
  getGenres: () => api.get('/books/genres'),
  getCategories: () => api.get('/books/categories'),
  getSimilar: (id) => api.get(`/books/${id}/similar`),
};

export const issueAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getMyIssues: () => api.get('/issues/my-issues'),
  issue: (data) => api.post('/issues/issue', data),
  return: (data) => api.post('/issues/return', data),
  renew: (data) => api.post('/issues/renew', data),
  getReservations: (params) => api.get('/issues/reservations', { params }),
  cancelReservation: (id) => api.post(`/issues/reservations/${id}/cancel`),
};

export const dashboardAPI = {
  getStudent: () => api.get('/dashboard/student'),
  getLibrarian: () => api.get('/dashboard/librarian'),
  getAdmin: () => api.get('/dashboard/admin'),
};

export const analyticsAPI = {
  getPopularBooks: (params) => api.get('/analytics/popular-books', { params }),
  getMonthlyTrends: (params) => api.get('/analytics/monthly-trends', { params }),
  getCategoryUsage: () => api.get('/analytics/category-usage'),
  getStudentActivity: (params) => api.get('/analytics/student-activity', { params }),
  getFineReports: (params) => api.get('/analytics/fine-reports', { params }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  sendReminders: () => api.post('/notifications/send-reminders'),
  sendOverdueAlerts: () => api.post('/notifications/send-overdue-alerts'),
};

export const chatAPI = {
  send: (message) => api.post('/chat', { message }),
};

export default api;
