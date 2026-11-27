import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { BellRing, CheckCircle2, Trash2, Mail, Loader2, RotateCcw, Smartphone } from 'lucide-react';
import { db } from '../../firebase';

// Avisos de "esto no funciona" que manda la gente desde los mensajes de error (componente BotonAvisarProblema).
// Se actualiza solo: si llega uno nuevo con el panel abierto, aparece sin recargar.

// Nombre legible de cada lugar desde donde se puede avisar
const NOMBRES_LUGAR = {
  bolsa: 'Bolsa de trabajo',
  ingreso: 'Ingreso (login)',
  'completar-cuenta': 'Completar cuenta'
};

const formatearFechaHora = (marca) => {
  const fecha = marca?.toDate ? marca.toDate() : null;
  if (!fecha) return '—';
  return `${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
};

// Del texto largo del navegador sacamos solo si es celular o compu, y cuál
const resumirNavegador = (texto = '') => {
  const dispositivo = /iPhone|iPad|Android|Mobile/i.test(texto) ? 'Celular' : 'Compu';
  const navegador = /Edg\//.test(texto) ? 'Edge'
    : /Chrome\//.test(texto) ? 'Chrome'
    : /Firefox\//.test(texto) ? 'Firefox'
    : /Safari\//.test(texto) ? 'Safari'
    : 'otro navegador';
  return `${dispositivo} · ${navegador}`;
};

export default function AvisosProblemas() {
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('nuevo'); // nuevo | resuelto

  useEffect(() => {
    const consulta = query(collection(db, 'reportes'), orderBy('fecha', 'desc'), limit(200));
    const dejarDeEscuchar = onSnapshot(
      consulta,
      (snap) => {
        setAvisos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setError('');
        setCargando(false);
      },
      (e) => {
        console.error('No se pudieron leer los avisos:', e);
        setError('No pudimos cargar los avisos. Si es la primera vez, revisá que las reglas nuevas de Firestore estén pegadas.');
        setCargando(false);
      }
    );
    return () => dejarDeEscuchar();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await updateDoc(doc(db, 'reportes', id), { estado });
    } catch (e) {
      console.error('No se pudo actualizar el aviso:', e);
      alert('No se pudo actualizar el aviso. Probá de nuevo.');
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Borrar este aviso? No se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'reportes', id));
    } catch (e) {
      console.error('No se pudo borrar el aviso:', e);
      alert('No se pudo borrar el aviso. Probá de nuevo.');
    }
  };

  const nuevos = avisos.filter((a) => a.estado !== 'resuelto');
  const resueltos = avisos.filter((a) => a.estado === 'resuelto');
  const visibles = filtro === 'nuevo' ? nuevos : resueltos;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Avisos de problemas
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Lo que la gente marcó como «no funciona» desde un mensaje de error. Viene con la página, el error técnico y la cuenta (si tenía sesión).
        </p>
      </div>

      <div className="flex gap-2 bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl w-fit mb-6">
        {[{ id: 'nuevo', label: `Nuevos · ${nuevos.length}` }, { id: 'resuelto', label: `Resueltos · ${resueltos.length}` }].map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => setFiltro(op.id)}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filtro === op.id ? 'bg-[#F4F7F7] text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#2D6A6A]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Cargando avisos...</span>
        </div>
      ) : error ? (
        <p className="bg-white rounded-[24px] border border-red-100 p-5 text-[14px] font-medium text-red-600" role="alert">{error}</p>
      ) : visibles.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-100 p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#2D6A6A] mx-auto mb-3" />
          <p className="text-[15px] font-medium text-[#666666]">
            {filtro === 'nuevo' ? 'No hay avisos nuevos.' : 'Todavía no marcaste avisos como resueltos.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibles.map((a) => (
            <div key={a.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-amber-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-[#2D6A6A]/10 text-[#2D6A6A]">
                    {NOMBRES_LUGAR[a.lugar] || a.lugar || 'Otro'}
                  </span>
                  <span className="text-[12px] text-[#666666] font-medium">{formatearFechaHora(a.fecha)}</span>
                </div>
                <p className="text-[14px] text-[#1A3D3D] font-semibold break-all">
                  Error: <span className="font-mono font-medium">{a.detalle || 'sin código'}</span>
                </p>
                <p className="text-[13px] text-[#666666] break-all mt-0.5">Página: {a.ruta || '—'}</p>
                <p className="text-[13px] text-[#666666] mt-0.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 shrink-0" /> {resumirNavegador(a.navegador)}
                </p>
                <p className="text-[13px] text-[#666666] mt-0.5 break-all">
                  {a.email ? <>Cuenta: <a href={`mailto:${a.email}`} className="font-semibold text-[#2D6A6A] underline underline-offset-2">{a.email}</a></> : 'Sin sesión (no sabemos quién es)'}
                </p>
              </div>

              <div className="flex md:flex-col gap-2 shrink-0">
                {a.email && (
                  <a
                    href={`mailto:${a.email}`}
                    aria-label={`Escribirle a ${a.email}`}
                    className="inline-flex items-center justify-center p-2.5 rounded-xl text-[#2D6A6A] bg-[#F4F7F7] hover:bg-[#E8EFEF] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {a.estado === 'resuelto' ? (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(a.id, 'nuevo')}
                    className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-[#F4F7F7] text-[#1A3D3D] hover:bg-[#E8EFEF] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Reabrir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(a.id, 'resuelto')}
                    className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resuelto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => eliminar(a.id)}
                  aria-label="Borrar aviso"
                  className="inline-flex items-center justify-center p-2.5 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
