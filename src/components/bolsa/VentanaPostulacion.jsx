import React, { useEffect, useState } from 'react';
import { MessageCircle, Mail, Loader2 } from 'lucide-react';
import { VentanaBolsa } from './ElementosBolsa';
import CajaCV, { useMiCV } from './CajaCV';
import { tituloPuesto, linkWhatsapp, linkPerfilProfesional } from '../../utils/bolsa';

// Se abre al tocar "Postularme". La persona elige con qué se postula (CV o perfil) y se va a WhatsApp o al mail de la clínica.
export default function VentanaPostulacion({ abierta, onCerrar, oferta, contacto, currentUser }) {
  const { cv, setCv, cargando } = useMiCV(abierta ? currentUser?.uid : null);
  const perfilUrl = linkPerfilProfesional(currentUser?.slug);
  const [opcion, setOpcion] = useState('cv');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const titulo = tituloPuesto(oferta);

  useEffect(() => {
    if (!abierta) return;
    setError('');
    setMensaje(`Hola, soy ${currentUser?.nombre || 'veterinario/a'}. Vi la búsqueda de ${titulo} en Portal Veterinario y me gustaría postularme.`);
  }, [abierta, currentUser?.nombre, titulo]);

  // Si no tiene CV pero sí perfil, arrancamos con la opción del perfil
  useEffect(() => {
    if (!abierta || cargando) return;
    setOpcion(cv ? 'cv' : (perfilUrl ? 'perfil' : 'cv'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, cargando]);

  const armarTexto = () => {
    const partes = [mensaje.trim()];
    if (opcion === 'cv' && cv?.url) partes.push(`Mi CV: ${cv.url}`);
    if (perfilUrl) partes.push(`Mi perfil en Portal Veterinario: ${perfilUrl}`);
    return partes.filter(Boolean).join('\n\n');
  };

  const validar = () => {
    if (opcion === 'cv' && !cv) { setError('Subí tu CV o elegí usar tu perfil como currículum.'); return false; }
    if (opcion === 'perfil' && !perfilUrl) { setError('Todavía no tenés el perfil publicado. Subí tu CV para postularte.'); return false; }
    setError('');
    return true;
  };

  const enviarWhatsapp = () => {
    if (!validar()) return;
    window.open(linkWhatsapp(contacto.whatsapp, armarTexto()), '_blank', 'noopener');
  };

  const enviarMail = () => {
    if (!validar()) return;
    const asunto = `Postulación: ${titulo} — Portal Veterinario`;
    window.location.href = `mailto:${contacto.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(armarTexto())}`;
  };

  const tipos = contacto?.tipoContacto || [];
  const claseOpcion = (activa) => `w-full text-left border-2 rounded-2xl p-4 mb-3 transition-all duration-300 ${activa ? 'border-[#2D6A6A] bg-[#F4F7F7]' : 'border-gray-200 bg-white hover:border-[#2D6A6A]/50'}`;

  return (
    <VentanaBolsa abierta={abierta} onCerrar={onCerrar}>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] leading-tight pr-10">Postularme a {titulo}</h3>
      <p className="text-[13px] text-[#666666] mt-1 mb-5">{oferta?.clinicaNombre}</p>

      {cargando ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" /></div>
      ) : (
        <>
          <div role="radio" aria-checked={opcion === 'cv'} tabIndex={0} onClick={() => setOpcion('cv')} onKeyDown={(e) => e.key === 'Enter' && setOpcion('cv')} className={claseOpcion(opcion === 'cv')}>
            <p className="text-[14px] font-bold text-[#1A3D3D] mb-3">Adjuntar mi CV</p>
            <div onClick={(e) => e.stopPropagation()}>
              <CajaCV uid={currentUser?.uid} cv={cv} setCv={(nuevo) => { setCv(nuevo); if (nuevo) setOpcion('cv'); }} compacta />
            </div>
          </div>

          <button type="button" onClick={() => setOpcion('perfil')} className={claseOpcion(opcion === 'perfil')}>
            <p className="text-[14px] font-bold text-[#1A3D3D]">No tengo CV: uso mi perfil como currículum</p>
            <p className="text-[13px] text-[#666666] mt-1 break-all">
              {perfilUrl ? `La clínica va a ver tu trayectoria en ${perfilUrl.replace('https://www.', '')}` : 'Cuando tu perfil esté publicado, vas a poder usarlo como currículum.'}
            </p>
          </button>

          <p className="text-[14px] font-bold text-[#1A3D3D] mt-5 mb-2">Tu mensaje</p>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            maxLength={600}
            className="w-full border border-gray-200 focus:border-[#2D6A6A] rounded-2xl px-4 py-3 text-[14px] text-[#333333] focus:outline-none bg-gray-50/50 resize-none"
          />
          <p className="text-[12px] text-[#666666] mt-1 mb-4">Le llega a la clínica junto con el link a tu CV o a tu perfil.</p>

          {error && <p className="text-[13px] font-semibold text-red-600 mb-3">{error}</p>}

          <div className="flex flex-col gap-2">
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
        </>
      )}
    </VentanaBolsa>
  );
}
