// Versión simple de cada perfil, solo para buscadores y vistas previas de links
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DOMINIO = 'https://www.portalveterinario.ar';

function obtenerFirestore() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore();
}

function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function recortar(texto, max) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  return limpio.length > max ? limpio.slice(0, max - 3).trim() + '...' : limpio;
}

// Datos estructurados (schema.org) para que Google entienda qué es cada página.
// Devuelve el bloque <script> listo para pegar en el <head>. No incluye datos de contacto.
function bloqueJsonLd(objeto) {
  if (!objeto) return '';
  // El "<" se escapa para que nada del texto pueda cerrar el script
  const json = JSON.stringify(objeto).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

// "09:30" -> "09:30" (solo si tiene formato de hora válido)
const horaValida = (h) => (/^\d{1,2}:\d{2}$/.test(String(h || '')) ? String(h).padStart(5, '0') : null);

// Horarios de una clínica en el formato de schema.org
function armarHorarios(h) {
  if (!h || typeof h !== 'object') return [];
  const tramos = [];
  const sumar = (dias, desde, hasta) => {
    const abre = horaValida(desde);
    const cierra = horaValida(hasta);
    if (abre && cierra) tramos.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: dias, opens: abre, closes: cierra });
  };
  const semana = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  sumar(semana, h.semanaDesde, h.semanaHasta);
  if (h.corte) sumar(semana, h.semanaDesde2, h.semanaHasta2);
  if (h.sabadoAbre) {
    sumar(['Saturday'], h.sabadoDesde, h.sabadoHasta);
    if (h.corte) sumar(['Saturday'], h.sabadoDesde2, h.sabadoHasta2);
  }
  return tramos;
}

// Código postal: si la clínica lo tiene guardado se usa; si no, se saca de la dirección de Google
// (ej: "Av. Rivadavia 1234, C1033 CABA" -> "C1033")
function codigoPostalDe(data) {
  if (data.codigoPostal) return String(data.codigoPostal).trim();
  // Solo el formato con letra (C1033, B1704…): un número suelto de 4 cifras puede ser la altura de la calle
  const m = String(data.direccion || '').match(/\b([A-Z]\d{4})(?:[A-Z]{3})?\b/);
  return m ? m[1] : '';
}

function pagina({ titulo, descripcion, ruta, cuerpo, jsonld }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(DOMINIO + ruta)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(DOMINIO + ruta)}">
<meta property="og:type" content="website">
<meta name="viewport" content="width=device-width, initial-scale=1">
${bloqueJsonLd(jsonld)}
</head>
<body>
<main>
${cuerpo}
<p><a href="${DOMINIO}/cartilla">Ver la Cartilla Veterinaria completa</a></p>
</main>
</body>
</html>`;
}

function armarProfesional(data, slug) {
  const nombre = `${data.nombre || ''} ${data.apellido || ''}`.trim();
  const tipoTitulo = data.tituloGenero === 'veterinaria' ? 'Veterinaria' : data.tituloGenero === 'veterinario' ? 'Veterinario' : 'Veterinaria/o';
  const provincia = data.provincia || '';
  const intro = [data.especialidad ? `especialista en ${data.especialidad}` : '', provincia ? `en ${provincia}` : '']
    .filter(Boolean).join(' ');
  const descripcion = recortar(`${nombre}, ${tipoTitulo.toLowerCase()} ${intro}. ${data.bio || ''}`, 155);

  const trayectoria = (Array.isArray(data.trayectoria) ? data.trayectoria : [])
    .filter((t) => t && (t.titulo || t.desc))
    .map((t) => `<li>${esc(t.titulo)}${t.desc ? ' — ' + esc(t.desc) : ''}${t.extra ? ' (' + esc(t.extra) + ')' : ''}</li>`)
    .join('\n');

  const lugares = (Array.isArray(data.zonas) ? data.zonas : [])
    .flatMap((z) => z.clinicas || [])
    .filter((c) => c && (c.nombrePropio || c.nombre))
    .map((c) => `<li>${esc(c.nombrePropio || c.nombre)}${c.barrio ? ' (' + esc(c.barrio) + ')' : ''}</li>`)
    .join('\n');

  const cuerpo = `<h1>${esc(nombre)}</h1>
<p>${tipoTitulo}${data.especialidad ? ' · ' + esc(data.especialidad) : ''}${provincia ? ' · ' + esc(provincia) : ''}</p>
${data.bio ? `<p>${esc(data.bio)}</p>` : ''}
${trayectoria ? `<h2>Trayectoria</h2>\n<ul>\n${trayectoria}\n</ul>` : ''}
${lugares ? `<h2>Dónde atiende</h2>\n<ul>\n${lugares}\n</ul>` : ''}`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: nombre,
    jobTitle: tipoTitulo,
    url: `${DOMINIO}/profesional/${encodeURIComponent(slug)}`,
    ...(data.especialidad ? { knowsAbout: data.especialidad } : {}),
    ...(provincia ? { address: { '@type': 'PostalAddress', addressRegion: provincia, addressCountry: 'AR' } } : {}),
    ...(typeof data.foto === 'string' && /^https?:\/\//.test(data.foto) ? { image: data.foto } : {})
  };

  return pagina({
    titulo: `${nombre} | ${tipoTitulo} | Cartilla Veterinaria`,
    descripcion,
    ruta: `/profesional/${encodeURIComponent(slug)}`,
    cuerpo,
    jsonld
  });
}

function armarClinica(data, slug) {
  const nombreClinica = (data.nombre || '').trim();
  const nombreConTipo = /veterinari/i.test(nombreClinica) ? nombreClinica : `Veterinaria ${nombreClinica}`;
  const provincia = (data.provincia || '').replace(/^Provincia de\s+/i, '').trim();
  const zona = [data.barrio || data.localidad || '', provincia].filter(Boolean).join(', ');
  const texto = data.historia || data.descripcion || '';
  const descripcion = recortar(`${nombreConTipo}${zona ? ' en ' + zona : ''}.${data.guardia24hs ? ' Con guardia las 24 horas.' : ''} ${texto}`, 155);

  const servicios = Object.values(data.servicios && typeof data.servicios === 'object' ? data.servicios : {})
    .filter((s) => s && s.activo)
    .flatMap((s) => [...(s.subOpcionesSeleccionadas || []), ...(s.serviciosPersonalizados || [])])
    .filter(Boolean)
    .map((s) => `<li>${esc(s)}</li>`)
    .join('\n');

  const cuerpo = `<h1>${esc(nombreConTipo)}</h1>
<p>${zona ? esc(zona) : ''}${data.guardia24hs ? ' · Guardia las 24 horas' : ''}</p>
${data.direccion ? `<p>${esc(data.direccion)}</p>` : ''}
${texto ? `<p>${esc(texto)}</p>` : ''}
${servicios ? `<h2>Servicios</h2>\n<ul>\n${servicios}\n</ul>` : ''}`;

  const horarios = armarHorarios(data.horarios);
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: nombreConTipo,
    url: `${DOMINIO}/clinica/${encodeURIComponent(slug)}`,
    ...(texto ? { description: recortar(texto, 300) } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(data.direccion ? { streetAddress: data.direccion } : {}),
      ...(data.localidad || data.barrio ? { addressLocality: data.localidad || data.barrio } : {}),
      ...(provincia ? { addressRegion: provincia } : {}),
      ...(codigoPostalDe(data) ? { postalCode: codigoPostalDe(data) } : {}),
      addressCountry: 'AR'
    },
    ...(typeof data.lat === 'number' && typeof data.lng === 'number' ? { geo: { '@type': 'GeoCoordinates', latitude: data.lat, longitude: data.lng } } : {}),
    ...(data.guardia24hs ? { openingHours: 'Mo-Su 00:00-24:00' } : horarios.length ? { openingHoursSpecification: horarios } : {}),
    ...(typeof data.foto === 'string' && /^https?:\/\//.test(data.foto) ? { image: data.foto } : {})
  };

  return pagina({
    titulo: `${nombreConTipo} | Cartilla Veterinaria`,
    descripcion,
    ruta: `/clinica/${encodeURIComponent(slug)}`,
    cuerpo,
    jsonld
  });
}

// Versión simple de la Cartilla: lista de profesionales y clínicas visibles, agrupada por provincia.
// Sin datos de contacto: solo nombre, especialidad/zona y link al perfil.
async function armarCartilla(db) {
  const [snapProf, snapCli] = await Promise.all([
    db.collection('profesionales').get(),
    db.collection('clinicas').get()
  ]);

  const porProvincia = {};
  const agregar = (provincia, html) => {
    const clave = (provincia || 'Argentina').replace(/^Provincia de\s+/i, '').trim() || 'Argentina';
    (porProvincia[clave] = porProvincia[clave] || []).push(html);
  };

  let totalProf = 0;
  let totalCli = 0;

  snapProf.forEach((doc) => {
    const d = doc.data();
    if (d.visible === false || !d.slug) return;
    const nombre = `${d.nombre || ''} ${d.apellido || ''}`.trim();
    if (!nombre) return;
    totalProf += 1;
    const detalle = [d.especialidad, d.localidad || d.barrio].filter(Boolean).join(' · ');
    agregar(d.provincia, `<li><a href="${DOMINIO}/profesional/${encodeURIComponent(d.slug)}">${esc(nombre)}</a>${detalle ? ' — ' + esc(detalle) : ''}</li>`);
  });

  snapCli.forEach((doc) => {
    const d = doc.data();
    if (d.visible === false) return;
    const id = d.slug || doc.id;
    const nombre = (d.nombre || '').trim();
    if (!id || !nombre) return;
    totalCli += 1;
    const conTipo = /veterinari/i.test(nombre) ? nombre : `Veterinaria ${nombre}`;
    const detalle = [d.barrio || d.localidad, d.guardia24hs ? 'Guardia 24 hs' : ''].filter(Boolean).join(' · ');
    agregar(d.provincia, `<li><a href="${DOMINIO}/clinica/${encodeURIComponent(id)}">${esc(conTipo)}</a>${detalle ? ' — ' + esc(detalle) : ''}</li>`);
  });

  const secciones = Object.keys(porProvincia)
    .sort((x, y) => x.localeCompare(y, 'es'))
    .map((prov) => `<h2>Veterinarios y veterinarias en ${esc(prov)}</h2>\n<ul>\n${porProvincia[prov].join('\n')}\n</ul>`)
    .join('\n');

  const cuerpo = `<h1>Cartilla Veterinaria de Argentina</h1>
<p>Encontrá veterinarios, especialistas y clínicas veterinarias verificados en todo el país. Hoy hay ${totalProf} profesionales y ${totalCli} clínicas en El Portal Veterinario.</p>
${secciones}`;

  return pagina({
    titulo: 'Cartilla Veterinaria de Argentina | Veterinarios y clínicas | El Portal Veterinario',
    descripcion: 'Buscá veterinarios, especialistas y clínicas veterinarias verificados en Argentina, por zona y especialidad. Perfiles con servicios, horarios y contacto.',
    ruta: '/cartilla',
    cuerpo
  });
}

// ===================== BOLSA DE TRABAJO =====================
// Nombres de los puestos (copia de src/data/bolsaOpciones.js; acá no se puede importar el código del sitio)
const PUESTOS = { veterinario: 'Veterinario/a', asistente: 'Asistente veterinario/a (estudiante)', peluquero: 'Peluquero/a canino/a', recepcion: 'Recepcionista', alumno: 'Estudiante' };

// Jornada y horario se guardan como listas: los pasamos a texto
const textoDe = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v || ''));

const aMs = (v) => (!v ? 0 : typeof v === 'number' ? v : typeof v.toMillis === 'function' ? v.toMillis() : new Date(v).getTime() || 0);
const ofertaVigente = (o) => o.estado === 'activo' && aMs(o.vencimientoMillis) > Date.now();

// Título del puesto: "Veterinario/a — Cirugía · Ecografía" o "Peluquero/a canino/a"
function tituloOferta(o) {
  // Nombre del puesto escrito por la clínica (ej: «Director/a técnico/a»)
  const propio = String(o.puestoTexto || '').trim();
  if (propio) return propio;
  const base = PUESTOS[o.rol] || 'Veterinario/a';
  const areas = Array.isArray(o.areas) ? o.areas.filter(Boolean) : [];
  return o.rol === 'veterinario' && areas.length ? `${base} — ${areas.join(' · ')}` : base;
}

// Zona sin calle ni número: "Castelar, Zona Oeste" o "Palermo, CABA"
function zonaOferta(o) {
  const lugar = String(o.barrio || o.localidad || '').trim();
  let region = String(o.provincia || '').replace(/^Provincia de\s+/i, '').trim();
  if (/ciudad aut[oó]noma|^capital federal/i.test(region)) region = 'CABA';
  if (region === 'Buenos Aires' && o.zonaBA) region = o.zonaBA;
  return [lugar, region].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');
}

// Saca del texto libre cualquier mail o teléfono, por si la clínica los escribió en la descripción
const sinContacto = (texto) => String(texto || '')
  .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[contacto en el Portal]')
  .replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[contacto en el Portal]');

async function leerOfertasVigentes(db) {
  const snap = await db.collection('ofertasEmpleo').where('estado', '==', 'activo').get();
  const lista = [];
  snap.forEach((d) => { const o = { id: d.id, ...d.data() }; if (ofertaVigente(o)) lista.push(o); });
  return lista.sort((a, b) => aMs(b.publicadaEn) - aMs(a.publicadaEn));
}

async function armarBolsa(db) {
  const ofertas = await leerOfertasVigentes(db);
  const items = ofertas.map((o) => {
    const detalle = [o.clinicaNombre, zonaOferta(o), textoDe(o.jornada)].filter(Boolean).map(esc).join(' · ');
    return `<li><a href="${DOMINIO}/bolsa-de-trabajo/oferta/${encodeURIComponent(o.id)}">${esc(tituloOferta(o))}</a>${detalle ? ' — ' + detalle : ''}</li>`;
  }).join('\n');

  const cuerpo = `<h1>Bolsa de trabajo veterinaria en Argentina</h1>
<p>Ofertas de empleo para veterinarios, asistentes veterinarios y peluqueros caninos en clínicas veterinarias de todo el país: guardias, reemplazos y puestos fijos. Publicar es gratis.</p>
${items ? `<h2>Ofertas activas (${ofertas.length})</h2>\n<ul>\n${items}\n</ul>` : '<p>Ahora no hay ofertas activas. Volvé a mirar pronto.</p>'}
<p><a href="${DOMINIO}/bolsa-de-trabajo">Ver la Bolsa de Trabajo</a></p>`;

  return pagina({
    titulo: 'Bolsa de trabajo veterinaria en Argentina | Empleos para veterinarios | El Portal Veterinario',
    descripcion: 'Empleos para veterinarios, asistentes y peluqueros caninos en clínicas de toda Argentina: guardias, reemplazos y puestos fijos. Publicar es gratis.',
    ruta: '/bolsa-de-trabajo',
    cuerpo
  });
}

async function armarOferta(db, id) {
  const snap = await db.collection('ofertasEmpleo').doc(id).get();
  if (!snap.exists) return null;
  const o = { id: snap.id, ...snap.data() };
  if (!ofertaVigente(o)) return null;

  const titulo = tituloOferta(o);
  const zona = zonaOferta(o);
  const descripcionLibre = sinContacto(o.descripcion);
  const lista = (arr) => (Array.isArray(arr) && arr.length ? `<ul>\n${arr.filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('\n')}\n</ul>` : '');
  const datos = [
    textoDe(o.jornada) ? `<li>Jornada: ${esc(textoDe(o.jornada))}${o.notaJornada ? ' (' + esc(sinContacto(o.notaJornada)) + ')' : ''}</li>` : '',
    textoDe(o.horario) ? `<li>Horario: ${esc(textoDe(o.horario))}${o.notaHorario ? ' (' + esc(sinContacto(o.notaHorario)) + ')' : ''}</li>` : '',
    o.experiencia ? `<li>Experiencia: ${esc(o.experiencia)}</li>` : ''
  ].join('\n');

  const cuerpo = `<h1>${esc(titulo)}</h1>
<p>${[o.clinicaNombre, zona].filter(Boolean).map(esc).join(' · ')}</p>
${datos.trim() ? `<ul>\n${datos}\n</ul>` : ''}
${descripcionLibre ? `<h2>Descripción</h2>\n<p>${esc(descripcionLibre)}</p>` : ''}
${lista(o.requisitos) ? `<h2>Requisitos</h2>\n${lista(o.requisitos)}` : ''}
${lista(o.equipo) ? `<h2>La clínica cuenta con</h2>\n${lista(o.equipo)}` : ''}
<p>Para postularte, ingresá a El Portal Veterinario con tu cuenta.</p>
<p><a href="${DOMINIO}/bolsa-de-trabajo">Ver todas las ofertas de la Bolsa de Trabajo</a></p>`;

  const textoGoogle = [descripcionLibre, textoDe(o.jornada) ? `Jornada: ${textoDe(o.jornada)}.` : '', o.experiencia ? `Experiencia: ${o.experiencia}.` : '',
    Array.isArray(o.requisitos) && o.requisitos.length ? `Requisitos: ${o.requisitos.join(', ')}.` : ''].filter(Boolean).join(' ') || titulo;

  const region = String(o.provincia || '').replace(/^Provincia de\s+/i, '').trim();
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: titulo,
    description: esc(textoGoogle),
    datePosted: new Date(aMs(o.publicadaEn) || Date.now()).toISOString(),
    validThrough: new Date(aMs(o.vencimientoMillis)).toISOString(),
    directApply: false,
    hiringOrganization: {
      '@type': 'Organization',
      name: o.clinicaNombre || 'Clínica veterinaria',
      ...(o.clinicaSlug ? { sameAs: `${DOMINIO}/clinica/${encodeURIComponent(o.clinicaSlug)}` } : {}),
      ...(typeof o.clinicaFoto === 'string' && /^https?:\/\//.test(o.clinicaFoto) ? { logo: o.clinicaFoto } : {})
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(o.barrio || o.localidad ? { addressLocality: o.barrio || o.localidad } : {}),
        ...(region ? { addressRegion: region } : {}),
        addressCountry: 'AR'
      }
    }
  };

  return pagina({
    titulo: `${titulo}${zona ? ' en ' + zona : ''} | Bolsa de trabajo veterinaria`,
    descripcion: recortar(`${titulo}${o.clinicaNombre ? ' en ' + o.clinicaNombre : ''}${zona ? ', ' + zona : ''}. ${descripcionLibre}`, 155),
    ruta: `/bolsa-de-trabajo/oferta/${encodeURIComponent(o.id)}`,
    cuerpo,
    jsonld
  });
}

export default async function handler(req, res) {
  const { tipo, slug } = req.query;
  try {
    if (tipo === 'bolsa' || tipo === 'oferta') {
      const db = obtenerFirestore();
      const html = tipo === 'bolsa' ? await armarBolsa(db) : (req.query.id ? await armarOferta(db, String(req.query.id)) : null);
      if (!html) return res.status(404).send('No encontrado');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Las ofertas cambian más seguido: se guardan 30 minutos
      res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
      return res.status(200).send(html);
    }
    if (tipo === 'cartilla') {
      const html = await armarCartilla(obtenerFirestore());
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).send(html);
    }
    if (!slug || (tipo !== 'profesional' && tipo !== 'clinica')) {
      return res.status(404).send('No encontrado');
    }
    const db = obtenerFirestore();
    let data = null;

    if (tipo === 'profesional') {
      const snap = await db.collection('profesionales').where('slug', '==', slug).limit(1).get();
      if (!snap.empty) data = snap.docs[0].data();
    } else {
      const snap = await db.collection('clinicas').where('slug', '==', slug).limit(1).get();
      if (!snap.empty) {
        data = snap.docs[0].data();
      } else {
        const doc = await db.collection('clinicas').doc(slug).get();
        if (doc.exists) data = doc.data();
      }
    }

    if (!data || data.visible === false) {
      return res.status(404).send('No encontrado');
    }

    const html = tipo === 'profesional' ? armarProfesional(data, slug) : armarClinica(data, slug);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error en la versión para buscadores:', error);
    res.status(500).send('Error');
  }
}