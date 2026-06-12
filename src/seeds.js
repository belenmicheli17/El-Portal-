import { db } from './firebase'; 
import { doc, setDoc } from 'firebase/firestore';

// ==========================================
// 1. PERFILES GENERALES DE LA CARTILLA (Ricos en información)
// ==========================================
const perfilesMuestra = [
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
// 2. DATA PARA LA BOLSA DE TRABAJO (Conectada e hiperdetallada)
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

    console.log("¡Todo el ecosistema de muestras (Cartilla + Bolsa de Trabajo) se cargó con éxito en Firebase!");
  } catch (error) {
    console.error("Error al inyectar los datos en la base de datos:", error);
    throw error;
  }
};