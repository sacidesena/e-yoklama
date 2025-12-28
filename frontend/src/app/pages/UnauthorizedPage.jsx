import { Link } from 'react-router-dom';
//import './UnauthorizedPage.css';

const UnauthorizedPage = () => {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-content">
        <div className="error-icon">🚫</div>
        <h1>Yetkisiz Erişim</h1>
        <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        <Link to="/dashboard" className="home-button">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;