// Cálculo del avance del perfil profesional.
// Lo usan el editor y el Ecosistema, así el porcentaje es siempre el mismo.

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

  return {
    porcentaje: Math.round((obtenido / maximo) * 100),
    faltantes: partes.filter(parte => !completas[parte]).map(parte => NOMBRES[parte])
  };
};