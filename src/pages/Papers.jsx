import React, { useState, useEffect } from 'react';
import { BookOpen, FileDown, User, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Ajustá la ruta a tu firebase.js

// Importá tu barra de filtros (ajustá la ruta según tu proyecto)
import BarraFiltros from '../components/BarraFiltros'; 

export default function Papers() {
  const [papersGlobales, setPapersGlobales] = useState([]);
  const [papersFiltrados, setPapersFiltrados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // === 1. TRAER TODOS LOS PAPERS DE FIREBASE ===
  useEffect(() => {
    const fetchTodosLosPapers = async () => {
      setIsLoading(true);
      try {
        // Buscamos en la colección de profesionales
        const querySnapshot = await getDocs(collection(db, 'profesionales'));
        let todosLosPapers = [];

        // Recorremos cada profesional
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Si el profesional tiene la variable isPro activa y tiene papers
          if (data.isPro && data.papers && data.papers.length > 0) {
            
            // Le agregamos a cada paper la info de su autor para poder mostrarla en la tarjeta global
            const papersDelAutor = data.papers.map(paper => ({
              ...paper,
              autorId: doc.id,
              autorNombre: data.nombre,
              autorFoto: data.foto || null,
              autorEspecialidad: data.especialidad || 'Veterinario'
            }));

            // Los metemos todos en la misma "bolsa" (array)
            todosLosPapers = [...todosLosPapers, ...papersDelAutor];
          }
        });

        // Ordenamos por año (los más nuevos primero)
        todosLosPapers.sort((a, b) => (b.anio || 0) - (a.anio || 0));

        setPapersGlobales(todosLosPapers);
        setPapersFiltrados(todosLosPapers); // Al principio, los filtrados son todos
      } catch (error) {
        console.error("Error al traer los papers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodosLosPapers();
  }, []);


  // === 2. LÓGICA DEL FILTRO ===
  // Esta función se la pasamos a BarraFiltros para que nos avise cuando el usuario busca algo
  const handleFiltroChange = (filtros) => {
    let resultado = [...papersGlobales];

    // Búsqueda por texto (Título, descripción o autor)
    if (filtros.texto) {
      const busqueda = filtros.texto.toLowerCase();
      resultado = resultado.filter(p => 
        (p.titulo && p.titulo.toLowerCase().includes(busqueda)) ||
        (p.desc && p.desc.toLowerCase().includes(busqueda)) ||
        (p.autorNombre && p.autorNombre.toLowerCase().includes(busqueda))
      );
    }

    // Filtro por categoría (usando el nuevo array del JSON)
    if (filtros.categoria && filtros.categoria !== "Todas") {
      resultado = resultado.filter(p => p.categoria === filtros.categoria);
    }

    setPapersFiltrados(resultado);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] antialiased pb-20">
      
      {/* HEADER / HERO (Igual al de Capacitaciones) */}
      <div className="pt-24 pb-10 px-6 md:px-10 max-w-[1300px] mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] uppercase tracking-tighter">
            Investigaciones
          </h1>
          <button className="hidden md:flex items-center gap-2 bg-white border border-gray-200 text-[#1A3D3D] px-5 py-2.5 rounded-full font-bold text-[12px] uppercase tracking-widest shadow-sm hover:border-[#2D6A6A] transition-colors">
            {/* Opcional: un botón para ir a "Mis Guardados" o publicar si el usuario está logueado */}
            Subir Paper
          </button>
        </div>

        {/* INTEGRACIÓN DE LA BARRA DE FILTROS */}
        {/* Asegurate de que tu BarraFiltros acepte config para mostrar solo la búsqueda y las categorías de papers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-3 relative z-20">
          <BarraFiltros 
            onFilterChange={handleFiltroChange} 
            // Acá le pasarías las props que necesite tu BarraFiltros para saber que está en modo "Papers"
            modo="papers" 
          />
        </div>
      </div>

      {/* GRILLA DE RESULTADOS */}
      <div className="px-6 md:px-10 max-w-[1300px] mx-auto relative z-10">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#2D6A6A]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-[12px]">Buscando documentos...</p>
          </div>
        ) : papersFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-gray-100 text-center flex flex-col items-center">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-2">No se encontraron resultados</h3>
            <p className="text-gray-500 font-medium">Probá cambiando los filtros o buscando con otras palabras.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {papersFiltrados.map((paper) => (
              <div key={paper.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all group">
                
                {/* 1. PORTADA */}
                <div className="w-full h-36 bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                  {paper.portada ? (
                    <img src={paper.portada} alt="Portada" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  )}
                  {/* Etiqueta flotante */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-[#2D6A6A] text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    {paper.categoria}
                  </div>
                </div>
                
                {/* 2. CONTENIDO */}
                <div className="p-6 flex flex-col flex-1">
                  
                  {/* Nuevo: Info del Autor */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {paper.autorFoto ? <img src={paper.autorFoto} alt={paper.autorNombre} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-[#1A3D3D] font-bold text-[12px] leading-tight line-clamp-1">{paper.autorNombre}</p>
                      <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">{paper.autorEspecialidad}</p>
                    </div>
                  </div>

                  <h3 className="text-[18px] font-black font-['Montserrat'] text-[#1A3D3D] mb-2 leading-tight group-hover:text-[#2D6A6A] transition-colors line-clamp-2">
                    {paper.titulo}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-500 font-bold text-[12px]">Publicado en {paper.anio}</span>
                  </div>
                  
                  <p className="text-gray-600 text-[14px] leading-relaxed font-medium line-clamp-3 mb-6">
                    {paper.desc}
                  </p>
                  
                  {/* 3. BOTÓN ÚNICO */}
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <a href={paper.pdfUrl} target="_blank" rel="noreferrer" className="w-full bg-white border border-[#2D6A6A]/20 text-[#2D6A6A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2D6A6A] hover:text-white transition-colors text-[11px] uppercase tracking-widest shadow-sm">
                      <FileDown className="w-4 h-4" /> Abrir Documento
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}