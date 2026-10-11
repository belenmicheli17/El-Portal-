import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import {
  ChevronLeft, ChevronRight, ChevronDown, MapPin, Phone, Mail, Globe,
  Clock, Star, AlertTriangle, Building2, Instagram, Facebook, Users,
  Award, Eye, X, Heart, MessageCircle
} from 'lucide-react';

// Pasos de urgencia que se muestran si la clínica activó la guardia pero no personalizó los suyos
const URGENCIAS_FALLBACK = [
  { id: 1, paso: '01', titulo: 'Mantené la calma', desc: 'Asegurá a tu mascota y evitá movimientos bruscos.' },
  { id: 2, paso: '02', titulo: 'Llamá o escribí', desc: 'Avisanos que estás en camino para preparar la sala.' },
  { id: 3, paso: '03', titulo: 'Transporte seguro', desc: 'Usá una transportadora o manta rígida si hay fracturas.' },
  { id: 4, paso: '04', titulo: 'Traé historial', desc: 'Si toma medicación o tiene estudios previos, traelos con vos.' }
];

// Estilos de las etiquetas de arriba (guardia, fundadora)
const ETIQUETA = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]';

// Carrusel horizontal reutilizable (galería, equipo, casos)
const CARRUSEL = 'flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1 lg:mx-0 lg:px-0 snap-x snap-mandatory scroll-px-5 lg:scroll-px-0';

// ==========================================
// CARRUSEL CON FLECHITAS (las flechas aparecen en PC solo si hay más para ver)
// ==========================================
function Carrusel({ children }) {
  const ref = useRef(null);
  const [hayIzquierda, setHayIzquierda] = useState(false);
  const [hayDerecha, setHayDerecha] = useState(false);

  // Mide si queda contenido a cada lado para mostrar o esconder cada flecha
  const medir = () => {
    const el = ref.current;
    if (!el) return;
    setHayIzquierda(el.scrollLeft > 4);
    setHayDerecha(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  });

  const mover = (direccion) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: direccion * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  const claseFlecha = 'hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] transition-all';

  return (
    <div className="relative">
      {hayIzquierda && (
        <button type="button" onClick={() => mover(-1)} aria-label="Ver anteriores" className={`${claseFlecha} -left-5`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div ref={ref} onScroll={medir} className={CARRUSEL}>
        {children}
      </div>
      {hayDerecha && (
        <button type="button" onClick={() => mover(1)} aria-label="Ver siguientes" className={`${claseFlecha} -right-5`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// ==========================================
// VISOR DE FOTOS A PANTALLA COMPLETA
// ==========================================
function VisorFotos({ visor, setVisor }) {
  if (!visor) return null;
  const { fotos, indice } = visor;
  const hayVarias = fotos.length > 1;

  const mover = (paso) => {
    setVisor({ fotos, indice: (indice + paso + fotos.length) % fotos.length });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
      onClick={() => setVisor(null)}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setVisor(null)}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <X className="w-5 h-5 text-[#1A3D3D]" />
        </button>
        <img src={fotos[indice]} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl" />
        {hayVarias && (
          <>
            <button onClick={() => mover(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-md">
              <ChevronLeft className="w-5 h-5 text-[#1A3D3D]" />
            </button>
            <button onClick={() => mover(1)} aria-label="Siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-md">
              <ChevronRight className="w-5 h-5 text-[#1A3D3D]" />
            </button>
            <p className="text-center text-white/80 text-xs font-bold mt-3">{indice + 1} / {fotos.length}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// FOTO CON DESENFOQUE SI ES SENSIBLE
// ==========================================
function FotoSensible({ src, sensible, alt, className, onAbrir }) {
  const [revelada, setRevelada] = useState(false);
  const oculta = sensible && !revelada;

  return (
    <button
      type="button"
      onClick={() => (oculta ? setRevelada(true) : onAbrir())}
      className={`relative block overflow-hidden ${className}`}
    >
      <img src={src} alt={alt} className={`w-full h-full object-cover transition-all duration-300 ${oculta ? 'blur-2xl scale-110' : ''}`} />
      {oculta && (
        <span className="absolute inset-0 bg-[#1A3D3D]/70 flex flex-col items-center justify-center gap-1.5 text-white px-4 text-center">
          <Eye className="w-6 h-6" />
          <span className="text-xs font-bold">Contenido sensible</span>
          <span className="text-[11px] font-medium opacity-80">Tocá para ver la imagen</span>
        </span>
      )}
    </button>
  );
}

// ==========================================
// PÁGINA
// ==========================================
export default function PerfilClinica() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [visor, setVisor] = useState(null);
  const [urgenciaAbierta, setUrgenciaAbierta] = useState(false);
  const [presentacionAbierta, setPresentacionAbierta] = useState(false);
  const [highlightContacto, setHighlightContacto] = useState(false);
  const scrollRef = useRef(null);

  // Trae la clínica: se busca por el campo "slug" y, si no aparece, por el formato viejo (id = slug)
  useEffect(() => {
    const fetchClinicaInfo = async () => {
      try {
        if (!slug) return;
        const consulta = await getDocs(query(collection(db, 'clinicas'), where('slug', '==', slug)));
        const docSnap = consulta.docs[0] || await getDoc(doc(db, 'clinicas', slug));

        if (docSnap.exists()) {
          const firebaseData = docSnap.data();
          // El plan vive en el propio documento de la clínica (público). No leemos "usuarios" porque es privado.
          const planFinal = firebaseData.socioVitalicio === true || firebaseData.planActual === 'pro' ? 'pro' : 'gratis';
          setData({
            ...firebaseData,
            planActual: planFinal,
            urgencias: (firebaseData.urgencias && firebaseData.urgencias.length > 0) ? firebaseData.urgencias : URGENCIAS_FALLBACK
          });
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error obteniendo el perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinicaInfo();
  }, [slug]);

  // Tipografías, estilos sueltos y el aviso para resaltar el contacto
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      #contacto { scroll-margin-top: 100px; }
      .highlight-animation { transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);

    const handleHighlightEvent = () => {
      setHighlightContacto(true);
      setTimeout(() => setHighlightContacto(false), 2500);
    };
    window.addEventListener('trigger-highlight-contacto', handleHighlightEvent);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
      window.removeEventListener('trigger-highlight-contacto', handleHighlightEvent);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D6A6A]/30 border-t-[#2D6A6A] rounded-full animate-spin mb-4"></div>
        <p className="text-[#1A3D3D] font-bold">Cargando perfil...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center px-6">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-lg">Esta clínica aún no configuró su perfil.</p>
          <p className="text-gray-400 text-sm mt-2">Guardá datos en el Editor para verlos aquí.</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // DATOS ARMADOS PARA MOSTRAR
  // ==========================================
  const esPro = data.planActual === 'pro';

  // Etiqueta de fundadora (si no tiene número guardado, se muestra sin número)
  const esFundadora = data.socioVitalicio === true;
  const textoFundadora = data.numeroFundador ? `Clínica fundadora n° ${data.numeroFundador}` : 'Clínica fundadora';

  // Fotos: la galería también aporta la portada de arriba
  const galeria = Array.isArray(data.galeria) ? data.galeria.filter((g) => g && g.url) : [];
  const portada = galeria.find((g) => !g.esSensible)?.url || null;

  // Servicios: "Atendemos" (especies) va aparte y el resto se junta en una sola caja
  const servicios = data.servicios && typeof data.servicios === 'object' ? data.servicios : {};
  const listaDe = (serv) => [...(serv?.subOpcionesSeleccionadas || []), ...(serv?.serviciosPersonalizados || [])].filter(Boolean);
  const atendemos = servicios.atencion_por_especie?.activo ? listaDe(servicios.atencion_por_especie) : [];
  const todosLosServicios = Object.entries(servicios)
    .filter(([clave, serv]) => serv && serv.activo && clave !== 'atencion_por_especie')
    .flatMap(([, serv]) => listaDe(serv));

  const staff = Array.isArray(data.staff) ? data.staff.filter((m) => m.nombre && m.nombre.trim()) : [];
  const casos = Array.isArray(data.casos) ? data.casos.filter((c) => c && (c.patologia || c.nombre || c.desc || (c.fotos && c.fotos.length))) : [];
  const faqsActivas = Array.isArray(data.faqs) ? data.faqs.filter((f) => f.respuesta && f.respuesta.trim() !== '') : [];

  // Horarios (solo se muestran si están completos, así no aparece "09 – undefined hs")
  const h = data.horarios || {};
  const horarioSemana = h.semanaDesde && h.semanaHasta ? `${h.semanaDesde} – ${h.semanaHasta} hs` : null;
  const horarioSabado = h.sabadoDesde && h.sabadoHasta ? `${h.sabadoDesde} – ${h.sabadoHasta} hs` : null;

  // Zona y provincia sin repetir: "Castelar, Buenos Aires" (si barrio y localidad son iguales, se muestra una sola vez)
  const provinciaCorta = (data.provincia || '').replace(/^Provincia de\s+/i, '').trim();
  const zona = data.barrio || data.localidad || '';
  const ubicacionCorta = [zona, provinciaCorta].filter(Boolean).join(', ');
  // La dirección de Google viene larga ("Calle 123, B1712KSK Castelar, Provincia de ..."): nos quedamos solo con la calle y el número
  const calleYNumero = (data.direccion || '').split(',')[0].trim();

  const textoPresentacion = data.historia || data.descripcion || '';
  const presentacionLarga = textoPresentacion.length > 260;

  const linkUrgencia = data.telefonoGuardia ? `https://wa.me/${data.telefonoGuardia}` : `https://wa.me/${data.whatsapp}`;
  const linkWhatsapp = `https://wa.me/${data.whatsapp}`;
  const linkMapa = data.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccion)}${data.placeId ? `&query_place_id=${data.placeId}` : ''}`
    : null;
  const mapaIncrustado = data.direccion
    ? `https://maps.google.com/maps?q=${encodeURIComponent(data.direccion)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : null;

  const irAContacto = (e) => {
    e.preventDefault();
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-['Inter'] bg-white min-h-screen pb-28 lg:pb-0 text-[#333]">

      <VisorFotos visor={visor} setVisor={setVisor} />

      {/* ============ PORTADA ============ */}
      <header className="relative h-[220px] lg:h-[320px] bg-[#1A3D3D] overflow-hidden">
        {portada ? (
          <img src={portada} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A3D3D] via-[#2D6A6A] to-[#4DB6AC]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A3D3D]/60 via-transparent to-[#1A3D3D]/30" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 top-5 lg:left-10 lg:top-8 flex items-center gap-1.5 text-white/90 hover:text-white text-[11px] font-bold uppercase tracking-[0.2em] z-10"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
      </header>

      {/* ============ TARJETA DE CABECERA ============ */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-8 -mt-16 lg:-mt-24 relative z-10">
        <div className="bg-white rounded-[28px] lg:rounded-[32px] shadow-[0_18px_44px_rgba(26,61,61,0.15)] p-5 lg:p-8 lg:flex lg:items-center lg:gap-8">
          <div className="w-[84px] h-[84px] lg:w-[132px] lg:h-[132px] -mt-14 lg:mt-0 mb-3 lg:mb-0 rounded-[24px] lg:rounded-[32px] bg-white border border-gray-100 shadow-lg lg:shadow-none overflow-hidden flex items-center justify-center shrink-0">
            {data.foto ? (
              <img src={data.foto} alt={data.nombre} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-9 h-9 text-[#2D6A6A]/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {(data.guardia24hs || esFundadora) && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {data.guardia24hs && (
                  <span className={`${ETIQUETA} bg-red-50 text-red-600`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    Guardia 24 hs
                  </span>
                )}
                {esFundadora && (
                  <span className={`${ETIQUETA} bg-[#FFF6DD] text-[#8a6200]`}>
                    <Star className="w-3 h-3 fill-current" /> {textoFundadora}
                  </span>
                )}
              </div>
            )}
            <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] lg:text-[44px] leading-[1.1] tracking-tight break-words">
              {data.nombre}
            </h1>
            {calleYNumero && (
              linkMapa ? (
                <a
                  href={linkMapa}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-start gap-1.5 text-[#2D6A6A] hover:text-[#1A3D3D] text-[13px] lg:text-sm font-semibold underline-offset-4 hover:underline transition-colors"
                >
                  <MapPin className="w-4 h-4 shrink-0 mt-px" />
                  <span>{calleYNumero}{zona ? ` · ${zona}` : ''}</span>
                </a>
              ) : (
                <p className="mt-2 text-[#2D6A6A] text-[13px] lg:text-sm font-semibold">{calleYNumero}{zona ? ` · ${zona}` : ''}</p>
              )
            )}
          </div>

          {/* Botones de la tarjeta: solo en PC (en el celular van en la barra fija de abajo) */}
          <div className="hidden lg:flex flex-col gap-2.5 w-[240px] shrink-0">
            <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center min-h-[48px] rounded-[14px] bg-[#25D366] text-white text-xs font-extrabold uppercase tracking-[0.1em] hover:brightness-95 transition">
              Escribir por WhatsApp
            </a>
            <a href="#contacto" onClick={irAContacto} className="flex items-center justify-center min-h-[48px] rounded-[14px] bg-[#1A3D3D] text-white text-xs font-extrabold uppercase tracking-[0.1em] hover:bg-[#2D6A6A] transition">
              Cómo llegar
            </a>
          </div>
        </div>

        {/* ============ DATOS RÁPIDOS ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4 mt-4">
          <div className="bg-[#F4F7F7] border border-[#e5eded] rounded-[20px] p-3.5 lg:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Horarios</p>
            <p className="font-bold text-[#1A3D3D] text-[13px] lg:text-sm mt-1.5 leading-snug">
              {data.guardia24hs ? 'Atención las 24 hs' : horarioSemana ? `Lun a vie · ${horarioSemana}` : 'A confirmar'}
            </p>
            {!data.guardia24hs && horarioSabado && <p className="text-xs text-gray-500 mt-0.5">Sáb · {horarioSabado}</p>}
          </div>
          <div className="bg-[#F4F7F7] border border-[#e5eded] rounded-[20px] p-3.5 lg:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Ubicación</p>
            <p className="font-bold text-[#1A3D3D] text-[13px] lg:text-sm mt-1.5 leading-snug">{ubicacionCorta || data.provincia || 'A confirmar'}</p>
          </div>
          {data.añosExperiencia ? (
            <div className="bg-[#F4F7F7] border border-[#e5eded] rounded-[20px] p-3.5 lg:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5"><Award className="w-3 h-3" /> Trayectoria</p>
              <p className="font-bold text-[#1A3D3D] text-[13px] lg:text-sm mt-1.5">+{data.añosExperiencia} años</p>
            </div>
          ) : null}
          {staff.length > 0 && (
            <div className="bg-[#F4F7F7] border border-[#e5eded] rounded-[20px] p-3.5 lg:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5"><Users className="w-3 h-3" /> Equipo</p>
              <p className="font-bold text-[#1A3D3D] text-[13px] lg:text-sm mt-1.5">{staff.length} profesional{staff.length !== 1 ? 'es' : ''}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-5 lg:px-8">

        {/* ============ ATENDEMOS ============ */}
        {atendemos.length > 0 && (
          <section className="pt-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A] flex items-center gap-1.5"><Heart className="w-3 h-3" /> Atendemos</p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {atendemos.map((a, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-[#E8F3F2] text-[#1A3D3D] text-xs font-bold">{a}</span>
              ))}
            </div>
          </section>
        )}

        {/* ============ PRESENTACIÓN ============ */}
        {textoPresentacion && (
          <section className="pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Quiénes somos</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] lg:text-3xl tracking-tight mt-2 mb-3">Sobre nosotros</h2>
            <p
              className="text-base lg:text-[17px] leading-relaxed text-gray-600 font-medium whitespace-pre-line"
              style={presentacionLarga && !presentacionAbierta ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 5, overflow: 'hidden' } : {}}
            >
              {textoPresentacion}
            </p>
            {presentacionLarga && (
              <button
                onClick={() => setPresentacionAbierta(!presentacionAbierta)}
                className="mt-2 text-[#2D6A6A] text-xs font-bold flex items-center gap-1"
              >
                {presentacionAbierta ? 'Ver menos' : 'Ver más'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${presentacionAbierta ? 'rotate-180' : ''}`} />
              </button>
            )}
          </section>
        )}

        {/* ============ SERVICIOS (todos en una sola caja) ============ */}
        {esPro && todosLosServicios.length > 0 && (
          <section className="pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Qué ofrecemos</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl lg:text-3xl tracking-tight mt-2 mb-3.5">Servicios</h2>
            <div className="bg-[#F4F7F7] border border-[#e5eded] rounded-3xl p-5 flex flex-wrap gap-1.5">
              {todosLosServicios.map((s, i) => (
                <span key={i} className="px-3.5 py-2 rounded-[10px] bg-white border border-[#dfe8e8] text-[13px] lg:text-sm font-semibold text-gray-600">{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* ============ GALERÍA ============ */}
        {galeria.length > 0 && (
          <section className="pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Galería</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl lg:text-3xl tracking-tight mt-2 mb-3.5">Conocé el lugar</h2>
            <Carrusel>
              {galeria.map((g, i) => (
                <div key={g.id || i} className="shrink-0 snap-start w-[260px] lg:w-[calc((100%-1.5rem)/3)]">
                  <FotoSensible
                    src={g.url}
                    sensible={g.esSensible}
                    alt={g.epigrafe || `Foto ${i + 1} de ${data.nombre}`}
                    className="w-full h-[180px] lg:h-[220px] rounded-[20px]"
                    onAbrir={() => setVisor({ fotos: galeria.map((x) => x.url), indice: i })}
                  />
                  {g.epigrafe && <p className="text-xs text-gray-500 font-medium mt-1.5 px-1">{g.epigrafe}</p>}
                </div>
              ))}
            </Carrusel>
          </section>
        )}

        {/* ============ PREGUNTAS FRECUENTES ============ */}
        {esPro && faqsActivas.length > 0 && (
          <section className="pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Dudas</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl lg:text-3xl tracking-tight mt-2 mb-3.5">Preguntas frecuentes</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
              {faqsActivas.map((faq) => (
                <div key={faq.id} className="border border-[#e5eded] rounded-2xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="font-bold text-[#1A3D3D] text-sm leading-snug">{faq.pregunta}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 text-[#2D6A6A] transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === faq.id && (
                    <p className="px-4 pb-4 text-sm text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-3">{faq.respuesta}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ URGENCIAS ============ */}
        {data.guardia24hs && (
          <section className="pt-9">
            <div className="bg-red-50 border border-red-100 rounded-3xl p-5 lg:p-8">
              <button
                onClick={() => setUrgenciaAbierta(!urgenciaAbierta)}
                className="w-full flex items-center justify-between gap-3 text-left lg:cursor-default"
              >
                <div>
                  <p className="text-red-600 text-[10px] font-extrabold uppercase tracking-[0.14em] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Guardia 24 hs
                  </p>
                  <h2 className="font-['Montserrat'] font-black text-red-700 text-lg lg:text-3xl leading-tight mt-1.5">¿Qué hacer ante una urgencia?</h2>
                </div>
                <ChevronDown className={`w-5 h-5 text-red-700 shrink-0 transition-transform lg:hidden ${urgenciaAbierta ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${urgenciaAbierta ? 'grid' : 'hidden'} lg:grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4 mt-4`}>
                {data.urgencias.map((u, i) => (
                  <div key={i} className="bg-white border border-red-100 rounded-2xl p-3.5 lg:p-5">
                    <span className="inline-flex w-8 h-8 rounded-xl bg-red-50 text-red-500 font-black font-['Montserrat'] text-sm items-center justify-center border border-red-100 mb-2">{u.paso}</span>
                    <h3 className="font-bold text-red-600 font-['Montserrat'] text-sm leading-snug mb-1">{u.titulo}</h3>
                    <p className="text-red-900/70 text-xs lg:text-sm leading-relaxed font-medium">{u.desc}</p>
                  </div>
                ))}
              </div>

              <a
                href={linkUrgencia}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-[0.1em] transition lg:inline-flex lg:px-8"
              >
                <AlertTriangle className="w-4 h-4" /> Avisar que voy en camino
              </a>
            </div>
          </section>
        )}

        {/* ============ EQUIPO ============ */}
        {esPro && staff.length > 0 && (
          <section className="pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Nuestro equipo</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl lg:text-3xl tracking-tight mt-2 mb-3.5">Profesionales</h2>
            <Carrusel>
              {staff.map((m, idx) => (
                <div key={m.id || idx} className="shrink-0 snap-start w-[230px] lg:w-[250px] bg-[#F4F7F7] border border-[#e5eded] rounded-3xl p-5 text-center">
                  {m.foto ? (
                    <button type="button" onClick={() => setVisor({ fotos: [m.foto], indice: 0 })} className="block mx-auto w-20 h-20 rounded-full overflow-hidden mb-3 cursor-zoom-in">
                      <img src={m.foto} alt={m.nombre} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="mx-auto w-20 h-20 rounded-full bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] mb-3"><Users className="w-7 h-7" /></div>
                  )}
                  <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px] leading-tight">{m.nombre}</h3>
                  {m.especialidad && <p className="text-[#2D6A6A] text-xs font-bold mt-1">{m.especialidad}</p>}
                  {m.matricula && <p className="text-gray-400 text-[11px] mt-1">Matrícula {m.tipoMatricula ? `${m.tipoMatricula} ` : ''}{m.matricula}</p>}
                  {m.bio && <p className="text-gray-500 text-xs leading-relaxed mt-2 line-clamp-4">{m.bio}</p>}
                </div>
              ))}
            </Carrusel>
          </section>
        )}

        {/* ============ CASOS CLÍNICOS ============ */}
        {casos.length > 0 && (
          <section className="pt-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Casos clínicos</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl lg:text-3xl tracking-tight mt-2 mb-3.5">Lo que hacemos</h2>
            <Carrusel>
              {casos.map((c, idx) => (
                <article key={c.id || idx} className="shrink-0 snap-start w-[270px] lg:w-[300px] bg-[#F4F7F7] border border-[#e5eded] rounded-3xl overflow-hidden">
                  {c.fotos && c.fotos.length > 0 ? (
                    <div className="relative">
                      <FotoSensible
                        src={c.fotos[0]}
                        sensible={c.esSensible}
                        alt={c.patologia || c.nombre || 'Caso clínico'}
                        className="w-full h-[150px]"
                        onAbrir={() => setVisor({ fotos: c.fotos, indice: 0 })}
                      />
                      {c.fotos.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full pointer-events-none">{c.fotos.length} fotos</span>
                      )}
                    </div>
                  ) : null}
                  <div className="p-4">
                    {c.patologia && <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-sm leading-snug">{c.patologia}</h3>}
                    {c.nombre && <p className="text-[#2D6A6A] text-xs font-bold mt-1">{c.nombre}</p>}
                    {c.desc && <p className="text-gray-500 text-xs leading-relaxed mt-1.5 line-clamp-4">{c.desc}</p>}
                  </div>
                </article>
              ))}
            </Carrusel>
          </section>
        )}

        {/* ============ CONTACTO ============ */}
        <section id="contacto" className="pt-9 pb-12" ref={scrollRef}>
          <div
            className={`highlight-animation bg-[#E8F3F2] rounded-[28px] lg:rounded-[36px] p-5 lg:p-9 lg:flex lg:gap-9
              ${highlightContacto ? 'scale-[1.02] shadow-[0_0_80px_rgba(45,106,106,0.3)] ring-4 ring-[#4DB6AC]/50' : ''}`}
          >
            <div className="lg:flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6A6A]">Contacto</p>
              <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] lg:text-3xl leading-tight tracking-tight mt-2 mb-4">Estamos cerca tuyo</h2>

              {mapaIncrustado && (
                <div className="h-[150px] lg:hidden rounded-[18px] overflow-hidden mb-3.5 bg-white">
                  <iframe title="Ubicación en el mapa" width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={mapaIncrustado}></iframe>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {data.whatsapp && (
                  <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white rounded-2xl p-3.5">
                    <span className="w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0"><Phone className="w-4 h-4" /></span>
                    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-gray-400">WhatsApp</span><span className="block text-sm font-black text-[#1A3D3D] truncate">+{data.whatsapp}</span></span>
                  </a>
                )}
                {data.email && (
                  <a href={`mailto:${data.email}`} className="flex items-center gap-3 bg-white rounded-2xl p-3.5">
                    <span className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center shrink-0"><Mail className="w-4 h-4" /></span>
                    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-gray-400">Email</span><span className="block text-sm font-black text-[#1A3D3D] truncate">{data.email}</span></span>
                  </a>
                )}
                {data.telefono && (
                  <a href={`tel:${data.telefono}`} className="flex items-center gap-3 bg-white rounded-2xl p-3.5">
                    <span className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center shrink-0"><Phone className="w-4 h-4" /></span>
                    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-gray-400">Teléfono fijo</span><span className="block text-sm font-black text-[#1A3D3D] truncate">{data.telefono}</span></span>
                  </a>
                )}
                {data.sitioWeb && (
                  <a href={data.sitioWeb} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white rounded-2xl p-3.5">
                    <span className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center shrink-0"><Globe className="w-4 h-4" /></span>
                    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-gray-400">Sitio web</span><span className="block text-sm font-black text-[#1A3D3D] truncate">{data.sitioWeb.replace(/^https?:\/\//, '')}</span></span>
                  </a>
                )}
                {data.redes && (data.redes.instagram || data.redes.facebook) && (
                  <div className="flex gap-2">
                    {data.redes.instagram && (
                      <a href={data.redes.instagram} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-white rounded-2xl p-3.5 text-[#E4405F] text-sm font-bold">
                        <Instagram className="w-4 h-4" /> Instagram
                      </a>
                    )}
                    {data.redes.facebook && (
                      <a href={data.redes.facebook} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-white rounded-2xl p-3.5 text-[#1877F2] text-sm font-bold">
                        <Facebook className="w-4 h-4" /> Facebook
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {mapaIncrustado && (
              <div className="hidden lg:block lg:flex-1 min-h-[340px] rounded-[28px] overflow-hidden bg-white">
                <iframe title="Ubicación en el mapa" width="100%" height="100%" style={{ border: 0, minHeight: 340 }} loading="lazy" src={mapaIncrustado}></iframe>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ============ WHATSAPP FLOTANTE (solo PC) ============ */}
      {data.whatsapp && (
        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribir por WhatsApp"
          className="hidden lg:flex fixed bottom-6 right-6 z-[110] w-16 h-16 bg-[#25D366] rounded-full items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      )}

      {/* ============ BARRA FIJA (celular): WhatsApp | Cómo llegar ============ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-[110] px-4 pt-3 pb-4 bg-white/95 backdrop-blur border-t border-[#e5eded] shadow-[0_-10px_30px_rgba(26,61,61,0.08)]">
        <div className="flex rounded-2xl overflow-hidden shadow-lg">
          <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="flex-1 min-h-[52px] bg-[#25D366] text-white flex items-center justify-center text-xs font-extrabold uppercase tracking-[0.1em]">
            WhatsApp
          </a>
          <a href="#contacto" onClick={irAContacto} className="flex-1 min-h-[52px] bg-[#1A3D3D] text-white flex items-center justify-center text-xs font-extrabold uppercase tracking-[0.1em] border-l border-white/25">
            Cómo llegar
          </a>
        </div>
      </div>
    </div>
  );
}