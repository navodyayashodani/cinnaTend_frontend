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
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register/', userData),
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh_token: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
};

// Tender API functions
export const tenderAPI = {
  getAllTenders: () => api.get('/tenders/'),
  getTender: (id) => api.get(`/tenders/${id}/`),
  createTender: (tenderData) => api.post('/tenders/', tenderData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateTender: (id, tenderData) => api.put(`/tenders/${id}/`, tenderData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteTender: (id) => api.delete(`/tenders/${id}/`),
  getNextTenderNumber: () => api.get('/tenders/next-number/'),
  predictQuality: (formData) => api.post('/tenders/predict-quality/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTenderBids: (tenderId) => api.get(`/tenders/${tenderId}/bids/`),
};

// Bid API functions
export const bidAPI = {
  getAllBids: () => api.get('/bids/'),
  getBid: (id) => api.get(`/bids/${id}/`),
  createBid: (bidData) => api.post('/bids/', bidData),
  updateBid: (id, bidData) => api.put(`/bids/${id}/`, bidData),
  deleteBid: (id) => api.delete(`/bids/${id}/`),
};

// Helper functions for token management
export const setAuthToken = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;