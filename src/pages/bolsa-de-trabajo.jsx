import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, CircleCheck, Plus, MessageCircle, 
  ChevronRight, MapPin, Check, Briefcase, Info, AlertTriangle, 
  Send, Stethoscope, GraduationCap, RotateCcw,
  Activity, User, Trash2, Mail, Loader2, ChevronLeft, 
  Filter, Clock, ChevronDown, CalendarDays, UserCheck, Building
} from 'lucide-react';

// ==========================================
// DATOS ESTÁTICOS (Bolsa de Trabajo)
// ==========================================
const PROVINCIAS = ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Neuquén", "Río Negro", "Tucumán", "Salta", "Entre Ríos", "Otra"];
const PUESTOS_TRABAJO = ["Clínico General", "Guardia / Urgencias", "Especialista (Interconsulta)", "Cirujano", "Ecografista", "Enfermero / Asistente", "Pasantía / Estudiante", "Laboratorio / Comercial", "Otro"];
const EXPERIENCIA_REQUERIDA = ["Sin experiencia (Estudiantes/Junior)", "1 a 3 años (Semi-Senior)", "Más de 3 años (Senior)", "Especialista Certificado"];

const OFERTAS_EMPLEO = [
  {
    id: 1,
    puesto: "Cirujano Tejidos Blandos (Interconsultas)",
    clinica: "Hospital Veterinario Norte",
    logoClinica: "https://api.dicebear.com/7.x/initials/svg?seed=HVN&backgroundColor=1A3D3D",
    provincia: "Buenos Aires",
    ciudad: "San Isidro",
    experiencia: "Más de 3 años (Senior)",
    tipoContacto: ["whatsapp"],
    contacto: "+5491112345678",
    fechaPublicacion: "Hace 2 días",
    diasRestantes: 28,
    descripcion: "Buscamos cirujano especializado en tejidos blandos para cubrir interconsultas programadas y urgencias quirúrgicas en nuestro hospital. Modalidad a convenir (porcentaje por cirugía o guardia pasiva). Contamos con un volumen alto de casos derivados.",
    requisitos: ["Matrícula provincial activa", "Experiencia comprobable en cirugías abdominales y torácicas", "Movilidad propia (excluyente)", "Disponibilidad para urgencias (deseable)"],
    equipamiento: ["Quirófano totalmente equipado", "Anestesia inhalatoria (Isofluorano)", "Monitor multiparamétrico", "Electrobisturí", "Bomba de infusión", "Personal de asistencia capacitado"],
    cursoRecomendado: {
      titulo: "Ecografía Abdominal Básica",
      modalidad: "Online",
      level: "Principiante",
      imagen: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"
    }
  }
];

const PROFESIONALES_DISPONIBLES = [
  {
    id: "veterinario_prueba_123",
    nombre: "Dr. Veterinario Prueba",
    especialidad: "Clínico General",
    provincia: "Buenos Aires",
    experiencia: "Más de 3 años (Senior)",
    tiempo: "Full-time",
    momentoDia: "Mañana / Tarde",
    servicios: ["Guardias activas", "Atención en consultorio"],
    buscando: "Busco puesto fijo para atención de pequeños animales en clínica con buen volumen de casos.",
    avatar: "https://ui-avatars.com/api/?name=Veterinario+Prueba&background=F4F7F7&color=1A3D3D",
    diasRestantes: 30
  }
];

// ==========================================
// COMPONENTE PRINCIPAL: BOLSA DE TRABAJO
// ==========================================
export default function BolsaTrabajo() {
  const [view, setView] = useState('list'); // 'list', 'detail', 'publish_job', 'publish_prof'
  
  // Estados de la lista, filtros y acordeones
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('ambos'); // 'ambos', 'ofertas', 'profesionales'
  const [provinciasSel, setProvinciasSel] = useState([]);
  const [puestosSel, setPuestosSel] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProfId, setExpandedProfId] = useState(null); 
  
  // Estados de formularios
  const [jobFormStep, setJobFormStep] = useState(1);
  const [profFormStep, setProfFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [jobForm, setJobForm] = useState({
    clinica: '', provincia: 'Buenos Aires', ciudad: '', puesto: 'Clínico General', experiencia: 'Sin experiencia (Estudiantes/Junior)',
    descripcion: '', requisitos: [''], equipamiento: [''], tipoContacto: [], contactoEmail: '', contactoWhatsapp: ''
  });
  const [profForm, setProfForm] = useState({
    especialidad: 'Clínico General', experiencia: 'Sin experiencia (Estudiantes/Junior)', provincia: 'Buenos Aires',
    tiempo: 'Part-time', momentoDia: 'A convenir', servicios: [''], buscando: ''
  });

  const navigate = useNavigate();

  // Configuración de fuentes y scroll
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      /* Hide scrollbar for segmented control */
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // Funciones de filtrado
  const jobsFiltrados = OFERTAS_EMPLEO.filter(job => {
    const matchProvincia = provinciasSel.length === 0 || provinciasSel.includes(job.provincia);
    const matchPuesto = puestosSel.length === 0 || puestosSel.some(p => job.puesto.includes(p));
    const matchBusqueda = !jobSearchTerm || job.puesto.toLowerCase().includes(jobSearchTerm.toLowerCase()) || job.clinica.toLowerCase().includes(jobSearchTerm.toLowerCase());
    return matchProvincia && matchPuesto && matchBusqueda;
  });

  const profesionalesFiltrados = PROFESIONALES_DISPONIBLES.filter(prof => {
    const matchProvincia = provinciasSel.length === 0 || provinciasSel.includes(prof.provincia);
    const matchPuesto = puestosSel.length === 0 || puestosSel.some(p => prof.especialidad.includes(p));
    const matchBusqueda = !jobSearchTerm || prof.especialidad.toLowerCase().includes(jobSearchTerm.toLowerCase()) || prof.nombre.toLowerCase().includes(jobSearchTerm.toLowerCase());
    return matchProvincia && matchPuesto && matchBusqueda;
  });

  const toggleFilterArray = (setStateAction, value) => {
    setStateAction(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };

  const handleJobClick = (job) => { setSelectedJob(job); setView('detail'); window.scrollTo(0,0); };

  const handleClearFilters = () => { setProvinciasSel([]); setPuestosSel([]); setJobSearchTerm(''); };

  // Funciones Formulario Clínica
  const handleJobFormChange = (field, value) => { setJobForm(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const toggleTipoContacto = (tipo) => {
    const current = [...jobForm.tipoContacto];
    if (current.includes(tipo)) handleJobFormChange('tipoContacto', current.filter(t => t !== tipo));
    else handleJobFormChange('tipoContacto', [...current, tipo]);
  };
  const updateArrayItem = (field, index, value) => { const newArray = [...jobForm[field]]; newArray[index] = value; handleJobFormChange(field, newArray); };
  const addArrayItem = (field) => handleJobFormChange(field, [...jobForm[field], '']);
  const removeArrayItem = (field, index) => handleJobFormChange(field, jobForm[field].filter((_, i) => i !== index));

  const validateJobStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!jobForm.clinica.trim()) newErrors.clinica = 'El nombre de la clínica es obligatorio.';
      if (!jobForm.ciudad.trim()) newErrors.ciudad = 'La ciudad/localidad es obligatoria.';
    }
    if (step === 2) {
      if (!jobForm.descripcion.trim()) newErrors.descripcion = 'La descripción de la oferta es obligatoria.';
      if (jobForm.requisitos.filter(i => i.trim()).length === 0) newErrors.requisitos = 'Agregá al menos un requisito.';
    }
    if (step === 3) {
      if (jobForm.tipoContacto.length === 0) newErrors.tipoContacto = 'Debés seleccionar al menos un método de contacto.';
      if (jobForm.tipoContacto.includes('email') && !jobForm.contactoEmail.trim()) newErrors.contactoEmail = 'Ingresá el email de contacto.';
      if (jobForm.tipoContacto.includes('whatsapp') && !jobForm.contactoWhatsapp.trim()) newErrors.contactoWhatsapp = 'Ingresá el número de WhatsApp.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitJobForm = () => {
    if (!validateJobStep(3)) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("¡Tu oferta de empleo fue enviada a revisión! Se publicará por 30 días.");
      setView('list'); setJobFormStep(1); window.scrollTo(0,0);
    }, 2000);
  };

  // Funciones Formulario Profesional
  const handleProfFormChange = (field, value) => { setProfForm(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const updateProfArrayItem = (index, value) => { const newArray = [...profForm.servicios]; newArray[index] = value; handleProfFormChange('servicios', newArray); };
  const addProfArrayItem = () => handleProfFormChange('servicios', [...profForm.servicios, '']);
  const removeProfArrayItem = (index) => handleProfFormChange('servicios', profForm.servicios.filter((_, i) => i !== index));

  const validateProfStep = (step) => {
    const newErrors = {};
    if (step === 2) {
      if (!profForm.buscando.trim()) newErrors.buscando = 'Contanos brevemente qué estás buscando.';
      if (profForm.servicios.filter(i => i.trim()).length === 0) newErrors.servicios = 'Agregá al menos un servicio/disposición.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitProfForm = () => {
    if (!validateProfStep(2)) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("¡Tu perfil de disponibilidad ya está visible para las clínicas! Expirará en 30 días si no lo renovás.");
      setView('list'); setProfFormStep(1); window.scrollTo(0,0);
    }, 2000);
  };

  // =========================================================
  // RENDER: 1. LISTA DE EMPLEOS
  // =========================================================
  const renderList = () => (
    <div className="flex flex-col animate-in fade-in duration-500 pb-24 relative">
      
      {/* INNER HEADER (Fondo Petróleo, nunca blanco) */}
      <section className="relative bg-[#1A3D3D] pt-16 pb-20 overflow-hidden rounded-b-[40px] md:rounded-b-[60px] shadow-[0_10px_30px_rgba(26,61,61,0.1)] z-10 text-center">
        
        {/* Burbujas decorativas difuminadas */}
        <div className="absolute top-0 left-10 w-72 h-72 bg-[#4DB6AC]/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center px-4">
          
          {/* Ícono estilo Cartilla, sin caja, en color blanco/translúcido */}
          <Briefcase className="w-8 h-8 text-white mb-4" />
          
          <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-white tracking-tighter leading-none mb-4">
            Bolsa de Trabajo
          </h1>
          <p className="text-[#F4F7F7] opacity-80 text-[14px] md:text-[16px] font-medium mb-6 max-w-lg mx-auto leading-relaxed">
            La red de empleo exclusiva para profesionales veterinarios. Conectá con tu próximo desafío o encontrá al especialista ideal para tu clínica.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            {/* Botón Primario */}
            <button 
              onClick={() => { setView('publish_job'); window.scrollTo(0,0); }}
              className="w-full sm:w-auto bg-[#2D6A6A] text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
            >
              <Building className="w-4 h-4" /> Publicar Oferta de Clínica
            </button>
            {/* Botón Estilo Glassmorphism */}
            <button 
              onClick={() => { setView('publish_prof'); window.scrollTo(0,0); }}
              className="w-full sm:w-auto bg-white/15 border border-white/20 text-white px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Marcarme Disponible
            </button>
          </div>
        </div>
      </section>

      {/* Overlay de Filtros */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-[#1A3D3D]/10 backdrop-blur-[2px] z-20 transition-opacity" 
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Barra de Búsqueda Flotante */}
      <div className="max-w-4xl mx-auto w-full relative z-30 -mt-10 px-4">
        <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative">
          
          {/* Controles de Segmento */}
          <div className="grid grid-cols-3 bg-[#F4F7F7] p-1.5 rounded-[20px] w-full md:w-auto">
            
            <button 
              onClick={() => setSearchTarget('ofertas')}
              className={`px-1 sm:px-5 py-2.5 rounded-2xl text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-all truncate ${searchTarget === 'ofertas' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
            >Clínicas</button>
            <button 
              onClick={() => setSearchTarget('profesionales')}
              className={`px-1 sm:px-5 py-2.5 rounded-2xl text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-all truncate ${searchTarget === 'profesionales' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
            >Profesionales</button>
          </div>

          <div className="flex-1 w-full relative flex items-center bg-[#F4F7F7] md:bg-transparent rounded-[20px] md:rounded-none px-4 py-3 md:p-0">
            <Search className="text-[#666666] w-5 h-5 shrink-0" />
            <input 
              type="search" 
              value={jobSearchTerm}
              onChange={(e) => setJobSearchTerm(e.target.value)}
              placeholder="Buscar especialidad o clínica..." 
              className="w-full bg-transparent border-none pl-3 pr-2 py-1 text-[15px] font-medium focus:outline-none focus:ring-0 text-[#333333] placeholder:text-[#666666]/70" 
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full md:w-auto px-6 py-3.5 md:py-3 rounded-[18px] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'}`}
          >
            <Filter className="w-4 h-4" /> Filtros {provinciasSel.length + puestosSel.length > 0 && `(${provinciasSel.length + puestosSel.length})`}
          </button>
        </div>

        {/* Panel Desplegable de Filtros */}
        {showFilters && (
          <div className="absolute top-full left-4 right-4 md:left-0 md:right-0 mt-4 bg-white rounded-[32px] p-6 border border-gray-100 shadow-2xl z-30 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> Provincias
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PROVINCIAS.map(p => (
                    <label key={p} className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-[16px] border transition-all ${provinciasSel.includes(p) ? 'bg-[#2D6A6A]/10 border-[#2D6A6A]/30' : 'bg-[#F4F7F7] border-transparent hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={provinciasSel.includes(p)} onChange={() => toggleFilterArray(setProvinciasSel, p)} className="w-3.5 h-3.5 accent-[#2D6A6A]" />
                      <span className={`text-[13px] font-semibold ${provinciasSel.includes(p) ? 'text-[#1A3D3D]' : 'text-[#666666]'}`}>{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-[#2D6A6A]" /> Especialidad / Área
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PUESTOS_TRABAJO.map(p => (
                    <label key={p} className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-[16px] border transition-all ${puestosSel.includes(p) ? 'bg-[#2D6A6A]/10 border-[#2D6A6A]/30' : 'bg-[#F4F7F7] border-transparent hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={puestosSel.includes(p)} onChange={() => toggleFilterArray(setPuestosSel, p)} className="w-3.5 h-3.5 accent-[#2D6A6A]" />
                      <span className={`text-[13px] font-semibold ${puestosSel.includes(p) ? 'text-[#1A3D3D]' : 'text-[#666666]'}`}>{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Controles Inferiores del Filtro */}
            <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col-reverse md:flex-row justify-between items-center gap-4">
               <button onClick={handleClearFilters} className="text-[#666666] hover:text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center gap-1.5 py-3 md:py-0 w-full md:w-auto justify-center">
                 <RotateCcw className="w-3.5 h-3.5" /> Limpiar Filtros
               </button>
               <button onClick={() => setShowFilters(false)} className="w-full md:w-auto bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] hover:-translate-y-1 transition-all duration-300 shadow-lg">
                 Aplicar y Cerrar
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Dinámica */}
      <div className={`grid gap-8 lg:gap-10 mt-10 px-4 relative z-10 ${searchTarget === 'ambos' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-4xl mx-auto w-full'}`}>
        
        {/* Columna Izquierda: Instituciones Buscando */}
        {(searchTarget === 'ambos' || searchTarget === 'ofertas') && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[14px] uppercase tracking-widest flex items-center gap-2">
                 <Building className="w-5 h-5 text-[#2D6A6A] hidden sm:block" /> Ofertas de Clínicas
              </h2>
              <span className="bg-[#F4F7F7] text-[#1A3D3D] text-[11px] font-bold px-2.5 py-1 rounded-md">{jobsFiltrados.length}</span>
            </div>
            
            {jobsFiltrados.length > 0 ? jobsFiltrados.map(job => (
             <article 
  key={job.id} 
  onClick={() => handleJobClick(job)} 
  className="bg-white rounded-[24px] p-5 md:p-6 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer flex flex-col sm:flex-row gap-5 group"
>
   <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 p-2.5 shrink-0 hidden sm:block">
                  <img src={job.logoClinica} alt={job.clinica} className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-[#F4F7F7] text-[#666666] text-[12px] font-semibold px-3 py-1.5 rounded-lg">{job.fechaPublicacion}</span>
                    <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.provincia}</span>
                  </div>
                  <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] group-hover:text-[#2D6A6A] transition-colors leading-tight mb-1">{job.puesto}</h3>
                  <p className="text-[#666666] text-[14px] md:text-[15px] font-medium mb-3">{job.clinica}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-4 border-t border-gray-50">
                    <div className="flex gap-2">
                      <span className="bg-[#F4F7F7] text-[#333333] text-[12px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#2D6A6A]" /> {job.experiencia}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                   <ChevronRight className="w-6 h-6 text-[#666666]/30 group-hover:text-[#2D6A6A] group-hover:translate-x-1 transition-all" />
                </div>
              </article>
            )) : (
              <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
                 <div className="w-16 h-16 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                   <Building className="w-8 h-8 text-[#2D6A6A]/50" />
                 </div>
                 <h3 className="text-[#1A3D3D] text-[18px] font-bold font-['Montserrat'] mb-2">No encontramos ofertas</h3>
                 <p className="text-[#666666] text-[14px] font-medium mb-6 max-w-sm">Intentá ajustar los filtros o buscar con otros términos para ver más resultados.</p>
                 <button onClick={handleClearFilters} className="bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Limpiar todos los filtros</button>
              </div>
            )}
          </section>
        )}

        {/* Columna Derecha: Profesionales Disponibles */}
        {(searchTarget === 'ambos' || searchTarget === 'profesionales') && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="font-['Montserrat'] font-bold text-[#2D6A6A] text-[14px] uppercase tracking-widest flex items-center gap-2">
                 <UserCheck className="w-5 h-5 text-[#1A3D3D] hidden sm:block" /> Profesionales Disponibles
              </h2>
              <span className="bg-green-50 text-green-600 text-[11px] font-bold px-2.5 py-1 rounded-md">{profesionalesFiltrados.length}</span>
            </div>

            {profesionalesFiltrados.length > 0 ? profesionalesFiltrados.map(prof => {
              const isExpanded = expandedProfId === prof.id;
              return (
              <article 
  key={prof.id} 
  onClick={() => setExpandedProfId(isExpanded ? null : prof.id)}
  className={`bg-white rounded-[24px] p-5 md:p-6 border transition-all duration-300 ease-in-out cursor-pointer group flex flex-col h-full ${
    isExpanded 
      ? 'border-[#2D6A6A] shadow-md ring-2 ring-[#2D6A6A]/5' 
      : 'border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)]'
  }`}
>
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 shadow-sm shrink-0 overflow-hidden relative">
                    <img src={prof.avatar} alt={prof.nombre} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10 animate-pulse" title="Disponible"></div>
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] leading-tight">{prof.nombre}</h3>
                      <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5" /> {prof.provincia}</span>
                    </div>
                    {/* Etiqueta Especialidad estilo Pill según manual */}
                    <p className="inline-flex items-center gap-1.5 mt-1 mb-3 bg-[#F4F7F7] px-3 py-1.5 rounded-full">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#2D6A6A] animate-pulse"></span>
                      <span className="text-[#2D6A6A] text-[11px] font-bold uppercase tracking-[0.2em]">{prof.especialidad}</span>
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex gap-4 text-[12px] font-medium text-[#666666]">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {prof.tiempo}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {prof.momentoDia}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido Expandible (Acordeón) */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                   <div className="overflow-hidden">
                     <div className="bg-[#F4F7F7] rounded-[24px] p-5 border border-gray-100">
                        <p className="text-[#1A3D3D] text-[12px] font-bold mb-3 flex items-center gap-1.5 uppercase tracking-widest"><Activity className="w-4 h-4 text-[#4DB6AC]"/> Servicios Ofrecidos</p>
                        <div className="flex flex-wrap gap-2 mb-5">
                          {prof.servicios.map((s, idx) => (
                            <span key={idx} className="bg-white border border-gray-200 text-[#333333] text-[12px] font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                              <CircleCheck className="w-4 h-4 text-[#2D6A6A]" /> {s}
                            </span>
                          ))}
                        </div>
                        
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2D6A6A] rounded-full"></div>
                          <p className="text-[#666666] text-[15px] italic bg-white p-5 rounded-2xl border border-gray-100 pl-6 shadow-sm">"{prof.buscando}"</p>
                        </div>
                     </div>
                     
                     <button 
                       onClick={(e) => { e.stopPropagation(); alert(`Redirigiendo al perfil público verificado de ${prof.nombre}...`); }}
                       className="w-full mt-4 bg-[#2D6A6A] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl shadow-md flex items-center justify-center gap-2 group/btn"
                     >
                       <User className="w-4 h-4" /> Ver perfil profesional <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                   </div>
                </div>
                
                <div className={`flex justify-center transition-all duration-300 ${isExpanded ? 'mt-5 border-t border-gray-50 pt-4' : 'mt-4'}`}>
                   <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-[#2D6A6A]' : 'text-[#666666]/50 group-hover:text-[#2D6A6A]'}`}>
                     {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                     <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                   </span>
                </div>
              </article>
              );
            }) : (
              <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
                 <div className="w-16 h-16 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                   <UserCheck className="w-8 h-8 text-[#2D6A6A]/50" />
                 </div>
                 <h3 className="text-[#1A3D3D] text-[18px] font-bold font-['Montserrat'] mb-2">No encontramos profesionales</h3>
                 <p className="text-[#666666] text-[14px] font-medium mb-6 max-w-sm">Intentá ajustar los filtros o buscar con otros términos para ver más resultados.</p>
                 <button onClick={handleClearFilters} className="bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Limpiar todos los filtros</button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );

  // =========================================================
  // RENDER: 2. DETALLE DE EMPLEO
  // =========================================================
  const renderDetail = () => {
    if (!selectedJob) return null;
    return (
      <article className="max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-24 px-4 pt-8 md:pt-12">
        <button 
          onClick={() => setView('list')} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a la Bolsa de Trabajo
        </button>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden mb-12 relative">
          <div className="bg-[#F4F7F7] p-8 md:p-12 border-b border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2D6A6A]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[24px] border border-gray-100 shadow-sm p-3 shrink-0 z-10">
               <img src={selectedJob.logoClinica} alt={selectedJob.clinica} className="w-full h-full object-contain rounded-xl" />
             </div>
             <div className="flex-1 z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white border border-gray-200 text-[#666666] text-[12px] font-semibold px-3 py-1.5 rounded-lg">{selectedJob.fechaPublicacion}</span>
                  <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedJob.ciudad}, {selectedJob.provincia}</span>
                </div>
                <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] leading-[1.1] mb-2 tracking-tight">
                  {selectedJob.puesto}
                </h1>
                <p className="text-[17px] text-[#666666] font-medium mb-6">{selectedJob.clinica}</p>
                
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-bold text-[#333333] shadow-sm">
                    <GraduationCap className="w-4 h-4 text-[#2D6A6A]" /> {selectedJob.experiencia}
                  </div>
                  {selectedJob.requisitos.some(r => r.toLowerCase().includes('matrícula')) && (
                    <div className="bg-[#2D6A6A]/10 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-bold text-[#1A3D3D]">
                      <CircleCheck className="w-4 h-4 text-[#2D6A6A]" /> Requiere Matrícula Activa
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12 flex flex-col lg:flex-row gap-12 lg:gap-16">
            <div className="flex-1 space-y-12">
              <section>
                <h3 className="text-[22px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-5">Descripción del puesto</h3>
                <p className="text-[#333333] text-[16px] leading-relaxed font-medium whitespace-pre-line">
                  {selectedJob.descripcion}
                </p>
              </section>
              
              <section>
                <h3 className="text-[22px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-5 flex items-center gap-2">
                  <CircleCheck className="w-6 h-6 text-[#4DB6AC]" /> Requisitos excluyentes
                </h3>
                <ul className="space-y-4">
                  {selectedJob.requisitos.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A3D3D] mt-2.5 shrink-0"></span>
                      <span className="text-[16px] text-[#333333] font-medium leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {selectedJob.equipamiento.length > 0 && selectedJob.equipamiento[0] !== '' && (
                <section className="bg-[#F4F7F7] p-8 rounded-[32px] border border-gray-100">
                  <h3 className="text-[18px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-5 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[#2D6A6A]" /> Equipamiento en clínica
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedJob.equipamiento.map((eq, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 text-[#333333] text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm">
                        {eq}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="lg:w-[320px] shrink-0">
              <div className="bg-[#1A3D3D] p-8 rounded-[32px] shadow-2xl text-center relative overflow-hidden sticky top-32">
                 <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-white opacity-5 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
                 <h3 className="font-['Montserrat'] font-black text-white text-[22px] mb-2 relative z-10">Postularme ahora</h3>
                 <p className="text-white/70 text-[13px] font-medium mb-8 relative z-10">La clínica prefiere contacto por:</p>
                 
                 <div className="space-y-4 relative z-10">
                   {selectedJob.tipoContacto.includes('whatsapp') && (
                     <button className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg hover:bg-[#20bd5a] hover:-translate-y-1 transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
                       <MessageCircle className="w-5 h-5" /> WhatsApp
                     </button>
                   )}
                   {selectedJob.tipoContacto.includes('email') && (
                     <button className="w-full bg-white text-[#1A3D3D] py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
                       <Send className="w-4 h-4" /> Enviar CV por Mail
                     </button>
                   )}
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-white/10 text-left">
                   <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
                     <Info className="w-3.5 h-3.5" /> Condiciones
                   </p>
                   <p className="text-white/70 text-[13px] font-medium leading-relaxed">
                     Las condiciones económicas y contractuales se arreglan directamente por privado entre el profesional y la clínica.
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#F4F7F7] border border-gray-200 p-8 rounded-[32px] flex items-start gap-4 mb-12 text-[#666666] text-[14px] font-medium leading-relaxed">
          <AlertTriangle className="w-6 h-6 text-[#2D6A6A] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#1A3D3D]">Aviso Legal:</strong> El Portal actúa exclusivamente como un canal de difusión gratuito para ofertas laborales de terceros. No intervenimos en el proceso de selección, contratación, negociación salarial ni somos responsables de las condiciones laborales acordadas. Toda postulación se realiza bajo la exclusiva responsabilidad del profesional y la institución oferente.
          </p>
        </div>
      </article>
    );
  };

  // =========================================================
  // RENDER: 3. FORMULARIO DE PUBLICACIÓN DE EMPLEO (CLÍNICA)
  // =========================================================
  const renderPublishJobForm = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 pt-8 md:pt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => { setView('list'); setJobFormStep(1); setErrors({}); }} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancelar publicación
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-4">Publicar Oferta Laboral</h1>
        <p className="text-[#666666] font-medium text-[16px] max-w-lg mx-auto leading-relaxed">La difusión en El Portal es <strong className="text-[#2D6A6A] font-bold">100% gratuita</strong> para instituciones veterinarias con cuenta validada.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-[#F4F7F7] border-b border-gray-100 py-10 px-6 md:px-12 relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative">
            {/* Línea conectora base (Gris) */}
            <div className="absolute top-[20px] md:top-[24px] left-[15%] right-[15%] h-1 bg-gray-200 rounded-full z-0 hidden md:block">
              {/* Línea de progreso (Esmeralda) */}
              <div className="absolute top-0 left-0 h-full bg-[#2D6A6A] rounded-full transition-all duration-500 ease-in-out" style={{ width: `${((jobFormStep - 1) / 2) * 100}%` }}></div>
            </div>

            {/* Steppers */}
            <div className="relative z-10 flex justify-between items-start">
              {[1, 2, 3].map((step) => {
                const isActive = jobFormStep === step;
                const isCompleted = jobFormStep > step;
                
                return (
                  <div 
                    key={step} 
                    onClick={() => { if(isCompleted) setJobFormStep(step); }}
                    className={`flex flex-col items-center gap-3 w-24 md:w-32 ${isCompleted ? 'cursor-pointer group' : ''}`}
                  >
                    {/* Círculo con Efecto Gap */}
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-[14px] md:text-[16px] transition-all duration-300 z-10 ${
                      isActive ? 'bg-[#1A3D3D] text-white shadow-[0_4px_12px_rgba(26,61,61,0.3)] scale-110 border-[4px] border-[#F4F7F7]' : 
                      isCompleted ? 'bg-[#2D6A6A] text-white border-[4px] border-[#F4F7F7]' : 'bg-white border-[2px] border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} /> : step}
                    </div>
                    {/* Etiqueta */}
                    <span className={`text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black text-center ${
                      isActive || isCompleted ? 'text-[#1A3D3D]' : 'text-gray-400'
                    }`}>
                      {step === 1 ? 'Clínica' : step === 2 ? 'Puesto' : 'Contacto'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {jobFormStep === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Datos de la Institución</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3" htmlFor="clinica">Nombre de la Clínica / Hospital *</label>
                  <input id="clinica" type="text" value={jobForm.clinica} onChange={(e) => handleJobFormChange('clinica', e.target.value)} placeholder="Ej: Hospital Veterinario Norte" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.clinica ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.clinica && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.clinica}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Provincia *</label>
                    <select value={jobForm.provincia} onChange={(e) => handleJobFormChange('provincia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 focus:bg-white text-[#333333] transition-all">
                      {PROVINCIAS.filter(p=>p!=='Todas').map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3" htmlFor="ciudad">Ciudad / Zona *</label>
                    <input id="ciudad" type="text" value={jobForm.ciudad} onChange={(e) => handleJobFormChange('ciudad', e.target.value)} placeholder="Ej: San Isidro / Zona Norte" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.ciudad ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                    {errors.ciudad && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.ciudad}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
          {jobFormStep === 2 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Detalles de la Búsqueda</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Puesto o Área *</label>
                    <select value={jobForm.puesto} onChange={(e) => handleJobFormChange('puesto', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 focus:bg-white text-[#333333] transition-all">
                      {PUESTOS_TRABAJO.filter(p=>p!=='Todos').map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Experiencia Requerida *</label>
                    <select value={jobForm.experiencia} onChange={(e) => handleJobFormChange('experiencia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 focus:bg-white text-[#333333] transition-all">
                      {EXPERIENCIA_REQUERIDA.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Descripción del Puesto *</label>
                  <textarea value={jobForm.descripcion} onChange={(e) => handleJobFormChange('descripcion', e.target.value)} rows="4" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] resize-none transition-all ${errors.descripcion ? 'border-red-400' : 'border-gray-200'}`}></textarea>
                  {errors.descripcion && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.descripcion}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Requisitos Excluyentes *</label>
                  <div className="space-y-3">
                    {jobForm.requisitos.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="text" value={item} onChange={(e) => updateArrayItem('requisitos', index, e.target.value)} className="flex-1 bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#333333]" />
                        {jobForm.requisitos.length > 1 && <button onClick={() => removeArrayItem('requisitos', index)} className="p-3.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    ))}
                    <button onClick={() => addArrayItem('requisitos')} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mt-3 hover:bg-[#2D6A6A]/10 px-5 py-3 rounded-2xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Agregar requisito</button>
                    {errors.requisitos && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.requisitos}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3 flex items-center gap-2">Equipamiento <span className="text-[#666666]/50 font-medium lowercase tracking-normal">(Opcional)</span></label>
                  <div className="space-y-3">
                    {jobForm.equipamiento.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="text" value={item} onChange={(e) => updateArrayItem('equipamiento', index, e.target.value)} className="flex-1 bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#333333]" />
                        {jobForm.equipamiento.length > 1 && <button onClick={() => removeArrayItem('equipamiento', index)} className="p-3.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    ))}
                    <button onClick={() => addArrayItem('equipamiento')} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mt-3 hover:bg-[#2D6A6A]/10 px-5 py-3 rounded-2xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Agregar equipo</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {jobFormStep === 3 && (
            <div className="space-y-8 animate-in fade-in">
               <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Contacto y Condiciones</h2>
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-4">Canal preferido de contacto *</label>
                  <div className="flex flex-col sm:flex-row gap-5 mb-4">
                    <button onClick={() => toggleTipoContacto('whatsapp')} className={`flex-1 p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${jobForm.tipoContacto.includes('whatsapp') ? 'border-[#25D366] bg-[#25D366]/5 text-[#1A3D3D] shadow-md' : 'border-gray-100 text-[#666666] hover:border-gray-200 hover:bg-gray-50'}`}>
                      <MessageCircle className={`w-8 h-8 ${jobForm.tipoContacto.includes('whatsapp') ? 'text-[#25D366]' : ''}`} /> <span className="font-bold text-[15px]">WhatsApp</span>
                    </button>
                    <button onClick={() => toggleTipoContacto('email')} className={`flex-1 p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${jobForm.tipoContacto.includes('email') ? 'border-[#2D6A6A] bg-[#2D6A6A]/5 text-[#1A3D3D] shadow-md' : 'border-gray-100 text-[#666666] hover:border-gray-200 hover:bg-gray-50'}`}>
                      <Mail className={`w-8 h-8 ${jobForm.tipoContacto.includes('email') ? 'text-[#2D6A6A]' : ''}`} /> <span className="font-bold text-[15px]">Email</span>
                    </button>
                  </div>
                  {errors.tipoContacto && <p className="text-red-500 text-[11px] font-bold mt-2 text-center">{errors.tipoContacto}</p>}
                </div>

                <div className="space-y-6">
                  {jobForm.tipoContacto.includes('whatsapp') && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Número de WhatsApp *</label>
                      <input type="text" value={jobForm.contactoWhatsapp} onChange={(e) => handleJobFormChange('contactoWhatsapp', e.target.value)} placeholder="Ej: +54 9 11 1234 5678" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.contactoWhatsapp ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                      {errors.contactoWhatsapp && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.contactoWhatsapp}</p>}
                    </div>
                  )}
                  {jobForm.tipoContacto.includes('email') && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Email *</label>
                      <input type="email" value={jobForm.contactoEmail} onChange={(e) => handleJobFormChange('contactoEmail', e.target.value)} placeholder="rrhh@tuclinica.com" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.contactoEmail ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                      {errors.contactoEmail && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.contactoEmail}</p>}
                    </div>
                  )}
                </div>
                
                <div className="bg-[#F4F7F7] border border-gray-200 p-6 rounded-[24px] flex items-start gap-4 mt-10">
                  <CalendarDays className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                  <div>
                    <h4 className="text-[#1A3D3D] text-[15px] font-bold mb-2">Duración de la publicación</h4>
                    <p className="text-[#666666] text-[14px] font-medium leading-relaxed">
                      La oferta estará visible en la red por <strong className="font-bold text-[#1A3D3D]">30 días</strong>. Al acercarse la fecha, te enviaremos un correo para renovarla o darla de baja si ya cubriste la posición.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#F4F7F7] border-t border-gray-100 p-8 flex items-center justify-between">
          {jobFormStep > 1 ? <button onClick={() => { setJobFormStep(prev => prev - 1); setErrors({}); window.scrollTo(0,0); }} className="px-6 py-4 text-[#666666] font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 rounded-2xl transition-all">Anterior</button> : <div></div>}
          {jobFormStep < 3 ? <button onClick={() => { if(validateJobStep(jobFormStep)){ setJobFormStep(prev=>prev+1); window.scrollTo(0,0); } }} className="px-8 py-4 bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 hover:-translate-y-1 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-sm">Siguiente <ChevronRight className="w-5 h-5" /></button> : 
            <button onClick={submitJobForm} disabled={isSubmitting} className="px-10 py-5 bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-2xl rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-xl disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Send className="w-5 h-5" /> Publicar Oferta</>}
            </button>
          }
        </div>
      </div>
    </section>
  );

  // =========================================================
  // RENDER: 4. FORMULARIO DE PROFESIONAL (OFRECER SERVICIOS)
  // =========================================================
  const renderPublishProfForm = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 pt-8 md:pt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => { setView('list'); setProfFormStep(1); setErrors({}); }} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancelar
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-4">Marcar Disponibilidad</h1>
        <p className="text-[#666666] font-medium text-[16px] max-w-lg mx-auto leading-relaxed">Completá esta mini-ficha para que las clínicas puedan encontrarte y contactarte. Tu perfil debe estar validado con matrícula vigente.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-[#F4F7F7] border-b border-gray-100 py-10 px-6 md:px-12 relative overflow-hidden">
          <div className="max-w-md mx-auto relative">
            {/* Línea conectora base (Gris) */}
            <div className="absolute top-[20px] md:top-[24px] left-[25%] right-[25%] h-1 bg-gray-200 rounded-full z-0 hidden md:block">
              {/* Línea de progreso (Esmeralda) */}
              <div className="absolute top-0 left-0 h-full bg-[#2D6A6A] rounded-full transition-all duration-500 ease-in-out" style={{ width: `${((profFormStep - 1) / 1) * 100}%` }}></div>
            </div>

            {/* Steppers */}
            <div className="relative z-10 flex justify-between items-start">
              {[1, 2].map((step) => {
                const isActive = profFormStep === step;
                const isCompleted = profFormStep > step;
                
                return (
                  <div 
                    key={step} 
                    onClick={() => { if(isCompleted) setProfFormStep(step); }}
                    className={`flex flex-col items-center gap-3 w-32 md:w-40 ${isCompleted ? 'cursor-pointer group' : ''}`}
                  >
                    {/* Círculo con Efecto Gap */}
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-[14px] md:text-[16px] transition-all duration-300 z-10 ${
                      isActive ? 'bg-[#1A3D3D] text-white shadow-[0_4px_12px_rgba(26,61,61,0.3)] scale-110 border-[4px] border-[#F4F7F7]' : 
                      isCompleted ? 'bg-[#2D6A6A] text-white border-[4px] border-[#F4F7F7]' : 'bg-white border-[2px] border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} /> : step}
                    </div>
                    {/* Etiqueta */}
                    <span className={`text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black text-center ${
                      isActive || isCompleted ? 'text-[#1A3D3D]' : 'text-gray-400'
                    }`}>
                      {step === 1 ? 'Perfil Básico' : 'Disponibilidad'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {profFormStep === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Tu perfil</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Especialidad *</label>
                    <select value={profForm.especialidad} onChange={(e) => handleProfFormChange('especialidad', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      {PUESTOS_TRABAJO.filter(p=>p!=='Todos').map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Experiencia *</label>
                    <select value={profForm.experiencia} onChange={(e) => handleProfFormChange('experiencia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      {EXPERIENCIA_REQUERIDA.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Provincia de residencia/trabajo *</label>
                  <select value={profForm.provincia} onChange={(e) => handleProfFormChange('provincia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                    {PROVINCIAS.filter(p=>p!=='Todas').map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {profFormStep === 2 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Tu Disponibilidad</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Tiempo / Modalidad *</label>
                    <select value={profForm.tiempo} onChange={(e) => handleProfFormChange('tiempo', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      <option value="Part-time">Part-time (Algunos días)</option>
                      <option value="Full-time">Full-time (Lunes a Viernes)</option>
                      <option value="Por turnos">Por turnos / Interconsultas</option>
                      <option value="Solo fines de semana">Solo fines de semana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Franja Horaria *</label>
                    <select value={profForm.momentoDia} onChange={(e) => handleProfFormChange('momentoDia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Mañana / Tarde">Día Completo</option>
                      <option value="Nocturno">Guardia Nocturna</option>
                      <option value="A convenir">Horarios flexibles</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">¿Qué servicios ofreces específicamente? *</label>
                  <div className="space-y-3">
                    {profForm.servicios.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="text" value={item} onChange={(e) => updateProfArrayItem(index, e.target.value)} placeholder="Ej: Guardias activas, cirugías programadas, a domicilio..." className="flex-1 bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all" />
                        {profForm.servicios.length > 1 && <button onClick={() => removeProfArrayItem(index)} className="p-3.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    ))}
                    <button onClick={addProfArrayItem} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mt-3 hover:bg-[#2D6A6A]/10 px-5 py-3 rounded-2xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Agregar servicio</button>
                    {errors.servicios && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.servicios}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Contanos qué estás buscando (Tu "Pitch") *</label>
                  <textarea value={profForm.buscando} onChange={(e) => handleProfFormChange('buscando', e.target.value)} placeholder="Ej: Busco cubrir turnos fijos en clínica de pequeños animales, idealmente zona norte..." rows="4" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] resize-none transition-all ${errors.buscando ? 'border-red-400' : 'border-gray-200'}`}></textarea>
                  {errors.buscando && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.buscando}</p>}
                </div>
                
                <div className="bg-[#F4F7F7] border border-gray-200 p-6 rounded-[24px] flex items-start gap-4 mt-10">
                  <CalendarDays className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                  <div>
                    <h4 className="text-[#1A3D3D] text-[15px] font-bold mb-2">Renovación de Disponibilidad</h4>
                    <p className="text-[#666666] text-[14px] font-medium leading-relaxed">
                      Para asegurar que las clínicas vean datos reales, tu estado "Disponible" dura <strong className="font-bold text-[#1A3D3D]">30 días</strong>. Pasado ese tiempo, tu tarjeta se ocultará automáticamente a menos que decidas renovarla con un clic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-[#F4F7F7] border-t border-gray-100 p-8 flex items-center justify-between">
          {profFormStep > 1 ? <button onClick={() => { setProfFormStep(prev => prev - 1); setErrors({}); window.scrollTo(0,0); }} className="px-6 py-4 text-[#666666] font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 rounded-2xl transition-all">Anterior</button> : <div></div>}
          {profFormStep < 2 ? <button onClick={() => { setProfFormStep(prev=>prev+1); window.scrollTo(0,0); }} className="px-8 py-4 bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 hover:-translate-y-1 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-sm">Siguiente <ChevronRight className="w-5 h-5" /></button> : 
            <button onClick={submitProfForm} disabled={isSubmitting} className="px-10 py-5 bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-2xl rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-xl disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Send className="w-5 h-5" /> Marcarme Disponible</>}
            </button>
          }
        </div>
      </div>
    </section>
  );

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative">
      {/* Removí los paddings laterales del main para que el hero toque los bordes al igual que el Cartilla */}
      <main id="main-content" className="max-w-[1440px] mx-auto">
        {view === 'list' && renderList()}
        {view === 'detail' && renderDetail()}
        {view === 'publish_job' && renderPublishJobForm()}
        {view === 'publish_prof' && renderPublishProfForm()}
      </main>
    </div>
  );
}