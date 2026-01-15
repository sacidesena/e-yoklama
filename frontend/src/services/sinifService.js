import api from './api';

const sinifService = {
  // Tüm sınıfları getir
  async getSiniflar(params = {}) {
    const response = await api.get('/siniflar/', { params });
    return response.data;
  },

  // Tek sınıf getir
  async getSinif(id) {
    const response = await api.get(`/siniflar/${id}`);
    return response.data;
  },

  // Sınıf oluştur
  async createSinif(data) {
    const response = await api.post('/siniflar/', data);
    return response.data;
  },

  // Sınıf güncelle
  async updateSinif(id, data) {
    const response = await api.put(`/siniflar/${id}`, data);
    return response.data;
  },

  // Sınıf sil
  async deleteSinif(id) {
    const response = await api.delete(`/siniflar/${id}`);
    return response.data;
  },

  // Sınıf programı
  async getSinifProgram(id) {
    const response = await api.get(`/siniflar/${id}/program`);
    return response.data;
  },

  // Sınıf QR kodu
  async getSinifQR(id) {
    const response = await api.get(`/siniflar/${id}/qr`);
    return response.data;
  },

  // QR kod oluştur
  async generateQR(id) {
    const response = await api.post(`/siniflar/${id}/qr/generate`);
    return response.data;
  },
};

export default sinifService;