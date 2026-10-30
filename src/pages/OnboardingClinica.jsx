import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Camera, Check, Loader2, X, Clock, Building2, FileCheck, Upload,
  CheckCircle2, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle,
  Users, Image as ImageIcon
} from 'lucide-react';
import especialidadesData from '../data/especialidades.json';
import equipamientoData from '../data/equipamientoClinicas.json';
import provincias from '../data/provincias.js';
import {
  BuscadorDireccionGoogle, RecortadorImagen, RecortadorPortada, SelectorServicios,
  normalizarServicios, contarServicios, generarSlug, instagramAURL, usuarioDeInstagram,
  leerArchivoComoDataURL, comprimirImagen, normalizarWeb, esEmailValido
} from '../components/editor/EditorComponents';

// ==========================================
// CONSTANTES DEL CUESTIONARIO
// ==========================================
const TOTAL_PASOS = 9;

const TITULOS = [
  'Tu clínica', 'Director/a técnico/a', 'Ubicación y contacto', 'Servicios y equipamiento',
  'Sobre la clínica', 'Staff médico', 'Galería de fotos', 'Casos clínicos', 'Preguntas frecuentes'
];

const SUBTITULOS = [
  'Empecemos por lo básico. Así los van a ver los tutores.',
  'Verificamos la matrícula de quien está a cargo para que los tutores confíen en la clínica.',
  'Los tutores los encuentran por zona. Confirmá la dirección con Google y contanos cuándo atienden.',
  'Contanos qué ofrecen y con qué cuentan. Con esto los encuentran en los filtros de la Cartilla.',
  'Su historia y sus redes. Todo es opcional.',
  'Presentá a los profesionales que trabajan en la clínica. Genera mucha confianza.',
  'Mostrá las instalaciones: quirófano, internación, sala de espera o el equipo trabajando.',
  'Contá casos que hayan resuelto, con fotos si pueden.',
  'Respuestas rápidas a lo que más preguntan los tutores.'
];

// Desde este paso en adelante se puede "Completar después"
const PRIMER_PASO_OPCIONAL = 5;
const LIMITE_GALERIA = 15;
const LIMITE_CASOS = 6;
const LIMITE_FOTOS_CASO = 6;

// Mismos grupos que usa el editor de clínicas (especialidades + equipamiento)
const GRUPOS_CLINICA = [...especialidadesData, ...equipamientoData];

// Cómo se recorta cada tipo de foto (igual que el editor de clínicas)
const CONFIG_RECORTE = {
  logo: { forma: 'cuadrado', tamanoSalida: 512, formato: 'png' },
  staff: { forma: 'cuadrado', tamanoSalida: 400, formato: 'jpeg' },
  caso: { forma: 'cuadrado', tamanoSalida: 800, formato: 'jpeg' }
};

// Pregunta fija y sugeridas (las mismas del editor de clínicas)
const FAQ_INICIAL = [{ id: 1, pregunta: '¿Qué incluye la internación?', respuesta: '', isDefault: true }];
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

// Opciones de la pregunta "¿Cómo llegaron hasta acá?"
const OPCIONES_LLEGADA = [
  'Me escribieron del Portal', 'Instagram', 'Facebook', 'Google',
  'Un colega me lo recomendó', 'Congreso, curso o evento', 'Publicidad', 'Otro'
];

// Estilos reutilizables (los mismos del cuestionario de profesionales)
const CLASE_INPUT = "w-full bg-[#F4F7F7] border border-transparent rounded-2xl px-5 py-4 text-[17px] font-medium text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 placeholder:text-gray-400";
const CLASE_LABEL = "block text-[15px] font-semibold text-[#1A3D3D] mt-5 mb-2";
const CLASE_SELECT_CORTO = "w-24 shrink-0 bg-[#F4F7F7] border border-transparent rounded-2xl px-4 py-4 text-[17px] font-bold text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10";
const CLASE_AYUDA = "text-sm text-[#666666] mt-2 leading-normal";
const Obligatorio = () => <span className="text-red-500" aria-hidden="true"> *</span>;
const CLASE_BTN_PRIMARIO = "bg-[#2D6A6A] text-white rounded-xl px-4 md:px-7 py-4 text-[13px] font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const CLASE_BTN_VOLVER = "bg-white text-[#666666] border border-gray-200 rounded-xl px-4 md:px-5 py-4 text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] hover:text-[#1A3D3D] disabled:opacity-60";
const CLASE_BTN_TEXTO = "text-[#2D6A6A] text-[12px] font-bold uppercase tracking-[0.12em] px-2 py-3 transition-all duration-300 ease-in-out hover:text-[#1A3D3D] disabled:opacity-60";
const CLASE_CHIP = "border rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-300 ease-in-out";
const CLASE_BTN_SECUNDARIO = "bg-white text-[#1A3D3D] border border-gray-200 rounded-xl px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] disabled:opacity-60";

// Estado inicial de todo lo que se carga en el cuestionario
const ESTADO_INICIAL = {
  nombre: '', foto: '', portada: '', desc: '', anios: '',
  directorNombre: '', tipo: 'MP', mat: '', provMat: provincias[0] || 'Buenos Aires',
  tituloPath: '', tituloNombre: '',
  direccion: '', placeId: '', lat: null, lng: null, provincia: '', localidad: '', barrio: '',
  sedes: [],       // otras sedes: [{ id, nombre, direccion, placeId, lat, lng, provincia, localidad, barrio }]
  wa: '',          // solo los dígitos, sin el 54
  telefono: '', email: '', web: '',
  domicilio: false,
  guardia: false, waGuardia: '',   // waGuardia: solo los dígitos, sin el 54
  horarios: { semanaDesde: '', semanaHasta: '', sabadoDesde: '', sabadoHasta: '' },
  sabadoAbre: false,
  servicios: {},
  historia: '', ig: '', fb: '', tiktok: '', linkedin: '',
  staff: [],       // [{ id, nombre, tipoMatricula, matricula, especialidad, bio, foto }]
  galeria: [],     // [{ id, url, epigrafe, storagePath, esSensible }]
  casos: [],       // [{ id, nombre, patologia, desc, fotos, esSensible }]
  faqs: FAQ_INICIAL,
  comoLlego: '', comoLlegoOtro: ''
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

// TikTok: se guarda la URL completa, y en pantalla se muestra solo el usuario
const tiktokAURL = (usuario) => {
  const limpio = String(usuario || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/\/.*$/, '');
  return limpio ? `https://www.tiktok.com/@${limpio}` : '';
};
const tiktokAUsuario = (valor) => String(valor || '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/\/.*$/, '').replace(/^@/, '');

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

// Barra de pasos. En PC los nombres van alternados arriba y abajo para que entren todos.
// Si se pasa "onIrAPaso" (al corregir una solicitud rechazada), cada círculo se puede tocar.
function BarraPasos({ paso, onIrAPaso }) {
  const nombres = ['Clínica', 'Director/a', 'Ubicación', 'Servicios', 'Sobre la clínica', 'Staff', 'Galería', 'Casos', 'Preguntas'];

  return (
    <div className="flex items-start mb-8 md:mb-14 md:pt-7">
      {nombres.map((nombre, i) => {
        const completado = paso >= TOTAL_PASOS || i < paso;
        const activo = i === paso && paso < TOTAL_PASOS;
        return (
          <React.Fragment key={nombre}>
            <div
              className={`relative shrink-0 ${onIrAPaso ? 'cursor-pointer' : ''}`}
              onClick={onIrAPaso ? () => onIrAPaso(i) : undefined}
              role={onIrAPaso ? 'button' : undefined}
              aria-label={onIrAPaso ? `Ir al paso ${i + 1}` : undefined}
            >
              <div
                className={`w-7 h-7 md:w-9 md:h-9 rounded-full border-2 md:border-4 border-white flex items-center justify-center text-[11px] md:text-[13px] font-bold transition-all duration-300 ${
                  activo ? 'bg-[#1A3D3D] text-white scale-110 shadow-lg shadow-[#1A3D3D]/30'
                  : completado ? 'bg-[#2D6A6A] text-white'
                  : 'bg-white text-gray-400 ring-2 ring-inset ring-gray-200'
                }`}
              >
                {completado ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`hidden md:block absolute left-1/2 -translate-x-1/2 w-28 text-center text-[12px] font-bold leading-tight transition-colors duration-300 ${i % 2 === 0 ? 'bottom-full mb-2' : 'top-full mt-2'} ${activo || completado ? 'text-[#1A3D3D]' : 'text-gray-400'}`}>
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

// Tarjeta en vivo: así se va a ver la clínica en la cartilla (versión simple)
function TarjetaViva({ datos, paso }) {
  const pasosCompletos = [
    datos.nombre.trim() && datos.desc.trim().length >= 30,
    datos.directorNombre.trim() && contarDigitos(datos.mat) >= 3 && datos.tituloPath,
    datos.placeId && contarDigitos(datos.wa) >= 8 && (datos.guardia || (datos.horarios.semanaDesde && datos.horarios.semanaHasta)),
    contarServicios(datos.servicios) > 0,
    datos.historia.trim() || datos.ig.trim() || datos.fb.trim(),
    datos.staff.some((m) => m.nombre.trim()),
    datos.galeria.length > 0,
    datos.casos.length > 0,
    datos.faqs.some((f) => f.respuesta.trim())
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

// Interruptor de encendido/apagado con título y explicación
function Interruptor({ titulo, explicacion, encendido, onCambio }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#F4F7F7] rounded-2xl px-5 py-4 mt-5">
      <div>
        <p className="text-[16px] font-semibold text-[#1A3D3D]">{titulo}</p>
        {explicacion && <p className="text-sm text-[#666666] mt-0.5">{explicacion}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={encendido}
        aria-label={titulo}
        onClick={() => onCambio(!encendido)}
        className="relative shrink-0 rounded-full transition-colors duration-300"
        style={{ width: 52, height: 30, backgroundColor: encendido ? '#25D366' : '#D1D5DB' }}
      >
        <span
          className="absolute rounded-full bg-white shadow transition-all duration-300"
          style={{ top: 3, left: encendido ? 25 : 3, width: 24, height: 24 }}
        />
      </button>
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

// Campo de usuario con el @ fijo adelante (Instagram y TikTok)
function CampoUsuario({ id, valor, onCambio, placeholder }) {
  return (
    <div className="flex items-center bg-[#F4F7F7] rounded-2xl overflow-hidden border border-transparent transition-all duration-300 focus-within:bg-white focus-within:border-[#2D6A6A] focus-within:ring-4 focus-within:ring-[#2D6A6A]/10">
      <span className="pl-5 text-[17px] font-bold text-[#1A3D3D] select-none">@</span>
      <input
        id={id}
        value={valor}
        onChange={(e) => onCambio(e.target.value.replace(/@/g, '').trim())}
        placeholder={placeholder}
        autoComplete="off"
        className="flex-1 bg-transparent pl-1 pr-4 py-4 text-[17px] font-medium text-[#1A3D3D] outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

// Pantalla final antes de enviar: "¿Cómo llegaron hasta acá?" (obligatoria, no cuenta como paso)
function PantallaComoLlegaste({ datos, cambiar, error, guardando, onVolver, onEnviar }) {
  return (
    <>
      <h1 className="font-['Montserrat'] font-extrabold text-2xl md:text-[28px] leading-tight text-[#1A3D3D] mb-2">
        ¿Cómo llegaron hasta acá?
      </h1>
      <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666]">Última pregunta antes de enviar. Nos ayuda a saber dónde conocen el Portal.</p>

      <div className="flex flex-wrap gap-2 mt-6">
        {OPCIONES_LLEGADA.map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => cambiar('comoLlego', opcion)}
            className={`${CLASE_CHIP} ${datos.comoLlego === opcion ? 'bg-[#2D6A6A] border-[#2D6A6A] text-white' : 'bg-white border-gray-200 text-[#555555] hover:border-[#2D6A6A]'}`}
          >
            {opcion}
          </button>
        ))}
      </div>

      {datos.comoLlego === 'Otro' && (
        <input
          value={datos.comoLlegoOtro}
          maxLength={100}
          onChange={(e) => cambiar('comoLlegoOtro', e.target.value)}
          placeholder="Contanos cómo"
          autoComplete="off"
          className={`${CLASE_INPUT} mt-3`}
        />
      )}

      <p className="min-h-[20px] text-sm font-medium text-red-500 mt-4" role="alert">{error}</p>

      <div className="flex flex-col gap-3 mt-6">
        <button type="button" onClick={onEnviar} disabled={guardando} className={`${CLASE_BTN_PRIMARIO} w-full`}>
          {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
          Enviar a verificación
        </button>
        <button type="button" onClick={onVolver} disabled={guardando} className={`${CLASE_BTN_VOLVER} w-full`}>Volver</button>
      </div>
    </>
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
  // La admin abre el cuestionario desde el banner de modo prueba solo para mirarlo
  const esVistaPrueba = location.state?.vistaPrueba === true;

  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [portadaParaRecortar, setPortadaParaRecortar] = useState(null);
  const [subiendoTitulo, setSubiendoTitulo] = useState(false);
  const [progresoTitulo, setProgresoTitulo] = useState(0);
  const [subiendoGaleria, setSubiendoGaleria] = useState(false);
  // Foto de staff o de caso que se está subiendo: { tipo, targetId } o null
  const [subiendoFoto, setSubiendoFoto] = useState(null);
  const [recorte, setRecorte] = useState({ abierto: false, imagen: null, tipo: 'logo', targetId: null });
  const [motivoRechazo, setMotivoRechazo] = useState('');
  // Si está en la pantalla de la pregunta "¿Cómo llegaron?" (antes de enviar)
  const [enEncuesta, setEnEncuesta] = useState(false);
  const [textoSede, setTextoSede] = useState('');

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
        if (esCorreccion && !esVistaPrueba && verificacion.estado !== 'rechazado') {
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
          portada: clinica.portada || '',
          desc: clinica.descripcion || '',
          anios: clinica.añosExperiencia === null || clinica.añosExperiencia === undefined ? '' : String(clinica.añosExperiencia),
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
          sedes: Array.isArray(clinica.sedes) ? clinica.sedes : [],
          wa: String(clinica.whatsapp || '').replace(/\D/g, '').replace(/^54/, ''),
          telefono: clinica.telefono || '',
          email: clinica.email || '',
          web: clinica.sitioWeb || '',
          domicilio: clinica.atiendeDomicilio === true,
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
          historia: clinica.historia || '',
          ig: usuarioDeInstagram(clinica.redes?.instagram || ''),
          fb: clinica.redes?.facebook || '',
          tiktok: tiktokAUsuario(clinica.redes?.tiktok || ''),
          linkedin: clinica.redes?.linkedin || '',
          staff: Array.isArray(clinica.staff) ? clinica.staff.map((m) => ({
            id: m.id || Date.now() + Math.random(),
            nombre: m.nombre || '', tipoMatricula: m.tipoMatricula || 'MP', matricula: m.matricula || '',
            especialidad: m.especialidad || '', bio: m.bio || '', foto: m.foto || '', profesionalUid: m.profesionalUid || ''
          })) : [],
          galeria: Array.isArray(clinica.galeria) ? clinica.galeria : [],
          casos: Array.isArray(clinica.casos) ? clinica.casos.map((c) => ({
            id: c.id || Date.now() + Math.random(),
            nombre: c.nombre || '', patologia: c.patologia || '', desc: c.desc || '',
            fotos: Array.isArray(c.fotos) ? c.fotos : [], esSensible: c.esSensible === true
          })) : [],
          faqs: Array.isArray(clinica.faqs) && clinica.faqs.length > 0 ? clinica.faqs : FAQ_INICIAL,
          comoLlego: currentUser.comoLlego || '',
          comoLlegoOtro: currentUser.comoLlegoOtro || ''
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

  // Cada vez que cambia el paso (o aparece la pregunta final), volvemos arriba de todo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paso, enEncuesta]);

  // ----- Fotos con encuadre (logo, staff y casos): primero se elige, después se encuadra y se sube -----
  const elegirFotoParaRecortar = async (evento, tipo, targetId = null) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('Elegí una imagen (JPG o PNG).'); return; }
    if (archivo.size > 15 * 1024 * 1024) { setError('La imagen no puede pesar más de 15 MB.'); return; }
    try {
      const imagen = await leerArchivoComoDataURL(archivo);
      setRecorte({ abierto: true, imagen, tipo, targetId });
    } catch (e) {
      console.error('Error leyendo la imagen:', e);
      setError('No pudimos abrir la imagen. Probá con otra.');
    }
  };

  const cerrarRecorte = () => setRecorte({ abierto: false, imagen: null, tipo: 'logo', targetId: null });

  const subirRecorte = async (imagenRecortada) => {
    const { tipo, targetId } = recorte;
    cerrarRecorte();
    setError('');
    const uid = currentUser.uid;
    const marca = Date.now();

    if (tipo === 'logo') setSubiendoLogo(true);
    else setSubiendoFoto({ tipo, targetId });

    try {
      let ruta;
      if (tipo === 'logo') ruta = `clinicas/${uid}/logo_${marca}.${imagenRecortada.startsWith('data:image/png') ? 'png' : 'jpg'}`;
      else if (tipo === 'staff') ruta = `clinicas/${uid}/staff_${targetId}_${marca}.jpg`;
      else ruta = `clinicas/${uid}/casos/${targetId}_${marca}.jpg`;

      const archivoRef = ref(storage, ruta);
      await uploadString(archivoRef, imagenRecortada, 'data_url');
      const url = await getDownloadURL(archivoRef);

      if (tipo === 'logo') {
        setDatos((previo) => ({ ...previo, foto: url }));
      } else if (tipo === 'staff') {
        setDatos((previo) => ({ ...previo, staff: previo.staff.map((m) => (m.id === targetId ? { ...m, foto: url } : m)) }));
      } else {
        setDatos((previo) => ({ ...previo, casos: previo.casos.map((c) => (c.id === targetId ? { ...c, fotos: [...c.fotos, url] } : c)) }));
      }
    } catch (e) {
      console.error('Error subiendo la imagen:', e);
      setError('No pudimos subir la imagen. Revisá tu conexión y probá de nuevo.');
    } finally {
      if (tipo === 'logo') setSubiendoLogo(false);
      else setSubiendoFoto(null);
    }
  };

  // ----- Portada: se elige la foto, se encuadra y recién ahí se sube -----
  const manejarPortada = async (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('Elegí una imagen (JPG o PNG).'); return; }
    if (archivo.size > 15 * 1024 * 1024) { setError('La imagen no puede pesar más de 15 MB.'); return; }
    try {
      setPortadaParaRecortar(await leerArchivoComoDataURL(archivo));
    } catch (e) {
      console.error('Error leyendo la imagen:', e);
      setError('No pudimos abrir la imagen. Probá con otra.');
    }
  };

  const subirPortadaRecortada = async (imagenRecortada) => {
    setPortadaParaRecortar(null);
    setSubiendoPortada(true);
    setError('');
    try {
      const archivoRef = ref(storage, `clinicas/${currentUser.uid}/portada_${Date.now()}.jpg`);
      await uploadString(archivoRef, imagenRecortada, 'data_url');
      const url = await getDownloadURL(archivoRef);
      setDatos((previo) => ({ ...previo, portada: url }));
    } catch (e) {
      console.error('Error subiendo la portada:', e);
      setError('No pudimos subir la portada. Revisá tu conexión y probá de nuevo.');
    } finally {
      setSubiendoPortada(false);
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

  // ----- Otras sedes: cada una con su dirección confirmada por Google -----
  const agregarSede = (lugar) => {
    setDatos((previo) => {
      // Si esa dirección ya está cargada, no la repetimos
      if (previo.placeId === lugar.placeId || previo.sedes.some((s) => s.placeId === lugar.placeId)) return previo;
      return {
        ...previo,
        sedes: [...previo.sedes, {
          id: Date.now(), nombre: '', direccion: lugar.direccion, placeId: lugar.placeId,
          lat: lugar.lat, lng: lugar.lng, provincia: lugar.provincia, localidad: lugar.localidad, barrio: lugar.barrio
        }]
      };
    });
    setTextoSede('');
    setError('');
  };

  // ----- Listas (staff, casos, preguntas): agregar, cambiar, quitar y mover -----
  const agregarALista = (lista, item) => {
    setDatos((previo) => ({ ...previo, [lista]: [...previo[lista], { id: Date.now(), ...item }] }));
    setError('');
  };

  const actualizarEnLista = (lista, id, campo, valor) => {
    setDatos((previo) => ({ ...previo, [lista]: previo[lista].map((x) => (x.id === id ? { ...x, [campo]: valor } : x)) }));
    setError('');
  };

  const quitarDeLista = (lista, id) => {
    setDatos((previo) => ({ ...previo, [lista]: previo[lista].filter((x) => x.id !== id) }));
  };

  const moverEnLista = (lista, indice, direccion) => {
    setDatos((previo) => {
      const nueva = [...previo[lista]];
      const destino = indice + direccion;
      if (destino < 0 || destino >= nueva.length) return previo;
      [nueva[indice], nueva[destino]] = [nueva[destino], nueva[indice]];
      return { ...previo, [lista]: nueva };
    });
  };

  const quitarFotoCaso = (casoId, indice) => {
    setDatos((previo) => ({
      ...previo,
      casos: previo.casos.map((c) => (c.id === casoId ? { ...c, fotos: c.fotos.filter((_, i) => i !== indice) } : c))
    }));
  };

  // Suma la siguiente pregunta sugerida que todavía no esté cargada
  const agregarPregunta = () => {
    setDatos((previo) => {
      const usadas = previo.faqs.map((f) => f.pregunta.trim());
      const siguiente = PREGUNTAS_SUGERIDAS.find((p) => !usadas.includes(p));
      return { ...previo, faqs: [...previo.faqs, { id: Date.now(), pregunta: siguiente || '', respuesta: '', isDefault: false }] };
    });
  };

  // ----- Galería: las fotos se achican y se suben directo a Storage -----
  const manejarGaleria = async (evento) => {
    const archivos = Array.from(evento.target.files || []).filter((a) => a.type.startsWith('image/'));
    evento.target.value = null;
    if (archivos.length === 0) { setError('Elegí imágenes (JPG o PNG).'); return; }

    const lugar = LIMITE_GALERIA - datos.galeria.length;
    if (lugar <= 0) { setError(`Llegaron al límite de ${LIMITE_GALERIA} fotos.`); return; }
    const aSubir = archivos.slice(0, lugar);

    setSubiendoGaleria(true);
    setError(archivos.length > lugar ? `Solo entran ${LIMITE_GALERIA} fotos: subimos las primeras ${lugar}.` : '');
    try {
      for (let i = 0; i < aSubir.length; i++) {
        const id = Date.now() + i;
        const imagen = await comprimirImagen(await leerArchivoComoDataURL(aSubir[i]), 1400, 0.9);
        const ruta = `clinicas/${currentUser.uid}/galeria/${id}_${Date.now()}.jpg`;
        const archivoRef = ref(storage, ruta);
        await uploadString(archivoRef, imagen, 'data_url');
        const url = await getDownloadURL(archivoRef);
        setDatos((previo) => ({ ...previo, galeria: [...previo.galeria, { id, url, epigrafe: '', storagePath: ruta, esSensible: false }] }));
      }
    } catch (e) {
      console.error('Error subiendo fotos de la galería:', e);
      setError('No pudimos subir alguna foto. Revisá tu conexión y probá de nuevo.');
    } finally {
      setSubiendoGaleria(false);
    }
  };

  // ----- Validaciones de cada paso -----
  const validarPaso = (p) => {
    if (p === 0) {
      if (datos.nombre.trim().length < 3) return 'Escribí el nombre de la clínica para seguir.';
      if (datos.desc.trim().length < 30) return 'Escribí una descripción corta de la clínica (mínimo 30 caracteres).';
    }
    if (p === 1) {
      if (!datos.directorNombre.trim()) return 'Escribí el nombre completo del director o directora técnica.';
      if (contarDigitos(datos.mat) < 3) return 'La matrícula debe tener al menos 3 números.';
      if (!datos.tituloPath) return 'Sumá la foto del título o carnet para poder verificar la clínica (obligatorio).';
    }
    if (p === 2) {
      if (!datos.placeId) return 'Elegí la dirección de la lista de Google para confirmarla.';
      if (textoSede.trim()) return 'Elegí la otra sede de la lista de Google para confirmarla, o borrá lo que escribiste.';
      if (contarDigitos(datos.wa) < 8) return 'Cargá el WhatsApp de la clínica (con código de área, ej: 11 2345 6789).';
      if (datos.email.trim() && !esEmailValido(datos.email)) return 'Revisá el email: parece que falta algo.';
      if (!datos.guardia) {
        const { semanaDesde, semanaHasta, sabadoDesde, sabadoHasta } = datos.horarios;
        if (!semanaDesde || !semanaHasta) return 'Elegí el horario de lunes a viernes.';
        if (Number(semanaDesde) >= Number(semanaHasta)) return 'En lunes a viernes, la hora de apertura tiene que ser menor que la de cierre.';
        if (datos.sabadoAbre) {
          if (!sabadoDesde || !sabadoHasta) return 'Elegí el horario de los sábados o marcá "Cerrado".';
          if (Number(sabadoDesde) >= Number(sabadoHasta)) return 'En sábados, la hora de apertura tiene que ser menor que la de cierre.';
        }
      }
    }
    if (p === 3 && contarServicios(datos.servicios) === 0) return 'Elegí al menos un servicio: con eso los encuentran los tutores en la Cartilla.';
    if (p === 5) {
      if (subiendoFoto) return 'Esperá a que termine de subir la foto.';
      if (datos.staff.some((m) => !m.nombre.trim() && (m.especialidad.trim() || m.matricula.trim() || m.bio.trim() || m.foto))) return 'Hay un profesional cargado sin nombre. Completalo o quitalo.';
    }
    if (p === 6 && subiendoGaleria) return 'Esperá a que terminen de subir las fotos.';
    if (p === 7) {
      if (subiendoFoto) return 'Esperá a que termine de subir la foto.';
      if (datos.casos.some((c) => !c.patologia.trim() && (c.nombre.trim() || c.desc.trim() || c.fotos.length))) return 'Completá "Patología o motivo" en cada caso, o quitá el que no uses.';
    }
    return '';
  };

  // ----- Qué se guarda en cada paso (mismos campos que usa el editor de clínicas) -----
  const camposDelPaso = (p, d, slug) => {
    if (p === 0) {
      return {
        clinica: {
          uid: currentUser.uid, slug, nombre: d.nombre.trim(), foto: d.foto, portada: d.portada || '',
          descripcion: d.desc.trim(),
          añosExperiencia: d.anios === '' ? null : Number(d.anios),
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
          email: d.email.trim(), sitioWeb: normalizarWeb(d.web),
          atiendeDomicilio: d.domicilio,
          sedes: d.sedes.map((s) => ({
            id: s.id, nombre: (s.nombre || '').trim(), direccion: s.direccion, placeId: s.placeId,
            lat: s.lat, lng: s.lng, provincia: s.provincia, localidad: s.localidad, barrio: s.barrio
          })),
          guardia24hs: d.guardia,
          telefonoGuardia: d.guardia && d.wa ? `54${d.wa}` : '',
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
    if (p === 4) {
      return {
        clinica: {
          historia: d.historia.trim(),
          redes: {
            instagram: instagramAURL(d.ig),
            facebook: normalizarWeb(d.fb),
            tiktok: tiktokAURL(d.tiktok),
            linkedin: normalizarWeb(d.linkedin)
          }
        },
        usuario: {}
      };
    }
    if (p === 5) {
      return {
        clinica: {
          staff: d.staff.filter((m) => m.nombre.trim()).map((m) => ({
            id: m.id, nombre: m.nombre.trim(), tipoMatricula: m.tipoMatricula || 'MP', matricula: m.matricula,
            especialidad: m.especialidad.trim(), bio: m.bio.trim(), foto: m.foto || '', profesionalUid: m.profesionalUid || ''
          }))
        },
        usuario: {}
      };
    }
    if (p === 6) {
      return { clinica: { galeria: d.galeria.map((g) => ({ ...g, epigrafe: (g.epigrafe || '').trim() })) }, usuario: {} };
    }
    if (p === 7) {
      return {
        clinica: {
          casos: d.casos
            .filter((c) => c.patologia.trim() || c.nombre.trim() || c.desc.trim() || c.fotos.length)
            .map((c) => ({ id: c.id, nombre: c.nombre.trim(), patologia: c.patologia.trim(), desc: c.desc.trim(), fotos: c.fotos, esSensible: c.esSensible === true }))
        },
        usuario: {}
      };
    }
    // p === 8: preguntas frecuentes (las que no tienen pregunta se descartan)
    return {
      clinica: {
        faqs: d.faqs.filter((f) => f.pregunta.trim()).map((f) => ({ ...f, pregunta: f.pregunta.trim(), respuesta: f.respuesta.trim() }))
      },
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

  // Envío final: manda todo a verificación y marca el cuestionario como completo
  const finalizar = async (d) => {
    const uid = currentUser.uid;
    await guardarCampos('clinicas', uid, { visible: false });

    // El estado de verificación vive en su propia colección, lejos de lo que edita la persona.
    // Guardamos una "foto" de los datos enviados para que quien verifica vea exactamente lo que se mandó.
    await guardarCampos('verificaciones', uid, {
      tipo: 'clinica',
      estado: 'pendiente',
      enviadoEn: serverTimestamp(),
      // Si es un reenvío tras un rechazo, borramos el motivo anterior
      ...(esCorreccion ? { motivoRechazo: '' } : {}),
      datosEnviados: {
        comoLlego: d.comoLlego === 'Otro' ? `Otro: ${d.comoLlegoOtro.trim()}` : d.comoLlego,
        nombreCompleto: d.nombre.trim(),
        directorNombre: d.directorNombre.trim(),
        matricula: d.mat, tipoMatricula: d.tipo,
        provincia: d.provMat,
        direccion: d.direccion
      }
    });

    await guardarCampos('usuarios', uid, {
      onboardingCompleto: true,
      onboardingPaso: TOTAL_PASOS,
      comoLlego: d.comoLlego,
      comoLlegoOtro: d.comoLlego === 'Otro' ? d.comoLlegoOtro.trim() : ''
    });
    await refreshUser();
    setPaso(TOTAL_PASOS);
  };

  // ----- Botones de navegación -----
  // Guarda el paso actual y pasa al siguiente (o a la pregunta final si era el último)
  const avanzar = async () => {
    setGuardando(true);
    try {
      await guardarPaso(paso, datos);
      if (paso === TOTAL_PASOS - 1) setEnEncuesta(true);
      else setPaso(paso + 1);
      setError('');
    } catch (e) {
      console.error('Error guardando el paso:', e);
      setError('No pudimos guardar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const irAlSiguiente = () => {
    const mensaje = validarPaso(paso);
    if (mensaje) {
      setError(mensaje);
      // Llevamos la pantalla hasta el aviso para que no pase desapercibido
      requestAnimationFrame(() => {
        document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    avanzar();
  };

  // Solo los pasos opcionales (staff, galería, casos y preguntas) se pueden dejar para después
  const completarDespues = () => avanzar();

  const volver = () => { setPaso(paso - 1); setError(''); };

  // Al corregir una solicitud rechazada, se puede saltar directo a cualquier paso
  const irAPaso = (p) => { setEnEncuesta(false); setPaso(p); setError(''); };

  // Envío desde la pregunta final: valida la respuesta y, si es una corrección, revisa y guarda todos los pasos
  const enviarDesdeEncuesta = async () => {
    if (esCorreccion) {
      for (let p = 0; p < TOTAL_PASOS; p++) {
        const mensaje = validarPaso(p);
        if (mensaje) { setEnEncuesta(false); setPaso(p); setError(mensaje); return; }
      }
    }
    if (!datos.comoLlego) { setError('Elegí una opción para contarnos cómo llegaron.'); return; }
    if (datos.comoLlego === 'Otro' && !datos.comoLlegoOtro.trim()) { setError('Contanos cómo llegaron en el cuadro de abajo.'); return; }

    setGuardando(true);
    try {
      if (esCorreccion) {
        for (let p = 0; p < TOTAL_PASOS; p++) await guardarPaso(p, datos);
      }
      await finalizar(datos);
      setError('');
    } catch (e) {
      console.error('Error al enviar a verificación:', e);
      setError('No pudimos enviar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Nombre: mayúscula automática sin saltar el cursor
  const cambiarNombreCapitalizado = (campo) => (evento) => {
    const input = evento.target;
    const posicion = input.selectionStart;
    cambiar(campo, capitalizarNombre(input.value));
    requestAnimationFrame(() => { try { input.setSelectionRange(posicion, posicion); } catch (e) { /* no pasa nada */ } });
  };

  // Algo se está subiendo: bloqueamos los botones para no perder fotos
  const hayAlgoSubiendo = subiendoPortada || subiendoLogo || subiendoTitulo || subiendoGaleria || subiendoFoto !== null;
  const configRecorte = CONFIG_RECORTE[recorte.tipo] || CONFIG_RECORTE.logo;

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
          <label className={CLASE_LABEL} htmlFor="ob-nombre">Nombre de la clínica<Obligatorio /></label>
          <input id="ob-nombre" value={datos.nombre} maxLength={80} onChange={cambiarNombreCapitalizado('nombre')} placeholder="Clínica Veterinaria del Parque" autoComplete="off" className={CLASE_INPUT} />

          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F7F7] text-gray-400 flex items-center justify-center shrink-0 overflow-hidden">
              {datos.foto ? <img src={datos.foto} alt="Logo" className="w-full h-full object-contain" /> : <Camera className="w-7 h-7" strokeWidth={1.5} />}
            </div>
            <div>
              <label className={`${CLASE_BTN_SECUNDARIO} inline-flex items-center gap-2 cursor-pointer ${subiendoLogo ? 'opacity-60 pointer-events-none' : ''}`}>
                {subiendoLogo ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</> : (datos.foto ? 'Cambiar logo' : 'Subir logo')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => elegirFotoParaRecortar(e, 'logo')} disabled={subiendoLogo} />
              </label>
              <p className={CLASE_AYUDA}>El logo o una foto de la fachada. Lo pueden sumar después.</p>
            </div>
          </div>

          <span className={CLASE_LABEL}>Foto de portada (opcional)</span>
          <label className={`block cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300 ${datos.portada ? 'border-transparent' : 'border-[#2D6A6A]/40 hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A]'} ${subiendoPortada ? 'opacity-60 pointer-events-none' : ''}`}>
            {datos.portada ? (
              <img src={datos.portada} alt="Portada" className="w-full h-[140px] object-cover" />
            ) : (
              <span className="flex items-center justify-center gap-2.5 px-4 py-6 text-[#2D6A6A] text-[15px] font-semibold">
                {subiendoPortada ? <><Loader2 className="w-5 h-5 animate-spin" /> Subiendo…</> : <><ImageIcon className="w-5 h-5" /> Subir foto de portada</>}
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={manejarPortada} disabled={subiendoPortada} />
          </label>
          {datos.portada && (
            <button type="button" onClick={() => cambiar('portada', '')} className={`${CLASE_BTN_TEXTO} mt-1`}>Quitar portada</button>
          )}
          <p className={CLASE_AYUDA}>Ideal: una foto horizontal (apaisada) de la veterinaria. Si la dejan vacía no pasa nada: el perfil se ve igual, con la portada más chica.</p>

          <label className={CLASE_LABEL} htmlFor="ob-desc">Descripción corta<Obligatorio /></label>
          <textarea
            id="ob-desc"
            rows={3}
            maxLength={200}
            value={datos.desc}
            onChange={(e) => cambiar('desc', e.target.value)}
            placeholder="Somos una clínica veterinaria con guardia las 24 hs, internación y cirugía."
            className={`${CLASE_INPUT} resize-none`}
          />
          <p className="text-right text-sm text-[#666666] mt-2">{datos.desc.length} / 200</p>

          <label className={CLASE_LABEL} htmlFor="ob-anios">Años de experiencia </label>
          <input
            id="ob-anios"
            type="number"
            inputMode="numeric"
            min="0"
            value={datos.anios}
            onChange={(e) => { if (e.target.value === '' || Number(e.target.value) >= 0) cambiar('anios', e.target.value); }}
            placeholder="15"
            className={CLASE_INPUT}
          />
          <p className={CLASE_AYUDA}>Se muestra destacado en el perfil.</p>
        </>
      );
    }

    if (paso === 1) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-director">Nombre completo del director/a técnico/a<Obligatorio /></label>
          <input id="ob-director" value={datos.directorNombre} onChange={cambiarNombreCapitalizado('directorNombre')} placeholder="María González" autoComplete="off" className={CLASE_INPUT} />

          <label className={CLASE_LABEL} htmlFor="ob-mat">Número de matrícula<Obligatorio /></label>
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
          <label className={CLASE_LABEL} htmlFor="ob-direccion">Dirección de la clínica<Obligatorio /></label>
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

          {datos.sedes.map((sede) => (
            <div key={sede.id} className="border border-gray-200 rounded-2xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-[22px] h-[22px] text-[#2D6A6A] mt-3 shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                  <input aria-label="Nombre de la sede" value={sede.nombre} maxLength={50} onChange={(e) => actualizarEnLista('sedes', sede.id, 'nombre', e.target.value)} placeholder="Nombre de la sede (ej: Sede Palermo)" autoComplete="off" className={CLASE_INPUT} />
                  <p className="text-sm text-[#666666] leading-snug">{sede.direccion}</p>
                  <p className="text-[12px] font-semibold text-[#2D6A6A] flex items-center gap-1">
                    <CheckCircle2 className="w-[15px] h-[15px]" /> Confirmado con Google{sede.barrio ? ` · Barrio: ${sede.barrio}` : ''}
                  </p>
                </div>
                <button type="button" aria-label="Quitar sede" onClick={() => quitarDeLista('sedes', sede.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          ))}

          <span className={CLASE_LABEL}>¿Tienen otra sede? (opcional)</span>
          <BuscadorDireccionGoogle
            id="ob-sede"
            valor={textoSede}
            onEscribir={setTextoSede}
            onElegir={agregarSede}
            placeholder="Buscá la dirección de otra sede"
            listaProvincias={provincias}
          />
          <p className={CLASE_AYUDA}>Podés sumar todas las que quieras. Aparecen juntas en el mismo perfil.</p>

          <label className={CLASE_LABEL} htmlFor="ob-wa">WhatsApp de la clínica<Obligatorio /></label>
          <CampoWhatsapp id="ob-wa" valor={datos.wa} onCambio={(v) => cambiar('wa', v)} />
          <p className={CLASE_AYUDA}>{datos.guardia ? 'Es el botón de contacto y también el número al que escriben los tutores en una urgencia.' : 'Es el botón que usan los tutores para escribirles.'}</p>

          <label className={CLASE_LABEL} htmlFor="ob-tel">Teléfono fijo (opcional)</label>
          <input id="ob-tel" type="tel" inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value.replace(/[^0-9+()\-\s]/g, ''))} placeholder="011 4567 8900" autoComplete="off" className={CLASE_INPUT} />

          <label className={CLASE_LABEL} htmlFor="ob-email">Email (opcional)</label>
          <input id="ob-email" type="email" value={datos.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="contacto@tuclinica.com" autoComplete="off" className={CLASE_INPUT} />

          <label className={CLASE_LABEL} htmlFor="ob-web">Sitio web (opcional)</label>
          <input id="ob-web" value={datos.web} onChange={(e) => cambiar('web', e.target.value)} placeholder="www.tuclinica.com" autoComplete="off" className={CLASE_INPUT} />

          <Interruptor
            titulo="Atienden a domicilio"
            explicacion="Suma una insignia a su perfil."
            encendido={datos.domicilio}
            onCambio={(v) => cambiar('domicilio', v)}
          />

          <Interruptor
            titulo="Guardia 24 hs"
            explicacion="Suma una insignia y un botón de urgencias a su perfil."
            encendido={datos.guardia}
            onCambio={(v) => cambiar('guardia', v)}
          />

          {datos.guardia ? (
            <>
              <p className={CLASE_AYUDA}>Con guardia 24 hs, el WhatsApp de la clínica también es el de las urgencias.</p>
              <div className="mt-5 bg-[#F4F7F7] rounded-2xl px-4 py-3.5 flex gap-2.5">
                <Clock className="w-5 h-5 text-[#2D6A6A] shrink-0" strokeWidth={1.5} />
                <p className="text-[14px] font-medium text-[#1A3D3D] leading-relaxed">Atienden las 24 horas, todos los días. No hace falta cargar horarios.</p>
              </div>
            </>
          ) : (
            <>
              <span className={CLASE_LABEL}>Horario de lunes a viernes<Obligatorio /></span>
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
          <span className={CLASE_LABEL}>Servicios y equipamiento<Obligatorio /></span>
          <p className={CLASE_AYUDA}>Elegí al menos uno. Los tutores filtran por estos servicios en la Cartilla: si no cargan ninguno, no aparecen en sus búsquedas.</p>
          <SelectorServicios servicios={datos.servicios} setFormData={setDatos} grupos={GRUPOS_CLINICA} />
        </>
      );
    }

    if (paso === 4) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-historia">Nuestra historia (opcional)</label>
          <textarea
            id="ob-historia"
            rows={5}
            maxLength={800}
            value={datos.historia}
            onChange={(e) => cambiar('historia', e.target.value)}
            placeholder="Cómo nació la clínica, qué los mueve, cómo trabajan…"
            className={`${CLASE_INPUT} resize-none`}
          />
          <p className="text-right text-sm text-[#666666] mt-2">{datos.historia.length} / 800</p>

          <label className={CLASE_LABEL} htmlFor="ob-ig">Instagram (opcional)</label>
          <CampoUsuario id="ob-ig" valor={datos.ig} onCambio={(v) => cambiar('ig', v)} placeholder="tu_clinica" />

          <label className={CLASE_LABEL} htmlFor="ob-tiktok">TikTok (opcional)</label>
          <CampoUsuario id="ob-tiktok" valor={datos.tiktok} onCambio={(v) => cambiar('tiktok', v)} placeholder="tu_clinica" />

          <label className={CLASE_LABEL} htmlFor="ob-fb">Facebook (opcional)</label>
          <input id="ob-fb" value={datos.fb} onChange={(e) => cambiar('fb', e.target.value)} placeholder="Link de su página" autoComplete="off" className={CLASE_INPUT} />

          <label className={CLASE_LABEL} htmlFor="ob-linkedin">LinkedIn (opcional)</label>
          <input id="ob-linkedin" value={datos.linkedin} onChange={(e) => cambiar('linkedin', e.target.value)} placeholder="Link de su página" autoComplete="off" className={CLASE_INPUT} />
        </>
      );
    }

    if (paso === 5) {
      return (
        <>
          {datos.staff.length === 0 && (
            <div className="bg-[#F4F7F7] rounded-2xl p-6 text-center mt-5">
              <Users className="w-8 h-8 text-gray-400 opacity-60 mx-auto mb-2" />
              <p className="text-[15px] font-semibold text-[#1A3D3D]">Todavía no cargaron a su equipo</p>
              <p className="text-sm text-[#666666] mt-1">Con al menos un profesional aparece la sección "Equipo médico" en el perfil.</p>
            </div>
          )}

          {datos.staff.map((m, indice) => {
            const subiendoEste = subiendoFoto?.tipo === 'staff' && subiendoFoto?.targetId === m.id;
            return (
              <div key={m.id} className="border border-gray-200 rounded-2xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <label className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed shrink-0 flex flex-col items-center justify-center transition-colors ${m.foto ? 'border-transparent' : 'border-[#2D6A6A]/40 bg-[#2D6A6A]/5'} ${subiendoFoto ? 'cursor-not-allowed' : 'cursor-pointer hover:border-[#2D6A6A]'}`}>
                    {subiendoEste ? (
                      <Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" />
                    ) : m.foto ? (
                      <img src={m.foto} alt={m.nombre || 'Foto del profesional'} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-[#2D6A6A]" />
                        <span className="text-[10px] font-black uppercase text-[#2D6A6A] mt-0.5">Foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => elegirFotoParaRecortar(e, 'staff', m.id)} disabled={!!subiendoFoto} />
                  </label>

                  <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                    <input aria-label="Nombre completo" value={m.nombre} maxLength={80} onChange={(e) => actualizarEnLista('staff', m.id, 'nombre', e.target.value)} placeholder="Nombre completo (ej: Dra. Valeria Rojas)" autoComplete="off" className={CLASE_INPUT} />
                    <div className="flex gap-2.5">
                      <select aria-label="Tipo de matrícula" value={m.tipoMatricula || 'MP'} onChange={(e) => actualizarEnLista('staff', m.id, 'tipoMatricula', e.target.value)} className={CLASE_SELECT_CORTO}>
                        <option value="MP">MP</option>
                        <option value="MN">MN</option>
                      </select>
                      <input aria-label="Matrícula" inputMode="numeric" value={m.matricula} onChange={(e) => actualizarEnLista('staff', m.id, 'matricula', e.target.value.replace(/[^0-9-]/g, ''))} placeholder="Matrícula (opcional)" autoComplete="off" className={CLASE_INPUT} />
                    </div>
                    <input aria-label="Especialidad o cargo" value={m.especialidad} maxLength={80} onChange={(e) => actualizarEnLista('staff', m.id, 'especialidad', e.target.value)} placeholder="Especialidad o cargo (ej: Cirujano)" autoComplete="off" className={CLASE_INPUT} />
                    <textarea aria-label="Breve descripción" rows={2} maxLength={150} value={m.bio} onChange={(e) => actualizarEnLista('staff', m.id, 'bio', e.target.value)} placeholder="Breve descripción (opcional)" className={`${CLASE_INPUT} resize-none`} />
                    <p className="text-right text-sm text-[#666666] -mt-1">{m.bio.length} / 150</p>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button type="button" aria-label="Quitar profesional" onClick={() => quitarDeLista('staff', m.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-[18px] h-[18px]" /></button>
                    <button type="button" aria-label="Subir" onClick={() => moverEnLista('staff', indice, -1)} disabled={indice === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" aria-label="Bajar" onClick={() => moverEnLista('staff', indice, 1)} disabled={indice === datos.staff.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}

          <button type="button" onClick={() => agregarALista('staff', { nombre: '', tipoMatricula: 'MP', matricula: '', especialidad: '', bio: '', foto: '', profesionalUid: '' })} className={`${CLASE_BTN_SECUNDARIO} mt-4 inline-flex items-center gap-2`}>
            <Plus className="w-4 h-4" /> {datos.staff.length > 0 ? 'Agregar otro profesional' : 'Agregar un profesional'}
          </button>
        </>
      );
    }

    if (paso === 6) {
      return (
        <>
          <p className={`${CLASE_AYUDA} mt-5`}>Hasta {LIMITE_GALERIA} fotos. Después pueden sumar más desde el editor.</p>

          {datos.galeria.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {datos.galeria.map((item) => (
                <div key={item.id} className="relative bg-[#F4F7F7] rounded-2xl overflow-hidden border border-gray-100">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={item.url} alt={item.epigrafe || 'Foto de la galería'} className="w-full h-full object-cover" />
                    {item.esSensible && (
                      <div className="absolute inset-0 bg-[#1A3D3D]/70 flex items-center justify-center pointer-events-none">
                        <span className="flex items-center gap-1.5 bg-white/90 text-[#1A3D3D] text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Sensible
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => actualizarEnLista('galeria', item.id, 'esSensible', !item.esSensible)}
                    title={item.esSensible ? 'Quitar aviso de contenido sensible' : 'Marcar como contenido sensible'}
                    aria-label="Marcar como contenido sensible"
                    className={`absolute top-2 left-2 p-1.5 rounded-full shadow-md ${item.esSensible ? 'bg-[#FF9800] text-white' : 'bg-white/90 text-gray-500 hover:bg-yellow-50'}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => quitarDeLista('galeria', item.id)}
                    aria-label="Quitar foto"
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                  <div className="p-2.5">
                    <input
                      type="text"
                      placeholder="Descripción opcional..."
                      value={item.epigrafe || ''}
                      maxLength={80}
                      onChange={(e) => actualizarEnLista('galeria', item.id, 'epigrafe', e.target.value)}
                      className="w-full text-[13px] font-medium text-gray-500 bg-transparent outline-none placeholder:text-gray-300 border-b border-gray-200 pb-1 focus:border-[#2D6A6A] transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {datos.galeria.length < LIMITE_GALERIA ? (
            <label className={`mt-4 w-full border-2 border-dashed border-[#2D6A6A]/40 rounded-2xl px-4 py-6 text-[#2D6A6A] text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${subiendoGaleria ? 'bg-[#2D6A6A]/5 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A]'}`}>
              {subiendoGaleria
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Subiendo fotos…</>
                : <><ImageIcon className="w-5 h-5" /> Agregar fotos ({datos.galeria.length}/{LIMITE_GALERIA})</>}
              <input type="file" accept="image/*" multiple className="hidden" onChange={manejarGaleria} disabled={subiendoGaleria} />
            </label>
          ) : (
            <p className="mt-4 text-sm font-semibold text-gray-400 text-center">Llegaron al límite de {LIMITE_GALERIA} fotos.</p>
          )}
          <p className={CLASE_AYUDA}>Marcá con el triángulo las imágenes que muestren contenido sensible.</p>
        </>
      );
    }

    if (paso === 7) {
      return (
        <>
          <p className={`${CLASE_AYUDA} mt-5`}>Hasta {LIMITE_CASOS} casos por ahora; después suman más desde el editor.</p>

          {datos.casos.map((caso, indice) => {
            const subiendoEste = subiendoFoto?.tipo === 'caso' && subiendoFoto?.targetId === caso.id;
            return (
              <div key={caso.id} className="border border-gray-200 rounded-2xl p-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-bold text-[#2D6A6A] uppercase tracking-widest">Caso {indice + 1}</p>
                  <button type="button" aria-label="Quitar caso" onClick={() => quitarDeLista('casos', caso.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-[18px] h-[18px]" /></button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {caso.fotos.map((foto, i) => (
                    <div key={foto} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200">
                      <img src={foto} alt={`Foto ${i + 1} del caso`} className="w-full h-full object-cover" />
                      <button type="button" aria-label="Quitar foto" onClick={() => quitarFotoCaso(caso.id, i)} className="absolute top-0.5 right-0.5 p-0.5 bg-white/90 text-red-500 rounded-full">
                        <X className="w-3 h-3" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {caso.fotos.length < LIMITE_FOTOS_CASO && (
                    <label className={`w-16 h-16 rounded-xl border-2 border-dashed border-[#2D6A6A]/40 flex flex-col items-center justify-center text-[#2D6A6A] bg-white transition-colors ${subiendoFoto ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A]'}`}>
                      {subiendoEste ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5 mb-0.5" />}
                      {!subiendoEste && <span className="text-[10px] font-black uppercase">Foto</span>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => elegirFotoParaRecortar(e, 'caso', caso.id)} disabled={!!subiendoFoto} />
                    </label>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-2.5">
                  <input aria-label="Paciente" value={caso.nombre} maxLength={40} onChange={(e) => actualizarEnLista('casos', caso.id, 'nombre', e.target.value)} placeholder="Paciente (ej: Firulais)" autoComplete="off" className={`${CLASE_INPUT} md:w-1/3`} />
                  <input aria-label="Patología o motivo" value={caso.patologia} maxLength={100} onChange={(e) => actualizarEnLista('casos', caso.id, 'patologia', e.target.value)} placeholder="Patología o motivo *" autoComplete="off" className={CLASE_INPUT} />
                </div>
                <textarea
                  aria-label="Relato del caso"
                  rows={4}
                  maxLength={600}
                  value={caso.desc}
                  onChange={(e) => actualizarEnLista('casos', caso.id, 'desc', e.target.value)}
                  placeholder="Contá la historia clínica, el tratamiento y la evolución…"
                  className={`${CLASE_INPUT} resize-none mt-2.5`}
                />
                <p className="text-right text-sm text-[#666666] mt-1.5">{caso.desc.length} / 600</p>

                <Interruptor
                  titulo="Las fotos muestran contenido sensible"
                  explicacion="En el perfil se ven difuminadas y el tutor elige si verlas."
                  encendido={caso.esSensible}
                  onCambio={(v) => actualizarEnLista('casos', caso.id, 'esSensible', v)}
                />
              </div>
            );
          })}

          {datos.casos.length < LIMITE_CASOS && (
            <button type="button" onClick={() => agregarALista('casos', { nombre: '', patologia: '', desc: '', fotos: [], esSensible: false })} className={`${CLASE_BTN_SECUNDARIO} mt-4 inline-flex items-center gap-2`}>
              <Plus className="w-4 h-4" /> {datos.casos.length > 0 ? 'Agregar otro caso' : 'Agregar un caso'}
            </button>
          )}
        </>
      );
    }

    // paso === 8: preguntas frecuentes
    return (
      <>
        <p className={`${CLASE_AYUDA} mt-5`}>Las preguntas sin respuesta no se muestran en el perfil, también podes editarlas para agregar tus propias preguntas.</p>

        {datos.faqs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 rounded-2xl p-4 mt-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {faq.isDefault ? (
                  <p className="text-[15px] font-semibold text-[#1A3D3D]">{faq.pregunta}</p>
                ) : (
                  <input aria-label="Pregunta" value={faq.pregunta} maxLength={150} onChange={(e) => actualizarEnLista('faqs', faq.id, 'pregunta', e.target.value)} placeholder="Escribí la pregunta" autoComplete="off" className={CLASE_INPUT} />
                )}
              </div>
              {!faq.isDefault && (
                <button type="button" aria-label="Quitar pregunta" onClick={() => quitarDeLista('faqs', faq.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-[18px] h-[18px]" /></button>
              )}
            </div>
            <textarea
              aria-label="Respuesta"
              rows={2}
              maxLength={400}
              value={faq.respuesta}
              onChange={(e) => actualizarEnLista('faqs', faq.id, 'respuesta', e.target.value)}
              placeholder="Escribí la respuesta…"
              className={`${CLASE_INPUT} resize-none mt-2.5`}
            />
            <p className="text-right text-sm text-[#666666] mt-1.5">{faq.respuesta.length} / 400</p>
          </div>
        ))}

        <button type="button" onClick={agregarPregunta} className={`${CLASE_BTN_SECUNDARIO} mt-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> Agregar otra pregunta
        </button>
      </>
    );
  };

  // ==========================================
  // PANTALLA
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] selection:bg-[#2D6A6A] selection:text-white">
      {/* Ventana para encuadrar la portada */}
      {portadaParaRecortar && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de la portada</h3>
                <p className="text-sm text-gray-500 mt-1">El recuadro es lo que se ve en tu perfil.</p>
              </div>
              <button onClick={() => setPortadaParaRecortar(null)} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-[#F4F7F7] p-6 flex justify-center items-center">
              <RecortadorPortada imagen={portadaParaRecortar} onAplicar={subirPortadaRecortada} onCancelar={() => setPortadaParaRecortar(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Ventana para encuadrar logo, fotos del staff o de los casos */}
      {recorte.abierto && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de imagen</h3>
                <p className="text-sm text-gray-500 mt-1">Arrastrá para mover la imagen o usá el zoom.</p>
              </div>
              <button onClick={cerrarRecorte} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center">
              <RecortadorImagen
                imagen={recorte.imagen}
                forma={configRecorte.forma}
                tamanoSalida={configRecorte.tamanoSalida}
                formato={configRecorte.formato}
                onAplicar={subirRecorte}
                onCancelar={cerrarRecorte}
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
          <BarraPasos paso={enEncuesta ? TOTAL_PASOS : paso} onIrAPaso={esCorreccion && paso < TOTAL_PASOS ? irAPaso : null} />

          {paso < TOTAL_PASOS && enEncuesta ? (
            <PantallaComoLlegaste
              datos={datos}
              cambiar={cambiar}
              error={error}
              guardando={guardando}
              onVolver={() => { setEnEncuesta(false); setError(''); }}
              onEnviar={enviarDesdeEncuesta}
            />
          ) : paso < TOTAL_PASOS ? (
            <>
              <p className="text-[13px] font-semibold text-[#2D6A6A] mb-1.5">Paso {paso + 1} de {TOTAL_PASOS}</p>
              <h1 className="font-['Montserrat'] font-extrabold text-2xl md:text-[28px] leading-tight text-[#1A3D3D] mb-2">{TITULOS[paso]}</h1>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666]">{SUBTITULOS[paso]}</p>

              {renderPaso()}

              <p className="min-h-[20px] text-sm font-medium text-red-500 mt-4" role="alert">{error}</p>

              <div className="flex flex-col gap-3 mt-6">
                {paso >= PRIMER_PASO_OPCIONAL && (
                  <button type="button" onClick={completarDespues} disabled={guardando || hayAlgoSubiendo} className={`${CLASE_BTN_VOLVER} w-full`}>Completar después</button>
                )}
                <div className={`grid gap-3 ${paso > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {paso > 0 && (
                    <button type="button" onClick={volver} disabled={guardando} className={CLASE_BTN_VOLVER}>Volver</button>
                  )}
                  <button type="button" onClick={irAlSiguiente} disabled={guardando || hayAlgoSubiendo} className={CLASE_BTN_PRIMARIO}>
                    {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                    Siguiente
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
                Mientras esperan, pueden seguir completando el perfil desde el editor. Apenas verifiquemos, sale publicado.
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