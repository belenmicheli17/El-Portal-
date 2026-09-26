import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, ChevronDown, Filter,
  Dog, Cat, Stethoscope, Layers,
  Bird, PawPrint, TreeDeciduous,
  Calendar, BookMarked, // <-- NUEVOS ÍCONOS PARA PAPERS
  Home, Siren // <-- NUEVOS ÍCONOS PARA MODALIDAD
} from 'lucide-react';

// Importamos los datos centralizados
import especialidadesData from '../data/especialidades.json';
import filtrosConfig from '../data/filtrosConfig.json';
// FALTA IMPORTAR LAS PROVINCIAS 
// Mapeo de íconos para las mascotas
const iconMap = {
  'perros_gatos': Cat,
  'grandes_animales': TreeDeciduous,
  'aves': Bird,
  'exoticos': PawPrint
};

// (Borramos el array estático de aniosDisponibles de acá arriba)

const BarraFiltros = ({ 
  tabs = [], 
  activeTab, 
  setActiveTab, 
  searchPlaceholder = "Buscar...",
  searchTerm,
  setSearchTerm,
  showModalidad = true,
  modo = 'default',
  aniosDisponibles = [],
  provinciasDisponibles = {},
  especialidadesDisponibles = {}
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const filtrosRef = useRef(null);
  const [showProvincia, setShowProvincia] = useState(false);
  

  // Funciones de lectura de URL
  const getParam = (key) => searchParams.get(key) ? searchParams.get(key).split(',') : [];

  // NUEVO: Agregamos los filtros de papers
  const filtros = {
    zonas: getParam('zonas'),
    especialidades: getParam('especialidades'),
    mascotas: getParam('mascotas'),
    domicilio: searchParams.get('domicilio') === 'true',
    guardia24hs: searchParams.get('guardia24hs') === 'true',
    categorias_papers: getParam('categorias_papers'),
    anios: getParam('anios')
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
    params.delete('categorias_papers');
    params.delete('anios');
    setSearchParams(params);
    setSearchTerm('');
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

  // Igual que toggleModal pero solo abre (no cierra si ya está abierto)
  const openModal = () => {
    if (!showFilters) {
      setShowFilters(true);
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

                  {/* PESTAÑAS DESKTOP — arriba de la tarjeta, tipo solapa (estilo Doctoralia) */}
      {tabs.length > 0 && (
        <div className="hidden md:inline-flex gap-1 relative z-20 bg-[#F4F7F7] rounded-t-[16px] px-1.5 overflow-hidden">
          {tabs.filter(t => t.id !== 'todos').map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-t-[14px] text-[13px] md:text-[14px] font-semibold transition-all ${
                  isActive ? 'bg-white text-[#1A3D3D]' : 'bg-transparent text-[#555555] hover:text-[#1A3D3D]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* BARRA PRINCIPAL */}
      <div className={`bg-white rounded-[24px] md:rounded-tl-none p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex md:inline-flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-30 md:-mt-px transition-all duration-300 ${showFilters ? 'rounded-b-none' : ''}`}>
        
        {/* MÓVIL: toggle doble (+ botón filtros solo si NO es modo default) */}
        {tabs.length > 0 && (
          <div className="flex md:hidden items-center gap-2 w-full">
            <div className="grid grid-cols-2 bg-[#F4F7F7] p-1.5 rounded-[20px] flex-1">
              {tabs.filter(t => t.id !== 'todos').map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                      activeTab === tab.id ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {modo !== 'default' && (
              <button
                onClick={toggleModal}
                className={`shrink-0 px-4 py-3.5 rounded-[18px] text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                  showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
              </button>
            )}
          </div>
        )}
        
        {/* BUSCADOR + PROVINCIA/LOCALIDAD + BOTÓN BUSCAR */}
        <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
          <div className="md:w-[500px] md:flex-none w-full relative flex items-center bg-[#F4F7F7] border border-transparent focus-within:border-[#2D6A6A] rounded-[20px] md:rounded-full px-4 py-3 md:py-2.5 transition-all">
            <Search className="text-[#666666] w-4 h-4 shrink-0" />
            <input 
              type="search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (modo === 'default') openModal(); }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none pl-3 pr-2 py-0.5 text-[15px] font-medium focus:outline-none focus:ring-0 text-[#1A3D3D] placeholder:text-[#888888]" 
            />
          </div>

          {/* CAMPO PROVINCIA/LOCALIDAD — dropdown con diseño propio */}
          {modo === 'default' && (
            <div className="relative w-full md:w-[250px] shrink-0">
              <button
                type="button"
                onClick={() => setShowProvincia(v => !v)}
                className="w-full flex items-center gap-2 bg-[#F4F7F7] border border-transparent rounded-[20px] md:rounded-full px-4 py-3 md:py-2.5 transition-all text-left"
              >
                <MapPin className="text-[#666666] w-4 h-4 shrink-0" />
                <span className={`flex-1 truncate text-[15px] font-medium ${filtros.zonas[0] ? 'text-[#1A3D3D]' : 'text-[#888888]'}`}>
                  {filtros.zonas[0] || 'Provincia / Localidad'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#666666] shrink-0 transition-transform ${showProvincia ? 'rotate-180' : ''}`} />
              </button>

              {showProvincia && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProvincia(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar py-2">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.delete('zonas');
                        setSearchParams(params);
                        setShowProvincia(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${!filtros.zonas[0] ? 'text-[#2D6A6A] bg-[#F4F7F7]' : 'text-[#555555] hover:bg-[#F4F7F7]'}`}
                    >
                      Todas las provincias
                    </button>
                    {filtrosConfig.provincias
                      .filter(p => Object.keys(provinciasDisponibles).length === 0 || provinciasDisponibles[p])
                      .map(p => {
                        const isActive = filtros.zonas[0] === p;
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set('zonas', p);
                              setSearchParams(params);
                              setShowProvincia(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors flex items-center justify-between ${isActive ? 'text-[#2D6A6A] bg-[#F4F7F7]' : 'text-[#555555] hover:bg-[#F4F7F7]'}`}
                          >
                            <span className="truncate">{p}</span>
                            {provinciasDisponibles[p] && (
                              <span className="text-[11px] text-gray-400 font-bold ml-2 shrink-0">{provinciasDisponibles[p]}</span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* BOTÓN BUSCAR — solo modo default, junto al buscador (reemplaza el rol de "Ver resultados") */}
          {modo === 'default' && (
            <button
              onClick={() => setShowFilters(false)}
              className="w-full md:w-auto shrink-0 bg-[#2D6A6A] text-white px-7 py-3 md:py-2.5 rounded-[20px] md:rounded-full text-[13px] md:text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1A3D3D] transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
          )}
        </div>
        {/* BOTÓN ABRIR MODAL FILTROS — desktop, solo si NO es modo default */}
        {modo !== 'default' && (
          <button 
            onClick={toggleModal} 
            className={`hidden md:flex w-auto px-6 py-3 rounded-[18px] text-[13px] font-medium items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
              showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>
        )}

        {/* BOTÓN ABRIR MODAL FILTROS — desktop, solo si NO es modo default */}
        {modo !== 'default' && (
          <button 
            onClick={toggleModal} 
            className={`hidden md:flex w-auto px-6 py-3 rounded-[18px] text-[13px] font-medium items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
              showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>
        )}

        {/* MODAL DESPLEGABLE DE FILTROS */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-0 bg-white rounded-t-none rounded-b-[32px] p-6 sm:p-8 border-x border-b border-gray-100 shadow-2xl z-40 animate-in fade-in slide-in-from-top-4 cursor-default">
            
            <div className={`grid grid-cols-1 gap-0 lg:gap-10 lg:divide-x lg:divide-gray-100 mb-6 ${modo === 'papers' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
              
              {modo === 'papers' ? (
                /* ======================================================== */
                /* MODO PAPERS: ESPECIALIDAD | CATEGORÍA | AÑO              */
                /* ======================================================== */
                <>
                  {/* COLUMNA 1: ESPECIALIDAD */}
                  <div className="border-b border-gray-100 lg:border-none">
                    <h3 
                      onClick={() => setOpenSection(openSection === 'especialidad' ? null : 'especialidad')}
                      className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                    >
                      <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Especialidad Médica
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

                  {/* COLUMNA 2: CATEGORÍA DEL PAPER */}
                  <div className="border-b border-gray-100 lg:border-none lg:pl-10">
                    <h3 
                      onClick={() => setOpenSection(openSection === 'categoria' ? null : 'categoria')}
                      className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                    >
                      <span className="flex items-center gap-2"><BookMarked className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Tipo de Paper
                      {openSection !== 'categoria' && filtros.categorias_papers.length > 0 && (
                        <span className="text-[11px] text-gray-400 font-medium ml-0.5 lowercase truncate max-w-[150px]">
                          {filtros.categorias_papers.join(', ')}
                        </span>
                      )}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'categoria' ? 'rotate-180' : ''}`} />
                    </h3>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'categoria' ? 'max-h-[800px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-col gap-1.5 pr-2">
                        {filtrosConfig.categorias_papers?.map(cat => {
                          const isActive = filtros.categorias_papers.includes(cat);
                          return (
                            <button 
                              key={cat} 
                              onClick={() => toggleFiltro('categorias_papers', cat)} 
                              className={`text-[12px] px-3 py-2 rounded-lg text-left transition-colors font-medium ${isActive ? 'bg-[#2D6A6A] text-white' : 'hover:bg-[#F4F7F7] text-[#666666]'}`}
                            >
                              {cat}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA 3: AÑO DE PUBLICACIÓN */}
                  <div className="border-none lg:pl-10">
                    <h3 
                      onClick={() => setOpenSection(openSection === 'anio' ? null : 'anio')}
                      className="font-montserrat font-black text-[#1A3D3D] text-[11px] lg:text-[12px] uppercase tracking-[0.2em] py-4 lg:py-0 lg:mb-4 flex items-center justify-between cursor-pointer lg:cursor-default transition-opacity hover:opacity-80 lg:hover:opacity-100 select-none"
                    >
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Año de Publicación</span>
                      <ChevronDown className={`w-5 h-5 text-[#2D6A6A] lg:hidden transition-transform duration-300 ${openSection === 'anio' ? 'rotate-180' : ''}`} />
                    </h3>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:max-h-none lg:opacity-100 ${openSection === 'anio' ? 'max-h-[800px] opacity-100 pb-4 lg:pb-0' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-wrap gap-2">
                        {aniosDisponibles.map(anio => {
                          const isActive = filtros.anios.includes(anio);
                          return (
                            <span 
                              key={anio} 
                              onClick={() => toggleFiltro('anios', anio)} 
                              className={`px-4 py-2 text-[12px] font-medium rounded-xl cursor-pointer transition-colors border ${isActive ? 'bg-[#2D6A6A] text-white border-[#2D6A6A] shadow-sm' : 'bg-white text-[#666666] border-gray-200 hover:border-[#2D6A6A]/50 hover:bg-gray-50'}`}
                            >
                              {anio}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ======================================================== */
                /* MODO DEFAULT (CARTILLA): ESPECIALIDAD | MODALIDAD Y MASCOTAS */
                /* ======================================================== */
                <>
                  {/* 1. COLUMNA ESPECIALIDAD */}
                  <div className="border-b border-gray-100 lg:border-none">
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
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {especialidadesData.map(grupo => {
                          const opcionesFiltradas = grupo.opciones.filter(
                            opcion => Object.keys(especialidadesDisponibles).length === 0 || especialidadesDisponibles[opcion]
                          );
                          if (opcionesFiltradas.length === 0) return null;
                          return (
                            <div key={grupo.id}>
                              <p className="text-[10px] font-black text-[#1A3D3D] uppercase tracking-[0.15em] mb-2 opacity-50">
                                {grupo.grupo}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {opcionesFiltradas.map(opcion => {
                                  const isActive = filtros.especialidades.includes(opcion);
                                  const cantidad = especialidadesDisponibles[opcion] || 0;
                                  return (
                                    <span
                                      key={opcion}
                                      onClick={() => toggleFiltro('especialidades', opcion)}
                                      className={`px-3 py-1.5 text-[12px] font-medium rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 ${isActive ? 'bg-[#2D6A6A] text-white shadow-sm' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'}`}
                                    >
                                      {opcion}
                                      {cantidad > 0 && (
                                        <span className={`text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                          ({cantidad})
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 2. COLUMNA COMBINADA: MODALIDAD Y MASCOTAS */}
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
                          <div className="grid grid-cols-2 gap-3">
                            {/* BOTÓN: ATENCIÓN A DOMICILIO */}
                            <button
                              type="button"
                              onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                if (!filtros.domicilio) params.set('domicilio', 'true');
                                else params.delete('domicilio');
                                setSearchParams(params);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                                filtros.domicilio
                                  ? 'bg-blue-600 border-blue-600 shadow-md'
                                  : 'bg-blue-50 border-blue-100 hover:border-blue-300'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${filtros.domicilio ? 'bg-white/20 text-white' : 'bg-white text-blue-600 border border-blue-100'}`}>
                                <Home className="w-5 h-5" />
                              </div>
                              <span className={`text-[12px] font-bold leading-tight ${filtros.domicilio ? 'text-white' : 'text-blue-700'}`}>
                                Atiende a domicilio
                              </span>
                            </button>

                            {/* BOTÓN: GUARDIA 24HS */}
                            <button
                              type="button"
                              onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                if (!filtros.guardia24hs) params.set('guardia24hs', 'true');
                                else params.delete('guardia24hs');
                                setSearchParams(params);
                              }}
                              className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                                filtros.guardia24hs
                                  ? 'bg-red-500 border-red-500 shadow-md'
                                  : 'bg-red-50 border-red-100 hover:border-red-300'
                              }`}
                            >
                              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${filtros.guardia24hs ? 'bg-white' : 'bg-red-500'}`}></span>
                              </span>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${filtros.guardia24hs ? 'bg-white/20 text-white' : 'bg-white text-red-600 border border-red-100'}`}>
                                <Siren className="w-5 h-5" />
                              </div>
                              <span className={`text-[12px] font-bold leading-tight ${filtros.guardia24hs ? 'text-white' : 'text-red-700'}`}>
                                Guardia 24hs
                              </span>
                            </button>
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
                            const IconComponent = iconMap[mascota.id] || Dog; 
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
                </>
              )}
            </div>
            
            {/* BOTONERA INFERIOR */}
            <div className="flex items-center justify-start mt-6 pt-6 border-t border-gray-100">
              <button 
                onClick={limpiarFiltros}
                className="text-[#666666] text-[13px] font-medium hover:text-[#1A3D3D] hover:underline transition-all px-4 py-2"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarraFiltros;