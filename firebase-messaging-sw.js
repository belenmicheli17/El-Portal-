// ============================================================
// Service worker de avisos (notificaciones push) — El Portal Veterinario
// Es el que "escucha" en segundo plano y muestra la notificación,
// aunque el Portal no esté abierto. Va en: public/firebase-messaging-sw.js
// ============================================================
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Estos datos son públicos (los mismos que están en src/firebase.js)
firebase.initializeApp({
  apiKey: 'AIzaSyA9DsYU4-LEelrXFIiPpk9_nYErpZSqYTM',
  authDomain: 'el-portal-veterinario-3ab72.firebaseapp.com',
  projectId: 'el-portal-veterinario-3ab72',
  storageBucket: 'el-portal-veterinario-3ab72.firebasestorage.app',
  messagingSenderId: '939343810474',
  appId: '1:939343810474:web:8e31c0f498330e85cfe5d3'
});

// Al iniciar el messaging, Firebase muestra solo las notificaciones que llegan
// con título y texto, y al tocarlas abre el link que mandó la función.
firebase.messaging();