import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react'; // 1. useContext Ekle
import { AuthProvider, AuthContext } from './context/AuthContext'; // 2. AuthContext Ekle
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import './services/axiosConfig';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// ✅ AKILLI YÖNLENDİRME BİLEŞENİ
// Bu bileşen, kullanıcının durumuna göre nereye gideceğine karar verir.
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  // AuthContext kontrolü bitirene kadar bekle (Yoksa direkt login'e atar)
  if (loading) return <div className="p-4 text-center">Yükleniyor...</div>;

  // Eğer kullanıcı varsa Dashboard'a, yoksa Login'e git
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Öğrenci Routes */}
            <Route
              path="/qr-scan"
              element={
                <ProtectedRoute allowedRoles={['ogrenci']}>
                  <ScanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={['ogrenci']}>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ DÜZELTİLEN KISIM: Ana Sayfa Yönlendirmesi */}
            {/* Eskiden direkt login'e atıyordu, şimdi kontrol edip atıyor */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* 404 - Sayfa bulunamazsa */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;