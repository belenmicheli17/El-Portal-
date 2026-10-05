// ============================================================
// Función de Vercel: envía los mails del Portal por Brevo.
// Vive en el servidor, así la clave de Brevo nunca se ve en el navegador.
//
// Tipos de mail:
//  - rechazo / aprobacion: solo los puede pedir la admin.
//  - bienvenida: la pide cada persona al registrarse, pero solo se manda
//    a SU PROPIO mail y solo si la cuenta se creó hace pocos minutos.
// ============================================================

// UID de la admin (el mismo que usan las reglas de Firestore)
const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';

// Quién manda el mail y adónde llegan las respuestas
const REMITENTE = { name: 'El Portal Veterinario', email: 'hola@portalveterinario.ar' };
const RESPONDER_A = { name: 'El Portal Veterinario', email: 'portalveterinario.ar@gmail.com' };

// Adónde lleva el botón del mail
const URL_LOGIN = 'https://www.portalveterinario.ar/login';

// Plantilla de bienvenida diseñada en Brevo (Template ID 1)
const ID_PLANTILLA_BIENVENIDA = 1;

// Tiempo máximo (en minutos) desde que se creó la cuenta para poder pedir la bienvenida
const MINUTOS_PARA_BIENVENIDA = 15;

// Evita que un texto escrito a mano rompa el HTML del mail (y lo convierte en saltos de línea)
const escaparHtml = (texto) => String(texto ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/\n/g, '<br>');

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

// Arma el mail con la identidad del Portal (Petróleo y Esmeralda, tablas para que lo lean bien todos los correos)
function armarHtml({ titulo, parrafosHtml, motivo, botonTexto }) {
  const bloqueMotivo = motivo
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
         <tr><td style="background:#F4F7F7;border-radius:16px;padding:20px 22px;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;color:#333333;">
           <strong style="color:#1A3D3D;">Motivo</strong><br>${escaparHtml(motivo)}
         </td></tr>
       </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F4F7F7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
        <tr><td style="background:#1A3D3D;padding:26px 32px;font-family:Montserrat,Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;">
          Portal Veterinario<span style="color:#4DB6AC;">.</span>
        </td></tr>
        <tr><td style="padding:32px;font-family:Inter,Arial,sans-serif;font-size:17px;line-height:1.6;color:#333333;">
          <h1 style="margin:0 0 18px;font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:1.25;font-weight:800;color:#1A3D3D;">${titulo}</h1>
          ${parrafosHtml}
          ${bloqueMotivo}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
            <tr><td style="background:#2D6A6A;border-radius:12px;">
              <a href="${URL_LOGIN}" style="display:inline-block;padding:16px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${botonTexto}</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#666666;">Equipo de El Portal Veterinario. Si tenés dudas, respondé este mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Los mails de verificación que puede pedir la admin
const PLANTILLAS = {
  rechazo: ({ nombre, motivo }) => ({
    asunto: 'Necesitamos que revises tus datos en El Portal',
    html: armarHtml({
      titulo: 'Revisamos tu solicitud',
      parrafosHtml: `<p style="margin:0 0 16px;">Hola ${escaparHtml(nombre)},</p>
        <p style="margin:0 0 20px;">Revisamos tu solicitud para sumarte a El Portal y por ahora no pudimos verificar tu matrícula.</p>`,
      motivo,
      botonTexto: 'Corregir y volver a enviar'
    }).replace(
      // Texto que va después del motivo y antes del botón
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">',
      '<p style="margin:0 0 20px;">Tus datos están guardados, no tenés que cargar todo de nuevo. Ingresá, corregí lo que haga falta y volvé a enviar tu solicitud: la revisamos otra vez.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">'
    )
  }),

  aprobacion: ({ nombre }) => ({
    asunto: '¡Tu cuenta fue verificada!',
    html: armarHtml({
      titulo: '¡Tu cuenta fue verificada!',
      parrafosHtml: `<p style="margin:0 0 16px;">Hola ${escaparHtml(nombre)},</p>
        <p style="margin:0 0 20px;">Verificamos tu matrícula y tu perfil ya está activo en El Portal. Ya podés ingresar, completar tu perfil y recorrer todo el ecosistema.</p>`,
      motivo: '',
      botonTexto: 'Ingresar a El Portal'
    })
  })
};

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

  const { tipo, email, nombre, motivo } = req.body || {};

  // 2a) Bienvenida: cada persona, solo para su propio mail y recién registrada
  if (tipo === 'bienvenida') {
    const esReciente = Date.now() - sesion.creadaEn < MINUTOS_PARA_BIENVENIDA * 60 * 1000;
    if (!sesion.email || !esReciente) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    return enviarPorBrevo(res, {
      to: [{ email: sesion.email }],
      templateId: ID_PLANTILLA_BIENVENIDA,
      params: { nombre: 'colega' }
    });
  }

  // 2b) Rechazo y aprobación: solo la admin
  if (sesion.uid !== ADMIN_UID) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  if (!PLANTILLAS[tipo]) {
    return res.status(400).json({ error: 'Tipo de mail desconocido' });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const { asunto, html } = PLANTILLAS[tipo]({ nombre: nombre || '', motivo: motivo || '' });
  return enviarPorBrevo(res, {
    sender: REMITENTE,
    replyTo: RESPONDER_A,
    to: [{ email, name: nombre || undefined }],
    subject: asunto,
    htmlContent: html
  });
}