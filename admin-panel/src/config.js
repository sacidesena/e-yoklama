// API Base URL - ortama göre otomatik ayarlanır
export const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.122.1:8000';

// Alternatif olarak otomatik tespit:
// export const API_URL = window.location.hostname === 'localhost' 
//   ? 'http://localhost:8000'
//   : 'http://192.168.1.34:8000';