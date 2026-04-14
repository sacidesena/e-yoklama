import api from './axiosConfig';

const dersService = {
  getDersler: async () => {
    try {
      console.log('📚 Dersler getiriliyor...');
      const response = await api.get('/dersler');
      return response.data;
    } catch (error) {
      console.error('❌ Dersler hatası:', error);
      throw error;
    }
  },

  createDers: async (data) => {
    try {
      const response = await api.post('/dersler', data);
      return response.data;
    } catch (error) {
      console.error('❌ Ders oluşturma hatası:', error);
      throw error;
    }
  },

  updateDers: async (id, data) => {
    try {
      const response = await api.put(`/dersler/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Ders güncelleme hatası:', error);
      throw error;
    }
  },

  deleteDers: async (id) => {
    try {
      const response = await api.delete(`/dersler/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ders silme hatası:', error);
      throw error;
    }
  }
};

export default dersService;