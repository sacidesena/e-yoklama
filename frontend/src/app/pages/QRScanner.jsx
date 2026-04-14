/* frontend/src/pages/QRScanner.jsx
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // Arka kamerayı zorla
    html5QrCode.start(
      { facingMode: "environment" }, 
      config,
      (decodedText) => {
        // Okuma başarılı olduğunda burası çalışır
        setScanResult(decodedText);
        html5QrCode.stop(); // Okuyunca kamerayı durdur
        
        // Burada backend'e istek atabilirsin
        alert(`QR Okundu: ${decodedText}`);
        // navigate('/basarili-sayfasi'); 
      },
      (errorMessage) => {
        // Okuma yokken sürekli hata fırlatır, konsolu kirletmemek için boş bırakabilirsin
      }
    ).catch(err => {
      console.error("Kamera başlatılamadı:", err);
      alert("Kamera izni verilemedi. Lütfen HTTPS bağlantısı olduğundan emin olun.");
    });

    return () => {
      // Component kapanırken kamerayı kapat
      html5QrCode.stop().catch(e => console.log("Stop failed", e));
    };
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>QR Kodu Okut</h2>
      
      <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
      
      {scanResult && (
        <div style={{ marginTop: '20px', color: 'green', fontWeight: 'bold' }}>
          Sonuç: {scanResult}
        </div>
      )}
    </div>
  );
};

export default QRScanner;*/