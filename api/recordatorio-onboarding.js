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

// Estudiantes: el recordatorio les llega a la semana (el mail está escrito acá abajo, no en Brevo)
const DIAS_PARA_RECORDAR_ESTUDIANTES = 7;

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

// Arma el HTML de un mail con el estilo del Portal (colores y letra de la marca).
// Se usa para los mails que no tienen plantilla en Brevo (Brevo igual es el que los manda).
const escaparHtml = (t) => String(t || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function armarMailHtml({ titulo, parrafos, boton, enlace, posdata }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;padding:0;background:#F4F7F7;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:24px;overflow:hidden;">
        <tr><td style="background:#1A3D3D;padding:22px 32px;">
          <span style="font-size:18px;font-weight:bold;color:#FFFFFF;letter-spacing:0.5px;">El Portal Veterinario</span>
        </td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <h1 style="margin:0 0 18px 0;font-size:24px;line-height:1.25;color:#1A3D3D;">${escaparHtml(titulo)}</h1>
          ${parrafos.map((p) => `<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#333333;">${p}</p>`).join('')}
        </td></tr>
        <tr><td style="padding:12px 32px 28px 32px;">
          <a href="${enlace}" style="display:inline-block;background:#2D6A6A;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:14px;">${escaparHtml(boton)}</a>
        </td></tr>
        ${posdata ? `<tr><td style="padding:0 32px 28px 32px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#666666;">${posdata}</p></td></tr>` : ''}
        <tr><td style="background:#FFFFFF;border-top:1px solid #E8EFEF;padding:18px 32px;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#666666;">Portal Veterinario · <a href="https://www.portalveterinario.ar" style="color:#2D6A6A;">portalveterinario.ar</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Mail "terminá tu perfil" para estudiantes (Brevo lo manda, el diseño está acá)
async function enviarRecordatorioEstudiante(email, nombre) {
  const primerNombre = String(nombre || '').trim().split(/\s+/)[0];
  const html = armarMailHtml({
    titulo: 'Te falta poco para terminar tu perfil',
    parrafos: [
      `Hola${primerNombre ? ' ' + escaparHtml(primerNombre) : ''}! Empezaste tu perfil de estudiante en El Portal Veterinario y quedó a mitad de camino.`,
      'Son unos minutos: completás tus datos, subís un comprobante de que estás cursando y listo. Con tu cuenta verificada vas a poder postularte a búsquedas de asistente en clínicas y mostrarte disponible en la Bolsa de Trabajo.'
    ],
    boton: 'Terminar mi perfil',
    enlace: 'https://www.portalveterinario.ar/onboarding-alumnx',
    posdata: 'Sirve cualquiera de estos: certificado de alumno regular, inscripción a materias o condición de cursos vigentes (foto, captura o PDF).'
  });
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Portal Veterinario', email: 'hola@portalveterinario.ar' },
      to: [{ email }],
      subject: 'Te falta poco para terminar tu perfil de estudiante',
      htmlContent: html
    })
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
  }
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
    const limiteRecienteEstudiantes = new Date(ahora - DIAS_PARA_RECORDAR_ESTUDIANTES * UN_DIA).toISOString();
    const limiteAntiguo = new Date(ahora - DIAS_MAXIMOS * UN_DIA).toISOString();

    // 2) Traemos las cuentas con el cuestionario sin terminar y filtramos el resto acá
    const snap = await db.collection('usuarios').where('onboardingCompleto', '==', false).get();

    let enviados = 0;
    let errores = 0;

    for (const documento of snap.docs) {
      const usuario = documento.data();

      if (usuario.recordatorioEnviado === true) continue; // ya se le mandó
      if (!usuario.email || !usuario.fechaRegistro) continue;
      const esEstudiante = usuario.rol === 'alumnx';
      if (usuario.rol !== 'profesional' && usuario.rol !== 'clinica' && !esEstudiante) continue;
      if (usuario.esPrueba === true) continue; // cuentas de prueba de la admin
      // todavía no pasaron los días (5 para profesionales y clínicas, 7 para estudiantes)
      if (usuario.fechaRegistro > (esEstudiante ? limiteRecienteEstudiantes : limiteReciente)) continue;
      if (usuario.fechaRegistro < limiteAntiguo) continue; // demasiado vieja

      try {
        if (esEstudiante) await enviarRecordatorioEstudiante(usuario.email, usuario.nombre);
        else await enviarRecordatorio(usuario.email);
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