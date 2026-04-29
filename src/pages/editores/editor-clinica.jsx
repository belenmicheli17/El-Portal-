import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, 
  ArrowUp, ArrowDown, MapPin, ShieldCheck, Check, ArrowLeft,
  Smartphone, Home, Mail, Award, ChevronDown, 
  ArrowRight, ExternalLink, Heart,
  Menu, User, LayoutGrid, Edit, Briefcase, FileText, Undo2, Redo2, FileCheck, Building2, AlertTriangle, Syringe, Activity, Microscope, Stethoscope, Crop, Sparkles, Loader2
} from 'lucide-react';

// ==========================================
// CATÁLOGO DE SERVICIOS PREDEFINIDOS (AGRUPADOS)
// ==========================================
const CATALOGO_SERVICIOS = [
  { id: 'guardia', icono: Activity, titulo: 'Guardia e Internación', opciones: ['Terapia Intensiva (UTI)', 'Monitoreo Continuo', 'Oxigenoterapia', 'Transfusiones'] },
  { id: 'consulta', icono: Stethoscope, titulo: 'Clínica Médica General', opciones: ['Clínica Médica', 'Geriatría y Gerontología', 'Nutrición', 'Comportamiento Animal - Etología', 'Enfermedades Infecciosas y Parasitarias'] },
  { id: 'especialidades', icono: Award, titulo: 'Especialidades Médicas', opciones: ['Cardiología', 'Endocrinología', 'Dermatología', 'Neurología', 'Oftalmología', 'Oncología', 'Nefro y urología'] },
  { id: 'cirugia', icono: Syringe, titulo: 'Quirófano y Cirugías', opciones: ['Cirugía y Anestesiología', 'Traumatología', 'Tejidos Blandos', 'Cirugía de Alta Complejidad'] },
  { id: 'imagenes', icono: Microscope, titulo: 'Diagnóstico por Imágenes', opciones: ['Radiología', 'Ecografía', 'Tomografía (TAC)', 'Resonancia Magnética (RMN)'] },
  { id: 'laboratorio', icono: FileText, titulo: 'Laboratorio Clínico Propio', opciones: ['Hematología', 'Bioquímica Clínica', 'Test PCR Infecciosas'] },
  { id: 'odontologia', icono: Sparkles, titulo: 'Odontología', opciones: ['Limpieza por Ultrasonido', 'Extracciones Dentales', 'Cirugía Maxilofacial'] },
  { id: 'rehabilitacion', icono: Activity, titulo: 'Fisiatría y Terapias', opciones: ['Fisiatría', 'Terapias Holísticas', 'Magnetoterapia'] },
];

// ==========================================
// COMPONENTES DE UI REUTILIZABLES
// ==========================================

const Tooltip = ({ text, isSection = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="group relative inline-flex items-center ml-2 cursor-help z-[100]"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsVisible(!isVisible); }}
    >
      <div className="bg-[#2D6A6A]/10 p-1 rounded-full border border-[#2D6A6A]/20 group-hover:bg-[#2D6A6A] transition-colors duration-300">
        <Info className="w-4 h-4 text-[#2D6A6A] group-hover:text-white transition-colors" />
      </div>

      <div className={`
        transition-all duration-300 
        absolute 
        bottom-full 
        left-1/2 -translate-x-1/2 
        mb-3 
        w-[240px] md:w-64 
        text-left leading-relaxed transform normal-case tracking-normal font-normal z-[110]
        ${isVisible ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
      `}>
        {isSection ? (
           <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative text-left">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A]"></div>
                <span className="text-xs font-black text-[#2D6A6A] tracking-wide uppercase">Importante</span>
             </div>
             <p className="text-sm text-gray-600 font-medium leading-relaxed">{text}</p>
             <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white"></div>
           </div>
        ) : (
           <div className="bg-[#1A3D3D] text-white text-sm font-medium p-3 rounded-xl shadow-2xl relative text-left border border-white/10">
             {text}
             <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A3D3D]"></div>
           </div>
        )}
      </div>
    </div>
  );
};

const InputGroup = ({ label, id, type = "text", placeholder, value, onChange, tooltip, error, required, maxLength, disabled, canTest, rows = "4" }) => {
  const isNearLimit = maxLength && value && value.length >= maxLength * 0.9;
  
  return (
    <div className="mb-6 w-full">
      <div className="flex justify-between items-end mb-2 ml-1">
        <label htmlFor={id} className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
          {label} {required && <span className="text-red-400 ml-1">*</span>}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        {maxLength && (
          <span className={`text-[11px] font-black tracking-wider leading-none transition-colors ${isNearLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {value?.length || 0} / {maxLength}
          </span>
        )}
      </div>
      
      <div className="relative text-left">
        {type === "textarea" ? (
          <textarea
            id={id} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} rows={rows} disabled={disabled}
            className={`w-full bg-gray-50/50 border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-4 text-base font-medium focus:outline-none transition-all resize-none text-[#1A3D3D] disabled:opacity-50`}
          />
        ) : (
          <input
            id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} disabled={disabled}
            className={`w-full bg-gray-50/50 border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-3.5 text-base font-medium focus:outline-none transition-all text-[#1A3D3D] disabled:opacity-50 ${canTest && value ? 'pr-12' : ''}`}
          />
        )}
        {error && <AlertCircle className="w-5 h-5 text-red-400 absolute right-4 top-3.5" />}
        
        {canTest && (
          <a 
            href={value ? (value.startsWith('http') ? value : `https://${value}`) : '#'} 
            target="_blank" 
            rel="noreferrer"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all shadow-sm z-10 ${value ? 'bg-white border-gray-200 text-gray-500 hover:text-[#2D6A6A] hover:border-[#2D6A6A] cursor-pointer' : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'}`}
            title="Probar que el enlace funciona"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      {error && <p className="text-red-500 text-sm font-bold mt-2 ml-1">{error}</p>}
    </div>
  );
};

const ToggleSwitch = ({ label, checked, onChange, tooltip, className = "" }) => (
  <div className={`flex items-center justify-between gap-4 ${className}`}>
    <div className="flex items-center flex-1">
      <span className="text-base font-bold text-[#1A3D3D]">{label}</span>
      {tooltip && <Tooltip text={tooltip} />}
    </div>
    <button
      type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-[#25D366]' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const Accordion = ({ title, icon: Icon, children, isOpen, onToggle, tooltip }) => {
  return (
    <div className={`border-b border-gray-100 last:border-0 group relative ${isOpen ? 'z-20' : 'z-0'}`}>
      <button 
        type="button" 
        onClick={onToggle} 
        className={`w-full flex justify-between items-center transition-all duration-500 py-6 px-6 md:px-5 md:rounded-[24px] ${isOpen ? 'md:bg-gray-50/80 shadow-sm' : 'md:hover:bg-gray-50'}`}
      >
        <div className="flex items-center text-left gap-3 md:gap-4">
          <div className={`p-2.5 rounded-xl transition-all duration-500 ease-in-out ${isOpen ? 'bg-[#1A3D3D] text-white' : 'bg-transparent text-[#2D6A6A]'}`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <h3 className={`font-black text-sm md:text-base uppercase tracking-wider transition-colors duration-500 ${isOpen ? 'text-[#1A3D3D]' : 'text-gray-500 md:text-[#1A3D3D]'}`}>
            {title}
          </h3>
          {tooltip && isOpen && (
            <div className="block animate-in fade-in zoom-in duration-300">
              <Tooltip text={tooltip} isSection />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="block">
            <ChevronDown className={`w-6 h-6 transition-all duration-500 ease-in-out ${isOpen ? 'rotate-180 text-[#2D6A6A]' : 'rotate-0 text-gray-300 group-hover:text-[#2D6A6A]'}`} />
          </div>
        </div>
      </button>

      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 py-6 px-6 md:px-5 overflow-visible' : 'max-h-0 opacity-0 py-0 overflow-hidden'}`}>
        <div className="transition-opacity duration-500">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE: RECORTADOR DE IMAGEN (CROPPER)
// ==========================================
const SimpleCropper = ({ imageSrc, onCrop, onCancel, type }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  
  const CROP_SIZE = 256;

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleCropClick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');

    const img = imgRef.current;
    
    // Calcular escala base para que la imagen cubra el contenedor de 256x256
    const baseScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    const finalScale = baseScale * zoom;

    const drawWidth = img.naturalWidth * finalScale;
    const drawHeight = img.naturalHeight * finalScale;

    // Calcular posición X e Y centrada, más el offset manual del usuario
    const drawX = (CROP_SIZE - drawWidth) / 2 + position.x;
    const drawY = (CROP_SIZE - drawHeight) / 2 + position.y;

    // Fondo blanco por si hay transparencias
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
    
    // Dibujar imagen final
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Retornar imagen en base64
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        className="relative bg-gray-100 overflow-hidden cursor-move touch-none shadow-inner"
        style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: type === 'logo' ? '1.5rem' : '100%' }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <img 
          ref={imgRef}
          src={imageSrc} 
          alt="Original"
          className="absolute pointer-events-none select-none max-w-none"
          draggable={false}
          style={{
            transform: `translate3d(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px), 0) scale(${zoom})`,
            left: '50%',
            top: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transformOrigin: 'center center'
          }}
        />
        {/* Guía visual */}
        <div className="absolute inset-0 pointer-events-none border-4 border-[#2D6A6A]/40" style={{ borderRadius: type === 'logo' ? '1.5rem' : '100%' }}></div>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <Crop className="w-10 h-10 text-white opacity-40 drop-shadow-md" />
        </div>
      </div>
      
      <div className="mt-8 w-full max-w-[256px]">
        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
          <span>Alejar</span>
          <span>Acercar</span>
        </label>
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.1" 
          value={zoom} 
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-[#2D6A6A] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex justify-end gap-3 w-full mt-8 border-t border-gray-100 pt-6">
        <button onClick={onCancel} className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors text-base">Cancelar</button>
        <button onClick={handleCropClick} className="px-8 py-3 rounded-xl bg-[#1A3D3D] text-white font-bold hover:bg-[#2D6A6A] transition-colors shadow-lg flex items-center gap-2 text-base">
          <Check className="w-5 h-5" /> Aplicar Recorte
        </button>
      </div>
    </div>
  );
};


export default function EditorClinico() { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [openSection, setOpenSection] = useState(null);
  const [nuevaSubOpcion, setNuevaSubOpcion] = useState({ idServicio: null, texto: '' });
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, targetId: null, type: null });
  const [isSaving, setIsSaving] = useState(false); // NUEVO: Estado de guardado

  const initialData = {
    nombre: "Clínica Veterinaria San Roque",
    subtitulo: "Cuidado profesional para tu mejor amigo",
    descripcion: "Más de 15 años cuidando mascotas en el Oeste del Gran Buenos Aires. Somos un centro médico veterinario de alta complejidad comprometido con el bienestar.",
    historia: "Fundada en 2009 por la Dra. Valeria Rojas, San Roque nació de la convicción de que cada mascota merece atención de primer nivel sin importar dónde viva. Contamos con tecnología de punta y un equipo humano excepcional.",
    añosExperiencia: 15,
    foto: "", 
    direccion: "Rivadavia 1234, Morón",
    telefono: "+54 11 4567-8901",
    whatsapp: "5491145678901",
    email: "contacto@sanroquevet.com.ar",
    googleMapsUrl: "https://maps.google.com/?q=Clinica+Veterinaria+San+Roque+Moron",
    redes: { instagram: "https://instagram.com", facebook: "https://facebook.com", linkedin: "" },
    guardia24hs: true,
    telefonoGuardia: "",
    staff: [
      { id: 1, nombre: "Dr. Martín Suárez", especialidad: "Director Médico", matricula: "MV 4521", bio: "Especialista en cirugía general con más de 10 años de experiencia.", foto: "" },
      { id: 2, nombre: "Dra. Valeria Rojas", especialidad: "Medicina Interna", matricula: "MV 3108", bio: "Enfocada en diagnóstico y tratamiento de patologías de alta complejidad.", foto: "" }
    ],
    servicios: {
      'guardia': { activo: true, subOpcionesSeleccionadas: ['Terapia Intensiva (UTI)'] },
      'cirugia': { activo: true, subOpcionesSeleccionadas: ['Tejidos Blandos', 'Traumatología'] },
      'especialidades': { activo: true, subOpcionesSeleccionadas: ['Cardiología', 'Dermatología'] }
    }
  };

  const [_formData, _setFormData] = useState(initialData);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoRedAction = useRef(false);
  const fileInputRef = useRef(null);

  const formData = _formData;
  
  const setFormData = (action) => {
    _setFormData((prev) => {
      const nextState = typeof action === 'function' ? action(prev) : action;
      if (!isUndoRedAction.current && JSON.stringify(prev) !== JSON.stringify(nextState)) {
         setPast(p => [...p, prev]);
         setFuture([]); 
      }
      isUndoRedAction.current = false;
      return nextState;
    });
  };

  const calculateProgress = () => {
    let score = 0;
    const weights = { identidad: 30, historia: 15, staff: 15, servicios: 20, contacto: 20 };
    if (formData.nombre && formData.subtitulo && formData.descripcion && formData.foto) score += weights.identidad;
    if (formData.historia.length > 50) score += weights.historia;
    if (formData.staff.length > 0) score += weights.staff;
    if (Object.values(formData.servicios).some(s => s.activo)) score += weights.servicios;
    if (formData.email && formData.direccion && formData.telefono) score += weights.contacto;
    return score;
  };

  const progress = calculateProgress();

  const undo = () => {
    if (past.length === 0) return;
    isUndoRedAction.current = true;
    const previous = past[past.length - 1];
    setPast(past.slice(0, past.length - 1));
    setFuture([_formData, ...future]);
    _setFormData(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    isUndoRedAction.current = true;
    const next = future[0];
    setFuture(future.slice(1));
    setPast([...past, _formData]);
    _setFormData(next);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRedesChange = (red, value) => {
    setFormData(prev => ({ ...prev, redes: { ...prev.redes, [red]: value } }));
  };

  const handleArrayAdd = (listName, defaultObj) => {
    setFormData(prev => ({ ...prev, [listName]: [...prev[listName], { id: Date.now(), ...defaultObj }] }));
  };

  const handleArrayUpdate = (listName, id, field, value) => {
    setFormData(prev => ({ ...prev, [listName]: prev[listName].map(item => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const handleArrayRemove = (listName, id) => {
    setFormData(prev => ({ ...prev, [listName]: prev[listName].filter(item => item.id !== id) }));
  };

  const handleArrayMove = (listName, index, direction) => {
    const newArr = [...formData[listName]];
    if (direction === 'up' && index > 0) [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    else if (direction === 'down' && index < newArr.length - 1) [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setFormData(prev => ({ ...prev, [listName]: newArr }));
  };

  const toggleServicio = (idServicio) => {
    setFormData(prev => {
      const currentServicios = { ...prev.servicios };
      const isActive = currentServicios[idServicio]?.activo;
      
      currentServicios[idServicio] = {
        ...currentServicios[idServicio],
        activo: !isActive,
        subOpcionesSeleccionadas: currentServicios[idServicio]?.subOpcionesSeleccionadas || []
      };

      return { ...prev, servicios: currentServicios };
    });
  };

  const toggleSubOpcion = (idServicio, opcion) => {
    setFormData(prev => {
      const servicio = prev.servicios[idServicio] || { activo: true, subOpcionesSeleccionadas: [] };
      const selected = servicio.subOpcionesSeleccionadas;
      const newSelected = selected.includes(opcion) 
        ? selected.filter(o => o !== opcion) 
        : [...selected, opcion];
        
      return { ...prev, servicios: { ...prev.servicios, [idServicio]: { ...servicio, subOpcionesSeleccionadas: newSelected } } };
    });
  };

  const handleDetalleHolistico = (idServicio, value) => {
    setFormData(prev => ({
      ...prev,
      servicios: {
        ...prev.servicios,
        [idServicio]: {
          ...prev.servicios[idServicio],
          detalleHolistico: value
        }
      }
    }));
  };

  const agregarSubOpcionPersonalizada = (idServicio) => {
    const textoRaw = nuevaSubOpcion.texto.trim();
    if (!textoRaw) return;
    const textoCapitalizado = textoRaw.charAt(0).toUpperCase() + textoRaw.slice(1);
    toggleSubOpcion(idServicio, textoCapitalizado);
    setNuevaSubOpcion({ idServicio: null, texto: '' });
  };

  const handleFileSelect = (e, type, targetId = null) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setCropModal({ isOpen: true, imageSrc: event.target.result, targetId, type });
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const saveCroppedImage = (croppedBase64) => {
    if (cropModal.type === 'logo') {
      setFormData(prev => ({ ...prev, foto: croppedBase64 }));
    } else if (cropModal.type === 'staff') {
      handleArrayUpdate('staff', cropModal.targetId, 'foto', croppedBase64);
    }
    setCropModal({ isOpen: false, imageSrc: null, targetId: null, type: null });
  };

  const triggerFileInput = (ref) => {
    if (ref && ref.current) {
       ref.current.click();
    }
  };

  // ==========================================
  // NUEVO: SIMULACIÓN DE GUARDADO CON VALIDACIÓN
  // ==========================================
  const handleSaveData = () => {
    // 1. Validar campos obligatorios
    if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.foto) {
      setModalConfig({ 
        isOpen: true, 
        title: 'Faltan datos requeridos', 
        message: 'Asegúrate de haber ingresado el Logo, el Nombre de la Institución y la Dirección Física antes de publicar el perfil.', 
        type: 'error' 
      });
      setOpenSection('identidad'); // Abre la sección de identidad para que vean el error
      return;
    }

    // 2. Simular carga
    setIsSaving(true);
    
    setTimeout(() => {
      setIsSaving(false);
      setModalConfig({ 
        isOpen: true, 
        title: '¡Publicación Exitosa!', 
        message: 'Los datos de tu clínica han sido guardados y ya se encuentran actualizados en la red.', 
        type: 'success' 
      });
    }, 1500);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased text-left text-[#1A3D3D] selection:bg-[#2D6A6A] selection:text-white relative overflow-x-clip w-full">
      
      {/* MODAL DE MENSAJES ACTUALIZADO CON ICONOS DINÁMICOS */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
            {modalConfig.type === 'error' ? (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-[#25D366]" />
              </div>
            )}
            
            <h3 className="font-bold font-['Montserrat'] text-2xl text-[#1A3D3D] mb-3">{modalConfig.title}</h3>
            <p className="text-base text-gray-500 mb-8">{modalConfig.message}</p>
            <button 
              onClick={() => setModalConfig({ isOpen: false })} 
              className={`px-8 py-3.5 rounded-xl font-bold text-white transition-colors shadow-lg text-base w-full ${modalConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1A3D3D] hover:bg-[#2D6A6A]'}`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RECORTE DE IMAGEN INTERACTIVO */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de Imagen</h3>
                <p className="text-sm text-gray-500 mt-1">Arrastra para mover la imagen o utiliza el zoom.</p>
              </div>
              <button onClick={() => setCropModal({ isOpen: false })} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center relative overflow-hidden">
               <SimpleCropper 
                  imageSrc={cropModal.imageSrc} 
                  type={cropModal.type} 
                  onCrop={saveCroppedImage} 
                  onCancel={() => setCropModal({ isOpen: false })} 
               />
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-[60] h-[70px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-8 md:px-10 shadow-sm">
        <div className="max-w-[1200px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A3D3D] rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
            <div className="font-['Montserrat'] font-extrabold text-xl tracking-tight">Editor Clínico<span className="text-[#2D6A6A]">.</span></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 mr-2 animate-in fade-in duration-500">
               <Check className="w-4 h-4 text-[#25D366]" />
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Guardado auto</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-50/50 rounded-xl p-1.5 border border-gray-100">
              <button onClick={undo} disabled={past.length === 0} className={`p-2.5 rounded-lg transition-colors ${past.length > 0 ? 'text-[#1A3D3D] hover:bg-white shadow-sm' : 'text-gray-300'}`}><Undo2 className="w-5 h-5" /></button>
              <button onClick={redo} disabled={future.length === 0} className={`p-2.5 rounded-lg transition-colors ${future.length > 0 ? 'text-[#1A3D3D] hover:bg-white shadow-sm' : 'text-gray-300'}`}><Redo2 className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-[110px] max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col lg:flex-row gap-10 items-start relative">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="w-full lg:w-[55%] flex flex-col">
          <div className="mb-8 px-2">
            <h1 className="text-4xl font-black font-['Montserrat'] uppercase tracking-tight mb-3 text-[#1A3D3D]">Configurar Clínica</h1>
            <p className="text-base text-gray-500">Actualizá los datos institucionales de tu centro veterinario.</p>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 border-t-[8px] border-t-[#2D6A6A] mb-8 relative">
            
            {/* 1. IDENTIDAD */}
            <Accordion 
              title="Identidad de la Clínica" 
              icon={Building2} 
              isOpen={openSection === 'identidad'} 
              onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}
            >
              <div className="flex flex-col sm:flex-row gap-8 mb-8 mt-2 md:mt-0">
                <div className="relative group cursor-pointer shrink-0 text-left">
                  <div onClick={() => triggerFileInput(fileInputRef)} className={`w-36 h-36 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img`}>
                    {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <Camera className="w-10 h-10 text-gray-300" />}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} />
                </div>
                <div className="flex-1 text-left flex flex-col justify-center">
                  <h3 className="text-base font-bold text-[#1A3D3D] mb-2 uppercase tracking-wide flex items-center">
                    Logo Institucional <span className="text-red-400 ml-1">*</span>
                    <Tooltip text="Sube el logo de tu clínica en alta resolución. Fondo blanco o transparente recomendado." />
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Formatos PNG o JPG. Máx 2MB.</p>
                </div>
              </div>

              {/* SECCIÓN IDENTIDAD */}
              <InputGroup type="textarea" rows="2" label="Nombre de la Institución" id="nombre" value={formData.nombre} onChange={handleChange} required />
              
              <InputGroup type="textarea" rows="2" label="Eslogan / Subtítulo" id="subtitulo" value={formData.subtitulo} onChange={handleChange} maxLength={60} tooltip="Atrae la atención rápidamente. Ej: Cuidado profesional para tu mejor amigo" />
              
              <InputGroup type="textarea" rows="3" label="Descripción Corta (Hero)" id="descripcion" value={formData.descripcion} onChange={handleChange} maxLength={200} placeholder="Breve resumen de 2 o 3 líneas sobre su institución..." tooltip="Este texto acompaña tu logo principal en la presentación de la página." />
              
              <InputGroup type="number" label="Años de Experiencia" id="añosExperiencia" value={formData.añosExperiencia} onChange={handleChange} tooltip="Se mostrará de forma destacada como una medalla de confianza." />

              <InputGroup type="textarea" label="Nuestra Historia" id="historia" value={formData.historia} onChange={handleChange} maxLength={800} tooltip="Aparecerá en la sección principal 'Nosotros'. Cuéntale al público cómo nació la clínica y cuáles son sus valores." />
            </Accordion>

            {/* 2. SERVICIOS CHECKLIST VERTICAL */}
            <Accordion title="Especialidades y Servicios" icon={Activity} isOpen={openSection === 'servicios'} onToggle={() => setOpenSection(openSection === 'servicios' ? null : 'servicios')} tooltip="Marca los servicios que ofrece tu clínica.">
              
              <p className="text-sm text-gray-500 mb-6 font-medium">Selecciona las prestaciones disponibles en tu centro médico:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {CATALOGO_SERVICIOS.map(srv => {
                  const isActive = formData.servicios[srv.id]?.activo;
                  const seleccionadas = formData.servicios[srv.id]?.subOpcionesSeleccionadas || [];

                  return (
                    <div key={srv.id} className={`flex flex-col rounded-[24px] border transition-all duration-300 ${isActive ? 'border-[#2D6A6A] bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}>
                      {/* Cabecera de la Tarjeta (Macro-categoría) */}
                      <div 
                        className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-[24px]" 
                        onClick={() => toggleServicio(srv.id)}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-[#1A3D3D] border-[#1A3D3D]' : 'bg-white border-gray-300'}`}>
                          {isActive && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                        <div className="flex items-center gap-3">
                           <srv.icono className={`w-5 h-5 ${isActive ? 'text-[#2D6A6A]' : 'text-gray-400'}`} />
                           <span className={`text-base font-black ${isActive ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{srv.titulo}</span>
                        </div>
                      </div>
                      
                      {/* Cuerpo de la Tarjeta (Sub-especialidades verticalmente apiladas) */}
                      <div className="px-5 pb-6">
                        <div className="border-t border-gray-200/60 pt-5">
                           <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isActive ? 'text-gray-400' : 'text-gray-300'}`}>Sub-especialidades</p>
                           
                           <div className={`flex flex-col items-start gap-2.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                             {[...new Set([...srv.opciones, ...seleccionadas])].map(opcion => {
                               const isChecked = seleccionadas.includes(opcion);
                               return (
                                 <React.Fragment key={opcion}>
                                   <button 
                                    type="button"
                                    onClick={() => toggleSubOpcion(srv.id, opcion)}
                                    className={`w-full justify-start px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-colors flex items-center gap-3 shadow-sm ${isChecked ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A6A]'}`}
                                   >
                                     <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked ? 'bg-white border-white' : 'border-gray-300'}`}>
                                       {isChecked && <Check className="w-3 h-3 text-[#1A3D3D]" />}
                                     </div>
                                     <span className="text-left">{opcion}</span>
                                   </button>

                                   {/* Input Especial para Terapias Holísticas */}
                                   {opcion === 'Terapias Holísticas' && isChecked && (
                                     <div className="w-full pl-6 pr-1 py-1 animate-in fade-in slide-in-from-top-1">
                                       <div className="relative">
                                         <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#2D6A6A]/20 -ml-3 rounded-full"></div>
                                         <input 
                                           type="text" 
                                           placeholder="Ej: Acupuntura, Reiki, Flores de Bach..." 
                                           value={formData.servicios[srv.id]?.detalleHolistico || ''}
                                           onChange={(e) => handleDetalleHolistico(srv.id, e.target.value)}
                                           className="w-full bg-white border border-gray-200 focus:border-[#2D6A6A] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none transition-colors text-[#1A3D3D] shadow-sm"
                                         />
                                       </div>
                                     </div>
                                   )}
                                 </React.Fragment>
                               );
                             })}
                             
                             {nuevaSubOpcion.idServicio === srv.id ? (
                               <div className="flex items-center gap-2 w-full mt-1">
                                 <input 
                                  type="text" 
                                  autoFocus
                                  value={nuevaSubOpcion.texto}
                                  onChange={(e) => setNuevaSubOpcion({ ...nuevaSubOpcion, texto: e.target.value })}
                                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarSubOpcionPersonalizada(srv.id); } }}
                                  placeholder="Escribir especialidad..."
                                  className="px-4 py-3 text-xs font-bold rounded-xl border border-[#2D6A6A] outline-none flex-1 bg-white shadow-sm"
                                 />
                                 <button type="button" onClick={() => agregarSubOpcionPersonalizada(srv.id)} className="bg-[#2D6A6A] text-white p-3 rounded-xl shrink-0 shadow-sm hover:bg-[#1A3D3D] transition-colors"><Plus className="w-4 h-4" /></button>
                                 <button type="button" onClick={() => setNuevaSubOpcion({ idServicio: null, texto: '' })} className="bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 p-3 rounded-xl shrink-0 shadow-sm transition-colors"><X className="w-4 h-4" /></button>
                               </div>
                             ) : (
                               <button 
                                type="button"
                                onClick={() => setNuevaSubOpcion({ idServicio: srv.id, texto: '' })}
                                className="w-full justify-center mt-1 px-4 py-3 rounded-xl text-xs font-bold text-[#2D6A6A] border border-dashed border-[#2D6A6A]/50 hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors flex items-center gap-2 bg-white shadow-sm"
                               >
                                 <Plus className="w-4 h-4" /> Añadir especialidad
                               </button>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Accordion>

            {/* 3. STAFF CON FOTO Y BIO - FIX RESPONSIVE & FONT SIZE */}
            <Accordion title="Staff Médico" icon={User} isOpen={openSection === 'staff'} onToggle={() => setOpenSection(openSection === 'staff' ? null : 'staff')} tooltip="Presenta a los especialistas que trabajan en tu centro. Esto genera mucha confianza en los tutores.">
              <div className="space-y-6">
                {formData.staff.map((item, index) => (
                  <div key={item.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 text-left relative group/staff">
                    <button onClick={() => handleArrayRemove('staff', item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover/staff:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                    
                    <div className="flex flex-col gap-1.5 mt-1 shrink-0 md:hidden">
                      <button type="button" onClick={() => handleArrayMove('staff', index, 'up')} disabled={index === 0} className="p-1.5 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowUp className="w-5 h-5" /></button>
                      <button type="button" onClick={() => handleArrayMove('staff', index, 'down')} disabled={index === formData.staff.length - 1} className="p-1.5 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowDown className="w-5 h-5" /></button>
                    </div>

                    <label htmlFor={`staff-foto-${item.id}`} className="relative group/img cursor-pointer shrink-0 block w-24 h-24 self-start">
                      <div className={`w-full h-full rounded-2xl overflow-hidden border-2 border-dashed ${item.foto ? 'border-transparent' : 'border-[#2D6A6A]/40 bg-[#2D6A6A]/5'} transition-all flex flex-col items-center justify-center bg-white shadow-sm hover:border-[#2D6A6A]`}>
                        {item.foto ? (
                           <img src={item.foto} className="w-full h-full object-cover" alt={item.nombre} /> 
                        ) : (
                           <>
                             <Camera className="w-7 h-7 text-[#2D6A6A] mb-1" />
                             <span className="text-[9px] font-black uppercase text-[#2D6A6A] tracking-widest text-center px-1">Subir<br/>Foto</span>
                           </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <input type="file" id={`staff-foto-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'staff', item.id)} />
                    </label>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Nombre Completo</label>
                          <input type="text" placeholder="Ej: Dra. Valeria Rojas" value={item.nombre} onChange={(e) => handleArrayUpdate('staff', item.id, 'nombre', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-[#1A3D3D]" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Matrícula</label>
                          <input type="text" placeholder="Ej: MV 3108" value={item.matricula} onChange={(e) => handleArrayUpdate('staff', item.id, 'matricula', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-[#1A3D3D]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Especialidad / Cargo</label>
                        <input type="text" placeholder="Ej: Director Médico, Cirujano..." value={item.especialidad} onChange={(e) => handleArrayUpdate('staff', item.id, 'especialidad', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-[#2D6A6A]" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 flex justify-between items-center">
                          Breve Descripción
                          <span className={`text-[11px] tracking-wider ${item.bio?.length >= 140 ? 'text-red-500' : 'text-gray-400'}`}>{item.bio?.length || 0} / 150</span>
                        </label>
                        <textarea placeholder="Resumen de experiencia profesional..." value={item.bio} onChange={(e) => handleArrayUpdate('staff', item.id, 'bio', e.target.value)} maxLength={150} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 text-[#1A3D3D]" />
                      </div>
                    </div>
                    
                    <div className="hidden md:flex flex-col gap-1.5 mt-1 shrink-0">
                      <button type="button" onClick={() => handleArrayMove('staff', index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowUp className="w-5 h-5" /></button>
                      <button type="button" onClick={() => handleArrayMove('staff', index, 'down')} disabled={index === formData.staff.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowDown className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('staff', { nombre: "", especialidad: "", matricula: "", bio: "", foto: "" })} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest">+ Agregar Profesional</button>
              </div>
            </Accordion>

            {/* 4. GUARDIA Y EMERGENCIAS (AHORA MÁS COMPLETO) */}
            <Accordion title="Guardia y Emergencias" icon={AlertTriangle} isOpen={openSection === 'urgencias'} onToggle={() => setOpenSection(openSection === 'urgencias' ? null : 'urgencias')} tooltip="Activa la atención 24hs para destacar automáticamente la guardia a tus clientes.">
              
              <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex flex-col gap-4 text-left transition-all">
                 <ToggleSwitch 
                    label="Atención de Guardia 24hs" 
                    checked={formData.guardia24hs} 
                    onChange={(v) => setFormData(p => ({...p, guardia24hs: v}))} 
                    tooltip="Agrega un cartel destacado en tu perfil indicando la atención continua de emergencias." 
                 />

                 {formData.guardia24hs && (
                   <div className="pt-4 border-t border-red-200/50 mt-2 animate-in fade-in slide-in-from-top-2 flex flex-col gap-2">
                     <InputGroup
                       label="Línea Directa de Emergencias (Opcional)"
                       id="telefonoGuardia"
                       value={formData.telefonoGuardia}
                       onChange={handleChange}
                       placeholder="Dejar vacío para usar el teléfono principal"
                       tooltip="Si tienes un celular o línea exclusiva para urgencias, ingrésalo aquí."
                     />
                     <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl flex items-start gap-2 leading-relaxed mt-2">
                       <Info className="w-4 h-4 shrink-0 mt-0.5" /> 
                       <span>Todos los perfiles con Guardia 24hs mostrarán el aviso general: <i>"Por favor, avisar por WhatsApp al venir en camino para preparar la recepción."</i></span>
                     </div>
                   </div>
                 )}
              </div>
            </Accordion>

            {/* 5. CONTACTO Y UBICACIÓN */}
            <Accordion title="Contacto y Ubicación" icon={MapPin} isOpen={openSection === 'contacto'} onToggle={() => setOpenSection(openSection === 'contacto' ? null : 'contacto')}>
              <InputGroup label="Dirección Física" id="direccion" value={formData.direccion} onChange={handleChange} required />
              <InputGroup label="Link de Google Maps (Iframe SRC)" id="googleMapsUrl" value={formData.googleMapsUrl} onChange={handleChange} tooltip="Pega aquí el enlace para embeber el mapa de tu clínica." />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-4">
                 <InputGroup label="Teléfono Fijo" id="telefono" value={formData.telefono} onChange={handleChange} />
                 <InputGroup label="WhatsApp (Sin '+')" id="whatsapp" value={formData.whatsapp} onChange={handleChange} required tooltip="Ej: 5491145678901. Se usará para el botón flotante directo." />
              </div>
              <InputGroup label="Email Oficial" id="email" type="email" value={formData.email} onChange={handleChange} />

              <div className="pt-8 mt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-5">Redes Sociales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <InputGroup label="Instagram" id="instagram" value={formData.redes.instagram} onChange={(e) => handleRedesChange('instagram', e.target.value)} canTest />
                  <InputGroup label="Facebook" id="facebook" value={formData.redes.facebook} onChange={(e) => handleRedesChange('facebook', e.target.value)} canTest />
                </div>
              </div>
            </Accordion>
          </div>

          {/* ÁREA DE ACCIÓN CENTRALIZADA MODIFICADA */}
          <div className="flex flex-col items-center gap-6 pb-16 w-full px-5 md:px-0">
            <button 
              onClick={handleSaveData} 
              disabled={isSaving}
              className={`w-full sm:w-auto bg-[#1A3D3D] text-white px-16 py-5 rounded-[20px] font-bold text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${isSaving ? 'opacity-80 cursor-not-allowed scale-95' : 'hover:bg-[#2D6A6A] hover:-translate-y-1 active:scale-95'}`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
              {isSaving ? 'Guardando Datos...' : 'Guardar y Publicar Perfil'}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: PREVIEW & PROGRESS */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-[110px] z-10 self-start">
          
          <div className="bg-white p-5 rounded-[24px] mb-6 border border-gray-100 shadow-sm transition-all duration-500">
            <div className="flex justify-between items-center mb-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#2D6A6A]/10 rounded-lg"><FileCheck className="w-4 h-4 text-[#2D6A6A]" /></div>
                <h4 className="text-[#1A3D3D] text-xs font-black uppercase tracking-[0.1em]">Optimización del Perfil</h4>
              </div>
              <span className="text-[#1A3D3D] font-bold text-base">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2D6A6A] transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-start gap-2.5 text-left">
              <div className="w-1 h-1 rounded-full bg-[#2D6A6A] mt-1.5 shrink-0"></div>
              <p className="text-gray-500 text-xs leading-snug font-medium italic">
                {progress < 40 ? "Complete la descripción para mejorar el posicionamiento." : progress < 80 ? "Activar sus servicios genera mayor confianza en los dueños." : progress < 100 ? "Su centro está casi listo para el máximo nivel de visibilidad." : "El perfil de su clínica está 100% optimizado."}
              </p>
            </div>
          </div>

          {/* TARJETA DE VISTA PREVIA */}
          <div className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(26,61,61,0.12)] border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 relative">
            
            {formData.guardia24hs && (
              <div className="absolute top-6 left-6 z-20 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> Guardia 24hs
              </div>
            )}

            <div className="bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] pt-20 p-8 flex flex-col items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="relative mb-5 z-10">
                <div className="w-28 h-28 rounded-[28px] overflow-hidden border-[5px] border-white/20 shadow-2xl bg-white flex items-center justify-center">
                  {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" /> : <Building2 className="w-12 h-12 text-gray-300" />}
                </div>
              </div>
              <div className="z-10 w-full">
                <h3 className="text-2xl md:text-3xl font-black font-['Montserrat'] text-white leading-tight mb-3 tracking-tight">{formData.nombre || "Nombre de la Clínica"}</h3>
                <p className="text-white/80 font-medium text-sm md:text-base mb-5">{formData.subtitulo || "Eslogan de la institución"}</p>
                <div className="flex items-center justify-center gap-2 bg-[#1A3D3D]/40 backdrop-blur-sm px-5 py-2.5 rounded-xl w-max mx-auto border border-white/10">
                   <Award className="w-5 h-5 text-amber-400" />
                   <span className="text-white text-[11px] font-bold uppercase tracking-widest">+{formData.añosExperiencia || 0} Años de Exp.</span>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 flex flex-col items-center bg-[#F4F7F7]">
              <p className="text-gray-500 text-sm md:text-base leading-relaxed italic mb-8 text-center line-clamp-3 px-2">"{formData.descripcion || "Breve resumen de la clínica..."}"</p>

              <div className="w-full mb-8 bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                 <div className="w-12 h-12 rounded-xl bg-[#F4F7F7] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#2D6A6A]" />
                 </div>
                 <div className="text-left overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Ubicación</p>
                    <p className="text-sm font-bold text-[#1A3D3D] truncate">{formData.direccion || "Dirección de la clínica"}</p>
                 </div>
              </div>

              {/* PROTOCOLO PREVIEW ACTUALIZADO */}
              {formData.guardia24hs ? (
                 <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                   <div className="w-full py-4 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] flex flex-col items-center justify-center shadow-xl bg-red-600 hover:bg-red-700 transition-colors text-white cursor-pointer">
                     <div className="flex items-center gap-2.5">
                       <AlertTriangle className="w-5 h-5" /> Llamar Guardia 24hs
                     </div>
                     {formData.telefonoGuardia && (
                       <span className="text-[10px] opacity-80 tracking-widest normal-case font-medium mt-1">{formData.telefonoGuardia}</span>
                     )}
                   </div>
                   
                   <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2 leading-relaxed">
                     <Info className="w-5 h-5 shrink-0" /> Por favor, avisar por WhatsApp al venir en camino para preparar la recepción.
                   </div>
                 </div>
              ) : (
                 <div className="w-full">
                   <div className="w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 shadow-xl bg-[#25D366] text-white">
                     <Smartphone className="w-5 h-5" /> Contactar Clínica
                   </div>
                 </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#1A3D3D] relative overflow-hidden pt-5 pb-5 text-left print:hidden mt-16 border-t-[6px] ">
        <div className="max-w-[1200px] mx-auto px-8 md:px-10 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3 opacity-60">
              <ShieldCheck className="w-6 h-6 text-white" />
              <p className="text-[12px] font-bold uppercase tracking-widest text-white">Gestión Segura · El Portal</p>
           </div>
           
        </div>
      </footer>
    </div>
  );
}