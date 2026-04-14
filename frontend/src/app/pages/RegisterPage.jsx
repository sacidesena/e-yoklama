import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    mail: '',
    ad: '',
    sifre: '',
    sifreTekrar: '',
    ogrenci_no: '',
    rol: 'ogrenci',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mail.endsWith('@ogrenci.ibu.edu.tr')) {
      toast.error('Lütfen okul mail adresinizi kullanın (@ogrenci.ibu.edu.tr)');
      return;
    }
    if (formData.sifre !== formData.sifreTekrar) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }
    setLoading(true);
    try {
      const { sifreTekrar, ...registerData } = formData;
      await register(registerData);
      toast.success('Kayıt başarılı!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast.error(error.response?.data?.detail || 'Kayıt başarısız!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>

        {/* Logo */}
        <div style={styles.logoWrapper}>
          <img
            src="/logo-1.png"
            alt="BAİBÜ"
            style={styles.logo}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Başlık */}
        <div style={styles.formHeader}>
          <h1 style={styles.formTitle}>Yeni Hesap Oluştur</h1>
          <p style={styles.formSubtitle}>Bolu Abant İzzet Baysal Üniversitesi</p>
        </div>

    

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Ad Soyad</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text"
                name="ad"
                value={formData.ad}
                onChange={handleChange}
                placeholder="Sacide Sena Coşkunyürek"
                required
                style={styles.input}
                onFocus={(e) => e.target.parentElement.style.borderColor = '#1a3a6e'}
                onBlur={(e) => e.target.parentElement.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                type="email"
                name="mail"
                value={formData.mail}
                onChange={handleChange}
                placeholder="@ogrenci.ibu.edu.tr"
                required
                style={styles.input}
                onFocus={(e) => e.target.parentElement.style.borderColor = '#1a3a6e'}
                onBlur={(e) => e.target.parentElement.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Öğrenci No</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🎓</span>
              <input
                type="text"
                name="ogrenci_no"
                value={formData.ogrenci_no}
                onChange={handleChange}
                placeholder="233405104"
                required={formData.rol === 'ogrenci'}
                style={styles.input}
                onFocus={(e) => e.target.parentElement.style.borderColor = '#1a3a6e'}
                onBlur={(e) => e.target.parentElement.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                name="sifre"
                value={formData.sifre}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={styles.input}
                onFocus={(e) => e.target.parentElement.style.borderColor = '#1a3a6e'}
                onBlur={(e) => e.target.parentElement.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre Tekrar</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                name="sifreTekrar"
                value={formData.sifreTekrar}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={styles.input}
                onFocus={(e) => e.target.parentElement.style.borderColor = '#1a3a6e'}
                onBlur={(e) => e.target.parentElement.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Kayıt yapılıyor...' : 'Kayıt Ol →'}
          </button>
        </form>

        <div style={styles.loginSection}>
          <p style={styles.loginText}>Zaten hesabınız var mı?</p>
          <Link to="/login" style={styles.loginLink}>Giriş Yap</Link>
        </div>

        <div style={styles.footer}>
          <p>© 2025 Bolu Abant İzzet Baysal Üniversitesi</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a3a6e 0%, #2d5a9e 60%, #1a6e4a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  formCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '36px 36px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  logoWrapper: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  logo: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a3a6e',
    margin: '0 0 6px',
  },
  formSubtitle: {
    color: '#888',
    fontSize: '12px',
    margin: 0,
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    transition: 'border-color 0.2s',
    overflow: 'hidden',
  },
  inputIcon: {
    padding: '0 10px',
    fontSize: '16px',
    userSelect: 'none',
  },
  input: {
    flex: 1,
    padding: '10px 10px 10px 0',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#1a1a1a',
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #1a3a6e 0%, #2d5a9e 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(26,58,110,0.3)',
  },
  loginSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '18px',
  },
  loginText: {
    color: '#888',
    fontSize: '13px',
    margin: 0,
  },
  loginLink: {
    color: '#1a3a6e',
    fontWeight: '700',
    fontSize: '13px',
    textDecoration: 'none',
    padding: '5px 14px',
    border: '2px solid #1a3a6e',
    borderRadius: '8px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#ccc',
    fontSize: '11px',
  },
};

export default RegisterPage;