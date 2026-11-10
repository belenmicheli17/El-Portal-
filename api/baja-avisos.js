// Link "No quiero recibir más avisos" del mail de ofertas nuevas.
// Da de baja con un solo clic, sin iniciar sesión, y muestra una página de confirmación.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firmaBaja } from './_firma.js';

function obtenerFirestore() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore();
}

const pagina = (titulo, texto) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} | Portal Veterinario</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#F4F7F7;font-family:Inter,Arial,sans-serif;color:#333333;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;box-sizing:border-box">
<div style="background:#FFFFFF;border-radius:24px;padding:36px 28px;max-width:440px;width:100%;text-align:center;border:1px solid #E5E7EB">
<p style="font-family:Montserrat,Arial,sans-serif;font-weight:800;color:#1A3D3D;font-size:14px;margin:0 0 20px">Portal Veterinario</p>
<h1 style="font-family:Montserrat,Arial,sans-serif;font-weight:800;color:#1A3D3D;font-size:24px;line-height:1.2;margin:0 0 12px">${titulo}</h1>
<p style="font-size:15px;line-height:1.6;color:#666666;margin:0 0 24px">${texto}</p>
<a href="https://www.portalveterinario.ar/bolsa-de-trabajo" style="display:inline-block;background:#2D6A6A;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:14px 24px;border-radius:16px">Ir a la Bolsa de Trabajo</a>
</div></body></html>`;

export default async function handler(req, res) {
  const uid = String(req.query?.u || '');
  const firma = String(req.query?.t || '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!uid || firma !== firmaBaja(uid)) {
    return res.status(400).send(pagina('Link no válido', 'No pudimos procesar el pedido. Podés apagar los avisos desde tu editor, en «Bolsa de Trabajo».'));
  }

  try {
    await obtenerFirestore().collection('usuarios').doc(uid).set({ avisosBolsa: false }, { merge: true });
    return res.status(200).send(pagina('Listo, no vas a recibir más avisos', 'Ya no te vamos a mandar mails de ofertas nuevas. Si cambiás de idea, los volvés a activar desde tu editor, en «Bolsa de Trabajo».'));
  } catch (e) {
    console.error('Error dando de baja:', e);
    return res.status(500).send(pagina('Algo salió mal', 'Probá de nuevo en un rato, o apagá los avisos desde tu editor, en «Bolsa de Trabajo».'));
  }
}
