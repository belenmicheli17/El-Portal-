# Diccionario de Datos - El Portal Veterinario

## 1. Colección: `veterinarios`
Esta colección guarda los perfiles de los profesionales individuales.

- `id`: (String) Identificador único generado por Firebase.
- `nombre`: (String) Nombre completo con título (Ej: Dr. Alejandro Martínez).
- `especialidad`: (String) Especialidad principal.
- `matricula`: (String) Matrícula profesional (MP / MN).
- `bio`: (String) Descripción o resumen profesional.
- `provincia`: (String) Ubicación base.
- `atiendeDomicilio`: (Boolean) true/false si hace visitas.
- `emailContacto`: (String) Correo para recibir consultas.
- `whatsappActivo`: (Boolean) true/false si muestra el botón de WhatsApp.
- `whatsappNum`: (String) Número en formato internacional sin el '+'.
- `foto`: (String) URL de la imagen de perfil alojada en Storage.
- fotosPerfil: (Array de Strings) Historial de URLs de fotos de perfil recortadas. 
- `planActual`: (String) 'free' o 'pro' (Determina qué secciones se muestran).
- Redes sociales: `instagram`, `linkedin`, `facebook` (Strings con URLs).

### Sub-estructuras dentro del Veterinario (Arrays de objetos)
- `zonas`: Array de lugares de atención.
  - `id`, `nombre` (Ej: Zona Oeste), `clinicas` (Array con `nombre`, `calle`, `barrio`).
- `servicios`: Array de especialidades actuales.
  - `id`, `titulo`, `desc`, `icono` (Nombre del icono Lucide).
- `trayectoria`: Array de historial académico/logros.
  - id, titulo, desc, extra (String opcional con datos adicionales). 
- `casos`: Array de casos clínicos destacados.
  - `id`, `nombre`, `patologia`, `desc`, `fotos` (Array de URLs).

---

## 2. Colección: `clinicas` (Borrador Inicial)
Esta colección guarda los perfiles de las instituciones y hospitales.

- `id`: (String) Identificador único.
- `nombre`: (String) Nombre de la institución.
- `nivelComplejidad`: (String) Ej: Hospital de 24hs, Centro de Especialidades.
- `direccion`: (String) Calle, número y localidad.
- `telefonoUrgencias`: (String) Número para emergencias.
- `serviciosDisponibles`: (Array de Strings) Ej: ["Rayos X", "Ecografía", "Laboratorio"].
- `galeriaFotos`: (Array de URLs) Fotos de las instalaciones.

