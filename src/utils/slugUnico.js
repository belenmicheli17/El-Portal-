// ============================================================
// Ayudante para armar el "slug" (la parte final del link del perfil,
// por ejemplo /profesional/maria-gonzalez) sin que dos personas
// con el mismo nombre se pisen.
// ============================================================
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Convierte un nombre en una dirección amigable (sin tildes, espacios ni símbolos)
export const generarSlug = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

// Cuatro letras o números al azar para diferenciar nombres repetidos
const sufijoAleatorio = () => Math.random().toString(36).slice(2, 6);

// Mira en Firestore si alguien que NO sea esta cuenta ya usa ese slug
const slugDisponible = async (slug, uid) => {
  const consulta = query(collection(db, 'profesionales'), where('slug', '==', slug), limit(2));
  const resultado = await getDocs(consulta);
  return resultado.docs.every((documento) => documento.id === uid);
};

// Devuelve un slug libre: el del nombre si está disponible, o el nombre + 4 caracteres si ya está ocupado
export const generarSlugUnico = async (nombreCompleto, uid) => {
  const base = generarSlug(nombreCompleto) || 'profesional';
  try {
    if (await slugDisponible(base, uid)) return base;

    for (let intento = 0; intento < 5; intento++) {
      const candidato = `${base}-${sufijoAleatorio()}`;
      if (await slugDisponible(candidato, uid)) return candidato;
    }
  } catch (error) {
    // Si Firebase no responde, no frenamos el registro: seguimos con un slug diferenciado
    console.error('No se pudo comprobar si el slug está libre:', error);
  }
  // Último recurso: sumar un número basado en la hora, que no se repite
  return `${base}-${Date.now().toString(36)}`;
};