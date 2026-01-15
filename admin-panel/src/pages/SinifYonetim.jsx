import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/axiosConfig';
import { toast } from 'react-toastify';

const SinifYonetim = () => {
  const [siniflar, setSiniflar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSinif, setSelectedSinif] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    aciklama: '',
    kapasite: '',
    aktif: true
  });

  useEffect(() => {
    fetchSiniflar();
  }, []);

  const fetchSiniflar = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/siniflar/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSiniflar(data);
      }
    } catch (error) {
      console.error('Sınıflar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ad || !formData.kapasite) {
      alert('Sınıf adı ve kapasite zorunludur!');
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const url = editMode 
        ? `http://127.0.0.1:8000/siniflar/${selectedSinif.id}/`
        : 'http://127.0.0.1:8000/siniflar/';
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ad: formData.ad,
          aciklama: formData.aciklama,
          kapasite: parseInt(formData.kapasite),
          aktif: formData.aktif
        })
      });

      if (response.ok) {
        await fetchSiniflar();
        handleCloseModal();
        alert(editMode ? 'Sınıf güncellendi!' : 'Sınıf başarıyla oluşturuldu!');
      } else {
        const errorData = await response.json();
        alert('Hata: ' + (errorData.detail || 'İşlem başarısız'));
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Bir hata oluştu. Konsolu kontrol edin.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/siniflar/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchSiniflar();
        alert('Sınıf silindi!');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız');
    }
  };

  const handleOpenModal = (sinif = null) => {
    if (sinif) {
      setEditMode(true);
      setSelectedSinif(sinif);
      setFormData({
        ad: sinif.ad || '',
        aciklama: sinif.aciklama || '',
        kapasite: sinif.kapasite || '',
        aktif: sinif.aktif ?? true
      });
    } else {
      setEditMode(false);
      setSelectedSinif(null);
      setFormData({
        ad: '',
        aciklama: '',
        kapasite: '',
        aktif: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedSinif(null);
    setFormData({ ad: '', aciklama: '', kapasite: '', aktif: true });
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
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>🏫 Sınıf Yönetimi</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Sınıf ekleyin, düzenleyin ve yönetin</p>
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
            + Yeni Sınıf Ekle
          </button>
        </div>

        {siniflar.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📚</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Henüz sınıf eklenmemiş
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Başlamak için ilk sınıfınızı ekleyin
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
              Sınıf Ekle
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {siniflar.map((sinif) => (
              <div 
                key={sinif.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{sinif.ad}</h3>
                    {sinif.aciklama && (
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{sinif.aciklama}</p>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: sinif.aktif ? '#d1fae5' : '#fee2e2',
                    color: sinif.aktif ? '#065f46' : '#991b1b'
                  }}>
                    {sinif.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <span style={{ marginRight: '8px' }}>👥</span>
                    Kapasite: {sinif.kapasite}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    <span style={{ marginRight: '8px' }}>📅</span>
                    {new Date(sinif.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenModal(sinif)}
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
                    onClick={() => handleDelete(sinif.id)}
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

        {/* Modal - BURASI DÜZELTİLDİ */}
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
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {editMode ? 'Sınıf Düzenle' : 'Yeni Sınıf Ekle'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  style={{
                    color: '#6b7280',
                    fontSize: '32px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Sınıf Adı *
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
                      placeholder="Örn: A101"
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
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                      placeholder="Sınıf hakkında açıklama (isteğe bağlı)"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Kapasite *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.kapasite}
                      onChange={(e) => setFormData({...formData, kapasite: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="Örn: 30"
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
                    <label htmlFor="aktif" style={{ marginLeft: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Sınıf aktif olsun
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '15px'
                      }}
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '15px'
                      }}
                    >
                      {editMode ? 'Güncelle' : 'Oluştur'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinifYonetim;