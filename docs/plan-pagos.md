# Blueprint de Pagos y Arquitectura: El Portal Veterinario

## 1. Arquitectura General

- **Frontend:** React, Vite, Tailwind CSS.
- **Archivos clave frontend:**
  - `src/pages/Cartilla.jsx` / `src/pages/CartillaProveedores.jsx`: Listado de profesionales y proveedores. Dispara acciones de pago para cursos.
  - `src/services/servicio-pago.js`: Centraliza todas las peticiones al backend.
  - `src/pages/Checkout.jsx`: Pantalla de transición/loading mientras se conecta con Mercado Pago.
- **Base de datos y autenticación:** Firebase (Firestore + Auth + Storage para imágenes).
- **Backend / Servidor seguro:** Firebase Cloud Functions (Node.js).
- **Pasarela de pagos:** Mercado Pago (Marketplace API para cursos, Subscriptions API para mensualidades).

---

## 2. Modelado de Base de Datos (Firestore)

### Colección `proveedores`
(Quienes venden cursos o pagan mensualidad como institución)

- `id`: string
- `categoria`: string
- `categorias`: map (alimentos, equipamiento, etc.)
- `bioCorta`: string
- `bannerUrl`: string (URL de Firebase Storage, nunca Base64)
- `mp_access_token`: string (oculto/seguro — solo si vincularon cuenta MP)
- `estado_suscripcion`: string (`"activa"` | `"inactiva"` | `"pendiente"`)

### Colección `cursos`
(Capacitaciones publicadas por proveedores o instituciones)

- `id`: string
- `id_proveedor`: string (referencia al creador)
- `titulo`: string
- `precio`: number
- `imagenUrl`: string (desde Firebase Storage)

### Colección `transacciones`
(Historial para auditoría)

- `id_mp`: string (ID devuelto por Mercado Pago)
- `tipo`: string (`"curso_split"` | `"mensualidad"`)
- `monto_total`: number
- `comision_portal`: number (15% en split payments)

> Ver también `docs/diccionario_datos.md` para las colecciones `veterinarios`, `clinicas` y `alumnos`.

---

## 3. Flujos de Trabajo

### Flujo A: Split Payments — Venta de cursos (comisión 15%)

1. **Onboarding del vendedor:** El profesional/proveedor hace clic en "Vincular MP".
2. **Autorización OAuth:** Cloud Function `mpCallback` recibe el código y guarda el token en la colección `proveedores`.
3. **Compra:** El usuario hace clic en "Inscribirme". El componente llama a `servicio-pago.js`, que contacta la Cloud Function `crearPagoCurso`.
4. **Generación y redirección:** Se genera preferencia con `marketplace_fee` del 15% y se redirige a la URL de Mercado Pago.

### Flujo B: Suscripciones — Mensualidad al 100%

1. `servicio-pago.js` llama a la Cloud Function `crearSuscripcion`.
2. Se crea un "Preapproval Plan" usando las credenciales maestras del Portal.
3. **Webhooks:** La Cloud Function `webhookPagos` escucha los débitos mensuales y actualiza `estado_suscripcion` en Firestore.
