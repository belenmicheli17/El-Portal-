import { db } from './firebase'; 
import { doc, setDoc } from 'firebase/firestore';

// ==========================================
// 1. PERFILES GENERALES DE LA CARTILLA
// ==========================================
{/*const perfilesMuestra = [
  {
    id: 'clara-valdez',
    planActual: 'pro',
    nombre: "Dra. Clara Valdez",
    especialidad: "Cirugía de Tejidos Blandos",
    matricula: "12345",
    provincia: "Buenos Aires",
    bio: "Especialista en cirugía de tejidos blandos y traumatología con más de 12 años de experiencia. Mi enfoque se centra en técnicas quirúrgicas avanzadas y procedimientos mínimamente invasivos para garantizar una recuperación rápida, segura y reducir el dolor posoperatorio en pacientes críticos.",
    foto: "https://images.unsplash.com/photo-1594824436998-ef22cc372134?auto=format&fit=crop&w=400&q=80",
    fotosPerfil: ["https://images.unsplash.com/photo-1594824436998-ef22cc372134?auto=format&fit=crop&w=400&q=80"],
    atiendeDomicilio: true,
    emailContacto: "contacto@claravaldez.com",
    instagram: "https://instagram.com/draclaravaldez",
    whatsappActivo: true,
    whatsappNum: "5491145678901",
    tipo: 'profesional',
    trayectoria: [
      { id: 1, titulo: "Especialidad en Cirugía de Pequeños Animales", desc: "UBA - 2015", extra: "Graduada con Diploma de Honor" },
      { id: 2, titulo: "Certificación en Técnicas Quirúrgicas Avanzadas", desc: "Asociación Veterinaria Argentina - 2018", extra: "Enfoque en laparoscopia digestiva" },
      { id: 3, titulo: "Disertante en Congresos de Traumatología", desc: "Nacional e Internacional - 2021/2024", extra: "Presentación de casos complejos de resolución ósea" }
    ],
    servicios: [
      { id: 1, titulo: "Cirugía Abdominal Compleja", desc: "Enterotomías, esplenectomías y resolución de torsión gástrica.", icono: 'Stethoscope' },
      { id: 2, titulo: "Traumatología y Ortopedia", desc: "Resolución de fracturas complejas y estabilización de ruptura de ligamentos.", icono: 'Activity' },
      { id: 3, titulo: "Interconsultas de Alta Complejidad", desc: "Evaluación prequirúrgica integral y diseño de protocolos personalizados.", icono: 'UserCheck' }
    ],
    casos: [
      { 
        id: 1, 
        nombre: "Luna (Ovejero Alemán)", 
        patologia: "Cirugía de Cadera Reconstructiva", 
        desc: "Resolución exitosa de una displasia severa bilateral que impedía la marcha. Se aplicaron técnicas de osteotomía pélvica con excelente evolución posquirúrgica.", 
        fotos: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80"] 
      },
      { 
        id: 2, 
        nombre: "Rocco (Bulldog Francés)", 
        patologia: "Síndrome Braquicefálico Complejo", 
        desc: "Corrección quirúrgica de paladar elongado y estenosis de narinas. Logramos una mejora del 90% en la capacidad respiratoria y ventilación del paciente.", 
        fotos: ["https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&w=400&q=80"] 
      }
    ],
    zonas: [
      { 
        id: 1, 
        nombre: "Zona Oeste", 
        clinicas: [
          { id: 101, nombre: "Veterinaria Patitos", direccion: "Morón, Centro", linkMaps: "https://goo.gl/maps/ejemplo" },
          { id: 102, nombre: "Hospital Veterinario Haedo", direccion: "Av. Rivadavia 16200, Haedo", linkMaps: "https://goo.gl/maps/ejemplo" }
        ] 
      },
      { 
        id: 2, 
        nombre: "Zona Norte", 
        clinicas: [
          { id: 103, nombre: "Consultorio San Isidro", direccion: "Centenario 450, San Isidro", linkMaps: "https://goo.gl/maps/ejemplo" }
        ] 
      }
    ]
  },
  {
    id: 'mercedes-arenas',
    planActual: 'pro',
    nombre: "Dra. Mercedes Arenas",
    especialidad: "Cirujana Traumatóloga",
    matricula: "54321",
    provincia: "Buenos Aires",
    bio: "Especialista en cirugía traumatológica y resolución de fracturas expuestas con más de 15 años de experiencia en centros de alta complejidad. Dedicada al desarrollo de técnicas de osteosíntesis biológica.",
    foto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    fotosPerfil: ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"],
    atiendeDomicilio: false,
    emailContacto: "contacto@dramercedesarenas.com",
    instagram: "https://instagram.com/merce1107",
    whatsappActivo: true,
    whatsappNum: "5491145678901",
    tipo: 'profesional',
    trayectoria: [
      { id: 1, titulo: "Médica Veterinaria Graduada", desc: "UBA - 2006", extra: "Egresada con mención de honor al mérito académico" },
      { id: 2, titulo: "Postgrado Avanzado en Ortopedia Veterinaria", desc: "Universidad de Chile - 2010", extra: "Especialización en fijación externa" }
    ],
    servicios: [
      { id: 1, titulo: "Osteosíntesis Avanzada", desc: "Colocación de placas bloqueadas y clavos intramedulares en huesos largos.", icono: 'Stethoscope' },
      { id: 2, titulo: "Resolución de Luxaciones", desc: "Tratamiento quirúrgico y ortopédico de luxaciones de rótula, codo y cadera.", icono: 'Activity' }
    ],
    casos: [
      { 
        id: 1, 
        nombre: "Milo (Mestizo)", 
        patologia: "Fractura de Fémur Conminuta", 
        desc: "Paciente politraumatizado por accidente vial. Se realizó reducción mediante placa de compresión dinámica bloqueada (LCP), logrando apoyo completo a las 72 horas.", 
        fotos: ["https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=400&q=80"] 
      }
    ],
    zonas: [
      { 
        id: 1, 
        nombre: "Zona Norte", 
        clinicas: [
          { id: 201, nombre: "Veterinaria Dequivet", direccion: "Vicente López, Olivos", linkMaps: "https://goo.gl/maps/ejemplo" },
          { id: 202, nombre: "Centro Médico Veterinario Tigre", direccion: "Cazón 900, Tigre", linkMaps: "https://goo.gl/maps/ejemplo" }
        ] 
      }
    ]
  },
  {
    id: 'clinica-san-roque',
    planActual: 'pro',
    nombre: 'Clínica Veterinaria San Roque',
    especialidad: 'Atención Integral y Emergencias 24hs',
    provincia: 'CABA',
    bio: 'Hospital de referencia médica fundado hace más de 20 años. Nos dedicamos a la medicina interna, cuidados intensivos y cirugía general con un equipo multidisciplinario activo día y noche para velar por el bienestar de tu mascota.',
    foto: "https://images.unsplash.com/photo-1584820927498-cfe5e11838df?auto=format&fit=crop&w=400&q=80",
    emailContacto: 'urgencias@sanroque.com',
    whatsappActivo: true,
    whatsappNum: '5491100000000',
    tipo: 'clinica',
    servicios: [
      { id: 1, titulo: 'Guardia y Emergencias 24hs', desc: 'Médicos de guardia permanentes listos para triaje, shockroom y estabilización de urgencias.', icono: 'Clock' },
      { id: 2, titulo: 'Laboratorio de Alta Complejidad', desc: 'Análisis de sangre completos, bioquímicas, ionogramas y gases en sangre con resultados en 15 minutos.', icono: 'Building' },
      { id: 3, titulo: 'Quirófano Central Equipado', desc: 'Procedimientos programados y de urgencia bajo estrictas normas de esterilidad y monitoreo.', icono: 'Stethoscope' },
      { id: 4, titulo: 'Internación Monitorizada Separada', desc: 'Salas independientes para caninos y felinos con control térmico y bombas de infusión continuas.', icono: 'Activity' }
    ],
    zonas: []
  }
];

// ==========================================
// 2. DATA PARA LA BOLSA DE TRABAJO
// ==========================================
const ofertasTrabajoMuestra = [
  {
    id: 'oferta-san-roque-guardia', 
    puesto: "Guardia / Urgencias",
    clinica: "Clínica Veterinaria San Roque",
    logoClinica: "https://images.unsplash.com/photo-1584820927498-cfe5e11838df?auto=format&fit=crop&w=400&q=80",
    provincia: "CABA",
    ciudad: "Palermo",
    experiencia: "1 a 3 años (Semi-Senior)",
    tipoContacto: ["whatsapp", "email"],
    contactoWhatsapp: "5491100000000",
    contactoEmail: "urgencias@sanroque.com",
    fechaPublicacion: "Hace 1 día",
    descripcion: "Buscamos médico/a veterinario/a para integrarse al equipo permanente de urgencias en horario nocturno. La posición implica la recepción de pacientes críticos en shockroom, manejo de terapias fluidas, internaciones complejas y comunicación empática con los tutores. Buscamos un perfil resolutivo, con capacidad de trabajar bajo presión y coordinar tareas con los asistentes técnicos.",
    requisitos: [
      "Matrícula nacional o de CABA activa y vigente (excluyente)", 
      "Experiencia mínima comprobable de 1 año en atención de guardias activas de pequeños animales", 
      "Sólidos conocimientos en interpretación de estudios complementarios rápidos (Ecografía FAST, analíticas y radiología)"
    ],
    equipamiento: [
      "Laboratorio de análisis clínicos automatizado propio las 24hs", 
      "Equipo de radiología digital directa y ecógrafo para emergencias", 
      "Monitores multiparamétricos (ECG, Capnografía, Presión No Invasiva)", 
      "Bombas de infusión peristálticas en todas las unidades de internación",
      "Asistencia permanente de enfermeros técnicos capacitados por turno"
    ],
    estado: "activo",
    creadorId: "clinica-san-roque"
  }
];

const profesionalesDisponiblesMuestra = [
  {
    id: 'dispo-mercedes-arenas', 
    nombre: "Dra. Mercedes Arenas",
    especialidad: "Cirujano", 
    provincia: "Buenos Aires",
    experiencia: "Más de 3 años (Senior)",
    tiempo: "Por turnos",
    momentoDia: "A convenir",
    servicios: [
      "Cirugías traumatológicas de alta y mediana complejidad", 
      "Resolución de fracturas axiales y apendiculares mediante osteosíntesis", 
      "Interconsultas traumatológicas itinerantes programadas en clínicas",
      "Asesoramiento y seguimiento radiográfico posquirúrgico"
    ],
    buscando: "Ofrezco mis servicios especializados como cirujana traumatóloga externa e itinerante para clínicas, centros médicos y hospitales veterinarios ubicados en Zona Norte del GBA y CABA. Cuento con instrumental especializado propio completo, motores quirúrgicos de alta velocidad y cajas de placas/tornillos bloqueados listos para operar.",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    estado: "activo",
    creadorId: "mercedes-arenas"
  }
];

// ==========================================
// 3. DATA PARA CAPACITACIONES
// ==========================================
export const CURSOS_SEED = [
  {
    id: 'sem-cirugia-tejidos', // AGREGADO
    titulo: "Cirugía de Tejidos Blandos: Procedimientos Avanzados",
    marca: "Acare Veterinaria",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=AV&backgroundColor=1A3D3D",
    imagen: "https://images.unsplash.com/photo-1576089238240-749e77163c44?auto=format&fit=crop&w=800&q=80",
    descripcion: "Técnicas innovadoras para resolución de patologías complejas en cavidad abdominal. Aprenderás desde la planificación pre-quirúrgica hasta el manejo post-operatorio crítico. Este curso está diseñado para brindar las herramientas necesarias en intervenciones donde el tiempo y la precisión son fundamentales.",
    instructor: "Dr. Julián Martínez",
    nivel: "Intermedio",
    duracion: "12h 30m",
    modalidad: "Online",
    precio: 45000,
    precioOriginal: 55000,
    badge: "Más Vendido",
    categoria: "Cirugía General",
    rating: 4.8,
    reviews: 124,
    incluye: [
      "Certificado de validez nacional", 
      "Material de estudio descargable", 
      "Acceso de por vida", 
      "Foro de consultas con el docente", 
      "Análisis de casos clínicos reales", 
      "Protocolos anestésicos actualizados"
    ]
  },
  {
    id: 'sem-dermatologia-clinica', // AGREGADO
    titulo: "Dermatología Clínica: De la Atopia a la Citología",
    marca: "VetLab Pro",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=VP&backgroundColor=2D6A6A",
    imagen: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    descripcion: "Diagnóstico citológico y manejo terapéutico de las alergias más comunes. Un enfoque práctico para el consultorio diario con casos clínicos reales para mejorar la calidad de vida del paciente atópico.",
    instructor: "Dra. Sofía Galván",
    nivel: "Principiante",
    duracion: "8h 15m",
    modalidad: "Presencial",
    precio: 32000,
    precioOriginal: 38000,
    badge: "Nuevo",
    categoria: "Dermatología",
    rating: 5.0,
    reviews: 18,
    incluye: [
      "Kit de bienvenida", 
      "Práctica en laboratorio microscópico", 
      "Certificado físico", 
      "Networking presencial", 
      "Toma de muestras en vivo", 
      "Guía rápida de fármacos"
    ]
  },
  {
    id: 'sem-ecocardiografia', // AGREGADO
    titulo: "Ecocardiografía Doppler en Pequeños Animales",
    marca: "CardioVet Argentina",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=CV&backgroundColor=4DB6AC",
    imagen: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
    descripcion: "Programa intensivo sobre evaluación hemodinámica y funcional del corazón. Aprenderás a realizar mediciones exactas, identificar patologías valvulares y congénitas, y establecer pronósticos precisos utilizando tecnología Doppler.",
    instructor: "Dr. Roberto Favaloro",
    nivel: "Avanzado",
    duracion: "24h",
    modalidad: "Híbrido",
    precio: 85000,
    precioOriginal: 95000,
    badge: "Cupos Limitados",
    categoria: "Diagnóstico por Imágenes",
    rating: 4.9,
    reviews: 56,
    incluye: [
      "Clases teóricas asincrónicas", 
      "Jornada práctica intensiva con pacientes", 
      "Software de simulación Doppler", 
      "Soporte directo por WhatsApp", 
      "Evaluación final integradora"
    ]
  },
  {
    id: 'sem-medicina-felina', // AGREGADO
    titulo: "Medicina Felina: Abordaje del Paciente Crítico",
    marca: "CatCare Academy",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=CC&backgroundColor=1A3D3D",
    imagen: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    descripcion: "El gato no es un perro pequeño. Descubrí las particularidades metabólicas y de manejo en la unidad de cuidados intensivos felina. Desde obstrucciones uretrales hasta cetoacidosis diabética.",
    instructor: "Dra. Laura Montes",
    nivel: "Intermedio",
    duracion: "10h",
    modalidad: "Online",
    precio: 38000,
    precioOriginal: 42000,
    badge: "Tendencia",
    categoria: "Clínica de Pequeños",
    rating: 4.7,
    reviews: 89,
    incluye: [
      "Tablas de fluidoterapia exclusivas para gatos", 
      "Videos de procedimientos invasivos", 
      "Certificación internacional", 
      "Guía de analgesia felina"
    ]
  }
]; */}
// ==========================================
// 4. DATA PARA PROVEEDORES (COMPLETA Y REALISTA)
// ==========================================
export const PARTNERS_SEED = [
  {
    id: 'prov-medvet',
    slug: 'distribuidora-medvet',
    verificado: true,
    cuentaEmail: 'gerencia@medvet.com.ar',
    cuentaPassword: '',
    cuentaTelefono: '5491144445555',
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=DM&backgroundColor=2D6A6A",
    fotoPortada: "https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&w=1200&q=80",
    nombre: "Distribuidora MedVet",
    razonSocial: "MedVet Insumos S.A.",
    cuit: "30-71234567-8",
    categoria: "Distribuidor Oficial Nacional",
    bioCorta: "Equipamiento médico e insumos descartables de alta calidad para clínicas y hospitales veterinarios.",
    bioLarga: "Con más de 15 años en el mercado argentino, Distribuidora MedVet se consolida como el principal aliado estratégico de los profesionales veterinarios. \n\nNos especializamos en la importación y distribución de equipamiento de diagnóstico por imágenes, monitoreo multiparamétrico e insumos hospitalarios de uso diario. Nuestro compromiso no solo es la venta, sino ofrecer un servicio post-venta de excelencia, con stock permanente de repuestos y capacitación continua para el uso de nuestra tecnología.",
    imagenNosotros: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    videoNosotros: "https://youtube.com/watch?v=ejemplo",
    direccion: "Av. Cabildo 2040, CABA",
    mapaUrl: "https://goo.gl/maps/ejemplo1",
    horariosAtencion: "Lunes a Viernes de 09:00 a 18:00 hs",
    whatsappActivo: true,
    whatsappVentas: "5491144445555",
    emailVentas: "ventas@medvet.com.ar",
    web: "https://medvet.com.ar",
    instagram: "https://instagram.com/medvet.arg",
    facebook: "https://facebook.com/medvet",
    linkedin: "https://linkedin.com/company/medvet",
    linkCatalogo: "https://drive.google.com/drive/folders/ejemplo",
    marcasRepresentadas: "Mindray, Sonoscape, B. Braun, 3M",
    zonaCobertura: ["CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Entre Ríos"],
    rubros: ["Equipamiento Médico", "Descartables Hospitalarios", "Instrumental Quirúrgico"],
    envios: ["Envíos a todo el país", "Despacho en 24/48hs", "Retiro en depósito local", "Embalaje de seguridad"],
    pagos: ["Emitimos Factura A y B", "Desc. por Transferencia", "Cuotas c/ Tarjeta de Crédito", "Aceptamos E-Cheq"],
    garantia: ["Garantía oficial de fábrica", "Servicio técnico propio", "Provisión repuestos originales", "Asesoramiento técnico continuo"],
    modalidadTexto: "Venta Online 24/7, Showroom con cita previa",
    productosDestacados: [
      {
        id: 1718000001,
        titulo: "Ecógrafo Portátil Mindray DP-50 Vet",
        categoria: "Equipamiento Médico",
        etiqueta: "Promo",
        precio: "3500000",
        imagenes: [
          "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1584820927498-cfe5e11838df?auto=format&fit=crop&w=800&q=80"
        ],
        descripcionLarga: "Sistema de ultrasonido en blanco y negro de nueva generación, compacto e inteligente. Diseñado específicamente para uso veterinario con transductores microconvexos y lineales de alta densidad. Ideal para diagnósticos rápidos en consultorio o salidas a campo por su batería de larga duración.",
        caracteristicas: [
          "Pantalla LCD de 15 pulgadas de alta resolución con ángulo ajustable",
          "Batería recargable con autonomía de 2.5 horas de escaneo continuo",
          "Software de medición veterinaria integrado (caninos, felinos, equinos, bovinos)",
          "Disco duro de 500GB y puertos USB para exportación rápida"
        ]
      },
      {
        id: 1718000002,
        titulo: "Monitor Multiparamétrico Vet Pro 8",
        categoria: "Equipamiento Médico",
        etiqueta: "",
        precio: "1250000",
        imagenes: [
          "https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&w=800&q=80"
        ],
        descripcionLarga: "Monitoreo constante y preciso para cirugías de alta complejidad. Diseñado específicamente para las variaciones fisiológicas de pequeños animales. Alarmas sonoras y visuales configurables según el peso y especie del paciente.",
        caracteristicas: [
          "Pantalla táctil a color de 12.1 pulgadas",
          "Parámetros: ECG (3/5 derivaciones), SpO2, NIBP, TEMP, RESP",
          "Incluye set completo de manguitos y pinzas veterinarias",
          "Módulo de Capnografía (EtCO2) opcional"
        ]
      }
    ]
  },
  {
    id: 'prov-nutripet',
    slug: 'nutripet-argentina',
    verificado: true,
    cuentaEmail: 'admin@nutripet.com.ar',
    cuentaPassword: '',
    cuentaTelefono: '5492322558899',
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=NP&backgroundColor=E4405F",
    fotoPortada: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80",
    nombre: "NutriPet Argentina",
    razonSocial: "Nutrición Animal S.R.L.",
    cuit: "30-65432198-1",
    categoria: "Fabricante Nacional",
    bioCorta: "Línea de alimentos de prescripción clínica y suplementos dietarios de alta asimilación.",
    bioLarga: "En NutriPet desarrollamos y fabricamos alimentos balanceados de prescripción médica veterinaria. Nuestra planta, ubicada en el Parque Industrial de Pilar, opera bajo los más estrictos estándares de bioseguridad y calidad nutricional.\n\nTrabajamos codo a codo con gastroenterólogos y nefrólogos veterinarios para formular dietas específicas que apoyen los tratamientos clínicos, utilizando proteínas hidrolizadas y materias primas de origen humano.",
    imagenNosotros: "https://images.unsplash.com/photo-1590424693950-689b940e4ab7?auto=format&fit=crop&w=800&q=80",
    videoNosotros: "",
    direccion: "Parque Industrial Pilar, Calle 9 N° 120, Prov. de Buenos Aires",
    mapaUrl: "https://goo.gl/maps/ejemplo2",
    horariosAtencion: "Lunes a Viernes de 08:00 a 17:00 hs",
    whatsappActivo: true,
    whatsappVentas: "5492322558899",
    emailVentas: "pedidos@nutripet.com.ar",
    web: "https://nutripet.com.ar",
    instagram: "https://instagram.com/nutripet.vet",
    facebook: "",
    linkedin: "https://linkedin.com/company/nutripet-argentina",
    linkCatalogo: "https://drive.google.com/drive/folders/ejemplo2",
    marcasRepresentadas: "NutriPet Clinical, NutriPet Suplementos, GastroCare",
    zonaCobertura: ["Buenos Aires", "CABA", "Córdoba", "Mendoza", "Tucumán", "Salta", "Neuquén", "Río Negro", "Chubut"],
    rubros: ["Alimentos y Dietas", "Fármacos e Insumos"],
    envios: ["Envíos a todo el país", "Transporte a convenir"],
    pagos: ["Emitimos Factura A y B", "Desc. por Transferencia", "Aceptamos E-Cheq"],
    garantia: ["Garantía oficial de fábrica", "Asesoramiento técnico continuo"],
    modalidadTexto: "Venta Online 24/7",
    productosDestacados: [
      {
        id: 1718000003,
        titulo: "Alimento Hepatic Care Plus - 15kg",
        categoria: "Alimentos y Dietas",
        etiqueta: "Nuevo",
        precio: "48000",
        imagenes: [
          "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80"
        ],
        descripcionLarga: "Fórmula terapéutica diseñada específicamente para perros con insuficiencia hepática crónica, derivación portosistémica o encefalopatía hepática. Alta digestibilidad energética para evitar el catabolismo proteico y sobrecarga del hígado.",
        caracteristicas: [
          "Bajo contenido de cobre y enriquecido con zinc",
          "Proteínas de origen vegetal de altísima asimilación (soja hidrolizada)",
          "Complejo antioxidante sinérgico (Vitamina E, C, Taurina y Luteína)",
          "Presentación exclusiva para canales veterinarios"
        ]
      },
      {
        id: 1718000004,
        titulo: "Suplemento Articular CondroVet x 60 comp",
        categoria: "Fármacos e Insumos",
        etiqueta: "",
        precio: "18500",
        imagenes: [
          "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
        ],
        descripcionLarga: "Condroprotector de última generación. Favorece la regeneración del cartílago articular, disminuye la inflamación y el dolor en pacientes con osteoartrosis, displasia o en recuperación post-quirúrgica traumatológica.",
        caracteristicas: [
          "Alta concentración de Glucosamina y Condroitín Sulfato",
          "Incorpora Ácido Hialurónico y Colágeno tipo II nativo",
          "Comprimidos palatables sabor carne, ranurados",
          "Dosis de mantenimiento: 1 comprimido cada 20kg"
        ]
      }
    ]
  },
  {
    id: 'prov-techvet',
    slug: 'techvet-solutions',
    verificado: true,
    cuentaEmail: 'soporte@techvet.io',
    cuentaPassword: '',
    cuentaTelefono: '5491133332222',
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=TV&backgroundColor=1A3D3D",
    fotoPortada: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    nombre: "TechVet Solutions",
    razonSocial: "Veterinaria Digital S.A.",
    cuit: "30-88889999-2",
    categoria: "Laboratorio Veterinario", 
    bioCorta: "Transformación digital para tu clínica: Software de gestión en la nube y sensores de radiología digital directa (DR).",
    bioLarga: "En TechVet Solutions unimos la tecnología informática con la práctica veterinaria diaria. Nuestro ecosistema digital permite que las clínicas modernas se despidan del papel, optimicen su facturación y mejoren la comunicación con los tutores.\n\nAdemás de nuestro reconocido software CloudVet, somos integradores de salas de Rayos X, proveyendo digitalizadores CR y Flat Panels DR con software de adquisición veterinaria DICOM integrado. Llevamos tu clínica al siglo XXI.",
    imagenNosotros: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
    videoNosotros: "",
    direccion: "Av. Libertador 5500, Of. 4B, CABA (Oficinas Administrativas)",
    mapaUrl: "",
    horariosAtencion: "Soporte Técnico 24/7",
    whatsappActivo: true,
    whatsappVentas: "5491133332222",
    emailVentas: "hola@techvet.io",
    web: "https://techvet.io",
    instagram: "https://instagram.com/techvet",
    facebook: "",
    linkedin: "https://linkedin.com/company/techvetsolutions",
    linkCatalogo: "https://techvet.io/planes",
    marcasRepresentadas: "CloudVet, Carestream, Venu",
    zonaCobertura: ["Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"],
    rubros: ["Software y Tecnología", "Equipamiento Médico"],
    envios: ["Envíos a todo el país", "Embalaje de seguridad"],
    pagos: ["Emitimos Factura A y B", "Desc. por Transferencia", "Cuotas c/ Tarjeta de Crédito", "Financiación Propia"],
    garantia: ["Garantía oficial de fábrica", "Servicio técnico propio", "Asesoramiento técnico continuo"],
    modalidadTexto: "Venta Online 24/7",
    productosDestacados: [
      {
        id: 1718000005,
        titulo: "Licencia CloudVet - Plan Clínica (Anual)",
        categoria: "Software y Tecnología",
        etiqueta: "Promo",
        precio: "350000",
        imagenes: [
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
        ],
        descripcionLarga: "El software de gestión clínica más completo de Latinoamérica. Centraliza historias clínicas, recordatorios de vacunación por WhatsApp, control de stock automatizado y facturación electrónica AFIP.",
        caracteristicas: [
          "Acceso ilimitado para múltiples veterinarios y recepcionistas",
          "Envío automático de recordatorios por WhatsApp a tutores",
          "Firma digital de consentimientos informados",
          "Integración de resultados de laboratorio directamente en la ficha"
        ]
      },
      {
        id: 1718000006,
        titulo: "Panel Flat DR Inalámbrico 14x17",
        categoria: "Equipamiento Médico",
        etiqueta: "",
        precio: "18500000",
        imagenes: [
          "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80"
        ],
        descripcionLarga: "Transformá tu equipo de rayos X tradicional en un sistema digital de última generación. El panel Flat Detector inalámbrico ofrece imágenes de calidad diagnóstica en 3 segundos. Resistente a líquidos y caídas (IPX6).",
        caracteristicas: [
          "Tecnología de centelleador de Ioduro de Cesio (CsI)",
          "Conexión WiFi ultrarrápida a la workstation",
          "Incluye laptop con software de adquisición DICOM veterinario",
          "Herramientas de medición automática (VHS, Ángulo Norberg)"
        ]
      }
    ]
  }
];

// ==========================================
// FUNCIÓN PRINCIPAL DE CARGA
// ==========================================
export const cargarSeeds = async () => {
  try {
    // 1. Cargar perfiles de la cartilla
    for (const p of perfilesMuestra) {
      await setDoc(doc(db, 'profesionales', p.id), p);
    }
    
    // 2. Cargar ofertas laborales de la bolsa
    for (const o of ofertasTrabajoMuestra) {
      await setDoc(doc(db, 'ofertasEmpleo', o.id), o);
    }

    // 3. Cargar profesionales disponibles de la bolsa
    for (const prof of profesionalesDisponiblesMuestra) {
      await setDoc(doc(db, 'profesionalesDisponibles', prof.id), prof);
    }

    // --- LO NUEVO EMPIEZA ACÁ ---

    // 4. Cargar Capacitaciones
    for (const sem of CURSOS_SEED) {
      await setDoc(doc(db, 'capacitaciones', sem.id), sem);
    }

    // 5. Cargar Proveedores / Partners
    for (const prov of PARTNERS_SEED) {
      await setDoc(doc(db, 'proveedores', prov.id), prov);
    }

    console.log("¡Todo el ecosistema de muestras (Cartilla, Bolsa de trabajo, Capacitaciones y Proveedores) se cargó con éxito en Firebase!");
  } catch (error) {
    console.error("Error al inyectar los datos en la base de datos:", error);
    throw error;
  }
};