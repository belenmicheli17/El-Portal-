// Arma el link de WhatsApp con un mensaje ya escrito
export const armarLinkWhatsapp = (numero, mensaje = '') => {
  const digitos = String(numero || '').replace(/\D/g, '');
  if (!digitos) return '#';
  return mensaje ? `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/${digitos}`;
};