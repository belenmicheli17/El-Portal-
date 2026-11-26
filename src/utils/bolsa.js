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

// Zona para el texto: CABA, zona grande del Gran Buenos Aires, o la ciudad
export const zonaParaImagen = (oferta) => {
  // Lo más preciso posible: barrio o ciudad + algo más amplio (ej: «Palermo, CABA», «Castelar, Zona Oeste»)
  const prov = provinciaCorta(oferta?.provincia);
  const localidad = String(oferta?.localidad || '').trim();
  const barrio = String(oferta?.barrio || '').trim();
  const juntar = (chico, grande) => (chico && grande && chico.toLowerCase() !== grande.toLowerCase() ? `${chico}, ${grande}` : (chico || grande));
  if (prov === 'CABA') return juntar(barrio, 'CABA');
  if (prov === 'Buenos Aires') {
    const zonaBA = ['Zona Norte', 'Zona Sur', 'Zona Oeste'].includes(oferta?.zonaBA) ? oferta.zonaBA : '';
    return juntar(localidad || barrio, zonaBA) || 'Buenos Aires';
  }
  if (barrio && localidad) return juntar(barrio, localidad);
  return juntar(localidad || barrio, prov);
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

// Link a la pestaña de profesionales disponibles de la Bolsa
export const linkDisponibles = () => `${SITIO}/bolsa-de-trabajo?tab=disponibles`;

// ----- Piezas que comparten las dos imágenes -----
const NARANJA = '#F29B24';
const VERDE_OSCURO = '#1F4140';
const VERDE = '#2D6A6A';

// Subrayado a mano alzada debajo de un texto
const subrayar = (ctx, x, y, ancho, color = NARANJA) => {
  const esc = ancho / 100;
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + esc, y + 18);
  ctx.quadraticCurveTo(x + 50 * esc, y + 4, x + 99 * esc, y + 13);
  ctx.stroke();
};

// Foto redonda (o iniciales si no hay foto)
const dibujarFotoRedonda = (ctx, foto, nombre, cx, cy, diametro, colorFondo = VERDE_OSCURO) => {
  if (foto) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, diametro / 2, 0, Math.PI * 2); ctx.clip();
    const escala = Math.max(diametro / foto.width, diametro / foto.height);
    ctx.drawImage(foto, cx - (foto.width * escala) / 2, cy - (foto.height * escala) / 2, foto.width * escala, foto.height * escala);
    ctx.restore();
  } else {
    ctx.fillStyle = colorFondo;
    ctx.beginPath(); ctx.arc(cx, cy, diametro / 2, 0, Math.PI * 2); ctx.fill();
    const iniciales = String(nombre || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || 'PV';
    ctx.font = `700 ${Math.round(diametro * 0.36)}px ${FUENTE_TITULO}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(iniciales, cx, cy);
    ctx.textAlign = 'left';
  }
};

// Pregunta con una flecha naranja que apunta hacia ARRIBA, al lugar libre donde se pega el sticker del enlace.
// Con dibujar=false solo mide (devuelve el alto). anchoMax: hasta dónde puede llegar el texto.
const medidasPregunta = (ctx, pregunta, bajada, anchoMax) => {
  // Preferimos un solo renglón (aunque sea un poco más chico); si no entra, se parte
  const enUno = ajustarTexto(ctx, pregunta, 700, FUENTE_TITULO, [60, 56, 52], anchoMax, 1);
  const ajustePreg = enUno.entra ? enUno : ajustarTexto(ctx, pregunta, 700, FUENTE_TITULO, [56, 52, 48], anchoMax, 3);
  const bajUno = ajustarTexto(ctx, bajada, 600, FUENTE_TEXTO, [46, 42, 40], anchoMax, 1);
  const ajusteBaj = bajUno.entra ? bajUno : ajustarTexto(ctx, bajada, 600, FUENTE_TEXTO, [42, 40], anchoMax, 2);
  const alto = ajustePreg.renglones.length * ajustePreg.tam * 1.12 + 10 + ajusteBaj.renglones.length * ajusteBaj.tam * 1.25;
  return { ajustePreg, ajusteBaj, alto };
};
const dibujarPregunta = (ctx, y, pregunta, bajada, anchoMax = 855) => {
  const { ajustePreg, ajusteBaj, alto } = medidasPregunta(ctx, pregunta, bajada, anchoMax);
  ctx.strokeStyle = NARANJA;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(100, y + alto - 6); ctx.lineTo(100, y + 6);
  ctx.moveTo(76, y + 30); ctx.lineTo(100, y + 6); ctx.lineTo(124, y + 30);
  ctx.stroke();
  let yTexto = y;
  ctx.font = `700 ${ajustePreg.tam}px ${FUENTE_TITULO}`;
  ctx.fillStyle = VERDE_OSCURO;
  ajustePreg.renglones.forEach((r) => { ctx.fillText(r, 150, yTexto + ajustePreg.tam * 0.56); yTexto += ajustePreg.tam * 1.12; });
  yTexto += 10;
  ctx.font = `600 ${ajusteBaj.tam}px ${FUENTE_TEXTO}`;
  ctx.fillStyle = '#284847';
  ajusteBaj.renglones.forEach((r) => { ctx.fillText(r, 150, yTexto + ajusteBaj.tam * 0.6); yTexto += ajusteBaj.tam * 1.25; });
  return alto;
};

// Textos de jornada, horario y experiencia, armados como frases que se entiendan solas
const JORNADA_TEXTO = { 'Guardia en clínica general (diurna)': 'guardias diurnas', 'Guardia 24 h (nocturna)': 'guardias 24 h', 'Reemplazo': 'reemplazos' };
const unirConY = (lista) => (lista.length > 1 ? `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}` : (lista[0] || ''));
const textoJornada = (jornada, horario) => {
  const jornadas = (Array.isArray(jornada) ? jornada : []).map((j) => JORNADA_TEXTO[j]).filter(Boolean);
  const horarios = (Array.isArray(horario) ? horario : []).filter((h) => h && h !== 'A convenir').map((h) => h.toLowerCase());
  // Devuelve [jornada, turno] por separado, cada uno va en su renglón
  return [jornadas.length ? unirConY(jornadas) : '', horarios.length ? `turno ${unirConY(horarios)}` : ''];
};

// Logo + píldora de arriba
// A la derecha del logo va el @ de Instagram (de la clínica o del profesional), para etiquetarlo al compartir
const dibujarEncabezado = (ctx, logo, textoPildora, fondoPildora, colorPildora, instagram = '') => {
  if (logo) ctx.drawImage(logo, 80, 90, 220, 72);
  if (instagram) {
    ctx.font = `600 38px ${FUENTE_TEXTO}`;
    let usuario = `@${instagram}`;
    while (usuario.length > 4 && ctx.measureText(usuario).width > 560) usuario = `${usuario.slice(0, -2)}…`;
    const anchoTexto = ctx.measureText(usuario).width;
    const xIcono = 1000 - anchoTexto - 16 - 40;
    // Iconito de Instagram (cuadrado redondeado + círculo + punto)
    ctx.strokeStyle = VERDE_OSCURO;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(xIcono, 106, 40, 40, 12); ctx.stroke();
    ctx.beginPath(); ctx.arc(xIcono + 20, 126, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = VERDE_OSCURO;
    ctx.beginPath(); ctx.arc(xIcono + 31, 115, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(usuario, 1000 - anchoTexto, 127);
  }
  // Píldora más grande para que se lea bien
  ctx.font = `700 38px ${FUENTE_TEXTO}`;
  ctx.fillStyle = fondoPildora;
  ctx.beginPath(); ctx.roundRect(80, 206, ctx.measureText(textoPildora).width + 72, 76, 38); ctx.fill();
  ctx.fillStyle = colorPildora;
  ctx.fillText(textoPildora, 116, 245);
};
// Pastillas centradas (o alineadas a la izquierda) que pasan de renglón si no entran. Devuelve dónde terminan.
const dibujarPastillas = (ctx, textos, { y, centroX = null, izquierda = 80, anchoMax = 920, dibujar = true, fondo = '#FFFFFF', color = VERDE }) => {
  ctx.font = `600 40px ${FUENTE_TEXTO}`;
  const ALTO = 76;
  const SEPARACION = 16;
  // Armamos los renglones
  const renglones = [[]];
  let anchoRenglon = 0;
  textos.forEach((t) => {
    let texto = t;
    while (texto.length > 4 && ctx.measureText(texto).width + 64 > anchoMax) texto = `${texto.slice(0, -2).trimEnd()}…`;
    const ancho = ctx.measureText(texto).width + 64;
    if (renglones[renglones.length - 1].length && anchoRenglon + SEPARACION + ancho > anchoMax) { renglones.push([]); anchoRenglon = 0; }
    anchoRenglon += (renglones[renglones.length - 1].length ? SEPARACION : 0) + ancho;
    renglones[renglones.length - 1].push({ texto, ancho });
  });
  renglones.forEach((renglon, i) => {
    const total = renglon.reduce((suma, p) => suma + p.ancho, 0) + SEPARACION * (renglon.length - 1);
    let x = centroX === null ? izquierda : centroX - total / 2;
    const yRenglon = y + i * (ALTO + SEPARACION);
    renglon.forEach(({ texto, ancho }) => {
      if (dibujar) {
        ctx.fillStyle = fondo;
        ctx.beginPath(); ctx.roundRect(x, yRenglon, ancho, ALTO, ALTO / 2); ctx.fill();
        ctx.fillStyle = color;
        ctx.fillText(texto, x + 32, yRenglon + ALTO / 2 + 1);
      }
      x += ancho + SEPARACION;
    });
  });
  return y + renglones.length * (ALTO + SEPARACION) - SEPARACION;
};

// Textos cortos de jornada y experiencia para la imagen
const EXPERIENCIA_PERSONA = { 'Sin experiencia (junior)': 'Junior, sin experiencia todavía', '1 a 3 años': 'Tiene 1 a 3 años de experiencia', 'Más de 3 años': 'Tiene más de 3 años de experiencia', 'Especialista': 'Es especialista' };
const EXPERIENCIA_OFERTA = { 'Sin experiencia (junior)': 'Sin experiencia', '1 a 3 años': '1 a 3 años de experiencia', 'Más de 3 años': '+3 años de experiencia', 'Especialista': 'Especialista' };
const JORNADA_PASTILLA = { 'Guardia en clínica general (diurna)': 'guardia diurna', 'Guardia 24 h (nocturna)': 'guardia 24 h', 'Reemplazo': 'reemplazos' };

// Imagen para difundir a un profesional (o estudiante) disponible.
// Misma estructura que la de clínicas pero en naranja: título, tarjeta de la persona (la protagonista),
// lugar del sticker del enlace y la pregunta.
export const generarImagenDisponible = async (disponible, { instagram = '' } = {}) => {
  await Promise.all(['700 84px Montserrat', '600 40px Montserrat', '700 30px Inter', '600 40px Inter', '500 40px Inter'].map((f) => document.fonts.load(f, '¿Tenés algún búsqueda·…?')));
  const [logo, foto] = await Promise.all([
    cargarImagen(`${RUTA_IMAGENES}/${ARCHIVO_LOGO}`),
    cargarImagen(disponible?.foto, true)
  ]);
  const zonaDatos = Array.isArray(disponible?.zonas) && disponible.zonas[0] ? disponible.zonas[0] : {};
  let zona = zonaParaImagen({ provincia: zonaDatos.provincia || disponible?.provincia || '', localidad: zonaDatos.localidad || '', barrio: zonaDatos.barrio || '' });
  const esAsistente = disponible?.puesto === 'asistente';
  const areas = Array.isArray(disponible?.areas) ? disponible.areas.filter(Boolean).slice(0, 4) : [];
  const nombre = String(disponible?.nombre || 'Un colega del Portal').trim();
  const rol = esAsistente ? 'Asistente veterinario/a' : 'Veterinario/a';
  const [jornadaDisp, turnoDisp] = textoJornada(disponible?.jornada, disponible?.horario);
  const busca = [jornadaDisp, turnoDisp].filter(Boolean).join(', ');
  // Un renglón para la experiencia y otro para la jornada
  const detalles = [busca ? `Busca ${busca}` : 'Jornada a convenir', EXPERIENCIA_PERSONA[disponible?.experiencia] || ''].filter(Boolean);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Fondo cálido (las ofertas de clínicas son verdes)
  const degradado = ctx.createLinearGradient(0, 0, 1080, 1920);
  degradado.addColorStop(0, '#FFE7BF');
  degradado.addColorStop(0.55, '#FFF6E6');
  degradado.addColorStop(1, '#FBE3CF');
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, 1080, 1920);

  dibujarEncabezado(ctx, logo, esAsistente ? 'ESTUDIANTE' : 'PROFESIONAL', NARANJA, '#FFFFFF', instagram);

  // Abajo (igual que en las de clínica): pregunta con flecha, y arriba el lugar del sticker del enlace
  const preguntaDisp = ['¿Tu clínica busca a alguien así?', 'Contactalo desde el enlace'];
  const yPregunta = 1790 - medidasPregunta(ctx, ...preguntaDisp, 855).alto;
  const arribaSticker = yPregunta - 30 - 150;

  // Título
  ctx.font = `700 68px ${FUENTE_TITULO}`;
  ctx.fillStyle = VERDE_OSCURO;
  ctx.fillText('Disponible para trabajar', 80, 380);

  // Contenido de la tarjeta (se mide primero y se dibuja después)
  const cx = 540;
  const FOTO = 290;
  const ajusteNombre = ajustarTexto(ctx, nombre, 700, FUENTE_TITULO, [72, 64, 56], 800, 2);
  const ajustesDetalle = detalles.map((d) => ajustarTexto(ctx, d, 500, FUENTE_TEXTO, [42, 38, 34], 800, 2));
  // "aire": espacio extra que se reparte entre los bloques para que la tarjeta llene el lugar disponible
  const contenido = (yInicio, dibujar, aire = 0) => {
    let y = yInicio + 50 + aire;
    if (dibujar) {
      dibujarFotoRedonda(ctx, foto, nombre, cx, y + FOTO / 2, FOTO);
      ctx.strokeStyle = '#FFE0B2';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(cx, y + FOTO / 2, FOTO / 2 + 5, 0, Math.PI * 2); ctx.stroke();
    }
    y += FOTO + 46 + aire;
    ctx.textAlign = 'center';
    // Nombre
    ctx.font = `700 ${ajusteNombre.tam}px ${FUENTE_TITULO}`;
    ctx.fillStyle = VERDE_OSCURO;
    ajusteNombre.renglones.forEach((r) => { if (dibujar) ctx.fillText(r, cx, y + ajusteNombre.tam * 0.55); y += ajusteNombre.tam * 1.15; });
    y += 8;
    // Rol
    ctx.font = `700 46px ${FUENTE_TITULO}`;
    ctx.fillStyle = VERDE;
    if (dibujar) ctx.fillText(rol, cx, y + 26);
    y += 66 + aire;
    // Zona con pin (centrada)
    if (zona) {
      ctx.font = `600 48px ${FUENTE_TITULO}`;
      while (zona.length > 3 && ctx.measureText(zona).width > 760) zona = `${zona.slice(0, -2).trimEnd()}…`;
      if (dibujar) {
        const anchoZona = ctx.measureText(zona).width;
        const anchoPin = 56 * 0.64;
        const inicio = cx - (anchoPin + 16 + anchoZona) / 2;
        dibujarPin(ctx, inicio, y + 30, 56, NARANJA);
        ctx.textAlign = 'left';
        ctx.fillStyle = VERDE_OSCURO;
        ctx.fillText(zona, inicio + anchoPin + 16, y + 32);
        ctx.textAlign = 'center';
      }
      y += 76 + aire;
    }
    // Experiencia y jornada
    ajustesDetalle.forEach((ajusteDetalle) => {
      ctx.font = `500 ${ajusteDetalle.tam}px ${FUENTE_TEXTO}`;
      ctx.fillStyle = '#5A5A5A';
      ajusteDetalle.renglones.forEach((r) => { if (dibujar) ctx.fillText(r, cx, y + ajusteDetalle.tam * 0.55); y += ajusteDetalle.tam * 1.3; });
    });
    if (ajustesDetalle.length) y += 10 + aire;
    ctx.textAlign = 'left';
    // Especialidades en pastillas
    if (areas.length) {
      y += 20;
      y = dibujarPastillas(ctx, areas, { y, centroX: cx, anchoMax: 820, dibujar, fondo: '#FFF1DC', color: '#8A4B00' });
    }
    return y + 56 + aire;
  };

  // La tarjeta se centra en el espacio entre el título y el lugar del sticker
  // La tarjeta arranca abajo del título y se estira (con más aire entre bloques) hasta cerca del lugar del sticker
  const arribaTarjeta = 450;
  const espacio = arribaSticker - 30 - arribaTarjeta;
  const aire = Math.max(0, Math.min(40, (espacio - contenido(0, false)) / 6));
  const altoTarjeta = contenido(0, false, aire);
  ctx.save();
  ctx.shadowColor = 'rgba(120,70,20,0.14)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.roundRect(80, arribaTarjeta, 920, altoTarjeta, 48); ctx.fill();
  ctx.restore();
  contenido(arribaTarjeta, true, aire);

  dibujarPregunta(ctx, yPregunta, ...preguntaDisp, 855);

  return new Promise((resolver) => canvas.toBlob(resolver, 'image/png'));
};

// Pin de ubicación chiquito (para la zona)
const dibujarPin = (ctx, x, cy, alto, color) => {
  const r = alto * 0.32;
  const cyCirculo = cy - alto * 0.18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + r, cyCirculo, r, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(x + r, cy + alto * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(x + r, cyCirculo, r * 0.42, 0, Math.PI * 2); ctx.fill();
  return r * 2;
};

// Dibuja la imagen de una oferta de una clínica y devuelve un PNG.
// Formato "Se busca": 1) el puesto enorme (un solo protagonista), 2) zona con pin,
// 3) tarjeta de quién busca (la clínica) con la ilustración, 4) la pregunta corta junto al enlace.
export const generarImagenOferta = async (oferta, { instagram = '' } = {}) => {
  await Promise.all(['700 84px Montserrat', '600 40px Montserrat', '700 30px Inter', '500 36px Inter', '600 36px Inter', '600 38px Inter'].map((f) => document.fonts.load(f, '¿Tenés algún búsqueda·…?')));
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

  // Fondo verde claro (los profesionales disponibles son cálidos)
  const degradado = ctx.createLinearGradient(0, 0, 1080, 1920);
  degradado.addColorStop(0, '#DFF0EA');
  degradado.addColorStop(0.5, '#F3F8F6');
  degradado.addColorStop(1, '#D6EAE3');
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, 1080, 1920);

  dibujarEncabezado(ctx, logo, 'CLÍNICA EN BÚSQUEDA', VERDE, '#FFFFFF', instagram);

  // Textos: «Se busca veterinario/a» + en grande el puesto puntual + «Con experiencia en» y las especialidades
  const ROL_TEXTO = { veterinario: 'veterinario/a', asistente: 'asistente veterinario/a', peluquero: 'peluquero/a', recepcion: 'recepcionista', alumno: 'estudiante' };
  const rolTexto = ROL_TEXTO[oferta?.rol] || 'veterinario/a';
  const areas = Array.isArray(oferta?.areas) ? oferta.areas.filter(Boolean) : [];
  const propio = String(oferta?.puestoTexto || '').trim();
  const antetitulo = propio ? `Se busca ${rolTexto}` : 'Se busca';
  const principal = propio || (rolTexto.charAt(0).toUpperCase() + rolTexto.slice(1));
  // Una sola especialidad y, si hay más, una pastilla «+N»
  const resto = areas.length ? [areas[0], ...(areas.length > 1 ? [`+${areas.length - 1}`] : [])] : [];
  const etiquetaPastillas = resto.length ? 'Con experiencia en' : '';
  let zona = zonaParaImagen(oferta);

  // Medidas de la tarjeta de quién busca (va abajo, arriba del lugar del sticker)
  const FOTO = 140;
  const ANCHO_TARJETA = 920;
  const ANCHO_ILUSTRACION = 300;
  const xTexto = 80 + 40 + FOTO + 28;
  const anchoTexto = 80 + ANCHO_TARJETA - ANCHO_ILUSTRACION - xTexto;
  const nombre = String(oferta?.clinicaNombre || 'Una clínica del Portal').trim();
  let ajuste = ajustarTexto(ctx, nombre, 700, FUENTE_TITULO, [48, 42], anchoTexto, 2);
  if (!ajuste.entra) ajuste = ajustarTexto(ctx, nombre, 700, FUENTE_TITULO, [38], anchoTexto, 3);
  const altoNombre = ajuste.tam * 1.2;
  const altoEtiqueta = 46;
  const altoContenido = altoEtiqueta + altoNombre * ajuste.renglones.length;
  const altoCuerpo = Math.max(FOTO, altoContenido);
  const altoTarjeta = 44 + altoCuerpo + 44;
  const arribaTarjeta = 1800 - altoTarjeta;
  // Pregunta con flecha justo arriba de la tarjeta, y arriba de la pregunta el lugar del sticker del enlace
  const preguntaOferta = ['¿Conocés algún colega interesado?', 'Postulate o pasale el enlace'];
  const ANCHO_PREGUNTA = 570; // a la derecha está el muñeco
  const yPregunta = arribaTarjeta - 40 - medidasPregunta(ctx, ...preguntaOferta, ANCHO_PREGUNTA).alto;
  const arribaSticker = yPregunta - 30 - 150;

  // Bloque de textos de arriba. Se llama dos veces: primero solo para medir y después para dibujar.
  const ajusteAnte = ajustarTexto(ctx, antetitulo, 600, FUENTE_TITULO, [56, 50], 920, 2);
  const ajustePuesto = ajustarTexto(ctx, principal, 700, FUENTE_TITULO, [124, 110, 96, 84], 920, 3);
  // Condiciones en pastillas: para qué es (la primera jornada, +N si hay más) y la experiencia (sin el turno)
  const jornadasOferta = (Array.isArray(oferta?.jornada) ? oferta.jornada : []).map((j) => JORNADA_PASTILLA[j]).filter(Boolean);
  const condiciones = [
    ...(jornadasOferta.length ? [`Para ${jornadasOferta[0]}`] : []),
    ...(jornadasOferta.length > 1 ? [`+${jornadasOferta.length - 1}`] : []),
    ...(EXPERIENCIA_OFERTA[oferta?.experiencia] ? [EXPERIENCIA_OFERTA[oferta.experiencia]] : [])
  ];
  const bloque = (y, dibujar) => {
    ctx.font = `600 ${ajusteAnte.tam}px ${FUENTE_TITULO}`;
    ctx.fillStyle = VERDE;
    ajusteAnte.renglones.forEach((r, i) => { if (dibujar) ctx.fillText(r, 80, y + ajusteAnte.tam * 1.2 * (i + 0.5)); });
    y += ajusteAnte.tam * 1.2 * ajusteAnte.renglones.length + 16;

    // El puesto o la especialidad: lo más grande y lo único subrayado
    const altoRenglon = ajustePuesto.tam * 1.08;
    ctx.font = `700 ${ajustePuesto.tam}px ${FUENTE_TITULO}`;
    ctx.fillStyle = VERDE_OSCURO;
    if (dibujar) {
      ajustePuesto.renglones.forEach((r, i) => ctx.fillText(r, 80, y + altoRenglon * (i + 0.5)));
      const anchoUltimo = ctx.measureText(ajustePuesto.renglones[ajustePuesto.renglones.length - 1]).width;
      subrayar(ctx, 80, y + altoRenglon * (ajustePuesto.renglones.length - 0.5) + ajustePuesto.tam * 0.38, anchoUltimo);
    }
    y += altoRenglon * ajustePuesto.renglones.length + 54;

    // Las otras especialidades, como pastillas
    if (etiquetaPastillas) {
      ctx.font = `600 44px ${FUENTE_TITULO}`;
      ctx.fillStyle = VERDE;
      if (dibujar) ctx.fillText(etiquetaPastillas, 80, y + 26);
      y += 70;
    }
    if (resto.length) y = dibujarPastillas(ctx, resto, { y, dibujar }) + 40;

    // Zona con un pin
    if (zona) {
      ctx.font = `600 58px ${FUENTE_TITULO}`;
      while (zona.length > 3 && ctx.measureText(zona).width > 830) zona = `${zona.slice(0, -2).trimEnd()}…`;
      if (dibujar) {
        const anchoPin = dibujarPin(ctx, 80, y + 34, 64, NARANJA);
        ctx.fillStyle = VERDE_OSCURO;
        ctx.fillText(zona, 80 + anchoPin + 20, y + 36);
      }
      y += 72;
    }

    // Para qué es y la experiencia que buscan
    if (condiciones.length) y = dibujarPastillas(ctx, condiciones, { y: y + 24, dibujar, fondo: VERDE, color: '#FFFFFF' });
    return y;
  };

  // Repartimos el espacio: el bloque de arriba baja un poco si sobra lugar,
  // y la ilustración crece (con un tope) para ocupar el resto
  const altoBloque = bloque(0, false);
  const libre = arribaSticker - 50 - 330 - altoBloque;
  const arribaBloque = 330 + Math.max(0, Math.min(libre * 0.4, 260));
  const finContenido = bloque(arribaBloque, true) + 40;

  ctx.save();
  ctx.shadowColor = 'rgba(31,65,64,0.12)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.roundRect(80, arribaTarjeta, ANCHO_TARJETA, altoTarjeta, 40); ctx.fill();
  ctx.restore();

  // Ilustración: parada sobre el borde de abajo de la tarjeta, asomando por arriba
  if (personaje) {
    const ancho0 = personaje.naturalWidth || personaje.width || 300;
    const alto0 = personaje.naturalHeight || personaje.height || 600;
    const altoMax = Math.min(640, arribaTarjeta + altoTarjeta - 24 - finContenido);
    const escala = Math.min(320 / ancho0, altoMax / alto0);
    const anchoDib = ancho0 * escala;
    const altoDib = alto0 * escala;
    // Espejado, para que mire hacia los textos
    ctx.save();
    ctx.translate(80 + ANCHO_TARJETA - 30, arribaTarjeta + altoTarjeta - 24 - altoDib);
    ctx.scale(-1, 1);
    ctx.drawImage(personaje, 0, 0, anchoDib, altoDib);
    ctx.restore();
  }

  const cy = arribaTarjeta + 44 + altoCuerpo / 2;
  dibujarFotoRedonda(ctx, fotoClinica, nombre, 80 + 40 + FOTO / 2, cy, FOTO);
  const arribaTexto = arribaTarjeta + 44 + (altoCuerpo - altoContenido) / 2;
  ctx.font = `700 32px ${FUENTE_TEXTO}`;
  ctx.fillStyle = '#6B7F7D';
  ctx.fillText('Quién busca', xTexto, arribaTexto + altoEtiqueta / 2 - 4);
  ctx.font = `700 ${ajuste.tam}px ${FUENTE_TITULO}`;
  ctx.fillStyle = VERDE_OSCURO;
  ajuste.renglones.forEach((r, i) => ctx.fillText(r, xTexto, arribaTexto + altoEtiqueta + altoNombre * (i + 0.5)));

  // Pregunta corta con la flecha que apunta al sticker del enlace (queda a la izquierda, al lado del muñeco)
  dibujarPregunta(ctx, yPregunta, ...preguntaOferta, ANCHO_PREGUNTA);

  return new Promise((resolver) => canvas.toBlob(resolver, 'image/png'));
};
