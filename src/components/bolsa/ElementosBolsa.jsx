import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Check, Lock, Search, ChevronDown, Loader2, AlertTriangle, Info } from 'lucide-react';
import { GRUPOS_AREAS } from '../../data/bolsaOpciones';



// Pills para elegir una o varias opciones
export function SelectorPills({ opciones, seleccion, onCambio, multiple = true, maximo = null, deshabilitado = false }) {
  const lista = opciones.map((o) => (typeof o === 'string' ? { id: o, label: o } : o));
  const elegidas = multiple ? (seleccion || []) : [seleccion];

  const tocar = (id) => {
    if (deshabilitado) return;
    if (!multiple) { onCambio(id); return; }
    if (elegidas.includes(id)) { onCambio(elegidas.filter((x) => x !== id)); return; }
    if (maximo && elegidas.length >= maximo) return;
    onCambio([...elegidas, id]);
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {lista.map((o) => {
        const activa = elegidas.includes(o.id);
        const bloqueada = deshabilitado || (multiple && maximo && !activa && elegidas.length >= maximo);
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
                  ? 'bg-white border-gray-100 text-gray-300 cursor-not-allowed shadow-none'
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

// Título de cada bloque de los formularios. "campo" sirve para que, si falta completarlo, la página baje hasta acá.
export function CampoBolsa({ titulo, requerido, ayuda, error, campo, children }) {
  return (
    <div className="mb-8 scroll-mt-28" data-campo={campo || undefined}>
      <p className="text-[16px] md:text-[17px] font-bold text-[#1A3D3D] mb-1 font-['Montserrat']">
        {titulo} {requerido && <span className="text-red-500">*</span>}
      </p>
      {ayuda && <p className="text-[14px] text-[#666666] mb-3 leading-relaxed">{ayuda}</p>}
      {!ayuda && <div className="mb-3" />}
      {children}
      {error && <p className="text-[13px] font-semibold text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// Baja la página hasta el primer campo con error (los campos se marcan con "campo" en CampoBolsa)
export const irAlPrimerError = (orden, errores) => {
  const primero = orden.find((c) => errores[c]);
  const el = primero && document.querySelector(`[data-campo="${primero}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Fondo oscuro con la ventana encima. Se dibuja directo en <body> para que nada (menú, footer) le pase por arriba,
// y mientras está abierta la página de atrás no se mueve.
export function VentanaBolsa({ abierta, onCerrar, children, ancho = 'max-w-lg' }) {
  useEffect(() => {
    if (!abierta) return undefined;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const conEscape = (e) => { if (e.key === 'Escape') onCerrar?.(); };
    window.addEventListener('keydown', conEscape);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener('keydown', conEscape);
    };
  }, [abierta, onCerrar]);

  if (!abierta) return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] bg-[#1A3D3D]/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200" onClick={onCerrar}>
      <div
        className={`bg-white w-full ${ancho} rounded-t-[28px] sm:rounded-[28px] p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain font-['Inter']`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F4F7F7] text-[#666666] hover:text-[#1A3D3D] hover:bg-gray-200 flex items-center justify-center transition-colors">
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Cartel de confirmación con el diseño del Portal (reemplaza al cartel gris del navegador)
export function VentanaConfirmar({ abierta, titulo, texto, textoBoton = 'Confirmar', peligro = false, trabajando = false, error = '', onConfirmar, onCerrar }) {
  return (
    <VentanaBolsa abierta={abierta} onCerrar={trabajando ? () => {} : onCerrar} ancho="max-w-md">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${peligro ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] leading-tight mb-2 pr-10">{titulo}</h3>
      {texto && <p className="text-[14px] text-[#666666] leading-relaxed mb-6">{texto}</p>}
      {error && <p className="text-[13px] font-semibold text-red-600 mb-4">{error}</p>}
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button type="button" onClick={onCerrar} disabled={trabajando} className="flex-1 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={onConfirmar} disabled={trabajando} className={`flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-70 ${peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2D6A6A] hover:bg-[#1A3D3D]'}`}>
          {trabajando && <Loader2 className="w-4 h-4 animate-spin" />} {textoBoton}
        </button>
      </div>
    </VentanaBolsa>
  );
}

const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Elegir especialidades sin un scroll eterno: buscador + sugeridas (las del perfil) + grupos desplegables
export function SelectorAreas({ seleccion = [], onCambio, maximo = null, sugeridas = [], deshabilitado = false, textoDeshabilitado = '' }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(null);
  const lleno = !!maximo && seleccion.length >= maximo;

  const tocar = (area) => {
    if (deshabilitado) return;
    if (seleccion.includes(area)) { onCambio(seleccion.filter((a) => a !== area)); return; }
    if (lleno) return;
    onCambio([...seleccion, area]);
  };

  const resultados = useMemo(() => {
    const q = normalizar(texto);
    if (!q) return [];
    return GRUPOS_AREAS.flatMap((g) => g.opciones.filter((o) => normalizar(o).includes(q) || normalizar(g.grupo).includes(q)));
  }, [texto]);

  if (deshabilitado) {
    return <p className="bg-[#F4F7F7] rounded-2xl px-4 py-3 text-[14px] text-[#666666]">{textoDeshabilitado || 'Para este puesto no hace falta elegir especialidades.'}</p>;
  }

  const pill = (area) => {
    const activa = seleccion.includes(area);
    const bloqueada = !activa && lleno;
    return (
      <button
        key={area}
        type="button"
        onClick={() => tocar(area)}
        disabled={bloqueada}
        aria-pressed={activa}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold border shadow-sm transition-all duration-300 ease-in-out ${
          activa ? 'bg-[#2D6A6A]/10 border-[#2D6A6A] text-[#1A3D3D]'
            : bloqueada ? 'bg-white border-gray-100 text-gray-300 cursor-not-allowed shadow-none'
              : 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A]/60 hover:-translate-y-0.5'
        }`}
      >
        {activa && <Check className="w-3.5 h-3.5 text-[#2D6A6A]" />}
        {area}
      </button>
    );
  };

  const sugeridasLimpias = [...new Set(sugeridas)].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {/* Las elegidas, arriba y a la vista */}
      {seleccion.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seleccion.map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 bg-[#2D6A6A] text-white rounded-full pl-4 pr-2 py-2 text-[13px] font-semibold">
              {a}
              <button type="button" onClick={() => tocar(a)} aria-label={`Quitar ${a}`} className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
   
      {sugeridasLimpias.length > 0 && (
        <div>
          <p className="text-[13px] font-bold text-[#666666] mb-2">De tu perfil</p>
          <div className="flex flex-wrap gap-2 pt-1">{sugeridasLimpias.map(pill)}</div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative flex items-center bg-[#F4F7F7] border border-transparent focus-within:border-[#2D6A6A] rounded-2xl px-4 py-3 transition-all">
        <Search className="w-4 h-4 text-[#666666] shrink-0" />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscá una especialidad. Ej: ecografía, felinos, cirugía"
          className="w-full bg-transparent pl-3 text-[15px] text-[#1A3D3D] focus:outline-none placeholder:text-gray-400"
        />
        {texto && <button type="button" onClick={() => setTexto('')} aria-label="Borrar búsqueda"><X className="w-4 h-4 text-gray-400" /></button>}
      </div>

      {/* Aviso: aparece pegado al buscador cuando ya elegiste el máximo */}
      {lleno && (
        <div className="flex items-start gap-2.5 bg-[#2D6A6A]/10 text-[#1A3D3D] rounded-2xl px-4 py-3">
          <Info className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed">
            Llegaste al máximo de {maximo} especialidades. Las que están en gris no se pueden sumar: sacá una de las elegidas (tocando la X) para elegir otra.
          </p>
        </div>
      )}

      {texto.trim() ? (
        resultados.length > 0
          ? <div className="flex flex-wrap gap-2 pt-1">{resultados.map(pill)}</div>
          : <p className="text-[14px] text-[#666666]">No encontramos «{texto.trim()}». Probá con otra palabra o buscala en la lista.</p>
      ) : (
        /* Grupos desplegables: se abre uno a la vez */
        <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {GRUPOS_AREAS.map((g) => {
            const elegidasGrupo = seleccion.filter((a) => g.opciones.includes(a)).length;
            const estaAbierto = abierto === g.id;
            return (
              <div key={g.id}>
                <button type="button" onClick={() => setAbierto(estaAbierto ? null : g.id)} className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${estaAbierto ? 'bg-[#F4F7F7]' : 'bg-white hover:bg-[#F4F7F7]/60'}`}>
                  <span className="text-[14px] font-semibold text-[#1A3D3D]">
                    {g.grupo}
                    {elegidasGrupo > 0 && <span className="ml-2 bg-[#2D6A6A] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{elegidasGrupo}</span>}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#666666] shrink-0 transition-transform ${estaAbierto ? 'rotate-180' : ''}`} />
                </button>
                {estaAbierto && <div className="flex flex-wrap gap-2 px-4 pb-4 pt-2 bg-[#F4F7F7]">{g.opciones.map(pill)}</div>}
              </div>
            );
          })}
        </div>
      )}
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
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] leading-tight mb-2 pr-10">Tu cuenta está en revisión</h3>
      <p className="text-[14px] text-[#666666] leading-relaxed mb-6">
        Apenas verifiquemos tu matrícula vas a poder publicar y postularte en la Bolsa de Trabajo. Mientras tanto podés seguir armando tu perfil.
      </p>
      <button type="button" onClick={() => navigate('/ecosistema')} className="w-full bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
        Ir a mi cuenta
      </button>
    </VentanaBolsa>
  );
}
