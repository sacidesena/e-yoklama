import api from './axiosConfig';

const authService = {
  login: async (mail, sifre) => {
    try {
      console.log('🔑 Login request:', { mail });
      
      // OAuth2 format (form-urlencoded)
      const formData = new URLSearchParams();
      formData.append('username', mail);
      formData.append('password', sifre);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('✅ Login response:', response.data);
      
      // Token'ı kaydet
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token); // ✅ 'token' olarak kaydet
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log('📝 Register request:', userData);
      const response = await api.post('/auth/register', userData);
      console.log('✅ Register response:', response.data);
      
      // Token'ı kaydet
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Register error:', error.response?.data || error);
      throw error;
    }
  },

  getMe: async () => {
    try {
      console.log('👤 Getting current user...');
      const response = await api.get('/auth/me');
      console.log('✅ User data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ GetMe error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};

export default authService;