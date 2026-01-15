import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token'); // ✅ Düzeltildi
  const userStr = localStorage.getItem('admin_user');

  console.log('🔒 ProtectedRoute:', { token: !!token, user: !!userStr });

  if (!token || !userStr) {
    console.log('❌ Token veya user yok, login\'e yönlendir');
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (user.rol !== 'admin') {
      console.log('❌ Admin değil:', user.rol);
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }

    console.log('✅ Admin yetkili, sayfa açılıyor');
    return children;
    
  } catch (error) {
    console.error('❌ User parse hatası:', error);
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;