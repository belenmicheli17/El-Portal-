// Importamos las herramientas principales de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyA9DsYU4-LEelrXFIiPpk9_nYErpZSqYTM",
  authDomain: "el-portal-veterinario-3ab72.firebaseapp.com",
  projectId: "el-portal-veterinario-3ab72",
  storageBucket: "el-portal-veterinario-3ab72.firebasestorage.app",
  messagingSenderId: "939343810474",
  appId: "1:939343810474:web:8e31c0f498330e85cfe5d3",
  measurementId: "G-6VQ6GT3ZQ9"
};

// Inicializamos la aplicación
const app = initializeApp(firebaseConfig);

// Exportamos "db" (Base de datos) y "auth" (Autenticación) para usarlos en el resto de tu web
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
// Conexión con las funciones en la nube (el "mini servidor" de Google)
export const functions = getFunctions(app, 'us-central1');

// ----- Medición (Google Analytics + Microsoft Clarity) -----
// Se prende solo si la persona aceptó las cookies, y solo en el sitio real (no en localhost ni en vistas previas)
const CLARITY_ID = 'zjvepe7ksl'; // Project ID de Microsoft Clarity
let analytics = null;
let prendida = false;
const esSitioReal = () => typeof window !== 'undefined' && window.location.hostname.endsWith('portalveterinario.ar');

export const prenderMedicion = async () => {
  if (prendida || !esSitioReal() || localStorage.getItem('cookieConsent') !== 'true') return;
  prendida = true;
  try {
    // Google Analytics (se carga aparte para no hacer más pesada la primera carga)
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) analytics = getAnalytics(app);
  } catch (e) {
    console.error('No se pudo prender Google Analytics:', e);
  }
  // Microsoft Clarity (código oficial de instalación)
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }
};

// Registra un evento (ej: 'registro_iniciado'). Si la medición está apagada, no hace nada.
export const registrarEvento = async (nombre, datos = {}) => {
  try {
    if (!analytics) return;
    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, nombre, datos);
  } catch (e) {
    console.error('No se pudo registrar el evento:', e);
  }
};  