# 🧠 MASTER PROMPT — "El Portal Veterinario"

## Contexto de trabajo
Estás trabajando con la creadora y diseñadora del proyecto. No es programadora. Antes de dar código, explicá siempre en una línea qué hace ese bloque y por qué. Usá lenguaje claro, sin asumir conocimientos técnicos previos.

---

## 1. ADN TÉCNICO (Stack & Core)

- **Framework:** React.js (Vite) + Tailwind CSS
- **Backend:** Firebase (Firestore + Auth + **Storage para imágenes**). Configuración centralizada en `src/firebase.js` (exportando `db`, `auth` y `storage`)
- **Navegación:** SPA con `react-router-dom`. El enrutador central es `App.jsx`
- **Activos Estáticos:** Carpeta `/public` contiene `profesion.png`, `consultorio.png` y `perfil-verificado.png`
- **Gestión de Estado:** `useState`, `useEffect` y `useRef`. Implementación de historial funcional (Undo/Redo) con estados `past` y `future` en editores complejos
- **Pasarela de pagos:** Mercado Pago (Marketplace API para cursos con split del 15%, Subscriptions API para mensualidades)
- **Dependencias:** `lucide-react` (iconos), `html2pdf.js` (PDFs), `IntersectionObserver` (animaciones de scroll)

---

## 2. MANUAL DE IDENTIDAD UI (Estilo "Burbuja Premium")

Reglas estrictas de diseño para mantener coherencia visual en toda la plataforma:

**Paleta de colores:**
- Petróleo `#1A3D3D` — Color principal, Navbar, títulos, hovers
- Esmeralda `#2D6A6A` — Acento, botones principales, etiquetas
- Teal Claro `#4DB6AC` — Detalles, anillos de foco (ring)
- Ceniza `#F4F7F7` — Fondos de sección, áreas de utilidad
- Antracita `#333333` — Texto de cuerpo

**Radios de borde:** Estilo "Burbuja". `rounded-[32px]` o `rounded-[40px]` en contenedores principales; `rounded-2xl` en botones e inputs

**Tipografía:** Montserrat (Títulos) · Inter o Roboto (Cuerpo)

**Interacciones:** Glassmorphism (`backdrop-blur-lg`), resplandores suaves (`ring-4 ring-esmeralda/10`) y elevación en hover (`-translate-y-1 shadow-2xl`)

---

## 3. MAPA LÓGICO DE LA PLATAFORMA (Estructura de Archivos)

```
src/
├── App.jsx                        ← Enrutador central (BrowserRouter + rutas)
├── firebase.js                    ← Config Firebase (db, auth, storage)
├── pages/
│   ├── landing-page.jsx           ← Funnel de conversión público
│   ├── login.jsx                  ← Acceso segmentado por roles
│   ├── inicio.jsx                 ← 🚧 En construcción (Dashboard privado)
│   ├── bolsa-de-trabajo.jsx       ← Matchmaking profesional
│   ├── novedades.jsx              ← Publicaciones científicas y feed
│   ├── ecosistema.jsx             ← Hub central al ingresar al perfil
│   ├── Capacitaciones.jsx         ← Listado de capacitaciones
│   ├── CartillaProveedores.jsx    ← Solo visible para profesionales y clínicas
│   ├── privacidad.jsx             ← Términos y Condiciones + Deep Linking
│   ├── Checkout.jsx               ← Pantalla de transición hacia Mercado Pago
│   ├── perfil-clinica.jsx         ← Micrositio con servicios, staff y reviews
│   ├── editor-clinica.jsx         ← CMS de datos de clínica
│   ├── perfil-profesional.jsx     ← Portfolio: trayectoria, servicios, casos, contacto
│   ├── editor-profesional.jsx     ← CMS de datos del profesional
│   ├── perfil-proveedor.jsx       ← Catálogo digital sincronizado con Firestore
│   ├── editor-proveedor.jsx       ← CMS comercial y editor de catálogo
│   ├── perfil-alumnx.jsx          ← Perfil acotado (trayectoria + bolsa de trabajo)
│   └── editor-alumnx.jsx          ← CMS de datos del alumno
├── components/
│   ├── Navbar.jsx                 ← Menús inteligentes con lógica de scroll
│   ├── Footer.jsx                 ← Navegación secundaria e info institucional
│   ├── AccessibilityWidget.jsx    ← Persistencia en localStorage + estilos dinámicos
│   └── Cookies.jsx                ← Banner de consentimiento
├── components/admin/
│   ├── RutaProtegida.jsx          ← Protección de rutas del panel admin
│   ├── AdminLayout.jsx
│   ├── Configuracion.jsx
│   ├── DashboardAdmin.jsx
│   ├── GestionBolsa.jsx
│   ├── GestionUsuarios.jsx
│   └── Validaciones.jsx
├── context/
│   └── AuthContext.jsx            ← Autenticación y sesión global
├── services/
│   └── servicio-pago.js           ← Centraliza todas las peticiones al backend de pagos
└── data/
    └── especialidades.json        ← Categorías para filtros (bolsa, perfiles, cartillas)
```

---

## 4. ESTRUCTURA DE DATOS (Colecciones Firestore)

Ver `@diccionario_datos.md` para la definición completa de campos y tipos de cada colección.

**Colecciones activas:**
- `veterinarios` — Perfiles de profesionales individuales
- `clinicas` — Perfiles institucionales de clínicas
- `proveedores` — Vidrieras comerciales de empresas e insumos
- `alumnos` — Perfiles de estudiantes (plan gratuito, visibilidad acotada)
- `cursos` — Capacitaciones publicadas por proveedores
- `transacciones` — Historial de pagos para auditoría

> ⚠️ **Regla crítica de imágenes:** Siempre usar URLs de Firebase Storage. Nunca Base64 en Firestore.

---

## 5. INSTRUCCIONES DE TRABAJO PARA LA IA

1. **Responsividad inteligente:** En perfiles y editores, implementar lógica adaptativa extrema (Tabs en móvil vs. One-Page en escritorio).

2. **Lógica de CMS:** Los editores deben incluir Live Preview en tiempo real, algoritmos de cálculo de progreso del perfil y herramientas nativas de recorte de imagen (Canvas Cropper).

3. **Consistencia de código:** Comentarios siempre en español, nombres de variables descriptivos y separación clara entre lógica de negocio y presentación visual.

4. **Flujos de datos:** Al interactuar con Firestore, gestionar siempre los estados `isLoading` y posibles errores de red con feedback visual amable para el usuario.

5. **Formato de entrega:** No reescribir el archivo completo salvo que se pida explícitamente. Indicar siempre "Buscá este bloque en tu código… / Reemplazalo por este…". El bloque de reemplazo debe estar siempre completo e íntegro, sin recortes, sin placeholders, sin simplificaciones. El código entregado tiene que poder copiarse y pegarse directamente sin perder lógica ni estilo.

---

## 6. ESTADO ACTUAL DEL PROYECTO

> Completar y actualizar este bloque al inicio de cada sesión importante.

| Módulo | Archivo | Estado |
|---|---|---|
| Inicio | `inicio.jsx` | Por ahora vacio, el resto van bastante avanzados |
| Landing Page | `landing-page.jsx` | — |
| Login / Registro | `login.jsx` | — |
| Dashboard privado | `inicio.jsx` | - |
| Bolsa de Trabajo | `bolsa-de-trabajo.jsx` | — |
| Publicaciones cientificas| `novedades.jsx` | — |
| Ecosistema (hub) | `ecosistema.jsx` | — |
| Capacitaciones | `Capacitaciones.jsx` | — |
| Cartilla Proveedores | `CartillaProveedores.jsx` | — |
| Perfil Profesional | `perfil-profesional.jsx` | — |
| Editor Profesional | `editor-profesional.jsx` | — |
| Perfil Clínica | `perfil-clinica.jsx` | — |
| Editor Clínica | `editor-clinica.jsx` | — |
| Perfil Proveedor | `perfil-proveedor.jsx` | — |
| Editor Proveedor | `editor-proveedor.jsx` | — |
| Perfil Alumnx | `perfil-alumnx.jsx` | — |
| Editor Alumnx | `editor-alumnx.jsx` | — |
| Sistema de Pagos | `servicio-pago.js` + Cloud Functions | — |
| Panel Admin | `components/admin/` | — |