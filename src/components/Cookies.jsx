import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Clock, Users, Globe, Target,
  BookOpen, Briefcase, Package, Newspaper,
  Star, Search, Building2, ShieldCheck, ArrowUpRight, Sparkles,
  Award, Bell, Heart, Building, Truck, User, MapPin, Activity, ArrowRight,
  Chrome, Eye, EyeOff, Lock, Stethoscope, Info, Tag, ShoppingCart,
  CheckCircle2, TrendingUp, Network, ShoppingBag, Mail,
  Menu, X, Home, LayoutGrid, Edit, Facebook, Instagram, Linkedin
} from 'lucide-react';

const Navbar = ({ onNavigate, mostrarBotonCrear = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);

  // Efecto para escuchar el scroll de la ventana
  useEffect(() => {
    const handleScroll = () => {
      // Si scrolleamos más de 10px, activamos el estado
      setIsNavbarScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para navegar y cerrar el menú móvil automáticamente
  const handleNav = (path) => {
    setIsMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      console.log('Navegando a:', path);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] h-[72px] flex items-center px-8 md:px-10 transition-all duration-300 print:hidden ${
      isNavbarScrolled 
        ? 'bg-white/85 backdrop-blur-md shadow-md border-b border-gray-200' 
        : 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
    }`}>
      <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">
          
          {/* Logo */}
          <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-2xl tracking-tighter cursor-pointer" onClick={() => handleNav('landing')}>
              El Portal<span className="text-[#2D6A6A]">.</span>
          </div>

          {/* Enlaces versión Escritorio */}
          <div className="hidden lg:flex items-center gap-8 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
              <a href="#historia" className="hover:text-[#2D6A6A] transition-colors">¿Por qué unirte?</a>
              <a href="#ecosistema" className="hover:text-[#2D6A6A] transition-colors">Ecosistema</a>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Botón Call to Action Escritorio (Condicional) */}
            {mostrarBotonCrear && (
              <button 
                onClick={() => handleNav('editor')}
                className="hidden md:block bg-[#1A3D3D] text-white rounded-full px-7 py-2.5 text-[13px] font-semibold shadow-lg hover:bg-[#2D6A6A] transition-all hover:-translate-y-0.5"
              >
                Crear mi perfil
              </button>
            )}

            {/* Menú Hamburguesa + Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="w-10 h-10 md:w-11 md:h-11 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-[#1A3D3D] hover:bg-[#F4F7F7] transition-all active:scale-95"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(26,61,61,0.15)] border border-gray-100 overflow-y-auto max-h-[80vh] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-3">
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 py-3 border-b border-gray-50 mb-2 text-left">Navegación</p>
                      <button onClick={() => handleNav('inicio')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><Home className="w-4 h-4 text-gray-400 group-hover:text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Inicio</span></button>
                      <button onClick={() => handleNav('landing')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><Info className="w-4 h-4 text-gray-400 group-hover:text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Entrada</span></button>
                      <button onClick={() => handleNav('ecosistema')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><LayoutGrid className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Repertorio Clínico</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => handleNav('novedades')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Novedades</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => handleNav('bolsa-de-trabajo')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Briefcase className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Bolsa de Trabajo</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 py-3 border-b border-gray-50 mb-2 mt-2 text-left">Perfiles</p>
                      <button onClick={() => handleNav('perfil-clinica')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Building className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Perfil Clínica</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => handleNav('perfil-proveedor')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Truck className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Perfil Proveedor</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 py-3 border-b border-gray-50 mb-2 mt-2 text-left">Editores</p>
                      <button onClick={() => handleNav('editor-clinica')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Edit className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Editor Clínica</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => handleNav('editor-proveedores')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Edit className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Editor Proveedores</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                    
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
      </div>
    </nav>
  );
};

const Footer = ({ onNavigate }) => {
  // Función auxiliar para unificar la navegación
  const handleNavClick = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      console.log('Navegando a:', path);
    }
  };

  return (
    <footer className="w-full bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] relative overflow-hidden pt-12 pb-8 text-left print:hidden mt-12">
      <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>
      <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10 text-left">
        
        {/* BLOQUE DE CONTENIDO SUPERIOR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-8 mb-6 text-left">
          
          {/* COLUMNA 1: Branding */}
          <div className="md:col-span-1 text-left">
            <button onClick={() => handleNavClick('/')} className="text-white font-['Montserrat'] font-bold text-2xl mb-4 text-left leading-none cursor-pointer block hover:opacity-80 transition-opacity">
              El Portal<span className="text-white/40">.</span>
            </button>
            <p className="text-white/50 text-sm md:text-[13px] leading-relaxed font-medium text-left">
              La red profesional exclusiva para medicina veterinaria de alta complejidad. Conectando talento con vocación.
            </p>
          </div>

          {/* COLUMNA 2: Repertorio */}
          <div>
            <h4 className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] mb-4">Repertorio</h4>
            <ul className="space-y-2 text-white/40 text-sm">
              <li><button onClick={() => handleNavClick('/ecosistema')} className="hover:text-white transition-colors">Cursos y Seminarios</button></li>
              <li><button onClick={() => handleNavClick('/ecosistema')} className="hover:text-white transition-colors">Insumos</button></li>
               <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Novedades</button></li>
            </ul>
          </div>

          {/* COLUMNA 3: Comunidad */}
          <div>
            <h4 className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] mb-4">Comunidad</h4>
            <ul className="space-y-2 text-white/40 text-sm">
            <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Profesionales</button></li>
             <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Clínicas</button></li>
             <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Proveedores</button></li>
            <li><button onClick={() => handleNavClick('/bolsa-de-trabajo')} className="hover:text-white transition-colors">Bolsa de Trabajo</button></li>
             
            </ul>
          </div>

          {/* COLUMNA 4: Contacto */}
          <div>
            <h4 className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] mb-4">Soporte</h4>
            <ul className="space-y-2 text-white/40 text-sm leading-none">
              <li>
                <a href="mailto:elportalveterinario.arg@gmail.com" className="flex items-center gap-3 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 shrink-0" /> 
                  <span className="truncate">elportalveterinario.arg@gmail.com</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-4 h-4" /> elportal.vet
              </li>
            </ul>
          </div>
        </div>

        {/* FILA DE CRÉDITOS UNIFICADA */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-x-8 mb-10 pt-4">
          
          {/* Iconos Redes */}
          <div className="flex gap-3 shrink-0">
            <a href="#" aria-label="Facebook" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Instagram" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Linkedin" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
          
          {/* Copyright */}
          <div className="text-white/40 text-[11px] md:text-xs font-medium leading-relaxed whitespace-nowrap shrink-0">
            <p>&copy; {new Date().getFullYear()} El Portal. Todos los derechos reservados.</p>
          </div>

          {/* Legales */}
          <div className="text-white/40 text-[11px] md:text-xs font-medium flex items-center gap-2 shrink-0">
            <button onClick={() => handleNavClick('/terminos-y-condiciones')} className="underline hover:text-white transition-colors">Términos</button>
            <span className="opacity-20">•</span>
            <button onClick={() => handleNavClick('/politica-de-privacidad')} className="underline hover:text-white transition-colors">Privacidad</button>
          </div>
        </div>

        {/* BARRA INFERIOR FINAL - Letras en blanco */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] text-center md:text-left">creado por Belén M. Arenas</p>
          <div className="text-white text-[11px] md:text-[10px] uppercase tracking-[0.3em] font-medium flex items-center gap-1.5 group cursor-default">
            <span>Hecho con</span>
            <Heart className="w-3 h-3 text-red-400/80 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 fill-current" aria-hidden="true" />
            <span>en Argentina.</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-[0.3em] leading-none text-center md:text-left">Única plataforma veterinaria oficial</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Cookies = ({ isFooterVisible = false }) => {
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [isRendered, setIsRendered] = useState(false); // Para la animación de entrada inicial
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Revisamos si el usuario ya aceptó las cookies en esta u otras páginas
    const checkConsent = () => {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowCookieBanner(true);
        // Pequeño delay para que la animación de entrada sea suave al cargar la página
        setTimeout(() => setIsRendered(true), 100); 
      } else {
        setShowCookieBanner(false);
      }
    };

    checkConsent();

    // 2. Sincronizamos en tiempo real por si el usuario tiene varias pestañas abiertas
    const handleStorageChange = (e) => {
      if (e.key === 'cookieConsent' && e.newValue === 'true') {
        setShowCookieBanner(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Limpieza del evento al desmontar el componente
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAccept = () => {
    // Guardamos la preferencia de forma permanente en el navegador para todo el sitio
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieBanner(false);
    
    // Forzamos un evento storage manual para asegurar la sincronización inmediata
    window.dispatchEvent(new Event('storage'));
  };

  // Si el banner está cerrado definitivamente, no renderizamos nada
  if (!showCookieBanner) return null;

  return (
    <div 
      className={`fixed left-0 w-full bg-[#0a1e1e]/95 backdrop-blur-md border-t border-white/10 z-[100] py-4 px-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl transition-transform duration-500 ease-in-out
        ${isRendered && !isFooterVisible ? 'translate-y-0' : 'translate-y-full'} 
        bottom-0
      `}
    >
      <div className="flex items-center gap-3 text-white/60 text-[11px] font-medium text-center md:text-left">
        <Info size={14} className="text-[#2D6A6A] shrink-0" />
        <p>
          Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptás nuestros{' '}
          <button 
            onClick={() => navigate('/terminos-y-condiciones')}
            className="underline hover:text-white text-white/80 font-bold transition-colors outline-none"
          >
            términos
          </button>
          .
        </p>
      </div>
      <button 
        onClick={handleAccept}
        className="bg-[#2D6A6A] hover:bg-white text-white hover:text-[#1A3D3D] px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-lg shrink-0"
      >
        Entendido
      </button>
    </div>
  );
};

// ==========================================
// DATA Y COMPONENTE: TARJETAS ESTRATÉGICAS
// ==========================================
const strategicCardsData = [
  {
    id: 'clinicas',
    icon: Building2,
    title: 'Centros Veterinarios',
    subtitle: 'Atraé nuevos pacientes y convertite en el centro de derivación de tu región.',
    features: [
      { icon: MapPin, title: 'Visibilidad ante tutores:', desc: 'Que los dueños de mascotas encuentren tu clínica por zona, exploren tus servicios y conozcan a tu staff de profesionales.' },
      { icon: TrendingUp, title: 'Rentabilizá tu equipamiento:', desc: 'Atraé derivaciones directas de colegas que necesitan tus equipos de alta complejidad o quirófano.' },
      { icon: Briefcase, title: 'Reclutamiento ágil:', desc: 'Publicá búsquedas en nuestra Bolsa de Trabajo y encontrá rápidamente a los especialistas exactos que tu equipo necesita.' }
    ],
    btnText: 'Unir mi clínica',
    btnAction: '/editor-clinica',
    btnClass: 'bg-[#1A3D3D] hover:bg-[#2D6A6A]'
  },
  {
    id: 'proveedores',
    icon: Package,
    title: 'Proveedores B2B',
    subtitle: 'Tu catálogo frente a los que toman las decisiones de compra.',
    features: [
      { icon: Target, title: 'Tráfico 100% calificado:', desc: 'Dejá de pagar publicidad masiva. Tu oferta llega exclusivamente a profesionales matriculados y directores médicos.' },
      { icon: Network, title: 'Networking de Ventas:', desc: 'Acortá el embudo de ventas conectando de forma directa a tus distribuidores con las clínicas.' },
      { icon: ShoppingBag, title: 'Exhibición de Alta Gama:', desc: 'Mostrá aparatología, instrumental o insumos destacando ofertas exclusivas directas de fábrica.' }
    ],
    btnText: 'Unir mi empresa',
    btnAction: '/editor-proveedores',
    btnClass: 'bg-[#2D6A6A] hover:bg-[#1A3D3D]'
  },
  {
    id: 'proximamente',
    icon: Sparkles,
    title: 'Próximamente',
    subtitle: 'Un nuevo espacio estratégico para potenciar tu alcance en la red.',
    features: [
      { icon: Star, title: 'Nuevas herramientas:', desc: 'Estamos desarrollando funciones exclusivas para expandir tu impacto.' },
      { icon: Users, title: 'Más conexión:', desc: 'Nuevas formas de interactuar con el ecosistema veterinario nacional.' },
      { icon: Award, title: 'Beneficios únicos:', desc: 'Mantenete alerta para acceder a oportunidades diseñadas a tu medida.' }
    ],
    btnText: 'Muy pronto',
    btnAction: '#',
    btnClass: 'bg-[#666666] cursor-default opacity-80'
  }
];

const StrategicCard = ({ data, isMobile, onNavigate }) => {
  const { icon: Icon, title, subtitle, features, btnText, btnAction, btnClass } = data;
  return (
    <div className={`bg-white p-6 md:px-8 md:py-8 rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all flex flex-col items-start text-left relative overflow-hidden group ${
      isMobile 
        ? "ecosystem-card w-[82vw] max-w-[380px] snap-center shrink-0 duration-300 ease-out scale-[0.90] opacity-50 translate-y-2 blur-[2px]" 
        : "w-full duration-500 ease-out hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center shadow-sm shrink-0">
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <h3 className="text-[20px] md:text-2xl font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">{title}</h3>
      </div>
      <h4 className="text-[#2D6A6A] font-bold text-[14px] leading-[1.6] mb-5">{subtitle}</h4>
      <ul className="flex flex-col gap-4 mb-6 md:mb-8 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="block">
            <p className="text-[#333333] text-[14px] md:text-[15px] leading-[1.6] font-medium">
              <feature.icon className="w-[18px] h-[18px] text-[#2D6A6A] inline-block mr-1.5 relative -top-[2px]" />
              <strong className="text-[#1A3D3D] font-bold">{feature.title}</strong> {feature.desc}
            </p>
          </li>
        ))}
      </ul>
      <button 
        onClick={() => btnAction !== '#' && onNavigate(btnAction)} 
        className={`${btnClass} border border-transparent text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 ease-in-out ${btnAction !== '#' ? 'hover:-translate-y-1 hover:shadow-lg' : ''} flex items-center gap-2 w-full md:w-auto justify-center mt-auto`}
      >
        {btnText} {btnAction !== '#' && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ==========================================
// COMPONENTE: ZIG-ZAG STORYTELLING
// ==========================================
const ZigZagSection = ({ title, subtitle, text, image, isReversed, icon: Icon, bgClass = "bg-white", badge, isDark = false, mobileMockup }) => {
  return (
    <section className={`py-12 md:py-20 overflow-hidden ${bgClass}`}>
      <div className="max-w-[1100px] mx-auto px-8 md:px-10">
        <div className={`flex flex-col gap-8 lg:gap-16 items-center ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          <div className="flex-1 flex flex-col items-start text-left">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-5 md:mb-6 shadow-sm ${isDark ? 'bg-white/10 text-white' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className={`${isDark ? 'text-white/60' : 'text-[#2D6A6A]'} font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] mb-3`}>{subtitle}</h3>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black mb-5 tracking-tighter font-['Montserrat'] leading-[1.1] ${isDark ? 'text-white' : 'text-[#1A3D3D]'}`}>
              {title}
            </h2>
            <p className={`${isDark ? 'text-white/70' : 'text-[#333333]'} text-[14px] md:text-[16px] leading-[1.6] font-medium`}>
              {text}
            </p>
          </div>
          <div className="flex-1 w-full relative group mt-4 lg:mt-0 flex justify-center">
            <div className={`relative w-full ${mobileMockup ? 'hidden md:block' : 'block'}`}>
              <div className={`absolute inset-0 bg-gradient-to-tr rounded-[32px] md:rounded-[40px] transform group-hover:scale-105 transition-transform duration-700 ${isDark ? 'from-black/40' : 'from-[#1A3D3D]/20'} to-transparent`}></div>
              <img 
                src={image} 
                alt={title} 
                className="w-full h-[320px] md:h-[380px] object-cover rounded-[32px] md:rounded-[40px] shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-700 relative z-10"
              />
              {badge && (
                <div className={`absolute ${isReversed ? '-left-4 md:-left-8' : '-right-4 md:-right-8'} -bottom-6 z-20 animate-float-delayed`}>
                  {badge}
                </div>
              )}
            </div>
            {mobileMockup && (
              <div className="block md:hidden w-full max-w-[360px]">
                {mobileMockup}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// COMPONENTE: TÍTULO MÁQUINA DE ESCRIBIR
// ==========================================
const TypewriterTitle = () => {
  const [charIndex, setCharIndex] = useState(0);
  const text1 = "Enfocate en curar.";
  const text2 = "Nosotros en conectarte.";
  const totalChars = text1.length + text2.length;

  useEffect(() => {
    const initialDelay = charIndex === 0 ? 400 : 0;
    if (charIndex < totalChars) {
      const timeout = setTimeout(() => {
        setCharIndex(prev => prev + 1);
      }, initialDelay || 45); 
      return () => clearTimeout(timeout);
    }
  }, [charIndex, totalChars]);

  const displayedText1 = text1.slice(0, charIndex);
  const displayedText2 = charIndex > text1.length ? text2.slice(0, charIndex - text1.length) : "";

  return (
    <h1 className="text-[38px] md:text-[54px] lg:text-[62px] font-black text-[#1A3D3D] mb-4 md:mb-6 tracking-tighter font-['Montserrat'] leading-[1.05]">
      {displayedText1}
      {charIndex <= text1.length && (
        <span className="inline-block w-1 h-[32px] md:h-[48px] bg-[#2D6A6A] ml-1 animate-pulse align-middle"></span>
      )}
      <br />
      <span className="text-[#4DB6AC]">
        {displayedText2}
      </span>
      {charIndex > text1.length && (
        <span className="inline-block w-1 h-[32px] md:h-[48px] bg-[#2D6A6A] ml-1 animate-pulse align-middle"></span>
      )}
    </h1>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: LANDING PAGE
// ==========================================
export default function LandingPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [activeRole, setActiveRole] = useState('profesional');
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);
  const navigate = useNavigate();
  const footerRef = useRef(null);
  const mobileScrollRef = useRef(null);

  useEffect(() => {
    // Fuentes y animaciones CSS base
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes float-fast {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 2s; }
      .animate-float-fast { animation: float-fast 4s ease-in-out infinite; animation-delay: 1s; }
      
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      
      /* CLASE PARA OCULTAR SCROLLBAR PERO PERMITIR SCROLL */
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
    `;
    document.head.appendChild(style);

    // Observer para el footer (Cookies)
    const observerFooter = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.5 } 
    );
    if (footerRef.current) observerFooter.observe(footerRef.current);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      if (footerRef.current) observerFooter.unobserve(footerRef.current);
    };
  }, []);

  // OBSERVER DE EFECTO FOCO PARA LAS TARJETAS MÓVILES
  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.ecosystem-card');
    const observerCards = new IntersectionObserver((entries) => {
      if (window.innerWidth < 768) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('scale-[0.90]', 'opacity-50', 'translate-y-2', 'blur-[2px]');
            entry.target.classList.add('scale-100', 'opacity-100', 'translate-y-0', 'blur-none');
          } else {
            entry.target.classList.remove('scale-100', 'opacity-100', 'translate-y-0', 'blur-none');
            entry.target.classList.add('scale-[0.90]', 'opacity-50', 'translate-y-2', 'blur-[2px]');
          }
        });
      }
    }, {
      root: container,
      rootMargin: '0px -15% 0px -15%', // Ayuda a que solo reaccione la tarjeta realmente centrada
      threshold: 0.45 // Umbral menor para asegurar que se dispare incluso si la tarjeta es muy ancha
    });

    cards.forEach(card => observerCards.observe(card));

    return () => observerCards.disconnect();
  }, []);

  // LÓGICA DE SCROLL INFINITO (LOOP REAL) PARA MÓVIL
  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container || window.innerWidth >= 768) return;

    // Colocamos el scroll inicial en el set del MEDIO para poder ir en ambas direcciones
    setTimeout(() => {
      if (container) {
        container.classList.remove('snap-x', 'snap-mandatory');
        container.scrollLeft = container.scrollWidth / 3;
        setTimeout(() => container.classList.add('snap-x', 'snap-mandatory'), 50);
      }
    }, 150);

    const handleScroll = () => {
      const setWidth = container.scrollWidth / 3;
      
      // Si el usuario scrollea hacia atrás y entra al PRIMER set
      if (container.scrollLeft <= 5) {
        container.classList.remove('snap-x', 'snap-mandatory');
        container.scrollLeft += setWidth; // Salto invisible al medio
        setTimeout(() => container.classList.add('snap-x', 'snap-mandatory'), 50);
      } 
      // Si el usuario scrollea hacia adelante y entra al TERCER set
      else if (container.scrollLeft >= (setWidth * 2) - 5) {
        container.classList.remove('snap-x', 'snap-mandatory');
        container.scrollLeft -= setWidth; // Salto invisible al medio
        setTimeout(() => container.classList.add('snap-x', 'snap-mandatory'), 50);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let path;
    switch (page) {
      case 'landing': path = '/'; break;
      case 'ecosistema': path = '/ecosistema'; break;
      case 'terminos': path = '/terminos-y-condiciones'; break;
      case 'privacidad': path = '/politica-de-privacidad'; break;
      default: path = `/${page}`;
    }
    navigate(path);
  };

  const getRoleSubtext = () => {
    if (activeRole === 'clinica') return "Mostrá tu infraestructura y recibí derivaciones.";
    if (activeRole === 'proveedor') return "Conectá tu catálogo directo con los profesionales.";
    return "Únete a la red profesional de Argentina.";
  };

  const handleEmpezaAcaClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setHighlightForm(true);
      setTimeout(() => { setHighlightForm(false); }, 2500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] overflow-x-hidden relative selection:bg-[#2D6A6A] selection:text-white antialiased">
      
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.025] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
      <Navbar onNavigate={handleNav} mostrarBotonCrear={true} />

      <div>
        {/* 1. HERO SECTION */}
        <main className="relative w-full bg-white overflow-hidden">
          
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 bg-white"></div>
            <div className="absolute top-[-1%] right-[-25%] w-[70vw] h-[70vw] bg-[#2D6A6A]/[0.15] rounded-full blur-[100px] mix-blend-multiply md:hidden"></div>
            <div className="absolute bottom-[-30%] right-[-20%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] bg-[#1A3D3D]/[0.23] rounded-full blur-[150px] mix-blend-multiply"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[45vw] h-[80vw] md:h-[45vw] bg-[#2D6A6A]/[0.23] rounded-full blur-[120px] mix-blend-multiply"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[70vw] md:w-[40vw] h-[70vw] md:h-[40vw] bg-[#4DB6AC]/[0.23] rounded-full blur-[130px] mix-blend-multiply opacity-80"></div>
          </div>

          <div className="relative z-10 w-full pt-[96px] pb-10 md:pt-[100px] md:pb-12">
            <div className="max-w-[1100px] mx-auto px-8 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-12 items-center">
              
              <div className="flex flex-col items-start text-left lg:pt-2">
                <div className="mb-4 inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200/50 px-3 py-1.5 rounded-full shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-[#2D6A6A] animate-pulse"></span>
                  <span className="text-[#2D6A6A] font-bold text-[11px] uppercase tracking-[0.2em] leading-none">Red exclusiva de veterinaria argentina</span>
                </div>
                
                <TypewriterTitle />
                
                <p className="text-[15px] md:text-[15px] lg:text-[17px] text-gray-600 font-medium leading-relaxed mb-2 lg:mb-6 max-w-[500px]">
                  Tu perfil profesional, siempre vigente. Que clínicas y colegas te encuentren por tu talento, sin la presión de crear contenido diario.
                </p>
                
                <div className="hidden lg:flex items-center gap-3 text-[11px] font-bold text-[#2D6A6A] uppercase tracking-widest cursor-pointer group">
                  <a href="#ecosistema-completo" className="flex items-center gap-2 group-hover:text-[#1A3D3D] transition-colors duration-300">
                    Conocer más sobre ser parte <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              <div className="relative group max-w-[420px] mx-auto w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#2D6A6A]/20 to-transparent rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className={`relative bg-white/95 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 md:px-8 md:py-7 flex flex-col items-center transition-all duration-700 ease-out ${highlightForm ? 'scale-[1.03] shadow-[0_0_80px_rgba(45,106,106,0.3)] ring-4 ring-[#4DB6AC] ring-offset-4 ring-offset-[#F4F7F7]' : 'scale-100 shadow-[0_30px_60px_rgba(26,61,61,0.08)]'}`}>
                  
                  <h2 className="text-[22px] md:text-[22px] font-black text-[#1A3D3D] mb-1 font-['Montserrat'] text-center leading-tight">Crea tu cuenta, es gratis.</h2>
                  <p className="text-[#666666] text-[13px] font-medium mb-4 text-center transition-all duration-300">{getRoleSubtext()}</p>
                  
                  <div className="w-full bg-[#F4F7F7] p-1 rounded-[16px] flex items-center mb-4 border border-gray-100">
                    <button 
                      onClick={() => setActiveRole('profesional')}
                      className={`flex-1 py-1.5 text-[10px] md:text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ease-in-out ${activeRole === 'profesional' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
                    >
                      <User className="w-3 h-3 inline-block mr-1 -mt-0.5" /> Profesional
                    </button>
                    <button 
                      onClick={() => setActiveRole('clinica')}
                      className={`flex-1 py-1.5 text-[10px] md:text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ease-in-out ${activeRole === 'clinica' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
                    >
                      <Building2 className="w-3 h-3 inline-block mr-1 -mt-0.5" /> Clínica
                    </button>
                    <button 
                      onClick={() => setActiveRole('proveedor')}
                      className={`flex-1 py-1.5 text-[10px] md:text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ease-in-out ${activeRole === 'proveedor' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
                    >
                      <Package className="w-3 h-3 inline-block mr-1 -mt-0.5" /> Empresa
                    </button>
                  </div>

                  {!isFormExpanded && (
                    <button 
                      onClick={() => setIsFormExpanded(true)}
                      className="md:hidden w-full bg-[#2D6A6A] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] transition-all duration-300 ease-in-out shadow-md hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 mt-1"
                    >
                      Continuar registro <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  <div className={`w-full grid transition-all duration-500 ease-in-out ${isFormExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:grid-rows-[1fr] md:opacity-100'}`}>
                    <div className="overflow-hidden w-full flex flex-col items-center">
                      <div className="w-full pt-1">
                        
                        <button className="flex items-center justify-center gap-2.5 w-full border border-gray-200 py-2.5 rounded-2xl bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[14px] mb-4 transition-all duration-300 ease-in-out hover:bg-[#e2e8e8] hover:translate-y-0.5">
                            <Chrome className="w-4 h-4 text-red-500" /> Continuar con Google
                        </button>
                        
                        <div className="flex items-center gap-3 w-full mb-4 text-[#666666]">
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <span className="text-[9px] font-bold uppercase tracking-widest">o con tu email</span>
                          <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className="w-full space-y-2.5 mb-5">
                          <div className="relative">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                            <input 
                              type="text" 
                              placeholder={activeRole === 'profesional' ? "Tu nombre completo" : "Nombre de la institución/empresa"} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/5 outline-none font-medium text-[14px] text-[#333333] transition-all bg-[#F9FBFA]" 
                            />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                            <input 
                              type="email" 
                              placeholder={activeRole === 'profesional' ? "Tu email profesional" : "Email de contacto"} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/5 outline-none font-medium text-[14px] text-[#333333] transition-all bg-[#F9FBFA]" 
                            />
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                            <input 
                              type="password" 
                              placeholder="Crea una contraseña" 
                              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-100 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/5 outline-none font-medium text-[14px] text-[#333333] transition-all bg-[#F9FBFA]" 
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#2D6A6A] transition-colors duration-300"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleNav(activeRole === 'profesional' ? 'editor' : activeRole === 'clinica' ? 'editor-clinica' : 'editor-proveedores')} 
                          className="w-full bg-[#2D6A6A] text-white px-6 py-3 md:py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          Crear cuenta de {activeRole} <ChevronRight className="w-4 h-4" />
                        </button>
                        
                        <p className="text-[#666666] text-[10px] md:text-[10px] text-center mt-3 w-full">
                          Al registrarte, aceptás nuestros <span onClick={() => navigate('/terminos-y-condiciones')} className="underline cursor-pointer hover:text-[#2D6A6A] transition-colors duration-300">Términos</span> y la <span onClick={() => navigate('/politica-de-privacidad')} className="underline cursor-pointer hover:text-[#2D6A6A] transition-colors duration-300">Política de Privacidad</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* 1.5 MOCKUPS ÉPICOS (Solo PC) */}
        <section className="relative w-full bg-[#F4F7F7] py-12 md:py-20 hidden md:block">
          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-white to-transparent"></div>
          <div className="max-w-[1050px] mx-auto px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              
              {/* MOCKUP CLÍNICAS */}
              <div className="h-full">
                <div className="bg-white border border-gray-100 rounded-[32px] md:rounded-[40px] p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(45,106,106,0.15)] h-full relative flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-[#2D6A6A] uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" /> Clínicas
                    </span>
                    <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[8px] font-bold border border-red-200">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      GUARDIA 24HS
                    </span>
                  </div>
                  <div className="relative mb-8">
                    <div className="w-full h-[90px] rounded-[20px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-gray-100 shadow-sm">
                      <img src="https://images.unsplash.com/photo-1584820927498-cafe8c11a686?auto=format&fit=crop&w=400&q=80" alt="Hospital San Marcos" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A3D3D]/80 via-[#1A3D3D]/20 to-transparent"></div>
                    </div>
                    <div className="absolute -bottom-2 right-2 bg-[#789A9A] p-1.5 rounded-xl border-[3px] border-white shadow-sm text-white z-20">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-[12px] bg-white p-1 border border-gray-100 shadow-md z-20 flex items-center justify-center">
                       <div className="w-full h-full bg-blue-50 rounded-[8px] flex items-center justify-center text-blue-600">
                          <Activity className="w-5 h-5" />
                       </div>
                    </div>
                  </div>
                  <div className="pl-1 mb-4">
                    <h3 className="text-[16px] font-bold text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">
                      Hospital San Marcos
                    </h3>
                    <p className="text-[#666666] text-[10px] font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#2D6A6A]" /> CABA y GBA Norte
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full mt-auto mb-4">
                    <div className="bg-[#F9FBFA] px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-50"><Building className="w-3.5 h-3.5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-[#666666] uppercase tracking-widest leading-none mb-0.5">Infraestructura</p>
                        <p className="text-[11px] font-bold text-[#1A3D3D] leading-none">Tomógrafo y Quirófano</p>
                      </div>
                    </div>
                    <div className="bg-[#F9FBFA] px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-50"><Users className="w-3.5 h-3.5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-[#666666] uppercase tracking-widest leading-none mb-0.5">Equipo Médico</p>
                        <p className="text-[11px] font-bold text-[#1A3D3D] leading-none">+15 Especialistas</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-[#1A3D3D] text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all duration-300 ease-in-out hover:bg-[#2D6A6A] hover:-translate-y-1 hover:shadow-md flex items-center justify-center gap-1.5">
                    Ver Institución <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* MOCKUP PROFESIONALES */}
              <div className="z-20 h-full">
                <div className="bg-white border border-gray-100 rounded-[32px] md:rounded-[40px] p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(45,106,106,0.15)] h-full relative flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-start mb-5">
                    <span className="text-[10px] font-bold text-[#2D6A6A] uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Profesionales
                    </span>
                  </div>
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-[20px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-gray-100 shadow-sm mx-auto">
                      <img src="https://images.unsplash.com/photo-1594824436951-7f12bc3ac92e?auto=format&fit=crop&w=300&q=80" alt="Dra. Arenas" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#789A9A] p-1.5 rounded-xl border-[3px] border-white shadow-sm text-white z-20">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="bg-yellow-50/80 text-yellow-700 text-[8px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-2.5 border border-yellow-100 uppercase tracking-widest mx-auto">
                      <Award className="w-3 h-3 fill-current" /> Referente Destacada
                  </div>
                  <h3 className="text-lg font-bold text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">Dra. Mercedes Arenas</h3>
                  <p className="text-[#2D6A6A] text-[9px] font-black uppercase tracking-[0.2em] mb-4">Cirujana Traumatóloga</p>
                  
                  <div className="flex flex-col gap-2 w-full mt-auto mb-4">
                    <div className="bg-[#F9FBFA] px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-50"><MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-[#666666] uppercase tracking-widest leading-none mb-0.5">Zona de atención</p>
                        <p className="text-[11px] font-bold text-[#1A3D3D] leading-none">CABA y GBA Norte</p>
                      </div>
                    </div>
                    <div className="bg-[#F9FBFA] px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-50"><Stethoscope className="w-3.5 h-3.5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-[#666666] uppercase tracking-widest leading-none mb-0.5">Modalidad</p>
                        <p className="text-[11px] font-bold text-[#1A3D3D] leading-none">Derivaciones y Quirófano</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-[#2D6A6A] text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-1.5">
                    Ver trayectoria <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* MOCKUP PROVEEDORES */}
              <div className="h-full">
                <div className="bg-white border border-gray-100 rounded-[32px] md:rounded-[40px] p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(45,106,106,0.15)] h-full relative flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-start mb-5">
                    <span className="text-[10px] font-bold text-[#2D6A6A] uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" /> Proveedores
                    </span>
                  </div>
                  
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-[20px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-gray-100 shadow-sm mx-auto">
                      <img src="https://images.unsplash.com/photo-1581594549595-35f6edc7b762?auto=format&fit=crop&w=300&q=80" alt="Mindray Equipamiento" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#789A9A] p-1.5 rounded-xl border-[3px] border-white shadow-sm text-white z-20">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="bg-blue-50/80 text-blue-700 text-[8px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-2.5 border border-blue-100 uppercase tracking-widest mx-auto">
                      <Tag className="w-3 h-3 fill-current" /> Distribuidor Oficial
                  </div>
                  <h3 className="text-lg font-bold text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">Mindray Argentina</h3>
                  <p className="text-[#2D6A6A] text-[9px] font-black uppercase tracking-[0.2em] mb-4">Catálogo Mayorista B2B</p>
                  
                  <div className="flex flex-col gap-2 w-full mt-auto mb-4">
                    <div className="bg-[#F9FBFA] px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-2.5 relative">
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm z-10">Oferta</div>
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-50"><ShoppingCart className="w-3.5 h-3.5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-[#666666] uppercase tracking-widest leading-none mb-0.5">Aparatología</p>
                        <p className="text-[11px] font-bold text-[#1A3D3D] leading-none">Ecógrafo Doppler</p>
                      </div>
                    </div>
                    <div className="bg-[#F9FBFA] px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-50"><Truck className="w-3.5 h-3.5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-[#666666] uppercase tracking-widest leading-none mb-0.5">Logística</p>
                        <p className="text-[11px] font-bold text-[#1A3D3D] leading-none">Venta directa y envíos</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-[#F4F7F7] text-[#1A3D3D] font-bold py-3.5 rounded-2xl text-[9px] uppercase tracking-widest transition-all duration-300 ease-in-out hover:bg-[#e2e8e8] hover:-translate-y-1 hover:shadow-sm flex items-center justify-center gap-1.5">
                    Contactar Distribuidor
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2. STORYTELLING ZIG-ZAG */}
        <div id="historia">
          <ZigZagSection 
            bgClass="bg-white"
            icon={Clock}
            subtitle="Atemporalidad"
            title="Foco en tu vocación, no en el algoritmo."
            text={
              <>
                El Portal está diseñado para que no pierdas tiempo en redes sociales que exigen creación constante y no están pensadas para profesionales de la salud. Aquí, tu perfil es atemporal: no necesitás publicar historias para que te deriven pacientes; si un colega o un tutor busca tu especialidad, te encuentra al instante, sin esfuerzo ni mantenimiento de tu parte.
                <span className="block mt-2">
                  Este mismo ecosistema potencia a institutions y proveedores: posiciona tus instalaciones para multiplicar consultas y expone tu equipamiento ante una red de <strong>profesionales</strong> que toman decisiones.
                </span>
              </>
            }
            image="/1.%20profesion.jpg"
            isReversed={false}
            badge={
              <div className="bg-white p-4 rounded-[28px] shadow-xl flex items-center gap-4 border border-gray-100">
                <div className="w-10 h-10 bg-[#2D6A6A]/10 rounded-[20px] flex items-center justify-center text-[#2D6A6A]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest">Presencia 24/7</p>
                  <p className="text-[14px] font-black text-[#1A3D3D]">Sin depender del algoritmo</p>
                </div>
              </div>
            }
            mobileMockup={
              <div className="z-20 animate-float">
                <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-md relative overflow-hidden flex flex-col items-center text-center w-full">
                  <div className="relative mb-5 mt-1">
                    <div className="w-28 h-28 rounded-[28px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-gray-100 shadow-md">
                      <img src="https://images.unsplash.com/photo-1594824436951-7f12bc3ac92e?auto=format&fit=crop&w=300&q=80" alt="Dra. Arenas" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-[#789A9A] p-2 rounded-2xl border-[3px] border-white shadow-lg text-white z-20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-yellow-50/80 text-yellow-700 text-[9px] font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 mb-4 border border-yellow-100 shadow-sm uppercase tracking-widest">
                      <Award className="w-3.5 h-3.5 fill-current" /> Referente Destacada
                  </div>
                  <h3 className="text-2xl font-bold text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">Dra. Mercedes Arenas</h3>
                  <p className="text-[#2D6A6A] text-xs font-black uppercase tracking-[0.2em] mb-5">Cirujana Traumatóloga</p>
                  
                  <div className="flex flex-col gap-2 w-full mb-6">
                    <div className="bg-[#F9FBFA] px-4 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-100"><MapPin className="w-4 h-4 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-[#666666] uppercase tracking-widest">Zona de atención</p>
                        <p className="text-[12px] font-bold text-[#1A3D3D]">CABA y GBA Norte</p>
                      </div>
                    </div>
                    <div className="bg-[#F9FBFA] px-4 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-100"><Stethoscope className="w-4 h-4 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-[#666666] uppercase tracking-widest">Modalidad</p>
                        <p className="text-[12px] font-bold text-[#1A3D3D]">Derivaciones y Quirófano</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-[#2D6A6A] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl shadow-md flex items-center justify-center gap-2">
                    Ver trayectoria <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            }
          />

          <ZigZagSection 
            bgClass="bg-[#1A3D3D]"
            isDark={true}
            icon={Users}
            subtitle="Comunidad"
            title="Rompé con el aislamiento del consultorio."
            text="El Portal te permite mantenerte conectado con los referentes de tu área. Encontrá fácilmente el contacto exacto que necesitás para derivar un paciente, trabajar en equipo o impulsar tu carrera. Una red sólida te abre puertas a oportunidades reales, desde nuevas alianzas hasta invitaciones para disertar en cursos de tu especialidad."
            image="/2.consultorio.png"
            isReversed={true}
            badge={
              <div className="bg-white/10 backdrop-blur-xl p-4 rounded-[28px] shadow-xl flex items-center gap-4 border border-white/10 text-left">
                <div className="flex -space-x-3">
                  <img className="w-8 h-8 rounded-full border-2 border-[#1A3D3D] object-cover" src="https://images.unsplash.com/photo-1594824436951-7f12bc3ac92e?auto=format&fit=crop&w=100&q=80" alt="avatar doctora" />
                  <img className="w-8 h-8 rounded-full border-2 border-[#1A3D3D] object-cover" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80" alt="avatar doctora" />
                  <div className="w-8 h-8 rounded-full border-2 border-[#1A3D3D] bg-[#2D6A6A] flex items-center justify-center text-[10px] font-bold text-white">+5</div>
                </div>
                <div className="pr-2">
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-none mb-1">Networking</p>
                  <p className="text-[14px] font-black text-white leading-tight">Nueva propuesta</p>
                </div>
              </div>
            }
          />

          <ZigZagSection 
            bgClass="bg-white"
            icon={Star}
            subtitle="Presencia Virtual"
            title="Tu trayectoria, verificada y en un solo lugar."
            text={
              <>
                <strong>Existir en el mundo digital hoy es obligatorio,</strong> pero estar en el lugar correcto lo cambia todo. El Portal funciona como un filtro de máxima precisión: centralizá tus servicios y trayectoria, la infraestructura de tu clínica o tu catálogo en un entorno exclusivo. Asegurate de que, cuando alguien te busque, tu perfil actúe como tu carta de presentación definitiva ante la audiencia exacta que necesita contactarte.
              </>
            }
            image="/3.perfil-verificado.png"
            isReversed={false}
            badge={
              <div className="bg-white p-4 rounded-[28px] shadow-xl flex items-center gap-4 border border-gray-100 text-left">
                <div className="w-10 h-10 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest">Prestigio Médico</p>
                  <p className="text-[14px] font-black text-[#1A3D3D]">Trayectoria validada</p>
                </div>
              </div>
            }
          />
        </div>

        {/* 2.5 SECCIÓN SPLIT SCREEN (SOCIOS ESTRATÉGICOS) */}
        <section id="ecosistema-completo" className="pt-8 pb-12 md:py-20 bg-[#1A3D3D] relative overflow-hidden border-t border-white/5">
          <div className="max-w-[1200px] mx-auto px-8 md:px-10 relative z-10 text-center mb-2 md:mb-10">
            <h3 className="text-[#4DB6AC] font-bold text-[11px] uppercase tracking-[0.3em] mb-2 text-center">Socios Estratégicos</h3>
            <h2 className="text-3xl md:text-5xl font-black text-white font-['Montserrat'] leading-[1.1] tracking-tighter text-center">
              Un ecosistema donde<br/>todos crecen.
            </h2>
          </div>
          
          <div className="w-full max-w-[1100px] mx-auto relative z-10">
            
            {/* Contenedor PC (Grid, 3 cards estáticas) */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 px-0">
              {strategicCardsData.map((data, idx) => (
                <StrategicCard key={`pc-${idx}`} data={data} isMobile={false} onNavigate={navigate} />
              ))}
            </div>

            {/* Contenedor Móvil (Flex scroll horizontal - Loop real 3 sets) */}
            <div 
              id="strategic-cards-container" 
              ref={mobileScrollRef}
              className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 px-[5vw]"
              style={{ scrollBehavior: 'auto' }} // Importante para el salto invisible
            >
              {[0, 1, 2].map((setIndex) => (
                <React.Fragment key={`set-${setIndex}`}>
                  {strategicCardsData.map((data, idx) => (
                    <StrategicCard key={`mob-${setIndex}-${idx}`} data={data} isMobile={true} onNavigate={navigate} />
                  ))}
                </React.Fragment>
              ))}
            </div>

          </div>
        </section>

        {/* 3. ECOSISTEMA BENTO GRID */}
        <section id="ecosistema" className="py-12 md:py-20 bg-[#F4F7F7] relative overflow-hidden">
          <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10 text-center">
            
            <div className="text-center mb-10 md:mb-16">
              <h3 className="text-[#2D6A6A] font-bold text-[11px] uppercase tracking-[0.3em] mb-4 text-center">Contactos e información al instante</h3>
              <h2 className="text-3xl md:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tighter text-center">
                Espacios diseñados para<br/>agilizar tu práctica diaria.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 bg-white border border-gray-100 p-8 md:p-10 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_30px_rgba(45,106,106,0.05)] transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4 text-left">
                    <Briefcase className="w-6 h-6 text-[#2D6A6A]" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Bolsa de Trabajo</h3>
                  </div>
                  <p className="text-[#333333] leading-[1.6] font-medium mb-8 text-[14px] md:text-[16px] max-w-lg text-left">
                    Accedé a oportunidades laborales de primer nivel. Conectamos talento con centros veterinarios que buscan especialidades específicas, simplificando el reclutamiento y garantizando el match perfecto para tu crecimiento.
                  </p>
                </div>
                <div className="bg-[#F4F7F7] border border-gray-100 rounded-[28px] p-6 w-full md:w-[85%] transform group-hover:-translate-y-2 transition-transform duration-300 relative text-left">
                  <div className="flex justify-between items-start mb-6 text-left">
                    <div className="flex gap-3 items-center text-left">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-left"><Building2 className="w-5 h-5 text-[#2D6A6A]" /></div>
                      <div className="text-left">
                        <p className="font-bold text-[14px] text-[#1A3D3D]">Clínica San Marcos</p>
                        <p className="text-[10px] text-[#666666] uppercase tracking-widest font-semibold">Busca Especialista</p>
                      </div>
                    </div>
                    <span className="bg-[#2D6A6A] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider text-left">NUEVO</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 text-left">
                    <div className="flex gap-2 text-left">
                      <span className="bg-white border border-gray-200 text-[11px] px-3 py-1 rounded-full text-[#333333] font-bold text-left">Cardiología</span>
                      <span className="bg-white border border-gray-200 text-[11px] px-3 py-1 rounded-full text-[#333333] font-bold text-left">Part-Time</span>
                    </div>
                    <button className="bg-white border-2 border-[#1A3D3D] text-[#1A3D3D] px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ease-in-out hover:bg-[#F4F7F7] hover:translate-y-0.5 whitespace-nowrap text-left">
                      Postularme
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 md:row-span-2 bg-[#1A3D3D] border border-white/5 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-2xl transition-all duration-300 flex flex-col group overflow-hidden text-left">
                <div className="flex items-center gap-3 mb-4 text-left">
                  <Activity className="w-6 h-6 text-white" />
                  <h3 className="text-2xl font-bold font-['Montserrat'] text-white leading-tight">Servicios & Terapias holísticas</h3>
                </div>
                <p className="text-white/70 leading-[1.6] font-medium text-[14px] md:text-[16px] text-left mb-8">
                  Damos visibilidad a profesionales y servicios especializados difíciles de hallar: fisioterapia, terapias holísticas, etología y nutrición natural. Conectamos todo el ecosistema de bienestar.
                </p>
                <div className="mt-auto flex flex-col gap-3 relative z-10 text-left">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 group-hover:-translate-y-1 flex justify-between items-center cursor-pointer">
                    <span className="text-white font-bold text-[14px]">Rehabilitación</span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 group-hover:-translate-y-1 flex justify-between items-center cursor-pointer delay-75">
                    <span className="text-white font-bold text-[14px]">Etología Clínica</span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 group-hover:-translate-y-1 flex justify-between items-center cursor-pointer delay-150">
                    <span className="text-white font-bold text-[14px]">Fisioterapia</span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 bg-white border border-gray-100 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_30px_rgba(45,106,106,0.05)] transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-4 text-left">
                  <BookOpen className="w-6 h-6 text-[#2D6A6A]" />
                  <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Cursos</h3>
                </div>
                
                <div className="w-full bg-[#F4F7F7] rounded-[24px] p-5 mb-6 border border-gray-100 transform group-hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Bell className="w-12 h-12 text-[#1A3D3D]" /></div>
                  <div className="flex items-center gap-2 mb-2 text-left">
                    <span className="bg-[#2D6A6A] text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse text-left">Disponible</span>
                  </div>
                  <p className="text-[#1A3D3D] font-bold text-[13px] leading-tight mb-1 text-left">Ecografía Doppler Avanzada</p>
                  <p className="text-[#666666] text-[10px] font-medium italic text-left">Inicia el 15 de Abril</p>
                </div>
                <p className="text-[#333333] leading-[1.6] font-medium text-[14px] text-left">
                  Mantenete al tanto de las ultimas novedades sobre cursos y charlas. Encontrá fácilmente quién dicta el próximo seminario, fechas y modalidades.
                </p>
              </div>

              <div className="md:col-span-1 bg-white border border-gray-100 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_30px_rgba(45,106,106,0.05)] transition-all duration-300 group text-left">
                <div className="flex items-center gap-3 mb-4 text-left">
                  <Package className="w-6 h-6 text-[#2D6A6A]" />
                  <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Insumos</h3>
                </div>
                <div className="bg-[#F4F7F7] rounded-[24px] p-5 mb-6 border border-gray-100 flex items-center gap-4 text-left">
                  <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-[#2D6A6A]"><Truck className="w-5 h-5" /></div>
                  <div className="flex-1 text-left">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div className="h-full w-[70%] bg-[#2D6A6A]"></div>
                    </div>
                    <p className="text-[10px] font-bold text-[#666666] uppercase tracking-widest text-left">En camino • Prótesis</p>
                  </div>
                </div>
                <p className="text-[#333333] leading-[1.6] font-medium text-[14px] text-left">
                  Directorio optimizado para contactar proveedores verificados de insumos médicos complejos y aparatología.
                </p>
              </div>

              <div className="md:col-span-1 bg-[#1A3D3D] border border-white/5 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between text-left">
                <div className="text-left">
                  <div className="flex items-center gap-3 mb-4 text-left">
                    <Globe className="w-6 h-6 text-white" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-white">Grandes Animales</h3>
                  </div>
                  <p className="text-white/60 leading-[1.6] font-medium text-[14px] text-left">
                    Encontrá especialistas en medicina rural, equinos y bovinos. Conectamos talento equipado para el trabajo en campo donde la distancia ya no es un límite.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-left">
                  <span className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/5">Rural</span>
                  <span className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/5">Equinos</span>
                </div>
              </div>

              <div className="md:col-span-2 bg-[#2D6A6A]/5 border border-[#2D6A6A]/10 p-8 md:p-10 rounded-[32px] hover:bg-[#2D6A6A]/10 transition-all duration-300 flex flex-col md:flex-row gap-8 items-center text-left overflow-hidden group">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-4 text-left">
                    <Newspaper className="w-6 h-6 text-[#2D6A6A]" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Noticias</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-medium text-sm text-left">
                    Mantenete al día con los avances de la medicina veterinaria en Argentina. Un feed exclusivo para descubrir procedimientos innovadores y celebrar las hazañas de tus colegas.
                  </p>
                </div>
                <div className="w-full md:w-[50%] flex flex-col gap-4 relative z-10 text-left mt-2 md:mt-0">
                  <div className="bg-white p-5 rounded-2xl shadow-lg transform group-hover:-translate-y-1 transition-transform duration-300 text-left w-full">
                    <div className="flex gap-2 items-center mb-2 text-left">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-[#2D6A6A] uppercase tracking-widest font-black text-left">Tendencia</span>
                    </div>
                    <p className="font-bold text-[15px] leading-tight text-[#1A3D3D] text-left">Nueva técnica en cirugía de tejidos blandos. Casos de éxito.</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#2D6A6A]/10 text-left transition-all duration-500 w-full flex items-center justify-between cursor-pointer hover:shadow-md">
                    <p className="font-medium text-sm leading-tight text-gray-600 text-left">El Portal llega a los 10k miembros activos.</p>
                    <ArrowRight className="w-4 h-4 text-[#2D6A6A]/40 shrink-0 ml-4" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. CALL TO ACTION FINAL */}
        <section className="py-16 md:py-32 bg-white relative overflow-hidden text-center border-t border-gray-100">
          <div className="max-w-[800px] mx-auto px-8 md:px-10 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-[#1A3D3D] mb-6 font-['Montserrat'] tracking-tight">
              ¿Listo para darle a tu perfil el prestigio que merece?
            </h2>
            <p className="text-[#333333] text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto text-center leading-relaxed">
              Formá parte de la primera cartilla veterinaria que potencia tu visibilidad mientras vos te enfocás en tu profesion.
            </p>
            <button onClick={handleEmpezaAcaClick} className="bg-[#2D6A6A] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 mx-auto">
              Empeza acá
            </button>
          </div>
        </section>

        {/* FOOTER EXTERNO */}
        <div ref={footerRef}>
          <Footer onNavigate={handleNav} />
        </div>

      </div>

      <Cookies isFooterVisible={isFooterVisible} />
    </div>
  );
}