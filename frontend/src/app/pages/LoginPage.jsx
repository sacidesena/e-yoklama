import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [mail, setMail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(mail, sifre);
      toast.success('Giriş başarılı!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Giriş hatası:', error);
      toast.error(error.response?.data?.detail || 'Giriş başarısız!');
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
            src="logo-1.png"
            alt="BAİBÜ"
            style={styles.logo}
            //onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Başlık */}
        <div style={styles.formHeader}>
          <h1 style={styles.formTitle}>BAİBÜ E-Yoklama</h1>
          <p style={styles.formSubtitle}>Bolu Abant İzzet Baysal Üniversitesi</p>
        </div>

        

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                placeholder="@ogrenci.ibu.edu.tr"
                required
                style={styles.input}
                onFocus={(e) => e.target.parentElement.style.border = '1px solid #3b82f6'}
                onBlur={(e) => e.target.parentElement.style.border = '1px solid rgba(255,255,255,0.18)'}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
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
            {loading ? '⏳ Giriş yapılıyor...' : 'Giriş Yap →'}
          </button>
        </form>

        <div style={styles.registerSection}>
          <p style={styles.registerText}>Hesabınız yok mu?</p>
          <Link to="/register" style={styles.registerLink}>Kayıt Ol</Link>
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
    background: 'linear-gradient(120deg, #0f172a 0%, #1e40af 50%, #065f46 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },

  formCard: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(18px)',
    borderRadius: '20px',
    padding: '40px 34px',
    boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'white',
  },

  logoWrapper: {
    textAlign: 'center',
    marginBottom: '10px',
  },

  logo: {
    width: '75px',
    height: '75px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
  },

  formHeader: {
    textAlign: 'center',
    marginBottom: '20px',
  },

  formTitle: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '0.4px',
    marginBottom: '3px',
  },

  formSubtitle: {
    color: '#c7d2fe',
    fontSize: '12px',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#e5e7eb',
  },

  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    transition: 'all 0.2s ease',
  },

  inputIcon: {
    padding: '0 10px',
    fontSize: '14px',
    opacity: 0.7,
  },

  input: {
    flex: 1,
    padding: '11px 8px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'white',
    fontSize: '13px',
  },

  submitBtn: {
    marginTop: '6px',
    padding: '13px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #2563eb, #1e3a8a)', // FIXED
    color: 'white',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
  },

  registerSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: '5px',
    marginTop: '15px',
  },

  registerText: {
    fontSize: '12px',
    color: '#cbd5f5',
  },

  registerLink: {
    color: '#fafafa',
    fontWeight: '600',
    textDecoration: 'none',
  },

  footer: {
    textAlign: 'center',
    marginTop: '18px',
    fontSize: '10px',
    color: '#9ca3af',
  },
};

export default LoginPage;