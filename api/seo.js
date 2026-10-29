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

function pagina({ titulo, descripcion, ruta, cuerpo }) {
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

  return pagina({
    titulo: `${nombre} | ${tipoTitulo} | Cartilla Veterinaria`,
    descripcion,
    ruta: `/profesional/${encodeURIComponent(slug)}`,
    cuerpo
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

  return pagina({
    titulo: `${nombreConTipo} | Cartilla Veterinaria`,
    descripcion,
    ruta: `/clinica/${encodeURIComponent(slug)}`,
    cuerpo
  });
}

export default async function handler(req, res) {
  const { tipo, slug } = req.query;
  try {
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