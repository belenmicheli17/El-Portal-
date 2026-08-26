import React, { useState, useEffect, useRef } from 'react';

// Si usas react-router-dom, descomenta la siguiente línea en tu entorno real:
import { useNavigate, useLocation } from 'react-router-dom';
import { db, storage } from '../../firebase'; // <-- Sumamos storage
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, uploadString } from 'firebase/storage'; // <-- Sumamos funciones de Storage
import FooterSimple from '../../components/FooterSimple';
import { useAuth } from '../../context/AuthContext';
import especialidadesData from '../../data/especialidades.json';
import provincias from '../../data/provincias.js';
import { 
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, Crown,
  ArrowUp, ArrowDown, MapPin, ShieldCheck, Check, ArrowLeft,
  Smartphone, Home, Mail, Award, ChevronDown, Phone,
  ArrowRight, ExternalLink, Lock, Zap, Clock, Heart, Brain, Turtle, CircleUserRound,
  Menu, User, LayoutGrid, Edit, Briefcase, FileText, Undo2, Redo2, FileCheck, Building2, AlertTriangle, Syringe, Activity, Microscope, Stethoscope, Crop, Sparkles, Loader2, Globe, CreditCard, ArrowUpRight, Eye, EyeOff, MessageSquare, Image as ImageIcon, BookOpen, UploadCloud, FileDown 
} from 'lucide-react';

// ==========================================
// COMPONENTES DE UI REUTILIZABLES 
// ==========================================
// Íconos personalizados de alta calidad para mantener el estilo "Premium"
const IconoHueso = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bone-icon lucide-bone"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg>
);

const IconoPildora = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>
  </svg>
);

const IconoBisturi = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 22 18.5 7.5L22 11l-6 11Z"/><path d="M12 5 8 9"/><path d="m11 8 4 4"/><path d="m5 12 7 7"/>
  </svg>
);

const Tooltip = ({ text, isSection = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const boxRef = useRef(null);
  const [xOffset, setXOffset] = useState(0);

  useEffect(() => {
    // Si el tooltip está abierto, calculamos su posición en pantalla
    if (isVisible && boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      const margin = 16; // Margen de seguridad en píxeles contra los bordes del celular

      // Si choca por la izquierda, lo empujamos a la derecha. Si choca por la derecha, a la izquierda.
      if (rect.left < margin) {
        setXOffset(margin - rect.left);
      } else if (rect.right > window.innerWidth - margin) {
        setXOffset((window.innerWidth - margin) - rect.right);
      }
    } else {
      // Reiniciamos la posición cuando se cierra para el próximo uso
      setXOffset(0);
    }
  }, [isVisible]);

  return (
    <div 
      className="group relative inline-flex items-center ml-2 cursor-help z-[100]"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => { 
        if (e.cancelable !== false) e.preventDefault(); 
        e.stopPropagation(); 
        setIsVisible(!isVisible); 
      }}
    >
      {/* Ícono de Información */}
      <div className="bg-[#2D6A6A]/10 p-1 rounded-full border border-[#2D6A6A]/20 group-hover:bg-[#2D6A6A] transition-colors duration-300">
        <Info className="w-4 h-4 text-[#2D6A6A] group-hover:text-white transition-colors" />
      </div>

      {/* Contenedor principal (Siempre fijo y centrado sobre el ícono) */}
      <div className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[110]
        transition-all duration-300 flex flex-col items-center
        ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}>
        
        {/* Caja de texto (Se desliza sola usando transform si choca con los bordes) */}
        <div 
          ref={boxRef}
          style={{ transform: `translateX(${xOffset}px)` }}
          className={`
            w-[260px] sm:w-[280px] text-left leading-relaxed normal-case tracking-normal font-normal transition-transform duration-200 ease-out
            ${isSection 
              ? 'bg-white border border-gray-100 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]' 
              : 'bg-[#1A3D3D] text-white text-sm font-medium p-3 rounded-xl shadow-2xl border border-white/10'
            }
          `}
        >
          {isSection && (
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A]"></div>
                <span className="text-xs font-black text-[#2D6A6A] tracking-wide uppercase">Importante</span>
            </div>
          )}
          <p className={isSection ? "text-sm text-gray-600 font-medium leading-relaxed" : ""}>{text}</p>
        </div>

        {/* Triangulito inferior (Fuera de la caja de texto para que no se mueva) */}
        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent ${isSection ? 'border-t-white' : 'border-t-[#1A3D3D]'}`}></div>
        
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
      <span className="text-sm font-bold text-[#1A3D3D]">{label}</span>
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

const Accordion = ({ title, icon: Icon, children, isOpen, onToggle, tooltip, isBioWarning, bioLength }) => {
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
          {bioLength !== undefined && (
            <span className={`text-xs font-bold transition-all ${isBioWarning ? 'text-red-500 animate-pulse' : 'text-gray-400'} ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              {bioLength} / 350
            </span>
          )}
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

const SimpleCropper = ({ imageSrc, onCrop, onCancel, type }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  
  const CROP_SIZE = 256;
  const borderRadius = type === 'perfil' ? '50%' : '1.5rem';

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
            left: '50%', top: '50%', width: 'auto', height: 'auto', maxWidth: 'none', transformOrigin: 'center center'
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
          <Check className="w-5 h-5" /> Aplicar
        </button>
      </div>
    </div>
  );
};

// ==========================================
// APLICACIÓN PRINCIPAL (EDITOR PROFESIONAL)
// ==========================================
export default function EditorProfesional() { 
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate(); 
  const location = useLocation(); // <-- Inicializamos useLocation
  const [activeTab, setActiveTab] = useState('cuenta'); 

  // <-- NUEVO: Si la URL trae un pedido de pestaña, la activamos
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
      // Limpiamos el historial para que no se vuelva a abrir si el usuario recarga la página manualmente
      window.history.replaceState({}, document.title);
    }
  }, [location]); 
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [desktopHintVisto, setDesktopHintVisto] = useState(() => !!localStorage.getItem('editorDesktopHintVisto'));

  useEffect(() => {
    const handleStorage = () => {
      setDesktopHintVisto(!!localStorage.getItem('editorDesktopHintVisto'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false); 
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, targetId: null, type: null, caseId: null });
  const [saveStatus, setSaveStatus] = useState('idle');
  const [gruposExpandidos, setGruposExpandidos] = useState({});
  const [nuevosServicios, setNuevosServicios] = useState({});
const [tooltipHintVisto, setTooltipHintVisto] = useState(true); 

  const [planType, setPlanType] = useState('pro');
  const [tempSelectedPlan, setTempSelectedPlan] = useState('pro'); 
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);

  const isPro = planType === 'pro';
  // Carga inicial de datos desde Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser?.uid) return;

        // Revisamos el hint SIEMPRE, independientemente de si hay perfil cargado
        const userDocSnapHint = await getDoc(doc(db, 'usuarios', currentUser.uid));
        if (userDocSnapHint.exists()) {
          setTooltipHintVisto(userDocSnapHint.data().tooltipHintVisto ?? false);
        } else {
          setTooltipHintVisto(false);
        }
        
        // Buscamos en la base de datos usando el UID real del profesional logueado
        const docRef = doc(db, 'profesionales', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        // Leemos siempre los datos de 'usuarios' (incluso si no hay perfil en 'profesionales' aún)
        const userDocSnap = await getDoc(doc(db, 'usuarios', currentUser.uid));
        const datosUsuario = userDocSnap.exists() ? userDocSnap.data() : {};
        console.log('🔍 datosUsuario desde Firestore:', datosUsuario);
        console.log('🏅 socioVitalicio:', datosUsuario.socioVitalicio);
        setTooltipHintVisto(datosUsuario.tooltipHintVisto ?? false);

        // Siempre inyectamos socioVitalicio en formData, exista o no el doc de profesionales
        _setFormData(prev => ({ ...prev, socioVitalicio: datosUsuario.socioVitalicio || false }));

        if (docSnap.exists()) {
          const dbData = docSnap.data();
          // Cargamos el email desde Firebase Auth directamente
          dbData.cuentaEmail = auth.currentUser?.email || '';
          // Inyectamos socioVitalicio desde 'usuarios'
          dbData.socioVitalicio = datosUsuario.socioVitalicio || false;
          if (userDocSnap.exists()) {
            dbData.socioVitalicio = userDocSnap.data().socioVitalicio || false;
            setTooltipHintVisto(userDocSnap.data().tooltipHintVisto ?? false);
          } else {
            setTooltipHintVisto(false);
          }
          
          // Buscamos los papers en la colección global
          const qPapers = query(collection(db, 'papers'), where('autorId', '==', currentUser.uid));
          const papersSnap = await getDocs(qPapers);
          const misPapers = papersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const dataCompleta = { ...dbData, papers: misPapers };

          // Actualizamos el formulario
          _setFormData(prev => ({ ...prev, ...dataCompleta }));
console.log("🔍 TRAYECTORIA CRUDA:", JSON.stringify(dataCompleta.trayectoria, null, 2));
          setSavedData({ ..._formData, ...dataCompleta });
        } else {
          setSavedData({ ..._formData });
        }
      } catch (error) {
        console.error("Error al cargar los datos desde Firebase:", error);
      }
    };

    fetchUserData();
  }, [currentUser]);
  const fileInputRef = useRef(null);
  const [_formData, _setFormData] = useState({
  // Cuenta
  cuentaEmail: '',
  cuentaPassword: '',
  cuentaTelefono: '',
  planActual: 'pro',
  visible: true,
  
  // Perfil Profesional
  slug: '',
  nombre: '',
apellido: '',
  especialidad: '',
  matricula: '',
  tipoMatricula: 'MP',
  provincia: 'Buenos Aires',
  bio: '',
  foto: '',
  fotosPerfil: [],
  atiendeDomicilio: false,
  emailContacto: '',
  instagram: '',
  linkedin: '',
  facebook: '',
  whatsappActivo: false,
  whatsappNum: '',
  
 // Arrays (Es vital que empiecen como arrays vacíos [])
  trayectoria: [],
  servicios: [],
  casos: [],
  zonas: [],
papers: [],
  galeria: []
});
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoRedAction = useRef(false);

  const [savedData, setSavedData] = useState(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const haycambiosSinGuardar = savedData !== null && JSON.stringify(_formData) !== JSON.stringify(savedData);

  const formData = _formData;
  
  const setFormData = (action) => {
    _setFormData((prev) => {
      const nextState = typeof action === 'function' ? action(prev) : action;
      if (!isUndoRedAction.current && JSON.stringify(prev) !== JSON.stringify(nextState)) {
         setPast(p => {
           const nuevoHistorial = [...p, prev];
           return nuevoHistorial.length > 15 ? nuevoHistorial.slice(nuevoHistorial.length - 15) : nuevoHistorial;
         });
         setFuture([]); 
      }
      isUndoRedAction.current = false;
      return nextState;
    });
  };

  const calculateProgress = () => {
    let score = 0;
    const weights = { identidad: 20, bio: 15, trayectoria: 15, servicios: 15, casos: 20, contacto: 15 };
    if (formData.foto && formData.nombre && formData.especialidad && formData.matricula) score += weights.identidad;
    if (formData.bio.length > 50) score += weights.bio;
    if (formData.trayectoria.length > 0) score += weights.trayectoria;
    if (formData.servicios.length > 0) score += weights.servicios;
    if (formData.casos.length > 0) score += weights.casos;
    if (formData.emailContacto && (formData.whatsappNum || formData.instagram || formData.linkedin)) score += weights.contacto;
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
    setFormData(prev => ({ ...prev, [id]: id === 'matricula' ? value.replace(/[^0-9-]/g, '') : value }));
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

  const updateClinica = (zonaId, clinicaId, field, value) => {
    setFormData(prev => ({
      ...prev,
      zonas: prev.zonas.map(z => z.id === zonaId ? {
        ...z, clinicas: z.clinicas.map(c => c.id === clinicaId ? { ...c, [field]: value } : c)
      } : z)
    }));
  };

  const removeCasoFoto = (casoId, fIdx) => {
    setFormData(prev => ({
      ...prev,
      casos: prev.casos.map(c => c.id === casoId ? { ...c, fotos: c.fotos.filter((_, i) => i !== fIdx) } : c)
    }));
  };

  const moveCasoFoto = (casoId, fIdx, dir) => {
    setFormData(prev => ({
      ...prev,
      casos: prev.casos.map(c => {
        if (c.id !== casoId) return c;
        const newFotos = [...c.fotos];
        if (dir === 'left' && fIdx > 0) [newFotos[fIdx - 1], newFotos[fIdx]] = [newFotos[fIdx], newFotos[fIdx - 1]];
        else if (dir === 'right' && fIdx < newFotos.length - 1) [newFotos[fIdx + 1], newFotos[fIdx]] = [newFotos[fIdx], newFotos[fIdx + 1]];
        return { ...c, fotos: newFotos };
      })
    }));
  };

const handleFileSelect = (e, target, caseId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Pasamos la imagen original al cropper sin procesar
      // El recorte y compresión ocurre DESPUÉS en saveCroppedImage
      setCropModal({ isOpen: true, imageSrc: event.target.result, targetId: target, caseId, type: target });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const saveCroppedImage = (croppedBase64) => {
    if (cropModal.targetId === 'perfil') {
      setFormData(prev => ({ 
        ...prev, foto: croppedBase64,
        fotosPerfil: prev.fotosPerfil.includes(croppedBase64) ? prev.fotosPerfil : [...prev.fotosPerfil, croppedBase64]
      }));
    } else if (cropModal.targetId === 'caso') {
      setFormData(prev => ({
        ...prev,
        casos: prev.casos.map(c => c.id === cropModal.caseId ? { ...c, fotos: [...c.fotos, croppedBase64] } : c)
      }));
    } else if (cropModal.targetId === 'paper') {
      setFormData(prev => ({
        ...prev,
        papers: prev.papers.map(p => p.id === cropModal.caseId ? { ...p, portada: croppedBase64 } : p)
      }));
    }
    setCropModal({ isOpen: false, imageSrc: null, targetId: null, caseId: null, type: null });
  };

  const deleteProfilePhoto = (url, e) => {
    e.stopPropagation();
    setFormData(prev => {
      const newHistory = prev.fotosPerfil.filter(p => p !== url);
      let newCurrent = prev.foto === url ? (newHistory[0] || "") : prev.foto;
      return { ...prev, fotosPerfil: newHistory, foto: newCurrent };
    });
  };

  // === NUEVA LÓGICA PARA SUBIR PDFs ===
// === NUEVA LÓGICA PARA SUBIR PDFs ===
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [draggingPaperId, setDraggingPaperId] = useState(null);

  const handlePdfUpload = async (e, paperId) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setModalConfig({ isOpen: true, title: 'Formato incorrecto', message: 'Por favor, subí un archivo en formato PDF.', type: 'error' });
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      setModalConfig({ isOpen: true, title: 'Archivo muy pesado', message: 'El PDF no debe superar los 20MB.', type: 'error' });
      return;
    }

    if (!currentUser || !currentUser.uid) {
      setModalConfig({ isOpen: true, title: 'Error de Autenticación', message: 'No se detectó tu usuario. Por favor, volvé a iniciar sesión.', type: 'error' });
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadProgress(0);

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileRef = ref(storage, `papers/${currentUser.uid}/${Date.now()}_${safeFileName}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setPdfUploadProgress(progress);
        }, 
        (error) => {
          console.error("Error exacto de Firebase:", error);
          setIsUploadingPdf(false);
          setModalConfig({ isOpen: true, title: 'Error de Servidor', message: `No se pudo subir: ${error.message}`, type: 'error' });
        }, 
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({
              ...prev,
              papers: prev.papers.map(p => p.id === paperId ? { ...p, pdfUrl: url, fileName: file.name, storagePath: uploadTask.snapshot.ref.fullPath } : p)
            }));
            setIsUploadingPdf(false);
          } catch (urlError) {
             setIsUploadingPdf(false);
             setModalConfig({ isOpen: true, title: 'Error al obtener link', message: 'Se subió pero no pudimos generar el link.', type: 'error' });
          }
        }
      );
    } catch (error) {
      console.error("Error general:", error);
      setIsUploadingPdf(false);
    }
  };

  const handlePdfRemove = async (paperId, storagePath) => {
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (error) {
        console.error("No se pudo borrar el archivo de Storage:", error);
      }
    }
    setFormData(prev => ({
      ...prev,
      papers: prev.papers.map(p => p.id === paperId ? { ...p, pdfUrl: '', fileName: '', storagePath: '' } : p)
    }));
  };
  // === FIN LÓGICA PDFs ===
const normalizarRedSocial = (valor, red) => {
  if (!valor) return '';
  const v = valor.trim();
  if (red !== 'instagram') return v;
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  const usuario = v.startsWith('@') ? v.slice(1) : v;
  return `https://instagram.com/${usuario}`;
};
const generarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

  const handleSaveData = async () => {
    const trayectoriaIncompleta = formData.trayectoria.some(t => !t.titulo.trim());
if (!formData.nombre.trim() || !formData.especialidad.trim() || !formData.foto || trayectoriaIncompleta) {
      setModalConfig({ 
        isOpen: true, 
        title: 'Faltan datos requeridos', 
        message: 'Asegúrate de haber ingresado tu Foto, Nombre, Especialidad, y el Título de cada logro en Trayectoria.', 
        type: 'error' 
      });
      setActiveTab('perfil');
      setOpenSection('identidad'); 
      return;
    }

    setSaveStatus('saving');
    
    // ¡ACÁ ABRIMOS EL BLOQUE TRY!
    try {
      // 1. Separamos los papers del resto de la información
      const { papers, galeria: galeriaLocal, ...perfilDataToSave } = formData;

      // Subimos a Storage las fotos que todavía son Base64 (no tienen storagePath)
      const galeriaSubida = await Promise.all(
        galeriaLocal.map(async (item) => {
          if (item.storagePath) return item; // ya está en Storage, no la volvemos a subir
          try {
            const fileRef = ref(storage, `profesionales/${currentUser.uid}/galeria/${item.id}.jpg`);
            await uploadString(fileRef, item.url, 'data_url');
            const url = await getDownloadURL(fileRef);
            return { ...item, url, storagePath: fileRef.fullPath };
          } catch (err) {
            console.error('Error subiendo foto de galería:', err);
            return item; // si falla, dejamos el Base64 temporalmente
          }
        })
      );
      perfilDataToSave.galeria = galeriaSubida;
      perfilDataToSave.instagram = normalizarRedSocial(perfilDataToSave.instagram, 'instagram');
      perfilDataToSave.slug = currentUser.slug;

      // 2. Guardamos el perfil "limpio" (Esto borrará los papers viejos del documento del profesional automáticamente)
      const docRef = doc(db, 'profesionales', currentUser.uid);
await setDoc(docRef, perfilDataToSave);

// Sincronizamos nombre y slug en la colección usuarios
const nombreCompleto = `${formData.nombre.trim()} ${(formData.apellido || '').trim()}`.trim();
const slugNuevo = generarSlug(nombreCompleto);
const { updateDoc } = await import('firebase/firestore');
await updateDoc(doc(db, 'usuarios', currentUser.uid), {
  nombre: formData.nombre.trim(),
  apellido: (formData.apellido || '').trim(),
  nombreCompleto,
  slug: slugNuevo,
});
await updateDoc(doc(db, 'profesionales', currentUser.uid), {
  slug: slugNuevo,
  nombre: formData.nombre.trim(),
  apellido: (formData.apellido || '').trim(),
  nombreCompleto,
});

      // 3. Guardamos los papers en la colección global usando un Batch (Procesamiento en lote)
      const batch = writeBatch(db);
      papers.forEach(paper => {
          // Usamos el ID del paper como nombre del documento
          const paperRef = doc(db, 'papers', String(paper.id));
          batch.set(paperRef, {
              ...paper,
              // Le inyectamos la data del autor para que el buscador no tenga que cruzar bases de datos
              autorId: currentUser.uid,
              autorNombre: formData.nombre,
              autorFoto: formData.foto || null,
              autorEspecialidad: formData.especialidad || 'Veterinario'
          });
      });
      await batch.commit(); // Ejecutamos el guardado masivo

      // 4. --- ¡CERRANDO EL CICLO DEL BOTÓN! ---
      setSaveStatus('saved');
      setSavedData(_formData);
      setTimeout(() => setSaveStatus('idle'), 2500);
      await refreshUser();
      return true;

    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
      setSaveStatus('error');
      setModalConfig({ 
        isOpen: true, 
        title: 'Error al guardar', 
        message: 'Hubo un problema al subir los datos. Verifica tu conexión.', 
        type: 'error' 
      });
      setTimeout(() => setSaveStatus('idle'), 2500);
      return false;
    }
  };  
  const handleConfirmChangePlan = () => {
    setPlanType(tempSelectedPlan);
    setFormData(prev => ({ ...prev, planActual: tempSelectedPlan })); 
    setIsPlanModalOpen(false);
    
    if (tempSelectedPlan === 'gratis' && (activeTab === 'servicios' || activeTab === 'casos')) {
       setActiveTab('cuenta');
    }
    
    setModalConfig({ 
      isOpen: true, 
      title: 'Plan Actualizado', 
      message: `Has cambiado exitosamente al plan ${tempSelectedPlan === 'pro' ? 'Profesional PRO' : 'Básico (Gratis)'}.`, 
      type: 'success' 
    });
  };

  const openPlanModal = () => {
    setTempSelectedPlan(planType);
    setIsPlanModalOpen(true);
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
      

      {/* MODAL: CAMBIOS SIN GUARDAR */}
      {exitModalOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D] mb-2">Tenés cambios sin guardar</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Si salís ahora, los cambios que hiciste se van a perder.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
  await handleSaveData();
  setExitModalOpen(false);
  setPendingNavigation(null);
  if (pendingNavigation) navigate(pendingNavigation);
}}

                className="w-full px-8 py-3.5 rounded-xl font-bold text-white bg-[#1A3D3D] hover:bg-[#2D6A6A] transition-colors shadow-lg text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar y salir
              </button>
              <button
                onClick={() => { setExitModalOpen(false); if (pendingNavigation) navigate(pendingNavigation); }}
                className="w-full px-8 py-3.5 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors text-sm border border-red-100"
              >
                Descartar cambios y salir
              </button>
              <button
                onClick={() => { setExitModalOpen(false); setPendingNavigation(null); }}
                className="w-full px-8 py-3.5 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors text-sm"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENÉRICO DE AVISOS */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] flex items-center justify-center p-4 transition-all">
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

          {cropModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de Imagen</h3>
                  <p className="text-sm text-gray-500 mt-1">Arrastra para mover la imagen o utiliza el zoom.</p>
                </div>
                <button onClick={() => setCropModal({ isOpen: false })} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="bg-[#F4F7F7] p-8 flex justify-center items-center relative">
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

      {/* MODAL CAMBIO DE PLANES */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-[32px] w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="font-bold font-['Montserrat'] text-2xl text-[#1A3D3D]">Elegí tu Plan</h3>
                  <p className="text-sm text-gray-500 mt-1">Podés mejorar o pausar tu suscripción en cualquier momento.</p>
                </div>
                <button onClick={() => setIsPlanModalOpen(false)} className="p-2.5 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              
              <div className="p-6 md:p-8 bg-[#F4F7F7]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   <div 
                     onClick={() => setTempSelectedPlan('gratis')}
                     className={`relative rounded-[24px] bg-white border-2 p-6 cursor-pointer transition-all duration-300 flex flex-col h-full
                       ${tempSelectedPlan === 'gratis' ? 'border-[#1A3D3D] shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-[#1A3D3D]/30 opacity-70 hover:opacity-100'}`}
                   >
                      {tempSelectedPlan === 'gratis' && (
                        <div className="absolute -top-3 right-6 bg-[#1A3D3D] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3" /> Seleccionado
                        </div>
                      )}
                      <h4 className="text-xl font-black text-gray-800 font-['Montserrat'] mb-1">Plan Básico</h4>
                      <p className="text-3xl font-black text-[#1A3D3D] font-['Montserrat'] my-4">$0 <span className="text-sm text-gray-400 font-medium">/mes</span></p>
                      <p className="text-sm text-gray-500 mb-6 flex-1">Ideal para tener presencia en el Cartilla y que te encuentren fácilmente.</p>
                      
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2 text-sm text-gray-600 font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Perfil profesional básico</li>
                        <li className="flex items-start gap-2 text-sm text-gray-600 font-medium"><Check className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Biografía y Trayectoria</li>
                        <li className="flex items-start gap-2 text-sm text-gray-400 opacity-50 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> Listado de Servicios</li>
                        <li className="flex items-start gap-2 text-sm text-gray-400 opacity-50 line-through"><X className="w-4 h-4 shrink-0 mt-0.5" /> Casos Clínicos con fotos</li>
                      </ul>
                   </div>

                   <div 
                     onClick={() => setTempSelectedPlan('pro')}
                     className={`relative rounded-[24px] bg-white border-2 p-6 cursor-pointer transition-all duration-300 flex flex-col h-full
                       ${tempSelectedPlan === 'pro' ? 'border-[#4DB6AC] shadow-[0_10px_30px_rgba(77,182,172,0.2)] scale-[1.02]' : 'border-gray-200 hover:border-[#4DB6AC]/50 opacity-70 hover:opacity-100'}`}
                   >
                      {tempSelectedPlan === 'pro' && (
                        <div className="absolute -top-3 right-6 bg-[#4DB6AC] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3" /> Seleccionado
                        </div>
                      )}
                      <h4 className="text-xl font-black text-[#1A3D3D] font-['Montserrat'] mb-1 flex items-center gap-2">
                         Profesional PRO <Zap className="w-5 h-5 text-[#4DB6AC] fill-[#4DB6AC]" />
                      </h4>
                      <p className="text-3xl font-black text-[#1A3D3D] font-['Montserrat'] my-4">$8.500 <span className="text-sm text-gray-400 font-medium">/mes</span></p>
                      <p className="text-sm text-gray-500 mb-6 flex-1">Generá confianza mostrando tus servicios y el éxito de tus casos clínicos.</p>
                      
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Todo lo del Plan Básico</li>
                        <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Listado de Servicios Médicos</li>
                        <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Galería de Casos de Éxito</li>
                        <li className="flex items-start gap-2 text-sm text-gray-700 font-bold"><Check className="w-4 h-4 text-[#4DB6AC] shrink-0 mt-0.5" /> Soporte prioritario</li>
                      </ul>
                   </div>

                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                 <button onClick={() => setIsPlanModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                 <button onClick={handleConfirmChangePlan} className="px-8 py-3 rounded-xl text-sm font-bold bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] shadow-md transition-all flex items-center gap-2">Confirmar Cambio <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO (FACTURACIÓN) */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[300] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-[32px] w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#009EE3]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#009EE3]" /></div>
                  <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Facturación</h3>
                </div>
                <button onClick={() => setIsSubModalOpen(false)} className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              
              <div className="p-6 md:p-8 bg-white">
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-2">Plan Actual</p>
                  <h2 className="text-4xl font-black text-[#1A3D3D] font-['Montserrat']">Profesional PRO</h2>
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
                    onClick={() => { setIsSubscriptionActive(true); setIsSubModalOpen(false); setModalConfig({ isOpen: true, title: '¡Pago Exitoso!', message: 'Tu cuenta ha sido reactivada.', type: 'success' }); }}
                    className="w-full py-4 rounded-xl font-bold text-sm bg-[#009EE3] text-white hover:bg-[#0080B7] transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    Simular Pago (Mercado Pago) <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setIsSubscriptionActive(false); setIsSubModalOpen(false); }}
                    className="w-full py-4 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                  >
                    Simular Vencimiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

{/* BANNER RECOMENDACIÓN DESKTOP — solo móvil, solo primera vez */}
{!desktopHintVisto && (
  <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[400] flex items-center justify-center md:hidden p-4">
    <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-16 h-16 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#2D6A6A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
      </div>
      <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D] mb-3">Mejor desde la computadora</h3>
      <p className="text-m text-gray-500 mb-8 leading-relaxed">Para completar tu perfil más cómodamente y aprovechar todas las opciones del editor, te recomendamos hacerlo desde una computadora.</p>
      <button
        onClick={() => {
          localStorage.setItem('editorDesktopHintVisto', 'true');
          window.dispatchEvent(new Event('storage'));
        }}
        className="w-full px-8 py-3.5 rounded-xl font-bold text-white bg-[#1A3D3D] hover:bg-[#2D6A6A] transition-colors shadow-lg text-m"
      >
        Entendido
      </button>
    </div>
  </div>
)}

      {/* NAVBAR DE APLICACIÓN (h: 64px) */}
      <nav className="fixed top-0 w-full z-[80] h-[64px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 md:px-10 shadow-sm">
        <div className="max-w-[1100px] w-full mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-6">
           <button
              onClick={() => {
                if (haycambiosSinGuardar) {
                  setPendingNavigation('/ecosistema');
                  setExitModalOpen(true);
                } else {
                  navigate('/ecosistema');
                }
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-[#4DB6AC] transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-bold hidden sm:block">Volver al Ecosistema</span>
            </button>
            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-xl tracking-tight cursor-pointer">
               El Portal<span className="text-[#2D6A6A]">.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right mr-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#1A3D3D] truncate max-w-[150px]">{formData.nombre || 'Profesional'}</p>
              <p className="text-[10px] font-bold text-[#4DB6AC]">Profesional</p>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 shrink-0 flex items-center justify-center">
               {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> : <User className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

        </div>
      </nav>

      {/* LAYOUT PRINCIPAL (Padding 76px) */}
      <div className="pt-[76px] max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col gap-6 w-full pb-10">
        
        {/* BANNER DE SUSCRIPCIÓN INACTIVA */}
        {(isPro && !isSubscriptionActive) && (
          <div className="w-full bg-red-50 border border-red-200 rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm animate-in fade-in slide-in-from-top-4 z-10">
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <div className="w-12 h-12 bg-red-100/50 rounded-full flex items-center justify-center shrink-0 border border-red-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-base md:text-lg">Cuenta suspendida por falta de pago</h3>
                <p className="text-sm text-red-700/90 font-medium mt-0.5 leading-snug">Tu perfil profesional no está visible en el Cartilla. Regularizá tu situación para volver a aparecer.</p>
              </div>
            </div>
            <button onClick={() => setIsSubModalOpen(true)} className="shrink-0 w-full md:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Regularizar pago
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-start relative flex-1 w-full">
          
          {/* COLUMNA IZQUIERDA: SIDEBAR */}
          <div className="w-full md:w-[260px] shrink-0 md:sticky md:top-[96px] self-start z-20">
            
            <div className="md:h-[52px] flex items-center mb-6 px-1">
               <h2 className="text-[28px] font-black font-['Montserrat'] uppercase tracking-tight text-[#1A3D3D] hidden md:block leading-none">
                 Configuración
               </h2>
            </div>
            
            <nav className="flex flex-col gap-1.5 pb-2 md:pb-0 bg-white md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">
              
              <button onClick={() => setActiveTab('cuenta')} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'cuenta' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <div className="flex items-center gap-3"><User className={`w-5 h-5 ${activeTab === 'cuenta' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Sobre mi plan</div>
              </button>
              
              <button onClick={() => setActiveTab('perfil')} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'perfil' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                <div className="flex items-center gap-3"><LayoutGrid className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Mi perfil público</div>
              </button>

              <button 
                onClick={() => isPro && setActiveTab('servicios')} disabled={!isPro}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none
                  ${!isPro ? 'opacity-50 grayscale cursor-not-allowed text-gray-400' : activeTab === 'servicios' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}
              >
                <div className="flex items-center gap-3"><Briefcase className={`w-5 h-5 ${activeTab === 'servicios' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Servicios Médicos</div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-gray-400" />}
              </button>

              <button 
                onClick={() => isPro && setActiveTab('casos')} disabled={!isPro}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none
                  ${!isPro ? 'opacity-50 grayscale cursor-not-allowed text-gray-400' : activeTab === 'casos' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}
              >
                <div className="flex items-center gap-3"><Camera className={`w-5 h-5 ${activeTab === 'casos' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Casos Clínicos</div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-gray-400" />}
              </button>

              <button 
                onClick={() => isPro && setActiveTab('papers')} disabled={!isPro}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none
                  ${!isPro ? 'opacity-50 grayscale cursor-not-allowed text-gray-400' : activeTab === 'papers' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}
              >
                <div className="flex items-center gap-3"><BookOpen className={`w-5 h-5 ${activeTab === 'papers' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Investigaciones</div>
                {!isPro && <Lock className="w-3.5 h-3.5 text-gray-400" />}
              </button>

            </nav>

            {/* CAJA VER PERFIL DE EJEMPLO */}
            <div className="mt-4 bg-[#1A3D3D]/5 border border-[#1A3D3D]/10 rounded-2xl p-4 hidden md:block">
              <p className="text-xs font-bold text-[#1A3D3D] leading-snug mb-3">¿Querés ver cómo quedaría tu perfil público?</p>
              <a
                href="/profesional/mercedes-arenas"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:border-[#4DB6AC] hover:text-[#4DB6AC] transition-all flex items-center justify-center gap-1.5 group shadow-sm"
              >
                Ver perfil de ejemplo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

          </div>

          {/* COLUMNA DERECHA: ÁREA PRINCIPAL */}
          <div className="flex-1 w-full flex flex-col min-w-0">
            
            {/* BARRA DE ACCIÓN SUPERIOR ALINEADA (Alto 52px) */}
            <div className="flex justify-between items-center mb-6 md:h-[52px] w-full">
               <div className="flex items-center gap-2 shrink-0">
                  <button onClick={undo} disabled={past.length === 0} className={`p-2.5 rounded-xl transition-all border ${past.length > 0 ? 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] shadow-sm' : 'bg-transparent border-transparent text-gray-300'}`} title="Deshacer"><Undo2 className="w-5 h-5" /></button>
                  <button onClick={redo} disabled={future.length === 0} className={`p-2.5 rounded-xl transition-all border ${future.length > 0 ? 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] shadow-sm' : 'bg-transparent border-transparent text-gray-300'}`} title="Rehacer"><Redo2 className="w-5 h-5" /></button>
               </div>

               <button 
                 onClick={handleSaveData} disabled={saveStatus === 'saving' || saveStatus === 'saved'} 
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

            {activeTab === 'cuenta' && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 animate-in fade-in duration-300">
                
                <h3 className="text-2xl font-black text-[#1A3D3D] mb-2 font-['Montserrat']">Sobre mi plan</h3>
                <p className="text-sm text-gray-500 mb-6">Información privada para la facturación.</p>

                <div className="max-w-2xl">
                  
                  {/* ESTADO DE MENSUALIDAD DINÁMICO */}
                  <div>
                     <h4 className="flex items-center gap-2 text-sm font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-4">
                       <CreditCard className="w-5 h-5 text-[#2D6A6A]" /> Estado de la suscripción
                     </h4>

                     {/* SOCIO VITALICIO: reemplaza toda la sección si aplica */}
                     {formData.socioVitalicio ? (
                       <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 flex items-center gap-5">
                         <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center shrink-0">
                           <Crown className="w-7 h-7 text-yellow-500" />
                         </div>
                         <div>
                           <p className="font-black text-[#1A3D3D] text-lg font-['Montserrat'] leading-tight">Socio vitalicio</p>
                           <p className="text-yellow-700 text-sm font-medium mt-1">Tu cuenta incluye todos los beneficios de la plataforma sin costo mensual.</p>
                         </div>
                       </div>
                     ) : (
                     
                     <div className={`border p-5 md:p-6 rounded-2xl flex flex-col gap-5 transition-colors 
                       ${isPro && !isSubscriptionActive ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
                     >
                       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                         
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <p className={`font-bold text-xl ${isPro && !isSubscriptionActive ? 'text-red-800' : 'text-[#1A3D3D]'}`}>
                               {isPro ? 'Plan Profesional PRO' : 'Plan Básico'}
                             </p>
                             <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isPro ? 'bg-[#1A3D3D]' : 'bg-gray-400'}`}>
                               {isPro ? 'Premium' : 'Gratis'}
                             </span>
                           </div>
                           <div className="flex items-center gap-2 mt-2">
                             <span className={`w-2 h-2 rounded-full ${isPro && !isSubscriptionActive ? 'bg-red-500' : 'bg-[#4DB6AC]'}`}></span>
                             <p className={`text-sm font-medium ${isPro && !isSubscriptionActive ? 'text-red-600' : 'text-gray-600'}`}>
                               {isPro ? (isSubscriptionActive ? 'Suscripción activa y al día' : 'Suspendida por falta de pago') : 'Suscripción activa (Gratuita)'}
                             </p>
                           </div>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                            {isPro && (
                              <button onClick={() => setIsSubModalOpen(true)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border w-full sm:w-auto text-center ${isSubscriptionActive ? 'bg-white border-gray-200 text-gray-700 hover:border-[#4DB6AC] hover:text-[#4DB6AC]' : 'bg-red-600 text-white border-red-600 hover:bg-red-700'}`}>
                                {isSubscriptionActive ? 'Gestionar pagos' : 'Regularizar pago'}
                              </button>
                            )}
                            <button onClick={openPlanModal} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border bg-white border-gray-200 text-gray-700 hover:border-[#4DB6AC] hover:text-[#4DB6AC] w-full sm:w-auto text-center">
                              Cambiar de plan
                            </button>
                         </div>
                       </div>

                        {/*<div className="pt-4 border-t border-gray-200/60 flex justify-start">
                         <button className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors underline decoration-red-200 underline-offset-4">
                           Suspender mi cuenta temporalmente 
                         </button>
                       </div>*/}
                     </div>
                  )}
                  </div>

                
                </div>
              </div>
            )}

            {activeTab === 'perfil' && (
              <div className="flex flex-col w-full animate-in fade-in duration-300 relative">
                
                {/* TARJETA DE HEADER UNIFICADA */}
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center p-6 gap-6">
                  
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                      {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> : <User className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#4DB6AC] p-1.5 rounded-xl border-2 border-white"><ShieldCheck className="w-3 h-3 text-white" /></div>
                  </div>

                  {/* Info Corta */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] truncate leading-tight mb-1">{formData.nombre || "Nombre Profesional"}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      {formData.especialidad && <span className="text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{formData.especialidad}</span>}
                      {formData.atiendeDomicilio && <span className="text-white bg-blue-500 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"><Home className="w-3 h-3" /> A Domicilio</span>}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-[#2D6A6A] shrink-0" /> {formData.provincia || "Provincia"}</span>
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
                    <p className="text-xs text-gray-500 mb-0">Toda la info que cargues aquí será la que tus clientes verán en el Cartilla.</p>
                  </div>

                  <div className="border-t border-gray-100">
                    
                    {/* IDENTIDAD PROFESIONAL */}
                    <Accordion title="Identidad Profesional" icon={User} isOpen={openSection === 'identidad'} onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}>
                      {!tooltipHintVisto && (
  <div className="flex flex-col gap-3 bg-[#2D6A6A]/8 border border-[#2D6A6A]/20 rounded-2xl px-4 py-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-[#2D6A6A]/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
      <Info className="w-4 h-4 text-[#2D6A6A]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-[#1A3D3D] mb-0.5">¿Ves los íconos <span className="inline-flex items-center justify-center w-4 h-4 bg-[#2D6A6A]/15 rounded-full text-[#2D6A6A] text-[10px] font-black">i</span> junto a cada campo?</p>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">Tocálos para ver consejos y explicaciones sobre cada dato. Te ayudan a completar tu perfil de la mejor manera.</p>
    </div>
  </div>
  <button
    type="button"
    onClick={async () => {
      setTooltipHintVisto(true);
      try {
        await setDoc(doc(db, 'usuarios', currentUser.uid), { tooltipHintVisto: true }, { merge: true });
      } catch (e) {
        console.error("Error guardando hint:", e);
      }
    }}
    className="w-full text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:text-[#1A3D3D] transition-colors bg-white border border-[#2D6A6A]/20 px-3 py-2.5 rounded-xl shadow-sm"
  >
    Entendido
  </button>
</div>
)}

<div className="flex flex-col sm:flex-row gap-8 mb-8 mt-2 md:mt-0">
                        
                        {/* CONTENEDOR FOTO PRINCIPAL */}
                        {/* Agregamos w-32 h-32 al div padre para contener todo el bloque */}
                        <div className="relative group shrink-0 text-left w-32 h-32">
                          <label htmlFor="p-upload" className={`w-full h-full rounded-full overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img shadow-sm hover:border-[#2D6A6A]`}>
                            {formData.foto ? (
                               <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> 
                            ) : (
                               <Camera className="w-8 h-8 text-gray-300" />
                            )}
                            {/* Capa negra de hover (con pointer-events-none para no bloquear clicks) */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 md:group-hover/img:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </label>
                          <input type="file" id="p-upload" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'perfil')} />
                          
                          {/* Botón X FUERA del label para evitar que se abra la ventana de archivos */}
                          {formData.foto && (
                            <button 
                              type="button" 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                setFormData(prev => ({ ...prev, foto: '' })); 
                              }} 
                              className="absolute top-0 right-0 p-1.5 bg-white text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md hover:bg-red-50"
                            >
                              <X className="w-4 h-4" strokeWidth={3} />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 text-left flex flex-col justify-center">
                          <h3 className="text-sm font-bold text-[#1A3D3D] mb-2 uppercase tracking-wide flex items-center">
                            Fotografía de Perfil <span className="text-red-400 ml-1">*</span>
                            <Tooltip text="Usa una foto vertical o cuadrada. Tener ambo y una buena iluminación transmite más confianza a los tutores y colegas." />
                          </h3>
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed">Sube una imagen profesional. Formatos PNG o JPG. Máx 2MB.</p>
                          
                          {/* MINI GALERÍA DE FOTOS PREVIAS */}
                          <div className="flex flex-wrap gap-2">
                            {formData.fotosPerfil && formData.fotosPerfil.map((url, i) => (
                              <div key={i} className={`relative group/mini w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${formData.foto === url ? 'border-[#2D6A6A]' : 'border-gray-100'}`} onClick={() => setFormData(prev => ({...prev, foto: url}))}>
                                <img src={url} className="w-full h-full object-cover" alt="Historial" />
                                {/* Botón X de miniaturas adaptado a la nueva lógica responsiva */}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteProfilePhoto(url, e);
                                  }} 
                                  className="absolute top-0 right-0 p-0.5 bg-white/90 text-red-500 rounded-bl-lg opacity-100 md:opacity-0 md:group-hover/mini:opacity-100 transition-opacity z-20 hover:bg-white"
                                >
                                  <X className="w-3 h-3" strokeWidth={3} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <InputGroup label="Nombre" id="nombre" value={formData.nombre} onChange={handleChange} required />
<InputGroup label="Apellido" id="apellido" value={formData.apellido || ''} onChange={handleChange} required />
<InputGroup label="Especialidad Principal" id="especialidad" value={formData.especialidad} onChange={handleChange} required tooltip="Tu título principal. Es lo primero que verán los usuarios bajo tu nombre." />
                        <div className="mb-6 w-full">
                          <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                            Matrícula <span className="text-red-400 ml-1">*</span>
                            <Tooltip text="Ingresá únicamente los números de tu matrícula profesional." />
                          </label>
                          <div className="flex gap-0 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50/50 focus-within:border-[#2D6A6A] transition-colors">
                            <select
                              id="tipoMatricula"
                              value={formData.tipoMatricula || 'MP'}
                              onChange={handleChange}
                              className="bg-transparent border-none border-r border-gray-200 px-4 py-3.5 text-base font-black focus:outline-none text-[#1A3D3D] shrink-0 w-[85px] cursor-pointer"
                            >
                              <option value="MP">MP</option>
                              <option value="MN">MN</option>
                            </select>
                            <div className="w-px bg-gray-200 shrink-0"></div>
                            <input
                              id="matricula"
                              type="text"
                              value={formData.matricula}
                              onChange={handleChange}
                              placeholder="Ej: 12345"
                              className="flex-1 bg-transparent border-none px-5 py-3.5 text-base font-medium focus:outline-none text-[#1A3D3D]"
                            />
                          </div>
                        </div>
                        <div className="mb-6 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Provincia Base</label>
                          <select id="provincia" value={formData.provincia} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-3.5 text-base font-medium focus:outline-none focus:border-[#2D6A6A] text-[#1A3D3D] shadow-sm transition-colors">
                            {provincias.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    </Accordion>

                    {/* SOBRE MI / BIO */}
                    <Accordion title="Sobre Mí" icon={Sparkles} isOpen={openSection === 'bio'} onToggle={() => setOpenSection(openSection === 'bio' ? null : 'bio')} bioLength={formData.bio.length} tooltip="Resume tu experiencia y pasión. Tienes 350 caracteres para contar qué te hace especial.">
                      <InputGroup type="textarea" label="Resumen Profesional" id="bio" value={formData.bio} onChange={handleChange} maxLength={350} placeholder="Cuenta brevemente tu experiencia profesional..." />
                    </Accordion>

                    {/* TRAYECTORIA ACADÉMICA (Solo visible para PRO en el editor) */}
                    {isPro && (
                      <Accordion title="Títulos y Trayectoria" icon={Award} isOpen={openSection === 'trayectoria'} onToggle={() => setOpenSection(openSection === 'trayectoria' ? null : 'trayectoria')} tooltip="Los títulos se mostrarán en formato de línea de tiempo en tu perfil público.">
                        <div className="space-y-4">
                          {formData.trayectoria.map((item, index) => (
                            <div key={item.id} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex gap-4 text-left">
                              <div className="flex flex-col gap-1 mt-1">
                                <button type="button" onClick={() => handleArrayMove('trayectoria', index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                                <button type="button" onClick={() => handleArrayMove('trayectoria', index, 'down')} disabled={index === formData.trayectoria.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input type="text" placeholder="Título (Ej: Especialista)" value={item.titulo} onChange={(e) => handleArrayUpdate('trayectoria', item.id, 'titulo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#2D6A6A] outline-none" />
                                  <input type="text" placeholder="Entidad / Año" value={item.desc} onChange={(e) => handleArrayUpdate('trayectoria', item.id, 'desc', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#2D6A6A] outline-none" />
                                </div>
                                <input type="text" placeholder="Dato extra (opcional)" value={item.extra || ""} onChange={(e) => handleArrayUpdate('trayectoria', item.id, 'extra', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs italic focus:border-[#2D6A6A] outline-none" />
                              </div>
                              <button onClick={() => handleArrayRemove('trayectoria', item.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          ))}
                          <button onClick={() => handleArrayAdd('trayectoria', { titulo: "", desc: "", extra: "" })} className="w-full py-4 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Agregar Logro Académico
                          </button>
                        </div>
                      </Accordion>
                    )}

                    {/* ZONAS DE ATENCIÓN (Solo visible para PRO en el editor) */}
{isPro && (
  <Accordion title="Zonas de Atención" icon={MapPin} isOpen={openSection === 'zonas'} onToggle={() => setOpenSection(openSection === 'zonas' ? null : 'zonas')} tooltip="Así es exactamente como van a ver tus datos los tutores en tu perfil público.">

    <ToggleSwitch label="Ofrezco consultas a domicilio" checked={formData.atiendeDomicilio} onChange={(v) => {
  if (v) {
    setFormData(p => ({
      ...p,
      atiendeDomicilio: true,
      whatsappActivo: true,
      whatsappVisibilidad: 'todos'
    }));
  } else {
    setFormData(p => ({ ...p, atiendeDomicilio: false }));
  }
}} tooltip="Añadirá un distintivo especial en tu perfil público." />

{/* WHATSAPP FORZADO — solo visible si ofrece domicilio */}
{formData.atiendeDomicilio && (
  <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-start gap-3 bg-[#25D366]/8 border border-[#25D366]/20 rounded-2xl px-4 py-3.5 mb-4">
      <Phone className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-[#1A3D3D] leading-relaxed">
        Como ofrecés consultas a domicilio, tu WhatsApp es <span className="font-black">obligatorio y visible para todo el público</span> para que los tutores puedan coordinar con vos.
      </p>
    </div>
    <InputGroup
      label="Tu número de WhatsApp (con código de país, ej: 5411...)"
      id="whatsappNum"
      value={formData.whatsappNum}
      onChange={handleChange}
      placeholder="Ej: 54911..."
      required
    />
  </div>
)}

<div className="w-full h-px bg-gray-100 my-5"></div>
    {/* AVISO EXPLICATIVO */}
    <div className="flex items-start gap-3 bg-[#2D6A6A]/5 border border-[#2D6A6A]/15 rounded-2xl px-4 py-3.5 mb-6">
      <MapPin className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-[#1A3D3D] leading-relaxed">
        Agrupá las clínicas por zona geográfica. Ej: <span className="font-black">Villa La Angostura</span> con todas las clínicas de esa zona, y otra tarjeta para <span className="font-black">San Martín de los Andes</span>.
      </p>
    </div>

    <div className="space-y-5">
      {formData.zonas.map((z) => (
        <div key={z.id} className="bg-[#F4F7F7] rounded-[24px] border border-gray-200 overflow-hidden shadow-sm">

          {/* HEADER DE ZONA — igual al perfil público */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/70 bg-white/60">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A6A]/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#2D6A6A]" />
            </div>
            <input
              type="text"
              placeholder="Nombre de la zona (Ej: Villa La Angostura)"
              value={z.nombre}
              onChange={(e) => handleArrayUpdate('zonas', z.id, 'nombre', e.target.value)}
              className="flex-1 bg-transparent text-sm font-black text-[#1A3D3D] uppercase tracking-wide outline-none placeholder:text-gray-400 placeholder:font-medium placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              onClick={() => handleArrayRemove('zonas', z.id)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Eliminar zona completa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* LISTA DE CLÍNICAS — espejo del perfil público */}
          <div className="px-5 py-4 space-y-3">
            {z.clinicas.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* FILA PRINCIPAL: punto verde + autocomplete + borrar */}
                {/* FILA 1: NOMBRE PROPIO + BARRIO */}
                <div className="flex flex-col border-b border-gray-50">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-[#2D6A6A] shrink-0" />
                    <input
                      type="text"
                      placeholder="Nombre de la clínica"
                      value={c.nombrePropio || ''}
                      onChange={(e) => updateClinica(z.id, c.id, 'nombrePropio', e.target.value)}
                      className="flex-1 text-sm font-bold text-[#1A3D3D] outline-none placeholder:font-medium placeholder:text-gray-300 min-w-0"
                    />
                    <button
                      onClick={() => {
                        const newClinicas = z.clinicas.filter(cl => cl.id !== c.id);
                        handleArrayUpdate('zonas', z.id, 'clinicas', newClinicas);
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <div className="w-2 h-2 rounded-full shrink-0 opacity-0" />
                    <input
                      type="text"
                      placeholder="Barrio (opcional)"
                      value={c.barrio || ''}
                      onChange={(e) => updateClinica(z.id, c.id, 'barrio', e.target.value)}
                      className="flex-1 text-xs text-gray-400 outline-none placeholder:text-gray-300 min-w-0"
                    />
                  </div>
                </div>

                {/* FILA 2: DIRECCIÓN CON GOOGLE */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                  <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <input
                    type="text"
                    placeholder="Dirección (buscá con Google)"
                    value={c.direccion || ''}
                    onChange={(e) => updateClinica(z.id, c.id, 'direccion', e.target.value)}
                    ref={(el) => {
                      if (!el || !window.google || el._autocompleteInit) return;
                      el._autocompleteInit = true;
                      const autocomplete = new window.google.maps.places.Autocomplete(el, {
                        componentRestrictions: { country: 'ar' },
                        fields: ['name', 'formatted_address', 'place_id']
                      });
                      autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (!place.place_id) return;
                        updateClinica(z.id, c.id, 'direccion', place.formatted_address || '');
                        updateClinica(z.id, c.id, 'placeId', place.place_id || '');
                      });
                    }}
                    className="flex-1 text-sm text-gray-500 outline-none placeholder:text-gray-300"
                  />
                  {(c.placeId || c.direccion) && (
  <a 
    href={c.placeId 
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion || '')}&query_place_id=${c.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion || '')}`
    } 
    target="_blank" 
    rel="noreferrer" 
    className="shrink-0 text-[10px] font-bold text-[#2D6A6A] bg-white px-2.5 py-1.5 rounded-lg border border-[#2D6A6A]/20 hover:text-[#1A3D3D] transition-colors"
  >
    Ver
  </a>
)}
                </div>

                {/* FILA 3: TELÉFONO OPCIONAL */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <input
                    type="text"
                    placeholder="Teléfono o WhatsApp (opcional)"
                    value={c.telefono || ''}
                    onChange={(e) => updateClinica(z.id, c.id, 'telefono', e.target.value)}
                    className="flex-1 text-sm text-gray-500 outline-none placeholder:text-gray-300"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const newClinicas = [...z.clinicas, { id: Date.now(), nombre: "", direccion: "", placeId: "" }];
                handleArrayUpdate('zonas', z.id, 'clinicas', newClinicas);
              }}
              className="w-full py-3 border-2 border-dashed border-[#2D6A6A]/20 rounded-xl text-[11px] font-bold text-[#2D6A6A] hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A]/40 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-widest"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir clínica en {z.nombre || 'esta zona'}
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() => handleArrayAdd('zonas', { nombre: "", clinicas: [] })}
        className="w-full py-4 bg-[#1A3D3D] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#2D6A6A] transition-all flex items-center justify-center gap-2 shadow-md"
      >
        <Plus className="w-4 h-4" /> Crear nueva zona geográfica
      </button>
    </div>
  </Accordion>
)}

                    {/* GALERÍA PROFESIONAL */}
                    <Accordion
                      title="Galería"
                      icon={ImageIcon}
                      isOpen={openSection === 'galeria'}
                      onToggle={() => setOpenSection(openSection === 'galeria' ? null : 'galeria')}
                      tooltip="Subí fotos de congresos, participaciones, equipamiento o cualquier momento de tu carrera. Se mostrarán en tu perfil público."
                    >
                      {/* LÍMITE SEGÚN PLAN */}
                      {(() => {
                        const limite = isPro ? 15 : 4;
                        const cantActual = formData.galeria.length;
                        const llegóAlLimite = cantActual >= limite;

                        return (
                          <div className="space-y-5">

                            {/* AVISO DE PLAN */}
                            {!isPro && (
                              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3.5">
                                <Lock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-yellow-800 leading-relaxed">
                                  Con el plan Básico podés subir hasta <span className="font-black">4 fotos</span>. Actualizá a PRO para llegar a 15.
                                </p>
                              </div>
                            )}

                            {/* GRILLA DE FOTOS */}
                            {formData.galeria.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {formData.galeria.map((item, index) => (
                                  <div key={item.id} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">

                                    {/* FOTO */}
                                    <div className="aspect-square overflow-hidden bg-gray-100">
                                      <img
                                        src={item.url}
                                        alt={item.epigrafe || `Foto ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                    </div>

                                    {/* BOTÓN ELIMINAR */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          galeria: prev.galeria.filter(g => g.id !== item.id)
                                        }));
                                      }}
                                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-50 z-10"
                                    >
                                      <X className="w-3.5 h-3.5" strokeWidth={3} />
                                    </button>

                                    {/* EPÍGRAFE */}
                                    <div className="p-2.5">
                                      <input
                                        type="text"
                                        placeholder="Descripción opcional..."
                                        value={item.epigrafe || ''}
                                        maxLength={80}
                                        onChange={(e) => {
                                          setFormData(prev => ({
                                            ...prev,
                                            galeria: prev.galeria.map(g =>
                                              g.id === item.id ? { ...g, epigrafe: e.target.value } : g
                                            )
                                          }));
                                        }}
                                        className="w-full text-[11px] font-medium text-gray-500 bg-transparent outline-none placeholder:text-gray-300 border-b border-gray-100 pb-1 focus:border-[#2D6A6A] transition-colors"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* BOTÓN AGREGAR FOTO */}
                            {!llegóAlLimite ? (
                              <>
                                <label
                                  htmlFor="galeria-upload"
                                  className="w-full py-4 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                  Agregar foto ({cantActual}/{limite})
                                </label>
                                <input
                                  type="file"
                                  id="galeria-upload"
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if (!files.length) return;
                                    files.forEach((file, index) => {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const img = new Image();
                                        img.onload = () => {
                                          const canvas = document.createElement('canvas');
                                          const MAX = 1400;
                                          let w = img.width, h = img.height;
                                          if (w > MAX) { h = h * MAX / w; w = MAX; }
                                          if (h > MAX) { w = w * MAX / h; h = MAX; }
                                          canvas.width = w;
                                          canvas.height = h;
                                          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                                          const base64 = canvas.toDataURL('image/jpeg', 0.95);
                                          setFormData(prev => ({
                                            ...prev,
                                            galeria: [
                                              ...prev.galeria,
                                              { id: Date.now() + index, url: base64, epigrafe: '', storagePath: '' }
                                            ]
                                          }));
                                        };
                                        img.src = event.target.result;
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                    e.target.value = null;
                                  }}
                                />
                              </>
                            ) : (
                              <div className="w-full py-4 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                                <Lock className="w-4 h-4" />
                                Límite alcanzado ({limite}/{limite})
                              </div>
                            )}

                          </div>
                        );
                      })()}
                    </Accordion>



                    {/* CONTACTO (Redes sociales en 3 Columnas) */}
                    <Accordion title="Contacto y Canales" icon={Smartphone} isOpen={openSection === 'contacto'} onToggle={() => setOpenSection(openSection === 'contacto' ? null : 'contacto')}>
                      <InputGroup label="Email Público" id="emailContacto" type="email" value={formData.emailContacto} onChange={handleChange} required tooltip="Este es el email que verán las personas en tu perfil público, sirve para que te contacten directamente." />
                      <div className="mt-6">
  {formData.atiendeDomicilio ? (
    <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
      <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-gray-500 leading-relaxed">
        El WhatsApp se configura automáticamente en la sección <span className="font-black text-[#1A3D3D]">Zonas de Atención</span> porque ofrecés consultas a domicilio.
      </p>
    </div>
  ) : (
    <>
      <ToggleSwitch label="Botón de WhatsApp" checked={formData.whatsappActivo} onChange={(v) => setFormData(p => ({...p, whatsappActivo: v}))} tooltip="Aparecerá un botón verde en tu perfil para chats." />
      {formData.whatsappActivo && (
    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
      <InputGroup label="Tu número de WhatsApp (con código de país)" id="whatsappNum" value={formData.whatsappNum} onChange={handleChange} placeholder="Ej: 54911..." required={formData.whatsappActivo} />
      
{/* VISIBILIDAD DEL WHATSAPP */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">¿Quién puede ver tu WhatsApp?</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="whatsappVisibilidad"
              value="todos"
              checked={formData.whatsappVisibilidad === 'todos' || !formData.whatsappVisibilidad}
              onChange={() => setFormData(p => ({...p, whatsappVisibilidad: 'todos'}))}
              className="accent-[#2D6A6A] w-4 h-4"
            />
            <div>
              <p className="text-sm font-bold text-[#1A3D3D] group-hover:text-[#2D6A6A] transition-colors">Todo público</p>
              <p className="text-xs text-gray-400 font-medium">Cualquier visitante puede contactarte por WhatsApp, incluso usuarios sin cuenta.</p>
            
            </div>
          </label>
          <div className="w-full h-px bg-gray-200 my-1"></div>
          <label className={`flex items-center gap-3 cursor-pointer group ${formData.atiendeDomicilio ? 'opacity-40 pointer-events-none' : ''}`}>
            <input
              type="radio"
              name="whatsappVisibilidad"
              value="registrados"
              checked={formData.whatsappVisibilidad === 'registrados'}
              onChange={() => setFormData(p => ({...p, whatsappVisibilidad: 'registrados'}))}
              disabled={formData.atiendeDomicilio}
              className="accent-[#2D6A6A] w-4 h-4"
            />
            <div>
              <p className="text-xm font-bold text-[#1A3D3D] group-hover:text-[#2D6A6A] transition-colors">Solo usuarios registrados</p>
              <p className="text-xs text-gray-400 font-medium">El botón de WhatsApp solo aparece si el visitante tiene cuenta en la plataforma (solo visible para profesionales y proveedores).</p>
              {formData.atiendeDomicilio && (
                <p className="text-xs text-[#2D6A6A] font-bold mt-1">No disponible para profesionales que atienden a domicilio.</p>
              )}
            </div>
          </label>
        </div>
      </div>
      
    </div>
      )}
    </>
  )}
</div>

                      <div className="w-full h-px bg-gray-100 my-6"></div>

                      <div className="flex items-center gap-2 mb-4 text-left">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Redes Sociales (Opcional)</h3>
                        <Tooltip text="Copia el link (URL) de tu perfil y pégalo aquí. Si dejas el campo vacío, el ícono correspondiente no aparecerá en tu perfil público." />
                      </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="mb-6 w-full">
    <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
      Instagram — usuario
    </label>
    <div className="relative flex items-center border border-gray-200 rounded-2xl bg-gray-50/50 focus-within:border-[#2D6A6A] transition-all px-5 py-3.5">
      <span className="text-base font-medium text-[#1A3D3D] select-none pointer-events-none">@</span>
      <input
        id="instagram"
        type="text"
        value={formData.instagram.startsWith('http') ? '' : formData.instagram.replace('@', '')}
        onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
        placeholder="tu_usuario"
        className="flex-1 bg-transparent text-base font-medium text-[#1A3D3D] focus:outline-none placeholder:text-gray-400"
      />
    </div>
  </div>
  <InputGroup label="LinkedIn" id="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="Link completo de tu perfil" canTest />
  <InputGroup label="Facebook" id="facebook" value={formData.facebook} onChange={handleChange} placeholder="Link completo de tu perfil" canTest />
</div>
                    </Accordion>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'servicios' && isPro && (
  <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
    <div className="mb-8">
      <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat']">Servicios Médicos</h3>
      <p className="text-sm text-gray-500 mt-1">Seleccioná las áreas en las que trabajás. Podés agregar una descripción opcional por grupo.</p>
    </div>

    <div className="flex flex-col gap-3">
      {especialidadesData.map(grupo => {
        const grupoActual = formData.servicios[grupo.id] || { activo: false, subOpcionesSeleccionadas: [], desc: '', serviciosPersonalizados: [] };
        const isActive = grupoActual.activo;
        const seleccionadas = grupoActual.subOpcionesSeleccionadas || [];
        const personalizados = grupoActual.serviciosPersonalizados || [];
        const totalSeleccionadas = seleccionadas.length + personalizados.length;
        const expandido = gruposExpandidos[grupo.id] || false;
        const setExpandido = (val) => setGruposExpandidos(prev => ({ ...prev, [grupo.id]: typeof val === 'function' ? val(prev[grupo.id] || false) : val }));
        const nuevoServicio = nuevosServicios[grupo.id] || '';
        const setNuevoServicio = (val) => setNuevosServicios(prev => ({ ...prev, [grupo.id]: val }));

        const toggleGrupo = () => {
          if (!isActive) {
            // Activar y abrir
            setFormData(prev => ({
              ...prev,
              servicios: {
                ...prev.servicios,
                [grupo.id]: { ...grupoActual, activo: true }
              }
            }));
            setExpandido(true);
          } else {
            // Si está expandido y no tiene nada seleccionado, desactivar al cerrar
            const sinSeleccion = totalSeleccionadas === 0;
            if (expandido && sinSeleccion) {
              setFormData(prev => ({
                ...prev,
                servicios: {
                  ...prev.servicios,
                  [grupo.id]: { ...grupoActual, activo: false }
                }
              }));
            }
            setExpandido(e => !e);
          }
        };

        const desactivarGrupo = (e) => {
          e.stopPropagation();
          setFormData(prev => ({
            ...prev,
            servicios: {
              ...prev.servicios,
              [grupo.id]: { ...grupoActual, activo: false, subOpcionesSeleccionadas: [], serviciosPersonalizados: [] }
            }
          }));
          setExpandido(false);
        };

        const agregarPersonalizado = () => {
          const texto = nuevoServicio.trim();
          if (!texto) return;
          const capitalizado = texto.charAt(0).toUpperCase() + texto.slice(1);
          if (personalizados.includes(capitalizado)) return;
          setFormData(prev => ({
            ...prev,
            servicios: {
              ...prev.servicios,
              [grupo.id]: { ...grupoActual, serviciosPersonalizados: [...personalizados, capitalizado] }
            }
          }));
          setNuevoServicio('');
        };

        const quitarPersonalizado = (srv) => {
          setFormData(prev => ({
            ...prev,
            servicios: {
              ...prev.servicios,
              [grupo.id]: { ...grupoActual, serviciosPersonalizados: personalizados.filter(p => p !== srv) }
            }
          }));
        };

        return (
          <div key={grupo.id} className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${isActive ? 'border-[#2D6A6A] bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}>

            {/* HEADER — siempre visible */}
            {(() => {
              const iconosGrupo = {
                consulta_general: Stethoscope,
                especialidades_medicas: Activity,
                quirurgico_critico: IconoBisturi,
                imagenes: Microscope,
                laboratorio: FileText,
                atencion_por_especie: Heart,
                bienestar_comportamiento: Brain,
                terapias_holisticas: Sparkles,
              };
              const IconoGrupo = iconosGrupo[grupo.id] || Stethoscope;
              return (
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer select-none"
                  onClick={toggleGrupo}
                >
                  <IconoGrupo
                    onClick={isActive ? desactivarGrupo : undefined}
                    className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive ? 'text-[#2D6A6A]' : 'text-gray-500'}`}
                  />
                  <span className={`flex-1 text-sm font-black ${isActive ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>
                    {grupo.grupo}
                  </span>

              {/* Pills de seleccionadas (cuando está cerrado y activo) */}
              {isActive && !expandido && totalSeleccionadas > 0 && (
                <span className="text-[11px] font-bold text-[#2D6A6A] bg-[#2D6A6A]/10 px-2.5 py-1 rounded-full shrink-0">
                  {totalSeleccionadas} seleccionada{totalSeleccionadas !== 1 ? 's' : ''}
                </span>
              )}

              <ChevronDown strokeWidth={2.5} className={`w-5 h-5 transition-transform duration-300 shrink-0 ${expandido && isActive ? 'rotate-180 text-[#2D6A6A]' : 'text-gray-500'}`} />
                </div>
              );
            })()}

            {/* RESUMEN DE SELECCIONADAS — visible cuando cerrado y activo */}
            {isActive && !expandido && totalSeleccionadas > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {seleccionadas.map(s => (
                  <span key={s} className="text-[11px] font-medium bg-[#F4F7F7] text-[#2D6A6A] border border-[#2D6A6A]/20 px-2.5 py-1 rounded-full">{s}</span>
                ))}
                {personalizados.map(s => (
                  <span key={s} className="text-[11px] font-medium bg-[#F4F7F7] text-[#666666] border border-gray-200 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            )}

            {/* CONTENIDO EXPANDIDO */}
            {expandido && (
              <div className="px-4 pb-5 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">

                {/* SUB-OPCIONES */}
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Especialidades</p>
                <div className="flex flex-col gap-2 mb-4">
                  {grupo.opciones.map(opcion => {
                    const isChecked = seleccionadas.includes(opcion);
                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => {
                          const nuevas = isChecked
                            ? seleccionadas.filter(o => o !== opcion)
                            : [...seleccionadas, opcion];
                          setFormData(prev => ({
                            ...prev,
                            servicios: {
                              ...prev.servicios,
                              [grupo.id]: { ...grupoActual, subOpcionesSeleccionadas: nuevas }
                            }
                          }));
                        }}
                        className={`w-full justify-start px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-colors flex items-center gap-3 ${isChecked ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A6A]'}`}
                      >
                        <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked ? 'bg-white border-white' : 'border-gray-300'}`}>
                          {isChecked && <Check className="w-3 h-3 text-[#1A3D3D]" />}
                        </div>
                        <span className="text-left">{opcion}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SERVICIOS PERSONALIZADOS YA AGREGADOS */}
                {personalizados.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {personalizados.map(srv => (
                      <div key={srv} className="w-full justify-start px-4 py-2.5 rounded-xl text-[13px] font-bold border bg-[#1A3D3D] text-white border-[#1A3D3D] flex items-center gap-3">
                        <div className="w-4 h-4 rounded-[4px] bg-white border-white border flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[#1A3D3D]" />
                        </div>
                        <span className="flex-1 text-left">{srv}</span>
                        <button
                          type="button"
                          onClick={() => quitarPersonalizado(srv)}
                          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* AGREGAR SERVICIO PERSONALIZADO */}
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">¿No encontrás lo que buscás? Agregá uno propio</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevoServicio}
                      onChange={(e) => setNuevoServicio(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarPersonalizado(); } }}
                     
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A6A] outline-none text-[#1A3D3D]"
                    />
                    <button
                      type="button"
                      onClick={agregarPersonalizado}
                      className="bg-[#2D6A6A] text-white p-2.5 rounded-xl hover:bg-[#1A3D3D] transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* DESCRIPCIÓN OPCIONAL */}
                <div className="mt-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    Descripción opcional del grupo
                  </label>
                  <textarea
                    placeholder="Contá brevemente cómo trabajás en esta área..."
                    value={grupoActual.desc || ''}
                    maxLength={200}
                    rows={2}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        servicios: {
                          ...prev.servicios,
                          [grupo.id]: { ...grupoActual, desc: e.target.value }
                        }
                      }));
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-[#2D6A6A] outline-none text-[#1A3D3D] font-medium"
                  />
                  <p className={`text-right text-[10px] font-bold mt-1 ${(grupoActual.desc?.length || 0) >= 180 ? 'text-red-400' : 'text-gray-300'}`}>
                    {grupoActual.desc?.length || 0} / 200
                  </p>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
        
            {activeTab === 'casos' && isPro && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8 flex justify-between items-end">
                   <div>
                     <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] flex items-center gap-2">Casos Clínicos </h3>
                     <p className="text-sm text-gray-500 mt-1">Sube fotos del antes y después para generar confianza en tu trabajo.</p>
                   </div>
                </div>

                <div className="space-y-6">
                  {formData.casos.map((item, index) => (
                    <div key={item.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-5 relative text-left shadow-sm">
                      <button onClick={() => handleArrayRemove('casos', item.id)} className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-300 hover:text-red-500 rounded-xl hover:border-red-200 shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                      
                      <div className="flex flex-col md:flex-row gap-6 mt-2">
                        {/* Gestor de Fotos */}
                        <div className="w-full md:w-40 flex flex-wrap gap-2 shrink-0">
                          {item.fotos.map((f, fi) => (
                            <div key={fi} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 group/img shadow-sm">
                              <img src={f} className="w-full h-full object-cover" alt="Thumb" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button onClick={() => moveCasoFoto(item.id, fi, 'left')} className="text-white hover:text-[#4DB6AC]"><ArrowLeft className="w-4 h-4" /></button>
                                <button onClick={() => removeCasoFoto(item.id, fi)} className="text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                          <label htmlFor={`c-img-${item.id}`} className="w-16 h-16 rounded-xl border-2 border-dashed border-[#2D6A6A]/40 flex flex-col items-center justify-center text-[#2D6A6A] hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] cursor-pointer transition-colors bg-white">
                            <ImageIcon className="w-5 h-5 mb-0.5" />
                            <span className="text-[8px] font-black uppercase">Foto</span>
                          </label>
                          <input type="file" id={`c-img-${item.id}`} className="hidden" accept="image/*" multiple onChange={(e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropModal({ isOpen: true, imageSrc: event.target.result, targetId: 'caso', caseId: item.id, type: 'caso' });
    };
    reader.readAsDataURL(file);
  });
  e.target.value = null;
}} />
                        </div>
                        
                        {/* Textos del Caso */}
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <div className="w-1/3">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Paciente</label>
                              <input type="text" placeholder="Ej: Firulais" value={item.nombre} onChange={(e) => handleArrayUpdate('casos', item.id, 'nombre', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#2D6A6A] outline-none" />
                            </div>
                            <div className="w-2/3">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Patología o Motivo</label>
                              <input type="text" placeholder="Ej: Corrección de luxación patelar" value={item.patologia} onChange={(e) => handleArrayUpdate('casos', item.id, 'patologia', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2D6A6A] font-medium focus:border-[#2D6A6A] outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Relato del caso</label>
                            <div>
  <textarea 
  placeholder="Cuenta la historia clínica, tratamiento aplicado y la evolución..." 
  value={item.desc} 
  maxLength={600} 
  onChange={(e) => {
    handleArrayUpdate('casos', item.id, 'desc', e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }}
  onFocus={(e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }}
  rows={4}
  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-[#2D6A6A] outline-none text-[#1A3D3D] overflow-hidden"
/>
  <p className={`text-right text-[10px] font-bold mt-1 mr-1 ${(item.desc?.length || 0) >= 550 ? 'text-red-400' : 'text-gray-400'}`}>
    {item.desc?.length || 0} / 600
  </p>
</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => handleArrayAdd('casos', { nombre: "", patologia: "", desc: "", fotos: [] })} className="w-full py-4 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-xs font-bold hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Publicar Nuevo Caso
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'papers' && isPro && (
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative animate-in fade-in duration-300 min-h-[500px]">
                <div className="mb-8">
                   <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] flex items-center gap-2">Publicaciones y Papers</h3>
                  
                   <p className="text-m text-gray-500 mt-1">Compartí tus investigaciones científicas en formato PDF de forma directa.</p>
                   <p className="text-sm text-gray-500 mt-1">Se verán publicados en la sección de Publicaciones Cientificas para que tus colegas puedan verlos.</p>
                </div>

                <div className="space-y-6">
                 {formData.papers.map((item) => {
                    const isEditing = item.isEditing !== false;

                    // Función para validar obligatorios al colapsar
                    const handleCollapse = () => {
                      if (!item.titulo || !item.anio || !item.categoria || !item.desc || !item.pdfUrl) {
                        setModalConfig({ isOpen: true, title: 'Campos incompletos', message: 'Por favor, completá todos los campos con asterisco (*) y asegurate de subir el archivo PDF.', type: 'error' });
                        return;
                      }
                      if (item.desc.length < 150 || item.desc.length > 1500) {
                        setModalConfig({ isOpen: true, title: 'Longitud del resumen', message: 'El resumen debe tener entre 150 y 1500 caracteres. Te ayuda a dar un buen pantallazo sin excederte.', type: 'error' });
                        return;
                      }
                      handleArrayUpdate('papers', item.id, 'isEditing', false);
                    };

                    return (
                      <div key={item.id} className={`bg-gray-50/50 rounded-3xl border border-gray-100 relative text-left shadow-sm transition-all duration-300 ${isEditing ? 'p-6 flex flex-col gap-5' : 'p-4'}`}>
                        
                        <button onClick={async () => {
                            if (item.storagePath) handlePdfRemove(item.id, item.storagePath);
                            handleArrayRemove('papers', item.id);
                            // NUEVO: Borramos directamente de la colección global en Firebase
                            try { await deleteDoc(doc(db, 'papers', String(item.id))); } catch(e) { console.log(e) }
                          }} 
                          className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-300 hover:text-red-500 rounded-xl hover:border-red-200 shadow-sm transition-colors z-10" title="Eliminar publicación por completo">
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {!isEditing ? (
                          <div className="flex items-center justify-between pr-12">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center text-[#2D6A6A] overflow-hidden">
                                {item.portada ? <img src={item.portada} alt="Portada" className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-[#1A3D3D] text-sm md:text-base truncate">{item.titulo}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{item.categoria} • {item.anio} • 📎 PDF Adjunto</p>
                              </div>
                            </div>
                            <button onClick={() => handleArrayUpdate('papers', item.id, 'isEditing', true)} className="text-sm font-bold text-[#4DB6AC] hover:text-[#2D6A6A] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                              Editar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col md:flex-row gap-6 mt-2">
                              
                              {/* ZONA MULTIMEDIA: PORTADA Y PDF */}
                              <div className="w-full md:w-40 shrink-0 flex flex-col gap-4">
                                
                                {/* 1. PORTADA */}
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Portada (Opcional)</label>
                                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group/img shadow-sm bg-white">
                                    {item.portada ? (
                                      <>
                                        <img src={item.portada} className="w-full h-full object-cover" alt="Portada" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                          <button onClick={() => handleArrayUpdate('papers', item.id, 'portada', '')} className="text-red-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <label htmlFor={`portada-${item.id}`} className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-[#2D6A6A] cursor-pointer transition-colors border-dashed border-2 border-transparent hover:border-[#2D6A6A]/40">
                                          <ImageIcon className="w-6 h-6 mb-1" />
                                          <span className="text-[9px] font-black uppercase text-center px-2">Subir<br/>Imagen</span>
                                        </label>
                                        <input type="file" id={`portada-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'paper', item.id)} />
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* 2. PDF CON DRAG & DROP */}
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Archivo <span className="text-red-400 ml-1">*</span></label>
                                  {item.pdfUrl ? (
                                    <div className="relative w-full py-4 bg-[#4DB6AC]/10 border-2 border-[#4DB6AC] rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
                                      <FileDown className="w-6 h-6 text-[#2D6A6A]" />
                                      <span className="text-[9px] font-bold text-[#1A3D3D] max-w-[120px] truncate block px-2" title={item.fileName}>{item.fileName}</span>
                                      <button 
                                        onClick={(e) => { e.preventDefault(); handlePdfRemove(item.id, item.storagePath); }} 
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                      >
                                        <X className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                    </div>
                                  ) : (
                                    <label 
                                      htmlFor={`pdf-${item.id}`} 
                                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingPaperId(item.id); }}
                                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingPaperId(item.id); }}
                                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingPaperId(null); }}
                                      onDrop={(e) => {
                                        e.preventDefault(); e.stopPropagation();
                                        setDraggingPaperId(null);
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                          handlePdfUpload({ target: { files: [e.dataTransfer.files[0]] } }, item.id);
                                        }
                                      }}
                                      className={`w-full py-6 rounded-xl border-2 border-dashed transition-all duration-200 text-center shadow-sm relative overflow-hidden
                                        ${draggingPaperId === item.id ? 'border-[#4DB6AC] bg-[#4DB6AC]/20 scale-[1.02]' : 
                                          isUploadingPdf ? 'border-gray-300 bg-gray-100' : 
                                          'border-[#2D6A6A]/40 bg-white hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] cursor-pointer'} 
                                        flex flex-col items-center justify-center text-[#2D6A6A]`}
                                    >
                                      {isUploadingPdf ? (
                                        <>
                                          <Loader2 className="w-5 h-5 animate-spin mb-1 text-[#4DB6AC]" />
                                          <span className="text-[9px] font-black uppercase text-[#2D6A6A]">{pdfUploadProgress}%</span>
                                        </>
                                      ) : (
                                        <>
                                          <UploadCloud className="w-6 h-6 mb-1" />
                                          <span className="text-[9px] font-black uppercase tracking-widest leading-tight">Arrastrá o<br/>Subí PDF</span>
                                        </>
                                      )}
                                    </label>
                                  )}
                                  <input type="file" id={`pdf-${item.id}`} className="hidden" accept="application/pdf" disabled={isUploadingPdf} onChange={(e) => handlePdfUpload(e, item.id)} />
                                </div>
                              </div>
                              
                              {/* CAMPOS DE TEXTO */}
                              <div className="flex-1 space-y-4">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Título de la Investigación <span className="text-red-400 ml-1">*</span></label>
                                  <input type="text" placeholder="Ej: Efectos de la dieta BARF en caninos..." value={item.titulo} onChange={(e) => handleArrayUpdate('papers', item.id, 'titulo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#2D6A6A] outline-none shadow-sm" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Año de Publicación <span className="text-red-400 ml-1">*</span></label>
                                    <input type="number" max={new Date().getFullYear()} min="1950" placeholder="Ej: 2025" value={item.anio} onChange={(e) => handleArrayUpdate('papers', item.id, 'anio', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#2D6A6A] outline-none shadow-sm" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Categoría / Etiqueta <span className="text-red-400 ml-1">*</span></label>
                                    <select value={item.categoria} onChange={(e) => handleArrayUpdate('papers', item.id, 'categoria', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[#2D6A6A] outline-none text-[#1A3D3D] shadow-sm">
                                      <option value="">Seleccionar...</option>
                                      <option value="Clínica Médica">Clínica Médica</option>
                                      <option value="Cirugía">Cirugía</option>
                                      <option value="Nutrición">Nutrición</option>
                                      <option value="Comportamiento">Comportamiento</option>
                                      <option value="Farmacología">Farmacología</option>
                                      <option value="Reporte de Casos">Reporte de Casos</option>
                                      <option value="Diagnóstico por Imágenes">Diagnóstico por Imágenes</option>
                                      <option value="Otro">Otro</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between items-end mb-1.5 ml-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Resumen (Abstract) <span className="text-red-400 ml-1">*</span></label>
                                    <span className={`text-[10px] font-bold transition-colors ${(item.desc?.length || 0) < 150 || (item.desc?.length || 0) > 1500 ? 'text-red-400' : 'text-gray-400'}`}>
                                      {item.desc?.length || 0} / 1500
                                    </span>
                                  </div>
                                  <textarea 
                                    maxLength={1500}
                                    placeholder="Pegá acá el abstract de tu investigación (mínimo 150 caracteres)..." 
                                    value={item.desc} 
                                    onChange={(e) => {
                                      handleArrayUpdate('papers', item.id, 'desc', e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }} 
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[96px] overflow-hidden resize-none focus:border-[#2D6A6A] outline-none text-[#1A3D3D] shadow-sm transition-all" 
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-200/50 mt-2">
                              <button onClick={handleCollapse} className="px-6 py-2.5 bg-[#1A3D3D] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#2D6A6A] transition-colors">
                                Guardar y Colapsar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  
                  <button onClick={() => handleArrayAdd('papers', { titulo: "", desc: "", anio: "", categoria: "", pdfUrl: "", fileName: "", storagePath: "", isEditing: true })} className="w-full py-4 border-2 border-dashed border-[#2D6A6A]/30 bg-white rounded-xl text-[#2D6A6A] text-[11px] font-black hover:bg-[#2D6A6A]/5 hover:border-[#2D6A6A] transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Cargar Nueva Investigación
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* LINK INFERIOR PARA VER PERFIL */}
            {/* ========================================================================= */}
            {/* CAJA VER PERFIL DE EJEMPLO — solo móvil */}
            <div className="md:hidden mt-6 bg-[#1A3D3D]/5 border border-[#1A3D3D]/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-[#1A3D3D] leading-snug mb-3">¿Querés ver cómo quedaría tu perfil público?</p>
<a
  href="/profesional/mercedes-arenas"
  target="_blank"
  rel="noreferrer"
  className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#2D6A6A] uppercase tracking-widest hover:border-[#4DB6AC] hover:text-[#4DB6AC] transition-all flex items-center justify-center gap-1.5 group shadow-sm"
>
  Ver perfil de ejemplo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
</a>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8 pb-4">
              <button
                onClick={handleSaveData}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className={`px-6 md:px-8 py-3 rounded-xl font-bold text-[11px] md:text-[12px] uppercase tracking-[0.15em] shadow-md transition-all flex items-center justify-center gap-2 w-full md:w-auto
                  ${saveStatus === 'saving' ? 'bg-[#1A3D3D] text-white opacity-70 cursor-not-allowed' :
                    saveStatus === 'saved' ? 'bg-[#4DB6AC] text-white cursor-default' :
                    'bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] hover:-translate-y-0.5'}`}
              >
                {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveStatus === 'saved' && <Check className="w-4 h-4" />}
                {saveStatus === 'idle' && <Save className="w-4 h-4" />}
                {saveStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                {saveStatus === 'saving' ? <span>Guardando...</span> :
                 saveStatus === 'saved' ? <span>¡Guardado!</span> :
                 saveStatus === 'error' ? <span>Error</span> :
                 <span>Guardar Cambios</span>}
              </button>

              <button
                type="button"
                onClick={() => {
  const slugActual = currentUser.slug || generarSlug(formData.nombre);
  if (haycambiosSinGuardar) {
    setPendingNavigation(`/profesional/${slugActual}`);
    setExitModalOpen(true);
  } else {
    navigate(`/profesional/${slugActual}`);
  }
}}
                className="text-center text-gray-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-[#4DB6AC] transition-colors flex items-center justify-center gap-2 group bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm w-full md:w-auto"
              >
                Ver mi perfil público <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </div>
      {/* FOOTER ESMERALDA DEGRADADO */}        
      <FooterSimple seccion="Panel de Gestión" />

    </div>
  );
}