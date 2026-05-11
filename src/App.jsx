import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

// Componentes Globales
import Navbar from './components/Navbar'; 
import Footer from './components/Footer'; 
import AccessibilityWidget from './components/AccessibilityWidget';

// Importaciones de páginas
import LandingPage from './pages/landing-page';
import Inicio from './pages/inicio';
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

// ==========================================
// COMPONENTE: SCROLL TO TOP
// Obliga a la página a subir arriba de todo al cambiar de ruta
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
  // Extraemos la información de la ruta actual
  const location = useLocation();
  
  // Detectamos si la URL actual incluye la palabra "perfil"
  const esRutaDePerfil = location.pathname.includes('/perfil');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar Dinámico: 
        Si estamos en un perfil, mostrarBotonContacto será TRUE. 
        Si estamos en cualquier otra vista, mostrarBotonCrear será TRUE.
      */}
      <Navbar 
        mostrarBotonContacto={esRutaDePerfil} 
        mostrarBotonCrear={!esRutaDePerfil} 
      /> 
      
      {/* Contenedor Principal que empuja el Footer hacia abajo */}
      <main className="pt-[72px] flex-grow">
        {/* El Outlet es el espacio dinámico donde renderiza la página según la URL */}
        <Outlet /> 
      </main>
      
      {/* Footer al final de la página */}
      <Footer /> 
    </div>
  );
};

// ==========================================
// 2. COMPONENTE PRINCIPAL (App)
// ==========================================
export default function App() {
  return (
    <div className="relative min-h-screen bg-gray-50 selection:bg-[#2D6A6A] selection:text-white">
      
      {/* Estilos globales para corregir el desplazamiento (Scroll Offset) */}
      <style dangerouslySetInnerHTML={{ __html: `
        #contacto {
          scroll-margin-top: 100px; /* Altura Navbar (72px) + 28px de margen extra */
        }
        html {
          scroll-behavior: smooth;
        }
      `}} />

      {/* Activa el Scroll To Top automático */}
      <ScrollToTop />

      <Routes>
        {/* ========================================================= */}
        {/* RUTAS CON NAVBAR Y FOOTER PÚBLICOS (MainLayout)           */}
        {/* ========================================================= */}
        <Route element={<MainLayout />}>
          
          {/* Páginas principales */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/inicio" element={<Inicio />} />
          
          {/* Perfiles */}
          <Route path="/perfil-profesional" element={<Perfil />} />
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
        {/* RUTAS DE EDITORES (Sin Navbar ni Footer globales)         */}
        {/* ========================================================= */}
        <Route path="/editor-profesional" element={<Editor />} />
        <Route path="/editor-clinica" element={<EditorClinica />} />
        <Route path="/editor-proveedores" element={<EditorProveedor />} />

        {/* Redirección por defecto: si alguien entra a una URL que no existe, va al Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Widget Flotante de Accesibilidad */}
      <AccessibilityWidget />
    </div>
  );
}