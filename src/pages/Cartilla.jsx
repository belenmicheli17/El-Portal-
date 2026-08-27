import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  Search, MapPin, Home, 
  ChevronRight, Award, Dog, Cat, Filter, 
  Heart, Stethoscope, Layers, ChevronDown,
  Bird, Rabbit, PawPrint, Hospital, TreeDeciduous 
} from 'lucide-react';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import TourGuia from '../components/TourGuia';
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
  const { currentUser } = useAuth();

  // TODOS LOS HOOKS DECLARADOS AL PRINCIPIO (regla de React)
  const [searchParams, setSearchParams] = useSearchParams();
  // Sincronizamos activeTab con la URL: si hay filtro de guardia arrancamos en 'clinicas'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('guardia24hs') === 'true' ? 'clinicas' : 'especialistas';
  });
  const [mostrarTourCartilla, setMostrarTourCartilla] = useState(false);
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUrgenciaBox, setShowUrgenciaBox] = useState(true);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  if (!currentUser) return;
  const fetchContador = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
      const visto = snap.data()?.tourVisto?.cartilla || false;
      if (!visto) setTimeout(() => setMostrarTourCartilla(true), 1000);
    } catch (e) {
      console.error('Error leyendo tour cartilla:', e);
    }
  };
  fetchContador();
}, [currentUser]);

const editorUrl = currentUser?.rol === 'clinica'
  ? '/editor-clinica'
  : currentUser?.rol === 'proveedor'
  ? '/editor-proveedores'
  : '/editor-profesional';

const PASOS_CARTILLA = [
    {
      targetId: 'tour-grid-todos',
      titulo: 'Tu perfil aparece acá',
      desc: `Para aparecer en esta sección, tenes que completar tu perfil desde el editor para que los tutores y colegas puedan ver toda tu información.<button onclick="window.location.href='${editorUrl}'" style="background:#2D6A6A;color:white;padding:8px 18px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:none;cursor:pointer;margin-top:4px">Ir al editor →</button>`,
      posicion: 'arriba'
    }
  ];


  
  // Sincroniza la tab activa cuando cambian los searchParams (ej: volver atrás con el browser)
  useEffect(() => {
    if (searchParams.get('guardia24hs') === 'true') {
      setActiveTab('clinicas');
    }
  }, [searchParams]);

  // SEO dinámico: cuando el filtro de guardia está activo, cambiamos el título y meta descripción
  useEffect(() => {
    
    const esUrgencia = searchParams.get('guardia24hs') === 'true';
    if (esUrgencia) {
      document.title = 'Guardia veterinaria 24hs cerca tuyo | El Portal Veterinario';
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = 'Encontrá clínicas veterinarias con guardia 24 horas cerca tuyo. Atención de urgencias para tu mascota en cualquier momento.';
    } else {
      document.title = 'Cartilla Veterinaria | El Portal Veterinario';
      let meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = 'La primera cartilla veterinaria de Argentina. Encontrá especialistas, clínicas y centros de alta complejidad para tu mascota.';
    }
  }, [searchParams]);

  // Geolocalización: pide permiso de ubicación y ordena resultados por distancia
  const calcularDistancia = (lat1, lng1, lat2, lng2) => {
    if (!lat2 || !lng2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleBuscarCercana = () => {
    if (!navigator.geolocation) {
      setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('guardia24hs', 'true'); return p; });
      setShowUrgenciaBox(false);
      setActiveTab('clinicas');
      return;
    }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Filtramos solo guardias y ordenamos por distancia
        setVeterinarios(prev => {
          const conGuardia = prev.filter(v => v.guardia24hs);
          const sinGuardia = prev.filter(v => !v.guardia24hs);
          const ordenadas = conGuardia.sort((a, b) =>
            calcularDistancia(latitude, longitude, a.lat, a.lng) -
            calcularDistancia(latitude, longitude, b.lat, b.lng)
          );
          return [...ordenadas, ...sinGuardia];
        });
        setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('guardia24hs', 'true'); return p; });
        setBuscandoUbicacion(false);
        setShowUrgenciaBox(false);
        setActiveTab('clinicas');
      },
      () => {
        // Si rechaza el permiso, igual filtramos pero sin ordenar por distancia
        setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('guardia24hs', 'true'); return p; });
        setBuscandoUbicacion(false);
        setShowUrgenciaBox(false);
        setActiveTab('clinicas');
      }
    );
  };


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
        // Consultamos profesionales y clínicas en paralelo
        const [snapProfesionales, snapClinicas] = await Promise.all([
          getDocs(collection(db, 'profesionales')),
          getDocs(collection(db, 'clinicas'))
        ]);

        const profesionalesData = [];
        snapProfesionales.forEach((doc) => {
          const data = doc.data();
          const opcionesProfesional = data.servicios
            ? Array.isArray(data.servicios)
              ? data.servicios.map(s => s.titulo)
              : Object.values(data.servicios)
                  .filter(s => s.activo)
                  .flatMap(s => [
                    ...(s.subOpcionesSeleccionadas || []),
                    ...(s.serviciosPersonalizados || [])
                  ])
            : [];

          profesionalesData.push({
            ...data,
            id: data.slug || doc.id,
            tipo: 'profesional',
            domicilio: data.atiendeDomicilio || false,
            servicios: opcionesProfesional,
            opcionesFiltro: opcionesProfesional
          });
        });

        const clinicasData = [];
        snapClinicas.forEach((doc) => {
          const data = doc.data();
          // Solo mostramos clínicas que tengan nombre y dirección cargados
          if (!data.nombre?.trim()) return;

          // Extraemos las sub-opciones seleccionadas para que el filtro de especialidades funcione
          const opcionesClinica = data.servicios && !Array.isArray(data.servicios)
            ? Object.values(data.servicios)
                .filter(s => s.activo)
                .flatMap(s => [
                  ...(s.subOpcionesSeleccionadas || []),
                  ...(s.serviciosPersonalizados || [])
                ])
            : [];

          clinicasData.push({
            ...data,
            id: data.slug || doc.id,
            tipo: 'clinica',
            opcionesFiltro: opcionesClinica,
            // Extraemos los nombres de los servicios activos para las etiquetas visuales
            servicios: data.servicios && !Array.isArray(data.servicios)
              ? Object.entries(data.servicios)
                  .filter(([_, s]) => s.activo)
                  .map(([_, s]) => {
                    const infoBase = {
                      guardia: 'Guardia e Internación', consulta: 'Clínica Médica',
                      especialidades: 'Especialidades', cirugia: 'Quirófano',
                      imagenes: 'Diagnóstico por Imágenes', laboratorio: 'Laboratorio',
                      odontologia: 'Odontología', rehabilitacion: 'Fisiatría'
                    };
                    return infoBase[_] || _;
                  })
              : []
          });
        });

        const shuffleArray = (array) => {
          let shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };

        const todosLosItems = [...profesionalesData, ...clinicasData];
        const premium = shuffleArray(todosLosItems.filter(d => d.planActual === 'pro'));
        const free = shuffleArray(todosLosItems.filter(d => d.planActual !== 'pro'));

        setVeterinarios([...premium, ...free]);
      } catch (error) {
        console.error("Error cargando la cartilla desde Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  // Filtros desde la URL

  const getParam = (key) => searchParams.get(key) ? searchParams.get(key).split(',') : [];

  const filtros = React.useMemo(() => ({
    zonas: searchParams.get('zonas') ? searchParams.get('zonas').split(',') : [],
    mascotas: searchParams.get('mascotas') ? searchParams.get('mascotas').split(',') : [],
    especialidades: searchParams.get('especialidades') ? searchParams.get('especialidades').split(',') : [],
    domicilio: searchParams.get('domicilio') === 'true',
    guardia24hs: searchParams.get('guardia24hs') === 'true'
  }), [searchParams]);

  

// 4. EL MOTOR DE FILTRADO: Procesa los datos antes de dibujarlos
  // 4. EL MOTOR DE FILTRADO (Inteligente: ignora tildes y mayúsculas)
  const normalizar = (texto) => 
    texto ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const limpiarFiltros = () => {
    setSearchParams({});
    setSearchTerm('');
  };

    // Filtros dinámicos: solo muestran opciones que tienen al menos 1 resultado
  const provinciasDisponibles = useMemo(() => {
    const conteo = {};
    veterinarios.forEach(v => {
      if (v.provincia) conteo[v.provincia] = (conteo[v.provincia] || 0) + 1;
    });
    return conteo;
  }, [veterinarios]);

  const especialidadesDisponibles = useMemo(() => {
    const conteo = {};
    veterinarios.forEach(v => {
      (v.opcionesFiltro || []).forEach(esp => {
        if (esp) conteo[esp] = (conteo[esp] || 0) + 1;
      });
    });
    return conteo;
  }, [veterinarios]);

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
    console.log('filtros activos:', JSON.stringify(filtros));
    if (filtros.zonas.length > 0 && !filtros.zonas.includes(v.provincia)) return false;
    if (filtros.especialidades.length > 0) {
      if (v.tipo === 'profesional') {
        // Busca en subOpcionesSeleccionadas y serviciosPersonalizados de todos los grupos activos
        const opcionesProfesional = v.opcionesFiltro || v.servicios || [];
        const tieneAlguna = filtros.especialidades.some(f => opcionesProfesional.includes(f));
        if (!tieneAlguna) return false;
      } else if (v.tipo === 'clinica') {
        // Para clínicas: las opciones ya vienen procesadas en el array "servicios"
        const opcionesClinica = v.opcionesFiltro || (Array.isArray(v.servicios) ? v.servicios : []);
        const tieneAlguna = filtros.especialidades.some(f => opcionesClinica.includes(f));
        if (!tieneAlguna) return false;
      }
    }
    if (filtros.domicilio && !v.domicilio) return false;
    if (filtros.guardia24hs && !v.guardia24hs) return false;
    
    console.log('profesional:', v.nombre, '| opcionesFiltro:', v.opcionesFiltro, '| filtros.especialidades:', filtros.especialidades);
    return true;
  });
  
 return (
    <>
      {/* CARTELITO DE URGENCIA — Portal al body para evitar overflow-hidden del main */}
      {showUrgenciaBox && createPortal(
        <div className="fixed top-24 right-8 w-[280px] bg-white border border-red-200 p-5 rounded-2xl shadow-2xl z-[200] animate-in fade-in slide-in-from-right-8 hidden md:block">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-red-600 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              ¿Urgencia veterinaria?
            </h4>
            <button onClick={() => setShowUrgenciaBox(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <p className="text-gray-500 text-[12px] font-medium leading-relaxed mb-3 md:mb-4">
            Encontrá la guardia veterinaria más cercana a tu ubicación ahora mismo.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleBuscarCercana}
              disabled={buscandoUbicacion}
              className="w-full bg-red-600 text-white hover:bg-red-700 transition-colors py-2 md:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {buscandoUbicacion ? (
                <>
                  <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Buscando...
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" /> Guardia más cercana
                </>
              )}
            </button>
            <button
              onClick={() => setShowUrgenciaBox(false)}
              className="hidden md:block w-full bg-[#F4F7F7] text-[#1A3D3D] hover:bg-gray-200 transition-colors py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}

      <main className="min-h-screen bg-[#F9F5F0] pb-24 relative flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500 overflow-hidden">
        {/* BURBUJAS DE FONDO LIBRES */}
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#4DB6AC]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[#FF9800]/30 rounded-full blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-[#4DB6AC]/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

        {/* HEADER B2C */}
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
            { id: 'especialistas', label: 'Especialistas', icon: Stethoscope, tourId: 'tour-tab-especialistas' },
            { id: 'clinicas', label: 'Clínicas', icon: Hospital }
          ]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchPlaceholder="Ej: Dermatólogo, San Isidro, Vacunación..."
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showModalidad={true}
          provinciasDisponibles={provinciasDisponibles}
          especialidadesDisponibles={especialidadesDisponibles}
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
                  const renderCard = (item) => {
                    const isProfesional = item.tipo === 'profesional';
                    const nameParts = item.nombre ? item.nombre.split(' ') : [''];
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ');

                    return (
                      <article
                        key={item.id}
                        onClick={() => navigate(`/${item.tipo}/${item.id}`)}
                        className={`bg-white rounded-[24px] p-4 sm:p-5 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer group flex flex-col relative mt-6 sm:mt-4 z-20 ${isProfesional ? 'text-center' : ''}`}
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
                          item.guardia24hs && (
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
                                <span className="block truncate">{item.nombre} {item.apellido || lastName}</span>
                              </h2>
                            </div>
                            <div className="mb-0 flex flex-col gap-1.5">
                              <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-3 py-2 rounded-xl w-full">
                                <span className="text-[#2D6A6A] text-[12px] sm:text-[13px] font-semibold leading-[1.3] break-words">
                                  {item.especialidad}
                                </span>
                              </span>
                              {item.opcionesFiltro && item.opcionesFiltro.length > 0 && (
                                <span className="px-3 pb-0 pt-1 w-full text-[11px] sm:text-[12px] font-medium text-[#333333] leading-relaxed">
                                  {item.opcionesFiltro.slice(0, 4).join(', ')}
                                  {item.opcionesFiltro.length > 4 && (
                                    <span className="font-bold text-gray-400"> +{item.opcionesFiltro.length - 4}</span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
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
                            <div className="hidden sm:flex mb-3 items-center gap-1.5 text-[#666666]">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <p className="text-[12px] font-medium truncate">
                                {item.direccion ? (
                                  <>{item.direccion.split(',')[0]}, <span className="font-bold text-[#1A3D3D]">{item.direccion.split(',')[1]}</span></>
                                ) : (
                                  <>Av. San Martín 1234, <span className="font-bold text-[#1A3D3D]">{item.provincia}</span></>
                                )}
                              </p>
                            </div>
                            <div className="flex sm:hidden mb-2 mt-1 w-full">
                              <div className="flex items-center gap-1.5 flex-nowrap w-full overflow-hidden">
                                {item.servicios?.slice(0, 4).map((srv, i) => (
                                  <span key={i} className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[10px] font-medium border border-gray-100 truncate min-w-0">
                                    {srv}
                                  </span>
                                ))}
                                {item.servicios?.length > 4 && (
                                  <span className="bg-gray-50 text-gray-400 px-1.5 py-1 rounded-[8px] text-[10px] font-medium shrink-0">
                                    +{item.servicios.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
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
                            <div className="flex items-center justify-between sm:justify-end pt-2.5 border-t border-gray-50 mt-auto">
                              <div className="flex sm:hidden items-center gap-1 text-[#666666] text-[11px] min-w-0 max-w-[70%]">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {item.direccion ? (
                                    <>{item.direccion.split(',')[0]}, <span className="font-bold text-[#1A3D3D]">{item.direccion.split(',')[1]}</span></>
                                  ) : (
                                    <>San Martín 1234, <span className="font-bold text-[#1A3D3D]">{item.provincia}</span></>
                                  )}
                                </span>
                              </div>
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
                        <div id="tour-grid-todos" className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 pt-0 mt-0">
                          <div className="lg:col-span-2 flex flex-col gap-0">
                            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] px-2 leading-none">Clínicas</h3>
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
                        <div id="tour-tab-especialistas" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-3 sm:gap-x-4 gap-y-3 sm:gap-y-8 pt-0 mt-0">
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

        {mostrarTourCartilla && currentUser && (
          <TourGuia
            pasos={PASOS_CARTILLA}
            userId={currentUser?.uid}
            claveStorage="cartilla"
            onFin={async () => {
              setMostrarTourCartilla(false);
              try {
                const { doc, updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'usuarios', currentUser.uid), { 'tourVisto.cartilla': true });
              } catch (e) { console.error('Error guardando tour cartilla:', e); }
            }}
          />
        )}
      </main>
    </>
  );
};

export default Cartilla;