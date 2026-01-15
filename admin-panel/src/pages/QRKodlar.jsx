import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';


const QRKodlar = () => {
  const [qrKodlar, setQrKodlar] = useState([]);
  const [siniflar, setSiniflar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSinif, setSelectedSinif] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const [qrRes, sinifRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/yoklama/qr-kodlar/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/siniflar/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (qrRes.ok) setQrKodlar(await qrRes.json());
      if (sinifRes.ok) setSiniflar(await sinifRes.json());
      
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (sinifId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/yoklama/qr-olustur/${sinifId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
        alert('QR kod oluşturuldu!');
      } else {
        const error = await response.json();
        alert(error.detail || 'QR kod oluşturulamadı');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Bir hata oluştu');
    }
  };

  const deleteQR = async (id) => {
    if (!confirm('Bu QR kodu silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/yoklama/qr-kodlar/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
        alert('QR kod silindi!');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  const printQR = (qrData) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Kod - ${getSinifAdi(qrData.sinif_id)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #667eea;
              padding: 30px;
              border-radius: 10px;
            }
            h1 { color: #667eea; margin-bottom: 10px; }
            img { max-width: 400px; margin: 20px 0; }
            .info { color: #666; margin: 10px 0; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>🏫 ${getSinifAdi(qrData.sinif_id)}</h1>
            <img src="${qrData.qr_kod_data}" alt="QR Kod" />
            <div class="info">
              <p><strong>Oluşturulma:</strong> ${new Date(qrData.olusturulma_tarihi).toLocaleString('tr-TR')}</p>
              <p><strong>Geçerlilik:</strong> ${new Date(qrData.gecerlilik_suresi).toLocaleString('tr-TR')}</p>
              <p><strong>Durum:</strong> ${qrData.aktif ? '✅ Aktif' : '❌ Pasif'}</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadQR = (qrData) => {
    const link = document.createElement('a');
    link.href = qrData.qr_kod_data;
    link.download = `QR_${getSinifAdi(qrData.sinif_id)}_${new Date().getTime()}.png`;
    link.click();
  };

  const getSinifAdi = (sinif_id) => {
    const sinif = siniflar.find(s => s.id === sinif_id);
    return sinif ? sinif.ad : 'Bilinmiyor';
  };

  // Filtreleme
  const filteredQRs = qrKodlar.filter(qr => {
    const sinifMatch = selectedSinif === 'all' || qr.sinif_id === parseInt(selectedSinif);
    const searchMatch = getSinifAdi(qr.sinif_id).toLowerCase().includes(searchTerm.toLowerCase());
    return sinifMatch && searchMatch;
  });

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

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>📷 QR Kodlar</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Tüm QR kodları görüntüleyin ve yazdırın</p>
        </div>

        {/* Filtre ve Arama */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Sınıf Filtrele
              </label>
              <select
                value={selectedSinif}
                onChange={(e) => setSelectedSinif(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">Tüm Sınıflar</option>
                {siniflar.map(sinif => (
                  <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Ara
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sınıf adı ara..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Sınıflar için QR Oluşturma */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Yeni QR Kod Oluştur
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {siniflar.map(sinif => (
              <button
                key={sinif.id}
                onClick={() => generateQR(sinif.id)}
                style={{
                  padding: '12px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📷 {sinif.ad}
              </button>
            ))}
          </div>
        </div>

        {/* QR Kod Listesi */}
        {filteredQRs.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📸</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              QR kod bulunamadı
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Yukarıdan bir sınıf seçerek QR kod oluşturabilirsiniz
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredQRs.map((qr) => (
              <div 
                key={qr.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    {getSinifAdi(qr.sinif_id)}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: qr.aktif ? '#d1fae5' : '#fee2e2',
                    color: qr.aktif ? '#065f46' : '#991b1b'
                  }}>
                    {qr.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <img 
                    src={qr.qr_kod_data} 
                    alt="QR Kod" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '250px',
                      height: 'auto'
                    }} 
                  />
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', textAlign: 'left' }}>
                  <div style={{ marginBottom: '6px' }}>
                    📅 <strong>Oluşturulma:</strong><br/>
                    {new Date(qr.olusturulma_tarihi).toLocaleString('tr-TR')}
                  </div>
                  <div>
                    ⏰ <strong>Geçerlilik:</strong><br/>
                    {new Date(qr.gecerlilik_suresi).toLocaleString('tr-TR')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => printQR(qr)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🖨️ Yazdır
                  </button>
                  <button
                    onClick={() => downloadQR(qr)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    💾 İndir
                  </button>
                </div>

                <button
                  onClick={() => deleteQR(qr.id)}
                  style={{
                    width: '100%',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  🗑️ Sil
                </button>
              </div>
            ))}
          </div>
        )}

        {/* İstatistikler */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          padding: '20px',
          marginTop: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            📊 İstatistikler
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                {qrKodlar.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Toplam QR</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {qrKodlar.filter(q => q.aktif).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Aktif QR</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                {qrKodlar.filter(q => !q.aktif).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Pasif QR</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRKodlar;