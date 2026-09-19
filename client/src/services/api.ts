import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('culture-quest-token');
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
