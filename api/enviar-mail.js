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
//  - curso_inscripcion: la pide quien se inscribe a una capacitación (con sesión).
//    Los datos del curso (título, mail del docente) se leen de la base, no del navegador.
//  - curso_aprobado / curso_rechazado: solo los puede pedir la admin.
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

// Lee un curso de la base (las capacitaciones son públicas, alcanza con la clave del proyecto)
async function leerCurso(cursoId) {
  const url = `https://firestore.googleapis.com/v1/projects/el-portal-veterinario-3ab72/databases/(default)/documents/capacitaciones/${encodeURIComponent(cursoId)}?key=${process.env.FIREBASE_API_KEY}`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) return null;
  const { fields = {} } = await respuesta.json();
  const texto = (campo) => fields[campo]?.stringValue || '';
  return { titulo: texto('titulo'), email: texto('email'), instructor: texto('instructor'), modalidad: texto('modalidad'), duracion: texto('duracion'), linkExterno: texto('linkExterno') };
}

const REMITENTE = { name: 'Portal Veterinario', email: 'hola@portalveterinario.ar' };
const recortar = (t, max = 120) => String(t || '').trim().slice(0, max);
const esMail = (t) => /^\S+@\S+\.\S+$/.test(String(t || ''));

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

  // 2b) Inscripción a una capacitación: mail al docente y confirmación a quien se inscribió
  if (tipo === 'curso_inscripcion') {
    const { cursoId, inscripto = {} } = req.body || {};
    const curso = cursoId ? await leerCurso(cursoId).catch(() => null) : null;
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    const nombreInscripto = recortar(inscripto.nombre, 80);
    const mailInscripto = recortar(inscripto.email, 120);
    if (!esMail(mailInscripto)) return res.status(400).json({ error: 'Email inválido' });

    if (esMail(curso.email)) {
      const respuestaDocente = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: REMITENTE,
          to: [{ email: curso.email }],
          subject: `Nueva inscripción — ${curso.titulo}`,
          textContent: `Hola, ${curso.instructor || 'equipo docente'}.\n\n¡Tenés una nueva inscripción en tu curso "${curso.titulo}"!\n\nDatos del inscripto:\nNombre: ${nombreInscripto}\nEmail: ${mailInscripto}\nMatrícula: ${recortar(inscripto.matricula, 40) || 'No aplica'}\nCelular: ${recortar(inscripto.celular, 40) || 'No informado'}\n\nYa podés agregarlo a tu plataforma de dictado.\n\nEl equipo de Portal Veterinario`
        })
      }).catch(() => null);
      if (!respuestaDocente?.ok) console.error('No se pudo mandar el mail al docente');
    }

    return enviarPorBrevo(res, {
      sender: REMITENTE,
      to: [{ email: mailInscripto }],
      subject: `Confirmación de inscripción — ${curso.titulo}`,
      textContent: `Hola, ${nombreInscripto}.\n\nConfirmamos tu inscripción al curso "${curso.titulo}".\n\nDatos del curso:\nModalidad: ${curso.modalidad}\nDuración: ${curso.duracion}\n${curso.linkExterno ? `Link de acceso: ${curso.linkExterno}\n` : ''}\nSi tenés consultas sobre el curso, podés escribirle directamente al docente a: ${curso.email || 'el contacto que figura en la plataforma'}.\n\n¡Gracias por confiar en Portal Veterinario!\nEl equipo de Portal Veterinario`
    });
  }

  // 2c) Aprobación y rechazo (de cuentas y de cursos): solo la admin
  if (sesion.uid !== ADMIN_UID) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  // Cursos aprobados o rechazados (mail de texto simple a la institución)
  if (tipo === 'curso_aprobado' || tipo === 'curso_rechazado') {
    const { titulo, instructor } = req.body || {};
    if (!esMail(email)) return res.status(400).json({ error: 'Email inválido' });
    const saludo = `Hola, ${recortar(instructor, 80) || 'equipo docente'}.`;
    const textoMail = tipo === 'curso_aprobado'
      ? `${saludo}\n\nQueríamos contarte que tu curso "${recortar(titulo)}" fue revisado y aprobado por nuestro equipo.\n\nA partir de ahora está visible en el repertorio de capacitaciones de Portal Veterinario y los profesionales ya pueden inscribirse.\n\nSi tenés alguna consulta, respondé este mail y te ayudamos.\n\n¡Muchas gracias por ser parte de Portal Veterinario!\nEl equipo de Portal Veterinario`
      : `${saludo}\n\nRevisamos tu propuesta "${recortar(titulo)}" y por el momento no podemos publicarla porque encontramos lo siguiente:\n\n${recortar(motivo, 1500)}\n\nPodés corregirlo y volver a enviarlo cuando esté listo. Si tenés dudas sobre los cambios necesarios, respondé este mail y te orientamos.\n\nEl equipo de Portal Veterinario`;
    return enviarPorBrevo(res, {
      sender: REMITENTE,
      to: [{ email }],
      subject: tipo === 'curso_aprobado' ? 'Tu curso fue aprobado — Portal Veterinario' : 'Tu curso necesita ajustes — Portal Veterinario',
      textContent: textoMail
    });
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