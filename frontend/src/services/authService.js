import api from './axiosConfig';

const authService = {
  // Login İşlemi (Form Data Formatında)
  login: async (mail, sifre) => {
    try {
      console.log('🔑 Login isteği hazırlanıyor:', { mail });

      // ⚠️ KRİTİK NOKTA: JSON yerine URLSearchParams kullanıyoruz
      const formData = new URLSearchParams();
      formData.append('username', mail);  // Backend 'username' bekliyor
      formData.append('password', sifre); // Backend 'password' bekliyor

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Header'ı özellikle belirtiyoruz
        },
      });

      console.log('✅ Login başarılı, Token alındı.');

      // Tokenları kaydet
      const { access_token, refresh_token } = response.data;
      if (access_token) localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

      // Not: Login sadece token döner, kullanıcı bilgilerini Context içinde getMe ile çekeceğiz.
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Register İşlemi (Burası JSON kalabilir, Backend Schema bekliyor)
  register: async (data) => {
    try {
      console.log('📝 Register isteği:', data);
      const response = await api.post('/auth/register', data);
      
      console.log('✅ Register başarılı.');

      // Kayıt sonrası otomatik giriş için tokenları kaydet
      const { access_token, refresh_token } = response.data;
      if (access_token) localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

      return response.data;
    } catch (error) {
      console.error('❌ Register error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Kullanıcı Bilgilerini Getir
  getMe: async () => {
    try {
      // Token axiosConfig tarafından otomatik eklenecek
      const response = await api.get('/auth/me');
      console.log('👤 Kullanıcı bilgileri:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ GetMe error:', error);
      throw error;
    }
  },

  // LocalStorage'dan kullanıcıyı okuma (Senkron)
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  // Çıkış
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    // window.location.href = '/login'; // İsteğe bağlı yönlendirme
  }
};

export default authService;