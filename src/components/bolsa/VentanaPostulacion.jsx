import React, { useEffect, useState } from 'react';
import { MessageCircle, Mail, Loader2, Check, FileText, UserCircle2 } from 'lucide-react';
import { VentanaBolsa } from './ElementosBolsa';
import CajaCV, { useMiCV } from './CajaCV';
import { etiquetaRol, linkWhatsapp, linkPerfilProfesional, mensajePostulacion, cierrePostulacion } from '../../utils/bolsa';

// Se abre al tocar "Postularme". A la izquierda elige con qué se postula (currículum o perfil);
// a la derecha ve el mensaje que le llega a la clínica y lo manda por WhatsApp o mail.
export default function VentanaPostulacion({ abierta, onCerrar, oferta, contacto, currentUser }) {
  const { cv, setCv, cargando } = useMiCV(abierta ? currentUser?.uid : null);
  const perfilUrl = linkPerfilProfesional(currentUser?.slug);
  const [opcion, setOpcion] = useState('cv');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const puesto = etiquetaRol(oferta?.rol);

  useEffect(() => {
    if (!abierta) return;
    setError('');
    setMensaje(mensajePostulacion(currentUser?.nombre));
  }, [abierta, currentUser?.nombre]);

  // Si no tiene currículum pero sí perfil, arrancamos con la opción del perfil
  useEffect(() => {
    if (!abierta || cargando) return;
    setOpcion(cv ? 'cv' : (perfilUrl ? 'perfil' : 'cv'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, cargando]);

  // El cierre del mensaje se arma solo: con el link al currículum o al perfil
  const cierre = cierrePostulacion(opcion === 'cv' ? { cvUrl: cv?.url } : { perfilUrl });
  const textoFinal = [mensaje.trim(), cierre].filter(Boolean).join('\n\n');

  const validar = () => {
    if (opcion === 'cv' && !cv) { setError('Subí tu currículum o elegí usar tu perfil.'); return false; }
    if (opcion === 'perfil' && !perfilUrl) { setError('Todavía no tenés el perfil publicado. Subí tu currículum para postularte.'); return false; }
    setError('');
    return true;
  };

  const enviarWhatsapp = () => {
    if (!validar()) return;
    window.open(linkWhatsapp(contacto.whatsapp, textoFinal), '_blank', 'noopener');
  };

  const enviarMail = () => {
    if (!validar()) return;
    const asunto = `Postulación: ${puesto} — Portal Veterinario`;
    window.location.href = `mailto:${contacto.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(textoFinal)}`;
  };

  const tipos = contacto?.tipoContacto || [];
  const claseOpcion = (activa) => `w-full text-left border-2 rounded-2xl p-4 transition-all duration-300 ${activa ? 'border-[#2D6A6A] bg-[#F4F7F7]' : 'border-gray-200 bg-white hover:border-[#2D6A6A]/50'}`;
  const marca = (activa) => (
    <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${activa ? 'border-[#2D6A6A] bg-[#2D6A6A]' : 'border-gray-300 bg-white'}`}>
      {activa && <Check className="w-3 h-3 text-white" />}
    </span>
  );

  return (
    <VentanaBolsa abierta={abierta} onCerrar={onCerrar} ancho="max-w-4xl">
      <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-1">Postulación</p>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] md:text-[24px] leading-tight pr-10">{puesto} en {oferta?.clinicaNombre || 'la clínica'}</h3>

      {cargando ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6">
          {/* 1. Con qué se postula */}
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-bold text-[#1A3D3D] font-['Montserrat']">1. ¿Con qué te postulás?</p>

            <div role="radio" aria-checked={opcion === 'cv'} tabIndex={0} onClick={() => setOpcion('cv')} onKeyDown={(e) => e.key === 'Enter' && setOpcion('cv')} className={`${claseOpcion(opcion === 'cv')} cursor-pointer`}>
              <div className="flex items-center gap-3 mb-3">
                {marca(opcion === 'cv')}
                <FileText className="w-4 h-4 text-[#2D6A6A]" />
                <p className="text-[14px] font-bold text-[#1A3D3D]">Mi currículum</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <CajaCV uid={currentUser?.uid} cv={cv} setCv={(nuevo) => { setCv(nuevo); if (nuevo) setOpcion('cv'); }} compacta />
              </div>
            </div>

            <button type="button" onClick={() => setOpcion('perfil')} className={claseOpcion(opcion === 'perfil')}>
              <div className="flex items-center gap-3">
                {marca(opcion === 'perfil')}
                <UserCircle2 className="w-4 h-4 text-[#2D6A6A]" />
                <p className="text-[14px] font-bold text-[#1A3D3D]">No tengo currículum: uso mi perfil</p>
              </div>
              <p className="text-[13px] text-[#666666] mt-2 pl-8 break-words">
                {perfilUrl ? 'La clínica ve tu trayectoria en tu perfil del Portal.' : 'Cuando tu perfil esté publicado, vas a poder usarlo como currículum.'}
              </p>
            </button>
          </div>

          {/* 2. El mensaje */}
          <div className="flex flex-col">
            <p className="text-[15px] font-bold text-[#1A3D3D] font-['Montserrat'] mb-3">2. Tu mensaje</p>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              maxLength={600}
              className="w-full border border-gray-200 focus:border-[#2D6A6A] rounded-2xl px-4 py-3 text-[14px] text-[#333333] focus:outline-none bg-gray-50/50 resize-none"
            />
            <p className="text-[12px] text-[#666666] mt-2 mb-1">Al final se suma solo:</p>
            <p className="text-[13px] text-[#333333] bg-[#F4F7F7] rounded-2xl px-4 py-3 whitespace-pre-line break-words">{cierre}</p>

            {error && <p className="text-[13px] font-semibold text-red-600 mt-3">{error}</p>}

            <div className="flex flex-col gap-2 mt-5">
              {tipos.includes('whatsapp') && contacto?.whatsapp && (
                <button type="button" onClick={enviarWhatsapp} className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors">
                  <MessageCircle className="w-5 h-5" /> Enviar por WhatsApp
                </button>
              )}
              {tipos.includes('email') && contacto?.email && (
                <button type="button" onClick={enviarMail} className={`w-full py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors ${tipos.includes('whatsapp') ? 'bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D]' : 'bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white'}`}>
                  <Mail className="w-5 h-5" /> Enviar por mail
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </VentanaBolsa>
  );
}
