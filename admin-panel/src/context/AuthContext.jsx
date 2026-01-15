import { createContext, useState, useEffect } from 'react';

// URL lazım değil, çünkü backend'e sormadan direkt içeri alacağız
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa açılınca çalışır
    const storedUser = localStorage.getItem('admin_user');
    const token = localStorage.getItem('access_token');

    if (token && storedUser) {
      console.log("✅ LocalStorage'da kullanıcı bulundu, içeri alınıyor...");
      // Backend'e sormadan, hafızadaki bilgiyi kullanıp kapıyı açıyoruz
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Kullanıcı verisi bozuk, çıkış yapılıyor.");
        localStorage.clear();
        setUser(null);
      }
    } else {
      console.log("❌ Kullanıcı bulunamadı.");
      setUser(null);
    }
    
    // Yükleme bitti, kapılar açılsın
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};