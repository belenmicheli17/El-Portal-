// Le pide a nuestra función de Vercel que mande el mail de "Recuperar contraseña" (por Brevo).
export async function pedirRecuperacionClave(email) {
  const respuesta = await fetch('/api/recuperar-clave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!respuesta.ok) {
    const error = new Error('No se pudo pedir la recuperación');
    error.code = 'recuperacion/fallo';
    throw error;
  }
}