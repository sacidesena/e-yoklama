import { createContext, useState, useEffect } from 'react';
import authService from '../../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      console.log('🔍 AuthContext: Kullanıcı kontrol ediliyor...');
      
      const token = localStorage.getItem('access_token'); 
      const savedUser = localStorage.getItem('user');

      if (!token) {
        console.log('❌ Token yok');
        setLoading(false);
        return;
      }

      try {
        // Önce localStorage'dan yükle
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('✅ LocalStorage\'dan user yüklendi:', userData);
          setUser(userData);
        }
        
        // Sonra backend'den güncel veriyi al
        const userData = await authService.getMe();
        console.log('✅ Backend\'den user alındı:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
      } catch (error) {
        console.error('⚠️ Token geçersiz, kullanıcı çıkış yaptı');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (mail, sifre) => {
    try {
      console.log('🔑 LOGIN BAŞLADI:', { mail });
      
      const response = await authService.login(mail, sifre);
      console.log('✅ LOGIN RESPONSE:', response);
      
      // User verisini al
      let userData;
      
      if (response.user) {
        userData = response.user;
      } else {
        userData = await authService.getMe();
      }
      
      console.log('👤 USER DATA:', userData);
      
      // State ve localStorage'a kaydet
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response;
    } catch (error) {
      console.error('❌ LOGIN HATASI:', error);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      console.log('📝 REGISTER BAŞLADI:', data);
      
      const response = await authService.register(data);
      console.log('✅ REGISTER RESPONSE:', response);
      
      // User verisini al
      let userData;
      
      if (response.user) {
        userData = response.user;
      } else {
        userData = await authService.getMe();
      }
      
      console.log('👤 USER DATA:', userData);
      
      // State ve localStorage'a kaydet
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response;
    } catch (error) {
      console.error('❌ REGISTER HATASI:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('👋 LOGOUT');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};