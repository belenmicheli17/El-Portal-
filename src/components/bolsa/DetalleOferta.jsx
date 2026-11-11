import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, MapPin, Clock, Info, Link2, Check, Loader2, Lock, ExternalLink, ArrowRight } from 'lucide-react';
import { db } from '../../firebase';
import { etiquetaRol, publicadoHace, linkOferta, zonaTexto, linkMapa } from '../../utils/bolsa';
import VentanaPostulacion from './VentanaPostulacion';

const claseEtiqueta = "bg-[#F4F7F7] text-[#1A3D3D] text-[13px] font-semibold px-3.5 py-1.5 rounded-full";

// Una sección dentro de la hoja de la oferta (separadas por una línea, no como cajas sueltas)
function Seccion({ titulo, children }) {
  return (
    <section className="px-6 md:px-8 py-6 border-t border-gray-100">
      <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

// Un dato clave (Jornada, Horario, Experiencia) con su nota opcional abajo
function Dato({ titulo, valores, nota }) {
  if (!valores?.length && !nota) return null;
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-semibold text-[#666666] mb-1">{titulo}</p>
      {valores?.length > 0 && <p className="text-[15px] font-semibold text-[#1A3D3D] leading-snug">{valores.join(' · ')}</p>}
      {nota && <p className="text-[13px] text-[#666666] mt-1 leading-relaxed">{nota}</p>}
    </div>
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
  const zona = zonaTexto(oferta);
  const mapa = linkMapa(oferta);
  const requisitos = oferta.requisitos || [];
  const equipo = oferta.equipo || [];

  // Botón principal de la caja oscura: blanco, y al pasar el mouse se pinta de verde agua y se levanta
  const clasePrincipal = "group w-full bg-white text-[#1A3D3D] py-3.5 rounded-2xl text-[15px] font-bold shadow-md flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#4DB6AC] hover:shadow-lg hover:-translate-y-0.5";
  const claseSecundario = "w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-colors";

  const cajaPostulacion = () => {
    if (!permisos.conSesion) {
      return (
        <>
          <p className="text-white/70 text-[14px] leading-relaxed mb-5">Para ver el contacto y postularte, creá tu perfil en 5 minutos. Es gratis.</p>
          <button type="button" onClick={() => navigate('/login', { state: { registro: true } })} className={`${clasePrincipal} mb-2`}>Crear mi perfil</button>
          <button type="button" onClick={() => navigate('/login')} className={claseSecundario}>Ya tengo cuenta</button>
        </>
      );
    }
    if (esMia) {
      return <p className="text-white/70 text-[14px] leading-relaxed">Es tu publicación. La podés editar, extender o borrar desde «Mis publicaciones».</p>;
    }
    if (currentUser?.rol !== 'profesional') {
      return <p className="text-white/70 text-[14px] leading-relaxed">Las postulaciones son para profesionales veterinarios registrados.</p>;
    }
    if (!permisos.puedePostularse) {
      return (
        <>
          <p className="text-white/70 text-[14px] leading-relaxed mb-5">Vas a poder postularte apenas verifiquemos tu matrícula.</p>
          <button type="button" onClick={onPedirVerificacion} className={claseSecundario}>Ver estado de mi cuenta</button>
        </>
      );
    }
    if (cargandoContacto) return <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>;
    if (!contacto) return <p className="text-white/70 text-[14px] leading-relaxed">Esta publicación no tiene un contacto cargado.</p>;
    const tipos = contacto.tipoContacto || [];
    const via = tipos.includes('whatsapp') && tipos.includes('email') ? 'WhatsApp o mail' : tipos.includes('whatsapp') ? 'WhatsApp' : 'mail';
    return (
      <>
        <p className="text-white/70 text-[14px] leading-relaxed mb-5">La clínica recibe postulaciones por {via}. Elegí si te postulás con tu currículum o con tu perfil.</p>
        <button type="button" onClick={() => setPostulando(true)} className={clasePrincipal}>
          Postularme ahora <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </>
    );
  };

  const hayDatos = (oferta.jornada || []).length || (oferta.horario || []).length || oferta.experiencia || oferta.notaJornada || oferta.notaHorario;

  return (
    <article className="max-w-6xl mx-auto w-full px-4 pt-6 lg:pt-10 pb-16 font-['Inter'] relative z-10 animate-in fade-in duration-300">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-6">
        <ChevronLeft className="w-4 h-4" /> Volver a la Bolsa
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 items-start">
        {/* LA OFERTA: una sola hoja, con secciones separadas por líneas */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.06)] overflow-hidden">
          {/* Encabezado */}
          <header className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              {oferta.clinicaFoto ? (
                <img src={oferta.clinicaFoto} alt={oferta.clinicaNombre} className="w-16 h-16 md:w-20 md:h-20 shrink-0 object-cover rounded-[20px] border border-gray-50 shadow-sm" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[20px] bg-[#1A3D3D] text-white font-['Montserrat'] font-extrabold text-[18px] md:text-[22px] flex items-center justify-center">
                  {String(oferta.clinicaNombre || 'PV').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-1">Buscan</p>
                <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[24px] md:text-[32px] leading-tight tracking-tight">{etiquetaRol(oferta.rol)}</h1>
                {oferta.clinicaSlug ? (
                  <button type="button" onClick={() => navigate(`/clinica/${oferta.clinicaSlug}`)} className="block text-[#2D6A6A] text-[15px] font-semibold mt-1 hover:underline underline-offset-2 text-left">
                    {oferta.clinicaNombre} · ver página de la clínica
                  </button>
                ) : (
                  <p className="text-[#2D6A6A] text-[15px] font-semibold mt-1">{oferta.clinicaNombre}</p>
                )}

                {/* Ubicación corta (sin calle ni código postal); al tocarla abre el mapa */}
                {zona && (mapa ? (
                  <a href={mapa} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1.5 text-[#333333] text-[14px] font-semibold mt-2 hover:text-[#2D6A6A] group">
                    <MapPin className="w-4 h-4 shrink-0 text-[#2D6A6A]" /> <span className="underline decoration-gray-300 underline-offset-4 group-hover:decoration-[#2D6A6A]">{zona}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#666666] group-hover:text-[#2D6A6A]" />
                  </a>
                ) : (
                  <p className="flex items-center gap-1.5 text-[#333333] text-[14px] font-semibold mt-2"><MapPin className="w-4 h-4 shrink-0 text-[#2D6A6A]" /> {zona}</p>
                ))}
              </div>
            </div>

            {/* Datos clave, en columnas */}
            {hayDatos ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 bg-[#F4F7F7] rounded-2xl p-5">
                <Dato titulo="Jornada" valores={oferta.jornada} nota={oferta.notaJornada} />
                <Dato titulo="Horario" valores={oferta.horario} nota={oferta.notaHorario} />
                <Dato titulo="Experiencia" valores={oferta.experiencia ? [oferta.experiencia] : []} />
              </div>
            ) : null}
          </header>

          {oferta.descripcion && (
            <Seccion titulo="Sobre el puesto">
              <p className="text-[15px] text-[#333333] leading-relaxed whitespace-pre-line">{oferta.descripcion}</p>
            </Seccion>
          )}

          {areas.length > 0 && (
            <Seccion titulo="Buscan principalmente un profesional con estas especialidades">
              <div className="flex flex-wrap gap-2">{areas.map((a) => <span key={a} className={claseEtiqueta}>{a}</span>)}</div>
            </Seccion>
          )}

          {requisitos.length > 0 && (
            <Seccion titulo="Requisitos">
              <ul className="flex flex-col gap-2">
                {requisitos.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[15px] text-[#333333]"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-1" /> {r}</li>
                ))}
              </ul>
            </Seccion>
          )}

          {equipo.length > 0 && (
            <Seccion titulo="Equipamiento de la clínica">
              <div className="flex flex-wrap gap-2">{equipo.map((e) => <span key={e} className={claseEtiqueta}>{e}</span>)}</div>
            </Seccion>
          )}

          {/* Pie de la hoja: copiar link y cuándo se publicó */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-4 border-t border-gray-100 bg-[#F4F7F7]/60">
            <button type="button" onClick={copiarLink} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]">
              {copiado ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} {copiado ? 'Link copiado' : 'Copiar link de la oferta'}
            </button>
            <span className="inline-flex items-center gap-1 text-[13px] text-[#666666] font-medium ml-auto">
              <Clock className="w-3.5 h-3.5" /> {publicadoHace(oferta.publicadaEn)}
            </span>
          </div>
        </div>

        {/* Caja de postulación */}
        <aside className="w-full lg:sticky lg:top-28">
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

      {/* Aviso legal: chiquito, sin caja */}
      <p className="text-[12px] text-[#666666] leading-relaxed mt-8 max-w-3xl">
        <strong className="text-[#1A3D3D]">Aviso legal:</strong> El Portal es un canal de difusión gratuito de búsquedas laborales de terceros. No interviene en la selección, la contratación ni las condiciones acordadas. Cada postulación queda bajo la responsabilidad del profesional y de la institución.
      </p>

      {contacto && (
        <VentanaPostulacion abierta={postulando} onCerrar={() => setPostulando(false)} oferta={oferta} contacto={contacto} currentUser={currentUser} />
      )}
    </article>
  );
}
