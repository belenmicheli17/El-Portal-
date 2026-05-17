import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, Facebook, Instagram, Linkedin, Heart, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();

  // Función auxiliar para unificar la navegación y subir el scroll
  const handleNavClick = (path) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  return (
    <footer className="w-full bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] relative overflow-hidden pt-12 md:pt-10 pb-8 text-left print:hidden mt-0 font-['Inter']">
      <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>
      
      <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10 text-left">
        
        {/* BLOQUE DE CONTENIDO SUPERIOR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-8 mb-8 text-left">
          
          {/* COLUMNA 1: Branding */}
          <div className="md:col-span-1 text-left">
            <button onClick={() => handleNavClick('/')} className="text-white font-['Montserrat'] font-bold text-2xl mb-4 text-left leading-none cursor-pointer block hover:opacity-80 transition-opacity">
              El Portal<span className="text-white/40">.</span>
            </button>
            <p className="text-white/50 text-sm md:text-[13px] leading-relaxed font-medium text-left">
              La red profesional exclusiva para medicina veterinaria de alta complejidad. Conectando talento con vocación.
            </p>
          </div>

          {/* AGRUPACIÓN DE COLUMNA 2 Y 3 (Para que en móvil estén lado a lado) */}
          <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2 md:gap-8">
            
            {/* COLUMNA 2: Repertorio */}
            <div>
              <h4 className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] mb-4 font-['Montserrat']">Repertorio</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><button onClick={() => handleNavClick('/ecosistema')} className="hover:text-white transition-colors">Cursos y Seminarios</button></li>
                <li><button onClick={() => handleNavClick('/ecosistema')} className="hover:text-white transition-colors">Insumos</button></li>
                <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Novedades</button></li>
              </ul>
            </div>

            {/* COLUMNA 3: Comunidad */}
            <div>
              <h4 className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] mb-4 font-['Montserrat']">Comunidad</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Profesionales</button></li>
                <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Clínicas</button></li>
                <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors">Proveedores</button></li>
                <li><button onClick={() => handleNavClick('/bolsa-de-trabajo')} className="hover:text-white transition-colors">Bolsa de Trabajo</button></li>
              </ul>
            </div>

          </div>

          {/* COLUMNA 4: Contacto */}
          <div className="md:col-span-1">
            <h4 className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em] mb-4 font-['Montserrat']">Soporte</h4>
            <ul className="space-y-3 text-white/40 text-sm leading-none">
              <li>
                <a href="mailto:elportalveterinario.arg@gmail.com" className="flex items-start gap-3 hover:text-white transition-colors max-w-full">
                  <Mail className="w-4 h-4 shrink-0 mt-0.5" /> 
                  <span className="break-all leading-snug">elportalveterinario.arg@gmail.com</span>
                </a>
              </li>
              <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <Globe className="w-4 h-4 shrink-0" /> 
                <span>elportal.vet</span>
              </li>
            </ul>
          </div>
        </div>

        {/* FILA DE CRÉDITOS UNIFICADA - COMPACTADA */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-y-3 md:gap-x-8 mb-10 pt-4">
          
          {/* Iconos Redes compactados */}
          <div className="flex gap-2.5">
            <a href="#" aria-label="Facebook" className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all">
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a 
              href="https://www.instagram.com/portalveterinario.arg/" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram" 
              className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="#" aria-label="Linkedin" className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
          
          {/* Copyright */}
          <div className="text-white/40 text-[11px] md:text-xs font-medium leading-relaxed text-center">
            <p>&copy; {new Date().getFullYear()} El Portal. Todos los derechos reservados.</p>
          </div>

          {/* Legales */}
          <div className="text-white/40 text-[11px] md:text-xs font-medium flex items-center justify-center gap-2">
            <button onClick={() => handleNavClick('/terminos-y-condiciones')} className="underline hover:text-white transition-colors">Términos</button>
            <span className="opacity-20">•</span>
            <button onClick={() => handleNavClick('/politica-de-privacidad')} className="underline hover:text-white transition-colors">Privacidad</button>
          </div>
        </div>

        {/* BARRA INFERIOR FINAL - REDISEÑADA Y COMPACTADA */}
        <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-y-1.5 text-center md:flex-row md:justify-between md:gap-x-4 md:text-left">
          
          <p className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.1em] font-['Montserrat'] md:leading-none">creado por Belén M. Arenas</p>
          
          <div className="text-white text-[11px] md:text-[10px] uppercase tracking-[0.1em] font-bold flex items-center justify-center md:justify-start gap-1.5 group cursor-default font-['Montserrat']">
            <span>Hecho con</span>
            <Heart className="w-3 h-3 text-red-400/80 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 fill-current" aria-hidden="true" />
            <span>en Argentina.</span>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-2 text-white">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-[0.1em] leading-tight md:leading-none font-['Montserrat']">Única plataforma veterinaria oficial</span>
          </div>
        </div>
      </div>
    </footer>
  );
}