import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config'; // config dosyanın yolunun doğru olduğundan emin ol

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Başlangıçta loading true olmalı ki kontrol bitmeden login'e atmasın
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  // Sayfa yenilendiğinde çalışacak kritik fonksiyon
  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Oturum kontrol ediliyor...");
      // Token varsa backend'e sor: "Bu kim?"
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("✅ Kullanıcı doğrulandı:", response.data);
      setUser(response.data); // Kullanıcıyı içeri al
    } catch (error) {
      console.error("❌ Oturum geçersiz:", error);
      // Token geçersizse temizle
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('admin_user');
      setUser(null);
    } finally {
      setLoading(false); // Kontrol bitti, kapıları aç
    }
  };

  const login = async (mail, sifre) => {
    // Login işlemini LoginPage.jsx yapıyor, burası sadece state güncellerse yeterli
    // Ancak AuthContext üzerinden yapmak istersen burayı doldurabiliriz.
    // Şimdilik boş bırakıyorum çünkü LoginPage.jsx her şeyi hallediyor.
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};