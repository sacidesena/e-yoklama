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

  const handleLogout = () => {
    logout();
    toast.info('Çıkış yapıldı.');
    setTimeout(() => navigate('/login'), 500);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: '#1a3a6e', fontWeight: '500' }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <img
              src="/logo-1.png"
              alt="BAİBÜ Logo"
              style={styles.logo}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 style={styles.headerTitle}>BAİBÜ Yoklama Sistemi</h1>
              <p style={styles.headerSubtitle}>Bolu Abant İzzet Baysal Üniversitesi</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h2 style={styles.welcomeText}>Hoş Geldiniz!</h2>
          <h3 style={styles.userName}>{user?.ad}</h3>
          <div style={styles.userInfoRow}>
            <span style={styles.userInfoBadge}>📧 {user?.mail}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>

        

        {/* QR Butonu */}
        <div
          style={styles.qrCard}
          onClick={() => navigate('/qr-scan')}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <div style={styles.qrIconWrapper}>
            <span style={{ fontSize: '28px' }}>📷</span>
          </div>
          <div>
            <h3 style={styles.qrTitle}>Yoklama Ver</h3>
            <p style={styles.qrSubtitle}>Sınıftaki QR kodu tarayarak yoklamanızı alın</p>
          </div>
          <span style={{ color: 'white', fontSize: '24px', marginLeft: 'auto', opacity: 0.7 }}>→</span>
        </div>

        {/* Son Yoklamalar */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📋 Son Yoklamalar</h3>
          {!Array.isArray(yoklamalar) || yoklamalar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: '#555', fontWeight: '500', margin: '0 0 4px' }}>Henüz yoklama kaydınız bulunmuyor</p>
              <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>QR kod tarayarak ilk yoklamanızı verin</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {yoklamalar.slice(0, 5).map((yoklama) => (
                <div key={yoklama.id} style={styles.yoklamaItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: yoklama.durum === 'Gecikti' ? '#f59e0b' : '#22c55e'
                    }} />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a3a6e', fontSize: '14px' }}>
                        {yoklama.ders_adi || 'Ders'}
                      </div>
                      <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
                        {new Date(yoklama.zaman).toLocaleDateString('tr-TR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    backgroundColor: yoklama.durum === 'Gecikti' ? '#fef3c7' : '#dcfce7',
                    color: yoklama.durum === 'Gecikti' ? '#92400e' : '#166534',
                  }}>
                    {yoklama.durum || 'Katıldı'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', lineHeight: 1.8, paddingBottom: '16px' }}>
          <p>© 2025 Bolu Abant İzzet Baysal Üniversitesi</p>
          <p>E-Yoklama Sistemi v1.0</p>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
  },
  header: {
    backgroundColor: '#1a3a6e',
    padding: '0 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    height: '44px',
    width: 'auto',
  
  },
 
  headerTitle: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
    margin: 0,
    lineHeight: 1.2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '11px',
    margin: 0,
    marginTop: '2px',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  hero: {
    background: 'linear-gradient(135deg, #1a3a6e 0%, #2d5a9e 50%, #1a6e4a 100%)',
    padding: '24px 16px',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  },
  avatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '3px solid rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    padding: '10px',
    overflow: 'hidden',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '16px',
    fontWeight: '400',
    margin: '0 0 4px',
  },
  userName: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 12px',
  },
  userInfoRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  userInfoBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  mainContent: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '16px 12px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px 12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a3a6e',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    color: '#888',
    marginTop: '4px',
  },
  qrCard: {
    background: 'linear-gradient(135deg, #1a3a6e 0%, #2d5a9e 100%)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    cursor: 'pointer',
    marginBottom: '20px',
    boxShadow: '0 4px 16px rgba(26,58,110,0.3)',
    transition: 'opacity 0.2s ease',
  },
  qrIconWrapper: {
    width: '60px',
    height: '60px',
    //backgroundColor: 'rgba(255,255,255,0.15)',
    //borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qrTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px',
  },
  qrSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    margin: 0,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a3a6e',
    margin: '0 0 16px',
  },
  yoklamaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e8ecf0',
  },
};

export default DashboardPage;