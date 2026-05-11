# 📋 Blueprint de Pagos y Arquitectura: El Portal Veterinario

## 1. Arquitectura General
* **Frontend:** React, Vite, Tailwind CSS.
* **Archivos Clave Frontend:**
    * `src/pages/repertorio.jsx`: Contiene el listado, el detalle del curso, el Stepper de publicación y dispara las acciones de pago.
    * `src/services/servicio-pago.js`: Centraliza todas las peticiones a la API/Backend.
    * `src/pages/Checkuout.jsx`: (Reconvertir a pantalla de transición/loading mientras se conecta con MP).
* **Base de Datos y Autenticación:** Firebase (Firestore + Auth + Storage para imágenes).
* **Backend / Servidor Seguro:** Firebase Cloud Functions (Node.js).
* **Pasarela de Pagos:** Mercado Pago (Marketplace API para cursos, Subscriptions API para mensualidades).

## 2. Modelado de Base de Datos (Firestore)
Basado en las pruebas actuales, la estructura será:

* **Colección `proveedores` / `instituciones`** (Quienes venden o pagan mensualidad)
    * `id`: string (ej: proveedor_prueba_123)
    * `categoria`: string
    * `categorias`: map (alimentos, equipamiento, etc.)
    * `bioCorta`: string
    * `bannerUrl`: string (URL proveniente de Firebase Storage, NO Base64)
    * `mp_access_token`: string (Oculto/Seguro - Solo si vincularon cuenta de MP).
    * `estado_suscripcion`: string ("activa", "inactiva", "pendiente").

* **Colección `cursos`** (Lo que se publica en repertorio.jsx)
    * `id`: string
    * `id_proveedor`: string (Referencia al creador)
    * `titulo`: string
    * `precio`: number
    * `imagenUrl`: string (Desde Firebase Storage)

* **Colección `transacciones`** (Historial para auditoría)
    * `id_mp`: string
    * `tipo`: string ("curso_split" o "mensualidad")
    * `monto_total`: number
    * `comision_portal`: number (15%)

## 3. Flujos de Trabajo a Programar (Lógica)

### Flujo A: Split Payments (Venta de Cursos al 15%)
1.  **Onboarding del Vendedor:** En el Stepper de `repertorio.jsx`, el profesional hace clic en "Vincular MP".
2.  **Autorización (OAuth):** Cloud Function `mpCallback` recibe el código y guarda el token en la colección `proveedores`.
3.  **Compra:** Usuario hace clic en "Inscribirme". `repertorio.jsx` llama a `servicio-pago.js`, que a su vez contacta a la Cloud Function `crearPagoCurso`.
4.  **Generación y Redirección:** Se genera preferencia con `marketplace_fee` del 15% y se redirige a la URL de Mercado Pago.

### Flujo B: Suscripciones (Mensualidad al 100%)
1.  **Suscripción:** `servicio-pago.js` llama a la Cloud Function `crearSuscripcion`.
2.  **Preferencia:** Se crea un "Preapproval Plan" usando las credenciales maestras del Portal.
3.  **Webhooks:** La Cloud Function `webhookPagos` escucha los débitos mensuales y actualiza el `estado_suscripcion` en Firestore.