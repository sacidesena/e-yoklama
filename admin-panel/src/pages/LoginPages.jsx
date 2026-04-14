import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ mail: '', sifre: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔑 Login başladı:', credentials.mail);
      
      // OAuth2 format
      const formData = new URLSearchParams();
      formData.append('username', credentials.mail);
      formData.append('password', credentials.sifre);

      // 1. Login
      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' ,'ngrok-skip-browser-warning': 'true' 
          
        }
      });

      console.log('✅ Token alındı:', response.data);
      const { access_token, refresh_token } = response.data;
      
      // 2. User bilgisi
      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'ngrok-skip-browser-warning': 'true'  
        }
      });

      console.log('👤 User bilgisi:', userResponse.data);

      // 3. Admin kontrolü
      if (userResponse.data.rol !== 'admin') {
        toast.error('❌ Bu panel sadece admin içindir!');
        return;
      }

      // 4. Kaydet
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('admin_user', JSON.stringify(userResponse.data));
      
      console.log('✅ LocalStorage kaydedildi');
      toast.success('✅ Giriş başarılı!');
      
      // 5. Yönlendir - navigate kullan (window.location değil!)
      console.log('📍 Dashboard\'a yönlendiriliyor...');
      navigate('/dashboard'); // ✅ Düzeltildi
      
    } catch (error) {
      console.error('❌ Login hatası:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('❌ E-posta veya şifre hatalı!');
        } else {
          toast.error(`❌ Hata: ${error.response.data.detail || 'Giriş yapılamadı'}`);
        }
      } else {
        toast.error('❌ Sunucuya bağlanılamadı! Backend çalışıyor mu?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 Admin Panel</h1>
        <p style={styles.subtitle}>Yoklama Sistemi Yönetim Paneli</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            value={credentials.mail}
            onChange={(e) => setCredentials({ ...credentials, mail: e.target.value })}
            style={styles.input}
            placeholder="admin@yoklama.com"
            required
            disabled={loading}
          />
          
          <input
            type="password"
            value={credentials.sifre}
            onChange={(e) => setCredentials({ ...credentials, sifre: e.target.value })}
            style={styles.input}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p style={styles.warning}>⚠️ Sadece yetkili yönetici erişimi</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '450px',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px'
  },
  warning: {
    marginTop: '20px',
    textAlign: 'center',
    color: '#dc3545',
    fontSize: '14px'
  }
};

export default LoginPage;