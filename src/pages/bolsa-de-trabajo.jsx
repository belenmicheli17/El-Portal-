import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { Search, X, Briefcase, Layers, MapPin, ChevronRight, ClipboardList, Plus, CheckCircle2, SlidersHorizontal, Stethoscope, GraduationCap, Hospital, AlertCircle, RotateCcw } from 'lucide-react';
import BotonAvisarProblema from '../components/BotonAvisarProblema';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLES_VISIBLES, JORNADAS, GRUPOS_AREAS } from '../data/bolsaOpciones';
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
  { id: 'ofertas', label: 'Ofertas', icon: Hospital }, // ofertas = las publican las clínicas
  { id: 'disponibles', label: 'Disponibles', icon: Stethoscope } // disponibles = profesionales que buscan trabajo
];

const masNuevasPrimero = (a, b) => aMilisegundos(b.publicadaEn) - aMilisegundos(a.publicadaEn);



// Cantidad mínima de estudiantes verificados para mostrar el contador público
const MINIMO_ALUMNOS = 15;

export default function BolsaTrabajo() {
  const { currentUser, loading: cargandoSesion } = useAuth();
  const permisos = permisosBolsa(currentUser);
  const [params, setParams] = useSearchParams();

  const vista = params.get('v') || 'lista';
  const ofertaId = params.get('oferta');
  // Link directo a un profesional disponible (ej: desde el panel admin): ?disponible=<id>
  const disponibleId = params.get('disponible');
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
  // Si falla la lectura de publicaciones guardamos el código del error (ej: permission-denied).
  // Así mostramos "no pudimos cargar" en vez de "no hay ofertas", que no sería verdad.
  const [errorCarga, setErrorCarga] = useState('');
  const [ofertaSuelta, setOfertaSuelta] = useState(null);
  // Si falla la lectura de una oferta abierta por link, guardamos el código del error.
  // Así decimos "no pudimos cargarla" en vez de "ya no está disponible", que no sería verdad.
  const [errorOferta, setErrorOferta] = useState('');
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [disponibleAbierto, setDisponibleAbierto] = useState(null);
  const [cartel, setCartel] = useState(null); // 'registro-publicar' | 'registro-contacto' | 'verificacion' | 'solo-clinicas' | 'solo-profesionales'
  const [aviso, setAviso] = useState('');
  const [miProvincia, setMiProvincia] = useState('');
  // Estudiantes verificados: el contador se muestra recién desde MINIMO_ALUMNOS
  const [cantidadAlumnos, setCantidadAlumnos] = useState(0);
  useEffect(() => {
    getCountFromServer(query(collection(db, 'alumnos'), where('visible', '==', true)))
      .then((r) => setCantidadAlumnos(r.data().count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = 'Bolsa de Trabajo Veterinaria | Portal Veterinario';
  }, []);

  // La provincia de su perfil: así le mostramos primero las publicaciones de su zona
  useEffect(() => {
    if (!currentUser?.uid || !['profesional', 'clinica', 'alumnx'].includes(currentUser.rol)) { setMiProvincia(''); return; }
    const coleccion = currentUser.rol === 'clinica' ? 'clinicas' : currentUser.rol === 'alumnx' ? 'alumnos' : 'profesionales';
    getDoc(doc(db, coleccion, currentUser.uid))
      .then((snap) => setMiProvincia(snap.exists() ? (snap.data().provincia || '') : ''))
      .catch(() => setMiProvincia(''));
  }, [currentUser?.uid, currentUser?.rol]);

  // Cambia la vista sin perder los filtros
  const irA = useCallback((nuevaVista, extra = {}) => {
    const nuevos = new URLSearchParams(params);
    nuevos.delete('oferta');
    nuevos.delete('postulantes');
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
    // Sin conexión, Firebase no da error: devuelve lo que tenga guardado en el navegador (fromCache),
    // que puede ser una lista vacía. Si las dos vienen vacías y de ahí, no sabemos si de verdad no hay
    // publicaciones: lo tratamos como un error para mostrar "No pudimos cargar" (con Reintentar).
    const vacias = snapOfertas.empty && snapDisp.empty;
    const desdeMemoria = snapOfertas.metadata.fromCache || snapDisp.metadata.fromCache;
    if (vacias && desdeMemoria) {
      const sinConexion = new Error('Sin conexión con la base: listas vacías desde la memoria del navegador');
      sinConexion.code = 'sin-conexion';
      throw sinConexion;
    }
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
      setErrorCarga('');
    } catch (e) {
      console.error('Error cargando la Bolsa:', e);
      setErrorCarga(e?.code || e?.message || 'desconocido');
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
    setErrorOferta('');
    getDoc(doc(db, 'ofertasEmpleo', ofertaId))
      .then((snap) => {
        if (snap.exists()) { setOfertaSuelta({ id: snap.id, ...snap.data() }); return; }
        // Sin conexión, Firebase contesta "no existe" con lo que tiene guardado en el navegador: no es seguro
        if (snap.metadata.fromCache) { setErrorOferta('sin-conexion'); return; }
        setOfertaSuelta('no-existe');
      })
      .catch((e) => setErrorOferta(e?.code || e?.message || 'desconocido'));
  }, [ofertaId, cargando, ofertas, misOfertas]);

  // Si entran con ?disponible=<id>, abrimos su ficha cuando termina de cargar la lista
  useEffect(() => {
    if (!disponibleId || cargando) return;
    const encontrado = disponibles.find((d) => d.id === disponibleId) || (miDisponible?.id === disponibleId ? miDisponible : null);
    if (encontrado) setDisponibleAbierto(encontrado);
  }, [disponibleId, cargando, disponibles, miDisponible]);

  // Al cerrar la ficha sacamos el ?disponible= de la dirección (si no, se volvería a abrir)
  const cerrarDisponible = () => {
    setDisponibleAbierto(null);
    if (disponibleId) {
      const nuevos = new URLSearchParams(params);
      nuevos.delete('disponible');
      setParams(nuevos, { replace: true });
    }
  };

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
    if (!['profesional', 'alumnx'].includes(currentUser.rol)) return setCartel('solo-profesionales');
    if (!permisos.puedeMarcarseDisponible) return setCartel('verificacion');
    irA('disponible');
  };

  // Botón único "Me interesa publicar una búsqueda": reconoce el tipo de cuenta y abre el formulario que corresponde
  const pedirPublicarBusqueda = () => {
    if (['profesional', 'alumnx'].includes(currentUser?.rol)) return pedirDisponible();
    return pedirPublicarOferta();
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
    // Los disponibles son veterinarios/as, salvo los alumnos/as que figuran como asistentes
    if (rol && (tipo === 'oferta' ? item.rol !== rol : (item.puesto || 'veterinario') !== rol)) return false;
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



  const cantidadFiltrosVentana = [provincia, jornada, area, rol, horario, experiencia].filter(Boolean).length;
  // Cuántas publicaciones hay por especialidad (para mostrar el número al lado de cada pill del panel)
  const cuentaAreas = Object.fromEntries(pastillas.map((p) => [p.id, p.cantidad]));
  const hayFiltros = !!(cantidadFiltrosVentana || busqueda.trim());
  const limpiarFiltros = () => {
    const nuevos = new URLSearchParams(params);
    ['prov', 'jornada', 'area', 'rol', 'horario', 'exp'].forEach((k) => nuevos.delete(k));
    setParams(nuevos, { replace: true });
    setBusqueda('');
  };

  const esClinica = currentUser?.rol === 'clinica' || permisos.esAdmin;
  // Profesionales y alumnos/as usan la Bolsa del mismo lado (se marcan disponibles y se postulan)
  const esProfesional = ['profesional', 'alumnx'].includes(currentUser?.rol);
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
          {errorOferta ? (
            <>
              <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[24px] mb-2">No pudimos cargar la oferta</h1>
              <p className="text-[#666666] mb-6">Hubo un problema al traerla. Probá de nuevo y, si sigue pasando, avisanos.</p>
              <div className="flex flex-wrap gap-3 justify-center items-center">
                <button
                  type="button"
                  // Volvemos a pedir todo: la lista y, si no está ahí, la oferta suelta
                  onClick={() => { setErrorOferta(''); setOfertaSuelta(null); setCargando(true); recargar(); }}
                  className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3 rounded-2xl font-semibold"
                >
                  <RotateCcw className="w-4 h-4" /> Reintentar
                </button>
                <BotonAvisarProblema lugar="bolsa" detalle={`oferta ${ofertaId}: ${errorOferta}`} />
              </div>
            </>
          ) : ofertaSuelta === 'no-existe' || (!cargando && ofertaSuelta && !ofertaSuelta.id) ? (
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
          abrirPostulantes={params.get('postulantes') || ''}
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
      <section className="lg:w-[58%] pt-12 lg:pt-20 pb-2">
        <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-3 text-center lg:text-left">Para profesionales, estudiantes y clínicas</p>
        <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter leading-[1.05] mb-5 text-center lg:text-left">
          Encontrá trabajo o sumá<br className="hidden lg:block" /> talento a tu equipo
        </h1>
        <p className="text-[#666666] text-[14px] md:text-[16px] lg:text-[18px] font-medium mb-7 max-w-xl mx-auto lg:mx-0 text-center lg:text-left leading-relaxed px-2 lg:px-0">
          Clínicas que buscan equipo y colegas que buscan trabajo, en todo el país. Publicar es gratis.
        </p>
        {cantidadAlumnos >= MINIMO_ALUMNOS && (
          <p className="flex items-center justify-center lg:justify-start gap-2 text-[14px] font-semibold text-rose-500 -mt-3 mb-6">
            <GraduationCap className="w-4 h-4" /> Ya somos {cantidadAlumnos} estudiantes en el Portal
          </p>
        )}
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {/* Visitantes: un solo botón que abre la ventanita de registrarse / iniciar sesión */}
          {!permisos.conSesion && (
            <button type="button" onClick={() => setCartel('registro-publicar')} className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
              Registrate o iniciá sesión para publicar
            </button>
          )}
          {permisos.conSesion && esClinica && (
            <button type="button" onClick={pedirPublicarOferta} className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
              <Plus className="w-4 h-4" /> Publicar oferta 
            </button>
          )}
          {permisos.conSesion && esProfesional && (
            <button type="button" onClick={pedirDisponible} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-colors bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white shadow-md">
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
        {/* Fondo suave detrás del panel de filtros (igual que en la Cartilla) */}
        {verFiltros && (
          <div className="fixed inset-0 bg-[#1A3D3D]/10 backdrop-blur-[2px] z-20 transition-opacity" onClick={() => setVerFiltros(false)} />
        )}
        <div className="hidden md:inline-flex gap-1 relative z-20 bg-white/60 rounded-t-[16px] px-1.5 overflow-hidden">
          {PESTANAS.map((t) => (
            <button key={t.id} type="button" onClick={() => cambiarFiltro('tab', t.id === 'todo' ? '' : t.id)} className={`flex items-center gap-1.5 px-6 py-2.5 rounded-t-[14px] text-[14px] font-semibold transition-all ${pestana === t.id ? 'bg-white text-[#1A3D3D]' : 'bg-transparent text-[#666666] hover:text-[#1A3D3D]'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className={`bg-white rounded-[24px] md:rounded-tl-none p-2 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-30 md:-mt-px transition-all duration-300 ${verFiltros ? 'rounded-b-none' : ''}`}>

          {/* PANEL DE FILTROS: se despliega pegado debajo de la barra, como en la Cartilla */}
          {verFiltros && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-t-none lg:rounded-tr-[32px] rounded-b-[32px] p-6 sm:p-8 border-x border-b border-gray-100 shadow-2xl z-40 animate-in fade-in slide-in-from-top-4 cursor-default">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 lg:gap-0 lg:divide-x lg:divide-gray-100 mb-6">

                {/* Columna 1: especialidades, agrupadas, solo las que tienen publicaciones */}
                <div className="lg:pr-8">
                  <h3 className={claseTituloPanel}><Stethoscope className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Especialidad</h3>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {pastillas.length === 0 && <p className="text-[13px] text-[#666666]">Todavía no hay publicaciones con especialidades.</p>}
                    {GRUPOS_AREAS.map((g) => {
                      const opciones = g.opciones.filter((o) => cuentaAreas[o] || area === o);
                      if (opciones.length === 0) return null;
                      return (
                        <div key={g.id}>
                          <p className="text-[11px] font-black text-[#1A3D3D] uppercase tracking-[0.15em] mb-2 opacity-50">{g.grupo}</p>
                          <div className="flex flex-wrap gap-2">
                            {opciones.map((o) => (
                              <button key={o} type="button" onClick={() => cambiarFiltro('area', area === o ? '' : o)} className={clasePildora(area === o)}>
                                {o}
                                {cuentaAreas[o] > 0 && <span className={`text-[11px] font-bold ${area === o ? 'text-white/70' : 'text-gray-400'}`}>({cuentaAreas[o]})</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Columna 2: zona, puesto, jornada, horario y experiencia */}
                <div className="lg:pl-8 flex flex-col gap-6">
                  <div>
                    <h3 className={claseTituloPanel}><MapPin className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#2D6A6A]" /> Zona</h3>
                    <div className="flex flex-wrap gap-2">
                      {pastillasZona.length === 0 && <p className="text-[13px] text-[#666666]">Todavía no hay publicaciones con zona.</p>}
                      {pastillasZona.map((z) => (
                        <button key={z.id} type="button" onClick={() => cambiarFiltro('prov', provincia === z.id ? '' : z.id)} className={clasePildora(provincia === z.id)}>
                          {z.id === miProvincia ? `${provinciaCorta(z.id)} (tu zona)` : provinciaCorta(z.id)}
                          <span className={`text-[11px] font-bold ${provincia === z.id ? 'text-white/70' : 'text-gray-400'}`}>({z.cantidad})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <GrupoPanel titulo="Puesto" opciones={ROLES_VISIBLES} valor={rol} onCambio={(v) => cambiarFiltro('rol', v)} />
                  <GrupoPanel titulo="Jornada" opciones={JORNADAS} valor={jornada} onCambio={(v) => cambiarFiltro('jornada', v)} />
                </div>
              </div>

              {/* Pie del panel: limpiar y ver resultados */}
              <div className="pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
                {cantidadFiltrosVentana > 0 && (
                  <button type="button" onClick={limpiarFiltros} className="px-6 py-2.5 rounded-xl bg-[#F4F7F7] text-[#1A3D3D] text-[13px] font-semibold hover:bg-gray-200 transition-all duration-300 ease-in-out">Borrar filtros</button>
                )}
                <button type="button" onClick={() => setVerFiltros(false)} className="px-6 py-2.5 rounded-xl bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white text-[13px] font-semibold transition-all duration-300 ease-in-out">
                  Ver {(mostrarOfertas ? ofertasFiltradas.length : 0) + (mostrarDisponibles ? disponiblesFiltrados.length : 0)} resultados
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 md:hidden bg-[#F4F7F7] p-1.5 rounded-[20px]">
            {PESTANAS.map((t) => (
              <button key={t.id} type="button" onClick={() => cambiarFiltro('tab', t.id === 'todo' ? '' : t.id)} className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${pestana === t.id ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666]'}`}>
                <t.icon className="w-4 h-4 shrink-0" /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 relative flex items-center bg-[#F4F7F7] border border-transparent focus-within:border-[#2D6A6A] rounded-[20px] md:rounded-full px-4 py-3 md:py-2.5 transition-all">
            <Search className="text-[#666666] w-4 h-4 shrink-0" />
            <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: Guardia, ecografía, Morón..." className="w-full bg-transparent pl-3 text-[14px] text-[#1A3D3D] focus:outline-none placeholder:text-gray-400" />
            {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda"><X className="w-4 h-4 text-gray-400" /></button>}
          </div>

          <button type="button" onClick={() => setVerFiltros((v) => !v)} className={`shrink-0 px-6 py-3 md:py-2.5 rounded-[20px] md:rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${cantidadFiltrosVentana ? 'bg-[#1A3D3D] text-white' : 'bg-[#F4F7F7] text-[#1A3D3D] hover:bg-gray-200'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filtros{cantidadFiltrosVentana ? ` · ${cantidadFiltrosVentana}` : ''}
          </button>
        </div>
      </div>



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
        ) : errorCarga && ofertas.length === 0 && disponibles.length === 0 ? (
          <ErrorCarga
            codigo={errorCarga}
            onReintentar={() => { setErrorCarga(''); setCargando(true); recargar(); }}
          />
        ) : ofertas.length === 0 && disponibles.length === 0 ? (
          <EstadoVacio onPublicar={pedirPublicarBusqueda} />
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
                <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-3 px-1">Disponibles para trabajar · {disponiblesFiltrados.length}</h2>
                {disponiblesFiltrados.length > 0 ? (
                  <div className={claseGrilla}>
                    {disponiblesFiltrados.map((d) => <TarjetaDisponible key={d.id} disponible={d} onAbrir={() => setDisponibleAbierto(d)} />)}
                  </div>
                ) : (
                  <p className="bg-white/70 rounded-[24px] border border-gray-100 p-5 text-[14px] text-[#666666]">{disponibles.length === 0 ? 'Todavía no hay nadie disponible.' : 'No hay nadie disponible con estos filtros.'}</p>
                )}
              </section>
            )}
          </div>
        )}
      </div>



      <DetalleDisponible disponible={disponibleAbierto} abierto={!!disponibleAbierto} onCerrar={cerrarDisponible} conSesion={permisos.conSesion} verificada={permisos.verificada} currentUser={currentUser} />

      <CartelRegistro abierto={cartel === 'registro-publicar'} onCerrar={() => setCartel(null)} motivo="publicar" />
      <CartelVerificacion abierto={cartel === 'verificacion'} onCerrar={() => setCartel(null)} />
      <VentanaBolsa abierta={cartel === 'solo-clinicas' || cartel === 'solo-profesionales'} onCerrar={() => setCartel(null)} ancho="max-w-md">
        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] leading-tight mb-2 pr-10">
          {cartel === 'solo-clinicas' ? 'Publicar ofertas es para clínicas' : 'Marcarse como disponible es para profesionales y estudiantes'}
        </h3>
        <p className="text-[14px] text-[#666666] leading-relaxed">
          {cartel === 'solo-clinicas' ? 'Con tu cuenta podés marcarte como disponible y postularte a las ofertas.' : 'Con tu cuenta de clínica podés publicar ofertas y contactar a los profesionales disponibles.'}
        </p>
      </VentanaBolsa>
    </div>
  );
}




// Estilos del panel de filtros (los mismos que usa la Cartilla)
const clasePildora = (activa) => `px-3 py-1.5 text-[13px] font-medium rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 ${activa ? 'bg-[#2D6A6A] text-white shadow-sm' : 'bg-[#F4F7F7] text-[#666666] hover:bg-gray-200'}`;
const claseTituloPanel = "font-['Montserrat'] font-black text-[#1A3D3D] text-[12px] lg:text-[13px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2";

// Un grupo de pills de una sola opción dentro del panel (tocar de nuevo la saca)
function GrupoPanel({ titulo, opciones, valor, onCambio }) {
  const lista = opciones.map((o) => (typeof o === 'string' ? { id: o, label: o } : o));
  return (
    <div>
      <h3 className={claseTituloPanel}>{titulo}</h3>
      <div className="flex flex-wrap gap-2">
        {lista.map((o) => (
          <button key={o.id} type="button" onClick={() => onCambio(valor === o.id ? '' : o.id)} className={clasePildora(valor === o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}



function AvisoExito({ texto }) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] bg-[#1A3D3D] text-white px-5 py-3 rounded-2xl shadow-xl text-[14px] font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 font-['Inter']">
      <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" /> {texto}
    </div>
  );
}

// Cuando no se pudieron leer las publicaciones (ej: un problema de permisos o de conexión).
// Antes en este caso se mostraba "Estamos sumando las primeras ofertas", como si la bolsa estuviera vacía.
function ErrorCarga({ codigo, onReintentar }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[32px] border border-red-100 shadow-sm px-6">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">No pudimos cargar las publicaciones</h3>
      <p className="text-[#666666] text-[15px] max-w-md mb-6">Hubo un problema al traerlas. Probá de nuevo y, si sigue pasando, avisanos.</p>
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <button type="button" onClick={onReintentar} className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3 rounded-2xl text-[14px] font-semibold transition-colors">
          <RotateCcw className="w-4 h-4" /> Reintentar
        </button>
        <BotonAvisarProblema lugar="bolsa" detalle={codigo} />
      </div>
    </div>
  );
}

function EstadoVacio({ onPublicar }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm px-6">
      <div className="w-20 h-20 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
        <Briefcase className="w-10 h-10 text-[#2D6A6A] opacity-60" />
      </div>
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[20px] md:text-[24px] mb-2">Estamos sumando las primeras ofertas</h3>
      <p className="text-[#666666] text-[15px] max-w-md mb-6">¿Tu clínica busca a alguien o estás buscando trabajo? Sé de los primeros en publicar. Es gratis.</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <button type="button" onClick={onPublicar} className="bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3 rounded-2xl text-[14px] font-semibold transition-colors">Me interesa publicar una búsqueda</button>
      </div>
    </div>
  );
}
