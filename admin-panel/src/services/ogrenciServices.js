import api from './axiosConfig';

const ogrenciService = {
  getOgrenciler: async () => {
    try {
      console.log('👥 Öğrenciler getiriliyor...');
      const response = await api.get('/users/?rol=ogrenci');
      return response.data;
    } catch (error) {
      console.error('❌ Öğrenciler hatası:', error);
      throw error;
    }
  },

  createOgrenci: async (data) => {
    try {
      const response = await api.post('/users/', data);
      return response.data;
    } catch (error) {
      console.error('❌ Öğrenci oluşturma hatası:', error);
      throw error;
    }
  },

  updateOgrenci: async (id, data) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Öğrenci güncelleme hatası:', error);
      throw error;
    }
  },

  deleteOgrenci: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Öğrenci silme hatası:', error);
      throw error;
    }
  }
};

export default ogrenciService;