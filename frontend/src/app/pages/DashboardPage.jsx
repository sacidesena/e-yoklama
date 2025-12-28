import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import yoklamaService from '../services/yoklamaService';
import { toast } from 'react-toastify';
//import './DashboardPage.css';


const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [yoklamalar, setYoklamalar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.rol === 'ogrenci') {
      loadStudentData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadStudentData = async () => {
    try {
      // İstatistikleri al
      const statsData = await yoklamaService.getMyStats();
      setStats(statsData);

      // Son yoklamaları al
      const yoklamaData = await yoklamaService.getMyYoklamalar({ limit: 5 });
      setYoklamalar(yoklamaData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Yoklama Sistemi</h1>
          <div className="user-info">
            <span className="user-name">{user?.ad}</span>
            <span className="user-role">{user?.rol}</span>
            <button onClick={logout} className="logout-btn">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Hoş Geldiniz, {user?.ad}!</h2>
          <p className="user-email">{user?.mail}</p>
          {user?.ogrenci_no && (
            <p className="user-id">Öğrenci No: {user.ogrenci_no}</p>
          )}
        </div>

        {/* Öğrenci Dashboard */}
        {user?.rol === 'ogrenci' && (
          <>
            {/* Quick Actions */}
            <div className="quick-actions">
              <Link to="/scan" className="action-card scan-card">
                <div className="action-icon">📷</div>
                <h3>Yoklama Ver</h3>
                <p>QR kod tara</p>
              </Link>

              <Link to="/history" className="action-card history-card">
                <div className="action-icon">📊</div>
                <h3>Geçmiş</h3>
                <p>Yoklamalarımı gör</p>
              </Link>
            </div>

            {/* Stats */}
            {loading ? (
              <div className="loading">Yükleniyor...</div>
            ) : stats ? (
              <div className="stats-section">
                <h3>İstatistikler</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{stats.toplam_ders}</div>
                    <div className="stat-label">Toplam Ders</div>
                  </div>
                  <div className="stat-card success">
                    <div className="stat-value">{stats.katilim_sayisi}</div>
                    <div className="stat-label">Katıldım</div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-value">{stats.gecikme_sayisi}</div>
                    <div className="stat-label">Geç Kaldım</div>
                  </div>
                  <div className="stat-card danger">
                    <div className="stat-value">{stats.devamsizlik_sayisi}</div>
                    <div className="stat-label">Devamsızlık</div>
                  </div>
                </div>
                <div className="attendance-rate">
                  <h4>Katılım Oranı</h4>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${stats.katilim_orani}%` }}
                    >
                      <span>{stats.katilim_orani.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Recent Attendance */}
            {yoklamalar.length > 0 && (
              <div className="recent-section">
                <h3>Son Yoklamalar</h3>
                <div className="yoklama-list">
                  {yoklamalar.map((yoklama) => (
                    <div key={yoklama.id} className="yoklama-item">
                      <div className="yoklama-info">
                        <div className="yoklama-ders">{yoklama.ders_adi}</div>
                        <div className="yoklama-date">
                          {formatDate(yoklama.zaman)}
                        </div>
                      </div>
                      <div className={`yoklama-status ${yoklama.durum.toLowerCase()}`}>
                        {yoklama.durum}
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/history" className="view-all-btn">
                  Tümünü Gör →
                </Link>
              </div>
            )}
          </>
        )}

        {/* Öğretmen/Admin Dashboard */}
        {(user?.rol === 'ogretmen' || user?.rol === 'admin') && (
          <div className="admin-section">
            <h3>Yönetim Paneli</h3>
            <div className="admin-links">
              <Link to="/siniflar" className="admin-link">
                📚 Sınıflar
              </Link>
              <Link to="/dersler" className="admin-link">
                📖 Dersler
              </Link>
              <Link to="/users" className="admin-link">
                👥 Kullanıcılar
              </Link>
              <Link to="/reports" className="admin-link">
                📊 Raporlar
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;