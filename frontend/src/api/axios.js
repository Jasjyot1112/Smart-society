import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  toast.error('Session expired. Please login again.', { id: 'session-expired' });
  window.location.href = '/login';
};

// Request interceptor: attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 / token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept 401 errors for login or refresh endpoints
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return API(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefresh);
        API.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        processQueue(null, newToken);
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearSessionAndRedirect();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
