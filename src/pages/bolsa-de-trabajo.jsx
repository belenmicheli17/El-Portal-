import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Search, X, Briefcase, User, Layers, MapPin, ChevronRight, ClipboardList, Plus, CheckCircle2, SlidersHorizontal, Stethoscope, Activity, Scissors, Microscope, FlaskConical, PawPrint, Brain, Leaf } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import provincias from '../data/provincias.js';
import { ROLES, ROLES_VISIBLES, JORNADAS, HORARIOS, EXPERIENCIAS, GRUPOS_AREAS } from '../data/bolsaOpciones';
import { estaVigente, permisosBolsa, tituloPuesto, aMilisegundos, provinciaCorta } from '../utils/bolsa';
import { coincideBusqueda } from '../utils/busquedaTolerante';
import { TarjetaOferta, TarjetaDisponible } from '../components/bolsa/TarjetasBolsa';
import DetalleOferta from '../components/bolsa/DetalleOferta';
import DetalleDisponible from '../components/bolsa/DetalleDisponible';
import FormularioOferta from '../components/bolsa/FormularioOferta';
import FormularioDisponible from '../components/bolsa/FormularioDisponible';
import MisPublicaciones from '../components/bolsa/MisPublicaciones';
import { CartelRegistro, CartelVerificacion, VentanaBolsa } from '../components/bolsa/ElementosBolsa';

const PESTANAS = [
  { id: 'todo', label: 'Todo', icon: Layers },
  { id: 'ofertas', label: 'Ofertas', icon: Briefcase },
  { id: 'disponibles', label: 'Disponibles', icon: User }
];

const masNuevasPrimero = (a, b) => aMilisegundos(b.publicadaEn) - aMilisegundos(a.publicadaEn);

// Íconos de cada grupo de especialidades, como en la Cartilla
const ICONOS_GRUPO = {
  consulta_general: Stethoscope,
  especialidades_medicas: Activity,
  quirurgico_critico: Scissors,
  imagenes: Microscope,
  laboratorio: FlaskConical,
  atencion_por_especie: PawPrint,
  bienestar_comportamiento: Brain,
  terapias_holisticas: Leaf,
  terapias_complementarias: Leaf
};
const iconoDeArea = (area) => ICONOS_GRUPO[GRUPOS_AREAS.find((g) => g.opciones.includes(area))?.id] || Stethoscope;

// Cuántas pastillas se ven antes de "Ver más" (en PC son unas 2 filas de especialidades y 1 de zonas)
const PASTILLAS_AREAS = 10;
const PASTILLAS_ZONAS = 6;

export default function BolsaTrabajo() {
  const { currentUser, loading: cargandoSesion } = useAuth();
  const permisos = permisosBolsa(currentUser);
  const [params, setParams] = useSearchParams();

  const vista = params.get('v') || 'lista';
  const ofertaId = params.get('oferta');
  const pestana = params.get('tab') || 'todo';
  const provincia = params.get('prov') || '';
  const jornada = params.get('jornada') || '';
  const area = params.get('area') || '';
  const rol = params.get('rol') || '';
  const horario = params.get('horario') || '';
  const experiencia = params.get('exp') || '';
  const [busqueda, setBusqueda] = useState('');
  const [verFiltros, setVerFiltros] = useState(false);

  const [ofertas, setOfertas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [misOfertas, setMisOfertas] = useState([]);
  const [miDisponible, setMiDisponible] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ofertaSuelta, setOfertaSuelta] = useState(null);
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [disponibleAbierto, setDisponibleAbierto] = useState(null);
  const [cartel, setCartel] = useState(null); // 'registro-publicar' | 'registro-contacto' | 'verificacion' | 'solo-clinicas' | 'solo-profesionales'
  const [aviso, setAviso] = useState('');
  const [miProvincia, setMiProvincia] = useState('');
  const [verTodasAreas, setVerTodasAreas] = useState(false);
  const [verTodasZonas, setVerTodasZonas] = useState(false);

  useEffect(() => {
    document.title = 'Bolsa de Trabajo Veterinaria | Portal Veterinario';
  }, []);

  // La provincia de su perfil: así le mostramos primero las publicaciones de su zona
  useEffect(() => {
    if (!currentUser?.uid || !['profesional', 'clinica'].includes(currentUser.rol)) { setMiProvincia(''); return; }
    const coleccion = currentUser.rol === 'clinica' ? 'clinicas' : 'profesionales';
    getDoc(doc(db, coleccion, currentUser.uid))
      .then((snap) => setMiProvincia(snap.exists() ? (snap.data().provincia || '') : ''))
      .catch(() => setMiProvincia(''));
  }, [currentUser?.uid, currentUser?.rol]);

  // Cambia la vista sin perder los filtros
  const irA = useCallback((nuevaVista, extra = {}) => {
    const nuevos = new URLSearchParams(params);
    nuevos.delete('oferta');
    if (nuevaVista === 'lista') nuevos.delete('v'); else nuevos.set('v', nuevaVista);
    Object.entries(extra).forEach(([k, v]) => (v ? nuevos.set(k, v) : nuevos.delete(k)));
    setParams(nuevos);
    window.scrollTo(0, 0);
  }, [params, setParams]);

  const cambiarFiltro = (clave, valor) => {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(clave, valor); else nuevos.delete(clave);
    setParams(nuevos, { replace: true });
  };

  // Lo público: solo publicaciones activas (las reglas no dejan leer otras)
  const cargarPublico = useCallback(async () => {
    const [snapOfertas, snapDisp] = await Promise.all([
      getDocs(query(collection(db, 'ofertasEmpleo'), where('estado', '==', 'activo'))),
      getDocs(query(collection(db, 'profesionalesDisponibles'), where('estado', '==', 'activo')))
    ]);
    setOfertas(snapOfertas.docs.map((d) => ({ id: d.id, ...d.data() })).filter(estaVigente).sort(masNuevasPrimero));
    setDisponibles(snapDisp.docs.map((d) => ({ id: d.id, ...d.data() })).filter(estaVigente).sort(masNuevasPrimero));
  }, []);

  // Lo propio: incluye vencidas y pausadas, para renovarlas o editarlas
  const cargarMias = useCallback(async () => {
    if (!currentUser?.uid) { setMisOfertas([]); setMiDisponible(null); return; }
    const [snapMias, snapMiDisp] = await Promise.all([
      getDocs(query(collection(db, 'ofertasEmpleo'), where('creadorId', '==', currentUser.uid))),
      getDoc(doc(db, 'profesionalesDisponibles', currentUser.uid)).catch(() => null)
    ]);
    setMisOfertas(snapMias.docs.map((d) => ({ id: d.id, ...d.data() })).sort(masNuevasPrimero));
    setMiDisponible(snapMiDisp?.exists() ? { id: snapMiDisp.id, ...snapMiDisp.data() } : null);
  }, [currentUser?.uid]);

  const recargar = useCallback(async () => {
    try {
      await Promise.all([cargarPublico(), cargarMias()]);
    } catch (e) {
      console.error('Error cargando la Bolsa:', e);
    } finally {
      setCargando(false);
    }
  }, [cargarPublico, cargarMias]);

  useEffect(() => {
    if (cargandoSesion) return;
    recargar();
  }, [cargandoSesion, recargar]);

  // Si entran por un link directo a una oferta que no está en la lista (ej: es propia y venció), la buscamos
  useEffect(() => {
    if (!ofertaId || cargando) return;
    if (ofertas.some((o) => o.id === ofertaId) || misOfertas.some((o) => o.id === ofertaId)) return;
    getDoc(doc(db, 'ofertasEmpleo', ofertaId))
      .then((snap) => setOfertaSuelta(snap.exists() ? { id: snap.id, ...snap.data() } : 'no-existe'))
      .catch(() => setOfertaSuelta('no-existe'));
  }, [ofertaId, cargando, ofertas, misOfertas]);

  const ofertaAbierta = ofertaId
    ? ofertas.find((o) => o.id === ofertaId) || misOfertas.find((o) => o.id === ofertaId) || (ofertaSuelta?.id === ofertaId ? ofertaSuelta : null)
    : null;

  // Botones de publicar: según quién sea, abre el formulario o un cartel
  const pedirPublicarOferta = () => {
    if (!permisos.conSesion) return setCartel('registro-publicar');
    if (currentUser.rol !== 'clinica' && !permisos.esAdmin) return setCartel('solo-clinicas');
    if (!permisos.puedePublicarOferta) return setCartel('verificacion');
    setOfertaEditando(null);
    irA('publicar');
  };
  const pedirDisponible = () => {
    if (!permisos.conSesion) return setCartel('registro-publicar');
    if (currentUser.rol !== 'profesional') return setCartel('solo-profesionales');
    if (!permisos.puedeMarcarseDisponible) return setCartel('verificacion');
    irA('disponible');
  };

  const alGuardar = async (mensaje) => {
    setAviso(mensaje);
    setCargando(true);
    await recargar();
    irA(vista === 'publicar' || vista === 'disponible' ? 'mis' : 'lista');
    setTimeout(() => setAviso(''), 5000);
  };

  // ---------- Filtros ----------
  const textoDe = (item, tipo) => (tipo === 'oferta'
    ? [tituloPuesto(item), item.clinicaNombre, item.localidad, item.barrio, item.provincia, item.zonaBA, item.descripcion, item.notaJornada, ...(item.areas || [])].join(' ')
    : [item.nombre, item.especialidad, item.provincia, item.buscando, item.notaAreas, ...(item.areas || []), ...(item.zonas || []).map((z) => `${z.localidad} ${z.barrio}`)].join(' '));

  const pasaFiltros = useCallback((item, tipo) => {
    if (provincia && item.provincia !== provincia) return false;
    if (jornada && !(item.jornada || []).includes(jornada)) return false;
    if (area && !(item.areas || []).includes(area)) return false;
    // Los disponibles son siempre veterinarios/as
    if (rol && (tipo === 'oferta' ? item.rol !== rol : rol !== 'veterinario')) return false;
    if (horario && !(item.horario || []).includes(horario)) return false;
    if (experiencia && item.experiencia !== experiencia) return false;
    if (busqueda.trim() && !coincideBusqueda(busqueda, textoDe(item, tipo))) return false;
    return true;
  }, [provincia, jornada, area, rol, horario, experiencia, busqueda]);

  // Si tiene provincia en su perfil, primero van las publicaciones de ahí (el resto sigue abajo, no se esconde)
  const primeroMiProvincia = useCallback((lista) => {
    if (!miProvincia || provincia) return lista;
    return [...lista.filter((x) => x.provincia === miProvincia), ...lista.filter((x) => x.provincia !== miProvincia)];
  }, [miProvincia, provincia]);

  const ofertasFiltradas = useMemo(() => primeroMiProvincia(ofertas.filter((o) => pasaFiltros(o, 'oferta'))), [ofertas, pasaFiltros, primeroMiProvincia]);
  const disponiblesFiltrados = useMemo(() => primeroMiProvincia(disponibles.filter((d) => pasaFiltros(d, 'disponible'))), [disponibles, pasaFiltros, primeroMiProvincia]);

  // Lo que se ve en la pestaña actual (para contar las pastillas)
  const deLaPestana = useMemo(() => [
    ...(pestana !== 'disponibles' ? ofertas : []),
    ...(pestana !== 'ofertas' ? disponibles : [])
  ], [ofertas, disponibles, pestana]);

  // Pastillas "Explorá por especialidad": solo las que tienen publicaciones, las más usadas primero
  const pastillas = useMemo(() => {
    const cuenta = {};
    deLaPestana.forEach((x) => (x.areas || []).forEach((a) => { cuenta[a] = (cuenta[a] || 0) + 1; }));
    return Object.entries(cuenta).map(([id, cantidad]) => ({ id, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
  }, [deLaPestana]);

  // Pastillas "Filtrá por zona": provincias con publicaciones; la de su perfil, primera
  const pastillasZona = useMemo(() => {
    const cuenta = {};
    deLaPestana.forEach((x) => { if (x.provincia) cuenta[x.provincia] = (cuenta[x.provincia] || 0) + 1; });
    return Object.entries(cuenta)
      .map(([id, cantidad]) => ({ id, cantidad }))
      .sort((a, b) => (b.id === miProvincia) - (a.id === miProvincia) || b.cantidad - a.cantidad);
  }, [deLaPestana, miProvincia]);

  const provinciasConDatos = useMemo(() => {
    const set = new Set([...ofertas, ...disponibles].map((x) => x.provincia).filter(Boolean));
    return provincias.filter((p) => set.has(p));
  }, [ofertas, disponibles]);

  const cantidadFiltrosVentana = [provincia, jornada, area, rol, horario, experiencia].filter(Boolean).length;
  const hayFiltros = !!(cantidadFiltrosVentana || busqueda.trim());
  const limpiarFiltros = () => {
    const nuevos = new URLSearchParams(params);
    ['prov', 'jornada', 'area', 'rol', 'horario', 'exp'].forEach((k) => nuevos.delete(k));
    setParams(nuevos, { replace: true });
    setBusqueda('');
  };

  const esClinica = currentUser?.rol === 'clinica' || permisos.esAdmin;
  const esProfesional = currentUser?.rol === 'profesional';
  const tieneMias = misOfertas.length > 0 || !!miDisponible;

  // ---------- Vistas que no son la lista ----------
  const fondo = (contenido) => (
    <main className="min-h-screen bg-[#F4F7F7] pb-24 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#4DB6AC]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-[#2D6A6A]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      {contenido}
    </main>
  );

  if (ofertaId) {
    if (!ofertaAbierta) {
      return fondo(
        <div className="max-w-xl mx-auto px-4 pt-24 text-center relative z-10 font-['Inter']">
          {ofertaSuelta === 'no-existe' || (!cargando && ofertaSuelta && !ofertaSuelta.id) ? (
            <>
              <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[24px] mb-2">Esta oferta ya no está disponible</h1>
              <p className="text-[#666666] mb-6">Puede que haya vencido o que la clínica la haya cerrado.</p>
              <button type="button" onClick={() => irA('lista')} className="bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3 rounded-2xl font-semibold">Ver todas las ofertas</button>
            </>
          ) : (
            <div className="w-12 h-12 mx-auto border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
          )}
        </div>
      );
    }
    return fondo(
      <>
        <DetalleOferta oferta={ofertaAbierta} permisos={permisos} currentUser={currentUser} onVolver={() => irA('lista')} onPedirVerificacion={() => setCartel('verificacion')} />
        <CartelVerificacion abierto={cartel === 'verificacion'} onCerrar={() => setCartel(null)} />
      </>
    );
  }

  if (vista === 'publicar' && permisos.puedePublicarOferta) {
    return fondo(<FormularioOferta currentUser={currentUser} ofertaExistente={ofertaEditando} onVolver={() => irA(ofertaEditando ? 'mis' : 'lista')} onGuardada={alGuardar} />);
  }

  if (vista === 'disponible' && permisos.puedeMarcarseDisponible) {
    return fondo(<FormularioDisponible currentUser={currentUser} onVolver={() => irA(miDisponible ? 'mis' : 'lista')} onGuardada={alGuardar} />);
  }

  if (vista === 'mis' && permisos.conSesion) {
    return fondo(
      <>
        {aviso && <AvisoExito texto={aviso} />}
        <MisPublicaciones
          currentUser={currentUser}
          misOfertas={misOfertas}
          miDisponible={miDisponible}
          onVolver={() => irA('lista')}
          onNuevaOferta={pedirPublicarOferta}
          onEditarOferta={(o) => { setOfertaEditando(o); irA('publicar'); }}
          onEditarDisponible={pedirDisponible}
          onCambio={recargar}
        />
      </>
    );
  }

  // ---------- Lista ----------
  const mostrarOfertas = pestana !== 'disponibles';
  const mostrarDisponibles = pestana !== 'ofertas';
  const claseGrilla = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4';
  const claseChip = 'inline-flex items-center gap-1.5 bg-white border border-[#2D6A6A]/20 text-[#1A3D3D] rounded-full pl-3.5 pr-3 py-1.5 text-[13px] font-semibold shadow-sm transition-all duration-300 hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5';

  return fondo(
    <div className="relative z-10 flex flex-col gap-4 sm:gap-6 font-['Inter']">
      {aviso && <AvisoExito texto={aviso} />}

      {/* ENCABEZADO: texto a la izquierda e ilustración a la derecha (solo PC), como en la Cartilla */}
      <div className="max-w-6xl mx-auto w-full px-4 lg:flex lg:items-center lg:gap-10">
      <section className="lg:w-[58%] pt-9 lg:pt-20 pb-2">
        <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-3 text-center lg:text-left">Para profesionales y clínicas</p>
        <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter leading-none mb-5 text-center lg:text-left">
          Encontrá trabajo o sumá<br className="hidden lg:block" /> talento a tu equipo
        </h1>
        <p className="text-[#666666] text-[14px] md:text-[16px] lg:text-[18px] font-medium mb-6 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left leading-relaxed">
          Búsquedas de clínicas de toda Argentina y colegas disponibles para trabajar. Mirá todo; para contactar, registrate gratis.
        </p>
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {(!permisos.conSesion || esClinica) && (
            <button type="button" onClick={pedirPublicarOferta} className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
              <Plus className="w-4 h-4" /> Publicar oferta
            </button>
          )}
          {(!permisos.conSesion || esProfesional) && (
            <button type="button" onClick={pedirDisponible} className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-colors ${!permisos.conSesion ? 'bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A]' : 'bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white shadow-md'}`}>
              <CheckCircle2 className="w-4 h-4" /> {miDisponible ? 'Editar mi disponibilidad' : 'Marcarme como disponible'}
            </button>
          )}
          {permisos.conSesion && (esClinica || esProfesional) && (
            <button type="button" onClick={() => irA('mis')} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A] px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
              <ClipboardList className="w-4 h-4" /> Mis publicaciones{tieneMias ? ` · ${misOfertas.length + (miDisponible ? 1 : 0)}` : ''}
            </button>
          )}
        </div>
      </section>

        <div className="hidden lg:flex lg:w-[42%] items-end justify-center pt-12">
          {/* Ilustración protegida: no se puede arrastrar ni tocar con clic derecho para guardarla */}
          <img src="/bolsa-hero-ilustracion.png" alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-full max-w-[440px] h-auto select-none pointer-events-none" />
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA: pestañas tipo solapa en PC, como en la Cartilla */}
      <div className="max-w-6xl mx-auto w-full px-4">
        <div className="hidden md:inline-flex gap-1 relative z-20 bg-white/60 rounded-t-[16px] px-1.5 overflow-hidden">
          {PESTANAS.map((t) => (
            <button key={t.id} type="button" onClick={() => cambiarFiltro('tab', t.id === 'todo' ? '' : t.id)} className={`flex items-center gap-1.5 px-6 py-2.5 rounded-t-[14px] text-[14px] font-semibold transition-all ${pestana === t.id ? 'bg-white text-[#1A3D3D]' : 'bg-transparent text-[#666666] hover:text-[#1A3D3D]'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[24px] md:rounded-tl-none p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-30 md:-mt-px">
          <div className="grid grid-cols-3 md:hidden bg-[#F4F7F7] p-1.5 rounded-[20px]">
            {PESTANAS.map((t) => (
              <button key={t.id} type="button" onClick={() => cambiarFiltro('tab', t.id === 'todo' ? '' : t.id)} className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${pestana === t.id ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 relative flex items-center bg-[#F4F7F7] border border-transparent focus-within:border-[#2D6A6A] rounded-[20px] md:rounded-full px-4 py-3 md:py-2.5 transition-all">
            <Search className="text-[#666666] w-4 h-4 shrink-0" />
            <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: Guardia, ecografía, Morón..." className="w-full bg-transparent pl-3 text-[14px] text-[#1A3D3D] focus:outline-none placeholder:text-gray-400" />
            {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda"><X className="w-4 h-4 text-gray-400" /></button>}
          </div>

          <button type="button" onClick={() => setVerFiltros(true)} className={`shrink-0 px-6 py-3 md:py-2.5 rounded-[20px] md:rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${cantidadFiltrosVentana ? 'bg-[#1A3D3D] text-white' : 'bg-[#F4F7F7] text-[#1A3D3D] hover:bg-gray-200'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filtros{cantidadFiltrosVentana ? ` · ${cantidadFiltrosVentana}` : ''}
          </button>
        </div>
      </div>

      {/* EXPLORÁ POR ESPECIALIDAD Y FILTRÁ POR ZONA: mismas pastillas que la Cartilla.
          En celular se deslizan al costado; en PC se acomodan en filas y el resto queda en "Ver más". */}
      {!cargando && (pastillas.length > 0 || pastillasZona.length > 0) && (
        <div className="max-w-6xl mx-auto w-full px-4 flex flex-col gap-4">
          {pastillas.length > 0 && (
            <FilaPastillas
              titulo="Explorá por especialidad"
              items={pastillas}
              limite={PASTILLAS_AREAS}
              verTodas={verTodasAreas}
              onVerTodas={() => setVerTodasAreas((v) => !v)}
              activa={(id) => area === id}
              onTocar={(id) => cambiarFiltro('area', area === id ? '' : id)}
              icono={iconoDeArea}
              etiqueta={(id) => id}
            />
          )}
          {pastillasZona.length > 0 && (
            <FilaPastillas
              titulo="Filtrá por zona"
              items={pastillasZona}
              limite={PASTILLAS_ZONAS}
              verTodas={verTodasZonas}
              onVerTodas={() => setVerTodasZonas((v) => !v)}
              activa={(id) => provincia === id}
              onTocar={(id) => cambiarFiltro('prov', provincia === id ? '' : id)}
              icono={() => MapPin}
              etiqueta={(id) => (id === miProvincia ? `${provinciaCorta(id)} (tu zona)` : provinciaCorta(id))}
            />
          )}
          {miProvincia && !provincia && (
            <p className="text-[13px] text-[#666666] px-1 -mt-1">Primero te mostramos lo de {provinciaCorta(miProvincia)}, la provincia de tu perfil.</p>
          )}
        </div>
      )}

      {/* FILTROS ACTIVOS */}
      {hayFiltros && (
        <div className="max-w-6xl mx-auto w-full px-4 flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-[#1A3D3D]">{PESTANAS.find((t) => t.id === pestana)?.label}</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          {busqueda.trim() && <button type="button" onClick={() => setBusqueda('')} className={claseChip}><Search className="w-3.5 h-3.5 text-[#2D6A6A]" /> {busqueda.trim()} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          {rol && <button type="button" onClick={() => cambiarFiltro('rol', '')} className={claseChip}><Briefcase className="w-3.5 h-3.5 text-[#2D6A6A]" /> Puesto: {ROLES.find((x) => x.id === rol)?.label} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          {area && <button type="button" onClick={() => cambiarFiltro('area', '')} className={claseChip}><Stethoscope className="w-3.5 h-3.5 text-[#2D6A6A]" /> {area} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          {provincia && <button type="button" onClick={() => cambiarFiltro('prov', '')} className={claseChip}><MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> {provinciaCorta(provincia)} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          {jornada && <button type="button" onClick={() => cambiarFiltro('jornada', '')} className={claseChip}>{jornada} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          {horario && <button type="button" onClick={() => cambiarFiltro('horario', '')} className={claseChip}>{horario} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          {experiencia && <button type="button" onClick={() => cambiarFiltro('exp', '')} className={claseChip}>{experiencia} <X className="w-3.5 h-3.5 text-gray-400" /></button>}
          <button type="button" onClick={limpiarFiltros} className="text-[13px] font-semibold text-[#2D6A6A] underline underline-offset-2 hover:text-[#1A3D3D] px-1">Limpiar todo</button>
        </div>
      )}

      {/* RESULTADOS */}
      <div className="max-w-6xl mx-auto w-full px-4 mt-2 min-h-[50vh]">
        {cargando ? (
          <div className="flex justify-center items-center py-20"><div className="w-12 h-12 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" /></div>
        ) : ofertas.length === 0 && disponibles.length === 0 ? (
          <EstadoVacio onPublicar={pedirPublicarOferta} onDisponible={pedirDisponible} />
        ) : (
          <div className="flex flex-col gap-8">
            {mostrarOfertas && (
              <section>
                <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-3 px-1">Clínicas que buscan · {ofertasFiltradas.length}</h2>
                {ofertasFiltradas.length > 0 ? (
                  <div className={claseGrilla}>
                    {ofertasFiltradas.map((o) => <TarjetaOferta key={o.id} oferta={o} onAbrir={() => { const n = new URLSearchParams(params); n.set('oferta', o.id); setParams(n); window.scrollTo(0, 0); }} />)}
                  </div>
                ) : (
                  <p className="bg-white/70 rounded-[24px] border border-gray-100 p-5 text-[14px] text-[#666666]">{ofertas.length === 0 ? 'Todavía no hay ofertas publicadas. Estamos sumando las primeras.' : 'No hay ofertas con estos filtros.'}</p>
                )}
              </section>
            )}

            {mostrarDisponibles && (
              <section>
                <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-3 px-1">Profesionales disponibles · {disponiblesFiltrados.length}</h2>
                {disponiblesFiltrados.length > 0 ? (
                  <div className={claseGrilla}>
                    {disponiblesFiltrados.map((d) => <TarjetaDisponible key={d.id} disponible={d} onAbrir={() => setDisponibleAbierto(d)} />)}
                  </div>
                ) : (
                  <p className="bg-white/70 rounded-[24px] border border-gray-100 p-5 text-[14px] text-[#666666]">{disponibles.length === 0 ? 'Todavía no hay profesionales disponibles.' : 'No hay profesionales disponibles con estos filtros.'}</p>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* VENTANA DE FILTROS */}
      <VentanaBolsa abierta={verFiltros} onCerrar={() => setVerFiltros(false)}>
        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] mb-5">Filtros</h3>

        <p className="text-[14px] font-bold text-[#1A3D3D] mb-2">Especialidad</p>
        <select value={area} onChange={(e) => cambiarFiltro('area', e.target.value)} className={claseSelect}>
          <option value="">Todas</option>
          {GRUPOS_AREAS.map((g) => (
            <optgroup key={g.id} label={g.grupo}>
              {g.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
            </optgroup>
          ))}
        </select>

        <p className="text-[14px] font-bold text-[#1A3D3D] mb-2">Zona (provincia)</p>
        <select value={provincia} onChange={(e) => cambiarFiltro('prov', e.target.value)} className={claseSelect}>
          <option value="">Todas</option>
          {(provinciasConDatos.length ? provinciasConDatos : provincias).map((p) => <option key={p} value={p}>{provinciaCorta(p)}</option>)}
        </select>

        <GrupoFiltro titulo="Puesto" opciones={ROLES_VISIBLES} valor={rol} onCambio={(v) => cambiarFiltro('rol', v)} />
        <GrupoFiltro titulo="Jornada" opciones={JORNADAS} valor={jornada} onCambio={(v) => cambiarFiltro('jornada', v)} />
        <GrupoFiltro titulo="Horario" opciones={HORARIOS} valor={horario} onCambio={(v) => cambiarFiltro('horario', v)} />
        <GrupoFiltro titulo="Experiencia" opciones={EXPERIENCIAS} valor={experiencia} onCambio={(v) => cambiarFiltro('exp', v)} />

        <div className="flex gap-2">
          {cantidadFiltrosVentana > 0 && (
            <button type="button" onClick={limpiarFiltros} className="flex-1 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] py-3.5 rounded-2xl text-[14px] font-semibold">Limpiar</button>
          )}
          <button type="button" onClick={() => setVerFiltros(false)} className="flex-[2] bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white py-3.5 rounded-2xl text-[14px] font-semibold">
            Ver {(mostrarOfertas ? ofertasFiltradas.length : 0) + (mostrarDisponibles ? disponiblesFiltrados.length : 0)} resultados
          </button>
        </div>
      </VentanaBolsa>

      <DetalleDisponible disponible={disponibleAbierto} abierto={!!disponibleAbierto} onCerrar={() => setDisponibleAbierto(null)} conSesion={permisos.conSesion} currentUser={currentUser} />

      <CartelRegistro abierto={cartel === 'registro-publicar'} onCerrar={() => setCartel(null)} motivo="publicar" />
      <CartelVerificacion abierto={cartel === 'verificacion'} onCerrar={() => setCartel(null)} />
      <VentanaBolsa abierta={cartel === 'solo-clinicas' || cartel === 'solo-profesionales'} onCerrar={() => setCartel(null)} ancho="max-w-md">
        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] leading-tight mb-2 pr-10">
          {cartel === 'solo-clinicas' ? 'Publicar ofertas es para clínicas' : 'Marcarse como disponible es para profesionales'}
        </h3>
        <p className="text-[14px] text-[#666666] leading-relaxed">
          {cartel === 'solo-clinicas' ? 'Con tu cuenta podés marcarte como disponible y postularte a las ofertas.' : 'Con tu cuenta de clínica podés publicar ofertas y contactar a los profesionales disponibles.'}
        </p>
      </VentanaBolsa>
    </div>
  );
}

// Una fila de pastillas con título y "Ver más" (igual que "Explorá por especialidad" de la Cartilla)
function FilaPastillas({ titulo, items, limite, verTodas, onVerTodas, activa, onTocar, icono, etiqueta }) {
  // La que está elegida se ve siempre, aunque quede después del límite
  const visibles = verTodas ? items : items.filter((it, i) => i < limite || activa(it.id));
  const quedan = items.length - visibles.length;
  return (
    <div>
      <p className="text-[14px] font-bold text-[#1A3D3D] mb-2 px-1">{titulo}</p>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pt-1.5 pb-2 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibles.map((it) => {
          const Icono = icono(it.id);
          const elegida = activa(it.id);
          return (
            <button key={it.id} type="button" onClick={() => onTocar(it.id)} className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold border shadow-sm transition-all duration-300 ease-in-out text-[#1A3D3D] ${elegida ? 'bg-[#2D6A6A]/10 border-[#2D6A6A]' : 'bg-white border-gray-200 hover:border-[#2D6A6A]/60 hover:-translate-y-0.5'}`}>
              <Icono className="w-4 h-4 text-[#2D6A6A]" />
              {etiqueta(it.id)} <span className="text-[#666666] font-medium">· {it.cantidad}</span>
            </button>
          );
        })}
        {(quedan > 0 || verTodas) && items.length > limite && (
          <button type="button" onClick={onVerTodas} className="shrink-0 inline-flex items-center rounded-full px-4 py-2 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] underline underline-offset-2">
            {verTodas ? 'Ver menos' : `Ver ${quedan} más`}
          </button>
        )}
      </div>
    </div>
  );
}

const claseSelect = 'w-full border border-gray-200 focus:border-[#2D6A6A] rounded-2xl px-4 py-3 text-[15px] text-[#333333] focus:outline-none bg-gray-50/50 mb-6';

// Pills de una sola opción dentro de la ventana de filtros (tocar de nuevo la saca)
function GrupoFiltro({ titulo, opciones, valor, onCambio }) {
  const lista = opciones.map((o) => (typeof o === 'string' ? { id: o, label: o } : o));
  return (
    <>
      <p className="text-[14px] font-bold text-[#1A3D3D] mb-2">{titulo}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {lista.map((o) => (
          <button key={o.id} type="button" onClick={() => onCambio(valor === o.id ? '' : o.id)} className={`rounded-full px-4 py-2 text-[13px] font-semibold border transition-all ${valor === o.id ? 'bg-[#2D6A6A]/10 border-[#2D6A6A] text-[#1A3D3D]' : 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A]/60'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}

function AvisoExito({ texto }) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] bg-[#1A3D3D] text-white px-5 py-3 rounded-2xl shadow-xl text-[14px] font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 font-['Inter']">
      <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" /> {texto}
    </div>
  );
}

function EstadoVacio({ onPublicar, onDisponible }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm px-6">
      <div className="w-20 h-20 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
        <Briefcase className="w-10 h-10 text-[#2D6A6A] opacity-60" />
      </div>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">Estamos sumando las primeras ofertas</h3>
      <p className="text-[#666666] text-[15px] max-w-md mb-6">¿Tu clínica busca a alguien o estás buscando trabajo? Sé de los primeros en publicar. Es gratis.</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <button type="button" onClick={onPublicar} className="bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3 rounded-2xl text-[14px] font-semibold transition-colors">Publicar oferta</button>
        <button type="button" onClick={onDisponible} className="bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] px-6 py-3 rounded-2xl text-[14px] font-semibold transition-colors">Marcarme como disponible</button>
      </div>
    </div>
  );
}
