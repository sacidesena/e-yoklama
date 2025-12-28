import api from './api';

const authService = {
  // Kayıt
  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    return response.data;
  },

  // Giriş
  async login(mail, sifre) {
  const params = new URLSearchParams();
  params.append('username', mail);
  params.append('password', sifre);

  const response = await api.post(
  '/auth/login',
  params,
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
);


  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    const userResponse = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(userResponse.data));
  }

  return response.data;
},


  // Çıkış
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Kullanıcı bilgisi al
  async getMe() {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Token var mı kontrol et
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  // Kullanıcı bilgisi
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;