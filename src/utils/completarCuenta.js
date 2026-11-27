// Recuperación de cuentas que se crearon en Authentication pero se quedaron sin documento en "usuarios"
// (pasó cuando las reglas de Firestore estuvieron incompletas). Crea ese documento con los MISMOS campos
// que el registro normal de src/pages/Login.jsx. Si cambiás uno, cambialo en los dos lugares.
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Tipos de cuenta que se pueden elegir (proveedor sigue como "Próximamente", igual que en el registro)
export const TIPOS_CUENTA = ['profesional', 'clinica', 'alumnx'];

// A qué cuestionario va cada tipo de cuenta (igual que en el registro)
export const rutaCuestionario = (tipo) =>
  tipo === 'clinica' ? '/onboarding-clinica' : tipo === 'alumnx' ? '/onboarding-alumnx' : '/onboarding';

// Crea el documento de la persona. Las reglas de Firestore lo permiten porque es el propio documento,
// con un rol válido y estado "pendiente" (igual que el registro).
export async function crearDocumentoUsuario(user, tipo) {
  const ahora = new Date().toISOString();
  await setDoc(doc(db, 'usuarios', user.uid), {
    nombre: '',
    email: user.email || '',
    rol: ['clinica', 'alumnx'].includes(tipo) ? tipo : 'profesional',
    slug: '',
    fechaRegistro: ahora,
    estado: 'pendiente',
    onboardingCompleto: false,
    onboardingPaso: 0,
    // Constancia de aceptación de términos (mismos nombres que en el registro y en Capacitaciones)
    aceptaTerminos: true,
    fechaAceptacionTerminos: ahora
  });
}
