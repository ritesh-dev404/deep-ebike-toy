import axios from 'axios';

// Configurable API base URL:
// - Defaults to '/api' for local development (Vite proxy) and offline desktop Electron
// - Configurable via VITE_API_URL on Vercel (e.g. 'https://deep-ebike-toy.onrender.com/api')
function normalizeApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.trim() === '' || rawUrl.trim() === '/api') {
    return '/api';
  }
  let url = rawUrl.trim().replace(/\/+$/, '');
  // If user passed origin like 'https://deep-ebike-toy.onrender.com' without '/api', append it
  if ((url.startsWith('http://') || url.startsWith('https://')) && !url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('deep_pos_token');
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
      localStorage.removeItem('deep_pos_token');
      localStorage.removeItem('deep_pos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
