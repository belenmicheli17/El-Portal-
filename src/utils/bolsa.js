// Ayudantes de la Bolsa de Trabajo (se usan en la página, los formularios y la postulación)
import { ROLES, SOLO_VERIFICADOS, DIAS_DE_VIGENCIA } from '../data/bolsaOpciones';
import { armarLinkWhatsapp } from './whatsapp';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const SITIO = 'https://www.portalveterinario.ar';
export const UN_DIA = 24 * 60 * 60 * 1000;
export const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';

export const etiquetaRol = (id) => ROLES.find((r) => r.id === id)?.label || 'Veterinario/a';

// Perfil público de quien se postula: primero busca en profesionales y, si no está, en alumnos.
// Devuelve null si no encuentra nada; a los alumnos/as les suma esAlumnx: true.
export const leerPerfilPostulante = async (uid) => {
  const snapPro = await getDoc(doc(db, 'profesionales', uid));
  if (snapPro.exists()) return snapPro.data();
  const snapAlumno = await getDoc(doc(db, 'alumnos', uid));
  return snapAlumno.exists() ? { ...snapAlumno.data(), esAlumnx: true } : null;
};

// Etiqueta de una cuenta de estudiante (ya no depende de cómo se identifica)
export const etiquetaAlumnx = () => 'Estudiante';

// Título corto del puesto: "Ecografía · Cardiología" para veterinarios, o el rol para los demás
export const tituloPuesto = (oferta) => {
  // Si la clínica escribió el nombre del puesto (ej: «Director/a técnico/a»), ese es el título
  const propio = String(oferta?.puestoTexto || '').trim();
  if (propio) return propio;
  const areas = Array.isArray(oferta?.areas) ? oferta.areas : [];
  if (oferta?.rol === 'veterinario' && areas.length > 0) return areas.join(' · ');
  return etiquetaRol(oferta?.rol);
};

// Convierte un Timestamp de Firebase, una fecha o milisegundos a milisegundos
export const aMilisegundos = (valor) => {
  if (!valor) return 0;
  if (typeof valor === 'number') return valor;
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
};

// "Publicado hoy", "Publicado ayer", "Publicado hace 5 días"
export const publicadoHace = (valor) => {
  const texto = tiempoDesde(valor);
  if (texto === 'Recién publicada') return 'Recién publicado';
  return `Publicado ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`;
};

// "Hoy", "Ayer", "Hace 5 días", "Hace 2 semanas"
export const tiempoDesde = (valor) => {
  const ms = aMilisegundos(valor);
  if (!ms) return 'Recién publicada';
  const dias = Math.floor((Date.now() - ms) / UN_DIA);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 14) return `Hace ${dias} días`;
  return `Hace ${Math.floor(dias / 7)} semanas`;
};

export const diasRestantes = (item) => Math.ceil((aMilisegundos(item?.vencimientoMillis) - Date.now()) / UN_DIA);

export const estaVencida = (item) => aMilisegundos(item?.vencimientoMillis) <= Date.now();

// Se ve en la lista pública: activa y sin vencer
export const estaVigente = (item) => item?.estado === 'activo' && !estaVencida(item);

export const nuevoVencimiento = () => Date.now() + DIAS_DE_VIGENCIA * UN_DIA;

// Qué puede hacer la persona en la Bolsa según su cuenta
export const permisosBolsa = (currentUser) => {
  const esAdmin = currentUser?.uid === ADMIN_UID || currentUser?.rol === 'admin';
  const verificada = esAdmin || !SOLO_VERIFICADOS || currentUser?.estado === 'activo';
  const suspendida = currentUser?.estado === 'suspendido';
  return {
    conSesion: !!currentUser,
    esAdmin,
    verificada,
    // Publicar se puede aunque la cuenta no esté verificada: queda "en espera" y sale cuando la verificamos
    puedePublicarOferta: !!currentUser && (currentUser.rol === 'clinica' || esAdmin) && !suspendida,
    // Profesionales y alumnos/as (los alumnos/as figuran como asistentes)
    puedeMarcarseDisponible: !!currentUser && ['profesional', 'alumnx'].includes(currentUser.rol) && !suspendida,
    publicaEnEspera: !verificada,
    // Postularse (contactar a una clínica) sí pide la cuenta verificada
    puedePostularse: !!currentUser && ['profesional', 'alumnx'].includes(currentUser.rol) && verificada,
    // Los alumnos/as solo se postulan a las búsquedas de asistente
    esAlumnx: currentUser?.rol === 'alumnx'
  };
};

// Lista plana de servicios del perfil (el perfil los guarda agrupados)
export const serviciosDePerfil = (data) => {
  const servicios = data?.servicios;
  if (!servicios) return [];
  if (Array.isArray(servicios)) return servicios.map((s) => (typeof s === 'string' ? s : s?.titulo)).filter(Boolean);
  return Object.values(servicios)
    .filter((g) => g?.activo)
    .flatMap((g) => [...(g.subOpcionesSeleccionadas || []), ...(g.serviciosPersonalizados || [])]);
};

export const conPrefijo54 = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.startsWith('54') ? digitos : `54${digitos}`;
};

export const linkWhatsapp = (numero, mensaje) => armarLinkWhatsapp(conPrefijo54(numero), mensaje);

export const linkPerfilProfesional = (slug) => (slug ? `${SITIO}/profesional/${slug}` : '');
export const linkPerfilAlumnx = (slug) => (slug ? `${SITIO}/alumno/${slug}` : '');

// Link propio de cada oferta (abre la oferta en la Bolsa; los links viejos con ?oferta= siguen andando)
export const linkOferta = (id) => `${SITIO}/bolsa-de-trabajo/oferta/${id}`;

// Link a la postulación de una persona a una oferta (la clínica la abre y ve el CV ahí mismo)
export const linkPostulacion = (ofertaId, uid) => `${SITIO}/postulacion/${ofertaId}_${uid}`;

// Link a la página del currículum (para la ficha de "disponible", cuando la persona elige mostrarlo)
export const linkCV = (ruta) => (ruta ? `${SITIO}/cv/${String(ruta).replace(/^cvs\//, '')}` : '');
// Dirección para mostrar, sin código postal ni país: "Av. Yrigoyen 8017, B1828 CGL, Argentina" → "Av. Yrigoyen 8017"
export const direccionCorta = (direccion) => String(direccion || '')
  .split(',').map((p) => p.trim()).filter(Boolean)
  .filter((p) => !/^argentina$/i.test(p) && !/^provincia de\s/i.test(p))
  .map((p) => p.replace(/^[A-Z]?\d{4}(?:\s?[A-Z]{3}(?![a-zA-Z]))?\s*/, ''))
  .filter(Boolean)
  .join(', ');

// Provincia prolija: "Provincia de Buenos Aires" → "Buenos Aires", "Ciudad Autónoma de Buenos Aires" → "CABA"
export const provinciaCorta = (provincia) => {
  const p = String(provincia || '').trim();
  if (/ciudad aut[oó]noma|^capital federal/i.test(p)) return 'CABA';
  return p.replace(/^provincia de\s+/i, '');
};

// Ubicación corta, sin calle ni código postal: "Castelar · Zona Oeste", "Palermo · CABA", "Rosario · Santa Fe"
// En la provincia de Buenos Aires se muestra la zona (Norte, Sur, Oeste...) en vez de la provincia
export const zonaTexto = (item) => {
  const lugar = String(item?.barrio || item?.localidad || '').trim();
  let region = provinciaCorta(item?.provincia);
  if (region === 'Buenos Aires' && item?.zonaBA) region = item.zonaBA;
  if (lugar && region && lugar.toLowerCase() === region.toLowerCase()) return lugar;
  return [lugar, region].filter(Boolean).join(' · ');
};

// Link para abrir la dirección en Google Maps
export const linkMapa = (item) => {
  if (!item?.direccion && !(item?.lat && item?.lng)) return '';
  const consulta = item.direccion || `${item.lat},${item.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}${item.placeId ? `&query_place_id=${item.placeId}` : ''}`;
};

// ---------- Mensajes de WhatsApp / mail ya escritos ----------
// Profesional → clínica (al postularse). El cierre depende de si manda CV o su perfil.
export const mensajePostulacion = (nombre) => `Hola, soy ${nombre || 'veterinario/a'}. Vi la búsqueda de personal que publicaron en Portal Veterinario y me gustaría postularme.`;
export const cierrePostulacion = ({ postulacionUrl, perfilUrl }) => {
  if (postulacionUrl) return `Podés ver mi postulación y mi currículum acá: ${postulacionUrl}\n\n¡Muchas gracias!`;
  if (perfilUrl) return `Pueden ver mi portfolio desde este link: ${perfilUrl}\n\n¡Muchas gracias!`;
  return '¡Muchas gracias!';
};

// Clínica (o colega) → profesional disponible
export const mensajeAProfesional = (nombreProfesional, quienEscribe) => {
  const saludo = `Hola${nombreProfesional ? ` ${nombreProfesional.split(' ')[0]}` : ''}`;
  const desde = quienEscribe ? `, te escribimos de ${quienEscribe}` : '';
  return `${saludo}${desde}. Vimos en Portal Veterinario que estás disponible para trabajar y nos gustaría hablar con vos.`;
};
// ---------- Imagen para difundir una oferta (1080 x 1920, formato historia 9:16) ----------
const FUENTE_TITULO = 'Montserrat, sans-serif';
const FUENTE_TEXTO = 'Inter, sans-serif';
const RUTA_IMAGENES = '/bolsa-imagen';
const ARCHIVO_LOGO = 'logo-portal-veterinario.svg';
const ARCHIVO_PERSONAJE = 'veterinario-con-planilla-v2.svg';
const PUESTOS_IMAGEN = { veterinario: 'Veterinario/a', asistente: 'Asistente', peluquero: 'Peluquero/a', recepcion: 'Recepción', alumno: 'Estudiante' };

// Zona para el texto: CABA, zona grande del Gran Buenos Aires, o la ciudad
export const zonaParaImagen = (oferta) => {
  const prov = provinciaCorta(oferta?.provincia);
  if (prov === 'CABA') return 'CABA';
  if (prov === 'Buenos Aires') {
    if (['Zona Norte', 'Zona Sur', 'Zona Oeste'].includes(oferta?.zonaBA)) return oferta.zonaBA;
    return String(oferta?.localidad || oferta?.barrio || 'Buenos Aires').trim();
  }
  return String(oferta?.localidad || prov || '').trim();
};

// Especialidades (máximo 2) o el puesto, para el texto grande de la imagen
const especialidadesParaImagen = (oferta) => {
  // Nombre del puesto escrito por la clínica (ej: «Director/a técnico/a»)
  const propio = String(oferta?.puestoTexto || '').trim();
  if (propio) return [propio];
  const areas = Array.isArray(oferta?.areas) ? oferta.areas.filter(Boolean) : [];
  if (oferta?.rol === 'veterinario' && areas.length > 0) {
    const lista = areas.slice(0, 2);
    if (areas.length > 2) lista[1] = `${lista[1]}…`;
    return lista;
  }
  return [PUESTOS_IMAGEN[oferta?.rol] || 'Veterinario/a'];
};

// Lo que se copia al portapapeles: solo el link de la oferta (para pegarlo como sticker en la historia)
export const textoParaCompartir = (oferta) => linkOferta(oferta.id);

const cargarImagen = (src, conCors = false) => new Promise((resolver) => {
  if (!src) { resolver(null); return; }
  const img = new Image();
  if (conCors) img.crossOrigin = 'anonymous';
  img.onload = () => resolver(img);
  img.onerror = () => resolver(null);
  img.src = src;
});

const partirEnRenglones = (ctx, texto, ancho) => {
  const renglones = [];
  let actual = '';
  texto.split(/\s+/).filter(Boolean).forEach((palabra) => {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && ctx.measureText(prueba).width > ancho) { renglones.push(actual); actual = palabra; } else actual = prueba;
  });
  if (actual) renglones.push(actual);
  return renglones;
};

const cortarConPuntos = (ctx, texto, ancho) => {
  let t = texto;
  while (t && ctx.measureText(`${t}…`).width > ancho) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
};

// Busca el tamaño más grande en que el texto entra; si no entra, lo corta con «…»
const ajustarTexto = (ctx, texto, peso, familia, tamanos, ancho, maxRenglones) => {
  for (const tam of tamanos) {
    ctx.font = `${peso} ${tam}px ${familia}`;
    const renglones = partirEnRenglones(ctx, texto, ancho);
    if (renglones.length <= maxRenglones && renglones.every((r) => ctx.measureText(r).width <= ancho)) return { tam, renglones, entra: true };
  }
  const tam = tamanos[tamanos.length - 1];
  ctx.font = `${peso} ${tam}px ${familia}`;
  const renglones = partirEnRenglones(ctx, texto, ancho).slice(0, maxRenglones);
  renglones[renglones.length - 1] = cortarConPuntos(ctx, renglones[renglones.length - 1] || '', ancho);
  return { tam, renglones, entra: false };
};

const ajustarEspecialidad = (ctx, texto) => {
  for (const tam of [84, 72, 64]) {
    ctx.font = `700 ${tam}px ${FUENTE_TITULO}`;
    if (ctx.measureText(texto).width <= 600) return { tam, renglones: [texto] };
  }
  return ajustarTexto(ctx, texto, 700, FUENTE_TITULO, [64], 600, 2);
};

// Dibuja la imagen de una oferta y devuelve un PNG
export const generarImagenOferta = async (oferta) => {
  const NARANJA = '#F29B24';

  await Promise.all(['700 84px Montserrat', '700 32px Inter', '500 36px Inter', '600 36px Inter', '700 40px Inter'].map((f) => document.fonts.load(f, '¿Tenés algún búsqueda·…?')));
  const [logo, personaje, fotoClinica] = await Promise.all([
    cargarImagen(`${RUTA_IMAGENES}/${ARCHIVO_LOGO}`),
    cargarImagen(`${RUTA_IMAGENES}/${ARCHIVO_PERSONAJE}`),
    cargarImagen(oferta?.clinicaFoto, true)
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Fondo
  const degradado = ctx.createLinearGradient(0, 0, 1080, 1920);
  degradado.addColorStop(0, '#FBE7CE');
  degradado.addColorStop(0.5, '#F8F3EA');
  degradado.addColorStop(1, '#DFEEE8');
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, 1080, 1920);

  // Forma detrás del personaje
  ctx.save();
  ctx.translate(845, 1240);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.roundRect(-175, -500, 350, 1000, 175); ctx.fill();
  ctx.restore();

  // Personaje: se ajusta a la caja sin deformarse y apoyado abajo
  if (personaje) {
    const caja = { x: 680, y: 760, ancho: 330, alto: 940 };
    const anchoOriginal = personaje.naturalWidth || personaje.width || caja.ancho;
    const altoOriginal = personaje.naturalHeight || personaje.height || caja.alto;
    const escala = Math.min(caja.ancho / anchoOriginal, caja.alto / altoOriginal);
    const ancho = anchoOriginal * escala;
    const alto = altoOriginal * escala;
    ctx.drawImage(personaje, caja.x + (caja.ancho - ancho) / 2, caja.y + caja.alto - alto, ancho, alto);
  }

  // Logo
  if (logo) ctx.drawImage(logo, 80, 90, 220, 72);

  // Píldora «Bolsa de trabajo»
  ctx.font = `700 32px ${FUENTE_TEXTO}`;
  const textoPildora = 'BOLSA DE TRABAJO';
  ctx.fillStyle = '#D8EBE5';
  ctx.beginPath(); ctx.roundRect(80, 222, ctx.measureText(textoPildora).width + 64, 64, 32); ctx.fill();
  ctx.fillStyle = '#284847';
  ctx.fillText(textoPildora, 112, 254);

  // Pregunta fija (si no entra en 920 px, se achica)
  const pregunta = ['¿Tenés algún colega', 'que esté buscando', 'trabajo como'];
  ctx.font = `700 84px ${FUENTE_TITULO}`;
  const masAncho = Math.max(...pregunta.map((l) => ctx.measureText(l).width));
  const tamPregunta = Math.min(84, Math.floor((84 * 920) / masAncho));
  const altoPregunta = tamPregunta * 1.12;
  ctx.font = `700 ${tamPregunta}px ${FUENTE_TITULO}`;
  ctx.fillStyle = '#1F4140';
  pregunta.forEach((linea, i) => ctx.fillText(linea, 80, 352 + altoPregunta * (i + 0.5)));

  // Especialidades con subrayado naranja
  let y = 352 + altoPregunta * 3 + 18;
  especialidadesParaImagen(oferta).forEach((esp) => {
    const { tam, renglones } = ajustarEspecialidad(ctx, esp);
    const alto = tam * 1.12;
    ctx.font = `700 ${tam}px ${FUENTE_TITULO}`;
    ctx.fillStyle = '#2D6A6A';
    renglones.forEach((r, i) => ctx.fillText(r, 80, y + alto * (i + 0.5)));
    const anchoUltimo = ctx.measureText(renglones[renglones.length - 1]).width;
    const arriba = y + alto * renglones.length - 6;
    const esc = anchoUltimo / 100;
    ctx.strokeStyle = NARANJA;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(80 + esc, arriba + 8 * 2.2);
    ctx.quadraticCurveTo(80 + 50 * esc, arriba - 2 * 2.2, 80 + 99 * esc, arriba + 6 * 2.2);
    ctx.stroke();
    y += alto * renglones.length + 30;
  });

  // Zona: «en Zona Oeste?»
  let zona = zonaParaImagen(oferta);
  let tamZona = 72;
  for (const tam of [72, 64, 56]) {
    tamZona = tam;
    ctx.font = `700 ${tam}px ${FUENTE_TITULO}`;
    if (ctx.measureText(`en ${zona}?`).width <= 600) break;
  }
  while (zona.length > 3 && ctx.measureText(`en ${zona}?`).width > 600) zona = `${zona.slice(0, -2).trimEnd()}…`;
  let x = 80;
  [['en ', '#1F4140'], [zona, '#2D6A6A'], ['?', '#1F4140']].forEach(([texto, col]) => {
    ctx.fillStyle = col;
    ctx.fillText(texto, x, y + (tamZona * 1.12) / 2);
    x += ctx.measureText(texto).width;
  });

  // Tarjeta de la clínica: foto o iniciales a la izquierda, nombre y «está en búsqueda» a la derecha
  const FOTO = 104;
  const ANCHO_TARJETA = 600;
  const xTexto = 80 + 36 + FOTO + 28;
  const anchoTexto = 80 + ANCHO_TARJETA - 36 - xTexto;
  const nombre = String(oferta?.clinicaNombre || 'Una clínica del Portal').trim();
  let ajuste = ajustarTexto(ctx, nombre, 700, FUENTE_TITULO, [44], anchoTexto, 2);
  if (!ajuste.entra) ajuste = ajustarTexto(ctx, nombre, 700, FUENTE_TITULO, [38], anchoTexto, 3);
  const altoNombre = ajuste.tam * 1.2;
  const altoContenido = altoNombre * ajuste.renglones.length + 12 + 36 * 1.2;
  const altoCuerpo = Math.max(FOTO, altoContenido);
  const altoTarjeta = 36 + altoCuerpo + 36;
  const arribaTarjeta = Math.min(y + tamZona * 1.12 + 70, 1700 - altoTarjeta);
  ctx.save();
  ctx.shadowColor = 'rgba(31,65,64,0.12)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.roundRect(80, arribaTarjeta, ANCHO_TARJETA, altoTarjeta, 36); ctx.fill();
  ctx.restore();

  // Foto de la clínica (círculo) o iniciales
  const cx = 80 + 36 + FOTO / 2;
  const cy = arribaTarjeta + 36 + altoCuerpo / 2;
  if (fotoClinica) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, FOTO / 2, 0, Math.PI * 2); ctx.clip();
    const escala = Math.max(FOTO / fotoClinica.width, FOTO / fotoClinica.height);
    const ancho = fotoClinica.width * escala;
    const alto = fotoClinica.height * escala;
    ctx.drawImage(fotoClinica, cx - ancho / 2, cy - alto / 2, ancho, alto);
    ctx.restore();
    ctx.strokeStyle = '#E8EFEF';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, FOTO / 2, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.fillStyle = '#1F4140';
    ctx.beginPath(); ctx.arc(cx, cy, FOTO / 2, 0, Math.PI * 2); ctx.fill();
    ctx.font = `700 40px ${FUENTE_TITULO}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(nombre.slice(0, 2).toUpperCase(), cx, cy);
    ctx.textAlign = 'left';
  }

  // Nombre y «está en búsqueda»
  const arribaTexto = arribaTarjeta + 36 + (altoCuerpo - altoContenido) / 2;
  ctx.font = `700 ${ajuste.tam}px ${FUENTE_TITULO}`;
  ctx.fillStyle = '#1F4140';
  ajuste.renglones.forEach((r, i) => ctx.fillText(r, xTexto, arribaTexto + altoNombre * (i + 0.5)));
  const ySub = arribaTexto + altoNombre * ajuste.renglones.length + 12 + (36 * 1.2) / 2;
  ctx.font = `500 36px ${FUENTE_TEXTO}`;
  ctx.fillStyle = '#284847';
  ctx.fillText('está en ', xTexto, ySub);
  const anchoEsta = ctx.measureText('está en ').width;
  ctx.font = `600 36px ${FUENTE_TEXTO}`;
  ctx.fillText('búsqueda', xTexto + anchoEsta, ySub);

  // Firma con flecha naranja hacia abajo
  ctx.strokeStyle = NARANJA;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(98, 1794); ctx.lineTo(98, 1826);
  ctx.moveTo(82, 1810); ctx.lineTo(98, 1826); ctx.lineTo(114, 1810);
  ctx.stroke();
  ctx.font = `700 40px ${FUENTE_TEXTO}`;
  ctx.fillStyle = '#284847';
  ctx.fillText('Postulate desde el enlace y mirá todas', 134, 1780);
  ctx.fillText('las ofertas desde el link en la descripción', 134, 1836);

  return new Promise((resolver) => canvas.toBlob(resolver, 'image/png'));
};