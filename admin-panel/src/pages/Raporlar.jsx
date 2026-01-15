import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Raporlar = () => {
  const [istatistikler, setIstatistikler] = useState({
    toplam_yoklama: 0,
    bugun_yoklama: 0,
    toplam_ogrenci: 0,
    aktif_sinif: 0,
    katilim_orani: 0
  });
  const [yoklamalar, setYoklamalar] = useState([]);
  const [siniflar, setSiniflar] = useState([]);
  const [ogrenciler, setOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSinif, setSelectedSinif] = useState('all');
  const [dateRange, setDateRange] = useState({
    baslangic: '',
    bitis: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const [yoklamaRes, sinifRes, ogrenciRes, statsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/yoklama/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/siniflar/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/users/?rol=ogrenci', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/yoklama/istatistikler/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (yoklamaRes.ok) setYoklamalar(await yoklamaRes.json());
      if (sinifRes.ok) setSiniflar(await sinifRes.json());
      if (ogrenciRes.ok) setOgrenciler(await ogrenciRes.json());
      if (statsRes.ok) setIstatistikler(await statsRes.json());
      
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSinifAdi = (sinif_id) => {
    const sinif = siniflar.find(s => s.id === sinif_id);
    return sinif ? sinif.ad : 'Bilinmiyor';
  };

  const getOgrenciAdi = (ogrenci_id) => {
    const ogrenci = ogrenciler.find(o => o.id === ogrenci_id);
    return ogrenci ? ogrenci.ad : 'Bilinmiyor';
  };

  // Filtreleme
  const filteredYoklamalar = yoklamalar.filter(yoklama => {
    const sinifMatch = selectedSinif === 'all' || yoklama.sinif_id === parseInt(selectedSinif);
    
    let dateMatch = true;
    if (dateRange.baslangic && dateRange.bitis) {
      const yoklamaTarih = new Date(yoklama.tarih);
      const baslangic = new Date(dateRange.baslangic);
      const bitis = new Date(dateRange.bitis);
      dateMatch = yoklamaTarih >= baslangic && yoklamaTarih <= bitis;
    }
    
    return sinifMatch && dateMatch;
  });

  // Sınıfa göre istatistikler
  const sinifIstatistikleri = siniflar.map(sinif => {
    const sinifYoklamalari = yoklamalar.filter(y => y.sinif_id === sinif.id);
    const toplamYoklama = sinifYoklamalari.length;
    const katilimSayisi = sinifYoklamalari.filter(y => y.durum === 'Geldi').length;
    const katilimOrani = toplamYoklama > 0 ? ((katilimSayisi / toplamYoklama) * 100).toFixed(1) : 0;
    
    return {
      sinif: sinif.ad,
      toplamYoklama,
      katilimSayisi,
      katilimOrani
    };
  });

  // Öğrenciye göre istatistikler
  const ogrenciIstatistikleri = ogrenciler.map(ogrenci => {
    const ogrenciYoklamalari = yoklamalar.filter(y => y.ogrenci_id === ogrenci.id);
    const toplamYoklama = ogrenciYoklamalari.length;
    const katilimSayisi = ogrenciYoklamalari.filter(y => y.durum === 'Geldi').length;
    const katilimOrani = toplamYoklama > 0 ? ((katilimSayisi / toplamYoklama) * 100).toFixed(1) : 0;
    
    return {
      ogrenci: ogrenci.ad,
      ogrenciNo: ogrenci.ogrenci_no || '-',
      toplamYoklama,
      katilimSayisi,
      katilimOrani: parseFloat(katilimOrani)
    };
  }).sort((a, b) => b.katilimOrani - a.katilimOrani);

  // Excel export fonksiyonu
  const exportToExcel = () => {
    const csv = [
      ['Öğrenci No', 'Ad Soyad', 'Toplam Yoklama', 'Katılım', 'Katılım Oranı'],
      ...ogrenciIstatistikleri.map(o => [
        o.ogrenciNo,
        o.ogrenci,
        o.toplamYoklama,
        o.katilimSayisi,
        `%${o.katilimOrani}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yoklama_raporu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>📊 Raporlar</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Yoklama istatistikleri ve raporlar</p>
          </div>
          <button
            onClick={exportToExcel}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📥 Excel'e Aktar
          </button>
        </div>

        {/* Genel İstatistikler */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>
              {yoklamalar.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Toplam Yoklama</div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
              {ogrenciler.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Toplam Öğrenci</div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏫</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
              {siniflar.filter(s => s.aktif).length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Aktif Sınıf</div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>
              %{yoklamalar.length > 0 ? 
                ((yoklamalar.filter(y => y.durum === 'Geldi').length / yoklamalar.length) * 100).toFixed(1) 
                : 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Katılım Oranı</div>
          </div>
        </div>

        {/* Filtreler */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            🔍 Filtreler
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Sınıf
              </label>
              <select
                value={selectedSinif}
                onChange={(e) => setSelectedSinif(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={dateRange.baslangic}
                onChange={(e) => setDateRange({...dateRange, baslangic: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={dateRange.bitis}
                onChange={(e) => setDateRange({ ...dateRange, bitis: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div> {/* <-- Filtreler div'i burada kapanıyor */}

        {/* Sınıf İstatistikleri */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            🏫 Sınıf Bazında İstatistikler
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Sınıf</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Toplam Yoklama</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Katılım Sayısı</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Katılım Oranı</th>
                </tr>
              </thead>
              <tbody>
                {sinifIstatistikleri.map((stat, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#111827' }}>{stat.sinif}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{stat.toplamYoklama}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{stat.katilimSayisi}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: parseFloat(stat.katilimOrani) >= 75 ? '#d1fae5' : parseFloat(stat.katilimOrani) >= 50 ? '#fef3c7' : '#fee2e2',
                        color: parseFloat(stat.katilimOrani) >= 75 ? '#065f46' : parseFloat(stat.katilimOrani) >= 50 ? '#92400e' : '#991b1b'
                      }}>
                        %{stat.katilimOrani}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Öğrenci İstatistikleri */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            👨‍🎓 Öğrenci Bazında İstatistikler
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Öğrenci No</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Ad Soyad</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Toplam Yoklama</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Katılım</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Katılım Oranı</th>
                </tr>
              </thead>
              <tbody>
                {ogrenciIstatistikleri.slice(0, 20).map((stat, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#667eea', fontWeight: '600' }}>{stat.ogrenciNo}</td>
                    <td style={{ padding: '12px', color: '#111827' }}>{stat.ogrenci}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{stat.toplamYoklama}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{stat.katilimSayisi}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: stat.katilimOrani >= 75 ? '#d1fae5' : stat.katilimOrani >= 50 ? '#fef3c7' : '#fee2e2',
                        color: stat.katilimOrani >= 75 ? '#065f46' : stat.katilimOrani >= 50 ? '#92400e' : '#991b1b'
                      }}>
                        %{stat.katilimOrani}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ogrenciIstatistikleri.length > 20 && (
            <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '16px', fontSize: '14px' }}>
              İlk 20 öğrenci gösteriliyor. Tüm verileri görmek için Excel'e aktarın.
            </p>
          )}
        </div>

        {/* Son Yoklamalar */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            📋 Son Yoklamalar
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Tarih</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Öğrenci</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Sınıf</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredYoklamalar.slice(0, 10).reverse().map((yoklama, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>
                      {new Date(yoklama.tarih).toLocaleString('tr-TR')}
                    </td>
                    <td style={{ padding: '12px', color: '#111827' }}>
                      {getOgrenciAdi(yoklama.ogrenci_id)}
                    </td>
                    <td style={{ padding: '12px', color: '#667eea', fontWeight: '600' }}>
                      {getSinifAdi(yoklama.sinif_id)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: yoklama.durum === 'Geldi' ? '#d1fae5' : '#fee2e2',
                        color: yoklama.durum === 'Geldi' ? '#065f46' : '#991b1b'
                      }}>
                        {yoklama.durum === 'Geldi' ? '✅ Geldi' : '❌ Gelmedi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Raporlar;