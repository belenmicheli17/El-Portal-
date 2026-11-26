// ============================================================
// Función de Vercel: envía los mails del Portal por Brevo.
// Vive en el servidor, así la clave de Brevo nunca se ve en el navegador.
// El diseño de casi todos los mails está en Brevo (Transaccional > Plantillas):
// acá elegimos qué plantilla mandar y con qué datos. Los de estudiantes están escritos acá.
//
// Tipos de mail:
//  - rechazo / aprobacion: solo los puede pedir la admin.
//  - bienvenida: la pide cada persona al registrarse, pero solo se manda
//    a SU PROPIO mail y solo si la cuenta se creó hace pocos minutos.
// ============================================================

// UID de la admin (el mismo que usan las reglas de Firestore)
const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';

// Números de las plantillas en Brevo (se ven con el # en la lista de plantillas)
const ID_PLANTILLA_BIENVENIDA = 1;
const ID_PLANTILLA_APROBADA = 3;
const ID_PLANTILLA_RECHAZADA = 4;

// Estudiantes: solo reciben el mail de aprobación, escrito acá abajo (no usa plantilla de Brevo).
// La bienvenida y el rechazo de estudiantes no se mandan.
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

function mailAprobacionEstudiante(nombre) {
  const primerNombre = String(nombre || '').trim().split(/\s+/)[0];
  return armarMailHtml({
    titulo: '¡Tu cuenta de estudiante está verificada!',
    parrafos: [
      `Hola${primerNombre ? ' ' + escaparHtml(primerNombre) : ''}! Ya sos parte de Portal Veterinario.`,
      'Desde ahora podés <strong>postularte en la Bolsa de Trabajo</strong> y <strong>mostrarte disponible</strong> para que las clínicas te encuentren.',
      'Un perfil completo, con foto, experiencia y dónde trabajaste, ayuda mucho a que te elijan.'
    ],
    boton: 'Ir a la Bolsa de Trabajo',
    enlace: 'https://www.portalveterinario.ar/bolsa-de-trabajo',
    posdata: 'Cualquier duda, respondé este mail.'
  });
}

// Tiempo máximo (en minutos) desde que se creó la cuenta para poder pedir la bienvenida
const MINUTOS_PARA_BIENVENIDA = 15;

// Le pregunta a Firebase de quién es la sesión (uid, mail y cuándo se creó la cuenta)
async function obtenerSesion(idToken) {
  const respuesta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );
  if (!respuesta.ok) return null;
  const datos = await respuesta.json();
  const usuario = datos.users?.[0];
  if (!usuario) return null;
  return {
    uid: usuario.localId,
    email: usuario.email || '',
    creadaEn: Number(usuario.createdAt) || 0
  };
}

// Manda el pedido a Brevo y devuelve la respuesta de la función
async function enviarPorBrevo(res, cuerpo) {
  try {
    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(cuerpo)
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Brevo respondió con error:', respuesta.status, detalle);
      return res.status(502).json({ error: 'No se pudo enviar el mail' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error llamando a Brevo:', error);
    return res.status(500).json({ error: 'Error inesperado al enviar' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // 1) Quién pide el mail: el navegador manda su sesión en el encabezado Authorization
  const encabezado = req.headers.authorization || '';
  const idToken = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : '';
  let sesion = null;
  try {
    sesion = idToken ? await obtenerSesion(idToken) : null;
  } catch (error) {
    console.error('Error comprobando la sesión:', error);
  }
  if (!sesion) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }

  const { tipo, email, nombre, motivo, rol } = req.body || {};
  const esAlumnx = rol === 'alumnx';
  // Si es de un alumno/a y todavía no hay plantilla para ese mail, no se manda (sin error)
  // Estudiantes: la bienvenida y el rechazo no se mandan (el de aprobación sí, más abajo)
  if (esAlumnx && (tipo === 'bienvenida' || tipo === 'rechazo')) {
    return res.status(200).json({ omitido: true });
  }

  // 2a) Bienvenida: cada persona, solo para su propio mail y recién registrada
  if (tipo === 'bienvenida') {
    const esReciente = Date.now() - sesion.creadaEn < MINUTOS_PARA_BIENVENIDA * 60 * 1000;
    if (!sesion.email || !esReciente) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    return enviarPorBrevo(res, {
      to: [{ email: sesion.email }],
      templateId: ID_PLANTILLA_BIENVENIDA,
      // Usamos el nombre que mandó la persona (recortado por seguridad); si no vino, "colega"
      params: { nombre: String(nombre || 'colega').trim().slice(0, 60) || 'colega' }
    });
  }

  // 2b) Aprobación y rechazo: solo la admin
  if (sesion.uid !== ADMIN_UID) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  if (tipo !== 'aprobacion' && tipo !== 'rechazo') {
    return res.status(400).json({ error: 'Tipo de mail desconocido' });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (esAlumnx && tipo === 'aprobacion') {
    return enviarPorBrevo(res, {
      sender: { name: 'Portal Veterinario', email: 'hola@portalveterinario.ar' },
      to: [{ email, name: nombre || undefined }],
      subject: '¡Tu cuenta de estudiante está verificada!',
      htmlContent: mailAprobacionEstudiante(nombre)
    });
  }

  return enviarPorBrevo(res, {
    to: [{ email, name: nombre || undefined }],
    templateId: tipo === 'aprobacion' ? ID_PLANTILLA_APROBADA : ID_PLANTILLA_RECHAZADA,
    params: { nombre: nombre || 'colega', motivo: motivo || '' }
  });
}