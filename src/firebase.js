// Importamos las herramientas principales de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";




// Tus llaves oficiales
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializamos la aplicación
const app = initializeApp(firebaseConfig);

// Exportamos "db" (Base de datos) y "auth" (Autenticación) para usarlos en el resto de tu web
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);  