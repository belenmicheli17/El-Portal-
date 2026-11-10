import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, MessageCircle, Mail, User, FileText, Loader2, Lock } from 'lucide-react';
import { db } from '../../firebase';
import { VentanaBolsa } from './ElementosBolsa';
import { linkWhatsapp, tiempoDesde } from '../../utils/bolsa';

const clasePill = "bg-[#2D6A6A]/10 text-[#1A3D3D] text-[13px] font-semibold px-3 py-1 rounded-full";
const claseBoton = "w-full py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors";

// Ventana con el detalle de un profesional disponible y sus formas de contacto
export default function DetalleDisponible({ disponible, abierto, onCerrar, conSesion, currentUser }) {
  const navigate = useNavigate();
  const [contacto, setContacto] = useState(null);
  const [cargando, setCargando] = useState(false);
  const esMio = currentUser?.uid === disponible?.creadorId;

  useEffect(() => {
    if (!abierto || !conSesion || !disponible?.id) return;
    let cancelado = false;
    setCargando(true);
    getDoc(doc(db, 'profesionalesDisponibles', disponible.id, 'privado', 'contacto'))
      .then((snap) => { if (!cancelado) setContacto(snap.exists() ? snap.data() : null); })
      .catch((e) => console.error('Error leyendo el contacto:', e))
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [abierto, conSesion, disponible?.id]);

  if (!disponible) return null;

  const tipos = contacto?.tipoContacto || [];
  const zonas = (disponible.zonas || []).map((z) => z.localidad || z.barrio).filter(Boolean);
  const mensaje = `Hola ${disponible.nombre}, vi en la Bolsa de Trabajo de Portal Veterinario que estás disponible y te quería contactar.`;

  return (
    <VentanaBolsa abierta={abierto} onCerrar={onCerrar}>
      <div className="flex items-center gap-4 mb-5 pr-10">
        {disponible.foto ? (
          <img src={disponible.foto} alt={disponible.nombre} className="w-16 h-16 rounded-full object-cover border border-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#F4F7F7] border border-gray-200 flex items-center justify-center text-[#1A3D3D]"><User className="w-7 h-7" /></div>
        )}
        <div className="min-w-0">
          <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] leading-tight">{disponible.nombre}</h3>
          {disponible.especialidad && <p className="text-[13px] font-semibold text-[#2D6A6A] mt-0.5">{disponible.especialidad}</p>}
          <p className="text-[12px] text-[#666666] mt-0.5">Disponible desde: {tiempoDesde(disponible.publicadaEn).toLowerCase()}</p>
        </div>
      </div>

      {(disponible.areas || []).length > 0 && (
        <div className="mb-4">
          <p className="text-[13px] font-bold text-[#1A3D3D] mb-2">Quiere trabajar en</p>
          <div className="flex flex-wrap gap-2">{disponible.areas.map((a) => <span key={a} className={clasePill}>{a}</span>)}</div>
          {disponible.notaAreas && <p className="text-[13px] text-[#666666] mt-2 leading-relaxed">{disponible.notaAreas}</p>}
        </div>
      )}

      <div className="mb-4">
        <p className="flex items-start gap-1.5 text-[14px] text-[#333333] font-medium">
          <MapPin className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
          {[zonas.join(', '), disponible.provincia].filter(Boolean).join(' · ') || 'Zona a convenir'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(disponible.jornada || []).map((j) => <span key={j} className={clasePill}>{j}</span>)}
        {(disponible.horario || []).map((h) => <span key={h} className={clasePill}>{h}</span>)}
        {disponible.experiencia && <span className={clasePill}>{disponible.experiencia}</span>}
      </div>

      {disponible.buscando && (
        <div className="bg-[#F4F7F7] rounded-2xl p-4 mb-5">
          <p className="text-[14px] text-[#333333] leading-relaxed whitespace-pre-line">{disponible.buscando}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {disponible.slug && (
          <button type="button" onClick={() => navigate(`/profesional/${disponible.slug}`)} className={`${claseBoton} bg-white border-2 border-[#2D6A6A] text-[#2D6A6A] hover:bg-[#F4F7F7]`}>
            <User className="w-4 h-4" /> Ver perfil
          </button>
        )}

        {!conSesion && (
          <div className="bg-[#F4F7F7] rounded-2xl p-4 mt-2">
            <p className="text-[14px] font-bold text-[#1A3D3D] flex items-center gap-1.5 mb-1"><Lock className="w-4 h-4 text-[#2D6A6A]" /> Contacto solo para registrados</p>
            <p className="text-[13px] text-[#666666] mb-3">Creá tu perfil gratis para ver cómo contactarlo.</p>
            <button type="button" onClick={() => navigate('/login', { state: { registro: true } })} className={`${claseBoton} bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white mb-2`}>Crear mi perfil</button>
            <button type="button" onClick={() => navigate('/login')} className={`${claseBoton} bg-white hover:bg-gray-100 text-[#1A3D3D]`}>Ya tengo cuenta</button>
          </div>
        )}

        {conSesion && cargando && <div className="flex justify-center py-3"><Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" /></div>}

        {conSesion && !cargando && !esMio && contacto && (
          <>
            {tipos.includes('whatsapp') && contacto.whatsapp && (
              <a href={linkWhatsapp(contacto.whatsapp, mensaje)} target="_blank" rel="noopener noreferrer" className={`${claseBoton} bg-[#25D366] hover:bg-[#20b858] text-white`}>
                <MessageCircle className="w-5 h-5" /> Escribirle por WhatsApp
              </a>
            )}
            {tipos.includes('email') && contacto.email && (
              <a href={`mailto:${contacto.email}?subject=${encodeURIComponent('Te contacto desde la Bolsa de Trabajo de Portal Veterinario')}&body=${encodeURIComponent(mensaje)}`} className={`${claseBoton} bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D]`}>
                <Mail className="w-5 h-5" /> Escribirle por mail
              </a>
            )}
            {contacto.cvUrl && (
              <a href={contacto.cvUrl} target="_blank" rel="noopener noreferrer" className={`${claseBoton} bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D]`}>
                <FileText className="w-5 h-5" /> Ver su CV
              </a>
            )}
            {tipos.length === 1 && tipos[0] === 'perfil' && (
              <p className="text-[13px] text-[#666666] text-center mt-1">Prefiere que lo contacten desde su perfil.</p>
            )}
          </>
        )}

        {esMio && <p className="text-[13px] text-[#666666] text-center mt-1">Es tu publicación. La editás o la renovás desde «Mis publicaciones».</p>}
      </div>
    </VentanaBolsa>
  );
}
