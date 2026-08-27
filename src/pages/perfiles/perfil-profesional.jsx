import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; // Ajustá esta ruta hacia tu archivo firebase.js
import { doc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import especialidadesData from '../../data/especialidades.json';
import { 
  ShieldCheck, MessageCircle, Star, Award, MapPin, Images, GalleryHorizontal, 
  ChevronRight, ChevronLeft, GraduationCap, Briefcase, Stethoscope, 
  Syringe, Send, Phone, Building2, Home, ChevronDown, 
  Instagram, Linkedin, Facebook, Mail, User, X, PawPrint,
  Activity, Microscope, Heart, Brain, Turtle, Camera,
  Clock, Eye, FileText, Sparkles, Globe, BookOpen, FileDown, Download, Check
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

const ContactoEmail = ({ email, nombre, whatsappActivo, whatsappNum, mostrarWhatsapp }) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-[28px] p-6 flex flex-col gap-4">

      {/* AVISO + EMAIL */}
      <div className="flex items-start gap-3">
        <Mail className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
        <p className="text-[14px] text-[#1A3D3D] font-medium leading-relaxed">
          Para contactar a <span className="font-bold">{nombre}</span> por correo electrónico, podés copiar su dirección y escribirle desde el correo que uses habitualmente.
        </p>
      </div>

      {/* EMAIL */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">Dirección de correo</p>
        <p className="text-[17px] font-bold text-[#1A3D3D] break-all leading-snug">{email}</p>
      </div>

      {/* BOTÓN COPIAR EMAIL */}
      <button
        onClick={handleCopiar}
        className={`w-full py-4 rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all duration-300 shadow-sm
          ${copiado
            ? 'bg-[#4DB6AC] text-white shadow-md'
            : 'bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A] hover:text-[#2D6A6A] hover:-translate-y-0.5 hover:shadow-md'
          }`}
      >
        {copiado
          ? <><Check className="w-4 h-4" /> ¡Copiado!</>
          : <><Mail className="w-4 h-4" /> Copiar dirección</>
        }
      </button>

      {/* DIVISOR + WHATSAPP */}
      {mostrarWhatsapp && whatsappNum && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-gray-200"></div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">o también</span>
            <div className="flex-1 h-[1px] bg-gray-200"></div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
            <p className="text-[14px] text-[#1A3D3D] font-medium leading-relaxed">
              También podés hablarle directamente a su número.
            </p>
          </div>

          <a
            href={`https://wa.me/${whatsappNum}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 bg-[#25D366] text-white hover:bg-[#20b858] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 shadow-md"
          >
            <Phone className="w-4 h-4" /> Chatear por WhatsApp
          </a>
        </>
      )}

    </div>
  );
};

function PerfilPublico() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  console.log('currentUser en perfil:', currentUser);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
  const [mostrarTodosLogros, setMostrarTodosLogros] = useState(false);
  const [highlightContacto, setHighlightContacto] = useState(false);
  
  // NUEVOS ESTADOS PARA LOS MODALES
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
const [fotoIdx, setFotoIdx] = useState(0);
const [casoIdx, setCasoIdx] = useState(0);
const [verTodosCasos, setVerTodosCasos] = useState(false);
  const [galeriaModal, setGaleriaModal] = useState({ isOpen: false, idx: 0 });

  const { slug } = useParams(); // 1. Capturamos el slug de la URL

  useEffect(() => {
    const fetchVeterinarioInfo = async () => {
    try {
      if (!slug) return;
      
      // 1. Buscamos el perfil del profesional
      const q = query(collection(db, 'profesionales'), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
         const docProfesional = querySnapshot.docs[0];
         const datosProfesional = docProfesional.data();
         
         // 2. NUEVO: Buscamos los papers de este profesional en la colección global
         const qPapers = query(collection(db, 'papers'), where('autorId', '==', docProfesional.id));
         const papersSnapshot = await getDocs(qPapers);
         const papersDelProfesional = papersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         
         // 3. Juntamos la info del perfil con sus papers recuperados y lo mandamos a la pantalla
        
setData({
  ...datosProfesional,
  papers: papersDelProfesional
});
         
         setLoading(false);
      } else {
         console.log("No se encontró el perfil público");
         setLoading(false);
      }
      
    } catch (error) {
      console.error("Error al buscar el perfil:", error);
      setLoading(false);
    }
  };

    fetchVeterinarioInfo();
  }, [slug]);

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
      setFotoIdx(0);
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [selectedCaso, isPhotoModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
        <p className="text-[#1A3D3D] font-bold text-sm">Cargando perfil...</p>
      </div>
    );
  }

  if (!data) {
    const esPerfilPropio = currentUser?.slug === slug;

    return (
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 max-w-md w-full flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-[#2D6A6A]" />
          </div>

          {esPerfilPropio ? (
            <>
              <h2 className="text-[22px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">
                Todavía no completaste tu perfil
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Para que otros puedan encontrarte, necesitás completar tu información en el editor.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-[13px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Volver atrás
                </button>
                <button
                  onClick={() => navigate('/editor-profesional')}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-[13px] bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] transition-colors shadow-md"
                >
                  Ir al editor
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">
                Perfil no encontrado
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                El profesional que buscás no existe o el enlace es incorrecto.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="w-full px-6 py-3 rounded-xl font-bold text-[13px] bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] transition-colors shadow-md"
              >
                Volver atrás
              </button>
            </>
          )}
        </div>
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
      {/* MODAL: LIGHTBOX GALERÍA                    */}
      {/* ========================================== */}
      {galeriaModal.isOpen && data.galeria && data.galeria.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-[#1A3D3D]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setGaleriaModal({ isOpen: false, idx: 0 })}
        >
          {/* FLECHA IZQUIERDA */}
          {data.galeria.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setGaleriaModal(prev => ({ ...prev, idx: (prev.idx - 1 + data.galeria.length) % data.galeria.length })); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/40 transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* FLECHA DERECHA */}
          {data.galeria.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setGaleriaModal(prev => ({ ...prev, idx: (prev.idx + 1) % data.galeria.length })); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/40 transition-all z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* BOTÓN CERRAR */}
          <button
            onClick={() => setGaleriaModal({ isOpen: false, idx: 0 })}
            className="absolute top-5 right-5 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition-all z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* FOTO PRINCIPAL */}
          <div className="flex flex-col items-center gap-4 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={data.galeria[galeriaModal.idx].url}
              alt={data.galeria[galeriaModal.idx].epigrafe || `Foto ${galeriaModal.idx + 1}`}
              className="max-h-[75vh] max-w-full rounded-[24px] object-contain shadow-2xl animate-in zoom-in duration-200"
            />
            {/* EPÍGRAFE */}
            {data.galeria[galeriaModal.idx].epigrafe && (
              <p className="text-white/80 text-sm font-medium text-center max-w-lg">
                {data.galeria[galeriaModal.idx].epigrafe}
              </p>
            )}
            {/* CONTADOR */}
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
              {galeriaModal.idx + 1} / {data.galeria.length}
            </p>
            {/* MINIATURAS */}
            {data.galeria.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {data.galeria.map((foto, i) => (
                  <button
                    key={i}
                    onClick={() => setGaleriaModal(prev => ({ ...prev, idx: i }))}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === galeriaModal.idx ? 'border-[#4DB6AC] scale-110' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={foto.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {isPhotoModalOpen && data.foto && (
        <div className="fixed inset-0 z-[9999] bg-[#1A3D3D]/40 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300" onClick={() => setIsPhotoModalOpen(false)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
            <X className="w-8 h-8" />
          </button>
          <img src={data.foto} alt={`${data.nombre} ${data.apellido}`} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CASO CLÍNICO COMPLETO               */}
      {/* ========================================== */}
      {selectedCaso && (
        <div className="fixed inset-0 z-[9999] bg-[#1A3D3D]/60 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedCaso(null)}>

          {/* FLECHAS CASO — solo escritorio, por fuera */}
          {data.casos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); const prev = (casoIdx - 1 + data.casos.length) % data.casos.length; setCasoIdx(prev); setSelectedCaso(data.casos[prev]); setFotoIdx(0); }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[10000] flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/40 transition-all hover:scale-110 shadow-lg">
                <ChevronLeft className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Anterior</span>
            </button>
          )}
          {data.casos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); const next = (casoIdx + 1) % data.casos.length; setCasoIdx(next); setSelectedCaso(data.casos[next]); setFotoIdx(0); }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[10000] flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/40 transition-all hover:scale-110 shadow-lg">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Siguiente</span>
            </button>
          )}

          {/* ======= VERSIÓN MÓVIL DEL MODAL ======= */}
          <div className="md:hidden w-full max-h-[90vh] rounded-[32px] overflow-hidden bg-white flex flex-col animate-in slide-in-from-bottom-8 duration-300 mx-3" onClick={(e) => e.stopPropagation()}>
            
            {/* FOTO — mitad superior */}
            <div className="relative h-[45%] shrink-0 bg-black">
              {selectedCaso.fotos && selectedCaso.fotos.length > 0 ? (
                <>
                  <img
                    src={selectedCaso.fotos[fotoIdx] || selectedCaso.fotos[0]}
                    alt="Caso"
                    className="w-full h-full object-cover"
                  />
                  {selectedCaso.fotos.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setFotoIdx((fotoIdx - 1 + selectedCaso.fotos.length) % selectedCaso.fotos.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                        <ChevronLeft className="w-4 h-4 text-[#1A3D3D]" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setFotoIdx((fotoIdx + 1) % selectedCaso.fotos.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                        <ChevronRight className="w-4 h-4 text-[#1A3D3D]" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {selectedCaso.fotos.map((_, i) => (
                          <div key={i} className={`rounded-full transition-all ${i === fotoIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-[14px]">Sin imagen</span>
                </div>
              )}
              {/* Botón cerrar */}
              <button onClick={() => setSelectedCaso(null)} className="absolute top-4 right-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <X className="w-4 h-4 text-[#1A3D3D]" />
              </button>
            </div>

            {/* TEXTO — mitad inferior scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F4F7F7]">
              <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">{selectedCaso.patologia}</span>
              <h3 className="text-[22px] font-black font-['Montserrat'] text-[#1A3D3D] mt-3 mb-2 leading-tight uppercase">{selectedCaso.nombre}</h3>
              <div className="w-10 h-[2px] bg-[#2D6A6A] rounded-full mb-4"></div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Relato del caso</h4>
              <p className="text-[15px] text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedCaso.desc}</p>
              {data.casos.length > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <button onClick={(e) => { e.stopPropagation(); const prev = (casoIdx - 1 + data.casos.length) % data.casos.length; setCasoIdx(prev); setSelectedCaso(data.casos[prev]); setFotoIdx(0); }} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2D6A6A] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <span className="text-[11px] font-bold text-gray-400">{casoIdx + 1} / {data.casos.length}</span>
                  <button onClick={(e) => { e.stopPropagation(); const next = (casoIdx + 1) % data.casos.length; setCasoIdx(next); setSelectedCaso(data.casos[next]); setFotoIdx(0); }} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2D6A6A] transition-colors">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ======= VERSIÓN ESCRITORIO DEL MODAL ======= */}
          <div className="hidden md:flex bg-white rounded-[40px] w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex-row animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
            
            {/* COLUMNA IZQUIERDA: FOTO */}
            {selectedCaso.fotos && selectedCaso.fotos.length > 0 && (
              <div className="w-1/2 relative overflow-hidden shrink-0 bg-black">
                <img src={selectedCaso.fotos[fotoIdx] || selectedCaso.fotos[0]} alt={`Caso foto ${fotoIdx + 1}`} className="w-full h-full object-cover transition-opacity duration-300" />
                {selectedCaso.fotos.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setFotoIdx((fotoIdx - 1 + selectedCaso.fotos.length) % selectedCaso.fotos.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110">
                      <ChevronLeft className="w-5 h-5 text-[#1A3D3D]" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setFotoIdx((fotoIdx + 1) % selectedCaso.fotos.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110">
                      <ChevronRight className="w-5 h-5 text-[#1A3D3D]" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {selectedCaso.fotos.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setFotoIdx(i); }} className={`rounded-full transition-all ${i === fotoIdx ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* COLUMNA DERECHA: TEXTO */}
            <div className={`${selectedCaso.fotos && selectedCaso.fotos.length > 0 ? 'w-1/2' : 'w-full'} bg-[#F4F7F7] flex flex-col h-full relative`}>
              <button onClick={() => setSelectedCaso(null)} className="absolute top-5 right-5 z-10 p-2.5 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200 text-gray-500 shadow-sm">
                <X className="w-5 h-5" />
              </button>
              {data.casos.length > 1 && (
                <div className="absolute bottom-6 right-6 z-10">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{casoIdx + 1} / {data.casos.length}</span>
                </div>
              )}
              <div className="overflow-y-auto p-8 md:p-10 flex flex-col gap-6 h-full">
                <div className="pr-10">
                  <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">{selectedCaso.patologia}</span>
                  <h3 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] mt-4 leading-tight uppercase">{selectedCaso.nombre}</h3>
                </div>
                <div className="w-12 h-[2px] bg-[#2D6A6A] rounded-full"></div>
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Relato del caso</h4>
                  <p className="text-[16px] text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedCaso.desc}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ========================================== */}
      {/* VERSIÓN MÓVIL                              */}
      {/* ========================================== */}
      <div className="w-full max-w-[412px] bg-[#F4F7F7] min-h-screen relative shadow-2xl flex flex-col md:hidden shrink-0 overflow-x-hidden">
        
        {/* BOTÓN VOLVER A La Cartilla - MÓVIL */}
        <div className="px-6 pt-6 pb-2 bg-[#1A3D3D]">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white font-bold text-[10px] uppercase tracking-[0.3em] transition-colors group">
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
              <h1 className="text-[24px] font-extrabold font-['Montserrat'] text-white tracking-tight uppercase leading-tight mb-2">{data.nombre} {data.apellido}</h1>
              <h2 className="text-[14px] font-black text-[#F4F7F7] uppercase tracking-[0.1em] opacity-80">{data.especialidad}</h2>
             <div className="mt-2 text-white/30 font-bold text-[11px] uppercase tracking-[0.3em]">{data.tipoMatricula || 'MP'}: {data.matricula}</div>
              {(data.instagram || data.linkedin || data.facebook) && (
                <div className="flex items-center justify-center gap-3 mt-3">
                  {data.instagram && <a href={data.instagram} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white p-2 bg-white/10 rounded-xl border border-white/20 transition-all"><Instagram className="w-4 h-4" /></a>}
                  {data.linkedin && <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white p-2 bg-white/10 rounded-xl border border-white/20 transition-all"><Linkedin className="w-4 h-4" /></a>}
                  {data.facebook && <a href={data.facebook} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white p-2 bg-white/10 rounded-xl border border-white/20 transition-all"><Facebook className="w-4 h-4" /></a>}
                </div>
              )}
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
                <p className="text-gray-600 text-[16px] leading-relaxed font-medium italic">&ldquo;{data.bio}&rdquo;</p>
                <div className="flex flex-wrap justify-center items-start gap-4 mt-3 pt-3 border-t border-gray-50">
  <div className="flex flex-col items-center gap-1.5 w-[80px]">
    <div className="w-8 h-8 rounded-2xl bg-[#F4F7F7] flex items-center justify-center text-[#2D6A6A]">
      <MapPin className="w-4 h-4" />
    </div>
    <p className="font-bold text-[#1A3D3D] text-[11px] uppercase tracking-wide text-center">{data.provincia}</p>
  </div>
  <div className="flex flex-col items-center gap-1.5 w-[80px]">
    <div className="w-8 h-8 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100">
      <Award className="w-4 h-4" />
    </div>
    <p className="font-bold text-[#1A3D3D] text-[11px] uppercase tracking-wide text-center">Destacada</p>
  </div>
  {data.atiendeDomicilio && (
    <div className="flex flex-col items-center gap-1.5 w-[80px]">
      <div className="w-8 h-8 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
        <Home className="w-4 h-4" />
      </div>
      <p className="font-bold text-[#1A3D3D] text-[11px] uppercase tracking-wide text-center">Domicilio</p>
    </div>
  )}
</div>
              </div>
              
              {isPro && data.zonas && data.zonas.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mt-10 text-left flex items-center gap-2">
                      <Building2 size={18} className="text-[#2D6A6A]" /> Zonas de Atención
                    </h3>
                    <p className="text-[#4DB6AC] font-bold text-[11px] pl-2 mb-3 uppercase tracking-widest text-left">Actualmente en {data.provincia}</p>
                  </div>
                  {data.zonas.map((zona) => (
                    <div key={zona.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm text-left">
                      <h4 className="font-bold text-[14px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-wider mb-5 text-center max-w-[180px] mx-auto leading-snug">
                        {zona.nombre}
                      </h4>
                      <ul className="space-y-0 px-2">
                        {zona.clinicas.map((c) => {
                          const mapsUrl = c.placeId
                            ? `https://www.google.com/maps/place/?q=place_id:${c.placeId}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.direccion || ''}, ${data.provincia || ''}`)}`;
                          const waUrl = c.telefono
                            ? `https://wa.me/${c.telefono.replace(/[\s\-+()]/g, '')}`
                            : null;

                          return (
                            <li key={c.id} className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
                              <div className="w-1.5 h-1.5 bg-[#2D6A6A] rounded-full shrink-0 mt-2"></div>
                              <div className="flex flex-col gap-1.5 flex-1">
                                
                                {/* NOMBRE + BARRIO */}
                                <a href={mapsUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1A3D3D] text-[16px] leading-tight active:text-[#4DB6AC] transition-colors">
                                  {c.nombrePropio || c.nombre}
                                  {c.barrio && <span className="ml-1">({c.barrio})</span>}
                                </a>

                                {/* DIRECCIÓN */}
                                {c.direccion && (
                                  <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[13px] text-[#2D6A6A] font-bold transition-colors active:text-[#1A3D3D]">
                                    <MapPin className="w-3 h-3 text-[#2D6A6A] shrink-0" />
                                    {c.direccion}
                                  </a>
                                )}

                                {/* TELÉFONO → WHATSAPP */}
                                {c.telefono && (
                                  <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] text-[#25D366] font-bold transition-colors active:text-[#20b858]">
                                    <Phone className="w-3 h-3 shrink-0 text-[#25D366]" />
                                    {c.telefono}
                                  </a>
                                )}
                              </div>
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
              {/* SERVICIOS */}
              {data.servicios && (
                (() => {
                  // Normalizamos: soportamos formato viejo (array) y nuevo (objeto)
                  const serviciosNormalizados = Array.isArray(data.servicios)
                    ? data.servicios.map(s => ({ titulo: s.titulo, desc: s.desc }))
                    : Object.entries(data.servicios)
                        .filter(([_, s]) => s.activo)
                        .flatMap(([grupoId, s]) => {
                          const todasLasOpciones = [
                            ...(s.subOpcionesSeleccionadas || []),
                            ...(s.serviciosPersonalizados || [])
                          ];
                          if (todasLasOpciones.length === 0) return [];
                          return [{
                            grupoId,
                            opciones: todasLasOpciones,
                            desc: s.desc || ''
                          }];
                        });

                  if (serviciosNormalizados.length === 0) return null;

                  return (
                    <div>
                      <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-3 pl-2 text-left">Actualmente</h3>
                      <div className="space-y-3">
                        {serviciosNormalizados.map((s, i) => (
                          Array.isArray(data.servicios)
                            ? (
                              // Formato viejo: una tarjeta por servicio
                              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-50 flex gap-4 items-center text-left">
                                <div className="text-[#2D6A6A] shrink-0">{renderIcon(s.icono, "w-8 h-8")}</div>
                                <div>
                                  <h4 className="font-bold font-['Montserrat'] text-[15px] text-[#1A3D3D] uppercase mb-1">{s.titulo}</h4>
                                  <p className="text-gray-500 text-[16px] leading-snug">{s.desc}</p>
                                </div>
                              </div>
                            ) : (
                              // Formato nuevo: una tarjeta por grupo con título y pills
                              <div key={s.grupoId} className="bg-white p-5 rounded-2xl border border-gray-50 text-left">
                                {(() => {
                                  const iconosGrupo = {
                                    consulta_general: Stethoscope,
                                    especialidades_medicas: Activity,
                                    quirurgico_critico: IconoBisturi,
                                    imagenes: Camera,
                                    laboratorio: Microscope,
                                    atencion_por_especie: PawPrint,
                                    bienestar_comportamiento: Heart,
                                    terapias_holisticas: Sparkles
                                  };
                                  const IconoGrupo = iconosGrupo[s.grupoId] || Stethoscope;
                                  return (
                                    <div className="flex items-center gap-2 mb-3">
                                      <IconoGrupo className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                      <h4 className="font-bold font-['Montserrat'] text-[12px] text-[#2D6A6A] uppercase tracking-widest opacity-70 leading-tight">
                                        {especialidadesData.find(g => g.id === s.grupoId)?.grupo || s.grupoId}
                                      </h4>
                                    </div>
                                  );
                                })()}
                                {s.desc && (
                                  <p className="text-gray-500 text-[12px] leading-relaxed font-medium italic mb-3 pb-3 border-b border-gray-100">
                                    {s.desc}
                                  </p>
                                )}
                                <div className="flex flex-col gap-1.5">
                                  {s.opciones.map(opcion => (
                                    <div key={opcion} className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A] shrink-0" />
                                      <span className="text-[12px] font-medium text-[#333333]">
                                        {opcion}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* TRAYECTORIA */}
              {data.trayectoria && data.trayectoria.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-3 pl-2 text-left">Trayectoria</h3>
                  <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm text-left">
                    <div className="relative">
                      <div className="absolute left-[13px] top-2 bottom-2 w-[1.5px] bg-gray-100"></div>
                      <div className="space-y-8 relative">
                        {(mostrarTodosLogros ? data.trayectoria : data.trayectoria.slice(0, 3)).filter(logro => logro.titulo || logro.desc).map((logro) => (
                          <div key={logro.id} className="flex gap-4 items-start">
                            <div className="w-7 h-7 rounded-full bg-white border-[3px] border-[#F4F7F7] flex items-center justify-center relative z-10 shadow-sm shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#1A3D3D]"></div>
                            </div>
                            <div className="pt-1 pb-1">
                              <h4 className="font-bold text-[#1A3D3D] text-[15px] mb-1 font-['Montserrat'] uppercase tracking-tight leading-tight">{logro.titulo} {logro.desc && <span className="font-medium normal-case tracking-normal opacity-70">— {logro.desc}</span>}</h4>
                              {logro.extra && <p className="text-gray-500 text-[13px] font-medium italic mt-1">{logro.extra}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {data.trayectoria.length > 3 && (
                        <div className="mt-8 ml-[44px]">
                          <button onClick={() => setMostrarTodosLogros(!mostrarTodosLogros)} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-[0.2em] flex items-center gap-1.5 focus:outline-none">
                            {mostrarTodosLogros ? 'Ver menos' : `Ver todo (+${data.trayectoria.length - 3})`}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${mostrarTodosLogros ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

             {/* === NUEVO: INVESTIGACIONES MÓVIL === */}
              {data.papers && data.papers.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-4 pl-2 text-left">Investigaciones</h3>
                  <div className="space-y-4">
                    {data.papers.map((paper) => (
                      <div key={paper.id} className="bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-all">
                        
                        {/* 1. PORTADA SUPERIOR ALARGADA (Más baja) */}
                        <div className="w-full h-28 bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                          {paper.portada ? (
                            <img src={paper.portada} alt="Portada" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        
                        {/* 2. CONTENIDO (Menos padding y más compacto) */}
                        <div className="p-4 flex flex-col flex-1 text-left">
                          <h4 className="font-bold text-[#1A3D3D] text-[15px] font-['Montserrat'] leading-tight mb-2">{paper.titulo}</h4>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-500 font-bold text-[12px]">{paper.anio}</span>
                            <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {paper.categoria}
                            </span>
                          </div>
                          
                          <p className="text-gray-500 text-[12px] leading-relaxed line-clamp-2 mb-3">{paper.desc}</p>
                          
                          {/* 3. BOTÓN ÚNICO MODIFICADO */}
                          <div className="mt-auto pt-3 border-t border-gray-50">
                            <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`} target="_blank" rel="noreferrer" className="w-full bg-[#2D6A6A] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#1A3D3D] transition-colors text-[10px] uppercase tracking-widest">
                              <FileDown className="w-3.5 h-3.5" /> Leer Investigación
                            </a>
                          </div>
                        </div>
</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'casos' && isPro && data.casos && data.casos.length > 0 && (
            <div className="space-y-4">

              {/* PRIMER CASO SIEMPRE VISIBLE */}
              {data.casos[0] && (
                <div
                  onClick={() => { setSelectedCaso(data.casos[0]); setCasoIdx(0); }}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-50 text-left shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="h-52 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {data.casos[0].fotos && data.casos[0].fotos[0] ? (
                      <img src={data.casos[0].fotos[0]} className="w-full h-full object-cover" alt="Caso Clínico" />
                    ) : (
                      <span className="text-gray-400 text-[14px]">Sin imagen</span>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">{data.casos[0].patologia}</span>
                    <h4 className="text-[#1A3D3D] font-bold font-['Montserrat'] text-[17px] uppercase mt-3 mb-1.5">{data.casos[0].nombre}</h4>
                    <p className="text-gray-500 text-[15px] leading-relaxed mb-4 line-clamp-2">{data.casos[0].desc}</p>
                    <span className="text-[#4DB6AC] font-bold text-[11px] uppercase tracking-widest flex items-center gap-1">Ver caso completo <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              )}

              {/* BOTÓN VER TODOS LOS CASOS */}
              {data.casos.length > 1 && (
                <button
                  onClick={() => { setSelectedCaso(data.casos[0]); setCasoIdx(0); }}
                  className="w-full py-3 text-[#2D6A6A] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 group"
                >
                  Ver todos los casos ({data.casos.length}) <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* GALERÍA MÓVIL */}
              {data.galeria && data.galeria.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-extrabold text-[16px] text-[#1A3D3D] font-['Montserrat'] uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#2D6A6A]" /> Galería
                  </h3>

                  {/* GRILLA DE MINIATURAS */}
                  <div className="grid grid-cols-3 gap-2">
                    {data.galeria.slice(0, 6).map((foto, i) => (
                      <div
                        key={i}
                        onClick={() => setGaleriaModal({ isOpen: true, idx: i })}
                        className="relative aspect-square rounded-[16px] overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={foto.url}
                          alt={foto.epigrafe || `Foto ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* OVERLAY con contador en la última si hay más */}
                        {i === 5 && data.galeria.length > 6 && (
                          <div className="absolute inset-0 bg-[#1A3D3D]/60 flex items-center justify-center rounded-[16px]">
                            <span className="text-white font-black text-[20px] font-['Montserrat']">+{data.galeria.length - 6}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* BOTÓN VER GALERÍA COMPLETA */}
                  <button
                    onClick={() => setGaleriaModal({ isOpen: true, idx: 0 })}
                    className="w-full mt-4 py-3 text-[#2D6A6A] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 group"
                  >
                    Ver galería completa <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* BOTONES DE CONTACTO MÓVIL */}
        <div className="px-4 py-6 bg-[#F4F7F7] shrink-0 border-t border-gray-100 z-50">
         {(() => {
          const mostrarWp = data.whatsappActivo && data.whatsappNum && (data.whatsappVisibilidad === 'todos' || !data.whatsappVisibilidad || currentUser);
          return (
            <div className={`grid gap-2 ${mostrarWp ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <a href={`mailto:${data.emailContacto}`} target="_blank" rel="noreferrer" className="bg-[#1A3D3D] text-white font-bold rounded-xl flex flex-col items-center justify-center gap-1 py-3 px-2 shadow-lg hover:bg-[#2D6A6A] transition-colors text-center">
                <Mail size={18} />
                <span className="text-[9px] font-black uppercase tracking-wider leading-tight">Contactar por Email</span>
              </a>
              {mostrarWp && (
                <a href={`https://wa.me/${data.whatsappNum}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white font-bold rounded-xl flex flex-col items-center justify-center gap-1 py-3 px-2 shadow-lg shadow-[#25D366]/20 hover:bg-[#20b858] transition-colors text-center">
                  <Phone size={18} />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-tight">Chatear por WhatsApp</span>
                </a>
              )}
            </div>
          );
        })()}
        </div>
      </div>

      {/* ========================================== */}
      {/* VERSIÓN ESCRITORIO                           */}
      {/* ========================================== */}
      <div className="hidden md:block w-full relative scroll-smooth text-left">
        <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.025] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        <main className="max-w-[1000px] mx-auto px-8 md:px-10 relative z-10 pt-8 flex flex-col items-center">
          
          {/* BOTÓN VOLVER AL Cartilla - ESCRITORIO */}
          <div className="w-full flex justify-start">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] md:text-[12px] uppercase tracking-[0.3em] mb-8 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
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
                <h1 className="text-[24px] md:text-[30px] font-extrabold font-['Montserrat'] text-white tracking-tight mb-2 uppercase leading-tight">{data.nombre} {data.apellido}</h1>
                <h2 className="text-[16px] md:text-[20px] font-black text-[#F4F7F7] mb-4 uppercase tracking-widest opacity-90">{data.especialidad}</h2>
                <p className="text-white/30 font-semibold text-[12px] uppercase tracking-[0.5em] mb-10">{data.tipoMatricula || 'MP'}: {data.matricula}</p>
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
                <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] mb-4 uppercase tracking-tight">Sobre mí</h2>
                <p className="text-gray-600 text-[17px] md:text-[18px] leading-relaxed font-medium italic max-w-2xl mx-auto">"{data.bio}"</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 pt-1 border-t border-gray-50">
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
                {data.servicios && (
                  (() => {
                    const serviciosNormalizados = Array.isArray(data.servicios)
                      ? data.servicios.map(s => ({ titulo: s.titulo, desc: s.desc, icono: s.icono }))
                      : Object.entries(data.servicios)
                          .filter(([_, s]) => s.activo)
                          .flatMap(([grupoId, s]) => {
                            const todasLasOpciones = [
                              ...(s.subOpcionesSeleccionadas || []),
                              ...(s.serviciosPersonalizados || [])
                            ];
                            if (todasLasOpciones.length === 0) return [];
                            return [{ grupoId, opciones: todasLasOpciones, desc: s.desc || '' }];
                          });

                    if (serviciosNormalizados.length === 0) return null;

                    return (
                      <div id="actualmente" className="bg-[#F4F7F7]/60 p-10 md:p-16 border-t border-b border-gray-50">
                        <div className="mb-10 text-left">
                          <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] mb-2 uppercase tracking-tight">Actualmente</h2>
                          <p className="text-gray-500 text-[17px] font-bold uppercase tracking-[0.2em] opacity-80 leading-none">¿En qué me especializo hoy en día?</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {serviciosNormalizados.map((s, i) => (
                            Array.isArray(data.servicios)
                              ? (
                                // Formato viejo: una tarjeta por servicio con ícono
                                <div key={i} className="bg-white p-8 rounded-[36px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                                  <div className="text-[#2D6A6A] mb-6 group-hover:text-[#1A3D3D] transition-colors">{renderIcon(s.icono, "w-10 h-10")}</div>
                                  <h4 className="font-bold font-['Montserrat'] text-[17px] text-[#1A3D3D] mb-3 uppercase tracking-wider">{s.titulo}</h4>
                                  <p className="text-gray-600 font-medium text-[17px] leading-relaxed">{s.desc}</p>
                                </div>
                              ) : (
                                // Formato nuevo: una tarjeta por grupo con título y pills
                                <div key={s.grupoId} className="bg-white p-8 rounded-[36px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                                  {(() => {
                                    const iconosGrupo = {
                                      consulta_general: Stethoscope,
                                      especialidades_medicas: Activity,
                                      quirurgico_critico: IconoBisturi,
                                      imagenes: Camera,
                                      laboratorio: Microscope,
                                      atencion_por_especie: PawPrint,
                                      bienestar_comportamiento: Heart,
                                      terapias_holisticas: Sparkles
                                    };
                                    const IconoGrupo = iconosGrupo[s.grupoId] || Stethoscope;
                                    return (
                                      <div className="flex items-center gap-2 mb-3">
                                        <IconoGrupo className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                        <h4 className="font-bold font-['Montserrat'] text-[12px] text-[#2D6A6A] uppercase tracking-widest opacity-70 leading-tight">
                                          {especialidadesData.find(g => g.id === s.grupoId)?.grupo || s.grupoId}
                                        </h4>
                                      </div>
                                    );
                                  })()}
                                  {s.desc && (
                                    <p className="text-gray-500 text-[14px] leading-relaxed font-medium italic mb-4 pb-4 border-b border-gray-100">
                                      {s.desc}
                                    </p>
                                  )}
                                  <div className="flex flex-col gap-2">
                                    {s.opciones.map(opcion => (
                                      <div key={opcion} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A] shrink-0" />
                                        <span className="text-[14px] font-medium text-[#333333]">
                                          {opcion}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                          ))}
                        </div>
                      </div>
                    );
                  })()
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
                        {(mostrarTodosLogros ? data.trayectoria : data.trayectoria.slice(0, 3)).filter(logro => logro.titulo || logro.desc).map((logro) => (
                          <div key={logro.id} className="flex gap-10 items-start group">
                            <div className="w-10 h-10 rounded-full bg-white border-[4px] border-[#F4F7F7] flex items-center justify-center relative z-10 mt-1 shadow-sm flex-shrink-0 transition-colors">
                              <div className="w-3 h-3 rounded-full bg-[#1A3D3D] group-hover:bg-[#2D6A6A] transition-colors"></div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[#1A3D3D] text-[17px] mb-1 font-['Montserrat'] uppercase tracking-tight">{logro.titulo} {logro.desc && <span className="font-medium normal-case tracking-normal opacity-70">— {logro.desc}</span>}</h4>
                              {logro.extra && <p className="text-gray-500 text-[15px] font-medium italic mt-1">{logro.extra}</p>}
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
                     {data.casos.map((caso, index) => (
                        <div key={caso.id} onClick={() => { setSelectedCaso(caso); setCasoIdx(index); }} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all group cursor-pointer">
                          <div className="h-48 relative overflow-hidden bg-gray-100 flex items-center justify-center">
                            {caso.fotos && caso.fotos[0] ? <img src={caso.fotos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={caso.nombre} /> : <span className="text-gray-400 text-[14px]">Sin imagen</span>}
                            <div className="absolute top-4 left-4">
                              <span className="bg-white/95 backdrop-blur-md text-[#2D6A6A] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">{caso.patologia}</span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-[20px] font-black font-['Montserrat'] text-[#1A3D3D] mb-2 uppercase">{caso.nombre}</h3>
                            <p className="text-gray-600 text-[17px] leading-relaxed mb-4 font-medium line-clamp-3">{caso.desc}</p>
                            <span className="text-[#4DB6AC] font-bold text-[12px] uppercase tracking-widest flex items-center gap-1 transition-all group-hover:text-[13px] group-hover:gap-2">Leer caso completo <ChevronRight className="w-4 h-4" /></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === NUEVO: INVESTIGACIONES ESCRITORIO === */}
                {data.papers && data.papers.length > 0 && (
                  <div id="investigaciones" className="p-10 md:p-16 bg-[#F4F7F7]/30 border-t border-b border-gray-50 text-left">
                    <div className="flex flex-col items-start mb-10 text-left">
                      <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1A3D3D] font-['Montserrat'] uppercase tracking-tight">Investigaciones</h2>
                      <p className="text-gray-500 text-[17px] font-bold uppercase tracking-[0.2em] opacity-80 leading-none mt-2">Publicaciones y Papers Científicos</p>
                      <div className="w-14 h-1 bg-[#2D6A6A] rounded-full mt-4"></div>
                    </div>
                    
                    {/* Usamos grid-cols-3 para que las tarjetas queden más angostas y finas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.papers.map((paper) => (
                        <div key={paper.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all group">
                          
                          {/* 1. PORTADA SUPERIOR ALARGADA (Más baja) */}
                          <div className="w-full h-36 bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                            {paper.portada ? (
                              <img src={paper.portada} alt="Portada" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <BookOpen className="w-10 h-10 text-gray-300" />
                            )}
                          </div>
                          
                          {/* 2. CONTENIDO (Menos padding general) */}
                          <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-[17px] font-black font-['Montserrat'] text-[#1A3D3D] mb-2.5 leading-tight group-hover:text-[#2D6A6A] transition-colors line-clamp-2">{paper.titulo}</h3>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-gray-500 font-bold text-[13px]">{paper.anio}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                              <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">{paper.categoria}</span>
                            </div>
                            
                            <p className="text-gray-600 text-[14px] leading-relaxed font-medium line-clamp-3 mb-4">{paper.desc}</p>
                            
                            {/* 3. BOTÓN ÚNICO MÁS ELEGANTE */}
                            <div className="mt-auto pt-4 border-t border-gray-50">
                              <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`} target="_blank" rel="noreferrer" className="w-full bg-white border border-[#2D6A6A]/20 text-[#2D6A6A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2D6A6A] hover:text-white transition-colors text-[11px] uppercase tracking-widest shadow-sm">
                                <FileDown className="w-4 h-4" /> Abrir Documento
                              </a>
                            </div>
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
                      <p className="text-gray-600 font-medium text-[17px]">Dónde encontrarme para consultas</p>
                      <p className="text-[#4DB6AC] font-bold text-[15px] mt-2 uppercase tracking-widest">Actualmente en {data.provincia}</p>
                    </div>
                    
                    <div className={`grid grid-cols-1 ${data.zonas.length > 1 ? 'md:grid-cols-2' : 'md:max-w-xl mx-auto'} gap-8`}>
                      {data.zonas.map((zona) => (
                        <div key={zona.id} className="bg-[#F4F7F7] p-8 rounded-[32px] border border-gray-100 hover:border-[#2D6A6A]/30 transition-colors">
                          <div className="flex items-center gap-3 mb-6">
                            <Building2 className="text-[#2D6A6A] w-6 h-6" />
                            <h3 className="font-bold text-[18px] text-[#1A3D3D] uppercase tracking-wide">{zona.nombre}</h3>
                          </div>
                          
                          <ul className="space-y-5">
                            {zona.clinicas && zona.clinicas.map((clinica) => {
                              const mapsUrl = clinica.placeId
                                ? `https://www.google.com/maps/place/?q=place_id:${clinica.placeId}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinica.direccion || ''}, ${data.provincia || ''}`)}`;

                              return (
                                <li key={clinica.id} className="flex items-start gap-3 pb-5 border-b border-gray-200/60 last:border-0 last:pb-0">
                                  
                                  {/* PUNTO VERDE */}
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A] shrink-0 mt-2.5"></div>

                                  <div className="flex flex-col gap-1.5 flex-1">
                                    {/* NOMBRE PROPIO + BARRIO */}
                                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1A3D3D] text-[17px] hover:text-[#4DB6AC] transition-colors">
                                      {clinica.nombrePropio || clinica.nombre}
                                      {clinica.barrio && (
                                        <span className="font-bold text-[#1A3D3D] ml-1.5" >({clinica.barrio})</span>
                                      )}
                                    </a>

                                    {/* DIRECCIÓN CLICKEABLE */}
                                    {clinica.direccion && (
                                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[15px] text-gray-600 hover:text-[#4DB6AC] transition-colors">
                                        <MapPin className="w-3.5 h-3.5 text-[#2D6A6A] shrink-0" />
                                        {clinica.direccion}
                                      </a>
                                    )}

                                    {/* TELÉFONO → WHATSAPP */}
                                    {clinica.telefono && (
                                      <a href={`https://wa.me/${clinica.telefono.replace(/[\s\-+()]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[14px] text-gray-600 hover:text-[#25D366] transition-colors font-medium">
                                        <Phone className="w-3.5 h-3.5 shrink-0 text-[#25D366]" />
                                        {clinica.telefono}
                                      </a>
                                    )}
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

            {/* SECCIÓN CONTACTO + GALERÍA */}
            <div id="contacto" className={`px-10 pt-8 pb-10 md:px-16 md:pt-10 md:pb-16 bg-white transition-all duration-700 ease-out ${
              highlightContacto ? 'scale-[1.03] shadow-[0_0_80px_rgba(45,106,106,0.3)] ring-4 ring-[#4DB6AC]/50 ring-offset-4 ring-offset-[#F4F7F7]/50 rounded-[40px] relative z-50 border border-[#4DB6AC]' : 'scale-100 border-transparent rounded-b-[44px] relative z-10 border-gray-100'
            }`}>
              <div className={`flex flex-col ${data.galeria && data.galeria.length > 0 ? 'lg:flex-row gap-12 items-start' : 'lg:flex-row gap-16 items-center'}`} style={{alignItems: data.galeria && data.galeria.length > 0 ? 'stretch' : 'center'}}>

                {/* COLUMNA IZQUIERDA: CONTACTO */}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[#2D6A6A] mb-8"><MessageCircle className="w-12 h-12" strokeWidth={1.8} /></div>
                  <h2 className="text-[24px] md:text-[30px] font-extrabold font-['Montserrat'] text-[#1A3D3D] mb-6 uppercase tracking-tight leading-none">Enviar Propuesta</h2>
                  <div className="mb-8"></div>
                  <ContactoEmail
                    email={data.emailContacto}
                    nombre={data.nombre}
                    whatsappActivo={data.whatsappActivo}
                    whatsappNum={data.whatsappNum}
                    mostrarWhatsapp={data.whatsappActivo && (data.whatsappVisibilidad === 'todos' || !data.whatsappVisibilidad || currentUser)}
                  />
                </div>

                {/* COLUMNA DERECHA: GALERÍA (solo si tiene fotos) */}
                {data.galeria && data.galeria.length > 0 && (
                  <div className="w-full lg:w-[45%] flex flex-col">
                    
                    {/* HEADER */}
                    <div className="text-[#2D6A6A] mb-8"><Images className="w-12 h-12" strokeWidth={1.7} /></div>
                    <h3 className="text-[24px] md:text-[30px] font-extrabold font-['Montserrat'] text-[#1A3D3D] mb-6 uppercase tracking-tight leading-none">Galería</h3>

                    {/* LAYOUT: FOTO GRANDE ARRIBA + MINIATURAS ABAJO */}
                    <div className="flex flex-col gap-3 mt-2">

                      {/* FOTO PRINCIPAL */}
                      <div
                        className="rounded-[24px] overflow-hidden cursor-pointer group relative aspect-[16/10]"
                        onClick={() => setGaleriaModal({ isOpen: true, idx: 0 })}
                      >
                        <img
                          src={data.galeria[0].url}
                          alt={data.galeria[0].epigrafe || 'Galería'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-[#1A3D3D]/0 group-hover:bg-[#1A3D3D]/20 transition-all duration-300 rounded-[24px]" />
                      </div>

                      {/* MINIATURAS */}
                      {data.galeria.length > 1 && (
                        <div className="grid grid-cols-3 gap-3">

                          {/* MINIATURA 1 */}
                          {data.galeria[1] && (
                            <div
                              className="rounded-[16px] overflow-hidden cursor-pointer group relative aspect-square"
                              onClick={() => setGaleriaModal({ isOpen: true, idx: 1 })}
                            >
                              <img
                                src={data.galeria[1].url}
                                alt={data.galeria[1].epigrafe || ''}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-[#1A3D3D]/0 group-hover:bg-[#1A3D3D]/20 transition-all duration-300 rounded-[16px]" />
                            </div>
                          )}

                          {/* MINIATURA 2 */}
                          {data.galeria[2] && (
                            <div
                              className="rounded-[16px] overflow-hidden cursor-pointer group relative aspect-square"
                              onClick={() => setGaleriaModal({ isOpen: true, idx: 2 })}
                            >
                              <img
                                src={data.galeria[2].url}
                                alt={data.galeria[2].epigrafe || ''}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-[#1A3D3D]/0 group-hover:bg-[#1A3D3D]/20 transition-all duration-300 rounded-[16px]" />
                            </div>
                          )}

                          {/* MINIATURA 3 — con contador si hay más */}
                          {data.galeria[3] && (
                            <div
                              className="rounded-[16px] overflow-hidden cursor-pointer group relative aspect-square"
                              onClick={() => setGaleriaModal({ isOpen: true, idx: 3 })}
                            >
                              <img
                                src={data.galeria[3].url}
                                alt={data.galeria[3].epigrafe || ''}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {data.galeria.length > 4 && (
                                <div className="absolute inset-0 bg-[#1A3D3D]/60 flex items-center justify-center rounded-[16px]">
                                  <span className="text-white font-black text-[22px] font-['Montserrat']">+{data.galeria.length - 4}</span>
                                </div>
                              )}
                              {data.galeria.length <= 4 && (
                                <div className="absolute inset-0 bg-[#1A3D3D]/0 group-hover:bg-[#1A3D3D]/20 transition-all duration-300 rounded-[16px]" />
                              )}
                            </div>
                          )}

                        </div>
                      )}

                    </div>

                    {/* BOTÓN VER GALERÍA COMPLETA */}
                    <button
                      onClick={() => setGaleriaModal({ isOpen: true, idx: 0 })}
                      className="w-full mt-3 text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:text-[#1A3D3D] transition-colors flex items-center justify-center gap-1.5 group py-2"
                    >
                      Ver galería completa <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>

                  </div>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 

export default PerfilPublico;