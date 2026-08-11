import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';

import { 
  ChevronRight, ChevronLeft, ChevronDown, MapPin, Phone, Mail, Globe, 
  Clock, Star, ShieldCheck, Heart, AlertTriangle, 
  Stethoscope, Syringe, Microscope, Activity, Building2, 
  Facebook, Instagram, Info, Award, ArrowRight, Users, Sparkles, FileText, Brain
} from 'lucide-react';

const INFO_SERVICIOS = {
  'consulta_general':        { icono: Stethoscope, titulo: 'Consulta y Medicina General' },
  'especialidades_medicas':  { icono: Activity,    titulo: 'Especialidades Médicas' },
  'quirurgico_critico':      { icono: Syringe,     titulo: 'Quirúrgico' },
  'imagenes':                { icono: Microscope,  titulo: 'Imágenes' },
  'laboratorio':             { icono: FileText,    titulo: 'Laboratorio' },
  'atencion_por_especie':    { icono: Heart,       titulo: 'Atención por Especie' },
  'bienestar_comportamiento':{ icono: Sparkles,    titulo: 'Bienestar y Comportamiento' },
  'terapias_holisticas':     { icono: Brain,       titulo: 'Terapias Holísticas' },
};

// Urgencias de fallback completas para cuando la clínica activa la guardia
// pero aún no personalizó sus pasos
const URGENCIAS_FALLBACK = [
  { id: 1, paso: "01", titulo: "Mantené la calma", desc: "Asegurá a tu mascota y evitá movimientos bruscos." },
  { id: 2, paso: "02", titulo: "Llamá o escribí", desc: "Avisanos que estás en camino para preparar la sala." },
  { id: 3, paso: "03", titulo: "Transporte seguro", desc: "Usá una transportadora o manta rígida si hay fracturas." },
  { id: 4, paso: "04", titulo: "Traé historial", desc: "Si toma medicación o tiene estudios previos, traelos con vos." }
];

function StaffCarrusel({ staff, setFotoModal }) {
  const staffFiltrado = staff.filter(m => m.nombre && m.nombre.trim());
  const [staffIndex, setStaffIndex] = useState(0);
  const scrollRefPC = useRef(null);
  const visibles = 4;
  const necesitaFlechas = staffFiltrado.length > visibles;

  const scrollA = (idx) => {
    const nuevoIdx = Math.max(0, Math.min(staffFiltrado.length - 1, idx));
    setStaffIndex(nuevoIdx);
    if (scrollRefPC.current) {
      const card = scrollRefPC.current.children[nuevoIdx];
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  };

  // Contenido interno de cada card — igual para móvil y PC
  const CardInterna = ({ m }) => (
    <>
      {m.foto ? (
        <button
          type="button"
          onClick={() => setFotoModal(m.foto)}
          className="w-24 h-24 rounded-[24px] bg-gray-200 overflow-hidden mb-5 border border-white shadow-md hover:scale-105 transition-transform block shrink-0 cursor-zoom-in"
        >
          <img src={m.foto} alt={m.nombre} className="w-full h-full object-cover" />
        </button>
      ) : (
        <div className="w-24 h-24 rounded-[24px] bg-gray-200 overflow-hidden mb-5 border border-white shadow-md shrink-0">
          <div className="w-full h-full bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A]">
            <Users className="w-8 h-8" />
          </div>
        </div>
      )}
      <h3 className="text-[18px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">{m.nombre}</h3>
      <p className="text-[#2D6A6A] text-[11px] font-black uppercase tracking-widest mb-4 text-center">{m.especialidad}</p>
      <p className="text-gray-500 text-[14px] font-medium leading-relaxed mb-6 px-2 text-center line-clamp-4">{m.bio}</p>
      <div className="w-full mt-auto bg-white rounded-2xl p-3.5 border border-gray-100 text-left flex items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Matrícula</p>
          <p className="text-[13px] font-bold text-[#1A3D3D] leading-none">{m.matricula}</p>
        </div>
        <Award className="w-4 h-4 text-[#2D6A6A]" />
      </div>
    </>
  );

  return (
    <div className="relative">

      {/* MÓVIL: scroll horizontal tipo peek — se ve la primera card y un pedacito de la segunda */}
      <div
        className="lg:hidden flex gap-4 overflow-x-auto no-scrollbar pl-6 pr-3"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {staffFiltrado.map((m, idx) => (
          <div
            key={m.id || idx}
            className="bg-[#F4F7F7] border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col items-center shrink-0"
            style={{ scrollSnapAlign: 'start', width: '80vw' }}
          >
            <CardInterna m={m} />
          </div>
        ))}
        {/* Espaciador para que la última card no quede pegada al borde */}
        <div className="shrink-0 w-3" />
      </div>

      {/* PC: flechas solo si hay más de 4, grid centrado */}
      <div className="hidden lg:block relative">
        {necesitaFlechas && (
          <button
            onClick={() => scrollA(staffIndex - 1)}
            disabled={staffIndex === 0}
            className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {necesitaFlechas && (
          <button
            onClick={() => scrollA(staffIndex + 1)}
            disabled={staffIndex >= staffFiltrado.length - visibles}
            className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollRefPC}
          className={`flex gap-6 justify-center items-start ${necesitaFlechas ? 'overflow-x-auto no-scrollbar' : ''}`}
        >
          {staffFiltrado.map((m, idx) => (
            <div
              key={m.id || idx}
              className="bg-[#F4F7F7] border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all flex flex-col items-center w-[260px] shrink-0"
              style={necesitaFlechas ? { scrollSnapAlign: 'start' } : {}}
            >
              <CardInterna m={m} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default function PerfilClinica() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [fotoModal, setFotoModal] = useState(null);
  const [highlightContacto, setHighlightContacto] = useState(false);
  const scrollRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { slug } = useParams();

  useEffect(() => {
    const fetchClinicaInfo = async () => {
      try {
        if (!slug) return;

        const docRef = doc(db, 'clinicas', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const firebaseData = docSnap.data();

          // Buscamos el doc de usuarios para leer socioVitalicio
          // El uid del usuario está guardado en el doc de la clínica
          let esSocioVitalicio = false;
          if (firebaseData.uid) {
            const userSnap = await getDoc(doc(db, 'usuarios', firebaseData.uid));
            if (userSnap.exists()) {
              esSocioVitalicio = userSnap.data().socioVitalicio || false;
            }
          }

          // Si es socio vitalicio o tiene plan pro, consideramos planActual como 'pro'
          const planFinal = esSocioVitalicio || firebaseData.planActual === 'pro' ? 'pro' : 'gratis';

          const mergedData = {
            ...firebaseData,
            planActual: planFinal,
            urgencias: (firebaseData.urgencias && firebaseData.urgencias.length > 0)
              ? firebaseData.urgencias
              : URGENCIAS_FALLBACK,
          };
          setData(mergedData);
        } else {
          console.log("No se encontró la clínica con ese slug");
          setData(null);
        }
      } catch (error) {
        console.error("Error obteniendo el perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicaInfo();
  }, [slug]);
  
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

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    
    const handleHighlightEvent = () => {
      setHighlightContacto(true);
      setTimeout(() => { setHighlightContacto(false); }, 2500);
    };
    window.addEventListener('trigger-highlight-contacto', handleHighlightEvent);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
      observer.disconnect();
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
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-lg">Esta clínica aún no configuró su perfil.</p>
          <p className="text-gray-400 text-sm mt-2">Guardá datos en el Editor para verlos aquí.</p>
        </div>
      </div>
    );
  }

  // --- LÓGICA DINÁMICA ---
  
  // Leemos el plan de Firebase (si no existe, por defecto es gratis)
  const planActual = data.planActual || 'gratis';

  // Link de urgencias: usa el teléfono de guardia si existe, sino el de WhatsApp general
  const linkUrgencia = data.telefonoGuardia 
    ? `https://wa.me/${data.telefonoGuardia}` 
    : `https://wa.me/${data.whatsapp}`;

  // URL del mapa generada automáticamente desde la dirección física
  const mapaAutomatico = data.direccion 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(data.direccion)}&t=&z=15&ie=UTF8&iwloc=&output=embed` 
    : null;

  // FIX SINCRO #4: Las FAQs se muestran independientemente de si hay servicios configurados
  // Solo filtramos las que tienen respuesta completa
  const faqsActivas = data.faqs ? data.faqs.filter(faq => faq.respuesta && faq.respuesta.trim() !== '') : [];

  return (
    <div className="font-['Inter'] bg-white min-h-screen">
    {/* MODAL DE FOTO GLOBAL */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[500] flex items-center justify-center p-6"
          onClick={() => setFotoModal(null)}
        >
          <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setFotoModal(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-100 transition-colors"
            >
              <span className="text-[#1A3D3D] font-black text-lg leading-none">×</span>
            </button>
            <img src={fotoModal} alt="Foto del profesional" className="w-full rounded-[24px] shadow-2xl object-cover" />
          </div>
        </div>
      )}

      {/* HERO */}
      <main className="relative w-full bg-white overflow-hidden pt-[18px] md:pt-[45px]">
        {/* FIX DETALLE #1: "Volver atrás" con navigate(-1) en lugar de link hardcodeado a Cartilla */}
        <div className="w-full flex justify-start pl-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver atrás
          </button>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 md:px-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 pb-6 md:pb-12">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {data.guardia24hs && (
              <div className="mb-4 inline-flex items-center gap-2.5 bg-red-50 border border-red-100 px-4 py-2 rounded-full shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-600 font-bold text-[10px] uppercase tracking-[0.2em]">Guardia 24hs.</span>
              </div>
            )}

            <h1 className="text-[40px] sm:text-[48px] lg:text-[64px] font-black text-[#1A3D3D] leading-[1.05] mb-4 tracking-tighter font-['Montserrat']">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
                {data.nombre}
              </span>
            </h1>
            
           
            <p className="text-[15px] lg:text-[16px] text-gray-500 font-medium leading-relaxed mb-6 max-w-[500px]">
              {data.descripcion}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href={`https://wa.me/${data.whatsapp}`} className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg tracking-widest hover:bg-[#20bd5a] transition-colors">
                <Phone className="w-4 h-4" /> Enviar WhatsApp 
              </a>
              {planActual === 'pro' && (
                <a href="#servicios" className="flex items-center justify-center gap-2.5 bg-white border-2 border-gray-100 text-[#1A3D3D] px-8 py-4 rounded-2xl font-black uppercase text-[11px] hover:border-[#2D6A6A]/30 transition-all tracking-widest">
                  Ver Servicios
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative group">
            <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-gray-100 flex flex-col relative z-10 text-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-[#F4F7F7] rounded-xl flex items-center justify-center text-[#2D6A6A] shadow-inner">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-[#1A3D3D] font-black font-['Montserrat'] text-lg">Horarios de atención</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                {data.guardia24hs ? (
                  <div className="bg-[#2D6A6A]/5 border border-[#2D6A6A]/20 p-5 rounded-2xl flex items-center gap-4">
                     <div className="bg-white p-2.5 rounded-xl shadow-sm">
                       <Activity className="w-6 h-6 text-[#2D6A6A]" />
                     </div>
                     <div>
                       <h4 className="font-black text-[#1A3D3D] text-[15px] font-['Montserrat'] leading-tight mb-1">Atención Continua</h4>
                       <p className="text-xs font-bold text-gray-500">Horario cubierto por guardia permanente 24hs.</p>
                     </div>
                  </div>
                ) : (
                  <>
                    {data.horarios && data.horarios.semanaDesde && (
                      <div className="flex justify-between py-3.5 px-4 rounded-xl border bg-gray-50 border-gray-100">
                        <span className="text-[12px] font-black lowercase tracking-wider text-[#1A3D3D]">lunes a viernes</span>
                        <span className="text-[12px] font-medium text-gray-500">{data.horarios.semanaDesde} - {data.horarios.semanaHasta} hs</span>
                      </div>
                    )}
                    {data.horarios && data.horarios.sabadoDesde && data.horarios.sabadoHasta && (
                      <div className="flex justify-between py-3.5 px-4 rounded-xl border bg-gray-50 border-gray-100">
                        <span className="text-[12px] font-black lowercase tracking-wider text-[#1A3D3D]">sábados</span>
                        <span className="text-[12px] font-medium text-gray-500">{data.horarios.sabadoDesde} - {data.horarios.sabadoHasta} hs</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 bg-[#F9FBFA] p-3.5 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                <span className="text-xs font-bold text-[#1A3D3D] leading-snug">{data.direccion}</span>
              </div>

              {data.añosExperiencia && (
                <div className="absolute -bottom-6 -right-8 bg-[#1A3D3D] rounded-2xl py-3 px-4 shadow-xl border border-white/10 flex items-center gap-2.5 hidden sm:flex">
                  <div className="w-8 h-8 bg-[#2D6A6A] rounded-xl flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div className="pr-1 text-white">
                    <p className="text-[8px] font-bold uppercase opacity-60 leading-none mb-1">Experiencia</p>
                    <p className="text-xl font-black leading-none">+{data.añosExperiencia} años</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* NUESTRA HISTORIA */}
      <section id="nosotros" className="py-8 md:py-12 bg-[#F4F7F7] reveal-on-scroll">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-[45%] lg:w-[40%] h-[300px] md:h-[400px] rounded-[32px] shadow-xl border border-gray-200 shrink-0 relative bg-[#1A3D3D] p-4">
            {data.foto ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={data.foto}
                  alt={data.nombre}
                  className="w-full h-full object-contain rounded-[24px]"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] flex items-center justify-center rounded-[24px]">
                <Building2 className="w-24 h-24 text-white/30" />
              </div>
            )}
          </div>

          <div className="flex-1 text-left pt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-[#2D6A6A] font-bold text-[11px] uppercase tracking-[0.2em]">Trayectoria</h3>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] mb-5 tracking-tight leading-tight">
              Cuidamos a cada mascota <br className="hidden md:block" /> como si fuera nuestra.
            </h2>
            <p className="text-gray-600 text-[15px] leading-relaxed font-medium">
              {data.historia}
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
               {planActual === 'pro' && (
                 <>
                   <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="text-[13px] font-bold text-[#1A3D3D]">Veterinaria destacada</span>
                   </div>
                   <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#2D6A6A]" />
                      <span className="text-[13px] font-bold text-[#1A3D3D]">Especialistas Médicos</span>
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PRO: ESPECIALIDADES */}
      {planActual === 'pro' && data.servicios && (
        <section id="servicios" className="pt-8 pb-8 md:pt-12 md:pb-12 bg-white reveal-on-scroll relative">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10">
            <div className="mb-5 text-left">
            
            <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight leading-none">Servicios Médicos</h2>
              <h3 className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mb-1">Que ofrecemos en nuestro centro</h3>
            </div>

            {/* Renderizado dinámico de tarjetas de servicios */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {Object.entries(data.servicios)
                .filter(([_, serv]) => serv.activo)
                .map(([key, serv]) => {
                  const infoBase = INFO_SERVICIOS[key];
                  if (!infoBase) return null;
                  const IconoServicio = infoBase.icono;

                  return (
                    <div key={key} className="bg-[#F4F7F7]/50 border border-gray-100 p-4 md:p-8 rounded-[24px] md:rounded-[32px] hover:border-[#2D6A6A]/40 shadow-sm transition-all group flex flex-col text-left">
                      <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
                        <IconoServicio className="w-5 md:w-6 h-5 md:h-6 text-[#2D6A6A] shrink-0" />
                        <h3 className="text-xs md:text-lg font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">{infoBase.titulo}</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 md:gap-2.5">
                        {serv.subOpcionesSeleccionadas && serv.subOpcionesSeleccionadas.length > 0 ? (
                          serv.subOpcionesSeleccionadas.map((opcion, i) => (
                            <span key={i} className="px-2 md:px-3 py-1 md:py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] md:text-xs font-bold shadow-sm">
                              {opcion}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 md:px-3 py-1 md:py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] md:text-xs font-medium italic shadow-sm">
                            Consulta general y asesoramiento
                          </span>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FIX SINCRO #4: SECCIÓN DE FAQs — independiente del bloque de servicios */}
      {/* Se muestra si el plan es PRO y hay al menos una FAQ con respuesta completa */}
      {planActual === 'pro' && faqsActivas.length > 0 && (
        <section className="py-8 md:py-12 bg-white reveal-on-scroll">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10">
            <div className="max-w-4xl mx-auto bg-[#F9FBFA] rounded-[32px] p-5 md:p-8 border border-gray-200 shadow-sm">
              <h3 className="text-left font-black text-[#1A3D3D] font-['Montserrat'] text-2xl mb-6 tracking-tight">Preguntas Frecuentes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {faqsActivas.map((faq) => (
                  <div key={faq.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm text-left transition-all">
                    <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors gap-3 text-left">
                      <span className="font-bold text-[#1A3D3D] text-[14px] leading-snug text-left">{faq.pregunta}</span>
                      <div className={`w-7 h-7 shrink-0 rounded-full bg-[#F4F7F7] flex items-center justify-center transition-transform ${openFaq === faq.id ? 'rotate-180 bg-[#1A3D3D] text-white' : 'text-[#2D6A6A]'}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-500 text-sm font-medium leading-relaxed border-t border-gray-50 pt-3">
                          {faq.respuesta}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PROTOCOLO DE EMERGENCIAS */}
      {data.guardia24hs && (
        <section id="urgencias" className="py-8 md:py-12 bg-white reveal-on-scroll relative">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10">
            <div className="bg-red-50 border border-red-100 rounded-[40px] p-4 md:p-10 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <AlertTriangle className="w-64 h-64 text-red-500" />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto mb-8 text-center">
                <h2 className="text-3xl md:text-5xl font-black text-red-600 font-['Montserrat'] tracking-tight mb-4 leading-tight text-center">
                  <span className="block md:hidden">¿Qué hacer ante<br />una urgencia?</span>
                  <span className="hidden md:block">¿Qué hacer ante una urgencia?</span>
                </h2>
                <p className="text-red-900/60 font-medium text-[16px] md:text-[16px] text-center">Instrucciones vitales para actuar mientras venís en camino a nuestra guardia.</p>
              </div>

              {/* FIX BUG #3: data.urgencias siempre tiene los 4 pasos completos gracias al fallback */}
              {/* MÓVIL: una sola caja con grid 2x2 y líneas divisorias */}
              <div className="lg:hidden bg-white border border-red-100 rounded-[32px] shadow-sm overflow-hidden grid grid-cols-2">
                {data.urgencias.map((u, i) => (
                  <div key={i} className={`p-5 flex flex-col text-left
                    ${i % 2 === 0 ? 'border-r border-red-100' : ''}
                    ${i < 2 ? 'border-b border-red-100' : ''}
                    ${i === 0 ? 'col-start-1' : ''}
                  `}
                  style={{ gridColumn: i % 2 === 0 ? '1' : '2', gridRow: i < 2 ? '1' : '2' }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 font-black font-['Montserrat'] text-base flex items-center justify-center shrink-0 border border-red-100 mb-2">{u.paso}</div>
                    <h4 className="font-bold text-red-600 font-['Montserrat'] text-[16px] tracking-tight leading-snug mb-3">{u.titulo}</h4>
                    <p className="text-red-900/70 text-[15px] leading-relaxed font-medium">{u.desc}</p>
                  </div>
                ))}
              </div>

              {/* PC: 4 cajas separadas */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-5 text-left">
                {data.urgencias.map((u, i) => (
                  <div key={i} className="bg-white border border-red-100 p-5 rounded-[32px] shadow-sm hover:border-red-200 transition-all group flex flex-col">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 font-black font-['Montserrat'] text-lg flex items-center justify-center shrink-0 border border-red-100 group-hover:-translate-y-1 transition-transform">{u.paso}</div>
                      <h4 className="font-bold text-red-600 font-['Montserrat'] text-[16px] tracking-tight leading-snug self-center">{u.titulo}</h4>
                    </div>
                    <p className="text-red-900/70 text-[15px] leading-relaxed font-medium">{u.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 relative z-10 text-center">
                 <a href={linkUrgencia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-red-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-red-600 transition-all hover:-translate-y-1">
                    <AlertTriangle className="w-5 h-5" /> Avisar Guardia en Camino
                 </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECCIÓN PRO: STAFF MÉDICO */}
      {(planActual === 'pro' && data.staff && data.staff.filter(m => m.nombre?.trim()).length > 0) && (
        <section id="staff" className="py-8 md:py-12 bg-white reveal-on-scroll">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10 text-center">
            <div className="mb-10">
              <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-2 text-center">Nuestros Profesionales</h3>
              <h2 className="text-3xl md:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-center">Equipo Médico</h2>
            </div>

            {/* UN SOLO MIEMBRO: centrado */}
            {data.staff.filter(m => m.nombre && m.nombre.trim()).length === 1 && (
              <div className="flex justify-center">
                {data.staff.filter(m => m.nombre && m.nombre.trim()).map((m, idx) => (
                  <div key={m.id || idx} className="bg-[#F4F7F7] border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all relative flex flex-col items-center group w-full max-w-[280px]">
                    {m.foto ? (
                      <button
                        type="button"
                        onClick={() => setFotoModal(m.foto)}
                        className="w-24 h-24 rounded-[24px] bg-gray-200 overflow-hidden mb-5 border border-white shadow-md group-hover:scale-105 transition-transform block shrink-0 cursor-zoom-in"
                      >
                        <img src={m.foto} alt={m.nombre} className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="w-24 h-24 rounded-[24px] bg-gray-200 overflow-hidden mb-5 border border-white shadow-md shrink-0">
                        <div className="w-full h-full bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A]"><Users className="w-8 h-8" /></div>
                      </div>
                    )}
                    <h3 className="text-[18px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">{m.nombre}</h3>
            <p className="text-[#2D6A6A] text-[11px] font-black uppercase tracking-widest mb-4 text-center">{m.especialidad}</p>
            <p className="text-gray-500 text-[14px] font-medium leading-relaxed mb-6 flex-1 px-2 text-center">{m.bio}</p>
            <div className="w-full mt-auto bg-white rounded-2xl p-3.5 border border-gray-100 text-left flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Matrícula</p>
                <p className="text-[13px] font-bold text-[#1A3D3D] leading-none">{m.matricula}</p>
              </div>
              <Award className="w-4 h-4 text-[#2D6A6A]" />
            </div>
                  </div>
                ))}
              </div>
            )}

            {/* MÁS DE UN MIEMBRO: scroll horizontal en móvil, grid en PC */}
            {data.staff.filter(m => m.nombre && m.nombre.trim()).length > 1 && (
              <StaffCarrusel staff={data.staff} setFotoModal={setFotoModal} />
            )}

          </div>
        </section>
      )}

      {/* CONTACTO & MAPA */}
      {/* CONTACTO & MAPA */}
      <section id="contacto" className="py-8 md:py-12 bg-white reveal-on-scroll">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          
          <div className={`highlight-animation bg-white rounded-[40px] p-6 md:p-10 flex flex-col lg:flex-row gap-10 border border-gray-100
            ${highlightContacto 
              ? 'scale-[1.02] shadow-[0_0_80px_rgba(45,106,106,0.3)] ring-4 ring-[#4DB6AC]/50 ring-offset-4 ring-offset-white relative z-50' 
              : 'scale-100 shadow-[0_30px_60px_rgba(26,61,61,0.06)] relative z-10'}`}
          >
            
            <div className="flex-1 flex flex-col text-left">
              <h3 className="text-[#2D6A6A] font-bold text-[11px] uppercase tracking-[0.3em] mb-2 text-left">Contacto Directo</h3>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] mb-8 tracking-tight leading-tight text-left">Estamos para ayudarte, <br /> siempre cerca.</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* WhatsApp */}
                <a href={`https://wa.me/${data.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-5 hover:border-[#25D366]/30 transition-all group">
                  <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1.5">WhatsApp</p>
                    <p className="text-[#1A3D3D] font-black text-sm leading-none truncate">+{data.whatsapp}</p>
                  </div>
                </a>
                
                {/* Teléfono Fijo (Condicional) */}
                {data.telefono && (
                  <div className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-5">
                    <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1.5">Teléfono Fijo</p>
                      <p className="text-[#1A3D3D] font-black text-sm leading-none truncate">{data.telefono}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {data.email && (
                  <div className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-5 sm:col-span-2">
                    <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1.5">Email Oficial</p>
                      <p className="text-[#1A3D3D] font-black text-sm leading-none truncate">{data.email}</p>
                    </div>
                  </div>
                )}

                {/* Redes Sociales */}
                {data.redes && (data.redes.instagram || data.redes.facebook) && (
                  <div className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-5 sm:col-span-2 mt-2">
                    <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Nuestra Comunidad</p>
                      <div className="flex gap-2.5">
                         {data.redes.instagram && (
                           <a href={data.redes.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#E4405F] hover:bg-[#E4405F] hover:text-white transition-all shadow-sm">
                              <Instagram className="w-4 h-4" />
                           </a>
                         )}
                         {data.redes.facebook && (
                           <a href={data.redes.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all shadow-sm">
                              <Facebook className="w-4 h-4" />
                           </a>
                         )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-[350px] rounded-[32px] overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
              {mapaAutomatico && (
                <iframe
                  title="Ubicación en Mapa"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "contrast(1.05) opacity(0.9)" }}
                  loading="lazy"
                  src={mapaAutomatico}
                ></iframe>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP FLOTANTE */}
      <a
        href={`https://wa.me/${data.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-[110] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 text-left"
      >
        <Phone className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </a>

    </div>
  );
}