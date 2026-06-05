import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Home, 
  ChevronRight, Award, Dog, Cat, Filter, 
  Heart, Stethoscope, Layers, ChevronDown,
  Bird, Rabbit, PawPrint
} from 'lucide-react';
// import { db } from '../firebase'; 
// import { collection, getDocs } from 'firebase/firestore';

const HuellaPremium = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 8c1.38 0 2.5-1.57 2.5-3.5S9.88 1 8.5 1 6 2.57 6 4.5 7.12 8 8.5 8zM15.5 8c1.38 0 2.5-1.57 2.5-3.5S16.88 1 15.5 1 13 2.57 13 4.5 14.12 8 15.5 8zM3.5 12C4.88 12 6 10.43 6 8.5S4.88 5 3.5 5 1 6.57 1 8.5 2.12 12 3.5 12zM20.5 12c1.38 0 2.5-1.57 2.5-3.5S21.88 5 20.5 5 18 6.57 18 8.5 19.12 12 20.5 12zM12 10.5c-3.5 0-6 2-6 4.5 0 1.5 1.5 3.5 3.5 4.5 1.5.7 2.5.5 2.5.5s1 .2 2.5-.5c2-1 3.5-3 3.5-4.5 0-2.5-2.5-4.5-6-4.5z"/>
  </svg>
);

// Array con el orden de prioridad de las provincias
const provinciasOrdenadas = [
  'Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Salta', 
  'Entre Ríos', 'San Juan', 'Neuquén', 'Río Negro', 'Corrientes', 'Jujuy', 
  'Chubut', 'San Luis', 'La Pampa', 'Misiones', 'Santiago del Estero', 
  'La Rioja', 'Catamarca', 'Chaco', 'Formosa', 'Santa Cruz', 'Tierra del Fuego'
];

const Cartilla = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('todos');
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    // Incorporación de la familia de fuentes Inter para UI consistente
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    // Función para mezclar aleatoriamente (Fisher-Yates)
    const shuffleArray = (array) => {
      let shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const generarDatosDePrueba = () => {
      // Subimos la cantidad de datos a 18 para que se note bien el grid
      const mockData = Array.from({ length: 18 }).map((_, index) => {
        const isClinica = index % 3 === 0; 
        return {
          id: `mock-${index + 1}`,
          tipo: isClinica ? 'clinica' : 'profesional',
          nombre: isClinica ? `Veterinaria San Roque ${index}` : `Dr. Especialista ${index + 1}`,
          planActual: index % 4 === 0 ? 'pro' : 'basico', 
          es24hs: isClinica && index === 0, 
          foto: '', 
          especialidad: !isClinica ? (index % 2 === 0 ? 'Cirugía especializada' : 'Veterinario clínico') : null,
          servicios: isClinica ? ['Ecografía', 'Laboratorio', 'Rayos X', 'Cirugía', 'Farmacia'] : null,
          provincia: ['Buenos Aires', 'CABA', 'Córdoba', 'Mendoza'][index % 4],
          domicilio: !isClinica && index % 2 !== 0,
        };
      });
      
      // Separamos por plan y mezclamos internamente para que no salgan siempre fijos
      const premium = shuffleArray(mockData.filter(d => d.planActual === 'pro'));
      const free = shuffleArray(mockData.filter(d => d.planActual !== 'pro'));
      
      setVeterinarios([...premium, ...free]);
      setLoading(false);
    };

    generarDatosDePrueba();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [openSection, setOpenSection] = useState(null);
  const [zonaSearch, setZonaSearch] = useState(''); // Estado para el buscador de provincias
  const filtrosRef = useRef(null);

  // 1. Estado para guardar qué filtros están activos
  const [filtros, setFiltros] = useState({
    zonas: [],
    mascotas: [],
    especialidades: [],
    domicilio: false,
    guardia24hs: false
  });

  // 2. Función para prender/apagar un filtro gris
  const toggleFiltro = (categoria, valor) => {
    setFiltros(prev => {
      const actual = prev[categoria];
      if (actual.includes(valor)) {
        return { ...prev, [categoria]: actual.filter(v => v !== valor) }; // Lo saca
      } else {
        return { ...prev, [categoria]: [...actual, valor] }; // Lo agrega
      }
    });
  };

  // 3. Función para limpiar todo
  const limpiarFiltros = () => {
    setFiltros({ zonas: [], mascotas: [], especialidades: [], domicilio: false, guardia24hs: false });
    setSearchTerm('');
    setZonaSearch('');
  };

// 4. EL MOTOR DE FILTRADO: Procesa los datos antes de dibujarlos
  // 4. EL MOTOR DE FILTRADO (Inteligente: ignora tildes y mayúsculas)
  const normalizar = (texto) => 
    texto ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const veterinariosFiltrados = veterinarios.filter(v => {
    // Buscador de texto libre
    if (searchTerm) {
      const term = normalizar(searchTerm);
      const matchNombre = normalizar(v.nombre || "").includes(term);
      const matchEspecialidad = normalizar(v.especialidad || "").includes(term);
      const matchServicios = v.servicios?.some(s => normalizar(s).includes(term));
      
      // Si el término de búsqueda no coincide en ninguna de estas categorías, se descarta
      if (!matchNombre && !matchEspecialidad && !matchServicios) return false;
    }
    
    // Filtros de Botones (esto se mantiene igual)
    if (filtros.zonas.length > 0 && !filtros.zonas.includes(v.provincia)) return false;
    if (filtros.especialidades.length > 0 && v.tipo === 'profesional' && !filtros.especialidades.includes(v.especialidad)) return false;
    if (filtros.domicilio && !v.domicilio) return false;
    if (filtros.guardia24hs && !v.es24hs) return false;
    
    return true; // Si pasó todas las trabas, se muestra
  });
  
  return (
    <main className="min-h-screen bg-[#F9F5F0] pb-24 relative flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* BURBUJAS DE FONDO LIBRES */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#4DB6AC]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[#2D6A6A]/15 rounded-full blur-[150px] pointer-events-none z-0"></div>
       {/* <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[#FF9800]/15 rounded-full blur-[150px] pointer-events-none z-0"></div> */}
      {/* Tercera burbuja (Inferior Izquierda) agregada */}
      <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-[#4DB6AC]/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* HEADER B2C - Espaciado Superior/Inferior Reducido */}
      <section className="relative pt-9 pb-2 z-10 text-center">
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center px-4">
          
          <div className="flex items-center gap-3 mb-5">
            <Dog className="w-8 h-8 text-[#FF9800]" strokeWidth={2.5} />
            <Heart className="w-7 h-7 text-[#FF9800]" strokeWidth={2.5} />
            <Cat className="w-8 h-8 text-[#FF9800]" strokeWidth={2.5} />
          </div>

          <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter leading-none mb-3">
            El equipo de salud ideal para tu mascota
          </h1>
          <p className="text-[#666666] text-[14px] md:text-[16px] font-medium mb-0 max-w-lg mx-auto leading-relaxed font-['Inter']">
            La primer cartilla dedicada especialmente para nuestros amigos peludos.
            
            Toda la red de bienestar en un solo lugar.
          </p>
        </div>
      </section>

      {/* OVERLAY DE FILTROS */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-[#1A3D3D]/10 backdrop-blur-[2px] z-20 transition-opacity" 
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* BARRA DE BÚSQUEDA Y TOGGLES (Ampliamos a max-w-5xl para que respire más) */}
      <div ref={filtrosRef} className="max-w-5xl mx-auto w-full relative z-30 px-4 mt-0 font-['Inter'] scroll-mt-4 sm:scroll-mt-15">
        <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative">
          
          <div className="grid grid-cols-3 bg-[#F4F7F7] p-1.5 rounded-[20px] w-full md:w-auto shrink-0">
            <button 
              onClick={() => setActiveTab('todos')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                activeTab === 'todos' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <Layers className="w-4 h-4 hidden sm:block" />
              <span className="inline">Todos</span>
            </button>
            <button 
              onClick={() => setActiveTab('especialistas')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                activeTab === 'especialistas' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <Stethoscope className="w-4 h-4 hidden sm:block" />
              <span className="inline">Especialistas</span>
            </button>
            <button 
              onClick={() => setActiveTab('clinicas')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                activeTab === 'clinicas' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <Home className="w-4 h-4 hidden sm:block" />
              <span className="inline">Clínicas</span>
            </button>
          </div>
          
          <div className="flex-1 w-full relative flex items-center bg-[#F4F7F7] md:bg-transparent rounded-[20px] md:rounded-none px-4 py-3 md:p-0">
            <Search className="text-[#666666] w-5 h-5 shrink-0" />
            <input 
              type="search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: Dermatólogo, San Isidro, Vacunación..." 
              className="w-full bg-transparent border-none pl-3 pr-2 py-1 text-[15px] font-medium focus:outline-none focus:ring-0 text-[#333333] placeholder:text-[#666666]/70" 
            />
          </div>

          <button 
            onClick={() => {
              const newState = !showFilters;
              setShowFilters(newState);
              // 2. MAGIA DEL SCROLL AUTOMÁTICO
              if (newState) {
                setTimeout(() => {
                  filtrosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100); // Pequeño delay para que el modal termine de renderizarse
              }
            }} 
            className={`w-full md:w-auto px-6 py-3.5 md:py-3 rounded-[18px] text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
              showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>

         {/* MODAL DE FILTROS ACTIVO */}
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-2xl z-40 animate-in fade-in slide-in-from-top-4">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-10 lg:divide-x lg:divide-gray-100 mb-6">
                
                {/* 1. Zona */}
                <div className="border-b border-gray-100 lg:border-none">
                  {/* CORRECCIÓN 2: 'pt-1 pb-4' en lugar de 'py-4' para eliminar el padding sobrante superior */}
                  <h3 
                    onClick={() => setOpenSection(openSection === 'zona' ? null : 'zona')}
                    className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] pt-1 pb-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                  >
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Zona</span>
                    <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'zona' ? 'rotate-180' : ''}`} />
                  </h3>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'zona' ? 'max-h-[500px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                    <input
                      type="text"
                      placeholder="Buscar provincia..."
                      className="w-full bg-[#F4F7F7] text-[#1A3D3D] px-4 py-3 rounded-xl text-[13px] font-medium border border-transparent focus:border-[#2D6A6A] outline-none mb-3"
                      onChange={(e) => setZonaSearch(e.target.value.toLowerCase())}
                    />
                    
                    <div className="max-h-56 overflow-y-auto pr-2 grid grid-cols-3 gap-2">
                      {provinciasOrdenadas
                        .filter(prov => prov.toLowerCase().includes(zonaSearch))
                        .map(p => {
                          const isActive = filtros.zonas.includes(p);
                          return (
                            <button
                              key={p}
                              onClick={() => toggleFiltro('zonas', p)}
                              className={`text-[12px] px-2 py-2 rounded-lg text-left transition-colors truncate ${
                                isActive ? 'bg-[#2D6A6A] text-white' : 'hover:bg-[#F4F7F7] text-[#666666]'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>

                {/* 2. Especialidad Ampliada */}
                <div className="border-b border-gray-100 lg:border-none lg:pl-10">
                  <h3 
                    onClick={() => setOpenSection(openSection === 'especialidad' ? null : 'especialidad')}
                    className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                  >
                    <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Especialidad</span>
                    <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'especialidad' ? 'rotate-180' : ''}`} />
                  </h3>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'especialidad' ? 'max-h-[800px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-wrap gap-2">
                      {['Clínica Médica', 'Cirugía especializada', 'Veterinario clínico', 'Dermatología', 'Ecografía', 'Cardiología', 'Neurología', 'Odontología', 'Oftalmología', 'Oncología', 'Traumatología', 'Comportamiento'].map(e => {
                        const isActive = filtros.especialidades.includes(e);
                        return (
                          <span 
                            key={e} 
                            onClick={() => toggleFiltro('especialidades', e)}
                            className={`px-3 py-1.5 text-[12px] font-medium rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-[#2D6A6A] text-white shadow-sm' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'}`}
                          >
                            {e}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Columna Combinada: Modalidad + Mascotas */}
                <div className="flex flex-col gap-0 lg:gap-8 lg:pl-10">
                  
                  {/* Modalidad */}
                  <div className="border-b border-gray-100 lg:border-none">
                    <h3 
                      onClick={() => setOpenSection(openSection === 'modalidad' ? null : 'modalidad')}
                      className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                    >
                      <span className="flex items-center gap-2"><Layers className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Modalidad</span>
                      <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'modalidad' ? 'rotate-180' : ''}`} />
                    </h3>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'modalidad' ? 'max-h-[300px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-[16px] border text-[12px] font-medium transition-colors ${filtros.domicilio ? 'bg-[#df803b] text-white border-[#df803b]' : 'bg-[#FFF5EE] border-[#FFE4D6] text-[#df803b] hover:bg-[#FFE4D6]/50'}`}>
                          <input 
                            type="checkbox" 
                            checked={filtros.domicilio}
                            onChange={(e) => {
                              setFiltros({...filtros, domicilio: e.target.checked});
                              if (e.target.checked) setActiveTab('especialistas');
                            }}
                            className="w-4 h-4 accent-white rounded cursor-pointer" 
                          />
                          Atención a domicilio
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-[16px] border text-[12px] font-medium transition-colors ${filtros.guardia24hs ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100/50'}`}>
                          <input 
                            type="checkbox" 
                            checked={filtros.guardia24hs}
                            onChange={(e) => {
                              setFiltros({...filtros, guardia24hs: e.target.checked});
                              if (e.target.checked) setActiveTab('clinicas');
                            }}
                            className="w-4 h-4 accent-white rounded cursor-pointer" 
                          />
                          Guardia 24hs
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Mascotas */}
                  {/* CORRECCIÓN 2: Se eliminaron las clases border-b border-gray-100 de este div para que no genere línea doble */}
                  <div className="border-none">
                    <h3 
                      onClick={() => setOpenSection(openSection === 'mascotas' ? null : 'mascotas')}
                      className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                    >
                      <span className="flex items-center gap-2"><Dog className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Mascotas</span>
                      <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'mascotas' ? 'rotate-180' : ''}`} />
                    </h3>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'mascotas' ? 'max-h-[400px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { nombre: 'Perros y Gatos', icon: Cat },
                          { nombre: 'Grandes Animales', icon: Home }, 
                          { nombre: 'Aves', icon: Bird },
                          { nombre: 'Exóticos', icon: PawPrint },
                         
                        
                        ].map(mascota => {
                          const isActive = filtros.mascotas.includes(mascota.nombre);
                          const IconComponent = mascota.icon;
                          return (
                            <span 
                              key={mascota.nombre} 
                              onClick={() => toggleFiltro('mascotas', mascota.nombre)}
                              className={`px-3 py-2 text-[12px] font-medium rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 border ${
                                isActive 
                                  ? 'bg-[#2D6A6A] text-white border-[#2D6A6A] shadow-sm' 
                                  : 'bg-white text-[#666666] border-gray-200 hover:border-[#2D6A6A]/50 hover:bg-gray-50'
                              }`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                              {mascota.nombre}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              
              {/* BOTONERA DE ACCIÓN */}
<div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-6 gap-3">
  <button 
    onClick={limpiarFiltros}
    className="text-[#666666] text-[13px] font-medium hover:text-[#1A3D3D] hover:underline transition-all px-4 py-2"
  >
    Limpiar filtros
  </button>
  <button 
    onClick={() => setShowFilters(false)}
    className="w-full sm:w-auto bg-[#1A3D3D] text-white px-8 py-3 rounded-[16px] text-[13px] font-medium hover:bg-[#2D6A6A] transition-colors shadow-md flex items-center justify-center gap-2"
  >
    Ver resultados
  </button>
</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 max-w-6xl mx-auto w-full px-4 mt-2 sm:mt-2 mb-4 relative z-10 font-['Inter'] min-h-[80vh]">
         {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin"></div>
          </div>
        )}

      {/* GRILLA DE RESULTADOS */}
        {!loading && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            
            {veterinariosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
                {/* ESTADO VACÍO (SIN RESULTADOS) */}
                <div className="w-20 h-20 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                  <Search className="w-10 h-10 text-[#2D6A6A] opacity-50" />
                </div>
                <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">
                  ¡Uy! No encontramos resultados
                </h3>
                <p className="text-[#666666] font-medium text-[14px] max-w-md mx-auto mb-6">
                  Probá ajustando los filtros o buscando con otras palabras para ver más opciones disponibles.
                </p>
                <button 
                  onClick={limpiarFiltros}
                  className="bg-[#1A3D3D] text-white px-8 py-3 rounded-[16px] text-[13px] font-medium hover:bg-[#2D6A6A] transition-colors shadow-md"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              (() => {
                {/* Función interna que dibuja la tarjeta (Profesional o Clínica) */}
                const renderCard = (item) => {
                const isProfesional = item.tipo === 'profesional';
                const nameParts = item.nombre ? item.nombre.split(' ') : [''];
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ');

                return (
                  <article 
                    key={item.id} 
                    onClick={() => navigate(`/${item.tipo}/${item.id}`)}
                    // Agregamos min-h-[220px] para forzar que ambas tengan alturas visuales similares
                    className={`bg-white rounded-[24px] p-4 sm:p-5 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer group flex h-full min-h-[220px] relative mt-4 z-20 ${isProfesional ? 'flex-col text-center' : 'flex-col'}`}
                  >
                   {/* BADGES FLOTANTES */}
                    {isProfesional ? (
                      <div className="absolute -top-4 right-4 flex items-center z-30">
                        {/* Mostramos solo UN badge: Prioridad al Destacado, luego al Domicilio */}
                        {item.planActual === 'pro' ? (
                          <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm hover:-translate-y-0.5 transition-transform cursor-help" title="Profesional Destacado">
                            <Award className="w-5 h-5" />
                          </div>
                        ) : item.domicilio ? (
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm hover:-translate-y-0.5 transition-transform cursor-help" title="Atención a domicilio">
                            <Home className="w-5 h-5" />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      /* Badge Clínica 24hs (Rojo) */
                      item.es24hs && (
                        <div className="absolute -top-3 right-4 inline-flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full shadow-sm z-30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          <span className="text-red-600 font-bold text-[10px] uppercase tracking-[0.2em]">Guardia 24hs.</span>
                        </div>
                      )
                    )}
                    {isProfesional ? (
                      /* --- DISEÑO VERTICAL (TARJETA DE CRÉDITO) PARA PROFESIONALES --- */
                      <>
                        <div className="relative mx-auto mb-3 shrink-0">
                          {item.foto ? (
                            <img src={item.foto} alt={item.nombre} className="w-[56px] h-[56px] rounded-full object-cover shadow-sm border border-gray-50" />
                          ) : (
                            <div className="w-[56px] h-[56px] rounded-full bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm">
                              <Stethoscope className="w-6 h-6 opacity-80" />
                            </div>
                          )}
                        </div>
                        <div className="mb-2">
                          <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[14px] sm:text-[15px] leading-[1.2] line-clamp-2">
                            <span className="block truncate">{firstName}</span>
                            {lastName && <span className="block truncate">{lastName}</span>}
                          </h2>
                        </div>
                        {/* Se redujo mb-4 a mb-1 para acortar la altura de la tarjeta */}
                        <div className="mb-1 mt-auto">
                          <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-3 py-2 rounded-xl w-full">
                            <span className="text-[#2D6A6A] text-[11px] sm:text-[12px] font-semibold leading-[1.3] truncate">
                              {item.especialidad}
                            </span>
                          </span>
                        </div>
                        {/* Se redujo pt-3 a pt-2 para achicar el padding superior del footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                          <div className="flex items-center gap-1 text-[#666666] font-medium text-[11px] sm:text-[12px] min-w-0">
  <MapPin className="w-3.5 h-3.5 shrink-0" />
  <span className="truncate font-bold text-[#1A3D3D]">{item.provincia}</span>
</div>
                          <div className="flex items-center gap-1 text-[#9CA3AF] group-hover:text-[#2D6A6A] transition-colors shrink-0">
                            <span className="text-[12px] font-medium hidden sm:inline-block">Ver perfil</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </>
                    ) : (
                      /* --- DISEÑO HORIZONTAL (ALARGADO) PARA CLÍNICAS --- */
                      <>
                        <div className="flex items-center gap-3 sm:gap-4 mb-2">
                          <div className="relative shrink-0">
                            {item.foto ? (
                              <img src={item.foto} alt={item.nombre} className="w-[52px] h-[52px] rounded-[16px] object-cover shadow-sm border border-gray-50" />
                            ) : (
                              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm">
                                <Home className="w-6 h-6 opacity-80" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[14px] sm:text-[15px] leading-[1.2] line-clamp-2">
                              <span className="block truncate">{firstName}</span>
                              {lastName && <span className="block truncate">{lastName}</span>}
                            </h2>
                          </div>
                        </div>

                        {/* Nuevo escalón con la dirección completa */}
                        <div className="mb-3 flex items-center gap-1.5 text-[#666666]">
  <MapPin className="w-3 h-3 shrink-0" />
  <p className="text-[11px] sm:text-[12px] font-medium truncate">
    {item.direccion ? (
       // Si hay dirección, asumimos formato "Calle, Provincia"
       <>
         {item.direccion.split(',')[0]}, <span className="font-bold text-[#1A3D3D]">{item.direccion.split(',')[1]}</span>
       </>
    ) : (
       // Formato por defecto
       <>Av. San Martín 1234, <span className="font-bold text-[#1A3D3D]">{item.provincia}</span></>
    )}
  </p>
</div>

                        <div className="mb-4 mt-auto">
                          <div className="flex flex-wrap gap-1.5">
                            {item.servicios?.slice(0, 6).map((srv, i) => (
                              <span key={i} className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[11px] sm:text-[12px] font-medium border border-gray-100">
                                {srv}
                              </span>
                            ))}
                            {item.servicios?.length > 6 && (
                              <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-[8px] text-[11px] sm:text-[12px] font-medium">
                                +{item.servicios.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Footer alineado solo a la derecha ya que la dirección pasó arriba */}
                        <div className="flex items-center justify-end pt-3 border-t border-gray-50 mt-auto">
                          <div className="flex items-center gap-1 text-[#9CA3AF] group-hover:text-[#2D6A6A] transition-colors shrink-0">
                            <span className="text-[12px] font-medium hidden sm:inline-block">Ver perfil</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                );
              };

            return (
                <>
                 {/* VISTA 1: TODOS (Grid de 5 columnas totales) */}
                  {activeTab === 'todos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 pt-0 mt-0">
                      <div className="lg:col-span-2 flex flex-col gap-0">
                        <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] px-2 leading-none">Clínicas Cercanas</h3>
                        {/* Reducimos a mt-3 para que la tarjeta quede bien cerca del título */}
                        <div className="grid grid-cols-1 gap-x-4 gap-y-8 mt-3">
                          {veterinariosFiltrados.filter(v => v.tipo === 'clinica').slice(0, 4).map(renderCard)}
                        </div>
                      </div>
                      <div className="lg:col-span-3 flex flex-col gap-0">
                        <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] px-2 leading-none">Especialistas</h3>
                        {/* Reducimos a mt-3 para que la tarjeta quede bien cerca del título */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 mt-3">
                          {veterinariosFiltrados.filter(v => v.tipo === 'profesional').slice(0, 9).map(renderCard)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA 2: ESPECIALISTAS (5 Columnas) */}
                  {activeTab === 'especialistas' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-4 pt-0 mt-0">
                      {veterinariosFiltrados.filter(v => v.tipo === 'profesional').map(renderCard)}
                    </div>
                  )}

                  {/* VISTA 3: CLÍNICAS (3 Columnas) */}
                  {activeTab === 'clinicas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 pt-0 mt-0">
                      {veterinariosFiltrados.filter(v => v.tipo === 'clinica').map(renderCard)}
                    </div>
                 )}
              </>
            );
          })()
        )}

     </section>
      )} 
      </div>
    </main>
  );
};

export default Cartilla;