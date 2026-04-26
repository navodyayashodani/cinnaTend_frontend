// src/services/api.jsx

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-7884.up.railway.app/api/';

// Add this line - Media URL without /api suffix for profile pictures and other media
export const MEDIA_URL = API_URL.replace(/\/api\/?$/, '');

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${MEDIA_URL}${normalizedPath}`;
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token to every non-public request
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = ['/auth/login/', '/auth/register/'];
    const isPublic = publicEndpoints.some(ep => config.url?.includes(ep));

    if (!isPublic) {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Clear tokens on 401 (except auth endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login/') ||
        error.config?.url?.includes('/auth/register/');

      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (userData) => api.post('/auth/register/', userData),
  login:    (credentials) => api.post('/auth/login/', credentials),
  logout:   (refreshToken) => api.post('/auth/logout/', { refresh_token: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (profileData) => {
    const config = profileData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.patch('/auth/profile/update/', profileData, config);
  },
};

// ── Tender API ────────────────────────────────────────────────────────────────
export const tenderAPI = {
  getAllTenders:      ()           => api.get('/tenders/'),
  getTender:         (id)         => api.get(`/tenders/${id}/`),
  createTender:      (data)       => api.post('/tenders/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTender:      (id, data)   => {
    const headers = data instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    return api.put(`/tenders/${id}/`, data, { headers });
  },
  patchTender:       (id, data)   => api.patch(`/tenders/${id}/`, data),
  deleteTender:      (id)         => api.delete(`/tenders/${id}/`),
  getNextTenderNumber: ()         => api.get('/tenders/next-number/'),
  predictQuality:    (formData)   => api.post('/tenders/predict-quality/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTenderBids:     (tenderId)   => api.get(`/tenders/${tenderId}/bids/`),
};

// ── Bid API ───────────────────────────────────────────────────────────────────
export const bidAPI = {
  getAllBids:  ()        => api.get('/bids/'),
  getBid:     (id)      => api.get(`/bids/${id}/`),
  createBid:  (data)    => api.post('/bids/', data),
  updateBid:  (id, data) => api.patch(`/bids/${id}/`, { bid_amount: data.bid_amount, message: data.message }),
  patchBid:   (id, data) => api.patch(`/bids/${id}/`, data),
  deleteBid:  (id)      => api.delete(`/bids/${id}/`),
  acceptBid:  (bidId)   => api.post(`/bids/${bidId}/accept/`),
};

// ── Chat API ──────────────────────────────────────────────────────────────────
export const chatAPI = {
  getUsers:      (role)                  => api.get(`/chat/users/?role=${role}`).then(r => r.data),
  getMessages:   (receiverId)            => api.get(`/chat/messages/?receiver_id=${receiverId}`).then(r => r.data),
  sendMessage:   (receiverId, message)   => api.post('/chat/messages/', { receiver_id: receiverId, message }).then(r => r.data),
  getUnreadCount: ()                     => api.get('/chat/unread-count/').then(r => r.data),
  markRead:      (senderId)              => api.post('/chat/mark-read/', { sender_id: senderId }).then(r => r.data),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
// Backend prefix: /api/admin-panel/  (avoids clash with Django's /admin/)
export const adminAPI = {
  getStats: () =>
    api.get('/admin-panel/stats/').then(r => r.data),

  getUsers: (params = {}) =>
    api.get('/admin-panel/users/', { params }).then(r => r.data),

  getUser: (id) =>
    api.get(`/admin-panel/users/${id}/`).then(r => r.data),

  updateUser: (id, data) =>
    api.patch(`/admin-panel/users/${id}/`, data).then(r => r.data),

  deleteUser: (id) =>
    api.delete(`/admin-panel/users/${id}/`).then(r => r.data),

  getTenders: (params = {}) =>
    api.get('/admin-panel/tenders/', { params }).then(r => r.data),

  getTender: (id) =>
    api.get(`/admin-panel/tenders/${id}/`).then(r => r.data),

  getBids: (params = {}) =>
    api.get('/admin-panel/bids/', { params }).then(r => r.data),

  getGradingReports: (params = {}) =>
    api.get('/admin-panel/grading-reports/', { params }).then(r => r.data),

  getActivityLogs: (params = {}) =>
    api.get('/admin-panel/activity-logs/', { params }).then(r => r.data),

  getSummaryReport: () =>
    api.get('/admin-panel/reports/summary/').then(r => r.data),
};

// ── Token helpers ─────────────────────────────────────────────────────────────
export const setAuthToken = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getAuthToken = () => localStorage.getItem('access_token');

export const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user));

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;