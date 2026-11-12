import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { doc, setDoc } from "firebase/firestore";
import { db } from './firebase';

// Componentes Globales
import Navbar from './components/Navbar'; 
import Footer from './components/Footer'; 
import FooterSimple from './components/FooterSimple';
import AccessibilityWidget from './components/AccessibilityWidget';

// Páginas: la Sala de espera (portada) se carga directo; el resto se descarga recién cuando alguien entra
import SalaDeEspera from './pages/SalaDeEspera';
const LandingPage = lazy(() => import('./pages/landing-page'));
const Cartilla = lazy(() => import('./pages/Cartilla'));
const Perfil = lazy(() => import('./pages/perfiles/perfil-profesional'));
const PerfilProveedor = lazy(() => import('./pages/perfiles/perfil-proveedores'));
const PerfilClinica = lazy(() => import('./pages/perfiles/perfil-clinica'));
const Editor = lazy(() => import('./pages/editores/editor-profesional'));
const EditorClinica = lazy(() => import('./pages/editores/editor-clinica'));
const EditorProveedor = lazy(() => import('./pages/editores/editor-proveedores'));
const Papers = lazy(() => import('./pages/Papers'));
const BolsaDeTrabajo = lazy(() => import('./pages/bolsa-de-trabajo'));
const LegalPage = lazy(() => import('./pages/legales/privacidad'));
const Login = lazy(() => import('./pages/Login'));
const Capacitaciones = lazy(() => import('./pages/Capacitaciones'));
const CartillaProveedores = lazy(() => import('./pages/CartillaProveedores'));
const Ecosistema = lazy(() => import('./pages/Ecosistema'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const RestablecerClave = lazy(() => import('./pages/restablecer-clave'));
const OnboardingClinica = lazy(() => import('./pages/OnboardingClinica'));

// Panel Admin
import RutaProtegidaAdmin from './components/admin/RutaProtegidaAdmin';
import RutaProtegida from './components/admin/RutaProtegida';
import BannerModoPrueba from './components/admin/BannerModoPrueba';
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'));
const GestionUsuarios = lazy(() => import('./pages/admin/GestionUsuarios'));
const Validaciones = lazy(() => import('./pages/admin/Validaciones'));
const GestionBolsa = lazy(() => import('./pages/admin/GestionBolsa'));
const GestionCapacitaciones = lazy(() => import('./pages/admin/GestionCapacitaciones'));
const Configuracion = lazy(() => import('./pages/admin/Configuracion'));


// ==========================================
// SCROLL TO TOP
// ==========================================
// Muestra lo que tenga adentro, salvo dentro del panel de admin
const OcultarEnAdmin = ({ children }) => {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? null : children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Le avisa a Google cuál es la dirección oficial de cada página (sin filtros y sin mayúsculas)
const CanonicalAutomatico = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    let ruta = pathname.replace(/\/+$/, '');
    if (ruta.toLowerCase() === '/cartilla') ruta = '/cartilla';
    let enlace = document.querySelector('link[rel="canonical"]');
    if (!enlace) {
      enlace = document.createElement('link');
      enlace.rel = 'canonical';
      document.head.appendChild(enlace);
    }
    enlace.href = 'https://www.portalveterinario.ar' + ruta;
  }, [pathname]);
  return null;
};

// ==========================================
// LAYOUT PÚBLICO — con Navbar y Footer completo
// ==========================================
// En los formularios de la Bolsa de Trabajo va el footer chico, para no distraer
const usaFooterChico = (pathname, search) =>
  pathname === '/bolsa-de-trabajo' && /[?&]v=(publicar|disponible|mis)\b/.test(search);

const MainLayout = () => {
  const { pathname, search } = useLocation();
  const chico = usaFooterChico(pathname, search);
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="pt-[72px] flex-grow">
        <Outlet />
      </main>
      {chico ? (
        <FooterSimple seccion="Bolsa de Trabajo" />
      ) : (
        <footer className="mt-auto">
          <Footer />
        </footer>
      )}
    </div>
  );
};

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
    <AuthProvider loadingFallback={
      window.location.pathname === '/' || window.location.pathname === '/sala-de-espera'
        ? null
        : <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
          </div>
    }>
      <div className="relative min-h-screen bg-gray-50 selection:bg-[#2D6A6A] selection:text-white">
        
        <style dangerouslySetInnerHTML={{ __html: `
          #contacto { scroll-margin-top: 100px; }
          html { scroll-behavior: smooth; }
        `}} />

        <ScrollToTop />
        <CanonicalAutomatico />
        <BannerModoPrueba />
        <OcultarEnAdmin><AccessibilityWidget /></OcultarEnAdmin> 

        <Suspense fallback={
          <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
          </div>
        }>
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
            <Route path="/profesional" element={<Navigate to="/Cartilla" replace />} />
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
          <Route path="/restablecer-clave" element={<RestablecerClave />} />
          <Route element={<RutaProtegida useLayout />}>
  <Route path="/ecosistema" element={<Ecosistema />} />
</Route>
<Route element={<RutaProtegida />}>
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/onboarding-clinica" element={<OnboardingClinica />} />
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
        </Suspense>
      </div>
    </AuthProvider>
  );
}