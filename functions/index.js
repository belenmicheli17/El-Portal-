// ============================================================
// FUNCIONES EN LA NUBE — El Portal Veterinario
// Permiten a la admin entrar a las cuentas de prueba sin cerrar sesión
// ============================================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// Tu uid de admin (el mismo que está en las reglas de Firestore)
const UID_ADMIN = "JDiu4lkVyJXeoyZ3eAxuBfvc5bZ2";

// ------------------------------------------------------------
// 1. ENTRAR A UNA CUENTA DE PRUEBA
// Solo la admin puede usarla, y solo con cuentas marcadas esPrueba: true
// ------------------------------------------------------------
exports.entrarComoPrueba = onCall({ region: "us-central1" }, async (request) => {
  // Tiene que haber alguien logueado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Tenés que iniciar sesión.");
  }

  // Puede usarla la admin, o una sesión de prueba creada por el servidor a pedido de la admin
  // (esto permite saltar de una cuenta de prueba a otra sin volver a la tuya)
  const esAdminOriginal = request.auth.uid === UID_ADMIN;
  const vieneDeLaAdmin = request.auth.token.impersonadaPor === UID_ADMIN;
  if (!esAdminOriginal && !vieneDeLaAdmin) {
    throw new HttpsError("permission-denied", "Solo la administradora puede hacer esto.");
  }

  // La cuenta de destino se puede pedir por rol (profesional, clinica, proveedor) o por uid
  const datos = request.data || {};
  let uidFinal = null;

  if (typeof datos.rolDestino === "string") {
    // Buscamos la cuenta de prueba de ese rol
    const resultado = await getFirestore()
      .collection("usuarios")
      .where("esPrueba", "==", true)
      .where("rol", "==", datos.rolDestino)
      .limit(1)
      .get();
    if (resultado.empty) {
      throw new HttpsError("not-found", `No hay una cuenta de prueba con rol ${datos.rolDestino}.`);
    }
    uidFinal = resultado.docs[0].id;
  } else if (typeof datos.uidDestino === "string") {
    // La cuenta de destino tiene que existir y estar marcada como de prueba
    const snap = await getFirestore().doc(`usuarios/${datos.uidDestino}`).get();
    if (!snap.exists || snap.data().esPrueba !== true) {
      throw new HttpsError(
        "failed-precondition",
        "Esa cuenta no está marcada como cuenta de prueba."
      );
    }
    uidFinal = datos.uidDestino;
  } else {
    throw new HttpsError("invalid-argument", "Falta indicar la cuenta de destino.");
  }

  // Llave temporal para esa cuenta, con una marca que dice "viene de la admin"
  // Creamos la llave; si algo falla, devolvemos el motivo real para poder arreglarlo
  try {
    const token = await getAuth().createCustomToken(uidFinal, {
      impersonadaPor: UID_ADMIN,
    });
    return { token };
  } catch (err) {
    console.error("Error creando la llave temporal:", err);
    throw new HttpsError("internal", "No se pudo crear la llave: " + (err.message || err));
  }
});

// ------------------------------------------------------------
// 2. VOLVER A LA CUENTA DE LA ADMIN
// Solo funciona si la sesión actual fue creada por entrarComoPrueba
// ------------------------------------------------------------
exports.volverDeCuentaPrueba = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Tenés que iniciar sesión.");
  }

  // La marca solo la puede poner el servidor, nadie desde el navegador
  if (request.auth.token.impersonadaPor !== UID_ADMIN) {
    throw new HttpsError("permission-denied", "Esta sesión no viene de una cuenta de administración.");
  }

  const token = await getAuth().createCustomToken(UID_ADMIN);
  return { token };
});