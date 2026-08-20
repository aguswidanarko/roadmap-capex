import axios from 'axios';
import { getSession } from './db/db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const CATEGORY_META = {
  BN: { label: 'Bangun Baru', color: '#2563eb' },
  EX: { label: 'Existing', color: '#16a34a' },
  AF: { label: 'Alih Fungsi', color: '#eab308' },
  BR: { label: 'Bongkar', color: '#dc2626' },
  BB: { label: 'Bongkar & Bangun', color: '#9333ea' },
};
export const CATEGORY_ORDER = ['BN', 'EX', 'AF', 'BR', 'BB'];

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

export default api;
export { API_URL };
