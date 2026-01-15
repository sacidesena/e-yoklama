import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('admin_user'));
    setUser(userData);
  }, []);

  const logout = () => {
  console.log('👋 Çıkış yapılıyor...');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('admin_user');
  navigate('/login');
};

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>🎓 Yoklama Sistemi - Admin Panel</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Hoş geldiniz, {user?.ad}</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Çıkış Yap</button>
      </header>

      <div style={styles.grid}>
        <Link to="/siniflar" style={styles.card}>
          <div style={styles.icon}>🏫</div>
          <h3>Sınıf Yönetimi</h3>
          <p>Sınıf ekle/düzenle, QR kodları oluştur</p>
        </Link>

        <Link to="/program" style={styles.card}>
          <div style={styles.icon}>📅</div>
          <h3>Ders Programı</h3>
          <p>Haftalık ders programını yönet</p>
        </Link>

        <Link to="/ogrenciler" style={styles.card}>
          <div style={styles.icon}>👥</div>
          <h3>Öğrenci Yönetimi</h3>
          <p>Öğrenci ekle/düzenle/listele</p>
        </Link>

        <Link to="/dersler" style={styles.card}>
          <div style={styles.icon}>📚</div>
          <h3>Ders Yönetimi</h3>
          <p>Dersleri ekle ve düzenle</p>
        </Link>

        <Link to="/qr-kodlar" style={styles.card}>
          <div style={styles.icon}>📷</div>
          <h3>QR Kodlar</h3>
          <p>Tüm QR kodları görüntüle/yazdır</p>
        </Link>

        <Link to="/raporlar" style={styles.card}>
          <div style={styles.icon}>📊</div>
          <h3>Raporlar</h3>
          <p>Yoklama istatistikleri</p>
        </Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px'
  },
  header: {
    background: 'white',
    padding: '25px',
    borderRadius: '10px',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  logoutBtn: {
    padding: '12px 24px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'white',
    padding: '35px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    textAlign: 'center',
    transition: 'transform 0.2s'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '15px'
  }
};

export default Dashboard;