import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2, Loader2, AlertTriangle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { iniciales, cargarImagen, rectRedondeado, ajustarTexto, armarClaseBoton } from './CompartirPerfil';

// =====================================================================
// PIEZA DE BIENVENIDA PARA REDES
// La arma el panel admin cuando se aprueba a un profesional o a una clínica
// (y se puede volver a armar desde la ficha del usuario). Tamaño historia 1080 x 1920.
//  - Profesionales: diseño "certificado" (foto redonda con sello de verificado)
//  - Clínicas: diseño "credencial" (tarjeta inclinada con el logo entero)
// No publica nada: solo descarga o comparte la imagen.
// Va en: src/components/PiezaBienvenida.jsx
// =====================================================================

const ANCHO = 1080;
const ALTO = 1920;
const TEXTO_PILDORA = { profesional: 'Conocé su perfil en portalveterinario.ar', clinica: 'Conocé su página en portalveterinario.ar' };

// Colores de la paleta de redes
const C = {
  titulo: '#1F4140',
  texto: '#284847',
  esmeralda: '#2D6A6A',
  menta: '#DFEEE8',
  mentaOscuro: '#D8EBE5',
  gris: '#F4F7F5',
  naranja: '#F29B24'
};

// ==========================================
// DATOS DEL PERFIL REAL
// ==========================================

// "Mar del Plata, Buenos Aires": provincia sin "Provincia de" y CABA abreviada, como en la página de la clínica
const armarZonaClinica = (perfil) => {
  const limpiar = (t) => String(t || '').replace(/^Provincia de\s+/i, '').replace(/^Ciudad Aut[oó]noma de Buenos Aires$/i, 'CABA').trim();
  const provincia = limpiar(perfil.provincia);
  const localidad = limpiar(perfil.localidad);
  // Si no hay localidad ni provincia, usamos el barrio como último recurso
  if (!localidad && !provincia) return String(perfil.barrio || '').trim();
  // Si la localidad ya es la provincia (ej. CABA), no se repite
  if (localidad && provincia && localidad.toLowerCase() === provincia.toLowerCase()) return localidad;
  return [localidad, provincia].filter(Boolean).join(', ');
};
export const cargarDatosPieza = async (uid, tipo) => {
  const esClinica = tipo === 'clinica';
  const [snapPerfil, snapUsuario] = await Promise.all([
    getDoc(doc(db, esClinica ? 'clinicas' : 'profesionales', uid)),
    getDoc(doc(db, 'usuarios', uid))
  ]);
  const perfil = snapPerfil.exists() ? snapPerfil.data() : {};
  const usuario = snapUsuario.exists() ? snapUsuario.data() : {};
  const nombre = esClinica
    ? (perfil.nombre || usuario.nombre || '')
    : (`${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() || usuario.nombreCompleto || usuario.nombre || '');
  return {
    tipo: esClinica ? 'clinica' : 'profesional',
    slug: usuario.slug || perfil.slug || '',
    nombre,
    // Profesionales: su especialidad. Clínicas: texto fijo.
    subtitulo: esClinica ? 'Clínica veterinaria' : (perfil.especialidad || ''),
    // Solo las clínicas llevan zona: localidad + provincia (el barrio solo no alcanza, "Belgrano" puede ser de cualquier lado)
    zona: esClinica ? armarZonaClinica(perfil) : '',
    foto: perfil.foto || ''
  };
};

// ==========================================
// AYUDANTES DE DIBUJO
// ==========================================

// Degradé circular como el de CSS ("circle at x% y%"): el radio se mide hasta la esquina más lejana
const manchaDegrade = (ctx, xPct, yPct, corte, rgb, alfa) => {
  const cx = ANCHO * xPct;
  const cy = ALTO * yPct;
  const radioLejano = Math.max(
    Math.hypot(cx, cy), Math.hypot(ANCHO - cx, cy), Math.hypot(cx, ALTO - cy), Math.hypot(ANCHO - cx, ALTO - cy)
  );
  const degrade = ctx.createRadialGradient(cx, cy, 0, cx, cy, radioLejano * corte);
  degrade.addColorStop(0, `rgba(${rgb},${alfa})`);
  degrade.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, ANCHO, ALTO);
};

const dibujarFondo = (ctx) => {
  const base = ctx.createLinearGradient(0, 0, 0, ALTO);
  base.addColorStop(0, '#DFEEE8');
  base.addColorStop(0.48, '#F8F3EA');
  base.addColorStop(1, '#FBE7CE');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  manchaDegrade(ctx, 0.12, 0.10, 0.34, '223,238,232', 0.95);
  manchaDegrade(ctx, 0.92, 0.32, 0.30, '251,231,206', 0.9);
  manchaDegrade(ctx, 0.08, 0.78, 0.34, '251,231,206', 0.85);
  manchaDegrade(ctx, 0.94, 0.90, 0.30, '223,238,232', 0.9);
};

// Dibuja un ícono (los mismos de las referencias) a partir de su trazo SVG
const dibujarIcono = (ctx, trazo, x, y, tamano, color, grosor) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(tamano / 24, tamano / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = grosor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  trazo.forEach((t) => ctx.stroke(new Path2D(t)));
  ctx.restore();
};
const ICONO_TILDE = ['M5 12.5l4.5 4.5L19 7.5'];
const ICONO_PIN = ['M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z', 'M14.5 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z'];
const ICONO_FLECHA = ['M5 12h14', 'M13 6l6 6-6 6'];

const dibujarLogo = (ctx, logo) => {
  if (logo) {
    ctx.drawImage(logo, 430, 250, 220, 72);
    return;
  }
  // Plan B: si no carga el logo, va el nombre escrito
  ctx.save();
  ctx.font = '700 44px Montserrat, sans-serif';
  ctx.fillStyle = C.titulo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Portal Veterinario', ANCHO / 2, 286);
  ctx.restore();
};

// Corta con "…" un texto que no entra en el ancho
const acortar = (ctx, texto, anchoMax) => {
  if (ctx.measureText(texto).width <= anchoMax) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > anchoMax) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
};

// Título "Ya es parte de la Cartilla Veterinaria." con la palabra "parte" subrayada en naranja.
// Baja la letra de a poco hasta que todos los renglones entren en el ancho.
const dibujarTitular = (ctx, lineas, tamMax, tamMin, anchoMax, yTop, interlineado) => {
  let tam = tamMax;
  const fuente = (t) => `700 ${t}px Montserrat, sans-serif`;
  while (tam > tamMin) {
    ctx.font = fuente(tam);
    if (lineas.every((l) => ctx.measureText(l).width <= anchoMax)) break;
    tam -= 2;
  }
  ctx.font = fuente(tam);
  ctx.fillStyle = C.titulo;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const alto = tam * interlineado;
  lineas.forEach((linea, i) => {
    const total = ctx.measureText(linea).width;
    const x0 = ANCHO / 2 - total / 2;
    const yCentro = yTop + i * alto + alto / 2;
    ctx.fillText(linea, x0, yCentro);
    const pos = linea.indexOf('parte');
    if (pos >= 0) {
      const xPalabra = x0 + ctx.measureText(linea.slice(0, pos)).width;
      const anchoPalabra = ctx.measureText('parte').width;
      const arriba = yTop + (i + 1) * alto - 8; // el subrayado cuelga 14px bajo la palabra y mide 22px
      const ex = anchoPalabra / 100;
      const ey = 22 / 10;
      ctx.save();
      ctx.strokeStyle = C.naranja;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xPalabra + 1 * ex, arriba + 8 * ey);
      ctx.quadraticCurveTo(xPalabra + 50 * ex, arriba - 2 * ey, xPalabra + 99 * ex, arriba + 6 * ey);
      ctx.stroke();
      ctx.restore();
    }
  });
  return alto * lineas.length;
};

// Nombre: primero intenta en un renglón (de la letra grande a la mínima); si no entra, pasa a dos renglones con letra más chica
const ajustarNombre = (ctx, nombre, anchoMax, maxUna, minUna, maxDos, minDos) => {
  const fuente = (t) => `700 ${t}px Montserrat, sans-serif`;
  for (let t = maxUna; t >= minUna; t -= 2) {
    ctx.font = fuente(t);
    if (ctx.measureText(nombre).width <= anchoMax) return { tam: t, lineas: [nombre] };
  }
  return ajustarTexto(ctx, nombre, fuente, maxDos, minDos, anchoMax, 2);
};

// Botón largo de abajo: "Conocé su perfil en portalveterinario.ar" + flecha
const dibujarPildora = (ctx, y, texto) => {
  ctx.font = '700 34px Inter, sans-serif';
  const anchoTexto = ctx.measureText(texto).width;
  const ancho = 40 + anchoTexto + 20 + 64 + 20;
  const x = (ANCHO - ancho) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(45,106,106,0.25)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 16;
  rectRedondeado(ctx, x, y, ancho, 100, 50);
  ctx.fillStyle = C.esmeralda;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, x + 40, y + 51);
  ctx.beginPath();
  ctx.arc(x + ancho - 20 - 32, y + 50, 32, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  dibujarIcono(ctx, ICONO_FLECHA, x + ancho - 20 - 32 - 17, y + 50 - 17, 34, C.esmeralda, 2.6);
};

// Foto de persona: cuadrada, recortada para llenar
const dibujarFotoLlena = (ctx, img, x, y, w, h) => {
  const escala = Math.max(w / img.width, h / img.height);
  const ancho = img.width * escala;
  const alto = img.height * escala;
  ctx.drawImage(img, x + (w - ancho) / 2, y + (h - alto) / 2, ancho, alto);
};

// Logo de clínica: entero, sin recortar
const dibujarLogoEntero = (ctx, img, x, y, w, h) => {
  const lado = Math.min(w, h) * 0.78;
  const escala = Math.min(lado / img.width, lado / img.height);
  const ancho = img.width * escala;
  const alto = img.height * escala;
  ctx.drawImage(img, x + (w - ancho) / 2, y + (h - alto) / 2, ancho, alto);
};

// ==========================================
// DISEÑO "CERTIFICADO" (profesionales)
// ==========================================
const dibujarCertificado = (ctx, d, imgFoto, logo) => {
  dibujarLogo(ctx, logo);

  // Etiqueta "SE SUMÓ A LA CARTILLA"
  ctx.font = '700 34px Inter, sans-serif';
  const textoChip = 'SE SUMÓ A LA CARTILLA';
  const anchoChip = ctx.measureText(textoChip).width + 64;
  rectRedondeado(ctx, (ANCHO - anchoChip) / 2, 352, anchoChip, 64, 32);
  ctx.fillStyle = C.mentaOscuro;
  ctx.fill();
  ctx.fillStyle = C.texto;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(textoChip, ANCHO / 2, 385);

  dibujarTitular(ctx, ['Ya es parte', 'de la Cartilla', 'Veterinaria.'], 90, 70, 920, 450, 1.1);

  // Foto redonda con borde blanco y una "sombra" menta corrida
  ctx.beginPath();
  ctx.arc(566, 1076, 250, 0, Math.PI * 2);
  ctx.fillStyle = C.mentaOscuro;
  ctx.fill();

  ctx.save();
  ctx.shadowColor = 'rgba(31,65,64,0.14)';
  ctx.shadowBlur = 46;
  ctx.shadowOffsetY = 22;
  ctx.beginPath();
  ctx.arc(540, 1050, 250, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(540, 1050, 236, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = C.menta;
  ctx.fillRect(304, 814, 472, 472);
  if (imgFoto) dibujarFotoLlena(ctx, imgFoto, 304, 814, 472, 472);
  ctx.restore();
  if (!imgFoto) {
    ctx.fillStyle = C.esmeralda;
    ctx.font = '700 170px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iniciales(d.nombre), 540, 1056);
  }

  // Sello "PERFIL VERIFICADO" inclinado
  ctx.save();
  ctx.translate(775, 1265);
  ctx.rotate((10 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(31,65,64,0.18)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 16;
  ctx.beginPath();
  ctx.arc(0, 0, 115, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, Math.PI * 2);
  ctx.fillStyle = C.esmeralda;
  ctx.fill();
  dibujarIcono(ctx, ICONO_TILDE, -26, -59.9, 52, '#FFFFFF', 2.6);
  ctx.font = '700 26px Montserrat, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PERFIL', 0, 15);
  ctx.fillText('VERIFICADO', 0, 45);
  ctx.restore();

  // Nombre (uno o dos renglones) y especialidad
  const nombre = d.nombre || 'Nuevo profesional';
  const bloque = ajustarNombre(ctx, nombre, 920, 72, 44, 56, 36);
  ctx.font = `700 ${bloque.tam}px Montserrat, sans-serif`;
  ctx.fillStyle = C.titulo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const altoLineaNombre = bloque.tam * 1.1;
  bloque.lineas.forEach((l, i) => ctx.fillText(l, ANCHO / 2, 1396 + i * altoLineaNombre + altoLineaNombre / 2));
  const yDesc = 1396 + bloque.lineas.length * altoLineaNombre + 10;
  if (d.subtitulo) {
    const sub = ajustarTexto(ctx, d.subtitulo, (t) => `500 ${t}px Inter, sans-serif`, 44, 26, 880, bloque.lineas.length > 1 ? 1 : 2);
    ctx.font = `500 ${sub.tam}px Inter, sans-serif`;
    ctx.fillStyle = C.texto;
    sub.lineas.forEach((l, i) => ctx.fillText(l, ANCHO / 2, yDesc + i * sub.tam * 1.35 + (sub.tam * 1.35) / 2));
  }

  dibujarPildora(ctx, 1610, TEXTO_PILDORA.profesional);
};

// ==========================================
// DISEÑO "CREDENCIAL" (clínicas)
// ==========================================

// Etiqueta redonda con ícono: devuelve cuánto ancho ocupó
const dibujarEtiqueta = (ctx, x, y, texto, peso, fondo, icono, grosorIcono, anchoTextoMax) => {
  ctx.font = `${peso} 30px Inter, sans-serif`;
  const t = acortar(ctx, texto, anchoTextoMax);
  const ancho = 20 + 34 + 12 + ctx.measureText(t).width + 26;
  rectRedondeado(ctx, x, y, ancho, 64, 32);
  ctx.fillStyle = fondo;
  ctx.fill();
  dibujarIcono(ctx, icono, x + 20, y + 15, 34, C.esmeralda, grosorIcono);
  ctx.fillStyle = C.texto;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(t, x + 20 + 34 + 12, y + 33);
  return ancho;
};

const dibujarCredencial = (ctx, d, imgFoto, logo) => {
  dibujarLogo(ctx, logo);
  dibujarTitular(ctx, ['Ya es parte de la', 'Cartilla Veterinaria.'], 72, 54, 920, 356, 1.12);

  // Qué lleva la tarjeta (se mide antes para que la tarjeta se estire si el nombre ocupa dos renglones)
  const nombre = d.nombre || 'Nueva clínica';
  const bloque = ajustarNombre(ctx, nombre, 688, 62, 40, 44, 30);
  const altoNombre = bloque.tam * 1.1;
  // ¿La zona entra al lado de "Página verificada"? Si no, va abajo en otra fila y el cuadro del logo se achica
  ctx.font = '700 30px Inter, sans-serif';
  const anchoVerificada = 20 + 34 + 12 + ctx.measureText('Página verificada').width + 26;
  ctx.font = '600 30px Inter, sans-serif';
  const anchoZona = d.zona ? 20 + 34 + 12 + ctx.measureText(d.zona).width + 26 : 0;
  const zonaEnOtraFila = !!d.zona && anchoVerificada + 16 + anchoZona > 688;
  const altoCuadro = zonaEnOtraFila ? 688 - 78 : 688;
  const yNombre = 36 + altoCuadro + 26;
  const altoSub = d.subtitulo ? 6 + 38 * 1.35 : 0;
  const yEtiquetas = yNombre + bloque.lineas.length * altoNombre + altoSub + 26;
  const altoTarjeta = Math.min(1040, Math.max(997, yEtiquetas + 64 + (zonaEnOtraFila ? 14 + 64 : 0) + 36));

  // Tarjeta menta de atrás, apenas girada
  ctx.save();
  ctx.translate(560, 582 + altoTarjeta / 2);
  ctx.rotate((3 * Math.PI) / 180);
  rectRedondeado(ctx, -380, -altoTarjeta / 2, 760, altoTarjeta, 48);
  ctx.fillStyle = C.mentaOscuro;
  ctx.fill();
  ctx.restore();

  // Tarjeta blanca de adelante
  ctx.save();
  ctx.translate(540, 560 + altoTarjeta / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.translate(-380, -altoTarjeta / 2);
  ctx.save();
  ctx.shadowColor = 'rgba(31,65,64,0.14)';
  ctx.shadowBlur = 46;
  ctx.shadowOffsetY = 22;
  rectRedondeado(ctx, 0, 0, 760, altoTarjeta, 48);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  // Cuadro del logo (entero, sobre fondo menta)
  ctx.save();
  rectRedondeado(ctx, 36, 36, 688, altoCuadro, 40);
  ctx.clip();
  ctx.fillStyle = C.menta;
  ctx.fillRect(36, 36, 688, altoCuadro);
  if (imgFoto) dibujarLogoEntero(ctx, imgFoto, 36, 36, 688, altoCuadro);
  ctx.restore();
  if (!imgFoto) {
    ctx.fillStyle = C.esmeralda;
    ctx.font = '700 230px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iniciales(d.nombre), 380, 36 + altoCuadro / 2 + 6);
  }

  // Nombre de la clínica
  ctx.font = `700 ${bloque.tam}px Montserrat, sans-serif`;
  ctx.fillStyle = C.titulo;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  bloque.lineas.forEach((l, i) => ctx.fillText(l, 36, yNombre + i * altoNombre + altoNombre / 2));
  if (d.subtitulo) {
    ctx.font = '500 38px Inter, sans-serif';
    ctx.fillStyle = C.texto;
    ctx.fillText(d.subtitulo, 36, yNombre + bloque.lineas.length * altoNombre + 6 + (38 * 1.35) / 2);
  }

  // Etiquetas: verificada + zona
  const ancho1 = dibujarEtiqueta(ctx, 36, yEtiquetas, 'Página verificada', 700, C.mentaOscuro, ICONO_TILDE, 2.6, 400);
  if (d.zona) {
    if (zonaEnOtraFila) dibujarEtiqueta(ctx, 36, yEtiquetas + 64 + 14, d.zona, 600, C.gris, ICONO_PIN, 2.2, 688 - 92);
    else dibujarEtiqueta(ctx, 36 + ancho1 + 16, yEtiquetas, d.zona, 600, C.gris, ICONO_PIN, 2.2, 688 - ancho1 - 16 - 92);
  }
  ctx.restore();

  dibujarPildora(ctx, 1618, TEXTO_PILDORA.clinica);
};

// ==========================================
// ARMADO DE LA IMAGEN
// ==========================================
export const generarPiezaBienvenida = async (d) => {
  // Esperamos a que las tipografías estén listas, si no el dibujo sale con otra letra
  try {
    await Promise.all([
      document.fonts.load('700 90px Montserrat'),
      document.fonts.load('500 40px Inter'),
      document.fonts.load('600 30px Inter'),
      document.fonts.load('700 30px Inter')
    ]);
  } catch (e) { /* si falla, se usa la letra del sistema */ }

  const [imgFoto, logo] = await Promise.all([cargarImagen(d.foto), cargarImagen('/logo-portal-veterinario.svg')]);
  if (d.foto && !imgFoto) console.warn('PiezaBienvenida: no se pudo cargar la foto (puede ser un tema de permisos CORS en Firebase Storage):', d.foto);

  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  dibujarFondo(ctx);
  if (d.tipo === 'clinica') dibujarCredencial(ctx, d, imgFoto, logo);
  else dibujarCertificado(ctx, d, imgFoto, logo);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve({ blob, fotoUsada: !!imgFoto }) : reject(new Error('No se pudo armar la imagen'))), 'image/png');
  });
};

// ==========================================
// VENTANA CON VISTA PREVIA, DESCARGAR Y COMPARTIR
// ==========================================
export default function PiezaBienvenida({ abierto, onCerrar, uid, tipo = 'profesional', nombre = '' }) {
  const [generando, setGenerando] = useState(false);
  const [imagenUrl, setImagenUrl] = useState('');
  const [error, setError] = useState('');
  const [fotoFallo, setFotoFallo] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState('bienvenida.png');
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  const archivoRef = useRef(null);

  // Cada vez que se abre, leemos el perfil real y armamos la imagen
  useEffect(() => {
    if (!abierto || !uid) return undefined;
    let cancelado = false;
    let urlObjeto = '';
    setGenerando(true);
    setError('');
    setImagenUrl('');
    setFotoFallo(false);

    (async () => {
      try {
        const datos = await cargarDatosPieza(uid, tipo);
        let resultado = null;
        try {
          resultado = await generarPiezaBienvenida(datos);
        } catch (e) {
          console.error('Error armando la pieza, reintentamos sin foto:', e);
          resultado = await generarPiezaBienvenida({ ...datos, foto: '' });
        }
        if (cancelado) return;
        const { blob, fotoUsada } = resultado;
        setFotoFallo(!!datos.foto && !fotoUsada);
        const archivoNombre = `bienvenida-${datos.slug || uid}.png`;
        setNombreArchivo(archivoNombre);
        urlObjeto = URL.createObjectURL(blob);
        let archivo = null;
        try { archivo = new File([blob], archivoNombre, { type: 'image/png' }); } catch (e) { archivo = null; }
        archivoRef.current = archivo;
        setPuedeCompartir(!!(archivo && navigator.share && navigator.canShare && navigator.canShare({ files: [archivo] })));
        setImagenUrl(urlObjeto);
      } catch (e) {
        console.error('No se pudo armar la pieza de bienvenida:', e);
        if (!cancelado) setError('No pudimos armar la imagen. Probá de nuevo en un rato.');
      } finally {
        if (!cancelado) setGenerando(false);
      }
    })();

    return () => {
      cancelado = true;
      if (urlObjeto) URL.revokeObjectURL(urlObjeto);
    };
  }, [abierto, uid, tipo]);

  // Mientras la ventana está abierta, la página de atrás no se mueve
  useEffect(() => {
    if (!abierto) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [abierto]);

  if (!abierto) return null;

  const descargar = () => {
    if (!imagenUrl) return;
    const enlace = document.createElement('a');
    enlace.href = imagenUrl;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  // Menú nativo del celular (para subirla a Instagram, por ejemplo)
  const compartir = () => {
    if (!archivoRef.current || !navigator.share) return;
    navigator.share({ files: [archivoRef.current] }).catch(() => {});
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[1000] overflow-y-auto overscroll-contain" onClick={onCerrar}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>

          {/* CABECERA */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
            <div>
              <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Pieza de bienvenida{nombre ? ` · ${nombre}` : ''}</h3>
              <p className="text-sm text-[#666666] mt-1 leading-relaxed">
                {tipo === 'clinica' ? 'Diseño de clínicas' : 'Diseño de profesionales'} · formato historia. No se publica nada solo: la subís vos.
              </p>
            </div>
            <button type="button" onClick={onCerrar} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors shrink-0" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-[#F4F7F7] p-6 md:p-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">

            {/* VISTA PREVIA */}
            <div className="mx-auto w-full max-w-[260px]">
              <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#1A3D3D]/10 border border-gray-100 shadow-md flex items-center justify-center">
                {generando && <Loader2 className="w-8 h-8 text-[#2D6A6A] animate-spin" />}
                {!generando && imagenUrl && <img src={imagenUrl} alt="Pieza de bienvenida" className="w-full h-full object-cover" />}
                {!generando && error && <p className="text-sm text-[#666666] text-center px-4">{error}</p>}
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex flex-col gap-3 justify-center">
              {puedeCompartir && (
                <button type="button" onClick={compartir} disabled={generando || !imagenUrl} className={armarClaseBoton('principal', false, 'w-full')}>
                  <Share2 className="w-4 h-4" /> Compartir imagen
                </button>
              )}
              <button type="button" onClick={descargar} disabled={generando || !imagenUrl} className={armarClaseBoton(puedeCompartir ? 'secundario' : 'principal', false, 'w-full')}>
                <Download className="w-4 h-4" /> Descargar imagen
              </button>
              {puedeCompartir && (
                <p className="text-[15px] text-[#666666] leading-snug">Se abre el menú de tu celular: elegí Instagram → Historias.</p>
              )}
              {fotoFallo && !generando && (
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-yellow-700 leading-relaxed">No pudimos cargar la foto, así que usamos las iniciales.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
