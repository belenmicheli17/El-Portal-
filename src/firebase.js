// Importamos las herramientas principales de Firebase
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
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
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
export const storage = getStorage(app);
// Conexión con las funciones en la nube (el "mini servidor" de Google)
export const functions = getFunctions(app, 'us-central1');  