import React, { useState, useEffect, useRef } from 'react';
import {
  Info, ExternalLink, Eye, EyeOff, ChevronDown, Crop, Check, Search, X, Plus, MapPin, Maximize2, Stethoscope
} from 'lucide-react';

// =====================================================================
// COMPONENTES COMPARTIDOS DE LOS EDITORES
// Acá vive todo lo que se repite entre editor-clinica, editor-profesional
// y (más adelante) editor-proveedores. Si arreglás algo acá, se arregla en todos.
// Por ahora lo usa solo editor-clinica.jsx.
// =====================================================================

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

// Saca acentos, pasa a minúsculas y recorta espacios (para comparar textos sin que importen las tildes)
export const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Deja solo los números de un texto
export const soloDigitos = (texto) => String(texto || '').replace(/\D/g, '');

// Arma la dirección amigable del perfil (ej: "Clínica San Martín" → "clinica-san-martin")
export const generarSlug = (texto) => String(texto || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

export const esEmailValido = (email) => /^\S+@\S+\.\S+$/.test(String(email || '').trim());

// Una imagen "data:..." es una foto recién elegida que todavía no se subió a Storage
export const esDataUrl = (valor) => typeof valor === 'string' && valor.startsWith('data:');

// WhatsApp argentino: guardamos "54" + número. Consideramos completo un número de 8 dígitos o más (sin el 54)
export const whatsappCompleto = (valor) => soloDigitos(valor).replace(/^54/, '').length >= 8;

// Instagram: de cualquier formato (link, @usuario, usuario) saca solo el usuario
export const usuarioDeInstagram = (valor) => {
  if (!valor) return '';
  const v = String(valor).trim();
  if (v.startsWith('http')) return v.split('?')[0].replace(/\/+$/, '').split('/').pop().replace(/^@/, '');
  return v.replace(/^@/, '');
};

// Instagram: lo guardamos siempre como link completo
export const instagramAURL = (valor) => {
  const usuario = usuarioDeInstagram(valor);
  return usuario ? `https://instagram.com/${usuario}` : '';
};

// Sitios web y Facebook: si falta el "https://", se lo agregamos
export const normalizarWeb = (valor) => {
  const v = String(valor || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

// Lee un archivo elegido por la persona y lo devuelve como imagen "data:..."
export const leerArchivoComoDataURL = (archivo) => new Promise((resolve, reject) => {
  const lector = new FileReader();
  lector.onload = (evento) => resolve(evento.target.result);
  lector.onerror = reject;
  lector.readAsDataURL(archivo);
});

// Achica una imagen para que no pese de más (el lado más largo queda en "maximo" píxeles)
export const comprimirImagen = (dataUrl, maximo = 1400, calidad = 0.9) => new Promise((resolve, reject) => {
  const imagen = new Image();
  imagen.onerror = reject;
  imagen.onload = () => {
    let ancho = imagen.width;
    let alto = imagen.height;
    if (ancho > maximo || alto > maximo) {
      const escala = maximo / Math.max(ancho, alto);
      ancho = Math.round(ancho * escala);
      alto = Math.round(alto * escala);
    }
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    resolve(canvas.toDataURL('image/jpeg', calidad));
  };
  imagen.src = dataUrl;
});

// ==========================================
// GOOGLE MAPS (buscador de direcciones)
// ==========================================

// Carga Google Maps una sola vez. Si ya está cargado en la página, lo reutiliza.
export const cargarGoogleMaps = () => new Promise((resolve, reject) => {
  if (window.google?.maps?.places) { resolve(); return; }

  const scriptExistente = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (!scriptExistente) {
    // Aceptamos los dos nombres de variable que se usaron en el proyecto
    const clave = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY;
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

// Busca en nuestra lista de provincias la que corresponde al nombre que devuelve Google
// (Google dice "Provincia de Buenos Aires" o "Ciudad Autónoma de Buenos Aires")
const provinciaDeLista = (textoGoogle, lista) => {
  if (!textoGoogle) return '';
  const google = normalizar(textoGoogle).replace(/^provincia de /, '');
  if (google.includes('ciudad autonoma') || google === 'caba') {
    const caba = lista.find((p) => { const n = normalizar(p); return n === 'caba' || n.includes('ciudad autonoma'); });
    return caba || textoGoogle;
  }
  const exacta = lista.find((p) => normalizar(p) === google);
  if (exacta) return exacta;
  const parecida = lista.find((p) => normalizar(p).includes(google) || google.includes(normalizar(p)));
  return parecida || textoGoogle;
};

// Del lugar que elige la persona en Google, saca todos los datos que guardamos
export const datosDesdeLugarGoogle = (lugar, listaProvincias = []) => {
  const componentes = lugar.address_components || [];
  const buscar = (tipo) => componentes.find((c) => c.types.includes(tipo))?.long_name || '';
  const localidad = buscar('locality') || buscar('administrative_area_level_2') || '';
  // Barrio: si Google lo tiene (ej: Palermo) usamos ese; si no, la localidad (ej: Castelar)
  const barrio = buscar('neighborhood') || buscar('sublocality_level_1') || buscar('sublocality') || localidad;
  return {
    nombre: lugar.name || '',
    direccion: lugar.formatted_address || '',
    placeId: lugar.place_id || '',
    lat: lugar.geometry?.location ? lugar.geometry.location.lat() : null,
    lng: lugar.geometry?.location ? lugar.geometry.location.lng() : null,
    localidad,
    barrio,
    provincia: provinciaDeLista(buscar('administrative_area_level_1'), listaProvincias)
  };
};

// Campo de dirección con sugerencias de Google. Se puede buscar por nombre del lugar o por dirección.
export function BuscadorDireccionGoogle({ id, valor, onEscribir, onElegir, placeholder, listaProvincias = [] }) {
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
          fields: ['name', 'formatted_address', 'place_id', 'geometry', 'address_components']
        });
        autocomplete.addListener('place_changed', () => {
          const lugar = autocomplete.getPlace();
          if (!lugar || !lugar.place_id) return;
          onElegirRef.current(datosDesdeLugarGoogle(lugar, listaProvincias));
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
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={valor}
          onChange={(e) => onEscribir(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          placeholder={placeholder || 'Buscá por nombre o dirección'}
          autoComplete="off"
          className="w-full border border-gray-200 focus:border-[#2D6A6A] rounded-2xl pl-11 pr-5 py-3.5 text-base font-medium focus:outline-none transition-all bg-gray-50/50 text-[#1A3D3D]"
        />
      </div>
      {estadoMapa === 'error' && (
        <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-1">No pudimos cargar Google Maps. Recargá la página para volver a intentar.</p>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTES DE UI
// ==========================================

// Puntito naranja que avisa que a una sección le falta algo
export const PuntoAlerta = () => (
  <span className="w-2 h-2 rounded-full bg-[#FF9800] shrink-0 animate-pulse" />
);

// Ícono "i" que muestra una ayuda al pasar el mouse o tocarlo
export const Tooltip = ({ text, isSection = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const boxRef = useRef(null);
  const [xOffset, setXOffset] = useState(0);

  useEffect(() => {
    // Si el tooltip está abierto, calculamos su posición para que no se salga de la pantalla
    if (isVisible && boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      const margin = 16;
      if (rect.left < margin) {
        setXOffset(margin - rect.left);
      } else if (rect.right > window.innerWidth - margin) {
        setXOffset((window.innerWidth - margin) - rect.right);
      }
    } else {
      setXOffset(0);
    }
  }, [isVisible]);

  return (
    <div
      className="group relative inline-flex items-center ml-2 cursor-help z-[100]"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        if (e.cancelable !== false) e.preventDefault();
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
    >
      <div className="bg-[#2D6A6A]/10 p-1 rounded-full border border-[#2D6A6A]/20 group-hover:bg-[#2D6A6A] transition-colors duration-300">
        <Info className="w-4 h-4 text-[#2D6A6A] group-hover:text-white transition-colors" />
      </div>

      <div className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[110]
        transition-all duration-300 flex flex-col items-center
        ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}>
        <div
          ref={boxRef}
          style={{ transform: `translateX(${xOffset}px)` }}
          className={`
            w-[260px] sm:w-[280px] text-left leading-relaxed normal-case tracking-normal font-normal transition-transform duration-200 ease-out
            ${isSection
              ? 'bg-white border border-gray-100 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
              : 'bg-[#1A3D3D] text-white text-sm font-medium p-3 rounded-xl shadow-2xl border border-white/10'
            }
          `}
        >
          {isSection && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A]"></div>
              <span className="text-xs font-black text-[#2D6A6A] tracking-wide uppercase">Importante</span>
            </div>
          )}
          <p className={isSection ? 'text-sm text-gray-600 font-medium leading-relaxed' : ''}>{text}</p>
        </div>
        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent ${isSection ? 'border-t-white' : 'border-t-[#1A3D3D]'}`}></div>
      </div>
    </div>
  );
};

// Campo de texto con etiqueta, ayuda y contador de caracteres
export const InputGroup = ({ label, id, type = 'text', placeholder, value, onChange, tooltip, error, required, maxLength, disabled, readOnly, canTest, rows = '4' }) => {
  const isNearLimit = maxLength && value && value.length >= maxLength * 0.9;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-6 w-full">
      <div className="flex justify-between items-end mb-2 ml-1">
        <label htmlFor={id} className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
          {label} {required && <span className="text-red-400 ml-1">*</span>}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        {maxLength && (
          <span className={`text-[11px] font-black tracking-wider leading-none transition-colors ${isNearLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {value?.length || 0} / {maxLength}
          </span>
        )}
      </div>

      <div className="relative text-left">
        {type === 'textarea' ? (
          <textarea
            id={id} name={id} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} rows={rows} disabled={disabled} readOnly={readOnly}
            spellCheck="true"
            lang="es"
            className={`w-full border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-4 text-base font-medium focus:outline-none transition-all resize-none ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-200' : 'bg-gray-50/50 text-[#1A3D3D] disabled:opacity-50'}`}
          />
        ) : (
          <input
            id={id} name={id} type={currentType} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} disabled={disabled} readOnly={readOnly}
            spellCheck="true"
            lang="es"
            className={`w-full border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-3.5 text-base font-medium focus:outline-none transition-all ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-200' : 'bg-gray-50/50 text-[#1A3D3D] disabled:opacity-50'} ${(canTest || isPassword) ? 'pr-12' : ''}`}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4DB6AC] transition-colors p-1 z-10"
            title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {canTest && value && !isPassword && (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noreferrer"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all shadow-sm z-10 bg-white border-gray-200 text-gray-500 hover:text-[#4DB6AC] hover:border-[#4DB6AC] cursor-pointer"
            title="Probar enlace"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};

// Interruptor de sí / no
export const ToggleSwitch = ({ label, checked, onChange, tooltip, className = '' }) => (
  <div className={`flex items-center justify-between gap-4 ${className}`}>
    <div className="flex items-center flex-1">
      <span className="text-sm font-bold text-[#1A3D3D]">{label}</span>
      {tooltip && <Tooltip text={tooltip} />}
    </div>
    <button
      type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-[#25D366]' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

// Sección desplegable del formulario. "alerta" muestra el puntito naranja; "contador" = { actual, max }
export const Accordion = ({ title, icon: Icon, children, isOpen, onToggle, tooltip, alerta, avisoTexto, contador }) => {
  const contadorAlLimite = contador && contador.actual >= contador.max * 0.9;
  return (
    <div className="border-b border-gray-100 last:border-0 group relative z-[1]">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex justify-between items-center transition-all duration-300 py-6 px-6 md:px-5 md:rounded-t-[24px] ${isOpen ? 'md:bg-gray-50/80 shadow-sm' : 'md:hover:bg-gray-50'}`}
      >
        <div className="flex items-center text-left gap-3 md:gap-4">
          <div className={`p-2.5 rounded-xl transition-all duration-300 ease-in-out ${isOpen ? 'bg-[#1A3D3D] text-white' : 'bg-transparent text-[#2D6A6A]'}`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <h3 className={`font-black text-sm md:text-base uppercase tracking-wider transition-colors duration-300 flex items-center gap-2 ${isOpen ? 'text-[#1A3D3D]' : 'text-gray-500 md:text-[#1A3D3D]'}`}>
            {title}
            {alerta && !isOpen && <PuntoAlerta />}
          </h3>
          {tooltip && isOpen && (
            <div className="block animate-in fade-in zoom-in duration-300">
              <Tooltip text={tooltip} isSection />
            </div>
          )}
          {avisoTexto && isOpen && (
            <span className="inline text-[13px] font-bold text-[#FF9800] normal-case tracking-normal animate-in fade-in duration-300">
              {avisoTexto}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {contador && (
            <span className={`text-xs font-bold transition-all ${contadorAlLimite ? 'text-red-500 animate-pulse' : 'text-gray-400'} ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              {contador.actual} / {contador.max}
            </span>
          )}
          <div className="block">
            <ChevronDown className={`w-6 h-6 transition-all duration-300 ease-in-out ${isOpen ? 'rotate-180 text-[#2D6A6A]' : 'rotate-0 text-gray-300 group-hover:text-[#2D6A6A]'}`} />
          </div>
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[4000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="py-6 px-6 md:px-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// Campo de WhatsApp con el +54 fijo. Guarda "54" + número; muestra solo el número.
export function CampoWhatsapp({ id, label, requerido, valor, onCambio, tooltip, ayuda }) {
  const numeroVisible = soloDigitos(valor).replace(/^54/, '');
  return (
    <div className="mb-6 w-full">
      {label && (
        <label htmlFor={id} className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
          {label} {requerido && <span className="text-red-400 ml-1">*</span>}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
      )}
      <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50/50 focus-within:border-[#2D6A6A] transition-all overflow-hidden">
        <span className="px-4 py-3.5 text-base font-black text-[#1A3D3D] bg-gray-100 border-r border-gray-200 shrink-0 select-none">+54</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={numeroVisible}
          onChange={(e) => {
            const numero = soloDigitos(e.target.value);
            onCambio(numero ? `54${numero}` : '');
          }}
          placeholder="911..."
          className="flex-1 bg-transparent px-4 py-3.5 text-base font-medium focus:outline-none text-[#1A3D3D]"
        />
      </div>
      {ayuda && <p className="text-xs text-gray-500 font-medium mt-2 ml-1 leading-relaxed">{ayuda}</p>}
    </div>
  );
}

// ==========================================
// RECORTADOR DE IMÁGENES (uno solo para todo el Portal)
// forma: 'circulo' | 'cuadrado'
// tamanoSalida: el tamaño final de la imagen en píxeles (más grande = más nítida)
// formato: 'jpeg' (fondo blanco) | 'png' (respeta el fondo transparente de los logos)
// ==========================================
export function RecortadorImagen({ imagen, forma = 'cuadrado', tamanoSalida = 512, formato = 'jpeg', onAplicar, onCancelar }) {
  const VISOR = 256; // tamaño del recuadro en pantalla
  const [zoom, setZoom] = useState(1);
  const [zoomMinimo, setZoomMinimo] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const [inicioArrastre, setInicioArrastre] = useState({ x: 0, y: 0 });
  const [escalaBase, setEscalaBase] = useState(1);
  const imgRef = useRef(null);

  const radio = forma === 'circulo' ? '50%' : '1.5rem';

  // Cuando la imagen carga: escala para que cubra el recuadro, y zoom mínimo para verla entera
  const alCargarImagen = (e) => {
    const img = e.target;
    const cubrir = Math.max(VISOR / img.naturalWidth, VISOR / img.naturalHeight);
    const contener = Math.min(VISOR / img.naturalWidth, VISOR / img.naturalHeight);
    setEscalaBase(cubrir);
    setZoomMinimo(contener / cubrir);
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

  // Muestra la imagen completa, sin recortar nada (útil para logos alargados)
  const verEntera = () => {
    setZoom(zoomMinimo);
    setPosicion({ x: 0, y: 0 });
  };

  // Dibuja lo que se ve en el recuadro, en grande, y lo devuelve como imagen
  const aplicarRecorte = () => {
    const factor = tamanoSalida / VISOR;
    const canvas = document.createElement('canvas');
    canvas.width = tamanoSalida;
    canvas.height = tamanoSalida;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    const escala = escalaBase * zoom * factor;
    const ancho = img.naturalWidth * escala;
    const alto = img.naturalHeight * escala;
    if (formato === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tamanoSalida, tamanoSalida);
    }
    ctx.drawImage(img, (tamanoSalida - ancho) / 2 + posicion.x * factor, (tamanoSalida - alto) / 2 + posicion.y * factor, ancho, alto);
    onAplicar(formato === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div
        className="relative bg-gray-100 overflow-hidden cursor-move touch-none shadow-inner max-w-full"
        style={{ width: VISOR, height: VISOR, borderRadius: radio }}
        onMouseDown={alApretar} onMouseMove={alMover} onMouseUp={alSoltar} onMouseLeave={alSoltar}
        onTouchStart={alApretar} onTouchMove={alMover} onTouchEnd={alSoltar}
      >
        <img
          ref={imgRef}
          src={imagen}
          alt="Imagen original"
          className="absolute pointer-events-none select-none max-w-none"
          draggable={false}
          onLoad={alCargarImagen}
          style={{
            transform: `translate3d(calc(-50% + ${posicion.x}px), calc(-50% + ${posicion.y}px), 0) scale(${escalaBase * zoom})`,
            left: '50%', top: '50%', width: 'auto', height: 'auto', maxWidth: 'none', transformOrigin: 'center center'
          }}
        />
        <div className="absolute inset-0 pointer-events-none border-4 border-[#2D6A6A]/40" style={{ borderRadius: radio }}></div>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <Crop className="w-10 h-10 text-white opacity-40 drop-shadow-md" />
        </div>
      </div>

      <div className="mt-8 w-full max-w-[256px]">
        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
          <span>Alejar</span><span>Acercar</span>
        </label>
        <input
          type="range"
          min={zoomMinimo}
          max="3"
          step="0.01"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-[#2D6A6A] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        {zoomMinimo < 0.99 && (
          <button
            type="button"
            onClick={verEntera}
            className="mt-4 w-full text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:text-[#1A3D3D] transition-colors flex items-center justify-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Ver la imagen entera
          </button>
        )}
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
// SERVICIOS / ESPECIALIDADES
// Formato que se guarda: { [grupoId]: { activo, subOpcionesSeleccionadas, serviciosPersonalizados, desc } }
// "activo" se calcula solo: es true si el grupo tiene al menos una opción elegida.
// ==========================================
const GRUPO_VACIO = { activo: false, subOpcionesSeleccionadas: [], desc: '', serviciosPersonalizados: [] };

// Limpia los servicios que vienen de la base: saca grupos que ya no existen y recalcula "activo"
export const normalizarServicios = (servicios, grupos) => {
  const resultado = {};
  if (!servicios || Array.isArray(servicios)) return resultado;
  const idsValidos = new Set(grupos.map((g) => g.id));
  Object.entries(servicios).forEach(([grupoId, grupo]) => {
    if (!idsValidos.has(grupoId) || !grupo) return;
    const elegidas = Array.isArray(grupo.subOpcionesSeleccionadas) ? grupo.subOpcionesSeleccionadas : [];
    const propios = Array.isArray(grupo.serviciosPersonalizados) ? grupo.serviciosPersonalizados : [];
    resultado[grupoId] = {
      activo: elegidas.length + propios.length > 0,
      subOpcionesSeleccionadas: elegidas,
      desc: grupo.desc || '',
      serviciosPersonalizados: propios
    };
  });
  return resultado;
};

// Cuenta cuántas opciones hay elegidas en total
export const contarServicios = (servicios) => Object.values(servicios || {}).reduce(
  (total, g) => total + (g.subOpcionesSeleccionadas || []).length + (g.serviciosPersonalizados || []).length, 0
);

// Buscador + lista de grupos desplegables con casillas, servicios propios y descripción por grupo
export function SelectorServicios({ servicios, setFormData, grupos, iconosGrupo = {} }) {
  const [busqueda, setBusqueda] = useState('');
  const [modalPropio, setModalPropio] = useState({ abierto: false, texto: '' });
  const [grupoElegido, setGrupoElegido] = useState('');
  const [expandidos, setExpandidos] = useState({});
  const [nuevos, setNuevos] = useState({});

  const lista = servicios && !Array.isArray(servicios) ? servicios : {};

  // Cambia un grupo leyendo siempre el estado más nuevo (así no se pisan cambios seguidos)
  const actualizarGrupo = (grupoId, calcularCambios) => {
    setFormData((prev) => {
      const previos = prev.servicios && !Array.isArray(prev.servicios) ? prev.servicios : {};
      const actual = { ...GRUPO_VACIO, ...(previos[grupoId] || {}) };
      const fusion = { ...actual, ...calcularCambios(actual) };
      fusion.activo = (fusion.subOpcionesSeleccionadas || []).length + (fusion.serviciosPersonalizados || []).length > 0;
      return { ...prev, servicios: { ...previos, [grupoId]: fusion } };
    });
  };

  const alternarOpcion = (grupoId, opcion) => actualizarGrupo(grupoId, (g) => ({
    subOpcionesSeleccionadas: g.subOpcionesSeleccionadas.includes(opcion)
      ? g.subOpcionesSeleccionadas.filter((o) => o !== opcion)
      : [...g.subOpcionesSeleccionadas, opcion]
  }));

  const agregarPropio = (grupoId, texto) => {
    const limpio = texto.trim();
    if (!limpio) return;
    const capitalizado = limpio.charAt(0).toUpperCase() + limpio.slice(1);
    actualizarGrupo(grupoId, (g) => (g.serviciosPersonalizados.includes(capitalizado)
      ? {}
      : { serviciosPersonalizados: [...g.serviciosPersonalizados, capitalizado] }));
  };

  const quitarPropio = (grupoId, texto) => actualizarGrupo(grupoId, (g) => ({
    serviciosPersonalizados: g.serviciosPersonalizados.filter((p) => p !== texto)
  }));

  const cambiarDescripcion = (grupoId, texto) => actualizarGrupo(grupoId, () => ({ desc: texto }));

  const todasLasOpciones = grupos.flatMap((grupo) =>
    grupo.opciones.map((opcion) => ({ opcion, grupoId: grupo.id, grupoNombre: grupo.grupo }))
  );

  const textoBuscado = normalizar(busqueda);
  const resultados = textoBuscado.length >= 2
    ? todasLasOpciones.filter((item) => normalizar(item.opcion).includes(textoBuscado) || normalizar(item.grupoNombre).includes(textoBuscado))
    : [];

  const estaSeleccionada = (grupoId, opcion) => (lista[grupoId]?.subOpcionesSeleccionadas || []).includes(opcion);

  const confirmarPropio = () => {
    if (!grupoElegido || !modalPropio.texto.trim()) return;
    agregarPropio(grupoElegido, modalPropio.texto);
    setExpandidos((prev) => ({ ...prev, [grupoElegido]: true }));
    setBusqueda('');
    setModalPropio({ abierto: false, texto: '' });
    setGrupoElegido('');
  };

  return (
    <>
      {/* MODAL: ELEGIR GRUPO DE UN SERVICIO PROPIO */}
      {modalPropio.abierto && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-black text-[#1A3D3D] text-lg font-['Montserrat'] mb-1">¿A qué grupo pertenece?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Vas a agregar: <span className="font-bold text-[#1A3D3D]">"{modalPropio.texto}"</span>
            </p>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {grupos.map((grupo) => (
                <button
                  key={grupo.id}
                  type="button"
                  onClick={() => setGrupoElegido(grupo.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${grupoElegido === grupo.id ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A6A]'}`}
                >
                  {grupo.grupo}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => { setModalPropio({ abierto: false, texto: '' }); setGrupoElegido(''); }}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarPropio}
                disabled={!grupoElegido}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] transition-colors disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMPO DE BÚSQUEDA */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar especialidad... (ej: oncología, ecografía, quirófano)"
          className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-[#1A3D3D] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all"
        />
        {busqueda && (
          <button type="button" onClick={() => setBusqueda('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* RESULTADOS DE LA BÚSQUEDA */}
      {textoBuscado.length >= 2 && (
        <div className="mb-6 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
          {resultados.length > 0 ? (
            <>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">
                {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-col divide-y divide-gray-100">
                {resultados.map(({ opcion, grupoId, grupoNombre }) => {
                  const seleccionada = estaSeleccionada(grupoId, opcion);
                  return (
                    <button
                      key={`${grupoId}-${opcion}`}
                      type="button"
                      onClick={() => alternarOpcion(grupoId, opcion)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${seleccionada ? 'bg-[#1A3D3D]/5' : 'hover:bg-white'}`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${seleccionada ? 'text-[#1A3D3D]' : 'text-gray-700'}`}>{opcion}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{grupoNombre}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ml-4 transition-colors ${seleccionada ? 'bg-[#1A3D3D] border-[#1A3D3D]' : 'border-gray-300'}`}>
                        {seleccionada && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setModalPropio({ abierto: true, texto: busqueda.trim() })}
                className="w-full px-4 py-3.5 flex items-center gap-2 text-[#2D6A6A] text-sm font-bold hover:bg-white transition-colors border-t border-gray-100"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Agregar "{busqueda.trim()}" como especialidad propia
              </button>
            </>
          ) : (
            <div className="px-4 py-5 flex flex-col gap-3">
              <p className="text-sm text-gray-500 font-medium">
                No encontramos "<span className="font-bold text-[#1A3D3D]">{busqueda}</span>" entre las especialidades predefinidas.
              </p>
              <button
                type="button"
                onClick={() => setModalPropio({ abierto: true, texto: busqueda.trim() })}
                className="w-full py-3 bg-[#2D6A6A] text-white text-sm font-bold rounded-xl hover:bg-[#1A3D3D] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Agregar como especialidad propia
              </button>
            </div>
          )}
        </div>
      )}

      {/* GRUPOS DESPLEGABLES */}
      <div className="flex flex-col gap-3">
        {grupos.map((grupo) => {
          const grupoActual = { ...GRUPO_VACIO, ...(lista[grupo.id] || {}) };
          const seleccionadas = grupoActual.subOpcionesSeleccionadas;
          const personalizados = grupoActual.serviciosPersonalizados;
          const totalSeleccionadas = seleccionadas.length + personalizados.length;
          const isActive = totalSeleccionadas > 0;
          const expandido = expandidos[grupo.id] || false;
          const resaltado = isActive || expandido;
          const nuevoServicio = nuevos[grupo.id] || '';
          const IconoGrupo = iconosGrupo[grupo.id] || Stethoscope;

          const agregarDesdeCampo = () => {
            agregarPropio(grupo.id, nuevoServicio);
            setNuevos((prev) => ({ ...prev, [grupo.id]: '' }));
          };

          return (
            <div key={grupo.id} className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${resaltado ? 'border-[#2D6A6A] bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}>
              <div
                className="p-4 flex items-center gap-3 cursor-pointer select-none"
                onClick={() => setExpandidos((prev) => ({ ...prev, [grupo.id]: !expandido }))}
              >
                <IconoGrupo className={`w-5 h-5 shrink-0 transition-colors duration-300 ${resaltado ? 'text-[#2D6A6A]' : 'text-gray-500'}`} />
                <span className={`flex-1 text-sm font-black ${resaltado ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{grupo.grupo}</span>
                {!expandido && totalSeleccionadas > 0 && (
                  <span className="text-[11px] font-bold text-[#2D6A6A] bg-[#2D6A6A]/10 px-2.5 py-1 rounded-full shrink-0">
                    {totalSeleccionadas} seleccionada{totalSeleccionadas !== 1 ? 's' : ''}
                  </span>
                )}
                <ChevronDown strokeWidth={2.5} className={`w-5 h-5 transition-transform duration-300 shrink-0 ${expandido ? 'rotate-180 text-[#2D6A6A]' : 'text-gray-500'}`} />
              </div>

              {/* Resumen de lo elegido cuando el grupo está cerrado */}
              {!expandido && totalSeleccionadas > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {seleccionadas.map((s) => <span key={s} className="text-[11px] font-medium bg-[#F4F7F7] text-[#2D6A6A] border border-[#2D6A6A]/20 px-2.5 py-1 rounded-full">{s}</span>)}
                  {personalizados.map((s) => <span key={s} className="text-[11px] font-medium bg-[#F4F7F7] text-[#666666] border border-gray-200 px-2.5 py-1 rounded-full">{s}</span>)}
                </div>
              )}

              {expandido && (
                <div className="px-4 pb-5 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Opciones</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {grupo.opciones.map((opcion) => {
                      const isChecked = seleccionadas.includes(opcion);
                      return (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => alternarOpcion(grupo.id, opcion)}
                          className={`w-full justify-start px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-colors flex items-center gap-3 ${isChecked ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A6A]'}`}
                        >
                          <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked ? 'bg-white border-white' : 'border-gray-300'}`}>
                            {isChecked && <Check className="w-3 h-3 text-[#1A3D3D]" />}
                          </div>
                          <span className="text-left">{opcion}</span>
                        </button>
                      );
                    })}
                  </div>

                  {personalizados.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4">
                      {personalizados.map((srv) => (
                        <div key={srv} className="w-full justify-start px-4 py-2.5 rounded-xl text-[13px] font-bold border bg-[#1A3D3D] text-white border-[#1A3D3D] flex items-center gap-3">
                          <div className="w-4 h-4 rounded-[4px] bg-white border-white border flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-[#1A3D3D]" />
                          </div>
                          <span className="flex-1 text-left">{srv}</span>
                          <button type="button" onClick={() => quitarPropio(grupo.id, srv)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" title="Quitar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">¿No encontrás lo que buscás? Agregá uno propio</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevoServicio}
                        onChange={(e) => setNuevos((prev) => ({ ...prev, [grupo.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarDesdeCampo(); } }}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A6A] outline-none text-[#1A3D3D]"
                      />
                      <button type="button" onClick={agregarDesdeCampo} className="bg-[#2D6A6A] text-white p-2.5 rounded-xl hover:bg-[#1A3D3D] transition-colors shrink-0">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Descripción opcional del grupo</label>
                    <textarea
                      placeholder="Contá brevemente cómo trabajan en esta área..."
                      value={grupoActual.desc || ''}
                      maxLength={200}
                      rows={2}
                      onChange={(e) => cambiarDescripcion(grupo.id, e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-[#2D6A6A] outline-none text-[#1A3D3D] font-medium"
                    />
                    <p className={`text-right text-[10px] font-bold mt-1 ${(grupoActual.desc?.length || 0) >= 180 ? 'text-red-400' : 'text-gray-300'}`}>{grupoActual.desc?.length || 0} / 200</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}