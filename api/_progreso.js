// Copia del cálculo de avance para el servidor.
// Si cambiás src/utils/progresoPerfil.js, cambialo también acá.
const soloDigitos = (v) => String(v || '').replace(/\D/g, '');
const whatsappCompleto = (v) => soloDigitos(v).replace(/^54/, '').length >= 8;
const contarServicios = (servicios) => Object.values(servicios || {}).reduce(
  (total, g) => total + (g.subOpcionesSeleccionadas || []).length + (g.serviciosPersonalizados || []).length, 0
);
const horaValida = (valor) => valor !== '' && !Number.isNaN(Number(valor)) && Number(valor) >= 0 && Number(valor) <= 24;

const PESOS = { identidad: 20, bio: 15, trayectoria: 15, servicios: 15, casos: 20, contacto: 15 };
const NOMBRES = {
  identidad: 'foto y datos básicos',
  bio: 'presentación',
  trayectoria: 'trayectoria',
  servicios: 'servicios',
  casos: 'casos clínicos',
  contacto: 'contacto'
};
const NOMBRES_CLINICA = {
  identidad: 'foto y presentación',
  contacto: 'contacto y horarios',
  guardia: 'teléfono de guardia',
  servicios: 'servicios',
  staff: 'equipo'
};

function avanceProfesional(datos, incluyeCasos) {
  const servicios = datos.servicios && !Array.isArray(datos.servicios) ? Object.values(datos.servicios) : [];
  const completas = {
    identidad: !!(datos.foto && datos.nombre && datos.especialidad && datos.matricula),
    bio: (datos.bio || '').length > 50,
    trayectoria: (datos.trayectoria || []).length > 0,
    servicios: servicios.some(s => s.activo && ((s.subOpcionesSeleccionadas || []).length > 0 || (s.serviciosPersonalizados || []).length > 0)),
    casos: (datos.casos || []).length > 0,
    contacto: !!(datos.emailContacto && (datos.whatsappNum || datos.instagram || datos.linkedin))
  };
  const partes = Object.keys(PESOS).filter(p => incluyeCasos || p !== 'casos');
  const maximo = partes.reduce((s, p) => s + PESOS[p], 0);
  const obtenido = partes.reduce((s, p) => s + (completas[p] ? PESOS[p] : 0), 0);
  const faltan = partes.filter(p => !completas[p]);
  return { porcentaje: Math.round((obtenido / maximo) * 100), faltantes: faltan.map(p => NOMBRES[p]) };
}

function avanceClinica(datos, esPro) {
  const incompletas = new Set();
  const horarios = datos.horarios || {};
  const horariosCargados = datos.guardia24hs || (horaValida(horarios.semanaDesde) && horaValida(horarios.semanaHasta));

  if (!(datos.nombre || '').trim() || !datos.foto || (datos.descripcion || '').trim().length < 30) incompletas.add('identidad');
  if (!datos.placeId || !whatsappCompleto(datos.whatsapp) || !horariosCargados) incompletas.add('contacto');
  if (datos.guardia24hs && !whatsappCompleto(datos.telefonoGuardia)) incompletas.add('guardia');
  if (esPro && contarServicios(datos.servicios) === 0) incompletas.add('servicios');
  if (esPro && !(datos.staff || []).some((m) => (m.nombre || '').trim())) incompletas.add('staff');

  const evaluadas = ['identidad', 'contacto', ...(datos.guardia24hs ? ['guardia'] : []), ...(esPro ? ['servicios', 'staff'] : [])];
  const faltan = evaluadas.filter((s) => incompletas.has(s));
  return {
    porcentaje: Math.round(100 * (evaluadas.length - faltan.length) / evaluadas.length),
    faltantes: faltan.map((s) => NOMBRES_CLINICA[s])
  };
}

export function calcularAvance(rol, datos, esPro) {
  return rol === 'clinica' ? avanceClinica(datos, esPro) : avanceProfesional(datos, esPro);
}