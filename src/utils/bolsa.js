// Ayudantes de la Bolsa de Trabajo (se usan en la página, los formularios y la postulación)
import { ROLES, SOLO_VERIFICADOS, DIAS_DE_VIGENCIA } from '../data/bolsaOpciones';
import { armarLinkWhatsapp } from './whatsapp';

export const SITIO = 'https://www.portalveterinario.ar';
export const UN_DIA = 24 * 60 * 60 * 1000;
export const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';

export const etiquetaRol = (id) => ROLES.find((r) => r.id === id)?.label || 'Veterinario/a';

// Título corto del puesto: "Ecografía · Cardiología" para veterinarios, o el rol para los demás
export const tituloPuesto = (oferta) => {
  const areas = Array.isArray(oferta?.areas) ? oferta.areas : [];
  if (oferta?.rol === 'veterinario' && areas.length > 0) return areas.join(' · ');
  return etiquetaRol(oferta?.rol);
};

// Convierte un Timestamp de Firebase, una fecha o milisegundos a milisegundos
export const aMilisegundos = (valor) => {
  if (!valor) return 0;
  if (typeof valor === 'number') return valor;
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
};

// "Hoy", "Ayer", "Hace 5 días", "Hace 2 semanas"
export const tiempoDesde = (valor) => {
  const ms = aMilisegundos(valor);
  if (!ms) return 'Recién publicada';
  const dias = Math.floor((Date.now() - ms) / UN_DIA);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 14) return `Hace ${dias} días`;
  return `Hace ${Math.floor(dias / 7)} semanas`;
};

export const diasRestantes = (item) => Math.ceil((aMilisegundos(item?.vencimientoMillis) - Date.now()) / UN_DIA);

export const estaVencida = (item) => aMilisegundos(item?.vencimientoMillis) <= Date.now();

// Se ve en la lista pública: activa y sin vencer
export const estaVigente = (item) => item?.estado === 'activo' && !estaVencida(item);

export const nuevoVencimiento = () => Date.now() + DIAS_DE_VIGENCIA * UN_DIA;

// Qué puede hacer la persona en la Bolsa según su cuenta
export const permisosBolsa = (currentUser) => {
  const esAdmin = currentUser?.uid === ADMIN_UID || currentUser?.rol === 'admin';
  const verificada = esAdmin || !SOLO_VERIFICADOS || currentUser?.estado === 'activo';
  return {
    conSesion: !!currentUser,
    esAdmin,
    verificada,
    puedePublicarOferta: !!currentUser && (currentUser.rol === 'clinica' || esAdmin) && verificada,
    puedeMarcarseDisponible: !!currentUser && currentUser.rol === 'profesional' && verificada,
    puedePostularse: !!currentUser && currentUser.rol === 'profesional' && verificada
  };
};

// Lista plana de servicios del perfil (el perfil los guarda agrupados)
export const serviciosDePerfil = (data) => {
  const servicios = data?.servicios;
  if (!servicios) return [];
  if (Array.isArray(servicios)) return servicios.map((s) => (typeof s === 'string' ? s : s?.titulo)).filter(Boolean);
  return Object.values(servicios)
    .filter((g) => g?.activo)
    .flatMap((g) => [...(g.subOpcionesSeleccionadas || []), ...(g.serviciosPersonalizados || [])]);
};

export const conPrefijo54 = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.startsWith('54') ? digitos : `54${digitos}`;
};

export const linkWhatsapp = (numero, mensaje) => armarLinkWhatsapp(conPrefijo54(numero), mensaje);

export const linkPerfilProfesional = (slug) => (slug ? `${SITIO}/profesional/${slug}` : '');

export const linkOferta = (id) => `${SITIO}/bolsa-de-trabajo?oferta=${id}`;

export const zonaTexto = (item) => {
  const partes = [item?.barrio || item?.localidad, item?.provincia].filter(Boolean);
  return [...new Set(partes)].join(', ');
};
