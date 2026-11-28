import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { BellRing, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { auth, db } from '../firebase';

// Plan B: si no se puede guardar el aviso (justo cuando fallan las reglas o no hay conexión), se manda por mail
const MAIL_AVISOS = 'portalveterinario.ar@gmail.com';
const ASUNTO_MAIL = 'Algo no funciona en Portal Veterinario';
// Sin conexión, Firebase deja el aviso "en espera" y no avisa que falló: después de este tiempo pasamos al plan B
const ESPERA_MAXIMA_MS = 8000;

// Arma el link que abre la app de mail con el asunto y el cuerpo ya escritos
const armarLinkMail = ({ lugar, detalle, pagina }) => {
  const fecha = new Date().toLocaleString('es-AR');
  const cuerpo = [
    'Hola, algo no funciona en Portal Veterinario.',
    '',
    `Lugar: ${lugar || 'otro'}`,
    `Código del error: ${detalle || 'sin código'}`,
    `Página: ${pagina}`,
    `Fecha: ${fecha}`,
    '',
    'Si querés, contanos acá qué estabas haciendo:',
    ''
  ].join('\n');
  return `mailto:${MAIL_AVISOS}?subject=${encodeURIComponent(ASUNTO_MAIL)}&body=${encodeURIComponent(cuerpo)}`;
};

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
      const guardado = addDoc(collection(db, 'reportes'), {
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
      // Si tarda demasiado (sin conexión), lo damos por fallado y ofrecemos el mail
      const limite = new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('sin respuesta')), ESPERA_MAXIMA_MS));
      await Promise.race([guardado, limite]);
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
        <div className="mt-2 flex flex-col items-start gap-2" role="alert">
          <p className="text-[12px] font-medium text-red-600">No pudimos mandar el aviso. Mandalo por mail, ya va escrito:</p>
          <a
            href={armarLinkMail({ lugar, detalle, pagina: `${location.pathname}${location.search}` })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] transition-colors"
          >
            <Mail className="w-4 h-4" /> Mandar por mail
          </a>
        </div>
      )}
    </div>
  );
}
