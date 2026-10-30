import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Home, ChevronRight, Dog, Cat, Heart, Stethoscope, Hospital, X,
  PawPrint, Activity, Scissors, Microscope, FlaskConical, Brain, Leaf, Building2,
  Video as IconoVideo, Ambulance as IconoAmbulancia
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import TourGuia from '../components/TourGuia';
import BarraFiltros from '../components/BarraFiltros';
import { coincideBusqueda } from '../utils/busquedaTolerante';
import especialidadesData from '../data/especialidades.json';

// Íconos de cada grupo de especialidades (para las pastillas de "Explorá por especialidad")
const ICONOS_GRUPO = {
  consulta_general: Stethoscope,
  especialidades_medicas: Activity,
  quirurgico_critico: Scissors,
  imagenes: Microscope,
  laboratorio: FlaskConical,
  atencion_por_especie: PawPrint,
  bienestar_comportamiento: Brain,
  terapias_holisticas: Leaf,
  terapias_complementarias: Leaf,
  equipamiento_infraestructura: Building2
};

// Dónde atiende un profesional: primero los barrios de sus veterinarias,
// si no hay, los nombres de sus zonas, y si tampoco, la provincia
const ubicacionProfesional = (item) => {
  const barrios = [];
  (item.zonas || []).forEach(z => (z.clinicas || []).forEach(c => {
    const barrio = (c.barrio || '').trim();
    if (barrio && !barrios.includes(barrio)) barrios.push(barrio);
  }));
  if (barrios.length) return barrios.slice(0, 2).join(' · ') + (barrios.length > 2 ? ` +${barrios.length - 2}` : '');
  const nombresZona = (item.zonas || []).map(z => (z.nombre || '').trim()).filter(Boolean);
  if (nombresZona.length) return nombresZona.slice(0, 2).join(' · ');
  return item.provincia || '';
};

// Dónde está una clínica: barrio, o la localidad de su dirección, o la provincia.
// Si no hay ningún dato, no mostramos nada (antes salía una dirección de ejemplo).
const ubicacionClinica = (item) => {
  const cantidad = Array.isArray(item.sedes) ? item.sedes.length : 0;
  return [ubicacionBaseClinica(item), cantidad > 0 ? `${cantidad + 1} sedes` : ''].filter(Boolean).join(' · ');
};

const ubicacionBaseClinica = (item) => {
  if ((item.barrio || '').trim()) return item.barrio.trim();
  if (item.direccion) {
    const partes = item.direccion.split(',').map(p => p.trim()).filter(Boolean);
    return partes[1] || partes[0] || item.provincia || '';
  }
  return item.provincia || '';
};

// ── Tarjeta horizontal de resultado (sirve para profesionales y clínicas) ──
const TarjetaResultado = ({ item, onAbrir }) => {
  const esProfesional = item.tipo === 'profesional';
  const nombre = esProfesional ? `${item.nombre || ''} ${item.apellido || ''}`.trim() : item.nombre;
  const ubicacion = esProfesional ? ubicacionProfesional(item) : ubicacionClinica(item);
  const servicios = Array.isArray(item.servicios) ? item.servicios.filter(Boolean) : [];

  // Modalidades con su color (urgencias a domicilio reemplaza a "a domicilio" para no repetir)
  const modalidades = [];
  if (esProfesional) {
    if (item.urgenciaDomicilio) modalidades.push({ texto: 'Urgencias a domicilio', icono: IconoAmbulancia, clase: 'bg-red-50 text-red-700' });
    else if (item.domicilio) modalidades.push({ texto: 'A domicilio', icono: Home, clase: 'bg-blue-50 text-blue-700' });
    if (item.virtual) modalidades.push({ texto: 'Consulta virtual', icono: IconoVideo, clase: 'bg-[#2D6A6A]/10 text-[#1A3D3D]' });
  } else if (item.guardia24hs) {
    modalidades.push({ texto: 'Guardia 24hs', punto: true, clase: 'bg-red-50 text-red-700' });
  }

  return (
    <article
      onClick={onAbrir}
      className="group bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-pointer flex items-start gap-4 h-full"
    >
      {/* Foto o ilustración por defecto en tonos pastel */}
      {item.foto ? (
        <img
          src={item.foto}
          alt={nombre}
          className={`w-14 h-14 shrink-0 object-cover border border-gray-50 shadow-sm ${esProfesional ? 'rounded-full' : 'rounded-[16px]'}`}
        />
      ) : (
        <div className={`w-14 h-14 shrink-0 bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center ${esProfesional ? 'rounded-full' : 'rounded-[16px]'}`}>
          {esProfesional ? <PawPrint className="w-6 h-6" strokeWidth={1.75} /> : <Hospital className="w-6 h-6" strokeWidth={1.75} />}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h2 className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[15px] leading-tight truncate">{nombre}</h2>
        {esProfesional && item.especialidad && (
          <p className="text-[#2D6A6A] text-[13px] font-semibold leading-snug mt-0.5 line-clamp-1">{item.especialidad}</p>
        )}
        {ubicacion && (
          <p className="flex items-center gap-1 text-[#666666] text-[13px] font-medium mt-0.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{ubicacion}</span>
          </p>
        )}

        {/* Modalidades */}
        {modalidades.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {modalidades.map(m => (
              <span key={m.texto} className={`inline-flex items-center gap-1 text-[12px] lg:text-[13px] font-semibold px-2.5 py-0.5 rounded-full ${m.clase}`}>
                {m.punto
                  ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  : <m.icono className="w-3.5 h-3.5" />}
                {m.texto}
              </span>
            ))}
          </div>
        )}

        {/* Algunos servicios */}
        {servicios.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {servicios.slice(0, 2).map(srv => (
              <span key={srv} className="bg-[#F4F7F7] text-[#666666] text-[12px] lg:text-[13px] font-medium px-2 py-0.5 rounded-lg max-w-full truncate">
                {srv}
              </span>
            ))}
            {servicios.length > 2 && (
              <span className="bg-[#F4F7F7] text-[#666666] text-[12px] lg:text-[13px] font-medium px-2 py-0.5 rounded-lg">
                +{servicios.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <ChevronRight className="w-5 h-5 shrink-0 self-center text-[#9CA3AF] group-hover:text-[#2D6A6A] group-hover:translate-x-0.5 transition-all duration-300" />
    </article>
  );
};

const Cartilla = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // TODOS LOS HOOKS DECLARADOS AL PRINCIPIO (regla de React)
  const [searchParams, setSearchParams] = useSearchParams();
  // Vista de entrada: 'todos' (clínicas arriba y especialistas abajo).
  // Las pestañas Especialistas / Clínicas filtran; si tocás la que ya está elegida, volvés a 'todos'.
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('guardia24hs') === 'true' ? 'clinicas' : 'todos';
  });
  const [mostrarTourCartilla, setMostrarTourCartilla] = useState(false);
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Versión "con pausa" de lo que escribís: la lista y los chips usan esta,
  // así no se rearman con cada letra (eso hacía saltar la pantalla)
  const [terminoBuscado, setTerminoBuscado] = useState('');
  useEffect(() => {
    // Si borrás todo, se actualiza al instante; si escribís, espera 500ms de pausa
    if (searchTerm === '') { setTerminoBuscado(''); return; }
    const timer = setTimeout(() => setTerminoBuscado(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ¿Hay al menos un profesional o clínica con cada modalidad? Si no hay nadie, se oculta el botón
  const hayDomicilio = veterinarios.some(v => v.domicilio);
  const hayVirtual = veterinarios.some(v => v.virtual);
  const hayUrgenciaDomicilio = veterinarios.some(v => v.urgenciaDomicilio);
  const hayGuardia24hs = veterinarios.some(v => v.tipo === 'clinica' && v.guardia24hs);

  // Referencia a la barra de búsqueda + dónde estaba parada en la pantalla antes de cambiar de pestaña
  const barraWrapRef = useRef(null);
  const topBarraAntes = useRef(null);

  // Después de cambiar de pestaña, corregimos el scroll para que la barra quede en el mismo lugar
  // (si no, la página se acorta y el celular te manda hacia arriba)
  useLayoutEffect(() => {
    if (topBarraAntes.current === null) return;
    const topAhora = barraWrapRef.current?.getBoundingClientRect().top;
    if (topAhora !== undefined) {
      window.scrollBy({ top: topAhora - topBarraAntes.current, behavior: 'instant' });
    }
    topBarraAntes.current = null;
  }, [activeTab]);

  // Elegir pestaña: si ya estaba elegida, la soltamos y volvemos a ver todo
  const elegirTab = (valor) => {
    // Anotamos dónde está la barra ANTES del cambio
    topBarraAntes.current = barraWrapRef.current?.getBoundingClientRect().top ?? null;
    setActiveTab(prev => {
      const nuevo = typeof valor === 'function' ? valor(prev) : valor;
      return prev === nuevo ? 'todos' : nuevo;
    });
  };

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
      desc: `Para aparecer en esta sección, tenés que completar tu perfil desde el editor para que los tutores y colegas puedan ver toda tu información.<button onclick="window.location.href='${editorUrl}'" style="background:#2D6A6A;color:white;padding:8px 18px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:none;cursor:pointer;margin-top:4px">Ir al editor →</button>`,
      posicion: 'arriba'
    }
  ];

  // Sincroniza la pestaña cuando cambian los searchParams (ej: volver atrás con el navegador)
  useEffect(() => {
    if (searchParams.get('guardia24hs') === 'true') {
      setActiveTab('clinicas');
    }
  }, [searchParams]);

  // SEO dinámico: cuando el filtro de guardia está activo, cambiamos el título y la meta descripción
  useEffect(() => {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }

    const esUrgencia = searchParams.get('guardia24hs') === 'true';
    if (esUrgencia) {
      document.title = 'Guardia veterinaria 24hs cerca tuyo | Cartilla Veterinaria';
      meta.content = 'Encontrá clínicas veterinarias con guardia 24 horas cerca tuyo. Atención de urgencias para tu mascota en cualquier momento.';
    } else {
      document.title = 'Cartilla de Veterinarios y Clínicas cerca tuyo | Cartilla Veterinaria';
      meta.content = 'Encontrá todos los especialistas veterinarios y clínicas cerca tuyo: guardias 24 horas, atención a domicilio y profesionales verificados en toda Argentina.';
    }
  }, [searchParams]);

  // Geolocalización: pide permiso de ubicación y ordena resultados por distancia
  const calcularDistancia = (lat1, lng1, lat2, lng2) => {
    if (!lat2 || !lng2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleBuscarCercana = () => {
    if (!navigator.geolocation) {
      setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('guardia24hs', 'true'); return p; });
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
        setActiveTab('clinicas');
      },
      () => {
        // Si rechaza el permiso, igual filtramos pero sin ordenar por distancia
        setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('guardia24hs', 'true'); return p; });
        setBuscandoUbicacion(false);
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
          // Perfiles pendientes de verificación (visible en false) no aparecen en la cartilla.
          // Los perfiles que no tienen el campo "visible" se siguen mostrando como siempre.
          if (data.visible === false) return;
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
            virtual: data.atiendeVirtual || false,
            urgenciaDomicilio: data.urgenciasDomicilio || false,
            servicios: opcionesProfesional,
            opcionesFiltro: [...opcionesProfesional, ...(data.animalesExoticos || []), ...(data.animalesCampo || [])]
          });
        });

        const clinicasData = [];
        snapClinicas.forEach((doc) => {
          const data = doc.data();
          // Clínicas pendientes de verificación (visible en false) no aparecen en la cartilla.
          if (data.visible === false) return;
          // Solo mostramos clínicas que tengan nombre cargado
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
                      odontologia: 'Odontología', rehabilitacion: 'Fisiatría',
                      consulta_general: 'Consulta y Medicina General',
                      especialidades_medicas: 'Especialidades Médicas',
                      quirurgico_critico: 'Quirúrgico',
                      atencion_por_especie: 'Atención por Especie',
                      bienestar_comportamiento: 'Bienestar y Comportamiento',
                      terapias_holisticas: 'Terapias Complementarias',
                      terapias_complementarias: 'Terapias Complementarias',
                      equipamiento_infraestructura: 'Equipamiento e Infraestructura'
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
  const filtros = useMemo(() => ({
    zonas: searchParams.get('zonas') ? searchParams.get('zonas').split(',') : [],
    especialidades: searchParams.get('especialidades') ? searchParams.get('especialidades').split(',') : [],
    grupo: searchParams.get('grupo') || '',
    domicilio: searchParams.get('domicilio') === 'true',
    virtual: searchParams.get('virtual') === 'true',
    urgenciaDomicilio: searchParams.get('urgenciaDomicilio') === 'true',
    guardia24hs: searchParams.get('guardia24hs') === 'true'
  }), [searchParams]);

  // El grupo de especialidad elegido desde las pastillas (si hay uno)
  const grupoElegido = filtros.grupo ? especialidadesData.find(g => g.id === filtros.grupo) : null;

  // Pastillas "Explorá por especialidad": solo los grupos con al menos 1 perfil en la pestaña actual
  const gruposDisponibles = useMemo(() => {
    const deLaPestaña = veterinarios.filter(v =>
      activeTab === 'todos' || (activeTab === 'especialistas' ? v.tipo === 'profesional' : v.tipo === 'clinica')
    );
    return especialidadesData
      .map(grupo => ({
        ...grupo,
        cantidad: deLaPestaña.filter(v => (v.opcionesFiltro || []).some(o => grupo.opciones.includes(o))).length
      }))
      .filter(grupo => grupo.cantidad > 0);
  }, [veterinarios, activeTab]);

  // MOTOR DE FILTRADO (ignora tildes y mayúsculas)
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

  // Saca un filtro de la URL. Si le pasás un valor (ej: una provincia) saca solo ese;
  // si no, saca el filtro entero (ej: "domicilio").
  const quitarFiltro = (clave, valor) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (valor === undefined) {
        p.delete(clave);
      } else {
        const resto = (p.get(clave) || '').split(',').filter(x => x && x !== valor);
        if (resto.length) p.set(clave, resto.join(','));
        else p.delete(clave);
      }
      return p;
    });
  };

  // Toca una pastilla de especialidad: la elige, o la suelta si ya estaba elegida
  const elegirGrupo = (grupoId) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (p.get('grupo') === grupoId) p.delete('grupo');
      else p.set('grupo', grupoId);
      return p;
    });
  };

  const veterinariosFiltrados = veterinarios.filter(v => {
    // Buscador de texto libre: busca en nombre, apellido, especialidad, servicios,
    // provincia, dirección, zonas y barrios. Cada palabra tiene que aparecer en algún lado.
    if (terminoBuscado) {
      const textoDelItem = normalizar([
        v.nombre, v.apellido, v.especialidad, v.provincia, v.direccion,
        ...(Array.isArray(v.sedes) ? v.sedes.flatMap(s => [s.nombre, s.direccion, s.barrio, s.localidad]) : []),
        ...(Array.isArray(v.servicios) ? v.servicios : []),
        ...(Array.isArray(v.opcionesFiltro) ? v.opcionesFiltro : []),
        ...(Array.isArray(v.zonas) ? v.zonas.flatMap(z => [
          z.nombre,
          ...(Array.isArray(z.clinicas) ? z.clinicas.flatMap(c => [c.nombrePropio, c.barrio, c.direccion]) : [])
        ]) : [])
      ].filter(Boolean).join(' '));

      // Búsqueda tolerante: perdona errores de ortografía y entiende sinónimos
      if (!coincideBusqueda(terminoBuscado, textoDelItem)) return false;
    }

    if (filtros.zonas.length > 0 && !filtros.zonas.includes(v.provincia)) return false;
    if (filtros.especialidades.length > 0) {
      const opciones = v.opcionesFiltro || (Array.isArray(v.servicios) ? v.servicios : []);
      if (!filtros.especialidades.some(f => opciones.includes(f))) return false;
    }
    // Pastilla de grupo: tiene que tener al menos una opción de ese grupo
    if (grupoElegido && !(v.opcionesFiltro || []).some(o => grupoElegido.opciones.includes(o))) return false;
    if (filtros.domicilio && !v.domicilio) return false;
    if (filtros.virtual && !v.virtual) return false;
    if (filtros.urgenciaDomicilio && !v.urgenciaDomicilio) return false;
    if (filtros.guardia24hs && !v.guardia24hs) return false;

    return true;
  });

  const clinicasFiltradas = veterinariosFiltrados.filter(v => v.tipo === 'clinica');
  const profesionalesFiltrados = veterinariosFiltrados.filter(v => v.tipo === 'profesional');

  // Cuántas tarjetas mostramos de cada tipo en la vista de entrada (después, "Ver todos")
  const MAX_CLINICAS_TODOS = 3;
  const MAX_ESPECIALISTAS_TODOS = 6;

  const abrir = (item) => navigate(`/${item.tipo}/${item.id}`);

  // Título de una sección con su cantidad de resultados
  const TituloSeccion = ({ texto, cantidad }) => (
    <div className="flex items-baseline justify-between px-1 mb-3">
      <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] md:text-[18px] leading-none">{texto}</h3>
      <span className="text-[#666666] text-[13px] font-medium">{cantidad} {cantidad === 1 ? 'resultado' : 'resultados'}</span>
    </div>
  );

  const claseGrilla = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4";

  const hayFiltrosActivos = terminoBuscado.trim() || filtros.zonas.length > 0 || filtros.especialidades.length > 0 || grupoElegido || filtros.domicilio || filtros.virtual || filtros.urgenciaDomicilio || filtros.guardia24hs;

  return (
    <>
      <main className="min-h-screen bg-[#F9F5F0] pb-24 relative flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500 overflow-hidden">
        {/* BURBUJAS DE FONDO LIBRES */}
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#FF9800]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[#4DB6AC]/30 rounded-full blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-[#4DB6AC]/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

        {/* HEADER B2C + ILUSTRACIÓN (dos columnas en PC) */}
        <div className="relative z-20 max-w-6xl mx-auto w-full px-4 lg:flex lg:items-center lg:gap-10">

          {/* COLUMNA IZQUIERDA: título + subtítulo + barra de búsqueda */}
          <div className="lg:w-[55%]">
            <section className="relative pt-9 lg:pt-20 pb-2 text-center">
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-3 mb-5 lg:hidden">
                  <Dog className="w-10 h-10 text-[#FF9800]" strokeWidth={2.5} />
                  <Heart className="w-9 h-9 text-[#FF9800]" strokeWidth={2.5} />
                  <Cat className="w-10 h-10 text-[#FF9800]" strokeWidth={2.5} />
                </div>
                <h1 className="text-[32px] md:text-[42px] lg:text-[48px] lg:text-left font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter leading-none mb-5">
                  Encontrá especialistas<br className="hidden lg:block" /> y clínicas veterinarias cerca tuyo
                </h1>
                <p className="text-[#666666] text-[14px] md:text-[16px] lg:text-[18px] font-medium mb-6 max-w-lg mx-auto lg:mx-0 lg:text-left leading-relaxed font-['Inter']">
                  Buscá por especialidad, zona o servicio. Profesionales verificados y clínicas de alta complejidad en toda Argentina.
                </p>
              </div>
            </section>

            {/* BARRA DE BÚSQUEDA — sin pestaña "Todos": se ve todo de entrada y las pestañas filtran */}
            <div ref={barraWrapRef} className="lg:-ml-3 lg:mt-0">
              <BarraFiltros
                tabs={[
                  { id: 'especialistas', label: 'Especialistas', icon: Stethoscope, tourId: 'tour-tab-especialistas' },
                  { id: 'clinicas', label: 'Clínicas', icon: Hospital }
                ]}
                activeTab={activeTab}
                setActiveTab={elegirTab}
                searchPlaceholder="Ej: Dermatólogo, San Isidro, Vacunación..."
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showModalidad={true}
                provinciasDisponibles={provinciasDisponibles}
                especialidadesDisponibles={especialidadesDisponibles}
                hayGuardia24hs={hayGuardia24hs}
                hayDomicilio={hayDomicilio}
                hayVirtual={hayVirtual}
                hayUrgenciaDomicilio={hayUrgenciaDomicilio}
                onUrgencia={handleBuscarCercana}
                buscandoUbicacion={buscandoUbicacion}
              />
            </div>
          </div>

          {/* COLUMNA DERECHA: ilustración del hero (solo PC) */}
          <div className="hidden lg:flex lg:w-[45%] items-center justify-center">
            <img
              src="/cartilla-hero-ilustracion.svg"
              alt=""
              className="w-full max-w-[500px] h-auto lg:translate-x-8"
            />
          </div>
        </div>

        {/* EXPLORÁ POR ESPECIALIDAD: en celular se desliza al costado, en PC se acomoda en varias líneas */}
        {!loading && gruposDisponibles.length > 0 && (
          <div className="max-w-6xl mx-auto w-full px-4 relative z-10 font-['Inter']">
            <p className="text-[14px] font-bold text-[#1A3D3D] mb-3 px-1">Explorá por especialidad</p>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gruposDisponibles.map(grupo => {
                const Icono = ICONOS_GRUPO[grupo.id] || Stethoscope;
                const activo = filtros.grupo === grupo.id;
                return (
                  <button
                    key={grupo.id}
                    type="button"
                    onClick={() => elegirGrupo(grupo.id)}
                    className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold border shadow-sm transition-all duration-300 ease-in-out ${activo ? 'bg-[#FF9800]/10 border-[#FF9800] text-[#1A3D3D]' : 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#FF9800]/60 hover:-translate-y-0.5'}`}
                  >
                    <Icono className="w-4 h-4 text-[#FF9800]" />
                    {grupo.grupo}
                    <span className="text-[#666666] font-medium">· {grupo.cantidad}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FILTROS ACTIVOS: al tocar un chip, se saca ese filtro */}
        {hayFiltrosActivos && (() => {
          const claseChip = "inline-flex items-center gap-1.5 bg-white border border-[#2D6A6A]/20 text-[#1A3D3D] rounded-full pl-3.5 pr-3 py-1.5 text-[13px] font-semibold shadow-sm transition-all duration-300 hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5";
          return (
            <div className="max-w-6xl mx-auto w-full px-4 relative z-10 font-['Inter']">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-[#1A3D3D]">
                  {activeTab === 'todos' ? 'Todos' : activeTab === 'especialistas' ? 'Especialistas' : 'Clínicas'}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />

                {terminoBuscado.trim() && (
                  <button type="button" onClick={() => setSearchTerm('')} className={claseChip} title="Sacar esta búsqueda">
                    <Search className="w-3.5 h-3.5 text-[#2D6A6A]" /> {terminoBuscado.trim()} <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {grupoElegido && (
                  <button type="button" onClick={() => quitarFiltro('grupo')} className={claseChip} title="Sacar este filtro">
                    <PawPrint className="w-3.5 h-3.5 text-[#FF9800]" /> {grupoElegido.grupo} <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {filtros.zonas.map(z => (
                  <button key={`z-${z}`} type="button" onClick={() => quitarFiltro('zonas', z)} className={claseChip} title="Sacar este filtro">
                    <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> {z} <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
                {filtros.especialidades.map(e => (
                  <button key={`e-${e}`} type="button" onClick={() => quitarFiltro('especialidades', e)} className={claseChip} title="Sacar este filtro">
                    <Stethoscope className="w-3.5 h-3.5 text-[#2D6A6A]" /> {e} <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
                {filtros.domicilio && (
                  <button type="button" onClick={() => quitarFiltro('domicilio')} className={claseChip} title="Sacar este filtro">
                    <Home className="w-3.5 h-3.5 text-blue-600" /> Atiende a domicilio <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {filtros.virtual && (
                  <button type="button" onClick={() => quitarFiltro('virtual')} className={claseChip} title="Sacar este filtro">
                    <IconoVideo className="w-3.5 h-3.5 text-[#2D6A6A]" /> Consulta virtual <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {filtros.urgenciaDomicilio && (
                  <button type="button" onClick={() => quitarFiltro('urgenciaDomicilio')} className={claseChip} title="Sacar este filtro">
                    <IconoAmbulancia className="w-3.5 h-3.5 text-red-500" /> Urgencia a domicilio <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {filtros.guardia24hs && (
                  <button type="button" onClick={() => quitarFiltro('guardia24hs')} className={claseChip} title="Sacar este filtro">
                    <Hospital className="w-3.5 h-3.5 text-red-500" /> Guardia 24hs <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}

                <button type="button" onClick={limpiarFiltros} className="text-[13px] font-semibold text-[#2D6A6A] underline underline-offset-2 hover:text-[#1A3D3D] px-1">
                  Limpiar todo
                </button>
              </div>
            </div>
          );
        })()}

        <div className="max-w-6xl mx-auto w-full px-4 mt-2 mb-4 relative z-10 font-['Inter'] min-h-[80vh] [overflow-anchor:none]">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin"></div>
            </div>
          )}

          {/* RESULTADOS */}
          {!loading && (
            <section className="animate-in fade-in slide-in-from-bottom-4">
              {veterinariosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                    <Search className="w-10 h-10 text-[#2D6A6A] opacity-50" />
                  </div>
                  <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">
                    Todavía no hay resultados con estos filtros
                  </h3>
                  <p className="text-[#666666] font-medium text-[14px] max-w-md mx-auto mb-6">
                    ¿Probamos cambiando la zona o buscando con otras palabras?
                  </p>
                  <button
                    onClick={limpiarFiltros}
                    className="bg-[#1A3D3D] text-white px-8 py-3 rounded-[16px] text-[13px] font-medium hover:bg-[#2D6A6A] transition-colors shadow-md"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <>
                  {/* VISTA DE ENTRADA: clínicas arriba, especialistas abajo */}
                  {activeTab === 'todos' && (
                    <div id="tour-grid-todos" className="flex flex-col gap-10">
                      {clinicasFiltradas.length > 0 && (
                        <div>
                          <TituloSeccion texto="Clínicas" cantidad={clinicasFiltradas.length} />
                          <div className={claseGrilla}>
                            {clinicasFiltradas.slice(0, MAX_CLINICAS_TODOS).map(item => (
                              <TarjetaResultado key={item.id} item={item} onAbrir={() => abrir(item)} />
                            ))}
                          </div>
                          {clinicasFiltradas.length > MAX_CLINICAS_TODOS && (
                            <div className="flex justify-center mt-5">
                              <button type="button" onClick={() => setActiveTab('clinicas')} className="bg-white border border-gray-200 text-[#2D6A6A] rounded-full px-5 py-2.5 text-[13px] font-bold shadow-sm hover:border-[#2D6A6A] transition-all duration-300 flex items-center gap-1.5">
                                Ver las {clinicasFiltradas.length} clínicas <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {profesionalesFiltrados.length > 0 && (
                        <div>
                          <TituloSeccion texto="Especialistas" cantidad={profesionalesFiltrados.length} />
                          <div className={claseGrilla}>
                            {profesionalesFiltrados.slice(0, MAX_ESPECIALISTAS_TODOS).map(item => (
                              <TarjetaResultado key={item.id} item={item} onAbrir={() => abrir(item)} />
                            ))}
                          </div>
                          {profesionalesFiltrados.length > MAX_ESPECIALISTAS_TODOS && (
                            <div className="flex justify-center mt-5">
                              <button type="button" onClick={() => setActiveTab('especialistas')} className="bg-white border border-gray-200 text-[#2D6A6A] rounded-full px-5 py-2.5 text-[13px] font-bold shadow-sm hover:border-[#2D6A6A] transition-all duration-300 flex items-center gap-1.5">
                                Ver los {profesionalesFiltrados.length} especialistas <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PESTAÑA ESPECIALISTAS */}
                  {activeTab === 'especialistas' && (
                    profesionalesFiltrados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">
                          Todavía no hay especialistas con estos filtros
                        </h3>
                        <p className="text-[#666666] font-medium text-[14px] max-w-md mx-auto">
                          ¿Probamos cambiando la zona o la especialidad?
                        </p>
                      </div>
                    ) : (
                      <div id="tour-tab-especialistas">
                        <TituloSeccion texto="Especialistas" cantidad={profesionalesFiltrados.length} />
                        <div className={claseGrilla}>
                          {profesionalesFiltrados.map(item => (
                            <TarjetaResultado key={item.id} item={item} onAbrir={() => abrir(item)} />
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* PESTAÑA CLÍNICAS */}
                  {activeTab === 'clinicas' && (
                    clinicasFiltradas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="inline-flex items-center gap-2 bg-[#1A3D3D] text-[#4DB6AC] text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4DB6AC] animate-pulse" />
                          Próximamente
                        </span>
                        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">
                          Las clínicas están en camino
                        </h3>
                        <p className="text-[#666666] font-medium text-[14px] max-w-md mx-auto">
                          Pronto vas a poder encontrar clínicas y centros veterinarios de alta complejidad en esta sección.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <TituloSeccion texto="Clínicas" cantidad={clinicasFiltradas.length} />
                        <div className={claseGrilla}>
                          {clinicasFiltradas.map(item => (
                            <TarjetaResultado key={item.id} item={item} onAbrir={() => abrir(item)} />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </>
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