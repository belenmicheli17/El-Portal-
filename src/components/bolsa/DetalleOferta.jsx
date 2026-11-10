import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, MapPin, Clock, Briefcase, Stethoscope, ListChecks, Building2, Info, AlertTriangle, Link2, Check, Loader2, Lock } from 'lucide-react';
import { db } from '../../firebase';
import { tituloPuesto, etiquetaRol, tiempoDesde, linkOferta } from '../../utils/bolsa';
import VentanaPostulacion from './VentanaPostulacion';

const clasePill = "bg-[#2D6A6A]/10 text-[#1A3D3D] text-[13px] font-semibold px-3 py-1 rounded-full";
const claseEtiqueta = "bg-white border border-gray-200 text-[#333333] text-[13px] font-semibold px-3.5 py-1.5 rounded-xl";

function Bloque({ titulo, icono: Icono, children }) {
  return (
    <section className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
      <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] mb-4 flex items-center gap-2">
        <Icono className="w-5 h-5 text-[#2D6A6A]" /> {titulo}
      </h3>
      {children}
    </section>
  );
}

export default function DetalleOferta({ oferta, permisos, currentUser, onVolver, onPedirVerificacion }) {
  const navigate = useNavigate();
  const [contacto, setContacto] = useState(null);
  const [cargandoContacto, setCargandoContacto] = useState(false);
  const [postulando, setPostulando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const esMia = currentUser?.uid && oferta.creadorId === currentUser.uid;

  // El contacto vive aparte: solo lo puede leer quien inició sesión
  useEffect(() => {
    if (!permisos.conSesion) return;
    let cancelado = false;
    setCargandoContacto(true);
    getDoc(doc(db, 'ofertasEmpleo', oferta.id, 'privado', 'contacto'))
      .then((snap) => { if (!cancelado) setContacto(snap.exists() ? snap.data() : null); })
      .catch((e) => console.error('Error leyendo el contacto:', e))
      .finally(() => { if (!cancelado) setCargandoContacto(false); });
    return () => { cancelado = true; };
  }, [oferta.id, permisos.conSesion]);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkOferta(oferta.id));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.error('No se pudo copiar:', e);
    }
  };

  const areas = oferta.areas || [];
  const requisitos = oferta.requisitos || [];
  const equipo = oferta.equipo || [];

  const cajaPostulacion = () => {
    if (!permisos.conSesion) {
      return (
        <>
          <p className="text-white/70 text-[14px] leading-relaxed mb-5">Para ver el contacto y postularte, creá tu perfil en 5 minutos. Es gratis.</p>
          <button type="button" onClick={() => navigate('/login', { state: { registro: true } })} className="w-full bg-[#4DB6AC] hover:bg-white text-[#1A3D3D] py-3.5 rounded-2xl text-[14px] font-semibold transition-colors mb-2">Crear mi perfil</button>
          <button type="button" onClick={() => navigate('/login')} className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">Ya tengo cuenta</button>
        </>
      );
    }
    if (esMia) {
      return <p className="text-white/70 text-[14px] leading-relaxed">Es tu publicación. La podés editar, renovar o cerrar desde «Mis publicaciones».</p>;
    }
    if (currentUser?.rol !== 'profesional') {
      return <p className="text-white/70 text-[14px] leading-relaxed">Las postulaciones son para profesionales veterinarios registrados.</p>;
    }
    if (!permisos.puedePostularse) {
      return (
        <>
          <p className="text-white/70 text-[14px] leading-relaxed mb-5">Vas a poder postularte apenas verifiquemos tu matrícula.</p>
          <button type="button" onClick={onPedirVerificacion} className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">Ver estado de mi cuenta</button>
        </>
      );
    }
    if (cargandoContacto) return <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>;
    if (!contacto) return <p className="text-white/70 text-[14px] leading-relaxed">Esta publicación no tiene un contacto cargado.</p>;
    const tipos = contacto.tipoContacto || [];
    const via = tipos.includes('whatsapp') && tipos.includes('email') ? 'WhatsApp o mail' : tipos.includes('whatsapp') ? 'WhatsApp' : 'mail';
    return (
      <>
        <p className="text-white/70 text-[14px] leading-relaxed mb-5">La clínica recibe postulaciones por {via}. Elegí si te postulás con tu CV o con tu perfil.</p>
        <button type="button" onClick={() => setPostulando(true)} className="w-full bg-[#4DB6AC] hover:bg-white text-[#1A3D3D] py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">Postularme ahora</button>
      </>
    );
  };

  return (
    <article className="max-w-6xl mx-auto w-full px-4 pt-6 lg:pt-10 pb-16 font-['Inter'] relative z-10 animate-in fade-in duration-300">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-6">
        <ChevronLeft className="w-4 h-4" /> Volver a la Bolsa
      </button>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-5">
          {/* Encabezado */}
          <header className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              {oferta.clinicaFoto ? (
                <img src={oferta.clinicaFoto} alt={oferta.clinicaNombre} className="w-16 h-16 shrink-0 object-cover rounded-[18px] border border-gray-50 shadow-sm" />
              ) : (
                <div className="w-16 h-16 shrink-0 rounded-[18px] bg-[#1A3D3D] text-white font-['Montserrat'] font-extrabold text-[18px] flex items-center justify-center">
                  {String(oferta.clinicaNombre || 'PV').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] md:text-[28px] leading-tight tracking-tight">{tituloPuesto(oferta)}</h1>
                {oferta.rol === 'veterinario' && areas.length > 0 && <p className="text-[#666666] text-[13px] font-medium mt-1">{etiquetaRol(oferta.rol)}</p>}
                {oferta.clinicaSlug ? (
                  <button type="button" onClick={() => navigate(`/clinica/${oferta.clinicaSlug}`)} className="text-[#2D6A6A] text-[14px] font-semibold mt-1 hover:underline underline-offset-2 text-left">
                    {oferta.clinicaNombre} · ver página de la clínica
                  </button>
                ) : (
                  <p className="text-[#2D6A6A] text-[14px] font-semibold mt-1">{oferta.clinicaNombre}</p>
                )}
              </div>
            </div>

            {oferta.direccion && (
              <p className="flex items-start gap-1.5 text-[#666666] text-[14px] font-medium mt-4">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {oferta.direccion}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {(oferta.jornada || []).map((j) => <span key={j} className={clasePill}>{j}</span>)}
              {(oferta.horario || []).map((h) => <span key={h} className={clasePill}>{h}</span>)}
              {oferta.experiencia && <span className={clasePill}>{oferta.experiencia}</span>}
              <span className="bg-[#F4F7F7] text-[#666666] text-[13px] font-medium px-3 py-1 rounded-lg inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {tiempoDesde(oferta.publicadaEn)}
              </span>
            </div>

            <button type="button" onClick={copiarLink} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mt-4">
              {copiado ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} {copiado ? 'Link copiado' : 'Copiar link de la oferta'}
            </button>
          </header>

          {oferta.descripcion && (
            <Bloque titulo="Sobre el puesto" icono={Briefcase}>
              <p className="text-[15px] text-[#333333] leading-relaxed whitespace-pre-line">{oferta.descripcion}</p>
            </Bloque>
          )}

          {areas.length > 0 && (
            <Bloque titulo="Áreas" icono={Stethoscope}>
              <div className="flex flex-wrap gap-2">{areas.map((a) => <span key={a} className={claseEtiqueta}>{a}</span>)}</div>
            </Bloque>
          )}

          {requisitos.length > 0 && (
            <Bloque titulo="Requisitos" icono={ListChecks}>
              <div className="flex flex-wrap gap-2">{requisitos.map((r) => <span key={r} className={claseEtiqueta}>{r}</span>)}</div>
            </Bloque>
          )}

          {equipo.length > 0 && (
            <Bloque titulo="Equipamiento de la clínica" icono={Building2}>
              <div className="flex flex-wrap gap-2">{equipo.map((e) => <span key={e} className={claseEtiqueta}>{e}</span>)}</div>
            </Bloque>
          )}
        </div>

        {/* Caja de postulación */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-28">
          <div className="bg-[#1A3D3D] p-7 rounded-[28px] shadow-xl">
            <h2 className="font-['Montserrat'] font-black text-white text-[20px] mb-3 flex items-center gap-2">
              {!permisos.conSesion && <Lock className="w-5 h-5 text-[#4DB6AC]" />} Postularme
            </h2>
            {cajaPostulacion()}
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-white/50 text-[12px] font-semibold mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Condiciones</p>
              <p className="text-white/70 text-[13px] leading-relaxed">Las condiciones económicas y contractuales se arreglan en privado entre el profesional y la clínica.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-white border border-gray-100 p-6 rounded-[24px] flex items-start gap-3 mt-8 text-[#666666] text-[13px] leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-[#2D6A6A] shrink-0 mt-0.5" />
        <p><strong className="text-[#1A3D3D]">Aviso legal:</strong> El Portal es un canal de difusión gratuito de búsquedas laborales de terceros. No interviene en la selección, la contratación ni las condiciones acordadas. Cada postulación queda bajo la responsabilidad del profesional y de la institución.</p>
      </div>

      {contacto && (
        <VentanaPostulacion abierta={postulando} onCerrar={() => setPostulando(false)} oferta={oferta} contacto={contacto} currentUser={currentUser} />
      )}
    </article>
  );
}
