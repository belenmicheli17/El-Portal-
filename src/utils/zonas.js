// Unifica los nombres de zona que devuelve Google, que no siempre los escribe igual.
// Ejemplo: la Ciudad de Buenos Aires aparece como "Cdad. Autónoma de Buenos Aires",
// "Ciudad Autónoma de Buenos Aires" o solo "Buenos Aires". Todas pasan a ser "CABA".

// Saca tildes y mayúsculas para comparar
const limpiar = (texto) =>
  (texto || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

// Los 48 barrios de la Ciudad de Buenos Aires
const BARRIOS_CABA = [
  'agronomia', 'almagro', 'balvanera', 'barracas', 'belgrano', 'boedo', 'caballito',
  'chacarita', 'coghlan', 'colegiales', 'constitucion', 'flores', 'floresta',
  'la boca', 'la paternal', 'liniers', 'mataderos', 'monte castro', 'montserrat',
  'nueva pompeya', 'nunez', 'palermo', 'parque avellaneda', 'parque chacabuco',
  'parque chas', 'parque patricios', 'puerto madero', 'recoleta', 'retiro',
  'saavedra', 'san cristobal', 'san nicolas', 'san telmo', 'velez sarsfield',
  'versalles', 'villa crespo', 'villa del parque', 'villa devoto', 'villa general mitre',
  'villa lugano', 'villa luro', 'villa ortuzar', 'villa pueyrredon', 'villa real',
  'villa riachuelo', 'villa santa rita', 'villa soldati', 'villa urquiza'
];

// Devuelve el nombre de la localidad ya unificado.
// - localidad: lo que viene guardado o sacado de la dirección
// - extras: { direccion, provincia, barrio } para poder reconocer a CABA cuando solo dice "Buenos Aires"
export const normalizarLocalidad = (localidad, extras = {}) => {
  const original = (localidad || '').trim();
  if (!original) return '';
  const t = limpiar(original);

  // Variantes claras de CABA
  if (/autonoma|capital federal|^c\.?a\.?b\.?a\.?$/.test(t)) return 'CABA';

  // "Buenos Aires" a secas puede ser CABA o la provincia: lo resolvemos con pistas
  if (t === 'buenos aires') {
    const { direccion = '', provincia = '', barrio = '' } = extras;
    const codigoPostalCaba = /\bC\d{4}/.test(direccion || ''); // los códigos de CABA empiezan con C
    const provinciaCaba = limpiar(provincia) === 'caba';
    const barrioCaba = BARRIOS_CABA.includes(limpiar(barrio));
    if (codigoPostalCaba || provinciaCaba || barrioCaba) return 'CABA';
  }

  return original;
};
