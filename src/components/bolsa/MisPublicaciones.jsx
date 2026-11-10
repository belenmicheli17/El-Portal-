import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ChevronLeft, Pencil, RefreshCw, Trash2, Plus, Briefcase, User } from 'lucide-react';
import { db } from '../../firebase';
import { tituloPuesto, diasRestantes, estaVencida, nuevoVencimiento, zonaTexto } from '../../utils/bolsa';

function Estado({ item }) {
  if (item.estado === 'pausado') return <span className="bg-amber-50 text-amber-800 text-[12px] font-semibold px-2.5 py-0.5 rounded-full">Pausada por el Portal</span>;
  if (estaVencida(item)) return <span className="bg-red-50 text-red-700 text-[12px] font-semibold px-2.5 py-0.5 rounded-full">Vencida</span>;
  const dias = diasRestantes(item);
  return <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${dias <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-[#2D6A6A]/10 text-[#1A3D3D]'}`}>Vence en {dias} {dias === 1 ? 'día' : 'días'}</span>;
}

function Fila({ icono: Icono, titulo, subtitulo, item, coleccion, onEditar, onCambio }) {
  const [trabajando, setTrabajando] = useState(false);

  const renovar = async () => {
    setTrabajando(true);
    try {
      await actualizarPublicacion(coleccion, item.id, { vencimientoMillis: nuevoVencimiento() });
      onCambio();
    } catch (e) {
      console.error('Error renovando:', e);
      alert('No pudimos renovar. Intentá de nuevo.');
    } finally {
      setTrabajando(false);
    }
  };

  const borrar = async () => {
    if (!window.confirm('¿Cerrar esta publicación? Se borra de la Bolsa y no se puede deshacer.')) return;
    setTrabajando(true);
    try {
      await deleteDoc(doc(db, coleccion, item.id, 'privado', 'contacto')).catch(() => {});
      await deleteDoc(doc(db, coleccion, item.id));
      onCambio();
    } catch (e) {
      console.error('Error borrando:', e);
      alert('No pudimos cerrar la publicación. Intentá de nuevo.');
      setTrabajando(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center"><Icono className="w-5 h-5" /></div>
        <div className="min-w-0">
          <p className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[15px] leading-tight">{titulo}</p>
          {subtitulo && <p className="text-[13px] text-[#666666] mt-0.5 truncate">{subtitulo}</p>}
          <div className="mt-2"><Estado item={item} /></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {item.estado !== 'pausado' && (
          <button type="button" onClick={renovar} disabled={trabajando} className="inline-flex items-center gap-1.5 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
            <RefreshCw className={`w-4 h-4 ${trabajando ? 'animate-spin' : ''}`} /> Renovar 30 días
          </button>
        )}
        <button type="button" onClick={onEditar} disabled={trabajando} className="inline-flex items-center gap-1.5 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
          <Pencil className="w-4 h-4" /> Editar
        </button>
        <button type="button" onClick={borrar} disabled={trabajando} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 text-[#666666] rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
          <Trash2 className="w-4 h-4" /> Cerrar
        </button>
      </div>
    </div>
  );
}

// Renovar solo toca la fecha de vencimiento (las reglas no dejan cambiar nada más de paso)
const actualizarPublicacion = (coleccion, id, cambios) => updateDoc(doc(db, coleccion, id), cambios);

export default function MisPublicaciones({ currentUser, misOfertas, miDisponible, onVolver, onNuevaOferta, onEditarOferta, onEditarDisponible, onCambio }) {
  const esClinica = currentUser?.rol === 'clinica' || currentUser?.rol === 'admin';
  const esProfesional = currentUser?.rol === 'profesional';

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6 lg:pt-10 pb-16 font-['Inter'] relative z-10 animate-in fade-in duration-300">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-6">
        <ChevronLeft className="w-4 h-4" /> Volver a la Bolsa
      </button>
      <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[36px] leading-tight tracking-tight mb-2">Mis publicaciones</h1>
      <p className="text-[15px] text-[#666666] mb-8">Cada publicación dura 30 días. Renovarla es gratis.</p>

      {esClinica && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[#1A3D3D]">Mis ofertas · {misOfertas.length}</h2>
            <button type="button" onClick={onNuevaOferta} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]"><Plus className="w-4 h-4" /> Nueva oferta</button>
          </div>
          {misOfertas.length === 0 ? (
            <p className="bg-white rounded-[24px] border border-gray-100 p-6 text-[14px] text-[#666666]">Todavía no publicaste ofertas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {misOfertas.map((o) => (
                <Fila key={o.id} icono={Briefcase} titulo={tituloPuesto(o)} subtitulo={zonaTexto(o)} item={o} coleccion="ofertasEmpleo" onEditar={() => onEditarOferta(o)} onCambio={onCambio} />
              ))}
            </div>
          )}
        </section>
      )}

      {esProfesional && (
        <section>
          <h2 className="text-[14px] font-bold text-[#1A3D3D] mb-4">Mi disponibilidad</h2>
          {miDisponible ? (
            <Fila icono={User} titulo={(miDisponible.areas || []).join(' · ') || 'Disponible'} subtitulo={miDisponible.provincia} item={miDisponible} coleccion="profesionalesDisponibles" onEditar={onEditarDisponible} onCambio={onCambio} />
          ) : (
            <div className="bg-white rounded-[24px] border border-gray-100 p-6">
              <p className="text-[14px] text-[#666666] mb-4">Todavía no te marcaste como disponible.</p>
              <button type="button" onClick={onEditarDisponible} className="inline-flex items-center gap-1.5 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white rounded-2xl px-5 py-3 text-[14px] font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Marcarme como disponible
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
