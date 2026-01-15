import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 👇 1. BU SATIRI EKLE (Eğer context klasörün yoksa hata verir, oluşturman lazım)
import { AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPages'; // Dosya adın LoginPages ise böyle kalsın
import Dashboard from './pages/Dashboard';
import SinifYonetim from './pages/SinifYonetim';
import ProgramYonetim from './pages/ProgramYonetim';
import OgrenciYonetim from './pages/OgrenciYonetim';
import DersYonetim from './pages/DersYonetim';
import QRKodlar from './pages/QRKodlar';
import Raporlar from './pages/Raporlar';

// Axios ayarlarını yükle
import './services/axiosConfig'; 

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      {/* 👇 2. TÜM ROTALARI BU KAPSAYICI İÇİNE ALMALIYIZ 👇 */}
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/siniflar" element={
            <ProtectedRoute>
              <SinifYonetim />
            </ProtectedRoute>
          } />
          
          <Route path="/program" element={
            <ProtectedRoute>
              <ProgramYonetim />
            </ProtectedRoute>
          } />
          
          <Route path="/ogrenciler" element={
            <ProtectedRoute>
              <OgrenciYonetim />
            </ProtectedRoute>
          } />
          
          <Route path="/dersler" element={
            <ProtectedRoute>
              <DersYonetim />
            </ProtectedRoute>
          } />
          
          <Route path="/qr-kodlar" element={
            <ProtectedRoute>
              <QRKodlar />
            </ProtectedRoute>
          } />
          
          <Route path="/raporlar" element={
            <ProtectedRoute>
              <Raporlar />
            </ProtectedRoute>
          } />
          
          {/* Ana sayfaya geleni Dashboard'a gönder, o da ProtectedRoute ile kontrol etsin */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Bilinmeyen sayfa gelirse Login'e gönder */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
        />
      </AuthProvider>
      {/* 👆 KAPSAYICI BİTİŞ 👆 */}
    </BrowserRouter>
  );
}

export default App;