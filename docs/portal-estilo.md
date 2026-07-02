# Guía de Estilo y Funcionalidad - "El Portal"

Esta guía unifica la identidad visual, los componentes técnicos y las reglas de diseño para garantizar la coherencia entre la red de profesionales y la plataforma para tutores.

## 1. Identidad Visual (Colores)
Se utiliza una paleta profesional que equilibra la autoridad académica con la vitalidad de la salud animal.

### Paleta Principal
- **Petróleo (#1A3D3D):** Color de marca principal. Usado en Navbar, títulos principales, líneas decorativas y estados hover de botones.
- **Esmeralda (#2D6A6A):** Color de acento. Utilizado en botones principales, etiquetas de especialidad y elementos destacados.
- **Ceniza (#F4F7F7):** Fondo de secciones, tarjetas de contacto y áreas de utilidad.
- **Antracita (#333333):** Color principal del texto de cuerpo para máxima legibilidad.
- **Blanco (#FFFFFF):** Fondo de tarjetas (cards), botones secundarios y contenedores principales.

---

## 2. Tipografía y Jerarquía
Basada en Google Fonts para diferenciar claramente la información académica de la informativa.

### Títulos (Montserrat)
- **H1 (Nombre del Profesional):** `clamp(26px, 5vw, 42px)` | Peso: 800 (Extra Bold) | Color: Petróleo.
- **H2 (Títulos de Sección):** Peso: 700 (Bold) | Color: Petróleo. *Incluye línea decorativa inferior de 40px x 3px.*
- **H3 (Títulos de Tarjetas):** 17px a 20px | Peso: 700 (Bold).

### Cuerpo y Etiquetas (Roboto)
- **Especialidad (Hero):** 18px | Peso: 600 | Mayúsculas | Espaciado: 1px | Color: Esmeralda.
- **Texto de Cuerpo:** 14px a 16px | Color: Antracita o Gris (#666).
- **Interlineado:** 1.5 a 1.6 para facilitar la lectura de CVs y artículos.

---

## 3. Estilo de Componentes

### Navbar (Navegación)
- **Altura:** 90px | **Posición:** `sticky` (fija).
- **Estilo:** Fondo Petróleo con borde inferior de 3px en Esmeralda.
- **Botones de Menú (Glassmorphism):**
  - Fondo: `rgba(255, 255, 255, 0.15)`.
  - Borde: `1px solid rgba(255, 255, 255, 0.2)`.
  - Hover: Opacidad `0.25` y elevación de `-1px`.

### Botones
- **Forma:** Bordes redondeados con `border-radius: 8px`.
- **Transición:** `0.3s ease` en todos los estados.
- **Botón Primario:** Fondo Esmeralda, Texto Blanco. Padding: `18px 45px`. En hover: Fondo Petróleo y `transform: translateY(-3px)`.
- **Botón de Utilidad:** Fondo Ceniza suave. En hover: Desplazamiento de `2px` hacia abajo.

### Tarjetas (Cards)
- **Forma:** `border-radius: 8px` | Fondo: Blanco | Borde: `1px solid #eee`.
- **Sombra base:** `0 10px 50px rgba(0,0,0,0.08)`.
- **Sombra Hover:** `0 12px 30px rgba(26, 61, 61, 0.1)` (Tinte petróleo) con elevación de `-5px`.

### Inputs y Formularios
- **Forma:** `border-radius: 8px`.
- **Colores:** Fondo Blanco, Borde Gris claro.
- **Diseño:** Padding interno amplio para facilitar la carga de datos del profesional.

---

## 4. Reglas de Layout y Estructura
- **Padding de Secciones:** 60px 50px (Desktop) / 30px 15px (Mobile).
- **Grilla de Servicios/Colegas:** Sistema de 3 columnas que colapsa a 1 en dispositivos móviles.
- **Imagen del Profesional:** Sombra de `0 10px 25px rgba(0,0,0,0.08)` para dar relieve a la foto de perfil.