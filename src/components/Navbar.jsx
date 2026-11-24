import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoginDropdown from './LoginDropdown';
import BotonAcceso from './BotonAcceso';
import {
  Menu, X, Search, User, ChevronRight,
  Briefcase, BookOpen, Package, FileText,
  LogOut, Home, Stethoscope
} from 'lucide-react';

// ─── Links del menú hamburguesa según rol ───────────────────────────────────
const MENU_POR_ROL = {
  profesional: [
    { label: 'Mi cuenta', icon: User, path: '/ecosistema' },
    { label: 'Cartilla veterinaria', icon: Search, path: '/Cartilla' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Bolsa de trabajo', icon: Briefcase, path: '/bolsa-de-trabajo' },
    { label: 'Cartilla de proveedores', icon: Package, path: '/cartilla-proveedores' },
    { label: 'Publicaciones científicas', icon: FileText, path: '/papers' },
  ],
  clinica: [
    { label: 'Mi cuenta', icon: User, path: '/ecosistema' },
    { label: 'Cartilla veterinaria', icon: Search, path: '/Cartilla' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Bolsa de trabajo', icon: Briefcase, path: '/bolsa-de-trabajo' },
    { label: 'Cartilla de proveedores', icon: Package, path: '/cartilla-proveedores' },
    { label: 'Publicaciones científicas', icon: FileText, path: '/papers' },
  ],
  alumnx: [
    { label: 'Mi cuenta', icon: User, path: '/ecosistema' },
    { label: 'Cartilla veterinaria', icon: Search, path: '/Cartilla' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Bolsa de trabajo', icon: Briefcase, path: '/bolsa-de-trabajo' },
  ],
  proveedor: [
    { label: 'Mi cuenta', icon: User, path: '/ecosistema' },
    { label: 'Capacitaciones', icon: BookOpen, path: '/capacitaciones' },
    { label: 'Cartilla de proveedores', icon: Package, path: '/cartilla-proveedores' },
    { label: 'Publicaciones científicas', icon: FileText, path: '/papers' },
  ],
};

// ─── Secciones que todavía no están habilitadas: se ven grisadas con "Próximamente" ───
const RUTAS_PROXIMAMENTE = ['/capacitaciones', '/cartilla-proveedores'];

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
  const panelRef = useRef(null); // ventanita lateral del menú
  // Cartelito de login (visitantes): abierto/cerrado y referencia para detectar clics afuera
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef(null);

  const esPerfil = esRutaDePerfil(location.pathname);
  const enCartilla = location.pathname.toLowerCase() === '/cartilla';
  const rol = currentUser?.rol || null;
  // Las secciones "Próximamente" van al final de la lista
  const linksMenu = (rol ? MENU_POR_ROL[rol] || [] : [])
    .slice()
    .sort((a, b) => Number(RUTAS_PROXIMAMENTE.includes(a.path)) - Number(RUTAS_PROXIMAMENTE.includes(b.path)));

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
      if (menuRef.current && !menuRef.current.contains(e.target) && !(panelRef.current && panelRef.current.contains(e.target))) {
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

  // ── Cierra el cartelito de login al hacer click afuera ─────────────────────
  useEffect(() => {
    if (!showLogin) return;
    const handleClickOutsideLogin = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setShowLogin(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideLogin);
    return () => document.removeEventListener('mousedown', handleClickOutsideLogin);
  }, [showLogin]);

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

            {/* Buscar Profesionales — desktop. En la propia Cartilla no hace falta (ya estás ahí) */}
            {!enCartilla && (
              <button
                onClick={() => navigate('/Cartilla')}
                className="hidden md:flex items-center gap-2 bg-white text-[#1A3D3D] border border-[#1A3D3D]/10 rounded-2xl px-5 py-2.5 text-[13px] font-bold shadow-sm hover:bg-[#F4F7F7] hover:border-[#2D6A6A] transition-all"
              >
                <Search className="w-4 h-4" /> Buscar Profesionales
              </button>
            )}

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
              <div className="relative" ref={loginRef}>
                <BotonAcceso
                  loginAbierto={showLogin}
                  onRegistro={() => navigate('/login', { state: { registro: true } })}
                  onLogin={() => setShowLogin(v => !v)}
                />
                {showLogin && <LoginDropdown onClose={() => setShowLogin(false)} />}
              </div>
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

                {/* Ventanita lateral: siempre está armada y se desliza desde la derecha al abrir */}
                {createPortal(
                  <div className={`fixed inset-0 z-[300] ${isMenuOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isMenuOpen}>
                    {/* Fondo oscuro suave: tocarlo cierra el menú */}
                    <button type="button" tabIndex={-1} aria-label="Cerrar menú" onClick={() => setIsMenuOpen(false)} className={`absolute inset-0 w-full h-full bg-[#1A3D3D]/25 cursor-default transition-opacity duration-500 ease-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} />
                    <aside ref={panelRef} className={`absolute top-0 right-0 h-full w-[82%] max-w-[340px] bg-white rounded-l-[28px] shadow-[-20px_0_50px_rgba(26,61,61,0.12)] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                      <div className="flex items-center justify-between pl-7 pr-5 h-[72px] shrink-0">
                        <span className="font-['Montserrat'] font-extrabold text-xl text-[#1A3D3D]">Menú</span>
                        <button type="button" aria-label="Cerrar menú" onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#666666] hover:bg-[#F4F7F7] hover:text-[#1A3D3D] transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto px-3 pb-3">

                        {/* Contactar — visible en mobile, solo en perfiles */}
                        {esPerfil && (
                          <button
                            onClick={() => { handleContactar(); setIsMenuOpen(false); }}
                            className="md:hidden w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#F4F7F7] rounded-2xl transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-[#2D6A6A]" />
                            <span className="text-[16px] font-bold text-[#1A3D3D]">Contactar</span>
                          </button>
                        )}

                        {/* Links según rol (los "Próximamente" quedan al final, grisados) */}
                        {linksMenu.map(({ label, icon: Icon, path }) => (
                          RUTAS_PROXIMAMENTE.includes(path) ? (
                            <div
                              key={path}
                              aria-disabled="true"
                              className="w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl cursor-not-allowed select-none"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <Icon className="w-5 h-5 text-gray-300 shrink-0" />
                                <span className="text-[16px] font-bold text-gray-400 truncate">{label}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 bg-gray-100 rounded-full px-2.5 py-1 shrink-0">Próximamente</span>
                            </div>
                          ) : (
                            <button
                              key={path}
                              onClick={() => navigate(path)}
                              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F7F7] rounded-2xl transition-colors"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <Icon className="w-5 h-5 text-[#2D6A6A] shrink-0" />
                                <span className="text-[16px] font-bold text-[#1A3D3D] truncate">{label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </button>
                          )
                        ))}
                      </div>

                      {/* Cerrar sesión */}
                      <div className="px-3 py-4 border-t border-gray-100 shrink-0">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-red-50 rounded-2xl transition-colors group"
                        >
                          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                          <span className="text-[16px] font-bold text-[#1A3D3D] group-hover:text-red-500">Cerrar sesión</span>
                        </button>
                      </div>
                    </aside>
                  </div>,
                  document.body
                )}
              </div>
            )}

          </div>
        </div>
      </nav>
      

    </>
  );
}