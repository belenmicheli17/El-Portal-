import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { MessageCircle, Trash2, Loader2, User, Calendar } from 'lucide-react';

export default function Feedback() {
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(null);

  const cargarComentarios = async () => {
    setCargando(true);
    try {
      const q = query(collection(db, 'comentarios'), orderBy('creadoEn', 'desc'));
      const snap = await getDocs(q);
      setComentarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error cargando comentarios:', e);
    }
    setCargando(false);
  };

  useEffect(() => { cargarComentarios(); }, []);

  const handleEliminar = async (id) => {
    setEliminando(id);
    try {
      await deleteDoc(doc(db, 'comentarios', id));
      setComentarios(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('Error eliminando comentario:', e);
    }
    setEliminando(null);
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '—';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[#FF9800]/10 rounded-2xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-[#FF9800]" />
        </div>
        <div>
          <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[24px] leading-none">Comentarios Beta</h1>
          <p className="text-[#666666] text-[13px] font-medium mt-1">{comentarios.length} comentario{comentarios.length !== 1 ? 's' : ''} recibido{comentarios.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#2D6A6A] animate-spin" />
        </div>
      ) : comentarios.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[#666666] font-bold text-[15px]">Todavía no hay comentarios</p>
          <p className="text-[#666666] font-medium text-[13px] mt-1">Cuando los usuarios envíen feedback, aparecerán acá.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comentarios.map(c => (
            <div key={c.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#2D6A6A]/20 transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[#333333] font-medium text-[15px] leading-relaxed mb-4">{c.texto}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[#666666]">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-bold">{c.usuarioNombre || c.usuarioEmail || 'Usuario desconocido'}</span>
                    </div>
                    {c.usuarioRol && (
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2D6A6A] bg-[#2D6A6A]/8 px-2.5 py-1 rounded-full">
                        {c.usuarioRol}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-[#666666]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-medium">{formatearFecha(c.creadoEn)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEliminar(c.id)}
                  disabled={eliminando === c.id}
                  className="shrink-0 p-2.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-40"
                >
                  {eliminando === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}