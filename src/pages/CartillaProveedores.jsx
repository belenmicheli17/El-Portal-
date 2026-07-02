import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// IMPORTS DE FIREBASE (Siempre arriba de todo)
import { db } from '../firebase.js'; 
import { collection, getDocs } from 'firebase/firestore';
import { cargarSeeds } from '../seeds.js';

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
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'proveedores'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProveedores(data);
      } catch (error) {
        console.error("Error trayendo proveedores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProveedores();
  }, []);

  const [selectedProvider, setSelectedProvider] = useState(null);
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
    // Viaja a la ruta de tu perfil individual usando el slug (o el id si no tiene slug)
    navigate(`/proveedor/${proveedor.slug || proveedor.id}`); 
    window.scrollTo(0,0);
  };

const [soloEnvios, setSoloEnvios] = useState(false);

  // 2. Modificá la constante proveedoresFiltrados (cerca de la línea 80) para que quede así:
  const proveedoresFiltrados = proveedores.filter(prov => {
    const matchCategoria = !filtroCategoria || prov.categoria === filtroCategoria;
    const matchBusqueda = !searchTerm || prov.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEnvio = !soloEnvios || prov.envios === true;
    return matchCategoria && matchBusqueda && matchEnvio;
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

{/* Botón de Envíos al interior */}
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

      <div className="mt-8 bg-[#F4F7F7] p-5 rounded-[20px] border border-gray-100 text-center">
        <Building2 className="w-8 h-8 text-[#2D6A6A] mx-auto mb-3" />
        <h4 className="text-[#1A3D3D] font-bold text-sm mb-2">¿Sos proveedor?</h4>
        <p className="text-xs text-gray-500 font-medium mb-4">Sumá tu empresa a la cartilla oficial y conectá con miles de clínicas.</p>
        <button onClick={() => navigate('/editor-proveedores')} className="w-full bg-[#1A3D3D] text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#2D6A6A] transition-all">
  Dar de alta
</button>
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500 w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
            Cartilla de Proveedores
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-2">Encontrá el equipamiento y los insumos que tu clínica necesita.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {proveedoresMostrados.map(prov => (
                  <article key={prov.id} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col h-full cursor-pointer" onClick={() => handleProviderClick(prov)}>
                    <button onClick={(e) => toggleFavorito(e, `prov-${prov.id}`)} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-white transition-all z-10 border border-gray-100">
                      <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(`prov-${prov.id}`) ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full border border-gray-100 overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center p-2">
                         <img src={prov.logo} alt={prov.nombre} className="w-full h-auto object-contain" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em]">{prov.categoria}</span>
                        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px] leading-tight group-hover:text-[#2D6A6A] transition-colors">{prov.nombre}</h3>
                      </div>
                    </div>

                    <p className="text-gray-500 text-xs font-medium line-clamp-2 mb-4 flex-grow">
                      {prov.bioCorta || prov.descripcionBreve}
                    </p>

                    <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 mt-auto">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#4DB6AC]" /> {Array.isArray(prov.zonaCobertura) ? prov.zonaCobertura[0] : prov.ubicacion}
                      </div>
                      {prov.envios && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                          <Truck className="w-3.5 h-3.5 text-[#4DB6AC]" /> Envíos al interior
                        </div>
                      )}
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
              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-lg mb-2">Aún no hay proveedores cargados</h3>
              <p className="text-[#333333] text-[15px] font-medium">Estamos actualizando la base de datos o probá con otro filtro.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedProvider) return null;
    return (
      <article className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
        <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a la Cartilla
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* COLUMNA PRINCIPAL */}
          <section className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full border-2 border-gray-50 shadow-md p-4 shrink-0 flex items-center justify-center">
                <img src={selectedProvider.logo} alt={selectedProvider.nombre} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="text-center md:text-left flex-1">
                <span className="inline-block bg-[#2D6A6A]/10 text-[#2D6A6A] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-3">
                  {selectedProvider.categoria}
                </span>
                <h1 className="text-3xl md:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] leading-tight mb-4">
                  {selectedProvider.nombre}
                </h1>
                <p className="text-gray-600 text-sm md:text-[15px] leading-relaxed font-medium">
                  {selectedProvider.descripcionLarga}
                </p>
              </div>
            </div>

            {/* CAJITAS DE SERVICIO (Tus íconos) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#2D6A6A] transition-colors">
                <ShieldCheck className="w-7 h-7 text-[#2D6A6A]" />
                <span className="text-[11px] font-bold text-[#1A3D3D] uppercase tracking-wider">Garantía Oficial</span>
              </div>
              <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#2D6A6A] transition-colors">
                <Truck className="w-7 h-7 text-[#2D6A6A]" />
                <span className="text-[11px] font-bold text-[#1A3D3D] uppercase tracking-wider">Envíos al Interior</span>
              </div>
              <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#2D6A6A] transition-colors">
                <Wrench className="w-7 h-7 text-[#2D6A6A]" />
                <span className="text-[11px] font-bold text-[#1A3D3D] uppercase tracking-wider">Soporte Técnico</span>
              </div>
              <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:border-[#2D6A6A] transition-colors">
                <CheckCircle2 className="w-7 h-7 text-[#2D6A6A]" />
                <span className="text-[11px] font-bold text-[#1A3D3D] uppercase tracking-wider">Stock Permanente</span>
              </div>
            </div>

            {/* MAPITA INTERACTIVO */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4">Ubicación y Sucursales</h3>
              <div className="w-full h-[300px] bg-gray-100 rounded-[20px] overflow-hidden relative group">
                {/* Contenedor preparado para inyectar un Google Map iframe o Leaflet */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                  <MapPin className="w-10 h-10 text-[#2D6A6A] mb-2 drop-shadow-md" />
                  <span className="font-bold text-sm tracking-wide">MAPA INTERACTIVO</span>
                  <span className="text-xs font-medium mt-1">Acá se renderizará el mapa con la ubicación real</span>
                </div>
              </div>
            </div>
          </section>

          {/* SIDEBAR DE CONTACTO */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 bg-white p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 space-y-6">
              <h4 className="font-['Montserrat'] font-black text-[#1A3D3D] text-lg mb-2">Contacto Directo</h4>
              <p className="text-xs text-gray-500 font-medium mb-6">Mencioná que los contactaste por El Portal para acceder a beneficios exclusivos.</p>

              <div className="space-y-4">
                <a href={`tel:${selectedProvider.telefono}`} className="w-full py-4 bg-[#2D6A6A] text-white rounded-[16px] font-black text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] transition-all flex items-center justify-center gap-3 shadow-md">
                  <Phone className="w-4 h-4" /> Llamar ahora
                </a>
                <a href={`mailto:${selectedProvider.email}`} className="w-full py-4 bg-gray-50 text-[#1A3D3D] border border-gray-200 rounded-[16px] font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3">
                  <Mail className="w-4 h-4" /> Enviar Correo
                </a>
                <a href={selectedProvider.web} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-gray-50 text-[#1A3D3D] border border-gray-200 rounded-[16px] font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3">
                  <Globe className="w-4 h-4" /> Sitio Web
                </a>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#2D6A6A] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Horario de atención</p>
                    <p className="text-sm font-semibold text-[#1A3D3D]">Lunes a Viernes de 9 a 18hs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#2D6A6A] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sede Central</p>
                    <p className="text-sm font-semibold text-[#1A3D3D]">{selectedProvider.direccionExacta || selectedProvider.ubicacion}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    );
  };

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative">
      <main id="main-content" className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 pt-5 pb-10 md:pt-9 md:pb-16 flex-grow">
    {renderGrid()}
  </main>
    </div>
  );
}