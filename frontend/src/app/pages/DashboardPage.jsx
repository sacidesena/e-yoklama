import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import yoklamaService from '../../services/yoklamaService';

const DashboardPage = () => {
  const [yoklamalar, setYoklamalar] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const yoklamaResponse = await yoklamaService.getMyYoklamalar();
      if (Array.isArray(yoklamaResponse)) {
        setYoklamalar(yoklamaResponse);
      } else if (yoklamaResponse?.data) {
        setYoklamalar(yoklamaResponse.data);
      } else {
        setYoklamalar([]);
      }

      const statsResponse = await yoklamaService.getMyStats();
      setStats(statsResponse);

    } catch (error) {
      console.error('❌ Hata:', error);
      toast.error('Veriler yüklenemedi');
      setYoklamalar([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header - Mor Kısım */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Yoklama Sistemi</h1>
            <p style={{ fontSize: '14px', marginTop: '5px', opacity: 0.9 }}>
              {user?.ad || 'Öğrenci'}
            </p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Çıkış
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Hoş Geldiniz Kartı - Tek Kart */}
        <div className="welcome-section">
          <h2>Hoş Geldiniz, {user?.ad || 'Sacide Sena Coşkunyürek'}!</h2>
          <p style={{ color: '#666', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📧 {user?.mail || 's.coskunyurek@hotmail.com'}
          </p>
          {user?.ogrenci_no && (
            <p style={{ color: '#666', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎓 Öğrenci No: {user.ogrenci_no}
            </p>
          )}
        </div>

        {/* Hızlı İşlemler */}
        <div className="quick-actions">
          <div 
            className="action-card" 
            onClick={() => navigate('/qr-scan')} 
            
            style={{ cursor: 'pointer' }}
          >
            <div className="action-icon">📷</div>
            <h3>Yoklama Ver</h3>
            <p>QR kod tara</p>
          </div>

          {/* History - Yorum Satırı */}
          {/* <div 
            className="action-card" 
            onClick={() => navigate('/history')} 
            style={{ cursor: 'pointer' }}
          >
            <div className="action-icon">📋</div>
            <h3>Geçmiş</h3>
            <p>Yoklama geçmişini gör</p>
          </div> */}
        </div>

        {/* İstatistikler - Yorum Satırı */}
        {/* {stats && (
          <div className="stats-section">
            <h3>📊 İstatistiklerim</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.toplam_ders || 0}</div>
                <div className="stat-label">Toplam Ders</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{stats.katilim_sayisi || 0}</div>
                <div className="stat-label">Katılım</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-value">{stats.devamsizlik_sayisi || 0}</div>
                <div className="stat-label">Devamsızlık</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-value">
                  {stats.katilim_orani ? `%${stats.katilim_orani}` : '%0'}
                </div>
                <div className="stat-label">Katılım Oranı</div>
              </div>
            </div>

            <div className="attendance-rate">
              <h4>Katılım Durumu</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${stats.katilim_orani || 0}%` }}
                >
                  %{stats.katilim_orani || 0}
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Son Yoklamalar - Yorum Satırı */}
        {/* <div className="recent-section">
          <h3>📋 Son Yoklamalar</h3>
          
          {!Array.isArray(yoklamalar) || yoklamalar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Henüz yoklama kaydınız bulunmuyor</p>
            </div>
          ) : (
            <>
              <div className="yoklama-list">
                {yoklamalar.slice(0, 5).map((yoklama) => (
                  <div key={yoklama.id} className="yoklama-item">
                    <div>
                      <strong>{yoklama.ders_adi || 'Ders Adı'}</strong>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                        {formatDate(yoklama.zaman)}
                      </div>
                    </div>
                    <span className={`yoklama-status ${yoklama.durum?.toLowerCase()}`}>
                      {yoklama.durum || 'Bilinmiyor'}
                    </span>
                  </div>
                ))}
              </div>
              {yoklamalar.length > 5 && (
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigate('/history'); }}
                  className="view-all-btn"
                >
                  Tümünü Gör →
                </a>
              )}
            </>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default DashboardPage;