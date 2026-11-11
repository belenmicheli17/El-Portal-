// Listas de la Bolsa de Trabajo. Para sumar o sacar una opción, se cambia acá y listo.
import especialidadesData from './especialidades.json';
import equipamientoData from './equipamientoClinicas.json';

// true = solo publican y se postulan las cuentas que vos aprobaste (estado "activo").
// Si lo cambiás, cambiá también la función puedeUsarBolsa() en las reglas de Firestore.
export const SOLO_VERIFICADOS = true;

// Días que dura una publicación (se renueva gratis desde "Mis publicaciones")
export const DIAS_DE_VIGENCIA = 30;

// Cuántas áreas principales puede elegir un profesional disponible
export const MAX_AREAS_DISPONIBLE = 3;

// "oculto: true" = existe (para publicaciones viejas) pero ya no se muestra para elegir
// "sinAreas: true" = para ese puesto no se eligen especialidades (se apagan)
export const ROLES = [
  { id: 'veterinario', label: 'Profesional' },
  { id: 'asistente', label: 'Asistente (alumno/a)', sinAreas: true },
  { id: 'peluquero', label: 'Peluquero/a', sinAreas: true },
  { id: 'recepcion', label: 'Recepción', sinAreas: true, oculto: true },
  { id: 'alumno', label: 'Alumno/a', sinAreas: true, oculto: true }
];
export const ROLES_VISIBLES = ROLES.filter((r) => !r.oculto);
export const rolSinAreas = (id) => !!ROLES.find((r) => r.id === id)?.sinAreas;

// Zonas de la provincia de Buenos Aires (para no mostrar solo "Buenos Aires")
export const ZONAS_BA = ['Zona Norte', 'Zona Sur', 'Zona Oeste', 'Interior de la provincia'];

// Las áreas son las mismas pills que usa el perfil (especialidades.json)
export const GRUPOS_AREAS = especialidadesData.map((g) => ({ id: g.id, grupo: g.grupo, opciones: g.opciones }));
export const TODAS_LAS_AREAS = especialidadesData.flatMap((g) => g.opciones);

export const JORNADAS = ['Guardia en clínica general (diurna)', 'Guardia 24 h (nocturna)', 'Reemplazo', 'A convenir'];

export const HORARIOS = ['Mañana', 'Tarde', 'Noche', 'Fines de semana', 'Rotativo', 'A convenir'];

export const EXPERIENCIAS = ['Sin experiencia (junior)', '1 a 3 años', 'Más de 3 años', 'Especialista'];

export const REQUISITOS = [
  'Experiencia en cirugía',
  'Manejo de emergencias',
  'Manejo de ecógrafo',
  'Manejo de rayos X',
  'Disponibilidad fines de semana'
];

// Sale del equipamiento del editor de clínica, con algunos cambios solo para la Bolsa
export const EQUIPO = [
  ...(equipamientoData[0]?.opciones || []).map((e) => (e === 'Farmacia y vacunatorio' ? 'Farmacia' : e)),
  'Ecógrafo',
  'Rayos X digital',
  'Anestesia inhalatoria',
  'Pet shop',
  'Peluquería',
  'Servicios a domicilio'
];

export const FORMAS_CONTACTO_DISPONIBLE = [
  { id: 'whatsapp', label: 'WhatsApp', ayuda: 'Recomendado: es lo que más usan las clínicas' },
  { id: 'email', label: 'Mail' }
];
