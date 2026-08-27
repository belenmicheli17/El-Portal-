import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, CircleCheck, Plus, MessageCircle, 
  ChevronRight, MapPin, Check, Briefcase, Info, AlertTriangle, 
  Send, Stethoscope, GraduationCap, RotateCcw,
  Activity, User, Trash2, Mail, Loader2, ChevronLeft, 
  Filter, Clock, ChevronDown, CalendarDays, UserCheck, Building, Upload, 
  Dog, Cat, TreeDeciduous, Bird, PawPrint, Layers, Hospital
} from 'lucide-react';
import { cargarSeeds } from '../seeds'; 
import especialidadesData from '../data/especialidades.json'; 
import filtrosConfig from '../data/filtrosConfig.json';
import BarraFiltros from '../components/BarraFiltros';
import TourGuia from '../components/TourGuia';
// === IMPORTACIONES DE FIREBASE Y AUTH ===
import { db } from '../firebase'; 
import { collection, getDocs, getDoc, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // IMPORTANTE: Asegurate de exportar 'storage' desde tu firebase.js
import imageCompression from 'browser-image-compression'; // Para el paso 4
import { useAuth } from '../context/AuthContext'; 

const PROVINCIAS = filtrosConfig.provincias;
const PUESTOS_TRABAJO_CLINICA = ["Clínico General", "Guardia / Urgencias", "Especialista (Interconsulta)", "Cirujano", "Ecografista", "Enfermero / Asistente", "Pasantía / Estudiante", "Laboratorio / Comercial", "Otro"];
const EXPERIENCIA_REQUERIDA = ["Sin experiencia (Estudiantes/Junior)", "1 a 3 años (Semi-Senior)", "Más de 3 años (Senior)", "Especialista Certificado"];

export default function BolsaTrabajo() {
  // === CONTEXTO DE USUARIO ===
  const { currentUser, loading: authLoading } = useAuth();
  const userRole = currentUser?.rol || 'visitante';
  const [roleAlert, setRoleAlert] = useState(null);
  const [mostrarTourBolsa, setMostrarTourBolsa] = useState(false);


  const PASOS_BOLSA = [
    { targetId: 'tour-publicar-oferta', titulo: '📢 Publicá una oferta', desc: 'Creá ofertas laborales para encontrar al especialista que necesita tu clínica. Es gratis y dura 30 días. Podés renovarla desde "Mi Historial".', posicion: 'arriba' },
    { targetId: 'tour-disponible', titulo: '🟢 Marcate como disponible', desc: 'Activá tu disponibilidad para que las clínicas sepan que estás en búsqueda activa. Dura 30 días y podés renovarla desde "Mi Historial".', posicion: 'arriba' },
    { targetId: 'tour-ofertas-header', titulo: '🗂️ Explorá las ofertas', desc: 'Acá encontrás todas las búsquedas activas. Filtrá por especialidad, provincia o modalidad para encontrar la que mejor se adapte a vos.', posicion: 'arriba' },
  ];
  const [successModal, setSuccessModal] = useState({ show: false, title: '', message: '' });

  // === ESTADOS DE NAVEGACIÓN Y SELECCIÓN ===
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('v') || 'list';
  const [scrollPos, setScrollPos] = useState(0);

 useEffect(() => {
    if (!currentUser || view !== 'list') return;

    const fetchContador = async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
        const visto = snap.data()?.tourVisto?.bolsa || false;
        if (!visto) setTimeout(() => setMostrarTourBolsa(true), 800);
      } catch (e) {
        console.error('Error leyendo tour bolsa:', e);
      }
    };

    fetchContador();
  }, [currentUser, view]);

  // Estados para datos de Firebase
  const [ofertas, setOfertas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const setView = (newView) => {
    if (view === 'list' && newView !== 'list') {
      setScrollPos(window.scrollY);
    }
    // Clonamos los params actuales (filtros) y solo cambiamos la vista 'v'
    const params = new URLSearchParams(searchParams);
    params.set('v', newView);
    setSearchParams(params);
  };

  useEffect(() => {
    if (view === 'detail' && !selectedJob) {
      setSearchParams({ v: 'list' }, { replace: true });
      return;
    }

    if (view === 'list') {
      window.scrollTo(0, scrollPos); // Restaura el scroll donde estabas
    } else {
      window.scrollTo(0, 0); // Te manda arriba en los forms/detalles
    }
  }, [view, selectedJob, setSearchParams, scrollPos]);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('ambos'); 
  const [expandedProfId, setExpandedProfId] = useState(null); 
  
  
  const getParam = (key) => searchParams.get(key) ? searchParams.get(key).split(',') : [];

  const filtros = {
    zonas: getParam('zonas'),
    especialidades: getParam('especialidades'),
    mascotas: getParam('mascotas'),
    domicilio: searchParams.get('domicilio') === 'true',
    guardia24hs: searchParams.get('guardia24hs') === 'true'
  };
  
  const provinciasOrdenadas = PROVINCIAS;
  
  // Estados de formularios
  const [jobFormStep, setJobFormStep] = useState(1);
  const [profFormStep, setProfFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editJobId, setEditJobId] = useState(null); // NUEVO: Para saber si editamos
  const [editProfId, setEditProfId] = useState(null); // NUEVO: Para saber si editamos
  
  // === GUARDIA DE VISTAS (BLOQUEO DE ROLES) ===
  useEffect(() => {
    if ((view === 'options_job' || view === 'publish_job') && userRole !== 'clinica') {
      setRoleAlert('clinica_trying_prof'); // Reusamos tu alerta
      setView('list');
    }
    if ((view === 'options_prof' || view === 'publish_prof') && !['profesional', 'alumno'].includes(userRole)) {
      setRoleAlert('prof_trying_clinica');
      setView('list');
    }
  }, [view, userRole]);

  const [jobForm, setJobForm] = useState({
    clinica: '', provincia: 'Buenos Aires', ciudad: '', puesto: 'Clínico General', experiencia: 'Sin experiencia (Estudiantes/Junior)',
    descripcion: '', requisitos: [''], equipamiento: [''], tipoContacto: [], contactoEmail: '', contactoWhatsapp: '',
    logoFile: null 
  });
  
  const [profForm, setProfForm] = useState({
    nombre: '', 
    especialidad: [], experiencia: 'Sin experiencia (Estudiantes/Junior)', provincia: 'Buenos Aires',
    tiempo: 'Part-time', momentoDia: 'A convenir', servicios: [''], buscando: '',
    avatarFile: null 
  });

  const navigate = useNavigate();

  // Autocompletar datos en ambos forms usando la data de Firestore
  useEffect(() => {
    if (currentUser) {
      setProfForm(prev => ({
        ...prev,
        nombre: prev.nombre || currentUser?.nombre || currentUser?.displayName || ''
      }));
      setJobForm(prev => ({
        ...prev,
        clinica: prev.clinica || currentUser?.nombre || currentUser?.displayName || ''
      }));
    }
  }, [currentUser]);

  // Configuración de fuentes y scroll
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // === CARGAR DATOS DESDE FIREBASE ===
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Traemos solo los últimos 100 creados para no saturar la base de datos
        const qOfertas = query(collection(db, 'ofertasEmpleo'), orderBy('createdAt', 'desc'), limit(100));
        const qProf = query(collection(db, 'profesionalesDisponibles'), orderBy('createdAt', 'desc'), limit(100));
        
        const ofertasSnap = await getDocs(qOfertas);
        const profSnap = await getDocs(qProf);

        const ofertasData = ofertasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const profData = profSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setOfertas(ofertasData);
        setProfesionales(profData);
      } catch (error) {
        console.error("Error cargando datos de Firebase:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // === FUNCIONES DE RENOVACIÓN ===
  const renovarPublicacion = async (coleccion, id) => {
    try {
      const nuevoVencimiento = Date.now() + (30 * 24 * 60 * 60 * 1000); // +30 días
      const docRef = doc(db, coleccion, id);
      await updateDoc(docRef, { vencimientoMillis: nuevoVencimiento });

      if (coleccion === 'ofertasEmpleo') {
        setOfertas(prev => prev.map(item => item.id === id ? { ...item, vencimientoMillis: nuevoVencimiento } : item));
      } else {
        setProfesionales(prev => prev.map(item => item.id === id ? { ...item, vencimientoMillis: nuevoVencimiento } : item));
      }
      alert("¡Publicación renovada con éxito por 30 días más!");
    } catch (error) {
      console.error("Error al renovar:", error);
      alert("Hubo un error al renovar. Intentá nuevamente.");
    }
  };

  // === FUNCIONES DE FILTRADO ===
const toggleFiltro = (categoria, valor) => {
    const params = new URLSearchParams(searchParams);
    let actuales = getParam(categoria);
    
    if (actuales.includes(valor)) {
      actuales = actuales.filter(v => v !== valor);
    } else {
      actuales = [...actuales, valor];
    }

    if (actuales.length > 0) params.set(categoria, actuales.join(','));
    else params.delete(categoria);
    
    setSearchParams(params);
  };

  const limpiarFiltros = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('zonas');
    params.delete('especialidades');
    params.delete('mascotas');
    params.delete('domicilio');
    params.delete('guardia24hs');
    setSearchParams(params);
    setJobSearchTerm('');
  };

  const normalizar = (texto) => texto ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const generarSlug = (texto) => texto ? texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : "";

  const handleJobClick = (job) => { setSelectedJob(job); setView('detail'); };

  const ahora = Date.now();
  
  const ofertasActivas = ofertas.filter(job => (!job.vencimientoMillis || job.vencimientoMillis > ahora) && job.estado !== 'pausado');
  const jobsFiltrados = ofertasActivas.filter(job => {
    const matchProvincia = filtros.zonas.length === 0 || filtros.zonas.includes(job.provincia);
    const matchPuesto = filtros.especialidades.length === 0 || filtros.especialidades.some(p => job.puesto.includes(p));
    
    const term = normalizar(jobSearchTerm);
    const matchBusqueda = !jobSearchTerm || normalizar(job.puesto).includes(term) || normalizar(job.clinica).includes(term);
    
    return matchProvincia && matchPuesto && matchBusqueda;
  });

  const profesionalesActivos = profesionales.filter(prof => (!prof.vencimientoMillis || prof.vencimientoMillis > ahora) && prof.estado !== 'pausado');
  const profesionalesFiltrados = profesionalesActivos.filter(prof => {
    const matchProvincia = filtros.zonas.length === 0 || filtros.zonas.includes(prof.provincia);
    
    const especialidadArray = Array.isArray(prof.especialidad) ? prof.especialidad : [prof.especialidad];
    const especialidadString = Array.isArray(prof.especialidad) ? prof.especialidad.join(' ') : (prof.especialidad || '');
    
    const matchPuesto = filtros.especialidades.length === 0 || filtros.especialidades.some(p => especialidadArray.includes(p));
    
    const term = normalizar(jobSearchTerm);
    
    // Nueva lógica: extraemos los tags de las especialidades que tiene el profesional cruzando con el JSON
    const profTags = especialidadArray.flatMap(espName => {
      const especialidadObj = especialidadesData.find(e => e.nombre_mostrar === espName);
      return especialidadObj ? especialidadObj.tags : [];
    });
    
    const matchBusqueda = !jobSearchTerm || 
      normalizar(especialidadString).includes(term) || 
      normalizar(prof.nombre).includes(term) ||
      normalizar(prof.buscando).includes(term) ||
      profTags.some(tag => normalizar(tag).includes(term)); // ¡Busca en los tags del JSON!
      
    return matchProvincia && matchPuesto && matchBusqueda;
  });

  // Funciones Formulario Clínica
  const handleJobFormChange = (field, value) => { setJobForm(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const toggleTipoContacto = (tipo) => {
    const current = [...jobForm.tipoContacto];
    if (current.includes(tipo)) handleJobFormChange('tipoContacto', current.filter(t => t !== tipo));
    else handleJobFormChange('tipoContacto', [...current, tipo]);
  };
  const updateArrayItem = (field, index, value) => { const newArray = [...jobForm[field]]; newArray[index] = value; handleJobFormChange(field, newArray); };
  const addArrayItem = (field) => handleJobFormChange(field, [...jobForm[field], '']);
  const removeArrayItem = (field, index) => handleJobFormChange(field, jobForm[field].filter((_, i) => i !== index));

  const validateJobStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!jobForm.clinica.trim()) newErrors.clinica = 'El nombre de la clínica es obligatorio.';
      if (!jobForm.ciudad.trim()) newErrors.ciudad = 'La ciudad/localidad es obligatoria.';
    }
    if (step === 2) {
      if (!jobForm.descripcion.trim()) newErrors.descripcion = 'La descripción de la oferta es obligatoria.';
      if (jobForm.requisitos.filter(i => i.trim()).length === 0) newErrors.requisitos = 'Agregá al menos un requisito.';
    }
    if (step === 3) {
      if (jobForm.tipoContacto.length === 0) newErrors.tipoContacto = 'Debés seleccionar al menos un método de contacto.';
      if (jobForm.tipoContacto.includes('email') && !jobForm.contactoEmail.trim()) newErrors.contactoEmail = 'Ingresá el email de contacto.';
      if (jobForm.tipoContacto.includes('whatsapp') && !jobForm.contactoWhatsapp.trim()) newErrors.contactoWhatsapp = 'Ingresá el número de WhatsApp.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitJobForm = async () => {
    if (!validateJobStep(3)) return;
    setIsSubmitting(true);
    
    try {
      let logoUrlFinal = "";
      if (jobForm.logoFile) {
        const fileRef = ref(storage, `bolsa/logos/${Date.now()}_${jobForm.logoFile.name}`);
        await uploadBytes(fileRef, jobForm.logoFile);
        logoUrlFinal = await getDownloadURL(fileRef);
      } else {
        logoUrlFinal = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(jobForm.clinica)}&backgroundColor=1A3D3D`;
      }

      const vencimiento = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días desde hoy

      const nuevaOferta = {
        puesto: jobForm.puesto,
        clinica: jobForm.clinica,
        logoClinica: logoUrlFinal,
        provincia: jobForm.provincia,
        ciudad: jobForm.ciudad,
        experiencia: jobForm.experiencia,
        tipoContacto: jobForm.tipoContacto,
        contactoWhatsapp: jobForm.contactoWhatsapp,
        contactoEmail: jobForm.contactoEmail,
        descripcion: jobForm.descripcion,
        requisitos: jobForm.requisitos.filter(r => r.trim() !== ''),
        equipamiento: jobForm.equipamiento.filter(e => e.trim() !== ''),
        fechaPublicacion: "Recién publicado",
        vencimientoMillis: vencimiento,
        creadorId: currentUser?.uid || "usuario_desconocido",
        estado: "activo",
        createdAt: serverTimestamp()
      };

      if (editJobId) {
        // Actualizar existente
        delete nuevaOferta.createdAt; // No pisamos la fecha original
        await updateDoc(doc(db, 'ofertasEmpleo', editJobId), nuevaOferta);
        setOfertas(prev => prev.map(item => item.id === editJobId ? { ...item, ...nuevaOferta } : item));
      } else {
        // Crear nueva
        const docRef = await addDoc(collection(db, 'ofertasEmpleo'), nuevaOferta);
        setOfertas(prev => [{ id: docRef.id, ...nuevaOferta }, ...prev]);

        // Notificación automática para profesionales y alumnos
        await addDoc(collection(db, 'notificaciones'), {
          tipo: 'empleo',
          rolDestino: ['profesional', 'alumno'],
          clinica: nuevaOferta.clinica,
          puesto: nuevaOferta.puesto,
          ciudad: nuevaOferta.ciudad,
          provincia: nuevaOferta.provincia,
          referenciaId: docRef.id,
          fecha: serverTimestamp()
        });
      }

      setIsSubmitting(false);
      setEditJobId(null); // Limpiamos el estado
      setSuccessModal({ show: true, title: '¡Oferta Publicada!', message: 'Tu oferta de empleo ya está visible en la bolsa de trabajo por los próximos 30 días.' });
      setView('list'); 
      setJobFormStep(1); 
      setJobForm({ clinica: '', provincia: 'Buenos Aires', ciudad: '', puesto: 'Clínico General', experiencia: 'Sin experiencia (Estudiantes/Junior)', descripcion: '', requisitos: [''], equipamiento: [''], tipoContacto: [], contactoEmail: '', contactoWhatsapp: '', logoFile: null });
      window.scrollTo(0,0);

    } catch (error) {
      console.error("Error publicando oferta:", error);
      alert("Hubo un error al publicar. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  // Funciones Formulario Profesional
  const handleProfFormChange = (field, value) => { setProfForm(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const updateProfArrayItem = (index, value) => { const newArray = [...profForm.servicios]; newArray[index] = value; handleProfFormChange('servicios', newArray); };
  const addProfArrayItem = () => handleProfFormChange('servicios', [...profForm.servicios, '']);
  const removeProfArrayItem = (index) => handleProfFormChange('servicios', profForm.servicios.filter((_, i) => i !== index));

  const validateProfStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!profForm.nombre.trim()) newErrors.nombre = 'Tu nombre completo es obligatorio.';
      if (!profForm.especialidad || profForm.especialidad.length === 0) newErrors.especialidad = 'Debés seleccionar al menos una especialidad.';
    }
    if (step === 2) {
      if (!profForm.buscando.trim()) newErrors.buscando = 'Contanos brevemente qué estás buscando.';
      if (profForm.servicios.filter(i => i.trim()).length === 0) newErrors.servicios = 'Agregá al menos un servicio/disposición.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitProfForm = async () => {
    if (!validateProfStep(2)) return;
    setIsSubmitting(true);
    
    try {
      let avatarUrlFinal = currentUser?.photoURL || "";
      if (profForm.avatarFile) {
        const fileRef = ref(storage, `bolsa/avatars/${Date.now()}_${profForm.avatarFile.name}`);
        await uploadBytes(fileRef, profForm.avatarFile);
        avatarUrlFinal = await getDownloadURL(fileRef);
      } else if (!avatarUrlFinal) {
        avatarUrlFinal = `https://ui-avatars.com/api/?name=${encodeURIComponent(profForm.nombre)}&background=F4F7F7&color=1A3D3D`;
      }

      const vencimiento = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días desde hoy

      const nuevoProfesional = {
        nombre: profForm.nombre,
        especialidad: profForm.especialidad,
        provincia: profForm.provincia,
        experiencia: profForm.experiencia,
        tiempo: profForm.tiempo,
        momentoDia: profForm.momentoDia,
        servicios: profForm.servicios.filter(s => s.trim() !== ''),
        buscando: profForm.buscando,
        avatar: avatarUrlFinal,
        vencimientoMillis: vencimiento,
        creadorId: currentUser?.uid || "usuario_desconocido",
        estado: "activo",
        createdAt: serverTimestamp()
      };

      if (editProfId) {
        // Actualizamos existente
        delete nuevoProfesional.createdAt;
        await updateDoc(doc(db, 'profesionalesDisponibles', editProfId), nuevoProfesional);
        setProfesionales(prev => prev.map(item => item.id === editProfId ? { ...item, ...nuevoProfesional } : item));
      } else {
        // Creamos nuevo
        const docRef = await addDoc(collection(db, 'profesionalesDisponibles'), nuevoProfesional);
        setProfesionales(prev => [{ id: docRef.id, ...nuevoProfesional }, ...prev]);

        // Notificación automática para clínicas
        const especialidades = Array.isArray(nuevoProfesional.especialidad) 
          ? nuevoProfesional.especialidad.join(', ') 
          : nuevoProfesional.especialidad;
        await addDoc(collection(db, 'notificaciones'), {
          tipo: 'profesional_disponible',
          rolDestino: ['clinica'],
          nombre: nuevoProfesional.nombre,
          especialidad: nuevoProfesional.especialidad,
          tiempo: nuevoProfesional.tiempo,
          provincia: nuevoProfesional.provincia,
          referenciaId: docRef.id,
          fecha: serverTimestamp()
        });
      }

      setIsSubmitting(false);
      setEditProfId(null); // Limpiamos el estado
      setSuccessModal({ show: true, title: editProfId ? '¡Perfil Actualizado!' : '¡Perfil Publicado!', message: 'Tu perfil de disponibilidad ya está visible para todas las clínicas de la red por 30 días.' });
      setView('list'); 
      setProfFormStep(1); 
      setProfForm({ nombre: currentUser?.displayName || '', especialidad: [], experiencia: 'Sin experiencia (Estudiantes/Junior)', provincia: 'Buenos Aires', tiempo: 'Part-time', momentoDia: 'A convenir', servicios: [''], buscando: '', avatarFile: null });
      window.scrollTo(0,0);

    } catch (error) {
      console.error("Error publicando perfil:", error);
      alert("Hubo un error al publicar. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // CONTROL DE ACCESO (GUARDIÁN)
  // =========================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#2D6A6A] animate-spin mb-4" />
        <p className="text-[#666666] font-medium">Verificando accesos...</p>
      </div>
    );
  }

  const rolesPermitidos = ['clinica', 'profesional', 'alumno'];
  if (!currentUser || !rolesPermitidos.includes(userRole)) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-[24px] font-black font-['Montserrat'] text-[#1A3D3D] mb-2">Acceso Restringido</h2>
        <p className="text-[#666666] font-medium text-center max-w-md">
          Esta sección es exclusiva para clínicas verificadas, profesionales y alumnos. Iniciá sesión con una cuenta autorizada para acceder a la Bolsa de Trabajo.
        </p>
      </div>
    );
  }

  // =========================================================
  // RENDER: HISTORIAL
  // =========================================================
  const renderHistorial = () => {
    const misOfertas = ofertas.filter(o => o.creadorId === currentUser?.uid);
    const misPerfiles = profesionales.filter(p => p.creadorId === currentUser?.uid);

    return (
      <article className="max-w-[800px] mx-auto animate-in fade-in duration-500 pb-24 px-4 pt-8 md:pt-12">
        <button 
          onClick={() => setView('list')} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a la Bolsa
        </button>

        <div className="mb-10">
          <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">Mi Historial</h1>
          <p className="text-[#666666] text-[15px] font-medium">Gestioná tus publicaciones activas y renová las que caducaron.</p>
        </div>

        <div className="space-y-8">
          {/* VISTA SOLO PARA CLÍNICAS */}
          {userRole === 'clinica' && (
            <section>
              <h2 className="text-[18px] font-bold text-[#1A3D3D] flex items-center gap-2 mb-4 border-b border-gray-100 pb-2"><Building className="w-5 h-5 text-[#2D6A6A]" /> Mis Ofertas de Empleo</h2>
              <div className="space-y-4">
                {misOfertas.length > 0 ? misOfertas.map(job => {
                  const estaVencido = job.vencimientoMillis && job.vencimientoMillis < ahora;
                  return (
                    <div key={job.id} className="bg-white rounded-[24px] p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden text-left">
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${estaVencido ? 'bg-red-400' : 'bg-[#2D6A6A]'}`}></div>
                      
                      <div className="flex flex-col sm:flex-row gap-5 mb-2">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 p-2.5 shrink-0 hidden sm:block">
                          {job.logoClinica ? <img src={job.logoClinica} alt={job.clinica} className="w-full h-full object-contain rounded-xl" /> : <Building className="w-full h-full text-gray-300 p-2" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md ${estaVencido ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
                              {estaVencido ? 'Vencido / Oculto' : 'Activo y Visible'}
                            </span>
                            <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.provincia}</span>
                          </div>
                          <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] leading-tight mb-1">{job.puesto}</h3>
                          <p className="text-[#666666] text-[14px] md:text-[15px] font-medium mb-3">{job.clinica}</p>
                          
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-4 border-t border-gray-50">
                            <div className="flex gap-2">
                              <span className="bg-[#F4F7F7] text-[#333333] text-[12px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#2D6A6A]" /> {job.experiencia}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-50">
                        <button 
                          onClick={() => renovarPublicacion('ofertasEmpleo', job.id)}
                          className="flex-1 bg-[#2D6A6A] text-white px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" /> Renovar directo
                        </button>
                        <button 
                          onClick={() => { 
                            setJobForm({ 
                              clinica: job.clinica || '', provincia: job.provincia || 'Buenos Aires', ciudad: job.ciudad || '', 
                              puesto: job.puesto || '', experiencia: job.experiencia || 'Sin experiencia (Estudiantes/Junior)', 
                              descripcion: job.descripcion || '', requisitos: job.requisitos?.length ? job.requisitos : [''], 
                              equipamiento: job.equipamiento?.length ? job.equipamiento : [''], tipoContacto: job.tipoContacto || [], 
                              contactoEmail: job.contactoEmail || '', contactoWhatsapp: job.contactoWhatsapp || '', logoFile: null 
                            });
                            setEditJobId(job.id); // <--- AGREGAMOS ESTO
                            setErrors({}); setView('publish_job'); window.scrollTo(0,0); 
                          }}
                          className="flex-1 bg-white border-2 border-gray-200 text-[#666666] px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-[#1A3D3D] hover:text-[#1A3D3D] transition-all flex items-center justify-center gap-2"
                        >
                          Editar y renovar
                        </button>
                      </div>
                    </div>
                  );
                }) : <p className="text-[#666666] text-[13px] italic bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">No publicaste ofertas de clínica aún.</p>}
              </div>
            </section>
          )}

          {/* VISTA SOLO PARA PROFESIONALES / ALUMNOS */}
          {['profesional', 'alumno'].includes(userRole) && (
            <section>
              <h2 className="text-[18px] font-bold text-[#1A3D3D] flex items-center gap-2 mb-4 border-b border-gray-100 pb-2"><UserCheck className="w-5 h-5 text-[#2D6A6A]" /> Mi Perfil Profesional</h2>
              <div className="space-y-4">
                {misPerfiles.length > 0 ? misPerfiles.map(prof => {
                  const estaVencido = prof.vencimientoMillis && prof.vencimientoMillis < ahora;
                  return (
                    <div key={prof.id} className="bg-white rounded-[24px] p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden text-left">
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${estaVencido ? 'bg-red-400' : 'bg-[#2D6A6A]'}`}></div>
                      
                      <div className="flex gap-4 items-start mb-2">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 shadow-sm shrink-0 overflow-hidden relative">
                          {prof.avatar ? <img src={prof.avatar} alt={prof.nombre} className="w-full h-full object-cover" /> : <User className="w-full h-full text-gray-300 p-4" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] leading-tight">{prof.nombre}</h3>
                              <span className={`hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${estaVencido ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
                                {estaVencido ? 'Vencido' : 'Activo'}
                              </span>
                            </div>
                            <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5" /> {prof.provincia}</span>
                          </div>
                          <span className={`sm:hidden inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md mb-2 ${estaVencido ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
                            {estaVencido ? 'Vencido' : 'Activo'}
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1 mb-3">
                            {Array.isArray(prof.especialidad) ? prof.especialidad.map((esp, idx) => (
                              <span key={idx} className="bg-[#F4F7F7] text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#2D6A6A]/10">{esp}</span>
                            )) : <span className="bg-[#F4F7F7] text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#2D6A6A]/10">{prof.especialidad}</span>}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                            <div className="flex gap-4 text-[12px] font-medium text-[#666666]">
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {prof.tiempo}</span>
                              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {prof.momentoDia}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-50">
                        <button 
                          onClick={() => renovarPublicacion('profesionalesDisponibles', prof.id)}
                          className="flex-1 bg-[#2D6A6A] text-white px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" /> Renovar directo
                        </button>
                        <button 
                          onClick={() => { 
                            setProfForm({ 
                              nombre: prof.nombre || '', especialidad: Array.isArray(prof.especialidad) ? prof.especialidad : [prof.especialidad], 
                              experiencia: prof.experiencia || 'Sin experiencia (Estudiantes/Junior)', provincia: prof.provincia || 'Buenos Aires', 
                              tiempo: prof.tiempo || 'Part-time', momentoDia: prof.momentoDia || 'A convenir', 
                              servicios: prof.servicios?.length ? prof.servicios : [''], buscando: prof.buscando || '', avatarFile: null 
                            });
                            setEditProfId(prof.id); // <--- AGREGAMOS ESTO
                            setErrors({}); setView('publish_prof'); window.scrollTo(0,0); 
                          }}
                          className="flex-1 bg-white border-2 border-gray-200 text-[#666666] px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-[#1A3D3D] hover:text-[#1A3D3D] transition-all flex items-center justify-center gap-2"
                        >
                          Editar y renovar
                        </button>
                      </div>
                    </div>
                  );
                }) : <p className="text-[#666666] text-[13px] italic bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">No marcaste disponibilidad como profesional aún.</p>}
              </div>
            </section>
          )}
        </div>
      </article>
    );
  };

  // =========================================================
  // RENDER: 1. LISTA DE EMPLEOS
  // =========================================================
  const renderList = () => (
    <div className="flex flex-col animate-in fade-in duration-500 pb-24 relative">
      
      {/* BURBUJAS DE FONDO LIBRES HERO*/}
      <section className="relative bg-white pt-16 pb-20 overflow-hidden rounded-b-[40px] md:rounded-b-[60px] shadow-[0_10px_30px_rgba(26,61,61,0.05)] z-10 text-center">
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#4DB6AC]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[0%] left-[-10%] w-[500px] h-[500px] bg-[#4DB6AC]/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute top-[10%] right-[-10%] w-[550px] h-[550px] bg-[#1A3D3D]/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center px-4">
          <Briefcase className="w-10 h-10 text-[#1A3D3D] mb-6 relative z-10" />
          
          <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tighter leading-none mb-4">
            Bolsa de Trabajo
          </h1>
          <p className="text-[#666666] text-[14px] md:text-[16px] font-medium mb-8 max-w-lg mx-auto leading-relaxed">
            La red de empleo exclusiva para profesionales veterinarios. Conectá con tu próximo desafío o encontrá al especialista ideal para tu clínica.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center flex-wrap">
            <button 
              id="tour-publicar-oferta"
              onClick={() => { 
                setView('options_job'); window.scrollTo(0,0); 
              }}
              className="w-full sm:w-auto bg-[#1A3D3D] text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] hover:-translate-y-1 shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
            >
              <Building className="w-4 h-4" /> Publicar Oferta
            </button>
            <button 
              id="tour-disponible"
              onClick={() => { 
                if (['profesional', 'alumno'].includes(userRole)) {
                  setView('options_prof'); window.scrollTo(0,0); 
                } else {
                  setRoleAlert('clinica_trying_prof');
                }
              }}
              className="w-full sm:w-auto bg-white border-2 border-gray-100 text-[#1A3D3D] px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-[#4DB6AC]/50 hover:text-[#2D6A6A] hover:-translate-y-1 shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Marcarme Disponible
            </button>
          </div>
        </div>
      </section>

{/* BARRA DE BÚSQUEDA GLOBAL COMPONENTIZADA */}
      <div className="-mt-10 relative z-30">
        <BarraFiltros 
          tabs={[
            { id: 'ambos', label: 'Todos', icon: Layers },
            { id: 'profesionales', label: 'Especialistas', icon: Stethoscope },
            { id: 'ofertas', label: 'Clínicas', icon: Hospital }
          ]}
          activeTab={searchTarget}
          setActiveTab={setSearchTarget}
          searchPlaceholder="Buscar especialidad o clínica..."
          searchTerm={jobSearchTerm}
          setSearchTerm={setJobSearchTerm}
          showModalidad={true}
        />
      </div>

      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-20 mt-10">
           <Loader2 className="w-10 h-10 text-[#2D6A6A] animate-spin mb-4" />
           <p className="text-[#666666] font-medium">Cargando bolsa de trabajo...</p>
        </div>
      ) : (
       <div className={`grid gap-8 lg:gap-10 mt-10 px-6 md:px-12 lg:px-24 xl:px-32 relative z-10 ${searchTarget === 'ambos' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-4xl mx-auto w-full'}`}>
         <div id="tour-ofertas-header" className="absolute top-0 left-6 right-6 md:left-12 md:right-12 lg:left-24 lg:right-24 xl:left-32 xl:right-32 pointer-events-none" style={{ height: '250px' }} />
         
         {/* Columna Izquierda: Instituciones Buscando */}
         {(searchTarget === 'ambos' || searchTarget === 'ofertas') && (
           <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between border-b border-gray-200 pb-3">
               <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[14px] uppercase tracking-widest flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#2D6A6A] hidden sm:block" /> Ofertas de Clínicas
               </h2>
               <span className="bg-[#F4F7F7] text-[#1A3D3D] text-[11px] font-bold px-2.5 py-1 rounded-md">{jobsFiltrados.length}</span>
             </div>
             
             {jobsFiltrados.length > 0 ? jobsFiltrados.map((job, jobIndex) => (
              <article 
                key={job.id} 
                onClick={() => handleJobClick(job)} 
                className="bg-white rounded-[24px] p-5 md:p-6 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] transition-all duration-300 ease-in-out cursor-pointer flex flex-col sm:flex-row gap-5 group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 p-2.5 shrink-0 hidden sm:block">
                  <img src={job.logoClinica} alt={job.clinica} className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-[#F4F7F7] text-[#666666] text-[12px] font-semibold px-3 py-1.5 rounded-lg">{job.fechaPublicacion || "Reciente"}</span>
                    <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.provincia}</span>
                  </div>
                  <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] group-hover:text-[#2D6A6A] transition-colors leading-tight mb-1">{job.puesto}</h3>
                  <p className="text-[#666666] text-[14px] md:text-[15px] font-medium mb-3">{job.clinica}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-4 border-t border-gray-50">
                    <div className="flex gap-2">
                      <span className="bg-[#F4F7F7] text-[#333333] text-[12px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#2D6A6A]" /> {job.experiencia}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                    <ChevronRight className="w-6 h-6 text-[#666666]/30 group-hover:text-[#2D6A6A] group-hover:translate-x-1 transition-all" />
                </div>
              </article>
             )) : (
               <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
                  <div className="w-16 h-16 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                    <Building className="w-8 h-8 text-[#2D6A6A]/50" />
                  </div>
                  <h3 className="text-[#1A3D3D] text-[18px] font-bold font-['Montserrat'] mb-2">No encontramos ofertas</h3>
                  <p className="text-[#666666] text-[14px] font-medium mb-6 max-w-sm">Intentá ajustar los filtros o buscar con otros términos para ver más resultados.</p>
                  <button onClick={limpiarFiltros} className="bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Limpiar todos los filtros</button>
               </div>
             )}
           </section>
         )}

         {/* Columna Derecha: Profesionales Disponibles */}
         {(searchTarget === 'ambos' || searchTarget === 'profesionales') && (
           <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
             <div id="tour-ofertas-header" className="flex items-center justify-between border-b border-gray-200 pb-3">
               <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[14px] uppercase tracking-widest flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#1A3D3D] hidden sm:block" /> Profesionales Disponibles
               </h2>
               <span className="bg-green-50 text-green-600 text-[11px] font-bold px-2.5 py-1 rounded-md">{profesionalesFiltrados.length}</span>
             </div>

             {profesionalesFiltrados.length > 0 ? profesionalesFiltrados.map(prof => {
               const isExpanded = expandedProfId === prof.id;
               return (
               <article 
                 key={prof.id} 
                 onClick={() => setExpandedProfId(isExpanded ? null : prof.id)}
                 className={`bg-white rounded-[24px] p-5 md:p-6 border transition-all duration-300 ease-in-out cursor-pointer group flex flex-col h-full ${
                   isExpanded 
                     ? 'border-[#2D6A6A] shadow-md ring-2 ring-[#2D6A6A]/5' 
                     : 'border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)]'
                 }`}
               >
                 <div className="flex gap-4 items-start">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 shadow-sm shrink-0 overflow-hidden relative">
                     <img src={prof.avatar} alt={prof.nombre} className="w-full h-full object-cover" />
                     <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10 animate-pulse" title="Disponible"></div>
                   </div>
                   
                   <div className="flex-1 pt-1">
                     <div className="flex items-center justify-between mb-1">
                       <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] leading-tight">{prof.nombre}</h3>
                       <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5" /> {prof.provincia}</span>
                     </div>
                     <div className="flex flex-wrap gap-2 mt-1 mb-3">
                       {Array.isArray(prof.especialidad) ? prof.especialidad.map((esp, idx) => (
                         <span key={idx} className="bg-[#F4F7F7] text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#2D6A6A]/10">
                           {esp}
                         </span>
                       )) : (
                         <span className="bg-[#F4F7F7] text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#2D6A6A]/10">
                           {prof.especialidad}
                         </span>
                       )}
                     </div>
                     
                     <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                       <div className="flex gap-4 text-[12px] font-medium text-[#666666]">
                         <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {prof.tiempo}</span>
                         <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {prof.momentoDia}</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Contenido Expandible (Acordeón) */}
                 <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                    <div className="overflow-hidden">
                      <div className="bg-[#F4F7F7] rounded-[24px] p-5 border border-gray-100">
                         <p className="text-[#1A3D3D] text-[12px] font-bold mb-3 flex items-center gap-1.5 uppercase tracking-widest"><Activity className="w-4 h-4 text-[#4DB6AC]"/> Servicios Ofrecidos</p>
                         <div className="flex flex-wrap gap-2 mb-5">
                           {prof.servicios.map((s, idx) => (
                             <span key={idx} className="bg-white border border-gray-200 text-[#333333] text-[12px] font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                               <CircleCheck className="w-4 h-4 text-[#2D6A6A]" /> {s}
                             </span>
                           ))}
                         </div>
                         
                         <div className="relative">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2D6A6A] rounded-full"></div>
                           <p className="text-[#666666] text-[15px] italic bg-white p-5 rounded-2xl border border-gray-100 pl-6 shadow-sm">"{prof.buscando}"</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/profesional/${prof.slug || generarSlug(prof.nombre)}`); 
                          }}
                          className="flex-1 bg-white border-2 border-[#2D6A6A] text-[#2D6A6A] px-4 py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 ease-in-out hover:bg-[#F4F7F7] hover:-translate-y-1 shadow-sm flex items-center justify-center gap-2 group/btn"
                        >
                          <User className="w-4 h-4" /> Ver perfil
                        </button>
                        
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/mensajes/nuevo/${prof.creadorId}`); 
                          }}
                          className="flex-1 bg-[#2D6A6A] text-white px-4 py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl shadow-md flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" /> Contactar
                        </button>
                      </div>
                    </div>
                 </div>
                 
                 <div className={`flex justify-center transition-all duration-300 ${isExpanded ? 'mt-5 border-t border-gray-50 pt-4' : 'mt-4'}`}>
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-[#2D6A6A]' : 'text-[#666666]/50 group-hover:text-[#2D6A6A]'}`}>
                      {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </span>
                 </div>
               </article>
               );
             }) : (
               <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
                  <div className="w-16 h-16 bg-[#F4F7F7] rounded-full flex items-center justify-center mb-5">
                    <UserCheck className="w-8 h-8 text-[#2D6A6A]/50" />
                  </div>
                  <h3 className="text-[#1A3D3D] text-[18px] font-bold font-['Montserrat'] mb-2">No encontramos profesionales</h3>
                  <p className="text-[#666666] text-[14px] font-medium mb-6 max-w-sm">Intentá ajustar los filtros o buscar con otros términos para ver más resultados.</p>
                  <button onClick={limpiarFiltros} className="bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Limpiar todos los filtros</button>
               </div>
             )}
           </section>
         )}
       </div>
      )}
    </div>
  );

  // =========================================================
  // RENDER: 2. DETALLE DE EMPLEO
  // =========================================================
  const renderDetail = () => {
    if (!selectedJob) return null;
    return (
      <article className="max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-24 px-4 pt-8 md:pt-12">
        <button 
          onClick={() => setView('list')} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a la Bolsa de Trabajo
        </button>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden mb-12 relative">
          <div className="bg-[#F4F7F7] p-8 md:p-12 border-b border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2D6A6A]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[24px] border border-gray-100 shadow-sm p-3 shrink-0 z-10">
               <img src={selectedJob.logoClinica} alt={selectedJob.clinica} className="w-full h-full object-contain rounded-xl" />
             </div>
             <div className="flex-1 z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white border border-gray-200 text-[#666666] text-[12px] font-semibold px-3 py-1.5 rounded-lg">{selectedJob.fechaPublicacion || "Reciente"}</span>
                  <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedJob.ciudad}, {selectedJob.provincia}</span>
                </div>
                <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] leading-[1.1] mb-2 tracking-tight">
                  {selectedJob.puesto}
                </h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <p 
                    onClick={() => { window.scrollTo(0,0); navigate(`/clinica/${selectedJob.slug || generarSlug(selectedJob.clinica)}`); }}
                    className="text-[17px] text-[#2D6A6A] font-bold hover:underline cursor-pointer transition-all"
                  >
                    {selectedJob.clinica}
                  </p>
                  <button 
                    onClick={() => { window.scrollTo(0,0); navigate(`/clinica/${selectedJob.slug || generarSlug(selectedJob.clinica)}`); }}
                    className="bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Building className="w-3 h-3" /> Ver Perfil de Clínica
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-bold text-[#333333] shadow-sm">
                    <GraduationCap className="w-4 h-4 text-[#2D6A6A]" /> {selectedJob.experiencia}
                  </div>
                  {selectedJob.requisitos && selectedJob.requisitos.some(r => r.toLowerCase().includes('matrícula')) && (
                    <div className="bg-[#2D6A6A]/10 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-bold text-[#1A3D3D]">
                      <CircleCheck className="w-4 h-4 text-[#2D6A6A]" /> Requiere Matrícula Activa
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12 flex flex-col lg:flex-row gap-12 lg:gap-16">
            <div className="flex-1 space-y-12">
              <section>
                <h3 className="text-[22px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-5">Descripción del puesto</h3>
                <p className="text-[#333333] text-[16px] leading-relaxed font-medium whitespace-pre-line">
                  {selectedJob.descripcion}
                </p>
              </section>
              
              <section>
                <h3 className="text-[22px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-5 flex items-center gap-2">
                  <CircleCheck className="w-6 h-6 text-[#4DB6AC]" /> Requisitos excluyentes
                </h3>
                <ul className="space-y-4">
                  {selectedJob.requisitos && selectedJob.requisitos.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A3D3D] mt-2.5 shrink-0"></span>
                      <span className="text-[16px] text-[#333333] font-medium leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {selectedJob.equipamiento && selectedJob.equipamiento.length > 0 && selectedJob.equipamiento[0] !== '' && (
                <section className="bg-[#F4F7F7] p-8 rounded-[32px] border border-gray-100">
                  <h3 className="text-[18px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-5 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[#2D6A6A]" /> Equipamiento en clínica
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedJob.equipamiento.map((eq, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 text-[#333333] text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm">
                        {eq}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="lg:w-[320px] shrink-0">
              <div className="bg-[#1A3D3D] p-8 rounded-[32px] shadow-2xl text-center relative overflow-hidden sticky top-32">
                 <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-white opacity-5 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
                 <h3 className="font-['Montserrat'] font-black text-white text-[22px] mb-2 relative z-10">Postularme ahora</h3>
        
                 
                 <div className="space-y-4 relative z-10">
                  
                 {selectedJob.tipoContacto && selectedJob.tipoContacto.includes('whatsapp') && (
                      <button 
                        onClick={() => {
                          const num = selectedJob.contactoWhatsapp.replace(/[^0-9]/g, '');
                          const baseUrl = 'https://www.portalveterinario.ar'; 
                          
                          // Intentamos usar el slug si existe en el context. Si no, lo creamos limpiando el nombre (ej: "Mercedes Arenas" -> "mercedes-arenas")
                          const userSlug = currentUser.slug || (
                            currentUser.displayName 
                              ? currentUser.displayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') 
                              : currentUser.uid
                          );

                          const miPerfilUrl = `${baseUrl}/profesional/${userSlug}`;
                          const text = encodeURIComponent(`Hola, vi su oferta en El Portal para el puesto de ${selectedJob.puesto}. Podés ver mi perfil acá: ${miPerfilUrl}`);
                          window.open(`https://wa.me/${num}?text=${text}`, '_blank');
                        }}
                        className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg hover:bg-[#20bd5a] hover:-translate-y-1 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" /> Enviar cv por WhatsApp
                      </button>
                    )}
                 {/* BOTON DE EMAIL OCULTO TEMPORALMENTE
                  {selectedJob.tipoContacto && selectedJob.tipoContacto.includes('email') && (
                      <a 
                        href={`mailto:${selectedJob.contactoEmail}?subject=${encodeURIComponent('Postulación: ' + selectedJob.puesto + ' - El Portal')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white text-[#1A3D3D] py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Enviar CV por Mail
                      </a>
                    )}
                                         */}

                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-white/10 text-left">
                   <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
                     <Info className="w-3.5 h-3.5" /> Condiciones
                   </p>
                   <p className="text-white/70 text-[13px] font-medium leading-relaxed">
                     Las condiciones económicas y contractuales se arreglan directamente por privado entre el profesional y la clínica.
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#F4F7F7] border border-gray-200 p-8 rounded-[32px] flex items-start gap-4 mb-12 text-[#666666] text-[14px] font-medium leading-relaxed">
          <AlertTriangle className="w-6 h-6 text-[#2D6A6A] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#1A3D3D]">Aviso Legal:</strong> El Portal actúa exclusivamente como un canal de difusión gratuito para ofertas laborales de terceros. No intervenimos en el proceso de selección, contratación, negociación salarial ni somos responsables de las condiciones laborales acordadas. Toda postulación se realiza bajo la exclusiva responsabilidad del profesional y la institución oferente.
          </p>
        </div>
      </article>
    );
  };

  // =========================================================
  // RENDER: 3. FORMULARIO DE PUBLICACIÓN DE EMPLEO (CLÍNICA)
  // =========================================================
  const renderPublishJobForm = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 pt-8 md:pt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => { setView('list'); setJobFormStep(1); setErrors({}); }} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancelar publicación
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-4">Publicar Oferta Laboral</h1>
        <p className="text-[#666666] font-medium text-[16px] max-w-lg mx-auto leading-relaxed">La difusión en El Portal es <strong className="text-[#2D6A6A] font-bold">100% gratuita</strong> para instituciones veterinarias con cuenta validada.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-[#F4F7F7] border-b border-gray-100 py-10 px-6 md:px-12 relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute top-[20px] md:top-[24px] left-[15%] right-[15%] h-1 bg-gray-200 rounded-full z-0 hidden md:block">
              <div className="absolute top-0 left-0 h-full bg-[#2D6A6A] rounded-full transition-all duration-500 ease-in-out" style={{ width: `${((jobFormStep - 1) / 2) * 100}%` }}></div>
            </div>

            <div className="relative z-10 flex justify-between items-start">
              {[1, 2, 3].map((step) => {
                const isActive = jobFormStep === step;
                const isCompleted = jobFormStep > step;
                return (
                  <div key={step} onClick={() => { if(isCompleted) setJobFormStep(step); }} className={`flex flex-col items-center gap-3 w-24 md:w-32 ${isCompleted ? 'cursor-pointer group' : ''}`}>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-[14px] md:text-[16px] transition-all duration-300 z-10 ${
                      isActive ? 'bg-[#1A3D3D] text-white shadow-[0_4px_12px_rgba(26,61,61,0.3)] scale-110 border-[4px] border-[#F4F7F7]' : 
                      isCompleted ? 'bg-[#2D6A6A] text-white border-[4px] border-[#F4F7F7]' : 'bg-white border-[2px] border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} /> : step}
                    </div>
                    <span className={`text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black text-center ${isActive || isCompleted ? 'text-[#1A3D3D]' : 'text-gray-400'}`}>
                      {step === 1 ? 'Clínica' : step === 2 ? 'Puesto' : 'Contacto'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {jobFormStep === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Datos de la Institución</h2>
              
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-[#F4F7F7] border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {jobForm.logoFile ? (
                      <img src={URL.createObjectURL(jobForm.logoFile)} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-gray-400" />
                    )}
                 </div>
                 <div>
                    <label className="cursor-pointer bg-white border border-gray-200 text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Subir Logo (Opcional)
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
                            try {
                              const compressedFile = await imageCompression(file, options);
                              handleJobFormChange('logoFile', compressedFile);
                            } catch (error) {
                              console.log("Error comprimiendo:", error);
                              handleJobFormChange('logoFile', file);
                            }
                          }
                        }} 
                      />
                    </label>
                    <p className="text-[11px] text-[#666666] mt-2">Si no subís nada, usaremos las iniciales.</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3" htmlFor="clinica">Nombre de la Clínica / Hospital *</label>
                  <input id="clinica" type="text" value={jobForm.clinica} onChange={(e) => handleJobFormChange('clinica', e.target.value)} placeholder="Ej: Hospital Veterinario Norte" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.clinica ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.clinica && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.clinica}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Provincia *</label>
                    <select value={jobForm.provincia} onChange={(e) => handleJobFormChange('provincia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 focus:bg-white text-[#333333] transition-all">
                      {PROVINCIAS.filter(p=>p!=='Todas').map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3" htmlFor="ciudad">Ciudad / Zona *</label>
                    <input id="ciudad" type="text" value={jobForm.ciudad} onChange={(e) => handleJobFormChange('ciudad', e.target.value)} placeholder="Ej: San Isidro / Zona Norte" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.ciudad ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                    {errors.ciudad && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.ciudad}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
          {jobFormStep === 2 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Detalles de la Búsqueda</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Puesto o Área *</label>
                    <select value={jobForm.puesto} onChange={(e) => handleJobFormChange('puesto', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 focus:bg-white text-[#333333] transition-all">
                      {especialidadesData.map(m => <option key={m.id} value={m.nombre_mostrar}>{m.nombre_mostrar}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Experiencia Requerida *</label>
                    <select value={jobForm.experiencia} onChange={(e) => handleJobFormChange('experiencia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 focus:bg-white text-[#333333] transition-all">
                      {EXPERIENCIA_REQUERIDA.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Descripción del Puesto *</label>
                  <textarea value={jobForm.descripcion} onChange={(e) => handleJobFormChange('descripcion', e.target.value)} rows="4" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] resize-none transition-all ${errors.descripcion ? 'border-red-400' : 'border-gray-200'}`}></textarea>
                  {errors.descripcion && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.descripcion}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Requisitos Excluyentes *</label>
                  <div className="space-y-3">
                    {jobForm.requisitos.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="text" value={item} onChange={(e) => updateArrayItem('requisitos', index, e.target.value)} className="flex-1 bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#333333]" />
                        {jobForm.requisitos.length > 1 && <button onClick={() => removeArrayItem('requisitos', index)} className="p-3.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    ))}
                    <button onClick={() => addArrayItem('requisitos')} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mt-3 hover:bg-[#2D6A6A]/10 px-5 py-3 rounded-2xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Agregar requisito</button>
                    {errors.requisitos && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.requisitos}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3 flex items-center gap-2">Equipamiento <span className="text-[#666666]/50 font-medium lowercase tracking-normal">(Opcional)</span></label>
                  <div className="space-y-3">
                    {jobForm.equipamiento.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="text" value={item} onChange={(e) => updateArrayItem('equipamiento', index, e.target.value)} className="flex-1 bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#333333]" />
                        {jobForm.equipamiento.length > 1 && <button onClick={() => removeArrayItem('equipamiento', index)} className="p-3.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    ))}
                    <button onClick={() => addArrayItem('equipamiento')} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mt-3 hover:bg-[#2D6A6A]/10 px-5 py-3 rounded-2xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Agregar equipo</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {jobFormStep === 3 && (
            <div className="space-y-8 animate-in fade-in">
               <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Contacto y Condiciones</h2>
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-4">Canal preferido de contacto *</label>
                  <div className="flex flex-col sm:flex-row gap-5 mb-4">
                    <button onClick={() => toggleTipoContacto('whatsapp')} className={`flex-1 p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${jobForm.tipoContacto.includes('whatsapp') ? 'border-[#25D366] bg-[#25D366]/5 text-[#1A3D3D] shadow-md' : 'border-gray-100 text-[#666666] hover:border-gray-200 hover:bg-gray-50'}`}>
                      <MessageCircle className={`w-8 h-8 ${jobForm.tipoContacto.includes('whatsapp') ? 'text-[#25D366]' : ''}`} /> <span className="font-bold text-[15px]">WhatsApp</span>
                    </button>
                    <button onClick={() => toggleTipoContacto('email')} className={`flex-1 p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${jobForm.tipoContacto.includes('email') ? 'border-[#2D6A6A] bg-[#2D6A6A]/5 text-[#1A3D3D] shadow-md' : 'border-gray-100 text-[#666666] hover:border-gray-200 hover:bg-gray-50'}`}>
                      <Mail className={`w-8 h-8 ${jobForm.tipoContacto.includes('email') ? 'text-[#2D6A6A]' : ''}`} /> <span className="font-bold text-[15px]">Email</span>
                    </button>
                  </div>
                  {errors.tipoContacto && <p className="text-red-500 text-[11px] font-bold mt-2 text-center">{errors.tipoContacto}</p>}
                </div>

                <div className="space-y-6">
                  {jobForm.tipoContacto.includes('whatsapp') && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Número de WhatsApp *</label>
                      <input type="text" value={jobForm.contactoWhatsapp} onChange={(e) => handleJobFormChange('contactoWhatsapp', e.target.value)} placeholder="Ej: +54 9 11 1234 5678" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.contactoWhatsapp ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                      {errors.contactoWhatsapp && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.contactoWhatsapp}</p>}
                    </div>
                  )}
                  {jobForm.tipoContacto.includes('email') && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Email *</label>
                      <input type="email" value={jobForm.contactoEmail} onChange={(e) => handleJobFormChange('contactoEmail', e.target.value)} placeholder="rrhh@tuclinica.com" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.contactoEmail ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                      {errors.contactoEmail && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.contactoEmail}</p>}
                    </div>
                  )}
                </div>
                
                <div className="bg-[#F4F7F7] border border-gray-200 p-6 rounded-[24px] flex items-start gap-4 mt-10">
                  <CalendarDays className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                  <div>
                    <h4 className="text-[#1A3D3D] text-[15px] font-bold mb-2">Duración de la publicación</h4>
                    <p className="text-[#666666] text-[14px] font-medium leading-relaxed">
                      La oferta estará visible en la red por <strong className="font-bold text-[#1A3D3D]">30 días</strong>. Podrás verla y renovarla desde tu Historial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#F4F7F7] border-t border-gray-100 p-8 flex items-center justify-between">
          {jobFormStep > 1 ? <button onClick={() => { setJobFormStep(prev => prev - 1); setErrors({}); window.scrollTo(0,0); }} className="px-6 py-4 text-[#666666] font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 rounded-2xl transition-all">Anterior</button> : <div></div>}
          {jobFormStep < 3 ? <button onClick={() => { if(validateJobStep(jobFormStep)){ setJobFormStep(prev=>prev+1); window.scrollTo(0,0); } }} className="px-8 py-4 bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 hover:-translate-y-1 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-sm">Siguiente <ChevronRight className="w-5 h-5" /></button> : 
            <button onClick={submitJobForm} disabled={isSubmitting} className="px-10 py-5 bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-2xl rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-xl disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Send className="w-5 h-5" /> Publicar Oferta</>}
            </button>
          }
        </div>
      </div>
    </section>
  );

  // =========================================================
  // RENDER: 4. FORMULARIO DE PROFESIONAL (OFRECER SERVICIOS)
  // =========================================================
  const renderPublishProfForm = () => (
    <section className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 pt-8 md:pt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => { setView('list'); setProfFormStep(1); setErrors({}); }} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancelar
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-4">Marcar Disponibilidad</h1>
        <p className="text-[#666666] font-medium text-[16px] max-w-lg mx-auto leading-relaxed">Completá esta mini-ficha para que las clínicas puedan encontrarte y contactarte.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-[#F4F7F7] border-b border-gray-100 py-10 px-6 md:px-12 relative overflow-hidden">
          <div className="max-w-md mx-auto relative">
            <div className="absolute top-[20px] md:top-[24px] left-[25%] right-[25%] h-1 bg-gray-200 rounded-full z-0 hidden md:block">
              <div className="absolute top-0 left-0 h-full bg-[#2D6A6A] rounded-full transition-all duration-500 ease-in-out" style={{ width: `${((profFormStep - 1) / 1) * 100}%` }}></div>
            </div>

            <div className="relative z-10 flex justify-between items-start">
              {[1, 2].map((step) => {
                const isActive = profFormStep === step;
                const isCompleted = profFormStep > step;
                return (
                  <div key={step} onClick={() => { if(isCompleted) setProfFormStep(step); }} className={`flex flex-col items-center gap-3 w-32 md:w-40 ${isCompleted ? 'cursor-pointer group' : ''}`}>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-[14px] md:text-[16px] transition-all duration-300 z-10 ${
                      isActive ? 'bg-[#1A3D3D] text-white shadow-[0_4px_12px_rgba(26,61,61,0.3)] scale-110 border-[4px] border-[#F4F7F7]' : 
                      isCompleted ? 'bg-[#2D6A6A] text-white border-[4px] border-[#F4F7F7]' : 'bg-white border-[2px] border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} /> : step}
                    </div>
                    <span className={`text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black text-center ${isActive || isCompleted ? 'text-[#1A3D3D]' : 'text-gray-400'}`}>
                      {step === 1 ? 'Perfil Básico' : 'Disponibilidad'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {profFormStep === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Tu perfil</h2>
              
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-[#F4F7F7] border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {profForm.avatarFile ? (
                      <img src={URL.createObjectURL(profForm.avatarFile)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (currentUser?.foto || currentUser?.photoURL) ? (
                      <img src={currentUser?.foto || currentUser?.photoURL} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                 </div>
                 <div>
                    <label className="cursor-pointer bg-white border border-gray-200 text-[#1A3D3D] font-bold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Cambiar Foto (Opcional)
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
                            try {
                              const compressedFile = await imageCompression(file, options);
                              handleProfFormChange('avatarFile', compressedFile);
                            } catch (error) {
                              console.log("Error comprimiendo:", error);
                              handleProfFormChange('avatarFile', file);
                            }
                          }
                        }} 
                      />
                    </label>
                    <p className="text-[11px] text-[#666666] mt-2">Usaremos tu foto de perfil de Google si no subís otra.</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Nombre y Apellido *</label>
                  <input type="text" value={profForm.nombre} onChange={(e) => handleProfFormChange('nombre', e.target.value)} placeholder="Ej: Dr. Juan Pérez" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all ${errors.nombre ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'}`} />
                  {errors.nombre && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.nombre}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Especialidad (Podés elegir varias) *</label>
                    <div className="flex flex-wrap gap-2">
                      {especialidadesData.map(m => {
                        const isSelected = profForm.especialidad.includes(m.nombre_mostrar);
                        return (
                          <span 
                            key={m.nombre_mostrar}
                            onClick={() => {
                              // Blindaje: forzamos a que siempre sea un array antes de operar
                              const actual = Array.isArray(profForm.especialidad) 
                                ? profForm.especialidad 
                                : (profForm.especialidad ? [profForm.especialidad] : []);
                              
                              const nuevas = actual.includes(m.nombre_mostrar) 
                                ? actual.filter(e => e !== m.nombre_mostrar)
                                : [...actual, m.nombre_mostrar];
                              handleProfFormChange('especialidad', nuevas);
                            }}
                            className={`px-3 py-2 text-[12px] font-medium rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[#2D6A6A] text-white border-[#2D6A6A] shadow-sm' : 'bg-white text-[#666666] border-gray-200 hover:border-[#2D6A6A]/50'}`}
                          >
                            {m.nombre_mostrar}
                          </span>
                        )
                      })}
                    </div>
                    {errors.especialidad && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.especialidad}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Experiencia *</label>
                    <select value={profForm.experiencia} onChange={(e) => handleProfFormChange('experiencia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      {EXPERIENCIA_REQUERIDA.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Provincia de residencia/trabajo *</label>
                  <select value={profForm.provincia} onChange={(e) => handleProfFormChange('provincia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                    {PROVINCIAS.filter(p=>p!=='Todas').map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {profFormStep === 2 && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-[24px] font-bold font-['Montserrat'] text-[#1A3D3D] mb-2">Tu Disponibilidad</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Tiempo / Modalidad *</label>
                    <select value={profForm.tiempo} onChange={(e) => handleProfFormChange('tiempo', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      <option value="Part-time">Part-time (Algunos días)</option>
                      <option value="Full-time">Full-time (Lunes a Viernes)</option>
                      <option value="Por turnos">Por turnos / Interconsultas</option>
                      <option value="Solo fines de semana">Solo fines de semana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Franja Horaria *</label>
                    <select value={profForm.momentoDia} onChange={(e) => handleProfFormChange('momentoDia', e.target.value)} className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] transition-all">
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Mañana / Tarde">Día Completo</option>
                      <option value="Nocturno">Guardia Nocturna</option>
                      <option value="A convenir">Horarios flexibles</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">¿Qué servicios ofreces específicamente? *</label>
                  <div className="space-y-3">
                    {profForm.servicios.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="text" value={item} onChange={(e) => updateProfArrayItem(index, e.target.value)} placeholder="Ej: Guardias activas, cirugías programadas, a domicilio..." className="flex-1 bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all" />
                        {profForm.servicios.length > 1 && <button onClick={() => removeProfArrayItem(index)} className="p-3.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    ))}
                    <button onClick={addProfArrayItem} className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-widest mt-3 hover:bg-[#2D6A6A]/10 px-5 py-3 rounded-2xl flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Agregar servicio</button>
                    {errors.servicios && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.servicios}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Contanos qué estás buscando (Tu "Pitch") *</label>
                  <textarea value={profForm.buscando} onChange={(e) => handleProfFormChange('buscando', e.target.value)} placeholder="Ej: Busco cubrir turnos fijos en clínica de pequeños animales, idealmente zona norte..." rows="4" className={`w-full bg-[#F4F7F7] border rounded-2xl px-5 py-4 text-[15px] font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#2D6A6A]/10 text-[#333333] resize-none transition-all ${errors.buscando ? 'border-red-400' : 'border-gray-200'}`}></textarea>
                  {errors.buscando && <p className="text-red-500 text-[11px] font-bold mt-2">{errors.buscando}</p>}
                </div>
                
                <div className="bg-[#F4F7F7] border border-gray-200 p-6 rounded-[24px] flex items-start gap-4 mt-10">
                  <CalendarDays className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                  <div>
                    <h4 className="text-[#1A3D3D] text-[15px] font-bold mb-2">Renovación de Disponibilidad</h4>
                    <p className="text-[#666666] text-[14px] font-medium leading-relaxed">
                      Para asegurar que las clínicas vean datos reales, tu estado "Disponible" dura <strong className="font-bold text-[#1A3D3D]">30 días</strong>. Podrás ver y renovar tu perfil desde tu Historial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-[#F4F7F7] border-t border-gray-100 p-8 flex items-center justify-between">
          {profFormStep > 1 ? <button onClick={() => { setProfFormStep(prev => prev - 1); setErrors({}); window.scrollTo(0,0); }} className="px-6 py-4 text-[#666666] font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 rounded-2xl transition-all">Anterior</button> : <div></div>}
          {profFormStep < 2 ? <button onClick={() => { setProfFormStep(prev=>prev+1); window.scrollTo(0,0); }} className="px-8 py-4 bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 hover:-translate-y-1 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-sm">Siguiente <ChevronRight className="w-5 h-5" /></button> : 
            <button onClick={submitProfForm} disabled={isSubmitting} className="px-10 py-5 bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-2xl rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-xl disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Send className="w-5 h-5" /> Marcarme Disponible</>}
            </button>
          }
        </div>
      </div>
    </section>
  );

  // =========================================================
  // RENDER: OPCIONES PRE-PUBLICACIÓN (NUEVA O RENOVAR)
  // =========================================================
  const renderPublishOptions = (tipo) => {
    const esClinica = tipo === 'job';
    const titulo = esClinica ? 'Publicar Oferta Laboral' : 'Marcarme Disponible';
    const descripcion = esClinica 
      ? '¿Querés crear una oferta nueva o renovar la última que publicaste?'
      : '¿Querés crear un perfil nuevo o renovar tu última disponibilidad?';
    
    const misPubs = esClinica 
      ? ofertas.filter(o => o.creadorId === currentUser?.uid)
      : profesionales.filter(p => p.creadorId === currentUser?.uid);
    
    const ultimaPub = misPubs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())[0];
    const estaVencido = ultimaPub && ultimaPub.vencimientoMillis && ultimaPub.vencimientoMillis < ahora;

    return (
      <section className="max-w-[600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 pt-12 md:pt-20">
        <button 
          onClick={() => setView('list')} 
          className="flex items-center gap-2 text-[#666666] hover:text-[#1A3D3D] font-bold text-[10px] uppercase tracking-[0.3em] mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a la Bolsa
        </button>

        <div className="text-center mb-10">
          <h1 className="text-[32px] md:text-[42px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-4">{titulo}</h1>
          <p className="text-[#666666] font-medium text-[16px]">{descripcion}</p>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 space-y-6">
          <button 
            onClick={() => { 
              if (esClinica) {
                setJobForm({ 
                  clinica: currentUser?.nombre || currentUser?.displayName || '', 
                  provincia: 'Buenos Aires', ciudad: '', puesto: 'Clínica Médica General', experiencia: 'Sin experiencia (Estudiantes/Junior)', descripcion: '', requisitos: [''], equipamiento: [''], tipoContacto: [], contactoEmail: '', contactoWhatsapp: '', logoFile: null 
                });
              } else {
                setProfForm({ 
                  nombre: currentUser?.nombre || currentUser?.displayName || '', 
                  especialidad: [], experiencia: 'Sin experiencia (Estudiantes/Junior)', provincia: 'Buenos Aires', 
                  tiempo: 'Part-time', momentoDia: 'A convenir', servicios: [''], buscando: '', avatarFile: null 
                });
              }
              setErrors({});
              setView(esClinica ? 'publish_job' : 'publish_prof'); 
              window.scrollTo(0,0); 
            }}
            className="w-full bg-[#1A3D3D] text-white px-6 py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-[#2D6A6A] hover:-translate-y-1 shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" /> Hacer una publicación nueva
          </button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-[#666666] text-[11px] font-bold uppercase tracking-widest">O</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {ultimaPub ? (
            <div className="bg-white rounded-[24px] p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden text-left">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${estaVencido ? 'bg-red-400' : 'bg-[#2D6A6A]'}`}></div>
              
              {esClinica ? (
                /* CARD DE CLÍNICA IDÉNTICA A LA LISTA */
                <div className="flex flex-col sm:flex-row gap-5 mb-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 p-2.5 shrink-0 hidden sm:block">
                    {ultimaPub.logoClinica ? <img src={ultimaPub.logoClinica} alt={ultimaPub.clinica} className="w-full h-full object-contain rounded-xl" /> : <Building className="w-full h-full text-gray-300 p-2" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md ${estaVencido ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
                        {estaVencido ? 'Vencido / Oculto' : 'Activo y Visible'}
                      </span>
                      <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {ultimaPub.provincia}</span>
                    </div>
                    <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] leading-tight mb-1">{ultimaPub.puesto}</h3>
                    <p className="text-[#666666] text-[14px] md:text-[15px] font-medium mb-3">{ultimaPub.clinica}</p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-4 border-t border-gray-50">
                      <div className="flex gap-2">
                        <span className="bg-[#F4F7F7] text-[#333333] text-[12px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#2D6A6A]" /> {ultimaPub.experiencia}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CARD DE PROFESIONAL IDÉNTICA A LA LISTA */
                <div className="flex gap-4 items-start mb-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-[#F4F7F7] border border-gray-100 shadow-sm shrink-0 overflow-hidden relative">
                    {ultimaPub.avatar ? <img src={ultimaPub.avatar} alt={ultimaPub.nombre} className="w-full h-full object-cover" /> : <User className="w-full h-full text-gray-300 p-4" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold font-['Montserrat'] text-[#1A3D3D] text-[18px] md:text-[20px] leading-tight">{ultimaPub.nombre}</h3>
                        <span className={`hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${estaVencido ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
                          {estaVencido ? 'Vencido' : 'Activo'}
                        </span>
                      </div>
                      <span className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5" /> {ultimaPub.provincia}</span>
                    </div>
                    <span className={`sm:hidden inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md mb-2 ${estaVencido ? 'bg-red-50 text-red-600' : 'bg-[#2D6A6A]/10 text-[#2D6A6A]'}`}>
                      {estaVencido ? 'Vencido' : 'Activo'}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1 mb-3">
                      {Array.isArray(ultimaPub.especialidad) ? ultimaPub.especialidad.map((esp, idx) => (
                        <span key={idx} className="bg-[#F4F7F7] text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#2D6A6A]/10">
                          {esp}
                        </span>
                      )) : (
                        <span className="bg-[#F4F7F7] text-[#2D6A6A] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#2D6A6A]/10">
                          {ultimaPub.especialidad}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex gap-4 text-[12px] font-medium text-[#666666]">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {ultimaPub.tiempo}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {ultimaPub.momentoDia}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTONERA INFERIOR */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-50">
                <button 
                  onClick={() => renovarPublicacion(esClinica ? 'ofertasEmpleo' : 'profesionalesDisponibles', ultimaPub.id)}
                  className="flex-1 bg-[#2D6A6A] text-white px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Renovar directo
                </button>

                <button 
                  onClick={() => { 
                    if (esClinica) {
                      setJobForm({ 
                        clinica: ultimaPub.clinica || '', provincia: ultimaPub.provincia || 'Buenos Aires', ciudad: ultimaPub.ciudad || '', 
                        puesto: ultimaPub.puesto || '', experiencia: ultimaPub.experiencia || 'Sin experiencia (Estudiantes/Junior)', 
                        descripcion: ultimaPub.descripcion || '', requisitos: ultimaPub.requisitos?.length ? ultimaPub.requisitos : [''], 
                        equipamiento: ultimaPub.equipamiento?.length ? ultimaPub.equipamiento : [''], tipoContacto: ultimaPub.tipoContacto || [], 
                        contactoEmail: ultimaPub.contactoEmail || '', contactoWhatsapp: ultimaPub.contactoWhatsapp || '', logoFile: null 
                      });
                    } else {
                      setProfForm({ 
                        nombre: ultimaPub.nombre || '', especialidad: Array.isArray(ultimaPub.especialidad) ? ultimaPub.especialidad : [ultimaPub.especialidad], 
                        experiencia: ultimaPub.experiencia || 'Sin experiencia (Estudiantes/Junior)', provincia: ultimaPub.provincia || 'Buenos Aires', 
                        tiempo: ultimaPub.tiempo || 'Part-time', momentoDia: ultimaPub.momentoDia || 'A convenir', 
                        servicios: ultimaPub.servicios?.length ? ultimaPub.servicios : [''], buscando: ultimaPub.buscando || '', avatarFile: null 
                      });
                    }
                    if (esClinica) {
                      setEditJobId(ultimaPub.id);
                    } else {
                      setEditProfId(ultimaPub.id);
                    }
                    setErrors({});
                    setView(esClinica ? 'publish_job' : 'publish_prof'); 
                    window.scrollTo(0,0); 
                  }}
                  className="flex-1 bg-white border-2 border-gray-200 text-[#666666] px-4 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-[#1A3D3D] hover:text-[#1A3D3D] transition-all flex items-center justify-center gap-2"
                >
                  Editar y renovar
                </button>
              </div>
            </div>
          ) : (
             <div className="bg-[#F4F7F7] border border-gray-200 rounded-2xl p-6 text-center">
               <p className="text-[#666666] text-[13px] font-medium">Aún no tenés publicaciones anteriores para renovar.</p>
             </div>
          )}
          
          {/* Tip informativo sobre el sistema de publicaciones */}
          <div className="bg-[#F4F7F7] border border-[#2D6A6A]/20 rounded-[20px] p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-[#2D6A6A]" />
            </div>
            <div>
              <p className="text-[#1A3D3D] text-[13px] font-bold mb-1">¿Cómo funciona el sistema de publicaciones?</p>
              <p className="text-[#666666] text-[12px] font-medium leading-relaxed">
                Las publicaciones en El Portal son <strong className="text-[#1A3D3D] font-black">100% gratuitas</strong> y tienen una vigencia de <strong className="text-[#1A3D3D] font-black">30 días</strong>. Una vez vencido ese plazo, la oferta deja de ser visible automáticamente. Desde esta misma pantalla, el día que venza, vas a poder <strong className="text-[#1A3D3D] font-black">renovarla con un solo clic</strong> sin perder ningún dato.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button 
              onClick={() => { setView('historial'); window.scrollTo(0,0); }}
              className="text-[#2D6A6A] font-bold text-[12px] hover:underline"
            >
              Ver todo mi historial avanzado
            </button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased relative">
      <main id="main-content" className="max-w-[1440px] mx-auto">
        
        {/* === MODAL DE ALERTA DE ROLES === */}
        {roleAlert && (
          <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setRoleAlert(null)}>
            <div className="bg-white rounded-[32px] p-8 md:p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-[#df803b]" />
              </div>
              
              
              {roleAlert === 'clinica_trying_prof' && (
                <>
                  <p className="text-[#666666] text-[14px] font-medium mb-8 leading-relaxed">
                    Esta opción es solo para profesionales y alumnos. Si querés publicar una búsqueda de personal para tu institución, tocá el botón de abajo.
                  </p>
                  <button 
                    onClick={() => { setRoleAlert(null); setView('options_job'); window.scrollTo(0,0); }}
                    className="w-full bg-[#1A3D3D] text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Building className="w-4 h-4" /> Publicar Oferta de Clínica
                  </button>
                </>
              )}

              {roleAlert === 'prof_trying_clinica' && (
                <>
                  <p className="text-[#666666] text-[14px] font-medium mb-8 leading-relaxed">
                    Esta opción es solo para clínicas. Si querés ofrecer tus servicios, tocá el botón de abajo para marcarte como disponible en la red.
                  </p>
                  <button 
                    onClick={() => { setRoleAlert(null); setView('options_prof'); window.scrollTo(0,0); }}
                    className="w-full bg-[#1A3D3D] text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <UserCheck className="w-4 h-4" /> Marcarme Disponible
                  </button>
                </>
              )}
              
              <button onClick={() => setRoleAlert(null)} className="mt-6 text-[#666666] text-[12px] font-bold uppercase tracking-widest hover:text-[#1A3D3D] transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {view === 'list' && renderList()}
        {view === 'detail' && renderDetail()}
        {view === 'options_job' && renderPublishOptions('job')}
        {view === 'options_prof' && renderPublishOptions('prof')}
        {view === 'publish_job' && renderPublishJobForm()}
        {view === 'publish_prof' && renderPublishProfForm()}
        {view === 'historial' && renderHistorial()}
        
        {/* === MODAL DE ÉXITO === */}
        {successModal.show && (
          <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSuccessModal({ show: false, title: '', message: '' })}>
            <div className="bg-white rounded-[32px] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CircleCheck className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-[22px] font-black font-['Montserrat'] text-[#1A3D3D] mb-3">{successModal.title}</h3>
              <p className="text-[#666666] text-[14px] font-medium mb-8 leading-relaxed">
                {successModal.message}
              </p>
              <button 
                onClick={() => setSuccessModal({ show: false, title: '', message: '' })}
                className="w-full bg-[#1A3D3D] text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2D6A6A] transition-all shadow-lg"
              >
                Excelente
              </button>
            </div>
          </div>
        )}
     {mostrarTourBolsa && view === 'list' && (
  <TourGuia
        pasos={PASOS_BOLSA}
        userId={currentUser?.uid}
        claveStorage="bolsa"
        onFin={async () => {
          setMostrarTourBolsa(false);
          try {
            await updateDoc(doc(db, 'usuarios', currentUser.uid), { 'tourVisto.bolsa': true });
          } catch (e) {
            console.error('Error guardando tour bolsa:', e);
          }
        }}
      />
)}
      </main>
    </div>
  );
}