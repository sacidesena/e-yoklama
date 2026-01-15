import api from './axiosConfig';

const sinifService = {
  // Tüm sınıfları getir
  getSiniflar: async () => {
    try {
      console.log('📚 Sınıflar getiriliyor...');
      const response = await api.get('/siniflar');
      console.log('✅ Sınıflar:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Sınıflar getirme hatası:', error);
      throw error;
    }
  },

  // Sınıf oluştur
  createSinif: async (sinifData) => {
    try {
      console.log('📝 Sınıf oluşturuluyor:', sinifData);
      const response = await api.post('/siniflar', sinifData);
      console.log('✅ Sınıf oluşturuldu:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Sınıf oluşturma hatası:', error.response?.data);
      throw error;
    }
  },

  // Sınıf güncelle
  updateSinif: async (id, sinifData) => {
    try {
      const response = await api.put(`/siniflar/${id}`, sinifData);
      return response.data;
    } catch (error) {
      console.error('❌ Sınıf güncelleme hatası:', error);
      throw error;
    }
  },

  // Sınıf sil
  deleteSinif: async (id) => {
    try {
      const response = await api.delete(`/siniflar/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Sınıf silme hatası:', error);
      throw error;
    }
  }
};

export default sinifService;