// src/services/servicio-pago.js

/**
 * Procesa el pago de una publicación o insumo.
 * TODO: Reemplazar esta simulación con la API real de la pasarela.
 */
export const procesarPagoPublicacion = async (datosTarjeta, checkoutData) => {
  // Simulamos una demora de red de 2.5 segundos como tenías en tu código original
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        mensaje: "Pago procesado con éxito",
        datos: checkoutData
      });
    }, 2500);
  });
};