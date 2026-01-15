import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';


const OgrenciYonetimi = () => {
  const [ogrenciler, setOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedOgrenci, setSelectedOgrenci] = useState(null);
  const [formData, setFormData] = useState({
    mail: '',
    ad: '',
    ogrenci_no: '',
    sifre: '',
    aktif: true
  });

  useEffect(() => {
    fetchOgrenciler();
  }, []);

  const fetchOgrenciler = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://127.0.0.1:8000/users/?rol=ogrenci', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOgrenciler(data);
      }
    } catch (error) {
      console.error('Öğrenciler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('admin_token');
      const url = editMode 
        ? `http://127.0.0.1:8000/users/${selectedOgrenci.id}`
        : 'http://127.0.0.1:8000/auth/register';
      
      const body = editMode 
        ? { ad: formData.ad, aktif: formData.aktif }
        : { ...formData, rol: 'ogrenci' };

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchOgrenciler();
        handleCloseModal();
        alert(editMode ? 'Öğrenci güncellendi!' : 'Öğrenci eklendi!');
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
    if (!confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://127.0.0.1:8000/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchOgrenciler();
        alert('Öğrenci silindi!');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  const handleOpenModal = (ogrenci = null) => {
    if (ogrenci) {
      setEditMode(true);
      setSelectedOgrenci(ogrenci);
      setFormData({
        mail: ogrenci.mail,
        ad: ogrenci.ad,
        ogrenci_no: ogrenci.ogrenci_no,
        sifre: '',
        aktif: ogrenci.aktif
      });
    } else {
      setEditMode(false);
      setSelectedOgrenci(null);
      setFormData({
        mail: '',
        ad: '',
        ogrenci_no: '',
        sifre: '',
        aktif: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedOgrenci(null);
    setFormData({
      mail: '',
      ad: '',
      ogrenci_no: '',
      sifre: '',
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
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>👥 Öğrenci Yönetimi</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Öğrenci ekleyin, düzenleyin ve listeleyin</p>
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
            + Yeni Öğrenci Ekle
          </button>
        </div>

        {ogrenciler.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎓</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Henüz öğrenci eklenmemiş
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Başlamak için ilk öğrenciyi ekleyin
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
              Öğrenci Ekle
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Öğrenci No</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ad Soyad</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Durum</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Son Giriş</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {ogrenciler.map((ogrenci) => (
                  <tr key={ogrenci.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#667eea', fontWeight: '600' }}>{ogrenci.ogrenci_no}</td>
                    <td style={{ padding: '12px' }}>{ogrenci.ad}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{ogrenci.mail}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: ogrenci.aktif ? '#d1fae5' : '#fee2e2',
                        color: ogrenci.aktif ? '#065f46' : '#991b1b'
                      }}>
                        {ogrenci.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>
                      {ogrenci.son_giris ? new Date(ogrenci.son_giris).toLocaleString('tr-TR') : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenModal(ogrenci)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '8px',
                          fontSize: '14px'
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(ogrenci.id)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                {editMode ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
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
              {!editMode && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Öğrenci No *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ogrenci_no}
                      onChange={(e) => setFormData({...formData, ogrenci_no: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="Örn: 20231234"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.mail}
                      onChange={(e) => setFormData({...formData, mail: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="ornek@email.com"
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Ad Soyad *
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
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              {!editMode && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Şifre *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.sifre}
                    onChange={(e) => setFormData({...formData, sifre: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Güvenli bir şifre"
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({...formData, aktif: e.target.checked})}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="aktif" style={{ marginLeft: '8px', fontSize: '14px', color: '#374151' }}>
                  Öğrenci aktif
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

export default OgrenciYonetimi;