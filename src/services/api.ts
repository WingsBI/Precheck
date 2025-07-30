/// <reference types="vite/client" />
import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { isTokenExpired } from '../utils/jwtUtils';

// Debug environment variables
console.log('Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not defined in environment variables');
} 

const api = axios.create({
  baseURL: "https://wingsbi-precheck-api.azurewebsites.net/",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.user?.token;

    if (token) {
      // Check if token is expired before making the request
      if (isTokenExpired(token)) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired/invalid on server side)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Logout user and redirect to login
      store.dispatch(logout());
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

export default api; 