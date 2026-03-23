import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',  // ✅ EKLENDİ
  }
});

api.interceptors.request.use(
  (config) => {
    console.log('📤 Admin Request:', config.method.toUpperCase(), config.url);
    
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token eklendi');
    } else {
      console.warn('⚠️ Token yok!');
    }

    config.headers['ngrok-skip-browser-warning'] = 'true';  // ✅ EKLENDİ
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        
        if (refresh_token) {
          console.log('🔄 Token yenileniyor...');
          
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token
          }, {
            headers: { 'ngrok-skip-browser-warning': 'true' }  // ✅ EKLENDİ
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token yenileme hatası');
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;