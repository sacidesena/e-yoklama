import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import yoklamaService from '../../services/yoklamaService';
import { toast } from 'react-toastify';
//import './HistoryPage.css';

const HistoryPage = () => {
  const [yoklamalar, setYoklamalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    baslangic_tarihi: '',
    bitis_tarihi: '',
  });

  useEffect(() => {
    loadYoklamalar();
  }, []);

  const loadYoklamalar = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.baslangic_tarihi) params.baslangic_tarihi = filter.baslangic_tarihi;
      if (filter.bitis_tarihi) params.bitis_tarihi = filter.bitis_tarihi;

      const data = await yoklamaService.getMyYoklamalar(params);
      setYoklamalar(data);
    } catch (error) {
      console.error('Yoklamalar yüklenemedi:', error);
      toast.error('Yoklamalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilter = () => {
    loadYoklamalar();
  };

  const clearFilter = () => {
    setFilter({
      baslangic_tarihi: '',
      bitis_tarihi: '',
    });
    setTimeout(() => loadYoklamalar(), 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-button">
          ← Geri
        </Link>
        <h1>Yoklama Geçmişi</h1>
      </header>

      <div className="history-content">
        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Başlangıç Tarihi</label>
            <input
              type="date"
              name="baslangic_tarihi"
              value={filter.baslangic_tarihi}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Bitiş Tarihi</label>
            <input
              type="date"
              name="bitis_tarihi"
              value={filter.bitis_tarihi}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-actions">
            <button onClick={applyFilter} className="filter-btn">
              Filtrele
            </button>
            <button onClick={clearFilter} className="clear-btn">
              Temizle
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : yoklamalar.length === 0 ? (
          <div className="empty-state">
            <p>Henüz yoklama kaydınız bulunmuyor</p>
            <Link to="/scan" className="scan-link">
              Yoklama Ver
            </Link>
          </div>
        ) : (
          <div className="yoklama-table">
            <table>
              <thead>
                <tr>
                  <th>Ders</th>
                  <th>Tarih/Saat</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {yoklamalar.map((yoklama) => (
                  <tr key={yoklama.id}>
                    <td>{yoklama.ders_adi}</td>
                    <td>{formatDate(yoklama.zaman)}</td>
                    <td>
                      <span className={`status-badge ${yoklama.durum.toLowerCase()}`}>
                        {yoklama.durum}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;