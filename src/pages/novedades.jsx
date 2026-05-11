import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, ChevronRight, Home, User, LayoutGrid, Briefcase, 
  Facebook, Instagram, Linkedin, Mail, Globe, Heart, ShieldCheck, 
  Sparkles, Edit, Info,
  Building, Truck
} from 'lucide-react';

// ==========================================
// COMPONENTE WIDGET DE ACCESIBILIDAD INTEGRADO
// ==========================================
const AccessibilityWidget = () => {
  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <button 
        className="bg-[#2D6A6A] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#1A3D3D] hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Opciones de Accesibilidad"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:animate-pulse">
          <circle cx="12" cy="5" r="2"/>
          <path d="m3 10 4-1 5 2 5-2 4 1"/>
          <path d="m12 16-3 6"/>
          <path d="m12 16 3 6"/>
          <path d="M12 11v5"/>
        </svg>
      </button>
    </div>
  );
};

export default function Novedades() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const footerRef = useRef(null);
  const navigate = useNavigate();

  // Configuración de fuentes, estilos y observadores
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    const handleScroll = () => setIsNavbarScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      window.removeEventListener('scroll', handleScroll);
      if (footerRef.current) observer.unobserve(footerRef.current);
    };
  }, []);

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative flex flex-col">
      
      {/* WIDGET DE ACCESIBILIDAD */}
      <div className={`transition-all duration-300 ease-in-out ${isFooterVisible ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <AccessibilityWidget />
      </div>

      
      {/* CONTENIDO PRINCIPAL: PRÓXIMAMENTE */}
      <main className="flex-grow flex items-center justify-center px-8 md:px-10 py-20 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2D6A6A] opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-[#1A3D3D] opacity-5 rounded-full blur-[80px] pointer-events-none hidden md:block"></div>
        
        <div className="max-w-[700px] w-full bg-white rounded-[40px] p-10 md:p-16 text-center border border-gray-100 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
          
          <div className="w-20 h-20 bg-[#1A3D3D] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#1A3D3D]/20 transform rotate-12 hover:rotate-0 transition-all duration-500">
            <Sparkles className="w-10 h-10 text-[#4DB6AC]" />
          </div>

          <p className="font-['Montserrat'] text-[#2D6A6A] font-black text-xs md:text-sm uppercase tracking-[0.3em] mb-4">
            Espacio en construcción
          </p>

          <h1 className="text-4xl md:text-5xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter uppercase leading-tight mb-6">
            Novedades y Casos Clínicos
          </h1>

          <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed max-w-lg mx-auto mb-10">
            Muy pronto habilitaremos esta sección para compartir artículos, noticias y casos destacados de la comunidad veterinaria.
          </p>

          <div className="bg-[#F4F7F7] rounded-[24px] p-6 md:p-8 flex flex-col items-center border border-gray-100">
            <h3 className="text-[#1A3D3D] font-bold text-base mb-2">
              ¿Tenés algo interesante para compartir?
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Si querés publicar un artículo o caso clínico cuando lancemos la sección, escribinos.
            </p>
            
            <a 
              href="mailto:elportalveterinario.arg@gmail.com?subject=Quiero%20publicar%20un%20artículo%20en%20El%20Portal"
              className="bg-[#1A3D3D] text-white py-3.5 px-8 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#2D6A6A] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              <Mail className="w-4 h-4" /> ¿Te gustaría publicar acá?
            </a>
          </div>

        </div>
      </main>

  

      {/* BANNER DE COOKIES */}
      {showCookieBanner && !isFooterVisible && (
        <div className="fixed bottom-0 left-0 w-full bg-[#0a1e1e]/95 backdrop-blur-md border-t border-white/10 z-[100] py-4 px-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up shadow-2xl">
          <div className="flex items-center gap-3 text-white/60 text-[11px] font-medium text-center md:text-left">
            <Info size={14} className="text-[#2D6A6A] shrink-0" />
            <p>Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptás nuestros términos.</p>
          </div>
          <button 
            onClick={() => setShowCookieBanner(false)}
            className="bg-[#2D6A6A] hover:bg-white text-white hover:text-[#1A3D3D] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
          >
            Entendido
          </button>
        </div>
      )}

    </div>
  );
}