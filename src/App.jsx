import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { doc, setDoc } from "firebase/firestore";
import { db } from './firebase';

// Componentes Globales
import Navbar from './components/Navbar'; 
import Footer from './components/Footer'; 
import AccessibilityWidget from './components/AccessibilityWidget';

// Importaciones de páginas
import LandingPage from './pages/landing-page';
import Inicio from './pages/inicio';
import Cartilla from './pages/Cartilla';
import Perfil from './pages/perfiles/perfil-profesional'; 
import PerfilProveedor from './pages/perfiles/perfil-proveedores'; 
import PerfilClinica from './pages/perfiles/perfil-clinica';
import Editor from './pages/editores/editor-profesional'; 
import EditorClinica from './pages/editores/editor-clinica'; 
import EditorProveedor from './pages/editores/editor-proveedores'; 
import Papers from './pages/Papers';
import BolsaDeTrabajo from './pages/bolsa-de-trabajo';
import LegalPage from './pages/legales/privacidad';
import Login from './pages/Login';
import Capacitaciones from './pages/Capacitaciones';
import CartillaProveedores from './pages/CartillaProveedores';
import Ecosistema from './pages/Ecosistema';
import SalaDeEspera from './pages/SalaDeEspera';

// Panel Admin
import RutaProtegidaAdmin from './components/admin/RutaProtegidaAdmin';
import RutaProtegida from './components/admin/RutaProtegida';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import GestionUsuarios from './pages/admin/GestionUsuarios';
import Validaciones from './pages/admin/Validaciones';
import GestionBolsa from './pages/admin/GestionBolsa';
import GestionCapacitaciones from './pages/admin/GestionCapacitaciones';
import Configuracion from './pages/admin/Configuracion';
import Feedback from './pages/admin/Feedback';

// ==========================================
// SCROLL TO TOP
// ==========================================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// ==========================================
// LAYOUT PÚBLICO — con Navbar y Footer completo
// ==========================================
const MainLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="pt-[72px] flex-grow">
      <Outlet />
    </main>
    <footer className="mt-auto">
      <Footer />
    </footer>
  </div>
);

// ==========================================
// LAYOUT PRIVADO — con Navbar, sin Footer global
// ==========================================
const PrivateLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="pt-[72px] flex-grow">
      <Outlet />
    </main>
  </div>
);

// ==========================================
// APP
// ==========================================
export default function App() {
  useEffect(() => {
    // cargarSeeds(); // Descomentá solo cuando necesites cargar datos de prueba
  }, []);

  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-gray-50 selection:bg-[#2D6A6A] selection:text-white">
        
        <style dangerouslySetInnerHTML={{ __html: `
          #contacto { scroll-margin-top: 100px; }
          html { scroll-behavior: smooth; }
        `}} />

        <ScrollToTop />
        <AccessibilityWidget /> 

        <Routes>

          {/* ================================================ */}
          {/* RUTAS PÚBLICAS — con Navbar y Footer completo    */}
          {/* ================================================ */}
          <Route element={<MainLayout />}>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/Cartilla" element={<Cartilla />} />

            {/* Perfiles públicos */}
            <Route path="/perfil-profesional" element={<Perfil />} />
            <Route path="/perfil-proveedores" element={<PerfilProveedor />} />
            <Route path="/profesional/:slug" element={<Perfil />} />
            <Route path="/clinica/:slug" element={<PerfilClinica />} />
            <Route path="/proveedor/:slug" element={<PerfilProveedor />} />

            {/* Secciones públicas */}
            <Route path="/bolsa-de-trabajo" element={<BolsaDeTrabajo />} />
            <Route path="/capacitaciones" element={<Capacitaciones />} />
            <Route path="/cartilla-proveedores" element={<CartillaProveedores />} />
            <Route path="/papers" element={<Papers />} />

            {/* Legales */}
            <Route path="/terminos-y-condiciones" element={<LegalPage />} />
            <Route path="/politica-de-privacidad" element={<LegalPage />} />
          </Route>

          {/* ================================================ */}
          {/* RUTAS PRIVADAS — sin Navbar ni Footer global     */}
          {/* Cada página maneja su propio layout              */}
          {/* ================================================ */}
          <Route path="/Login" element={<Login />} />
          <Route element={<RutaProtegida useLayout />}>
  <Route path="/ecosistema" element={<Ecosistema />} />
</Route>
<Route element={<RutaProtegida />}>
  <Route path="/editor-profesional" element={<Editor />} />
  <Route path="/editor-clinica" element={<EditorClinica />} />
  <Route path="/editor-proveedores" element={<EditorProveedor />} />
</Route>

          {/* ================================================ */}
          {/* PANEL ADMIN                                      */}
          {/* ================================================ */}
          <Route path="/admin" element={
            <RutaProtegidaAdmin>
              <AdminLayout />
            </RutaProtegidaAdmin>
          }>
            <Route index element={<DashboardAdmin />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="validaciones" element={<Validaciones />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
            <Route path="bolsa" element={<GestionBolsa />} />
            <Route path="capacitaciones" element={<GestionCapacitaciones />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          <Route path="/sala-de-espera" element={<SalaDeEspera />} />
          <Route path="/" element={<SalaDeEspera />} />
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </div>
    </AuthProvider>
  );
}