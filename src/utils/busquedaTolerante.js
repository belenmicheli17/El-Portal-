// Búsqueda tolerante: ignora tildes, mayúsculas, la "h" muda, b/v, s/z/c, ll/y y errores de tipeo chicos.

// Convierte un texto en "cómo suena" (hozonoterapia -> osonoterapia)
export function sonido(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ch/g, '#')        // "ch" se protege para que no se rompa
    .replace(/h/g, '')          // la h no suena
    .replace(/ll/g, 'y')
    .replace(/qu/g, 'k')
    .replace(/g(?=[ei])/g, 'j')
    .replace(/c(?=[ei])/g, 's')
    .replace(/z/g, 's')
    .replace(/c/g, 'k')
    .replace(/v/g, 'b')
    .replace(/w/g, 'b')
    .replace(/#/g, 'x')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/(.)\1+/g, '$1')   // letras dobles -> una sola
    .replace(/\s+/g, ' ')
    .trim();
}

// Cuántas letras de diferencia hay entre dos palabras
function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = temp;
    }
  }
  return fila[b.length];
}

// Palabras que la gente usa y que tienen que encontrar otra cosa.
// Ampliá esta lista cuando veas búsquedas que no encuentran nada. Se escribe normal, con tildes si querés.
const SINONIMOS_CRUDOS = {
  dentista: ['odontologia'],
  dientes: ['odontologia'],
  sarro: ['odontologia'],
  muelas: ['odontologia'],
  rayos: ['radiologia', 'imagenes'],
  radiografia: ['radiologia'],
  eco: ['ecografia'],
  ozono: ['ozonoterapia'],
  piel: ['dermatologia'],
  alergia: ['dermatologia', 'alergologia'],
  corazon: ['cardiologia'],
  ojos: ['oftalmologia'],
  huesos: ['traumatologia'],
  castracion: ['cirugia'],
  operacion: ['cirugia'],
  cancer: ['oncologia'],
  tumor: ['oncologia'],
  gatos: ['felina', 'felinos'],
  perros: ['canina', 'caninos'],
  caballos: ['equinos'],
  vacas: ['bovinos'],
  ovejas: ['ovinos'],
  alimentacion: ['nutricion'],
  conducta: ['comportamiento', 'etologia'],
  acupuntura: ['terapias'],
  homeopatia: ['terapias']
};
const SINONIMOS = {};
Object.entries(SINONIMOS_CRUDOS).forEach(([clave, lista]) => {
  SINONIMOS[sonido(clave)] = lista.map(sonido);
});

function palabraEnTexto(palabra, tokens, textoSonido) {
  if (!palabra) return true;
  if (textoSonido.includes(palabra)) return true;
  if (palabra.length < 5) return false;
  const tolerancia = palabra.length >= 9 ? 2 : 1;
  return tokens.some((tok) => {
    if (Math.abs(tok.length - palabra.length) <= tolerancia && distancia(tok, palabra) <= tolerancia) return true;
    // También cuando escribió solo el principio de la palabra, con algún error
    return tok.length > palabra.length && distancia(tok.slice(0, palabra.length), palabra) <= tolerancia;
  });
}

// ¿La búsqueda coincide con el texto? Cada palabra buscada tiene que aparecer (o algo parecido).
export function coincideBusqueda(busqueda, textoItem) {
  const textoSonido = sonido(textoItem);
  const tokens = textoSonido.split(' ').filter(Boolean);
  const palabras = String(busqueda || '').split(/[\s,]+/).filter(Boolean);
  return palabras.every((p) => {
    const s = sonido(p);
    const alternativas = [s, ...(SINONIMOS[s] || [])];
    return alternativas.some((alt) => palabraEnTexto(alt, tokens, textoSonido));
  });
}