import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Home, 
  ChevronRight, Award, Dog, Filter, 
  Heart, Stethoscope,
} from 'lucide-react';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';
const HuellaPremium = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 8c1.38 0 2.5-1.57 2.5-3.5S9.88 1 8.5 1 6 2.57 6 4.5 7.12 8 8.5 8zM15.5 8c1.38 0 2.5-1.57 2.5-3.5S16.88 1 15.5 1 13 2.57 13 4.5 14.12 8 15.5 8zM3.5 12C4.88 12 6 10.43 6 8.5S4.88 5 3.5 5 1 6.57 1 8.5 2.12 12 3.5 12zM20.5 12c1.38 0 2.5-1.57 2.5-3.5S21.88 5 20.5 5 18 6.57 18 8.5 19.12 12 20.5 12zM12 10.5c-3.5 0-6 2-6 4.5 0 1.5 1.5 3.5 3.5 4.5 1.5.7 2.5.5 2.5.5s1 .2 2.5-.5c2-1 3.5-3 3.5-4.5 0-2.5-2.5-4.5-6-4.5z"/>
  </svg>
);

const Directorio = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profesionales');
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const generarDatosDePrueba = () => {
      const mockData = Array.from({ length: 10 }).map((_, index) => ({
        id: `mock-${index + 1}`,
        nombre: `Profesional ${index + 1} Apellido`,
        planActual: index === 0 || index === 4 || index === 7 ? 'pro' : 'basico',
        foto: '', // Dejamos vacío para forzar el nuevo avatar fallback
        especialidad: index % 2 === 0 
          ? 'Cirugía especializada' 
          : 'Veterinario clínico general',
        provincia: ['Buenos Aires', 'CABA', 'Córdoba', 'Mendoza'][index % 4],
      }));
      
      setVeterinarios(mockData);
      setLoading(false);
    };

    generarDatosDePrueba();
  }, []);

  const toggleFavorito = (e, id) => {
    e.stopPropagation(); 
    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-[#F9F5F0] pb-24 relative flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500">
      
      {/* HEADER B2C CON PATRÓN DE MARCA DE AGUA */}
      <section className="relative bg-[#1A3D3D] pt-16 pb-16 rounded-b-[40px] md:rounded-b-[60px] shadow-[0_10px_30px_rgba(26,61,61,0.1)] z-10 text-center overflow-hidden">
        
    
     {/* Patrón de huellas nativo SVG (Intercalado perfecto y diseño Premium) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="huellitas" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
            {/* Huella 1 (Base) */}
            <path fill="white" transform="scale(1.5)" d="M8.5 8c1.38 0 2.5-1.57 2.5-3.5S9.88 1 8.5 1 6 2.57 6 4.5 7.12 8 8.5 8zM15.5 8c1.38 0 2.5-1.57 2.5-3.5S16.88 1 15.5 1 13 2.57 13 4.5 14.12 8 15.5 8zM3.5 12C4.88 12 6 10.43 6 8.5S4.88 5 3.5 5 1 6.57 1 8.5 2.12 12 3.5 12zM20.5 12c1.38 0 2.5-1.57 2.5-3.5S21.88 5 20.5 5 18 6.57 18 8.5 19.12 12 20.5 12zM12 10.5c-3.5 0-6 2-6 4.5 0 1.5 1.5 3.5 3.5 4.5 1.5.7 2.5.5 2.5.5s1 .2 2.5-.5c2-1 3.5-3 3.5-4.5 0-2.5-2.5-4.5-6-4.5z" />
            {/* Huella 2 (Intercalada en el centro) */}
            <path fill="white" transform="translate(40, 40) scale(1.5)" d="M8.5 8c1.38 0 2.5-1.57 2.5-3.5S9.88 1 8.5 1 6 2.57 6 4.5 7.12 8 8.5 8zM15.5 8c1.38 0 2.5-1.57 2.5-3.5S16.88 1 15.5 1 13 2.57 13 4.5 14.12 8 15.5 8zM3.5 12C4.88 12 6 10.43 6 8.5S4.88 5 3.5 5 1 6.57 1 8.5 2.12 12 3.5 12zM20.5 12c1.38 0 2.5-1.57 2.5-3.5S21.88 5 20.5 5 18 6.57 18 8.5 19.12 12 20.5 12zM12 10.5c-3.5 0-6 2-6 4.5 0 1.5 1.5 3.5 3.5 4.5 1.5.7 2.5.5 2.5.5s1 .2 2.5-.5c2-1 3.5-3 3.5-4.5 0-2.5-2.5-4.5-6-4.5z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#huellitas)" />
      </svg>
        <div className="absolute top-0 left-10 w-72 h-72 bg-[#4DB6AC]/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center px-4">
          <Heart className="w-8 h-8 text-[#df803b] mb-4" strokeWidth={2.5} />
          <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-white tracking-tighter leading-none mb-4">
            Encontrá tu veterinaria ideal
          </h1>
          <p className="text-[#F4F7F7] opacity-90 text-[14px] md:text-[16px] font-medium mb-0 max-w-lg mx-auto leading-relaxed">
            Buscá por especialidad, cercanía o modalidad y conectá con quienes más saben de su bienestar.
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

      {/* BARRA DE BÚSQUEDA */}
      <div className="max-w-4xl mx-auto w-full relative z-30 -mt-10 px-4">
        <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative">
          
          <div className="grid grid-cols-2 bg-[#F4F7F7] p-1.5 rounded-[20px] w-full md:w-auto shrink-0">
            <button 
              onClick={() => setActiveTab('profesionales')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-2xl text-[12px] sm:text-[13px] font-bold transition-all ${
                activeTab === 'profesionales' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="inline">Veterinarios</span>
            </button>
            <button 
              onClick={() => setActiveTab('clinicas')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-2xl text-[12px] sm:text-[13px] font-bold transition-all ${
                activeTab === 'clinicas' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="inline">Veterinarias</span>
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
                    <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> Zona
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe'].map(p => (
                      <span key={p} className="px-3 py-1.5 bg-[#F4F7F7] text-[#666666] text-[12px] font-semibold rounded-xl cursor-pointer hover:bg-gray-200">{p}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-montserrat font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <HuellaPremiumPrint className="w-3.5 h-3.5 text-[#2D6A6A]" /> Mascotas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Perros y Gatos', 'Exóticos', 'Grandes Animales'].map(c => (
                      <span key={c} className="px-3 py-1.5 bg-[#F4F7F7] text-[#666666] text-[12px] font-semibold rounded-xl cursor-pointer hover:bg-gray-200">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-montserrat font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-[#2D6A6A]" /> Comodidad
                  </h3>
                  {/* Etiqueta Cálida Naranja para B2C */}
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-[16px] bg-[#FFF5EE] border border-[#FFE4D6] text-[13px] font-bold text-[#df803b] hover:bg-[#FFE4D6]/50 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-[#df803b]" />
                    ¡Va a tu casa!
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 max-w-6xl mx-auto w-full px-4 mt-2 mb-8 relative z-10">
        
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && activeTab === 'profesionales' && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {veterinarios.length > 0 ? (
                veterinarios.map((vet) => {
                  const nameParts = vet.nombre ? vet.nombre.split(' ') : [''];
                  const firstName = nameParts[0];
                  const lastName = nameParts.slice(1).join(' ');
                  const isFav = favoritos.includes(vet.id);

                  return (
                    <article 
                      key={vet.id} 
                      onClick={() => navigate(`/profesional/${vet.id}`)}
                      className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer group flex flex-col h-full relative"
                    >
                      {vet.planActual === 'pro' && (
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-[10px] sm:rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm z-10" title="Especialista Recomendado">
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3 mb-3 sm:mb-4 pt-2 sm:pt-0 relative">
                        
                        <div className="relative shrink-0">
                          {/* AVATAR PREMIUM FALLBACK */}
                          {vet.foto ? (
                            <img 
                              src={vet.foto} 
                              alt={`Dr. ${vet.nombre}`} 
                              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[14px] sm:rounded-[16px] object-cover shadow-sm border border-gray-50 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[14px] sm:rounded-[16px] bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                              <HuellaPremium className="w-6 h-6 sm:w-7 sm:h-7 opacity-80" />
                            </div>
                          )}

                          <button 
                            onClick={(e) => toggleFavorito(e, vet.id)}
                            className="absolute -top-2 -left-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-full transition-transform hover:scale-110 z-20"
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-[#df803b] text-[#df803b]' : 'text-gray-300'}`} />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0 w-full px-1 sm:px-0 sm:pr-8">
                          <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[14px] sm:text-[16px] leading-[1.15] mt-1 sm:mt-0">
                            <span className="block truncate">{firstName}</span>
                            {lastName && <span className="block truncate">{lastName}</span>}
                          </h2>
                        </div>
                      </div>

                      <div className="mb-3 sm:mb-4 text-center mt-auto">
                        <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-3 py-2 rounded-xl w-full h-full min-h-[40px] sm:min-h-[44px]">
                          <span className="text-[#2D6A6A] text-[11px] sm:text-[12px] font-bold leading-[1.3] break-words whitespace-normal line-clamp-2">
                            {vet.especialidad || 'Veterinario clínico'}
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-50 gap-2 sm:gap-0">
                        <div className="flex items-center gap-1 text-[#666666] font-medium text-[11px] sm:text-[12px] min-w-0 w-full sm:w-auto justify-center sm:justify-start">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{vet.provincia || 'No especificada'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[#9CA3AF] group-hover:text-[#2D6A6A] transition-colors shrink-0">
                          <span className="text-[11px] font-bold hidden sm:inline-block">Ver perfil</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                    </article>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16 bg-white rounded-[32px] border border-gray-100 flex flex-col items-center justify-center shadow-sm px-4">
                  <div className="w-20 h-20 bg-[#FFF5EE] rounded-[24px] flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-[#df803b]/70" />
                  </div>
                  <h3 className="text-[#1A3D3D] text-[20px] font-bold font-['Montserrat'] mb-2">¡Uy! No encontramos a nadie por acá</h3>
                  <p className="text-[#666666] text-[15px] font-medium mb-8 max-w-sm leading-relaxed">
                    Probá quitando algunos filtros o buscando en una zona cercana para ver más opciones.
                  </p>
                  <button 
                    onClick={() => { setSearchTerm(''); setFilters({}); }} 
                    className="bg-[#2D6A6A] text-white font-bold text-[13px] px-8 py-3.5 rounded-2xl hover:bg-[#1A3D3D] hover:-translate-y-1 transition-all shadow-md"
                  >
                    Ver todos los veterinarios
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {!loading && activeTab === 'clinicas' && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto w-full">
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 sm:p-16 text-center max-w-2xl mx-auto transition-all mt-4 w-full shadow-sm">
              <div className="w-20 h-20 bg-[#F4F7F7] rounded-[24px] flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-[#2D6A6A]/50" />
              </div>
              <h3 className="font-montserrat font-black text-[#1A3D3D] text-[22px] sm:text-[28px] mb-4">
                ¡Estamos sumando las mejores veterinarias!
              </h3>
              <p className="font-inter text-[#666666] text-[15px] sm:text-[16px] leading-relaxed mb-8 max-w-lg mx-auto">
                Queremos asegurarnos de recomendarte solo lugares de confianza para tu mascota. Muy pronto vas a poder ver el listado completo de centros de atención en tu zona.
              </p>
              <button 
                onClick={() => setActiveTab('profesionales')}
                className="bg-[#F4F7F7] text-[#1A3D3D] border border-gray-200 hover:border-[#2D6A6A] px-8 py-3.5 rounded-2xl font-bold text-[14px] sm:text-[15px] inline-flex items-center gap-2 transition-all shadow-sm"
              >
                Volver a Veterinarios
              </button>
            </div>
          </section>
        )}

      </div>
    </main>
  );
};

export default Directorio;