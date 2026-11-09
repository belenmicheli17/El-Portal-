// ============================================================
// FUNCIONES EN LA NUBE — El Portal Veterinario
// Permiten a la admin entrar a las cuentas de prueba sin cerrar sesión
// ============================================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getMessaging } = require("firebase-admin/messaging");

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
// ------------------------------------------------------------
// 3. AVISOS PUSH A LA ADMIN
// Manda una notificación a todos los dispositivos que la admin activó
// (compu, celular). Los guarda el botón "Activar avisos" del panel.
// ------------------------------------------------------------
const URL_VALIDACIONES = "https://www.portalveterinario.ar/admin/validaciones";

async function mandarAvisoALaAdmin(titulo, cuerpo) {
  const db = getFirestore();
  const dispositivos = await db.collection(`usuarios/${UID_ADMIN}/dispositivosPush`).get();
  const tokens = dispositivos.docs.map((d) => d.data().token).filter(Boolean);
  if (tokens.length === 0) return { enviados: 0 };

  const respuesta = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title: titulo, body: cuerpo },
    webpush: {
      // El aviso espera hasta 2 semanas si la compu o el celular están apagados
      headers: { TTL: "1209600", Urgency: "high" },
      fcmOptions: { link: URL_VALIDACIONES },
    },
  });

  // Los dispositivos que ya no existen (se desinstaló, se borraron los datos) se sacan de la lista
  const limpieza = [];
  respuesta.responses.forEach((r, i) => {
    const codigo = (r.error && r.error.code) || "";
    if (!r.success && (codigo.includes("registration-token-not-registered") || codigo.includes("invalid-registration-token"))) {
      limpieza.push(db.doc(`usuarios/${UID_ADMIN}/dispositivosPush/${tokens[i]}`).delete());
    }
  });
  await Promise.all(limpieza);

  return { enviados: respuesta.successCount };
}

// Se dispara sola cuando una solicitud pasa a "pendiente" (alguien termina el onboarding
// o reenvía sus datos después de un rechazo)
exports.avisarNuevaSolicitud = onDocumentWritten(
  { document: "verificaciones/{uid}", region: "us-central1" },
  async (event) => {
    try {
      const antes = event.data && event.data.before ? event.data.before.data() : null;
      const despues = event.data && event.data.after ? event.data.after.data() : null;
      if (!despues || despues.estado !== "pendiente") return;
      if (antes && antes.estado === "pendiente") return; // ya estaba pendiente: no avisamos de nuevo

      const usuario = (await getFirestore().doc(`usuarios/${event.params.uid}`).get()).data() || {};
      const nombre =
        (despues.datosEnviados && despues.datosEnviados.nombreCompleto) ||
        usuario.nombreCompleto ||
        usuario.nombre ||
        "Alguien";
      const esClinica = usuario.rol === "clinica";

      await mandarAvisoALaAdmin(
        esClinica ? "Nueva clínica para validar" : "Nuevo profesional para validar",
        `${nombre} terminó su registro.`
      );
    } catch (error) {
      console.error("No se pudo mandar el aviso de nueva solicitud:", error);
    }
  }
);

// Botón "Probar" del panel: manda un aviso de prueba (solo la admin)
exports.enviarAvisoPrueba = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth || request.auth.uid !== UID_ADMIN) {
    throw new HttpsError("permission-denied", "Solo la administradora puede hacer esto.");
  }
  const resultado = await mandarAvisoALaAdmin("Aviso de prueba", "Si ves esto, las notificaciones funcionan 🐾");
  return resultado;
});