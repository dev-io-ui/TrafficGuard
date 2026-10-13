import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fileUrl = (p) => (p ? BASE.replace(/\/api\/?$/, '') + p : null);
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
export default api;
