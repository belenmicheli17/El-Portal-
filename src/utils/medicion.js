// Medición anónima de la Cartilla y los perfiles, para saber quién usa El Portal y qué busca.
// NO guarda datos personales: ni quién tocó, ni su mail, ni su ubicación. Solo qué canal se tocó,
// en qué perfil, si había sesión iniciada (si no hay, casi seguro es un tutor) y de dónde venía.
// Lo ve solo la admin, en el panel: Actividad de la Cartilla.
import { useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const UID_ADMIN = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';
const MARCA_CARTILLA = 'vioCartilla';
// Para no contar dos veces el mismo contacto (ej: doble toque): mismo perfil y canal, una vez cada 30 min
const ESPERA_REPETIDO_MS = 30 * 60 * 1000;

// Medir en el sitio publicado y en las vistas previas de Vercel, no en la compu de desarrollo
const medicionActiva = () => typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

// La Cartilla avisa que la persona pasó por ahí (dura lo que dura la pestaña abierta)
export const marcarVisitaCartilla = () => {
  try { sessionStorage.setItem(MARCA_CARTILLA, '1'); } catch { /* sin almacenamiento: no pasa nada */ }
};

// ¿De dónde llegó a este perfil?
const origenDeLaVisita = () => {
  try { if (sessionStorage.getItem(MARCA_CARTILLA)) return 'cartilla'; } catch { /* nada */ }
  const ref = (document.referrer || '').toLowerCase();
  if (!ref) return 'directo';
  if (ref.includes(window.location.hostname)) return 'sitio';
  if (ref.includes('google.')) return 'google';
  if (ref.includes('instagram.')) return 'instagram';
  if (ref.includes('facebook.')) return 'facebook';
  if (ref.includes('whatsapp.')) return 'whatsapp';
  return 'otro';
};

// Qué tipo de contacto es un link (o null si no es un contacto)
export const canalDelLink = (href = '') => {
  const h = String(href).toLowerCase();
  if (/(wa\.me|api\.whatsapp\.com)\/(send\?phone=)?\+?\d/.test(h)) return 'whatsapp'; // con número (los de "compartir" no lo tienen)
  if (h.startsWith('mailto:')) return 'mail';
  if (h.startsWith('tel:')) return 'telefono';
  if (h.includes('instagram.com')) return 'instagram';
  if (h.includes('google.com/maps') || h.includes('maps.google.') || h.includes('goo.gl/maps')) return 'mapa';
  if (/^https?:\/\//.test(h) && !h.includes(window.location.hostname)) return 'web';
  return null;
};

// Guarda un contacto. canal: whatsapp | mail | telefono | instagram | mapa | web
export async function registrarContacto({ perfilId, tipoPerfil, canal }) {
  if (!medicionActiva() || !perfilId || !canal) return;
  const uid = auth.currentUser?.uid || '';
  // Los toques de la propia persona en su perfil, y los de la admin, no cuentan
  if (uid && (uid === perfilId || uid === UID_ADMIN)) return;
  const clave = `contacto:${perfilId}:${canal}`;
  try {
    const ultimo = Number(localStorage.getItem(clave) || 0);
    if (Date.now() - ultimo < ESPERA_REPETIDO_MS) return;
    localStorage.setItem(clave, String(Date.now()));
  } catch { /* sin almacenamiento: se cuenta igual */ }
  try {
    await addDoc(collection(db, 'contactos'), {
      perfilId: String(perfilId).slice(0, 128),
      tipoPerfil: tipoPerfil === 'clinica' ? 'clinica' : 'profesional',
      canal,
      conSesion: !!uid,
      desde: origenDeLaVisita(),
      fecha: serverTimestamp()
    });
  } catch (error) {
    // La medición nunca tiene que molestar a quien navega
    console.warn('No se pudo registrar el contacto:', error?.code || error);
  }
}

// En una página de perfil: escucha todos los toques y cuenta los que son links de contacto.
// Los botones que abren un contacto sin ser link llevan data-contacto="whatsapp" (o el canal que sea).
// Lo que está dentro de [data-no-medir] (ej: la ventana de Compartir) no cuenta.
export function useMedirContactos(perfilId, tipoPerfil) {
  const datos = useRef({ perfilId, tipoPerfil });
  // Guardamos el perfil actual (cuando termina de cargar cambia el id) sin volver a enganchar el oído
  useEffect(() => { datos.current = { perfilId, tipoPerfil }; }, [perfilId, tipoPerfil]);

  useEffect(() => {
    const alTocar = (evento) => {
      const objetivo = evento.target;
      if (!(objetivo instanceof Element) || objetivo.closest('[data-no-medir]')) return;
      // Solo el contenido del perfil: la barra de arriba y el pie (ej: el Instagram de El Portal) no cuentan
      if (!objetivo.closest('main') || objetivo.closest('nav, footer')) return;
      const marcado = objetivo.closest('[data-contacto]');
      const canal = marcado ? marcado.getAttribute('data-contacto') : canalDelLink(objetivo.closest('a[href]')?.getAttribute('href'));
      if (canal) registrarContacto({ ...datos.current, canal });
    };
    // "capture": lo escuchamos antes de que el link abra otra pestaña
    document.addEventListener('click', alTocar, true);
    return () => document.removeEventListener('click', alTocar, true);
  }, []);
}

// Guarda una búsqueda de la Cartilla (qué filtró y cuántos resultados vio)
export async function registrarBusqueda(busqueda) {
  if (!medicionActiva()) return;
  const uid = auth.currentUser?.uid || '';
  if (uid === UID_ADMIN) return;
  const lista = (valor) => (Array.isArray(valor) ? valor : []).map((x) => String(x).slice(0, 60)).slice(0, 10);
  try {
    await addDoc(collection(db, 'busquedasCartilla'), {
      texto: String(busqueda.texto || '').trim().toLowerCase().slice(0, 80),
      pestana: ['todos', 'especialistas', 'clinicas'].includes(busqueda.pestana) ? busqueda.pestana : 'todos',
      grupo: String(busqueda.grupo || '').slice(0, 60),
      especialidades: lista(busqueda.especialidades),
      zonas: lista(busqueda.zonas),
      extras: lista(busqueda.extras),
      resultados: Math.max(0, Math.min(9999, Number(busqueda.resultados) || 0)),
      conSesion: !!uid,
      fecha: serverTimestamp()
    });
  } catch (error) {
    console.warn('No se pudo registrar la búsqueda:', error?.code || error);
  }
}
