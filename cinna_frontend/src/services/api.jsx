// src/services/api.jsx

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      '/auth/login/',
      '/auth/register/',
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login/') || 
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
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh_token: refreshToken }),
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
  getAllTenders: () => api.get('/tenders/'),
  getTender: (id) => api.get(`/tenders/${id}/`),
  createTender: (tenderData) => api.post('/tenders/', tenderData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateTender: (id, tenderData) => {
    const headers = tenderData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    return api.put(`/tenders/${id}/`, tenderData, { headers });
  },
  patchTender: (id, tenderData) => api.patch(`/tenders/${id}/`, tenderData),
  deleteTender: (id) => api.delete(`/tenders/${id}/`),
  getNextTenderNumber: () => api.get('/tenders/next-number/'),
  predictQuality: (formData) => api.post('/tenders/predict-quality/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTenderBids: (tenderId) => api.get(`/tenders/${tenderId}/bids/`),
};

// ── Bid API ───────────────────────────────────────────────────────────────────
export const bidAPI = {
  getAllBids: () => api.get('/bids/'),
  getBid: (id) => api.get(`/bids/${id}/`),
  createBid: (bidData) => api.post('/bids/', bidData),
  updateBid: (id, bidData) => {
    const updateData = {
      bid_amount: bidData.bid_amount,
      message: bidData.message
    };
    return api.patch(`/bids/${id}/`, updateData);
  },
  patchBid: (id, bidData) => api.patch(`/bids/${id}/`, bidData),
  deleteBid: (id) => api.delete(`/bids/${id}/`),
  acceptBid: (bidId) => api.post(`/bids/${bidId}/accept/`),
};

// ── Chat API ──────────────────────────────────────────────────────────────────
// Buyers pass role='manufacturer', Manufacturers pass role='buyer'
export const chatAPI = {
  getUsers: (role) =>
    api.get(`/chat/users/?role=${role}`).then(r => r.data),

  getMessages: (receiverId) =>
    api.get(`/chat/messages/?receiver_id=${receiverId}`).then(r => r.data),

  sendMessage: (receiverId, message) =>
    api.post('/chat/messages/', { receiver_id: receiverId, message }).then(r => r.data),

  getUnreadCount: () =>
    api.get('/chat/unread-count/').then(r => r.data),

  markRead: (senderId) =>
    api.post('/chat/mark-read/', { sender_id: senderId }).then(r => r.data),
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

export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;