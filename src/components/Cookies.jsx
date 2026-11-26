import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { prenderMedicion } from '../firebase';


export default function Cookies({ isFooterVisible = false }) {
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [isRendered, setIsRendered] = useState(false); // Para la animación de entrada inicial
  const navigate = useNavigate();


  useEffect(() => {
    // 1. Revisamos si el usuario ya aceptó las cookies en esta u otras páginas
    const checkConsent = () => {
      const consent = localStorage.getItem('cookieConsent');
      if (consent === 'true') prenderMedicion();
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
    prenderMedicion();
   
    // Forzamos un evento storage manual para asegurar la sincronización inmediata
    window.dispatchEvent(new Event('storage'));
  };


  // «Solo las esenciales»: no se prende la medición (y no le volvemos a preguntar)
  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'false');
    setShowCookieBanner(false);
  };

  // Si el banner está cerrado definitivamente, no renderizamos nada
  if (!showCookieBanner) return null;


  return (
    <div
      className={`fixed left-0 bottom-0 w-full bg-[#0a1e1e]/95 backdrop-blur-md border-t border-white/10 z-[100] px-4 py-3 md:px-8 md:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6 shadow-2xl font-['Inter'] transition-transform duration-500 ease-in-out
        ${isRendered && !isFooterVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <p className="flex items-center gap-2 text-white/70 text-[12px] md:text-[13px] font-medium">
        <Info size={14} className="text-[#2D6A6A] shrink-0" />
        <span>
          Usamos cookies para mejorar tu experiencia.{' '}
          <button
            onClick={() => navigate('/politica-de-privacidad')}
            className="underline hover:text-white text-white/90 font-semibold transition-colors outline-none"
          >
            Más info
          </button>
        </span>
      </p>
      <div className="flex items-center justify-end gap-4 shrink-0">
        <button
          onClick={handleReject}
          className="text-white/70 hover:text-white text-[12px] md:text-[13px] font-semibold transition-colors"
        >
          Solo las esenciales
        </button>
        <button
          onClick={handleAccept}
          className="bg-[#2D6A6A] hover:bg-white text-white hover:text-[#1A3D3D] px-5 py-1.5 rounded-xl text-[12px] md:text-[13px] font-semibold transition-all shrink-0"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
