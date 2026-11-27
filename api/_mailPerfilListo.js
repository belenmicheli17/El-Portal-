// Mail "tu perfil ya está listo": sale UNA vez, cuando el perfil llega al 80% (lo manda recordatorio-perfil.js).
// Tiene el link de la página, un botón para copiarlo (abre la página con la ventana de compartir abierta)
// y, para clínicas, un botón que abre su ficha de Google Maps para pegar el link como sitio web.
import { escaparHtml, armarMailHtml } from './_mailHtml.js';

const SITIO = 'https://www.portalveterinario.ar';

// Caja con el link de la página (se puede tocar para abrirla o mantener apretado para copiarlo)
const cajaLink = (link) => `<a href="${link}" style="display:block;margin-top:8px;background:#F4F7F7;border:1px solid #E8EFEF;border-radius:12px;padding:12px 14px;color:#2D6A6A;font-weight:bold;text-decoration:none;word-break:break-all;">${escaparHtml(link.replace(/^https?:\/\/(www\.)?/, ''))}</a>`;

// Arma asunto y HTML. esClinica: true para clínicas. placeId: el lugar de la clínica en Google (si lo cargó).
export function armarMailPerfilListo({ esClinica, nombre, slug, placeId = '' }) {
  const nombreLimpio = String(nombre || '').trim();
  const linkPagina = `${SITIO}/${esClinica ? 'clinica' : 'profesional'}/${slug}`;
  // ?compartir=1 abre la ventana de compartir de la página, que tiene el botón "Copiar"
  const linkCopiar = `${linkPagina}?compartir=1`;

  if (esClinica) {
    const linkGoogle = placeId
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nombreLimpio || 'Veterinaria')}&query_place_id=${encodeURIComponent(placeId)}`
      : '';
    return {
      asunto: '¡El perfil de tu clínica en El Portal ya está listo!',
      html: armarMailHtml({
        titulo: `¡El perfil de ${nombreLimpio || 'tu clínica'} ya está listo!`,
        parrafos: [
          'Ya está listo para que tutores y profesionales los encuentren en El Portal Veterinario.',
          `Este es el link de su página:${cajaLink(linkPagina)}`,
          '<strong>¿Cómo sacarle provecho?</strong> Copien el link y pónganlo como sitio web en la ficha de Google de la clínica: así quien los busca en Google Maps llega directo a su página. También súmenlo a la bio de Instagram y a la descripción de WhatsApp.'
        ],
        boton: 'Copiar el link',
        enlace: linkCopiar,
        botonSecundario: linkGoogle ? 'Abrir nuestra ficha de Google' : '',
        enlaceSecundario: linkGoogle,
        posdata: 'Pueden seguir completándolo y actualizarlo cuando quieran desde el Ecosistema. Cualquier duda, respondan este mail.'
      })
    };
  }

  const primerNombre = nombreLimpio.split(/\s+/)[0] || '';
  return {
    asunto: '¡Tu perfil en El Portal ya está listo!',
    html: armarMailHtml({
      titulo: primerNombre ? `¡Tu perfil ya está listo, ${primerNombre}!` : '¡Tu perfil ya está listo!',
      parrafos: [
        'Ya está listo para que tutores y colegas te encuentren en El Portal Veterinario.',
        `Este es el link de tu página:${cajaLink(linkPagina)}`,
        '<strong>¿Cómo sacarle provecho?</strong> Ponelo en la bio de tu Instagram y en tu info de WhatsApp. Así quien te busca llega directo a tus servicios, tu trayectoria y cómo contactarte.'
      ],
      boton: 'Copiar mi link',
      enlace: linkCopiar,
      posdata: 'Podés seguir completándolo y actualizarlo cuando quieras desde tu Ecosistema. Cualquier duda, respondé este mail.'
    })
  };
}
