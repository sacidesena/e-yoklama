import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
//import './LoginPage.css';

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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Yoklama Sistemi</h1>
          <p>Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="mail">E-posta</label>
            <input
              type="email"
              id="mail"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder="ornek@mail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sifre">Şifre</label>
            <input
              type="password"
              id="sifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;