// ============================================================
// Función de Vercel: manda por Brevo el mail de "Recuperar contraseña".
// Firebase crea el link seguro para cambiar la clave y Brevo lo envía
// con el diseño del Portal. Vive en el servidor: las claves (Brevo y
// Firebase) nunca llegan al navegador.
// ============================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Número de la plantilla en Brevo (se ve con el # en Transaccional > Plantillas)
const ID_PLANTILLA_RECUPERAR = 5;

// Tiempo mínimo entre dos pedidos para el mismo mail (evita que alguien llene de mails a otra persona)
const SEGUNDOS_ENTRE_PEDIDOS = 60;
const ultimosPedidos = new Map();

// Nos conectamos a Firebase como administradores (una sola vez)
function iniciarFirebaseAdmin() {
  if (getApps().length === 0) {
    const credenciales = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(credenciales) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Si ya pidieron hace poco, contestamos "ok" sin mandar otro mail
  const ahora = Date.now();
  if (ahora - (ultimosPedidos.get(email) || 0) < SEGUNDOS_ENTRE_PEDIDOS * 1000) {
    return res.status(200).json({ ok: true });
  }
  ultimosPedidos.set(email, ahora);

  // Limpieza: si la lista crece mucho, borramos los pedidos viejos
  if (ultimosPedidos.size > 500) {
    for (const [clave, momento] of ultimosPedidos) {
      if (ahora - momento > SEGUNDOS_ENTRE_PEDIDOS * 1000) ultimosPedidos.delete(clave);
    }
  }

  try {
    iniciarFirebaseAdmin();

    // Firebase crea el link seguro para cambiar la contraseña
    const linkFirebase = await getAuth().generatePasswordResetLink(email);

    // Armamos el link del Portal: tomamos el código secreto del link de Firebase
    // y se lo mandamos a nuestra propia página de "Nueva contraseña"
    const codigo = new URL(linkFirebase).searchParams.get('oobCode');
    if (!codigo) {
      throw new Error('Firebase no devolvió el código de recuperación');
    }
    const linkPortal = `https://www.portalveterinario.ar/restablecer-clave?mode=resetPassword&oobCode=${encodeURIComponent(codigo)}`;

    // Brevo manda la plantilla con el link adentro
    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        to: [{ email }],
        templateId: ID_PLANTILLA_RECUPERAR,
        params: { link: linkPortal }
      })
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Brevo respondió con error:', respuesta.status, detalle);
      ultimosPedidos.delete(email); // que pueda reintentar enseguida
      return res.status(502).json({ error: 'No se pudo enviar el mail' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    // Si no existe una cuenta con ese mail contestamos "ok" igual:
    // así no le contamos a nadie qué mails están registrados
    if (error?.code === 'auth/email-not-found') {
      return res.status(200).json({ ok: true });
    }
    console.error('Error en recuperar-clave:', error);
    ultimosPedidos.delete(email); // que pueda reintentar enseguida
    return res.status(500).json({ error: 'No se pudo enviar el mail' });
  }
}