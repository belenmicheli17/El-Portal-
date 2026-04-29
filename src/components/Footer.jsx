import React from 'react';
import { Mail, Globe, Facebook, Instagram, Linkedin, Heart, ShieldCheck } from 'lucide-react';

export default function Footer({ onNavigate }) {
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
        <div className="flex flex-row items-center justify-center gap-x-8 mb-10 pt-4">
          
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
          <p className="text-white font-bold text-[11px] md:text-[10px] uppercase tracking-[0.3em]">creado por Belén M. Arenas</p>
          <div className="text-white text-[11px] md:text-[10px] uppercase tracking-[0.3em] font-medium flex items-center gap-1.5 group cursor-default">
            <span>Hecho con</span>
            <Heart className="w-3 h-3 text-red-400/80 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 fill-current" aria-hidden="true" />
            <span>en Argentina.</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-[0.3em] leading-none">Única plataforma veterinaria oficial</span>
          </div>
        </div>
      </div>
    </footer>
  );
}