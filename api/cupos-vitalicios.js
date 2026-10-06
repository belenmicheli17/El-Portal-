// ============================================================
// Función de Vercel: cuenta cuántos socios vitalicios hay.
// Devuelve solo el número, nunca datos de las personas.
// Así la barra de cupos funciona aunque Firestore no deje leer "usuarios" al público.
// ============================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Nos conectamos a Firebase como administradores (una sola vez)
function iniciarFirebaseAdmin() {
  if (getApps().length === 0) {
    const credenciales = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(credenciales) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    iniciarFirebaseAdmin();
    const consulta = getFirestore().collection('usuarios').where('socioVitalicio', '==', true);
    const resultado = await consulta.count().get();

    // Guardamos la respuesta 1 minuto para no consultar Firebase en cada visita
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ total: resultado.data().count });
  } catch (error) {
    console.error('Error contando socios vitalicios:', error);
    return res.status(500).json({ error: 'No se pudo contar' });
  }
}