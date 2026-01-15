import api from './axiosConfig';

const authService = {
  login: async (mail, sifre) => {
    try {
      console.log('🔑 Admin login başladı:', mail);
      
      // OAuth2 format (form-urlencoded)
      const formData = new URLSearchParams();
      formData.append('username', mail);
      formData.append('password', sifre);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('✅ Login başarılı:', response.data);
      
      // Token kaydet
      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_refresh_token', response.data.refresh_token);
      
      // User bilgisini al
      const user = await authService.getMe();
      
      // Admin kontrolü
      if (user.rol !== 'admin') {
        throw new Error('Bu hesap admin değil!');
      }
      
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      return { token: response.data, user };
    } catch (error) {
      console.error('❌ Login hatası:', error.response?.data || error.message);
      localStorage.clear();
      throw error;
    }
  },

  getMe: async () => {
    try {
      console.log('👤 Admin bilgisi alınıyor...');
      const response = await api.get('/auth/me');
      console.log('✅ Admin user:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ GetMe hatası:', error);
      throw error;
    }
  },

  logout: () => {
    console.log('👋 Logout');
    localStorage.clear();
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },

  getUser: () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;