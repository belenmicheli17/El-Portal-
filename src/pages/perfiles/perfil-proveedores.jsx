import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ChevronLeft, ChevronRight, Menu, Phone, Mail, Globe,
  PackageSearch, Truck, CreditCard, Check, ArrowUpRight, X, MessageCircle, FileText, Wrench,
  Facebook, Instagram, Linkedin, Heart, Building2, MapPin, Star, ArrowUp, Filter, Clock,
  Search, Play, Loader2
} from 'lucide-react';

// ==========================================
// FIREBASE IMPORTS
// ==========================================
import { getFirestore, collection, query, limit, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Configuración incrustada para el simulador (Canvas)
const firebaseConfig = {
  apiKey: "AIzaSyA9DsYU4-LEelrXFIiPpk9_nYErpZSqYTM",
  authDomain: "el-portal-veterinario-3ab72.firebaseapp.com",
  projectId: "el-portal-veterinario-3ab72",
  storageBucket: "el-portal-veterinario-3ab72.firebasestorage.app",
  messagingSenderId: "939343810474",
  appId: "1:939343810474:web:8e31c0f498330e85cfe5d3",
  measurementId: "G-6VQ6GT3ZQ9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock de useNavigate
const useNavigate = () => (path) => console.log('Navegando a:', path);

// ==========================================
// DICCIONARIO PARA TRADUCIR BOOLEANOS (True/False) A TEXTOS
// ==========================================
const MAPPINGS = {
  logistica: {
    todoElPais: 'Envíos a todo el país',
    despachoRapido: 'Despacho en 24/48hs',
    transporteConvenir: 'Transporte a convenir',
    retiroLocal: 'Retiro en depósito local',
    embalajeSeguro: 'Embalaje de seguridad'
  },
  pagos: {
    facturaA: 'Emitimos Factura A y B',
    transferencia: 'Desc. por Transferencia',
    tarjetaCredito: 'Cuotas c/ Tarjeta de Crédito',
    echeq: 'Aceptamos E-Cheq',
    financiacionPropia: 'Financiación Propia'
  },
  garantia: {
    oficial: 'Garantía oficial de fábrica',
    tecnicoPropio: 'Servicio técnico propio',
    repuestos: 'Provisión repuestos originales',
    asesoramiento: 'Asesoramiento técnico continuo'
  }
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function PerfilProveedor() {
  const navigate = useNavigate();
  
  // ESTADOS DE DATOS
  const [proveedor, setProveedor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ESTADOS DE UI
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMainBackToTop, setShowMainBackToTop] = useState(false);
  
  // ==========================================
  // CARGAR DATOS DESDE FIREBASE
  // ==========================================
  useEffect(() => {
    const fetchProveedor = async () => {
      try {
        // Para pruebas: Traemos el 1er proveedor de la colección
        const q = query(collection(db, 'proveedores'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          
          // Función auxiliar para convertir los objetos {transferencia: true} a arrays de texto
          const mapToArray = (obj, category) => {
            if (!obj) return [];
            return Object.entries(obj)
              .filter(([_, value]) => value === true)
              .map(([key]) => MAPPINGS[category][key] || key);
          };

          // Armamos el objeto con el formato exacto que necesita tu diseño
          setProveedor({
            nombre: data.nombreEmpresa || "Sin nombre",
            categoria: data.categoria || "Categoría no definida",
            verificado: true, // Por defecto al estar en la plataforma
            fotoPortada: data.banner || "",
            logo: data.foto || "", 
            imagenNosotros: data.imagenNosotros || "",
            videoNosotros: data.videoNosotros || "",
            bioCorta: data.bioCorta || "Sin descripción corta.",
            bioLarga: data.descripcion || "Sin descripción detallada.",
            linkCatalogo: data.linkCatalogo || "",
            contacto: {
              whatsapp: data.whatsappVentas || "",
              email: data.emailVentas || "",
              redes: {
                instagram: data.instagram || "",
                facebook: data.facebook || "",
                linkedin: data.linkedin || ""
              }
            },
            ubicacion: {
              direccion: data.direccion || "Dirección no especificada",
              modalidad: data.modalidadAtencion || "Modalidad no especificada",
              horarios: data.horariosAtencion || "Horarios no especificados",
              mapaUrl: data.mapaUrl || ""
            },
            envios: mapToArray(data.logistica, 'logistica'),
            pagos: mapToArray(data.pagos, 'pagos'),
            garantia: mapToArray(data.garantia, 'garantia'),
            productosDestacados: data.productosDestacados || []
          });
        } else {
          console.error("No se encontró ningún proveedor en la base de datos.");
        }
      } catch (error) {
        console.error("Error conectando con Firebase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProveedor();
  }, []);

  // Lógica combinada de Filtro + Búsqueda (Solo se ejecuta si hay proveedor)
  const productosFiltrados = proveedor ? proveedor.productosDestacados.filter(p => {
    const matchCategoria = categoriaFiltro === "Todos" || p.categoria === categoriaFiltro;
    const matchSearch = p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.descripcionLarga && p.descripcionLarga.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategoria && matchSearch;
  }) : [];

  const categoriasUnicas = proveedor ? ["Todos", ...new Set(proveedor.productosDestacados.map(p => p.categoria))] : ["Todos"];
  const logoGenerado = proveedor ? (proveedor.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(proveedor.nombre)}&backgroundColor=1A3D3D`) : "";

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
    setCurrentIndex(productosFiltrados.length > 3 ? productosFiltrados.length : 0);
  }, [categoriaFiltro, searchQuery, productosFiltrados.length]);

  const handleNextCarousel = () => {
    if (!isCarouselActive) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrevCarousel = () => {
    if (!isCarouselActive) return;
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
  // EFECTOS Y NAVEGACIÓN GENERAL
  // ==========================================
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

    const handleMainScroll = () => {
      setShowMainBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleMainScroll);

    return () => {
      document.head.removeChild(link);
      window.removeEventListener('scroll', handleMainScroll);
    };
  }, [isLoading]); // Se vuelve a ejecutar cuando termina de cargar

  useEffect(() => {
    if (productoSeleccionado || isMobileCatalogOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => document.body.style.overflow = 'auto';
  }, [productoSeleccionado, isMobileCatalogOpen]);

  const handleCerrarModal = (e) => {
    if (e.target.id === 'modal-overlay') setProductoSeleccionado(null);
  };

  const abrirModalProducto = (prod) => {
    setProductoSeleccionado(prod);
    setImagenActiva(0);
  };

  const scrollToCatalogo = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setImagenActiva((prev) => prev === 0 ? productoSeleccionado.imagenes.length - 1 : prev - 1);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setImagenActiva((prev) => prev === productoSeleccionado.imagenes.length - 1 ? 0 : prev + 1);
  };

  // ==========================================
  // PANTALLA DE CARGA
  // ==========================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F7] font-['Montserrat']">
        <Loader2 className="w-12 h-12 text-[#2D6A6A] animate-spin mb-4" />
        <h2 className="text-xl font-black text-[#1A3D3D]">Cargando perfil...</h2>
        <p className="text-gray-500 font-medium">Conectando con la base de datos</p>
      </div>
    );
  }

  // ==========================================
  // PANTALLA DE ERROR / NO ENCONTRADO
  // ==========================================
  if (!proveedor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F7] font-['Inter']">
        <div className="bg-white p-8 rounded-[32px] shadow-sm text-center max-w-md border border-gray-100">
           <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
           <h2 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-2">Perfil no encontrado</h2>
           <p className="text-gray-500 mb-6">Parece que este proveedor aún no ha guardado sus datos en el Editor.</p>
        </div>
      </div>
    );
  }

  const DesktopProductCard = ({ prod }) => (
    <article onClick={() => abrirModalProducto(prod)} className="bg-white border border-gray-200 rounded-[24px] hover:border-[#2D6A6A]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col text-left cursor-pointer overflow-hidden h-full">
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
          <img src={prod.imagenes[0]} alt={prod.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50"><PackageSearch className="w-8 h-8 text-gray-300"/></div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-[15px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-4 flex-1">
          {prod.titulo}
        </h3>
        <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-4">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">Precio ARS</span>
            <span className="font-black text-[#2D6A6A] text-lg">{prod.precio ? `$${prod.precio}` : 'Consultar'}</span>
          </div>
          <div className="w-9 h-9 bg-[#F4F7F7] rounded-xl flex items-center justify-center text-[#2D6A6A] group-hover:bg-[#2D6A6A] group-hover:text-white transition-colors shadow-inner">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <div className="bg-[#F4F7F7] font-['Inter'] antialiased min-h-screen relative text-[#333333] text-left overflow-x-hidden selection:bg-[#2D6A6A] selection:text-white">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-[100] h-[72px] bg-white/90 backdrop-blur-lg border-b border-gray-100 flex items-center px-8 md:px-10">
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">
            <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-2xl tracking-tighter cursor-pointer">
                El Portal<span className="text-[#2D6A6A]">.</span>
            </div>
            <div className="hidden lg:flex items-center gap-8 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                <a href="#nosotros" className="hover:text-[#2D6A6A] transition-colors">Empresa</a>
                <a href="#catalogo" className="hover:text-[#2D6A6A] transition-colors">Catálogo</a>
                <a href="#condiciones" className="hover:text-[#2D6A6A] transition-colors">Condiciones</a>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-[#1A3D3D] lg:hidden">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
        </div>
      </nav>

      {/* SECCIÓN EDITORIAL SUPERIOR */}
      <main className="w-full bg-white pt-[72px]">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">

          <div className="pt-8 pb-2 flex flex-wrap items-center gap-2 text-xs md:text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
             <button onClick={() => { navigate('/'); window.scrollTo(0,0); }} className="hover:text-[#2D6A6A] transition-colors">Inicio</button>
             <ChevronRight className="w-3 h-3 text-gray-300" />
             <button onClick={() => { navigate('/directorio'); window.scrollTo(0,0); }} className="hover:text-[#2D6A6A] transition-colors">Directorio</button>
             <ChevronRight className="w-3 h-3 text-gray-300" />
             <span className="text-[#1A3D3D]">{proveedor.nombre}</span>
          </div>

          {proveedor.fotoPortada && (
            <div className="w-full h-[180px] md:h-[260px] rounded-[24px] overflow-hidden mt-4 shadow-sm border border-gray-100 relative fade-scale">
              <img src={proveedor.fotoPortada} alt="Fondo Empresa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A3D3D]/60 to-transparent mix-blend-multiply"></div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 relative z-10 px-2 lg:px-6">
            
            <div className="lg:w-[65%] w-full flex flex-col">
              
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 text-left -mt-16 md:-mt-20 relative z-20">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl p-1.5 shadow-lg border border-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                  {proveedor.logo ? (
                    <img src={proveedor.logo} alt={proveedor.nombre} className="w-full h-full rounded-[20px] object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-3 mb-3">
                    {proveedor.verificado && (
                      <div className="flex items-center gap-1.5 text-[#2D6A6A] bg-[#F4F7F7] border border-[#2D6A6A]/10 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                      </div>
                    )}
                    <span className="text-gray-500 font-bold text-[11px] uppercase tracking-widest">{proveedor.categoria}</span>
                  </div>
                  <h1 className="text-3xl md:text-[46px] font-black text-[#1A3D3D] leading-none tracking-tight font-['Montserrat']">
                    {proveedor.nombre}
                  </h1>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[15px] md:text-[17px] text-gray-600 font-medium leading-relaxed max-w-2xl">
                  {proveedor.bioCorta}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={scrollToCatalogo} className="inline-flex items-center justify-center gap-2.5 bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-[#2D6A6A] hover:-translate-y-0.5 transition-all active:scale-95 tracking-widest">
                    <PackageSearch className="w-4 h-4" /> Ver Catálogo
                  </button>
                  {proveedor.linkCatalogo && (
                    <a href={proveedor.linkCatalogo} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-[#1A3D3D] px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-all active:scale-95 tracking-widest">
                      <FileText className="w-4 h-4 text-[#2D6A6A]" /> Lista de Precios
                    </a>
                  )}
                </div>
              </div>

              <hr className="w-full border-t border-gray-100 my-4 md:my-5" />

              <section id="nosotros" className="w-full text-left reveal-on-scroll">
                <div className="mb-6">
                  <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1 text-left">Trayectoria y Compromiso</h3>
                  <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-left">Sobre la Empresa</h2>
                </div>
                <p className="text-gray-600 text-[15px] md:text-[16px] leading-relaxed font-medium mb-8 whitespace-pre-line">
                  {proveedor.bioLarga}
                </p>

                {proveedor.imagenNosotros && (
                  <div 
                    className={`w-full h-[240px] md:h-[320px] rounded-[24px] overflow-hidden relative shadow-sm border border-gray-100 group ${proveedor.videoNosotros ? 'cursor-pointer' : ''}`}
                    onClick={() => proveedor.videoNosotros && window.open(proveedor.videoNosotros, '_blank')}
                  >
                    <img src={proveedor.imagenNosotros} alt="Instalaciones / Equipo" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    {proveedor.videoNosotros && (
                      <div className="absolute inset-0 bg-[#1A3D3D]/10 group-hover:bg-[#1A3D3D]/30 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#1A3D3D] shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 ml-1 fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

            </div>

            <aside className="lg:w-[35%] w-full">
              <div className="sticky top-[100px] bg-[#F9FBFA] rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col text-left reveal-on-scroll mt-4 lg:mt-16">
                
                <h3 className="text-[#1A3D3D] font-black font-['Montserrat'] text-[18px] mb-8 pb-4 border-b border-gray-200/60">
                  Información del Proveedor
                </h3>

                <div className="flex flex-col gap-3">
                  
                  {proveedor.contacto.whatsapp && (
                    <a href={`https://wa.me/${proveedor.contacto.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-sm tracking-widest hover:bg-[#20bd5a] transition-colors w-full mb-2">
                      <Phone className="w-4 h-4" /> Hablar por WhatsApp
                    </a>
                  )}

                  <a href={proveedor.ubicacion.mapaUrl || "#"} target="_blank" rel="noreferrer" className="block bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#2D6A6A]/30 transition-all group relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] group-hover:bg-[#2D6A6A] group-hover:text-white transition-colors shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Sede Central</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#2D6A6A] transition-colors" />
                    </div>
                    
                    <p className="text-[#1A3D3D] font-bold text-[15px] leading-snug mb-5">{proveedor.ubicacion.direccion}</p>
                    
                    <div className="pt-4 border-t border-gray-100/60">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-3">Atención al cliente</p>
                       <p className="text-[#1A3D3D] font-medium text-[13px] leading-relaxed mb-3">{proveedor.ubicacion.modalidad}</p>
                       <p className="text-gray-600 font-semibold text-[13px] leading-relaxed flex items-center gap-2">
                           <Clock className="w-4 h-4 text-[#2D6A6A]" /> {proveedor.ubicacion.horarios}
                       </p>
                    </div>
                  </a>

                  {/* Redes Sociales */}
                  {(proveedor.contacto.redes.instagram || proveedor.contacto.redes.facebook || proveedor.contacto.redes.linkedin) && (
                    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-2">Redes Sociales</p>
                        <div className="flex gap-2">
                           {proveedor.contacto.redes.instagram && (
                             <a href={proveedor.contacto.redes.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white transition-all shadow-sm">
                               <Instagram className="w-4 h-4" />
                             </a>
                           )}
                           {proveedor.contacto.redes.facebook && (
                             <a href={proveedor.contacto.redes.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all shadow-sm">
                               <Facebook className="w-4 h-4" />
                             </a>
                           )}
                           {proveedor.contacto.redes.linkedin && (
                             <a href={proveedor.contacto.redes.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center text-gray-400 hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm">
                               <Linkedin className="w-4 h-4" />
                             </a>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {proveedor.contacto.email && (
                    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="w-12 h-12 bg-[#2D6A6A]/10 rounded-xl flex items-center justify-center text-[#2D6A6A] shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1.5">Email Comercial</p>
                        <p className="text-[#1A3D3D] font-bold text-[13px] leading-snug break-words">{proveedor.contacto.email}</p>
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
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          
          <section id="catalogo" className="w-full bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-gray-100 text-left reveal-on-scroll mb-8">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative">
              <div className="flex-1">
                <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1 text-left">Equipamiento</h3>
                <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-left">Catálogo Destacado</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-30">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar equipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-56 lg:w-64 pl-10 pr-4 py-3 rounded-xl text-[13px] font-bold bg-white border border-gray-200 focus:outline-none focus:border-[#2D6A6A] focus:ring-1 focus:ring-[#2D6A6A] shadow-sm transition-all"
                  />
                </div>

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

            <div className="hidden md:block">
              {productosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-medium text-[14px]">
                   No se encontraron equipos que coincidan con la búsqueda.
                </div>
              ) : !isDesktopExpanded ? (
                <div className="relative w-full px-12 md:px-14">
                  {isCarouselActive && (
                    <button onClick={handlePrevCarousel} className="absolute left-0 top-[40%] -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-all shadow-md active:scale-95">
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}
                  <div className="-mx-3">
                    <div className="overflow-hidden w-full relative py-2">
                      <div 
                        className="flex items-stretch"
                        style={isCarouselActive ? {
                          width: `${(carouselItems.length / 3) * 100}%`,
                          transform: `translateX(-${(currentIndex / carouselItems.length) * 100}%)`,
                          transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                        } : { width: '100%' }}
                        onTransitionEnd={handleCarouselTransitionEnd}
                      >
                        {carouselItems.map((prod, idx) => (
                          <div 
                            key={`${prod.id}-${idx}`} 
                            className="px-3 shrink-0"
                            style={isCarouselActive ? { width: `${100 / carouselItems.length}%` } : { width: '33.333333%' }}
                          >
                            <div className="h-full">
                              <DesktopProductCard prod={prod} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isCarouselActive && (
                    <button onClick={handleNextCarousel} className="absolute right-0 top-[40%] -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-all shadow-md active:scale-95">
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-6 fade-scale">
                  {productosFiltrados.map(prod => (
                    <div key={prod.id} className="h-full">
                      <DesktopProductCard prod={prod} />
                    </div>
                  ))}
                </div>
              )}

              {totalItems > 3 && (
                <div className="mt-4 pt-6 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={() => setIsDesktopExpanded(!isDesktopExpanded)} 
                    className="px-10 py-4 bg-white border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[11px] text-[#1A3D3D] shadow-sm hover:border-[#2D6A6A] transition-all flex items-center gap-2 active:scale-95"
                  >
                    <PackageSearch className="w-4 h-4" />
                    {isDesktopExpanded ? 'Ver menos' : `Ver catálogo completo (${totalItems})`}
                  </button>
                </div>
              )}
            </div>

            <div className="md:hidden flex flex-col mt-4">
              {productosFiltrados.length === 0 ? (
                 <div className="py-8 text-center text-gray-500 font-medium text-[13px]">No hay resultados.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {productosFiltrados.slice(0, 4).map(prod => (
                    <article key={prod.id} onClick={() => abrirModalProducto(prod)} className="bg-white rounded-[16px] shadow-sm border border-gray-100 flex flex-col overflow-hidden cursor-pointer relative">
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
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="text-[12px] font-bold text-[#1A3D3D] leading-snug mb-2" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{prod.titulo}</h3>
                        <span className="font-black text-[#2D6A6A] text-[14px] mt-auto pt-1">{prod.precio ? `$${prod.precio}` : 'Consultar'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              
              {productosFiltrados.length > 0 && (
                <button 
                  onClick={() => setIsMobileCatalogOpen(true)}
                  className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[11px] text-[#1A3D3D] flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <PackageSearch className="w-4 h-4" />
                  Ver catálogo completo ({totalItems})
                </button>
              )}
            </div>
          </section>

          <section id="condiciones" className="w-full bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 text-left reveal-on-scroll">
            <div className="mb-8 border-b border-gray-100 pb-6">
              <h3 className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest mb-1 text-left">Términos</h3>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight text-left">Condiciones Comerciales</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              <div className="flex flex-col">
                <h4 className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  Logística y Envíos
                </h4>
                {proveedor.envios.length > 0 ? (
                  <ul className="space-y-4">
                    {proveedor.envios.map((punto, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
                        <span className="text-[15px] font-medium text-gray-800 leading-snug">{punto}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic">No especificado.</p>}
              </div>

              <div className="flex flex-col">
                <h4 className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  Medios de Pago
                </h4>
                {proveedor.pagos.length > 0 ? (
                  <ul className="space-y-4">
                    {proveedor.pagos.map((punto, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
                        <span className="text-[15px] font-medium text-gray-800 leading-snug">{punto}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic">No especificado.</p>}
              </div>

              <div className="flex flex-col">
                <h4 className="text-[13px] text-gray-500 font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  Post-Venta
                </h4>
                {proveedor.garantia.length > 0 ? (
                  <ul className="space-y-4">
                    {proveedor.garantia.map((punto, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
                        <span className="text-[15px] font-medium text-gray-800 leading-snug">{punto}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic">No especificado.</p>}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* MODAL CATÁLOGO MÓVIL */}
      {isMobileCatalogOpen && (
        <div 
          id="mobile-catalog-container"
          className="fixed inset-0 z-[400] bg-[#F4F7F7] overflow-y-auto fade-scale md:hidden"
          onScroll={(e) => setShowBackToTop(e.target.scrollTop > 300)}
        >
          <div className="sticky top-0 z-[410] bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm">
             <button onClick={() => setIsMobileCatalogOpen(false)} className="flex items-center gap-2 text-[#2D6A6A] font-bold text-[14px]">
               <ChevronLeft className="w-5 h-5" /> Volver
             </button>
             <span className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px]">Catálogo</span>
          </div>

          <div className="p-4 pb-20">
             <div className="flex flex-col gap-3 mb-6 relative">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar equipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] font-bold bg-white border border-gray-200 focus:outline-none focus:border-[#2D6A6A] shadow-sm"
                  />
                </div>

                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="w-full px-5 py-3 rounded-xl text-[13px] font-bold bg-white text-[#1A3D3D] border border-gray-200 flex items-center justify-between shadow-sm"
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

             {productosFiltrados.length === 0 ? (
                <div className="py-10 text-center text-gray-500 font-medium text-[14px]">No se encontraron equipos.</div>
             ) : (
               <div className="grid grid-cols-2 gap-3">
                 {productosFiltrados.map(prod => (
                   <article key={prod.id} onClick={() => abrirModalProducto(prod)} className="bg-white rounded-[16px] shadow-sm border border-gray-100 flex flex-col overflow-hidden cursor-pointer relative">
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
                         <h3 className="text-[12px] font-bold text-[#1A3D3D] leading-snug mb-2" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{prod.titulo}</h3>
                         <span className="font-black text-[#2D6A6A] text-[15px]">{prod.precio ? `$${prod.precio}` : 'Consultar'}</span>
                      </div>
                   </article>
                 ))}
               </div>
             )}
          </div>

          {showBackToTop && (
             <button 
               onClick={() => document.getElementById('mobile-catalog-container').scrollTo({top: 0, behavior: 'smooth'})} 
               className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[#2D6A6A] border border-gray-200 z-[420] active:scale-95 transition-transform"
             >
               <ArrowUp className="w-6 h-6" />
             </button>
          )}
        </div>
      )}

      {/* MODAL DETALLE DE PRODUCTO AMPLIADO */}
      {productoSeleccionado && (
        <div 
          id="modal-overlay"
          onClick={handleCerrarModal}
          className="fixed inset-0 z-[500] bg-[#1A3D3D]/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 fade-scale"
        >
          <div className="bg-white rounded-[32px] w-full max-w-5xl h-auto max-h-[90vh] md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-gray-100 text-left">
            
            <button 
              onClick={() => setProductoSeleccionado(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-colors z-50 border border-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Columna Izquierda Modal */}
            <div className="md:w-1/2 bg-[#F9FBFA] p-6 md:p-8 flex flex-col h-[40vh] md:h-full relative shrink-0 border-r border-gray-100">
              <div className="flex-1 flex items-center justify-center min-h-0 mb-6 relative w-full px-12 md:px-14">
                {(productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 1) && (
                  <button 
                    onClick={handlePrevImage} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-all shadow-md active:scale-95 z-20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="w-full h-full relative flex items-center justify-center">
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

                  {(productoSeleccionado.imagenes && productoSeleccionado.imagenes[imagenActiva]) ? (
                    <img 
                      src={productoSeleccionado.imagenes[imagenActiva]} 
                      alt={`${productoSeleccionado.titulo}`} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply transition-opacity duration-300 drop-shadow-sm fade-scale"
                      key={imagenActiva}
                    />
                  ) : (
                    <PackageSearch className="w-20 h-20 text-gray-300" />
                  )}
                </div>

                {(productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 1) && (
                  <button 
                    onClick={handleNextImage} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1A3D3D] hover:bg-gray-50 transition-all shadow-md active:scale-95 z-20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {(productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 1) && (
                <div className="flex justify-center flex-wrap gap-2 md:gap-3 shrink-0">
                  {productoSeleccionado.imagenes.map((imgUrl, index) => (
                    <button 
                      key={index}
                      onClick={() => setImagenActiva(index)}
                      className={`
                        w-14 h-14 md:w-20 md:h-20 rounded-xl bg-white flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200 border
                        ${imagenActiva === index 
                          ? 'border-[#2D6A6A] shadow-md ring-2 ring-[#2D6A6A]/10' 
                          : 'border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-300'
                        }
                      `}
                    >
                      <img src={imgUrl} alt="Miniatura" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha Modal */}
            <div className="md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col bg-white overflow-y-auto no-scrollbar">
              <div className="pb-8">
                
                <h3 className="text-3xl md:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4 leading-tight pr-10 mt-2">
                  {productoSeleccionado.titulo}
                </h3>
                
                <div className="mb-8 p-6 bg-[#F4F7F7] rounded-[24px] border border-gray-100 flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Precio Referencial (ARS)</span>
                  <span className="font-black text-[#2D6A6A] text-3xl">{productoSeleccionado.precio ? `$${productoSeleccionado.precio}` : 'Consultar'}</span>
                </div>

                {productoSeleccionado.descripcionLarga && (
                  <div className="text-[#333333] font-medium text-[15px] leading-relaxed mb-10">
                    <p>{productoSeleccionado.descripcionLarga}</p>
                  </div>
                )}

                {productoSeleccionado.caracteristicas && productoSeleccionado.caracteristicas.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-5 border-b border-gray-100 pb-3">
                      Características principales
                    </h4>
                    <ul className="space-y-4">
                      {productoSeleccionado.caracteristicas.map((carac, i) => (
                        <li key={i} className="flex items-center gap-3 text-[14px] text-gray-700 font-medium">
                          <div className="w-6 h-6 rounded-full bg-[#2D6A6A]/10 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-[#2D6A6A]" />
                          </div>
                          <span className="leading-snug">{carac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 pt-8 border-t border-gray-100">
                  <a 
                    href={proveedor.contacto.whatsapp ? `https://wa.me/${proveedor.contacto.whatsapp.replace(/\+/g, '')}?text=Hola, estoy viendo el perfil de ${proveedor.nombre} en El Portal y me gustaría consultar por el equipo: ${productoSeleccionado.titulo}.` : '#'}
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-sm hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" /> Consultar disponibilidad
                  </a>
                  <p className="text-center text-[12px] font-medium text-gray-500 mt-4">
                    Serás redirigido a WhatsApp para hablar con ventas.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE BACK TO TOP */}
      {showMainBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-[110] w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg text-[#2D6A6A] hover:bg-gray-50 transition-all active:scale-95"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* FOOTER */}
      <footer className="w-full bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] pt-8 pb-6 text-white text-left mt-8">
        <div className="max-w-[1100px] mx-auto px-8 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-10 mb-8 border-b border-white/5 pb-8 text-left">
            <div className="md:col-span-1 text-left">
              <h4 className="font-['Montserrat'] font-black text-2xl mb-4 leading-none text-left">
                El Portal<span className="opacity-40">.</span>
              </h4>
              <p className="text-white/50 text-[13px] leading-relaxed text-left">
                La red profesional exclusiva para medicina veterinaria. <br />Perfil Oficial de {proveedor.nombre}.
              </p>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-[10px] uppercase tracking-widest mb-4 opacity-60 text-left">Plataforma</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li>Bolsa de Trabajo</li>
                <li>Insumos Médicos</li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-[10px] uppercase tracking-widest mb-4 opacity-60 text-left">Soporte</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li>Centro de Ayuda</li>
                <li>Términos y Privacidad</li>
              </ul>
            </div>

            <div className="text-center md:text-right">
                <div className="flex justify-center md:justify-end gap-4 mb-6">
                   {proveedor.contacto.redes.instagram && <a href={proveedor.contacto.redes.instagram} target="_blank" rel="noreferrer"><Instagram className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity text-white" /></a>}
                   {proveedor.contacto.redes.facebook && <a href={proveedor.contacto.redes.facebook} target="_blank" rel="noreferrer"><Facebook className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity text-white" /></a>}
                   {proveedor.contacto.redes.linkedin && <a href={proveedor.contacto.redes.linkedin} target="_blank" rel="noreferrer"><Linkedin className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity text-white" /></a>}
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold opacity-30">
            <p>&copy; {new Date().getFullYear()} El Portal. Belén M. Arenas</p>
            <div className="flex items-center gap-2">Hecho con <Heart className="w-3 h-3 text-red-400 fill-current" /> en Argentina</div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Perfil Oficial Verificado
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================== */}
      {/* ANIMACIONES CSS PURAS */}
      {/* ========================================== */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .fade-scale {
          animation: fadeScale 0.3s ease-out forwards;
        }
      `}</style>

    </div>
  );
}