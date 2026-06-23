import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, ChevronDown, Filter,
  Dog, Cat, Stethoscope, Layers,
  Bird, PawPrint, TreeDeciduous
} from 'lucide-react';

// Importamos los datos centralizados
import especialidadesData from '../data/especialidades.json';
import filtrosConfig from '../data/filtrosConfig.json';

// Mapeo de íconos para las mascotas (ya que en JSON no se pueden guardar componentes de React)
const iconMap = {
  'perros_gatos': Cat,
  'grandes_animales': TreeDeciduous,
  'aves': Bird,
  'exoticos': PawPrint
};

const BarraFiltros = ({ 
  tabs = [], 
  activeTab, 
  setActiveTab, 
  searchPlaceholder = "Buscar...",
  searchTerm,
  setSearchTerm,
  showModalidad = true // Por defecto se muestra, en capacitaciones lo pasaremos como false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [zonaSearch, setZonaSearch] = useState('');
  const filtrosRef = useRef(null);

  // Funciones de lectura de URL
  const getParam = (key) => searchParams.get(key) ? searchParams.get(key).split(',') : [];

  const filtros = {
    zonas: getParam('zonas'),
    especialidades: getParam('especialidades'),
    mascotas: getParam('mascotas'),
    domicilio: searchParams.get('domicilio') === 'true',
    guardia24hs: searchParams.get('guardia24hs') === 'true'
  };

  // Funciones de escritura en URL
  const toggleFiltro = (categoria, valor) => {
    const params = new URLSearchParams(searchParams);
    let actuales = getParam(categoria);
    
    if (actuales.includes(valor)) {
      actuales = actuales.filter(v => v !== valor);
    } else {
      actuales = [...actuales, valor];
    }

    if (actuales.length > 0) params.set(categoria, actuales.join(','));
    else params.delete(categoria);
    
    setSearchParams(params);
  };

  const limpiarFiltros = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('zonas');
    params.delete('especialidades');
    params.delete('mascotas');
    params.delete('domicilio');
    params.delete('guardia24hs');
    setSearchParams(params);
    setSearchTerm('');
    setZonaSearch('');
  };

  // Manejo de scroll dinámico
  const toggleModal = () => {
    const newState = !showFilters;
    setShowFilters(newState);
    if (newState) {
      setTimeout(() => {
        filtrosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div ref={filtrosRef} className="max-w-5xl mx-auto w-full relative z-30 px-3 mt-0 font-['Inter'] scroll-mt-4 sm:scroll-mt-15">
      
      {/* OVERLAY FONDO OSCURO */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-[#1A3D3D]/10 backdrop-blur-[2px] z-20 transition-opacity" 
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* BARRA PRINCIPAL */}
      <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-30">
        
        {/* PESTAÑAS DINÁMICAS */}
        {tabs.length > 0 && (
          <div className="grid grid-cols-3 bg-[#F4F7F7] p-1.5 rounded-[20px] w-full md:w-auto shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 hidden sm:block" />}
                  <span className="inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        )}
        
        {/* BUSCADOR LIBRE */}
        <div className="flex-1 w-full relative flex items-center bg-[#F4F7F7] md:bg-transparent rounded-[20px] md:rounded-none px-4 py-3 md:p-0">
          <Search className="text-[#666666] w-5 h-5 shrink-0" />
          <input 
            type="search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent border-none pl-3 pr-2 py-1 text-[15px] font-medium focus:outline-none focus:ring-0 text-[#333333] placeholder:text-[#666666]/70" 
          />
        </div>

        {/* BOTÓN ABRIR MODAL FILTROS */}
        <button 
          onClick={toggleModal} 
          className={`w-full md:w-auto px-6 py-3.5 md:py-3 rounded-[18px] text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
            showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>

        {/* MODAL DESPLEGABLE DE FILTROS */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-2xl z-40 animate-in fade-in slide-in-from-top-4 cursor-default">
            
            <div className={`grid grid-cols-1 gap-0 lg:gap-10 lg:divide-x lg:divide-gray-100 mb-6 ${showModalidad ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
              
              {/* 1. COLUMNA ZONA */}
              <div className="border-b border-gray-100 lg:border-none">
                <h3 
                  onClick={() => setOpenSection(openSection === 'zona' ? null : 'zona')}
                  className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] pt-1 pb-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                >
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Zona
                  {openSection !== 'zona' && filtros.zonas.length > 0 && (
                    <span className="text-[11px] text-gray-400 font-medium ml-0.5 lowercase truncate max-w-[190px]">
                      {filtros.zonas.join(', ')}
                    </span>
                  )}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'zona' ? 'rotate-180' : ''}`} />
                </h3>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'zona' ? 'max-h-[500px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                  <input
                    type="text"
                    placeholder="Buscar provincia..."
                    className="w-full bg-[#F4F7F7] text-[#1A3D3D] px-4 py-3 rounded-xl text-[13px] font-medium border border-transparent focus:border-[#2D6A6A] outline-none mb-3"
                    onChange={(e) => setZonaSearch(e.target.value.toLowerCase())}
                  />
                  
                  <div className="max-h-56 overflow-y-auto pr-2 grid grid-cols-3 gap-2 custom-scrollbar">
                    {filtrosConfig.provincias
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

              {/* 2. COLUMNA ESPECIALIDAD */}
              <div className="border-b border-gray-100 lg:border-none lg:pl-10">
                <h3 
                  onClick={() => setOpenSection(openSection === 'especialidad' ? null : 'especialidad')}
                  className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                >
                  <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Especialidad
                  {openSection !== 'especialidad' && filtros.especialidades.length > 0 && (
                    <span className="text-[11px] text-gray-400 font-medium ml-0.5 lowercase truncate max-w-[150px]">
                      {filtros.especialidades.join(', ')}
                    </span>
                  )}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'especialidad' ? 'rotate-180' : ''}`} />
                </h3>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'especialidad' ? 'max-h-[800px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {especialidadesData.map(e => {
                      const isActive = filtros.especialidades.includes(e.nombre_mostrar);
                      return (
                        <span 
                          key={e.id} 
                          onClick={() => toggleFiltro('especialidades', e.nombre_mostrar)}
                          className={`px-3 py-1.5 text-[12px] font-medium rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-[#2D6A6A] text-white shadow-sm' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'}`}
                        >
                          {e.nombre_mostrar}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 3. COLUMNA COMBINADA: MODALIDAD Y MASCOTAS */}
              <div className="flex flex-col gap-0 lg:gap-8 lg:pl-10">
                
                {/* Modalidad Condicional */}
                {showModalidad && (
                  <div className="border-b border-gray-100 lg:border-none">
                    <h3 
                      onClick={() => setOpenSection(openSection === 'modalidad' ? null : 'modalidad')}
                      className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Modalidad
                      </span>
                      <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'modalidad' ? 'rotate-180' : ''}`} />
                    </h3>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'modalidad' ? 'max-h-[300px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-[16px] border text-[12px] font-medium transition-colors ${filtros.domicilio ? 'bg-[#df803b] text-white border-[#df803b]' : 'bg-[#FFF5EE] border-[#FFE4D6] text-[#df803b] hover:bg-[#FFE4D6]/50'}`}>
                          <input 
                            type="checkbox" 
                            checked={filtros.domicilio}
                            onChange={(e) => {
                              const params = new URLSearchParams(searchParams);
                              if (e.target.checked) params.set('domicilio', 'true');
                              else params.delete('domicilio');
                              setSearchParams(params);
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
                              const params = new URLSearchParams(searchParams);
                              if (e.target.checked) params.set('guardia24hs', 'true');
                              else params.delete('guardia24hs');
                              setSearchParams(params);
                            }}
                            className="w-4 h-4 accent-white rounded cursor-pointer" 
                          />
                          Guardia 24hs
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mascotas */}
                <div className="border-none">
                  <h3 
                    onClick={() => setOpenSection(openSection === 'mascotas' ? null : 'mascotas')}
                    className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                  >
                    <span className="flex items-center gap-2">
                      <Dog className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Mascotas
                    </span>
                    <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'mascotas' ? 'rotate-180' : ''}`} />
                  </h3>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'mascotas' ? 'max-h-[400px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-wrap gap-2">
                      {filtrosConfig.mascotas.map(mascota => {
                        const isActive = filtros.mascotas.includes(mascota.nombre);
                        const IconComponent = iconMap[mascota.id] || Dog; // Fallback al icono de perro si no encuentra
                        return (
                          <span 
                            key={mascota.id} 
                            onClick={() => toggleFiltro('mascotas', mascota.nombre)}
                            className={`px-3 py-2 text-[12px] font-medium rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 border ${
                              isActive ? 'bg-[#2D6A6A] text-white border-[#2D6A6A] shadow-sm' : 'bg-white text-[#666666] border-gray-200 hover:border-[#2D6A6A]/50 hover:bg-gray-50'
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
            
            {/* BOTONERA INFERIOR */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-6 gap-3 pt-6 border-t border-gray-100">
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
  );
};

export default BarraFiltros;