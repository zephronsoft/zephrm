import axios from 'axios';

// Use env for API base: /api (relative, uses Vite proxy in dev) or full URL for production
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrm_token');
      localStorage.removeItem('hrm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
