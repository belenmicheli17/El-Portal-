// ============================================================
// AVISOS PUSH (solo para la admin)
// Pide permiso para mostrar notificaciones, obtiene el "token" de este
// dispositivo y lo guarda en Firestore para que la función en la nube
// sepa a dónde mandar los avisos.
// Va en: src/utils/avisosPush.js
// ============================================================
import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Uid de la admin (el mismo de las reglas de Firestore)
export const ADMIN_UID = 'JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2';

// Clave pública de Firebase Cloud Messaging (Certificados push web)
const CLAVE_VAPID = 'BLw09fSrxz3fUMtc21Hx9kINSEvmDcy_rljcJE63d0ZdJPWeHS8OIbLNd59ZxUFsBdp9_4L7KZ-y6Tg0E_wjrD0';

// ¿Este navegador sabe mostrar notificaciones push?
export const avisosSoportados = async () => {
  try {
    return 'Notification' in window && 'serviceWorker' in navigator && (await isSupported());
  } catch (e) {
    return false;
  }
};
// Muestra el aviso cuando el Portal está abierto y a la vista
// (en ese caso Firebase no lo muestra solo, hay que hacerlo a mano)
export const escucharAvisosEnPrimerPlano = () => {
  try {
    const messaging = getMessaging(getApp());
    return onMessage(messaging, async (mensaje) => {
      const titulo = mensaje.notification?.title || 'El Portal';
      const cuerpo = mensaje.notification?.body || '';
      const link = mensaje.fcmOptions?.link || mensaje.data?.link || '/admin/validaciones';
      const registro = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (registro) {
        registro.showNotification(titulo, { body: cuerpo, icon: '/favicon.ico', data: { link } });
      }
    });
  } catch (e) {
    return () => {};
  }
};

// Activa los avisos en este dispositivo. Si el permiso ya estaba dado, no vuelve a preguntar.
// Devuelve { ok: true } o { ok: false, motivo: 'no-soportado' | 'denegado' | 'no-admin' | 'sin-token' | 'error' }
export const activarAvisos = async () => {
  try {
    const uid = auth.currentUser?.uid;
    if (uid !== ADMIN_UID) return { ok: false, motivo: 'no-admin' };
    if (!(await avisosSoportados())) return { ok: false, motivo: 'no-soportado' };

    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return { ok: false, motivo: 'denegado' };

    // Registramos el ayudante y esperamos a que esté realmente activo antes de pedir el token
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const registro = await navigator.serviceWorker.ready;
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: CLAVE_VAPID, serviceWorkerRegistration: registro });
    if (!token) return { ok: false, motivo: 'sin-token' };

    // Un documento por dispositivo (el token es el nombre, así no se repite)
    await setDoc(doc(db, 'usuarios', uid, 'dispositivosPush', token), {
      token,
      dispositivo: String(navigator.userAgent || '').slice(0, 160),
      actualizadoEn: serverTimestamp()
    });
    return { ok: true };
  } catch (error) {
    console.error('No se pudieron activar los avisos:', error);
    return { ok: false, motivo: 'error', detalle: String(error?.code || error?.message || error).slice(0, 90) };
  }
};