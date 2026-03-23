import api from './axiosConfig';

const sinifService = {
  getSiniflar: async () => {
    try {
      console.log('📚 Sınıflar getiriliyor...');
      const response = await api.get('/siniflar');
      return response.data;
    } catch (error) {
      console.error('❌ Sınıflar hatası:', error);
      throw error;
    }
  },

  createSinif: async (data) => {
    try {
      const response = await api.post('/siniflar', data);
      return response.data;
    } catch (error) {
      console.error('❌ Sınıf oluşturma hatası:', error);
      throw error;
    }
  },

  updateSinif: async (id, data) => {
    try {
      const response = await api.put(`/siniflar/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Sınıf güncelleme hatası:', error);
      throw error;
    }
  },

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