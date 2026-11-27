// Mensajes de error de los dos ingresos (la página /Login y el desplegable del menú).
// Están acá, en un solo lugar, para que los dos le digan lo mismo a la persona.

// Cuando la contraseña estaba bien (Firebase la dejó entrar) pero no se pudo leer su documento en "usuarios".
// Se muestra aparte para no confundirlo con una contraseña mal escrita.
export const MENSAJE_FALLA_DATOS = 'Pudimos verificar tu cuenta pero no cargar tus datos, escribinos.';

// Convierte el código de error de Firebase en un mensaje claro para la persona
export const traducirErrorFirebase = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use': return 'Este correo ya está registrado. ¿Intentaste iniciar sesión?';
    case 'auth/invalid-email': return 'El formato del correo no es válido. Revisá que no haya espacios al final.';
    case 'auth/weak-password': return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/user-not-found': return 'No encontramos ninguna cuenta con este correo.';
    case 'auth/wrong-password': return 'La contraseña es incorrecta.';
    case 'auth/invalid-credential': return 'El correo o la contraseña son incorrectos.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Por seguridad, intentá de nuevo más tarde.';
    case 'auth/network-request-failed': return 'Error de conexión. Revisá tu internet y volvé a intentar.';
    case 'recuperacion/fallo': return 'No pudimos enviar el correo. Intentá de nuevo en unos minutos.';
    default: return `Ocurrió un error inesperado (${errorCode || 'Desconocido'}). Intentá de nuevo.`;
  }
};

// Atributos para los campos de mail y contraseña: así el teclado del celular
// no pone mayúscula al principio, no "corrige" el mail ni lo subraya como error.
export const ATRIBUTOS_CAMPO_LOGIN = {
  autoCapitalize: 'none',
  autoCorrect: 'off',
  spellCheck: false
};
