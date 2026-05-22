import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Building2, User, Home, 
  ChevronRight, Award, Dog, Filter, UserCheck
} from 'lucide-react';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';

const Directorio = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profesionales');
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. SOLUCIÓN FUENTE: Inyección dinámica de Montserrat
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    // --- DATOS DE PRUEBA (MOCK DATA) ---
    const generarDatosDePrueba = () => {
      const mockData = Array.from({ length: 10 }).map((_, index) => ({
        id: `mock-${index + 1}`,
        nombre: `Profesional ${index + 1} Apellido`,
        planActual: index === 0 || index === 4 || index === 7 ? 'pro' : 'basico',
        foto: '', 
        especialidad: index % 2 === 0 
          ? 'Cirugía Especializada y Traumatología' 
          : 'Veterinario Clínico General',
        provincia: ['Buenos Aires', 'CABA', 'Córdoba', 'Mendoza'][index % 4],
      }));
      
      setVeterinarios(mockData);
      setLoading(false);
    };

    generarDatosDePrueba();

    // --- CÓDIGO FIREBASE ORIGINAL (Descomentar para usar datos reales) ---
    
    const fetchVeterinarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'veterinarios'));
        const vetsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedVets = vetsData.sort((a, b) => (a.planActual === 'pro' ? -1 : 1));
        setVeterinarios(sortedVets);
      } catch (error) {
        console.error("Error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVeterinarios();
    
  }, []);

  return (
    <main className="min-h-screen bg-[#F4F7F7] pb-24 relative flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500">
      
      {/* HEADER COMPACTO */}
      <section className="relative bg-[#1A3D3D] pt-16 pb-16 rounded-b-[40px] md:rounded-b-[60px] shadow-[0_10px_30px_rgba(26,61,61,0.1)] z-10 text-center">
        <div className="absolute top-0 left-10 w-72 h-72 bg-[#4DB6AC]/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center px-4">
          <Search className="w-8 h-8 text-white mb-4" strokeWidth={3} />
          <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-white tracking-tighter leading-none mb-4">
            Directorio Veterinario
          </h1>
          <p className="text-[#F4F7F7] opacity-90 text-[14px] md:text-[16px] font-medium mb-0 max-w-lg mx-auto leading-relaxed">
            Encontrá a los mejores especialistas y centros de alta complejidad para el cuidado de tu mascota.
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

      {/* BARRA DE BÚSQUEDA FLOTANTE UNIFICADA */}
      <div className="max-w-4xl mx-auto w-full relative z-30 -mt-10 px-4">
        <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative">
          
          <div className="grid grid-cols-2 bg-[#F4F7F7] p-1.5 rounded-[20px] w-full md:w-auto shrink-0">
            <button 
              onClick={() => setActiveTab('profesionales')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-all ${
                activeTab === 'profesionales' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="inline">Profesionales</span>
            </button>
            <button 
              onClick={() => setActiveTab('clinicas')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-all ${
                activeTab === 'clinicas' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="inline">Clínicas</span>
            </button>
          </div>
          
          <div className="flex-1 w-full relative flex items-center bg-[#F4F7F7] md:bg-transparent rounded-[20px] md:rounded-none px-4 py-3 md:p-0">
            <Search className="text-[#666666] w-5 h-5 shrink-0" />
            <input 
              type="search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar especialidad o provincia..." 
              className="w-full bg-transparent border-none pl-3 pr-2 py-1 text-[15px] font-medium focus:outline-none focus:ring-0 text-[#333333] placeholder:text-[#666666]/70" 
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`w-full md:w-auto px-6 py-3.5 md:py-3 rounded-[18px] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shrink-0 ${
              showFilters ? 'bg-[#1A3D3D] text-white shadow-md' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>

          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] p-6 border border-gray-100 shadow-2xl z-40 animate-in fade-in slide-in-from-top-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-montserrat font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> Provincia
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe'].map(p => (
                      <span key={p} className="px-3 py-1.5 bg-[#F4F7F7] text-[#666666] text-[12px] font-semibold rounded-xl cursor-pointer hover:bg-gray-200">{p}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-montserrat font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Dog className="w-3.5 h-3.5 text-[#2D6A6A]" /> Categoría
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Pequeños Animales', 'Exóticos', 'Grandes Animales'].map(c => (
                      <span key={c} className="px-3 py-1.5 bg-[#F4F7F7] text-[#666666] text-[12px] font-semibold rounded-xl cursor-pointer hover:bg-gray-200">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-montserrat font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-[#2D6A6A]" /> Modalidad
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-[16px] bg-[#F4F7F7] text-[13px] font-semibold text-[#666666] hover:bg-gray-200 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-[#2D6A6A]" />
                    Atiende a Domicilio
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE LISTADO / GRID DINÁMICA - Reducido el mt para acercarlo al buscador */}
      <div className="grid grid-cols-1 max-w-6xl mx-auto w-full px-4 mt-2 mb-8 relative z-10">
        
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && activeTab === 'profesionales' && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            
            {/* Ajuste de columnas: 2 en móvil, 3 en tablet, 4 en PC */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {veterinarios.length > 0 ? (
                veterinarios.map((vet) => {
                  const nameParts = vet.nombre ? vet.nombre.split(' ') : [''];
                  const firstName = nameParts[0];
                  const lastName = nameParts.slice(1).join(' ');

                  return (
                    <article 
                      key={vet.id} 
                      onClick={() => navigate(`/profesional/${vet.id}`)}
                      className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer group flex flex-col h-full relative"
                    >
                      {/* Badge Pro ubicado absoluto en la esquina superior derecha */}
                      {vet.planActual === 'pro' && (
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-[10px] sm:rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm z-10" title="Profesional Destacado">
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                      )}

                      {/* RENGLÓN 1: Foto y Nombre. En móvil apilados (más larguitos), en PC en fila */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3 mb-3 sm:mb-4 pt-2 sm:pt-0">
                        <img 
                          src={vet.foto || "https://ui-avatars.com/api/?name=" + vet.nombre + "&background=F4F7F7&color=1A3D3D"} 
                          alt={`Dr. ${vet.nombre}`} 
                          className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[14px] sm:rounded-[16px] object-cover shadow-sm border border-gray-50 shrink-0 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="flex-1 min-w-0 w-full px-1 sm:px-0 sm:pr-8">
                          <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[14px] sm:text-[16px] leading-[1.15] mt-1 sm:mt-0">
                            <span className="block truncate">{firstName}</span>
                            {lastName && <span className="block truncate">{lastName}</span>}
                          </h2>
                        </div>
                      </div>

                      {/* RENGLÓN 2: Pill de la especialidad */}
                      <div className="mb-3 sm:mb-4 text-center mt-auto">
                        <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl w-full h-full min-h-[40px] sm:min-h-[44px]">
                          <span className="text-[#2D6A6A] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] leading-[1.3] break-words whitespace-normal line-clamp-3">
                            {vet.especialidad || 'Veterinario Clínico'}
                          </span>
                        </span>
                      </div>

                      {/* CONTENEDOR INFERIOR: Provincia y Botón "Ver perfil" */}
                      <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-50 gap-2 sm:gap-0">
                        <div className="flex items-center gap-1 text-[#666666] font-medium text-[11px] sm:text-[12px] min-w-0 w-full sm:w-auto justify-center sm:justify-start">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{vet.provincia || 'No especificada'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[#9CA3AF] group-hover:text-[#2D6A6A] transition-colors shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Ver perfil</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                    </article>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 bg-white rounded-[24px] border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                  <div className="w-16 h-16 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                    <UserCheck className="w-8 h-8 text-[#2D6A6A]/50" />
                  </div>
                  <h3 className="text-[#1A3D3D] text-[18px] font-bold font-['Montserrat'] mb-2">No encontramos profesionales</h3>
                  <p className="text-[#666666] text-[14px] font-medium mb-6 max-w-sm">Intentá ajustar los filtros o buscar con otros términos para ver más resultados.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Sección Clínicas */}
        {!loading && activeTab === 'clinicas' && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto w-full">
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-8 sm:p-12 text-center max-w-2xl mx-auto transition-all mt-4 w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F4F7F7] rounded-[24px] flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#2D6A6A]/50" />
              </div>
              <h3 className="font-montserrat font-extrabold text-[#1A3D3D] text-[20px] sm:text-[24px] mb-3">
                Red de Clínicas en Construcción
              </h3>
              <p className="font-inter text-[#666666] text-[14px] sm:text-[16px] leading-relaxed mb-8 max-w-lg mx-auto">
                Actualmente nos encontramos auditando y verificando los perfiles institucionales para garantizar que encuentres centros de alta complejidad que cumplan con los más altos estándares.
              </p>
              <button 
                onClick={() => setActiveTab('profesionales')}
                className="bg-white text-[#1A3D3D] border-2 border-gray-100 hover:border-[#2D6A6A] px-6 py-3 rounded-2xl font-bold text-[14px] sm:text-[15px] inline-flex items-center gap-2 transition-all shadow-sm"
              >
                Volver a Profesionales
              </button>
            </div>
          </section>
        )}

      </div>
    </main>
  );
};

export default Directorio;