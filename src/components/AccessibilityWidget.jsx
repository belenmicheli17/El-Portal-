import React, { useEffect, useState, useRef } from 'react';
import {
  X, PersonStanding, ZoomIn, ZoomOut, Palette, Type, RotateCcw, 
  ExternalLink, ZapOff, MinusSquare
} from 'lucide-react';

const FONT_SIZES = ['normal', 'grande'];

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [readingGuideY, setReadingGuideY] = useState(0);
  const widgetRef = useRef(null); // Referencia para detectar clics fuera del widget
  
  // Estado para saber si el cartel de cookies está visible
  const [hasCookiesBanner, setHasCookiesBanner] = useState(() => !localStorage.getItem('cookieConsent'));
  
  // Cargamos ajustes desde localStorage para que persistan entre páginas
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    return saved ? JSON.parse(saved) : {
      fontSizeIndex: 0,
      grayscale: false,
      dyslexiaFont: false,
      highlightLinks: false,
      stopAnimations: false,
      readingGuide: false
    };
  });

  // Escuchamos cambios en las cookies para mover el widget dinámicamente
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || e.key === 'cookieConsent') {
        setHasCookiesBanner(!localStorage.getItem('cookieConsent'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cerrar widget al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Aplicar configuraciones globales
  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    
    // Aplicar clases al body para que afecten a toda la web
    document.body.classList.toggle('links-highlighted', settings.highlightLinks);
    document.body.classList.toggle('stop-animations-active', settings.stopAnimations);
    
    document.body.classList.remove('font-size-grande');
    const size = FONT_SIZES[settings.fontSizeIndex];
    if (size === 'grande') document.body.classList.add('font-size-grande');
    
    document.body.classList.toggle('dyslexia-font-active', settings.dyslexiaFont);
  }, [settings]);

  // Lógica de la guía de lectura
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (settings.readingGuide) setReadingGuideY(e.clientY);
    };
    if (settings.readingGuide) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  const toggleSetting = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  
  const increaseFontSize = () => setSettings(s => ({ ...s, fontSizeIndex: Math.min(s.fontSizeIndex + 1, FONT_SIZES.length - 1) }));
  const decreaseFontSize = () => setSettings(s => ({ ...s, fontSizeIndex: Math.max(s.fontSizeIndex - 1, 0) }));
  
  const resetSettings = () => {
    setSettings({
      fontSizeIndex: 0,
      grayscale: false,
      dyslexiaFont: false,
      highlightLinks: false,
      stopAnimations: false,
      readingGuide: false
    });
  };

  useEffect(() => {
    const styleId = 'accessibility-styles-v4';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        /* ========================================================================= */
        /* TAMAÑO: GRANDE */
        /* ========================================================================= */
        
        /* 1. FALLBACKS GENÉRICOS (por si un texto no tiene clases de Tailwind) */
        body.font-size-grande p, body.font-size-grande span, body.font-size-grande a, body.font-size-grande li { font-size: 20px !important; line-height: 1.6 !important; }
        body.font-size-grande h4, body.font-size-grande h3 { font-size: 26px !important; }
        body.font-size-grande h2 { font-size: 32px !important; line-height: 1.2 !important; }
        body.font-size-grande h1 { font-size: 40px !important; line-height: 1.1 !important; }

        /* 2. ESCALA TAILWIND (Ordenada de menor a mayor para respetar la jerarquía responsiva) */
        body.font-size-grande [class*="text-[8px]"], body.font-size-grande [class*="text-[9px]"], body.font-size-grande [class*="text-[10px]"] { font-size: 12px !important; }
        body.font-size-grande [class*="text-[11px]"] { font-size: 14px !important; }
        body.font-size-grande [class*="text-xs"], body.font-size-grande [class*="text-[12px]"], body.font-size-grande [class*="text-[13px]"] { font-size: 16px !important; }
        body.font-size-grande [class*="text-sm"], body.font-size-grande [class*="text-[14px]"], body.font-size-grande [class*="text-[15px]"] { font-size: 18px !important; }
        body.font-size-grande [class*="text-base"] { font-size: 20px !important; }
        body.font-size-grande [class*="text-lg"], body.font-size-grande [class*="text-[16px]"] { font-size: 22px !important; }
        body.font-size-grande [class*="text-xl"] { font-size: 26px !important; }
        body.font-size-grande [class*="text-2xl"] { font-size: 30px !important; }
        body.font-size-grande [class*="text-3xl"] { font-size: 34px !important; }
        
        /* TÍTULOS EXTRA GRANDES (Protegidos de ser encogidos por h1 o h2) */
        body.font-size-grande [class*="text-4xl"] { font-size: 40px !important; line-height: 1.1 !important; }
        body.font-size-grande [class*="text-5xl"] { font-size: 52px !important; line-height: 1.1 !important; }
        body.font-size-grande [class*="text-6xl"] { font-size: 64px !important; line-height: 1.1 !important; }
        body.font-size-grande [class*="text-7xl"] { font-size: 76px !important; line-height: 1.1 !important; }
        body.font-size-grande [class*="text-8xl"] { font-size: 100px !important; line-height: 1.1 !important; }

        /* ========================================= */
        /* PROTECCIÓN EXCLUSIVA DEL NAVBAR           */
        /* ========================================= */
        body.font-size-grande nav {
          align-items: center !important;
        }
        body.font-size-grande nav div {
          align-items: center !important;
        }
        
        /* Limitar crecimiento extremo en Navbar para evitar que se rompa */
        body.font-size-grande nav [class*="text-"], body.font-size-grande nav a, body.font-size-grande nav button, body.font-size-grande nav span { 
          font-size: 13px !important; 
          line-height: normal !important;
        }

        /* Proteger logo del Navbar para que no se achique */
        body.font-size-grande nav [class*="text-2xl"] {
          font-size: 24px !important;
        }

        /* ========================================= */
        /* PROTECCIÓN ABSOLUTA DEL WIDGET            */
        /* ========================================= */
        /* Esto asegura que las opciones no se desalineen ni crezcan cuando activamos la letra grande */
        body.font-size-grande .accessibility-widget-container p, 
        body.font-size-grande .accessibility-widget-container span,
        body.font-size-grande .accessibility-widget-container button,
        body.font-size-grande .accessibility-widget-container div { 
          line-height: normal !important; 
        }
        body.font-size-grande .accessibility-widget-container [class*="text-[10px]"] { font-size: 10px !important; }
        body.font-size-grande .accessibility-widget-container [class*="text-[13px]"] { font-size: 13px !important; }
        body.font-size-grande .accessibility-widget-container [class*="text-xs"] { font-size: 12px !important; }

        /* Fuente Accesible */
        body.dyslexia-font-active, body.dyslexia-font-active * { 
          font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important; 
        }

        /* Resaltar Enlaces */
        body.links-highlighted a { 
          background-color: #FFFF00 !important; 
          color: #000000 !important; 
          text-decoration: underline !important;
          outline: 3px solid #FFD700 !important;
          font-weight: 800 !important;
        }

        /* Detener Animaciones */
        body.stop-animations-active * { 
          animation: none !important; 
          transition: none !important; 
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const ToggleSwitch = ({ active }) => (
    <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 shrink-0 ${active ? 'bg-[#2D6A6A]' : 'bg-gray-300'}`}>
      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
  );

  return (
    <div className="accessibility-widget-container" ref={widgetRef}>
      {/* Guía de lectura (línea roja) */}
      {settings.readingGuide && (
        <div 
          className="fixed left-0 w-full h-1 bg-red-500 z-[10001] pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)] hidden md:block"
          style={{ top: `${readingGuideY}px` }}
        ></div>
      )}

      {/* Capa de escala de grises */}
      {settings.grayscale && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9998]" 
          style={{ backdropFilter: 'grayscale(100%)', backgroundColor: 'transparent' }}
        ></div>
      )}

      {/* BOTÓN DEL WIDGET */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`fixed left-5 z-[10000] w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 ease-in-out text-white hover:scale-110 active:scale-95
          ${isOpen ? 'bg-red-500 rotate-90' : 'bg-[#1A3D3D]'} 
          ${hasCookiesBanner ? 'bottom-40 md:bottom-28' : 'bottom-5'}
        `}
      >
        {isOpen ? <X /> : <PersonStanding size={28} />}
      </button>

      {/* PANEL DEL WIDGET */}
      {isOpen && (
        <div 
          className={`fixed left-5 z-[9999] w-[calc(100vw-40px)] md:w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 p-5 animate-in fade-in duration-300 text-left overflow-y-auto max-h-[70vh] transition-all ease-in-out
            ${hasCookiesBanner ? 'bottom-[220px] md:bottom-[180px]' : 'bottom-20 md:bottom-24'}
          `}
        >
          
          <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accesibilidad</p>
            <button 
              onClick={resetSettings} 
              className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors px-2 py-1 bg-red-50 rounded-lg shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Restablecer
            </button>
          </div>

          <div className="space-y-1">
            <div className="bg-[#F4F7F7] p-3 rounded-xl border border-gray-100 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <ZoomIn className="w-4 h-4 text-[#1A3D3D]" />
                  <span className="text-[13px] font-bold text-[#1A3D3D]">Tamaño de texto</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <button onClick={decreaseFontSize} disabled={settings.fontSizeIndex === 0} className="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-[#1A3D3D] disabled:opacity-20 shrink-0"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-[10px] font-black text-[#1A3D3D] uppercase tracking-widest">{FONT_SIZES[settings.fontSizeIndex].replace('-', ' ')}</span>
                    <button onClick={increaseFontSize} disabled={settings.fontSizeIndex === FONT_SIZES.length - 1} className="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-[#1A3D3D] disabled:opacity-20 shrink-0"><ZoomIn className="w-4 h-4" /></button>
                </div>
            </div>

            <OptionRow icon={<ExternalLink className="w-4 h-4" />} label="Resaltar enlaces" active={settings.highlightLinks} onClick={() => toggleSetting('highlightLinks')} />
            <OptionRow icon={<Type className="w-4 h-4" />} label="Fuente legible" active={settings.dyslexiaFont} onClick={() => toggleSetting('dyslexiaFont')} />
            
            {/* Oculto en móviles (solo visible desde tamaño 'md' en adelante) */}
            <div className="hidden md:block">
              <OptionRow icon={<MinusSquare className="w-4 h-4" />} label="Guía de lectura" active={settings.readingGuide} onClick={() => toggleSetting('readingGuide')} />
            </div>
            
            <OptionRow icon={<ZapOff className="w-4 h-4" />} label="Detener animaciones" active={settings.stopAnimations} onClick={() => toggleSetting('stopAnimations')} />
            <OptionRow icon={<Palette className="w-4 h-4" />} label="Escala de grises" active={settings.grayscale} onClick={() => toggleSetting('grayscale')} />
          </div>
        </div>
      )}
    </div>
  );

  function OptionRow({ icon, label, active, onClick }) {
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100 group gap-2 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 p-2 rounded-lg transition-colors ${active ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}>
            {icon}
          </div>
          <span className="text-[13px] font-bold text-gray-700 leading-tight truncate">{label}</span>
        </div>
        <ToggleSwitch active={active} />
      </button>
    );
  }
}