import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; // Ajustá esta ruta hacia tu archivo firebase.js
import { doc, getDoc } from 'firebase/firestore';

import { 
  ShieldCheck, MessageCircle, Star, Award, MapPin, 
  ChevronRight, ChevronLeft, GraduationCap, Briefcase, Stethoscope, 
  Syringe, Send, Phone, Building2, Home, ChevronDown, 
  Instagram, Linkedin, Facebook, Mail, User, X,
  Activity, Microscope, Heart, Brain, Turtle, 
  Clock, Eye, FileText, Sparkles, Globe
} from 'lucide-react';

const IconoHueso = ({ className }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-bone-icon lucide-bone ${className}`}><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg>
  );

const IconoPildora = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
);

const IconoBisturi = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 22 18.5 7.5L22 11l-6 11Z"/><path d="M12 5 8 9"/><path d="m11 8 4 4"/><path d="m5 12 7 7"/></svg>
);

function PerfilPublico() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
  const [mostrarTodosLogros, setMostrarTodosLogros] = useState(false);
  const [highlightContacto, setHighlightContacto] = useState(false);
  
  // NUEVOS ESTADOS PARA LOS MODALES
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // EFECTO 1: BUSCAR DATOS
  useEffect(() => {
    const fetchPerfil = async () => {
      const idBuscado = id ? id : 'veterinario_prueba_123';

      try {
        const docRef = doc(db, 'veterinarios', idBuscado);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const dbData = docSnap.data();
          setData({
            ...dbData,
            zonas: dbData.zonas || [],
            servicios: dbData.servicios || [],
            trayectoria: dbData.trayectoria || [],
            casos: dbData.casos || [],
            // Aseguramos que haya un mail de contacto para que los botones funcionen en la prueba
            emailContacto: dbData.emailContacto || 'contacto@veterinario.com',
            whatsappNum: dbData.whatsappNum || '5491123456789'
          });
        } else {
          setData(null); 
        }
      } catch (error) {
        console.error("Error al obtener el perfil de Firebase:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerfil();
  }, [id]);

  // EFECTO 2: ESTILOS
  useEffect(() => {
    if (loading || !data) return;

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      #contacto { scroll-margin-top: 100px; }
      .group.active-mobile { transition-duration: 0.5s; }
      html, body { overflow-x: hidden; width: 100%; position: relative; }
      /* Previene el scroll del fondo cuando hay un modal abierto */
      body.modal-open { overflow: hidden; }
    `;
    document.head.appendChild(style);

    const handleHighlightEvent = () => {
      setHighlightContacto(true);
      setTimeout(() => { setHighlightContacto(false); }, 2500);
    };
    
    window.addEventListener('trigger-highlight-contacto', handleHighlightEvent);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
      window.removeEventListener('trigger-highlight-contacto', handleHighlightEvent);
      document.body.classList.remove('modal-open');
    };
  }, [loading, data]);

  // Efecto para bloquear el scroll al abrir modales
  useEffect(() => {
    if (selectedCaso || isPhotoModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [selectedCaso, isPhotoModalOpen]);

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
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-[24px] md:text-[30px] font-black text-[#1A3D3D] font-['Montserrat'] mb-2">Perfil no encontrado</h2>
        <p className="text-gray-500 mb-6 text-[17px]">El profesional que buscás no existe o el enlace es incorrecto.</p>
        <button onClick={() => navigate('/')} className="bg-[#2D6A6A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1A3D3D] transition-colors text-[17px]">Volver al inicio</button>
      </div>
    );
  }

  const isPro = data.planActual === 'pro';
  const mobileTabs = isPro ? ['perfil', 'especialidad', 'casos'] : ['perfil'];

  const scrollToContacto = (e) => {
    if (e) e.preventDefault();
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setHighlightContacto(true);
      setTimeout(() => setHighlightContacto(false), 2500);
    }
  };

  const renderIcon = (iconName, className) => {
    const IconMap = { 
      Stethoscope, Syringe, Activity, Microscope, 
      Bone: IconoHueso, Heart, Pill: IconoPildora, 
      Brain, Turtle, Bisturi: IconoBisturi, 
      Briefcase, ShieldCheck, FileText, Clock, Eye, Globe, Sparkles 
    };
    const IconComponent = IconMap[iconName] || Star;
    return <IconComponent className={className} />;
  };

  const handleSendMail = () => {
    window.location.href = `mailto:${data.emailContacto}?subject=Consulta desde El Portal Veterinario`;
  };

  return (
    <div className="font-['Inter'] antialiased min-h-screen flex justify-center bg-gray-200 md:bg-[#F4F7F7] overflow-x-hidden w-full relative">
      
      {/* ========================================== */}
      {/* MODAL: FOTO DE PERFIL AMPLIADA             */}
      {/* ========================================== */}
      {isPhotoModalOpen && data.foto && (
        <div className="fixed inset-0 z-[9999] bg-[#1A3D3D]/40 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300" onClick={() => setIsPhotoModalOpen(false)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
            <X className="w-8 h-8" />
          </button>
          <img src={data.foto} alt={data.nombre} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CASO CLÍNICO COMPLETO               */}
      {/* ========================================== */}
      {selectedCaso && (
        <div className="fixed inset-0 z-[9999] bg-[#1A3D3D]/40 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedCaso(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">{selectedCaso.patologia}</span>
                <h3 className="text-[24px] font-black font-['Montserrat'] text-[#1A3D3D] mt-3 leading-none">{selectedCaso.nombre}</h3>
              </div>
              <button onClick={() => setSelectedCaso(null)} className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200 text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 md:p-10 text-left flex-1">
              {selectedCaso.fotos && selectedCaso.fotos.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory">
                  {selectedCaso.fotos.map((fotoUrl, idx) => (
                    <div key={idx} className="w-[280px] h-[280px] md:w-[400px] md:h-[400px] shrink-0 snap-center rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                      <img src={fotoUrl} alt={`Caso foto ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <h4 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-3">Relato del caso</h4>
                <p className="text-[16px] md:text-[17px] text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedCaso.desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================== */}
      {/* VERSIÓN MÓVIL                              */}
      {/* ========================================== */}
      <div className="w-full max-w-[412px] bg-[#F4F7F7] min-h-screen relative shadow-2xl flex flex-col md:hidden shrink-0 overflow-x-hidden">
        
        {/* BOTÓN VOLVER AL DIRECTORIO - MÓVIL */}
        <div className="px-6 pt-6 pb-2 bg-[#1A3D3D]">
          <button onClick={() => navigate('/directorio')} className="flex items-center gap-2 text-white/70 hover:text-white font-bold text-[10px] uppercase tracking-[0.3em] transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
        </div>

        {/* HERO MÓVIL */}
        <section className="bg-[#1A3D3D] px-6 py-8 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <div className="relative cursor-pointer" onClick={() => data.foto && setIsPhotoModalOpen(true)}>
              <div className="w-36 h-36 rounded-[32px] overflow-hidden border-4 border-white/20 shadow-xl bg-gray-100 flex items-center justify-center">
                {data.foto ? <img src={data.foto} className="w-full h-full object-cover" alt={data.nombre} /> : <User className="text-gray-400 w-12 h-12" />}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#2D6A6A] p-2 rounded-2xl border-4 border-[#1A3D3D]">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-[24px] font-extrabold font-['Montserrat'] text-white tracking-tight uppercase leading-tight mb-2">{data.nombre}</h1>
              <h2 className="text-[14px] font-black text-[#F4F7F7] uppercase tracking-[0.1em] opacity-80">{data.especialidad}</h2>
              <div className="mt-2 text-white/30 font-bold text-[11px] uppercase tracking-[0.3em]">MP: {data.matricula}</div>
            </div>
          </div>
        </section>

        {/* TABS MÓVIL */}
        <div className="bg-white border-b border-gray-100 flex justify-between px-2 shrink-0">
          {mobileTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] relative transition-colors ${activeTab === tab ? 'text-[#1A3D3D]' : 'text-gray-400'}`}
            >
              {tab === 'perfil' ? 'Sobre Mí' : tab === 'especialidad' ? 'Carrera' : 'Casos'}
              {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#2D6A6A] rounded-t-full"></span>}
            </button>
          ))}
        </div>

        {/* CONTENIDO PRINCIPAL MÓVIL */}
        <div className="p-4 flex-1">
          {activeTab === 'perfil' && (
            <div className="space-y-5">
              <div className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-50 text-center">
                <p className="text-gray-600 text-[16px] leading-relaxed font-medium italic">"{data.bio}"</p>
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-50">
                  <div className="flex flex-col items-center gap-1.5">
                    <MapPin size={24} className="text-[#2D6A6A] mb-1" />
                    <p className="font-bold text-[#1A3D3D] text-[11px] uppercase tracking-wide">{data.provincia}</p>
                  </div>
                  {data.atiendeDomicilio && (
                    <div className="flex flex-col items-center gap-1.5">
                      <Home size={24} className="text-blue-600 mb-1" />
                      <p className="font-bold text-[#1A3D3D] text-[11px] uppercase tracking-wide">A Domicilio</p>
                    </div>
                  )}
                </div>
              </div>
              
              {isPro && data.zonas && data.zonas.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest pl-2 mt-2 text-left">Zonas de Atención</h3>
                    <p className="text-[#4DB6AC] font-bold text-[11px] pl-2 mb-3 uppercase tracking-widest text-left">Actualmente en {data.provincia}</p>
                  </div>
                  {data.zonas.map((zona) => (
                    <div key={zona.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm text-left">
                      <h4 className="font-bold text-[15px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Building2 size={18} className="text-[#2D6A6A]" /> {zona.nombre}
                      </h4>
                      <ul className="space-y-4 text-gray-500 font-medium">
                        {zona.clinicas.map((c) => {
                          const searchString = `${c.calle || ''}, ${c.barrio || ''}, ${data.provincia || ''}`;
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(searchString)}`;

                          return (
                            <li key={c.id} className="flex flex-col gap-1.5 leading-tight mb-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                              <div className="flex gap-2 items-center text-[#1A3D3D] font-bold">
                                <div className="w-1.5 h-1.5 bg-[#2D6A6A] rounded-full shrink-0" />
                                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-[16px] hover:text-[#4DB6AC] transition-colors">{c.nombre}</a>
                              </div>
                              <span className="text-[15px] ml-3.5 opacity-80">{c.direccion || `${c.calle || ''} ${c.barrio ? `- ${c.barrio}` : ''}`}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'especialidad' && isPro && (
            <div className="space-y-8">
              {data.servicios && data.servicios.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-3 pl-2 text-left">Actualmente</h3>
                  <div className="space-y-3">
                    {data.servicios.map((s) => (
                      <div key={s.id} className="bg-white p-5 rounded-2xl border border-gray-50 flex gap-4 items-center text-left">
                        <div className="text-[#2D6A6A] shrink-0">{renderIcon(s.icono, "w-8 h-8")}</div>
                        <div>
                          <h4 className="font-bold font-['Montserrat'] text-[15px] text-[#1A3D3D] uppercase mb-1">{s.titulo}</h4>
                          <p className="text-gray-500 text-[16px] leading-snug">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.trayectoria && data.trayectoria.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-3 pl-2 text-left">Trayectoria</h3>
                  <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm text-left">
                    <div className="relative">
                      <div className="absolute left-[13px] top-2 bottom-2 w-[1.5px] bg-gray-100"></div>
                      <div className="space-y-8 relative">
                        {(mostrarTodosLogros ? data.trayectoria : data.trayectoria.slice(0, 3)).map((logro) => (
                          <div key={logro.id} className="flex gap-4 items-start">
                            <div className="w-7 h-7 rounded-full bg-white border-[3px] border-[#F4F7F7] flex items-center justify-center relative z-10 shadow-sm shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#1A3D3D]"></div>
                            </div>
                            <div className="pt-1 pb-1">
                              <h4 className="font-bold text-[#1A3D3D] text-[15px] mb-1 font-['Montserrat'] uppercase tracking-tight leading-tight">{logro.titulo}</h4>
                              <p className="text-gray-500 text-[16px] leading-snug">{logro.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {data.trayectoria.length > 3 && (
                        <div className="mt-8 ml-[44px]">
                          <button 
                            onClick={() => setMostrarTodosLogros(!mostrarTodosLogros)} 
                            className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-[0.2em] flex items-center gap-1.5 focus:outline-none"
                          >
                            {mostrarTodosLogros ? 'Ver menos' : `Ver todo (+${data.trayectoria.length - 3})`}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${mostrarTodosLogros ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'casos' && isPro && data.casos && (
            <div className="space-y-4">
              {data.casos.map((c) => (
                <div key={c.id} onClick={() => setSelectedCaso(c)} className="bg-white rounded-3xl overflow-hidden border border-gray-50 text-left shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    {c.fotos && c.fotos[0] ? (
                       <img src={c.fotos[0]} className="w-full h-full object-cover" alt="Caso Clínico" />
                    ) : (
                       <span className="text-gray-400 text-[14px]">Sin imagen</span>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#2D6A6A] text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-sm">
                      {c.patologia}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-[#1A3D3D] font-bold font-['Montserrat'] text-[17px] uppercase mb-1.5">{c.nombre}</h4>
                    <p className="text-gray-500 text-[16px] leading-relaxed mb-4 line-clamp-2">{c.desc}</p>
                    <span className="text-[#4DB6AC] font-bold text-[11px] uppercase tracking-widest flex items-center gap-1">Ver caso completo <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTONES DE CONTACTO MÓVIL */}
        <div className="px-4 py-6 bg-[#F4F7F7] shrink-0 border-t border-gray-100 z-50">
          <div className="flex gap-2">
            <a href={`mailto:${data.emailContacto}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center bg-white border border-gray-200 text-[#1A3D3D] rounded-xl w-14 h-14 shrink-0 shadow-sm hover:bg-gray-50 transition-colors">
              <Mail size={20} />
              <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Mail</span>
            </a>
            {data.whatsappActivo ? (
              <a href={`https://wa.me/${data.whatsappNum}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2.5 tracking-[0.15em] text-[13px] uppercase shadow-lg shadow-[#25D366]/20 hover:bg-[#20b858] transition-colors">
                <Phone size={18} /> WhatsApp
              </a>
            ) : (
              <a href={`mailto:${data.emailContacto}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#1A3D3D] text-white font-bold rounded-xl flex items-center justify-center gap-2.5 tracking-[0.15em] text-[13px] uppercase shadow-lg hover:bg-[#2D6A6A] transition-colors">
                <MessageCircle size={18} /> Enviar Mensaje
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* VERSIÓN ESCRITORIO                           */}
      {/* ========================================== */}
      <div className="hidden md:block w-full relative scroll-smooth text-left">
        <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.025] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        <main className="max-w-[1000px] mx-auto px-8 md:px-10 relative z-10 pt-8 flex flex-col items-center">
          
          {/* BOTÓN VOLVER AL DIRECTORIO - ESCRITORIO */}
          <div className="w-full flex justify-start">
            <button onClick={() => navigate('/directorio')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] md:text-[12px] uppercase tracking-[0.3em] mb-8 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Directorio
            </button>
          </div>

          <div className="w-full bg-white rounded-[44px] shadow-[0_30px_80px_rgba(26,61,61,0.12)] border border-gray-100 mb-12 relative">
            
            {/* REDES SOCIALES */}
            <div className="absolute right-6 top-[104px] -translate-y-1/2 md:top-[168px] md:translate-y-0 z-20 flex flex-col gap-3">
              {data.instagram && <a href={data.instagram} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white p-2.5 bg-white/5 rounded-xl border border-white/20 hover:scale-110 transition-all"><Instagram className="w-5 h-5" /></a>}
              {data.linkedin && <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white p-2.5 bg-white/5 rounded-xl border border-white/20 hover:scale-110 transition-all"><Linkedin className="w-5 h-5" /></a>}
              {data.facebook && <a href={data.facebook} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white p-2.5 bg-white/5 rounded-xl border border-white/20 hover:scale-110 transition-all"><Facebook className="w-5 h-5" /></a>}
            </div>

            {/* SECCIÓN 1: IDENTIDAD */}
            <div id="perfil" className="bg-[#1A3D3D] rounded-t-[44px] overflow-hidden pt-10 px-10 pb-24 md:pt-14 md:px-14 md:pb-25 flex flex-col items-center text-center relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              
              <div className="relative mb-8 z-10 cursor-pointer" onClick={() => data.foto && setIsPhotoModalOpen(true)}>
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden border-4 border-white/20 shadow-2xl bg-white flex items-center justify-center hover:scale-105 transition-transform">
                  {data.foto ? <img src={data.foto} className="w-full h-full object-cover" alt={data.nombre} /> : <User className="text-gray-400 w-16 h-16" />}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#2D6A6A] p-3 rounded-2xl border-4 border-[#1A3D3D] shadow-xl">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
              </div>
              
              <div className="z-10 w-full flex flex-col items-center">
                <h1 className="text-[24px] md:text-[30px] font-extrabold font-['Montserrat'] text-white tracking-tight mb-2 uppercase leading-tight">{data.nombre}</h1>
                <h2 className="text-[16px] md:text-[20px] font-black text-[#F4F7F7] mb-4 uppercase tracking-widest opacity-90">{data.especialidad}</h2>
                <p className="text-white/30 font-semibold text-[12px] uppercase tracking-[0.5em] mb-10">Matrícula Profesional: {data.matricula}</p>
              </div>
              
              {isPro && data.zonas && data.zonas.length > 0 && (
                <div className="w-full max-w-[280px] z-10 mb-5">
                  <a href="#zonas" className="w-full bg-white text-[#1A3D3D] font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:-translate-y-1 transition-all text-[12px] uppercase tracking-[0.2em]">
                    <MapPin className="w-4 h-4" /> Donde encontrarme
                  </a>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: BIOGRAFÍA */}
            <div className="relative z-20 -mt-16 md:-mt-20 bg-white px-10 pb-10 pt-12 md:px-16 md:pb-16 md:pt-16 text-center shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">
              <div className="mb-14">
                <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] mb-6 uppercase tracking-tight">Sobre mí</h2>
                <p className="text-gray-600 text-[17px] md:text-[18px] leading-relaxed font-medium italic max-w-2xl mx-auto">"{data.bio}"</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-gray-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4F7F7] flex items-center justify-center text-[#2D6A6A] shadow-inner"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none">Ubicación Base</p>
                    <p className="font-bold text-[#1A3D3D] text-[15px] uppercase tracking-wide">{data.provincia}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none">Reconocimiento</p>
                    <p className="font-bold text-[#1A3D3D] text-[15px] uppercase tracking-wide">Especialista Destacada</p>
                  </div>
                </div>
                {data.atiendeDomicilio && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><Home className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none">Modalidad</p>
                      <p className="font-bold text-[#1A3D3D] text-[15px] uppercase tracking-wide">Voy a domicilio</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIONES PRO */}
            {isPro && (
              <>
                {/* SERVICIOS */}
                {data.servicios && data.servicios.length > 0 && (
                  <div id="actualmente" className="bg-[#F4F7F7]/60 p-10 md:p-16 border-t border-b border-gray-50">
                    <div className="mb-10 text-left">
                      <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] mb-2 uppercase tracking-tight">Actualmente</h2>
                      <p className="text-gray-500 text-[17px] font-bold uppercase tracking-[0.2em] opacity-80 leading-none">¿En qué me especializo hoy en día?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {data.servicios.map((servicio) => (
                        <div key={servicio.id} className="bg-white p-8 rounded-[36px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                          <div className="text-[#2D6A6A] mb-6 group-hover:text-[#1A3D3D] transition-colors">{renderIcon(servicio.icono, "w-10 h-10")}</div>
                          <h4 className="font-bold font-['Montserrat'] text-[17px] text-[#1A3D3D] mb-3 uppercase tracking-wider">{servicio.titulo}</h4>
                          <p className="text-gray-600 font-medium text-[17px] leading-relaxed">{servicio.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRAYECTORIA */}
                {data.trayectoria && data.trayectoria.length > 0 && (
                  <div id="trayectoria" className="p-10 md:p-16 text-left bg-white">
                    <div className="mb-12">
                      <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] mb-2 uppercase tracking-tight">Trayectoria Académica</h2>
                      <p className="text-gray-500 text-[17px] font-bold uppercase tracking-[0.2em] opacity-80 leading-none">Formación y Logros</p>
                    </div>
                    <div className="relative">
                      <div className="absolute left-[20px] md:left-[23px] top-6 bottom-6 w-[1.5px] bg-gray-100"></div>
                      <div className="space-y-12 relative">
                        {(mostrarTodosLogros ? data.trayectoria : data.trayectoria.slice(0, 3)).map((logro) => (
                          <div key={logro.id} className="flex gap-10 items-start group">
                            <div className="w-10 h-10 rounded-full bg-white border-[4px] border-[#F4F7F7] flex items-center justify-center relative z-10 mt-1 shadow-sm flex-shrink-0 transition-colors">
                              <div className="w-3 h-3 rounded-full bg-[#1A3D3D] group-hover:bg-[#2D6A6A] transition-colors"></div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[#1A3D3D] text-[17px] mb-2 font-['Montserrat'] uppercase tracking-tight">{logro.titulo}</h4>
                              <p className="text-gray-600 text-[17px] font-medium">{logro.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {data.trayectoria.length > 3 && (
                        <div className="mt-12 ml-[54px] md:ml-[63px]">
                          <button onClick={() => setMostrarTodosLogros(!mostrarTodosLogros)} className="bg-[#1A3D3D] text-white px-7 py-3 rounded-full font-bold text-[11px] uppercase tracking-[0.3em] flex items-center gap-2 hover:-translate-y-1 shadow-lg transition-all">
                            {mostrarTodosLogros ? 'Reducir' : `Ver trayectoria completa (+${data.trayectoria.length - 3})`}
                            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarTodosLogros ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CASOS */}
                {data.casos && data.casos.length > 0 && (
                  <div id="casos" className="bg-[#F4F7F7]/40 p-10 md:p-16 border-t border-gray-50">
                    <div className="flex flex-col items-start mb-12 text-left">
                      <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] uppercase tracking-tight">Casos Clínicos</h2>
                      <div className="w-14 h-1 bg-[#2D6A6A] rounded-full mt-4"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {data.casos.map((caso) => (
                        <div key={caso.id} onClick={() => setSelectedCaso(caso)} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all group cursor-pointer">
                          <div className="h-64 relative overflow-hidden bg-gray-100 flex items-center justify-center">
                            {caso.fotos && caso.fotos[0] ? (
                              <img src={caso.fotos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={caso.nombre} />
                            ) : (
                              <span className="text-gray-400 text-[14px]">Sin imagen</span>
                            )}
                            <div className="absolute top-4 left-4">
                              <span className="bg-white/95 backdrop-blur-md text-[#2D6A6A] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">{caso.patologia}</span>
                            </div>
                          </div>
                          <div className="p-8">
                            <h3 className="text-[20px] font-black font-['Montserrat'] text-[#1A3D3D] mb-3">{caso.nombre}</h3>
                            <p className="text-gray-600 text-[17px] leading-relaxed mb-6 font-medium line-clamp-3">{caso.desc}</p>
                            <span className="text-[#4DB6AC] font-bold text-[12px] uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Leer caso completo <ChevronRight className="w-4 h-4" /></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ZONAS DE ATENCIÓN */}
                {data.zonas && data.zonas.length > 0 && (
                  <div id="zonas" className="p-10 md:p-16 bg-white border-b border-gray-50">
                    <div className="mb-12 text-center">
                      <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] uppercase tracking-tight mb-4">Lugares de Atención</h2>
                      <p className="text-gray-600 font-medium text-[17px]">Dónde encontrarme para consultas y cirugías</p>
                      <p className="text-[#4DB6AC] font-bold text-[15px] mt-2 uppercase tracking-widest">Actualmente en {data.provincia}</p>
                    </div>
                    
                    <div className={`grid grid-cols-1 ${data.zonas.length > 1 ? 'md:grid-cols-2' : 'md:max-w-xl mx-auto'} gap-8`}>
                      {data.zonas.map((zona) => (
                        <div key={zona.id} className="bg-[#F4F7F7] p-8 rounded-[32px] border border-gray-100 hover:border-[#2D6A6A]/30 transition-colors">
                          <div className="flex items-center gap-3 mb-6">
                            <Building2 className="text-[#2D6A6A] w-6 h-6" />
                            <h3 className="font-bold text-[18px] text-[#1A3D3D] uppercase tracking-wide">{zona.nombre}</h3>
                          </div>
                          
                          <ul className="space-y-6">
                            {zona.clinicas && zona.clinicas.map((clinica) => {
                              const fallbackSearch = encodeURIComponent(`${clinica.nombre}, ${clinica.direccion || ''}, ${data.provincia || ''}`);
                              const mapsUrl = clinica.linkMaps ? clinica.linkMaps : `https://www.google.com/maps/search/?api=1&query=$$${fallbackSearch}`;

                              return (
                                <li key={clinica.id} className="flex flex-col gap-1.5 text-[17px] text-gray-600 font-medium">
                                  <div className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A] shrink-0 mt-2.5"></div>
                                    <div className="flex flex-col">
                                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1A3D3D] hover:text-[#4DB6AC] transition-colors group flex items-center gap-2">
                                        {clinica.nombre}
                                        <MapPin className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                                      </a>
                                      
                                      {clinica.direccion && (
                                        <span className="text-[17px] opacity-80 mt-0.5">
                                          {clinica.direccion}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SECCIÓN CONTACTO */}
            <div id="contacto" className={`p-10 md:p-16 flex flex-col lg:flex-row gap-16 items-center bg-white transition-all duration-700 ease-out ${
              highlightContacto ? 'scale-[1.03] shadow-[0_0_80px_rgba(45,106,106,0.3)] ring-4 ring-[#4DB6AC]/50 ring-offset-4 ring-offset-[#F4F7F7]/50 rounded-[40px] relative z-50 border border-[#4DB6AC]' : 'scale-100 border-transparent rounded-b-[44px] relative z-10 border-gray-100'
            }`}>
              <div className="w-full lg:w-5/12 text-left">
                <div className="text-[#2D6A6A] mb-8"><MessageCircle className="w-12 h-12" /></div>
                
                <h2 className="text-[24px] md:text-[30px] font-extrabold font-['Montserrat'] text-[#1A3D3D] mb-6 uppercase tracking-tight leading-none">Enviar Propuesta</h2>
                <p className="text-gray-600 leading-relaxed mb-10 text-[17px] font-medium">Para invitaciones a seminarios, derivación de casos o colaboraciones académicas.</p>
                {data.whatsappActivo && (
                  <div className="p-8 bg-[#F4F7F7] rounded-[40px] border border-gray-50">
                    <p className="text-[12px] font-bold text-[#1A3D3D] uppercase tracking-[0.3em] mb-5 leading-none text-left">Chatea directamente</p>
                    <a href={`https://wa.me/${data.whatsappNum}`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-[20px] shadow-lg hover:bg-[#20bd5a] hover:-translate-y-1 flex items-center justify-center gap-3 tracking-[0.25em] text-[12px]">
                      <Phone className="w-5 h-5" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
              <div className="w-full lg:w-7/12">
                <form className="space-y-8 text-left" onSubmit={(e) => { e.preventDefault(); handleSendMail(); }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3 leading-none ml-1">Nombre completo</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[17px] font-medium focus:outline-none focus:border-[#2D6A6A] transition-all" placeholder="Ej: Dr. Alejandro Martínez" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3 leading-none ml-1">Tu mail</label>
                      <input type="email" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[17px] font-medium focus:outline-none focus:border-[#2D6A6A] transition-all" placeholder="ejemplo@correo.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3 leading-none ml-1">Escribí tu mensaje acá</label>
                    <textarea rows="5" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[17px] font-medium focus:outline-none focus:border-[#2D6A6A] transition-all resize-none" placeholder="Escribe aquí los detalles..."></textarea>
                  </div>
                  <button type="submit" className="w-full bg-[#1A3D3D] text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-[#2D6A6A] transition-all flex items-center justify-center gap-4 text-[13px] uppercase tracking-[0.3em]">
                    <Send className="w-5 h-5" /> Enviar al mail
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 

export default PerfilPublico;