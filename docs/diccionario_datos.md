1. Colección: veterinarios
Esta colección guarda los perfiles de los profesionales individuales.
id: (String) Identificador único generado por Firebase.
nombre: (String) Nombre completo con título (Ej: Dr. Alejandro Martínez).
especialidad: (String) Especialidad principal.
matricula: (String) Matrícula profesional (MP / MN).
bio: (String) Descripción o resumen profesional.
provincia: (String) Ubicación base.
atiendeDomicilio: (Boolean) true/false si hace visitas.
emailContacto: (String) Correo para recibir consultas.
whatsappActivo:
 (Boolean) true/false si muestra el botón de WhatsApp.
whatsappNum: (String) Número en formato internacional sin el '+'.
foto: (String) URL de la imagen de perfil alojada en Storage.
fotosPerfil: (Array de Strings) Historial de URLs de fotos de perfil recortadas.
planActual: (String) 'free' o 'pro' (Determina qué secciones se muestran).
Redes sociales: instagram, linkedin, facebook (Strings con URLs).
Sub-estructuras dentro del Veterinario (Arrays de objetos)
zonas: Array de lugares de atención.
id, nombre (Ej: Zona Oeste), clinicas (Array con nombre, calle, barrio).
servicios: Array de especialidades actuales.
id, titulo, desc, icono (Nombre del icono Lucide).
trayectoria: Array de historial académico/logros.
id, titulo, desc, extra (String opcional con datos adicionales).
casos: Array de casos clínicos destacados.
id, nombre, patologia, desc, fotos (Array de URLs).
Colección: clinicas (Estructura Definitiva)
Identidad y Gestión
nombre: (String)
subtitulo: (String)
descripcion: (String)
historia: (String)
añosExperiencia: (Number)
foto: (String)
slug: (String)
planActual: (String)
Datos de Cuenta (Privados)
cuentaEmail: (String) Correo electrónico de acceso a la plataforma.
cuentaPassword: (String) Contraseña de acceso (solo para el flujo del simulador MVP).
cuentaTelefono: (String) Teléfono de recuperación de cuenta.
Horarios y Contacto
direccion: (String)
telefono: (String)
whatsapp: (String)
email: (String)
redes: (Objeto)
instagram: (String)
facebook: (String)
guardia24hs: (Boolean)
telefonoGuardia: (String)
horarios: (Objeto)
semanaDesde: (String)
semanaHasta: (String)
sabadoDesde: (String)
sabadoHasta: (String)
Estructuras dinámicas (NUEVO)
urgencias: (Array de objetos) [Requerido por tu código de Perfil]
id: (Number) Identificador local del paso (basado en orden).
paso: (String) Ej: "01"
titulo: (String)
desc: (String)
staff: (Array de objetos)
id, nombre, matricula, especialidad, bio, foto
servicios: (Objeto de objetos)
[idServicio]: { activo: Boolean, subOpcionesSeleccionadas: Array, detalleHolistico: String }
faqs: (Array de objetos)
id, pregunta, respuesta, isDefault


3. Colección: proveedores
Esta colección guarda las cuentas y vidrieras comerciales de empresas distribuidoras, fabricantes y laboratorios. El documento se identifica en Firestore con el uid del usuario de autenticación.
Datos de Gestión Privados (Sección Cuenta)
cuentaEmail: (String) Correo electrónico privado de acceso técnico.
cuentaPassword: (String) Contraseña en texto plano para el flujo simplificado del simulador.
cuentaTelefono: (String) Teléfono privado de recuperación de credenciales.
Identidad Visual e Info Pública (Raíz Plana)
nombre: (String) Nombre comercial de la empresa (Ej: VetEquipamientos AR).
razonSocial: (String) Nombre legal registrado de la firma.
cuit: (String) CUIT comercial obligatorio (Formato string con o sin guiones).
categoria: (String) Tipo de entidad ('Distribuidor Oficial Nacional', 'Fabricante Nacional', 'Importador Directo', 'Laboratorio Veterinario').
bioCorta: (String) Slogan o bajada corta para listados (Máx. 150 caracteres).
bioLarga: (String) Historia completa y trayectoria detallada (Mín. 20 caracteres, conserva saltos de línea).
logo: (String) URL o Base64 comprimido del logotipo de la empresa.
fotoPortada: (String) URL o Base64 del banner superior del perfil público.
slug: (String) URL amigable autogenerada e indexable basada en el nombre (Ej: vetequipamientos-ar).
verificado: (Boolean) Flag controlado por administración para mostrar la insignia de confianza (true).
Multimedia de Trayectoria
imagenNosotros: (String) URL o Base64 de la fotografía de la sede central o equipo de trabajo.
videoNosotros: (String) URL directa a plataforma de video externa (YouTube / Vimeo).
Ubicación, Alcance y Redes Comerciales
direccion: (String) Calle, número, localidad o detalles físicos de la casa central.
mapaUrl: (String) Enlace directo de redirección geográfica a Google Maps.
horariosAtencion: (String) Rango horario detallado en texto plano (Ej: "Lunes a Viernes de 9 a 18 hs").
modalidadTexto: (String) Modalidades de atención unificadas en un string separado por comas (Ej: "Venta Online 24/7, Showroom con cita previa").
emailVentas: (String) Casilla de correo pública para recibir consultas comerciales o propuestas de clínicas.
whatsappActivo: (Boolean) Controla la visibilidad pública del botón de chat en vivo (true/false).
whatsappVentas: (String) Número celular comercial formateado numéricamente para la API de WhatsApp Link, sin el carácter +.
web: (String) Enlace URL al sitio institucional corporativo de la marca.
instagram: (String) Enlace URL al perfil comercial de Instagram.
facebook: (String) Enlace URL a la página de Facebook.
linkedin: (String) Enlace URL al perfil institucional de LinkedIn.
Filtros Comerciales y Cobertura (Arrays de Strings planos)
rubros: (Array de Strings) Listado indexable con los sectores del mercado que abastecen (Valores válidos: 'Alimentos y Dietas', 'Fármacos e Insumos', 'Equipamiento Médico', 'Descartables Hospitalarios', 'Instrumental Quirúrgico', 'Software y Tecnología').
zonaCobertura: (Array de Strings) Listado con los nombres de las provincias de Argentina en las que el proveedor opera comercialmente.
marcasRepresentadas: (String) Texto plano con marcas comerciales asociadas separadas por comas.
linkCatalogo: (String) Enlace URL a un catálogo externo en PDF o carpeta compartida de Drive con listas de precios.
Condiciones de Venta (Arrays de Strings planos)
envios: (Array de Strings) Opciones de logística soportadas (Ej: ["Envíos a todo el país", "Retiro en depósito local"]).
pagos: (Array de Strings) Métodos fiscales y financieros aceptados (Ej: ["Emitimos Factura A y B", "Desc. por Transferencia"]).
garantia: (Array de Strings) Estructura de soporte y post-venta técnica (Ej: ["Garantía oficial de fábrica", "Servicio técnico propio"]).
Sub-estructura de Vidriera: productosDestacados (Array de Objetos)
Lista ordenada y reordenable de ítems en exhibición dentro del perfil público.
id: (Number/String) Identificador único local basado en timestamp (Date.now()).
titulo: (String) Nombre comercial descriptivo del equipo o producto.
categoria: (String) Rubro específico asignado al ítem para filtrado interno.
precio: (String) Valor numérico de venta referencial en ARS o término condicional (Ej: "1.450.000", "Consultar").
etiqueta: (String) Distintivo promocional visual ('Nuevo', 'Promo' o cadena vacía).
imagenes: (Array de Strings) Colección de hasta 4 URLs o Base64 comprimidos del set de imágenes del artículo.
descripcionLarga: (String) Reseña extendida, ficha técnica y notas comerciales específicas del producto.
caracteristicas: (Array de Strings) Lista lineal de viñetas con los aspectos y ventajas clave del producto (Ej: ["Batería de larga duración", "Pantalla táctil de 10 pulgadas"]).


