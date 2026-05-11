import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function Cookies({ isFooterVisible = false }) {
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
        className="bg-[#2D6A6A] hover:bg-white text-white hover:text-[#1A3D3D] px-6 py-2 rounded-xl text-[10px] font-black  tracking-widest transition-all shadow-lg shrink-0"
      >
        Entendido
      </button>
    </div>
  );
}
