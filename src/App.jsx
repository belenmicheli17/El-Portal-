import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './firebase';
import { cargarSeeds } from './seeds';

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

import Novedades from './pages/novedades';
import BolsaDeTrabajo from './pages/bolsa-de-trabajo';
import LegalPage from './pages/legales/privacidad';
import Login from './pages/Login';
import Capacitaciones from './pages/Capacitaciones';
import CartillaProveedores from './pages/CartillaProveedores';
import Ecosistema from './pages/Ecosistema';

// --- NUEVOS IMPORTS PARA EL PANEL ADMIN ---
import RutaProtegidaAdmin from './components/admin/RutaProtegidaAdmin';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import GestionUsuarios from './pages/admin/GestionUsuarios';
import Validaciones from './pages/admin/Validaciones';
import GestionBolsa from './pages/admin/GestionBolsa';
import Configuracion from './pages/admin/Configuracion';

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
  const esRutaDePerfil = location.pathname.includes('/perfil') || location.pathname.includes('/profesional') || location.pathname.includes('/clinica') || location.pathname.includes('/proveedor');

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

const cargarPerfilPrueba = async () => {
  const perfilClara = {
    cuentaEmail: 'clara.valdez@gmail.com',
    cuentaPassword: 'password123',
    cuentaTelefono: '5491145678901',
    planActual: 'pro',
    visible: true,
    slug: 'clara-valdez',
    nombre: "Dra. Clara Valdez",
    especialidad: "Cirugía de Tejidos Blandos",
    matricula: "12345",
    provincia: "Buenos Aires",
    bio: "Especialista en cirugía de tejidos blandos y traumatología con más de 12 años de experiencia. Mi enfoque se centra en técnicas mínimamente invasivas para garantizar una recuperación rápida.",
    foto: "https://images.unsplash.com/photo-1594824436998-ef22cc372134?auto=format&fit=crop&w=400&q=80",
    fotosPerfil: ["https://images.unsplash.com/photo-1594824436998-ef22cc372134?auto=format&fit=crop&w=400&q=80"],
    atiendeDomicilio: true,
    emailContacto: "contacto@claravaldez.com",
    instagram: "https://instagram.com/draclaravaldez",
    linkedin: "",
    facebook: "",
    whatsappActivo: true,
    whatsappNum: "5491145678901",
    trayectoria: [
      { id: 1, titulo: "Especialidad en Cirugía", desc: "UBA - 2015", extra: "Graduada con Diploma de Honor" }
    ],
    servicios: [
      { id: 1, titulo: "Cirugía Avanzada", desc: "Recuperación rápida en caninos.", icono: "Bisturi" }
    ],
    casos: [
      { id: 1, nombre: "Luna", patologia: "Cirugía de Cadera", desc: "Recuperación exitosa de displasia severa.", fotos: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80"] }
    ],
    zonas: [
      { 
        id: 1, 
        nombre: "Zona Oeste", 
        clinicas: [
          { id: 101, nombre: "Veterinaria Patitos", direccion: "Morón, Centro", linkMaps: "https://goo.gl/maps/ejemplo" }
        ] 
      }
    ]
  };

  try {
    await setDoc(doc(db, 'profesionales', 'clara-valdez'), perfilClara);
    alert("¡Perfil de Clara Valdez subido con éxito a Firebase!");
  } catch (error) {
    console.error("Error subiendo datos:", error);
    alert("Hubo un error, mirá la consola.");
  }
};

// ==========================================
// 2. COMPONENTE PRINCIPAL (App)
// ==========================================

export default function App() {





  useEffect(() => {
    // Descomentá esta línea SOLO cuando quieras cargar los datos
   // cargarSeeds(); 
  }, []);

  return (
    <AuthProvider>
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
              <Route path="/" element={<Inicio />} /> 
  <Route path="/landing" element={<LandingPage />} /> 

  <Route path="/Cartilla" element={<Cartilla />} /> 
  <Route path="/ecosistema" element={<Ecosistema />} />
            
            {/* Rutas Fijas Antiguas (opcionales, podés borrarlas más adelante si solo usas los slugs) */}
            <Route path="/perfil-profesional" element={<Perfil />} />
            <Route path="/perfil-proveedores" element={<PerfilProveedor />} />
            
            {/* --- NUEVAS RUTAS DINÁMICAS (SLUGS) --- */}
            <Route path="/profesional/:slug" element={<Perfil />} />
            <Route path="/clinica/:slug" element={<PerfilClinica />} />
            <Route path="/proveedor/:slug" element={<PerfilProveedor />} />
            
            {/* Secciones de la plataforma */}
            <Route path="/novedades" element={<Novedades />} />
            <Route path="/bolsa-de-trabajo" element={<BolsaDeTrabajo />} />
            <Route path="/capacitaciones" element={<Capacitaciones />} />
            <Route path="/cartilla-proveedores" element={<CartillaProveedores />} />

            {/* Legales */}
            <Route path="/terminos-y-condiciones" element={<LegalPage />} />
            <Route path="/politica-de-privacidad" element={<LegalPage />} />
          </Route>

          {/* ========================================================= */}
          {/* RUTAS SIN NAVBAR NI FOOTER GLOBALES                       */}
          {/* ========================================================= */}
          
          <Route path="/Login" element={<Login />} />

          {/* Rutas de Editores */}
          <Route path="/editor-profesional" element={<Editor />} />
          <Route path="/editor-clinica" element={<EditorClinica />} />
          <Route path="/editor-proveedores" element={<EditorProveedor />} />

          {/* ========================================================= */}
          {/* PANEL DE ADMINISTRACIÓN (PROTEGIDO)                      */}
          {/* ========================================================= */}
          <Route path="/admin" element={
            <RutaProtegidaAdmin>
              <AdminLayout />
            </RutaProtegidaAdmin>
          }>
            <Route index element={<DashboardAdmin />} />
            <Route path="validaciones" element={<Validaciones />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
            <Route path="bolsa" element={<GestionBolsa />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <AccessibilityWidget />
      </div>
    </AuthProvider>
  );
}