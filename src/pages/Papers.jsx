import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { BookOpen, FileDown, User, Loader2, ChevronDown, ChevronUp, GraduationCap, BookMarked } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 

import BarraFiltros from '../components/BarraFiltros'; 

export default function Papers() {
  const navigate = useNavigate();
  const [papersGlobales, setPapersGlobales] = useState([]);
  const [papersFiltrados, setPapersFiltrados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInfoBox, setShowInfoBox] = useState(true);
  const [aniosDisponibles, setAniosDisponibles] = useState([]); // NUEVO: Lista dinámica de años // NUEVO: Controla el cartelito superior
const [currentPage, setCurrentPage] = useState(1);
  const papersPerPage = 50;
  const limpiarFiltros = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams()); // Borra toda la URL dejándola limpia
  };

// Función auxiliar para quitar acentos y pasar a minúsculas (Mejora la búsqueda)
  const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // === 1. TRAER TODOS LOS PAPERS ===
  useEffect(() => {
    const fetchTodosLosPapers = async () => {
      setIsLoading(true);
      try {
        // NUEVO: Consulta directa, plana y veloz a la colección raíz
        const querySnapshot = await getDocs(collection(db, 'papers'));
        let todosLosPapers = [];

        querySnapshot.forEach((doc) => {
          todosLosPapers.push({ id: doc.id, ...doc.data() });
        });

        todosLosPapers.sort((a, b) => (b.anio || 0) - (a.anio || 0));

        // NUEVO: Extracción de años 100% segura
        const aniosUnicos = [...new Set(todosLosPapers.map(p => String(p.anio)).filter(a => a !== 'undefined' && a !== 'null'))];
        aniosUnicos.sort((a, b) => Number(b) - Number(a)); // Ordenar de más nuevo a más viejo
        setAniosDisponibles(aniosUnicos);

        setPapersGlobales(todosLosPapers);
        setPapersFiltrados(todosLosPapers);
      } catch (error) {
        console.error("Error al traer los papers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTodosLosPapers();
  }, []);

  // === 2. LÓGICA DEL FILTRO MEJORADA ===
  useEffect(() => {
    let resultado = [...papersGlobales];

    // Búsqueda Libre Inteligente (Incluye categoría y perdona acentos)
    if (searchTerm) {
      const busqueda = normalizarTexto(searchTerm);
      resultado = resultado.filter(p => 
        normalizarTexto(p.titulo).includes(busqueda) ||
        normalizarTexto(p.desc).includes(busqueda) ||
        normalizarTexto(p.autorNombre).includes(busqueda) ||
        normalizarTexto(p.categoria).includes(busqueda) ||
        normalizarTexto(p.autorEspecialidad).includes(busqueda)
      );
    }

    const especialidadesParams = searchParams.get('especialidades');
    if (especialidadesParams) {
      const especialidadesArray = especialidadesParams.split(',');
      resultado = resultado.filter(p => especialidadesArray.includes(p.autorEspecialidad));
    }

    const categoriasParams = searchParams.get('categorias_papers');
    if (categoriasParams) {
      const categoriasArray = categoriasParams.split(',');
      resultado = resultado.filter(p => categoriasArray.includes(p.categoria));
    }

    const aniosParams = searchParams.get('anios');
    if (aniosParams) {
      const aniosArray = aniosParams.split(',');
      resultado = resultado.filter(p => aniosArray.includes(String(p.anio)));
    }

    setPapersFiltrados(resultado);
    setCurrentPage(1);
  }, [searchTerm, searchParams, papersGlobales]);
  // NUEVO: Paleta de colores sobria basada en tu marca
  const getColorCategoria = (categoria) => {
    const colores = {
      "Cirugía": "bg-[#2D6A6A]/10 text-[#2D6A6A]", // Teal base
      "Clínica Médica": "bg-[#1A3D3D]/10 text-[#1A3D3D]", // Teal oscuro
      "Nutrición": "bg-emerald-600/10 text-emerald-700", // Esmeralda suave
      "Comportamiento": "bg-slate-500/10 text-slate-700", // Pizarra/Gris
      "Farmacología": "bg-cyan-700/10 text-cyan-800", // Cian oscuro
      "Reporte de Casos": "bg-[#4DB6AC]/20 text-[#1A3D3D]", // Teal clarito
      "Diagnóstico por Imágenes": "bg-indigo-900/10 text-indigo-900" // Azul muy oscuro/noche
    };
    return colores[categoria] || "bg-gray-100 text-gray-600";
  };

      // === MATEMÁTICA DE LA PAGINACIÓN ===
  const indexOfLastPaper = currentPage * papersPerPage;
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
  const currentPapers = papersFiltrados.slice(indexOfFirstPaper, indexOfLastPaper);
  const totalPages = Math.ceil(papersFiltrados.length / papersPerPage);

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] antialiased pb-20 relative overflow-x-hidden animate-in fade-in duration-500 z-10">
       {/* CARTELITO FLOTANTE RESPONSIVE */}
      {showInfoBox && (
        <div className="relative mt-0 p-4 md:fixed md:top-24 md:right-8 w-full md:w-[280px] bg-white border-b md:border border-[#2D6A6A]/20 md:p-5 md:rounded-2xl shadow-sm md:shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 md:slide-in-from-right-8">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[#2D6A6A] font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
              <BookMarked className="w-3.5 h-3.5" /> Comunidad Veterinaria
            </h4>
            <button onClick={() => setShowInfoBox(false)} className="md:hidden text-gray-400 hover:text-gray-600 font-bold p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <p className="text-gray-500 text-[12px] font-medium leading-tight md:leading-relaxed mb-3 md:mb-4">
            Compartí tus investigaciones subiéndolas desde el editor a tu perfil.
          </p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => navigate('/editor-profesional', { state: { tab: 'papers' } })}
              className="w-full bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] transition-colors py-2 md:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
              Agregar Documento
            </button>
            <button 
              onClick={() => setShowInfoBox(false)}
              className="hidden md:block w-full bg-[#F4F7F7] text-[#1A3D3D] hover:bg-gray-200 transition-colors py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* BURBUJAS DE FONDO TIPO "MESH GRADIENT" MÁS POTENTES */}
      <div className="absolute top-0 md:top-[-5%] left-[-10%] md:left-[-5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#4DB6AC]/40 md:bg-[#4DB6AC]/25 rounded-full blur-[70px] md:blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[10%] md:top-[5%] right-[-10%] md:right-[-5%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-[#2D6A6A]/30 md:bg-[#2D6A6A]/15 rounded-full blur-[80px] md:blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-0 md:top-[-5%] left-[50%] -translate-x-1/2 w-[100vw] md:w-[800px] h-[300px] md:h-[600px] bg-white/50 md:bg-white/70 rounded-full blur-[60px] md:blur-[120px] pointer-events-none z-0"></div>

      {/* HEADER / HERO */}
      <div className="pt-8 md:pt-14 pb-6 md:pb-10 px-4 md:px-10 max-w-[1300px] mx-auto flex flex-col items-center text-center relative z-[60] transition-all">
        <BookMarked className="w-10 h-10 text-[#1A3D3D] mb-6 relative z-10" />

        <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter leading-none mb-4">
          Publicaciones Científicas
        </h1>
        
        <p className="text-[#666666] text-[14px] md:text-[16px] font-medium mb-8 max-w-lg mx-auto leading-relaxed">
          Descubrí publicaciones, papers científicos y reportes de casos para mantenerte informado sobre la medicina veterinaria.
        </p>

        {/* INTEGRACIÓN DE LA BARRA DE FILTROS */}
        <div className="w-full mt-2">
          <BarraFiltros 
            modo="papers" 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Buscar por título, autor o palabra clave..."
            aniosDisponibles={aniosDisponibles} /* <-- NUEVO: Pasamos los años reales a la barra */
          />
        </div>

      </div>

      {/* GRILLA DE RESULTADOS */}
      <div className="px-6 md:px-10 max-w-[1300px] mx-auto relative z-10 mt-4 md:mt-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#2D6A6A]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-[12px]">Buscando documentos...</p>
          </div>
        ) : papersFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
              <BookOpen className="w-8 h-8 text-[#2D6A6A]/50" />
            </div>
            <h3 className="text-[#1A3D3D] text-[18px] font-bold font-['Montserrat'] mb-2">No encontramos documentos</h3>
            <p className="text-[#666666] text-[14px] font-medium mb-6 max-w-sm">Intentá ajustar los filtros o buscar con otros términos para ver más resultados.</p>
            <button onClick={limpiarFiltros} className="bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">
              Limpiar todos los filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Usamos currentPapers en vez de papersFiltrados */}
              {currentPapers.map((paper) => (
                <div 
                  key={paper.id} 
                  onClick={() => setExpandedId(expandedId === paper.id ? null : paper.id)}
                  className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                >
                  {/* 1. PORTADA */}
                  <div className="w-full h-36 bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                    {paper.portada ? (
                      <img src={paper.portada} alt="Portada" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <BookOpen className="w-10 h-10 text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
                    <div className={`absolute top-4 left-4 ${getColorCategoria(paper.categoria)} text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm backdrop-blur-md bg-white/90`}>
                      {paper.categoria}
                    </div>
                  </div>
                  
                  {/* 2. CONTENIDO */}
                  <div className="p-4 md:p-6 flex flex-col flex-1">
                    <h3 className="text-[16px] md:text-[18px] font-black font-['Montserrat'] text-[#1A3D3D] mb-3 md:mb-4 leading-tight group-hover:text-[#2D6A6A] transition-colors">
                      {paper.titulo}
                    </h3>
                    
                    <div 
                      onClick={(e) => { e.stopPropagation(); navigate(`/perfil/${paper.autorId}`); }}
                      className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50 hover:bg-gray-50/50 p-2 -ml-2 rounded-xl transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                        {paper.autorFoto ? <img src={paper.autorFoto} alt={paper.autorNombre} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-[#1A3D3D] font-bold text-[13px] leading-tight hover:text-[#4DB6AC] transition-colors">{paper.autorNombre}</p>
                        <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">{paper.autorEspecialidad}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Publicado en {paper.anio}</span>
                    </div>
                    
                    <div className="relative">
                      <p className={`text-gray-600 text-[14px] leading-relaxed font-medium transition-all duration-500 ${expandedId === paper.id ? '' : 'line-clamp-3'}`}>
                        {paper.desc && paper.desc.length > 50 ? paper.desc : "Sin descripción ampliada disponible."}
                      </p>
                      {paper.desc && paper.desc.length > 120 && (
                        <div className="flex justify-end mt-2">
                          <span className="text-[#4DB6AC] font-bold text-[11px] uppercase tracking-widest flex items-center gap-1">
                            {expandedId === paper.id ? 'Ver menos' : 'Leer más'} 
                            {expandedId === paper.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 3. BOTÓN PDF */}
                    <div className="mt-6 pt-4 border-t border-gray-50">
                      <a 
                        href={`https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`}
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white border border-[#2D6A6A]/20 text-[#2D6A6A] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2D6A6A] hover:text-white transition-colors text-[11px] uppercase tracking-widest shadow-sm"
                      >
                        <FileDown className="w-4 h-4" /> Abrir Documento PDF
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 mb-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-[#1A3D3D] disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Anterior
                </button>
                <span className="text-sm font-bold text-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-[#1A3D3D] disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}