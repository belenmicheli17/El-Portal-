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

export const ROLES = [
  { id: 'veterinario', label: 'Veterinario/a' },
  { id: 'asistente', label: 'Asistente' },
  { id: 'recepcion', label: 'Recepción' }
];

// Las áreas son las mismas pills que usa el perfil (especialidades.json)
export const GRUPOS_AREAS = especialidadesData.map((g) => ({ id: g.id, grupo: g.grupo, opciones: g.opciones }));
export const TODAS_LAS_AREAS = especialidadesData.flatMap((g) => g.opciones);

export const JORNADAS = ['Full-time', 'Part-time', 'Por guardias', 'Reemplazo temporal', 'A convenir'];

export const HORARIOS = ['Mañana', 'Tarde', 'Noche', 'Fines de semana', 'Rotativo', 'A convenir'];

export const EXPERIENCIAS = ['Sin experiencia (junior)', '1 a 3 años', 'Más de 3 años', 'Especialista certificado/a'];

export const REQUISITOS = [
  'Experiencia en cirugía',
  'Experiencia en guardia',
  'Manejo de ecógrafo',
  'Manejo de rayos X',
  'Disponibilidad fines de semana',
  'Monotributo'
];

export const EQUIPO = [
  ...(equipamientoData[0]?.opciones || []),
  'Ecógrafo',
  'Rayos X digital',
  'Anestesia inhalatoria',
  'Monitor multiparamétrico',
  'Electrocardiógrafo'
];

export const FORMAS_CONTACTO_DISPONIBLE = [
  { id: 'whatsapp', label: 'WhatsApp', ayuda: 'Recomendado: es lo que más usan las clínicas' },
  { id: 'email', label: 'Mail' },
  { id: 'perfil', label: 'Solo ver mi perfil' }
];
