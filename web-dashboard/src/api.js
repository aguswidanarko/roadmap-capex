import axios from 'axios';

// In dev (vite dev server on :5173) default to the separate backend on :4000.
// In a production build, default to '' (relative) so the SPA works no matter what domain
// it's served from — this lets the backend serve the built dashboard itself on one origin/port.
const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:4000' : '');

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
