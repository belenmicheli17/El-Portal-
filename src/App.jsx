import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ==========================================
// IMPORTACIÓN DE PÁGINAS (Ajusta según tus archivos)
// ==========================================
import LandingPage from './pages/landing-page';
import Inicio from './pages/inicio';

// Perfiles
import Perfil from './pages/perfiles/perfil-profesional'; 
import PerfilProveedor from './pages/perfiles/perfil-proveedores'; 
import PerfilClinica from './pages/perfiles/perfil-clinica';

// Editores
import Editor from './pages/editores/editor-profesional'; 
import EditorClinica from './pages/editores/editor-clinica'; 
import EditorProveedor from './pages/editores/editor-proveedores'; 

// Secciones del Ecosistema
import Ecosistema from './pages/repertorio';
import Novedades from './pages/novedades';
import BolsaDeTrabajo from './pages/bolsa-de-trabajo';

// Legales
import LegalPage from './pages/legales/privacidad';

// Componentes Globales
import AccessibilityWidget from './components/AccessibilityWidget';

/**
 * COMPONENTE PRINCIPAL (App.jsx)
 * * Cambios realizados:
 * 1. Eliminado <Router>: Evita el error "You cannot render a <Router> inside another <Router>".
 * 2. Limpieza de duplicados: Se corrigieron los imports mal pegados al inicio.
 * 3. Rutas unificadas: Se agregaron todas las secciones de tu plataforma.
 */
export default function App() {
  return (
    <div className="relative min-h-screen bg-gray-50 selection:bg-[#2D6A6A] selection:text-white">
      
      {/* SISTEMA DE RUTAS: Solo una vez */}
      <Routes>
        {/* Landing e Inicio */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/inicio" element={<Inicio />} />
        
        {/* Perfiles */}
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil-proveedor" element={<PerfilProveedor />} />
        <Route path="/perfil-clinica" element={<PerfilClinica />} />
        
        {/* Editores */}
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor-clinica" element={<EditorClinica />} />
        <Route path="/editor-proveedores" element={<EditorProveedor />} />
        
        {/* Secciones del Ecosistema */}
        <Route path="/ecosistema" element={<Ecosistema />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route path="/bolsa-de-trabajo" element={<BolsaDeTrabajo />} />
        
        {/* Legales */}
        <Route path="/terminos-y-condiciones" element={<LegalPage />} />
        <Route path="/politica-de-privacidad" element={<LegalPage />} />
        
        {/* Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* WIDGET DE ACCESIBILIDAD: Global para todo el sitio */}
      <AccessibilityWidget />

    </div>
  );
}