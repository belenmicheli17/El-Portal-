import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Camera, Check, Loader2, X, Clock, GraduationCap, FileCheck, Upload,
  CheckCircle2, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown, ChevronLeft
} from 'lucide-react';
import provincias from '../data/provincias.js';
import { etiquetaAlumnx } from '../utils/bolsa';
import { RecortadorImagen, generarSlug, usuarioDeInstagram, instagramAURL } from '../components/editor/EditorComponents';

// Cuestionario de alta de alumnos/as. El mismo archivo sirve después para editar el perfil.

const TOTAL_PASOS = 4;
const NOMBRES_PASOS = ['Tus datos', 'Tu facultad', 'Sobre vos', 'Contacto'];
const TITULOS = ['Contanos quién sos', 'Tu facultad', 'Sobre vos', 'Redes y WhatsApp'];
const SUBTITULOS = [
  'Con tu perfil de estudiante te podés postular a las búsquedas de asistente de la Bolsa de Trabajo y mostrarte disponible para las clínicas.',
  'Con el certificado de alumno regular verificamos que estás cursando.',
  'Es lo que leen las clínicas cuando te postulás en la Bolsa de Trabajo.',
  'Todo es opcional. Tus redes se muestran en tu perfil.'
];

// Facultades con Veterinaria (sugerencias: también se puede escribir otra)
const UNIVERSIDADES = [
  'Universidad de Buenos Aires (UBA)',
  'Universidad Nacional de La Plata (UNLP)',
  'Universidad Nacional del Centro de la Provincia de Buenos Aires (UNICEN)',
  'Universidad Nacional de Río Cuarto (UNRC)',
  'Universidad Nacional del Litoral (UNL)',
  'Universidad Nacional de Rosario (UNR)',
  'Universidad Nacional del Nordeste (UNNE)',
  'Universidad Nacional de La Pampa (UNLPam)',
  'Universidad Nacional de Villa María (UNVM)',
  'Universidad Nacional de Río Negro (UNRN)',
  'Universidad Católica de Córdoba (UCC)',
  'Universidad del Salvador (USAL)',
  'Universidad Juan Agustín Maza',
  'Universidad Abierta Interamericana (UAI)',
  'Universidad Maimónides'
];

// Largo máximo del comentario de cada experiencia
const MAX_DETALLE = 300;

// Sin tildes y en minúscula, para comparar lo que se escribe con la lista
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const OPCIONES_LLEGADA = [
  'Me lo recomendó un/a compañero/a', 'Instagram', 'Facebook', 'Google',
  'En la facultad', 'Bolsa de trabajo', 'Otro'
];

// Estilos (los mismos de los otros cuestionarios)
const CLASE_INPUT = "w-full bg-[#F4F7F7] border border-transparent rounded-2xl px-5 py-4 text-[17px] font-medium text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 placeholder:text-gray-400";
const CLASE_LABEL = "block text-[15px] font-semibold text-[#1A3D3D] mt-5 mb-2";
const CLASE_AYUDA = "text-sm text-[#666666] mt-2 leading-normal";
const CLASE_CHIP = "border rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-300 ease-in-out";
const CLASE_BTN_PRIMARIO = "bg-[#2D6A6A] text-white rounded-xl px-4 md:px-7 py-4 text-[13px] font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] disabled:opacity-50 flex items-center justify-center gap-2";
const CLASE_BTN_VOLVER = "bg-white text-[#666666] border border-gray-200 rounded-xl px-4 md:px-5 py-4 text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] hover:text-[#1A3D3D] disabled:opacity-50";
const CLASE_BTN_SECUNDARIO = "bg-white text-[#1A3D3D] border border-gray-200 rounded-xl px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A]";
const chip = (activo) => `${CLASE_CHIP} ${activo ? 'bg-[#2D6A6A] border-[#2D6A6A] text-white' : 'bg-white border-gray-200 text-[#666666] hover:border-[#2D6A6A]'}`;
const Obligatorio = () => <span className="text-red-500" aria-hidden="true"> *</span>;

const ESTADO_INICIAL = {
  nombre: '', apellido: '', tituloGenero: '', foto: '',
  universidad: '', provincia: '',
  certificadoPath: '', certificadoNombre: '',
  presentacion: '', trayectoria: [],
  wa: '', ig: '', linkedin: '',
  comoLlego: '', comoLlegoOtro: ''
};

const guardarCampos = (coleccion, uid, datos) =>
  setDoc(doc(db, coleccion, uid), datos, { mergeFields: Object.keys(datos) });

// Busca un link (slug) que no use otro alumno/a
const buscarSlugLibre = async (base, uid) => {
  for (let i = 0; i < 20; i++) {
    const candidato = i === 0 ? base : `${base}-${i + 1}`;
    const snap = await getDocs(query(collection(db, 'alumnos'), where('slug', '==', candidato)));
    if (!snap.docs.some((d) => d.id !== uid)) return candidato;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
};

// Mayúscula al principio de cada palabra
const capitalizar = (texto) => texto.replace(/(^|\s)(\S)/g, (_, espacio, letra) => espacio + letra.toUpperCase());

// ==========================================
// COMPONENTES CHICOS
// ==========================================

function BarraPasos({ paso, onIrAPaso }) {
  return (
    <div className="flex items-start mb-8 md:mb-12 md:pt-7">
      {NOMBRES_PASOS.map((nombre, i) => {
        const completado = paso >= TOTAL_PASOS || i < paso;
        const activo = i === paso && paso < TOTAL_PASOS;
        return (
          <React.Fragment key={nombre}>
            <div
              className={`relative shrink-0 ${onIrAPaso ? 'cursor-pointer' : ''}`}
              onClick={onIrAPaso ? () => onIrAPaso(i) : undefined}
              role={onIrAPaso ? 'button' : undefined}
              aria-label={onIrAPaso ? `Ir a ${nombre}` : undefined}
            >
              <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full border-2 md:border-4 border-white flex items-center justify-center text-[11px] md:text-[13px] font-bold transition-all duration-300 ${
                activo ? 'bg-[#1A3D3D] text-white scale-110 shadow-lg shadow-[#1A3D3D]/30'
                : completado ? 'bg-[#2D6A6A] text-white'
                : 'bg-white text-gray-400 ring-2 ring-inset ring-gray-200'
              }`}>
                {completado && !activo ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`hidden md:block absolute left-1/2 -translate-x-1/2 w-28 text-center text-[12px] font-bold leading-tight bottom-full mb-2 ${activo || completado ? 'text-[#1A3D3D]' : 'text-gray-400'}`}>
                {nombre}
              </span>
            </div>
            {i < TOTAL_PASOS - 1 && (
              <div className="flex-1 min-w-0 h-7 md:h-9 flex items-center">
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

// Tarjeta en vivo (solo PC): así se ve el perfil
function TarjetaViva({ datos, verificado }) {
  const nombre = [datos.nombre, datos.apellido].map((t) => t.trim()).filter(Boolean).join(' ');
  return (
    <div>
      <p className="text-[18px] font-bold text-[#1A3D3D] mb-5">Así te ven las clínicas</p>
      <article className="bg-white border border-gray-100 rounded-[24px] px-4 pt-5 pb-4 text-center shadow-sm">
        {datos.foto ? (
          <img src={datos.foto} alt="Tu foto" className="w-16 h-16 rounded-full object-cover mx-auto" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" strokeWidth={1.5} />
          </div>
        )}
        <p className={`font-['Montserrat'] font-extrabold text-[15px] leading-tight mt-2.5 break-words ${nombre ? 'text-[#1A3D3D]' : 'text-[#B4BCBC]'}`}>
          {nombre || 'Tu nombre'}
        </p>
        <span className="inline-block mt-2 bg-rose-50 text-rose-500 text-[12px] font-bold uppercase tracking-[0.1em] rounded-full px-3 py-1">
          {etiquetaAlumnx(datos.tituloGenero)}
        </span>
        <div className="bg-[#F4F7F7] rounded-xl px-2.5 py-2 mt-3">
          <span className={`text-[13px] font-semibold leading-snug ${datos.universidad ? 'text-[#2D6A6A]' : 'text-[#B4BCBC]'}`}>
            {datos.universidad || 'Tu facultad'}
          </span>
        </div>
      </article>
      {!verificado && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-3 py-2.5 text-[13px] font-medium leading-snug flex gap-2">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Podés postularte en la Bolsa cuando verifiquemos tu certificado.</span>
        </div>
      )}
    </div>
  );
}

// Buscador de facultad: muestra sugerencias a medida que se escribe (busca por nombre o sigla)
function BuscadorFacultad({ valor, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [marcada, setMarcada] = useState(0);
  const texto = normalizar(valor.trim());
  const sugerencias = texto.length < 2 ? [] : UNIVERSIDADES.filter((u) => normalizar(u).includes(texto) && u !== valor).slice(0, 6);
  const mostrar = abierto && sugerencias.length > 0;

  const elegir = (u) => { onCambio(u); setAbierto(false); };
  const teclas = (e) => {
    if (!mostrar) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setMarcada((m) => Math.min(m + 1, sugerencias.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMarcada((m) => Math.max(m - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(sugerencias[marcada]); }
    else if (e.key === 'Escape') setAbierto(false);
  };

  return (
    <div className="relative">
      <input
        id="al-universidad"
        value={valor}
        maxLength={120}
        onChange={(e) => { onCambio(e.target.value); setAbierto(true); setMarcada(0); }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={teclas}
        placeholder="Ej: UBA o La Plata"
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls="al-facultades"
        className={CLASE_INPUT}
      />
      {mostrar && (
        <ul id="al-facultades" role="listbox" className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_12px_32px_rgba(26,61,61,0.12)] overflow-hidden py-1.5">
          {sugerencias.map((u, i) => (
            <li
              key={u}
              role="option"
              aria-selected={i === marcada}
              onMouseDown={(e) => { e.preventDefault(); elegir(u); }}
              onMouseEnter={() => setMarcada(i)}
              className={`flex items-center gap-3 px-4 py-3 text-[15px] font-medium cursor-pointer transition-colors ${i === marcada ? 'bg-[#F4F7F7] text-[#1A3D3D]' : 'text-[#333333]'}`}
            >
              <GraduationCap className="w-4 h-4 text-[#2D6A6A] shrink-0" />
              <span className="min-w-0">{u}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==========================================
// PÁGINA
// ==========================================
export default function OnboardingAlumnx() {
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();

  const [cargando, setCargando] = useState(true);
  // 'alta' (primera vez), 'correccion' (te rechazaron y reenviás) o 'edicion' (ya enviaste, editás el perfil)
  const [modo, setModo] = useState('alta');
  const [estadoVerificacion, setEstadoVerificacion] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [paso, setPaso] = useState(0);
  const [enEncuesta, setEnEncuesta] = useState(false);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoCertificado, setSubiendoCertificado] = useState(false);
  const [progresoCertificado, setProgresoCertificado] = useState(0);
  const [recorte, setRecorte] = useState(null);

  // El link del perfil se arma una sola vez y queda fijo
  const slugGuardado = useRef('');

  const cambiar = (campo, valor) => {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setError('');
    setAviso('');
  };

  // ----- Carga inicial -----
  useEffect(() => {
    if (!currentUser?.uid) return;
    if (currentUser.rol !== 'alumnx') { navigate('/ecosistema', { replace: true }); return; }

    let cancelado = false;
    (async () => {
      try {
        const uid = currentUser.uid;
        const [snapAlumno, snapVerif] = await Promise.all([
          getDoc(doc(db, 'alumnos', uid)),
          getDoc(doc(db, 'verificaciones', uid)).catch(() => null)
        ]);
        if (cancelado) return;
        const a = snapAlumno.exists() ? snapAlumno.data() : {};
        const v = snapVerif?.exists() ? snapVerif.data() : {};
        slugGuardado.current = a.slug || '';

        const yaEnvio = currentUser.onboardingCompleto === true;
        setModo(!yaEnvio ? 'alta' : v.estado === 'rechazado' ? 'correccion' : 'edicion');
        setEstadoVerificacion(v.estado || '');
        setMotivoRechazo(v.motivoRechazo || '');

        setDatos({
          ...ESTADO_INICIAL,
          nombre: a.nombre || '',
          apellido: a.apellido || '',
          tituloGenero: a.tituloGenero || '',
          foto: a.foto || '',
          universidad: a.universidad || '',
          provincia: a.provincia || '',
          certificadoPath: v.tipo === 'alumnx' ? (v.tituloPath || '') : '',
          certificadoNombre: v.tipo === 'alumnx' ? (v.tituloNombre || '') : '',
          presentacion: a.presentacion || '',
          trayectoria: Array.isArray(a.trayectoria)
            ? a.trayectoria.map((t) => ({ id: t.id || Date.now() + Math.random(), titulo: t.titulo || '', desc: t.desc || '', detalle: t.detalle || '' }))
            : [],
          wa: String(currentUser.whatsapp || '').replace(/\D/g, '').replace(/^54/, ''),
          ig: usuarioDeInstagram(a.redes?.instagram || ''),
          linkedin: a.redes?.linkedin || '',
          comoLlego: currentUser.comoLlego || '',
          comoLlegoOtro: currentUser.comoLlegoOtro || ''
        });
        setPaso(yaEnvio ? 0 : Math.min(currentUser.onboardingPaso || 0, TOTAL_PASOS - 1));
      } catch (e) {
        console.error('Error cargando el cuestionario:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, [currentUser?.uid]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [paso, enEncuesta]);

  // ----- Foto de perfil: se elige, se encuadra redonda y se sube -----
  const elegirFoto = (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('Elegí una imagen (JPG o PNG).'); return; }
    const lector = new FileReader();
    lector.onload = (e) => setRecorte(e.target.result);
    lector.readAsDataURL(archivo);
  };

  const subirFoto = async (imagenRecortada) => {
    setRecorte(null);
    setSubiendoFoto(true);
    setError('');
    try {
      const archivoRef = ref(storage, `alumnos/${currentUser.uid}/foto_${Date.now()}.jpg`);
      await uploadString(archivoRef, imagenRecortada, 'data_url');
      const url = await getDownloadURL(archivoRef);
      setDatos((previo) => ({ ...previo, foto: url }));
    } catch (e) {
      console.error('Error subiendo la foto:', e);
      setError('No pudimos subir la foto. Revisá tu conexión y probá de nuevo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  // ----- Certificado de alumno regular (carpeta privada, solo lo ve el equipo) -----
  const subirCertificado = (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/') && archivo.type !== 'application/pdf') { setError('Subí una foto (JPG o PNG) o un PDF.'); return; }
    if (archivo.size > 10 * 1024 * 1024) { setError('El archivo no puede pesar más de 10 MB.'); return; }

    setSubiendoCertificado(true);
    setProgresoCertificado(0);
    setError('');
    const extension = (archivo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rutaNueva = `titulos/${currentUser.uid}/certificado_${Date.now()}.${extension}`;
    const tarea = uploadBytesResumable(ref(storage, rutaNueva), archivo);

    tarea.on(
      'state_changed',
      (inst) => setProgresoCertificado(Math.round((inst.bytesTransferred / inst.totalBytes) * 100)),
      (e) => {
        console.error('Error subiendo el certificado:', e);
        setError('No pudimos subir el archivo. Revisá tu conexión y probá de nuevo.');
        setSubiendoCertificado(false);
      },
      async () => {
        try {
          // Se guarda solo la ruta (no un link abierto): el archivo es privado
          await guardarCampos('verificaciones', currentUser.uid, {
            tipo: 'alumnx',
            tituloPath: rutaNueva,
            tituloNombre: archivo.name,
            tituloSubidoEn: serverTimestamp()
          });
          if (datos.certificadoPath) deleteObject(ref(storage, datos.certificadoPath)).catch(() => {});
          setDatos((previo) => ({ ...previo, certificadoPath: rutaNueva, certificadoNombre: archivo.name }));
        } catch (e) {
          console.error('Error guardando el certificado:', e);
          setError('Se subió el archivo pero no pudimos registrarlo. Probá de nuevo.');
        } finally {
          setSubiendoCertificado(false);
        }
      }
    );
  };

  // ----- Experiencias (trayectoria) -----
  const agregarExperiencia = () =>
    setDatos((p) => ({ ...p, trayectoria: [...p.trayectoria, { id: Date.now(), titulo: '', desc: '', detalle: '' }] }));
  const cambiarExperiencia = (id, campo, valor) =>
    setDatos((p) => ({ ...p, trayectoria: p.trayectoria.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)) }));
  const quitarExperiencia = (id) =>
    setDatos((p) => ({ ...p, trayectoria: p.trayectoria.filter((t) => t.id !== id) }));
  const moverExperiencia = (indice, direccion) => setDatos((p) => {
    const nueva = [...p.trayectoria];
    const destino = indice + direccion;
    if (destino < 0 || destino >= nueva.length) return p;
    [nueva[indice], nueva[destino]] = [nueva[destino], nueva[indice]];
    return { ...p, trayectoria: nueva };
  });

  // ----- Validación de cada paso -----
  const validarPaso = (p) => {
    const d = datos;
    if (p === 0) {
      if (!d.nombre.trim() || !d.apellido.trim()) return 'Completá tu nombre y apellido.';
    }
    if (p === 1) {
      if (!d.universidad.trim()) return 'Contanos en qué facultad estudiás.';
      if (!d.provincia) return 'Elegí la provincia donde vivís.';
      if (!d.certificadoPath) return 'Subí tu certificado de alumno regular.';
    }
    if (p === 2) {
      if (d.presentacion.trim().length < 30) return 'Escribí una presentación de al menos 30 letras.';
      if (d.trayectoria.some((t) => !t.titulo.trim() && (t.desc.trim() || t.detalle.trim()))) return 'A cada experiencia ponele un título, o borrala.';
    }
    if (p === 3) {
      const digitos = d.wa.replace(/\D/g, '').length;
      if (digitos > 0 && digitos < 8) return 'Revisá el WhatsApp: le faltan números.';
    }
    return '';
  };

  // ----- Guardado de cada paso -----
  const guardarPaso = async (p) => {
    const d = datos;
    const uid = currentUser.uid;
    let alumno = {};
    let usuario = {};

    if (p === 0) {
      const nombreCompleto = `${d.nombre.trim()} ${d.apellido.trim()}`;
      if (!slugGuardado.current) slugGuardado.current = await buscarSlugLibre(generarSlug(nombreCompleto) || 'alumno', uid);
      alumno = {
        uid, nombre: d.nombre.trim(), apellido: d.apellido.trim(), nombreCompleto,
        tituloGenero: d.tituloGenero, foto: d.foto, slug: slugGuardado.current
      };
      usuario = { nombre: nombreCompleto, slug: slugGuardado.current };
    } else if (p === 1) {
      alumno = { universidad: d.universidad.trim(), provincia: d.provincia };
      usuario = { universidad: d.universidad.trim() };
    } else if (p === 2) {
      alumno = {
        presentacion: d.presentacion.trim(),
        trayectoria: d.trayectoria.filter((t) => t.titulo.trim()).map((t) => ({ id: t.id, titulo: t.titulo.trim(), desc: t.desc.trim(), detalle: t.detalle.trim() }))
      };
    } else {
      const digitos = d.wa.replace(/\D/g, '');
      alumno = { redes: { instagram: instagramAURL(d.ig), linkedin: d.linkedin.trim() } };
      // El WhatsApp va al documento privado (no al perfil público)
      usuario = { whatsapp: digitos ? `54${digitos}` : '' };
    }

    // Un perfil nuevo siempre nace oculto
    const snap = p === 0 ? await getDoc(doc(db, 'alumnos', uid)) : null;
    if (snap && !snap.exists()) alumno = { ...alumno, visible: false, fechaCreacion: serverTimestamp() };

    await guardarCampos('alumnos', uid, alumno);
    if (modo === 'alta') usuario = { ...usuario, onboardingPaso: Math.max(currentUser.onboardingPaso || 0, p + 1) };
    if (Object.keys(usuario).length) await guardarCampos('usuarios', uid, usuario);
  };

  // ----- Envío final a verificación -----
  const enviar = async () => {
    if (modo === 'correccion') {
      for (let p = 0; p < TOTAL_PASOS; p++) {
        const mensaje = validarPaso(p);
        if (mensaje) { setEnEncuesta(false); setPaso(p); setError(mensaje); return; }
      }
    }
    if (!datos.comoLlego) { setError('Elegí una opción para contarnos cómo llegaste.'); return; }
    if (datos.comoLlego === 'Otro' && !datos.comoLlegoOtro.trim()) { setError('Contanos cómo llegaste en el cuadro de abajo.'); return; }

    setGuardando(true);
    try {
      const uid = currentUser.uid;
      if (modo === 'correccion') for (let p = 0; p < TOTAL_PASOS; p++) await guardarPaso(p);
      await guardarCampos('verificaciones', uid, {
        tipo: 'alumnx',
        estado: 'pendiente',
        enviadoEn: serverTimestamp(),
        ...(modo === 'correccion' ? { motivoRechazo: '' } : {}),
        datosEnviados: {
          comoLlego: datos.comoLlego === 'Otro' ? `Otro: ${datos.comoLlegoOtro.trim()}` : datos.comoLlego,
          nombreCompleto: `${datos.nombre.trim()} ${datos.apellido.trim()}`,
          universidad: datos.universidad.trim(),
          provincia: datos.provincia
        }
      });
      await guardarCampos('usuarios', uid, {
        onboardingCompleto: true,
        onboardingFecha: new Date().toISOString(),
        onboardingPaso: TOTAL_PASOS,
        comoLlego: datos.comoLlego,
        comoLlegoOtro: datos.comoLlego === 'Otro' ? datos.comoLlegoOtro.trim() : ''
      });
      await refreshUser();
      setEnEncuesta(false);
      setPaso(TOTAL_PASOS);
    } catch (e) {
      console.error('Error al enviar a verificación:', e);
      setError('No pudimos enviar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ----- Botones -----
  const mostrarError = (mensaje) => {
    setError(mensaje);
    requestAnimationFrame(() => document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  // Alta y corrección: guarda y pasa al siguiente (el último abre la pregunta final)
  const siguiente = async () => {
    const mensaje = validarPaso(paso);
    if (mensaje) return mostrarError(mensaje);
    setGuardando(true);
    try {
      await guardarPaso(paso);
      if (paso === TOTAL_PASOS - 1) setEnEncuesta(true);
      else setPaso(paso + 1);
    } catch (e) {
      console.error('Error guardando el paso:', e);
      setError('No pudimos guardar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Edición: guarda la sección y se queda
  const guardarCambios = async () => {
    const mensaje = validarPaso(paso);
    if (mensaje) return mostrarError(mensaje);
    setGuardando(true);
    try {
      await guardarPaso(paso);
      await refreshUser();
      setAviso('Cambios guardados.');
    } catch (e) {
      console.error('Error guardando:', e);
      setError('No pudimos guardar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const irAPaso = (p) => { setEnEncuesta(false); setPaso(p); setError(''); setAviso(''); };
  const hayAlgoSubiendo = subiendoFoto || subiendoCertificado;
  const verificado = estadoVerificacion === 'verificado';

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
          <label className={CLASE_LABEL} htmlFor="al-nombre">Nombre<Obligatorio /></label>
          <input id="al-nombre" value={datos.nombre} maxLength={50} onChange={(e) => cambiar('nombre', capitalizar(e.target.value))} placeholder="Sofía" autoComplete="off" className={CLASE_INPUT} />
          <label className={CLASE_LABEL} htmlFor="al-apellido">Apellido<Obligatorio /></label>
          <input id="al-apellido" value={datos.apellido} maxLength={50} onChange={(e) => cambiar('apellido', capitalizar(e.target.value))} placeholder="Pérez" autoComplete="off" className={CLASE_INPUT} />

          <span className={CLASE_LABEL}>Cómo te identificás</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[['alumna', 'Alumna'], ['alumno', 'Alumno'], ['alumnx', 'Alumnx'], ['', 'No especificar']].map(([valor, texto]) => (
              <button key={valor || 'ninguno'} type="button" onClick={() => cambiar('tituloGenero', valor)} className={`${chip(datos.tituloGenero === valor)} text-center px-2`}>
                {texto}
              </button>
            ))}
          </div>
          <p className={CLASE_AYUDA}>Es la etiqueta de tu perfil. Si no especificás, aparece «Alumno/a».</p>

          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-full bg-[#F4F7F7] text-gray-400 flex items-center justify-center shrink-0 overflow-hidden">
              {datos.foto ? <img src={datos.foto} alt="Tu foto" className="w-full h-full object-cover" /> : <Camera className="w-7 h-7" strokeWidth={1.5} />}
            </div>
            <div>
              <label className={`${CLASE_BTN_SECUNDARIO} inline-flex items-center gap-2 cursor-pointer ${subiendoFoto ? 'opacity-60 pointer-events-none' : ''}`}>
                {subiendoFoto ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</> : (datos.foto ? 'Cambiar foto' : 'Subir foto')}
                <input type="file" accept="image/*" className="hidden" onChange={elegirFoto} disabled={subiendoFoto} />
              </label>
              <p className={CLASE_AYUDA}>Opcional, pero con foto las clínicas confían más.</p>
            </div>
          </div>
        </>
      );
    }

    if (paso === 1) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="al-universidad">Facultad o universidad<Obligatorio /></label>
          <BuscadorFacultad valor={datos.universidad} onCambio={(v) => cambiar('universidad', v)} />
          <p className={CLASE_AYUDA}>Empezá a escribir y elegí de la lista. Si no está, escribila completa.</p>

          <label className={CLASE_LABEL} htmlFor="al-provincia">Provincia donde vivís<Obligatorio /></label>
          <select id="al-provincia" value={datos.provincia} onChange={(e) => cambiar('provincia', e.target.value)} className={CLASE_INPUT}>
            <option value="">Elegí una provincia</option>
            {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <span className={CLASE_LABEL}>Certificado de alumno regular<Obligatorio /></span>
          {verificado ? (
            <div className="flex items-center gap-3 bg-[#F4F7F7] rounded-2xl px-4 py-3.5 text-[15px] font-medium text-[#1A3D3D]">
              <CheckCircle2 className="w-5 h-5 text-[#2D6A6A] shrink-0" /> Certificado verificado
            </div>
          ) : (
            <>
              <label className={`flex items-center gap-3 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-4 transition-all duration-300 ${datos.certificadoPath ? 'border-[#2D6A6A]/40 bg-[#2D6A6A]/5' : 'border-[#2D6A6A]/40 hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A]'} ${subiendoCertificado ? 'opacity-60 pointer-events-none' : ''}`}>
                {subiendoCertificado ? <Loader2 className="w-5 h-5 text-[#2D6A6A] animate-spin shrink-0" />
                  : datos.certificadoPath ? <FileCheck className="w-5 h-5 text-[#2D6A6A] shrink-0" />
                  : <Upload className="w-5 h-5 text-[#2D6A6A] shrink-0" />}
                <span className="text-[15px] font-semibold text-[#2D6A6A] min-w-0 truncate">
                  {subiendoCertificado ? `Subiendo… ${progresoCertificado}%` : datos.certificadoPath ? (datos.certificadoNombre || 'Certificado subido') : 'Subir certificado (foto o PDF)'}
                </span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={subirCertificado} disabled={subiendoCertificado} />
              </label>
              <p className={CLASE_AYUDA}>Lo pedís en tu facultad. Es privado: lo vemos solo nosotros para verificarte.</p>
            </>
          )}
        </>
      );
    }

    if (paso === 2) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="al-presentacion">Presentación<Obligatorio /></label>
          <textarea
            id="al-presentacion"
            rows={4}
            maxLength={400}
            value={datos.presentacion}
            onChange={(e) => cambiar('presentacion', e.target.value)}
            placeholder="Estoy en 4.º año, me interesa la clínica de pequeños animales y busco mis primeras guardias como asistente."
            className={`${CLASE_INPUT} resize-none`}
          />
          <p className="text-right text-sm text-[#666666] mt-2">{datos.presentacion.length} / 400</p>

          <span className={CLASE_LABEL}>Experiencia (opcional)</span>
          <p className={CLASE_AYUDA}>Prácticas, pasantías, ayudantías, voluntariados o cursos.</p>
          {datos.trayectoria.map((item, indice) => (
            <div key={item.id} className="border border-gray-200 rounded-2xl p-4 mt-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1 pt-1">
                  <button type="button" aria-label="Subir" onClick={() => moverExperiencia(indice, -1)} disabled={indice === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" aria-label="Bajar" onClick={() => moverExperiencia(indice, 1)} disabled={indice === datos.trayectoria.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                  <input aria-label="Qué hiciste" value={item.titulo} maxLength={100} onChange={(e) => cambiarExperiencia(item.id, 'titulo', e.target.value)} placeholder="Qué hiciste (ej: Pasantía en guardia)" autoComplete="off" className={CLASE_INPUT} />
                  <input aria-label="Dónde y cuándo" value={item.desc} maxLength={100} onChange={(e) => cambiarExperiencia(item.id, 'desc', e.target.value)} placeholder="Dónde y cuándo (ej: Clínica del Parque, 2025)" autoComplete="off" className={CLASE_INPUT} />
                  <textarea aria-label="Qué hacías" rows={3} value={item.detalle} maxLength={MAX_DETALLE} onChange={(e) => cambiarExperiencia(item.id, 'detalle', e.target.value)} placeholder="Qué hacías o qué aprendiste (opcional). Ej: Asistía en cirugías y en la internación." className={`${CLASE_INPUT} resize-none`} />
                  <p className="text-right text-sm text-[#666666] -mt-1">{item.detalle.length} / {MAX_DETALLE}</p>
                </div>
                <button type="button" aria-label="Quitar" onClick={() => quitarExperiencia(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-[18px] h-[18px]" /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={agregarExperiencia} className={`${CLASE_BTN_SECUNDARIO} mt-4 inline-flex items-center gap-2`}>
            <Plus className="w-4 h-4" /> {datos.trayectoria.length ? 'Agregar otra' : 'Agregar experiencia'}
          </button>
        </>
      );
    }

    // paso === 3: contacto y redes
    return (
      <>
        <label className={CLASE_LABEL} htmlFor="al-wa">WhatsApp</label>
        <div className="flex gap-2">
          <span className="shrink-0 bg-[#F4F7F7] rounded-2xl px-4 py-4 text-[17px] font-bold text-[#1A3D3D]">+54</span>
          <input id="al-wa" type="tel" inputMode="numeric" value={datos.wa} maxLength={15} onChange={(e) => cambiar('wa', e.target.value.replace(/\D/g, ''))} placeholder="1123456789" autoComplete="off" className={CLASE_INPUT} />
        </div>
        <p className={CLASE_AYUDA}>Es privado: no aparece en tu perfil ni lo ven las clínicas. El equipo del Portal lo usa solo para avisarte por WhatsApp cuando tu cuenta esté aprobada.</p>

        <label className={CLASE_LABEL} htmlFor="al-ig">Instagram</label>
        <div className="flex gap-2">
          <span className="shrink-0 bg-[#F4F7F7] rounded-2xl px-4 py-4 text-[17px] font-bold text-[#1A3D3D]">@</span>
          <input id="al-ig" value={datos.ig} maxLength={60} onChange={(e) => cambiar('ig', usuarioDeInstagram(e.target.value))} placeholder="tuusuario" autoComplete="off" className={CLASE_INPUT} />
        </div>

        <label className={CLASE_LABEL} htmlFor="al-linkedin">LinkedIn</label>
        <input id="al-linkedin" value={datos.linkedin} maxLength={200} onChange={(e) => cambiar('linkedin', e.target.value)} placeholder="Link a tu perfil (opcional)" autoComplete="off" className={CLASE_INPUT} />
      </>
    );
  };

  // ==========================================
  // PANTALLA
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] selection:bg-[#2D6A6A] selection:text-white">
      {/* Ventana para encuadrar la foto */}
      {recorte && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de la foto</h3>
                <p className="text-sm text-[#666666] mt-1">Arrastrá para mover la imagen o usá el zoom.</p>
              </div>
              <button type="button" onClick={() => setRecorte(null)} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center">
              <RecortadorImagen imagen={recorte} forma="circulo" tamanoSalida={400} formato="jpeg" onAplicar={subirFoto} onCancelar={() => setRecorte(null)} />
            </div>
          </div>
        </div>
      )}

      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 md:px-10">
        <div className="max-w-[1100px] w-full mx-auto flex items-center justify-between">
          <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-xl tracking-tight">
            Portal Veterinario<span className="text-[#2D6A6A]">.</span>
          </div>
          {modo === 'edicion' && (
            <div className="flex items-center gap-5">
              {slugGuardado.current && (
                <button type="button" onClick={() => navigate(`/alumno/${slugGuardado.current}`)} className="text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] underline underline-offset-4">
                  Ver mi perfil
                </button>
              )}
              <button type="button" onClick={() => navigate('/ecosistema')} className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]">
                <ChevronLeft className="w-4 h-4" /> Volver al inicio
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col lg:flex-row lg:justify-center gap-8 items-start">
        <aside className="hidden lg:block lg:w-[280px] shrink-0 sticky top-8">
          <TarjetaViva datos={datos} verificado={verificado} />
        </aside>

        <main className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10 max-w-[640px] w-full flex-1 min-w-0">
          {modo === 'correccion' && paso < TOTAL_PASOS && (
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

          <BarraPasos paso={enEncuesta ? TOTAL_PASOS : paso} onIrAPaso={modo !== 'alta' && paso < TOTAL_PASOS ? irAPaso : null} />

          {enEncuesta ? (
            <>
              <h1 className="font-['Montserrat'] font-extrabold text-2xl md:text-[28px] leading-tight text-[#1A3D3D] mb-2">¿Cómo llegaste hasta acá?</h1>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666]">Última pregunta antes de enviar. Nos ayuda a saber dónde conocen el Portal.</p>
              <div className="flex flex-wrap gap-2 mt-6">
                {OPCIONES_LLEGADA.map((opcion) => (
                  <button key={opcion} type="button" onClick={() => cambiar('comoLlego', opcion)} className={chip(datos.comoLlego === opcion)}>{opcion}</button>
                ))}
              </div>
              {datos.comoLlego === 'Otro' && (
                <input value={datos.comoLlegoOtro} maxLength={100} onChange={(e) => cambiar('comoLlegoOtro', e.target.value)} placeholder="Contanos cómo" autoComplete="off" className={`${CLASE_INPUT} mt-3`} />
              )}
              <p className="min-h-[20px] text-sm font-medium text-red-500 mt-4" role="alert">{error}</p>
              <div className="flex flex-col gap-3 mt-6">
                <button type="button" onClick={enviar} disabled={guardando} className={`${CLASE_BTN_PRIMARIO} w-full`}>
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar a verificación
                </button>
                <button type="button" onClick={() => { setEnEncuesta(false); setError(''); }} disabled={guardando} className={`${CLASE_BTN_VOLVER} w-full`}>Volver</button>
              </div>
            </>
          ) : paso < TOTAL_PASOS ? (
            <>
              <p className="text-[13px] font-semibold text-[#2D6A6A] mb-1.5">
                {modo === 'edicion' ? 'Editar perfil' : `Paso ${paso + 1} de ${TOTAL_PASOS}`}
              </p>
              <h1 className="font-['Montserrat'] font-extrabold text-2xl md:text-[28px] leading-tight text-[#1A3D3D] mb-2">{TITULOS[paso]}</h1>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666]">{SUBTITULOS[paso]}</p>

              {renderPaso()}

              <p className="min-h-[20px] text-sm font-medium text-red-500 mt-4" role="alert">{error}</p>
              {aviso && <p className="text-sm font-semibold text-[#2D6A6A] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {aviso}</p>}

              <div className={`grid gap-3 mt-6 ${paso > 0 && modo !== 'edicion' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {paso > 0 && modo !== 'edicion' && (
                  <button type="button" onClick={() => irAPaso(paso - 1)} disabled={guardando} className={CLASE_BTN_VOLVER}>Volver</button>
                )}
                <button type="button" onClick={modo === 'edicion' ? guardarCambios : siguiente} disabled={guardando || hayAlgoSubiendo} className={CLASE_BTN_PRIMARIO}>
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modo === 'edicion' ? 'Guardar cambios' : 'Siguiente'}
                </button>
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
                Recibimos tu certificado de alumno regular. Lo revisamos en 24 a 48 horas y te avisamos por mail.
              </p>
              <div className="bg-[#F4F7F7] rounded-2xl px-4 py-3.5 my-6 text-left text-[15px] font-medium text-[#1A3D3D] leading-relaxed">
                Cuando te verifiquemos vas a poder postularte a las búsquedas de asistente de la Bolsa de Trabajo.
              </div>
              <button type="button" onClick={() => navigate('/ecosistema')} className={`${CLASE_BTN_PRIMARIO} w-full`}>Ir al inicio</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
