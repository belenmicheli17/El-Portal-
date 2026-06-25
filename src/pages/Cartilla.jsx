import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, Home, 
  ChevronRight, Award, Dog, Cat, Filter, 
  Heart, Stethoscope, Layers, ChevronDown,
  Bird, Rabbit, PawPrint, Hospital, TreeDeciduous 
} from 'lucide-react';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import BarraFiltros from '../components/BarraFiltros';
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


  useEffect(() => {
    // Incorporación de la familia de fuentes Inter para UI consistente
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Hacemos la consulta real a la colección 'profesionales'
        const querySnapshot = await getDocs(collection(db, 'profesionales'));
        const profesionalesData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // "Traducimos" los datos de Firebase para que la Cartilla los entienda perfecto
          profesionalesData.push({
            ...data,
            id: data.slug || doc.id,
            tipo: data.tipo || 'profesional', // Forzamos el tipo para que la ruta sea /profesional/:slug
            domicilio: data.atiendeDomicilio || false, // Emparejamos con el nombre que usa tu filtro
            // Extraemos solo el título de los servicios para las etiquetas de la tarjeta
            servicios: data.servicios ? data.servicios.map(s => s.titulo) : []
          });
        });

        // Mantenemos tu excelente función para mezclar aleatoriamente
        const shuffleArray = (array) => {
          let shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };
        
        // Mantenemos la lógica de mostrar primero a los Pro
        const premium = shuffleArray(profesionalesData.filter(d => d.planActual === 'pro'));
        const free = shuffleArray(profesionalesData.filter(d => d.planActual !== 'pro'));
        
        setVeterinarios([...premium, ...free]);
      } catch (error) {
        console.error("Error cargando la cartilla desde Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  

  // 1. Estado para guardar filtros en la URL
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key) => searchParams.get(key) ? searchParams.get(key).split(',') : [];

  const filtros = {
    zonas: getParam('zonas'),
    mascotas: getParam('mascotas'),
    especialidades: getParam('especialidades'),
    domicilio: searchParams.get('domicilio') === 'true',
    guardia24hs: searchParams.get('guardia24hs') === 'true'
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
        <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[#FF9800]/15 rounded-full blur-[150px] pointer-events-none z-0"></div> 
      <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-[#4DB6AC]/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* HEADER B2C - Espaciado Superior/Inferior Reducido */}
      <section className="relative pt-9 pb-2 z-10 text-center">
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center px-4">
          
          <div className="flex items-center gap-3 mb-5">
            <Dog className="w-10 h-10 text-[#FF9800]" strokeWidth={2.5} />
            <Heart className="w-9 h-9 text-[#FF9800]" strokeWidth={2.5} />
            <Cat className="w-10 h-10 text-[#FF9800]" strokeWidth={2.5} />
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

  {/* BARRA DE BÚSQUEDA GLOBAL COMPONENTIZADA */}
      <BarraFiltros 
        tabs={[
          { id: 'todos', label: 'Todos', icon: Layers },
          { id: 'especialistas', label: 'Especialistas', icon: Stethoscope },
          { id: 'clinicas', label: 'Clínicas', icon: Hospital }
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchPlaceholder="Ej: Dermatólogo, San Isidro, Vacunación..."
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showModalidad={true}
      />
      
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
                    // En móvil la hacemos compacta (min-h-[170px]), en PC mantiene su tamaño normal (sm:min-h-[220px])
                    // AUMENTAMOS EL MARGEN SUPERIOR EN MÓVIL (mt-6) PARA QUE LOS BADGES NO SE PISEN
                    className={`bg-white rounded-[24px] p-4 sm:p-5 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer group flex flex-col h-full min-h-[170px] sm:min-h-[220px] relative mt-6 sm:mt-4 z-20 ${isProfesional ? 'text-center' : ''}`}
                  >
                   {/* BADGES FLOTANTES */}
                    {isProfesional ? (
                      <div className="absolute -top-4 right-4 flex items-center z-30">
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
                      /* --- DISEÑO VERTICAL PARA PROFESIONALES --- */
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
                        
                        {/* SE QUITÓ EL mt-auto PARA ELIMINAR EL HUECO EN EL MEDIO DE LA TARJETA */}
                        <div className="mb-2">
                          <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-3 py-2 rounded-xl w-full">
                            <span className="text-[#2D6A6A] text-[11px] sm:text-[12px] font-semibold leading-[1.3] truncate">
                              {item.especialidad}
                            </span>
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                          <div className="flex items-center gap-1 text-[#666666] font-medium text-[11px] sm:text-[12px] min-w-0 max-w-[70%]">
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
                      /* --- DISEÑO HORIZONTAL PARA CLÍNICAS --- */
                      <>
                        <div className="flex items-center gap-3 sm:gap-4 mb-1">
                          <div className="relative shrink-0">
                            {item.foto ? (
                              <img src={item.foto} alt={item.nombre} className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-[14px] sm:rounded-[16px] object-cover shadow-sm border border-gray-50" />
                            ) : (
                              <div className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-[14px] sm:rounded-[16px] bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm">
                                <Hospital className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[13px] sm:text-[15px] leading-[1.2] line-clamp-2">
                              <span className="block truncate">{firstName}</span>
                              {lastName && <span className="block truncate">{lastName}</span>}
                            </h2>
                          </div>
                        </div>

                        {/* DIRECCIÓN VERSIÓN PC */}
                        <div className="hidden sm:flex mb-3 items-center gap-1.5 text-[#666666]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <p className="text-[12px] font-medium truncate">
                            {item.direccion ? (
                              <>
                                {item.direccion.split(',')[0]}, <span className="font-bold text-[#1A3D3D]">{item.direccion.split(',')[1]}</span>
                              </>
                            ) : (
                              <>Av. San Martín 1234, <span className="font-bold text-[#1A3D3D]">{item.provincia}</span></>
                            )}
                          </p>
                        </div>

                        {/* SERVICIOS VERSIÓN MÓVIL (Línea dinámica y optimizada) */}
                        <div className="flex sm:hidden mb-2 mt-1 w-full">
                          {/* Usamos flex-nowrap y overflow-hidden para forzar 1 sola línea */}
                          <div className="flex items-center gap-1.5 flex-nowrap w-full overflow-hidden">
                            
                            {/* Aumentamos a 4 servicios visibles. Con 'truncate min-w-0' se ajustan inteligentemente */}
                            {item.servicios?.slice(0, 4).map((srv, i) => (
                              <span key={i} className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[10px] font-medium border border-gray-100 truncate min-w-0">
                                {srv}
                              </span>
                            ))}
                            
                            {/* El contador se ajusta a + lo que sobre */}
                            {item.servicios?.length > 4 && (
                              <span className="bg-gray-50 text-gray-400 px-1.5 py-1 rounded-[8px] text-[10px] font-medium shrink-0">
                                +{item.servicios.length - 4}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* SERVICIOS VERSIÓN PC (Multilínea hasta 6) */}
                        <div className="hidden sm:flex mb-3 mt-auto">
                          <div className="flex flex-wrap gap-1.5">
                            {item.servicios?.slice(0, 6).map((srv, i) => (
                              <span key={i} className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[12px] font-medium border border-gray-100">
                                {srv}
                              </span>
                            ))}
                            {item.servicios?.length > 6 && (
                              <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-[8px] text-[12px] font-medium">
                                +{item.servicios.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* FOOTER: DIRECCIÓN (Solo en Móvil) + VER PERFIL */}
                        <div className="flex items-center justify-between sm:justify-end pt-2.5 border-t border-gray-50 mt-auto">
                          
                          {/* DIRECCIÓN VERSIÓN MÓVIL */}
                          <div className="flex sm:hidden items-center gap-1 text-[#666666] text-[11px] min-w-0 max-w-[70%]">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {item.direccion ? (
                                <>
                                  {item.direccion.split(',')[0]}, <span className="font-bold text-[#1A3D3D]">{item.direccion.split(',')[1]}</span>
                                </>
                              ) : (
                                <>San Martín 1234, <span className="font-bold text-[#1A3D3D]">{item.provincia}</span></>
                              )}
                            </span>
                          </div>

                          {/* BOTÓN VER PERFIL */}
                          <div className="flex items-center gap-0.5 text-[#9CA3AF] group-hover:text-[#2D6A6A] transition-colors shrink-0">
                            <span className="text-[12px] font-medium hidden sm:inline-block">Ver perfil</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                );
              };

            return (
                <>
                 {/* VISTA 1: TODOS */}
                  {activeTab === 'todos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 pt-0 mt-0">
                      <div className="lg:col-span-2 flex flex-col gap-0">
                        <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] px-2 leading-none">Clínicas Cercanas</h3>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:gap-y-8 mt-3">
                          {veterinariosFiltrados.filter(v => v.tipo === 'clinica').slice(0, 4).map(renderCard)}
                        </div>
                      </div>
                      <div className="lg:col-span-3 flex flex-col gap-0">
                        <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] px-2 leading-none">Especialistas</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-3 sm:gap-y-8 mt-3">
                          {veterinariosFiltrados.filter(v => v.tipo === 'profesional').slice(0, 9).map(renderCard)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA 2: ESPECIALISTAS */}
                  {activeTab === 'especialistas' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-3 sm:gap-x-4 gap-y-3 sm:gap-y-8 pt-0 mt-0">
                      {veterinariosFiltrados.filter(v => v.tipo === 'profesional').map(renderCard)}
                    </div>
                  )}

                  {/* VISTA 3: CLÍNICAS */}
                  {activeTab === 'clinicas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-8 pt-0 mt-0">
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