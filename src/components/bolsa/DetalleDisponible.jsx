import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, MessageCircle, Mail, User, FileText, Loader2, Lock, Stethoscope, Clock, Award } from 'lucide-react';
import { db } from '../../firebase';
import { VentanaBolsa } from './ElementosBolsa';
import { linkWhatsapp, tiempoDesde, mensajeAProfesional, provinciaCorta } from '../../utils/bolsa';

const claseBoton = "w-full py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors";

// Una fila de información con ícono y título
function Fila({ icono: Icono, titulo, children }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-t border-gray-100 first:border-t-0">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center"><Icono className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-[#666666]">{titulo}</p>
        <div className="text-[15px] font-semibold text-[#1A3D3D] leading-snug mt-0.5">{children}</div>
      </div>
    </div>
  );
}

// Ventana con el detalle de un profesional disponible y un botón claro para contactarlo
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
  const lugar = [zonas.join(', '), provinciaCorta(disponible.provincia)].filter(Boolean).join(' · ') || 'Zona a convenir';
  const tiempos = [...(disponible.jornada || []), ...(disponible.horario || [])];
  // Mensaje ya escrito: si escribe una clínica, se presenta con su nombre
  const mensaje = mensajeAProfesional(disponible.nombre, currentUser?.rol === 'clinica' ? currentUser?.nombre : '');
  const tieneWhatsapp = tipos.includes('whatsapp') && contacto?.whatsapp;
  const tieneMail = tipos.includes('email') && contacto?.email;
  const linkMail = tieneMail ? `mailto:${contacto.email}?subject=${encodeURIComponent('Propuesta de trabajo — Portal Veterinario')}&body=${encodeURIComponent(mensaje)}` : '';

  return (
    <VentanaBolsa abierta={abierto} onCerrar={onCerrar} ancho="max-w-2xl">
      {/* Encabezado */}
      <div className="flex items-center gap-4 pr-10">
        {disponible.foto ? (
          <img src={disponible.foto} alt={disponible.nombre} className="w-20 h-20 rounded-full object-cover border border-gray-100 shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#F4F7F7] border border-gray-200 flex items-center justify-center text-[#1A3D3D] shrink-0"><User className="w-8 h-8" /></div>
        )}
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-1">Disponible para trabajar</p>
          <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] md:text-[24px] leading-tight">{disponible.nombre}</h3>
          {disponible.especialidad && <p className="text-[14px] font-semibold text-[#2D6A6A] mt-0.5">{disponible.especialidad}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] gap-6 mt-6">
        {/* Información */}
        <div className="min-w-0">
          {disponible.buscando && (
            <p className="text-[15px] text-[#333333] leading-relaxed whitespace-pre-line bg-[#F4F7F7] rounded-2xl px-4 py-3 mb-3">«{disponible.buscando}»</p>
          )}
          {(disponible.areas || []).length > 0 && (
            <Fila icono={Stethoscope} titulo="Quiere trabajar en">
              {disponible.areas.join(' · ')}
              {disponible.notaAreas && <p className="text-[13px] font-normal text-[#666666] mt-1">{disponible.notaAreas}</p>}
            </Fila>
          )}
          <Fila icono={MapPin} titulo="Zona">{lugar}</Fila>
          {tiempos.length > 0 && <Fila icono={Clock} titulo="Jornada y horario">{tiempos.join(' · ')}</Fila>}
          {disponible.experiencia && <Fila icono={Award} titulo="Experiencia">{disponible.experiencia}</Fila>}
          <p className="text-[12px] text-[#666666] mt-2">Disponible desde: {tiempoDesde(disponible.publicadaEn).toLowerCase()}</p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          {!conSesion && (
            <div className="bg-[#F4F7F7] rounded-2xl p-4">
              <p className="text-[14px] font-bold text-[#1A3D3D] flex items-center gap-1.5 mb-1"><Lock className="w-4 h-4 text-[#2D6A6A]" /> Contacto solo para registrados</p>
              <p className="text-[13px] text-[#666666] mb-3">Creá tu perfil gratis para contactarlo.</p>
              <button type="button" onClick={() => navigate('/login', { state: { registro: true } })} className={`${claseBoton} bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white mb-2`}>Crear mi perfil</button>
              <button type="button" onClick={() => navigate('/login')} className={`${claseBoton} bg-white hover:bg-gray-100 text-[#1A3D3D]`}>Ya tengo cuenta</button>
            </div>
          )}

          {conSesion && cargando && <div className="flex justify-center py-3"><Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" /></div>}

          {conSesion && !cargando && !esMio && (
            <>
              <p className="text-[14px] font-bold text-[#1A3D3D] font-['Montserrat'] mb-1">Contactarlo para charlar la propuesta</p>
              {tieneWhatsapp && (
                <a href={linkWhatsapp(contacto.whatsapp, mensaje)} target="_blank" rel="noopener noreferrer" className={`${claseBoton} bg-[#25D366] hover:bg-[#20b858] text-white`}>
                  <MessageCircle className="w-5 h-5" /> Escribirle por WhatsApp
                </a>
              )}
              {tieneMail && (
                <a href={linkMail} className={`${claseBoton} ${tieneWhatsapp ? 'bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D]' : 'bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white'}`}>
                  <Mail className="w-5 h-5" /> Escribirle por mail
                </a>
              )}
              {!tieneWhatsapp && !tieneMail && (
                <p className="text-[13px] text-[#666666] bg-[#F4F7F7] rounded-2xl p-3">Todavía no cargó un WhatsApp o mail. Podés ver sus datos de contacto en su perfil.</p>
              )}
            </>
          )}

          {esMio && <p className="text-[13px] text-[#666666] bg-[#F4F7F7] rounded-2xl p-3">Es tu publicación. La editás o la extendés desde «Mis publicaciones».</p>}

          {(disponible.slug || (conSesion && contacto?.cvUrl)) && <div className="h-px bg-gray-100 my-2" />}
          {disponible.slug && (
            <button type="button" onClick={() => navigate(`/profesional/${disponible.slug}`)} className={`${claseBoton} bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A]`}>
              <User className="w-4 h-4" /> Ver su perfil
            </button>
          )}
          {conSesion && !cargando && contacto?.cvUrl && (
            <a href={contacto.cvUrl} target="_blank" rel="noopener noreferrer" className={`${claseBoton} bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A]`}>
              <FileText className="w-4 h-4" /> Ver su currículum
            </a>
          )}
        </div>
      </div>
    </VentanaBolsa>
  );
}
