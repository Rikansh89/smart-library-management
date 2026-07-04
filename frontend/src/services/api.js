import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
};

export const bookAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/books/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
  getMostBorrowed: (params) => api.get('/books/most-borrowed', { params })
};

export const issueAPI = {
  requestIssue: (bookId) => api.post('/issues/request', { book_id: bookId }),
  approveIssue: (id) => api.put(`/issues/${id}/approve`),
  returnBook: (id) => api.put(`/issues/${id}/return`),
  getAll: (params) => api.get('/issues', { params }),
  getMy: (params) => api.get('/issues/my', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  scan: (bookId) => api.get(`/issues/scan/${bookId}`)
};

export const reservationAPI = {
  create: (bookId) => api.post('/reservations', { book_id: bookId }),
  getMy: (params) => api.get('/reservations/my', { params }),
  getAll: (params) => api.get('/reservations', { params }),
  approve: (id) => api.put(`/reservations/${id}/approve`),
  cancel: (id) => api.put(`/reservations/${id}/cancel`)
};

export const roomAPI = {
  getAll: () => api.get('/study-rooms'),
  getAvailability: (id, date) => api.get(`/study-rooms/${id}/availability`, { params: { date } }),
  book: (data) => api.post('/study-rooms/book', data),
  getMyBookings: (params) => api.get('/study-rooms/bookings/my', { params }),
  getAllBookings: (params) => api.get('/study-rooms/bookings', { params }),
  cancelBooking: (id) => api.put(`/study-rooms/bookings/${id}/cancel`),
  create: (data) => api.post('/study-rooms', data),
  update: (id, data) => api.put(`/study-rooms/${id}`, data),
  delete: (id) => api.delete(`/study-rooms/${id}`)
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

export const fineAPI = {
  getMy: (params) => api.get('/fines/my', { params }),
  getTotalUnpaid: () => api.get('/fines/total-unpaid'),
  payFine: (id) => api.put(`/fines/${id}/pay`),
  getStats: () => api.get('/fines/stats')
};

export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  upload: (data) => api.post('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/resources/${id}`),
  getCategories: () => api.get('/resources/categories')
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getLogs: () => api.get('/admin/logs')
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getFull: () => api.get('/analytics/full')
};

export const recommendationAPI = {
  get: () => api.get('/recommendations'),
  logInteraction: (bookId, type) => api.post('/recommendations/log', { book_id: bookId, interaction_type: type })
};

export const chatbotAPI = {
  chat: (message) => api.post('/chatbot/chat', { message }),
  searchBooks: (query) => api.get('/chatbot/search', { params: { query } })
};
