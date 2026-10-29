// ============================================================
// Función de Vercel: arma el sitemap.xml automáticamente.
//
// Cómo funciona:
//  1) Cuando Google pide /sitemap.xml, Vercel despierta esta función.
//  2) Lee de Firestore los profesionales que aparecen en la Cartilla
//     (todos menos los que tienen visible en false).
//  3) Arma la lista de páginas en el formato que entiende Google.
//
// Así, cada perfil nuevo entra solo al sitemap, sin tocar nada a mano.
// ============================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DOMINIO = 'https://www.portalveterinario.ar';

// Páginas fijas del sitio (las mismas que tenías en el sitemap viejo)
const PAGINAS_FIJAS = [
  { ruta: '/', prioridad: '1.0', frecuencia: 'weekly' },
  { ruta: '/cartilla', prioridad: '0.9', frecuencia: 'daily' },
  { ruta: '/login', prioridad: '0.5', frecuencia: 'monthly' }
];

// Conecta con Firestore con permisos de administrador (credencial guardada en Vercel)
function obtenerFirestore() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  }
  return getFirestore();
}

// Convierte caracteres especiales (&, <, >) para que el XML no se rompa
function limpiarXml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Arma el bloque XML de una página
function armarUrl(ruta, prioridad, frecuencia) {
  return `<url>
<loc>${limpiarXml(DOMINIO + ruta)}</loc>
<priority>${prioridad}</priority>
<changefreq>${frecuencia}</changefreq>
</url>`;
}

export default async function handler(req, res) {
  try {
    const db = obtenerFirestore();
    const bloques = [];

    // 1) Páginas fijas
    PAGINAS_FIJAS.forEach((p) => {
      bloques.push(armarUrl(p.ruta, p.prioridad, p.frecuencia));
    });

    // 2) Profesionales: mismos que muestra la Cartilla
    //    (se saltean los que tienen visible en false o no tienen slug)
    const snapProfesionales = await db.collection('profesionales').get();
    snapProfesionales.forEach((doc) => {
      const data = doc.data();
      if (data.visible === false) return;
      if (!data.slug) return;
      bloques.push(armarUrl(`/profesional/${encodeURIComponent(data.slug)}`, '0.8', 'weekly'));
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${bloques.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Guarda la respuesta 1 hora para no consultar Firestore en cada visita
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error al armar el sitemap:', error);
    res.status(500).send('No se pudo generar el sitemap');
  }
}