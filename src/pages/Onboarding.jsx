import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Camera, Check, Loader2, Search, MapPin, Trash2, X, Plus, Clock,
  Stethoscope, Home, Crop, ChevronRight, FileCheck, Upload, CheckCircle2,
  Building2, MessageCircle, LogOut, AlertCircle
} from 'lucide-react';
import especialidadesData from '../data/especialidades.json';
import provincias from '../data/provincias.js';

// ==========================================
// CONSTANTES DEL CUESTIONARIO
// ==========================================
const TOTAL_PASOS = 6;

const TITULOS = ['Tus datos', 'Tu matrícula', 'Tu especialidad', 'Dónde atendés', 'Cómo te contactan', 'Sobre vos'];

const SUBTITULOS = [
  'Empecemos por lo básico. Así te van a ver los tutores.',
  'Verificamos tu matrícula para que los tutores confíen en tu perfil.',
  'Contanos a qué te dedicás. Lo podés cambiar cuando quieras.',
  'Sumá los lugares donde atendés. Los tutores te encuentran por zona.',
  'Elegí cómo y quién puede contactarte.',
  'Una presentación corta, con tus palabras.'
];

// Estilos reutilizables (mismos que el manual de marca: inputs Ceniza, rounded-2xl, ring esmeralda)
const CLASE_INPUT = "w-full bg-[#F4F7F7] border border-transparent rounded-2xl px-5 py-4 text-[17px] font-medium text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 placeholder:text-gray-400";
const CLASE_LABEL = "block text-[15px] font-semibold text-[#1A3D3D] mt-5 mb-2";
// Igual que el input pero SIN ancho completo: para el selector corto de MP / MN
const CLASE_SELECT_CORTO = "w-24 shrink-0 bg-[#F4F7F7] border border-transparent rounded-2xl px-4 py-4 text-[17px] font-bold text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10";
const CLASE_AYUDA = "text-sm text-[#666666] mt-2 leading-normal";
const CLASE_BTN_PRIMARIO = "bg-[#2D6A6A] text-white rounded-xl px-7 py-4 text-[13px] font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const CLASE_BTN_VOLVER = "bg-white text-[#666666] border border-gray-200 rounded-xl px-5 py-4 text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] hover:text-[#1A3D3D] disabled:opacity-60";
const CLASE_BTN_TEXTO = "text-[#2D6A6A] text-[12px] font-bold uppercase tracking-[0.12em] px-2 py-3 transition-all duration-300 ease-in-out hover:text-[#1A3D3D] disabled:opacity-60";
const CLASE_BTN_SECUNDARIO = "bg-white text-[#1A3D3D] border border-gray-200 rounded-xl px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ease-in-out hover:border-[#2D6A6A] disabled:opacity-60";
const CLASE_CHIP = "border rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-300 ease-in-out";

// Estado inicial de todo lo que se carga en el cuestionario
const ESTADO_INICIAL = {
  nombre: '', apellido: '', foto: '', fotosPerfil: [],
  tipo: 'MP', mat: '', m2: false, mat2: '',
  prov: provincias[0] || 'Buenos Aires',
  tituloPath: '', tituloNombre: '',
  esp: '', svc: [],          // svc: [{ nombre, grupoId, propio }]
  dom: false, wa: '',        // wa: solo los dígitos, sin el 54
  zonas: [],                 // mismo formato que el editor: [{ id, nombre, clinicas: [...] }]
  email: '', emailV: 'todos', waV: 'todos',
  ig: '', bio: ''
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

// Saca acentos y pasa a minúsculas (para buscar sin que importen las tildes)
const normalizar = (texto) => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Cuenta solo los números de un texto
const contarDigitos = (texto) => String(texto || '').replace(/\D/g, '').length;

// Pone mayúscula inicial en cada palabra, dejando "de", "del", "la" en minúscula
const capitalizarNombre = (texto) => texto.replace(/\S+/g, (palabra, indice) => {
  const minuscula = palabra.toLowerCase();
  if (indice > 0 && ['de', 'del', 'la', 'las', 'los', 'y', 'da', 'di', 'van', 'von'].includes(minuscula)) return minuscula;
  return palabra.charAt(0).toUpperCase() + palabra.slice(1);
});

// Arma la dirección amigable del perfil a partir del nombre (igual que el editor)
const generarSlug = (texto) => texto
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

// El mockup usa "Solo colegas"; en la base de datos el editor guarda "registrados"
const visibilidadADB = (valor) => (valor === 'colegas' ? 'registrados' : valor);
const visibilidadAPantalla = (valor) => (valor === 'registrados' ? 'colegas' : 'todos');

// Instagram: el editor guarda la URL completa
const instagramAURL = (usuario) => {
  const limpio = (usuario || '').trim().replace(/^@/, '');
  return limpio ? `https://instagram.com/${limpio}` : '';
};
const instagramAUsuario = (valor) => {
  if (!valor) return '';
  if (valor.startsWith('http')) return valor.replace(/\/+$/, '').split('/').pop().replace(/^@/, '');
  return valor.replace(/^@/, '');
};

// Recorta la foto al centro, en cuadrado, y la achica para que pese poco
const prepararFotoCuadrada = (archivo, lado = 400) => new Promise((resolve, reject) => {
  const lector = new FileReader();
  lector.onerror = reject;
  lector.onload = (evento) => {
    const imagen = new Image();
    imagen.onerror = reject;
    imagen.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = lado;
      canvas.height = lado;
      const ctx = canvas.getContext('2d');
      const ladoOrigen = Math.min(imagen.width, imagen.height);
      const sx = (imagen.width - ladoOrigen) / 2;
      const sy = (imagen.height - ladoOrigen) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, lado, lado);
      ctx.drawImage(imagen, sx, sy, ladoOrigen, ladoOrigen, 0, 0, lado, lado);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    imagen.src = evento.target.result;
  };
  lector.readAsDataURL(archivo);
});

// Carga Google Maps (Places) una sola vez. Si ya está cargado en la página, lo reutiliza.
const cargarGoogleMaps = () => new Promise((resolve, reject) => {
  if (window.google?.maps?.places) { resolve(); return; }

  const scriptExistente = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (!scriptExistente) {
    const clave = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!clave) { reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${clave}&libraries=places&language=es`;
    script.async = true;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  }

  // Esperamos hasta 15 segundos a que Google termine de cargar
  let intentos = 0;
  const reloj = setInterval(() => {
    intentos += 1;
    if (window.google?.maps?.places) { clearInterval(reloj); resolve(); }
    else if (intentos > 75) { clearInterval(reloj); reject(new Error('Google Maps tardó demasiado')); }
  }, 200);
});

// De los datos que devuelve Google, saca la localidad para armar la zona automática
const zonaDesdeComponentes = (componentes = []) => {
  const buscar = (tipo) => componentes.find((c) => c.types.includes(tipo))?.long_name;
  return buscar('locality') || buscar('administrative_area_level_2') || buscar('administrative_area_level_1') || '';
};

// Del mismo dato de Google saca el barrio: si Google lo tiene (ej: Palermo) usa ese,
// y si no, usa la localidad (ej: Castelar). Es lo que va en el campo "barrio" del editor.
const barrioDesdeComponentes = (componentes = []) => {
  const buscar = (tipo) => componentes.find((c) => c.types.includes(tipo))?.long_name;
  return buscar('neighborhood') || buscar('sublocality_level_1') || buscar('sublocality') || buscar('locality') || '';
};

// Convierte la lista de servicios elegidos al formato que guarda el editor
const construirServicios = (servicios, descripcionesPrevias) => {
  const resultado = {};
  servicios.forEach(({ nombre, grupoId, propio }) => {
    if (!resultado[grupoId]) {
      resultado[grupoId] = { activo: true, subOpcionesSeleccionadas: [], desc: descripcionesPrevias[grupoId] || '', serviciosPersonalizados: [] };
    }
    if (propio) resultado[grupoId].serviciosPersonalizados.push(nombre);
    else resultado[grupoId].subOpcionesSeleccionadas.push(nombre);
  });
  return resultado;
};

// Guarda solo los campos indicados y reemplaza su contenido completo (así no quedan restos viejos)
const guardarCampos = (coleccion, uid, datos) =>
  setDoc(doc(db, coleccion, uid), datos, { mergeFields: Object.keys(datos) });

// ==========================================
// COMPONENTES CHICOS
// ==========================================

// Barra de pasos: círculos unidos por una línea con flechita, y el nombre de cada paso abajo
// (igual que el stepper de Capacitaciones). En celular se ocultan los nombres para que entre todo.
function BarraPasos({ paso }) {
  const nombres = ['Datos', 'Matrícula', 'Especialidad', 'Dónde atendés', 'Contacto', 'Sobre vos'];

  return (
    <div className="flex items-start mb-8 md:mb-14">
      {nombres.map((nombre, i) => {
        const completado = paso >= TOTAL_PASOS || i < paso;
        const activo = i === paso && paso < TOTAL_PASOS;
        return (
          <React.Fragment key={nombre}>
            {/* Círculo del paso. El nombre flota debajo y no le saca lugar a la línea */}
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

            {/* Línea que une un paso con el siguiente (se pinta de esmeralda al avanzar) */}
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

// Tarjeta en vivo (versión provisoria, parecida a la de la cartilla; en la etapa 3 se cambia por la real)
function TarjetaViva({ datos, paso }) {
  const nombreCompleto = `${datos.nombre.trim()} ${datos.apellido.trim()}`.trim();

  const pasosCompletos = [
    datos.nombre.trim() && datos.apellido.trim(),
    contarDigitos(datos.mat) >= 3 && datos.tituloPath,
    datos.esp.trim(),
    datos.dom || datos.zonas.length > 0,
    datos.email.trim() || datos.wa.trim() || datos.ig.trim(),
    datos.bio.trim().length >= 30
  ].filter(Boolean).length;
  const porcentaje = Math.round((pasosCompletos / TOTAL_PASOS) * 100);

  return (
    <div>
      <p className="text-[18px] font-bold text-[#1A3D3D] mb-5">Así te van a ver los tutores</p>
      <article className="relative bg-white border border-gray-100 rounded-[24px] px-4 pt-5 pb-4 text-center shadow-sm">
        {datos.dom && (
          <div className="absolute -top-3.5 right-3.5 w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Home className="w-5 h-5" strokeWidth={1.5} />
          </div>
        )}
        {datos.foto ? (
          <img src={datos.foto} alt="Tu foto" className="w-14 h-14 rounded-full object-cover mx-auto" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center mx-auto">
            <Stethoscope className="w-6 h-6" strokeWidth={1.5} />
          </div>
        )}
        <p className={`font-['Montserrat'] font-extrabold text-[15px] leading-tight mt-2.5 mb-2 break-words ${nombreCompleto ? 'text-[#1A3D3D]' : 'text-[#B4BCBC]'}`}>
          {nombreCompleto || 'Tu nombre'}
        </p>
        <div className="bg-[#F4F7F7] rounded-xl px-2.5 py-2">
          <span className={`text-[13px] font-semibold leading-snug ${datos.esp.trim() ? 'text-[#2D6A6A]' : 'text-[#B4BCBC]'}`}>
            {datos.esp.trim() || 'Tu especialidad'}
          </span>
        </div>
        <div className="flex justify-center items-center border-t border-gray-50 mt-2.5 pt-2.5">
          <span className="flex items-center gap-1 text-[12px] font-bold text-[#1A3D3D]">
            <MapPin className="w-3.5 h-3.5 text-[#666666]" strokeWidth={1.5} /> {datos.prov}
          </span>
        </div>

        {/* La barra de progreso va adentro de la tarjeta */}
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
        <span>{paso >= TOTAL_PASOS ? 'Estamos verificando tu matrícula (24 a 48 hs)' : 'Vas a ver tu perfil público cuando verifiquemos tu matrícula'}</span>
      </div>
    </div>
  );
}

// Campo de WhatsApp con el +54 fijo
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

// Selector "¿Quién lo puede ver?" (Todos / Solo colegas / Nadie)
function SelectorVisibilidad({ valor, onCambio }) {
  const opciones = [['todos', 'Todos'], ['colegas', 'Solo colegas'], ['nadie', 'Nadie']];
  const explicacion = {
    todos: 'Cualquier visitante lo puede ver.',
    colegas: 'Solo lo ven profesionales y proveedores con cuenta.',
    nadie: 'No se muestra en tu perfil.'
  };
  return (
    <div>
      <p className="text-[13px] font-semibold text-[#666666] mt-3 mb-2">¿Quién lo puede ver?</p>
      <div className="flex gap-2 flex-wrap">
        {opciones.map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            onClick={() => onCambio(clave)}
            className={`${CLASE_CHIP} ${valor === clave ? 'bg-[#2D6A6A] border-[#2D6A6A] text-white' : 'bg-white border-gray-200 text-[#555555] hover:border-[#2D6A6A]'}`}
          >
            {texto}
          </button>
        ))}
      </div>
      <p className={CLASE_AYUDA}>{explicacion[valor]}</p>
    </div>
  );
}

// Qué significa cada opción de visibilidad (se muestra debajo del campo)
const EXPLICACION_VISIBILIDAD = {
  todos: 'Cualquier visitante lo puede ver.',
  colegas: 'Solo lo ven profesionales y proveedores con cuenta.'
};

// Nombre del campo con los cartelitos "Todo público / Colegas / Nadie".
// En PC van a la derecha del nombre, en la misma línea. En celular van debajo del nombre.
function EtiquetaConVisibilidad({ id, texto, valor, onCambio }) {
  const opciones = [['todos', 'Todo público'], ['colegas', 'Colegas']];
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-5 mb-2">
      <label htmlFor={id} className="text-[15px] font-semibold text-[#1A3D3D]">{texto}</label>
      <div className="flex gap-1.5 flex-wrap">
        {opciones.map(([clave, nombre]) => (
          <button
            key={clave}
            type="button"
            onClick={() => onCambio(clave)}
            className={`border rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all duration-300 ease-in-out ${valor === clave ? 'bg-[#2D6A6A] border-[#2D6A6A] text-white' : 'bg-white border-gray-200 text-[#555555] hover:border-[#2D6A6A]'}`}
          >
            {nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

// Buscador de servicios (usa las opciones reales de especialidades.json)
function BuscadorServicios({ seleccion, onAlternar, onAgregarPropio }) {
  const [busqueda, setBusqueda] = useState('');
  const [textoPropio, setTextoPropio] = useState('');

  const todasLasOpciones = especialidadesData.flatMap((grupo) =>
    grupo.opciones.map((opcion) => ({ nombre: opcion, grupoId: grupo.id, grupoNombre: grupo.grupo }))
  );

  const textoBuscado = normalizar(busqueda.trim());
  const resultados = textoBuscado.length >= 2
    ? todasLasOpciones.filter((o) => normalizar(o.nombre).includes(textoBuscado) || normalizar(o.grupoNombre).includes(textoBuscado)).slice(0, 6)
    : [];

  const estaElegido = (nombre) => seleccion.some((s) => s.nombre === nombre);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setTextoPropio(''); }}
          placeholder="Buscá: oncología, ecografía…"
          autoComplete="off"
          className={`${CLASE_INPUT} pl-11`}
        />
      </div>

      {/* Paso extra: si agrega un servicio propio, elige a qué grupo pertenece */}
      {textoPropio ? (
        <div className="border border-gray-200 rounded-2xl p-4 mt-3">
          <p className="text-[15px] font-semibold text-[#1A3D3D] mb-1">¿En qué grupo va "{textoPropio}"?</p>
          <p className="text-sm text-[#666666] mb-3">Así los tutores lo encuentran cuando filtran.</p>
          <div className="flex flex-wrap gap-2">
            {especialidadesData.map((grupo) => (
              <button
                key={grupo.id}
                type="button"
                onClick={() => { onAgregarPropio(textoPropio, grupo.id); setTextoPropio(''); setBusqueda(''); }}
                className={`${CLASE_CHIP} bg-white border-gray-200 text-[#555555] hover:border-[#2D6A6A]`}
              >
                {grupo.grupo}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setTextoPropio('')} className={`${CLASE_BTN_TEXTO} mt-2`}>Cancelar</button>
        </div>
      ) : textoBuscado.length >= 2 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden mt-3">
          {resultados.length === 0 && (
            <p className="text-sm text-[#666666] px-4 py-3">No encontramos ese servicio entre los predefinidos.</p>
          )}
          {resultados.map((o) => {
            const elegido = estaElegido(o.nombre);
            return (
              <button
                key={`${o.grupoId}-${o.nombre}`}
                type="button"
                onClick={() => onAlternar(o)}
                className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 border-b border-gray-100 transition-colors ${elegido ? 'bg-[#2D6A6A]/5' : 'bg-white hover:bg-[#F4F7F7]'}`}
              >
                <span>
                  <span className="block text-[15px] font-semibold text-[#1A3D3D]">{o.nombre}</span>
                  <span className="block text-[13px] text-gray-400 mt-0.5">{o.grupoNombre}</span>
                </span>
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${elegido ? 'bg-[#1A3D3D] border-[#1A3D3D] text-white' : 'border-gray-300 bg-white'}`}>
                  {elegido && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setTextoPropio(busqueda.trim().charAt(0).toUpperCase() + busqueda.trim().slice(1))}
            className="w-full text-left px-4 py-3 text-[14px] font-semibold text-[#2D6A6A] bg-white hover:bg-[#F4F7F7] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar "{busqueda.trim()}" como servicio propio
          </button>
        </div>
      )}

      {seleccion.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {seleccion.map((s) => (
            <button
              key={`${s.grupoId}-${s.nombre}`}
              type="button"
              onClick={() => onAlternar(s)}
              className={`${CLASE_CHIP} bg-[#2D6A6A] border-[#2D6A6A] text-white flex items-center gap-1.5`}
            >
              {s.nombre} <X className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Buscador de lugares con Google Maps (guarda el placeId, igual que el editor)
function BuscadorLugares({ onElegir, texto, setTexto }) {
  const inputRef = useRef(null);
  const onElegirRef = useRef(onElegir);
  onElegirRef.current = onElegir; // siempre apunta a la versión más nueva de la función
  const [estadoMapa, setEstadoMapa] = useState('cargando'); // 'cargando' | 'listo' | 'error'

  useEffect(() => {
    let cancelado = false;
    let autocomplete = null;

    cargarGoogleMaps()
      .then(() => {
        if (cancelado || !inputRef.current) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'ar' },
          fields: ['name', 'formatted_address', 'place_id', 'address_components']
        });
        autocomplete.addListener('place_changed', () => {
          const lugar = autocomplete.getPlace();
          if (!lugar || !lugar.place_id) return;
          onElegirRef.current({
            nombre: lugar.name || '',
            direccion: lugar.formatted_address || '',
            placeId: lugar.place_id,
            zona: zonaDesdeComponentes(lugar.address_components),
            barrio: barrioDesdeComponentes(lugar.address_components)
          });
          setTexto('');
          if (inputRef.current) inputRef.current.value = '';
        });
        setEstadoMapa('listo');
      })
      .catch((error) => {
        console.error('Error cargando Google Maps:', error);
        if (!cancelado) setEstadoMapa('error');
      });

    return () => {
      cancelado = true;
      if (autocomplete && window.google?.maps?.event) window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, []);

  return (
    <div>
      <style>{`.pac-container { border-radius: 16px; margin-top: 6px; font-family: Inter, sans-serif; z-index: 10000; }`}</style>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          placeholder="Buscá por nombre o dirección"
          autoComplete="off"
          className={`${CLASE_INPUT} pl-11`}
        />
      </div>
      {estadoMapa === 'error' ? (
        <p className="text-sm text-red-500 font-medium mt-2">No pudimos cargar Google Maps. Podés tocar "Completar después" y sumar tus lugares desde tu perfil.</p>
      ) : (
        <p className={CLASE_AYUDA}>Elegí una opción de la lista para confirmar la dirección con Google.</p>
      )}
    </div>
  );
}

// Recortador de foto (el mismo del editor profesional): se arrastra para mover y hay zoom
function RecortadorFoto({ imagen, onAplicar, onCancelar }) {
  const [zoom, setZoom] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const [inicioArrastre, setInicioArrastre] = useState({ x: 0, y: 0 });
  const [escalaBase, setEscalaBase] = useState(1);
  const imgRef = useRef(null);

  const TAMANO = 256;

  // Cuando la imagen carga, calculamos la escala para que cubra todo el círculo
  const alCargarImagen = (e) => {
    const img = e.target;
    setEscalaBase(Math.max(TAMANO / img.naturalWidth, TAMANO / img.naturalHeight));
    setZoom(1);
    setPosicion({ x: 0, y: 0 });
  };

  const alApretar = (e) => {
    if (e.cancelable !== false) e.preventDefault();
    setArrastrando(true);
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setInicioArrastre({ x: x - posicion.x, y: y - posicion.y });
  };

  const alMover = (e) => {
    if (!arrastrando) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setPosicion({ x: x - inicioArrastre.x, y: y - inicioArrastre.y });
  };

  const alSoltar = () => setArrastrando(false);

  // Dibuja lo que se ve dentro del círculo en un canvas y lo devuelve como imagen
  const aplicarRecorte = () => {
    const canvas = document.createElement('canvas');
    canvas.width = TAMANO;
    canvas.height = TAMANO;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    const escalaFinal = escalaBase * zoom;
    const ancho = img.naturalWidth * escalaFinal;
    const alto = img.naturalHeight * escalaFinal;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TAMANO, TAMANO);
    ctx.drawImage(img, (TAMANO - ancho) / 2 + posicion.x, (TAMANO - alto) / 2 + posicion.y, ancho, alto);
    onAplicar(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div
        className="relative bg-gray-100 overflow-hidden cursor-move touch-none shadow-inner max-w-full rounded-full"
        style={{ width: TAMANO, height: TAMANO }}
        onMouseDown={alApretar} onMouseMove={alMover} onMouseUp={alSoltar} onMouseLeave={alSoltar}
        onTouchStart={alApretar} onTouchMove={alMover} onTouchEnd={alSoltar}
      >
        <img
          ref={imgRef}
          src={imagen}
          alt="Foto original"
          draggable={false}
          onLoad={alCargarImagen}
          className="absolute pointer-events-none select-none max-w-none"
          style={{
            transform: `translate3d(calc(-50% + ${posicion.x}px), calc(-50% + ${posicion.y}px), 0) scale(${escalaBase * zoom})`,
            left: '50%', top: '50%', width: 'auto', height: 'auto', transformOrigin: 'center center'
          }}
        />
        <div className="absolute inset-0 pointer-events-none border-4 border-[#2D6A6A]/40 rounded-full" />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <Crop className="w-10 h-10 text-white opacity-40 drop-shadow-md" />
        </div>
      </div>

      <div className="mt-8 w-full max-w-[256px]">
        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
          <span>Alejar</span><span>Acercar</span>
        </label>
        <input
          type="range" min="1" max="3" step="0.05" value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-[#2D6A6A] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex justify-end gap-3 w-full mt-8 border-t border-gray-100 pt-6">
        <button type="button" onClick={onCancelar} className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors text-base">Cancelar</button>
        <button type="button" onClick={aplicarRecorte} className="px-8 py-3 rounded-xl bg-[#1A3D3D] text-white font-bold hover:bg-[#2D6A6A] transition-colors shadow-lg flex items-center gap-2 text-base">
          <Check className="w-5 h-5" /> Aplicar
        </button>
      </div>
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL: ONBOARDING
// ==========================================
export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshUser, logout } = useAuth();

  // Si viene desde la pantalla de rechazo, es un reenvío para corregir datos
  const esCorreccion = location.state?.correccion === true;

  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [textoLugar, setTextoLugar] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoTitulo, setSubiendoTitulo] = useState(false);
  const [progresoTitulo, setProgresoTitulo] = useState(0);
  const [recorte, setRecorte] = useState({ abierto: false, imagen: null });
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Guarda las descripciones de grupos de servicios que ya tenía la persona (para no perderlas)
  const descripcionesServicios = useRef({});

  const cambiar = (campo, valor) => {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setError('');
  };

  // ----- Carga inicial: decide si corresponde el cuestionario y recupera lo que ya se guardó -----
  useEffect(() => {
    if (!currentUser?.uid) return;

    // TEMPORAL: para ver qué está leyendo la app (borrar cuando funcione)
    console.log('Onboarding lee:', {
      rol: currentUser.rol,
      onboardingCompleto: currentUser.onboardingCompleto,
      tipo: typeof currentUser.onboardingCompleto
    });

    // Solo entra al cuestionario un profesional con onboardingCompleto en false.
    // Los usuarios que ya existían (sin ese campo) pasan directo al ecosistema.
    // (En modo corrección también se puede entrar aunque ya lo haya completado antes)
    if (currentUser.rol !== 'profesional' || (currentUser.onboardingCompleto !== false && !esCorreccion)) {
      navigate('/ecosistema', { replace: true });
      return;
    }

    let cancelado = false;
    const cargarDatos = async () => {
      try {
        const uid = currentUser.uid;
        const [snapPerfil, snapVerificacion] = await Promise.all([
          getDoc(doc(db, 'profesionales', uid)),
          getDoc(doc(db, 'verificaciones', uid)).catch(() => null)
        ]);
        if (cancelado) return;

        const perfil = snapPerfil.exists() ? snapPerfil.data() : {};
        const verificacion = snapVerificacion && snapVerificacion.exists() ? snapVerificacion.data() : {};

        // Modo corrección: solo se puede entrar si la solicitud fue rechazada
        if (esCorreccion && verificacion.estado !== 'rechazado') {
          navigate('/ecosistema', { replace: true });
          return;
        }
        if (esCorreccion) setMotivoRechazo(verificacion.motivoRechazo || '');

        // Servicios: del objeto del editor a la lista simple del cuestionario
        const servicios = [];
        if (perfil.servicios && !Array.isArray(perfil.servicios)) {
          Object.entries(perfil.servicios).forEach(([grupoId, grupo]) => {
            (grupo.subOpcionesSeleccionadas || []).forEach((nombre) => servicios.push({ nombre, grupoId, propio: false }));
            (grupo.serviciosPersonalizados || []).forEach((nombre) => servicios.push({ nombre, grupoId, propio: true }));
            descripcionesServicios.current[grupoId] = grupo.desc || '';
          });
        }

        setDatos({
          ...ESTADO_INICIAL,
          nombre: perfil.nombre || currentUser.nombre || '',
          apellido: perfil.apellido || currentUser.apellido || '',
          foto: perfil.foto || '',
          fotosPerfil: perfil.fotosPerfil || [],
          tipo: perfil.tipoMatricula || 'MP',
          mat: perfil.matricula || '',
          m2: !!perfil.matricula2,
          mat2: perfil.matricula2 || '',
          prov: perfil.provincia || ESTADO_INICIAL.prov,
          tituloPath: verificacion.tituloPath || '',
          tituloNombre: verificacion.tituloNombre || '',
          esp: perfil.especialidad || '',
          svc: servicios,
          dom: !!perfil.atiendeDomicilio,
          wa: (perfil.whatsappNum || '').replace(/^\+?54/, ''),
          zonas: Array.isArray(perfil.zonas) ? perfil.zonas : [],
          email: perfil.emailContacto || '',
          emailV: visibilidadAPantalla(perfil.emailVisibilidad),
          waV: visibilidadAPantalla(perfil.whatsappVisibilidad),
          ig: instagramAUsuario(perfil.instagram),
          bio: perfil.bio || ''
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

  // ----- Foto de perfil: primero se elige, después se encuadra y recién ahí se sube -----
  const manejarFoto = (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('Elegí una imagen (JPG o PNG).'); return; }

    const lector = new FileReader();
    lector.onload = (e) => setRecorte({ abierto: true, imagen: e.target.result });
    lector.readAsDataURL(archivo);
  };

  const subirFotoRecortada = async (imagenRecortada) => {
    setRecorte({ abierto: false, imagen: null });
    setSubiendoFoto(true);
    setError('');
    try {
      const archivoRef = ref(storage, `profesionales/${currentUser.uid}/foto_${Date.now()}.jpg`);
      await uploadString(archivoRef, imagenRecortada, 'data_url');
      const url = await getDownloadURL(archivoRef);
      setDatos((previo) => ({ ...previo, foto: url, fotosPerfil: [...previo.fotosPerfil, url] }));
    } catch (e) {
      console.error('Error subiendo la foto:', e);
      setError('No pudimos subir la foto. Revisá tu conexión y probá de nuevo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  // ----- Foto del título (va a una carpeta privada de Storage) -----
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

  // ----- Servicios y lugares -----
  const alternarServicio = (opcion) => {
    setDatos((previo) => {
      const yaEsta = previo.svc.some((s) => s.nombre === opcion.nombre);
      const nuevaLista = yaEsta
        ? previo.svc.filter((s) => s.nombre !== opcion.nombre)
        : [...previo.svc, { nombre: opcion.nombre, grupoId: opcion.grupoId, propio: !!opcion.propio }];
      return { ...previo, svc: nuevaLista };
    });
    setError('');
  };

  const agregarServicioPropio = (nombre, grupoId) => {
    setDatos((previo) => (previo.svc.some((s) => s.nombre === nombre)
      ? previo
      : { ...previo, svc: [...previo.svc, { nombre, grupoId, propio: true }] }));
  };

  const agregarLugar = (lugar) => {
    setDatos((previo) => {
      // Si ese lugar ya está cargado, no lo repetimos
      if (previo.zonas.some((z) => z.clinicas.some((c) => c.placeId === lugar.placeId))) return previo;

      const nombreZona = lugar.zona || previo.prov;
      const clinica = {
        id: Date.now(), nombrePropio: lugar.nombre, barrio: lugar.barrio || '', direccion: lugar.direccion,
        placeId: lugar.placeId, telefono: ''
      };
      const indiceZona = previo.zonas.findIndex((z) => normalizar(z.nombre) === normalizar(nombreZona));

      // Si ya existe una zona con ese nombre, sumamos la clínica ahí; si no, creamos la zona
      const nuevasZonas = indiceZona >= 0
        ? previo.zonas.map((z, i) => (i === indiceZona ? { ...z, clinicas: [...z.clinicas, clinica] } : z))
        : [...previo.zonas, { id: Date.now() + 1, nombre: nombreZona, clinicas: [clinica] }];
      return { ...previo, zonas: nuevasZonas };
    });
    setError('');
  };

  const quitarLugar = (zonaId, clinicaId) => {
    setDatos((previo) => ({
      ...previo,
      zonas: previo.zonas
        .map((z) => (z.id === zonaId ? { ...z, clinicas: z.clinicas.filter((c) => c.id !== clinicaId) } : z))
        .filter((z) => z.clinicas.length > 0) // si la zona queda vacía, se borra
    }));
  };

  // ----- Validaciones de cada paso (los mismos avisos del mockup) -----
  const validarPaso = (p) => {
    if (p === 0 && !(datos.nombre.trim() && datos.apellido.trim())) return 'Escribí tu nombre y apellido para seguir.';
    if (p === 1) {
      if (contarDigitos(datos.mat) < 3) return 'La matrícula debe tener al menos 3 números.';
      if (datos.m2 && contarDigitos(datos.mat2) < 3) return 'Completá tu segunda matrícula (mínimo 3 números) o quitala.';
      if (!datos.tituloPath) return 'Sumá la foto de tu título o carnet para poder verificarte (obligatorio).';
    }
    if (p === 2 && !datos.esp.trim()) return 'Escribí tu especialidad principal.';
    if (p === 3) {
      if (datos.dom && !datos.wa.trim()) return 'Si atendés a domicilio, tu WhatsApp es obligatorio.';
      if (textoLugar.trim()) return 'Elegí una opción de la lista de Google para confirmar la dirección.';
    }
    if (p === 4 && datos.email.trim() && !/^\S+@\S+\.\S+$/.test(datos.email.trim())) return 'Revisá el email: parece que falta algo.';
    return '';
  };

  // ----- Qué se guarda en cada paso (mismos campos que usa el editor profesional) -----
  const camposDelPaso = (p, d) => {
    const nombreCompleto = `${d.nombre.trim()} ${d.apellido.trim()}`.trim();

    if (p === 0) {
      return {
        perfil: { nombre: d.nombre.trim(), apellido: d.apellido.trim(), nombreCompleto, slug: generarSlug(nombreCompleto), foto: d.foto, fotosPerfil: d.fotosPerfil, visible: false },
        usuario: { nombre: d.nombre.trim(), apellido: d.apellido.trim(), nombreCompleto, slug: generarSlug(nombreCompleto) }
      };
    }
    if (p === 1) {
      return {
        perfil: {
          matricula: d.mat, tipoMatricula: d.tipo,
          matricula2: d.m2 ? d.mat2 : '', tipoMatricula2: d.m2 ? (d.tipo === 'MP' ? 'MN' : 'MP') : '',
          provincia: d.prov
        },
        usuario: {}
      };
    }
    if (p === 2) {
      return {
        perfil: { especialidad: d.esp.trim(), servicios: construirServicios(d.svc, descripcionesServicios.current) },
        usuario: {}
      };
    }
    if (p === 3) {
      const perfil = { atiendeDomicilio: d.dom, zonas: d.zonas };
      if (d.dom) {
        // Igual que el editor: si atiende a domicilio, el WhatsApp es obligatorio y público
        perfil.whatsappActivo = true;
        perfil.whatsappNum = `54${d.wa}`;
        perfil.whatsappVisibilidad = 'todos';
      }
      return { perfil, usuario: {} };
    }
    if (p === 4) {
      const perfil = {
        emailContacto: d.email.trim(),
        emailVisibilidad: visibilidadADB(d.emailV),
        instagram: instagramAURL(d.ig)
      };
      if (!d.dom) {
        perfil.whatsappActivo = d.wa.length > 0;
        perfil.whatsappNum = d.wa ? `54${d.wa}` : '';
        perfil.whatsappVisibilidad = visibilidadADB(d.waV);
      }
      return { perfil, usuario: {} };
    }
    return { perfil: { bio: d.bio.trim() }, usuario: {} };
  };

  // Guarda un paso y anota hasta dónde llegó (para retomar después)
  const guardarPaso = async (p, d) => {
    const { perfil, usuario } = camposDelPaso(p, d);
    await guardarCampos('profesionales', currentUser.uid, perfil);
    await guardarCampos('usuarios', currentUser.uid, { ...usuario, onboardingPaso: p + 1 });
  };

  // Último paso: manda todo a verificación y marca el cuestionario como completo
  const finalizar = async (d) => {
    const uid = currentUser.uid;
    const { perfil } = camposDelPaso(TOTAL_PASOS - 1, d);
    await guardarCampos('profesionales', uid, { ...perfil, visible: false });

    // El estado de verificación vive en su propia colección, lejos de lo que edita la persona.
    // Guardamos una "foto" de los datos enviados para que quien verifica vea exactamente lo que se mandó.
    await guardarCampos('verificaciones', uid, {
      estado: 'pendiente',
      enviadoEn: serverTimestamp(),
      // Si es un reenvío tras un rechazo, borramos el motivo anterior
      ...(esCorreccion ? { motivoRechazo: '' } : {}),
      datosEnviados: {
        nombreCompleto: `${d.nombre.trim()} ${d.apellido.trim()}`.trim(),
        matricula: d.mat, tipoMatricula: d.tipo,
        matricula2: d.m2 ? d.mat2 : '', tipoMatricula2: d.m2 ? (d.tipo === 'MP' ? 'MN' : 'MP') : '',
        provincia: d.prov
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

  const completarDespues = async () => {
    // Si dijo que atiende a domicilio pero no puso WhatsApp, no guardamos esa opción a medias
    let datosAGuardar = datos;
    if (paso === 3 && datos.dom && !datos.wa.trim()) {
      datosAGuardar = { ...datos, dom: false };
      setDatos(datosAGuardar);
    }
    setGuardando(true);
    try {
      if (paso === TOTAL_PASOS - 1) await finalizar(datosAGuardar);
      else { await guardarPaso(paso, datosAGuardar); setPaso(paso + 1); }
      setError('');
    } catch (e) {
      console.error('Error al saltear el paso:', e);
      setError('No pudimos guardar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const volver = () => { setPaso(paso - 1); setError(''); };

  const cerrarSesion = async () => {
    try { if (logout) await logout(); navigate('/'); }
    catch (e) { console.error('Error al cerrar sesión', e); }
  };

  // Nombre y apellido: mayúscula automática sin saltar el cursor
  const cambiarNombre = (campo) => (evento) => {
    const input = evento.target;
    const posicion = input.selectionStart;
    cambiar(campo, capitalizarNombre(input.value));
    requestAnimationFrame(() => { try { input.setSelectionRange(posicion, posicion); } catch (e) { /* no pasa nada */ } });
  };

  // Tipo de matrícula: la segunda es siempre la otra (MP ↔ MN)
  const tipoSegundaMatricula = datos.tipo === 'MP' ? 'MN' : 'MP';

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
          <label className={CLASE_LABEL} htmlFor="ob-nombre">Nombre</label>
          <input id="ob-nombre" value={datos.nombre} onChange={cambiarNombre('nombre')} placeholder="María" autoComplete="off" className={CLASE_INPUT} />
          <label className={CLASE_LABEL} htmlFor="ob-apellido">Apellido</label>
          <input id="ob-apellido" value={datos.apellido} onChange={cambiarNombre('apellido')} placeholder="González" autoComplete="off" className={CLASE_INPUT} />

          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-full bg-[#F4F7F7] text-gray-400 flex items-center justify-center shrink-0 overflow-hidden">
              {datos.foto ? <img src={datos.foto} alt="Tu foto" className="w-full h-full object-cover" /> : <Camera className="w-7 h-7" strokeWidth={1.5} />}
            </div>
            <div>
              <label className={`${CLASE_BTN_SECUNDARIO} inline-flex items-center gap-2 cursor-pointer ${subiendoFoto ? 'opacity-60 pointer-events-none' : ''}`}>
                {subiendoFoto ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</> : (datos.foto ? 'Cambiar foto' : 'Subir foto')}
                <input type="file" accept="image/*" className="hidden" onChange={manejarFoto} disabled={subiendoFoto} />
              </label>
              <p className={CLASE_AYUDA}>Una foto tuya genera confianza. La podés sumar después.</p>
            </div>
          </div>
        </>
      );
    }

    if (paso === 1) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-mat">Número de matrícula</label>
          <div className="flex gap-2.5">
            <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value)} className={CLASE_SELECT_CORTO}>
              <option value="MP">MP</option>
              <option value="MN">MN</option>
            </select>
            <input id="ob-mat" inputMode="numeric" value={datos.mat} onChange={(e) => cambiar('mat', e.target.value.replace(/[^0-9-]/g, ''))} placeholder="12345" autoComplete="off" className={CLASE_INPUT} />
          </div>

          {datos.m2 ? (
            <div className="flex gap-2.5 items-center mt-2.5">
              <select value={tipoSegundaMatricula} disabled className={`${CLASE_SELECT_CORTO} opacity-70`}>
                <option>{tipoSegundaMatricula}</option>
              </select>
              <input inputMode="numeric" value={datos.mat2} onChange={(e) => cambiar('mat2', e.target.value.replace(/[^0-9-]/g, ''))} placeholder="Tu segunda matrícula" autoComplete="off" className={CLASE_INPUT} />
              <button type="button" aria-label="Quitar segunda matrícula" onClick={() => setDatos((p) => ({ ...p, m2: false, mat2: '' }))} className="text-gray-400 hover:text-red-500 transition-colors px-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => cambiar('m2', true)} className={`${CLASE_BTN_TEXTO} mt-2 flex items-center gap-1.5`}>
              <Plus className="w-4 h-4" /> Agregar segunda matrícula
            </button>
          )}
          <p className={CLASE_AYUDA}>Mínimo 3 números por matrícula.</p>

          <label className={CLASE_LABEL} htmlFor="ob-prov">Provincia</label>
          <select id="ob-prov" value={datos.prov} onChange={(e) => cambiar('prov', e.target.value)} className={CLASE_INPUT}>
            {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <span className={CLASE_LABEL}>Foto de tu título o carnet para verificarte (obligatorio).</span>
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
                : <><Upload className="w-5 h-5" /> Subir foto de tu título o carnet para validarte (obligatorio)</>}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={manejarTitulo} disabled={subiendoTitulo} />
            </label>
          )}
          <p className={CLASE_AYUDA}>Solo lo ve nuestro equipo para verificar tu matrícula. No se publica.</p>
        </>
      );
    }

    if (paso === 2) {
      return (
        <>
          <label className={CLASE_LABEL} htmlFor="ob-esp">Especialidad principal</label>
          <input id="ob-esp" value={datos.esp} onChange={(e) => cambiar('esp', e.target.value)} placeholder="Cirugía de tejidos blandos" autoComplete="off" className={CLASE_INPUT} />

          <span className={CLASE_LABEL}>Servicios que ofrecés (opcional)</span>
          <BuscadorServicios seleccion={datos.svc} onAlternar={alternarServicio} onAgregarPropio={agregarServicioPropio} />
        </>
      );
    }

    if (paso === 3) {
      return (
        <>
          <div className="flex items-center justify-between gap-4 bg-[#F4F7F7] rounded-2xl px-5 py-4 mt-5">
            <div>
              <p className="text-[16px] font-semibold text-[#1A3D3D]">Atiendo a domicilio</p>
              <p className="text-sm text-[#666666] mt-0.5">Suma una insignia a tu perfil.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={datos.dom}
              aria-label="Atiendo a domicilio"
              onClick={() => cambiar('dom', !datos.dom)}
              className="relative shrink-0 rounded-full transition-colors duration-300"
              style={{ width: 52, height: 30, backgroundColor: datos.dom ? '#25D366' : '#D1D5DB' }}
            >
              <span
                className="absolute rounded-full bg-white shadow transition-all duration-300"
                style={{ top: 3, left: datos.dom ? 25 : 3, width: 24, height: 24 }}
              />
            </button>
          </div>

          {datos.dom && (
            <>
              <label className={CLASE_LABEL} htmlFor="ob-wa-dom">Tu WhatsApp</label>
              <CampoWhatsapp id="ob-wa-dom" valor={datos.wa} onCambio={(v) => cambiar('wa', v)} />
              <p className={CLASE_AYUDA}>Obligatorio si atendés a domicilio, para que los tutores coordinen con vos.</p>
            </>
          )}

          <div className="flex items-center gap-3 mt-8 mb-3">
            {datos.zonas.length > 0 && (
              <span className="w-9 h-9 rounded-full bg-[#2D6A6A] text-white flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" strokeWidth={3} />
              </span>
            )}
            <span className="font-['Montserrat'] font-extrabold text-xl leading-tight text-[#1A3D3D]">
              {datos.zonas.length ? '¿Atendés en otra veterinaria? Podés sumarla' : 'Sumá la clínica o consultorio donde atendés'}
            </span>
          </div>
          <BuscadorLugares onElegir={agregarLugar} texto={textoLugar} setTexto={setTextoLugar} />

          {datos.zonas.flatMap((zona) => zona.clinicas.map((clinica) => (
            <div key={clinica.id} className="flex items-start gap-3 border border-gray-200 rounded-2xl px-4 py-3.5 mt-2.5">
              <Building2 className="w-[22px] h-[22px] text-[#2D6A6A] mt-0.5 shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#1A3D3D]">{clinica.nombrePropio}</p>
                <p className="text-sm text-[#666666] mt-0.5 leading-snug">{clinica.direccion}</p>
                <p className="text-[12px] font-semibold text-[#2D6A6A] mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-[15px] h-[15px]" /> Confirmado con Google{clinica.barrio ? ` · Barrio: ${clinica.barrio}` : ''}
                </p>
              </div>
              <button type="button" aria-label="Quitar lugar" onClick={() => quitarLugar(zona.id, clinica.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          )))}
        </>
      );
    }

    if (paso === 4) {
      return (
        <>
          <EtiquetaConVisibilidad id="ob-email" texto="Email de contacto" valor={datos.emailV} onCambio={(v) => cambiar('emailV', v)} />
          <input id="ob-email" type="email" value={datos.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="nombre@email.com" autoComplete="off" className={CLASE_INPUT} />
          <p className={CLASE_AYUDA}>{EXPLICACION_VISIBILIDAD[datos.emailV]}</p>

          {datos.dom ? (
            <div className="mt-6 bg-[#F4F7F7] rounded-2xl px-4 py-3.5 flex gap-2.5">
              <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0" strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-[#1A3D3D] leading-relaxed">Tu WhatsApp ya está cargado y es visible para todos, porque atendés a domicilio.</p>
            </div>
          ) : (
            <>
              <EtiquetaConVisibilidad id="ob-wa" texto="WhatsApp (opcional)" valor={datos.waV} onCambio={(v) => cambiar('waV', v)} />
              <CampoWhatsapp id="ob-wa" valor={datos.wa} onCambio={(v) => cambiar('wa', v)} />
              <p className={CLASE_AYUDA}>{EXPLICACION_VISIBILIDAD[datos.waV]}</p>
            </>
          )}

          <label className={CLASE_LABEL} htmlFor="ob-ig">Instagram (opcional)</label>
          <input id="ob-ig" value={datos.ig} onChange={(e) => cambiar('ig', e.target.value.replace(/^@/, ''))} placeholder="@tu_usuario" autoComplete="off" className={CLASE_INPUT} />
        </>
      );
    }

    return (
      <>
        <label className={CLASE_LABEL} htmlFor="ob-bio">Tu presentación</label>
        <textarea
          id="ob-bio"
          rows={5}
          maxLength={350}
          value={datos.bio}
          onChange={(e) => cambiar('bio', e.target.value)}
          placeholder="Soy médica veterinaria y me dedico a la cirugía de pequeños animales hace diez años."
          className={`${CLASE_INPUT} resize-none`}
        />
        <p className="text-right text-sm text-[#666666] mt-2">{datos.bio.length} / 350</p>
      </>
    );
  };

  // ==========================================
  // PANTALLA
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] selection:bg-[#2D6A6A] selection:text-white">
      {/* Ventana para encuadrar la foto de perfil */}
      {recorte.abierto && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de la foto</h3>
                <p className="text-sm text-gray-500 mt-1">Arrastrá para mover la imagen o usá el zoom.</p>
              </div>
              <button onClick={() => setRecorte({ abierto: false, imagen: null })} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center">
              <RecortadorFoto
                imagen={recorte.imagen}
                onAplicar={subirFotoRecortada}
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
                <p className="text-[15px] font-bold text-[#1A3D3D]">Estás corrigiendo tu solicitud</p>
                <p className="text-[14px] font-medium text-[#666666] leading-relaxed mt-1 whitespace-pre-line">
                  {motivoRechazo ? `Motivo: ${motivoRechazo}` : 'Revisá tus datos y volvé a enviarlos.'}
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
                  {paso >= 3 && (
                    <button type="button" onClick={completarDespues} disabled={guardando} className={CLASE_BTN_TEXTO}>Completar después</button>
                  )}
                  <button type="button" onClick={irAlSiguiente} disabled={guardando || subiendoFoto || subiendoTitulo} className={CLASE_BTN_PRIMARIO}>
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
                ¡Listo{datos.nombre.trim() ? `, ${datos.nombre.trim().split(' ')[0]}` : ''}!
              </h1>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-[#666666] max-w-sm mx-auto">
                Recibimos tu matrícula. La verificamos en 24 a 48 horas y te avisamos por mail.
              </p>
              <div className="bg-[#F4F7F7] rounded-2xl px-4 py-3.5 my-6 text-left text-[15px] font-medium text-[#1A3D3D] leading-relaxed">
                Mientras esperás, podés sumar tu trayectoria y tus fotos desde tu perfil. Apenas te verifiquemos, sale publicado.
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