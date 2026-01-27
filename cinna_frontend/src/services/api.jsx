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
// ✅ FIX: Only add token to requests that need authentication
api.interceptors.request.use(
  (config) => {
    // List of endpoints that don't need authentication
    const publicEndpoints = [
      '/auth/login/',
      '/auth/register/',
    ];
    
    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    // Only add token for non-public endpoints
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (token expired, etc.)
    if (error.response?.status === 401) {
      // Only clear auth if not on login/register endpoints
      const isAuthEndpoint = error.config?.url?.includes('/auth/login/') || 
                             error.config?.url?.includes('/auth/register/');
      
      if (!isAuthEndpoint) {
        // Token is invalid/expired, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Optionally redirect to login
        // window.location.href = '/';
      }
    }
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
  updateTender: (id, tenderData) => {
    // Handle both FormData and regular objects
    const headers = tenderData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    return api.put(`/tenders/${id}/`, tenderData, { headers });
  },
  patchTender: (id, tenderData) => {
    // PATCH for partial updates (like status changes)
    return api.patch(`/tenders/${id}/`, tenderData);
  },
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
  patchBid: (id, bidData) => api.patch(`/bids/${id}/`, bidData),
  deleteBid: (id) => api.delete(`/bids/${id}/`),
  acceptBid: (bidId) => api.post(`/bids/${bidId}/accept/`),
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