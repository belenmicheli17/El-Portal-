import { whatsappCompleto, contarServicios } from '../components/editor/EditorComponents';
// Cuánto vale cada parte del perfil (suman 100 con casos clínicos)
const PESOS = { identidad: 20, bio: 15, trayectoria: 15, servicios: 15, casos: 20, contacto: 15 };

// Nombres amigables para decirle a la persona qué le falta
const NOMBRES = {
  identidad: 'foto y datos básicos',
  bio: 'presentación',
  trayectoria: 'trayectoria',
  servicios: 'servicios',
  casos: 'casos clínicos',
  contacto: 'contacto'
};

// datos: el documento del perfil (lo que se guarda en 'profesionales')
// incluyeCasos: true si el plan permite casos clínicos (PRO / socio vitalicio)
export const calcularProgresoPerfil = (datos = {}, incluyeCasos = true) => {
  // Armamos qué partes están completas (true) o faltan (false)
  const servicios = datos.servicios && !Array.isArray(datos.servicios) ? Object.values(datos.servicios) : [];
  const completas = {
    identidad: !!(datos.foto && datos.nombre && datos.especialidad && datos.matricula),
    bio: (datos.bio || '').length > 50,
    trayectoria: (datos.trayectoria || []).length > 0,
    servicios: servicios.some(s => s.activo && ((s.subOpcionesSeleccionadas || []).length > 0 || (s.serviciosPersonalizados || []).length > 0)),
    casos: (datos.casos || []).length > 0,
    contacto: !!(datos.emailContacto && (datos.whatsappNum || datos.instagram || datos.linkedin))
  };

  // Si el plan no incluye casos clínicos, esa parte no cuenta ni suma ni resta
  const partes = Object.keys(PESOS).filter(parte => incluyeCasos || parte !== 'casos');
  const maximo = partes.reduce((suma, parte) => suma + PESOS[parte], 0);
  const obtenido = partes.reduce((suma, parte) => suma + (completas[parte] ? PESOS[parte] : 0), 0);

  const faltan = partes.filter(parte => !completas[parte]);
  return {
    porcentaje: Math.round((obtenido / maximo) * 100),
    faltantes: faltan.map(parte => NOMBRES[parte]),
    pendientes: faltan.map(parte => ({ clave: parte, texto: NOMBRES[parte] }))
  };
};// ── Clínicas ──────────────────────────────────────────────

export const horaValida = (valor) => valor !== '' && !Number.isNaN(Number(valor)) && Number(valor) >= 0 && Number(valor) <= 24;

const NOMBRES_CLINICA = {
  identidad: 'foto y presentación',
  contacto: 'contacto y horarios',
  guardia: 'teléfono de guardia',
  servicios: 'servicios',
  staff: 'equipo'
};

export const analizarPerfilClinica = (datos = {}, esPro = false) => {
  const incompletas = new Set();
  const horarios = datos.horarios || {};
  const horariosCargados = datos.guardia24hs || (horaValida(horarios.semanaDesde) && horaValida(horarios.semanaHasta));

  if (!(datos.nombre || '').trim() || !datos.foto || (datos.descripcion || '').trim().length < 30) incompletas.add('identidad');
  if (!datos.placeId || !whatsappCompleto(datos.whatsapp) || !horariosCargados) incompletas.add('contacto');
  if (datos.guardia24hs && !whatsappCompleto(datos.telefonoGuardia)) incompletas.add('guardia');
  if (esPro && contarServicios(datos.servicios) === 0) incompletas.add('servicios');
  if (esPro && !(datos.staff || []).some((m) => (m.nombre || '').trim())) incompletas.add('staff');

  const evaluadas = ['identidad', 'contacto', ...(datos.guardia24hs ? ['guardia'] : []), ...(esPro ? ['servicios', 'staff'] : [])];
  const progreso = Math.round(100 * evaluadas.filter((s) => !incompletas.has(s)).length / evaluadas.length);

  return { incompletas, progreso, evaluadas };
};

export const calcularProgresoClinica = (datos, esPro) => {
  const { incompletas, progreso, evaluadas } = analizarPerfilClinica(datos, esPro);
  const faltan = evaluadas.filter((s) => incompletas.has(s));
  return {
    porcentaje: progreso,
    faltantes: faltan.map((s) => NOMBRES_CLINICA[s]),
    pendientes: faltan.map((s) => ({ clave: s, texto: NOMBRES_CLINICA[s] }))
  };
};