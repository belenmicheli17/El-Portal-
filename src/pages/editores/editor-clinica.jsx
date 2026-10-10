import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ==========================================
// IMPORTACIONES DE FIREBASE
// ==========================================
import { db, storage } from '../../firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import FooterSimple from '../../components/FooterSimple';
import especialidadesData from '../../data/especialidades.json';
import equipamientoData from '../../data/equipamientoClinicas.json';
import provincias from '../../data/provincias.js';
import {
  Tooltip, InputGroup, ToggleSwitch, Accordion, PuntoAlerta, CampoWhatsapp, RecortadorImagen,
  BuscadorDireccionGoogle, SelectorServicios, normalizarServicios, contarServicios,
  soloDigitos, generarSlug, esEmailValido, esDataUrl, whatsappCompleto, usuarioDeInstagram,
  instagramAURL, normalizarWeb, leerArchivoComoDataURL, comprimirImagen
} from '../../components/editor/EditorComponents';
import {
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, Crown,
  ArrowUp, ArrowDown, MapPin, ShieldCheck, Check, ArrowLeft, ArrowRight,
  Lock, Zap, Clock, User, Users, Building2, AlertTriangle, Activity, Microscope,
  Stethoscope, Sparkles, Loader2, CreditCard, ArrowUpRight, MessageSquare,
  Image as ImageIcon, FileCheck, FileText, Heart, Brain, RefreshCw
} from 'lucide-react';

// Ícono propio de bisturí (Lucide no lo tiene)
const IconoBisturi = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 22 18.5 7.5L22 11l-6 11Z"/><path d="M12 5 8 9"/><path d="m11 8 4 4"/><path d="m5 12 7 7"/>
  </svg>
);

// ==========================================
// CONSTANTES
// ==========================================

// Cuando exista la primera clínica de ejemplo, poné acá su link (ej: '/clinica/nombre-de-la-clinica')
const PERFIL_EJEMPLO_URL = '';

// Cantidad máxima de fotos de la galería según el plan
const LIMITE_GALERIA = { gratis: 6, pro: 20 };

// Las clínicas usan las especialidades de siempre + el grupo de equipamiento (que solo ven las clínicas)
const GRUPOS_CLINICA = [...especialidadesData, ...equipamientoData];

const ICONOS_GRUPO = {
  consulta_general: Stethoscope,
  especialidades_medicas: Activity,
  quirurgico_critico: IconoBisturi,
  imagenes: Microscope,
  laboratorio: FileText,
  atencion_por_especie: Heart,
  bienestar_comportamiento: Brain,
  terapias_holisticas: Sparkles,
  equipamiento_infraestructura: Building2
};

// Los 4 pasos que ven los tutores cuando la clínica tiene guardia.
// Ya no se guardan en cada clínica: el perfil público los muestra desde un solo lugar.
const PASOS_URGENCIA = [
  { paso: '01', titulo: 'Mantené la calma', desc: 'Asegurá a tu mascota y evitá movimientos bruscos.' },
  { paso: '02', titulo: 'Llamá o escribí', desc: 'Avisanos que estás en camino para preparar la sala.' },
  { paso: '03', titulo: 'Transporte seguro', desc: 'Usá una transportadora o manta rígida si hay fracturas.' },
  { paso: '04', titulo: 'Traé historial', desc: 'Si toma medicación o tiene estudios previos, traelos con vos.' }
];

const PREGUNTAS_SUGERIDAS = [
  '¿Atienden feriados y fines de semana?',
  '¿Puedo visitar a mi mascota si está internada?',
  '¿Atienden animales exóticos?',
  '¿Tienen quirófano para cirugías de alta complejidad?',
  '¿Aceptan obras sociales o seguros para mascotas?',
  '¿Qué medios de pago aceptan?',
  '¿Cómo me avisan si el estado de mi mascota cambia durante la internación?',
  '¿Puedo llamar para preguntar cómo está mi mascota internada?'
];

// Cómo se recorta cada tipo de foto
const CONFIG_RECORTE = {
  logo: { forma: 'cuadrado', tamanoSalida: 512, formato: 'png' },
  staff: { forma: 'cuadrado', tamanoSalida: 400, formato: 'jpeg' },
  caso: { forma: 'cuadrado', tamanoSalida: 800, formato: 'jpeg' }
};

// Todo lo que la clínica puede editar. El editor guarda SOLO estos campos:
// así nunca pisa los que maneja el sistema (uid, slug, visible, socioVitalicio, etc.)
const DATOS_INICIALES = {
  nombre: '',
  descripcion: '',
  historia: '',
  añosExperiencia: '',
  foto: '',
  direccion: '',
  placeId: '',
  lat: null,
  lng: null,
  provincia: '',
  localidad: '',
  barrio: '',
  telefono: '',
  whatsapp: '',
  email: '',
  sitioWeb: '',
  redes: { instagram: '', facebook: '' },
  guardia24hs: false,
  telefonoGuardia: '',
  horarios: { semanaDesde: '', semanaHasta: '', sabadoDesde: '', sabadoHasta: '' },
  servicios: {},
  staff: [],
  faqs: [{ id: 1, pregunta: '¿Qué incluye la internación?', respuesta: '', isDefault: true }],
  casos: [],
  galeria: [],
  // Temporal hasta integrar Mercado Pago: el cambio de plan se guarda desde el editor
  planActual: 'pro'
};
const CAMPOS_EDITABLES = Object.keys(DATOS_INICIALES);

// ==========================================
// FUNCIONES AUXILIARES DE DATOS
// ==========================================

// Asegura que un número tenga el 54 adelante (los datos viejos a veces no lo tienen)
const conPrefijo54 = (valor) => {
  const digitos = soloDigitos(valor);
  if (!digitos) return '';
  return digitos.startsWith('54') ? digitos : `54${digitos}`;
};

// Convierte lo que viene de Firestore al formato del formulario, rellenando lo que falte
const prepararDatosCargados = (data) => ({
  ...DATOS_INICIALES,
  nombre: data.nombre || '',
  descripcion: data.descripcion || '',
  historia: data.historia || '',
  añosExperiencia: data.añosExperiencia === null || data.añosExperiencia === undefined ? '' : String(data.añosExperiencia),
  foto: data.foto || '',
  direccion: data.direccion || '',
  placeId: data.placeId || '',
  lat: typeof data.lat === 'number' ? data.lat : null,
  lng: typeof data.lng === 'number' ? data.lng : null,
  provincia: data.provincia || '',
  localidad: data.localidad || '',
  barrio: data.barrio || '',
  telefono: data.telefono || '',
  whatsapp: conPrefijo54(data.whatsapp),
  email: data.email || '',
  sitioWeb: data.sitioWeb || '',
  redes: { ...DATOS_INICIALES.redes, ...(data.redes || {}) },
  guardia24hs: data.guardia24hs === true,
  telefonoGuardia: conPrefijo54(data.telefonoGuardia),
  horarios: { ...DATOS_INICIALES.horarios, ...(data.horarios || {}) },
  servicios: normalizarServicios(data.servicios, GRUPOS_CLINICA),
  staff: Array.isArray(data.staff) ? data.staff.map((m) => ({
    id: m.id || Date.now() + Math.random(),
    nombre: m.nombre || '',
    tipoMatricula: m.tipoMatricula || 'MP',
    matricula: m.matricula || '',
    especialidad: m.especialidad || '',
    bio: m.bio || '',
    foto: m.foto || '',
    profesionalUid: m.profesionalUid || ''
  })) : [],
  faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : DATOS_INICIALES.faqs,
  casos: Array.isArray(data.casos) ? data.casos.map((c) => ({
    id: c.id || Date.now() + Math.random(),
    nombre: c.nombre || '',
    patologia: c.patologia || '',
    desc: c.desc || '',
    fotos: Array.isArray(c.fotos) ? c.fotos : [],
    esSensible: c.esSensible === true
  })) : [],
  galeria: Array.isArray(data.galeria) ? data.galeria : [],
  planActual: ['gratis', 'free'].includes(data.planActual) ? 'gratis' : 'pro'
});

// Junta todos los links de Storage que usa el perfil (para borrar los que ya no se usan)
const urlsDeStorage = (datos) => {
  const lista = [];
  const sumar = (url) => { if (typeof url === 'string' && url.includes('firebasestorage.googleapis.com')) lista.push(url); };
  if (!datos) return lista;
  sumar(datos.foto);
  (datos.staff || []).forEach((m) => sumar(m.foto));
  (datos.galeria || []).forEach((g) => sumar(g.url));
  (datos.casos || []).forEach((c) => (c.fotos || []).forEach(sumar));
  return lista;
};

// Un horario válido es un número entre 0 y 24
const horaValida = (valor) => valor !== '' && !Number.isNaN(Number(valor)) && Number(valor) >= 0 && Number(valor) <= 24;

// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
export default function EditorClinico() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshUser } = useAuth();

  // ----- Estados de la pantalla -----
  const [activeTab, setActiveTab] = useState('perfil');
  const [openSection, setOpenSection] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [tempSelectedPlan, setTempSelectedPlan] = useState('pro');
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, tipo: null, targetId: null });
  const [saveStatus, setSaveStatus] = useState('idle');
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [tiempoSinGuardar, setTiempoSinGuardar] = useState(0);
  const [mostrarErroresSecciones, setMostrarErroresSecciones] = useState(false);
  const [tooltipHintVisto, setTooltipHintVisto] = useState(true);

  // ----- Estados de los datos -----
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [_formData, _setFormData] = useState(DATOS_INICIALES);
  const [savedData, setSavedData] = useState(null);
  const [esNueva, setEsNueva] = useState(false);
  const [socioUsuario, setSocioUsuario] = useState(false);
  // Datos que maneja el sistema (no los edita la clínica)
  const [docSistema, setDocSistema] = useState({ existe: false, slug: '', slugLegado: null, socioVitalicio: false, visibleLegado: undefined });

  const formData = _formData;
  const setFormData = (action) => {
    _setFormData((prev) => (typeof action === 'function' ? action(prev) : action));
  };

  // Hay cambios sin guardar si el formulario es distinto a lo último guardado
  const haycambiosSinGuardar = useMemo(
    () => savedData !== null && JSON.stringify(formData) !== JSON.stringify(savedData),
    [formData, savedData]
  );

  // Una socia vitalicia tiene todo habilitado, sin importar el plan guardado
  const esSocioVitalicio = socioUsuario || docSistema.socioVitalicio;
  const isPro = esSocioVitalicio || formData.planActual === 'pro';
  const limiteGaleria = isPro ? LIMITE_GALERIA.pro : LIMITE_GALERIA.gratis;

  // ==========================================
  // EFECTOS
  // ==========================================

  // Si la URL trae un pedido de pestaña (ej: desde el Ecosistema), la abrimos
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Este editor es solo para clínicas: los otros roles vuelven al Ecosistema
  useEffect(() => {
    if (currentUser?.rol && ['profesional', 'empresa', 'proveedor', 'alumno'].includes(currentUser.rol)) {
      navigate('/ecosistema', { replace: true });
    }
  }, [currentUser?.rol]);

  // Carga inicial: una sola lectura ordenada (antes había dos que se pisaban)
  useEffect(() => {
    if (!currentUser?.uid) return;
    let cancelado = false;

    const cargar = async () => {
      setIsLoadingData(true);
      setErrorCarga(false);
      try {
        const uid = currentUser.uid;
        const snapUsuario = await getDoc(doc(db, 'usuarios', uid));
        const datosUsuario = snapUsuario.exists() ? snapUsuario.data() : {};

        // 1. Buscamos la clínica por su uid (el formato nuevo)
        const snapClinica = await getDoc(doc(db, 'clinicas', uid));
        let datosClinica = snapClinica.exists() ? snapClinica.data() : null;
        let slugLegado = null;

        // 2. Si no está, buscamos el formato viejo (documento con el nombre de la clínica)
        if (!datosClinica && datosUsuario.slug && datosUsuario.slug !== uid) {
          const snapViejo = await getDoc(doc(db, 'clinicas', datosUsuario.slug)).catch(() => null);
          if (snapViejo && snapViejo.exists() && (snapViejo.data().uid || uid) === uid) {
            datosClinica = snapViejo.data();
            slugLegado = datosUsuario.slug;
          }
        }

        if (cancelado) return;

        setSocioUsuario(datosUsuario.socioVitalicio === true);
        setTooltipHintVisto(datosUsuario.tooltipHintVisto ?? false);
        setDocSistema({
          existe: snapClinica.exists(),
          slug: datosClinica?.slug || '',
          slugLegado,
          socioVitalicio: datosClinica?.socioVitalicio === true,
          visibleLegado: slugLegado ? datosClinica?.visible : undefined
        });

        const preparados = prepararDatosCargados(datosClinica || {});
        _setFormData(preparados);
        setSavedData(preparados);
        setEsNueva(!datosClinica);
      } catch (e) {
        console.error('Error cargando los datos de la clínica:', e);
        if (!cancelado) setErrorCarga(true);
      } finally {
        if (!cancelado) setIsLoadingData(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, [currentUser?.uid, intentoCarga]);

  // Contador de minutos sin guardar (para avisar a los 2 minutos)
  useEffect(() => {
    if (!haycambiosSinGuardar) {
      setTiempoSinGuardar(0);
      return;
    }
    const intervalo = setInterval(() => setTiempoSinGuardar((prev) => prev + 1), 60000);
    return () => clearInterval(intervalo);
  }, [haycambiosSinGuardar]);

  // Si cierra la pestaña o recarga con cambios sin guardar, el navegador pregunta antes
  useEffect(() => {
    const avisar = (e) => {
      if (!haycambiosSinGuardar) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [haycambiosSinGuardar]);

  // Tipografías
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, []);

  // ==========================================
  // SECCIONES INCOMPLETAS Y PROGRESO (una sola función para las dos cosas)
  // ==========================================
  const seccionesIncompletas = () => {
    const incompletas = new Set();
    if (!formData.nombre.trim() || !formData.foto || formData.descripcion.trim().length < 30) incompletas.add('identidad');
    const horariosCargados = formData.guardia24hs || (horaValida(formData.horarios.semanaDesde) && horaValida(formData.horarios.semanaHasta));
    if (!formData.placeId || !whatsappCompleto(formData.whatsapp) || !horariosCargados) incompletas.add('contacto');
    if (formData.guardia24hs && !whatsappCompleto(formData.telefonoGuardia)) incompletas.add('guardia');
    if (isPro && contarServicios(formData.servicios) === 0) incompletas.add('servicios');
    if (isPro && !formData.staff.some((m) => m.nombre.trim())) incompletas.add('staff');
    return incompletas;
  };

  const incompletas = seccionesIncompletas();
  const seccionesEvaluadas = ['identidad', 'contacto', ...(formData.guardia24hs ? ['guardia'] : []), ...(isPro ? ['servicios', 'staff'] : [])];
  const progress = Math.round(100 * seccionesEvaluadas.filter((s) => !incompletas.has(s)).length / seccionesEvaluadas.length);
  const mostrarAlertas = mostrarErroresSecciones || esNueva;
  const alerta = (seccion) => mostrarAlertas && incompletas.has(seccion);

  // ==========================================
  // MANEJO DEL FORMULARIO
  // ==========================================
  const handleChange = (e) => {
    const { name, id, value } = e.target;
    const campo = name || id;
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const handleRedesChange = (red, value) => {
    setFormData((prev) => ({ ...prev, redes: { ...prev.redes, [red]: value } }));
  };

  const handleHorarioChange = (campo, value) => {
    const soloNumeros = value.replace(/\D/g, '').slice(0, 2);
    setFormData((prev) => ({ ...prev, horarios: { ...prev.horarios, [campo]: soloNumeros } }));
  };

  const handleArrayAdd = (listName, defaultObj) => {
    setFormData((prev) => ({ ...prev, [listName]: [...prev[listName], { id: Date.now(), ...defaultObj }] }));
  };

  const handleArrayUpdate = (listName, id, field, value) => {
    setFormData((prev) => ({ ...prev, [listName]: prev[listName].map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  };

  const handleArrayRemove = (listName, id) => {
    setFormData((prev) => ({ ...prev, [listName]: prev[listName].filter((item) => item.id !== id) }));
  };

  const handleArrayMove = (listName, index, direction) => {
    setFormData((prev) => {
      const nuevo = [...prev[listName]];
      if (direction === 'up' && index > 0) [nuevo[index - 1], nuevo[index]] = [nuevo[index], nuevo[index - 1]];
      else if (direction === 'down' && index < nuevo.length - 1) [nuevo[index + 1], nuevo[index]] = [nuevo[index], nuevo[index + 1]];
      return { ...prev, [listName]: nuevo };
    });
  };

  // ----- Dirección con Google -----
  const escribirDireccion = (texto) => {
    // Si escribe a mano, la dirección deja de estar confirmada por Google
    setFormData((prev) => ({ ...prev, direccion: texto, placeId: '', lat: null, lng: null }));
  };

  const elegirDireccion = (lugar) => {
    setFormData((prev) => ({
      ...prev,
      direccion: lugar.direccion,
      placeId: lugar.placeId,
      lat: lugar.lat,
      lng: lugar.lng,
      provincia: lugar.provincia,
      localidad: lugar.localidad,
      barrio: lugar.barrio
    }));
  };

  // ----- Preguntas frecuentes -----
  const handleFaqChange = (id, field, value) => {
    setFormData((prev) => ({ ...prev, faqs: prev.faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)) }));
  };

  const addCustomFaq = () => {
    setFormData((prev) => {
      const usadas = prev.faqs.map((f) => f.pregunta.trim());
      const siguiente = PREGUNTAS_SUGERIDAS.find((p) => !usadas.includes(p));
      return { ...prev, faqs: [...prev.faqs, { id: Date.now(), pregunta: siguiente || '', respuesta: '', isDefault: false }] };
    });
  };

  const removeFaq = (id) => {
    setFormData((prev) => ({ ...prev, faqs: prev.faqs.filter((faq) => faq.id !== id) }));
  };

  // ----- Fotos: elegir → encuadrar → (se suben a Storage recién al guardar) -----
  const handleFileSelect = async (e, tipo, targetId = null) => {
    const archivo = e.target.files?.[0];
    e.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      setModalConfig({ isOpen: true, title: 'Formato no válido', message: 'Elegí una imagen en formato JPG o PNG.', type: 'error' });
      return;
    }
    if (archivo.size > 15 * 1024 * 1024) {
      setModalConfig({ isOpen: true, title: 'Imagen muy pesada', message: 'La imagen no puede pesar más de 15 MB.', type: 'error' });
      return;
    }
    try {
      const dataUrl = await leerArchivoComoDataURL(archivo);
      setCropModal({ isOpen: true, imageSrc: dataUrl, tipo, targetId });
    } catch (error) {
      console.error('Error leyendo la imagen:', error);
      setModalConfig({ isOpen: true, title: 'No pudimos abrir la imagen', message: 'Probá con otra foto.', type: 'error' });
    }
  };

  const cerrarRecorte = () => setCropModal({ isOpen: false, imageSrc: null, tipo: null, targetId: null });

  const saveCroppedImage = (imagenRecortada) => {
    if (cropModal.tipo === 'logo') {
      setFormData((prev) => ({ ...prev, foto: imagenRecortada }));
    } else if (cropModal.tipo === 'staff') {
      handleArrayUpdate('staff', cropModal.targetId, 'foto', imagenRecortada);
    } else if (cropModal.tipo === 'caso') {
      setFormData((prev) => ({
        ...prev,
        casos: prev.casos.map((c) => (c.id === cropModal.targetId ? { ...c, fotos: [...c.fotos, imagenRecortada] } : c))
      }));
    }
    cerrarRecorte();
  };

  // ----- Casos clínicos: fotos -----
  const removeCasoFoto = (casoId, indice) => {
    setFormData((prev) => ({
      ...prev,
      casos: prev.casos.map((c) => (c.id === casoId ? { ...c, fotos: c.fotos.filter((_, i) => i !== indice) } : c))
    }));
  };

  const moveCasoFoto = (casoId, indice) => {
    setFormData((prev) => ({
      ...prev,
      casos: prev.casos.map((c) => {
        if (c.id !== casoId || indice === 0) return c;
        const fotos = [...c.fotos];
        [fotos[indice - 1], fotos[indice]] = [fotos[indice], fotos[indice - 1]];
        return { ...c, fotos };
      })
    }));
  };

  // ----- Galería -----
  const agregarFotosGaleria = async (e) => {
    const archivos = Array.from(e.target.files || []).filter((a) => a.type.startsWith('image/'));
    e.target.value = null;
    const disponibles = limiteGaleria - formData.galeria.length;
    if (!archivos.length || disponibles <= 0) return;
    const aAgregar = archivos.slice(0, disponibles);
    try {
      const nuevas = await Promise.all(aAgregar.map(async (archivo, i) => ({
        id: Date.now() + i,
        url: await comprimirImagen(await leerArchivoComoDataURL(archivo), 1400, 0.9),
        epigrafe: '',
        storagePath: '',
        esSensible: false
      })));
      setFormData((prev) => ({ ...prev, galeria: [...prev.galeria, ...nuevas].slice(0, limiteGaleria) }));
      if (archivos.length > disponibles) {
        setModalConfig({
          isOpen: true,
          title: 'Llegaste al límite',
          message: `Agregamos ${disponibles} foto${disponibles !== 1 ? 's' : ''}. Tu plan permite hasta ${limiteGaleria} en la galería.`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error preparando las fotos de la galería:', error);
      setModalConfig({ isOpen: true, title: 'No pudimos agregar las fotos', message: 'Probá de nuevo con otras imágenes.', type: 'error' });
    }
  };

  // ==========================================
  // VALIDACIÓN ANTES DE GUARDAR
  // Devuelve el primer problema que encuentra, con la pestaña y sección donde arreglarlo
  // ==========================================
  const validarAntesDeGuardar = () => {
    const f = formData;
    if (!f.nombre.trim()) return { tab: 'perfil', seccion: 'identidad', titulo: 'Falta el nombre', mensaje: 'Escribí el nombre de la institución.' };
    if (!f.foto) return { tab: 'perfil', seccion: 'identidad', titulo: 'Falta la foto', mensaje: 'Subí el logo de la clínica o una foto del equipo.' };
    if (!f.direccion.trim() || !f.placeId) {
      return {
        tab: 'perfil', seccion: 'contacto', titulo: 'Dirección sin confirmar',
        mensaje: 'En "Contacto y Ubicación", escribí la dirección y elegí una opción de la lista de sugerencias de Google.'
      };
    }
    if (!whatsappCompleto(f.whatsapp)) return { tab: 'perfil', seccion: 'contacto', titulo: 'Falta el WhatsApp', mensaje: 'Cargá el WhatsApp de la clínica (con código de área, ej: 11 2345 6789).' };
    if (f.email.trim() && !esEmailValido(f.email)) return { tab: 'perfil', seccion: 'contacto', titulo: 'Revisá el email', mensaje: 'Parece que al email le falta algo.' };

    if (f.guardia24hs) {
      if (!whatsappCompleto(f.telefonoGuardia)) {
        return { tab: 'perfil', seccion: 'urgencias', titulo: 'Falta el WhatsApp de guardia', mensaje: 'Si tenés guardia 24hs, cargá el WhatsApp al que te escriben los tutores en una urgencia.' };
      }
    } else {
      const { semanaDesde, semanaHasta, sabadoDesde, sabadoHasta } = f.horarios;
      if (!horaValida(semanaDesde) || !horaValida(semanaHasta) || Number(semanaDesde) >= Number(semanaHasta)) {
        return { tab: 'perfil', seccion: 'contacto', titulo: 'Revisá los horarios', mensaje: 'Completá el horario de lunes a viernes con números del 0 al 24 (la hora de apertura tiene que ser menor que la de cierre).' };
      }
      if ((sabadoDesde || sabadoHasta) && (!horaValida(sabadoDesde) || !horaValida(sabadoHasta) || Number(sabadoDesde) >= Number(sabadoHasta))) {
        return { tab: 'perfil', seccion: 'contacto', titulo: 'Revisá el horario del sábado', mensaje: 'Completá las dos horas del sábado (o dejalas vacías si no atienden).' };
      }
    }

    if (isPro) {
      const staffSinNombre = f.staff.some((m) => !m.nombre.trim() && (m.especialidad.trim() || m.matricula.trim() || m.bio.trim() || m.foto));
      if (staffSinNombre) return { tab: 'staff', seccion: null, titulo: 'Falta un nombre', mensaje: 'Hay un profesional del staff cargado sin nombre. Completalo o borralo.' };
      const casoSinTitulo = f.casos.some((c) => !c.patologia.trim() && (c.nombre.trim() || c.desc.trim() || c.fotos.length));
      if (casoSinTitulo) return { tab: 'casos', seccion: null, titulo: 'Falta el motivo de un caso', mensaje: 'Completá "Patología o motivo" en cada caso clínico, o borrá el que no uses.' };
    }
    return null;
  };

  // Limpia el formulario antes de guardar (saca espacios, filas vacías, arma los links)
  const limpiarFormulario = (f) => ({
    ...f,
    nombre: f.nombre.trim(),
    descripcion: f.descripcion.trim(),
    historia: f.historia.trim(),
    email: f.email.trim(),
    telefono: f.telefono.trim(),
    sitioWeb: normalizarWeb(f.sitioWeb),
    redes: { instagram: instagramAURL(f.redes.instagram), facebook: normalizarWeb(f.redes.facebook) },
    staff: f.staff.filter((m) => m.nombre.trim()).map((m) => ({ ...m, nombre: m.nombre.trim(), especialidad: m.especialidad.trim(), bio: m.bio.trim() })),
    casos: f.casos.filter((c) => c.patologia.trim() || c.nombre.trim() || c.desc.trim() || c.fotos.length).map((c) => ({ ...c, nombre: c.nombre.trim(), patologia: c.patologia.trim(), desc: c.desc.trim() })),
    faqs: f.faqs.filter((q) => q.pregunta.trim()).map((q) => ({ ...q, pregunta: q.pregunta.trim(), respuesta: q.respuesta.trim() })),
    galeria: f.galeria.map((g) => ({ ...g, epigrafe: (g.epigrafe || '').trim() }))
  });

  // Sube una foto a Storage solo si es nueva. Si falla, corta el guardado (antes se guardaba vacía)
  const subirSiEsNueva = async (valor, ruta) => {
    if (!esDataUrl(valor)) return valor || '';
    const archivoRef = ref(storage, ruta);
    await uploadString(archivoRef, valor, 'data_url');
    return getDownloadURL(archivoRef);
  };

  // Busca un slug que no esté usando otra clínica (si está ocupado, le suma -2, -3...)
  const buscarSlugLibre = async (base, uid) => {
    for (let i = 0; i < 20; i++) {
      const candidato = i === 0 ? base : `${base}-${i + 1}`;
      const snap = await getDocs(query(collection(db, 'clinicas'), where('slug', '==', candidato)));
      const ocupado = snap.docs.some((d) => d.id !== uid && d.data().uid !== uid);
      if (!ocupado) return candidato;
    }
    return `${base}-${Date.now().toString(36).slice(-4)}`;
  };

  // ==========================================
  // GUARDAR (devuelve true si salió bien y false si no)
  // ==========================================
  const handleSaveData = async () => {
    if (!currentUser?.uid) {
      setModalConfig({ isOpen: true, title: 'Sesión expirada', message: 'Tu sesión expiró. Volvé a iniciar sesión.', type: 'error' });
      return false;
    }

    const problema = validarAntesDeGuardar();
    if (problema) {
      setMostrarErroresSecciones(true);
      setModalConfig({ isOpen: true, title: problema.titulo, message: problema.mensaje, type: 'error' });
      setActiveTab(problema.tab);
      if (problema.seccion) setOpenSection(problema.seccion);
      return false;
    }

    setSaveStatus('saving');
    try {
      const uid = currentUser.uid;
      const marca = Date.now();
      const limpio = limpiarFormulario(formData);

      // 1. Subimos a Storage las fotos nuevas (las que todavía son "data:...")
      const fotoFinal = await subirSiEsNueva(limpio.foto, `clinicas/${uid}/logo_${marca}.${limpio.foto.startsWith('data:image/png') ? 'png' : 'jpg'}`);
      const staffFinal = await Promise.all(limpio.staff.map(async (m) => ({
        ...m,
        foto: await subirSiEsNueva(m.foto, `clinicas/${uid}/staff_${m.id}_${marca}.jpg`)
      })));
      const galeriaFinal = await Promise.all(limpio.galeria.map(async (g) => {
        if (!esDataUrl(g.url)) return g;
        const ruta = `clinicas/${uid}/galeria/${g.id}_${marca}.jpg`;
        const url = await subirSiEsNueva(g.url, ruta);
        return { ...g, url, storagePath: ruta };
      }));
      const casosFinal = await Promise.all(limpio.casos.map(async (c) => ({
        ...c,
        fotos: await Promise.all(c.fotos.map((f, i) => subirSiEsNueva(f, `clinicas/${uid}/casos/${c.id}_${i}_${marca}.jpg`)))
      })));

      const guardado = {
        ...limpio,
        foto: fotoFinal,
        staff: staffFinal,
        galeria: galeriaFinal,
        casos: casosFinal,
        planActual: esSocioVitalicio ? 'pro' : limpio.planActual
      };

      // 2. Lo que va a Firestore (igual al formulario, pero los años como número)
      const paraFirestore = {
        ...guardado,
        añosExperiencia: guardado.añosExperiencia === '' ? null : Number(guardado.añosExperiencia)
      };

      // 3. El slug se arma una sola vez y queda fijo (así no se rompen los links ni los QR)
      const slug = docSistema.slug || await buscarSlugLibre(generarSlug(guardado.nombre) || 'clinica', uid);

      // 4. Datos del sistema: se escriben solo la primera vez (o al pasar del formato viejo)
      const sistema = { uid, slug, ultimaEdicion: serverTimestamp() };
      if (!docSistema.existe) {
        if (docSistema.slugLegado) {
          if (docSistema.visibleLegado !== undefined) sistema.visible = docSistema.visibleLegado;
        } else {
          sistema.visible = false; // una clínica nueva no se publica hasta que la verifiquemos
        }
      }

      // 5. Guardamos SOLO los campos editables + los del sistema. Nada más se toca.
      await setDoc(doc(db, 'clinicas', uid), { ...paraFirestore, ...sistema }, { mergeFields: [...CAMPOS_EDITABLES, ...Object.keys(sistema)] });

      // 6. Si venía del formato viejo, borramos el documento viejo para que no quede duplicado
      if (docSistema.slugLegado) {
        await deleteDoc(doc(db, 'clinicas', docSistema.slugLegado)).catch((e) => console.error('No se pudo borrar el documento viejo:', e));
      }

      // 7. Sincronizamos nombre y slug en "usuarios"
      await setDoc(doc(db, 'usuarios', uid), { nombre: guardado.nombre, nombreCompleto: guardado.nombre, slug }, { merge: true });

      // 8. Borramos de Storage las fotos que ya no se usan (si falla, no pasa nada)
      const enUso = new Set(urlsDeStorage(guardado));
      urlsDeStorage(savedData)
        .filter((url) => !enUso.has(url))
        .forEach((url) => deleteObject(ref(storage, url)).catch(() => {}));

      // 9. Actualizamos la pantalla con lo guardado (las fotos ya como links, no como "data:")
      _setFormData(guardado);
      setSavedData(guardado);
      setDocSistema((prev) => ({ ...prev, existe: true, slug, slugLegado: null }));
      setEsNueva(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
      if (refreshUser) await refreshUser();
      return true;
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      setSaveStatus('error');
      setModalConfig({
        isOpen: true,
        title: 'Error al guardar',
        message: 'Hubo un problema al guardar o al subir alguna foto. Revisá tu conexión y probá de nuevo: no se perdió nada de lo que cargaste.',
        type: 'error'
      });
      setTimeout(() => setSaveStatus('idle'), 2500);
      return false;
    }
  };

  // ----- Planes -----
  const handleConfirmChangePlan = () => {
    setFormData((prev) => ({ ...prev, planActual: tempSelectedPlan }));
    setIsPlanModalOpen(false);
    if (tempSelectedPlan === 'gratis' && ['servicios', 'staff', 'casos'].includes(activeTab)) setActiveTab('cuenta');
    setModalConfig({
      isOpen: true,
      title: 'Plan actualizado',
      message: `Elegiste el plan ${tempSelectedPlan === 'pro' ? 'Clínica PRO' : 'Básico (gratis)'}. Tocá "Guardar cambios" para confirmarlo.`,
      type: 'success'
    });
  };

  const openPlanModal = () => {
    setTempSelectedPlan(formData.planActual);
    setIsPlanModalOpen(true);
  };

  // ----- Navegación respetando los cambios sin guardar -----
  const irA = (ruta) => {
    if (haycambiosSinGuardar) {
      setPendingNavigation(ruta);
      setExitModalOpen(true);
    } else {
      navigate(ruta);
    }
  };

  const verPerfilPublico = () => {
    if (!docSistema.slug) {
      setModalConfig({ isOpen: true, title: 'Todavía no hay perfil', message: 'Guardá tu perfil por primera vez para poder verlo.', type: 'error' });
      return;
    }
    irA(`/clinica/${docSistema.slug}`);
  };

  // ==========================================
  // PANTALLAS DE CARGA Y ERROR (siempre después de todos los hooks)
  // ==========================================
  if (!currentUser) return null;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#2D6A6A]/30 border-t-[#2D6A6A] rounded-full animate-spin"></div>
        <p className="text-[#1A3D3D] font-bold text-sm">Cargando tu panel...</p>
      </div>
    );
  }

  if (errorCarga) {
    // Si no pudimos leer los datos, no mostramos el editor vacío (se podrían pisar los datos al guardar)
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-12 shadow-sm border border-gray-100 text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D] mb-2">No pudimos cargar tu perfil</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">Revisá tu conexión. ¿Probamos de nuevo?</p>
          <button
            type="button"
            onClick={() => setIntentoCarga((n) => n + 1)}
            className="w-full px-8 py-3.5 rounded-xl font-bold text-white bg-[#1A3D3D] hover:bg-[#2D6A6A] transition-colors shadow-lg text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Avisos del menú lateral
  const alertaPerfil = ['identidad', 'contacto', 'guardia'].some(alerta);
  const configRecorte = CONFIG_RECORTE[cropModal.tipo] || CONFIG_RECORTE.logo;
  const ubicacionTexto = [formData.localidad, formData.provincia].filter(Boolean).join(', ');

  // Botón de guardar (se usa arriba y abajo)
  const BotonGuardar = ({ anchoCompleto = false }) => (
    <button
      onClick={handleSaveData}
      disabled={saveStatus === 'saving' || saveStatus === 'saved'}
      className={`px-6 md:px-8 py-3 rounded-xl font-bold text-[11px] md:text-[12px] uppercase tracking-[0.15em] shadow-md transition-all flex items-center justify-center gap-2 ${anchoCompleto ? 'w-full md:w-auto' : ''}
        ${saveStatus === 'saving' ? 'bg-[#1A3D3D] text-white opacity-70 cursor-not-allowed' :
          saveStatus === 'saved' ? 'bg-[#4DB6AC] text-white cursor-default' :
          'bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] hover:-translate-y-0.5'}`}
    >
      {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
      {saveStatus === 'saved' && <Check className="w-4 h-4" />}
      {saveStatus === 'idle' && <Save className="w-4 h-4" />}
      {saveStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
      {saveStatus === 'saving' ? <span>Guardando...</span> :
        saveStatus === 'saved' ? <span>¡Guardado!</span> :
        saveStatus === 'error' ? <span>Error</span> :
        <span>Guardar cambios</span>}
    </button>
  );

  // Caja "Ver perfil de ejemplo": por ahora sin link, hasta que exista la primera clínica
  const CajaPerfilEjemplo = ({ className = '' }) => (
    <div className={`bg-[#1A3D3D]/5 border border-[#1A3D3D]/10 rounded-2xl p-4 ${className}`}>
      <p className="text-xs font-bold text-[#1A3D3D] leading-snug mb-3">¿Querés ver cómo quedaría tu perfil público?</p>
      {PERFIL_EJEMPLO_URL ? (
        <a
          href={PERFIL_EJEMPLO_URL}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:border-[#4DB6AC] hover:text-[#4DB6AC] transition-all flex items-center justify-center gap-1.5 group shadow-sm"
        >
          Ver perfil de ejemplo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </a>
      ) : (
        <button
          type="button"
          className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-default"
          title="Muy pronto"
        >
          Ver perfil de ejemplo <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  // ==========================================
  // PANTALLA
  // ==========================================
  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased text-left text-[#1A3D3D] selection:bg-[#4DB6AC] selection:text-white relative w-full overflow-x-hidden flex flex-col">

      {/* MODAL: CAMBIOS SIN GUARDAR */}
      {exitModalOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D] mb-2">Tenés cambios sin guardar</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Si salís ahora, los cambios que hiciste se van a perder.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  const destino = pendingNavigation;
                  setExitModalOpen(false);
                  const salioBien = await handleSaveData();
                  // Solo salimos si se guardó bien; si no, queda el aviso de error y sigue editando
                  if (salioBien && destino) navigate(destino);
                  setPendingNavigation(null);
                }}
                className="w-full px-8 py-3.5 rounded-xl font-bold text-white bg-[#1A3D3D] hover:bg-[#2D6A6A] transition-colors shadow-lg text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar y salir
              </button>
              <button
                onClick={() => { setExitModalOpen(false); if (pendingNavigation) navigate(pendingNavigation); }}
                className="w-full px-8 py-3.5 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors text-sm border border-red-100"
              >
                Descartar cambios y salir
              </button>
              <button
                onClick={() => { setExitModalOpen(false); setPendingNavigation(null); }}
                className="w-full px-8 py-3.5 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors text-sm"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENÉRICO DE AVISOS */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
            {modalConfig.type === 'error' ? (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-[#25D366]" />
              </div>
            )}
            <h3 className="font-bold font-['Montserrat'] text-2xl text-[#1A3D3D] mb-3">{modalConfig.title}</h3>
            <p className="text-base text-gray-500 mb-8">{modalConfig.message}</p>
            <button
              onClick={() => setModalConfig({ isOpen: false, title: '', message: '', type: 'info' })}
              className={`px-8 py-3.5 rounded-xl font-bold text-white transition-colors shadow-lg text-base w-full ${modalConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1A3D3D] hover:bg-[#2D6A6A]'}`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ENCUADRE DE FOTOS */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de imagen</h3>
                <p className="text-sm text-gray-500 mt-1">Arrastrá para mover la imagen o usá el zoom.</p>
              </div>
              <button onClick={cerrarRecorte} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center relative">
              <RecortadorImagen
                imagen={cropModal.imageSrc}
                forma={configRecorte.forma}
                tamanoSalida={configRecorte.tamanoSalida}
                formato={configRecorte.formato}
                onAplicar={saveCroppedImage}
                onCancelar={cerrarRecorte}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIO DE PLANES */}
      {isPlanModalOpen && !esSocioVitalicio && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-[32px] w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="font-bold font-['Montserrat'] text-2xl text-[#1A3D3D]">Elegí tu plan</h3>
                  <p className="text-sm text-gray-500 mt-1">Podés mejorar o pausar tu suscripción en cualquier momento.</p>
                </div>
                <button onClick={() => setIsPlanModalOpen(false)} className="p-2.5 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="p-6 md:p-8 bg-[#F4F7F7]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div
                    onClick={() => setTempSelectedPlan('gratis')}
                    className={`relative rounded-[24px] bg-white border-2 p-6 cursor-pointer transition-all duration-300 flex flex-col h-full
                      ${tempSelectedPlan === 'gratis' ? 'border-[#1A3D3D] shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-[#1A3D3D]/30 opacity-70 hover:opacity-100'}`}
                  >
                    {tempSelectedPlan === 'gratis' && (
                      <div className="absolute -top-3 right-6 bg-[#1A3D3D] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3" /> Seleccionado
                      </div>
                    )}
                    <h4 className="text-xl font-black text-gray-800 font-['Montserrat'] mb-1">Plan Básico</h4>
                    <p className="text-3xl font-black text-[#1A3D3D] font-['Montserrat'] my-4">$0 <span className="text-sm text-gray-400 font-medium">/mes</span></p>
                    <p className="text-sm text-gray-500 mb-6 flex-1">Ideal para tener presencia en la Cartilla y que te encuentren fácilmente.</p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-sm text-gray-600 font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Perfil público de tu clínica</li>
                      <li className="flex items-start gap-2 text-sm text-gray-600 font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Enlace a redes sociales y WhatsApp</li>
                      <li className="flex items-start gap-2 text-sm text-gray-600 font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Galería de hasta {LIMITE_GALERIA.gratis} fotos</li>
                      <li className="flex items-start gap-2 text-sm text-gray-400 opacity-50 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> Sección de Staff Médico</li>
                      <li className="flex items-start gap-2 text-sm text-gray-400 opacity-50 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> Detalle de Especialidades y Servicios</li>
                      <li className="flex items-start gap-2 text-sm text-gray-400 opacity-50 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> Casos clínicos con fotos</li>
                    </ul>
                  </div>

                  <div
                    onClick={() => setTempSelectedPlan('pro')}
                    className={`relative rounded-[24px] bg-white border-2 p-6 cursor-pointer transition-all duration-300 flex flex-col h-full
                      ${tempSelectedPlan === 'pro' ? 'border-[#4DB6AC] shadow-[0_10px_30px_rgba(77,182,172,0.2)] scale-[1.02]' : 'border-gray-200 hover:border-[#4DB6AC]/50 opacity-70 hover:opacity-100'}`}
                  >
                    {tempSelectedPlan === 'pro' && (
                      <div className="absolute -top-3 right-6 bg-[#4DB6AC] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3" /> Seleccionado
                      </div>
                    )}
                    <h4 className="text-xl font-black text-[#1A3D3D] font-['Montserrat'] mb-1 flex items-center gap-2">
                      Clínica PRO <Zap className="w-5 h-5 text-[#4DB6AC] fill-[#4DB6AC]" />
                    </h4>
                    <p className="text-3xl font-black text-[#1A3D3D] font-['Montserrat'] my-4">$15.000 <span className="text-sm text-gray-400 font-medium">/mes</span></p>
                    <p className="text-sm text-gray-500 mb-6 flex-1">Mostrá todo el potencial de tu centro médico y generá máxima confianza.</p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Todo lo del Plan Básico</li>
                      <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Sección completa de Staff Médico</li>
                      <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Catálogo de Especialidades y Equipamiento</li>
                      <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Casos clínicos y galería de hasta {LIMITE_GALERIA.pro} fotos</li>
                      <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Soporte prioritario</li>
                    </ul>
                  </div>

                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsPlanModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button onClick={handleConfirmChangePlan} className="px-8 py-3 rounded-xl text-sm font-bold bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] shadow-md transition-all flex items-center gap-2">Confirmar cambio <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO (FACTURACIÓN) — simulador hasta integrar Mercado Pago */}
      {isSubModalOpen && !esSocioVitalicio && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-[32px] w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#009EE3]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#009EE3]" /></div>
                  <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Facturación</h3>
                </div>
                <button onClick={() => setIsSubModalOpen(false)} className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="p-6 md:p-8 bg-white">
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-2">Plan actual</p>
                  <h2 className="text-4xl font-black text-[#1A3D3D] font-['Montserrat']">Clínica PRO</h2>
                  <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-bold border ${isSubscriptionActive ? 'bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                    <span className={`w-2 h-2 rounded-full ${isSubscriptionActive ? 'bg-[#4DB6AC]' : 'bg-red-500'}`}></span>
                    {isSubscriptionActive ? 'Activo' : 'Inactivo (falta de pago)'}
                  </div>
                </div>

                {isSubscriptionActive && (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500 font-medium">Próximo cobro</span>
                      <span className="text-sm font-bold text-[#1A3D3D]">15 de Junio, 2026</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Método de pago</span>
                      <span className="text-sm font-bold text-[#1A3D3D] flex items-center gap-2">Visa terminada en 4242</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setIsSubscriptionActive(true); setIsSubModalOpen(false); setModalConfig({ isOpen: true, title: '¡Pago exitoso!', message: 'Tu cuenta fue reactivada y tu perfil vuelve a ser visible.', type: 'success' }); }}
                    className="w-full py-4 rounded-xl font-bold text-sm bg-[#009EE3] text-white hover:bg-[#0080B7] transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    Simular Pago (Mercado Pago) <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setIsSubscriptionActive(false); setIsSubModalOpen(false); }}
                    className="w-full py-4 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                  >
                    Simular Vencimiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR DE APLICACIÓN (h: 64px) */}
      <nav className="fixed top-0 w-full z-[80] h-[64px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 md:px-10 shadow-sm">
        <div className="max-w-[1100px] w-full mx-auto flex justify-between items-center">

          <div className="flex items-center gap-6">
            <button
              onClick={() => irA('/ecosistema')}
              className="flex items-center gap-2 text-gray-400 hover:text-[#4DB6AC] transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-bold hidden sm:block">Volver al Ecosistema</span>
            </button>
            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            <div
              onClick={() => irA('/ecosistema')}
              className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-xl tracking-tight cursor-pointer"
            >
              Portal Veterinario<span className="text-[#2D6A6A]">.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right mr-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#1A3D3D] truncate max-w-[150px]">{formData.nombre || 'Clínica'}</p>
              <p className="text-[10px] font-bold text-[#4DB6AC]">Clínica</p>
            </div>
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-100 shrink-0 flex items-center justify-center">
              {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <Building2 className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

        </div>
      </nav>

      {/* LAYOUT PRINCIPAL (Padding 76px) */}
      <div className="pt-[76px] max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col gap-6 w-full pb-10">

        {/* BANNER DE SUSCRIPCIÓN INACTIVA */}
        {(isPro && !isSubscriptionActive && !esSocioVitalicio) && (
          <div className="w-full bg-red-50 border border-red-200 rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm animate-in fade-in slide-in-from-top-4 z-10">
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <div className="w-12 h-12 bg-red-100/50 rounded-full flex items-center justify-center shrink-0 border border-red-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-base md:text-lg">Cuenta suspendida por falta de pago</h3>
                <p className="text-sm text-red-700/90 font-medium mt-0.5 leading-snug">Tu perfil no está visible en la Cartilla. Regularizá tu situación para volver a aparecer.</p>
              </div>
            </div>
            <button onClick={() => setIsSubModalOpen(true)} className="shrink-0 w-full md:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Regularizar pago
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-start relative flex-1 w-full">

          {/* COLUMNA IZQUIERDA: SIDEBAR */}
          <div className="w-full md:w-[260px] shrink-0 md:sticky md:top-[96px] self-start z-20">

            <div className="md:h-[52px] flex items-center mb-6 px-1">
              <h2 className="text-[28px] font-black font-['Montserrat'] uppercase tracking-tight text-[#1A3D3D] hidden md:block leading-none">
                Configuración
              </h2>
            </div>

            <nav className="flex flex-col gap-1.5 pb-2 md:pb-0 bg-white md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">

              <button onClick={() => setActiveTab('cuenta')} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'cuenta' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <div className="flex items-center gap-3"><User className={`w-5 h-5 ${activeTab === 'cuenta' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Sobre mi plan</div>
              </button>

              <button onClick={() => setActiveTab('perfil')} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'perfil' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <div className="flex items-center gap-3"><Building2 className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Mi perfil público</div>
                {alertaPerfil && <PuntoAlerta />}
              </button>

              <button
                onClick={() => isPro && setActiveTab('servicios')} disabled={!isPro}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none
                  ${!isPro ? 'opacity-50 grayscale cursor-not-allowed text-gray-400' : activeTab === 'servicios' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}
              >
                <div className="flex items-center gap-3"><Activity className={`w-5 h-5 ${activeTab === 'servicios' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Especialidades</div>
                {!isPro ? <Lock className="w-3.5 h-3.5 text-gray-400" /> : alerta('servicios') && <PuntoAlerta />}
              </button>

              <button
                onClick={() => isPro && setActiveTab('staff')} disabled={!isPro}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none
                  ${!isPro ? 'opacity-50 grayscale cursor-not-allowed text-gray-400' : activeTab === 'staff' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}
              >
                <div className="flex items-center gap-3"><Users className={`w-5 h-5 ${activeTab === 'staff' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Staff médico</div>
                {!isPro ? <Lock className="w-3.5 h-3.5 text-gray-400" /> : alerta('staff') && <PuntoAlerta />}
              </button>

              <button
                onClick={() => isPro && setActiveTab('casos')} disabled={!isPro}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none
                  ${!isPro ? 'opacity-50 grayscale cursor-not-allowed text-gray-400' : activeTab === 'casos' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}
              >
                <div className="flex items-center gap-3"><Camera className={`w-5 h-5 ${activeTab === 'casos' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Casos clínicos</div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-gray-400" />}
              </button>

            </nav>

            {/* CAJA VER PERFIL DE EJEMPLO */}
            <CajaPerfilEjemplo className="mt-4 hidden md:block" />

          </div>

          {/* COLUMNA DERECHA: ÁREA PRINCIPAL */}
          <div className="flex-1 w-full flex flex-col min-w-0">

            {/* BARRA DE ACCIÓN SUPERIOR (Alto 52px) */}
            <div className="flex flex-col gap-2 mb-6 w-full">
              {haycambiosSinGuardar && tiempoSinGuardar >= 2 && (
                <div className="w-full bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                  <p className="text-xs font-bold text-yellow-700 flex-1">Llevás varios minutos sin guardar. Guardá para no perder los cambios.</p>
                  <button onClick={handleSaveData} className="text-xs font-black text-yellow-700 underline underline-offset-2 hover:text-yellow-900 transition-colors shrink-0">
                    Guardar ahora
                  </button>
                </div>
              )}
              <div className="flex justify-end items-center md:h-[52px] w-full">
                <BotonGuardar />
              </div>
            </div>

            {/* ============================== */}
            {/* TAB: SOBRE MI PLAN             */}
            {/* ============================== */}
            {activeTab === 'cuenta' && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 animate-in fade-in duration-300">
                <h3 className="text-2xl font-black text-[#1A3D3D] mb-2 font-['Montserrat']">Sobre mi plan</h3>
                <p className="text-sm text-gray-500 mb-6">Información privada para la facturación. Esto no lo ven los usuarios.</p>

                <div className="max-w-2xl">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-4">
                    <CreditCard className="w-5 h-5 text-[#2D6A6A]" /> Estado de la suscripción
                  </h4>

                  {esSocioVitalicio ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 flex items-center gap-5">
                      <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Crown className="w-7 h-7 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-black text-[#1A3D3D] text-lg font-['Montserrat'] leading-tight">Clínica vitalicia</p>
                        <p className="text-yellow-700 text-sm font-medium mt-1">Tu clínica incluye todos los beneficios de la plataforma sin costo mensual.</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`border p-5 md:p-6 rounded-2xl flex flex-col gap-5 transition-colors ${isPro && !isSubscriptionActive ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-bold text-xl ${isPro && !isSubscriptionActive ? 'text-red-800' : 'text-[#1A3D3D]'}`}>
                              {isPro ? 'Plan Clínica PRO' : 'Plan Básico'}
                            </p>
                            <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isPro ? 'bg-[#1A3D3D]' : 'bg-gray-400'}`}>
                              {isPro ? 'Premium' : 'Gratis'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${isPro && !isSubscriptionActive ? 'bg-red-500' : 'bg-[#4DB6AC]'}`}></span>
                            <p className={`text-sm font-medium ${isPro && !isSubscriptionActive ? 'text-red-600' : 'text-gray-600'}`}>
                              {isPro ? (isSubscriptionActive ? 'Suscripción activa y al día' : 'Suspendida por falta de pago') : 'Suscripción activa (gratuita)'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                          {isPro && (
                            <button onClick={() => setIsSubModalOpen(true)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border w-full sm:w-auto text-center ${isSubscriptionActive ? 'bg-white border-gray-200 text-gray-700 hover:border-[#4DB6AC] hover:text-[#4DB6AC]' : 'bg-red-600 text-white border-red-600 hover:bg-red-700'}`}>
                              {isSubscriptionActive ? 'Gestionar pagos' : 'Regularizar pago'}
                            </button>
                          )}
                          <button onClick={openPlanModal} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border bg-white border-gray-200 text-gray-700 hover:border-[#4DB6AC] hover:text-[#4DB6AC] w-full sm:w-auto text-center">
                            Cambiar de plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================== */}
            {/* TAB: MI PERFIL PÚBLICO         */}
            {/* ============================== */}
            {activeTab === 'perfil' && (
              <div className="flex flex-col w-full animate-in fade-in duration-300 relative">

                {/* TARJETA DE HEADER */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center p-6 gap-6">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-[24px] overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                      {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <Building2 className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#4DB6AC] p-1.5 rounded-xl border-2 border-white"><ShieldCheck className="w-3 h-3 text-white" /></div>
                  </div>

                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] truncate leading-tight mb-1">{formData.nombre || 'Nombre de la clínica'}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      {formData.guardia24hs && <span className="text-white bg-red-500 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Guardia 24hs</span>}
                      {formData.añosExperiencia && <span className="text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">+{formData.añosExperiencia} años exp.</span>}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-[#2D6A6A] shrink-0" /> {ubicacionTexto || 'Ubicación sin confirmar'}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-[280px] bg-gray-50 p-5 rounded-[20px] border border-gray-100 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-white rounded-md shadow-sm border border-gray-100"><FileCheck className="w-3.5 h-3.5 text-[#4DB6AC]" /></div>
                        <h4 className="text-[#1A3D3D] text-[10px] font-black uppercase tracking-[0.05em]">Estado del perfil</h4>
                      </div>
                      <span className="text-[#1A3D3D] font-black text-sm">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#4DB6AC] transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* FORMULARIO ACORDEONES */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 mb-6">

                  <div className="pt-6 px-6 md:px-10 pb-4">
                    <h3 className="text-xl font-black text-[#1A3D3D] mb-1 font-['Montserrat']">Mi perfil público</h3>
                    <p className="text-xs text-gray-500 mb-0">Toda la info que cargues acá es la que los tutores van a ver en la Cartilla.</p>
                  </div>

                  <div className="border-t border-gray-100">

                    {/* IDENTIDAD DE LA CLÍNICA */}
                    <Accordion
                      title="Identidad de la Clínica"
                      icon={Building2}
                      isOpen={openSection === 'identidad'}
                      onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}
                      alerta={alerta('identidad')}
                    >
                      {!tooltipHintVisto && (
                        <div className="flex flex-col gap-3 bg-[#2D6A6A]/8 border border-[#2D6A6A]/20 rounded-2xl px-4 py-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#2D6A6A]/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-4 h-4 text-[#2D6A6A]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#1A3D3D] mb-0.5">¿Ves los íconos <span className="inline-flex items-center justify-center w-4 h-4 bg-[#2D6A6A]/15 rounded-full text-[#2D6A6A] text-[10px] font-black">i</span> junto a cada campo?</p>
                              <p className="text-sm text-gray-500 font-medium leading-relaxed">Tocalos para ver consejos y explicaciones sobre cada dato. Te ayudan a completar tu perfil de la mejor manera.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              setTooltipHintVisto(true);
                              try {
                                await setDoc(doc(db, 'usuarios', currentUser.uid), { tooltipHintVisto: true }, { merge: true });
                              } catch (e) {
                                console.error('Error guardando el aviso:', e);
                              }
                            }}
                            className="w-full text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:text-[#1A3D3D] transition-colors bg-white border border-[#2D6A6A]/20 px-3 py-2.5 rounded-xl shadow-sm"
                          >
                            Entendido
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-8 mb-8 mt-2 md:mt-0">
                        <div className="relative group shrink-0 text-left w-32 h-32">
                          <label htmlFor="logo-upload" className={`w-full h-full rounded-[28px] overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 cursor-pointer relative group/img shadow-sm hover:border-[#2D6A6A]`}>
                            {formData.foto ? (
                              <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" />
                            ) : (
                              <Camera className="w-8 h-8 text-gray-300" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 md:group-hover/img:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </label>
                          <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} />

                          {/* Botón X fuera del label para que no se abra la ventana de archivos */}
                          {formData.foto && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData((prev) => ({ ...prev, foto: '' })); }}
                              className="absolute top-0 right-0 p-1.5 bg-white text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md hover:bg-red-50"
                            >
                              <X className="w-4 h-4" strokeWidth={3} />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 text-left flex flex-col justify-center">
                          <h3 className="text-sm font-bold text-[#1A3D3D] mb-2 uppercase tracking-wide flex items-center">
                            Logo o foto del equipo <span className="text-red-400 ml-1">*</span>
                            <Tooltip text="Subí el logo de tu clínica en alta resolución (con fondo blanco o transparente) o una foto de tu equipo para que sepan rápido quién los atiende." />
                          </h3>
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed">Formatos PNG o JPG. Si tu logo es alargado, en el encuadre tocá "Ver la imagen entera".</p>
                        </div>
                      </div>

                      <InputGroup label="Nombre de la institución" id="nombre" value={formData.nombre} onChange={handleChange} maxLength={80} required />
                      <InputGroup type="textarea" rows="3" label="Descripción corta" id="descripcion" value={formData.descripcion} onChange={handleChange} maxLength={200} placeholder="Breve resumen de 2 o 3 líneas sobre tu institución..." tooltip="Este texto acompaña el nombre de tu clínica en la presentación de la página." />
                      <InputGroup type="number" label="Años de experiencia" id="añosExperiencia" value={formData.añosExperiencia} onChange={(e) => { if (e.target.value === '' || Number(e.target.value) >= 0) handleChange(e); }} tooltip="Se muestra de forma destacada como una medalla de confianza." />
                      <InputGroup type="textarea" label="Nuestra historia" id="historia" value={formData.historia} onChange={handleChange} maxLength={800} tooltip="Aparece en la sección 'Nosotros'. Contale al público cómo nació la clínica y cuáles son sus valores." />
                    </Accordion>

                    {/* GUARDIA Y EMERGENCIAS */}
                    <Accordion
                      title="Guardia y Emergencias"
                      icon={AlertTriangle}
                      isOpen={openSection === 'urgencias'}
                      onToggle={() => setOpenSection(openSection === 'urgencias' ? null : 'urgencias')}
                      tooltip="Activá la atención 24hs para destacar la guardia a tus clientes. Las clínicas con guardia aparecen cuando un tutor busca atención de urgencia."
                      alerta={alerta('guardia')}
                    >
                      <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex flex-col gap-4 text-left transition-all">
                        <ToggleSwitch
                          label="¿Ofrecés atención con guardia 24hs?"
                          checked={formData.guardia24hs}
                          onChange={(v) => setFormData((p) => ({ ...p, guardia24hs: v }))}
                          tooltip="Agrega un cartel destacado en tu perfil indicando la atención continua de emergencias."
                        />
                        {formData.guardia24hs && (
                          <div className="pt-4 border-t border-red-200/50 mt-2 animate-in fade-in slide-in-from-top-2 flex flex-col gap-4">
                            <CampoWhatsapp
                              id="telefonoGuardia"
                              label="WhatsApp de la guardia"
                              requerido
                              valor={formData.telefonoGuardia}
                              onCambio={(v) => setFormData((p) => ({ ...p, telefonoGuardia: v }))}
                              tooltip="Puede ser el mismo WhatsApp de la clínica o un celular exclusivo para urgencias."
                              ayuda="Es el número al que te escriben los tutores desde el botón 'Avisar guardia en camino'. Tiene que tener WhatsApp."
                            />
                          </div>
                        )}
                      </div>
                    </Accordion>

                    {/* PREGUNTAS FRECUENTES */}
                    <Accordion
                      title="Preguntas Frecuentes (FAQ)"
                      icon={MessageSquare}
                      isOpen={openSection === 'faq'}
                      onToggle={() => setOpenSection(openSection === 'faq' ? null : 'faq')}
                      tooltip="Respuestas rápidas para tus clientes. Las preguntas sin respuesta no se muestran en tu perfil."
                    >
                      <div className="space-y-5">
                        <div className="bg-[#F4F7F7] border border-[#2D6A6A]/20 text-[#2D6A6A] text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2 leading-relaxed">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Te sugerimos algunas preguntas clave. Si no completás la respuesta, esa pregunta simplemente se oculta en tu perfil público.</span>
                        </div>

                        {formData.faqs.map((faq) => (
                          <div key={faq.id} className="bg-white border border-gray-200 p-5 rounded-[20px] shadow-sm relative group text-left">
                            {!faq.isDefault && (
                              <button onClick={() => removeFaq(faq.id)} className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {faq.isDefault ? (
                              <label className="text-sm font-bold text-[#1A3D3D] mb-3 block">{faq.pregunta}</label>
                            ) : (
                              <div className="mb-4 pr-8">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Pregunta personalizada</label>
                                <input
                                  type="text"
                                  value={faq.pregunta}
                                  maxLength={150}
                                  onChange={(e) => handleFaqChange(faq.id, 'pregunta', e.target.value)}
                                  placeholder="Podés escribir tu propia pregunta acá..."
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1A3D3D] focus:border-[#2D6A6A] outline-none transition-colors"
                                />
                              </div>
                            )}

                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tu respuesta</label>
                              <textarea
                                value={faq.respuesta}
                                maxLength={400}
                                onChange={(e) => handleFaqChange(faq.id, 'respuesta', e.target.value)}
                                placeholder="Escribí la respuesta acá..."
                                rows="2"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 focus:border-[#2D6A6A] outline-none transition-colors resize-none"
                              />
                              <p className={`text-right text-[10px] font-bold mt-1 ${(faq.respuesta?.length || 0) >= 360 ? 'text-red-400' : 'text-gray-300'}`}>{faq.respuesta?.length || 0} / 400</p>
                            </div>
                          </div>
                        ))}

                        <button type="button" onClick={addCustomFaq} className="w-full py-3.5 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" /> Agregar otra pregunta sugerida
                        </button>
                      </div>
                    </Accordion>

                    {/* CONTACTO, UBICACIÓN Y HORARIOS */}
                    <Accordion
                      title="Contacto y Ubicación"
                      icon={MapPin}
                      isOpen={openSection === 'contacto'}
                      onToggle={() => setOpenSection(openSection === 'contacto' ? null : 'contacto')}
                      alerta={alerta('contacto')}
                    >
                      {/* DIRECCIÓN CON GOOGLE */}
                      <div className="mb-6 w-full">
                        <label htmlFor="direccion" className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-2 ml-1">
                          Dirección física <span className="text-red-400 ml-1">*</span>
                          <Tooltip text="Escribí el nombre de la clínica o la dirección y elegí una opción de la lista de Google, para que los tutores te encuentren por zona." />
                        </label>
                        <BuscadorDireccionGoogle
                          id="direccion"
                          valor={formData.direccion}
                          onEscribir={escribirDireccion}
                          onElegir={elegirDireccion}
                          placeholder="Ej: Av. Santa Fe 1234, Buenos Aires"
                          listaProvincias={provincias}
                        />
                        {formData.placeId ? (
                          <div className="flex flex-wrap items-center gap-2 mt-2 ml-1">
                            <p className="text-[11px] text-[#2D6A6A] font-bold flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Confirmada con Google{formData.barrio ? ` · Barrio: ${formData.barrio}` : ''}
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.direccion)}&query_place_id=${formData.placeId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#2D6A6A] bg-white px-2.5 py-1 rounded-lg border border-[#2D6A6A]/20 hover:text-[#1A3D3D] transition-colors"
                            >
                              Ver
                            </a>
                          </div>
                        ) : formData.direccion.trim() ? (
                          <p className="text-[11px] font-bold text-[#FF9800] flex items-center gap-1.5 mt-2 ml-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> Elegí una opción de la lista que aparece al escribir
                          </p>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-4">
                        <CampoWhatsapp
                          id="whatsapp"
                          label="WhatsApp"
                          requerido
                          valor={formData.whatsapp}
                          onCambio={(v) => setFormData((p) => ({ ...p, whatsapp: v }))}
                          tooltip="Se usa para el botón verde de WhatsApp de tu perfil."
                        />
                        <InputGroup
                          label="Teléfono fijo"
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value.replace(/[^0-9+()\-\s]/g, '') }))}
                          placeholder="Ej: 011 4567-8901"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <InputGroup label="Email oficial" id="email" type="email" value={formData.email} onChange={handleChange} placeholder="contacto@tuclinica.com" />
                        <InputGroup label="Sitio web" id="sitioWeb" value={formData.sitioWeb} onChange={handleChange} placeholder="www.tuclinica.com" canTest />
                      </div>

                      {/* HORARIOS DE ATENCIÓN */}
                      <div className="pt-6 mt-2 border-t border-gray-100 relative">
                        <h3 className="text-xs font-bold text-[#1A3D3D] uppercase tracking-widest ml-1 mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#2D6A6A]" /> Horarios de atención
                          <Tooltip text="Ingresá solo la hora (ej: 09 y 18). Si tenés activada la Guardia 24hs, esta sección se desactiva sola." />
                        </h3>

                        {formData.guardia24hs && (
                          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl mt-12 mb-2 animate-in fade-in duration-300">
                            <div className="bg-white border border-[#2D6A6A]/20 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg text-[#1A3D3D]">
                              <div className="bg-[#4DB6AC]/10 p-2 rounded-xl">
                                <Activity className="w-5 h-5 text-[#2D6A6A]" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-sm font-black font-['Montserrat'] leading-none mb-1">Atención continua</span>
                                <span className="text-xs font-medium text-gray-500 leading-none">Horario cubierto por la Guardia 24hs.</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 transition-all duration-300 ${formData.guardia24hs ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                          <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block ml-1">Lunes a viernes <span className="text-red-400 ml-1">*</span></label>
                            <div className="flex items-center gap-3">
                              <input type="text" inputMode="numeric" placeholder="09" value={formData.horarios.semanaDesde} onChange={(e) => handleHorarioChange('semanaDesde', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-center text-lg font-black text-[#1A3D3D] focus:border-[#2D6A6A] outline-none transition-all shadow-sm" />
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">hasta</span>
                              <input type="text" inputMode="numeric" placeholder="20" value={formData.horarios.semanaHasta} onChange={(e) => handleHorarioChange('semanaHasta', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-center text-lg font-black text-[#1A3D3D] focus:border-[#2D6A6A] outline-none transition-all shadow-sm" />
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">hs</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block ml-1">Sábados <span className="text-gray-400 ml-1 normal-case text-[9px]">(opcional)</span></label>
                            <div className="flex items-center gap-3">
                              <input type="text" inputMode="numeric" placeholder="10" value={formData.horarios.sabadoDesde} onChange={(e) => handleHorarioChange('sabadoDesde', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-center text-lg font-black text-[#1A3D3D] focus:border-[#2D6A6A] outline-none transition-all shadow-sm" />
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">hasta</span>
                              <input type="text" inputMode="numeric" placeholder="14" value={formData.horarios.sabadoHasta} onChange={(e) => handleHorarioChange('sabadoHasta', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-center text-lg font-black text-[#1A3D3D] focus:border-[#2D6A6A] outline-none transition-all shadow-sm" />
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">hs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* REDES SOCIALES */}
                      <div className="pt-8 mt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-5 text-left">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Redes sociales (opcional)</h3>
                          <Tooltip text="Si dejás el campo vacío, el ícono correspondiente no aparece en tu perfil público." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                          <div className="mb-6 w-full">
                            <label htmlFor="instagram" className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                              Instagram — usuario
                            </label>
                            <div className="relative flex items-center border border-gray-200 rounded-2xl bg-gray-50/50 focus-within:border-[#2D6A6A] transition-all px-5 py-3.5">
                              <span className="text-base font-medium text-[#1A3D3D] select-none pointer-events-none">@</span>
                              <input
                                id="instagram"
                                type="text"
                                value={usuarioDeInstagram(formData.redes.instagram)}
                                onChange={(e) => handleRedesChange('instagram', e.target.value.replace(/@/g, '').trim())}
                                placeholder="tu_clinica"
                                className="flex-1 bg-transparent text-base font-medium text-[#1A3D3D] focus:outline-none placeholder:text-gray-400"
                              />
                            </div>
                          </div>
                          <InputGroup label="Facebook" id="facebook" value={formData.redes.facebook} onChange={(e) => handleRedesChange('facebook', e.target.value)} placeholder="Link completo de tu página" canTest />
                        </div>
                      </div>
                    </Accordion>

                    {/* GALERÍA */}
                    <Accordion
                      title="Galería"
                      icon={ImageIcon}
                      isOpen={openSection === 'galeria'}
                      onToggle={() => setOpenSection(openSection === 'galeria' ? null : 'galeria')}
                      tooltip="Mostrá tus instalaciones: quirófano, internación, sala de espera, equipamiento o tu equipo trabajando. Se muestran en tu perfil público."
                      avisoTexto={<>Marcá con <AlertTriangle className="inline w-3.5 h-3.5 -mt-0.5" /> si tu imagen muestra contenido sensible</>}
                    >
                      <div className="space-y-5">

                        {!isPro && (
                          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3.5">
                            <Lock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-yellow-800 leading-relaxed">
                              Con el plan Básico podés subir hasta <span className="font-black">{LIMITE_GALERIA.gratis} fotos</span>. Pasate a PRO para llegar a {LIMITE_GALERIA.pro}.
                            </p>
                          </div>
                        )}

                        {formData.galeria.length > limiteGaleria && (
                          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3.5">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-yellow-800 leading-relaxed">
                              Tenés más fotos de las que permite tu plan. En tu perfil se muestran las primeras {limiteGaleria}.
                            </p>
                          </div>
                        )}

                        {formData.galeria.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {formData.galeria.map((item, index) => (
                              <div key={item.id} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                                  <img src={item.url} alt={item.epigrafe || `Foto ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  {item.esSensible && (
                                    <div className="absolute inset-0 bg-[#1A3D3D]/70 flex items-center justify-center pointer-events-none">
                                      <span className="flex items-center gap-1.5 bg-white/90 text-[#1A3D3D] text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full">
                                        <AlertTriangle className="w-3 h-3" /> Sensible
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleArrayUpdate('galeria', item.id, 'esSensible', !item.esSensible)}
                                  className={`absolute top-2 left-2 p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md z-10 ${item.esSensible ? 'bg-[#FF9800] text-white' : 'bg-white/90 text-gray-500 hover:bg-yellow-50'}`}
                                  title={item.esSensible ? 'Quitar aviso de contenido sensible' : 'Marcar como contenido sensible'}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleArrayRemove('galeria', item.id)}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-50 z-10"
                                >
                                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>

                                <div className="p-2.5">
                                  <input
                                    type="text"
                                    placeholder="Descripción opcional..."
                                    value={item.epigrafe || ''}
                                    maxLength={80}
                                    onChange={(e) => handleArrayUpdate('galeria', item.id, 'epigrafe', e.target.value)}
                                    className="w-full text-[11px] font-medium text-gray-500 bg-transparent outline-none placeholder:text-gray-300 border-b border-gray-100 pb-1 focus:border-[#2D6A6A] transition-colors"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {formData.galeria.length < limiteGaleria ? (
                          <>
                            <label
                              htmlFor="galeria-upload"
                              className="w-full py-4 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar foto ({formData.galeria.length}/{limiteGaleria})
                            </label>
                            <input type="file" id="galeria-upload" className="hidden" accept="image/*" multiple onChange={agregarFotosGaleria} />
                          </>
                        ) : (
                          <div className="w-full py-4 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                            <Lock className="w-4 h-4" />
                            Límite alcanzado ({limiteGaleria}/{limiteGaleria})
                          </div>
                        )}
                      </div>
                    </Accordion>

                  </div>
                </div>
              </div>
            )}

            {/* ============================== */}
            {/* TAB: ESPECIALIDADES (PRO)      */}
            {/* ============================== */}
            {activeTab === 'servicios' && isPro && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat']">Especialidades y equipamiento</h3>
                  <p className="text-sm text-gray-500 mt-1">Seleccioná las prestaciones y el equipamiento disponibles en tu centro médico. Los tutores filtran la Cartilla con estos datos.</p>
                </div>
                <SelectorServicios
                  servicios={formData.servicios}
                  setFormData={setFormData}
                  grupos={GRUPOS_CLINICA}
                  iconosGrupo={ICONOS_GRUPO}
                />
              </div>
            )}

            {/* ============================== */}
            {/* TAB: STAFF MÉDICO (PRO)        */}
            {/* ============================== */}
            {activeTab === 'staff' && isPro && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat']">Staff médico</h3>
                  <p className="text-sm text-gray-500 mt-1">Presentá a los especialistas que trabajan en tu centro. Esto genera mucha confianza en los tutores.</p>
                </div>

                <div className="space-y-6">
                  {formData.staff.length === 0 && (
                    <div className="bg-[#F4F7F7] rounded-[24px] p-8 text-center">
                      <Users className="w-8 h-8 text-gray-400 opacity-50 mx-auto mb-3" />
                      <p className="text-sm font-bold text-[#1A3D3D] mb-1">Todavía no cargaste a tu equipo</p>
                      <p className="text-xs text-gray-500 font-medium">Sumá al menos un profesional para que aparezca la sección "Equipo médico" en tu perfil.</p>
                    </div>
                  )}

                  {formData.staff.map((item, index) => (
                    <div key={item.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 text-left relative group/staff shadow-sm hover:border-[#4DB6AC] transition-all">

                      <button onClick={() => handleArrayRemove('staff', item.id)} className="absolute top-4 right-4 p-2.5 bg-red-50 md:bg-white text-red-500 md:text-gray-300 hover:text-red-500 rounded-xl border border-transparent hover:border-red-100 shadow-sm opacity-100 md:opacity-0 group-hover/staff:opacity-100 transition-opacity z-10" title="Eliminar profesional"><Trash2 className="w-4 h-4" /></button>

                      <div className="flex items-center justify-between w-full md:w-auto shrink-0">
                        <label htmlFor={`staff-foto-${item.id}`} className="relative group/img cursor-pointer shrink-0 block w-24 h-24 self-start">
                          <div className={`w-full h-full rounded-2xl overflow-hidden border-2 border-dashed ${item.foto ? 'border-transparent' : 'border-[#2D6A6A]/40 bg-[#2D6A6A]/5'} transition-all flex flex-col items-center justify-center bg-white shadow-sm hover:border-[#2D6A6A]`}>
                            {item.foto ? (
                              <img src={item.foto} className="w-full h-full object-cover" alt={item.nombre} />
                            ) : (
                              <>
                                <Camera className="w-7 h-7 text-[#2D6A6A] mb-1" />
                                <span className="text-[9px] font-black uppercase text-[#2D6A6A] tracking-widest text-center px-1">Subir<br />foto</span>
                              </>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                          <input type="file" id={`staff-foto-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'staff', item.id)} />
                        </label>

                        <div className="flex md:hidden items-center gap-2 mr-14">
                          <button type="button" onClick={() => handleArrayMove('staff', index, 'up')} disabled={index === 0} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-[#1A3D3D] hover:border-[#4DB6AC] disabled:opacity-30 shadow-sm transition-all"><ArrowUp className="w-5 h-5" /></button>
                          <button type="button" onClick={() => handleArrayMove('staff', index, 'down')} disabled={index === formData.staff.length - 1} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-[#1A3D3D] hover:border-[#4DB6AC] disabled:opacity-30 shadow-sm transition-all"><ArrowDown className="w-5 h-5" /></button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Nombre completo <span className="text-red-400 ml-1">*</span></label>
                            <input type="text" placeholder="Ej: Dra. Valeria Rojas" value={item.nombre} maxLength={80} onChange={(e) => handleArrayUpdate('staff', item.id, 'nombre', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-[#1A3D3D] focus:border-[#2D6A6A] outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Matrícula</label>
                            <div className="flex gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white focus-within:border-[#2D6A6A] transition-colors">
                              <select
                                value={item.tipoMatricula || 'MP'}
                                onChange={(e) => handleArrayUpdate('staff', item.id, 'tipoMatricula', e.target.value)}
                                className="bg-transparent border-none px-3 py-3 text-base font-black focus:outline-none text-[#1A3D3D] shrink-0 w-[80px] cursor-pointer"
                              >
                                <option value="MP">MP</option>
                                <option value="MN">MN</option>
                              </select>
                              <div className="w-px bg-gray-200 shrink-0"></div>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Ej: 3108"
                                value={item.matricula}
                                onChange={(e) => handleArrayUpdate('staff', item.id, 'matricula', e.target.value.replace(/[^0-9-]/g, ''))}
                                className="flex-1 min-w-0 bg-transparent border-none px-4 py-3 text-base text-[#1A3D3D] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Especialidad / cargo</label>
                          <input type="text" placeholder="Ej: Director médico, cirujano..." value={item.especialidad} maxLength={80} onChange={(e) => handleArrayUpdate('staff', item.id, 'especialidad', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-[#2D6A6A] focus:border-[#2D6A6A] outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 flex justify-between items-center">
                            Breve descripción
                            <span className={`text-[11px] tracking-wider ${item.bio?.length >= 140 ? 'text-red-500' : 'text-gray-400'}`}>{item.bio?.length || 0} / 150</span>
                          </label>
                          <textarea placeholder="Resumen de experiencia profesional..." value={item.bio} onChange={(e) => handleArrayUpdate('staff', item.id, 'bio', e.target.value)} maxLength={150} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 text-[#1A3D3D] focus:border-[#2D6A6A] outline-none" />
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col gap-1.5 mt-1 shrink-0">
                        <button type="button" onClick={() => handleArrayMove('staff', index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowUp className="w-5 h-5" /></button>
                        <button type="button" onClick={() => handleArrayMove('staff', index, 'down')} disabled={index === formData.staff.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowDown className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => handleArrayAdd('staff', { nombre: '', especialidad: '', tipoMatricula: 'MP', matricula: '', bio: '', foto: '', profesionalUid: '' })} className="w-full py-4 border-2 border-dashed border-gray-300 bg-white rounded-3xl text-[#2D6A6A] text-sm font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Agregar profesional al staff
                  </button>
                </div>
              </div>
            )}

            {/* ============================== */}
            {/* TAB: CASOS CLÍNICOS (PRO)      */}
            {/* ============================== */}
            {activeTab === 'casos' && isPro && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] flex items-center gap-2">Casos clínicos</h3>
                  <p className="text-sm text-gray-500 mt-1">Subí fotos del antes y después para generar confianza en el trabajo de tu equipo.</p>
                </div>

                <div className="space-y-6">
                  {formData.casos.map((item) => (
                    <div key={item.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-5 relative text-left shadow-sm">
                      <button onClick={() => handleArrayRemove('casos', item.id)} className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-300 hover:text-red-500 rounded-xl hover:border-red-200 shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>

                      <div className="flex flex-col md:flex-row gap-6 mt-2">
                        {/* Fotos del caso */}
                        <div className="w-full md:w-40 flex flex-wrap gap-2 shrink-0 content-start">
                          {item.fotos.map((f, fi) => (
                            <div key={fi} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 group/img shadow-sm">
                              <img src={f} className="w-full h-full object-cover" alt="Foto del caso" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                {fi > 0 && <button type="button" onClick={() => moveCasoFoto(item.id, fi)} className="text-white hover:text-[#4DB6AC]" title="Mover a la izquierda"><ArrowLeft className="w-4 h-4" /></button>}
                                <button type="button" onClick={() => removeCasoFoto(item.id, fi)} className="text-red-400 hover:text-red-500" title="Quitar foto"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                          <label htmlFor={`caso-img-${item.id}`} className="w-16 h-16 rounded-xl border-2 border-dashed border-[#2D6A6A]/40 flex flex-col items-center justify-center text-[#2D6A6A] hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] cursor-pointer transition-colors bg-white">
                            <ImageIcon className="w-5 h-5 mb-0.5" />
                            <span className="text-[8px] font-black uppercase">Foto</span>
                          </label>
                          <input type="file" id={`caso-img-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'caso', item.id)} />
                        </div>

                        {/* Textos del caso */}
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <div className="w-1/3">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Paciente</label>
                              <input type="text" placeholder="Ej: Firulais" value={item.nombre} maxLength={40} onChange={(e) => handleArrayUpdate('casos', item.id, 'nombre', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#2D6A6A] outline-none" />
                            </div>
                            <div className="w-2/3">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Patología o motivo <span className="text-red-400 ml-1">*</span></label>
                              <input type="text" placeholder="Ej: Corrección de luxación patelar" value={item.patologia} maxLength={100} onChange={(e) => handleArrayUpdate('casos', item.id, 'patologia', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2D6A6A] font-medium focus:border-[#2D6A6A] outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Relato del caso</label>
                            <textarea
                              placeholder="Contá la historia clínica, el tratamiento aplicado y la evolución..."
                              value={item.desc}
                              maxLength={600}
                              rows={4}
                              onChange={(e) => {
                                handleArrayUpdate('casos', item.id, 'desc', e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              onFocus={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-[#2D6A6A] outline-none text-[#1A3D3D] overflow-hidden"
                            />
                            <p className={`text-right text-[10px] font-bold mt-1 mr-1 ${(item.desc?.length || 0) >= 550 ? 'text-red-400' : 'text-gray-400'}`}>
                              {item.desc?.length || 0} / 600
                            </p>
                          </div>
                          <ToggleSwitch
                            label="Las fotos muestran contenido sensible"
                            checked={item.esSensible}
                            onChange={(v) => handleArrayUpdate('casos', item.id, 'esSensible', v)}
                            tooltip="Si las fotos muestran cirugías o heridas, en tu perfil se ven difuminadas con un aviso y el tutor elige si verlas."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => handleArrayAdd('casos', { nombre: '', patologia: '', desc: '', fotos: [], esSensible: false })} className="w-full py-4 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Publicar nuevo caso
                  </button>
                </div>
              </div>
            )}

            {/* CAJA VER PERFIL DE EJEMPLO — solo celular */}
            <CajaPerfilEjemplo className="md:hidden mt-6" />

            {/* BOTONES INFERIORES */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8 pb-4">
              <BotonGuardar anchoCompleto />
              <button
                type="button"
                onClick={verPerfilPublico}
                className="text-center text-gray-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-[#4DB6AC] transition-colors flex items-center justify-center gap-2 group bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm w-full md:w-auto"
              >
                Ver mi perfil público <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <FooterSimple seccion="Panel de Gestión" />

    </div>
  );
}