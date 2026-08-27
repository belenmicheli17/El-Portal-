import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// IMPORTS DE FIREBASE (Siempre arriba de todo)
import { db } from '../firebase.js'; 
import { collection, getDocs } from 'firebase/firestore';


import { 
  Search, Filter, MapPin, Phone, Mail, Globe, Star, ShieldCheck, 
  Truck, Package, ChevronLeft, ChevronRight, CheckCircle2, Heart, 
  Plus, Building2, Wrench, Clock, UploadCloud
} from 'lucide-react';

const CATEGORIAS_PROVEEDORES = [
  "Equipamiento Quirúrgico", 
  "Insumos Descartables", 
  "Farmacéutica", 
  "Diagnóstico por Imágenes", 
  "Software y Gestión",
  "Nutrición Clínica"
];

export default function CartillaProveedores() {
  const navigate = useNavigate();
  const [view, setView] = useState('grid');
  
  // ESTADOS PARA FIREBASE
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // EFECTO PARA TRAER DATOS DE LA BASE
  // Leemos todos los proveedores pero solo usamos el campo productoDestacado de cada uno
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'proveedores'));
        const data = querySnapshot.docs
          .map(doc => {
            const d = doc.data();
            // Solo procesamos proveedores que tienen un producto destacado cargado
            if (!d.productoDestacado) return null;
            return {
              id: doc.id,
              // Datos del proveedor (para la firma en la tarjeta)
              proveedorNombre: d.nombre || '',
              proveedorLogo: d.logo || '',
              proveedorSlug: d.slug || doc.id,
              proveedorCategoria: d.categoria || '',
              // Zona de cobertura del proveedor (para el filtro de provincias)
              zonaCobertura: d.zonaCobertura || [],
              // Datos del producto destacado
              ...d.productoDestacado,
            };
          })
          .filter(Boolean) // Eliminamos los que no tienen producto destacado
          .slice(0, 30);   // Máximo 30 productos en la grilla
        setProveedores(data);
      } catch (error) {
        console.error("Error trayendo proveedores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProveedores();
  }, []);

    const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoritos, setFavoritos] = useState([]);
  const [visibleProviders, setVisibleProviders] = useState(6);

  // ... acá sigue todo tu código con los useEffect de favoritos y las funciones ...

  useEffect(() => {
    const favsGuardados = localStorage.getItem('el_portal_proveedores_favs');
    if (favsGuardados) {
      setFavoritos(JSON.parse(favsGuardados));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('el_portal_proveedores_favs', JSON.stringify(favoritos));
  }, [favoritos]);

  const handleCategoryFilter = (cat) => {
    setFiltroCategoria(cat);
    setVisibleProviders(6);
  };

  const toggleFavorito = (e, id) => {
    e.stopPropagation();
    if (favoritos.includes(id)) {
      setFavoritos(favoritos.filter(favId => favId !== id));
    } else {
      setFavoritos([...favoritos, id]);
    }
  };

  const handleProviderClick = (proveedor) => {
    // Usamos el slug del proveedor (no del producto) para navegar al perfil
    navigate(`/proveedor/${proveedor.proveedorSlug || proveedor.id}`);
    window.scrollTo(0, 0);
  };

const [soloEnvios, setSoloEnvios] = useState(false);
const [soloFavoritos, setSoloFavoritos] = useState(false);
const [filtroProvincia, setFiltroProvincia] = useState(null);

const PROVINCIAS_ARG = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
];

  // 2. Modificá la constante proveedoresFiltrados (cerca de la línea 80) para que quede así:
  const proveedoresFiltrados = proveedores.filter(prov => {
    const matchCategoria = !filtroCategoria || prov.categoria === filtroCategoria;
    // Buscamos por título del producto o nombre del proveedor
    const matchBusqueda = !searchTerm ||
      prov.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prov.proveedorNombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEnvio = !soloEnvios || prov.envios === true;
    // Filtra solo los productos que el usuario guardó como favoritos
    const matchFavorito = !soloFavoritos || favoritos.includes(`prov-${prov.id}`);
    // Filtra por provincia: busca dentro del array zonaCobertura del proveedor
    const matchProvincia = !filtroProvincia || (Array.isArray(prov.zonaCobertura) && prov.zonaCobertura.includes(filtroProvincia));
    return matchCategoria && matchBusqueda && matchEnvio && matchFavorito && matchProvincia;
  });

  const proveedoresMostrados = proveedoresFiltrados.slice(0, visibleProviders);

  // =========================================================================
  // RENDERIZADOS PARCIALES
  // =========================================================================

  const renderFiltros = () => (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-sm sticky top-[100px] animate-in slide-in-from-left-4 duration-500">
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-5 flex items-center gap-2 border-b border-gray-50 pb-2">
        <Filter className="w-3.5 h-3.5 text-[#2D6A6A]" /> Rubros
      </h3>
      <ul className="space-y-3.5 mb-8">
        <li onClick={() => handleCategoryFilter(null)} className={`text-[13px] font-black font-['Montserrat'] tracking-tight cursor-pointer transition-colors ${!filtroCategoria ? 'text-[#2D6A6A]' : 'text-gray-300 hover:text-[#1A3D3D]'}`}>
          Todos los rubros
        </li>
        {CATEGORIAS_PROVEEDORES.map(cat => (
          <li key={cat} onClick={() => handleCategoryFilter(cat)} className={`text-[13px] font-semibold cursor-pointer transition-colors ${filtroCategoria === cat ? 'text-[#2D6A6A]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
            {cat}
          </li>
        ))}
      </ul>

{/* FILTRO DE PROVINCIA */}
      <div className="mb-6 pt-6 border-t border-gray-50">
        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> Provincia
        </h3>
        <div className="relative">
          <select
            value={filtroProvincia || ''}
            onChange={(e) => {
              setFiltroProvincia(e.target.value || null);
              setVisibleProviders(6);
            }}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#1A3D3D] focus:outline-none focus:border-[#2D6A6A] appearance-none cursor-pointer transition-all"
          >
            <option value="">Todas las provincias</option>
            {PROVINCIAS_ARG.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
          <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
        </div>
        {filtroProvincia && (
          <button
            onClick={() => { setFiltroProvincia(null); setVisibleProviders(6); }}
            className="mt-2 text-[11px] font-bold text-[#2D6A6A] hover:underline"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {/* ENVÍOS AL INTERIOR */}
      <div className="mb-8 pt-6 border-t border-gray-50">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${soloEnvios ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'border-gray-300 group-hover:border-[#2D6A6A]'}`}>
            {soloEnvios && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
          </div>
          <span className={`text-[13px] font-bold transition-colors ${soloEnvios ? 'text-[#1A3D3D]' : 'text-gray-500 group-hover:text-[#1A3D3D]'}`}>
            Con envíos al interior
          </span>
        </label>
      </div>
     
    </div>
  );

  const renderGrid = () => (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500 w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
              Cartilla de Proveedores
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-2">Productos destacados por cada proveedor. Hacé clic para ver el perfil completo.</p>
          </div>
          <button
            onClick={() => setSoloFavoritos(prev => !prev)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 md:py-3 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all shrink-0 ${soloFavoritos ? 'bg-red-50 border border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
          >
            <Heart className={`w-4 h-4 ${soloFavoritos ? 'fill-red-500 text-red-500' : ''}`} />
            {soloFavoritos ? 'Productos guardados' : 'Mis Guardados'}
          </button>
        </div>

      </header>

      <div className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8">
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          {renderFiltros()}
        </aside>

        <section className="lg:col-span-9 flex flex-col gap-5 md:gap-6 w-full">
          
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
            <input 
              type="search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por marca, insumo o equipamiento..." 
              className="bg-white border border-gray-100 rounded-full pl-11 pr-6 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] w-full shadow-sm placeholder:text-gray-400 transition-all" 
            />
          </div>


{isLoading ? (
  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center w-full h-64">
    <div className="w-8 h-8 border-4 border-[#2D6A6A] border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-500 font-medium text-sm">Cargando proveedores...</p>
  </div>
) : proveedoresMostrados.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {proveedoresMostrados.map(prov => (
                  <article
                    key={prov.id}
                    className="bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] hover:border-[#2D6A6A]/30 transition-all group relative flex flex-col h-full cursor-pointer overflow-hidden"
                    onClick={() => handleProviderClick(prov)}
                  >
                    {/* IMAGEN DEL PRODUCTO */}
                    <div className="relative w-full h-36 bg-gray-50 overflow-hidden shrink-0">
                      {prov.imagenes && prov.imagenes[0] ? (
                        <img
                          src={prov.imagenes[0]}
                          alt={prov.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-200" />
                        </div>
                      )}

                      {/* ETIQUETA ESPECIAL (Nuevo / Promo) */}
                      {prov.etiqueta && (
                        <span className={`absolute top-3 left-3 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md ${prov.etiqueta === 'Nuevo' ? 'bg-[#E4405F]' : 'bg-amber-500'}`}>
                          {prov.etiqueta}
                        </span>
                      )}

                      {/* BOTÓN FAVORITO */}
                      <button
                        onClick={(e) => toggleFavorito(e, `prov-${prov.id}`)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all z-10 shadow-md border border-gray-100"
                      >
                        <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(`prov-${prov.id}`) ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                      </button>
                    </div>

                    {/* CONTENIDO */}
                    <div className="p-3.5 flex flex-col flex-grow">
                      {/* CATEGORÍA DEL PRODUCTO */}
                      <span className="text-[10px] md:text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] mb-0.5">
                        {prov.categoria || 'General'}
                      </span>

                      {/* TÍTULO DEL PRODUCTO */}
                      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[13px] md:text-[14px] leading-tight mb-1.5 group-hover:text-[#2D6A6A] transition-colors line-clamp-2">
                        {prov.titulo}
                      </h3>

                      {/* DESCRIPCIÓN CORTA */}
                      <p className="text-gray-500 text-[12px] md:text-[13px] font-medium line-clamp-2 mb-2 flex-grow leading-relaxed">
                        {prov.descripcionLarga}
                      </p>

                      {/* PRECIO */}
                      {prov.precio && (
                        <p className="text-[#2D6A6A] font-black text-[13px] mb-2">
                          $ {prov.precio.replace(/^\$\s*/, '')}
                        </p>
                      )}

                      {/* FIRMA DEL PROVEEDOR */}
                      <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md border border-gray-100 overflow-hidden bg-white flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                            {prov.proveedorLogo ? (
                              <img src={prov.proveedorLogo} alt={prov.proveedorNombre} className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                          <span className="text-[12px] font-bold text-gray-500 truncate max-w-[80px]">
                            {prov.proveedorNombre}
                          </span>
                        </div>
                        <span className="text-[#2D6A6A] text-[12px] md:text-[13px] font-bold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                          Ver más <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {proveedoresFiltrados.length > visibleProviders && (
                <div className="mt-4 flex justify-center">
                  <button onClick={() => setVisibleProviders(prev => prev + 6)} className="px-6 py-3 bg-white border border-gray-200 text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
                    Cargar más <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center w-full h-full">
              <Package className="w-10 h-10 text-gray-200 mb-4" />
              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-lg mb-2">
                {soloFavoritos ? 'No tenés productos guardados' : 'Aún no hay proveedores'}
              </h3>
              <p className="text-[#333333] text-[15px] font-medium">
                {soloFavoritos ? 'Explorá la cartilla y guardá los que te interesen con el corazón.' : 'Proximamente!'}
              </p>
              {soloFavoritos && (
                <button onClick={() => setSoloFavoritos(false)} className="mt-6 px-6 py-3 bg-[#1A3D3D] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2D6A6A] transition-all shadow-sm">
                  Ver todos los productos
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );

  

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative">
      <main id="main-content" className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 pt-5 pb-10 md:pt-9 md:pb-16 flex-grow">
    {renderGrid()}
  </main>
    </div>
  );
}