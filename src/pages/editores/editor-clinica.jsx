import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, 
  ArrowUp, ArrowDown, MapPin, ShieldCheck, Check, ArrowLeft,
  Smartphone, Home, Mail, Award, ChevronDown, 
  ArrowRight, ExternalLink, Heart,
  Menu, User, LayoutGrid, Edit, Briefcase, FileText, Undo2, Redo2, FileCheck, Building2, AlertTriangle, Syringe, Activity, Microscope, Stethoscope, Crop, Sparkles, Loader2, Globe, CreditCard, ArrowUpRight, Eye, EyeOff
} from 'lucide-react';

// ==========================================
// CATÁLOGO DE SERVICIOS PREDEFINIDOS
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
      onClick={(e) => { if (e.cancelable !== false) e.preventDefault(); e.stopPropagation(); setIsVisible(!isVisible); }}
    >
      <div className="bg-[#2D6A6A]/10 p-1 rounded-full border border-[#2D6A6A]/20 group-hover:bg-[#2D6A6A] transition-colors duration-300">
        <Info className="w-4 h-4 text-[#2D6A6A] group-hover:text-white transition-colors" />
      </div>

      <div className={`
        transition-all duration-300 
        absolute 
        bottom-full 
        left-1/2
        ${isSection ? '-translate-x-[80%] sm:-translate-x-1/2' : '-translate-x-[20%] sm:-translate-x-1/2'}
        mb-3 
        w-[240px] sm:w-[280px] 
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
             <div className="absolute top-full left-[80%] sm:left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white"></div>
           </div>
        ) : (
           <div className="bg-[#1A3D3D] text-white text-sm font-medium p-3 rounded-xl shadow-2xl relative text-left border border-white/10">
             {text}
             <div className="absolute top-full left-[20%] sm:left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1A3D3D]"></div>
           </div>
        )}
      </div>
    </div>
  );
};

const InputGroup = ({ label, id, type = "text", placeholder, value, onChange, tooltip, error, required, maxLength, disabled, readOnly, canTest, rows = "4" }) => {
  const isNearLimit = maxLength && value && value.length >= maxLength * 0.9;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
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
            id={id} name={id} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} rows={rows} disabled={disabled} readOnly={readOnly}
            className={`w-full border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-4 text-base font-medium focus:outline-none transition-all resize-none ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-200' : 'bg-gray-50/50 text-[#1A3D3D] disabled:opacity-50'}`}
          />
        ) : (
          <input
            id={id} name={id} type={currentType} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} disabled={disabled} readOnly={readOnly}
            className={`w-full border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-3.5 text-base font-medium focus:outline-none transition-all ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-200' : 'bg-gray-50/50 text-[#1A3D3D] disabled:opacity-50'} ${(canTest || isPassword) ? 'pr-12' : ''}`}
          />
        )}
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4DB6AC] transition-colors p-1 z-10"
            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {canTest && value && !isPassword && (
          <a 
            href={value.startsWith('http') ? value : `https://${value}`} 
            target="_blank" 
            rel="noreferrer"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all shadow-sm z-10 bg-white border-gray-200 text-gray-500 hover:text-[#4DB6AC] hover:border-[#4DB6AC] cursor-pointer"
            title="Probar enlace"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
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
    <div className="border-b border-gray-100 last:border-0 group relative z-[1]">
      <button 
        type="button" 
        onClick={onToggle} 
        className={`w-full flex justify-between items-center transition-all duration-300 py-6 px-6 md:px-5 md:rounded-t-[24px] ${isOpen ? 'md:bg-gray-50/80 shadow-sm' : 'md:hover:bg-gray-50'}`}
      >
        <div className="flex items-center text-left gap-3 md:gap-4">
          <div className={`p-2.5 rounded-xl transition-all duration-300 ease-in-out ${isOpen ? 'bg-[#1A3D3D] text-white' : 'bg-transparent text-[#2D6A6A]'}`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <h3 className={`font-black text-sm md:text-base uppercase tracking-wider transition-colors duration-300 ${isOpen ? 'text-[#1A3D3D]' : 'text-gray-500 md:text-[#1A3D3D]'}`}>
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
            <ChevronDown className={`w-6 h-6 transition-all duration-300 ease-in-out ${isOpen ? 'rotate-180 text-[#2D6A6A]' : 'rotate-0 text-gray-300 group-hover:text-[#2D6A6A]'}`} />
          </div>
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="py-6 px-6 md:px-5">
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
  const borderRadius = type === 'logo' ? '1.5rem' : '1.5rem';

  const handlePointerDown = (e) => {
    if (e.cancelable !== false) e.preventDefault();
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
    
    const baseScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    const finalScale = baseScale * zoom;
    const drawWidth = img.naturalWidth * finalScale;
    const drawHeight = img.naturalHeight * finalScale;
    const drawX = (CROP_SIZE - drawWidth) / 2 + position.x;
    const drawY = (CROP_SIZE - drawHeight) / 2 + position.y;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div 
        className="relative bg-gray-100 overflow-hidden cursor-move touch-none shadow-inner max-w-full"
        style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius }}
        onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
      >
        <img 
          ref={imgRef} src={imageSrc} alt="Original" className="absolute pointer-events-none select-none max-w-none" draggable={false}
          style={{
            transform: `translate3d(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px), 0) scale(${zoom})`,
            left: '50%', top: '50%', width: '100%', height: '100%', objectFit: 'cover', transformOrigin: 'center center'
          }}
        />
        <div className="absolute inset-0 pointer-events-none border-4 border-[#2D6A6A]/40" style={{ borderRadius }}></div>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <Crop className="w-10 h-10 text-white opacity-40 drop-shadow-md" />
        </div>
      </div>
      <div className="mt-8 w-full max-w-[256px]">
        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between"><span>Alejar</span><span>Acercar</span></label>
        <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-[#2D6A6A] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
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


// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
export default function EditorClinico() { 
  const [activeTab, setActiveTab] = useState('perfil'); 
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false); 
  const [openSection, setOpenSection] = useState(null);
  const [nuevaSubOpcion, setNuevaSubOpcion] = useState({ idServicio: null, texto: '' });
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, targetId: null, type: null });
  const [saveStatus, setSaveStatus] = useState('idle');

  // ESTADO PARA SUSCRIPCIÓN ACTIVA/INACTIVA (falso por defecto para mostrar el mockup de advertencia)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  const initialData = {
    cuentaEmail: 'clinica@vetsur.com.ar',
    cuentaPassword: 'vetsur2026',
    cuentaTelefono: '5491145678901',
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
    const { name, id, value } = e.target;
    const fieldName = name || id;
    setFormData(prev => ({ ...prev, [fieldName]: value }));
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

  const handleSaveData = () => {
    if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.foto) {
      setModalConfig({ 
        isOpen: true, 
        title: 'Faltan datos requeridos', 
        message: 'Asegúrate de haber ingresado el Logo, el Nombre de la Institución y la Dirección Física antes de publicar el perfil.', 
        type: 'error' 
      });
      setActiveTab('perfil');
      setOpenSection('identidad'); 
      return;
    }

    setSaveStatus('saving');
    
    setTimeout(() => {
      setSaveStatus('saved');
      setModalConfig({ 
        isOpen: true, 
        title: '¡Publicación Exitosa!', 
        message: 'Los datos de tu clínica han sido guardados y ya se encuentran actualizados en la red.', 
        type: 'success' 
      });
      setTimeout(() => setSaveStatus('idle'), 2500);
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
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased text-left text-[#1A3D3D] selection:bg-[#4DB6AC] selection:text-white relative w-full overflow-x-hidden flex flex-col">
      
      {/* MODALES */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/95 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
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

      {/* MODAL DE SUSCRIPCIÓN */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/95 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#009EE3]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#009EE3]" /></div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Facturación</h3>
              </div>
              <button onClick={() => setIsSubModalOpen(false)} className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-2">Plan Actual</p>
                <h2 className="text-4xl font-black text-[#1A3D3D] font-['Montserrat']">Clínica PRO</h2>
                <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-bold border ${isSubscriptionActive ? 'bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                  <span className={`w-2 h-2 rounded-full ${isSubscriptionActive ? 'bg-[#4DB6AC]' : 'bg-red-500'}`}></span>
                  {isSubscriptionActive ? 'Activo' : 'Inactivo (Falta de pago)'}
                </div>
              </div>

              {isSubscriptionActive && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500 font-medium">Próximo cobro</span>
                    <span className="text-sm font-bold text-[#1A3D3D]">15 de Junio, 2026</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Método de pago</span>
                    <span className="text-sm font-bold text-[#1A3D3D] flex items-center gap-2">Visa terminada en 4242</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setIsSubscriptionActive(true);
                    setIsSubModalOpen(false);
                    setModalConfig({ isOpen: true, title: '¡Pago Exitoso!', message: 'Tu cuenta ha sido reactivada y tu perfil vuelve a ser visible.', type: 'success' });
                  }}
                  className="w-full py-4 rounded-xl font-bold text-sm bg-[#009EE3] text-white hover:bg-[#0080B7] transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  Simular Pago (Mercado Pago) <ArrowUpRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setIsSubscriptionActive(false);
                    setIsSubModalOpen(false);
                  }}
                  className="w-full py-4 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                >
                  Simular Vencimiento
                </button>
                {isSubscriptionActive && (
                  <button className="w-full py-4 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                    Cancelar Suscripción
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {cropModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/95 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
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

      {/* NAVBAR DE APLICACIÓN (h: 64px) */}
      <nav className="fixed top-0 w-full z-[80] h-[64px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 md:px-10 shadow-sm">
        <div className="max-w-[1100px] w-full mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-gray-400 hover:text-[#4DB6AC] transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
               <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-bold hidden sm:block">Volver al Portal</span>
            </button>
            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-xl tracking-tight cursor-pointer">
                El Portal<span className="text-[#2D6A6A]">.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right mr-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#1A3D3D] truncate max-w-[150px]">{formData.nombre || 'Clínica'}</p>
              <p className="text-[10px] font-bold text-[#4DB6AC]">Clínica</p>
            </div>
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-100 shrink-0 flex items-center justify-center">
               {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <Building2 className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

        </div>
      </nav>

      {/* LAYOUT PRINCIPAL (Padding 76px) */}
      <div className="pt-[76px] max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col gap-6 w-full pb-10">
        
        {/* BANNER DE SUSCRIPCIÓN INACTIVA */}
        {!isSubscriptionActive && (
          <div className="w-full bg-orange-50 border border-orange-200 rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm animate-in fade-in slide-in-from-top-4 z-10">
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <div className="w-12 h-12 bg-orange-100/50 rounded-full flex items-center justify-center shrink-0 border border-orange-200">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-orange-800 text-base md:text-lg">Cuenta suspendida por falta de pago</h3>
                <p className="text-sm text-orange-700/90 font-medium mt-0.5 leading-snug">Tu perfil clínico no está visible en el directorio. Regularizá tu situación para volver a aparecer.</p>
              </div>
            </div>
            <button
              onClick={() => setIsSubModalOpen(true)}
              className="shrink-0 w-full md:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Regularizar pago
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-start relative flex-1 w-full">
          {/* COLUMNA IZQUIERDA: SIDEBAR */}
          <div className="w-full md:w-[260px] shrink-0 md:sticky md:top-[96px] self-start z-20">
            
            <div className="h-[48px] flex items-center mb-6 px-1">
               <h2 className="text-[28px] font-black font-['Montserrat'] uppercase tracking-tight text-[#1A3D3D] hidden md:block leading-none">
                 Configuración
               </h2>
            </div>
            
            <nav className="flex flex-col gap-1.5 pb-2 md:pb-0 bg-white md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">
              <button onClick={() => setActiveTab('cuenta')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'cuenta' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <User className={`w-5 h-5 ${activeTab === 'cuenta' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Sobre mi cuenta
              </button>
              <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'perfil' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <Building2 className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Mi perfil público
              </button>
              <button onClick={() => setActiveTab('servicios')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'servicios' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <Activity className={`w-5 h-5 ${activeTab === 'servicios' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Especialidades
              </button>
              <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'staff' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <User className={`w-5 h-5 ${activeTab === 'staff' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Staff Médico
              </button>
            </nav>
          </div>

          {/* COLUMNA DERECHA: ÁREA PRINCIPAL */}
          <div className="flex-1 w-full flex flex-col min-w-0">
            
            {/* BARRA DE ACCIÓN SUPERIOR ALINEADA (Alto 48px) */}
            <div className="flex justify-between items-center mb-6 h-[48px] w-full">
               <div className="flex items-center gap-2 shrink-0">
                  <button onClick={undo} disabled={past.length === 0} className={`p-2.5 rounded-xl transition-all border ${past.length > 0 ? 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] shadow-sm' : 'bg-transparent border-transparent text-gray-300'}`} title="Deshacer"><Undo2 className="w-5 h-5" /></button>
                  <button onClick={redo} disabled={future.length === 0} className={`p-2.5 rounded-xl transition-all border ${future.length > 0 ? 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] shadow-sm' : 'bg-transparent border-transparent text-gray-300'}`} title="Rehacer"><Redo2 className="w-5 h-5" /></button>
               </div>

               <button 
                 onClick={handleSaveData} 
                 disabled={saveStatus === 'saving' || saveStatus === 'saved'} 
                 className={`px-6 md:px-8 py-3 rounded-xl font-bold text-[11px] md:text-[12px] uppercase tracking-[0.15em] shadow-md transition-all flex items-center justify-center gap-2
                    ${saveStatus === 'saving' ? 'bg-[#1A3D3D] text-white opacity-70 cursor-not-allowed' : 
                      saveStatus === 'saved' ? 'bg-[#4DB6AC] text-white cursor-default' : 
                      'bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] hover:-translate-y-0.5'}`}
               >
                 {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                 {saveStatus === 'saved' && <Check className="w-4 h-4" />}
                 {saveStatus === 'idle' && <Save className="w-4 h-4" />}
                 {saveStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                 
                 {saveStatus === 'saving' ? <span className="hidden sm:inline">Guardando...</span> : 
                  saveStatus === 'saved' ? <span className="hidden sm:inline">¡Guardado!</span> : 
                  saveStatus === 'error' ? <span className="hidden sm:inline">Error</span> : 
                  <span className="hidden sm:inline">Guardar Cambios</span>}
                 {saveStatus === 'idle' && <span className="sm:hidden">Guardar</span>}
               </button>
            </div>

            {/* TAB 1: SOBRE MI CUENTA */}
            {activeTab === 'cuenta' && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 animate-in fade-in duration-300 min-h-[500px]">
                <h3 className="text-2xl font-black text-[#1A3D3D] mb-8 font-['Montserrat']">Sobre mi cuenta</h3>
                <p className="text-sm text-gray-500 mb-8">Información privada para el acceso a la plataforma y facturación. Esto no será visible para los usuarios.</p>

                <div className="max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-start">
                     <InputGroup label="Email de Acceso" id="cuentaEmail" type="email" value={formData.cuentaEmail} readOnly tooltip="Este email está vinculado a tu cuenta y no puede modificarse desde aquí." />
                     <InputGroup label="Contraseña" id="cuentaPassword" type="password" value={formData.cuentaPassword} onChange={handleChange} placeholder="••••••••" tooltip="Modificá este campo solo si querés cambiar tu contraseña." />
                     <div className="md:col-span-2">
                       <InputGroup label="Teléfono de Recuperación" id="cuentaTelefono" type="tel" value={formData.cuentaTelefono} readOnly tooltip="Número validado para la recuperación de la cuenta." />
                     </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-100">
                     <h4 className="flex items-center gap-2 text-sm font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5">
                       <CreditCard className="w-5 h-5 text-[#2D6A6A]" /> Estado de la mensualidad
                     </h4>
                     <div className={`border p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors ${isSubscriptionActive ? 'bg-gray-50 border-gray-200' : 'bg-red-50/50 border-red-200'}`}>
                        <div>
                           <p className={`font-bold text-lg ${isSubscriptionActive ? 'text-[#1A3D3D]' : 'text-red-800'}`}>Plan Clínica PRO</p>
                           <div className="flex items-center gap-2 mt-1">
                             <span className={`w-2 h-2 rounded-full ${isSubscriptionActive ? 'bg-[#4DB6AC]' : 'bg-red-500'}`}></span>
                             <p className={`text-sm font-medium ${isSubscriptionActive ? 'text-gray-600' : 'text-red-600'}`}>{isSubscriptionActive ? 'Suscripción activa' : 'Suspendida por falta de pago'}</p>
                           </div>
                        </div>
                        <button onClick={() => setIsSubModalOpen(true)} className={`text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm border ${isSubscriptionActive ? 'text-gray-500 hover:text-[#4DB6AC] border-gray-200 bg-white hover:border-[#4DB6AC]' : 'bg-red-600 text-white border-red-600 hover:bg-red-700'}`}>
                          {isSubscriptionActive ? 'Gestionar pagos' : 'Regularizar pago'}
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MI PERFIL PÚBLICO */}
            {activeTab === 'perfil' && (
              <div className="flex flex-col w-full animate-in fade-in duration-300 relative">
                
                {/* TARJETA DE HEADER (Mockup Horizontal) */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center p-6 gap-6">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-[24px] overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                      {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> : <Building2 className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#4DB6AC] p-1.5 rounded-xl border-2 border-white"><ShieldCheck className="w-3 h-3 text-white" /></div>
                  </div>

                  {/* Info Corta */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] truncate leading-tight mb-1">{formData.nombre || "Nombre de Clínica"}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      {formData.guardia24hs && <span className="text-white bg-red-500 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Guardia 24hs</span>}
                      {formData.añosExperiencia && <span className="text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">+{formData.añosExperiencia} Años Exp.</span>}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-[#2D6A6A] shrink-0" /> {formData.direccion || "Dirección no especificada"}</span>
                    </div>
                  </div>

                  {/* Caja de Progreso */}
                  <div className="w-full md:w-[280px] bg-gray-50 p-5 rounded-[20px] border border-gray-100 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-white rounded-md shadow-sm border border-gray-100"><FileCheck className="w-3.5 h-3.5 text-[#4DB6AC]" /></div>
                        <h4 className="text-[#1A3D3D] text-[10px] font-black uppercase tracking-[0.05em]">Estado del Perfil</h4>
                      </div>
                      <span className="text-[#1A3D3D] font-black text-sm">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#4DB6AC] transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* FORMULARIO ACORDEONES */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 mb-6">
                  
                  <div className="pt-6 px-6 md:px-10 pb-4">
                    <h3 className="text-xl font-black text-[#1A3D3D] mb-1 font-['Montserrat']">Mi perfil público</h3>
                    <p className="text-xs text-gray-500 mb-0">Toda la info que cargues aquí será la que tus clientes verán en el directorio.</p>
                  </div>

                  <div className="border-t border-gray-100">
                    {/* IDENTIDAD VISUAL */}
                    <Accordion title="Identidad de la Clínica" icon={Building2} isOpen={openSection === 'identidad'} onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}>
                      <div className="flex flex-col sm:flex-row gap-8 mb-8 mt-2 md:mt-0">
                        <div className="relative group cursor-pointer shrink-0 text-left">
                          <div onClick={() => triggerFileInput(fileInputRef)} className={`w-32 h-32 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img`}>
                            {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <Camera className="w-8 h-8 text-gray-300" />}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"><Camera className="w-8 h-8 text-white" /></div>
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} />
                        </div>
                        <div className="flex-1 text-left flex flex-col justify-center">
                          <h3 className="text-sm font-bold text-[#1A3D3D] mb-2 uppercase tracking-wide flex items-center">
                            Logo Institucional <span className="text-red-400 ml-1">*</span>
                            <Tooltip text="Sube el logo de tu clínica en alta resolución. Fondo blanco o transparente recomendado." />
                          </h3>
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed">Formatos PNG o JPG. Máx 2MB.</p>
                        </div>
                      </div>

                      <InputGroup type="textarea" rows="2" label="Nombre de la Institución" id="nombre" value={formData.nombre} onChange={handleChange} required />
                      <InputGroup type="textarea" rows="2" label="Eslogan / Subtítulo" id="subtitulo" value={formData.subtitulo} onChange={handleChange} maxLength={60} tooltip="Atrae la atención rápidamente. Ej: Cuidado profesional para tu mejor amigo" />
                      <InputGroup type="textarea" rows="3" label="Descripción Corta (Hero)" id="descripcion" value={formData.descripcion} onChange={handleChange} maxLength={200} placeholder="Breve resumen de 2 o 3 líneas sobre su institución..." tooltip="Este texto acompaña tu logo principal en la presentación de la página." />
                      <InputGroup type="number" label="Años de Experiencia" id="añosExperiencia" value={formData.añosExperiencia} onChange={handleChange} tooltip="Se mostrará de forma destacada como una medalla de confianza." />
                      <InputGroup type="textarea" label="Nuestra Historia" id="historia" value={formData.historia} onChange={handleChange} maxLength={800} tooltip="Aparecerá en la sección principal 'Nosotros'. Cuéntale al público cómo nació la clínica y cuáles son sus valores." />
                    </Accordion>

                    {/* GUARDIA Y EMERGENCIAS */}
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
                             <InputGroup label="Línea Directa de Emergencias (Opcional)" id="telefonoGuardia" value={formData.telefonoGuardia} onChange={handleChange} placeholder="Dejar vacío para usar el teléfono principal" tooltip="Si tienes un celular o línea exclusiva para urgencias, ingrésalo aquí." />
                             <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl flex items-start gap-2 leading-relaxed mt-2">
                               <Info className="w-4 h-4 shrink-0 mt-0.5" /> 
                               <span>Todos los perfiles con Guardia 24hs mostrarán el aviso general: <i>"Por favor, avisar por WhatsApp al venir en camino para preparar la recepción."</i></span>
                             </div>
                           </div>
                         )}
                      </div>
                    </Accordion>

                    {/* CONTACTO Y UBICACIÓN */}
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
                </div>

                {/* LINK INFERIOR PARA VER PERFIL */}
                <div className="flex justify-center pb-6 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setModalConfig({ isOpen: true, title: 'Navegación', message: `Yendo a: /perfil`, type: 'info' })} 
                    className="text-center block text-gray-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-[#4DB6AC] transition-colors flex items-center justify-center gap-2 group bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm"
                  >
                    Ver mi perfil público <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ESPECIALIDADES */}
            {activeTab === 'servicios' && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8">
                   <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat']">Especialidades y Servicios</h3>
                   <p className="text-sm text-gray-500 mt-1">Selecciona las prestaciones disponibles en tu centro médico.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {CATALOGO_SERVICIOS.map(srv => {
                    const isActive = formData.servicios[srv.id]?.activo;
                    const seleccionadas = formData.servicios[srv.id]?.subOpcionesSeleccionadas || [];

                    return (
                      <div key={srv.id} className={`flex flex-col rounded-[24px] border transition-all duration-300 ${isActive ? 'border-[#2D6A6A] bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}>
                        <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-[24px]" onClick={() => toggleServicio(srv.id)}>
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-[#1A3D3D] border-[#1A3D3D]' : 'bg-white border-gray-300'}`}>
                            {isActive && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-3">
                             <srv.icono className={`w-5 h-5 ${isActive ? 'text-[#2D6A6A]' : 'text-gray-400'}`} />
                             <span className={`text-base font-black ${isActive ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{srv.titulo}</span>
                          </div>
                        </div>
                        
                        <div className="px-5 pb-6">
                          <div className="border-t border-gray-200/60 pt-5">
                             <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isActive ? 'text-gray-400' : 'text-gray-300'}`}>Sub-especialidades</p>
                             <div className={`flex flex-col items-start gap-2.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                               {[...new Set([...srv.opciones, ...seleccionadas])].map(opcion => {
                                 const isChecked = seleccionadas.includes(opcion);
                                 return (
                                   <React.Fragment key={opcion}>
                                     <button 
                                      type="button" onClick={() => toggleSubOpcion(srv.id, opcion)}
                                      className={`w-full justify-start px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-colors flex items-center gap-3 shadow-sm ${isChecked ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A6A]'}`}
                                     >
                                       <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked ? 'bg-white border-white' : 'border-gray-300'}`}>
                                         {isChecked && <Check className="w-3 h-3 text-[#1A3D3D]" />}
                                      </div>
                                       <span className="text-left">{opcion}</span>
                                     </button>
                                     {opcion === 'Terapias Holísticas' && isChecked && (
                                       <div className="w-full pl-6 pr-1 py-1 animate-in fade-in slide-in-from-top-1">
                                         <div className="relative">
                                           <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#2D6A6A]/20 -ml-3 rounded-full"></div>
                                           <input 
                                             type="text" placeholder="Ej: Acupuntura, Reiki, Flores de Bach..." 
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
                                    type="text" autoFocus value={nuevaSubOpcion.texto}
                                    onChange={(e) => setNuevaSubOpcion({ ...nuevaSubOpcion, texto: e.target.value })}
                                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarSubOpcionPersonalizada(srv.id); } }}
                                    placeholder="Escribir especialidad..." className="px-4 py-3 text-xs font-bold rounded-xl border border-[#2D6A6A] outline-none flex-1 bg-white shadow-sm"
                                   />
                                   <button type="button" onClick={() => agregarSubOpcionPersonalizada(srv.id)} className="bg-[#2D6A6A] text-white p-3 rounded-xl shrink-0 shadow-sm hover:bg-[#1A3D3D] transition-colors"><Plus className="w-4 h-4" /></button>
                                   <button type="button" onClick={() => setNuevaSubOpcion({ idServicio: null, texto: '' })} className="bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 p-3 rounded-xl shrink-0 shadow-sm transition-colors"><X className="w-4 h-4" /></button>
                                 </div>
                               ) : (
                                 <button 
                                  type="button" onClick={() => setNuevaSubOpcion({ idServicio: srv.id, texto: '' })}
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
              </div>
            )}

            {/* TAB 4: STAFF */}
            {activeTab === 'staff' && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8">
                   <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat']">Staff Médico</h3>
                   <p className="text-sm text-gray-500 mt-1">Presenta a los especialistas que trabajan en tu centro. Esto genera mucha confianza en los tutores.</p>
                </div>

                <div className="space-y-6">
                  {formData.staff.map((item, index) => (
                    <div key={item.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 text-left relative group/staff shadow-sm hover:border-[#4DB6AC] transition-all">
                      <button onClick={() => handleArrayRemove('staff', item.id)} className="absolute top-4 right-4 p-2 bg-white text-gray-300 hover:text-red-500 rounded-xl border border-transparent hover:border-red-100 shadow-sm opacity-0 group-hover/staff:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      
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
                      
                      <div className="flex-1 space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Nombre Completo</label>
                            <input type="text" placeholder="Ej: Dra. Valeria Rojas" value={item.nombre} onChange={(e) => handleArrayUpdate('staff', item.id, 'nombre', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-[#1A3D3D] focus:border-[#2D6A6A] outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Matrícula</label>
                            <input type="text" placeholder="Ej: MV 3108" value={item.matricula} onChange={(e) => handleArrayUpdate('staff', item.id, 'matricula', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-[#1A3D3D] focus:border-[#2D6A6A] outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Especialidad / Cargo</label>
                          <input type="text" placeholder="Ej: Director Médico, Cirujano..." value={item.especialidad} onChange={(e) => handleArrayUpdate('staff', item.id, 'especialidad', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-[#2D6A6A] focus:border-[#2D6A6A] outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 flex justify-between items-center">
                            Breve Descripción
                            <span className={`text-[11px] tracking-wider ${item.bio?.length >= 140 ? 'text-red-500' : 'text-gray-400'}`}>{item.bio?.length || 0} / 150</span>
                          </label>
                          <textarea placeholder="Resumen de experiencia profesional..." value={item.bio} onChange={(e) => handleArrayUpdate('staff', item.id, 'bio', e.target.value)} maxLength={150} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 text-[#1A3D3D] focus:border-[#2D6A6A] outline-none" />
                        </div>
                      </div>
                      
                      <div className="hidden md:flex flex-col gap-1.5 mt-1 shrink-0">
                        <button type="button" onClick={() => handleArrayMove('staff', index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowUp className="w-5 h-5" /></button>
                        <button type="button" onClick={() => handleArrayMove('staff', index, 'down')} disabled={index === formData.staff.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20 transition-colors"><ArrowDown className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => handleArrayAdd('staff', { nombre: "", especialidad: "", matricula: "", bio: "", foto: "" })} className="w-full py-4 border-2 border-dashed border-gray-300 bg-white rounded-3xl text-[#2D6A6A] text-sm font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <Plus className="w-5 h-5" /> Agregar Profesional al Staff
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FOOTER ESMERALDA DEGRADADO */}
      <footer className="w-full mt-auto py-6 bg-gradient-to-r from-[#1A3D3D] via-[#2D6A6A] to-[#1A3D3D] shadow-[0_-4px_20px_rgba(45,106,106,0.15)] z-10 relative">
         <div className="max-w-[1100px] mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/80">
            <p>© {new Date().getFullYear()} El Portal Veterinario. Todos los derechos reservados.</p>
            <p className="text-[#4DB6AC] font-bold tracking-wide">Panel de Gestión de Clínicas</p>
         </div>
      </footer>

    </div>
  );
}