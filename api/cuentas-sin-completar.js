// Lista las cuentas que existen en Authentication pero NO tienen documento en "usuarios"
// (se crearon cuando las reglas de Firestore estuvieron incompletas y quedaron sin datos).
// Solo la admin puede pedirla. Se usa en el panel admin > Gestión de usuarios.
// Vive en el servidor porque listar las cuentas de Authentication solo se puede con firebase-admin.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// UID de la admin (el mismo que usan las reglas de Firestore y las otras funciones)
const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';

// Cuántos documentos se consultan juntos en cada vuelta
const TAMANO_LOTE = 300;

function iniciarFirebase() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return { db: getFirestore(), auth: getAuth() };
}

// Fecha de Authentication (texto UTC) -> fecha ISO, o null si no viene
const aIso = (texto) => {
  const fecha = texto ? new Date(texto) : null;
  return fecha && !isNaN(fecha.getTime()) ? fecha.toISOString() : null;
};

export default async function handler(req, res) {
  // Es una lista que cambia todo el tiempo: que no se guarde en ningún caché
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { db, auth } = iniciarFirebase();

    // 1) Quién pide: tiene que ser la admin
    const encabezado = req.headers.authorization || '';
    const idToken = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : '';
    let uid = '';
    try {
      uid = (await auth.verifyIdToken(idToken)).uid;
    } catch {
      return res.status(401).json({ error: 'Sesión inválida' });
    }
    if (uid !== ADMIN_UID) return res.status(403).json({ error: 'No autorizado' });

    // 2) Todas las cuentas de Authentication (Firebase las entrega de a 1000)
    const cuentas = [];
    let pagina;
    do {
      const resultado = await auth.listUsers(1000, pagina);
      cuentas.push(...resultado.users);
      pagina = resultado.pageToken;
    } while (pagina);

    // 3) Cuáles no tienen documento en "usuarios" (se pide solo un campo para no traer datos de más)
    const sinCompletar = [];
    for (let i = 0; i < cuentas.length; i += TAMANO_LOTE) {
      const lote = cuentas.slice(i, i + TAMANO_LOTE);
      const referencias = lote.map((c) => db.collection('usuarios').doc(c.uid));
      const documentos = await db.getAll(...referencias, { fieldMask: ['rol'] });
      documentos.forEach((documento, indice) => {
        if (documento.exists) return;
        const cuenta = lote[indice];
        sinCompletar.push({
          uid: cuenta.uid,
          email: cuenta.email || '',
          creada: aIso(cuenta.metadata?.creationTime),
          ultimoIngreso: aIso(cuenta.metadata?.lastSignInTime)
        });
      });
    }

    // Las más nuevas primero
    sinCompletar.sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));

    return res.status(200).json({ ok: true, totalCuentas: cuentas.length, sinCompletar });
  } catch (error) {
    console.error('Error listando cuentas sin completar:', error);
    return res.status(500).json({ error: 'No se pudo armar la lista' });
  }
}
