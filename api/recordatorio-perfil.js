// Alarma diaria con dos mails (cada uno sale UNA sola vez por persona):
// 1) "terminá de completar tu perfil": a quien terminó el cuestionario hace 7 días o más y tiene el perfil por debajo del 50%.
// 2) "tu perfil ya está listo": a quien llega al 80% (con el link de su página y cómo usarlo).
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { calcularAvance } from './_progreso.js';
import { armarMailPerfilListo } from './_mailPerfilListo.js';

// Mail "perfil listo": desde qué porcentaje sale
const AVANCE_PERFIL_LISTO = 80;
// La primera vez que corre, a quien YA está en ese porcentaje no se le manda (se anota como "ya visto")
// y a vos te llega una copia de cómo se ve. Desde ahí, sale a cada persona cuando llega al 80%.
const REF_LINEA_BASE = ['settings', 'mailPerfilListo'];

const ID_PLANTILLA_PERFIL = 7;
const DIAS_PARA_AVISAR = 7;
const DIAS_MAXIMOS = 45;
const AVANCE_MAXIMO = 50;
const UN_DIA = 24 * 60 * 60 * 1000;
const SITIO = 'https://www.portalveterinario.ar';
const COLECCIONES = { profesional: 'profesionales', clinica: 'clinicas' };

// true = no le manda a nadie, solo te manda un resumen a vos. Pasalo a false cuando te cierre.
const MODO_PRUEBA = false;
const MAIL_ADMIN = 'portalveterinario.ar@gmail.com';

function obtenerFirestore() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore();
}

async function enviarMail(email, params) {
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({ to: [{ email }], templateId: ID_PLANTILLA_PERFIL, params })
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
  }
}

async function enviarResumen(revisadas, sinPerfil, lista) {
  const html = `<p>Prueba del mail "perfil incompleto". No se mandó a nadie.</p>
    <p>Cuentas revisadas: ${revisadas}. Sin perfil encontrado: ${sinPerfil}.</p>
    <p>Les llegaría a ${lista.length}:</p>
    <ul>${lista.map((l) => `<li>${l}</li>`).join('')}</ul>`;
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'Portal Veterinario', email: 'hola@portalveterinario.ar' },
      to: [{ email: MAIL_ADMIN }],
      subject: 'Prueba: mail de perfil incompleto',
      htmlContent: html
    })
  });
  if (!respuesta.ok) console.error('No se pudo mandar el resumen', await respuesta.text());
}

// Manda el mail "perfil listo" con el diseño del Portal (sin plantilla de Brevo)
async function enviarMailHtml(email, asunto, html) {
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({ sender: { name: 'Portal Veterinario', email: 'hola@portalveterinario.ar' }, to: [{ email }], subject: asunto, htmlContent: html })
  });
  if (!respuesta.ok) throw new Error(`Brevo respondió ${respuesta.status}: ${await respuesta.text()}`);
}

// Recorre las cuentas con cuestionario terminado y manda "tu perfil ya está listo" a quien llegó al 80%
async function mandarPerfilListo(db, cuentas, simular) {
  const refBase = db.collection(REF_LINEA_BASE[0]).doc(REF_LINEA_BASE[1]);
  const lineaBaseHecha = (await refBase.get()).data()?.lineaBaseFecha;
  const resultado = { enviados: 0, omitidosPrimeraVez: 0, errores: 0, lista: [] };
  let ejemplo = null; // para mandarte una copia la primera vez

  for (const documento of cuentas) {
    const usuario = documento.data();
    if (usuario.perfilListoMailEnviado === true) continue;
    if (usuario.esPrueba === true || !usuario.email || usuario.estado === 'suspendido') continue;
    const coleccion = COLECCIONES[usuario.rol];
    if (!coleccion) continue;

    const perfilSnap = await db.collection(coleccion).doc(documento.id).get();
    if (!perfilSnap.exists) continue;
    const perfil = perfilSnap.data();
    // Si el perfil no se ve todavía (sin verificar), el link no le serviría
    if (perfil.visible === false) continue;
    const slug = perfil.slug || usuario.slug || '';
    if (!slug) continue;

    const esPro = perfil.planActual === 'pro' || perfil.socioVitalicio === true || usuario.socioVitalicio === true;
    const avance = calcularAvance(usuario.rol, perfil, esPro);
    if (avance.porcentaje < AVANCE_PERFIL_LISTO) continue;

    const esClinica = usuario.rol === 'clinica';
    const mail = armarMailPerfilListo({ esClinica, nombre: perfil.nombre || usuario.nombre || '', slug, placeId: perfil.placeId || '' });
    resultado.lista.push(`${usuario.email} (${avance.porcentaje}%)`);
    if (simular) continue;

    if (!lineaBaseHecha) {
      // Primera vez: ya estaban en el 80% antes de activar el mail, así que no se les manda
      if (!ejemplo) ejemplo = mail;
      await documento.ref.update({ perfilListoMailEnviado: true, perfilListoMailOmitido: true });
      resultado.omitidosPrimeraVez++;
      continue;
    }

    try {
      await enviarMailHtml(usuario.email, mail.asunto, mail.html);
      await documento.ref.update({ perfilListoMailEnviado: true, perfilListoMailFecha: new Date().toISOString() });
      resultado.enviados++;
    } catch (error) {
      console.error('No se pudo mandar el mail de perfil listo a', documento.id, error);
      resultado.errores++;
    }
  }

  if (!simular && !lineaBaseHecha) {
    await refBase.set({ lineaBaseFecha: new Date().toISOString(), omitidosPrimeraVez: resultado.omitidosPrimeraVez });
    // Copia para vos: así ves el mail real, con los datos de una de las cuentas
    const muestra = ejemplo || armarMailPerfilListo({ esClinica: false, nombre: 'Lucía Fernández', slug: 'ejemplo' });
    try {
      await enviarMailHtml(MAIL_ADMIN, `Prueba: ${muestra.asunto}`, muestra.html);
      await enviarMailHtml(MAIL_ADMIN, 'Mail "perfil listo" activado',
        `<p>Ya quedó activado el mail "tu perfil ya está listo" (desde el ${AVANCE_PERFIL_LISTO}%).</p>
        <p>Hoy no se le mandó a nadie: ${resultado.omitidosPrimeraVez} cuentas ya estaban en ese porcentaje y quedaron anotadas para no recibirlo.</p>
        <p>Desde mañana, le llega a cada persona cuando su perfil llegue al ${AVANCE_PERFIL_LISTO}%. En el otro mail tenés una copia de cómo se ve.</p>`);
    } catch (error) {
      console.error('No se pudo mandar la copia del mail de perfil listo', error);
    }
  }
  return resultado;
}

export default async function handler(req, res) {
  const encabezado = req.headers.authorization || '';
  if (!process.env.CRON_SECRET || encabezado !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const simular = MODO_PRUEBA || req.query?.simular === '1';

  try {
    const db = obtenerFirestore();
    const ahora = Date.now();
    const limiteReciente = new Date(ahora - DIAS_PARA_AVISAR * UN_DIA).toISOString();
    const limiteAntiguo = new Date(ahora - DIAS_MAXIMOS * UN_DIA).toISOString();

    const snap = await db.collection('usuarios').where('onboardingCompleto', '==', true).get();

    let enviados = 0;
    let errores = 0;
    let sinPerfil = 0;
    const lista = [];
    let vistaPreviaEnviada = false;

    for (const documento of snap.docs) {
      const usuario = documento.data();

      if (usuario.perfilRecordatorioEnviado === true) continue;
      if (usuario.esPrueba === true || !usuario.email) continue;
      const coleccion = COLECCIONES[usuario.rol];
      if (!coleccion) continue;

      const fechaBase = usuario.onboardingFecha || usuario.fechaRegistro;
      if (!fechaBase || fechaBase > limiteReciente || fechaBase < limiteAntiguo) continue;

      const perfilSnap = await db.collection(coleccion).doc(documento.id).get();
      if (!perfilSnap.exists) { sinPerfil++; continue; }
      const perfil = perfilSnap.data();

      if (perfil.visible === false) continue;

      const esPro = perfil.planActual === 'pro' || perfil.socioVitalicio === true || usuario.socioVitalicio === true;
      const avance = calcularAvance(usuario.rol, perfil, esPro);
      if (avance.porcentaje >= AVANCE_MAXIMO) continue;

      const esClinica = usuario.rol === 'clinica';
      const slug = perfil.slug || usuario.slug || '';
      const nombre = String(perfil.nombre || usuario.nombre || '').trim();
      const params = {
        saludo: esClinica ? `Hola, equipo de ${nombre}` : `Hola ${nombre.split(' ')[0]}`,
        porcentaje: String(avance.porcentaje),
        faltantes: avance.faltantes.join(', '),
        linkEditor: `${SITIO}/ecosistema`,
        linkPagina: `${SITIO}/${esClinica ? 'clinica' : 'profesional'}/${slug}`,
        consejo: esClinica
          ? 'Copiá este link y ponelo como sitio web en la ficha de Google de tu clínica: así quien te busca llega directo a tu página.'
          : 'Copiá este link y ponelo en la bio de tu Instagram y de tus redes: así quien te busca llega directo a tu página.'
      };

      if (simular) {
        lista.push(`${usuario.email} (${avance.porcentaje}%) falta: ${params.faltantes}`);
        // Una sola copia por corrida, a tu casilla, con los datos de la primera cuenta
        if (MODO_PRUEBA && !vistaPreviaEnviada) {
          try {
            await enviarMail(MAIL_ADMIN, params);
            vistaPreviaEnviada = true;
          } catch (error) {
            console.error('No se pudo mandar la vista previa', error);
          }
        }
        continue;
      }

      try {
        await enviarMail(usuario.email, params);
        await documento.ref.update({
          perfilRecordatorioEnviado: true,
          perfilRecordatorioFecha: new Date().toISOString()
        });
        enviados++;
      } catch (error) {
        console.error('No se pudo mandar el mail de perfil a', documento.id, error);
        errores++;
      }
    }

    if (MODO_PRUEBA) await enviarResumen(snap.size, sinPerfil, lista);

    // Segundo mail: "tu perfil ya está listo". Si falla, no frena la respuesta del primero.
    let perfilListo = null;
    try {
      perfilListo = await mandarPerfilListo(db, snap.docs, simular);
    } catch (error) {
      console.error('Error en el mail de perfil listo:', error);
    }

    return res.status(200).json({ ok: true, simular, revisadas: snap.size, enviados, errores, sinPerfil, lista, perfilListo });
  } catch (error) {
    console.error('Error en el recordatorio de perfil:', error);
    return res.status(500).json({ error: 'Error inesperado' });
  }
}