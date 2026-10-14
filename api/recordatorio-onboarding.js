// ============================================================
// Función de Vercel (alarma diaria): manda UN mail de recordatorio
// a las cuentas que se registraron hace 5 días o más y dejaron
// el cuestionario de alta a la mitad (onboardingCompleto en false).
//
// Cómo funciona:
//  1) Vercel la despierta una vez por día (se programa en vercel.json).
//  2) Busca en Firestore las cuentas con el cuestionario sin terminar.
//  3) A las que cumplen las condiciones les manda la plantilla de Brevo.
//  4) Les marca recordatorioEnviado: true para que el mail salga una sola vez.
//
// Seguridad: solo responde si viene con la clave CRON_SECRET
// (Vercel la manda sola cuando suena la alarma).
// ============================================================
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Número de la plantilla "termina tu perfil" en Brevo
const ID_PLANTILLA_RECORDATORIO = 6;

// A partir de cuántos días sin terminar se manda el recordatorio
const DIAS_PARA_RECORDAR = 5;

// Cuentas más viejas que esto no reciben nada (evita mandarle mails
// a cuentas de prueba o abandonadas hace mucho tiempo)
const DIAS_MAXIMOS = 30;

const UN_DIA = 24 * 60 * 60 * 1000;

// Conecta con Firestore con permisos de administrador (credencial guardada en Vercel)
function obtenerFirestore() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  }
  return getFirestore();
}

// Manda la plantilla por Brevo. Si Brevo responde con error, lanza una excepción.
async function enviarRecordatorio(email) {
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      to: [{ email }],
      templateId: ID_PLANTILLA_RECORDATORIO,
      // Brevo no acepta "params" vacío, así que mandamos un dato que la plantilla no usa
      params: { tipo: 'recordatorio' }
    })
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
  }
}

export default async function handler(req, res) {
  // 1) Solo Vercel (con la clave secreta) puede despertar esta función
  const encabezado = req.headers.authorization || '';
  if (!process.env.CRON_SECRET || encabezado !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const db = obtenerFirestore();
    const ahora = Date.now();
    // fechaRegistro se guarda como texto ISO, que se puede comparar como texto
    const limiteReciente = new Date(ahora - DIAS_PARA_RECORDAR * UN_DIA).toISOString();
    const limiteAntiguo = new Date(ahora - DIAS_MAXIMOS * UN_DIA).toISOString();

    // 2) Traemos las cuentas con el cuestionario sin terminar y filtramos el resto acá
    const snap = await db.collection('usuarios').where('onboardingCompleto', '==', false).get();

    let enviados = 0;
    let errores = 0;

    for (const documento of snap.docs) {
      const usuario = documento.data();

      if (usuario.recordatorioEnviado === true) continue; // ya se le mandó
      if (!usuario.email || !usuario.fechaRegistro) continue;
      if (usuario.rol !== 'profesional' && usuario.rol !== 'clinica') continue;
      if (usuario.fechaRegistro > limiteReciente) continue; // todavía no pasaron 5 días
      if (usuario.fechaRegistro < limiteAntiguo) continue; // demasiado vieja

      try {
        await enviarRecordatorio(usuario.email);
        // 3) Marcamos la cuenta para no volver a mandarle el mail
        await documento.ref.update({
          recordatorioEnviado: true,
          recordatorioFecha: new Date().toISOString()
        });
        enviados++;
      } catch (error) {
        console.error('No se pudo mandar el recordatorio a', documento.id, error);
        errores++;
      }
    }

    return res.status(200).json({ ok: true, revisadas: snap.size, enviados, errores });
  } catch (error) {
    console.error('Error en el recordatorio de onboarding:', error);
    return res.status(500).json({ error: 'Error inesperado' });
  }
}