import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

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
        fetch(`${API_URL}/yoklama/qr-kodlar`, {
          headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true'  }
        }),
        fetch(`${API_URL}/siniflar/`, {
          headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true'  }
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
      const response = await fetch(`${API_URL}/yoklama/qr-olustur/${sinifId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true'  }
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
      const response = await fetch(`${API_URL}/yoklama/qr-kodlar/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true'  }
      });

      if (response.ok) {
        fetchData();
        alert('QR kod silindi!');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

 const printQR = (qr) => {
    const sinifAdi = qr.sinif_adi || getSinifAdi(qr.sinif_id);
    const url = import.meta.env.VITE_BASE_URL || `http://${window.location.hostname}:5173`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Kod - ${sinifAdi}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              padding: 48px 40px;
              background: white;
            }
            .top {
              text-align: center;
              width: 100%;
              border-bottom: 3px solid #1a3a6e;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            .uni-name {
              font-size: 13px;
              color: #6b7280;
              letter-spacing: 3px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .system-name {
              font-size: 28px;
              font-weight: 800;
              color: #1a3a6e;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .middle {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 24px;
              width: 100%;
            }
            .sinif-adi {
              font-size: 36px;
              font-weight: 800;
              color: #1a3a6e;
              letter-spacing: 4px;
              text-transform: uppercase;
            }
            .scan-text {
              font-size: 14px;
              color: #6b7280;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .qr-wrapper {
              padding: 24px;
              border: 2px solid #e5e7eb;
              border-radius: 4px;
            }
            .qr-wrapper img {
              width: 380px;
              height: 380px;
              display: block;
            }
            .url {
              font-size: 15px;
              font-weight: 600;
              color: #374151;
              letter-spacing: 1px;
              padding: 10px 24px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              background: #f9fafb;
            }
            .steps {
              display: flex;
              gap: 32px;
              justify-content: center;
            }
            .step {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }
            .step-num {
              width: 28px;
              height: 28px;
              background: #1a3a6e;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 700;
            }
            .step-text {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              letter-spacing: 0.5px;
            }
            .bottom {
              width: 100%;
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .bottom-left {
              font-size: 11px;
              color: #9ca3af;
              letter-spacing: 1px;
            }
            .bottom-right {
              font-size: 11px;
              color: #9ca3af;
            }
            @media print {
              body { background: white; }
              .page { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top">
              <div class="uni-name">Bolu Abant İzzet Baysal Üniversitesi</div>
              <div class="system-name">E-Yoklama Sistemi</div>
            </div>

            <div class="middle">
              <div class="sinif-adi">${sinifAdi}</div>
              <div class="scan-text">Yoklama vermek için QR kodu okutun</div>

              <div class="qr-wrapper">
                <img src="${qr.qr_image}" alt="QR Kod" />
              </div>

              <div class="url">🌐 ${url}</div>

              <div class="steps">
                <div class="step">
                  <div class="step-num">1</div>
                  <div class="step-text">WiFi'ya<br/>bağlan</div>
                </div>
                <div class="step">
                  <div class="step-num">2</div>
                  <div class="step-text">Sisteme<br/>giriş yap</div>
                </div>
                <div class="step">
                  <div class="step-num">3</div>
                  <div class="step-text">QR kodu<br/>okut</div>
                </div>
              </div>
            </div>

            <div class="bottom">
              <div class="bottom-left">BAİBÜ — E-Yoklama Sistemi</div>
              <div class="bottom-right">${qr.olusturma_tarihi ? new Date(qr.olusturma_tarihi).toLocaleDateString('tr-TR') : '-'}</div>
            </div>
          </div>
          <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
};

  const downloadQR = (qr) => {
    if (!qr.qr_image) {
      alert('QR görsel bulunamadı');
      return;
    }
    const link = document.createElement('a');
    link.href = qr.qr_image;
    link.download = `QR_${qr.sinif_adi || getSinifAdi(qr.sinif_id)}_${Date.now()}.png`;
    link.click();
  };

  const getSinifAdi = (sinif_id) => {
    const sinif = siniflar.find(s => s.id === sinif_id);
    return sinif ? sinif.ad : 'Bilinmiyor';
  };

  const filteredQRs = qrKodlar.filter(qr => {
    const sinifMatch = selectedSinif === 'all' || qr.sinif_id === parseInt(selectedSinif);
    const searchMatch = (qr.sinif_adi || getSinifAdi(qr.sinif_id)).toLowerCase().includes(searchTerm.toLowerCase());
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Sınıf Filtrele</label>
              <select
                value={selectedSinif}
                onChange={(e) => setSelectedSinif(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              >
                <option value="all">Tüm Sınıflar</option>
                {siniflar.map(sinif => (
                  <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Ara</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sınıf adı ara..."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* QR Oluşturma */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Yeni QR Kod Oluştur</h2>
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

        {/* QR Listesi */}
        {filteredQRs.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📸</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>QR kod bulunamadı</h3>
            <p style={{ color: '#6b7280' }}>Yukarıdan bir sınıf seçerek QR kod oluşturabilirsiniz</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredQRs.map((qr) => (
              <div
                key={qr.id}
                style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', textAlign: 'center' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    🏫 {qr.sinif_adi || getSinifAdi(qr.sinif_id)}
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

                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  {qr.qr_image ? (
                    <img
                      src={qr.qr_image}
                      alt="QR Kod"
                      style={{ width: '100%', maxWidth: '250px', height: 'auto' }}
                    />
                  ) : (
                    <div style={{ color: '#9ca3af', fontSize: '14px', padding: '20px' }}>QR görsel yüklenemedi</div>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', textAlign: 'left' }}>
                  <div>
                    📅 <strong>Oluşturulma:</strong><br />
                    {qr.olusturma_tarihi ? new Date(qr.olusturma_tarihi).toLocaleString('tr-TR') : '-'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => printQR(qr)}
                    style={{ backgroundColor: '#10b981', color: 'white', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🖨️ Yazdır
                  </button>
                  <button
                    onClick={() => downloadQR(qr)}
                    style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                  >
                    💾 İndir
                  </button>
                </div>

                <button
                  onClick={() => deleteQR(qr.id)}
                  style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  🗑️ Sil
                </button>
              </div>
            ))}
          </div>
        )}

        {/* İstatistikler */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>📊 İstatistikler</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>{qrKodlar.length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Toplam QR</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{qrKodlar.filter(q => q.aktif).length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Aktif QR</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{qrKodlar.filter(q => !q.aktif).length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Pasif QR</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QRKodlar;