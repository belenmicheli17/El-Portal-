import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FooterSimple({ seccion = 'Portal' }) {
  const navigate = useNavigate();

  return (
    <footer className="w-full py-5 bg-gradient-to-r from-[#1A3D3D] via-[#2D6A6A] to-[#1A3D3D] shadow-[0_-4px_20px_rgba(45,106,106,0.15)] relative z-10 print:hidden">
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs font-medium text-white/70">
        <p>© {new Date().getFullYear()} El Portal Veterinario. Todos los derechos reservados.</p>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/terminos-y-condiciones')} className="hover:text-white transition-colors underline underline-offset-2">Términos</button>
          <span className="opacity-30">•</span>
          <button onClick={() => navigate('/politica-de-privacidad')} className="hover:text-white transition-colors underline underline-offset-2">Privacidad</button>
        </div>
        <p className="text-[#4DB6AC] font-bold tracking-wide">{seccion}</p>
      </div>
    </footer>
  );
}