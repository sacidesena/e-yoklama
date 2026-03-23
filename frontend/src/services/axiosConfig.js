import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');  // ✅ token → access_token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true';
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');

        if (refresh_token) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token
          }, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);  // ✅ token → access_token

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;