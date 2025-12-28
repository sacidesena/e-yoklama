import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import { AuthContext } from '../context/AuthContext';
import useFingerprint from '../hooks/useFingerprint';
import yoklamaService from '../services/yoklamaService';
import { toast } from 'react-toastify';
import './ScanPage.css';

const ScanPage = () => {
  const [loading, setLoading] = useState(false);
  const [konum, setKonum] = useState(null);
  const { user } = useContext(AuthContext);
  const { fingerprint, loading: fpLoading } = useFingerprint();
  const navigate = useNavigate();

  // Konum al
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setKonum({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Konum alınamadı:', error);
          // Konum zorunlu değil, devam et
        }
      );
    }
  };

  const handleScan = async (qrData) => {
    if (fpLoading || !fingerprint) {
      toast.error('Cihaz bilgisi alınıyor, lütfen bekleyin...');
      return;
    }

    setLoading(true);

    try {
      // QR data parse et (Format: SINIF:id:ad)
      const [type, sinifId, sinifAd] = qrData.split(':');

      if (type !== 'SINIF') {
        toast.error('Geçersiz QR kod!');
        setLoading(false);
        return;
      }

      // Konum al (opsiyonel)
      if (!konum) {
        getLocation();
      }

      // Yoklama gönder
      const response = await yoklamaService.submitYoklama({
        qr_data: qrData,
        sinif_id: parseInt(sinifId),
        device_fingerprint: fingerprint,
        konum: konum,
      });

      toast.success(
        `✅ Yoklama başarılı! Durum: ${response.durum}`
      );

      // 2 saniye sonra dashboard'a yönlendir
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Yoklama hatası:', error);
      const errorMsg = error.response?.data?.detail || 'Yoklama verilemedi!';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    console.error('QR tarama hatası:', error);
  };

  if (user?.rol !== 'ogrenci') {
    return (
      <div className="scan-page">
        <div className="error-message">
          <h2>⚠️ Yetki Hatası</h2>
          <p>Sadece öğrenciler yoklama verebilir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-page">
      <div className="scan-header">
        <h1>📷 QR Kod Tarama</h1>
        <p>Sınıftaki QR kodu tarayarak yoklama verin</p>
      </div>

      {fpLoading ? (
        <div className="loading-fingerprint">
          <p>Cihaz bilgisi alınıyor...</p>
        </div>
      ) : (
        <>
          <QRScanner onScan={handleScan} onError={handleError} />

          {loading && (
            <div className="scanning-overlay">
              <div className="scanning-message">
                <div className="spinner"></div>
                <p>Yoklama kaydediliyor...</p>
              </div>
            </div>
          )}

          <div className="scan-info">
            <div className="info-card">
              <h3>ℹ️ Nasıl Kullanılır?</h3>
              <ol>
                <li>Taramayı Başlat butonuna tıklayın</li>
                <li>Kamerayı sınıftaki QR kodun üzerine tutun</li>
                <li>QR kod otomatik okunacak ve yoklamanız kaydedilecek</li>
              </ol>
            </div>

            <div className="info-card">
              <h3>⚠️ Önemli Uyarılar</h3>
              <ul>
                <li>Sadece ders saatlerinde yoklama verebilirsiniz</li>
                <li>Her derse sadece bir kez yoklama verebilirsiniz</li>
                <li>Kendi cihazınızı kullanmalısınız</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScanPage;