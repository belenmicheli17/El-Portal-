import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ChevronLeft, ChevronRight, Phone, Mail, Globe,
  PackageSearch, Truck, CreditCard, Check, ArrowUpRight, X, MessageCircle, FileText, Wrench,
  Facebook, Instagram, Linkedin, Building2, MapPin, ArrowUp, Filter, Clock,
  Search, Play
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// ==========================================
// FIREBASE IMPORTS
// ==========================================
// Importamos 'db' directamente desde tu configuración centralizada de Firebase
import { db } from '../../firebase'; 
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function PerfilProveedor() {
  const navigate = useNavigate();
  const { slug } = useParams();
  
  // ESTADOS DE DATOS
  const [proveedor, setProveedor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ESTADOS DE UI
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMainBackToTop, setShowMainBackToTop] = useState(false);
  const [highlightContacto, setHighlightContacto] = useState(false);

  // ==========================================
// CARGA DE DATOS DESDE FIREBASE (CORREGIDA)
// ==========================================
  useEffect(() => {
    const fetchProveedorInfo = async () => {
      setIsLoading(true);
      try {
        if (!slug) return;

        // CORRECCIÓN: Buscamos en la colección 'proveedores' donde el campo 'slug' sea igual al slug de la URL
        const q = query(collection(db, 'proveedores'), where('slug', '==', slug), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // CORRECCIÓN: Usamos setProveedor y accedemos a los datos del primer documento encontrado
          setProveedor(querySnapshot.docs[0].data());
        } else {
          setProveedor(null);
        }
      } catch (error) {
        console.error("Error obteniendo el perfil del proveedor:", error);
        setProveedor(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProveedorInfo();
  }, [slug]);

  // ==========================================
  // LÓGICA DE FILTRADO Y BÚSQUEDA
  // ==========================================
  const productosDestacados = proveedor?.productosDestacados || [];

  const productosFiltrados = productosDestacados.filter(p => {
    const matchCategoria = categoriaFiltro === "Todos" || p.categoria === categoriaFiltro;
    const matchSearch = p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.descripcionLarga && p.descripcionLarga.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategoria && matchSearch;
  });

  const categoriasUnicas = ["Todos", ...new Set(productosDestacados.map(p => p.categoria).filter(Boolean))];
  
  // ==========================================
  // LÓGICA DE CARRUSEL DESLIZANTE INFINITO
  // ==========================================
  const totalItems = productosFiltrados.length;
  const isCarouselActive = totalItems > 3;
  
  const carouselItems = isCarouselActive 
    ? [...productosFiltrados, ...productosFiltrados, ...productosFiltrados]
    : productosFiltrados;
    
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(false);
    setCurrentIndex(isCarouselActive ? totalItems : 0);
  }, [categoriaFiltro, searchQuery, totalItems, isCarouselActive]);

  const handleNextCarousel = () => {
    if (!isCarouselActive || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrevCarousel = () => {
    if (!isCarouselActive || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
  };

  const handleCarouselTransitionEnd = () => {
    if (!isCarouselActive) return;
    if (currentIndex >= totalItems * 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - totalItems);
    } else if (currentIndex <= totalItems - 1) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + totalItems);
    }
  };

  // ==========================================
  // EFECTOS DE UI Y ANIMACIONES
  // ==========================================
  
  // Efecto para highlight de contacto
  useEffect(() => {
    const handleHighlightEvent = () => {
      setHighlightContacto(true);
      setTimeout(() => { setHighlightContacto(false); }, 2500);
    };
    window.addEventListener('trigger-highlight-contacto', handleHighlightEvent);
    return () => window.removeEventListener('trigger-highlight-contacto', handleHighlightEvent);
  }, []);

  // Efectos generales (Fuentes, Scroll, Observer)
  useEffect(() => {
    if (isLoading) return;

    // Cargar fuentes
    if (!document.getElementById('montserrat-inter-font')) {
        const link = document.createElement('link');
        link.id = 'montserrat-inter-font';
        link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    // Intersection Observer para animaciones reveal
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

    // Botón Back to Top principal
    const handleMainScroll = () => { setShowMainBackToTop(window.scrollY > 400); };
    window.addEventListener('scroll', handleMainScroll);

    return () => { window.removeEventListener('scroll', handleMainScroll); };
  }, [isLoading]); 

  // Bloquear scroll body cuando hay modales abiertos
  useEffect(() => {
    document.body.style.overflow = (productoSeleccionado || isMobileCatalogOpen) ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [productoSeleccionado, isMobileCatalogOpen]);

  // ==========================================
  // HANDLERS DE INTERACCIÓN
  // ==========================================
  const handleCerrarModal = (e) => { if (e.target.id === 'modal-overlay') setProductoSeleccionado(null); };
  const abrirModalProducto = (prod) => { setProductoSeleccionado(prod); setImagenActiva(0); };
  const scrollToCatalogo = () => { document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); };
  const handlePrevImage = (e) => { e.stopPropagation(); setImagenActiva((prev) => prev === 0 ? productoSeleccionado.imagenes.length - 1 : prev - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setImagenActiva((prev) => prev === productoSeleccionado.imagenes.length - 1 ? 0 : prev + 1); };

  // ==========================================
  // PANTALLAS DE ESTADO (CARGA / ERROR)
  // ==========================================
  if (isLoading) {
    return <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#2D6A6A]" /></div>;
  }

  if (!proveedor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F7] font-['Inter'] px-4">
        <div className="bg-white p-8 rounded-[32px] shadow-sm text-center max-w-md border border-gray-100 reveal-on-scroll in-view">
           <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-6" />
           <h2 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">Perfil no encontrado</h2>
           <p className="text-gray-500 mb-8 leading-relaxed">Parece que este proveedor aún no ha guardado sus datos o la URL es incorrecta.</p>
           <button onClick={() => navigate('/Cartilla')} className="bg-[#1A3D3D] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#2D6A6A] transition-colors">Volver a la Cartilla</button>
        </div>
      </div>
    );
  }

  // ==========================================
  // COMPONENTES LOCALES DE RENDERIZADO
  // ==========================================
  const DesktopProductCard = ({ prod }) => (
    <article onClick={() => abrirModalProducto(prod)} className="bg-white border border-gray-200 rounded-[24px] hover:border-[#2D6A6A]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group flex flex-col text-left cursor-pointer overflow-hidden h-full">
      <div className="w-full h-48 relative overflow-hidden bg-white shrink-0 border-b border-gray-100">
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-[#1A3D3D]/90 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
            {prod.categoria || 'General'}
          </span>
        </div>
        {prod.etiqueta && (
          <div className="absolute top-4 right-4 z-10">
            <span className={`text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm ${prod.etiqueta === 'Nuevo' ? 'bg-[#E4405F]' : 'bg-amber-500'}`}>
              {prod.etiqueta}
            </span>
          </div>
        )}
        {prod.imagenes && prod.imagenes[0] ? (
          <img src={prod.imagenes[0]} alt={prod.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50"><PackageSearch className="w-8 h-8 text-gray-300"/></div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-[15px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-4 flex-1 limit-text-2">
          {prod.titulo}
        </h3>
        <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-4">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 block">Precio ARS</span>
            <span className="font-black text-[#2D6A6A] text-lg">{prod.precio ? `$${prod.precio}` : 'Consultar'}</span>
          </div>
          <div className="w-9 h-9 bg-[#F4F7F7] rounded-xl flex items-center justify-center text-[#2D6A6A] group-hover:bg-[#2D6A6A] group-hover:text-white transition-colors shadow-inner">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </article>
  );

  const MobileProductCard = ({ prod }) => (
    <article onClick={() => abrirModalProducto(prod)} className="bg-white rounded-[16px] shadow-sm border border-gray-100 flex flex-col overflow-hidden cursor-pointer relative h-full">
      {prod.etiqueta && (
        <div className="absolute top-2 right-2 z-10">
          <span className={`text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${prod.etiqueta === 'Nuevo' ? 'bg-[#E4405F]' : 'bg-amber-500'}`}>
            {prod.etiqueta}
          </span>
        </div>
      )}
      <div className="aspect-square relative w-full bg-white border-b border-gray-50">
        {prod.imagenes && prod.imagenes[0] ? (
          <img src={prod.imagenes[0]} alt={prod.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50"><PackageSearch className="w-6 h-6 text-gray-300"/></div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between">
        <h3 className="text-[12px] font-bold text-[#1A3D3D] leading-snug mb-2 limit-text-2">{prod.titulo}</h3>
        <span className="font-black text-[#2D6A6A] text-[14px] mt-auto pt-1">{prod.precio ? `$${prod.precio}` : 'Consultar'}</span>
      </div>
    </article>
  );

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  return (
    <div className="bg-[#F4F7F7] font-['Inter'] antialiased min-h-screen relative text-[#333333] text-left overflow-x-hidden selection:bg-[#2D6A6A] selection:text-white flex flex-col">
      <Helmet>
        <title>{`${proveedor.nombre} | Perfil de Proveedor | El Portal`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <main className="w-full bg-white pt-[72px] flex-1">
        <div className="max-w-[1100px] mx-auto px-4 md:px-10 pb-16">

          {/* Breadcrumbs */}
          <div className="pt-8 pb-2 flex flex-wrap items-center gap-2 text-xs md:text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
             <button onClick={() => { navigate('/'); window.scrollTo(0,0); }} className="hover:text-[#2D6A6A] transition-colors">Inicio</button>
             <ChevronRight className="w-3 h-3 text-gray-300" />
             <button onClick={() => { navigate('/Cartilla'); window.scrollTo(0,0); }} className="hover:text-[#2D6A6A] transition-colors">Cartilla</button>
             <ChevronRight className="w-3 h-3 text-gray-300" />
             <span className="text-[#1A3D3D] truncate">{proveedor.nombre}</span>
          </div>

          {/* Banner de Portada (CORREGIDO: proveedor.fotoPortada) */}
          {proveedor.fotoPortada && (
            <div className="w-full h-[180px] md:h-[260px] rounded-[24px] overflow-hidden mt-4 shadow-sm border border-gray-100 relative fade-scale">
              <img src={proveedor.fotoPortada} alt="Portada Empresa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A3D3D]/60 to-transparent mix-blend-multiply"></div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 relative z-10 px-2 lg:px-6">
            
            {/* COLUMNA IZQUIERDA: Info Principal */}
            <div className="lg:w-[65%] w-full flex flex-col">
              
              {/* Header: Logo + Nombre */}
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 text-left -mt-16 md:-mt-20 relative z-20">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl p-1.5 shadow-lg border border-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                  {/* CORREGIDO: proveedor.logo */}
                  {proveedor.logo ? (
                    <img src={proveedor.logo} alt={proveedor.nombre} className="w-full h-full rounded-[20px] object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <div className="pb-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {/* CORREGIDO: proveedor.verificado */}
                    {proveedor.verificado && (
                      <div className="flex items-center gap-1.5 text-[#2D6A6A] bg-[#F4F7F7] border border-[#2D6A6A]/10 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                      </div>
                    )}
                    <span className="text-gray-500 font-bold text-[11px] uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg">{proveedor.categoria}</span>
                  </div>
                  <h1 className="text-3xl md:text-[46px] font-black text-[#1A3D3D] leading-tight md:leading-none tracking-tight font-['Montserrat'] break-words">
                    {proveedor.nombre}
                  </h1>
                </div>
              </div>

              {/* Bio Corta y Botones */}
              <div className="mt-8">
                {/* CORREGIDO: proveedor.bioCorta */}
                <p className="text-[16px] md:text-[18px] text-gray-600 font-medium leading-relaxed max-w-2xl">
                  {proveedor.bioCorta}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={scrollToCatalogo} className="inline-flex items-center justify-center gap-2.5 bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-[#2D6A6A] hover:-translate-y-0.5 transition-all active:scale-95 tracking-widest w-full sm:w-auto">
                    <PackageSearch className="w-4 h-4" /> Ver Catálogo
                  </button>
                  {/* CORREGIDO: proveedor.linkCatalogo */}
                  {proveedor.linkCatalogo && (
                    <a href={proveedor.linkCatalogo} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-[#1A3D3D] px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-all active:scale-95 tracking-widest w-full sm:w-auto">
                      <FileText className="w-4 h-4 text-[#2D6A6A]" /> Lista de Precios
                    </a>
                  )}
                </div>
              </div>

              <hr className="w-full border-t border-gray-100 my-8 md:my-10" />

              {/* Sección Sobre Nosotros */}
              <section id="nosotros" className="w-full text-left reveal-on-scroll">
                <div className="mb-6">
                  <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1 text-left">Trayectoria y Compromiso</h3>
                  <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-left">Sobre la Empresa</h2>
                </div>
                {/* CORREGIDO: proveedor.bioLarga */}
                {proveedor.bioLarga && (
                  <p className="text-gray-600 text-[15px] md:text-[16px] leading-relaxed font-medium mb-8 whitespace-pre-line">
                    {proveedor.bioLarga}
                  </p>
                )}

                {/* Imagen/Video Nosotros (CORREGIDO: proveedor.imagenNosotros / videoNosotros) */}
                {proveedor.imagenNosotros && (
                  <div 
                    className={`w-full h-[240px] md:h-[320px] rounded-[24px] overflow-hidden relative shadow-sm border border-gray-100 group ${proveedor.videoNosotros ? 'cursor-pointer' : ''}`}
                    onClick={() => proveedor.videoNosotros && window.open(proveedor.videoNosotros, '_blank')}
                  >
                    <img src={proveedor.imagenNosotros} alt="Instalaciones o Equipo" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    
                    {proveedor.videoNosotros && (
                      <div className="absolute inset-0 bg-[#1A3D3D]/10 group-hover:bg-[#1A3D3D]/30 transition-colors duration-200 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#1A3D3D] shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 ml-1 fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

            </div>

            {/* ASIDE: Información de Contacto (CORREGIDO REFERENCIAS PLANAS) */}
            <aside className="lg:w-[35%] w-full">
              <div id="contacto" className={`sticky top-[100px] bg-[#F9FBFA] p-8 border border-gray-100 flex flex-col text-left mt-4 lg:mt-16 transition-all duration-700 ease-out ${
                highlightContacto 
                  ? 'scale-[1.02] shadow-[0_0_60px_rgba(45,106,106,0.25)] ring-4 ring-[#4DB6AC]/40 ring-offset-4 ring-offset-[#F4F7F7]/50 rounded-[32px] relative z-50' 
                  : 'scale-100 shadow-sm rounded-[32px] relative z-10 reveal-on-scroll'
              }`}>
                
                <h3 className="text-[#1A3D3D] font-black font-['Montserrat'] text-[18px] mb-8 pb-4 border-b border-gray-200/60">
                  Información del Proveedor
                </h3>

                <div className="flex flex-col gap-3">
                  
                  {/* WhatsApp (CORREGIDO: whatsappActivo y whatsappVentas) */}
                  {proveedor.whatsappActivo && proveedor.whatsappVentas && (
                    <a href={`https://wa.me/${proveedor.whatsappVentas.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-sm tracking-widest hover:bg-[#20bd5a] transition-colors w-full mb-2 active:scale-95">
                      <Phone className="w-4 h-4" /> Hablar por WhatsApp
                    </a>
                  )}

                  {/* Ubicación y Sede (CORREGIDO: mapaUrl, direccion, modalidadTexto, horariosAtencion) */}
                  {(proveedor.direccion || proveedor.mapaUrl) && (
                    <a href={proveedor.mapaUrl || "#"} target="_blank" rel="noreferrer" className={`block bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#2D6A6A]/30 transition-all group relative ${!proveedor.mapaUrl ? 'pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] group-hover:bg-[#2D6A6A] group-hover:text-white transition-colors shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Sede Central</p>
                        </div>
                        {proveedor.mapaUrl && <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#2D6A6A] transition-colors" />}
                      </div>
                      
                      {proveedor.direccion && <p className="text-[#1A3D3D] font-bold text-[15px] leading-snug mb-5">{proveedor.direccion}</p>}
                      
                      {(proveedor.modalidadTexto || proveedor.horariosAtencion) && (
                        <div className="pt-4 border-t border-gray-100/60">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-3">Atención al cliente</p>
                           {proveedor.modalidadTexto && <p className="text-[#1A3D3D] font-medium text-[13px] leading-relaxed mb-3">{proveedor.modalidadTexto}</p>}
                           {proveedor.horariosAtencion && (
                             <p className="text-gray-600 font-semibold text-[13px] leading-relaxed flex items-center gap-2">
                                 <Clock className="w-4 h-4 text-[#2D6A6A]" /> {proveedor.horariosAtencion}
                             </p>
                           )}
                        </div>
                      )}
                    </a>
                  )}

                  {/* Redes Sociales (CORREGIDO: instagram, facebook, linkedin planos) */}
                  {(proveedor.instagram || proveedor.facebook || proveedor.linkedin) && (
                    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-2.5">Redes Sociales</p>
                        <div className="flex gap-2.5">
                           {proveedor.instagram && (
                             <a href={proveedor.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white transition-all shadow-sm active:scale-90">
                               <Instagram className="w-4 h-4" />
                             </a>
                           )}
                           {proveedor.facebook && (
                             <a href={proveedor.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all shadow-sm active:scale-90">
                               <Facebook className="w-4 h-4" />
                             </a>
                           )}
                           {proveedor.linkedin && (
                             <a href={proveedor.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-gray-400 hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm active:scale-90">
                               <Linkedin className="w-4 h-4" />
                             </a>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Comercial (CORREGIDO: emailVentas) */}
                  {proveedor.emailVentas && (
                    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5">Email Comercial</p>
                        <p className="text-[#1A3D3D] font-bold text-[13px] leading-snug break-words">{proveedor.emailVentas}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>

      {/* SECCIÓN INFERIOR: CATÁLOGO Y CONDICIONES */}
      <div className="w-full bg-[#F4F7F7] pt-12 pb-16">
        <div className="max-w-[1100px] mx-auto px-4 md:px-10">
          
          {/* SECCIÓN CATÁLOGO */}
          <section id="catalogo" className="w-full bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-gray-100 text-left reveal-on-scroll mb-8">
            
            {/* Header Catálogo, Buscador y Filtro */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative">
              <div className="flex-1">
                <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1 text-left">Vitrina de Productos</h3>
                <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-left">Catálogo Destacado</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-30">
                {/* Buscador */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-56 lg:w-64 pl-10 pr-4 py-3 rounded-xl text-[13px] font-bold bg-white border border-gray-200 focus:outline-none focus:border-[#2D6A6A] focus:ring-1 focus:ring-[#2D6A6A] shadow-sm transition-all"
                  />
                </div>

                {/* Botón Filtro */}
                <div className="relative">
                  <button 
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-[13px] font-bold bg-gray-50 text-[#1A3D3D] hover:bg-gray-100 border border-gray-200 transition-all flex items-center justify-between sm:justify-start gap-2 shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filtrar: {categoriaFiltro}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform sm:hidden ${isFilterMenuOpen ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {/* Menú Dropdown Filtro */}
                  {isFilterMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden py-2 fade-scale">
                      {categoriasUnicas.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => { setCategoriaFiltro(cat); setIsFilterMenuOpen(false); }}
                          className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-colors ${categoriaFiltro === cat ? 'text-[#2D6A6A] bg-[#2D6A6A]/5' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Renderizado de Productos (Desktop) */}
            <div className="hidden md:block">
              {productosFiltrados.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-medium text-[14px] bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   No se encontraron productos que coincidan con la búsqueda o filtro.
                </div>
              ) : !isDesktopExpanded ? (
                /* Vista Carrusel */
                <div className="relative w-full px-12 md:px-14">
                  {isCarouselActive && (
                    <button onClick={handlePrevCarousel} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-all shadow-md active:scale-95 disabled:opacity-50" disabled={isTransitioning}>
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}
                  <div className="-mx-3 overflow-hidden py-2">
                      <div 
                        className="flex items-stretch"
                        style={isCarouselActive ? {
                          width: `${(carouselItems.length / 3) * 100}%`,
                          transform: `translateX(-${(currentIndex / carouselItems.length) * 100}%)`,
                          transition: isTransitioning ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                        } : { width: '100%', gap: '1.5rem' }}
                        onTransitionEnd={handleCarouselTransitionEnd}
                      >
                        {carouselItems.map((prod, idx) => (
                          <div 
                            key={`${prod.id}-${idx}`} 
                            className="px-3 shrink-0"
                            style={isCarouselActive ? { width: `${100 / carouselItems.length}%` } : { width: 'calc(33.333% - 1rem)' }}
                          >
                            <DesktopProductCard prod={prod} />
                          </div>
                        ))}
                      </div>
                  </div>
                  {isCarouselActive && (
                    <button onClick={handleNextCarousel} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-all shadow-md active:scale-95 disabled:opacity-50" disabled={isTransitioning}>
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}
                </div>
              ) : (
                /* Vista Grid Expandida */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-6 fade-scale">
                  {productosFiltrados.map(prod => (
                      <DesktopProductCard key={prod.id} prod={prod} />
                  ))}
                </div>
              )}

              {/* Botón Ver Todo (Desktop) */}
              {totalItems > 3 && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={() => setIsDesktopExpanded(!isDesktopExpanded)} 
                    className="px-10 py-4 bg-white border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[11px] text-[#1A3D3D] shadow-sm hover:border-[#2D6A6A] hover:bg-gray-50 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <PackageSearch className="w-4 h-4" />
                    {isDesktopExpanded ? 'Ver menos' : `Ver catálogo completo (${totalItems})`}
                  </button>
                </div>
              )}
            </div>

            {/* Renderizado de Productos (Móvil) */}
            <div className="md:hidden flex flex-col mt-4">
              {productosFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 font-medium text-[13px] bg-gray-50 rounded-2xl border border-dashed border-gray-200">No hay resultados.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {productosFiltrados.slice(0, 4).map(prod => (
                    <MobileProductCard key={prod.id} prod={prod} />
                  ))}
                </div>
              )}
              
              {totalItems > 4 && (
                <button 
                  onClick={() => setIsMobileCatalogOpen(true)}
                  className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[11px] text-[#1A3D3D] flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm active:scale-95"
                >
                  <PackageSearch className="w-4 h-4" />
                  Ver catálogo completo ({totalItems})
                </button>
              )}
            </div>
          </section>

          {/* SECCIÓN CONDICIONES COMERCIALES (CORREGIDO: Mapeo directo de arrays) */}
          <section id="condiciones" className="w-full bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 text-left reveal-on-scroll">
            <div className="mb-8 border-b border-gray-100 pb-6">
              <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1 text-left">Términos Comerciales</h3>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-left">Condiciones de Venta</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
              
              {/* Logística (CORREGIDO: proveedor.envios) */}
              <div className="flex flex-col bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] shrink-0 shadow-inner border border-[#2D6A6A]/10">
                    <Truck className="w-4 h-4" />
                  </div>
                  Logística y Envíos
                </h4>
                {proveedor.envios && proveedor.envios.length > 0 ? (
                  <ul className="space-y-4">
                    {proveedor.envios.map((punto, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                        <span className="text-[15px] font-medium text-gray-800 leading-snug">{punto}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic text-center py-4">No especificado.</p>}
              </div>

              {/* Pagos (CORREGIDO: proveedor.pagos) */}
              <div className="flex flex-col bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] shrink-0 shadow-inner border border-[#2D6A6A]/10">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  Medios de Pago
                </h4>
                {proveedor.pagos && proveedor.pagos.length > 0 ? (
                  <ul className="space-y-4">
                    {proveedor.pagos.map((punto, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                        <span className="text-[15px] font-medium text-gray-800 leading-snug">{punto}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic text-center py-4">No especificado.</p>}
              </div>

              {/* Garantía (CORREGIDO: proveedor.garantia) */}
              <div className="flex flex-col bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] shrink-0 shadow-inner border border-[#2D6A6A]/10">
                    <Wrench className="w-4 h-4" />
                  </div>
                  Soporte y Garantía
                </h4>
                {proveedor.garantia && proveedor.garantia.length > 0 ? (
                  <ul className="space-y-4">
                    {proveedor.garantia.map((punto, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                        <span className="text-[15px] font-medium text-gray-800 leading-snug">{punto}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic text-center py-4">No especificado.</p>}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* FOOTER SIMPLE */}
      <footer className="w-full bg-[#1A3D3D] py-6 mt-auto">
          <div className="max-w-[1100px] mx-auto px-6 text-center text-white/60 text-xs font-medium">
             © {new Date().getFullYear()} El Portal Veterinario. Perfil público de Proveedor Verificado.
          </div>
      </footer>

      {/* ==========================================
          MODALES Y ELEMENTOS FLOTANTES
      ========================================== */}

      {/* MODAL CATÁLOGO MÓVIL FULLSCREEN */}
      {isMobileCatalogOpen && (
        <div 
          id="mobile-catalog-container"
          className="fixed inset-0 z-[400] bg-[#F4F7F7] overflow-y-auto fade-scale md:hidden"
          onScroll={(e) => setShowBackToTop(e.target.scrollTop > 300)}
        >
          {/* Header Modal */}
          <div className="sticky top-0 z-[410] bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm">
              <button onClick={() => setIsMobileCatalogOpen(false)} className="flex items-center gap-2 text-[#2D6A6A] font-bold text-[14px] active:scale-95">
                <ChevronLeft className="w-5 h-5" /> Volver
              </button>
              <span className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px]">Catálogo Completo</span>
              <span className="w-10"></span> {/* Spacer */}
          </div>

          {/* Contenido Modal */}
          <div className="p-4 pb-24">
              {/* Buscador y Filtro Móvil */}
              <div className="flex flex-col gap-3 mb-6 relative">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] font-bold bg-white border border-gray-200 focus:outline-none focus:border-[#2D6A6A] shadow-sm"
                  />
                </div>

                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="w-full px-5 py-3 rounded-xl text-[13px] font-bold bg-white text-[#1A3D3D] border border-gray-200 flex items-center justify-between shadow-sm active:bg-gray-50"
                >
                  <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filtrar: {categoriaFiltro}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isFilterMenuOpen ? 'rotate-90' : ''}`} />
                </button>
                
                {isFilterMenuOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden py-2 fade-scale">
                    {categoriasUnicas.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => { setCategoriaFiltro(cat); setIsFilterMenuOpen(false); }}
                        className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-colors ${categoriaFiltro === cat ? 'text-[#2D6A6A] bg-[#2D6A6A]/5' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid de Productos Móvil */}
             {productosFiltrados.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-medium text-[14px] bg-white rounded-2xl border border-dashed border-gray-200">No se encontraron productos.</div>
             ) : (
               <div className="grid grid-cols-2 gap-3">
                 {productosFiltrados.map(prod => (
                   <MobileProductCard key={prod.id} prod={prod} />
                 ))}
               </div>
             )}
          </div>

          {/* Botón flotante Back to Top interno del modal */}
          {showBackToTop && (
             <button 
               onClick={() => document.getElementById('mobile-catalog-container').scrollTo({top: 0, behavior: 'smooth'})} 
               className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[#2D6A6A] border border-gray-200 z-[420] active:scale-95 transition-transform fade-scale"
             >
               <ArrowUp className="w-6 h-6" />
             </button>
          )}
        </div>
      )}

      {/* MODAL DETALLE DE PRODUCTO AMPLIADO (CORREGIDO REFERENCIAS) */}
      {productoSeleccionado && (
        <div 
          id="modal-overlay"
          onClick={handleCerrarModal}
          className="fixed inset-0 z-[500] bg-[#1A3D3D]/85 backdrop-blur-sm flex items-center justify-center p-2 md:p-8 fade-scale"
        >
          <div className="bg-white rounded-[32px] w-full max-w-5xl h-auto max-h-[95vh] md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-gray-100 text-left animate-in zoom-in duration-300">
            
            {/* Botón Cerrar */}
            <button 
              onClick={() => setProductoSeleccionado(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-colors z-50 border border-gray-100 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Columna Izquierda: Galería de Imágenes */}
            <div className="md:w-1/2 bg-[#F9FBFA] p-6 md:p-8 flex flex-col h-[45vh] md:h-full relative shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
              {/* Imagen Principal */}
              <div className="flex-1 flex items-center justify-center min-h-0 mb-6 relative w-full px-10 md:px-12">
                {/* Flechas Navegación Imagen */}
                {(productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 1) && (
                  <button onClick={handlePrevImage} className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 bg-white/80 border border-gray-100 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-white transition-all shadow-md active:scale-95 z-20 backdrop-blur-sm">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="w-full h-full relative flex items-center justify-center">
                  {/* Etiquetas en imagen */}
                  <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                    <span className="bg-[#1A3D3D] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                      {productoSeleccionado.categoria || 'General'}
                    </span>
                    {productoSeleccionado.etiqueta && (
                      <span className={`text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm w-fit ${productoSeleccionado.etiqueta === 'Nuevo' ? 'bg-[#E4405F]' : 'bg-amber-500'}`}>
                        {productoSeleccionado.etiqueta}
                      </span>
                    )}
                  </div>

                  {/* Render Imagen Principal */}
                  {(productoSeleccionado.imagenes && productoSeleccionado.imagenes[imagenActiva]) ? (
                    <img 
                      src={productoSeleccionado.imagenes[imagenActiva]} 
                      alt={`${productoSeleccionado.titulo}`} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply transition-opacity duration-200 drop-shadow-sm fade-scale"
                      key={imagenActiva} // Re-monta para animar fade
                    />
                  ) : (
                    <PackageSearch className="w-20 h-20 text-gray-300" />
                  )}
                </div>

                {(productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 1) && (
                  <button onClick={handleNextImage} className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 bg-white/80 border border-gray-100 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-white transition-all shadow-md active:scale-95 z-20 backdrop-blur-sm">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Miniaturas */}
              {(productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 1) && (
                <div className="flex justify-center flex-wrap gap-2 md:gap-3 shrink-0 pb-2">
                  {productoSeleccionado.imagenes.map((imgUrl, index) => (
                    <button 
                      key={index}
                      onClick={() => setImagenActiva(index)}
                      className={`
                        w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200 border
                        ${imagenActiva === index 
                          ? 'border-[#2D6A6A] shadow-md ring-2 ring-[#2D6A6A]/15' 
                          : 'border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200 hover:shadow-sm'
                        }
                      `}
                    >
                      <img src={imgUrl} alt="Miniatura" className="w-full h-full object-contain p-1.5 mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha: Detalles y Botón CTA */}
            <div className="md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col bg-white overflow-y-auto custom-scrollbar">
              <div className="pb-8">
                
                <h3 className="text-2xl md:text-3xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4 leading-tight pr-10 mt-2">
                  {productoSeleccionado.titulo}
                </h3>
                
                {/* Caja de Precio */}
                <div className="mb-8 p-5 bg-[#F4F7F7] rounded-2xl border border-gray-100 flex flex-col shadow-inner">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Precio Referencial (ARS)</span>
                  <span className="font-black text-[#2D6A6A] text-3xl">{productoSeleccionado.precio ? `$${productoSeleccionado.precio}` : 'Consultar'}</span>
                </div>

                {/* Descripción Larga */}
                {productoSeleccionado.descripcionLarga && (
                  <div className="text-[#333333] font-medium text-[15px] leading-relaxed mb-10 whitespace-pre-line">
                    {productoSeleccionado.descripcionLarga}
                  </div>
                )}

                {/* Viñetas de Características (CORREGIDO: Mapeo directo array strings) */}
                {productoSeleccionado.caracteristicas && productoSeleccionado.caracteristicas.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-5 border-b border-gray-100 pb-3">
                      Características principales
                    </h4>
                    <ul className="space-y-4">
                      {productoSeleccionado.caracteristicas.map((caracTexto, i) => (
                        <li key={i} className="flex items-start gap-3 text-[14px] text-gray-700 font-medium leading-snug">
                          <div className="w-5 h-5 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0 mt-0.5 border border-[#25D366]/15">
                            <Check className="w-3.5 h-3.5 text-[#25D366]" />
                          </div>
                          <span>{caracTexto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botón CTA Consultar WhatsApp (CORREGIDO: Referencia plana whatsappVentas) */}
                <div className="mt-auto pt-8 border-t border-gray-100">
                  <a 
                    href={(proveedor.whatsappActivo && proveedor.whatsappVentas) ? `https://wa.me/${proveedor.whatsappVentas.replace(/[^0-9]/g, '')}?text=Hola, vi el producto "${productoSeleccionado.titulo}" en tu perfil de El Portal Veterinario y me interesa recibir más información.` : '#'}
                    target="_blank" 
                    rel="noreferrer"
                    className={`w-full py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 active:scale-95 ${!(proveedor.whatsappActivo && proveedor.whatsappVentas) ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <MessageCircle className="w-5 h-5" /> Consultar disponibilidad
                  </a>
                  <p className="text-center text-[12px] font-medium text-gray-500 mt-4 leading-relaxed">
                    Serás redirigido a WhatsApp para hablar directamente con el proveedor.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE GLOBAL BACK TO TOP */}
      {showMainBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-[110] w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-xl text-[#2D6A6A] hover:bg-gray-50 transition-all active:scale-95 fade-scale group"
          title="Volver arriba"
        >
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* ==========================================
          ESTILOS CSS LOCALES
      ========================================== */}
      <style>{`
        /* Scrollbar personalizada sutil */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { bg: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { bg: rgba(0,0,0,0.2); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.1) transparent; }

        /* Truncado de texto */
        .limit-text-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* Animaciones */
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade-scale { animation: fadeScale 0.2s ease-out forwards; }

        /* Reveal on Scroll styling */
        .reveal-on-scroll { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
        .reveal-on-scroll.in-view { opacity: 1; transform: translateY(0); }
      `}</style>

    </div>
  );
}

// Componente Loader local simple
const Loader2 = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);