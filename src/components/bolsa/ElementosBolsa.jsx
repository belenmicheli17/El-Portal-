import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Lock } from 'lucide-react';

// Pills para elegir una o varias opciones
export function SelectorPills({ opciones, seleccion, onCambio, multiple = true, maximo = null }) {
  const lista = opciones.map((o) => (typeof o === 'string' ? { id: o, label: o } : o));
  const elegidas = multiple ? (seleccion || []) : [seleccion];

  const tocar = (id) => {
    if (!multiple) { onCambio(id); return; }
    if (elegidas.includes(id)) { onCambio(elegidas.filter((x) => x !== id)); return; }
    if (maximo && elegidas.length >= maximo) return;
    onCambio([...elegidas, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {lista.map((o) => {
        const activa = elegidas.includes(o.id);
        const bloqueada = multiple && maximo && !activa && elegidas.length >= maximo;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => tocar(o.id)}
            aria-pressed={activa}
            disabled={bloqueada}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold border shadow-sm transition-all duration-300 ease-in-out ${
              activa
                ? 'bg-[#2D6A6A]/10 border-[#2D6A6A] text-[#1A3D3D]'
                : bloqueada
                  ? 'bg-white border-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A]/60 hover:-translate-y-0.5'
            }`}
          >
            {activa && <Check className="w-3.5 h-3.5 text-[#2D6A6A]" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Título de cada bloque de los formularios
export function CampoBolsa({ titulo, requerido, ayuda, error, children }) {
  return (
    <div className="mb-7">
      <p className="text-[14px] font-bold text-[#1A3D3D] mb-1">
        {titulo} {requerido && <span className="text-red-500">*</span>}
      </p>
      {ayuda && <p className="text-[13px] text-[#666666] mb-3">{ayuda}</p>}
      {!ayuda && <div className="mb-3" />}
      {children}
      {error && <p className="text-[12px] font-semibold text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// Fondo oscuro con la ventana encima
export function VentanaBolsa({ abierta, onCerrar, children, ancho = 'max-w-lg' }) {
  if (!abierta) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-[#1A3D3D]/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200" onClick={onCerrar}>
      <div
        className={`bg-white w-full ${ancho} rounded-t-[28px] sm:rounded-[28px] p-6 md:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto font-['Inter']`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F4F7F7] text-[#666666] hover:text-[#1A3D3D] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

// Cartel para quien no inició sesión (o no puede hacer esa acción)
export function CartelRegistro({ abierto, onCerrar, motivo = 'publicar' }) {
  const navigate = useNavigate();
  const textos = {
    publicar: 'Para publicar en la Bolsa de Trabajo tenés que tener tu perfil en el Portal.',
    contacto: 'El contacto de cada publicación lo ven solo los profesionales y clínicas registrados.',
    postular: 'Para postularte necesitás tu perfil en el Portal. Lo usás también como currículum.'
  };
  return (
    <VentanaBolsa abierta={abierto} onCerrar={onCerrar} ancho="max-w-md">
      <div className="w-12 h-12 rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center mb-4">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] leading-tight mb-2">Creá tu perfil en 5 minutos</h3>
      <p className="text-[14px] text-[#666666] leading-relaxed mb-6">{textos[motivo] || textos.publicar} Es gratis.</p>
      <button type="button" onClick={() => navigate('/login', { state: { registro: true } })} className="w-full bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-colors mb-2">
        Crear mi perfil
      </button>
      <button type="button" onClick={() => navigate('/login')} className="w-full bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
        Ya tengo cuenta
      </button>
    </VentanaBolsa>
  );
}

// Cartel para cuentas registradas que todavía no están verificadas
export function CartelVerificacion({ abierto, onCerrar }) {
  const navigate = useNavigate();
  return (
    <VentanaBolsa abierta={abierto} onCerrar={onCerrar} ancho="max-w-md">
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] leading-tight mb-2">Tu cuenta está en revisión</h3>
      <p className="text-[14px] text-[#666666] leading-relaxed mb-6">
        Apenas verifiquemos tu matrícula vas a poder publicar y postularte en la Bolsa de Trabajo. Mientras tanto podés seguir armando tu perfil.
      </p>
      <button type="button" onClick={() => navigate('/ecosistema')} className="w-full bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
        Ir a mi cuenta
      </button>
    </VentanaBolsa>
  );
}
