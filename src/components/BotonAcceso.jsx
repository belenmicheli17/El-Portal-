import React from 'react';
import { Stethoscope, LogIn } from 'lucide-react';

// Botón compartido de acceso: una mitad "Registrate" (esmeralda) y otra "Iniciar sesión" (blanca).
// Se usa igual en la Sala de Espera y en la Navbar del resto del sitio.
export default function BotonAcceso({ onRegistro, onLogin, loginAbierto = false }) {
  return (
    <div className="flex items-stretch rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
      {/* Mitad izquierda: registro de profesionales */}
      <button
        type="button"
        onClick={onRegistro}
        className="flex items-center gap-2 bg-[#2D6A6A] text-white px-4 md:px-5 py-2.5 text-[12px] md:text-[13px] font-bold hover:bg-[#1A3D3D] transition-all duration-300 ease-in-out"
      >
        <Stethoscope className="w-4 h-4 hidden md:block" strokeWidth={2.3} />
        <span className="md:hidden">Registrate</span>
        <span className="hidden md:inline">¿Sos veterinario/a? Registrate</span>
      </button>

      {/* Mitad derecha: inicio de sesión */}
      <button
        type="button"
        onClick={onLogin}
        className={`flex items-center gap-2 px-4 md:px-5 py-2.5 text-[12px] md:text-[13px] font-bold text-[#1A3D3D] border-y border-r border-gray-200 transition-all duration-300 ease-in-out ${
          loginAbierto ? 'bg-gray-200' : 'bg-[#F4F7F7] hover:bg-gray-200'
        }`}
      >
        <LogIn className="w-4 h-4" strokeWidth={2.3} />
        <span>Iniciar sesión</span>
      </button>
    </div>
  );
}