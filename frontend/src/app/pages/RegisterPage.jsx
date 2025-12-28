import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
//import './RegisterPage.css';

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Şifre kontrolü
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
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Kayıt Ol</h1>
          <p>Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="ad">Ad Soyad</label>
            <input
              type="text"
              id="ad"
              name="ad"
              value={formData.ad}
              onChange={handleChange}
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mail">E-posta</label>
            <input
              type="email"
              id="mail"
              name="mail"
              value={formData.mail}
              onChange={handleChange}
              placeholder="ornek@mail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ogrenci_no">Öğrenci No</label>
            <input
              type="text"
              id="ogrenci_no"
              name="ogrenci_no"
              value={formData.ogrenci_no}
              onChange={handleChange}
              placeholder="20210001"
              required={formData.rol === 'ogrenci'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sifre">Şifre</label>
            <input
              type="password"
              id="sifre"
              name="sifre"
              value={formData.sifre}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sifreTekrar">Şifre Tekrar</label>
            <input
              type="password"
              id="sifreTekrar"
              name="sifreTekrar"
              value={formData.sifreTekrar}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;