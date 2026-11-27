import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { BellRing, CheckCircle2, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';

// Botón "Avisar que no funciona": guarda un aviso en la colección "reportes" de Firestore
// y le llega a la admin al panel (Avisos de problemas), sin que la persona tenga que escribirle a nadie.
// Se muestra pegado a los mensajes de error. Funciona también sin sesión (la Bolsa es pública).
//
// Props:
//  - lugar:   dónde pasó ('bolsa', 'ingreso', 'completar-cuenta'). Lo usa el panel para ordenar los avisos.
//  - detalle: el código técnico del error, si lo hay (ej: permission-denied). Es lo que más ayuda a encontrar el problema.
export default function BotonAvisarProblema({ lugar, detalle = '', className = '' }) {
  const location = useLocation();
  const [estado, setEstado] = useState('listo'); // listo | enviando | enviado | fallo

  const enviar = async () => {
    if (estado === 'enviando' || estado === 'enviado') return;
    setEstado('enviando');
    try {
      const usuario = auth.currentUser;
      await addDoc(collection(db, 'reportes'), {
        lugar: String(lugar || 'otro').slice(0, 60),
        detalle: String(detalle || '').slice(0, 300),
        ruta: `${location.pathname}${location.search}`.slice(0, 200),
        // Si tiene sesión, la admin ve quién es y puede escribirle (las reglas exigen que sea su propio uid y mail)
        uid: usuario?.uid || '',
        email: usuario?.email || '',
        navegador: (navigator.userAgent || '').slice(0, 200),
        fecha: serverTimestamp(),
        estado: 'nuevo'
      });
      setEstado('enviado');
    } catch (error) {
      console.error('No se pudo mandar el aviso:', error);
      setEstado('fallo');
    }
  };

  if (estado === 'enviado') {
    return (
      <p className={`flex items-center gap-2 text-[12px] font-semibold text-[#2D6A6A] ${className}`} role="status">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> ¡Gracias! Ya nos llegó el aviso.
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={enviar}
        disabled={estado === 'enviando'}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold bg-white border border-[#2D6A6A]/40 text-[#2D6A6A] hover:bg-[#F4F7F7] hover:border-[#2D6A6A] transition-colors disabled:opacity-60"
      >
        {estado === 'enviando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
        Avisar que no funciona
      </button>
      {estado === 'fallo' && (
        <p className="mt-2 text-[12px] font-medium text-red-600" role="alert">No pudimos mandar el aviso. Probá de nuevo en un rato.</p>
      )}
    </div>
  );
}
