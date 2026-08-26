import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TourGuia from '../components/TourGuia';
// IMPORTS DE FIREBASE ACÁ ARRIBA
import { db, storage } from '../firebase.js'; 
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, increment, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { 
  Star, Clock, ChevronLeft, Filter, Search, ShieldCheck,
  FileText, PlayCircle, Plus, MessageCircle, ChevronRight, Monitor, Check,
  Award, BookOpen, Heart, UploadCloud, Activity, Save, Loader2, Trash2, Download, AlertCircle, X, CheckCircle, Mail
} from 'lucide-react';
const CATEGORIAS = ["Cirugía General", "Diagnóstico por Imágenes", "Gestión Veterinaria", "Clínica de Pequeños", "Dermatología", "Anestesiología"];
const COMISION_DEFAULT = 10;
const MODALIDADES = ["Online", "Presencial", "Híbrido"];

const enviarMailBrevo = async (destinatario, asunto, contenido) => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender: { name: 'El Portal Veterinario', email: 'portalveterinario.ar@gmail.com' },
      to: [{ email: destinatario }],
      subject: asunto,
      textContent: contenido,
    }),
  });
};

const FAQ_CATEGORIES = [
  {
    title: "Honorarios",
    items: [
      { q: "¿De cuánto es la comisión por venta?", a: "Retenemos un 5% por cada alumnx generado efectivamente. Este margen ya cubre los costos de las pasarelas de pago y nuestras campañas de marketing. No hay costos ocultos." },
      { q: "¿Cómo y cuándo recibo mis ganancias?", a: "Realizamos liquidaciones quincenales. El dinero de las ventas (menos la comisión) se transfiere directamente a tu cuenta bancaria institucional." },
      { q: "¿Quién emite la factura al alumno?", a: "La institución o docente le factura el 100% del curso al alumnx. El Portal emite una factura a la institución por el servicio de intermediación (la comisión del 5%)." }
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

export default function Capacitaciones() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [view, setView] = useState(location.state?.vista || 'grid');
  const [mostrarTourCaps, setMostrarTourCaps] = useState(false);
  const [tourCapsContador, setTourCapsContador] = useState(0);

  useEffect(() => {
    if (!currentUser || view !== 'grid') return;

    const fetchContador = async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
        const contador = snap.data()?.tourVisto?.capacitacionesContador || 0;
        setTourCapsContador(contador);
        if (contador < 2) {
          setTimeout(() => setMostrarTourCaps(true), 800);
        }
      } catch (e) {
        console.error('Error leyendo contador del tour de capacitaciones:', e);
      }
    };

    fetchContador();
  }, [currentUser, view]);

  const PASOS_CAPS = [
    { targetId: 'tour-busqueda-caps', titulo: 'Buscá por tema', desc: 'Escribí una especialidad o palabra clave para filtrar los cursos disponibles. También podes usar la barra de filtros que se encuentra a la izquierda.', posicion: 'abajo' },
    { targetId: 'tour-publicar-curso', titulo: '¿Sos docente o institución?', desc: 'Podés publicar tu propio curso acá. Publicar es gratis y llega a toda la comunidad veterinaria.', posicion: 'abajo' },
    { targetId: 'tour-mis-cursos', titulo: 'Tus cursos publicados', desc: 'Si publicaste cursos, desde acá podés verlos, editarlos o dar de baja los que ya no estén activos.', posicion: 'abajo' },
  ];
  
  // ESTADOS NUEVOS PARA FIREBASE QUE AGREGAMOS
  const [seminarios, setSeminarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comision, setComision] = useState(COMISION_DEFAULT);
  const [cursosDeTodosLosEstados, setCursosDeTodosLosEstados] = useState([]);

  // EFECTO PARA TRAER LOS DATOS DE FIREBASE
  useEffect(() => {
    const fetchComision = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'settings', 'globales'));
        if (snap.exists() && snap.data().comisionCapacitaciones) {
          setComision(Number(snap.data().comisionCapacitaciones));
        }
      } catch (e) {
        console.error("Error leyendo comisión:", e);
      }
    };
    fetchComision();
  }, []);

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'capacitaciones'));
        const todos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCursosDeTodosLosEstados(todos);
        const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
setSeminarios(todos.filter(c => {
  if (c.estado !== 'aprobado') return false;
  if (c.tipoCurso === 'en_vivo' && c.fechaInscripcion) {
    const fechaLimite = new Date(c.fechaInscripcion);
    fechaLimite.setHours(23, 59, 59, 999);
    if (fechaLimite < hoy) return false;
  }
  return true;
}));
      } catch (error) {
        console.error("Error trayendo capacitaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapacitaciones();
  }, []);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [modalidadesSeleccionadas, setModalidadesSeleccionadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [openFaq, setOpenFaq] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [favoritos, setFavoritos] = useState([]);
 const [visibleCourses, setVisibleCourses] = useState(6);
  const [filtroTipo, setFiltroTipo] = useState(null);

  // WIZARD CURSO
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [isUploadingImagen, setIsUploadingImagen] = useState(false);
const [imagenUploadProgress, setImagenUploadProgress] = useState(0);
const [imagenEditorModal, setImagenEditorModal] = useState(false);
const [imagenParaEditar, setImagenParaEditar] = useState(null);
const [imagenEditorZoom, setImagenEditorZoom] = useState(1);
const [imagenEditorPos, setImagenEditorPos] = useState({ x: 0, y: 0 });
const [imagenEditorDragging, setImagenEditorDragging] = useState(false);
const [imagenEditorDragStart, setImagenEditorDragStart] = useState({ x: 0, y: 0 });
const canvasEditorRef = useRef(null);
const [editandoCursoId, setEditandoCursoId] = useState(null);
const [inscripcionModal, setInscripcionModal] = useState(false);
const [inscripcionForm, setInscripcionForm] = useState({ nombre: '', email: '', matricula: '', celular: '', esVeterinario: true });
const [inscripcionEnviando, setInscripcionEnviando] = useState(false);
const [inscripcionErrors, setInscripcionErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [courseForm, setCourseForm] = useState({
    titulo: '', modalidad: 'Online', precio: '', nivel: 'Principiante', duracion: '',
    descripcion: '', incluye: [''],
    docentes: [{ nombre: '', bio: '', linkMas: '' }],
    email: '',
    tipoCurso: 'grabado',
    fechaInscripcion: '',
    fechaInicio: '',
    linkExterno: '',
    categoria: CATEGORIAS[0],
    responsableNombre: '',
    responsableDNI: '',
    responsableMatricula: '',
    aceptaTerminos: false,
    fotoDocente: null
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const bannerRef = useRef(null);

  // EFECTOS
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

  // HANDLERS GLOBALES
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

  // HANDLERS WIZARD CURSO
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

  const handleImagenCursoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      imagenNaturalRef.current = null;
      setImagenParaEditar(ev.target.result);
      setImagenEditorZoom(1);
      setImagenEditorPos({ x: 0, y: 0 });
      setImagenEditorModal(true);
    };
    reader.readAsDataURL(file);
    // Resetear el input para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };


  useEffect(() => {
    if (imagenEditorModal) dibujarEditorCanvas();
  }, [imagenEditorModal, imagenEditorZoom, imagenEditorPos]);

  const handleConfirmarEditorImagen = async () => {
    const canvas = canvasEditorRef.current;
    if (!canvas) return;
    setImagenEditorModal(false);
    setIsUploadingImagen(true);
    setImagenUploadProgress(0);
    canvas.toBlob(async (blob) => {
      try {
        const fileRef = ref(storage, `capacitaciones/${Date.now()}_portada.jpg`);
        const uploadTask = uploadBytesResumable(fileRef, blob);
        uploadTask.on('state_changed',
          (snapshot) => setImagenUploadProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)),
          (error) => { console.error(error); setIsUploadingImagen(false); },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            handleWizardChange('imagenUrl', url);
            setIsUploadingImagen(false);
          }
        );
      } catch (error) {
        console.error(error);
        setIsUploadingImagen(false);
      }
    }, 'image/jpeg', 0.92);
  };

  // Dibuja la imagen en el canvas del editor
  const imagenNaturalRef = useRef(null);

  const dibujarEditorCanvas = () => {
    const canvas = canvasEditorRef.current;
    if (!canvas || !imagenParaEditar) return;
    const ctx = canvas.getContext('2d');
    const img = imagenNaturalRef.current || new Image();
    
    const dibujar = () => {
      // Zoom base: que la imagen entre completa en el canvas
      const zoomBase = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const escala = zoomBase * imagenEditorZoom;
      const w = img.naturalWidth * escala;
      const h = img.naturalHeight * escala;
      const x = (canvas.width - w) / 2 + imagenEditorPos.x;
      const y = (canvas.height - h) / 2 + imagenEditorPos.y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Fondo gris para ver el área fuera de la imagen
      ctx.fillStyle = '#F4F7F7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, w, h);
    };

    if (!imagenNaturalRef.current) {
      img.onload = () => {
        imagenNaturalRef.current = img;
        dibujar();
      };
      img.src = imagenParaEditar;
    } else {
      dibujar();
    }
  };

  useEffect(() => {
    if (imagenEditorModal) dibujarEditorCanvas();
  }, [imagenEditorModal, imagenEditorZoom, imagenEditorPos]);

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!courseForm.imagenUrl) newErrors.imagenUrl = 'La imagen de portada es obligatoria.';
      if (!courseForm.titulo.trim()) newErrors.titulo = 'El título del curso es obligatorio.';
      else if (courseForm.titulo.trim().length < 10) newErrors.titulo = 'El título debe tener al menos 10 caracteres.';
      if (!courseForm.precio || courseForm.precio <= 0) newErrors.precio = 'Ingresá un precio válido mayor a 0.';
      if (!courseForm.formatoDuracion || !courseForm.duracion) newErrors.duracion = 'Seleccioná el formato y completá la duración.';
    }
    if (step === 2) {
      if (!courseForm.descripcion.trim()) newErrors.descripcion = 'La descripción general es obligatoria.';
      if (courseForm.incluye.filter(i => i.trim()).length === 0) newErrors.incluye = 'Agregá al menos un punto clave de aprendizaje.';
    }
    if (step === 3) {
      const docentes = courseForm.docentes || [];
      if (docentes.length === 0 || !docentes[0].nombre.trim()) newErrors.instructorNombre = 'El nombre del docente principal es obligatorio.';
      if (docentes.length === 0 || !docentes[0].bio.trim()) newErrors.instructorBio = 'La biografía del docente principal es obligatoria.';
      if (!courseForm.email.trim()) newErrors.email = 'El email de contacto es obligatorio.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courseForm.email)) newErrors.email = 'Ingresá un email válido.';
      if (!courseForm.responsableNombre.trim()) newErrors.responsableNombre = 'El nombre completo del responsable es obligatorio.';
      if (!courseForm.responsableDNI.trim()) newErrors.responsableDNI = 'El DNI del responsable es obligatorio.';
      if (!courseForm.responsableMatricula.trim()) newErrors.responsableMatricula = 'La matrícula profesional es obligatoria.';
      if (!courseForm.aceptaTerminos) newErrors.aceptaTerminos = 'Debés aceptar los términos y condiciones para continuar.';
            if (courseForm.tipoCurso === 'en_vivo') {
        if (!courseForm.fechaInscripcion) newErrors.fechaInscripcion = 'La fecha límite de inscripción es obligatoria.';
        if (!courseForm.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio del curso es obligatoria.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleArchivarCurso = async (cursoId) => {
    if (!window.confirm('¿Seguro que querés dar de baja este curso? Va a dejar de ser visible en el listado público.')) return;
    try {
      await updateDoc(doc(db, 'capacitaciones', cursoId), { estado: 'archivado' });
      const querySnapshot = await getDocs(collection(db, 'capacitaciones'));
      const todos = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCursosDeTodosLosEstados(todos);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      setSeminarios(todos.filter(c => {
        if (c.estado !== 'aprobado') return false;
        if (c.tipoCurso === 'en_vivo' && c.fechaInscripcion) {
          const fechaLimite = new Date(c.fechaInscripcion);
          fechaLimite.setHours(23, 59, 59, 999);
          if (fechaLimite < hoy) return false;
        }
        return true;
      }));
    } catch (error) {
      console.error('Error al archivar curso:', error);
      alert('Hubo un error al dar de baja el curso. Intentá de nuevo.');
    }
  };

const handleEditarMiCurso = (curso) => {
    setCourseForm({
      titulo: curso.titulo || '',
      modalidad: curso.modalidad || 'Online',
      precio: curso.precio || '',
      nivel: curso.nivel || 'Principiante',
      duracion: curso.duracion || '',
      formatoDuracion: curso.formatoDuracion || '',
      descripcion: curso.descripcion || '',
      incluye: curso.incluye?.length ? curso.incluye : [''],
      docentes: curso.docentes?.length ? curso.docentes : [{ nombre: '', bio: '', linkMas: '' }],
      email: curso.email || '',
      tipoCurso: curso.tipoCurso || 'grabado',
      fechaInscripcion: curso.fechaInscripcion || '',
      fechaInicio: curso.fechaInicio || '',
      linkExterno: curso.linkExterno || '',
      categoria: curso.categoria || CATEGORIAS[0],
      responsableNombre: curso.responsableNombre || '',
      responsableDNI: curso.responsableDNI || '',
      responsableMatricula: curso.responsableMatricula || '',
      aceptaTerminos: curso.aceptaTerminos || false,
      imagenUrl: curso.imagen || '',
      fotoDocente: null,
      fotoDocenteUrl: curso.fotoDocente || ''
    });
    setEditandoCursoId(curso.id);
    setErrors({});
    setWizardStep(1);
    setView('wizard');
    window.scrollTo(0, 0);
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(prev => prev + 1);
      window.scrollTo(0,0);
    }
  };

const submitWizard = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    try {
      let fotoDocenteFinal = courseForm.fotoDocenteUrl || '';
      
      // Si el usuario subió una foto nueva en el input
      if (courseForm.fotoDocente && courseForm.fotoDocente.file) {
        try {
          const options = { maxSizeMB: 0.2, maxWidthOrHeight: 400, useWebWorker: true };
          const compressedFile = await imageCompression(courseForm.fotoDocente.file, options);
          const fileRef = ref(storage, `capacitaciones/docentes/${Date.now()}_${compressedFile.name}`);
          await uploadBytesResumable(fileRef, compressedFile);
          fotoDocenteFinal = await getDownloadURL(fileRef);
        } catch (error) {
          console.error("Error comprimiendo/subiendo foto docente:", error);
        }
      }

      const datosCurso = {
        fotoDocente: fotoDocenteFinal, // <-- Guardamos la URL acá
        titulo: courseForm.titulo,
        modalidad: courseForm.modalidad,
        precio: Math.round(Number(courseForm.precio) * (1 - comision / 100)),
        precioOriginal: Number(courseForm.precio),
        nivel: courseForm.nivel,
        duracion: courseForm.duracion,
        descripcion: courseForm.descripcion,
        incluye: courseForm.incluye.filter(i => i.trim()),
        instructor: courseForm.docentes?.[0]?.nombre || '',
        instructorBio: courseForm.docentes?.[0]?.bio || '',
        docentes: courseForm.docentes || [],
        email: courseForm.email,
        imagen: courseForm.imagenUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
        logoMarca: '',
        marca: currentUser?.nombre || courseForm.docentes?.[0]?.nombre || '',
        badge: 'Nuevo',
        rating: 0,
        reviews: 0,
        categoria: courseForm.categoria || CATEGORIAS[0],
        tipoCurso: courseForm.tipoCurso || 'grabado',
        fechaInscripcion: courseForm.fechaInscripcion || null,
        fechaInicio: courseForm.fechaInicio || null,
        linkExterno: courseForm.linkExterno || '',
        responsableNombre: courseForm.responsableNombre,
        responsableDNI: courseForm.responsableDNI,
        responsableMatricula: courseForm.responsableMatricula,
        aceptaTerminos: courseForm.aceptaTerminos,
        fechaAceptacionTerminos: new Date().toISOString(),
        creadorId: currentUser?.uid || null,
        creadorNombre: currentUser?.nombre || currentUser?.displayName || '',
        creadorRol: currentUser?.rol || '',
        creadorSlug: currentUser?.slug || '',
      };

      if (editandoCursoId) {
        // EDICIÓN: vuelve a pendiente, no pisa la fecha de creación original
        await updateDoc(doc(db, 'capacitaciones', editandoCursoId), {
          ...datosCurso,
          estado: 'pendiente',
          motivoRechazo: '',
        });
      } else {
        // CREACIÓN nueva
        await addDoc(collection(db, 'capacitaciones'), {
          ...datosCurso,
          estado: 'pendiente',
          createdAt: new Date().toISOString()
        });
      }

      // Recargar la lista de capacitaciones (solo aprobados, para que no se vea el recién creado/editado)
      const querySnapshot = await getDocs(collection(db, 'capacitaciones'));
      const todos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCursosDeTodosLosEstados(todos);
      setSeminarios(todos.filter(c => c.estado === 'aprobado'));

      setIsSubmitting(false);
      setWizardStep(1);
      setEditandoCursoId(null);
      setView('confirmacion');
      setCourseForm({
        titulo: '', modalidad: 'Online', precio: '', nivel: 'Principiante', duracion: '',
        descripcion: '', incluye: [''],
        docentes: [{ nombre: '', bio: '', linkMas: '' }],
        email: '',
        tipoCurso: 'grabado',
        fechaInscripcion: '',
        fechaInicio: '',
        linkExterno: '',
        categoria: CATEGORIAS[0],
        responsableNombre: '',
        responsableDNI: '',
        responsableMatricula: '',
        aceptaTerminos: false,
        fotoDocente: null,
        imagenUrl: '',
        formatoDuracion: ''
      });
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error guardando capacitación:", error);
      setIsSubmitting(false);
      alert("Hubo un error al guardar. Intentá de nuevo.");
    }
  };

const handleAbrirInscripcion = () => {
    const esClinica = currentUser?.rol === 'clinica';
    setInscripcionForm({
      nombre: esClinica ? '' : (currentUser?.nombre || ''),
      email: esClinica ? '' : (currentUser?.emailContacto || currentUser?.cuentaEmail || ''),
      matricula: esClinica ? '' : (currentUser?.matricula || ''),
      celular: esClinica ? '' : (currentUser?.whatsappNum || ''),
      esVeterinario: !esClinica,
    });
    setInscripcionErrors({});
    setInscripcionModal(true);
  };

  const handleCambioInscripcion = (campo, valor) => {
    setInscripcionForm(prev => ({ ...prev, [campo]: valor }));
    if (inscripcionErrors[campo]) setInscripcionErrors(prev => ({ ...prev, [campo]: null }));
  };

  const validarInscripcion = () => {
    const errs = {};
    if (!inscripcionForm.nombre.trim()) errs.nombre = 'El nombre es obligatorio.';
    if (!inscripcionForm.email.trim()) errs.email = 'El email es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inscripcionForm.email)) errs.email = 'Ingresá un email válido.';
    if (inscripcionForm.esVeterinario && !inscripcionForm.matricula.trim()) errs.matricula = 'La matrícula es obligatoria para veterinarios.';
    setInscripcionErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmarInscripcion = async () => {
    if (!validarInscripcion() || !selectedCourse) return;
    setInscripcionEnviando(true);
    try {
      // Incrementar contador en el curso
      await updateDoc(doc(db, 'capacitaciones', selectedCourse.id), {
        totalInscriptos: increment(1)
      });

      // Notificación al docente
      if (selectedCourse.creadorId) {
        await addDoc(collection(db, 'notificaciones'), {
          tipo: 'nueva_inscripcion',
          userId: selectedCourse.creadorId,
          rolDestino: [],
          texto: `${inscripcionForm.nombre} se inscribió en "${selectedCourse.titulo}"`,
          fecha: new Date(),
        });
      }
      await addDoc(collection(db, 'inscripciones'), {
        cursoId: selectedCourse.id,
        cursoTitulo: selectedCourse.titulo,
        usuarioId: currentUser?.uid || null,
        usuarioRol: currentUser?.rol || '',
        nombre: inscripcionForm.nombre,
        email: inscripcionForm.email,
        matricula: inscripcionForm.matricula || '',
        celular: inscripcionForm.celular || '',
        esVeterinario: inscripcionForm.esVeterinario,
        docenteEmail: selectedCourse.email || '',
        createdAt: new Date().toISOString(),
      });

      // Mail al docente con los datos del inscripto
      if (selectedCourse.email) {
        await enviarMailBrevo(
          selectedCourse.email,
          `🎓 Nueva inscripción — ${selectedCourse.titulo}`,
          `Hola, ${selectedCourse.instructor || 'equipo docente'}.

¡Tenés una nueva inscripción en tu curso "${selectedCourse.titulo}"!

Datos del inscripto:
Nombre: ${inscripcionForm.nombre}
Email: ${inscripcionForm.email}
Matrícula: ${inscripcionForm.matricula || 'No aplica'}
Celular: ${inscripcionForm.celular || 'No informado'}

Ya podés agregarlo a tu plataforma de dictado.

El equipo de El Portal Veterinario`
        );
      }

      // Mail de confirmación al inscripto
      await enviarMailBrevo(
        inscripcionForm.email,
        `✅ Confirmación de inscripción — ${selectedCourse.titulo}`,
        `Hola, ${inscripcionForm.nombre}.

Confirmamos tu inscripción al curso "${selectedCourse.titulo}".

Datos del curso:
Modalidad: ${selectedCourse.modalidad}
Duración: ${selectedCourse.duracion}
${selectedCourse.linkExterno ? `Link de acceso: ${selectedCourse.linkExterno}` : ''}

Si tenés consultas sobre el curso, podés escribirle directamente al docente a: ${selectedCourse.email || 'el contacto que figura en la plataforma'}.

¡Gracias por confiar en El Portal!
El equipo de El Portal Veterinario`
      );

      setInscripcionModal(false);
      setView('inscripcion-confirmada');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error al inscribir:", error);
      alert("Hubo un error al procesar la inscripción. Intentá de nuevo.");
    } finally {
      setInscripcionEnviando(false);
    }
  };


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

  // FILTRADO
  const cursosFiltrados = seminarios.filter(curso => {
    const matchCategoria = !filtroCategoria || curso.categoria === filtroCategoria;
    const matchModalidad = modalidadesSeleccionadas.length === 0 || modalidadesSeleccionadas.includes(curso.modalidad);
    const matchBusqueda = !searchTerm || curso.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filtroTipo || curso.tipoCurso === filtroTipo;
    return matchCategoria && matchModalidad && matchBusqueda && matchTipo;
  });
  const cursosMostrados = cursosFiltrados.slice(0, visibleCourses);

  // =========================================================================
  // VISTAS (RENDERIZADOS PARCIALES)
  // =========================================================================

  const renderFiltros = () => (
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

    <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[10px] uppercase tracking-[0.2em] mb-5 mt-8 flex items-center gap-2 border-b border-gray-50 pb-2">
        <PlayCircle className="w-3.5 h-3.5 text-[#2D6A6A]" /> Tipo de curso
      </h3>
      <div className="space-y-3.5">
        {['grabado', 'en_vivo'].map(tipo => (
          <div key={tipo} onClick={() => setFiltroTipo(filtroTipo === tipo ? null : tipo)} className="flex items-center gap-3 group cursor-pointer">
            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${filtroTipo === tipo ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'border-gray-200 group-hover:border-[#2D6A6A]'}`}>
              {filtroTipo === tipo && <Check className="w-3 h-3 text-white stroke-[4px]" />}
            </div>
            <span className={`text-[13px] font-semibold transition-colors ${filtroTipo === tipo ? 'text-[#1A3D3D]' : 'text-gray-400 group-hover:text-[#1A3D3D]'}`}>
              {tipo === 'grabado' ? 'Grabado' : 'En vivo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500 w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
            Capacitaciones
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && (
            <button id="tour-mis-cursos" onClick={() => setView('miscursos')} className="flex items-center justify-center gap-2 px-6 py-2.5 md:py-3 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-[#2D6A6A] hover:bg-[#2D6A6A]/5">
              <BookOpen className="w-4 h-4" /> Mis Cursos
            </button>
          )}
          <button onClick={() => setView('favoritos')} className="flex items-center justify-center gap-2 px-6 py-2.5 md:py-3 rounded-[16px] text-[11px] font-bold uppercase tracking-widest transition-all bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-red-500 hover:bg-red-50">
            <Heart className="w-4 h-4" /> Mis Guardados
          </button>
        </div>
      </header>

      <div className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8">
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          {renderFiltros()}
        </aside>

        <section className="lg:col-span-9 flex flex-col gap-5 md:gap-6 w-full">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" aria-hidden="true" />
         <input 
              id="tour-busqueda-caps"
              type="search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="¿Qué quieres aprender hoy? (ej. Cirugía, Dermatología...)" 
              className="bg-white border border-gray-100 rounded-full pl-11 pr-6 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] w-full shadow-sm placeholder:text-gray-400 transition-all" 
            />
          </div>

          <article ref={bannerRef} onMouseMove={handleMouseMove} className="bg-[#1A3D3D] px-5 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[24px] text-left relative overflow-hidden group shadow-md flex flex-row items-center justify-between gap-3 md:gap-6 border border-white/5">
            <div className="absolute pointer-events-none transition-transform duration-300 ease-out bg-white opacity-5 rounded-full blur-3xl" style={{ width: '300px', height: '300px', left: mousePos.x - 150, top: mousePos.y - 150 }} />
            <div id="tour-publicar-curso" className="relative z-10 flex flex-col items-start gap-1">
              <h2 className="text-white font-['Montserrat'] font-black text-[13px] md:text-lg uppercase leading-none tracking-tight">¿Representás a una institución?</h2>
              <p className="text-white/50 text-[10px] md:text-xs font-medium italic hidden sm:block mt-0.5">Publicá tu programa académico gratis y llegá a más profesionales.</p>
            </div>
            <button onClick={() => setView('propuesta')} className="bg-[#2D6A6A] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full text-[10px] font-bold uppercase tracking-widest relative z-10 shadow-lg hover:bg-[#3d8b8b] transition-all whitespace-nowrap">
              Publicar Curso
            </button>
          </article>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
            </div>
          ) : cursosMostrados.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {cursosMostrados.map(curso => (
                  <article key={curso.id} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                    <div className="h-36 md:h-40 relative overflow-hidden cursor-pointer shrink-0" onClick={() => handleCourseClick(curso)}>
                      <img src={curso.imagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={curso.titulo} />
                     <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-[#2D6A6A] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-md animate-pulse">{curso.badge}</span>
                      </div>
                    </div>
                    <button onClick={(e) => toggleFavorito(e, `curso-${curso.id}`)} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-10">
                      <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(`curso-${curso.id}`) ? 'fill-red-500 text-red-500' : 'text-[#666666] hover:text-red-500'}`} />
                    </button>
                    <div className="p-4 md:p-5 flex flex-col flex-grow text-left">
                     {(curso.marca?.length >= 4 || curso.logoMarca) && (
                        <div className="flex items-center gap-2 mb-2">
                          {curso.logoMarca ? <img src={curso.logoMarca} className="w-5 h-5 rounded-[20px] border border-gray-100" alt="Logo" /> : null}
                          {curso.marca?.length >= 4 && <span className="text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] truncate">{curso.marca}</span>}
                        </div>
                      )}
                      <h3 onClick={() => handleCourseClick(curso)} className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px] leading-tight mb-1 group-hover:text-[#2D6A6A] transition-colors line-clamp-2 cursor-pointer">{curso.titulo}</h3>
                      
                      <div className="flex items-center gap-3 text-[11px] text-[#666666] font-semibold mb-4 mt-auto flex-wrap">
                        <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5 text-[#4DB6AC]" /> {curso.modalidad}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#4DB6AC]" /> {curso.duracion}</span>
                        {curso.totalInscriptos > 0 && (
                          <span className="flex items-center gap-1 text-[#2D6A6A] font-bold">
                            👥 {curso.totalInscriptos} inscripto{curso.totalInscriptos !== 1 ? 's' : ''}
                          </span>
                        )}
                      <span className="flex items-center gap-1 font-bold">
                          <PlayCircle className={`w-3.5 h-3.5 ${curso.tipoCurso === 'en_vivo' ? 'text-[#EAB308]' : 'text-[#4DB6AC]'}`} />
                          <span className={curso.tipoCurso === 'en_vivo' ? 'text-[#EAB308]' : 'text-[#666666]'}>{curso.tipoCurso === 'en_ivo' ? 'En vivo' : 'Grabado'}</span>
                        </span>
                      </div>
                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-[#1A3D3D] tracking-tight">${Math.round((curso.precioOriginal || curso.precio) * (1 - comision / 100)).toLocaleString('es-AR')}</span>
                          {comision > 0 && <span className="text-sm text-gray-400 line-through font-semibold">${(curso.precioOriginal || curso.precio).toLocaleString('es-AR')}</span>}
                        </div>
                        <button onClick={() => handleCourseClick(curso)} className="bg-[#1A3D3D] text-white p-2.5 rounded-xl hover:bg-[#2D6A6A] transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {cursosFiltrados.length > visibleCourses && (
                <div className="mt-4 flex justify-center">
                  <button onClick={() => setVisibleCourses(prev => prev + 6)} className="px-6 py-3 bg-white border border-gray-200 text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
                    Cargar más resultados <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center w-full h-full">
              <Search className="w-10 h-10 text-gray-200 mb-4" />
              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-lg mb-2">Aún no hay búsquedas activas</h3>
              <p className="text-[#333333] text-[15px] font-medium">Probá modificando la especialidad o la modalidad.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedCourse) return null; 
    return (
    <article className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al listado
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
            <button onClick={() => setActiveTab('about')} className={`pb-3 md:pb-4 text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'about' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
              Acerca del curso
            </button>
            <button onClick={() => setActiveTab('speaker')} className={`pb-3 md:pb-4 text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'speaker' ? 'border-b-2 border-[#2D6A6A] text-[#1A3D3D]' : 'text-gray-400 hover:text-[#1A3D3D]'}`}>
              Instructorxs
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
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#2D6A6A]/10 flex items-center justify-center text-[#2D6A6A] font-black text-2xl border border-gray-100 shrink-0 overflow-hidden">
                    {selectedCourse.fotoDocente ? (
                      <img src={selectedCourse.fotoDocente} alt={selectedCourse.instructor} className="w-full h-full object-cover" />
                    ) : (
                      selectedCourse.instructor.charAt(0)
                    )}
                </div>
                <div className="text-left flex-1 mt-1 md:mt-2">
                  <h3 className="text-lg md:text-2xl font-black font-['Montserrat'] text-[#1A3D3D] leading-tight">{selectedCourse.instructor}</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-[#2D6A6A] uppercase tracking-widest mb-3 md:mb-4 mt-1">Especialista Referente</p>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed font-medium">
                    {selectedCourse.instructorBio || 'Este docente todavía no agregó una biografía.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          

        </section>

        <aside className="lg:col-span-4">
          <div className="sticky top-28 bg-white p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 space-y-8">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <h4 className="text-4xl md:text-5xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter">
                  ${Math.round((selectedCourse.precioOriginal || selectedCourse.precio) * (1 - comision / 100)).toLocaleString('es-AR')}
                </h4>
                <span className="text-gray-400 line-through text-lg font-bold">${(selectedCourse.precioOriginal || selectedCourse.precio).toLocaleString('es-AR')}</span>
              </div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Oferta por tiempo limitado
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => { if (!currentUser) { alert('Necesitás iniciar sesión para inscribirte.'); navigate('/login'); return; } handleAbrirInscripcion(); }} 
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
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Capacitación publicada por</p>
              {selectedCourse.creadorSlug && selectedCourse.creadorRol ? (
                <button
                  onClick={() => navigate(`/${selectedCourse.creadorRol === 'clinica' ? 'clinica' : 'profesional'}/${selectedCourse.creadorSlug}`)}
                  className="w-full flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-[#2D6A6A]/30 hover:bg-[#2D6A6A]/5 transition-all group"
                >
                  {selectedCourse.logoMarca ? <img src={selectedCourse.logoMarca} className="w-8 h-8 rounded-full border border-gray-200" alt="Marca" /> : null}
                  <span className="text-xs font-black text-[#1A3D3D] uppercase tracking-wider group-hover:text-[#2D6A6A] transition-colors">{selectedCourse.marca}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#2D6A6A] group-hover:translate-x-0.5 transition-all" />
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  {selectedCourse.logoMarca ? <img src={selectedCourse.logoMarca} className="w-8 h-8 rounded-full border border-gray-200" alt="Marca" /> : null}
                  <span className="text-xs font-black text-[#1A3D3D] uppercase tracking-wider">{selectedCourse.marca}</span>
                </div>
              )}
            </div>

          </div>
        </aside>
      </div>
    </article>
    );
  };

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
                    <div className="pdf-percent">5%</div>
                    <div><h3 className="pdf-h3" style={{marginTop: 0}}>Bonificación Académica</h3><p className="pdf-p" style={{marginBottom: 0}}>Sugerimos aplicar una bonificación del 5% sobre el valor de lista de sus capacitaciones. Esta acción fomenta un mayor índice de inscripciones al acercar su propuesta a una red de veterinarios activamente orientados hacia la alta complejidad.</p></div>
                </div>
                
                <h2 className="pdf-h2">4. Condiciones económicas y administrativas</h2>
                <h3 className="pdf-h3">Comisión del 5% sobre inscripciones</h3>
                <p className="pdf-p">El Portal retiene un 5% del valor abonado por el alumno inscrito a través de la plataforma. Este porcentaje es de carácter final y cubre integralmente los aranceles por transacciones bancarias, el mantenimiento de los servidores y las acciones de difusión.</p>
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
          onClick={() => { setView('grid'); setOpenFaq(null); window.scrollTo(0,0); }} 
          className="flex items-center gap-2 text-gray-500 hover:text-[#1A3D3D] font-bold text-xs md:text-[11px] uppercase tracking-[0.2em] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <button 
              onClick={() => { setView('wizard'); window.scrollTo(0,0); }}
              className="bg-[#2D6A6A] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#1A3D3D] transition-colors shadow-lg active:scale-95"
            >
              Publicar mi curso ahora
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
                <img src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80" alt="Veterinario profesional" className="w-full h-full object-cover" />
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
                <span className="text-7xl md:text-8xl font-black text-[#4DB6AC] font-['Montserrat'] tracking-tighter leading-none">5%</span>
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
              <a href="mailto:portalveterinario.ar@gmail.com?subject=Consulta%20institucional%20sobre%20capacitaciones&body=Hola%2C%20quisiera%20consultar%20sobre..." className="w-full sm:w-auto bg-white px-6 py-3.5 rounded-xl text-[11px] font-bold text-[#1A3D3D] hover:bg-[#1A3D3D] hover:text-white border border-gray-200 transition-colors uppercase tracking-[0.2em] text-center shadow-sm whitespace-nowrap">
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

  const renderCourseWizard = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {editandoCursoId && (
        <div className="relative bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-black text-yellow-800 mb-1">Este curso volverá a revisión al guardar</p>
            <p className="text-[12px] text-yellow-700 font-medium leading-relaxed">
              Si modificás <strong>título, precio, descripción, temario, tipo de curso, fechas o link de acceso</strong>, nuestro equipo lo revisará nuevamente antes de republicarlo. Suele tardar menos de 48hs.
            </p>
          </div>
          <button onClick={() => setEditandoCursoId(null)} className="text-yellow-400 hover:text-yellow-600 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button onClick={() => { setView('grid'); setWizardStep(1); setErrors({}); }} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] transition-colors group">
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
              <div className="h-full bg-[#2D6A6A] transition-all duration-500 ease-in-out" style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}></div>
            </div>

            <div className="flex justify-between items-start relative z-10">
              {[1, 2, 3].map((step) => {
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
                      {['Básicos', 'Temario', 'Docente'][step - 1]}
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

                {/* IMAGEN DEL CURSO */}
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Imagen de portada del curso <span className="text-red-500">*</span></label>
                  {courseForm.imagenUrl ? (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                      <img src={courseForm.imagenUrl} className="w-full h-full object-cover" alt="Portada" />
                      <button type="button" onClick={() => handleWizardChange('imagenUrl', '')} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50">
                        <X className="w-4 h-4" strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <label className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isUploadingImagen ? 'border-[#2D6A6A] bg-[#2D6A6A]/5' : 'border-gray-300 hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5'}`}>
                      {isUploadingImagen ? (
                        <>
                          <Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" />
                          <span className="text-sm font-bold text-[#2D6A6A]">{imagenUploadProgress}% subiendo...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-[#2D6A6A]" />
                          <span className="text-sm font-bold text-[#2D6A6A]">Subir imagen de portada</span>
                          <span className="text-xs text-gray-400">JPG o PNG — máx. 5MB</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImagenCursoUpload} disabled={isUploadingImagen} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2" htmlFor="titulo">Título del Curso <span className="text-red-500 not-italic">*</span></label>
                  <input id="titulo" type="text" value={courseForm.titulo} onChange={(e) => { const v = e.target.value; handleWizardChange('titulo', v.charAt(0).toUpperCase() + v.slice(1)); }} placeholder="Ej: Cirugía de tejidos blandos: procedimientos avanzados" maxLength={100} autoCapitalize="sentences" spellCheck={true} className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${errors.titulo ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  <div className="flex justify-between mt-1">
                    {errors.titulo ? <p className="text-red-500 text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.titulo}</p> : <span/>}
                    <span className={`text-[11px] font-bold ${courseForm.titulo.length < 10 ? 'text-red-400' : 'text-gray-400'}`}>{courseForm.titulo.length}/100</span>
                  </div>
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
                      <input id="precio" type="number" min="0" step="1" value={courseForm.precio} onChange={(e) => { const val = e.target.value.replace(/^0+/, ''); handleWizardChange('precio', val === '' ? '' : Math.floor(Math.abs(Number(val)))); }} placeholder="45000" className={`w-full bg-gray-50 border rounded-xl pl-8 pr-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:bg-white transition-all text-[#1A3D3D] ${errors.precio ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                    </div>
                    {errors.precio && <p className="text-red-500 text-[11px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.precio}</p>}
                    {courseForm.precio > 0 && (
                      <div className="mt-3 bg-[#F4F7F7] border border-gray-200 rounded-2xl p-4 space-y-2">
                        <p className="text-[11px] font-black text-[#1A3D3D] uppercase tracking-widest mb-3">💰 Resumen por alumno inscripto</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] text-[#666666] font-medium">Precio del curso</span>
                          <span className="text-[13px] font-bold text-[#1A3D3D]">$ {Number(courseForm.precio).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] text-[#666666] font-medium">Comisión El Portal ({comision}%)</span>
                          <span className="text-[13px] font-bold text-red-500">- $ {Math.round(Number(courseForm.precio) * comision / 100).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                          <span className="text-[13px] font-black text-[#1A3D3D]">Vos recibís</span>
                          <span className="text-[15px] font-black text-[#2D6A6A]">$ {Math.round(Number(courseForm.precio) * (100 - comision) / 100).toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría *</label>
                  <select value={courseForm.categoria} onChange={(e) => handleWizardChange('categoria', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]">
                    {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
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
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Formato y Duración <span className="text-red-500">*</span></label>
                    <select value={courseForm.formatoDuracion || ''} onChange={(e) => handleWizardChange('formatoDuracion', e.target.value)} className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-base md:text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D] mb-2 ${errors.duracion ? 'border-red-400' : 'border-gray-200'}`}>
                      <option value="">Seleccioná el formato...</option>
                      <option value="charla">Charla / Webinar (horas)</option>
                      <option value="curso_clases">Curso por clases</option>
                      <option value="curso_semanas">Curso por semanas</option>
                      <option value="curso_meses">Curso por meses</option>
                      <option value="taller">Taller presencial</option>
                    </select>
                    {courseForm.formatoDuracion === 'charla' && (
                      <input type="number" min="1" max="12" value={courseForm.duracionHoras || ''} onChange={(e) => { handleWizardChange('duracionHoras', e.target.value); handleWizardChange('duracion', `Charla de ${e.target.value}hs`); }} placeholder="¿Cuántas horas dura? (ej: 3)" className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
                    )}
                    {courseForm.formatoDuracion === 'curso_clases' && (
                      <div className="flex gap-2">
                        <input type="number" min="1" value={courseForm.duracionClases || ''} onChange={(e) => { handleWizardChange('duracionClases', e.target.value); handleWizardChange('duracion', `${e.target.value} clases de ${courseForm.duracionHorasClase || '?'}hs`); }} placeholder="Cantidad de clases" className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                        <input type="number" min="1" value={courseForm.duracionHorasClase || ''} onChange={(e) => { handleWizardChange('duracionHorasClase', e.target.value); handleWizardChange('duracion', `${courseForm.duracionClases || '?'} clases de ${e.target.value}hs`); }} placeholder="Horas por clase" className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                      </div>
                    )}
                    {courseForm.formatoDuracion === 'curso_semanas' && (
                      <input type="number" min="1" max="52" value={courseForm.duracionSemanas || ''} onChange={(e) => { handleWizardChange('duracionSemanas', e.target.value); handleWizardChange('duracion', `${e.target.value} semanas`); }} placeholder="¿Cuántas semanas?" className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
                    )}
                    {courseForm.formatoDuracion === 'curso_meses' && (
                      <input type="number" min="1" max="24" value={courseForm.duracionMeses || ''} onChange={(e) => { handleWizardChange('duracionMeses', e.target.value); handleWizardChange('duracion', `${e.target.value} ${e.target.value === '1' ? 'mes' : 'meses'}`); }} placeholder="¿Cuántos meses?" className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
                    )}
                    {courseForm.formatoDuracion === 'taller' && (
                      <input type="number" min="1" max="5" value={courseForm.duracionDias || ''} onChange={(e) => { handleWizardChange('duracionDias', e.target.value); handleWizardChange('duracion', `Taller de ${e.target.value} ${e.target.value === '1' ? 'día' : 'días'}`); }} placeholder="¿Cuántos días?" className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
                    )}
                    {errors.duracion && <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.duracion}</p>}
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
                <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-1">Docentes / Instructorxs</h2>
                <p className="text-gray-500 text-base md:text-sm font-medium">Podés agregar uno o varios docentes a cargo del curso.</p>
              </div>
              <div className="space-y-6">
                {(courseForm.docentes || [{ nombre: '', bio: '', linkMas: '' }]).map((docente, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-200 relative">
                    {idx > 0 && (
                      <button type="button" onClick={() => { const docs = [...courseForm.docentes]; docs.splice(idx, 1); handleWizardChange('docentes', docs); }} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-[10px] font-black text-[#2D6A6A] uppercase tracking-widest mb-4">{idx === 0 ? 'Docente principal' : `Docente ${idx + 1}`}</p>
                    <div className="space-y-4">
                      
                      {/* INPUT DE FOTO SOLO PARA EL DOCENTE PRINCIPAL */}
                      {idx === 0 && (
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                            {courseForm.fotoDocente?.preview || courseForm.fotoDocenteUrl ? (
                              <img src={courseForm.fotoDocente?.preview || courseForm.fotoDocenteUrl} alt="Docente" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-300 font-bold text-xs">FOTO</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Foto de perfil (Opcional)</label>
                            {(courseForm.fotoDocente?.preview || courseForm.fotoDocenteUrl) ? (
                              <button type="button" onClick={() => { removeDocenteFoto(); handleWizardChange('fotoDocenteUrl', ''); }} className="text-[11px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Quitar foto
                              </button>
                            ) : (
                              <label className="cursor-pointer text-[11px] font-bold text-[#2D6A6A] hover:text-[#1A3D3D] uppercase tracking-widest flex items-center gap-1">
                                <UploadCloud className="w-4 h-4" /> Subir imagen
                                <input type="file" accept="image/*" onChange={handleDocenteFileUpload} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre completo con título <span className="text-red-500">*</span></label>
                        <input type="text" value={docente.nombre} onChange={(e) => { const docs = [...courseForm.docentes]; docs[idx].nombre = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1); handleWizardChange('docentes', docs); }} placeholder="Ej: Dr. Julián Martínez" spellCheck={true} className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.instructorNombre ? 'border-red-400' : 'border-gray-200'}`} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mini Bio <span className="text-red-500">*</span></label>
                        <textarea value={docente.bio} onChange={(e) => { const docs = [...courseForm.docentes]; docs[idx].bio = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1); handleWizardChange('docentes', docs); }} placeholder="Resumí su experiencia y especialidades..." rows="3" spellCheck={true} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] resize-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Link a más información del curso (opcional)</label>
                        <input type="url" value={docente.linkMas} onChange={(e) => { const docs = [...courseForm.docentes]; docs[idx].linkMas = e.target.value; handleWizardChange('docentes', docs); }} placeholder="https://www.suinstitucion.com" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => handleWizardChange('docentes', [...(courseForm.docentes || []), { nombre: '', bio: '', linkMas: '' }])} className="w-full py-3 border-2 border-dashed border-[#2D6A6A]/30 rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar otro docente
                </button>
              </div>

              {/* DATOS DE CONTACTO Y LOGÍSTICA */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
                <p className="text-[10px] font-black text-[#2D6A6A] uppercase tracking-widest">Datos de contacto y logística</p>

                {/* EMAIL */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email de contacto institucional <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={courseForm.email}
                    onChange={(e) => handleWizardChange('email', e.target.value)}
                    placeholder="contacto@suinstitucion.com"
                    className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.email && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>

                {/* LINK EXTERNO */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Link de la plataforma donde se dicta el curso (opcional)</label>
                  <input
                    type="url"
                    value={courseForm.linkExterno}
                    onChange={(e) => handleWizardChange('linkExterno', e.target.value)}
                    placeholder="https://zoom.us/j/... o https://www.suaula.com"
                    className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.linkExterno ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Este link solo será visible para los inscriptos una vez confirmado el pago.</p>
                  {errors.linkExterno && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.linkExterno}</p>}
                </div>

                {/* TIPO DE CURSO */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tipo de curso <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleWizardChange('tipoCurso', 'grabado')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${courseForm.tipoCurso === 'grabado' ? 'border-[#2D6A6A] bg-[#2D6A6A]/5' : 'border-gray-200 bg-white'}`}
                    >
                      <p className={`text-[12px] font-black uppercase tracking-widest ${courseForm.tipoCurso === 'grabado' ? 'text-[#2D6A6A]' : 'text-gray-400'}`}>Grabado</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">Disponible siempre, sin fecha límite</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWizardChange('tipoCurso', 'en_vivo')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${courseForm.tipoCurso === 'en_vivo' ? 'border-[#2D6A6A] bg-[#2D6A6A]/5' : 'border-gray-200 bg-white'}`}
                    >
                      <p className={`text-[12px] font-black uppercase tracking-widest ${courseForm.tipoCurso === 'en_vivo' ? 'text-[#2D6A6A]' : 'text-gray-400'}`}>En vivo</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">Tiene fecha de inicio y cierre de inscripción</p>
                    </button>
                  </div>
                </div>

                {/* DATOS DEL RESPONSABLE */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <p className="text-[10px] font-black text-[#2D6A6A] uppercase tracking-widest">Datos del responsable de la publicación</p>
                  <p className="text-[11px] text-gray-400 font-medium -mt-2">Esta información es privada y solo la usamos para verificar la identidad de quien publica.</p>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre completo <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={courseForm.responsableNombre}
                      onChange={(e) => handleWizardChange('responsableNombre', e.target.value)}
                      placeholder="Nombre y apellido de quien publica"
                      className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.responsableNombre ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.responsableNombre && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.responsableNombre}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">DNI <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={courseForm.responsableDNI}
                        onChange={(e) => handleWizardChange('responsableDNI', e.target.value.replace(/\D/g, ''))}
                        placeholder="Sin puntos"
                        maxLength={9}
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.responsableDNI ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.responsableDNI && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.responsableDNI}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Matrícula profesional <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={courseForm.responsableMatricula}
                        onChange={(e) => handleWizardChange('responsableMatricula', e.target.value)}
                        placeholder="MP / MN"
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.responsableMatricula ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.responsableMatricula && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.responsableMatricula}</p>}
                    </div>
                  </div>

                  {/* CHECKBOX TÉRMINOS */}
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-200">
                    <input
                      type="checkbox"
                      id="aceptaTerminos"
                      checked={courseForm.aceptaTerminos}
                      onChange={(e) => handleWizardChange('aceptaTerminos', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#2D6A6A] cursor-pointer shrink-0"
                    />
                    <label htmlFor="aceptaTerminos" className="text-[13px] text-[#333333] font-medium cursor-pointer leading-relaxed">
                      Declaro que los datos proporcionados son verídicos y acepto los{' '}
                      <a href="/terminos-y-condiciones" target="_blank" rel="noreferrer" className="text-[#2D6A6A] font-bold underline">
                        Términos y Condiciones
                      </a>{' '}
                      de publicación de contenido comercial de El Portal.
                    </label>
                  </div>
                  {errors.aceptaTerminos && <p className="text-red-500 text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.aceptaTerminos}</p>}
                </div>

                {/* FECHAS — solo si es en vivo */}
                {courseForm.tipoCurso === 'en_vivo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha límite de inscripción <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={courseForm.fechaInscripcion}
                        onChange={(e) => handleWizardChange('fechaInscripcion', e.target.value)}
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.fechaInscripcion ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.fechaInscripcion && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fechaInscripcion}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha de inicio del curso <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={courseForm.fechaInicio}
                        onChange={(e) => handleWizardChange('fechaInicio', e.target.value)}
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${errors.fechaInicio ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.fechaInicio && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fechaInicio}</p>}
                    </div>
                  </div>
                )}
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

          {wizardStep < 3 ? (
            <button onClick={handleNextStep} className="px-8 py-3.5 bg-[#1A3D3D] text-white font-black text-xs md:text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] rounded-xl transition-all shadow-lg flex items-center gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submitWizard} disabled={isSubmitting} className="px-8 py-3.5 bg-[#2D6A6A] text-white font-black text-xs md:text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>) : (<><ShieldCheck className="w-4 h-4" /> Enviar para revisión</>)}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  const renderMisCursos = () => {
    const misCursos = seminarios.length >= 0 ? cursosDeTodosLosEstados.filter(c => c.creadorId === currentUser?.uid) : [];

   const ESTADO_BADGE = {
      pendiente: { label: 'En revisión', clase: 'bg-yellow-100 text-yellow-700' },
      aprobado: { label: 'Publicado', clase: 'bg-green-100 text-green-700' },
      rechazado: { label: 'Necesita ajustes', clase: 'bg-red-100 text-red-600' },
      archivado: { label: 'Dado de baja', clase: 'bg-gray-100 text-gray-500' },
    };

    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[900px] mx-auto">
        <header>
          <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Repertorio
          </button>
          <h1 className="text-3xl md:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
            Mis Cursos
          </h1>
          <p className="text-[#2D6A6A] text-[11px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">
            Cursos que publicaste en El Portal ({misCursos.length})
          </p>
        </header>

        {misCursos.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-gray-100 p-16 text-center flex flex-col items-center justify-center shadow-sm">
            <BookOpen className="w-16 h-16 text-gray-100 mb-6" />
            <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-2xl mb-4">Todavía no publicaste cursos</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Compartí tu conocimiento con la comunidad veterinaria.</p>
            <button onClick={() => setView('propuesta')} className="bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#2D6A6A] transition-all shadow-lg">
              Publicar mi primer curso
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {misCursos.map(curso => {
              const badge = ESTADO_BADGE[curso.estado] || ESTADO_BADGE.pendiente;
              return (
                <div key={curso.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
                  <img src={curso.imagen} alt={curso.titulo} className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-gray-100" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px] leading-tight">{curso.titulo}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 ${badge.clase}`}>{badge.label}</span>
                    </div>
                    <p className="text-[#666666] text-[13px] font-medium">{curso.modalidad} · {curso.duracion}</p>
                    {curso.estado === 'rechazado' && curso.motivoRechazo && (
                      <p className="mt-2 text-red-500 text-[12px] font-semibold bg-red-50 px-3 py-1.5 rounded-lg inline-block">
                        Motivo: {curso.motivoRechazo}
                      </p>
                    )}
                  </div>
                 <div className="flex gap-2 shrink-0">
                    {curso.estado !== 'archivado' && (
                      <button
                        onClick={() => handleEditarMiCurso(curso)}
                        className="bg-[#F4F7F7] text-[#1A3D3D] px-5 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] hover:text-white transition-all"
                      >
                        Editar
                      </button>
                    )}
                    {curso.estado !== 'archivado' && (
                      <button
                        onClick={() => handleArchivarCurso(curso.id)}
                        className="bg-red-50 text-red-500 px-5 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                      >
                        Dar de baja
                      </button>
                    )}
                    {curso.estado === 'archivado' && (
                      <span className="px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-gray-100 text-gray-400">
                        Dado de baja
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFavoritos = () => {
    // Solo filtramos los cursos acá
    const cursosFavs = seminarios.filter(c => favoritos.includes(`curso-${c.id}`));
    const totalFavs = cursosFavs.length;

    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={() => setView('grid')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Repertorio
            </button>
            <h1 className="text-3xl md:text-4xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight uppercase leading-none">
              Cursos Guardados
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
              Explorar Capacitaciones
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {cursosFavs.length > 0 && (
              <section>
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
                        <button onClick={() => handleCourseClick(curso)} className="w-full py-3 bg-[#1A3D3D] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#2D6A6A] transition-all">Ver curso</button>
                      </div>
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


  return (
    <>
    {/* MODAL DE INSCRIPCIÓN */}
  {inscripcionModal && selectedCourse && (
    <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px]">Confirmar inscripción</h3>
            <p className="text-[#666666] text-[12px] font-medium mt-1">{selectedCourse.titulo}</p>
          </div>
          <button onClick={() => setInscripcionModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-8 py-6 space-y-5">
          {currentUser?.rol === 'clinica' && (
            <div className="bg-[#F4F7F7] rounded-xl p-4 border border-gray-200">
              <p className="text-[12px] text-[#666666] font-medium">Como institución, completá los datos de la persona que va a cursar.</p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" value={inscripcionForm.nombre} onChange={(e) => handleCambioInscripcion('nombre', e.target.value)} placeholder="Nombre y apellido" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${inscripcionErrors.nombre ? 'border-red-400' : 'border-gray-200'}`} />
            {inscripcionErrors.nombre && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{inscripcionErrors.nombre}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email de contacto <span className="text-red-500">*</span></label>
            <input type="email" value={inscripcionForm.email} onChange={(e) => handleCambioInscripcion('email', e.target.value)} placeholder="tu@email.com" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${inscripcionErrors.email ? 'border-red-400' : 'border-gray-200'}`} />
            {inscripcionErrors.email && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{inscripcionErrors.email}</p>}
          </div>
          {currentUser?.rol === 'clinica' && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <span className="text-[13px] font-bold text-[#1A3D3D]">¿La persona es veterinaria?</span>
              <button type="button" onClick={() => handleCambioInscripcion('esVeterinario', !inscripcionForm.esVeterinario)} className={`w-12 h-6 rounded-full transition-all relative ${inscripcionForm.esVeterinario ? 'bg-[#2D6A6A]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${inscripcionForm.esVeterinario ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          )}
          {inscripcionForm.esVeterinario && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Matrícula profesional <span className="text-red-500">*</span></label>
             <input type="text" value={inscripcionForm.matricula} onChange={(e) => handleCambioInscripcion('matricula', e.target.value)} placeholder="MP / MN" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D] ${inscripcionErrors.matricula ? 'border-red-400' : 'border-gray-200'}`} />
              {inscripcionErrors.matricula && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{inscripcionErrors.matricula}</p>}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Celular {currentUser?.rol === 'clinica' ? <span className="text-red-500">*</span> : <span className="text-gray-400 normal-case tracking-normal font-normal">(opcional)</span>}
            </label>
            <input type="tel" value={inscripcionForm.celular} onChange={(e) => handleCambioInscripcion('celular', e.target.value)} placeholder="Ej: 1162477744" className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" />
          </div>
          <div className="bg-[#F4F7F7] rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#666666]">Total a abonar</span>
            <span className="text-[18px] font-black text-[#1A3D3D]">${Number(selectedCourse.precio).toLocaleString('es-AR')}</span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium text-center">Al confirmar, el docente recibirá tus datos para agregarte a la plataforma del curso.</p>
        </div>
        <div className="px-8 py-6 border-t border-gray-100 flex gap-3">
          <button onClick={() => setInscripcionModal(false)} className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-[#666666] font-bold text-[12px] uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleConfirmarInscripcion} disabled={inscripcionEnviando} className="flex-1 px-6 py-3 rounded-xl bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-widest hover:bg-[#1A3D3D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {inscripcionEnviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : 'Confirmar inscripción'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* MODAL EDITOR DE IMAGEN */}
  { imagenEditorModal && (
    <div className="fixed inset-0 bg-[#1A3D3D]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px]">Ajustá la imagen de portada</h3>
          <p className="text-[#666666] text-[13px] font-medium mt-1">Usá el zoom y arrastrá para encuadrar como querés.</p>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">
          {/* Canvas editor */}
          <div
            className="relative overflow-hidden rounded-2xl border-2 border-[#2D6A6A]/30 cursor-grab active:cursor-grabbing"
            style={{ width: '100%', aspectRatio: '16/9' }}
            onMouseDown={(e) => {
              setImagenEditorDragging(true);
              setImagenEditorDragStart({ x: e.clientX - imagenEditorPos.x, y: e.clientY - imagenEditorPos.y });
            }}
            onMouseMove={(e) => {
              if (!imagenEditorDragging) return;
              setImagenEditorPos({ x: e.clientX - imagenEditorDragStart.x, y: e.clientY - imagenEditorDragStart.y });
            }}
            onMouseUp={() => setImagenEditorDragging(false)}
            onMouseLeave={() => setImagenEditorDragging(false)}
          >
            <canvas
              ref={canvasEditorRef}
              width={800}
              height={450}
              className="w-full h-full"
            />
          </div>

          {/* Control de zoom */}
          <div className="w-full flex items-center gap-4">
            <span className="text-[12px] font-bold text-[#666666] uppercase tracking-widest">Zoom</span>
            <input
              type="range"
             min="1"
              max="3"
              step="0.05"
              value={imagenEditorZoom}
              onChange={(e) => setImagenEditorZoom(Number(e.target.value))}
              className="flex-1 accent-[#2D6A6A]"
            />
            <span className="text-[13px] font-black text-[#1A3D3D] w-10 text-right">{Math.round(imagenEditorZoom * 100)}%</span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={() => { setImagenEditorModal(false); setImagenParaEditar(null); }}
            className="px-6 py-3 rounded-xl border border-gray-200 text-[#666666] font-bold text-[12px] uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarEditorImagen}
            className="px-6 py-3 rounded-xl bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-widest hover:bg-[#1A3D3D] transition-colors"
          >
            Confirmar y subir
          </button>
        </div>
      </div>
    </div>
  )}
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative">
      <main id="main-content" className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 pt-5 pb-10 md:pt-9 md:pb-16 flex-grow">
        {view === 'grid' ? renderGrid() : 
         view === 'detail' ? renderDetail() : 
         view === 'wizard' ? renderCourseWizard() : 
         view === 'propuesta' ? renderPropuesta() : 
         view === 'favoritos' ? renderFavoritos() :
         view === 'miscursos' ? renderMisCursos() :
         view === 'inscripcion-confirmada' ? (
           <div className="max-w-lg mx-auto text-center py-12 animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle className="w-10 h-10 text-green-500" />
             </div>
             <h2 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">¡Inscripción confirmada!</h2>
             <p className="text-[#666666] text-[15px] font-medium mb-6 leading-relaxed">
               Te enviamos un mail de confirmación. El docente recibirá tus datos y te contactará para sumarte a la plataforma del curso.
             </p>
             {selectedCourse && (
               <div className="bg-white rounded-2xl p-5 mb-6 text-left border border-gray-200 space-y-3">
                 <p className="text-[13px] font-black text-[#1A3D3D]">{selectedCourse.titulo}</p>
                 <p className="text-[13px] text-[#666666] font-medium">{selectedCourse.modalidad} · {selectedCourse.duracion}</p>
                 {selectedCourse.email && (
                   <p className="text-[13px] text-[#666666] font-medium flex items-center gap-2">
                     <Mail className="w-4 h-4 text-[#2D6A6A]" />
                     Contacto del docente: <span className="text-[#2D6A6A] font-bold">{selectedCourse.email}</span>
                   </p>
                 )}
                 {selectedCourse.linkExterno && (
                   <a href={selectedCourse.linkExterno} target="_blank" rel="noreferrer" className="text-[13px] text-[#2D6A6A] font-bold flex items-center gap-2 hover:underline">
                     <BookOpen className="w-4 h-4" /> Acceder al curso →
                   </a>
                 )}
               </div>
             )}
             <button onClick={() => { setView('grid'); setSelectedCourse(null); window.scrollTo(0, 0); }} className="bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-[#2D6A6A] transition-all shadow-md">
               Volver a capacitaciones
             </button>
           </div>
         ) :
         view === 'confirmacion' ? (
           <div className="max-w-lg mx-auto text-center py-8 animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShieldCheck className="w-10 h-10 text-[#2D6A6A]" />
             </div>
             <h2 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">¡Tu curso fue enviado para revisión!</h2>
             <p className="text-[#666666] text-[15px] font-medium mb-6 leading-relaxed">
               Nuestro equipo revisará tu propuesta y te contactaremos para confirmar la publicación o informarte si hay algún ajuste necesario.
             </p>
             <div className="bg-[#F4F7F7] rounded-2xl p-5 mb-8 text-left border border-gray-200">
               <p className="text-[13px] font-bold text-[#1A3D3D] mb-1">¿Qué pasa ahora?</p>
               <ul className="space-y-2 mt-3">
                 <li className="flex items-start gap-2 text-[13px] text-[#666666] font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Revisamos tu curso en menos de 48hs hábiles</li>
                 <li className="flex items-start gap-2 text-[13px] text-[#666666] font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Te enviamos un mail con la confirmación o los ajustes necesarios</li>
                 <li className="flex items-start gap-2 text-[13px] text-[#666666] font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Una vez aprobado, aparece en la cartilla de capacitaciones</li>
               </ul>
             </div>
             <button onClick={() => { setView('grid'); setWizardStep(1); setCourseForm({ titulo: '', modalidad: 'Online', precio: '', nivel: 'Principiante', duracion: '', descripcion: '', incluye: [''], docentes: [{ nombre: '', bio: '', linkMas: '' }], email: '', password: '', fotoDocente: null, imagenUrl: '', formatoDuracion: '' }); }} className="bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-[#2D6A6A] transition-all shadow-md">
          0     Volver a capacitaciones
             </button>
           </div>
         ) : null}
      </main>
    </div>
   {mostrarTourCaps && view === 'grid' && (
        <TourGuia
          pasos={PASOS_CAPS}
          userId={currentUser?.uid}
          claveStorage="capacitaciones"
          onFin={async () => {
            setMostrarTourCaps(false);
            try {
              const nuevoContador = tourCapsContador + 1;
              await updateDoc(doc(db, 'usuarios', currentUser.uid), {
                'tourVisto.capacitacionesContador': nuevoContador
              });
              setTourCapsContador(nuevoContador);
            } catch (e) {
              console.error('Error guardando contador del tour de capacitaciones:', e);
            }
          }}
        />
      )}
    </>
  );
}