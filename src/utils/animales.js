import animalesData from '../data/animales.json';

// Si el profesional atiende exóticos o animales de campo, agrega los animales al texto de la opción.
// Ej: "Animales Exóticos" -> "Animales Exóticos: Aves, Reptiles"
export function opcionesConAnimales(opciones, data) {
  return opciones.map((op) => {
    if (op === animalesData.exoticos.padre && data.animalesExoticos?.length) {
      return `${op}: ${data.animalesExoticos.join(', ')}`;
    }
    if (op === animalesData.campo.padre && data.animalesCampo?.length) {
      return `${op}: ${data.animalesCampo.join(', ')}`;
    }
    return op;
  });
}