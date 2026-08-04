import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Menu, X, Search, User, ChevronRight,
  Briefcase, BookOpen, Package, FileText,
  LogOut, Home
} from 'lucide-react';

// ─── Links del menú hamburguesa según rol ───────────────────────────────────
const MENU_POR_ROL = {
  profesional: [
    { label: 'Inicio', icon: Home, path: '/ecosistema' },
    { label: 'Cartilla', icon: Search, path: '/Cartilla' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Bolsa de trabajo', icon: Briefcase, path: '/bolsa-de-trabajo' },
    { label: 'Cartilla de proveedores', icon: Package, path: '/cartilla-proveedores' },
    { label: 'Publicaciones científicas', icon: FileText, path: '/papers' },
  ],
  clinica: [
    { label: 'Inicio', icon: Home, path: '/ecosistema' },
    { label: 'Cartilla', icon: Search, path: '/Cartilla' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Bolsa de trabajo', icon: Briefcase, path: '/bolsa-de-trabajo' },
    { label: 'Cartilla de proveedores', icon: Package, path: '/cartilla-proveedores' },
    { label: 'Publicaciones científicas', icon: FileText, path: '/papers' },
  ],
  alumnx: [
    { label: 'Inicio', icon: Home, path: '/ecosistema' },
    { label: 'Cartilla', icon: Search, path: '/Cartilla' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Bolsa de trabajo', icon: Briefcase, path: '/bolsa-de-trabajo' },
  ],
  proveedor: [
    { label: 'Inicio', icon: Home, path: '/ecosistema' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Cartilla de proveedores', icon: Package, path: '/cartilla-proveedores' },
    { label: 'Publicaciones científicas', icon: FileText, path: '/papers' },
  ],
};

// ─── Rutas que son perfiles públicos ────────────────────────────────────────
const esRutaDePerfil = (pathname) =>
  /^\/(profesional|clinica|proveedor)\/.+/.test(pathname);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  const [banner, setBanner] = useState({ mostrar: false, texto: '' });
  const menuRef = useRef(null);

  const esPerfil = esRutaDePerfil(location.pathname);
  const rol = currentUser?.rol || null;
  const linksMenu = rol ? MENU_POR_ROL[rol] || [] : [];

  // ── Banner desde Firestore ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'globales'));
        if (snap.exists()) {
          const data = snap.data();
          setBanner({ mostrar: data.mostrarBanner || false, texto: data.textoBanner || '' });
        }
      } catch (error) {
  if (error?.code !== 'permission-denied') {
    console.error("Error cargando banner:", error);
  }
}
    };
    fetchBanner();
  }, []);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsNavbarScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Cierra menú al hacer click afuera ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Cierra menú al cambiar de ruta ─────────────────────────────────────────
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // ── Botón "Contactar": scroll al section #contacto del perfil ──────────────
  const handleContactar = () => {
    const el = document.getElementById('contacto');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  const bannerVisible = banner.mostrar && banner.texto;

  return (
    <>
      {/* ── Banner superior ─────────────────────────────────────────────────── */}
      {bannerVisible && (
        <div className="fixed top-0 left-0 w-full z-[110] bg-[#1A3D3D] text-white text-center py-2 px-4 text-[12px] font-bold tracking-wide">
          {banner.texto}
        </div>
      )}

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed ${bannerVisible ? 'top-[36px]' : 'top-0'} left-0 w-full z-[100] h-[72px] flex items-center px-8 md:px-10 transition-all duration-300 print:hidden ${
          isNavbarScrolled
            ? 'bg-white/85 backdrop-blur-md shadow-md border-b border-gray-200'
            : 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
        }`}
      >
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">

          {/* Logo */}
          <div
            className="font-['Montserrat'] font-extrabold tracking-tighter cursor-pointer transition-transform hover:scale-105"
            style={{ lineHeight: 0.75 }}
            onClick={() => navigate(currentUser ? '/ecosistema' : '/')}
          >
            <div className="text-[#1A3D3D] text-xl md:text-2xl" style={{ lineHeight: '1' }}>Portal</div>
            <div className="text-[#1A3D3D] text-xl md:text-2xl" style={{ lineHeight: '0.9' }}>Veterinario<span className="text-[#2D6A6A]">.</span></div>
          </div>

          {/* Derecha */}
          <div className="flex items-center gap-3">

            {/* Buscar Profesionales — siempre visible en desktop */}
            <button
              onClick={() => navigate('/Cartilla')}
              className="hidden md:flex items-center gap-2 bg-white text-[#1A3D3D] border border-[#1A3D3D]/10 rounded-2xl px-5 py-2.5 text-[13px] font-bold shadow-sm hover:bg-[#F4F7F7] hover:border-[#2D6A6A] transition-all"
            >
              <Search className="w-4 h-4" /> Buscar Profesionales
            </button>

            {/* Botón Contactar — solo en perfiles, desktop */}
            {esPerfil && (
              <button
                onClick={handleContactar}
                className="hidden md:block bg-[#2D6A6A] text-white rounded-2xl px-6 py-2.5 text-[13px] font-bold shadow-[0_4px_15px_rgba(45,106,106,0.2)] hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all"
              >
                Contactar
              </button>
            )}

            {/* Ícono User — visitante va al login, logueado va al ecosistema */}
            {currentUser ? (
              <button
                onClick={() => navigate('/ecosistema')}
                className="bg-[#2D6A6A] text-white w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center hover:bg-[#1A3D3D] transition-colors shadow-sm"
                aria-label="Mi ecosistema"
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/Login')}
                className="bg-white text-[#1A3D3D] border border-[#1A3D3D]/10 w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center hover:bg-[#F4F7F7] hover:border-[#2D6A6A] transition-all shadow-sm"
                aria-label="Iniciar sesión"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            {/* Hamburguesa — SOLO para usuarios logueados */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 md:w-11 md:h-11 bg-white rounded-2xl border border-[#1A3D3D]/10 shadow-sm flex items-center justify-center text-[#1A3D3D] hover:bg-[#F4F7F7] transition-all active:scale-95 relative overflow-hidden"
                >
                  <Menu className={`w-5 h-5 absolute transition-all duration-300 ${isMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
<X className={`w-5 h-5 absolute transition-all duration-300 ${isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(26,61,61,0.15)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-3">

                      {/* Buscar — visible en mobile dentro del menú */}
                      <button
                        onClick={() => navigate('/Cartilla')}
                        className="md:hidden w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"
                      >
                        <Search className="w-4 h-4 text-[#2D6A6A]" />
                        <span className="text-sm font-bold text-[#1A3D3D]">Buscar Profesionales</span>
                      </button>

                      {/* Contactar — visible en mobile, solo en perfiles */}
                      {esPerfil && (
                        <button
                          onClick={handleContactar}
                          className="md:hidden w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"
                        >
                          <ChevronRight className="w-4 h-4 text-[#2D6A6A]" />
                          <span className="text-sm font-bold text-[#1A3D3D]">Contactar</span>
                        </button>
                      )}

                      {/* Links según rol */}
                      {linksMenu.map(({ label, icon: Icon, path }) => (
                        <button
                          key={path}
                          onClick={() => navigate(path)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="w-4 h-4 text-[#1A3D3D] shrink-0" />
                            <span className="text-sm font-bold text-[#1A3D3D] truncate">{label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                      ))}

                      {/* Cerrar sesión */}
                      <div className="h-px bg-gray-100 mx-4 my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors group"
                      >
                        <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                        <span className="text-sm font-bold text-[#1A3D3D] group-hover:text-red-500">Cerrar sesión</span>
                      </button>

                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </nav>
    </>
  );
}