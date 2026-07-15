# Diccionario de Datos — El Portal Veterinario

> **Nota para IA:** Este archivo define la estructura de datos en Firestore. Respetá siempre estos campos y tipos al generar o modificar código que interactúe con la base de datos. Para reglas visuales, consultar el Manual de Identidad UI. Para flujos de pago, consultar plan-pagos.md.

---

## 1. Colección: `veterinarios`
Guarda los perfiles de los profesionales individuales.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String | Identificador único generado por Firebase |
| `nombre` | String | Nombre completo con título (Ej: Dr. Alejandro Martínez) |
| `especialidad` | String | Especialidad principal |
| `matricula` | String | Matrícula profesional (MP / MN) |
| `bio` | String | Descripción o resumen profesional |
| `provincia` | String | Ubicación base |
| `atiendeDomicilio` | Boolean | true/false si hace visitas a domicilio |
| `emailContacto` | String | Correo para recibir consultas |
| `whatsappActivo` | Boolean | true/false si muestra el botón de WhatsApp |
| `whatsappNum` | String | Número en formato internacional sin el '+' |
| `foto` | String | URL de la imagen de perfil alojada en Firebase Storage |
| `fotosPerfil` | Array de Strings | Historial de URLs de fotos de perfil recortadas |
| `planActual` | String | `'free'` o `'pro'` (determina qué secciones se muestran) |
| `instagram` | String | URL del perfil de Instagram |
| `linkedin` | String | URL del perfil de LinkedIn |
| `facebook` | String | URL de la página de Facebook |

### Sub-estructuras (Arrays de objetos dentro del veterinario)

**`zonas`** — Lugares de atención
- `id`: String
- `nombre`: String (Ej: Zona Oeste)
- `clinicas`: Array de objetos con `nombre`, `calle`, `barrio`

**`servicios`** — Especialidades actuales
- `id`: String
- `titulo`: String
- `desc`: String
- `icono`: String (nombre del ícono de Lucide)

**`trayectoria`** — Historial académico y logros
- `id`: String
- `titulo`: String
- `desc`: String
- `extra`: String (opcional, datos adicionales)

**`casos`** — Casos clínicos destacados
- `id`: String
- `nombre`: String
- `patologia`: String
- `desc`: String
- `fotos`: Array de Strings (URLs de Firebase Storage)

---

## 2. Colección: `clinicas`
Guarda los perfiles institucionales de clínicas veterinarias.

### Identidad y Gestión
| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre de la clínica |
| `subtitulo` | String | Bajada o slogan |
| `descripcion` | String | Descripción general |
| `historia` | String | Historia institucional |
| `añosExperiencia` | Number | Años de trayectoria |
| `foto` | String | URL de imagen principal (Firebase Storage) |
| `slug` | String | URL amigable (Ej: clinica-veterinaria-palermo) |
| `planActual` | String | `'free'` o `'pro'` |

### Datos de Cuenta (Privados)
| Campo | Tipo | Descripción |
|---|---|---|
| `cuentaEmail` | String | Correo de acceso a la plataforma |
| `cuentaPassword` | String | Contraseña (solo para el flujo del simulador MVP) |
| `cuentaTelefono` | String | Teléfono de recuperación de cuenta |

### Horarios y Contacto
| Campo | Tipo | Descripción |
|---|---|---|
| `direccion` | String | Dirección física |
| `telefono` | String | Teléfono principal |
| `whatsapp` | String | Número de WhatsApp |
| `email` | String | Correo de contacto público |
| `guardia24hs` | Boolean | true/false si tiene guardia las 24hs |
| `telefonoGuardia` | String | Teléfono específico de guardia |
| `redes.instagram` | String | URL de Instagram |
| `redes.facebook` | String | URL de Facebook |
| `horarios.semanaDesde` | String | Horario de apertura semanal |
| `horarios.semanaHasta` | String | Horario de cierre semanal |
| `horarios.sabadoDesde` | String | Horario de apertura sabado |
| `horarios.sabadoHasta` | String | Horario de cierre sabado |

### Sub-estructuras (Arrays de objetos dentro de la clínica)

**`urgencias`** — Protocolo de emergencias paso a paso
- `id`: Number (basado en orden)
- `paso`: String (Ej: "01")
- `titulo`: String
- `desc`: String

**`staff`** — Equipo profesional
- `id`: String
- `nombre`: String
- `matricula`: String
- `especialidad`: String
- `bio`: String
- `foto`: String (URL Firebase Storage)

**`servicios`** — Mapa de servicios activos
- Estructura: objeto de objetos `{ [idServicio]: { activo: Boolean, subOpcionesSeleccionadas: Array, detalleHolistico: String } }`

**`faqs`** — Preguntas frecuentes
- `id`: String
- `pregunta`: String
- `respuesta`: String
- `isDefault`: Boolean

---

## 3. Colección: `proveedores`
Guarda cuentas y vidrieras comerciales de empresas, distribuidoras, fabricantes y laboratorios. El documento se identifica con el `uid` del usuario de Auth.

### Datos de Gestión Privados
| Campo | Tipo | Descripción |
|---|---|---|
| `cuentaEmail` | String | Correo de acceso técnico (privado) |
| `cuentaPassword` | String | Contraseña en texto plano (solo simulador) |
| `cuentaTelefono` | String | Teléfono privado de recuperación |
| `mp_access_token` | String | Token OAuth de Mercado Pago (seguro, solo si vincularon cuenta) |
| `estado_suscripcion` | String | `'activa'` \| `'inactiva'` \| `'pendiente'` |

### Identidad Visual e Info Pública
| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre comercial (Ej: VetEquipamientos AR) |
| `razonSocial` | String | Nombre legal registrado |
| `cuit` | String | CUIT comercial (con o sin guiones) |
| `categoria` | String | Tipo de entidad: `'Distribuidor Oficial Nacional'` \| `'Fabricante Nacional'` \| `'Importador Directo'` \| `'Laboratorio Veterinario'` |
| `bioCorta` | String | Slogan para listados (máx. 150 caracteres) |
| `bioLarga` | String | Historia completa (mín. 20 caracteres, conserva saltos de línea) |
| `logo` | String | URL de Firebase Storage del logotipo |
| `fotoPortada` | String | URL de Firebase Storage del banner superior. **Nunca Base64.** |
| `slug` | String | URL amigable autogenerada (Ej: vetequipamientos-ar) |
| `verificado` | Boolean | Insignia de confianza, controlada por admin |

### Multimedia
| Campo | Tipo | Descripción |
|---|---|---|
| `imagenNosotros` | String | URL de Firebase Storage (sede o equipo) |
| `videoNosotros` | String | URL externa (YouTube / Vimeo) |

### Contacto, Ubicación y Redes
| Campo | Tipo | Descripción |
|---|---|---|
| `direccion` | String | Calle y localidad de la casa central |
| `mapaUrl` | String | Enlace de Google Maps |
| `horariosAtencion` | String | Rango horario en texto plano |
| `modalidadTexto` | String | Modalidades separadas por comas |
| `emailVentas` | String | Correo público para consultas comerciales |
| `whatsappActivo` | Boolean | Visibilidad del botón de WhatsApp |
| `whatsappVentas` | String | Número sin '+' para API de WhatsApp |
| `web` | String | URL del sitio institucional |
| `instagram` | String | URL de Instagram |
| `facebook` | String | URL de Facebook |
| `linkedin` | String | URL de LinkedIn |

### Filtros Comerciales (Arrays de Strings)
| Campo | Tipo | Valores válidos |
|---|---|---|
| `rubros` | Array de Strings | `'Alimentos y Dietas'`, `'Fármacos e Insumos'`, `'Equipamiento Médico'`, `'Descartables Hospitalarios'`, `'Instrumental Quirúrgico'`, `'Software y Tecnología'` |
| `zonaCobertura` | Array de Strings | Nombres de provincias de Argentina |
| `marcasRepresentadas` | String | Marcas separadas por comas |
| `linkCatalogo` | String | URL a PDF o carpeta de Drive |

### Condiciones de Venta (Arrays de Strings)
| Campo | Tipo | Ejemplo |
|---|---|---|
| `envios` | Array de Strings | `["Envíos a todo el país", "Retiro en depósito local"]` |
| `pagos` | Array de Strings | `["Emitimos Factura A y B", "Desc. por Transferencia"]` |
| `garantia` | Array de Strings | `["Garantía oficial de fábrica", "Servicio técnico propio"]` |

### Sub-estructura: `productosDestacados` (Array de objetos)
Lista ordenada de ítems en la vidriera pública.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Number/String | Timestamp: `Date.now()` |
| `titulo` | String | Nombre comercial del producto |
| `categoria` | String | Rubro específico para filtrado |
| `precio` | String | Valor en ARS o `"Consultar"` |
| `etiqueta` | String | `'Nuevo'` \| `'Promo'` \| `''` |
| `imagenes` | Array de Strings | Hasta 4 URLs de Firebase Storage |
| `descripcionLarga` | String | Ficha técnica y notas comerciales |
| `caracteristicas` | Array de Strings | Viñetas de ventajas (Ej: `["Batería de larga duración"]`) |

---

## 4. Colección: `alumnos`
Guarda los perfiles de estudiantes y graduados recientes. Cuenta gratuita con visibilidad acotada: no aparecen en la cartilla pública, solo en búsquedas de bolsa de trabajo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String | Identificador único generado por Firebase (uid de Auth) |
| `nombre` | String | Nombre completo |
| `email` | String | Correo de acceso y contacto |
| `foto` | String | URL de foto de perfil en Firebase Storage |
| `provincia` | String | Ubicación base |
| `bio` | String | Presentación breve |
| `planActual` | String | `'free'` (único plan disponible para alumnos) |
| `instagram` | String | URL de Instagram (opcional) |
| `linkedin` | String | URL de LinkedIn (opcional) |

### Sub-estructuras

**`trayectoria`** — Historial académico
- `id`: String
- `titulo`: String (Ej: "Estudiante de Veterinaria — UBA")
- `desc`: String
- `extra`: String (opcional)

**`busquedaLaboral`** — Configuración de visibilidad en bolsa de trabajo
- `activa`: Boolean (true si quiere aparecer en búsquedas)
- `disponibilidad`: String (Ej: "Tiempo completo", "Part-time")
- `zonas`: Array de Strings (provincias donde busca trabajo)
- `especialidadesInteres`: Array de Strings

---

## 5. Colección: `cursos`
Capacitaciones publicadas por proveedores o instituciones para profesionales veterinarios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String | Identificador único generado por Firebase |
| `id_proveedor` | String | Referencia al documento en la colección `proveedores` |
| `titulo` | String | Nombre del curso |
| `descripcion` | String | Descripción completa del contenido |
| `precio` | Number | Precio en ARS |
| `imagenUrl` | String | URL de Firebase Storage. **Nunca Base64.** |
| `duracion` | String | Ej: "4 semanas", "8 horas" |
| `modalidad` | String | `'Online'` \| `'Presencial'` \| `'Híbrido'` |
| `fechaInicio` | String | Fecha de inicio (formato ISO o texto) |
| `activo` | Boolean | true si está publicado y visible |

---

## 6. Colección: `transacciones`
Historial de pagos para auditoría interna. No se muestra al usuario final.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_mp` | String | ID devuelto por Mercado Pago |
| `tipo` | String | `'curso_split'` \| `'mensualidad'` |
| `monto_total` | Number | Monto total de la transacción |
| `comision_portal` | Number | Comisión cobrada (15% en split payments) |
| `id_usuario` | String | uid del usuario que realizó el pago |
| `id_item` | String | ID del curso o plan asociado |
| `fecha` | Timestamp | Fecha y hora de la transacción (Firestore Timestamp) |
| `estado` | String | `'aprobado'` \| `'pendiente'` \| `'rechazado'` |

---

## Reglas generales de almacenamiento

> ⚠️ **Imágenes:** Siempre usar URLs de **Firebase Storage**. Nunca almacenar Base64 directamente en Firestore (genera documentos pesados y rompe la performance).

> ⚠️ **Contraseñas:** Los campos `cuentaPassword` son exclusivos del flujo de simulador MVP. En producción, la autenticación se maneja 100% a través de Firebase Auth.