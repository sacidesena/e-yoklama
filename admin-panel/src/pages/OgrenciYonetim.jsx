import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const OgrenciYonetimi = () => {
  const [ogrenciler, setOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  useEffect(() => {
    fetchOgrenciler();
  }, []);

  const fetchOgrenciler = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/users/?rol=ogrenci', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOgrenciler(data);
      }
    } catch (error) {
      console.error('Öğrenciler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, ad) => {
    if (!confirm(`"${ad}" adlı öğrenciyi silmek istediğinize emin misiniz?\nÖğrenci tekrar kayıt olabilecek.\n\nDevam edilsin mi?`)) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchOgrenciler();
        alert(`✓ ${ad} adlı öğrenci silindi.`);
      } else {
        alert('Silme işlemi başarısız, tekrar dene.');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  const filtrelenmisOgrenciler = ogrenciler.filter((o) =>
    o.ad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    o.mail.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    (o.ogrenci_no && o.ogrenci_no.includes(aramaMetni))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '20px' }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        <Link
          to="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', color: '#667eea', textDecoration: 'none', marginBottom: '24px' }}
        >
          ← Geri
        </Link>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>👥 Öğrenci Listesi</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Toplam {ogrenciler.length} öğrenci kayıtlı</p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Ad, e-mail veya öğrenci no ile ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {filtrelenmisOgrenciler.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎓</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              {aramaMetni ? 'Arama sonucu bulunamadı' : 'Henüz kayıtlı öğrenci yok'}
            </h3>
            <p style={{ color: '#6b7280' }}>
              {aramaMetni ? 'Farklı bir kelime deneyin.' : 'Öğrenciler sisteme kayıt oldukça burada görünecek.'}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Öğrenci No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Ad Soyad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmisOgrenciler.map((ogrenci) => (
                  <tr key={ogrenci.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', color: '#667eea', fontWeight: '600', fontSize: '14px' }}>
                      {ogrenci.ogrenci_no || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{ogrenci.ad}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>{ogrenci.mail}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(ogrenci.id, ogrenci.ad)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '6px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OgrenciYonetimi;