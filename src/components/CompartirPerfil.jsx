import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Check, Share2, MessageCircle, Instagram, ChevronDown, Loader2, AlertTriangle, Link2 } from 'lucide-react';

// =====================================================================
// COMPARTIR PERFIL
// Todo lo necesario para que profesionales y clínicas difundan su perfil:
//  - CompartirPerfil: la ventana con la imagen 9:16 (historias y estados), descargar, compartir y mensaje
//  - BotonCompartirPerfil: botón que abre esa ventana (para el dueño del perfil)
//  - BotonCompartirLink: botón simple para visitantes (menú nativo o copiar link)
// Va en: src/components/CompartirPerfil.jsx
// =====================================================================

const DOMINIO = 'https://www.portalveterinario.ar';
const ANCHO = 1080;
const ALTO = 1920; // 9:16, el formato de historias de Instagram y estados de WhatsApp

const tramoRuta = (tipo) => (tipo === 'clinica' ? 'clinica' : 'profesional');
export const armarLinkPerfil = (tipo, slug) => `${DOMINIO}/${tramoRuta(tipo)}/${slug}`;
// El que se ve escrito en la imagen: sin https:// ni www para que sea corto
const armarLinkCorto = (tipo, slug) => `portalveterinario.ar/${tramoRuta(tipo)}/${slug}`;

// "María González" → "MG"
export const iniciales = (nombre) => {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'PV';
  const primera = partes[0][0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + ultima).toUpperCase();
};

// ==========================================
// DIBUJO DE LA IMAGEN (canvas 1080 x 1920)
// ==========================================

// Carga la foto pidiendo permiso (CORS). Si falla, reintenta una vez y si no, devuelve null (se usan las iniciales)
export const cargarImagen = (url) => new Promise((resolve) => {
  if (!url) { resolve(null); return; }
  const intentar = (src, reintento) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (!reintento && !src.startsWith('data:')) {
        // El navegador a veces guarda la foto sin permisos: pedimos una copia nueva
        intentar(`${src}${src.includes('?') ? '&' : '?'}cb=${Date.now()}`, true);
      } else {
        resolve(null);
      }
    };
    img.src = src;
  };
  intentar(url, false);
});

// Rectángulo con esquinas redondeadas (se arma a mano para que funcione en todos los navegadores)
export const rectRedondeado = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Burbuja suave desenfocada (un círculo con degradé hacia transparente)
const burbuja = (ctx, x, y, radio, color) => {
  const degrade = ctx.createRadialGradient(x, y, 0, x, y, radio);
  degrade.addColorStop(0, color);
  degrade.addColorStop(1, 'rgba(77,182,172,0)');
  ctx.fillStyle = degrade;
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fill();
};

// Parte un texto en renglones que entren en el ancho máximo
export const partirLineas = (ctx, texto, anchoMax) => {
  const palabras = String(texto).split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = '';
  palabras.forEach((palabra) => {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (!actual || ctx.measureText(prueba).width <= anchoMax) {
      actual = prueba;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  });
  if (actual) lineas.push(actual);
  return lineas;
};

// Achica la letra de a poco hasta que el texto entre en el ancho y en la cantidad de renglones permitida
export const ajustarTexto = (ctx, texto, armarFuente, tamMax, tamMin, anchoMax, maxLineas) => {
  let tam = tamMax;
  while (tam >= tamMin) {
    ctx.font = armarFuente(tam);
    const lineas = partirLineas(ctx, texto, anchoMax);
    if (lineas.length <= maxLineas && lineas.every((l) => ctx.measureText(l).width <= anchoMax)) {
      return { tam, lineas };
    }
    tam -= 2;
  }
  ctx.font = armarFuente(tamMin);
  return { tam: tamMin, lineas: partirLineas(ctx, texto, anchoMax).slice(0, maxLineas) };
};

const generarImagen = async ({ tipo, slug, nombre, subtitulo, foto }) => {
  // Esperamos a que las tipografías estén listas, si no el dibujo sale con otra letra
  try {
    await Promise.all([
      document.fonts.load('800 60px Montserrat'),
      document.fonts.load('900 60px Montserrat'),
      document.fonts.load('600 36px Inter'),
      document.fonts.load('700 36px Inter')
    ]);
  } catch (e) { /* si falla, se usa la letra del sistema */ }

  const imagenFoto = await cargarImagen(foto);
  if (foto && !imagenFoto) console.warn('CompartirPerfil: no se pudo cargar la foto (puede ser un tema de permisos CORS en Firebase Storage):', foto);
  const esClinica = tipo === 'clinica';

  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // ----- Fondo Petróleo con burbujas -----
  ctx.fillStyle = '#1A3D3D';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  burbuja(ctx, 920, 240, 560, 'rgba(77,182,172,0.30)');
  burbuja(ctx, 110, 1040, 520, 'rgba(45,106,106,0.60)');
  burbuja(ctx, 950, 1700, 480, 'rgba(77,182,172,0.20)');

  // ----- Marca arriba -----
  ctx.font = '800 44px Montserrat, sans-serif';
  const anchoMarca = ctx.measureText('Portal Veterinario').width;
  const anchoPunto = ctx.measureText('.').width;
  const inicioMarca = (ANCHO - (anchoMarca + anchoPunto)) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Portal Veterinario', inicioMarca, 280);
  ctx.fillStyle = '#4DB6AC';
  ctx.fillText('.', inicioMarca + anchoMarca, 280);
  ctx.textAlign = 'center';

  // ----- Foto o iniciales -----
  const cx = ANCHO / 2;
  const cy = 650;
  const radio = 190;
  ctx.beginPath();
  ctx.arc(cx, cy, radio + 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radio, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (imagenFoto && esClinica) {
    // Logos de clínicas: sobre fondo blanco y enteros (sin recortar)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - radio, cy - radio, radio * 2, radio * 2);
    const lado = radio * 2 * 0.78;
    const escala = Math.min(lado / imagenFoto.width, lado / imagenFoto.height);
    const ancho = imagenFoto.width * escala;
    const alto = imagenFoto.height * escala;
    ctx.drawImage(imagenFoto, cx - ancho / 2, cy - alto / 2, ancho, alto);
  } else if (imagenFoto) {
    // Fotos de personas: llenan el círculo
    const escala = Math.max((radio * 2) / imagenFoto.width, (radio * 2) / imagenFoto.height);
    const ancho = imagenFoto.width * escala;
    const alto = imagenFoto.height * escala;
    ctx.drawImage(imagenFoto, cx - ancho / 2, cy - alto / 2, ancho, alto);
  } else {
    ctx.fillStyle = '#2D6A6A';
    ctx.fillRect(cx - radio, cy - radio, radio * 2, radio * 2);
  }
  ctx.restore();

  if (!imagenFoto) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 140px Montserrat, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(iniciales(nombre), cx, cy + 6);
    ctx.textBaseline = 'top';
  }

  // ----- Nombre -----
  let y = 920;
  const bloqueNombre = ajustarTexto(ctx, String(nombre || '').toUpperCase(), (t) => `800 ${t}px Montserrat, sans-serif`, 72, 40, 900, 2);
  ctx.font = `800 ${bloqueNombre.tam}px Montserrat, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  bloqueNombre.lineas.forEach((linea, i) => ctx.fillText(linea, ANCHO / 2, y + i * bloqueNombre.tam * 1.15));
  y += bloqueNombre.lineas.length * bloqueNombre.tam * 1.15 + 16;

  // ----- Especialidad (profesionales) o ubicación (clínicas) -----
  if (subtitulo) {
    const bloqueSub = ajustarTexto(ctx, subtitulo, (t) => `600 ${t}px Inter, sans-serif`, 38, 24, 880, 2);
    ctx.font = `600 ${bloqueSub.tam}px Inter, sans-serif`;
    ctx.fillStyle = '#4DB6AC';
    bloqueSub.lineas.forEach((linea, i) => ctx.fillText(linea, ANCHO / 2, y + i * bloqueSub.tam * 1.25));
    y += bloqueSub.lineas.length * bloqueSub.tam * 1.25;
  }

  // ----- Frase destacada en un panel de vidrio -----
  const frase = esClinica
    ? 'Mirá nuestra página completa en la Cartilla Veterinaria'
    : 'Mirá mi perfil completo en la Cartilla Veterinaria';
  const bloqueFrase = ajustarTexto(ctx, frase, (t) => `800 ${t}px Montserrat, sans-serif`, 50, 32, 760, 3);
  const altoLinea = bloqueFrase.tam * 1.25;
  const altoPanel = bloqueFrase.lineas.length * altoLinea + 90;
  const panelY = Math.max(y + 50, 1200);
  rectRedondeado(ctx, 90, panelY, 900, altoPanel, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.stroke();
  ctx.font = `800 ${bloqueFrase.tam}px Montserrat, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  bloqueFrase.lineas.forEach((linea, i) => ctx.fillText(linea, ANCHO / 2, panelY + 45 + i * altoLinea));

  // ----- Link del perfil en una píldora Esmeralda -----
  const linkCorto = armarLinkCorto(tipo, slug);
  const bloqueLink = ajustarTexto(ctx, linkCorto, (t) => `700 ${t}px Inter, sans-serif`, 38, 22, 820, 1);
  ctx.font = `700 ${bloqueLink.tam}px Inter, sans-serif`;
  const anchoPildora = Math.min(ctx.measureText(linkCorto).width + 90, 960);
  const pildoraY = Math.min(panelY + altoPanel + 40, 1560);
  rectRedondeado(ctx, (ANCHO - anchoPildora) / 2, pildoraY, anchoPildora, 92, 46);
  ctx.fillStyle = '#2D6A6A';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(linkCorto, ANCHO / 2, pildoraY + 48);
  ctx.textBaseline = 'top';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve({ blob, fotoUsada: !!imagenFoto }) : reject(new Error('No se pudo armar la imagen'))), 'image/png');
  });
};

// ==========================================
// ESTILOS DE LOS BOTONES
// ==========================================
const BASE_BOTON = 'rounded-xl text-[12px] font-black uppercase tracking-[0.15em] transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';
const CLASES_BOTON = {
  principal: 'bg-[#2D6A6A] text-white shadow-md hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl',
  secundario: 'bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#2D6A6A] hover:text-[#2D6A6A]',
  glass: 'bg-white/15 border border-white/20 text-white hover:bg-white/25 hover:-translate-y-0.5'
};
export const armarClaseBoton = (variante, soloIcono, className) =>
  `${BASE_BOTON} ${CLASES_BOTON[variante] || CLASES_BOTON.principal} ${soloIcono ? 'p-2.5' : 'px-5 py-3.5'} ${className}`;

// Copia un texto al portapapeles (con plan B para navegadores viejos)
const copiarAlPortapapeles = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    try {
      const temporal = document.createElement('textarea');
      temporal.value = texto;
      document.body.appendChild(temporal);
      temporal.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(temporal);
      return !!ok;
    } catch (e2) {
      return false;
    }
  }
};

// ==========================================
// VENTANA PARA COMPARTIR (dueño del perfil)
// ==========================================
export default function CompartirPerfil({ abierto, onCerrar, tipo = 'profesional', slug, nombre, subtitulo, foto, sinGuardar = false }) {
  const [generando, setGenerando] = useState(false);
  const [imagenUrl, setImagenUrl] = useState('');
  const [errorImagen, setErrorImagen] = useState(false);
  const [puedeCompartirArchivo, setPuedeCompartirArchivo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [fotoFallo, setFotoFallo] = useState(false);
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const archivoRef = useRef(null);

  const esClinica = tipo === 'clinica';
  const link = slug ? armarLinkPerfil(tipo, slug) : '';
  const mensaje = esClinica
    ? `¡Ya estamos en la Cartilla Veterinaria! 🐾\nMirá la página completa de ${nombre} acá: ${link}`
    : `¡Ya tengo mi perfil en la Cartilla Veterinaria! 🐾\nMirá mi perfil completo acá: ${link}`;

  // Cada vez que se abre la ventana, armamos la imagen con los datos actuales
  useEffect(() => {
    if (!abierto || !slug) return undefined;
    let cancelado = false;
    let urlObjeto = '';
    setGenerando(true);
    setErrorImagen(false);
    setImagenUrl('');

    (async () => {
      let resultado = null;
      try {
        resultado = await generarImagen({ tipo, slug, nombre, subtitulo, foto });
      } catch (e) {
        console.error('Error armando la imagen, reintentamos sin foto:', e);
        try { resultado = await generarImagen({ tipo, slug, nombre, subtitulo, foto: '' }); } catch (e2) { resultado = null; }
      }
      if (cancelado) return;
      if (!resultado) { setErrorImagen(true); setGenerando(false); return; }
      const { blob, fotoUsada } = resultado;
      setFotoFallo(!!foto && !fotoUsada);

      urlObjeto = URL.createObjectURL(blob);
      let archivo = null;
      try { archivo = new File([blob], `portal-veterinario-${slug}.png`, { type: 'image/png' }); } catch (e) { archivo = null; }
      archivoRef.current = archivo;
      setImagenUrl(urlObjeto);
      setPuedeCompartirArchivo(!!(archivo && navigator.share && navigator.canShare && navigator.canShare({ files: [archivo] })));
      setGenerando(false);
    })();

    return () => {
      cancelado = true;
      if (urlObjeto) URL.revokeObjectURL(urlObjeto);
    };
  }, [abierto, slug, tipo, nombre, subtitulo, foto]);

  // Mientras la ventana está abierta, la página de atrás no se mueve
  useEffect(() => {
    if (!abierto) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [abierto]);

  // Al abrir, intentamos dejar el link copiado solo (si el navegador no deja, se copia al descargar o compartir)
  useEffect(() => {
    if (!abierto || !link) return;
    setLinkCopiado(false);
    copiarAlPortapapeles(link).then((ok) => { if (ok) setLinkCopiado(true); });
  }, [abierto, link]);

  if (!abierto) return null;

  // Copia el link sin que la persona tenga que hacer nada extra
  const copiarLinkAuto = () => {
    copiarAlPortapapeles(link).then((ok) => { if (ok) setLinkCopiado(true); });
  };

  const descargar = () => {
    if (!imagenUrl) return;
    const enlace = document.createElement('a');
    enlace.href = imagenUrl;
    enlace.download = `portal-veterinario-${slug}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    copiarLinkAuto();
  };

  // Menú nativo del celular: va la imagen y el mensaje. El link también queda copiado, por si la app no toma el texto
  const compartirNativo = () => {
    if (!archivoRef.current || !navigator.share) return;
    copiarLinkAuto();
    navigator.share({ files: [archivoRef.current], text: mensaje }).catch(() => {});
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[1000] overflow-y-auto overscroll-contain" onClick={onCerrar}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>

          {/* CABECERA */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
            <div>
              <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">{esClinica ? 'Compartí la página de tu clínica' : 'Compartí tu perfil'}</h3>
              <p className="text-sm text-[#666666] mt-1 leading-relaxed">Descargá la imagen para subirla a tus historias o estados. El link se copia solo.</p>
            </div>
            <button type="button" onClick={onCerrar} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors shrink-0" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-[#F4F7F7] p-6 md:p-8 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">

            {/* VISTA PREVIA DE LA IMAGEN */}
            <div className="mx-auto w-full max-w-[220px]">
              <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#1A3D3D]/10 border border-gray-100 shadow-md flex items-center justify-center">
                {generando && <Loader2 className="w-8 h-8 text-[#2D6A6A] animate-spin" />}
                {!generando && imagenUrl && <img src={imagenUrl} alt="Imagen para compartir" className="w-full h-full object-cover" />}
                {!generando && errorImagen && (
                  <p className="text-sm text-[#666666] text-center px-4">No pudimos armar la imagen. Igual el link ya está listo para pegar.</p>
                )}
              </div>
              {slug && fotoFallo && !generando && (
                <div className="mt-4 flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-yellow-700 leading-relaxed">No pudimos cargar tu foto en la imagen, así que usamos tus iniciales.</p>
                </div>
              )}
            </div>

            {/* ACCIONES */}
            <div className="flex flex-col gap-3">
              {!slug && (
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-yellow-700 leading-relaxed">Todavía no tenés link. Guardá tu perfil por primera vez y vas a poder compartirlo.</p>
                </div>
              )}

              {slug && (
                <>
                  {puedeCompartirArchivo && (
                    <>
                      <button type="button" onClick={compartirNativo} disabled={generando || !imagenUrl} className={armarClaseBoton('principal', false, 'w-full')}>
                        <Share2 className="w-4 h-4" /> Compartir en historias o estados
                      </button>
                      <p className="text-[15px] text-[#666666] -mt-1 leading-snug">Se abre el menú de tu celular: elegí Instagram → Historias, o WhatsApp → Mi estado.</p>
                    </>
                  )}

                  <button type="button" onClick={descargar} disabled={generando || !imagenUrl} className={armarClaseBoton(puedeCompartirArchivo ? 'secundario' : 'principal', false, 'w-full')}>
                    <Download className="w-4 h-4" /> Descargar imagen
                  </button>

                  {linkCopiado && (
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#2D6A6A]">
                      <Check className="w-4 h-4" /> Link de tu perfil copiado
                    </p>
                  )}

                  {/* GUÍA PARA LA BIO DE INSTAGRAM */}
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <button type="button" onClick={() => setGuiaAbierta(!guiaAbierta)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
                      <span className="flex items-center gap-2 text-sm font-bold text-[#1A3D3D]">
                        <Instagram className="w-4 h-4 text-[#2D6A6A]" /> Sumá el link de tu perfil a tu bio de Instagram
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${guiaAbierta ? 'rotate-180 text-[#2D6A6A]' : ''}`} />
                    </button>
                    {guiaAbierta && (
                      <div className="px-4 pb-4 text-sm text-[#666666] leading-relaxed animate-in fade-in duration-200">
                        <ol className="list-decimal pl-5 space-y-1.5">
                          <li>Copiá tu link (se copia solo al descargar o compartir): <span className="font-bold text-[#1A3D3D] break-all select-all">{link}</span></li>
                          <li>{esClinica ? 'En el Instagram de la clínica: Editar perfil → Enlaces → Agregar enlace externo.' : 'En Instagram: Editar perfil → Enlaces → Agregar enlace externo.'}</li>
                          <li>Pegalo, guardá y listo: quien los busque llega directo al perfil.</li>
                        </ol>
                        {esClinica && (
                          <p className="mt-3">También sirve para su ficha de Google: en Maps, editá el perfil de la clínica y pegalo en "Sitio web".</p>
                        )}
                        <p className="mt-3">Si subís la imagen a una historia, sumale el sticker "Enlace" y pegá el link ahí (Instagram no deja links clickeables dentro de la imagen).</p>
                        <a href="https://www.instagram.com/accounts/edit/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-[#2D6A6A] font-bold hover:text-[#1A3D3D] transition-colors">
                          <Link2 className="w-4 h-4" /> Abrir Instagram
                        </a>
                      </div>
                    )}
                  </div>

                  {/* MENSAJE PARA MANDAR POR WHATSAPP */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mensaje listo para mandar</p>
                    <p className="text-sm text-[#333333] font-medium leading-relaxed whitespace-pre-line break-all mb-3">{mensaje}</p>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`${BASE_BOTON} px-5 py-3.5 w-full bg-white border border-gray-200 text-[#1A3D3D] hover:border-[#25D366] hover:text-[#20b858]`}
                    >
                      <MessageCircle className="w-4 h-4" /> Mandar por WhatsApp
                    </a>
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// BOTÓN PARA EL DUEÑO DEL PERFIL (abre la ventana de arriba)
// variante: 'principal' | 'secundario' | 'glass' (para fondos oscuros)
// soloIcono: muestra solo el ícono (útil en columnas de redes)
// ==========================================
export function BotonCompartirPerfil({ variante = 'principal', texto = 'Compartir mi perfil', soloIcono = false, className = '', ...datos }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title={soloIcono ? texto : undefined}
        aria-label={texto}
        className={armarClaseBoton(variante, soloIcono, className)}
      >
        <Share2 className={soloIcono ? 'w-5 h-5' : 'w-4 h-4'} />
        {!soloIcono && texto}
      </button>
      <CompartirPerfil abierto={abierto} onCerrar={() => setAbierto(false)} {...datos} />
    </>
  );
}

// ==========================================
// BOTÓN PARA VISITANTES (perfil de otra persona)
// Menú nativo si existe; si no, copia el link
// ==========================================
export function BotonCompartirLink({ titulo, texto, url, variante = 'glass', soloIcono = false, etiqueta = 'Compartir', className = '' }) {
  const [copiado, setCopiado] = useState(false);

  const compartir = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch (e) {
        // Si cerró el menú a propósito, no hacemos nada más
        if (e && e.name === 'AbortError') return;
      }
    }
    await copiarAlPortapapeles(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const textoBoton = copiado ? '¡Link copiado!' : etiqueta;
  return (
    <button
      type="button"
      onClick={compartir}
      title={soloIcono ? textoBoton : undefined}
      aria-label={etiqueta}
      className={armarClaseBoton(variante, soloIcono, className)}
    >
      {copiado ? <Check className={soloIcono ? 'w-5 h-5' : 'w-4 h-4'} /> : <Share2 className={soloIcono ? 'w-5 h-5' : 'w-4 h-4'} />}
      {!soloIcono && textoBoton}
    </button>
  );
}