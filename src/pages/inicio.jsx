import React, { useEffect, useState, useRef } from 'react';
// Importamos todos los iconos necesarios
import { 
  Menu, X, Heart, Facebook, Instagram, Linkedin, Mail, Globe, Info, ShieldCheck,
  Home, LayoutGrid, Sparkles, Briefcase, Edit, ChevronRight,
  Building, Truck
} from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const footerRef = useRef(null);

  // Mock de navegación (en un entorno real usarías useNavigate de react-router-dom)
  const navigate = (path) => console.log('Navegando a:', path);
  const setView = (view) => console.log('Cambiando vista a:', view);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);

    // Lógica para que las cookies no "pisen" el footer
    // Ajustamos el threshold a 0.5 para que no desaparezca apenas se asoma el footer
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.5 } 
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      if (footerRef.current) observer.unobserve(footerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] flex flex-col relative antialiased selection:bg-[#2D6A6A] selection:text-white">
      
      {/* Capa de textura de grano */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.025] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      

      {/* SECCIÓN CENTRAL - Aumentamos min-height para que el footer no se vea de entrada */}
      <main className="flex-grow flex items-center justify-center pt-[10px] min-h-[85vh]">
        <div className="relative z-10 text-center py-20">
          <h1 className="text-xl md:text-2xl font-black text-[#1A3D3D] tracking-[0.2em] font-['Montserrat'] uppercase opacity-60">
            Sitio en <span className="text-[#2D6A6A]">construcción</span>
          </h1>
          <div className="mt-4 h-[2px] w-10 bg-[#2D6A6A]/40 mx-auto rounded-full"></div>
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