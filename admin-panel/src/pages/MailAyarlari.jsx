import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const MailAyarlari = () => {
  const [formData, setFormData] = useState({ sender_email: '', sender_password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAyarlar = async () => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/ayarlar/mail`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({ sender_email: data.sender_email, sender_password: '' });
      }
    };
    fetchAyarlar();
  }, []);

  const handleSave = async () => {
    if (!formData.sender_email) { alert('Email boş olamaz'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/ayarlar/mail`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) alert('✓ Mail ayarları kaydedildi.');
      else alert('Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemizle = async () => {
    if (!confirm('Mail ayarları silinecek. Mail gönderimi duracak.\n\nEmin misiniz?')) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/ayarlar/mail`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFormData({ sender_email: '', sender_password: '' });
        alert('✓ Mail ayarları temizlendi.');
      } else {
        alert('Hata oluştu.');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link to="/dashboard" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Geri</Link>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>📧 Mail Ayarları</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Yoklama maillerinin gönderileceği Gmail hesabı</p>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Gmail Adresi</label>
            <input
              type="email"
              value={formData.sender_email}
              onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
              placeholder="fakulte@gmail.com"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Gmail App Password</label>
            <input
              type="password"
              value={formData.sender_password}
              onChange={(e) => setFormData({ ...formData, sender_password: e.target.value })}
              placeholder="Yeni şifre girmek için doldurun"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Gmail → Güvenlik → 2 Adımlı Doğrulama → Uygulama Şifreleri
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginBottom: '8px'
            }}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>

          <button
            onClick={handleTemizle}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Temizle
          </button>
        </div>
      </div>
    </div>
  );
};

export default MailAyarlari;