import axios from 'axios';

//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - Token ekle
api.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    
    // Token al
    const token = localStorage.getItem('admin_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token eklendi');
    } else {
      console.warn('⚠️ Token yok!');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.detail || error.message
    });

    // 401 hatası - Token yenile veya logout
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refresh_token = localStorage.getItem('admin_refresh_token');
          
          if (refresh_token) {
            console.log('🔄 Token yenileniyor...');
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refresh_token
            });
            
            const { access_token } = response.data;
            localStorage.setItem('admin_token', access_token);
            
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token yenileme hatası');
        }
      }
      
      // Token yenileme başarısız - Logout
      console.log('🚪 Logout yapılıyor...');
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;