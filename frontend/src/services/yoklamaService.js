import api from './api';

const yoklamaService = {
  // QR kod ile yoklama ver
  async submitYoklama(data) {
    const response = await api.post('/yoklama/submit', data);
    return response.data;
  },


  // Kendi yoklamalarımı getir
  async getMyYoklamalar(params = {}) {
    const response = await api.get('/yoklama/me', { params });
    return response.data;
  },

  // İstatistikler
  async getMyStats(params = {}) {
    const response = await api.get('/yoklama/me/stats', { params });
    return response.data;
  },

  // Ders yoklamaları (öğretmen)
  async getDersYoklamalar(dersId, tarih) {
    const params = tarih ? { tarih } : {};
    const response = await api.get(`/yoklama/ders/${dersId}`, { params });
    return response.data;
  },
};

export default yoklamaService;