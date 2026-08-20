import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const CATEGORY_META = {
  BN: { label: 'Bangun Baru', color: '#2563eb' },
  EX: { label: 'Existing', color: '#16a34a' },
  AF: { label: 'Alih Fungsi', color: '#eab308' },
  BR: { label: 'Bongkar', color: '#dc2626' },
  BB: { label: 'Bongkar & Bangun', color: '#9333ea' },
};
export const CATEGORY_ORDER = ['BN', 'EX', 'AF', 'BR', 'BB'];

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('capex_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('capex_token');
      localStorage.removeItem('capex_user');
      if (!location.hash.includes('/login')) location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export default api;
export { API_URL };
