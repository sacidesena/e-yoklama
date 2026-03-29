import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import './QRScanner.css';

const QRScanner = ({ onScan, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraId, setCameraId] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isScannedRef = useRef(false);

  useEffect(() => {
    // Kamera listesini al
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          // Arka kamerayı bul (yoksa ilkini kullan)
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('arka')
          );
          setCameraId(backCamera ? backCamera.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Kamera listesi alınamadı:', err);
        toast.error('Kameraya erişim izni verilmedi');
        onError?.(err);
      });

    return () => {
      // Cleanup
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current
          .stop()
          .catch((err) => console.error('Kamera durdurma hatası:', err));
      }
    };
  }, []);

  const startScanning = async () => {
    if (!cameraId) {
      toast.error('Kamera bulunamadı');
      return;
    }

    isScannedRef.current = false;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR kod okundu sadece bir kez açlışsın
          if (isScannedRef.current) return;
          isScannedRef.current = true;
          console.log('QR kod okundu:', decodedText);
          html5QrCode.stop().catch(() => {});
          setScanning(false);
          onScan(decodedText);
          
        },
        (errorMessage) => {
          // Tarama hatası (her frame'de gelir, önemseme)
        }
      );

      setScanning(true);
      toast.info('QR kodu kameranın önüne tutun');
    } catch (err) {
      console.error('QR tarama başlatma hatası:', err);
      toast.error('QR tarama başlatılamadı');
      onError?.(err);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
      setScanning(false);
    } catch (err) {
      console.error('QR tarama durdurma hatası:', err);
    }
  };

  return (
    <div className="qr-scanner-container">
      <div id="qr-reader" ref={scannerRef} className="qr-reader"></div>

      <div className="scanner-controls">
        {!scanning ? (
          <button onClick={startScanning} className="scan-button">
            📷 Taramayı Başlat
          </button>
        ) : (
          <button onClick={stopScanning} className="stop-button">
            ⏹ Taramayı Durdur
          </button>
        )}
      </div>

      {scanning && (
        <div className="scanner-info">
          <p>QR kodu kameranın önüne tutun</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;