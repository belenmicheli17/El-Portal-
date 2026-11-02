// Alarma diaria: manda UN mail "terminá de completar tu perfil" a quien
// terminó el cuestionario hace 7 días o más y tiene el perfil por debajo del 70%.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { calcularAvance } from './_progreso.js';

const ID_PLANTILLA_PERFIL = 7; // ← poné el número real de la plantilla nueva
const DIAS_PARA_AVISAR = 7;
const DIAS_MAXIMOS = 45;
const AVANCE_MAXIMO = 50;
const UN_DIA = 24 * 60 * 60 * 1000;
const SITIO = 'https://www.portalveterinario.ar';
const COLECCIONES = { profesional: 'profesionales', clinica: 'clinicas' };

// true = no le manda a nadie, solo te manda un resumen a vos. Pasalo a false cuando te cierre.
const MODO_PRUEBA = true;
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
    return res.status(200).json({ ok: true, simular, revisadas: snap.size, enviados, errores, sinPerfil, lista });
  } catch (error) {
    console.error('Error en el recordatorio de perfil:', error);
    return res.status(500).json({ error: 'Error inesperado' });
  }
}