import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  Star, Clock, ChevronLeft, Filter, Search, ShieldCheck,
  FileText, CheckCircle2, PlayCircle, Plus, MessageCircle, ExternalLink, ChevronRight, Monitor, MapPin, Check,
  Award, BookOpen, Users, Globe, Share2, Tag,
  Facebook, Instagram, Linkedin, Mail, Heart,
  UploadCloud, Save, Loader2, Trash2, Download, Activity, AlertCircle,
  Truck, Settings2, Shield, Smartphone, Send, Building
} from 'lucide-react';

// ==========================================
// DATOS
// ==========================================
const CATEGORIAS = ["Cirugía General", "Diagnóstico por Imágenes", "Gestión Veterinaria", "Clínica de Pequeños", "Dermatología", "Anestesiología"];
const MODALIDADES = ["Online", "Presencial", "Híbrido"];

const SEMINARIOS = [
  {
    id: 1,
    titulo: "Cirugía de Tejidos Blandos: Procedimientos Avanzados",
    marca: "Acare Veterinaria",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=AV&backgroundColor=1A3D3D",
    imagen: "https://images.unsplash.com/photo-1576089238240-749e77163c44?auto=format&fit=crop&w=800&q=80",
    descripcion: "Técnicas innovadoras para resolución de patologías complejas en cavidad abdominal. Aprenderás desde la planificación pre-quirúrgica hasta el manejo post-operatorio crítico. Este curso está diseñado para brindar las herramientas necesarias en intervenciones donde el tiempo y la precisiónlam son fundamentales.",
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
    incluye: ["Certificado de validez nacional", "Material de estudio descargable", "Acceso de por vida", "Foro de consultas con el docente", "Análisis de casos clínicos reales", "Protocolos anestésicos actualizados"]
  },
  {
    id: 2,
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
    incluye: ["Kit de bienvenida", "Práctica en laboratorio", "Certificado físico", "Networking presencial", "Toma de muestras en vivo", "Guía rápida de fármacos"]
  }
];

const CATEGORIAS_INSUMOS = ["Ecografía y Diagnóstico", "Equipamiento Quirófano", "Instrumental y Descartables", "Software y Gestión", "Nutrición Clínica"];

const PROVEEDORES = [
  {
    id: 'p1',
    marca: "Distribuidora MedVet",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=DM&backgroundColor=2D6A6A",
    imagenPortada: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    descripcionCorta: "Equipamiento de alta gama para diagnóstico por imágenes, ecógrafos portátiles e internación.",
    categorias: ["Ecografía y Diagnóstico", "Equipamiento Quirófano"],
    isPremium: true,
    ubicacion: "Buenos Aires, CABA",
    sitioWeb: "www.medvet.com.ar"
  },
  {
    id: 'p2',
    marca: "VetTech Anestesia",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=VT&backgroundColor=1A3D3D",
    imagenPortada: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    descripcionCorta: "Especialistas en monitores multiparamétricos, bombas de infusión y máquinas de anestesia veterinaria.",
    categorias: ["Equipamiento Quirófano"],
    isPremium: true,
    ubicacion: "Córdoba, Capital",
    sitioWeb: "www.vettech.com"
  },
  {
    id: 'p3',
    marca: "Insumos Sur",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=IS&backgroundColor=475569",
    imagenPortada: "https://images.unsplash.com/photo-1576089238240-749e77163c44?auto=format&fit=crop&w=800&q=80",
    descripcionCorta: "Instrumental quirúrgico de acero alemán, descartables, suturas y ropa médica de alta durabilidad.",
    categorias: ["Instrumental y Descartables"],
    isPremium: false,
    ubicacion: "Rosario, Santa Fe",
    sitioWeb: "www.insumossur.com.ar"
  },
  {
    id: 'p4',
    marca: "SoftVet Cloud",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=SV&backgroundColor=2D6A6A",
    imagenPortada: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    descripcionCorta: "Software de gestión integral en la nube. Historias clínicas, turnos y facturación automatizada.",
    categorias: ["Software y Gestión"],
    isPremium: false,
    ubicacion: "CABA, Buenos Aires",
    sitioWeb: "www.softvet.io"
  },
  {
    id: 'p5',
    marca: "NutriVet Pro",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=NV&backgroundColor=eab308",
    imagenPortada: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
    descripcionCorta: "Dietas de prescripción veterinaria, suplementos y alimentación premium para casos clínicos complejos.",
    categorias: ["Nutrición Clínica"],
    isPremium: false,
    ubicacion: "Mendoza, Capital",
    sitioWeb: "www.nutrivet.com"
  }
];

const PARTNERS = [
  {
    id: 101,
    titulo: "Ecógrafo Portátil Mindray V1",
    marca: "Distribuidora MedVet",
    logoMarca: "https://api.dicebear.com/7.x/initials/svg?seed=DM&backgroundColor=2D6A6A",
    imagen: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    descripcionCorta: "La mejor resolución para diagnóstico en campo.",
    descripcionLarga: "El Mindray V1 es la solución definitiva para el veterinario moderno que requiere movilidad sin sacrificar calidad de imagen. Su diseño ultraportátil y resistente al agua lo hace ideal tanto para el consultorio como para el trabajo de campo con grandes animales (equinos, bovinos). Cuenta con tecnología de procesamiento de imágenes avanzada que garantiza diagnósticos precisos en ecografía abdominal, cardíaca y reproductiva.",
    color: "#2D6A6A",
    precio: 2500000,
    codigoDescuento: "PORTAL10",
    porcentajeDescuento: 10,
    caracteristicas: [
      "Pantalla táctil de 15 pulgadas de alta resolución anti-reflejo",
      "Batería de larga duración (hasta 4 horas de escaneo continuo)",
      "Diseño robusto y resistente a salpicaduras y polvo (IPX4)",
      "Conectividad Wi-Fi y Bluetooth para exportación instantánea de imágenes",
      "Incluye transductor microconvexo multifrecuencia de serie"
    ],
    especificaciones: [
      { label: "Peso", value: "2.5 kg (con batería)" },
      { label: "Dimensiones", value: "35 cm x 30 cm x 5 cm" },
      { label: "Almacenamiento", value: "Disco SSD 128GB interno" },
      { label: "Garantía", value: "2 años directa de fábrica" }
    ]
  }
];

const FAQ_CATEGORIES = [
  {
    title: "Honorarios",
    items: [
      { q: "¿De cuánto es la comisión por venta?", a: "Retenemos un 15% por cada alumnx generado efectivamente. Este margen ya cubre los costos de las pasarelas de pago y nuestras campañas de marketing. No hay costos ocultos." },
      { q: "¿Cómo y cuándo recibo mis ganancias?", a: "Realizamos liquidaciones quincenales. El dinero de las ventas (menos la comisión) se transfiere directamente a tu cuenta bancaria institucional." },
      { q: "¿Quién emite la factura al alumno?", a: "La institución o docente le factura el 100% del curso al alumnx. El Portal emite una factura a la institución por el servicio de intermediación (la comisión del 15%)." }
    ]
  },
  {
    title: "Propiedad y Control",
    items: [
      { q: "¿Sigo siendo dueñx de mi contenido?", a: "Absolutamente. La propiedad intelectual es 100% tuya. El Portal actúa únicamente como un canal de difusión y venta para potenciar tu alcance." },
      { q: "¿Debo vender mi curso exclusivamente acá?", a: "No exigimos exclusividad. Sos libre de vender tu curso por otros canales; solo cobramos comisión por los alumnxs que nosotros generamos efectivamente." },
      { q: "¿Tengo acceso a los datos de mis alumnxs?", a: "Sí. Una vez concretada la inscripción, recibís el perfil y contacto del profesional para que puedas integrarlo a tu propia comunidad y seguimiento académico." }
    ]
  },
  {
    title: "Operativa y Logística",
    items: [
      { q: "¿Dónde se alojan y dictan los cursos?", a: "Tu metodología no cambia. El alumnx paga en El Portal, pero consume las clases en tu propia plataforma (Zoom, Moodle, Web propia), manteniendo tu identidad." },
      { q: "¿Mi curso se publica inmediatamente?", a: "No. Para garantizar el nivel de nuestra comunidad, todo el material pasa por un breve proceso de curaduría de 24/48hs por parte de nuestro comité antes de ser visible en el repertorio." },
      { q: "¿Qué sucede si un alumnx solicita un reembolso?", a: "Nos regimos por una política de satisfacción de 7 días. Si el alumnx solicita la baja justificada dentro de ese período, gestionamos la devolución sin costo administrativo para la institución." }
    ]
  }
];

export default function Repertorio() {
  const navigate = useNavigate();
  const [view, setView] = useState('grid');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [modalidadesSeleccionadas, setModalidadesSeleccionadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [activeGridTab, setActiveGridTab] = useState('cursos'); 
  const [activeInsumoTab, setActiveInsumoTab] = useState('features');
  const [openFaq, setOpenFaq] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [favoritos, setFavoritos] = useState([]);
  const [visibleCourses, setVisibleCourses] = useState(6);
  const [visibleProviders, setVisibleProviders] = useState(6);
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
  const [proveedorFiltroCategoria, setProveedorFiltroCategoria] = useState(null);

  // WIZARD CURSO
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [courseForm, setCourseForm] = useState({
    titulo: '', modalidad: 'Online', precio: '', nivel: 'Principiante', duracion: '',
    descripcion: '', incluye: [''],
    instructorNombre: '', instructorBio: '',
    email: '', password: '',
    fotoDocente: null
  });

  // WIZARD INSUMO
  const [insumoWizardStep, setInsumoWizardStep] = useState(1);
  const [insumoErrors, setInsumoErrors] = useState({});
  const [isInsumoSubmitting, setIsInsumoSubmitting] = useState(false);
  const [insumoFormState, setInsumoFormState] = useState({
    empresa: '', contacto: '', email: '', telefono: '', 
    tituloProducto: '', precio: '', categoria: 'Ecografía y Diagnóstico', categoriaOtra: '', 
    website: '', mensaje: '',
    caracteristicas: [''],
    especificaciones: [{ label: '', value: '' }],
    fotos: []
  });
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const bannerRef = useRef(null);

  useEffect(() => {
    const favsGuardados = localStorage.getItem('el_portal_favoritos');
    if (favsGuardados) {
      setFavoritos(JSON.parse(favsGuardados));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('el_portal_favoritos', JSON.stringify(favoritos));
  }, [favoritos]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const toggleModalidad = (mod) => {
    if (modalidadesSeleccionadas.includes(mod)) {
      setModalidadesSeleccionadas(modalidadesSeleccionadas.filter(m => m !== mod));
    } else {
      setModalidadesSeleccionadas([...modalidadesSeleccionadas, mod]);
    }
    setVisibleCourses(6);
  };

  const handleCategoryFilter = (cat) => {
    setFiltroCategoria(cat);
    setVisibleCourses(6);
  };

  const handleProveedorCategoryFilter = (cat) => {
    setProveedorFiltroCategoria(cat);
    setVisibleProviders(6);
  };

  const toggleFavorito = (e, id) => {
    e.stopPropagation();
    if (favoritos.includes(id)) {
      setFavoritos(favoritos.filter(favId => favId !== id));
    } else {
      setFavoritos([...favoritos, id]);
    }
  };

  const handleCourseClick = (curso) => {
    setSelectedCourse(curso);
    setActiveTab('about'); 
    setView('detail');
    window.scrollTo(0,0);
  };

  const handleInsumoClick = (insumo) => {
    setSelectedInsumo(insumo);
    setActiveInsumoTab('features');
    setView('insumoDetail');
    window.scrollTo(0,0);
  };

  // --- HANDLERS WIZARD CURSO ---
  const handleWizardChange = (field, value) => {
    setCourseForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateIncluyeItem = (index, value) => {
    const newIncluye = [...courseForm.incluye];
    newIncluye[index] = value;
    handleWizardChange('incluye', newIncluye);
  };
  const addIncluyeItem = () => handleWizardChange('incluye', [...courseForm.incluye, '']);
  const removeIncluyeItem = (index) => handleWizardChange('incluye', courseForm.incluye.filter((_, i) => i !== index));

  const handleDocenteFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleWizardChange('fotoDocente', {
      file,
      preview: URL.createObjectURL(file)
    });
  };

  const removeDocenteFoto = () => {
    if (courseForm.fotoDocente) {
       URL.revokeObjectURL(courseForm.fotoDocente.preview);
    }
    handleWizardChange('fotoDocente', null);
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!courseForm.titulo.trim()) newErrors.titulo = 'El título del curso es obligatorio.';
      if (!courseForm.precio || courseForm.precio <= 0) newErrors.precio = 'Ingresá un precio válido mayor a 0.';
    }
    if (step === 2) {
      if (!courseForm.descripcion.trim()) newErrors.descripcion = 'La descripción general es obligatoria.';
      if (courseForm.incluye.filter(i => i.trim()).length === 0) newErrors.incluye = 'Agregá al menos un punto clave de aprendizaje.';
    }
    if (step === 3) {
      if (!courseForm.instructorNombre.trim()) newErrors.instructorNombre = 'El nombre del docente es obligatorio.';
      if (!courseForm.instructorBio.trim()) newErrors.instructorBio = 'La biografía breve es obligatoria.';
    }
    if (step === 4) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(courseForm.email)) newErrors.email = 'El formato del correo electrónico no es válido.';
      if (courseForm.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(prev => prev + 1);
      window.scrollTo(0,0);
    }
  };

  const submitWizard = () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("¡Curso guardado como borrador! Redirigiendo a pasarela de pago segura...");
      setView('grid');
      setWizardStep(1);
      window.scrollTo(0,0);
    }, 2000);
  };

  // --- HANDLERS WIZARD INSUMO ---
  const handleInsumoFormChange = (field, value) => {
    setInsumoFormState(prev => ({ ...prev, [field]: value }));
    if (insumoErrors[field]) {
      setInsumoErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateCaracteristica = (index, value) => {
    const newCaract = [...insumoFormState.caracteristicas];
    newCaract[index] = value;
    handleInsumoFormChange('caracteristicas', newCaract);
  };
  const addCaracteristica = () => handleInsumoFormChange('caracteristicas', [...insumoFormState.caracteristicas, '']);
  const removeCaracteristica = (index) => handleInsumoFormChange('caracteristicas', insumoFormState.caracteristicas.filter((_, i) => i !== index));

  const updateEspecificacion = (index, field, value) => {
    const newSpecs = [...insumoFormState.especificaciones];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    handleInsumoFormChange('especificaciones', newSpecs);
  };
  const addEspecificacion = () => handleInsumoFormChange('especificaciones', [...insumoFormState.especificaciones, { label: '', value: '' }]);
  const removeEspecificacion = (index) => handleInsumoFormChange('especificaciones', insumoFormState.especificaciones.filter((_, i) => i !== index));

  const handleInsumoFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const fotosDisponibles = 4 - insumoFormState.fotos.length;
    const newFotos = files.slice(0, fotosDisponibles).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    handleInsumoFormChange('fotos', [...insumoFormState.fotos, ...newFotos]);
  };

  const removeInsumoFoto = (index) => {
    const newFotos = [...insumoFormState.fotos];
    URL.revokeObjectURL(newFotos[index].preview);
    newFotos.splice(index, 1);
    handleInsumoFormChange('fotos', newFotos);
  };

  const validateInsumoStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!insumoFormState.empresa.trim()) newErrors.empresa = 'El nombre de la empresa es obligatorio.';
      if (!insumoFormState.contacto.trim()) newErrors.contacto = 'La persona de contacto es obligatoria.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(insumoFormState.email)) newErrors.email = 'El formato del correo electrónico no es válido.';
      if (!insumoFormState.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio.';
    }
    if (step === 2) {
      if (!insumoFormState.tituloProducto.trim()) newErrors.tituloProducto = 'El nombre del equipo es obligatorio.';
      if (!insumoFormState.precio || insumoFormState.precio <= 0) newErrors.precio = 'Ingresá un precio válido mayor a 0.';
    }
    if (step === 3) {
      if (insumoFormState.caracteristicas.filter(i => i.trim()).length === 0) newErrors.caracteristicas = 'Agregá al menos una característica.';
    }
    setInsumoErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextInsumoStep = () => {
    if (validateInsumoStep(insumoWizardStep)) {
      setInsumoWizardStep(prev => prev + 1);
      window.scrollTo(0,0);
    }
  };

  const handleInsumoWizardSubmit = () => {
    if (!validateInsumoStep(4)) return;
    setIsInsumoSubmitting(true);
    setTimeout(() => {
      setIsInsumoSubmitting(false);
      alert("¡Datos guardados! Redirigiendo al pago... Una vez verificado, publicaremos tu producto.");
      // Limpiar URLs en memoria
      insumoFormState.fotos.forEach(f => URL.revokeObjectURL(f.preview));
      setInsumoFormState({ 
        empresa: '', contacto: '', email: '', telefono: '', 
        tituloProducto: '', precio: '', categoria: 'Ecografía y Diagnóstico', categoriaOtra: '', 
        website: '', mensaje: '', caracteristicas: [''], especificaciones: [{ label: '', value: '' }], fotos: [] 
      });
      setView('publicitar');
      setInsumoWizardStep(1);
      window.scrollTo(0,0);
    }, 1500);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Código ${text} copiado al portapapeles`);
  };

  const cursosFiltrados = SEMINARIOS.filter(curso => {
    const matchCategoria = !filtroCategoria || curso.categoria === filtroCategoria;
    const matchModalidad = modalidadesSeleccionadas.length === 0 || modalidadesSeleccionadas.includes(curso.modalidad);
    const matchBusqueda = !searchTerm || curso.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategoria && matchModalidad && matchBusqueda;
  });

  const proveedoresFiltrados = PROVEEDORES.filter(prov => {
    const matchCategoria = !proveedorFiltroCategoria || prov.categorias.includes(proveedorFiltroCategoria);
    const matchBusqueda = !proveedorSearchTerm || 
                          prov.marca.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) || 
                          prov.descripcionCorta.toLowerCase().includes(proveedorSearchTerm.toLowerCase());
    return matchCategoria && matchBusqueda;
  }).sort((a, b) => {
    if (a.isPremium && !b.isPremium) return -1;
    if (!a.isPremium && b.isPremium) return 1;
    return a.marca.localeCompare(b.marca);
  });

  const cursosMostrados = cursosFiltrados.slice(0, visibleCourses);
  const proveedoresMostrados = proveedoresFiltrados.slice(0, visibleProviders);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (!window.html2pdf) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      const element = document.getElementById('dossier-pdf-export');
      
      const opt = {
        margin:       0,
        filename:     'Documento_Institucional_ElPortal.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un error al descargar el PDF. Por favor intentá nuevamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // =========================================================================
  // COMPONENTES DE FILTROS (ASIDE IZQUIERDO)
  // =========================================================================
  const renderCursosFilters = () => (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-sm sticky top-[100px] animate-in slide-in-from-left-4 duration-500">
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-5 flex items-center gap-2 border-b border-gray-50 pb-2">
        <Filter className="w-3.5 h-3.5 text-[#2D6A6A]" /> Especialidades
      </h3>
      <ul className="space-y-3.5 mb-8">
        <li onClick={() => handleCategoryFilter(null)} className={`text-[13px] font-black font-['Montserrat'] tracking-tight cursor-pointer transition-colors ${!filtroCategoria ? 'text-[#2D6A6A]' : 'text-gray-300 hover:text-[#1A3D3D]'}`}>
          Todas
        </li>
        {CATEGORIAS.map(cat => (
          <li key={cat} onClick={() => handleCategoryFilter(cat)} className={`text-[13px] font-semibold cursor-pointer transition-colors ${filtroCategoria === cat ? 'text-[#2D6A6A]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
            {cat}
          </li>
        ))}
      </ul>

      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-5 flex items-center gap-2 border-b border-gray-50 pb-2">
        <Monitor className="w-3.5 h-3.5 text-[#2D6A6A]" /> Modalidad
      </h3>
      <div className="space-y-3.5">
        {MODALIDADES.map(mod => (
          <div key={mod} onClick={() => toggleModalidad(mod)} className="flex items-center gap-3 group cursor-pointer">
            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${modalidadesSeleccionadas.includes(mod) ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'border-gray-200 group-hover:border-[#2D6A6A]'}`}>
              {modalidadesSeleccionadas.includes(mod) && <Check className="w-3 h-3 text-white stroke-[4px]" />}
            </div>
            <span className={`text-[13px] font-semibold transition-colors ${modalidadesSeleccionadas.includes(mod) ? 'text-[#1A3D3D]' : 'text-gray-400 group-hover:text-[#1A3D3D]'}`}>
              {mod}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProveedoresFilters = () => (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-sm sticky top-[100px] animate-in slide-in-from-left-4 duration-500">
      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-5 flex items-center gap-2 border-b border-gray-50 pb-2">
        <Filter className="w-3.5 h-3.5 text-[#2D6A6A]" /> Rubros de Insumos
      </h3>
      <ul className="space-y-3.5 mb-8">
        <li 
          onClick={() => handleProveedorCategoryFilter(null)}
          className={`text-[13px] font-black font-['Montserrat'] tracking-tight cursor-pointer transition-colors ${!proveedorFiltroCategoria ? 'text-[#2D6A6A]' : 'text-gray-300 hover:text-[#1A3D3D]'}`}
        >
          Todos los rubros
        </li>
        {CATEGORIAS_INSUMOS.map(cat => (
          <li 
            key={cat} 
            onClick={() => handleProveedorCategoryFilter(cat)}
            className={`text-[13px] font-semibold cursor-pointer transition-colors ${proveedorFiltroCategoria === cat ? 'text-[#2D6A6A]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}
          >
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );

  // =========================================================================
  // COMPONENTES DE CONTENIDO (MAIN)
  // =========================================================================
  const renderCursosContent = () => (
    <div className="flex flex-col gap-5 md:gap-6 animate-in fade-in duration-500 w-full">
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" aria-hidden="true" />
        <input 
          type="search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="¿Qué quieres aprender hoy? (ej. Cirugía, Dermatología...)" 
          className="bg-white border border-gray-100 rounded-full pl-11 pr-6 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] w-full shadow-sm placeholder:text-gray-400 transition-all" 
        />
      </div>

      <article 
        ref={bannerRef}
        onMouseMove={handleMouseMove}
        className="bg-[#1A3D3D] px-5 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[24px] text-left relative overflow-hidden group shadow-md flex flex-row items-center justify-between gap-3 md:gap-6 border border-white/5"
      >
        <div 
          className="absolute pointer-events-none transition-transform duration-300 ease-out bg-white opacity-5 rounded-full blur-3xl"
          style={{ width: '300px', height: '300px', left: mousePos.x - 150, top: mousePos.y - 150 }}
        />
        <div className="relative z-10 flex flex-col items-start gap-1">
          <h2 className="text-white font-['Montserrat'] font-black text-[13px] md:text-lg uppercase leading-none tracking-tight">
            ¿Querés publicitar tu marca?
          </h2>
          <p className="text-white/50 text-[10px] md:text-xs font-medium italic hidden sm:block mt-0.5">
            Llegá a miles de profesionales de todo el país
          </p>
        </div>
        <button 
          onClick={() => setView('publicitar')}
          className="bg-[#2D6A6A] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full text-[10px] font-bold uppercase tracking-widest relative z-10 shadow-lg hover:bg-[#3d8b8b] transition-all whitespace-nowrap"
        >
          <span className="md:hidden">Más info</span>
          <span className="hidden md:inline">Más información</span>
        </button>
      </article>

      <div className="flex flex-col lg:grid lg:grid-cols-9 gap-5 lg:gap-8 w-full mt-2">
        <div className="lg:col-span-6 flex flex-col gap-5 md:gap-6">
          {cursosMostrados.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {cursosMostrados.map(curso => (
                  <article key={curso.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative"><div className="h-36 md:h-40 relative overflow-hidden cursor-pointer shrink-0" onClick={() => handleCourseClick(curso)}>
                      <img src={curso.imagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={curso.titulo} />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-[#2D6A6A] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-md animate-pulse">
                          {curso.badge}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => toggleFavorito(e, `curso-${curso.id}`)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-10"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(`curso-${curso.id}`) ? 'fill-red-500 text-red-500' : 'text-[#666666] hover:text-red-500'}`} />
                    </button>

                    <div className="p-4 md:p-5 flex flex-col flex-grow text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={curso.logoMarca} className="w-5 h-5 rounded-[20px] border border-gray-100" alt={`${curso.marca} logo`} />
                        <span className="text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] truncate">{curso.marca}</span>
                      </div>
                      <h3 
                        onClick={() => handleCourseClick(curso)}
                        className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px] leading-tight mb-1 group-hover:text-[#2D6A6A] transition-colors line-clamp-2 cursor-pointer"
                      >
                        {curso.titulo}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mb-4">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[11px] font-bold text-[#333333]">{curso.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-[11px] font-medium text-[#666666]">({curso.reviews})</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[11px] text-[#666666] font-semibold mb-4 mt-auto">
                        <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5 text-[#4DB6AC]" /> {curso.modalidad}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#4DB6AC]" /> {curso.duracion}</span>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-lg font-black text-[#1A3D3D] tracking-tight">${curso.precio.toLocaleString('es-AR')}</span>
                        <button aria-label="Conocer detalles del curso" onClick={() => handleCourseClick(curso)} className="bg-[#1A3D3D] text-white p-2.5 rounded-xl hover:bg-[#2D6A6A] transition-all">
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              
              {cursosFiltrados.length > visibleCourses && (
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => setVisibleCourses(prev => prev + 6)}
                    className="px-6 py-3 bg-white border border-gray-200 text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                  >
                    Cargar más resultados <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center w-full h-full">
              <Search className="w-10 h-10 text-gray-200 mb-4" />
              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-lg mb-2">Aún no hay búsquedas activas con estos filtros</h3>
<p className="text-[#333333] text-[15px] font-medium leading-relaxed">¿Probamos modificando la especialidad o la zona?</p>
            </div>
          )}
        </div>

        <aside className="lg:col-span-3 flex flex-col gap-5 md:gap-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-1">
            <h2 className="font-['Montserrat'] font-black text-gray-700 text-[11px] md:text-xs uppercase tracking-[0.2em]">Insumos Destacados</h2>
            <button 
              onClick={() => { setActiveGridTab('proveedores'); window.scrollTo(0,0); }} 
              className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1 w-fit mt-1 group"
            >
              Ver Directorio <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {PARTNERS.slice(0, 2).map(insumo => (
              <article 
                key={insumo.id} 
                className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-lg transition-all flex flex-col relative" 
                onClick={() => handleInsumoClick(insumo)}
              >
                <div className="h-24 relative bg-gray-50 border-b border-gray-100 shrink-0">
                  <img src={insumo.imagen} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={insumo.titulo} />
                  <div className="absolute -bottom-4 left-3 z-20">
                    <img src={insumo.logoMarca} className="w-10 h-10 rounded-[10px] bg-white border border-gray-100 shadow-sm object-cover" alt={`Logo ${insumo.marca}`} />
                  </div>
                </div>

                <button 
                  onClick={(e) => toggleFavorito(e, `insumo-${insumo.id}`)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-20"
                >
                  <Heart className={`w-3.5 h-3.5 transition-colors ${favoritos.includes(`insumo-${insumo.id}`) ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </button>
                
                <div className="pt-6 px-4 pb-4 text-left flex flex-col flex-grow">
                  <h4 className="font-['Montserrat'] font-black text-[#1A3D3D] text-xs mb-1 uppercase leading-tight line-clamp-1">{insumo.titulo}</h4>
                  <span className="text-[8px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] block mb-2 truncate">
                    {insumo.marca}
                  </span>
                  
                  <button className="mt-auto w-full py-2.5 bg-gray-50 text-[#1A3D3D] rounded-[10px] text-[9px] font-bold uppercase tracking-[0.2em] group-hover:bg-[#1A3D3D] group-hover:text-white transition-all flex items-center justify-center gap-1">
                    Conocer Detalles
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );

const renderProveedoresContent = () => (
  <div className="flex flex-col gap-5 md:gap-6 animate-in fade-in duration-500 w-full">
      <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" aria-hidden="true" />
      <input 
        type="search" 
        value={proveedorSearchTerm}
        onChange={(e) => setProveedorSearchTerm(e.target.value)}
        placeholder="Buscar marcas, equipamiento, software..." 
        className="bg-white border border-gray-100 rounded-full pl-11 pr-6 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] w-full shadow-sm placeholder:text-gray-400 transition-all" 
      />
    </div>

    <article 
      className="bg-[#1A3D3D] px-5 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[24px] text-left relative overflow-hidden group shadow-md flex flex-row items-center justify-between gap-3 md:gap-6 border border-white/5"
    >
      <div className="relative z-10 flex flex-col items-start gap-1">
        <h2 className="text-white font-['Montserrat'] font-black text-[13px] md:text-lg uppercase leading-none tracking-tight">
          ¿Querés sumar tu empresa?
        </h2>
        <p className="text-white/50 text-[10px] md:text-xs font-medium italic hidden sm:block mt-0.5">
          Destacá tu marca en nuestro ecosistema veterinario.
        </p>
      </div>
      <button 
        onClick={() => setView('publicitar')}
        className="bg-[#2D6A6A] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full text-[10px] font-bold uppercase tracking-widest relative z-10 shadow-lg hover:bg-[#3d8b8b] transition-all whitespace-nowrap"
      >
        <span className="md:hidden">Más info</span>
        <span className="hidden md:inline">Más información</span>
      </button>
    </article>

    {proveedoresMostrados.length > 0 ? (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-2">
          {proveedoresMostrados.map(proveedor => (
            <article 
              key={proveedor.id} 
              onClick={() => alert(`El perfil institucional de ${proveedor.marca} estará disponible en la próxima actualización.`)}
              className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative cursor-pointer"
            >
              {proveedor.isPremium && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-[#2D6A6A] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] flex items-center gap-1 shadow-md animate-pulse">
                    <Star className="w-3 h-3 fill-current" /> Destacado
                  </span>
                </div>
              )}

              <button 
                onClick={(e) => toggleFavorito(e, `prov-${proveedor.id}`)}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-20"
              >
                <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(`prov-${proveedor.id}`) ? 'fill-red-500 text-red-500' : 'text-[#666666] hover:text-red-500'}`} />
              </button>

              <div className="h-28 md:h-32 relative bg-gray-50 shrink-0">
                <img src={proveedor.imagenPortada} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={`Portada de ${proveedor.marca}`} />
                <div className="absolute -bottom-6 left-5 z-20">
                  <img 
                    src={proveedor.logoMarca} 
                    className="w-14 h-14 rounded-[20px] bg-white border-2 border-white shadow-md object-cover" 
                    alt={`Logo ${proveedor.marca}`} 
                  />
                </div>
              </div>

              <div className="pt-10 px-5 pb-5 flex flex-col flex-grow text-left">
                <h4 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px] mb-1 uppercase leading-tight line-clamp-1 group-hover:text-[#2D6A6A] transition-colors">
                  {proveedor.marca}
                </h4>
                
                <span className="text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] block mb-3 line-clamp-1">
                  {proveedor.categorias.join(' • ')}
                </span>
                
                <p className="text-[#333333] text-sm font-medium leading-relaxed line-clamp-2 flex-grow mb-4">
                  {proveedor.descripcionCorta}
                </p>
                
                <div className="flex items-center gap-3 text-[11px] text-[#666666] font-semibold mb-5 border-t border-gray-50 pt-4 mt-auto">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#4DB6AC] stroke-[2.5]" /> {proveedor.ubicacion.split(',')[0]}</span>
                </div>

                <button className="w-full py-3 rounded-xl bg-gray-50 text-[#1A3D3D] border border-gray-200 text-[11px] font-bold uppercase tracking-[0.2em] group-hover:bg-[#1A3D3D] group-hover:text-white group-hover:border-[#1A3D3D] transition-all flex items-center justify-center gap-2">
                  Ver Perfil
                </button>
              </div>
            </article>
          ))}
        </div>

        {proveedoresFiltrados.length > visibleProviders && (
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => setVisibleProviders(prev => prev + 6)}
              className="px-6 py-3 bg-white border border-gray-200 text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              Cargar más resultados <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </>
    ) : (
      <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center w-full mt-2">
        <Building className="w-10 h-10 text-gray-200 mb-4" />
        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-lg mb-2">Aún no hay búsquedas activas con estos filtros</h3>
        <p className="text-[#333333] text-[15px] font-medium leading-relaxed">¿Probamos modificando el rubro o el término de búsqueda?</p>
      </div>
    )}
  </div>
);

const renderPropuesta = () => (
    <article className="max-w-[1000px] mx-auto animate-in fade-in duration-700 relative font-['Inter']">
      
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
        <div id="dossier-pdf-export" style={{ backgroundColor: '#ffffff', padding: '0', width: '210mm' }}>
            <style>{`
              .pdf-page { width: 210mm; height: 296mm; overflow: hidden; page-break-after: always; background: white; padding: 20mm 20mm 15mm 20mm; position: relative; box-sizing: border-box; display: flex; flex-direction: column; }
              .pdf-page:last-child { page-break-after: auto; }
              .pdf-header { border-bottom: 2px solid #2D6A6A; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0; }
              .pdf-logo { font-family: 'Montserrat', sans-serif; font-size: 24pt; font-weight: 900; color: #1A3D3D; line-height: 1; }
              .pdf-logo span { color: #2D6A6A; }
              .pdf-doc-meta { text-align: right; font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
              .pdf-h1 { font-family: 'Montserrat', sans-serif; font-size: 26pt; color: #1A3D3D; margin-bottom: 8px; line-height: 1.2; letter-spacing: -0.5px; font-weight: 900; flex-shrink: 0; }
              .pdf-subtitle { font-size: 13pt; color: #2D6A6A; font-weight: 600; margin-bottom: 30px; font-family: 'Inter', sans-serif; flex-shrink: 0; }
              .pdf-h2 { font-family: 'Montserrat', sans-serif; font-size: 15pt; color: #2D6A6A; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-weight: 900; }
              .pdf-h3 { font-family: 'Montserrat', sans-serif; font-size: 12pt; color: #1A3D3D; margin-top: 15px; margin-bottom: 5px; font-weight: 700; }
              .pdf-p { font-family: 'Inter', sans-serif; font-size: 10pt; margin-bottom: 10px; text-align: left; color: #475569; line-height: 1.5; }
              .pdf-highlight { border-left: 3px solid #4DB6AC; padding-left: 15px; margin: 15px 0; }
              .pdf-highlight p { font-weight: 500; color: #1A3D3D; margin-bottom: 0; }
              .pdf-feature-list { display: flex; flex-direction: column; gap: 12px; margin-top: 15px; margin-bottom: 20px; }
              .pdf-community { display: flex; align-items: center; gap: 20px; margin: 20px 0 15px 0; }
              .pdf-percent { font-family: 'Montserrat', sans-serif; font-size: 38pt; font-weight: 900; color: #4DB6AC; line-height: 1; padding-right: 20px; border-right: 2px solid #e2e8f0; }
              .pdf-page-number { position: absolute; bottom: 10mm; right: 20mm; font-size: 8pt; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Inter', sans-serif; }
              .pdf-contact-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 25px; margin-bottom: 10px; flex-shrink: 0; }
              .pdf-legal-footer { margin-top: auto; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #94a3b8; line-height: 1.5; flex-shrink: 0; padding-bottom: 5mm; }
              .pdf-legal-footer strong { color: #64748b; font-weight: 700; }
              .pdf-email { font-size: 12pt; font-weight: 700; color: #2D6A6A; text-decoration: none; font-family: 'Inter', sans-serif; }
            `}</style>
            
            <div className="pdf-page">
                <div className="pdf-header">
                    <div className="pdf-logo">El Portal<span>.</span></div>
                    <div className="pdf-doc-meta">Documento Institucional<br/>Información para Instituciones y Docentes Veterinarios</div>
                </div>
                <h1 className="pdf-h1">Potenciamos el alcance<br/>de su propuesta académica.</h1>
                <p className="pdf-subtitle">Marco de colaboración institucional</p>
                
                <h2 className="pdf-h2">1. El contexto de la formación continua</h2>
                <p className="pdf-p">El desarrollo de un programa académico de excelencia en medicina veterinaria exige años de investigación, actualización constante y dedicación en la clínica diaria. Entendemos que, para los especialistas y las instituciones educativas, la difusión de este conocimiento hacia los colegas adecuados a menudo representa un desafío técnico y un esfuerzo económico adicional que desvía recursos de su labor principal: la enseñanza.</p>
                <div className="pdf-highlight"><p className="pdf-p" style={{fontWeight: 500, color: '#1A3D3D', marginBottom: 0}}>El propósito de El Portal es facilitar la conexión entre su rigor académico y los profesionales médicos que buscan especializarse de manera continua.</p></div>
                
                <h2 className="pdf-h2">2. Nuestro modelo de colaboración</h2>
                <p className="pdf-p">Proponemos un esquema de trabajo diseñado para acompañar a las instituciones educativas, basado en resultados concretos y exento de costos fijos que puedan comprometer su presupuesto:</p>
                <div className="pdf-feature-list">
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Difusión sin costo inicial</h3><p className="pdf-p">No existen cuotas mensuales, tarifas de alta ni costos de mantenimiento de cuenta. La postulación y exhibición de su oferta académica en nuestro repertorio es totalmente gratuita.</p></div>
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Honorarios por inscripción</h3><p className="pdf-p">Nuestra plataforma se financia exclusivamente a través de comisiones. Solo percibimos nuestros honorarios cuando la inscripción de un alumno se concreta de forma efectiva a través del portal.</p></div>
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Gestión integral de la promoción</h3><p className="pdf-p">Asumimos la inversión en campañas de difusión enfocadas en la comunidad veterinaria, así como los costos de las pasarelas de pago, permitiendo que su institución concentre sus recursos en la calidad educativa.</p></div>
                </div>
                <div className="pdf-page-number">Página 1 de 3</div>
            </div>

            <div className="pdf-page">
                <div className="pdf-header">
                    <div className="pdf-logo">El Portal<span>.</span></div>
                    <div className="pdf-doc-meta">Anexo Técnico<br/>Fomento y Condiciones Económicas</div>
                </div>

                <h2 className="pdf-h2" style={{marginTop: '10px'}}>3. Fomento de la especialización</h2>
                <p className="pdf-p">Con el objetivo de fortalecer la formación continua dentro de la comunidad veterinaria, solicitamos a las instituciones colaboradoras que establezcan un valor preferencial para los colegas que se inscriban mediante nuestra plataforma.</p>
                <div className="pdf-community">
                    <div className="pdf-percent">15%</div>
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Bonificación Académica</h3><p className="pdf-p" style={{marginBottom: 0}}>Sugerimos aplicar una bonificación del 15% sobre el valor de lista de sus capacitaciones. Esta acción fomenta un mayor índice de inscripciones al acercar su propuesta a una red de veterinarios activamente orientados hacia la alta complejidad.</p></div>
                </div>
                
                <h2 className="pdf-h2">4. Condiciones económicas y administrativas</h2>
                <h3 className="pdf-h3">Comisión del 15% sobre inscripciones</h3>
                <p className="pdf-p">El Portal retiene un 15% del valor abonado por el alumno inscrito a través de la plataforma. Este porcentaje es de carácter final y cubre integralmente los aranceles por transacciones bancarias, el mantenimiento de los servidores y las acciones de difusión.</p>
                <h3 className="pdf-h3">Rendiciones quincenales</h3>
                <p className="pdf-p">Efectuamos un proceso de rendición claro y estructurado cada 15 días. El monto neto de las inscripciones se transfiere directamente a la cuenta bancaria designada por el profesional o la institución académica.</p>
                <h3 className="pdf-h3">Manejo de la facturación</h3>
                <p className="pdf-p">La relación comercial y formativa con el alumno la mantiene enteramente su institución, siendo la responsable de emitirle la factura por el 100% del valor del curso. El Portal emitirá, a su vez, una factura a nombre de su institución exclusivamente por el monto correspondiente al servicio de intermediación.</p>
                
                <div className="pdf-page-number">Página 2 de 3</div>
            </div>

            <div className="pdf-page">
                <div className="pdf-header">
                    <div className="pdf-logo">El Portal<span>.</span></div>
                    <div className="pdf-doc-meta">Anexo Técnico<br/>Propiedad Intelectual y Operativa</div>
                </div>
                
                <h2 className="pdf-h2" style={{marginTop: '10px'}}>5. Propiedad intelectual y control académico</h2>
                <div className="pdf-feature-list">
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Derechos de autor</h3><p className="pdf-p">Todos los derechos, la propiedad intelectual y la autoría de los materiales y clases dictadas pertenecen de forma exclusiva y perpetua al docente o a la institución de origen.</p></div>
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Libertad de difusión</h3><p className="pdf-p">Este acuerdo no exige exclusividad en la oferta. Su institución mantiene total libertad para continuar promocionando sus capacitaciones a través de sus canales de comunicación habituales.</p></div>
                </div>
                <h3 className="pdf-h3">Traspaso de los datos del alumno</h3>
                <p className="pdf-p">Al confirmarse una inscripción en la plataforma, la institución recibe de forma automática todos los datos de contacto y el perfil profesional del matriculado, permitiéndole integrarlo a su plataforma educativa, sumar al alumno a su base de datos propia y realizar el seguimiento académico pertinente.</p>

                <h2 className="pdf-h2">6. Aspectos operativos</h2>
                <h3 className="pdf-h3">Lugar de dictado y metodologías</h3>
                <p className="pdf-p">La metodología de enseñanza y el entorno virtual quedan a total criterio de su institución. El alumno abona su vacante a través de El Portal, pero asiste a las clases directamente en la plataforma que ustedes designen (Moodle, Zoom, Web propia o en su defecto, formato presencial), preservando íntegramente la experiencia y el prestigio de su institución.</p>
                <h3 className="pdf-h3">Criterios de calidad y política de reembolsos</h3>
                <p className="pdf-p">Para resguardar el estándar científico de la plataforma, toda propuesta formativa atraviesa un breve proceso de revisión por parte de nuestro comité previo a su publicación en el repertorio. Asimismo, para brindar seguridad a los colegas, rige una política de garantía de 7 días: en caso de que un alumno presente una baja justificada dentro de este plazo, El Portal gestionará el reembolso directamente, sin generar gastos administrativos ni compromisos económicos para su institución.</p>

                <div className="pdf-contact-box">
                    <h3 className="pdf-h3" style={{textAlign: 'center', color: '#1A3D3D', marginTop: 0}}>¿Tienen alguna consulta adicional sobre este documento?</h3>
                    <p className="pdf-p" style={{textAlign: 'center', marginBottom: '8px'}}>Nuestro equipo comercial e institucional está a su entera disposición.</p>
                    <p style={{textAlign: 'center', margin: 0}}><a href="mailto:elportalveterinario.arg@gmail.com" className="pdf-email">elportalveterinario.arg@gmail.com</a></p>
                </div>

                <div className="pdf-legal-footer">
                    <p style={{margin: '0 0 3px 0'}}><strong>El Portal - Red Exclusiva para Veterinarios</strong></p>
                    <p style={{margin: '0 0 3px 0'}}>Plataforma tecnológica de conexión académica y desarrollo profesional.</p>
                    <p style={{margin: '0 0 8px 0'}}>Buenos Aires, Argentina | www.elportal.vet</p>
                    <p style={{margin: 0}}>© {new Date().getFullYear()} El Portal. Todos los derechos reservados. Documento confidencial de uso institucional.</p>
                </div>

                <div className="pdf-page-number">Página 3 de 3</div>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center py-4 border-b border-gray-200 mb-6 px-4 md:px-0 relative z-20">
        <button 
          onClick={() => { setView('publicitar'); setOpenFaq(null); window.scrollTo(0,0); }} 
          className="flex items-center gap-2 text-gray-500 hover:text-[#1A3D3D] font-bold text-xs md:text-[11px] uppercase tracking-[0.2em] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 bg-[#2D6A6A] text-white px-5 py-2.5 font-bold text-[11px] md:text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-wait"
        >
          {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isGeneratingPDF ? 'Generando...' : 'Guardar como PDF'}
        </button>
      </div>

      <div className="px-4 md:px-0 relative z-10">
        
        <section className="text-center pb-12 md:pb-16 relative">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#4DB6AC] rounded-full blur-[100px] opacity-30 pointer-events-none z-0"></div>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-[#2D6A6A] rounded-full blur-[120px] opacity-20 pointer-events-none z-0"></div>

          <div className="relative z-10">
            <span className="text-[#2D6A6A] font-bold text-[10px] uppercase tracking-[0.3em] mb-6 block">
              Alianzas Estratégicas - El Portal
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-['Montserrat'] leading-[1.05] tracking-tighter text-[#1A3D3D]">
              Multiplicá el impacto<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">de tu oferta académica.</span>
            </h1>
          </div>
        </section>

        <section className="mt-8 relative z-10">
          <div className="bg-white rounded-[32px] md:rounded-[48px] p-8 md:p-12 lg:p-16 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
            <div className="w-full md:w-1/2">
              <div className="aspect-[4/3] w-full rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm">
                <img src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80" alt="Veterinario" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="w-full md:w-1/2 text-left">
              <span className="text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">
                El Desafío
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] mb-6 tracking-tight leading-[1.1]">
                Rompiendo el ruido digital
              </h2>
              <div className="space-y-5 text-[#666666] font-medium text-[15px] md:text-[16px] leading-relaxed">
                <p>Crear un programa de excelencia en medicina veterinaria requiere años de investigación y dedicación en la clínica diaria.</p>
                <p>Sin embargo, lograr que ese conocimiento llegue a los colegas correctos no debería representar un gasto incalculable en publicidad ni un esfuerzo técnico desgastante.</p>
                <p className="text-[#1A3D3D] font-bold">En El Portal, conectamos tu rigor académico directamente con la demanda insatisfecha del sector.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 md:mt-24 relative z-10">
          <div className="text-left md:text-center mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] tracking-tight">
              Sinergia a resultados
            </h2>
          </div>
          
          <div className="rounded-[32px] md:rounded-[48px] overflow-hidden shadow-xl border border-gray-200 flex flex-col bg-white">
            
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-left">
                <div className="p-8 md:p-10 lg:p-12">
                  <Award className="w-8 h-8 text-[#2D6A6A] mb-5 stroke-[1.5]" aria-hidden="true" />
                  <h3 className="text-xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3 tracking-tight">Visibilidad sin costo</h3>
                  <p className="text-[15px] text-gray-500 font-medium leading-relaxed">No existen honorarios mensuales ni costos de mantenimiento. Postular y exhibir tu temario es 100% gratuito.</p>
                </div>
                <div className="p-8 md:p-10 lg:p-12">
                  <ShieldCheck className="w-8 h-8 text-[#2D6A6A] mb-5 stroke-[1.5]" aria-hidden="true" />
                  <h3 className="text-xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3 tracking-tight">Comisión por éxito</h3>
                  <p className="text-[15px] text-gray-500 font-medium leading-relaxed">Nuestro modelo es win-win. Retenemos comisión únicamente cuando la inscripción se concreta con éxito.</p>
                </div>
                <div className="p-8 md:p-10 lg:p-12">
                  <Activity className="w-8 h-8 text-[#2D6A6A] mb-5 stroke-[1.5]" aria-hidden="true" />
                  <h3 className="text-xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3 tracking-tight">CAC Cero</h3>
                  <p className="text-[15px] text-gray-500 font-medium leading-relaxed">Absorbemos el trabajo de marketing, dejás de arriesgar presupuesto y tiempo en anuncios.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1A3D3D] p-10 md:p-16 flex flex-col md:flex-row items-center gap-10 lg:gap-16 relative">
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#2D6A6A]/40 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 relative z-10">
                <span className="text-7xl md:text-8xl font-black text-[#4DB6AC] font-['Montserrat'] tracking-tighter leading-none">15%</span>
                <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Descuento Exclusivo</p>
              </div>
              
              <div className="w-full md:w-2/3 text-left relative z-10">
                <h2 className="text-3xl md:text-4xl font-black font-['Montserrat'] mb-5 tracking-tight text-white">El "Beneficio Comunidad"</h2>
                <div className="space-y-5 text-white/70 font-medium text-[15px] md:text-[16px] leading-relaxed">
                  <p>Para maximizar la conversión, te proponemos ofrecer un valor preferencial exclusivo para los usuarios que adquieren tu curso desde El Portal.</p>
                  <p>Al generar este incentivo, cambiás un pequeño margen individual por un <strong className="text-white">volumen de ventas mayor</strong>, aprovechando una audiencia cautiva por la que no tuviste que pagar un solo anuncio.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="mt-16 md:mt-24 bg-white rounded-[32px] md:rounded-[48px] p-8 md:p-12 lg:p-16 border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-12 lg:gap-20 items-start relative z-10">
          <div className="lg:w-1/3 shrink-0 lg:sticky lg:top-28 text-left w-full">
            <h3 className="text-3xl md:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase mb-4 leading-none">
              Consultas<br className="hidden lg:block"/> Frecuentes
            </h3>
            <p className="text-gray-500 font-medium text-[15px]">Transparencia total sobre nuestro modelo de trabajo y alcance.</p>
          </div>
          
          <div className="lg:w-2/3 w-full text-left">
            {FAQ_CATEGORIES.map((category, catIdx) => (
              <div key={catIdx} className="mb-12 last:mb-0">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2D6A6A] mb-4 border-b border-gray-200 pb-3">
                  {category.title}
                </h4>
                <div className="space-y-0">
                  {category.items.map((faq, itemIdx) => {
                    const faqId = `${catIdx}-${itemIdx}`;
                    return (
                      <div key={faqId} className="border-b border-gray-100 last:border-0">
                        <button
                          onClick={() => setOpenFaq(openFaq === faqId ? null : faqId)}
                          className="w-full flex justify-between items-center py-6 text-left transition-colors hover:bg-gray-50/50"
                        >
                          <span className={`font-bold text-[15px] md:text-[16px] pr-8 transition-colors ${openFaq === faqId ? 'text-[#2D6A6A]' : 'text-[#1A3D3D]'}`}>
                            {faq.q}
                          </span>
                          <div className={`shrink-0 transition-transform duration-300 ${openFaq === faqId ? 'rotate-45 text-[#2D6A6A]' : 'text-gray-300'}`}>
                            <Plus className="w-5 h-5" />
                          </div>
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${openFaq === faqId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <p className="pb-8 pt-2 text-gray-500 text-[15px] font-medium leading-relaxed pr-8">
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-12 bg-[#F4F7F7] rounded-[24px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-200">
              <div className="flex items-center gap-5">
                  <MessageCircle className="w-8 h-8 text-[#2D6A6A] shrink-0" />
                  <div className="text-left">
                    <p className="text-[16px] font-black text-[#1A3D3D]">¿Tenés alguna otra duda?</p>
                    <p className="text-[14px] text-gray-500 font-medium">Nuestro equipo está listo para ayudarte.</p>
                  </div>
              </div>
              <a href="mailto:elportalveterinario.arg@gmail.com?subject=Consulta institucional sobre publicaciones" className="w-full sm:w-auto bg-white px-6 py-3.5 rounded-xl text-[11px] font-bold text-[#1A3D3D] hover:bg-[#1A3D3D] hover:text-white border border-gray-200 transition-colors uppercase tracking-[0.2em] text-center shadow-sm whitespace-nowrap">
                  Contactar Soporte
              </a>
            </div>
          </div>
        </section>

        <section className="text-center pt-24 relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 w-[800px] h-[800px] bg-[#2D6A6A] rounded-full blur-[120px] opacity-25 pointer-events-none z-0"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-['Montserrat'] text-[#1A3D3D] mb-6 tracking-tight leading-[1.1]">
              ¿Comenzamos?
            </h2>
            <p className="text-gray-500 font-medium text-[16px] md:text-[18px] mb-12 max-w-2xl mx-auto leading-relaxed">
              Postulá tu programa académico hoy y expandí el alcance de tu conocimiento sin riesgos operativos.
            </p>
            <button 
              onClick={() => { setView('wizard'); window.scrollTo(0,0); }}
              className="bg-[#2D6A6A] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#1A3D3D] transition-colors shadow-lg active:scale-95"
            >
              Publicar mi curso ahora
            </button>
            <p className="mt-8 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2D6A6A]" /> Postular tu temario es 100% gratis
            </p>
          </div>
        </section>

      </div>
    </article>
);

  const renderInsumoForm = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => { setView('publicitar'); setInsumoWizardStep(1); setInsumoErrors({}); window.scrollTo(0,0); }} 
          className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" /> Cancelar
        </button>
        <div className="flex items-center gap-2 text-[#2D6A6A] bg-[#2D6A6A]/10 px-3 py-1.5 rounded-full self-start md:self-auto">
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest">Borrador guardado localmente</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 p-6 md:p-8" aria-label={`Paso ${insumoWizardStep} de 4`}>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute top-[22px] md:top-[22px] left-[10%] right-[10%] h-1 bg-gray-200 z-0 hidden md:block">
              <div className="h-full bg-[#2D6A6A] transition-all duration-500 ease-in-out" style={{ width: `${((insumoWizardStep - 1) / 3) * 100}%` }}></div>
            </div>

            <div className="flex justify-between items-start relative z-10">
              {[1, 2, 3, 4].map((step) => {
                const isActive = insumoWizardStep === step;
                const isCompleted = insumoWizardStep > step;
                
                return (
                  <div key={step} className="flex flex-col items-center w-24">
                    <div className="h-[48px] flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ease-in-out box-content ${
                        isActive 
                          ? 'bg-[#1A3D3D] text-white shadow-[0_4px_12px_rgba(26,61,61,0.3)] scale-110 border-[4px] border-gray-50' 
                          : isCompleted 
                            ? 'bg-[#2D6A6A] text-white border-[4px] border-gray-50' 
                            : 'bg-white border-[2px] border-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : step}
                      </div>
                    </div>
                    <span className={`text-[9px] md:text-[11px] uppercase font-black tracking-[0.2em] mt-2 hidden md:block text-center ${
                      isActive || isCompleted ? 'text-[#1A3D3D]' : 'text-gray-400'
                    }`}>
                      {['Empresa', 'Producto', 'Ficha', 'Fotos'][step - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          
          {insumoWizardStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Datos de la Empresa</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Información comercial y de contacto para los profesionales.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="empresa">Nombre de la Empresa *</label>
                  <input id="empresa" type="text" value={insumoFormState.empresa} onChange={(e) => handleInsumoFormChange('empresa', e.target.value)} placeholder="Ej: MedVet Insumos" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.empresa ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {insumoErrors.empresa && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.empresa}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="contacto">Persona de Contacto *</label>
                  <input id="contacto" type="text" value={insumoFormState.contacto} onChange={(e) => handleInsumoFormChange('contacto', e.target.value)} placeholder="Ej: Lic. Martín Perez" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.contacto ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {insumoErrors.contacto && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.contacto}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="emailContacto">Email Corporativo *</label>
                  <input id="emailContacto" type="email" value={insumoFormState.email} onChange={(e) => handleInsumoFormChange('email', e.target.value)} placeholder="ventas@tuempresa.com" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {insumoErrors.email && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="telefono">Teléfono / WhatsApp *</label>
                  <input id="telefono" type="tel" value={insumoFormState.telefono} onChange={(e) => handleInsumoFormChange('telefono', e.target.value)} placeholder="+54 9 11 1234 5678" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.telefono ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {insumoErrors.telefono && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.telefono}</p>}
                </div>
              </div>
            </div>
          )}

          {insumoWizardStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Detalles del Producto</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Información principal del equipo o insumo que vas a publicar.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="tituloProducto">Nombre del Equipo / Insumo *</label>
                  <input id="tituloProducto" type="text" value={insumoFormState.tituloProducto} onChange={(e) => handleInsumoFormChange('tituloProducto', e.target.value)} placeholder="Ej: Ecógrafo Portátil Mindray V1" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.tituloProducto ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {insumoErrors.tituloProducto && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.tituloProducto}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="precioInsumo">Precio (ARS) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input id="precioInsumo" type="number" value={insumoFormState.precio} onChange={(e) => handleInsumoFormChange('precio', e.target.value)} placeholder="2500000" className={`w-full bg-gray-50 border rounded-xl pl-8 pr-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.precio ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  </div>
                  {insumoErrors.precio && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.precio}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="categoriaInsumo">Categoría *</label>
                  <select id="categoriaInsumo" value={insumoFormState.categoria} onChange={(e) => handleInsumoFormChange('categoria', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]">
                    <option value="Ecografía y Diagnóstico">Ecografía y Diagnóstico por Imágenes</option>
                    <option value="Equipamiento Quirófano">Equipamiento Quirófano (Anestesia, Monitores)</option>
                    <option value="Laboratorio">Analizadores de Laboratorio</option>
                    <option value="Instrumental y Descartables">Instrumental y Descartables</option>
                    <option value="Software y Gestión">Software y Gestión Veterinaria</option>
                    <option value="Otro">Otro / Varios</option>
                  </select>
                </div>
              </div>

              {insumoFormState.categoria === 'Otro' && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs md:text-[11px] font-bold text-[#2D6A6A] uppercase tracking-widest mb-2" htmlFor="categoriaOtra">Especificar Categoría *</label>
                  <input id="categoriaOtra" type="text" value={insumoFormState.categoriaOtra} onChange={(e) => handleInsumoFormChange('categoriaOtra', e.target.value)} placeholder="Ej: Mobiliario Clínico" className="w-full bg-[#2D6A6A]/5 border border-[#2D6A6A]/30 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="website">Sitio Web / Catálogo / PDF</label>
                <input id="website" type="url" value={insumoFormState.website} onChange={(e) => handleInsumoFormChange('website', e.target.value)} placeholder="https://www.tuempresa.com/producto" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
              </div>

              <div>
                <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="mensaje">Descripción General del Equipo</label>
                <textarea id="mensaje" rows="4" value={insumoFormState.mensaje} onChange={(e) => handleInsumoFormChange('mensaje', e.target.value)} placeholder="Describí las funciones principales y ventajas competitivas del equipo..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D] resize-none" ></textarea>
              </div>
            </div>
          )}

          {insumoWizardStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Ficha Técnica</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Destacá las ventajas técnicas y especificaciones exactas.</p>
              </div>
              
              <div className="mb-8">
                <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Puntos Destacados / Características *</label>
                <div className="space-y-3">
                  {insumoFormState.caracteristicas.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D6A6A]" aria-hidden="true" />
                        <input type="text" value={item} onChange={(e) => updateCaracteristica(index, e.target.value)} placeholder="Ej: Pantalla táctil de 15 pulgadas anti-reflejo..." className={`w-full bg-gray-50 border rounded-xl pl-10 pr-4 py-3 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${insumoErrors.caracteristicas ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                      </div>
                      {insumoFormState.caracteristicas.length > 1 && (
                        <button type="button" onClick={() => removeCaracteristica(index)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {insumoErrors.caracteristicas && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{insumoErrors.caracteristicas}</p>}
                  <button type="button" onClick={addCaracteristica} className="flex items-center gap-2 text-[#2D6A6A] font-bold text-xs md:text-xs uppercase tracking-widest mt-2 hover:bg-[#2D6A6A]/10 px-4 py-2 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> Agregar característica
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Especificaciones Técnicas (Ej: Peso, Dimensiones)</label>
                <div className="space-y-3">
                  {insumoFormState.especificaciones.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <input type="text" value={spec.label} onChange={(e) => updateEspecificacion(index, 'label', e.target.value)} placeholder="Ej: Peso" className="col-span-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm font-bold focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                        <input type="text" value={spec.value} onChange={(e) => updateEspecificacion(index, 'value', e.target.value)} placeholder="Ej: 2.5 kg (con batería)" className="col-span-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                      </div>
                      {insumoFormState.especificaciones.length > 1 && (
                        <button type="button" onClick={() => removeEspecificacion(index)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addEspecificacion} className="flex items-center gap-2 text-[#2D6A6A] font-bold text-xs md:text-xs uppercase tracking-widest mt-2 hover:bg-[#2D6A6A]/10 px-4 py-2 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> Agregar especificación
                  </button>
                </div>
              </div>
            </div>
          )}

          {insumoWizardStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-8 h-8 text-[#2D6A6A]" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-2">Fotos y Publicación</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium max-w-sm mx-auto">
                  Agregá imágenes de alta calidad para que los profesionales aprecien el producto.
                </p>
              </div>

              <div>
                <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fotos del Producto</label>
                
                {insumoFormState.fotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {insumoFormState.fotos.map((foto, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group bg-white">
                        <img src={foto.preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#1A3D3D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button type="button" onClick={() => removeInsumoFoto(index)} className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {insumoFormState.fotos.length < 4 && (
                  <label className="w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-white hover:border-[#2D6A6A] transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
                    <input type="file" accept="image/png, image/jpeg" multiple className="hidden" onChange={handleInsumoFileUpload} />
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-[#2D6A6A]" />
                    </div>
                    <p className="text-sm font-bold text-[#1A3D3D]">Hacé clic para subir imágenes</p>
                    <p className="text-xs text-gray-400 mt-1">Podés subir hasta {4 - insumoFormState.fotos.length} fotos más (PNG o JPG, máx. 5MB c/u)</p>
                  </label>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-6 md:px-10 md:py-8 flex items-center justify-between">
          {insumoWizardStep > 1 ? (
            <button onClick={() => { setInsumoWizardStep(prev => prev - 1); setInsumoErrors({}); window.scrollTo(0,0); }} className="px-6 py-3.5 text-[#1A3D3D] font-bold text-xs md:text-[11px] uppercase tracking-widest hover:bg-gray-200 rounded-xl transition-all">
              Anterior
            </button>
          ) : <div></div>}

          {insumoWizardStep < 4 ? (
            <button onClick={handleNextInsumoStep} className="px-8 py-3.5 bg-[#1A3D3D] text-white font-black text-xs md:text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] rounded-xl transition-all shadow-lg flex items-center gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleInsumoWizardSubmit} disabled={isInsumoSubmitting} className="px-8 py-3.5 bg-[#2D6A6A] text-white font-black text-xs md:text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isInsumoSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>) : (<><ShieldCheck className="w-4 h-4" /> Proceder al Pago</>)}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  const renderCourseWizard = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button onClick={() => { setView('publicitar'); setWizardStep(1); setErrors({}); }} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" /> Cancelar
        </button>
        <div className="flex items-center gap-2 text-[#2D6A6A] bg-[#2D6A6A]/10 px-3 py-1.5 rounded-full self-start md:self-auto">
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest">Borrador guardado localmente</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 p-6 md:p-8" aria-label={`Paso ${wizardStep} de 4`}>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute top-[22px] md:top-[22px] left-[10%] right-[10%] h-1 bg-gray-200 z-0 hidden md:block">
              <div className="h-full bg-[#2D6A6A] transition-all duration-500 ease-in-out" style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}></div>
            </div>

            <div className="flex justify-between items-start relative z-10">
              {[1, 2, 3, 4].map((step) => {
                const isActive = wizardStep === step;
                const isCompleted = wizardStep > step;
                
                return (
                  <div key={step} className="flex flex-col items-center w-24">
                    <div className="h-[48px] flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ease-in-out box-content ${
                        isActive 
                          ? 'bg-[#1A3D3D] text-white shadow-[0_4px_12px_rgba(26,61,61,0.3)] scale-110 border-[4px] border-gray-50' 
                          : isCompleted 
                            ? 'bg-[#2D6A6A] text-white border-[4px] border-gray-50' 
                            : 'bg-white border-[2px] border-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : step}
                      </div>
                    </div>
                    <span className={`text-[9px] md:text-[11px] uppercase font-black tracking-[0.2em] mt-2 hidden md:block text-center ${
                      isActive || isCompleted ? 'text-[#1A3D3D]' : 'text-gray-400'
                    }`}>
                      {['Básicos', 'Temario', 'Docente', 'Publicar'][step - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {wizardStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Información Básica</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Atraé a tus colegas con un título claro y conciso.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="titulo">Título del Curso *</label>
                  <input id="titulo" type="text" value={courseForm.titulo} onChange={(e) => handleWizardChange('titulo', e.target.value)} placeholder="Ej: Cirugía de Tejidos Blandos: Procedimientos Avanzados" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${errors.titulo ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.titulo && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.titulo}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="modalidad">Modalidad</label>
                    <select id="modalidad" value={courseForm.modalidad} onChange={(e) => handleWizardChange('modalidad', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]">
                      {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="precio">Precio de lista (ARS) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input id="precio" type="number" value={courseForm.precio} onChange={(e) => handleWizardChange('precio', e.target.value)} placeholder="45000" className={`w-full bg-gray-50 border rounded-xl pl-8 pr-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${errors.precio ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                    </div>
                    {errors.precio && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.precio}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="nivel">Nivel</label>
                    <select id="nivel" value={courseForm.nivel} onChange={(e) => handleWizardChange('nivel', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]">
                      <option value="Principiante">Principiante (Estudiantes/Recibidos)</option>
                      <option value="Intermedio">Intermedio (Clínica General)</option>
                      <option value="Avanzado">Avanzado (Especialistas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="duracion">Duración aprox.</label>
                    <input id="duracion" type="text" value={courseForm.duracion} onChange={(e) => handleWizardChange('duracion', e.target.value)} placeholder="Ej: 12h 30m / 4 Semanas" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Detalles y Temario</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Contale a los colegas por qué este curso es imperdible.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="descripcion">Descripción general *</label>
                  <textarea id="descripcion" value={courseForm.descripcion} onChange={(e) => handleWizardChange('descripcion', e.target.value)} placeholder="Escribí un resumen atrapante sobre los objetivos principales del curso..." rows="4" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] resize-none ${errors.descripcion ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} ></textarea>
                  {errors.descripcion && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.descripcion}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">¿Qué van a aprender? (Puntos clave) *</label>
                  <div className="space-y-3">
                    {courseForm.incluye.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D6A6A]" aria-hidden="true" />
                          <input type="text" value={item} aria-label={`Punto de aprendizaje ${index + 1}`} onChange={(e) => updateIncluyeItem(index, e.target.value)} placeholder="Ej: Análisis de casos clínicos reales..." className={`w-full bg-gray-50 border rounded-xl pl-10 pr-4 py-3 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${errors.incluye ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                        </div>
                        {courseForm.incluye.length > 1 && (
                          <button onClick={() => removeIncluyeItem(index)} aria-label="Eliminar punto" className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {errors.incluye && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.incluye}</p>}
                    <button onClick={addIncluyeItem} className="flex items-center gap-2 text-[#2D6A6A] font-bold text-xs md:text-xs uppercase tracking-widest mt-2 hover:bg-[#2D6A6A]/10 px-4 py-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" /> Agregar otro punto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Docente / Instructorx</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Humanizá tu curso presentando al especialista a cargo.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="instructorNombre">Nombre completo con título *</label>
                  <input id="instructorNombre" type="text" value={courseForm.instructorNombre} onChange={(e) => handleWizardChange('instructorNombre', e.target.value)} placeholder="Ej: Dr. Julián Martínez" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${errors.instructorNombre ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.instructorNombre && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.instructorNombre}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="instructorBio">Mini Bio del Docente *</label>
                  <textarea id="instructorBio" value={courseForm.instructorBio} onChange={(e) => handleWizardChange('instructorBio', e.target.value)} placeholder="Resumí su experiencia, especialidades y reconocimientos (máx. 300 caracteres)..." rows="3" className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] resize-none ${errors.instructorBio ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} ></textarea>
                  {errors.instructorBio && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.instructorBio}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Foto de perfil del docente</label>
                  
                  {courseForm.fotoDocente ? (
                    <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-2xl bg-gray-50">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                        <img src={courseForm.fotoDocente.preview} alt="Preview Docente" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1A3D3D] line-clamp-1">{courseForm.fotoDocente.file.name}</p>
                        <p className="text-xs text-gray-400">{(courseForm.fotoDocente.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={removeDocenteFoto} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-white hover:border-[#2D6A6A] transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
                      <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleDocenteFileUpload} />
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6 text-[#2D6A6A]" />
                      </div>
                      <p className="text-sm font-bold text-[#1A3D3D]">Hacé clic para subir una imagen</p>
                      <p className="text-xs text-gray-400 mt-1">o arrastrala y soltala acá (PNG, JPG hasta 5MB)</p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-[#2D6A6A]" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-2">¡Tu curso está casi listo!</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium max-w-sm mx-auto">
                  Creá tu cuenta institucional para gestionar las ventas y proceder al pago de la publicación.
                </p>
              </div>
              <div className="bg-gray-50 p-6 md:p-8 rounded-[24px] border border-gray-100 space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="email">Email Institucional *</label>
                  <input id="email" type="email" value={courseForm.email} onChange={(e) => handleWizardChange('email', e.target.value)} placeholder="contacto@tuinstitucion.com" className={`w-full bg-white border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none transition-all text-[#1A3D3D] ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.email && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="password">Contraseña *</label>
                  <input id="password" type="password" value={courseForm.password} onChange={(e) => handleWizardChange('password', e.target.value)} placeholder="••••••••" className={`w-full bg-white border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none transition-all text-[#1A3D3D] ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.password && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-6 md:px-10 md:py-8 flex items-center justify-between">
          {wizardStep > 1 ? (
            <button onClick={() => { setWizardStep(prev => prev - 1); setErrors({}); window.scrollTo(0,0); }} className="px-6 py-3.5 text-[#1A3D3D] font-bold text-xs md:text-[11px] uppercase tracking-widest hover:bg-gray-200 rounded-xl transition-all">
              Anterior
            </button>
          ) : <div></div>}

          {wizardStep < 4 ? (
            <button onClick={handleNextStep} className="px-8 py-3.5 bg-[#1A3D3D] text-white font-black text-xs md:text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] rounded-xl transition-all shadow-lg flex items-center gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submitWizard} disabled={isSubmitting} className="px-8 py-3.5 bg-[#2D6A6A] text-white font-black text-xs md:text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>) : (<><ShieldCheck className="w-4 h-4" /> Crear cuenta y Pagar</>)}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  const renderAdvertise = () => (
    <section className="max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Repertorio
      </button>

     <div className="bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A] rounded-[32px] pt-12 pb-28 md:pt-16 md:pb-32 px-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-black font-['Montserrat'] leading-[1.1] uppercase tracking-tighter mb-6 text-white flex items-center justify-center flex-wrap">
            <span>Conectá tu marca con la élite veterinaria</span>
            <span className="inline-block w-[4px] md:w-[6px] h-[0.9em] bg-[#4DB6AC] animate-pulse ml-2 align-baseline -mb-1 shadow-[0_0_10px_rgba(77,182,172,0.5)]"></span>
          </h1>
          <p className="text-white/80 text-base md:text-base font-medium leading-relaxed max-w-xl mx-auto">
            El Portal es la red exclusiva para profesionales de alta complejidad. Posicioná tus cursos, seminarios o equipamiento médico frente a una audiencia altamente segmentada y calificada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-8 relative z-20 -mt-20 mb-8">
        <article className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <BookOpen className="w-8 h-8 text-[#2D6A6A]" />
          </div>
          <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4">Instituciones Educativas</h3>
          <p className="text-gray-500 text-[15px] md:text-sm leading-relaxed mb-8 flex-grow">
            Publicá tus cursos y seminarios usando nuestra plantilla optimizada. Mostrá el temario, instructorxs y recibí inscripciones directas de colegas buscando especializarse.
          </p>
          <div className="w-full flex flex-col gap-3 mt-auto">
            <button onClick={() => { setView('wizard'); window.scrollTo(0,0); }} className="w-full py-4 bg-[#1A3D3D] text-white rounded-[20px] font-black text-xs md:text-[10px] uppercase tracking-[0.2em] hover:bg-[#2D6A6A] transition-all shadow-md active:scale-95">
              Publicar mi curso
            </button>
            <button onClick={() => { setView('propuesta'); window.scrollTo(0,0); }} className="w-full py-4 bg-white text-[#2D6A6A] border border-[#2D6A6A]/30 rounded-[20px] font-bold text-xs md:text-[10px] uppercase tracking-[0.2em] hover:bg-[#2D6A6A]/5 transition-all flex items-center justify-center gap-2">
              ¿Por qué publicar acá? <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </article>
        
        <article className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Tag className="w-8 h-8 text-[#2D6A6A]" />
          </div>
          <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4">Empresas de Insumos</h3>
          <p className="text-gray-500 text-[15px] md:text-sm leading-relaxed mb-8 flex-grow">
            Destacá tu equipamiento (ecógrafos, instrumental quirúrgico, anestesia) en un entorno donde los profesionales entran específicamente a buscar mejorar su clínica diaria.
          </p>
          <div className="w-full flex flex-col gap-3 mt-auto">
            <button onClick={() => { setView('insumoForm'); window.scrollTo(0,0); }} className="w-full py-4 bg-gray-50 text-[#1A3D3D] border border-gray-200 rounded-[20px] font-black text-xs md:text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-sm active:scale-95">
              Publicar mi equipamiento
            </button>
          </div>
        </article>
      </div>
    </section>
  );

  const renderDetail = () => {
    if (!selectedCourse) return null; 
    return (
    <article className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Repertorio
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-8">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-black font-['Montserrat'] text-[#1A3D3D] leading-[1.1] uppercase tracking-tighter">
              {selectedCourse.titulo}
            </h1>
          </header>

          <div className="w-full md:w-[95%] aspect-video md:max-h-[360px] rounded-[32px] overflow-hidden bg-black shadow-lg relative group cursor-pointer mb-10 border border-gray-100">
            <img src={selectedCourse.imagen} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s]" alt="Portada del curso" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-all shadow-xl">
                <PlayCircle className="w-8 h-8 md:w-10 md:h-10 text-white fill-white/80" />
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3 md:gap-12 border-b border-gray-200 mb-8" aria-label="Pestañas del curso">
            <button onClick={() => setActiveTab('about')} aria-current={activeTab === 'about' ? 'page' : undefined} className={`pb-3 md:pb-4 text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'about' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
              Acerca del curso
            </button>
            <button onClick={() => setActiveTab('speaker')} aria-current={activeTab === 'speaker' ? 'page' : undefined} className={`pb-3 md:pb-4 text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'speaker' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
              Instructorxs
            </button>
            <button onClick={() => setActiveTab('reviews')} aria-current={activeTab === 'reviews' ? 'page' : undefined} className={`pb-3 md:pb-4 text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
              Reseñas (4.9)
            </button>
          </nav>

          {activeTab === 'about' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4">Descripción del programa</h3>
                <p className="text-gray-600 text-[15px] md:text-base leading-relaxed font-medium">
                  {selectedCourse.descripcion}
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-6">¿Qué vas a aprender?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCourse.incluye.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white px-5 py-4 rounded-[16px] border border-gray-100 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#2D6A6A]/10 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#2D6A6A] stroke-[3]" />
                      </div>
                      <span className="text-[13px] font-bold text-[#1A3D3D] leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speaker' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm flex flex-row gap-4 md:gap-6 items-start">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] font-black text-2xl border border-gray-100 shrink-0">
                    {selectedCourse.instructor.charAt(0)}
                </div>
                <div className="text-left flex-1 mt-1 md:mt-2">
                  <h3 className="text-lg md:text-2xl font-black font-['Montserrat'] text-[#1A3D3D] leading-tight">{selectedCourse.instructor}</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-[#2D6A6A] uppercase tracking-widest mb-3 md:mb-4 mt-1">Especialista Referente</p>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed font-medium">
                    Profesional con más de 15 años de experiencia clínica especializada. Disertante internacional y autor de múltiples publicaciones científicas en la materia. Reconocido por su enfoque práctico y resolución de casos complejos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 bg-white p-8 rounded-[32px] border border-gray-100 text-center">
               <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mx-auto mb-4 opacity-50" />
               <p className="text-[#1A3D3D] font-bold text-lg mb-2">Reseñas Excelentes</p>
               <p className="text-gray-500 font-medium text-sm">Este curso mantiene un promedio de 4.9 estrellas en evaluaciones de profesionales.</p>
            </div>
          )}

        </section>

        <aside className="lg:col-span-4">
          <div className="sticky top-28 bg-white p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 space-y-8">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <h4 className="text-4xl md:text-5xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter">
                  ${selectedCourse.precio.toLocaleString('es-AR')}
                </h4>
                <span className="text-gray-400 line-through text-lg font-bold">${selectedCourse.precioOriginal.toLocaleString('es-AR')}</span>
              </div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Oferta por tiempo limitado
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => alert(`Redirigiendo a la pasarela de pagos segura para adquirir el curso: ${selectedCourse.titulo}...`)} 
                className="w-full py-5 bg-[#2D6A6A] text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#1A3D3D] transition-all shadow-lg shadow-[#2D6A6A]/20 flex items-center justify-center gap-2 active:scale-95"
              >
                Inscribirme Ahora
              </button>
              <button 
                onClick={() => alert(`Iniciando descarga del programa académico en PDF de: ${selectedCourse.titulo}...`)}
                className="w-full py-4 bg-gray-50 text-[#1A3D3D] border border-gray-200 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Descargar Programa <FileText className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Duración</p><p className="text-sm font-black text-[#1A3D3D]">{selectedCourse.duracion}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <Award className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nivel</p><p className="text-sm font-black text-[#1A3D3D]">{selectedCourse.nivel}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <Monitor className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Modalidad</p><p className="text-sm font-black text-[#1A3D3D]">{selectedCourse.modalidad}</p></div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Certificación avalada por</p>
              <div className="flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <img src={selectedCourse.logoMarca} className="w-8 h-8 rounded-full border border-gray-200" alt="Marca" />
                <span className="text-xs font-black text-[#1A3D3D] uppercase tracking-wider">{selectedCourse.marca}</span>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </article>
    );
  };

  const renderInsumoDetail = () => {
    if (!selectedInsumo) return null;

    return (
      <article className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
        <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a Insumos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <section className="lg:col-span-8 flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={selectedInsumo.logoMarca} alt={selectedInsumo.marca} className="w-8 h-8 rounded-full border border-gray-100" />
                <span className="text-xs md:text-[11px] font-bold text-[#2D6A6A] uppercase tracking-widest">{selectedInsumo.marca}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-[40px] font-black font-['Montserrat'] text-[#1A3D3D] leading-[1.1] tracking-tighter mb-4">
                {selectedInsumo.titulo}
              </h1>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                {selectedInsumo.descripcionCorta}
              </p>
            </div>

            <div className="w-full aspect-video md:aspect-[16/10] bg-white rounded-[32px] border border-gray-100 p-4 md:p-8 flex items-center justify-center shadow-sm relative overflow-hidden group">
               <img src={selectedInsumo.imagen} alt={selectedInsumo.titulo} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-3 md:gap-12 border-b border-gray-200" aria-label="Pestañas del producto">
              <button onClick={() => setActiveInsumoTab('features')} className={`pb-3 md:pb-4 text-xs md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeInsumoTab === 'features' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
                Características
              </button>
              <button onClick={() => setActiveInsumoTab('specs')} className={`pb-3 md:pb-4 text-xs md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeInsumoTab === 'specs' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
                Especificaciones
              </button>
            </nav>

            <div className="min-h-[300px]">
              {activeInsumoTab === 'features' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h3 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4">Acerca del equipo</h3>
                    <p className="text-gray-600 text-base leading-relaxed font-medium">
                      {selectedInsumo.descripcionLarga}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] mb-4">Puntos destacados</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedInsumo.caracteristicas.map((caract, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
                          <Check className="w-5 h-5 text-[#2D6A6A] shrink-0 mt-0.5" />
                          <span className="text-[14px] text-[#1A3D3D] font-medium leading-snug">{caract}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeInsumoTab === 'specs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-2">Ficha Técnica</h3>
                  <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden">
                    {selectedInsumo.especificaciones.map((spec, idx) => (
                      <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 ${idx !== selectedInsumo.especificaciones.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                        <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-0 w-1/3">{spec.label}</span>
                        <span className="text-sm md:text-base font-black text-[#1A3D3D] sm:text-right w-2/3">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Inversión</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl lg:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter">
                      ${selectedInsumo.precio.toLocaleString('es-AR')}
                    </span>
                    <span className="text-sm font-bold text-gray-400">ARS</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Precio referencial, sujeto a cotización oficial.</p>
                </div>

                <div className="bg-[#2D6A6A]/5 border border-[#2D6A6A]/20 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#2D6A6A]/10 rounded-full blur-xl"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2D6A6A] mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Beneficio Comunidad El Portal
                  </p>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#2D6A6A] transition-colors" onClick={() => copyToClipboard(selectedInsumo.codigoDescuento)}>
                    <span className="font-['Montserrat'] font-black text-lg tracking-wider text-[#1A3D3D]">{selectedInsumo.codigoDescuento}</span>
                    <span className="bg-[#2D6A6A] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">{selectedInsumo.porcentajeDescuento}% OFF</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mt-3 text-center">Hacé clic en el código para copiarlo.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => window.open(`https://wa.me/5491100000000?text=Hola,%20vengo%20desde%20El%20Portal.%20Me%20interesa%20cotizar%20el%20equipo:%20${selectedInsumo.titulo}`, '_blank')}
                    className="w-full py-4 bg-[#1A3D3D] text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#2D6A6A] transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" /> Cotizar por WhatsApp
                  </button>
                  <button 
                    onClick={() => window.location.href = `mailto:ventas@${selectedInsumo.marca.replace(/\s+/g, '').toLowerCase()}.com?subject=Consulta%20desde%20El%20Portal:%20${selectedInsumo.titulo}`}
                    className="w-full py-3.5 bg-gray-50 text-[#1A3D3D] border border-gray-200 rounded-[20px] font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Contactar Vendedor
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <Shield className="w-5 h-5 text-[#2D6A6A]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#1A3D3D] uppercase tracking-wider">Compra Segura</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">Distribuidor verificado por El Portal.</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <Truck className="w-5 h-5 text-[#2D6A6A]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#1A3D3D] uppercase tracking-wider">Envíos a todo el país</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">Consultá tiempos y costos de entrega.</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <Settings2 className="w-5 h-5 text-[#2D6A6A]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#1A3D3D] uppercase tracking-wider">Soporte Técnico</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">Garantía oficial y servicio post-venta.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    );
  };

  const renderFavoritos = () => {
    const cursosFavs = SEMINARIOS.filter(c => favoritos.includes(`curso-${c.id}`));
    const proveedoresFavs = PROVEEDORES.filter(p => favoritos.includes(`prov-${p.id}`));
    const insumosFavs = PARTNERS.filter(i => favoritos.includes(`insumo-${i.id}`));

    const totalFavs = cursosFavs.length + proveedoresFavs.length + insumosFavs.length;

    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Repertorio
            </button>
            <h1 className="text-3xl md:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
              Mis Guardados
            </h1>
            <p className="text-[#2D6A6A] text-[11px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">
              Tu selección personalizada ({totalFavs})
            </p>
          </div>
        </header>

        {totalFavs === 0 ? (
          <div className="bg-white rounded-[40px] border border-gray-100 p-20 text-center flex flex-col items-center justify-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-100 mb-6" />
            <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl mb-4">Aún no tienes elementos guardados</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Explora el repertorio y pulsa el corazón para guardar lo que te interese para más tarde.</p>
            <button onClick={() => setView('grid')} className="bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#2D6A6A] transition-all shadow-lg">
              Explorar Repertorio
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {cursosFavs.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Seminarios Guardados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cursosFavs.map(curso => (
                    <article key={curso.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                      <div className="h-36 relative overflow-hidden cursor-pointer shrink-0" onClick={() => handleCourseClick(curso)}>
                        <img src={curso.imagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={curso.titulo} />
                      </div>
                      <button 
                        onClick={(e) => toggleFavorito(e, `curso-${curso.id}`)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-10"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>
                      <div className="p-5 flex flex-col flex-grow text-left">
                        <h3 onClick={() => handleCourseClick(curso)} className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px] leading-tight mb-2 group-hover:text-[#2D6A6A] transition-colors cursor-pointer">{curso.titulo}</h3>
                        <div className="flex items-center gap-1.5 mb-4 mt-auto">
                          <Monitor className="w-3.5 h-3.5 text-[#4DB6AC]" />
                          <span className="text-[11px] font-semibold text-[#666666]">{curso.modalidad}</span>
                        </div>
                        <button onClick={() => handleCourseClick(curso)} className="w-full py-3 bg-[#1A3D3D] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#2D6A6A] transition-all">Ver seminario</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {proveedoresFavs.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Marcas Favoritas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proveedoresFavs.map(proveedor => (
                    <article key={proveedor.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative p-5">
                      <button onClick={(e) => toggleFavorito(e, `prov-${proveedor.id}`)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-sm z-10">
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={proveedor.logoMarca} className="w-12 h-12 rounded-xl border border-gray-100" alt="Logo" />
                        <div>
                          <h4 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px]">{proveedor.marca}</h4>
                          <span className="text-[10px] font-bold text-[#2D6A6A] uppercase tracking-widest">{proveedor.ubicacion}</span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-[13px] font-medium leading-relaxed line-clamp-2 mb-4">{proveedor.descripcionCorta}</p>
                      <button 
                        onClick={() => alert(`El perfil institucional de ${proveedor.marca} estará disponible en la próxima actualización.`)} 
                        className="mt-auto w-full py-3 border border-gray-100 bg-gray-50 text-[#1A3D3D] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#1A3D3D] hover:text-white transition-all"
                      >
                        Ver Perfil
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
            Repertorio Clínico
          </h1>
          <p className="text-[#2D6A6A] text-[11px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">
            Ecosistema Veterinario
          </p>
        </div>

        <div className="flex bg-white p-1.5 rounded-[20px] border border-gray-100 shadow-sm w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveGridTab('cursos')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 md:py-3 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeGridTab === 'cursos' ? 'bg-[#2D6A6A] text-white shadow-md' : 'text-gray-400 hover:text-[#1A3D3D] hover:bg-gray-50'}`}>
            <BookOpen className="w-4 h-4" /> Seminarios
          </button>
          <button onClick={() => setActiveGridTab('proveedores')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 md:py-3 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeGridTab === 'proveedores' ? 'bg-[#2D6A6A] text-white shadow-md' : 'text-gray-400 hover:text-[#1A3D3D] hover:bg-gray-50'}`}>
            <Building className="w-4 h-4" /> Marcas y Proveedores
          </button>
          <button onClick={() => setView('favoritos')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 md:py-3 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap text-gray-400 hover:text-red-500 hover:bg-red-50`}>
            <Heart className="w-4 h-4" /> Mis Guardados
          </button>
        </div>
      </header>

      <div className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8">
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          {activeGridTab === 'cursos' ? renderCursosFilters() : renderProveedoresFilters()}
        </aside>

        <section className="lg:col-span-9 flex flex-col gap-6 w-full">
          {activeGridTab === 'cursos' ? renderCursosContent() : renderProveedoresContent()}
        </section>
      </div>
    </div>
  );
  
return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative">
      {/* Aquí fusionamos tus clases nuevas (relative, z-10, w-full, pt-5, etc.) con las que ya tenías */}
      <main id="main-content" className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 pt-5 pb-10 md:pt-9 md:pb-16 flex-grow">
        {view === 'grid' ? renderGrid() : 
         view === 'detail' ? renderDetail() : 
         view === 'insumoDetail' ? renderInsumoDetail() : 
         view === 'wizard' ? renderCourseWizard() : 
         view === 'insumoForm' ? renderInsumoForm() : 
         view === 'propuesta' ? renderPropuesta() : 
         view === 'favoritos' ? renderFavoritos() :
         renderAdvertise()}
      </main>
    </div>
  );
}