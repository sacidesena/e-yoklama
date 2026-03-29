import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const Program = () => {
  const [programlar, setProgramlar] = useState([]);
  const [dersler, setDersler] = useState([]);
  const [siniflar, setSiniflar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [formData, setFormData] = useState({
    ders_id: '',
    sinif_id: '',
    ogretmen_mail: '',
    gun: 'Pazartesi',
    baslangic: '',
    bitis: '',
    aktif: true
  });

  const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma','Cumartesi'];

  const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [programRes, dersRes, sinifRes] = await Promise.all([
        fetch(`${API_URL}/dersler/program/all`, { headers: getHeaders() }),
        fetch(`${API_URL}/dersler/`, { headers: getHeaders() }),
        fetch(`${API_URL}/siniflar/`, { headers: getHeaders() }),
      ]);

      if (programRes.ok) setProgramlar(await programRes.json());
      if (dersRes.ok) setDersler(await dersRes.json());
      if (sinifRes.ok) setSiniflar(await sinifRes.json());

    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.ders_id || !formData.sinif_id || !formData.baslangic || !formData.bitis) {
      alert('Ders, sınıf ve saatler zorunludur!');
      return;
    }

    try {
      const url = editMode
        ? `${API_URL}/dersler/program/${selectedProgram.id}`
        : `${API_URL}/dersler/program`;

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ders_id: parseInt(formData.ders_id),
          sinif_id: parseInt(formData.sinif_id),
          ogretmen_mail: formData.ogretmen_mail || null,
          gun: formData.gun,
          baslangic: formData.baslangic,
          bitis: formData.bitis,
          aktif: formData.aktif
        })
      });

      if (response.ok) {
        fetchData();
        handleCloseModal();
        alert(editMode ? 'Program güncellendi!' : 'Program oluşturuldu!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu programı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`${API_URL}/dersler/program/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (response.ok) {
        fetchData();
        alert('Program silindi!');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  const handleOpenModal = (program = null) => {
    if (program) {
      setEditMode(true);
      setSelectedProgram(program);
      setFormData({
        ders_id: program.ders_id,
        sinif_id: program.sinif_id,
        ogretmen_mail: program.ogretmen_mail || '',
        gun: program.gun,
        baslangic: program.baslangic,
        bitis: program.bitis,
        aktif: program.aktif
      });
    } else {
      setEditMode(false);
      setSelectedProgram(null);
      setFormData({
        ders_id: '',
        sinif_id: '',
        ogretmen_mail: '',
        gun: 'Pazartesi',
        baslangic: '',
        bitis: '',
        aktif: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedProgram(null);
  };

  const getDersAdi = (ders_id) => {
    const ders = dersler.find(d => d.id === ders_id);
    return ders ? ders.ad : 'Bilinmiyor';
  };

  const getSinifAdi = (sinif_id) => {
    const sinif = siniflar.find(s => s.id === sinif_id);
    return sinif ? sinif.ad : 'Bilinmiyor';
  };

  const programByGun = {};
  gunler.forEach(gun => {
    programByGun[gun] = programlar.filter(p => p.gun === gun);
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
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', color: '#667eea', textDecoration: 'none', marginBottom: '24px' }}>
          ← Geri
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>📅 Ders Programı</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Haftalık ders programını yönetin</p>
          </div>
          <button onClick={() => handleOpenModal()} style={{ backgroundColor: '#667eea', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
            + Program Ekle
          </button>
        </div>

        {programlar.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📆</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Henüz program eklenmemiş</h3>
            <button onClick={() => handleOpenModal()} style={{ backgroundColor: '#667eea', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
              Program Ekle
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {gunler.map((gun) => (
              <div key={gun} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', borderBottom: '2px solid #667eea', paddingBottom: '8px' }}>
                  {gun}
                </h3>
                {programByGun[gun].length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Bu gün için ders yok</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {programByGun[gun].map((program) => (
                      <div key={program.id} style={{ backgroundColor: '#f9fafb', borderLeft: '3px solid #667eea', padding: '12px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{getDersAdi(program.ders_id)}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>🏫 {getSinifAdi(program.sinif_id)}</div>
                        <div style={{ fontSize: '13px', color: '#667eea', fontWeight: '600', marginBottom: '8px' }}>⏰ {program.baslangic} - {program.bitis}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleOpenModal(program)} style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Düzenle</button>
                          <button onClick={() => handleDelete(program.id)} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '500px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{editMode ? 'Program Düzenle' : 'Yeni Program Ekle'}</h2>
              <button onClick={handleCloseModal} style={{ color: '#6b7280', fontSize: '32px', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Ders *</label>
                <select value={formData.ders_id} onChange={(e) => setFormData({...formData, ders_id: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                  <option value="">Ders Seçin</option>
                  {dersler.map(ders => <option key={ders.id} value={ders.id}>{ders.ad} ({ders.kod})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Sınıf *</label>
                <select value={formData.sinif_id} onChange={(e) => setFormData({...formData, sinif_id: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                  <option value="">Sınıf Seçin</option>
                  {siniflar.map(sinif => <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Öğretmen E-posta</label>
                <input type="email" value={formData.ogretmen_mail} onChange={(e) => setFormData({...formData, ogretmen_mail: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="ogretmen@okul.edu" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Gün *</label>
                <select value={formData.gun} onChange={(e) => setFormData({...formData, gun: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                  {gunler.map(gun => <option key={gun} value={gun}>{gun}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Başlangıç *</label>
                  <input type="time" value={formData.baslangic} onChange={(e) => setFormData({...formData, baslangic: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Bitiş *</label>
                  <input type="time" value={formData.bitis} onChange={(e) => setFormData({...formData, bitis: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" id="aktif" checked={formData.aktif} onChange={(e) => setFormData({...formData, aktif: e.target.checked})} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="aktif" style={{ marginLeft: '8px', fontSize: '14px', color: '#374151' }}>Program aktif</label>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>İptal</button>
                <button type="button" onClick={handleSubmit} style={{ flex: 1, padding: '8px 16px', backgroundColor: '#667eea', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                  {editMode ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Program;