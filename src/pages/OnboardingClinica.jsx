import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Camera, Check, Loader2, X, Clock, Building2, FileCheck, Upload,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import especialidadesData from '../data/especialidades.json';
import equipamientoData from '../data/equipamientoClinicas.json';
import provincias from '../data/provincias.js';
import {
  BuscadorDireccionGoogle, RecortadorImagen, SelectorServicios,
  normalizarServicios, contarServicios, generarSlug, instagramAURL, usuarioDeInstagram,
  leerArchivoComoDataURL
} from '../components/editor/EditorComponents';

// ==========================================
// CONSTANTES DEL CUESTIONARIO
// ==========================================
const TOTAL_PASOS = 5;

const TITULOS = ['Tu clínica', 'Director/a técnico/a', 'Ubicación y horarios', 'Servicios y equipamiento', 'Sobre la clínica'];

const SUBTITULOS = [
  'Empecemos por lo básico. Así te van a ver los tutores.',
  'Verificamos la matrícula de quien está a cargo para que los tutores confíen en tu clínica.',
  'Los tutores los encuentran por zona. Confirmá la dirección con Google y contanos cuándo atienden.',
  'Contanos qué ofrecen y con qué cuentan. Lo pueden cambiar cuando quieran.',
  'Una presentación corta, con sus palabras.'
];

// Mismos grupos que usa el editor de clínicas (especialidades + equipamiento)
const GRUPOS_CLINICA = [...especialidadesData, ...equipamientoData];

// Estilos reutilizables (los mismos del cuestionario de profesionales)
const CLASE_INPUT = "w-full bg-[#F4F7F7] border border-transparent rounded-2xl px-5 py-4 text-[17px] font-medium text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 placeholder:text-gray-400";
const CLASE_LABEL = "block text-[15px] font-semibold text-[#1A3D3D] mt-5 mb-2";
const CLASE_SELECT_CORTO = "w-24 shrink-0 bg-[#F4F7F7] border border-transparent rounded-2xl px-4 py-4 text-[17px] font-bold text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10";
const CLASE_AYUDA = "text-sm text-[#666666] mt-2 leading-normal";
const CLASE_BTN_PRIMARIO = "bg-[#2D6A6A] text-white rounded-xl px-7 py-4 text-[13px] font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const CLASE_BTN_VOLVER = "bg-white text-[#666666] border border-gray-200 rounded-xl px-5 py-4 text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] hover:text-[#1A3D3D] disabled:opacity-60";
const CLASE_BTN_TEXTO = "text-[#2D6A6A] text-[12px] font-bold uppercase tracking-[0.12em] px-2 py-3 transition-all duration-300 ease-in-out hover:text-[#1A3D3D] disabled:opacity-60";
const CLASE_CHIP = "border rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-300 ease-in-out";
const CLASE_BTN_SECUNDARIO = "bg-white text-[#1A3D3D] border border-gray-200 rounded-xl px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] disabled:opacity-60";

// Estado inicial de todo lo que se carga en el cuestionario
const ESTADO_INICIAL = {
  nombre: '', foto: '',
  directorNombre: '', tipo: 'MP', mat: '', provMat: provincias[0] || 'Buenos Aires',
  tituloPath: '', tituloNombre: '',
  direccion: '', placeId: '', lat: null, lng: null, provincia: '', localidad: '', barrio: '',
  wa: '',          // solo los dígitos, sin el 54
  telefono: '',
  guardia: false, waGuardia: '',   // waGuardia: solo los dígitos, sin el 54
  horarios: { semanaDesde: '', semanaHasta: '', sabadoDesde: '', sabadoHasta: '' },
  sabadoAbre: false,
  servicios: {},
  desc: '', ig: '', fb: ''
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

// Cuenta solo los números de un texto
const contarDigitos = (texto) => String(texto || '').replace(/\D/g, '').length;

// Pone mayúscula inicial en cada palabra, dejando "de", "del", "la" en minúscula
const capitalizarNombre = (texto) => texto.replace(/\S+/g, (palabra, indice) => {
  const minuscula = palabra.toLowerCase();
  if (indice > 0 && ['de', 'del', 'la', 'las', 'los', 'y', 'da', 'di', 'van', 'von'].includes(minuscula)) return minuscula;
  return palabra.charAt(0).toUpperCase() + palabra.slice(1);
});

// Las horas se guardan con dos dígitos ("09"), igual que el editor
const horaA2 = (valor) => (valor === undefined || valor === null || valor === '' ? '' : String(valor).padStart(2, '0'));

// Guarda solo los campos indicados y reemplaza su contenido completo (así no quedan restos viejos)
const guardarCampos = (coleccion, uid, datos) =>
  setDoc(doc(db, coleccion, uid), datos, { mergeFields: Object.keys(datos) });

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
// COMPONENTES CHICOS
// ==========================================

// Barra de pasos: círculos unidos por una línea, con el nombre de cada paso abajo (solo en PC)
function BarraPasos({ paso }) {
  const nombres = ['Clínica', 'Director/a', 'Ubicación', 'Servicios', 'Sobre vos'];

  return (
    <div className="flex items-start mb-8 md:mb-14">
      {nombres.map((nombre, i) => {
        const completado = paso >= TOTAL_PASOS || i < paso;
        const activo = i === paso && paso < TOTAL_PASOS;
        return (
          <React.Fragment key={nombre}>
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-full border-4 border-white flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${
                  activo ? 'bg-[#1A3D3D] text-white scale-110 shadow-lg shadow-[#1A3D3D]/30'
                  : completado ? 'bg-[#2D6A6A] text-white'
                  : 'bg-white text-gray-400 ring-2 ring-inset ring-gray-200'
                }`}
              >
                {completado ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`hidden md:block absolute top-full left-1/2 -translate-x-1/2 mt-2 w-28 text-center text-[12px] font-bold leading-tight transition-colors duration-300 ${activo || completado ? 'text-[#1A3D3D]' : 'text-gray-400'}`}>
                {nombre}
              </span>
            </div>

            {i < TOTAL_PASOS - 1 && (
              <div className="flex-1 h-9 flex items-center">
                <div className="w-full h-1 bg-gray-200 overflow-hidden">
                  <div className="h-full bg-[#2D6A6A] transition-all duration-500" style={{ width: i < paso ? '100%' : '0%' }} />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Tarjeta en vivo: así se va a ver la clínica en la cartilla (versión simple)
function TarjetaViva({ datos, paso }) {
  const pasosCompletos = [
    datos.nombre.trim(),
    datos.directorNombre.trim() && contarDigitos(datos.mat) >= 3 && datos.tituloPath,
    datos.placeId && contarDigitos(datos.wa) >= 8 && (datos.guardia || (datos.horarios.semanaDesde && datos.horarios.semanaHasta)),
    contarServicios(datos.servicios) > 0,
    datos.desc.trim().length >= 30
  ].filter(Boolean).length;
  const porcentaje = Math.round((pasosCompletos / TOTAL_PASOS) * 100);
  const ubicacion = [datos.barrio || datos.localidad, datos.provincia].filter(Boolean).join(', ');

  return (
    <div>
      <p className="text-[18px] font-bold text-[#1A3D3D] mb-5">Así los van a ver los tutores</p>
      <article className="bg-white border border-gray-100 rounded-[24px] px-4 pt-5 pb-4 text-center shadow-sm">
        {datos.foto ? (
          <img src={datos.foto} alt="Logo de la clínica" className="w-14 h-14 rounded-2xl object-contain bg-white border border-gray-100 mx-auto" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" strokeWidth={1.5} />
          </div>
        )}
        <p className={`font-['Montserrat'] font-extrabold text-[15px] leading-tight mt-2.5 mb-2 break-words ${datos.nombre.trim() ? 'text-[#1A3D3D]' : 'text-[#B4BCBC]'}`}>
          {datos.nombre.trim() || 'Nombre de la clínica'}
        </p>
        <div className="bg-[#F4F7F7] rounded-xl px-2.5 py-2">
          <span className={`text-[13px] font-semibold leading-snug ${ubicacion ? 'text-[#2D6A6A]' : 'text-[#B4BCBC]'}`}>
            {ubicacion || 'Ubicación'}
          </span>
        </div>

        <div className="border-t border-gray-100 mt-3 pt-3 text-left">
          <div className="flex justify-between text-[13px] font-semibold text-[#1A3D3D] mb-1.5">
            <span>Tu perfil</span><span>{porcentaje}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4DB6AC] transition-all duration-500" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      </article>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-3 py-2.5 text-[13px] font-medium leading-snug flex gap-2">
        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{paso >= TOTAL_PASOS ? 'Estamos verificando la matrícula (24 a 48 hs)' : 'Van a ver el perfil público cuando verifiquemos la matrícula'}</span>
      </div>
    </div>
  );
}

// Horarios: opciones de hora y atajos para los más comunes
const HORAS = Array.from({ length: 25 }, (_, i) => String(i).padStart(2, '0'));
const HORARIOS_RAPIDOS = [['08', '18'], ['09', '18'], ['09', '20'], ['08', '20']];

// Dos listas desplegables ("desde" y "hasta") más los atajos de horarios comunes
function SelectorHorario({ desde, hasta, onCambio, conAtajos = false }) {
  const claseSelect = "flex-1 min-w-0 bg-[#F4F7F7] border border-transparent rounded-2xl px-3 py-3.5 text-[17px] font-bold text-[#1A3D3D] text-center outline-none transition-all duration-300 focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10";
  return (
    <div>
      {conAtajos && (
        <div className="flex flex-wrap gap-2 mb-3">
          {HORARIOS_RAPIDOS.map(([d, h]) => (
            <button
              key={`${d}-${h}`}
              type="button"
              onClick={() => onCambio(d, h)}
              className={`${CLASE_CHIP} ${desde === d && hasta === h ? 'bg-[#2D6A6A] border-[#2D6A6A] text-white' : 'bg-white border-gray-200 text-[#555555] hover:border-[#2D6A6A]'}`}
            >
              {d} a {h} hs
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2.5">
        <select aria-label="Hora de apertura" value={desde} onChange={(e) => onCambio(e.target.value, hasta)} className={claseSelect}>
          <option value="">--</option>
          {HORAS.slice(0, 24).map((h) => <option key={h} value={h}>{h}:00</option>)}
        </select>
        <span className="text-[12px] font-bold uppercase tracking-widest text-gray-400">hasta</span>
        <select aria-label="Hora de cierre" value={hasta} onChange={(e) => onCambio(desde, e.target.value)} className={claseSelect}>
          <option value="">--</option>
          {HORAS.slice(1).map((h) => <option key={h} value={h}>{h}:00</option>)}
        </select>
        <span className="text-[12px] font-bold uppercase tracking-widest text-gray-400">hs</span>
      </div>
    </div>
  );
}

// Campo de WhatsApp con el +54 fijo (guarda solo los dígitos, sin el 54)
function CampoWhatsapp({ id, valor, onCambio }) {
  return (
    <div className="flex items-center bg-[#F4F7F7] rounded-2xl overflow-hidden border border-transparent transition-all duration-300 focus-within:bg-white focus-within:border-[#2D6A6A] focus-within:ring-4 focus-within:ring-[#2D6A6A]/10">
      <span className="px-4 py-4 text-[17px] font-bold text-[#1A3D3D] bg-[#E9EEEE] select-none">+54</span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={valor}
        onChange={(e) => onCambio(e.target.value.replace(/\D/g, ''))}
        placeholder="911 2345 6789"
        className="flex-1 bg-transparent px-4 py-4 text-[17px] font-medium text-[#1A3D3D] outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL: ONBOARDING DE CLÍNICAS
// ==========================================
export default function OnboardingClinica() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshUser } = useAuth();

  // Si viene desde la pantalla de rechazo, es un reenvío para corregir datos
  const esCorreccion = location.state?.correccion === true;

  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [subiendoTitulo, setSubiendoTitulo] = useState(false);
  const [progresoTitulo, setProgresoTitulo] = useState(0);
  const [recorte, setRecorte] = useState({ abierto: false, imagen: null });
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Datos del sistema de la clínica (no los edita la persona): si el documento ya existe y cuál es su slug
  const sistema = useRef({ existe: false, slug: '' });

  const cambiar = (campo, valor) => {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setError('');
  };

  // ----- Carga inicial: decide si corresponde el cuestionario y recupera lo que ya se guardó -----
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Solo entra al cuestionario una clínica con onboardingCompleto en false.
    // (En modo corrección también se puede entrar aunque ya lo haya completado antes)
    if (currentUser.rol !== 'clinica' || (currentUser.onboardingCompleto !== false && !esCorreccion)) {
      navigate('/ecosistema', { replace: true });
      return;
    }

    let cancelado = false;
    const cargarDatos = async () => {
      try {
        const uid = currentUser.uid;
        const [snapClinica, snapVerificacion] = await Promise.all([
          getDoc(doc(db, 'clinicas', uid)),
          getDoc(doc(db, 'verificaciones', uid)).catch(() => null)
        ]);
        if (cancelado) return;

        const clinica = snapClinica.exists() ? snapClinica.data() : {};
        const verificacion = snapVerificacion && snapVerificacion.exists() ? snapVerificacion.data() : {};
        sistema.current = { existe: snapClinica.exists(), slug: clinica.slug || '' };

        // Modo corrección: solo se puede entrar si la solicitud fue rechazada
        if (esCorreccion && verificacion.estado !== 'rechazado') {
          navigate('/ecosistema', { replace: true });
          return;
        }
        if (esCorreccion) setMotivoRechazo(verificacion.motivoRechazo || '');

        // El título solo se reutiliza si es de una solicitud de clínica (no de una cuenta profesional vieja)
        const verificacionDeClinica = verificacion.tipo === 'clinica';

        setDatos({
          ...ESTADO_INICIAL,
          nombre: clinica.nombre || '',
          foto: clinica.foto || '',
          directorNombre: currentUser.directorNombre || '',
          tipo: currentUser.directorTipoMatricula || 'MP',
          mat: currentUser.directorMatricula || '',
          provMat: currentUser.directorProvincia || ESTADO_INICIAL.provMat,
          tituloPath: verificacionDeClinica ? (verificacion.tituloPath || '') : '',
          tituloNombre: verificacionDeClinica ? (verificacion.tituloNombre || '') : '',
          direccion: clinica.direccion || '',
          placeId: clinica.placeId || '',
          lat: clinica.lat ?? null,
          lng: clinica.lng ?? null,
          provincia: clinica.provincia || '',
          localidad: clinica.localidad || '',
          barrio: clinica.barrio || '',
          wa: String(clinica.whatsapp || '').replace(/\D/g, '').replace(/^54/, ''),
          telefono: clinica.telefono || '',
          guardia: clinica.guardia24hs === true,
          waGuardia: String(clinica.telefonoGuardia || '').replace(/\D/g, '').replace(/^54/, ''),
          horarios: {
            semanaDesde: horaA2(clinica.horarios?.semanaDesde),
            semanaHasta: horaA2(clinica.horarios?.semanaHasta),
            sabadoDesde: horaA2(clinica.horarios?.sabadoDesde),
            sabadoHasta: horaA2(clinica.horarios?.sabadoHasta)
          },
          sabadoAbre: !!(clinica.horarios?.sabadoDesde && clinica.horarios?.sabadoHasta),
          servicios: normalizarServicios(clinica.servicios, GRUPOS_CLINICA),
          desc: clinica.descripcion || '',
          ig: usuarioDeInstagram(clinica.redes?.instagram || ''),
          fb: clinica.redes?.facebook || ''
        });

        // En corrección arranca desde el principio para revisar todo; si no, retoma donde dejó
        setPaso(esCorreccion ? 0 : Math.min(currentUser.onboardingPaso || 0, TOTAL_PASOS - 1));
      } catch (e) {
        console.error('Error cargando el cuestionario:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();
    return () => { cancelado = true; };
  }, [currentUser?.uid]);

  // ----- Logo: primero se elige, después se encuadra y recién ahí se sube -----
  const manejarLogo = async (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('Elegí una imagen (JPG o PNG).'); return; }
    try {
      const imagen = await leerArchivoComoDataURL(archivo);
      setRecorte({ abierto: true, imagen });
    } catch (e) {
      console.error('Error leyendo la imagen:', e);
      setError('No pudimos abrir la imagen. Probá con otra.');
    }
  };

  const subirLogoRecortado = async (imagenRecortada) => {
    setRecorte({ abierto: false, imagen: null });
    setSubiendoLogo(true);
    setError('');
    try {
      const extension = imagenRecortada.startsWith('data:image/png') ? 'png' : 'jpg';
      const archivoRef = ref(storage, `clinicas/${currentUser.uid}/logo_${Date.now()}.${extension}`);
      await uploadString(archivoRef, imagenRecortada, 'data_url');
      const url = await getDownloadURL(archivoRef);
      setDatos((previo) => ({ ...previo, foto: url }));
    } catch (e) {
      console.error('Error subiendo el logo:', e);
      setError('No pudimos subir la imagen. Revisá tu conexión y probá de nuevo.');
    } finally {
      setSubiendoLogo(false);
    }
  };

  // ----- Foto del título del director/a (va a una carpeta privada de Storage) -----
  const manejarTitulo = async (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/') && archivo.type !== 'application/pdf') { setError('Subí una foto (JPG o PNG) o un PDF.'); return; }
    if (archivo.size > 10 * 1024 * 1024) { setError('El archivo no puede pesar más de 10 MB.'); return; }

    setSubiendoTitulo(true);
    setProgresoTitulo(0);
    setError('');

    const extension = (archivo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rutaNueva = `titulos/${currentUser.uid}/titulo_${Date.now()}.${extension}`;
    const tarea = uploadBytesResumable(ref(storage, rutaNueva), archivo);

    tarea.on(
      'state_changed',
      (instantanea) => setProgresoTitulo(Math.round((instantanea.bytesTransferred / instantanea.totalBytes) * 100)),
      (e) => {
        console.error('Error subiendo el título:', e);
        setError('No pudimos subir el archivo. Revisá tu conexión y probá de nuevo.');
        setSubiendoTitulo(false);
      },
      async () => {
        try {
          // Guardamos solo la RUTA (no un link abierto): el archivo es privado y lo ve nada más el equipo
          await guardarCampos('verificaciones', currentUser.uid, {
            tipo: 'clinica',
            tituloPath: rutaNueva,
            tituloNombre: archivo.name,
            tituloSubidoEn: serverTimestamp()
          });
          // Si ya había un título anterior, lo borramos para no dejar archivos sueltos
          if (datos.tituloPath) deleteObject(ref(storage, datos.tituloPath)).catch(() => {});
          setDatos((previo) => ({ ...previo, tituloPath: rutaNueva, tituloNombre: archivo.name }));
        } catch (e) {
          console.error('Error guardando la ruta del título:', e);
          setError('Se subió el archivo pero no pudimos registrarlo. Probá de nuevo.');
        } finally {
          setSubiendoTitulo(false);
        }
      }
    );
  };

  // ----- Horarios -----
  const cambiarHorario = (campoDesde, campoHasta) => (desde, hasta) => {
    setDatos((previo) => ({ ...previo, horarios: { ...previo.horarios, [campoDesde]: desde, [campoHasta]: hasta } }));
    setError('');
  };

  // ----- Dirección (Google Maps) -----
  const escribirDireccion = (texto) => {
    // Si escribe a mano, la dirección deja de estar confirmada por Google
    setDatos((previo) => ({ ...previo, direccion: texto, placeId: '', lat: null, lng: null }));
    setError('');
  };

  const elegirDireccion = (lugar) => {
    setDatos((previo) => ({
      ...previo,
      direccion: lugar.direccion,
      placeId: lugar.placeId,
      lat: lugar.lat,
      lng: lugar.lng,
      provincia: lugar.provincia,
      localidad: lugar.localidad,
      barrio: lugar.barrio
    }));
    setError('');
  };

  // ----- Validaciones de cada paso -----
  const validarPaso = (p) => {
    if (p === 0 && datos.nombre.trim().length < 3) return 'Escribí el nombre de la clínica para seguir.';
    if (p === 1) {
      if (!datos.directorNombre.trim()) return 'Escribí el nombre completo del director o directora técnica.';
      if (contarDigitos(datos.mat) < 3) return 'La matrícula debe tener al menos 3 números.';
      if (!datos.tituloPath) return 'Sumá la foto del título o carnet para poder verificar la clínica (obligatorio).';
    }
    if (p === 2) {
      if (!datos.placeId) return 'Elegí la dirección de la lista de Google para confirmarla.';
      if (contarDigitos(datos.wa) < 8) return 'Cargá el WhatsApp de la clínica (con código de área, ej: 11 2345 6789).';
      if (datos.guardia) {
        if (contarDigitos(datos.waGuardia) < 8) return 'Si tienen guardia 24 hs, cargá el WhatsApp al que escriben los tutores en una urgencia.';
      } else {
        const { semanaDesde, semanaHasta, sabadoDesde, sabadoHasta } = datos.horarios;
        if (!semanaDesde || !semanaHasta) return 'Elegí el horario de lunes a viernes.';
        if (Number(semanaDesde) >= Number(semanaHasta)) return 'En lunes a viernes, la hora de apertura tiene que ser menor que la de cierre.';
        if (datos.sabadoAbre) {
          if (!sabadoDesde || !sabadoHasta) return 'Elegí el horario de los sábados o marcá "Cerrado".';
          if (Number(sabadoDesde) >= Number(sabadoHasta)) return 'En sábados, la hora de apertura tiene que ser menor que la de cierre.';
        }
      }
    }
    return '';
  };

  // ----- Qué se guarda en cada paso (mismos campos que usa el editor de clínicas) -----
  const camposDelPaso = (p, d, slug) => {
    if (p === 0) {
      return {
        clinica: {
          uid: currentUser.uid, slug, nombre: d.nombre.trim(), foto: d.foto,
          // Una clínica nueva no se publica hasta que la verifiquemos
          ...(sistema.current.existe ? {} : { visible: false }),
          ultimaEdicion: serverTimestamp()
        },
        usuario: { nombre: d.nombre.trim(), nombreCompleto: d.nombre.trim(), slug }
      };
    }
    if (p === 1) {
      // Los datos del director/a NO van al perfil público: quedan en la cuenta, de uso interno
      return {
        clinica: {},
        usuario: {
          directorNombre: d.directorNombre.trim(), directorMatricula: d.mat, directorTipoMatricula: d.tipo,
          directorProvincia: d.provMat
        }
      };
    }
    if (p === 2) {
      return {
        clinica: {
          direccion: d.direccion, placeId: d.placeId, lat: d.lat, lng: d.lng,
          provincia: d.provincia, localidad: d.localidad, barrio: d.barrio,
          whatsapp: d.wa ? `54${d.wa}` : '', telefono: d.telefono.trim(),
          guardia24hs: d.guardia,
          telefonoGuardia: d.guardia && d.waGuardia ? `54${d.waGuardia}` : '',
          horarios: {
            semanaDesde: d.horarios.semanaDesde, semanaHasta: d.horarios.semanaHasta,
            sabadoDesde: d.sabadoAbre ? d.horarios.sabadoDesde : '', sabadoHasta: d.sabadoAbre ? d.horarios.sabadoHasta : ''
          }
        },
        usuario: {}
      };
    }
    if (p === 3) {
      return { clinica: { servicios: normalizarServicios(d.servicios, GRUPOS_CLINICA) }, usuario: {} };
    }
    return {
      clinica: { descripcion: d.desc.trim(), redes: { instagram: instagramAURL(d.ig), facebook: d.fb } },
      usuario: {}
    };
  };

  // Guarda un paso y anota hasta dónde llegó (para retomar después)
  const guardarPaso = async (p, d) => {
    let slug = sistema.current.slug;
    // El slug se arma una sola vez (en el primer paso) y queda fijo
    if (p === 0 && !slug) slug = await buscarSlugLibre(generarSlug(d.nombre) || 'clinica', currentUser.uid);

    const { clinica, usuario } = camposDelPaso(p, d, slug);
    if (Object.keys(clinica).length > 0) {
      await guardarCampos('clinicas', currentUser.uid, clinica);
      sistema.current = { existe: true, slug: slug || sistema.current.slug };
    }
    await guardarCampos('usuarios', currentUser.uid, { ...usuario, onboardingPaso: p + 1 });
  };

  // Último paso: manda todo a verificación y marca el cuestionario como completo
  const finalizar = async (d) => {
    const uid = currentUser.uid;
    const { clinica } = camposDelPaso(TOTAL_PASOS - 1, d, sistema.current.slug);
    await guardarCampos('clinicas', uid, { ...clinica, visible: false });

    // El estado de verificación vive en su propia colección, lejos de lo que edita la persona.
    // Guardamos una "foto" de los datos enviados para que quien verifica vea exactamente lo que se mandó.
    await guardarCampos('verificaciones', uid, {
      tipo: 'clinica',
      estado: 'pendiente',
      enviadoEn: serverTimestamp(),
      // Si es un reenvío tras un rechazo, borramos el motivo anterior
      ...(esCorreccion ? { motivoRechazo: '' } : {}),
      datosEnviados: {
        nombreCompleto: d.nombre.trim(),
        directorNombre: d.directorNombre.trim(),
        matricula: d.mat, tipoMatricula: d.tipo,
        provincia: d.provMat,
        direccion: d.direccion
      }
    });

    await guardarCampos('usuarios', uid, { onboardingCompleto: true, onboardingPaso: TOTAL_PASOS });
    await refreshUser();
    setPaso(TOTAL_PASOS);
  };

  // ----- Botones de navegación -----
  const irAlSiguiente = async () => {
    const mensaje = validarPaso(paso);
    if (mensaje) { setError(mensaje); return; }

    setGuardando(true);
    try {
      if (paso === TOTAL_PASOS - 1) await finalizar(datos);
      else { await guardarPaso(paso, datos); setPaso(paso + 1); }
      setError('');
    } catch (e) {
      console.error('Error guardando el paso:', e);
      setError('No pudimos guardar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Solo los pasos opcionales (servicios y sobre la clínica) se pueden saltear
  const completarDespues = async () => {
    setGuardando(true);
    try {
      if (paso === TOTAL_PASOS - 1) await finalizar(datos);
      else { await guardarPaso(paso, datos); setPaso(paso + 1); }
      setError('');
    } catch (e) {
      console.error('Error al saltear el paso:', e);
      setError('No pudimos guardar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const volver = () => { setPaso(paso - 1); setError(''); };

  // Nombre: mayúscula automática sin saltar el cursor
  const cambiarNombreCapitalizado = (campo) => (evento) => {
    const input = evento.target;
    const posicion = input.selectionStart;
    cambiar(campo, capitalizarNombre(input.value));
    requestAnimationFrame(() => { try { input.setSelectionRange(posicion, posicion); } catch (e) { /* no pasa nada */ } });
  };

  // ----- Pantalla de carga -----
  if (cargando || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
      </div>
    );
  }

  // ==========================================
  // CONTENIDO DE CADA PASO
  // ==========================================
  const renderPaso = () => {
    if (paso === 0) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-nombre">Nombre de la clínica</label>
          <input id="ob-nombre" value={datos.nombre} onChange={cambiarNombreCapitalizado('nombre')} placeholder="Clínica Veterinaria del Parque" autoComplete="off" className={CLASE_INPUT} />

          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F7F7] text-gray-400 flex items-center justify-center shrink-0 overflow-hidden">
              {datos.foto ? <img src={datos.foto} alt="Logo" className="w-full h-full object-contain" /> : <Camera className="w-7 h-7" strokeWidth={1.5} />}
            </div>
            <div>
              <label className={`${CLASE_BTN_SECUNDARIO} inline-flex items-center gap-2 cursor-pointer ${subiendoLogo ? 'opacity-60 pointer-events-none' : ''}`}>
                {subiendoLogo ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</> : (datos.foto ? 'Cambiar logo' : 'Subir logo')}
                <input type="file" accept="image/*" className="hidden" onChange={manejarLogo} disabled={subiendoLogo} />
              </label>
              <p className={CLASE_AYUDA}>El logo o una foto de la fachada. Lo pueden sumar después.</p>
            </div>
          </div>
        </>
      );
    }

    if (paso === 1) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-director">Nombre completo del director/a técnico/a</label>
          <input id="ob-director" value={datos.directorNombre} onChange={cambiarNombreCapitalizado('directorNombre')} placeholder="María González" autoComplete="off" className={CLASE_INPUT} />

          <label className={CLASE_LABEL} htmlFor="ob-mat">Número de matrícula</label>
          <div className="flex gap-2.5">
            <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value)} className={CLASE_SELECT_CORTO}>
              <option value="MP">MP</option>
              <option value="MN">MN</option>
            </select>
            <input id="ob-mat" inputMode="numeric" value={datos.mat} onChange={(e) => cambiar('mat', e.target.value.replace(/[^0-9-]/g, ''))} placeholder="12345" autoComplete="off" className={CLASE_INPUT} />
          </div>
          <p className={CLASE_AYUDA}>Mínimo 3 números.</p>

          <label className={CLASE_LABEL} htmlFor="ob-prov-mat">Provincia de la matrícula</label>
          <select id="ob-prov-mat" value={datos.provMat} onChange={(e) => cambiar('provMat', e.target.value)} className={CLASE_INPUT}>
            {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <span className={CLASE_LABEL}>Foto del título o carnet del director/a (obligatorio).</span>
          {datos.tituloPath ? (
            <div className="flex items-center gap-3 bg-[#4DB6AC]/10 border border-[#4DB6AC] rounded-2xl px-4 py-3.5">
              <FileCheck className="w-7 h-7 text-[#2D6A6A] shrink-0" strokeWidth={1.5} />
              <span className="flex-1 min-w-0 text-[15px] font-semibold text-[#1A3D3D] truncate">{datos.tituloNombre || 'Título cargado'}</span>
              <label className={`${CLASE_BTN_SECUNDARIO} cursor-pointer ${subiendoTitulo ? 'opacity-60 pointer-events-none' : ''}`}>
                {subiendoTitulo ? `${progresoTitulo}%` : 'Cambiar'}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={manejarTitulo} disabled={subiendoTitulo} />
              </label>
            </div>
          ) : (
            <label className={`w-full border-2 border-dashed border-[#2D6A6A]/40 rounded-2xl px-4 py-6 text-[#2D6A6A] text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${subiendoTitulo ? 'bg-[#2D6A6A]/5 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A]'}`}>
              {subiendoTitulo
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Subiendo… {progresoTitulo}%</>
                : <><Upload className="w-5 h-5" /> Subir foto del título o carnet para validar (obligatorio)</>}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={manejarTitulo} disabled={subiendoTitulo} />
            </label>
          )}
          <p className={CLASE_AYUDA}>Solo lo ve nuestro equipo para verificar la matrícula. No se publica.</p>
        </>
      );
    }

    if (paso === 2) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-direccion">Dirección de la clínica</label>
          <BuscadorDireccionGoogle
            id="ob-direccion"
            valor={datos.direccion}
            onEscribir={escribirDireccion}
            onElegir={elegirDireccion}
            placeholder="Buscá por nombre o dirección"
            listaProvincias={provincias}
          />
          {datos.placeId ? (
            <p className="text-[12px] font-semibold text-[#2D6A6A] mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-[15px] h-[15px]" /> Confirmado con Google{datos.barrio ? ` · Barrio: ${datos.barrio}` : ''}
            </p>
          ) : (
            <p className={CLASE_AYUDA}>Elegí una opción de la lista para confirmar la dirección con Google.</p>
          )}

          <label className={CLASE_LABEL} htmlFor="ob-wa">WhatsApp de la clínica</label>
          <CampoWhatsapp id="ob-wa" valor={datos.wa} onCambio={(v) => cambiar('wa', v)} />
          <p className={CLASE_AYUDA}>Es el botón que usan los tutores para escribirles.</p>

          <label className={CLASE_LABEL} htmlFor="ob-tel">Teléfono fijo (opcional)</label>
          <input id="ob-tel" type="tel" inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} placeholder="011 4567 8900" autoComplete="off" className={CLASE_INPUT} />

          {/* Guardia 24 hs */}
          <div className="flex items-center justify-between gap-4 bg-[#F4F7F7] rounded-2xl px-5 py-4 mt-8">
            <div>
              <p className="text-[16px] font-semibold text-[#1A3D3D]">Guardia 24 hs</p>
              <p className="text-sm text-[#666666] mt-0.5">Suma una insignia y un botón de urgencias a su perfil.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={datos.guardia}
              aria-label="Guardia 24 hs"
              onClick={() => cambiar('guardia', !datos.guardia)}
              className="relative shrink-0 rounded-full transition-colors duration-300"
              style={{ width: 52, height: 30, backgroundColor: datos.guardia ? '#25D366' : '#D1D5DB' }}
            >
              <span
                className="absolute rounded-full bg-white shadow transition-all duration-300"
                style={{ top: 3, left: datos.guardia ? 25 : 3, width: 24, height: 24 }}
              />
            </button>
          </div>

          {datos.guardia ? (
            <>
              <label className={CLASE_LABEL} htmlFor="ob-wa-guardia">WhatsApp de la guardia</label>
              <CampoWhatsapp id="ob-wa-guardia" valor={datos.waGuardia} onCambio={(v) => cambiar('waGuardia', v)} />
              {datos.wa && datos.waGuardia !== datos.wa && (
                <button type="button" onClick={() => cambiar('waGuardia', datos.wa)} className={`${CLASE_BTN_TEXTO} mt-1`}>
                  Usar el mismo WhatsApp de la clínica
                </button>
              )}
              <p className={CLASE_AYUDA}>Es el número al que escriben los tutores en una urgencia.</p>
              <div className="mt-5 bg-[#F4F7F7] rounded-2xl px-4 py-3.5 flex gap-2.5">
                <Clock className="w-5 h-5 text-[#2D6A6A] shrink-0" strokeWidth={1.5} />
                <p className="text-[14px] font-medium text-[#1A3D3D] leading-relaxed">Atienden las 24 horas, todos los días. No hace falta cargar horarios.</p>
              </div>
            </>
          ) : (
            <>
              <span className={CLASE_LABEL}>Horario de lunes a viernes</span>
              <SelectorHorario
                conAtajos
                desde={datos.horarios.semanaDesde}
                hasta={datos.horarios.semanaHasta}
                onCambio={cambiarHorario('semanaDesde', 'semanaHasta')}
              />

              <span className={CLASE_LABEL}>Sábados</span>
              <div className="flex gap-2 mb-3">
                {[[true, 'Atienden'], [false, 'Cerrado']].map(([valor, texto]) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => cambiar('sabadoAbre', valor)}
                    className={`${CLASE_CHIP} ${datos.sabadoAbre === valor ? 'bg-[#2D6A6A] border-[#2D6A6A] text-white' : 'bg-white border-gray-200 text-[#555555] hover:border-[#2D6A6A]'}`}
                  >
                    {texto}
                  </button>
                ))}
              </div>
              {datos.sabadoAbre && (
                <SelectorHorario
                  desde={datos.horarios.sabadoDesde}
                  hasta={datos.horarios.sabadoHasta}
                  onCambio={cambiarHorario('sabadoDesde', 'sabadoHasta')}
                />
              )}
              <p className={CLASE_AYUDA}>Después pueden ajustar todo desde el editor.</p>
            </>
          )}
        </>
      );
    }

    if (paso === 3) {
      return (
        <>
          <span className={CLASE_LABEL}>Servicios y equipamiento (opcional)</span>
          <SelectorServicios servicios={datos.servicios} setFormData={setDatos} grupos={GRUPOS_CLINICA} />
          <p className={CLASE_AYUDA}>Buscá o abrí un grupo y tildá lo que ofrecen. Si no está, lo pueden agregar como servicio propio.</p>
        </>
      );
    }

    return (
      <>
        <label className={CLASE_LABEL} htmlFor="ob-desc">Presentación de la clínica</label>
        <textarea
          id="ob-desc"
          rows={5}
          maxLength={350}
          value={datos.desc}
          onChange={(e) => cambiar('desc', e.target.value)}
          placeholder="Somos una clínica veterinaria con guardia las 24 hs, internación y cirugía."
          className={`${CLASE_INPUT} resize-none`}
        />
        <p className="text-right text-sm text-[#666666] mt-2">{datos.desc.length} / 350</p>

        <label className={CLASE_LABEL} htmlFor="ob-ig">Instagram (opcional)</label>
        <input id="ob-ig" value={datos.ig} onChange={(e) => cambiar('ig', e.target.value.replace(/^@/, ''))} placeholder="@tu_clinica" autoComplete="off" className={CLASE_INPUT} />
      </>
    );
  };

  // ==========================================
  // PANTALLA
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] selection:bg-[#2D6A6A] selection:text-white">
      {/* Ventana para encuadrar el logo */}
      {recorte.abierto && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de imagen</h3>
                <p className="text-sm text-gray-500 mt-1">Arrastrá para mover la imagen o usá el zoom.</p>
              </div>
              <button onClick={() => setRecorte({ abierto: false, imagen: null })} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center">
              <RecortadorImagen
                imagen={recorte.imagen}
                forma="cuadrado"
                tamanoSalida={512}
                formato="png"
                onAplicar={subirLogoRecortado}
                onCancelar={() => setRecorte({ abierto: false, imagen: null })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barra superior simple */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 md:px-10">
        <div className="max-w-[1100px] w-full mx-auto flex items-center">
          <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-xl tracking-tight">
            Portal Veterinario<span className="text-[#2D6A6A]">.</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col lg:flex-row lg:justify-center gap-8 items-start">
        {/* Tarjeta en vivo: solo se ve en PC */}
        <aside className="hidden lg:block lg:w-[280px] shrink-0 sticky top-8">
          <TarjetaViva datos={datos} paso={paso} />
        </aside>

        {/* Cuestionario */}
        <main className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10 max-w-[640px] w-full flex-1 min-w-0">
          {/* Aviso al corregir: recuerda el motivo del rechazo mientras edita */}
          {esCorreccion && paso < TOTAL_PASOS && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[15px] font-bold text-[#1A3D3D]">Estás corrigiendo la solicitud</p>
                <p className="text-[14px] font-medium text-[#666666] leading-relaxed mt-1 whitespace-pre-line">
                  {motivoRechazo ? `Motivo: ${motivoRechazo}` : 'Revisá los datos y volvé a enviarlos.'}
                </p>
              </div>
            </div>
          )}
          <BarraPasos paso={paso} />

          {paso < TOTAL_PASOS ? (
            <>
              <p className="text-[13px] font-semibold text-[#2D6A6A] mb-1.5">Paso {paso + 1} de {TOTAL_PASOS}</p>
              <h1 className="font-['Montserrat'] font-extrabold text-2xl md:text-[28px] leading-tight text-[#1A3D3D] mb-2">{TITULOS[paso]}</h1>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666]">{SUBTITULOS[paso]}</p>

              {renderPaso()}

              <p className="min-h-[20px] text-sm font-medium text-red-500 mt-4" role="alert">{error}</p>

              <div className="flex justify-between items-center gap-2 mt-6">
                {paso > 0 ? (
                  <button type="button" onClick={volver} disabled={guardando} className={CLASE_BTN_VOLVER}>Volver</button>
                ) : <span />}
                <div className="flex items-center gap-1.5">
                  {paso >= 3 && paso < TOTAL_PASOS - 1 && (
                    <button type="button" onClick={completarDespues} disabled={guardando} className={CLASE_BTN_TEXTO}>Completar después</button>
                  )}
                  <button type="button" onClick={irAlSiguiente} disabled={guardando || subiendoLogo || subiendoTitulo} className={CLASE_BTN_PRIMARIO}>
                    {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                    {paso === TOTAL_PASOS - 1 ? 'Enviar a verificación' : 'Siguiente'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Pantalla final */
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" strokeWidth={1.5} />
              </div>
              <h1 className="font-['Montserrat'] font-extrabold text-2xl md:text-[28px] leading-tight text-[#1A3D3D] mb-2.5">
                ¡Listo{datos.nombre.trim() ? `, ${datos.nombre.trim()}` : ''}!
              </h1>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666] max-w-sm mx-auto">
                Recibimos la matrícula del director/a técnico/a. La verificamos en 24 a 48 horas y les avisamos por mail.
              </p>
              <div className="bg-[#F4F7F7] rounded-2xl px-4 py-3.5 my-6 text-left text-[15px] font-medium text-[#1A3D3D] leading-relaxed">
                Mientras esperan, pueden sumar el equipo, los horarios y las fotos desde el perfil. Apenas verifiquemos, sale publicado.
              </div>
              <button type="button" onClick={() => navigate('/ecosistema')} className={`${CLASE_BTN_PRIMARIO} w-full`}>
                Ir a mi perfil
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}