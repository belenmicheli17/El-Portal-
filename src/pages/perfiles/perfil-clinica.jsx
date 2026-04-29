import React, { useEffect, useState, useRef } from 'react';
import { 
  Menu, X, ChevronRight, ChevronLeft, ChevronDown, MapPin, Phone, Mail, Globe, 
  Clock, Star, ShieldCheck, Heart, AlertTriangle, 
  Stethoscope, Syringe, Microscope, Activity, Building2, 
  Facebook, Instagram, Linkedin, Info, Award, ArrowRight, LayoutGrid, Briefcase, Home, Users, Quote, ExternalLink
} from 'lucide-react';

// Mock de useNavigate para que no se rompa el Canvas
const useNavigate = () => (path) => console.log('Navegando a:', path);

// ==========================================
// DATOS DE LA CLÍNICA (Configurables)
// ==========================================
const data = {
  clinica: {
    nombre: "Clínica Veterinaria San Roque",
    subtitulo: "Cuidado profesional para tu mejor amigo",
    descripcion: "Más de 15 años cuidando mascotas en el Oeste del Gran Buenos Aires. Somos un centro médico veterinario de alta complejidad comprometido con el bienestar animal y la excelencia médica.",
    historia: "Fundada en 2009 por la Dra. Valeria Rojas, San Roque nació de la convicción de que cada mascota merece atención de primer nivel sin importar dónde viva. Lo que comenzó como una pequeña clínica de barrio, hoy es un centro de referencia regional con quirófano propio, laboratorio en el día e internación con monitoreo continuo. Creemos en la medicina preventiva, en la comunicación honesta con los dueños y en tratar a cada paciente como si fuera propio.",
    añosExperiencia: 15,
    direccion: "Rivadavia 1234, Morón, Buenos Aires",
    telefono: "+54 11 4567-8901",
    whatsapp: "5491145678901",
    email: "contacto@sanroquevet.com.ar",
    googleMapsUrl: "https://maps.google.com/?q=Clinica+Veterinaria+San+Roque+Moron",
    googleRating: 4.8,
    totalReseñas: 154,
    redes: { instagram: "https://instagram.com", facebook: "https://facebook.com", linkedin: "https://linkedin.com" },
    guardia24hs: true
  },
  horarios: [
    { dia: "lunes a viernes", horario: "8:00 – 20:00" },
    { dia: "sábados", horario: "8:00 – 14:00" },
    { dia: "guardia 24hs", horario: "Urgencias siempre" },
  ],
  staff: [
    { id: 1, nombre: "Dr. Martín Suárez", especialidad: "Director Médico · Cirugía General", bio: "15 años de experiencia en cirugía de tejidos blandos y ortopedia. Referente regional en traumatología canina.", foto: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80", matricula: "MV 4521" },
    { id: 2, nombre: "Dra. Valeria Rojas", especialidad: "Directora Fundadora · Medicina Interna", bio: "Especialista en diagnóstico por imágenes y enfermedades crónicas. Pionera en ecografía abdominal.", foto: "https://images.unsplash.com/photo-1594824436951-7f12bc3ac92e?auto=format&fit=crop&w=400&q=80", matricula: "MV 3108" },
    { id: 3, nombre: "Dra. Lucía Fernández", especialidad: "Dermatología · Oncología", bio: "Postgrado en dermatología veterinaria (UBA). Tratamiento de alergias y enfermedades cutáneas.", foto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", matricula: "MV 5890" },
    { id: 4, nombre: "Dr. Pablo Moretti", especialidad: "Cardiología · Anestesiología", bio: "Especialista en ecocardiografía y anestesia de alto riesgo. Formado en cardiología veterinaria.", foto: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80", matricula: "MV 6234" }
  ],
  servicios: [
    { id: 3, icono: "Activity", titulo: "Guardia e Internación 24hs", desc: "Monitoreo constante de signos vitales, administración de medicación e hidratación supervisada por especialistas.", es24hs: true },
    { id: 2, icono: "Syringe", titulo: "Cirugía de Alta Complejidad", desc: "Quirófano equipado con monitoreo anestésico multiparamétrico. Cirugía de tejidos blandos y ortopedia.", es24hs: false },
    { id: 1, icono: "Stethoscope", titulo: "Consulta General", desc: "Atención clínica integral para caninos, felinos y pequeños animales. Medicina preventiva y planes sanitarios.", es24hs: false },
    { id: 4, icono: "Microscope", titulo: "Diagnóstico por Imágenes", desc: "Radiología digital y ecografía abdominal de alta resolución con entrega de resultados en el mismo día.", es24hs: false },
    { id: 5, icono: "Award", titulo: "Laboratorio Propio", desc: "Análisis clínicos, hemogramas y bioquímicas procesadas internamente para diagnósticos rápidos.", es24hs: false },
    { id: 6, icono: "Heart", titulo: "Cardiología", desc: "Ecocardiografía Doppler, electrocardiogramas y consultas especializadas con seguimiento a largo plazo.", es24hs: false },
  ],
  serviciosDesplegables: [
    { id: 1, titulo: "¿Qué incluye la internación?", contenido: "Monitoreo constante de signos vitales (temperatura, frecuencia cardíaca y respiratoria), administración de medicación según protocolo, hidratación intravenosa y alimentación supervisada. Los propietarios reciben un informe diario con el estado de su mascota." },
    { id: 2, titulo: "¿Cómo son los turnos para cirugía?", contenido: "Las cirugías programadas se coordinan con previa consulta y exámenes prequirúrgicos (laboratorio + ECG). El día de la cirugía, el paciente ingresa en ayunas y permanece en observación hasta su recuperación completa." },
    { id: 3, titulo: "¿Atienden urgencias sin turno?", contenido: "Sí. Nuestra guardia funciona las 24 horas, los 365 días del año. Para urgencias no es necesario turno previo. Recomendamos avisar por WhatsApp en camino para preparar al equipo médico." }
  ],
  urgencias: [
    { paso: "01", titulo: "Mantené la calma", desc: "Tu mascota percibe tu estado emocional. Respirá hondo y actuá con calma para no aumentar su estrés innecesariamente." },
    { paso: "02", titulo: "No mediques", desc: "Nunca administres analgésicos, antiinflamatorios ni ningún medicamento humano sin indicación veterinaria. Puede ser fatal." },
    { paso: "03", titulo: "Avisanos antes", desc: "Escribinos por WhatsApp mientras venís en camino. Así el equipo médico se prepara para recibirlos inmediatamente." },
    { paso: "04", titulo: "Traslado seguro", desc: "Si está lastimado, envolvelo en una manta firme y colocalo en una superficie estable. No fuerces movimientos bruscos." },
  ],
  reseñasGoogle: [
    { id: 1, autor: "Carolina M.", texto: "Excelente atención. Llevé a mi perro por una urgencia nocturna y el equipo fue impecable. Muy recomendables por su calidez.", rating: 5, fecha: "Hace 2 semanas" },
    { id: 2, autor: "Rodrigo P.", texto: "La Dra. Rojas es una profesional increíble. El laboratorio en el día te ahorra muchos nervios y tiempo. De diez.", rating: 5, fecha: "Hace 1 mes" },
    { id: 3, autor: "Mariana G.", texto: "Muy limpio y ordenado todo. Me explicaron el diagnóstico con mucha paciencia. Se nota que aman a los animales.", rating: 5, fecha: "Hace 3 semanas" },
    { id: 4, autor: "Facundo L.", texto: "El mejor lugar de la zona. Oso está recuperado gracias a ellos. Siempre te responden los mensajes de seguimiento.", rating: 4, fecha: "Hace 2 meses" },
    { id: 5, autor: "Estela S.", texto: "Siempre llevo a mis gatos aquí. Son muy cuidadosos con el manejo y los ambientes son tranquilos para ellos.", rating: 5, fecha: "Hace 1 semana" },
    { id: 6, autor: "Juan Manuel B.", texto: "Servicio de guardia muy eficiente. Atendieron a mi mascota inmediatamente y con mucho profesionalismo.", rating: 5, fecha: "Hace 3 días" }
  ]
};

// ==========================================
// HELPERS
// ==========================================
const renderIcon = (iconName, className) => {
  const map = { Stethoscope, Syringe, Microscope, Activity, Award, Heart, Building2, Star };
  const Icon = map[iconName] || Star;
  return <Icon className={className} />;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
  }, []);

  const handleNav = (page) => {
    setIsMenuOpen(false);
    navigate(`/${page}`);
  };

  const scrollReviews = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const firstChild = container.children[0];
      if (!firstChild) return;
      
      const cardWidth = firstChild.offsetWidth;
      const gap = 20; // Correspondiente al gap-5 de Tailwind
      const scrollAmount = cardWidth + gap;

      if (direction === 'right') {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 10) {
          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <div className="bg-[#F4F7F7] font-['Inter'] antialiased min-h-screen relative text-left overflow-x-hidden selection:bg-[#2D6A6A] selection:text-white text-left">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-[100] h-[72px] bg-white/90 backdrop-blur-lg border-b border-gray-100 flex items-center px-8 md:px-10">
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">
            <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-2xl tracking-tighter cursor-pointer" onClick={() => handleNav('')}>
                El Portal<span className="text-[#2D6A6A]">.</span>
            </div>
            <div className="hidden lg:flex items-center gap-8 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                <a href="#nosotros" className="hover:text-[#2D6A6A] transition-colors">Nosotros</a>
                <a href="#servicios" className="hover:text-[#2D6A6A] transition-colors">Servicios</a>
                <a href="#urgencias" className="hover:text-[#2D6A6A] transition-colors">Urgencias</a>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-[#1A3D3D]">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
        </div>
      </nav>

      {/* HERO */}
      <main className="relative w-full bg-white overflow-hidden pt-[72px]">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 pb-6 md:pb-8">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {data.clinica.guardia24hs && (
              <div className="mb-4 inline-flex items-center gap-2.5 bg-red-50 border border-red-100 px-4 py-2 rounded-full shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-600 font-bold text-[10px] uppercase tracking-[0.2em]">Guardia 24hs · 365 días</span>
              </div>
            )}

            <h1 className="text-[40px] sm:text-[48px] lg:text-[64px] font-black text-[#1A3D3D] leading-[1.05] mb-4 tracking-tighter font-['Montserrat']">
              Clínica Veterinaria <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">San Roque</span>
            </h1>
            
            <p className="text-[15px] lg:text-[16px] text-gray-500 font-medium leading-relaxed mb-6 max-w-[500px]">
              {data.clinica.descripcion}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href={`https://wa.me/${data.clinica.whatsapp}`} className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg tracking-widest">
                <Phone className="w-4 h-4" /> Enviar WhatsApp 
              </a>
              <a href="#servicios" className="flex items-center justify-center gap-2.5 bg-white border-2 border-gray-100 text-[#1A3D3D] px-8 py-4 rounded-2xl font-black uppercase text-[11px] hover:border-[#2D6A6A]/30 transition-all tracking-widest">
                Ver Servicios
              </a>
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
                {data.horarios.map((h, i) => (
                  <div key={i} className={`flex justify-between py-3.5 px-4 rounded-xl border ${i === 2 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <span className={`text-[12px] font-black lowercase tracking-wider ${i === 2 ? 'text-red-600' : 'text-[#1A3D3D]'}`}>{h.dia}</span>
                    <span className="text-[12px] font-medium text-gray-500">{h.horario}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 bg-[#F9FBFA] p-3.5 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-[#2D6A6A]" />
                <span className="text-xs font-bold text-[#1A3D3D]">{data.clinica.direccion}</span>
              </div>

              {/* Badge de Experiencia - Ajustado según solicitud */}
              <div className="absolute -bottom-6 -right-8 bg-[#1A3D3D] rounded-2xl py-3 px-4 shadow-xl border border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#2D6A6A] rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="pr-1 text-white">
                  <p className="text-[8px] font-bold uppercase opacity-60 leading-none mb-1">Experiencia</p>
                  <p className="text-xl font-black leading-none">+{data.clinica.añosExperiencia} años</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      
      </main>

      {/* NUESTRA HISTORIA */}
      <section id="nosotros" className="py-6 md:py-8 bg-[#F4F7F7] reveal-on-scroll">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start gap-10">
          <div className="w-full md:w-[40%] h-[280px] md:h-[380px] rounded-[32px] overflow-hidden shadow-xl border border-gray-200 shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" 
              alt="Equipo de veterinarios San Roque" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-left pt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-[#2D6A6A] font-bold text-[11px] uppercase tracking-[0.2em]">Trayectoria y Compromiso</h3>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] mb-5 tracking-tight leading-tight">
              Cuidamos a cada mascota <br className="hidden md:block" /> como si fuera nuestra.
            </h2>
            <p className="text-gray-600 text-[15px] leading-relaxed font-medium">
              {data.clinica.historia}
            </p>
            
            <div className="mt-6 flex flex-wrap gap-4">
               <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-[13px] font-bold text-[#1A3D3D]">Referente Regional en Morón</span>
               </div>
               <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#2D6A6A]" />
                  <span className="text-[13px] font-bold text-[#1A3D3D]">Staff de Especialistas Médicos</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section id="servicios" className="py-6 md:py-8 bg-white reveal-on-scroll relative">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          <div className="mb-6 text-left">
            <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1">Especialidades</h3>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight">Servicios Médicos</h2>
          </div>

          <div className="mb-6 bg-red-50 border border-red-100 rounded-[28px] p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all text-left">
            <div className="flex items-start md:items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100 shrink-0">
                <Activity className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-red-600 font-['Montserrat'] mb-1">Guardia e Internación 24hs</h3>
                <p className="text-red-900/60 font-medium text-[13px] leading-relaxed max-w-2xl">{data.servicios[0].desc}</p>
              </div>
            </div>
            <a href={`https://wa.me/${data.clinica.whatsapp}`} className="bg-red-500 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg whitespace-nowrap">
              Avisar Urgencia
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {data.servicios.slice(1).map((s) => (
              <div key={s.id} className="bg-white border border-gray-200 p-6 rounded-[24px] hover:border-[#2D6A6A]/40 shadow-sm transition-all group flex flex-col text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#F4F7F7] rounded-xl flex items-center justify-center text-[#2D6A6A] group-hover:bg-[#2D6A6A] group-hover:text-white transition-colors shrink-0 shadow-inner">
                    {renderIcon(s.icono, "w-5 h-5")}
                  </div>
                  <h3 className="text-[15px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">{s.titulo}</h3>
                </div>
                <p className="text-gray-500 font-medium text-[13px] leading-relaxed flex-1 mb-5">{s.desc}</p>
                <a href={`https://wa.me/${data.clinica.whatsapp}`} className="text-[#2D6A6A] font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5 hover:gap-2 transition-all mt-auto w-max">
                  Consultar <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto bg-[#F9FBFA] rounded-[32px] p-6 md:p-8 border border-gray-200 shadow-sm">
            <h3 className="text-center font-black text-[#1A3D3D] font-['Montserrat'] text-2xl mb-6 tracking-tight text-center">Preguntas Frecuentes</h3>
            <div className="space-y-3">
              {data.serviciosDesplegables.map((faq) => (
                <div key={faq.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm text-left">
                  <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between px-6 py-4">
                    <span className="font-bold text-[#1A3D3D] text-[14px]">{faq.titulo}</span>
                    <div className={`w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center transition-transform ${openFaq === faq.id ? 'rotate-180 bg-[#1A3D3D] text-white' : 'text-[#2D6A6A]'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  {openFaq === faq.id && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-500 text-[13px] font-medium leading-relaxed border-t border-gray-50 pt-3">
                        {faq.contenido}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROTOCOLO DE EMERGENCIAS */}
      <section id="urgencias" className="py-6 md:py-8 bg-white reveal-on-scroll relative">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          <div className="bg-red-50 border border-red-100 rounded-[40px] p-6 md:p-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <AlertTriangle className="w-64 h-64 text-red-500" />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto mb-6 text-center">
              <h3 className="text-red-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2 text-center">Protocolo Crítico</h3>
              <h2 className="text-3xl md:text-5xl font-black text-red-600 font-['Montserrat'] tracking-tight mb-4 leading-tight text-center">¿Qué hacer antes de llegar?</h2>
              <p className="text-red-900/60 font-medium text-[15px] text-center">Instrucciones vitales para actuar mientras venís en camino a nuestra guardia.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4 text-left">
              {data.urgencias.map((u, i) => (
                <div key={i} className="bg-white border border-red-100 p-5 md:p-6 rounded-[32px] shadow-sm hover:border-red-200 transition-all group">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 font-black font-['Montserrat'] text-lg flex items-center justify-center mb-4 border border-red-100 group-hover:-translate-y-1 transition-transform">{u.paso}</div>
                  <h4 className="font-bold text-red-600 font-['Montserrat'] text-[16px] tracking-tight mb-2 leading-snug">{u.titulo}</h4>
                  <p className="text-red-900/70 text-[13px] leading-relaxed font-medium">{u.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center relative z-10 text-center">
               <a href={`https://wa.me/${data.clinica.whatsapp}`} className="inline-flex items-center gap-3 bg-red-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-red-600 transition-all">
                  <AlertTriangle className="w-5 h-5" /> Avisar Guardia en Camino
               </a>
            </div>
          </div>
        </div>
      </section>

      {/* STAFF MÉDICO */}
      <section id="staff" className="py-6 md:py-8 bg-white reveal-on-scroll">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 text-center">
          <div className="mb-10">
            <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-2 text-center">Nuestros Profesionales</h3>
            <h2 className="text-3xl md:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-center">Equipo Médico</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {data.staff.map((m, idx) => (
              <div key={m.id} className={`bg-[#F4F7F7] border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all h-full relative flex flex-col items-center group ${idx % 2 !== 0 ? 'md:mt-8' : ''}`}>
                <div className="w-24 h-24 rounded-[24px] bg-gray-200 overflow-hidden mb-5 border border-white shadow-md group-hover:scale-105 transition-transform">
                  <img src={m.foto} alt={m.nombre} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-[16px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">{m.nombre}</h3>
                <p className="text-[#2D6A6A] text-[9px] font-black uppercase tracking-widest mb-4 h-6">{m.especialidad.split('·')[0]}</p>
                <p className="text-gray-500 text-[12px] font-medium leading-relaxed mb-6 flex-1 px-2">{m.bio}</p>
                
                <div className="w-full mt-auto bg-white rounded-2xl p-3.5 border border-gray-100 text-left flex items-center justify-between">
                   <div className="text-left">
                     <p className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1 text-left">Matrícula</p>
                     <p className="text-[11px] font-bold text-[#1A3D3D] leading-none text-left">{m.matricula}</p>
                   </div>
                   <Award className="w-4 h-4 text-[#2D6A6A]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEÑAS GOOGLE */}
      <section className="py-10 mt-4 bg-[#F4F7F7] reveal-on-scroll overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 text-center text-center">
            <svg className="w-10 h-10 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div className="text-center">
              <p className="text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] leading-none mb-2 text-center text-center">Qué dicen nuestros clientes</p>
              <div className="flex items-center justify-center gap-1.5 text-center">
                <span className="text-amber-500 font-bold text-sm text-center">{data.clinica.googleRating}</span>
                <div className="flex text-center">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}
                </div>
                <span className="text-gray-400 text-[11px] font-medium text-center">({data.clinica.totalReseñas} opiniones en Google)</span>
              </div>
            </div>
          </div>

          <div className="relative group px-0 text-left">
            <button 
              onClick={() => scrollReviews('left')}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-[#1A3D3D] hover:bg-[#1A3D3D] hover:text-white transition-all active:scale-90 hidden lg:flex opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scrollReviews('right')}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-[#1A3D3D] hover:bg-[#1A3D3D] hover:text-white transition-all active:scale-90 hidden lg:flex opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div 
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x no-scrollbar text-left"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[...data.reseñasGoogle, ...data.reseñasGoogle].map((r, idx) => (
                <div key={`${r.id}-${idx}`} className="w-[85%] md:w-[48%] lg:w-[calc((100%-40px)/3)] bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm snap-start shrink-0 flex flex-col text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-100'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">{r.fecha}</span>
                  </div>
                  <p className="text-gray-600 font-medium text-[13px] leading-relaxed mb-6 flex-1 line-clamp-3">
                    "{r.texto}"
                  </p>
                  <div className="flex items-center gap-3 border-t border-gray-50 pt-4 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-[#2D6A6A] font-bold text-[10px] uppercase">
                      {r.autor.charAt(0)}
                    </div>
                    <p className="text-[11px] font-black text-[#1A3D3D] uppercase tracking-widest leading-none text-left">{r.autor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO & MAPA */}
      <section className="py-6 md:py-10 bg-white reveal-on-scroll">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-[0_30px_60px_rgba(26,61,61,0.06)] border border-gray-100 flex flex-col lg:flex-row gap-8">
            
            <div className="flex-1 flex flex-col text-left">
              <h3 className="text-[#2D6A6A] font-bold text-[11px] uppercase tracking-[0.3em] mb-2 text-left">Contacto Directo</h3>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] mb-6 tracking-tight leading-tight text-left">Estamos para ayudarte, <br /> siempre cerca.</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
                {/* WhatsApp */}
                <a href={`https://wa.me/${data.clinica.whatsapp}`} className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-4 hover:border-[#25D366]/30 transition-all group">
                  <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Central WhatsApp</p>
                    <p className="text-[#1A3D3D] font-bold text-sm leading-none">{data.clinica.telefono}</p>
                  </div>
                </a>
                
                {/* Email */}
                <div className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-4">
                  <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Email Oficial</p>
                    <p className="text-[#1A3D3D] font-bold text-sm leading-none truncate max-w-[140px]">{data.clinica.email}</p>
                  </div>
                </div>

                {/* Dirección */}
                <a href={data.clinica.googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-4 hover:border-[#2D6A6A]/30 transition-all group">
                  <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] group-hover:bg-[#2D6A6A] group-hover:text-white transition-colors shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Nuestra Sede</p>
                    <p className="text-[#1A3D3D] font-bold text-[11px] leading-tight line-clamp-2">{data.clinica.direccion}</p>
                  </div>
                </a>

                {/* Redes Sociales (Premium Icons) */}
                <div className="flex items-center gap-4 bg-[#F9FBFA] border border-gray-100 rounded-2xl p-4">
                  <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-2">Nuestra Comunidad</p>
                    <div className="flex gap-2">
                       <a href={data.clinica.redes.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#E4405F] hover:bg-[#E4405F] hover:text-white transition-all shadow-sm">
                          <Instagram className="w-4 h-4" />
                       </a>
                       <a href={data.clinica.redes.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all shadow-sm">
                          <Facebook className="w-4 h-4" />
                       </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] md:min-h-[350px] rounded-[32px] overflow-hidden border border-gray-100 shadow-inner">
              <iframe
                title="Mapa"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "contrast(1.1) grayscale(0.1)" }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(data.clinica.direccion)}&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] pt-8 pb-6 text-white text-left">
        <div className="max-w-[1100px] mx-auto px-8 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-10 mb-8 border-b border-white/5 pb-8 text-left">
            <div className="md:col-span-1 text-left">
              <h4 className="font-['Montserrat'] font-black text-2xl mb-4 leading-none text-left">
                El Portal<span className="opacity-40">.</span>
              </h4>
              <p className="text-white/50 text-[13px] leading-relaxed text-left">
                La red profesional exclusiva para medicina veterinaria. <br />Perfil Oficial de {data.clinica.nombre}.
              </p>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-[10px] uppercase tracking-widest mb-4 opacity-60 text-left">Plataforma</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li>Bolsa de Trabajo</li>
                <li>Insumos Médicos</li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-[10px] uppercase tracking-widest mb-4 opacity-60 text-left">Soporte</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li>Centro de Ayuda</li>
                <li>Términos y Privacidad</li>
              </ul>
            </div>

            <div className="text-center md:text-right">
                <div className="flex justify-center md:justify-end gap-4 mb-6">
                    <Instagram className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity cursor-pointer text-left" />
                    <Facebook className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity cursor-pointer text-left" />
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold opacity-30">
            <p>&copy; {new Date().getFullYear()} El Portal. Belén M. Arenas</p>
            <div className="flex items-center gap-2">Hecho con <Heart className="w-3 h-3 text-red-400 fill-current" /> en Argentina</div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Perfil Oficial Verificado
            </div>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOTANTE */}
      <a
        href={`https://wa.me/${data.clinica.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-[110] w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 text-left"
      >
        <Phone className="w-7 h-7 text-white" />
      </a>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
}