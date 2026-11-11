// Cuando una clínica publica una oferta, manda un mail a cada profesional que:
// atiende en esa provincia, tiene alguna de las áreas de la oferta en sus servicios,
// está verificado y no se dio de baja de los avisos. A vos te llega un resumen.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firmaBaja } from './_firma.js';

// Número de la plantilla en Brevo (cambialo por el # que te dé Brevo al crearla)
const ID_PLANTILLA_AVISO_OFERTA = 8;
const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';
const MAIL_ADMIN = 'portalveterinario.ar@gmail.com';
const SITIO = 'https://www.portalveterinario.ar';
const MAXIMO_MAILS = 300;

function iniciarFirebase() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return { db: getFirestore(), auth: getAuth() };
}

const serviciosDePerfil = (data) => {
  const servicios = data?.servicios;
  if (!servicios) return [];
  if (Array.isArray(servicios)) return servicios.map((s) => (typeof s === 'string' ? s : s?.titulo)).filter(Boolean);
  return Object.values(servicios)
    .filter((g) => g?.activo)
    .flatMap((g) => [...(g.subOpcionesSeleccionadas || []), ...(g.serviciosPersonalizados || [])]);
};

async function enviarBrevo(cuerpo) {
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify(cuerpo)
  });
  if (!respuesta.ok) throw new Error(`Brevo respondió ${respuesta.status}: ${await respuesta.text()}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { db, auth } = iniciarFirebase();

  // 1) Quién pide: tiene que ser quien publicó la oferta (o la admin)
  const encabezado = req.headers.authorization || '';
  const idToken = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : '';
  let uid = '';
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: 'Sesión inválida' });
  }

  const { ofertaId } = req.body || {};
  if (!ofertaId || typeof ofertaId !== 'string') return res.status(400).json({ error: 'Falta la oferta' });

  const refOferta = db.collection('ofertasEmpleo').doc(ofertaId);
  const snap = await refOferta.get();
  if (!snap.exists) return res.status(404).json({ error: 'La oferta no existe' });
  const oferta = snap.data();
  if (oferta.creadorId !== uid && uid !== ADMIN_UID) return res.status(403).json({ error: 'No autorizado' });
  if (oferta.estado !== 'activo') return res.status(400).json({ error: 'La oferta no está activa' });

  // 2) Se avisa una sola vez por oferta
  const yaEnviado = await db.runTransaction(async (t) => {
    const actual = await t.get(refOferta);
    if (actual.data()?.avisoEnviado) return true;
    t.update(refOferta, { avisoEnviado: true });
    return false;
  });
  if (yaEnviado) return res.status(200).json({ ok: true, enviados: 0, motivo: 'ya enviado' });

  const areas = Array.isArray(oferta.areas) ? oferta.areas : [];
  const puesto = oferta.rol === 'veterinario' && areas.length ? areas.join(' · ') : 'Puesto en clínica';
  // En Buenos Aires se muestra la zona (Norte, Sur, Oeste...) en vez de la provincia
  const region = oferta.provincia === 'Buenos Aires' && oferta.zonaBA ? oferta.zonaBA : oferta.provincia;
  const zona = [oferta.barrio || oferta.localidad, region].filter(Boolean).join(' · ');
  const linkOferta = `${SITIO}/bolsa-de-trabajo?oferta=${ofertaId}`;

  // 3) Buscamos a quién le corresponde
  const destinatarios = [];
  if (oferta.rol === 'veterinario' && areas.length && oferta.provincia) {
    const perfiles = await db.collection('profesionales').where('provincia', '==', oferta.provincia).get();
    for (const perfil of perfiles.docs) {
      const datos = perfil.data();
      if (perfil.id === oferta.creadorId || datos.visible === false) continue;
      const suyos = [...serviciosDePerfil(datos), datos.especialidad].filter(Boolean);
      if (!areas.some((a) => suyos.includes(a))) continue;

      const usuario = (await db.collection('usuarios').doc(perfil.id).get()).data() || {};
      if (usuario.avisosBolsa === false || usuario.estado !== 'activo') continue;

      let email = '';
      try { email = (await auth.getUser(perfil.id)).email || ''; } catch { email = ''; }
      if (!email) continue;

      destinatarios.push({ uid: perfil.id, email, nombre: datos.nombre || 'colega' });
      if (destinatarios.length >= MAXIMO_MAILS) break;
    }
  }

  // 4) Mandamos los mails (uno por persona, cada uno con su link de baja)
  let enviados = 0;
  if (ID_PLANTILLA_AVISO_OFERTA) {
    for (const d of destinatarios) {
      try {
        await enviarBrevo({
          to: [{ email: d.email, name: d.nombre }],
          templateId: ID_PLANTILLA_AVISO_OFERTA,
          params: {
            nombre: d.nombre,
            puesto,
            clinica: oferta.clinicaNombre || 'Una clínica',
            zona,
            jornada: (oferta.jornada || []).join(' · '),
            linkOferta,
            linkBaja: `${SITIO}/api/baja-avisos?u=${d.uid}&t=${firmaBaja(d.uid)}`
          }
        });
        enviados += 1;
      } catch (e) {
        console.error('No se pudo mandar el aviso a', d.uid, e.message);
      }
    }
  }

  // 5) Resumen para vos
  try {
    await enviarBrevo({
      sender: { name: 'Portal Veterinario', email: 'hola@portalveterinario.ar' },
      to: [{ email: MAIL_ADMIN }],
      subject: `Bolsa: nueva oferta de ${oferta.clinicaNombre || 'una clínica'}`,
      htmlContent: `<p><strong>${puesto}</strong> en ${oferta.clinicaNombre || ''} (${zona}).</p>
        <p><a href="${linkOferta}">Ver la oferta</a></p>
        <p>Avisos por mail: ${enviados} de ${destinatarios.length} profesionales que coinciden.${ID_PLANTILLA_AVISO_OFERTA ? '' : ' (Todavía no está cargado el número de plantilla, así que no se mandó ninguno.)'}</p>`
    });
  } catch (e) {
    console.error('No se pudo mandar el resumen:', e.message);
  }

  return res.status(200).json({ ok: true, enviados, coinciden: destinatarios.length });
}
