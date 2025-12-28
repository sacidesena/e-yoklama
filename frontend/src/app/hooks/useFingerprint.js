import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        // FingerprintJS yükle
        const fp = await FingerprintJS.load();
        
        // Fingerprint al
        const result = await fp.get();
        
        setFingerprint(result.visitorId);
        setLoading(false);
      } catch (err) {
        console.error('Fingerprint alınamadı:', err);
        setError(err);
        setLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { fingerprint, loading, error };
};

export default useFingerprint;