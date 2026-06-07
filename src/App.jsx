import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

// Componentes Globales
import Navbar from './components/Navbar'; 
import Footer from './components/Footer'; 
import AccessibilityWidget from './components/AccessibilityWidget';

// Importaciones de páginas
import LandingPage from './pages/landing-page';
import Inicio from './pages/inicio';
import Cartilla from './pages/Cartilla'; // NUEVA IMPORTACIÓN
import Perfil from './pages/perfiles/perfil-profesional'; 
import PerfilProveedor from './pages/perfiles/perfil-proveedores'; 
import PerfilClinica from './pages/perfiles/perfil-clinica';
import Editor from './pages/editores/editor-profesional'; 
import EditorClinica from './pages/editores/editor-clinica'; 
import EditorProveedor from './pages/editores/editor-proveedores'; 
import Ecosistema from './pages/repertorio';
import Novedades from './pages/novedades';
import BolsaDeTrabajo from './pages/bolsa-de-trabajo';
import LegalPage from './pages/legales/privacidad';
import Login from './pages/Login';

// ==========================================
// COMPONENTE: SCROLL TO TOP
// ==========================================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// ==========================================
// 1. CREAMOS EL COMPONENTE LAYOUT
// ==========================================
const MainLayout = () => {
  const location = useLocation();
  const esRutaDePerfil = location.pathname.includes('/perfil') || location.pathname.includes('/profesional');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        mostrarBotonContacto={esRutaDePerfil} 
        mostrarBotonCrear={!esRutaDePerfil} 
      /> 
      
      <main className="pt-[72px] flex-grow">
        <Outlet /> 
      </main>
      
      <footer className="mt-auto">
        <Footer /> 
      </footer>
    </div>
  );
};

// ==========================================
// 2. COMPONENTE PRINCIPAL (App)
// ==========================================
export default function App() {
  return (
    <div className="relative min-h-screen bg-gray-50 selection:bg-[#2D6A6A] selection:text-white">
      
      <style dangerouslySetInnerHTML={{ __html: `
        #contacto {
          scroll-margin-top: 100px;
        }
        html {
          scroll-behavior: smooth;
        }
      `}} />

      <ScrollToTop />

      <Routes>
        {/* ========================================================= */}
        {/* RUTAS CON NAVBAR Y FOOTER PÚBLICOS (MainLayout)           */}
        {/* ========================================================= */}
        <Route element={<MainLayout />}>
          {/* Páginas principales */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/Cartilla" element={<Cartilla />} /> 

          {/* Perfiles */}
          <Route path="/perfil-profesional" element={<Perfil />} />
          <Route path="/profesional/:id" element={<Perfil />} />
          <Route path="/perfil-proveedores" element={<PerfilProveedor />} />
          <Route path="/perfil-clinica" element={<PerfilClinica />} />
          
          {/* Secciones de la plataforma */}
          <Route path="/ecosistema" element={<Ecosistema />} />
          <Route path="/novedades" element={<Novedades />} />
          <Route path="/bolsa-de-trabajo" element={<BolsaDeTrabajo />} />
          
          {/* Legales */}
          <Route path="/terminos-y-condiciones" element={<LegalPage />} />
          <Route path="/politica-de-privacidad" element={<LegalPage />} />
        </Route>

        {/* ========================================================= */}
        {/* RUTAS SIN NAVBAR NI FOOTER GLOBALES                       */}
        {/* ========================================================= */}
        
        {/* --- ACÁ MOVIMOS LA RUTA DEL LOGIN --- */}
        <Route path="/login" element={<Login />} />

        {/* Rutas de Editores */}
        <Route path="/editor-profesional" element={<Editor />} />
        <Route path="/editor-clinica" element={<EditorClinica />} />
        <Route path="/editor-proveedores" element={<EditorProveedor />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AccessibilityWidget />
    </div>
  );
}