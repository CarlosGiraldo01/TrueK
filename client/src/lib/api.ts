import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('truek_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthPage =
        window.location.pathname === '/login' || window.location.pathname === '/register';

      if (!isAuthPage) {
        localStorage.removeItem('truek_token');
        localStorage.removeItem('truek_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);