import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const DersYonetimi = () => {
  const [dersler, setDersler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDers, setSelectedDers] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    kod: '',
    aciklama: '',
    aktif: true
  });

  useEffect(() => {
    fetchDersler();
  }, []);

  const fetchDersler = async () => {
  try {
    const token = localStorage.getItem('access_token'); // 'admin_token' yerine 'access_token'
    const response = await fetch('http://127.0.0.1:8000/dersler/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      setDersler(data);
    }
  } catch (error) {
    console.error('Dersler yüklenirken hata:', error);
  } finally {
    setLoading(false);
  }
};

const handleSubmit = async () => {
  if (!formData.ad || !formData.kod) {
    alert('Ders adı ve kodu zorunludur!');
    return;
  }
  
  try {
    const token = localStorage.getItem('access_token'); // Düzelt
    const url = editMode 
      ? `http://127.0.0.1:8000/dersler/${selectedDers.id}`
      : 'http://127.0.0.1:8000/dersler/';
    
    const response = await fetch(url, {
      method: editMode ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      fetchDersler();
      handleCloseModal();
      alert(editMode ? 'Ders güncellendi!' : 'Ders oluşturuldu!');
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
  if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;
  
  try {
    const token = localStorage.getItem('access_token'); // Düzelt
    const response = await fetch(`http://127.0.0.1:8000/dersler/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      fetchDersler();
      alert('Ders silindi!');
    }
  } catch (error) {
    console.error('Hata:', error);
  }
};

  const handleOpenModal = (ders = null) => {
    if (ders) {
      setEditMode(true);
      setSelectedDers(ders);
      setFormData({
        ad: ders.ad,
        kod: ders.kod,
        aciklama: ders.aciklama || '',
        aktif: ders.aktif
      });
    } else {
      setEditMode(false);
      setSelectedDers(null);
      setFormData({
        ad: '',
        kod: '',
        aciklama: '',
        aktif: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedDers(null);
    setFormData({
      ad: '',
      kod: '',
      aciklama: '',
      aktif: true
    });
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
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>📚 Ders Yönetimi</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Ders ekleyin ve düzenleyin</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            + Yeni Ders Ekle
          </button>
        </div>

        {dersler.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📖</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Henüz ders eklenmemiş
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Başlamak için ilk dersinizi ekleyin
            </p>
            <button
              onClick={() => handleOpenModal()}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Ders Ekle
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {dersler.map((ders) => (
              <div 
                key={ders.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{ders.ad}</h3>
                    <p style={{ color: '#667eea', fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>
                      Kod: {ders.kod}
                    </p>
                    {ders.aciklama && (
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>{ders.aciklama}</p>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: ders.aktif ? '#d1fae5' : '#fee2e2',
                    color: ders.aktif ? '#065f46' : '#991b1b'
                  }}>
                    {ders.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div style={{ marginBottom: '16px', color: '#6b7280' }}>
                  <span style={{ marginRight: '8px' }}>📅</span>
                  {new Date(ders.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenModal(ders)}
                    style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(ders.id)}
                    style={{
                      flex: 1,
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {editMode ? 'Ders Düzenle' : 'Yeni Ders Ekle'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  color: '#6b7280',
                  fontSize: '32px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Ders Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ad}
                  onChange={(e) => setFormData({...formData, ad: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Örn: Matematik"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Ders Kodu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.kod}
                  onChange={(e) => setFormData({...formData, kod: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Örn: MAT101"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Açıklama
                </label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({...formData, aciklama: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px'
                  }}
                  placeholder="Ders hakkında açıklama"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({...formData, aktif: e.target.checked})}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="aktif" style={{ marginLeft: '8px', fontSize: '14px', color: '#374151' }}>
                  Ders aktif
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
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

export default DersYonetimi;