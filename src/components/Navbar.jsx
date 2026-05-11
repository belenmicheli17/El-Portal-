import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Home, Info, LayoutGrid, ChevronRight, 
  Sparkles, Briefcase, Building, Truck, Edit, User 
} from 'lucide-react';

export default function Navbar({ mostrarBotonCrear = false, mostrarBotonContacto = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsNavbarScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (page) => {
    setIsMenuOpen(false);
    
    let path;
    switch (page) {
      case 'landing': path = '/'; break;
      case 'inicio': path = '/inicio'; break;
      case 'ecosistema': path = '/ecosistema'; break;
      case 'novedades': path = '/novedades'; break;
      case 'bolsa-de-trabajo': path = '/bolsa-de-trabajo'; break;
      case 'perfil-profesional': path = '/perfil-profesional'; break;
      case 'perfil-clinica': path = '/perfil-clinica'; break;
      case 'perfil-proveedores': path = '/perfil-proveedores'; break;
      case 'editor': path = '/editor'; break;
      case 'editor-clinica': path = '/editor-clinica'; break;
      case 'editor-proveedores': path = '/editor-proveedores'; break;
      default: path = `/${page}`;
    }
    
    navigate(path);
  };

  // Función mejorada para deslizar y activar el efecto visual
  const scrollToContacto = () => {
    const contactoSection = document.getElementById('contacto');
    if (contactoSection) {
      // 1. Desplazamiento suave
      contactoSection.scrollIntoView({ behavior: 'smooth' });

      // 2. Disparar evento personalizado para que el componente "perfil" active el efecto visual
      // Esto permite que cualquier página (perfil-profesional, etc.) reaccione.
      const event = new CustomEvent('trigger-highlight-contacto');
      window.dispatchEvent(event);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] h-[72px] flex items-center px-8 md:px-10 transition-all duration-300 print:hidden ${
      isNavbarScrolled 
        ? 'bg-white/85 backdrop-blur-md shadow-md border-b border-gray-200' 
        : 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
    }`}>
      <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">
          
          <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-2xl tracking-tighter cursor-pointer" onClick={() => handleNav('landing')}>
              El Portal<span className="text-[#2D6A6A]">.</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
              <a href="#historia" className="hover:text-[#2D6A6A] transition-colors">¿Por qué unirte?</a>
              <a href="#ecosistema" className="hover:text-[#2D6A6A] transition-colors">Ecosistema</a>
          </div>
          
          <div className="flex items-center gap-4">
            
            {mostrarBotonContacto ? (
              <button 
                onClick={scrollToContacto}
                className="hidden md:block bg-[#2D6A6A] text-white rounded-full px-8 py-2.5 text-[13px] font-semibold shadow-lg hover:bg-[#1A3D3D] transition-all hover:-translate-y-0.5"
              >
                Contactar
              </button>
            ) : mostrarBotonCrear ? (
              <button 
                onClick={() => handleNav('editor')}
                className="hidden md:block bg-[#1A3D3D] text-white rounded-full px-7 py-2.5 text-[13px] font-semibold shadow-lg hover:bg-[#2D6A6A] transition-all hover:-translate-y-0.5"
              >
                Crear mi perfil
              </button>
            ) : null}

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
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 py-3 border-b border-gray-50 mb-2 mt-2 text-left">Perfiles Públicos</p>
                      <button onClick={() => handleNav('perfil-profesional')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><User className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Perfil Profesional</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => handleNav('perfil-clinica')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Building className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Perfil Clínica</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => handleNav('perfil-proveedores')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Truck className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Perfil Proveedores</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 py-3 border-b border-gray-50 mb-2 mt-2 text-left">Editores / Gestión</p>
                      <button onClick={() => handleNav('editor')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F7F7] rounded-xl transition-colors group"><div className="flex items-center gap-3"><Edit className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Editor Profesional</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
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
}