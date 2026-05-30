import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, 
  MapPin, ShieldCheck, Check, Video,
  Smartphone, Home, Mail, Award, ChevronDown, ChevronRight,
  ExternalLink, Heart, Undo2, Redo2, FileCheck, 
  Building2, AlertTriangle, Building, PackageSearch, ImagePlus,
  Globe, Truck, FileText, CreditCard, Wrench, Crop, Briefcase, User, Lock, Eye, EyeOff, Box, ArrowLeft, ArrowRight, Tag, DollarSign, List, Clock, Loader2, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// IMPORTACIONES DE FIREBASE
// ==========================================
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
// ==========================================
// CONSTANTES
// ==========================================
const PROVINCIAS_ARG = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
];

// ==========================================
// COMPONENTES DE UI REUTILIZABLES
// ==========================================

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

        {canTest && !isPassword && (
          <a 
            href={value ? (value.startsWith('http') ? value : `https://${value}`) : '#'} 
            target="_blank" 
            rel="noreferrer"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all shadow-sm z-10 ${value ? 'bg-white border-gray-200 text-gray-500 hover:text-[#4DB6AC] hover:border-[#4DB6AC] cursor-pointer' : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'}`}
            title="Probar enlace"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};

const SelectGroup = ({ label, id, value, onChange, options, tooltip, required }) => (
  <div className="mb-6 w-full">
    <div className="flex justify-between items-end mb-2 ml-1">
      <label htmlFor={id} className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
        {label} {required && <span className="text-red-400 ml-1">*</span>}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
    </div>
    <div className="relative text-left">
      <select
        id={id} name={id} value={value} onChange={onChange}
        className="w-full bg-gray-50/50 border border-gray-200 focus:border-[#2D6A6A] rounded-2xl px-5 py-3.5 text-base font-medium focus:outline-none transition-all text-[#1A3D3D] appearance-none"
      >
        <option value="" disabled className="text-gray-400">Seleccionar opción...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
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

      {/* Overflow visible para permitir tooltips */}
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
  
  const isBanner = type === 'banner';
  const isNosotros = type === 'imagenNosotros';
  const CROP_WIDTH = isBanner ? 600 : (isNosotros ? 400 : 256);
  const CROP_HEIGHT = isBanner ? 200 : (isNosotros ? 300 : 256);
  const borderRadius = isBanner ? '1.5rem' : '1.5rem';

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
    canvas.width = isBanner ? 1200 : (isNosotros ? 800 : 800); 
    canvas.height = isBanner ? 400 : (isNosotros ? 600 : 800);
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    const baseScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const finalScale = baseScale * zoom;
    const drawWidth = img.naturalWidth * finalScale;
    const drawHeight = img.naturalHeight * finalScale;
    const ratioX = canvas.width / CROP_WIDTH;
    const ratioY = canvas.height / CROP_HEIGHT;
    const drawX = (canvas.width - drawWidth) / 2 + (position.x * ratioX);
    const drawY = (canvas.height - drawHeight) / 2 + (position.y * ratioY);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div 
        className="relative bg-gray-100 overflow-hidden cursor-move touch-none shadow-inner max-w-full"
        style={{ width: isBanner ? '100%' : CROP_WIDTH, height: CROP_HEIGHT, maxWidth: CROP_WIDTH, borderRadius }}
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
        <button onClick={handleCropClick} className="px-8 py-3 rounded-xl bg-[#1A3D3D] text-white font-bold hover:bg-[#2D6A6A] transition-colors shadow-lg flex items-center gap-2 text-base"><Check className="w-5 h-5" /> Aplicar Recorte</button>
      </div>
    </div>
  );
};

const CustomGrip = () => (
  <div className="flex w-[14px] flex-wrap gap-[3px] opacity-30 group-hover:opacity-100 transition-opacity items-center justify-center pointer-events-none">
    {[...Array(6)].map((_, i) => <div key={i} className="w-[3.5px] h-[3.5px] rounded-full bg-gray-500"></div>)}
  </div>
);

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
const storage = getStorage();
// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
export default function EditorEmpresa() { 
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); 

  // NUEVO: Estado para Suscripción (Falso para mostrar el mockup del cartel de advertencia)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  const [activeTab, setActiveTab] = useState('cuenta');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' }); 
  const [openSection, setOpenSection] = useState(null); 
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, type: null });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false); 
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [nuevaCaracteristica, setNuevaCaracteristica] = useState('');
  
  // ESTADOS PARA DRAG & DROP Y AUTO-SCROLL
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const scrollContainerRef = useRef(null);
  const scrollInterval = useRef(null);
  
  const productoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const imagenNosotrosInputRef = useRef(null);

  const initialData = {
    cuentaEmail: 'usuario@vetsur.com.ar',
    cuentaPassword: 'vetsur2026',
    cuentaTelefono: '5491145678901',
    foto: '',
    banner: '',
    nombreEmpresa: '', 
    razonSocial: '',
    cuit: '',
    categoria: '', 
    bioCorta: '',
    descripcion: '',
    imagenNosotros: '',
    videoNosotros: '',
    direccion: '',
    mapaUrl: '',
    horariosAtencion: '',
    modalidad: { ventaOnline: false, showroom: false, local: false, domicilio: false }, 
    zonaCobertura: [], 
    whatsappActivo: false,
    whatsappVentas: '',
    emailVentas: '',
    web: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    linkCatalogo: '', 
    marcasRepresentadas: '',
    categorias: { alimentos: false, farmacia: false, equipamiento: false, descartables: false, instrumental: false, software: false },
    logistica: { todoElPais: false, despachoRapido: false, transporteConvenir: false, retiroLocal: false, embalajeSeguro: false },
    pagos: { transferencia: false, tarjetaCredito: false, echeq: false, facturaA: false, financiacionPropia: false },
    garantia: { oficial: false, tecnicoPropio: false, repuestos: false, asesoramiento: false },
    productosDestacados: []
  };

  const [_formData, _setFormData] = useState(initialData);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoRedAction = useRef(false);

  const formData = _formData;

  useEffect(() => {
    const initAuth = async () => {
      // -------------------------------------------------------------
      // MODO DESARROLLO (Activo): Inicia sesión de forma anónima para poder 
      // leer/escribir en Firebase sin necesidad de pantalla de Login.
      // -------------------------------------------------------------
      try { 
        await signInAnonymously(auth); 
      } catch (error) { 
        console.error("Error Auth:", error); 
      }
    };
    
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadDataFromCloud = async () => {
      try {
        const userId = user ? user.uid : "proveedor_prueba_123";
        const docRef = doc(db, 'proveedores', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          _setFormData({ ...initialData, ...docSnap.data() }); 
        } else {
          _setFormData({ 
             ...initialData, 
             nombreEmpresa: "Mi Empresa Veterinaria",
             cuentaEmail: 'usuario@vetsur.com.ar',
             cuentaTelefono: '5491145678901'
          });
        }
      } catch (error) {
        console.error("Error cargando base de datos:", error);
      } 
    };
    loadDataFromCloud();
  }, [user]);

  const handleGuardarEnLaNube = async () => {
    // Validaciones
    const faltanCampos = [];
    
    if (!formData.nombreEmpresa.trim()) faltanCampos.push('Nombre de la Empresa');
    if (!formData.cuit.trim()) faltanCampos.push('CUIT');
    if (!formData.categoria) faltanCampos.push('Categoría Principal');
    if (formData.descripcion.trim().length < 20) faltanCampos.push('Descripción (mínimo 20 caracteres)');
    if (formData.zonaCobertura.length === 0) faltanCampos.push('Zona de Cobertura');
    if (!formData.emailVentas.trim()) faltanCampos.push('Email Comercial');

    if (faltanCampos.length > 0) {
      setModalConfig({ 
        isOpen: true, 
        title: 'Faltan datos obligatorios', 
        message: `Para que tu perfil luzca profesional, completá los siguientes campos: ${faltanCampos.join(', ')}.`, 
        type: 'error' 
      });
      return;
    }

    setSaveStatus('saving');
    try {
      const userId = user ? user.uid : "proveedor_prueba_123";
      const docRef = doc(db, 'proveedores', userId);
      await setDoc(docRef, formData);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      setSaveStatus('error');
      setModalConfig({ isOpen: true, title: 'Error de Conexión', message: `No pudimos guardar los datos. Revisa tu conexión.`, type: 'error' });
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };
  
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
    const weights = { identidad: 25, detalle: 25, catalogo: 25, contacto: 25 };
    if (formData.foto && formData.nombreEmpresa && formData.cuit && formData.categoria) score += weights.identidad;
    if (formData.descripcion.length > 50) score += weights.detalle;
    if (formData.productosDestacados && formData.productosDestacados.length > 0) score += weights.catalogo;
    if (formData.emailVentas && formData.whatsappVentas && formData.zonaCobertura.length > 0) score += weights.contacto;
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

  const handleNestedChange = (categoryGroup, item) => {
    setFormData(prev => ({
      ...prev,
      [categoryGroup]: { ...prev[categoryGroup], [item]: !prev[categoryGroup][item] }
    }));
  };

  const toggleProvincia = (provincia) => {
    setFormData(prev => {
      const current = prev.zonaCobertura || [];
      if (current.includes(provincia)) return { ...prev, zonaCobertura: current.filter(p => p !== provincia) };
      return { ...prev, zonaCobertura: [...current, provincia] };
    });
  };

  const toggleTodasProvincias = () => {
    setFormData(prev => {
      if (prev.zonaCobertura?.length === PROVINCIAS_ARG.length) return { ...prev, zonaCobertura: [] };
      return { ...prev, zonaCobertura: [...PROVINCIAS_ARG] };
    });
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprime a JPEG con 80% de calidad
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setCropModal({ isOpen: true, imageSrc: compressedBase64, type });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const saveCroppedImage = (croppedBase64) => {
    if (cropModal.type === 'logo') setFormData(prev => ({ ...prev, foto: croppedBase64 }));
    else if (cropModal.type === 'banner') setFormData(prev => ({ ...prev, banner: croppedBase64 }));
    else if (cropModal.type === 'imagenNosotros') setFormData(prev => ({ ...prev, imagenNosotros: croppedBase64 }));
    else if (cropModal.type === 'producto' && productoEnEdicion) setProductoEnEdicion(prev => ({ ...prev, imagenes: [...prev.imagenes, croppedBase64].slice(0, 4) }));
    setCropModal({ isOpen: false, imageSrc: null, type: null });
  };

  const triggerFileInput = (ref) => { if (ref && ref.current) ref.current.click(); };

  // Funciones para eliminar Logo y Banner
  const eliminarLogo = (e) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, foto: '' }));
  };

  const eliminarBanner = (e) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, banner: '' }));
  };

  const iniciarNuevoProducto = () => setProductoEnEdicion({ id: Date.now(), titulo: '', categoria: '', etiqueta: '', precio: '', imagenes: [], descripcionLarga: '', caracteristicas: [] });
  const editarProducto = (prod) => setProductoEnEdicion({ ...prod }); 
  const eliminarProducto = (id) => setFormData(prev => ({ ...prev, productosDestacados: prev.productosDestacados.filter(p => p.id !== id) }));
  const guardarProducto = () => {
    if (!productoEnEdicion.titulo) return; 
    setFormData(prev => {
      const existe = prev.productosDestacados.find(p => p.id === productoEnEdicion.id);
      if (existe) return { ...prev, productosDestacados: prev.productosDestacados.map(p => p.id === productoEnEdicion.id ? productoEnEdicion : p) };
      return { ...prev, productosDestacados: [...prev.productosDestacados, productoEnEdicion] };
    });
    setProductoEnEdicion(null); 
  };
  const handleProductoChange = (e) => setProductoEnEdicion(prev => ({ ...prev, [e.target.id]: e.target.value }));
  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim() === '') return;
    const nueva = { id: Date.now(), texto: nuevaCaracteristica.trim() };
    setProductoEnEdicion(prev => ({ ...prev, caracteristicas: [...prev.caracteristicas, nueva] }));
    setNuevaCaracteristica('');
  };
  const eliminarCaracteristica = (idx) => setProductoEnEdicion(prev => ({ ...prev, caracteristicas: prev.caracteristicas.filter((_, index) => index !== idx) }));
  const eliminarImagenProducto = (idx) => setProductoEnEdicion(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, index) => index !== idx) }));

  // Drag & Drop
  const startScrolling = (amount) => {
    if (scrollInterval.current) return;
    scrollInterval.current = setInterval(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop += amount; }, 16);
  };
  const stopScrolling = () => {
    if (scrollInterval.current) { clearInterval(scrollInterval.current); scrollInterval.current = null; }
  };
  const checkAutoScroll = (clientY) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const edge = 80; 
    if (clientY >= rect.top && clientY <= rect.top + edge) startScrolling(-10); 
    else if (clientY <= rect.bottom && clientY >= rect.bottom - edge) startScrolling(10); 
    else stopScrolling();
  };
  const handleDragStart = (e, index) => { setDraggedItem(index); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, index) => { if (e.cancelable !== false) e.preventDefault(); checkAutoScroll(e.clientY); if (draggedItem === index) return; setDragOverItem(index); };
  const handleDragLeave = (e, index) => { if (e.cancelable !== false) e.preventDefault(); if (dragOverItem === index) setDragOverItem(null); };
  const handleDragEnd = () => { setDraggedItem(null); setDragOverItem(null); stopScrolling(); };
  const handleDrop = (e, dropIndex) => {
    if (e && e.cancelable !== false && e.preventDefault) e.preventDefault();
    setDragOverItem(null); stopScrolling();
    if (draggedItem === null || draggedItem === dropIndex) return;
    setFormData(prev => {
      const nuevos = [...prev.productosDestacados];
      const item = nuevos[draggedItem];
      nuevos.splice(draggedItem, 1);
      nuevos.splice(dropIndex, 0, item);
      return { ...prev, productosDestacados: nuevos };
    });
    setDraggedItem(null);
  };
  const handleTouchMove = (e) => {
    const touch = e.touches[0]; checkAutoScroll(touch.clientY);
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = target?.closest('[data-drag-index]');
    if (card) {
      const dropIndex = parseInt(card.getAttribute('data-drag-index'), 10);
      if (!isNaN(dropIndex) && dropIndex !== draggedItem && dropIndex !== dragOverItem) setDragOverItem(dropIndex);
    }
  };
  const handleTouchEnd = (e) => {
    stopScrolling();
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) handleDrop(e, dragOverItem);
    else handleDragEnd();
  };

  useEffect(() => { return () => stopScrolling(); }, []);
  
  const formatearPrecio = (precioText) => {
    if (!precioText) return '';
    return `$ ${precioText.replace(/^\$\s*/, '')}`;
  };

  return (
    <>
      <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased text-left text-[#1A3D3D] selection:bg-[#4DB6AC] selection:text-white relative w-full overflow-x-hidden flex flex-col">
        
        {/* MODAL DE RECORTE DE IMAGEN */}
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
                 <SimpleCropper imageSrc={cropModal.imageSrc} type={cropModal.type} onCrop={saveCroppedImage} onCancel={() => setCropModal({ isOpen: false })} />
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE ERROR Y NAVEGACIÓN */}
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
                  <h2 className="text-4xl font-black text-[#1A3D3D] font-['Montserrat']">Proveedor PRO</h2>
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

        {/* NAVBAR DE APLICACIÓN (h: 64px) */}
        <nav className="fixed top-0 w-full z-[80] h-[64px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 md:px-10 shadow-sm">
          <div className="max-w-[1100px] w-full mx-auto flex justify-between items-center">
            
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-[#4DB6AC] transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                 <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-bold hidden sm:block">Volver al Portal</span>
              </button>
              <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
              <div className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-xl tracking-tight cursor-pointer">
                 El Portal<span className="text-[#2D6A6A]">.</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right mr-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#1A3D3D] truncate max-w-[150px]">{formData.nombreEmpresa || 'Proveedor'}</p>
                <p className="text-[10px] font-bold text-[#4DB6AC]">Proveedor</p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-100 shrink-0 flex items-center justify-center">
                 {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <Building className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

          </div>
        </nav>

        {/* LAYOUT PRINCIPAL (Padding 76px) */}
        <div className="pt-[76px] max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col gap-2 md:gap-6 w-full pb-10">
          
          {/* BANNER DE SUSCRIPCIÓN INACTIVA */}
          {!isSubscriptionActive && (
            <div className="w-full bg-red-50 border border-red-200 rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm animate-in fade-in slide-in-from-top-4 z-10">
              <div className="flex items-center gap-4 text-left w-full md:w-auto">
                <div className="w-12 h-12 bg-red-100/50 rounded-full flex items-center justify-center shrink-0 border border-red-200">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-base md:text-lg">Cuenta suspendida por falta de pago</h3>
                  <p className="text-sm text-red-700/90 font-medium mt-0.5 leading-snug">Tu perfil de proveedor no está visible en el directorio. Regularizá tu situación para volver a aparecer.</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="shrink-0 w-full md:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Regularizar pago
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-start relative flex-1 w-full">
            {/* COLUMNA IZQUIERDA: SIDEBAR */}
            <div className="w-full md:w-[260px] shrink-0 md:sticky md:top-[96px] self-start z-20">
              
              <div className="h-[48px] flex items-center mb-1 md:mb-6 px-1">
                 <h2 className="text-[28px] font-black font-['Montserrat'] uppercase tracking-tight text-[#1A3D3D] hidden md:block leading-none">
                   Configuración
                 </h2>
              </div>
              
              <nav className="flex flex-col gap-1.5 pb-2 md:pb-0 bg-white md:bg-transparent p-2 md:p-0 rounded-2xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">
                <button onClick={() => setActiveTab('cuenta')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'cuenta' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                  <User className={`w-5 h-5 ${activeTab === 'cuenta' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Sobre mi cuenta
                </button>
                <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'perfil' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                  <Building className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Mi perfil público
                </button>
                <button onClick={() => setActiveTab('catalogo')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none ${activeTab === 'catalogo' ? 'bg-[#2D6A6A]/10 text-[#1A3D3D]' : 'text-gray-500 hover:bg-white hover:text-[#4DB6AC]'}`}>
                  <Box className={`w-5 h-5 ${activeTab === 'catalogo' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} /> Catálogo de productos
                </button>
              </nav>
            </div>

            {/* COLUMNA DERECHA: ÁREA PRINCIPAL */}
            <div className="flex-1 w-full flex flex-col min-w-0">
              
              {/* BARRA DE ACCIÓN SUPERIOR ALINEADA (Alto 48px) */}
              <div className="flex justify-between items-center mb-3 md:mb-6 h-[48px] w-full">
                 
                 <div className="flex items-center gap-2 shrink-0">
                    <button onClick={undo} disabled={past.length === 0} className={`p-2.5 rounded-xl transition-all border ${past.length > 0 ? 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] shadow-sm' : 'bg-transparent border-transparent text-gray-300'}`} title="Deshacer"><Undo2 className="w-5 h-5" /></button>
                    <button onClick={redo} disabled={future.length === 0} className={`p-2.5 rounded-xl transition-all border ${future.length > 0 ? 'bg-white border-gray-200 text-[#1A3D3D] hover:border-[#4DB6AC] hover:text-[#4DB6AC] shadow-sm' : 'bg-transparent border-transparent text-gray-300'}`} title="Rehacer"><Redo2 className="w-5 h-5" /></button>
                 </div>

                 <button 
                   onClick={handleGuardarEnLaNube} 
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
                    {/* ESTADO DE LA MENSUALIDAD (Ahora arriba) */}
                    <div className="mb-8 pb-8 border-b border-gray-100">
                       <h4 className="flex items-center gap-2 text-sm font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5">
                         <CreditCard className="w-5 h-5 text-[#2D6A6A]" /> Estado de la mensualidad
                       </h4>
                       <div className={`border p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors ${isSubscriptionActive ? 'bg-gray-50 border-gray-200' : 'bg-red-50/50 border-red-200'}`}>
                         <div>
                            <p className={`font-bold text-lg ${isSubscriptionActive ? 'text-[#1A3D3D]' : 'text-red-800'}`}>Plan Proveedor PRO</p>
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

                    {/* DATOS DE ACCESO (Ahora abajo) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-start">
                       <InputGroup label="Email de Acceso" id="cuentaEmail" type="email" value={formData.cuentaEmail} readOnly tooltip="Este email está vinculado a tu cuenta y no puede modificarse desde aquí." />
                       <InputGroup label="Contraseña" id="cuentaPassword" type="password" value={formData.cuentaPassword} onChange={handleChange} placeholder="••••••••" tooltip="Modificá este campo solo si querés cambiar tu contraseña." />
                       <div className="md:col-span-2">
                         <InputGroup label="Teléfono de Recuperación" id="cuentaTelefono" type="tel" value={formData.cuentaTelefono} readOnly tooltip="Número validado para la recuperación de la cuenta." />
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
                        {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> : <Building className="w-6 h-6 text-gray-400" />}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#4DB6AC] p-1.5 rounded-xl border-2 border-white"><ShieldCheck className="w-3 h-3 text-white" /></div>
                    </div>

                    {/* Info Corta */}
                    <div className="flex-1 text-center md:text-left min-w-0">
                      <h3 className="text-xl font-black font-['Montserrat'] text-[#1A3D3D] truncate leading-tight mb-1">{formData.nombreEmpresa || "Nombre de Empresa"}</h3>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="text-[#4DB6AC] bg-[#4DB6AC]/10 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{formData.categoria || "Categoría Principal"}</span>
                        {formData.cuit && <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">CUIT: {formData.cuit}</span>}
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> 
                          {formData.zonaCobertura.length === 24 
                            ? "Envío a Todo el País" 
                            : formData.zonaCobertura.length > 0 
                              ? `${formData.zonaCobertura.length} zonas de cob.` 
                              : "Ubicación a definir"}
                        </span>
                        {formData.modalidad.ventaOnline && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[#4DB6AC]" /> Venta Online</span>}
                      </div>
                    </div>

                    {/* Caja de Progreso Original */}
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

                  {/* FORMULARIO */}
                  <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 mb-6">
                    
                    <div className="pt-6 px-6 md:px-10 pb-4">
                      <h3 className="text-xl font-black text-[#1A3D3D] mb-1 font-['Montserrat']">Mi perfil público</h3>
                      <p className="text-xs text-gray-500 mb-0">Toda la info que cargues aquí será la que las clínicas verán en el directorio.</p>
                    </div>

                    <div className="border-t border-gray-100">
                      {/* IDENTIDAD VISUAL */}
                    {/* IDENTIDAD VISUAL */}
                    <Accordion title="Identidad Visual e Info" icon={Building2} isOpen={openSection === 'identidad'} onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}>
                      <div className="flex flex-col sm:flex-row gap-6 mb-8 mt-2 md:mt-0">
                        {/* LOGO */}
                        <div className="relative shrink-0 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Logo Empresa</label>
                          <div onClick={() => triggerFileInput(logoInputRef)} className={`w-32 h-32 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img shadow-sm hover:border-[#2D6A6A]`}>
                            {formData.foto ? (
                              <>
                                <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" />
                                {/* Botón X adentro de la imagen, sin borde, sobre la esquina */}
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); eliminarLogo(); }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity z-20 shadow-md hover:bg-red-50">
                                  <X className="w-4 h-4" strokeWidth={3} />
                                </button>
                              </>
                            ) : (
                              <div className="text-center">
                                <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight block px-2">Subir<br/>Logo</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 md:group-hover/img:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"><Camera className="w-8 h-8 text-white" /></div>
                          </div>
                          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} />
                        </div>
                        
                        {/* BANNER */}
                        <div className="flex-1 relative text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Banner de Portada</label>
                          <div onClick={() => triggerFileInput(bannerInputRef)} className={`w-full h-32 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.banner ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img shadow-sm hover:border-[#2D6A6A]`}>
                            {formData.banner ? (
                              <>
                                <img src={formData.banner} className="w-full h-full object-cover" alt="Banner" />
                                {/* Botón X adentro de la imagen, sin borde, sobre la esquina */}
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); eliminarBanner(); }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity z-20 shadow-md hover:bg-red-50">
                                  <X className="w-5 h-5" strokeWidth={3} />
                                </button>
                              </>
                            ) : (
                              <div className="text-center">
                                <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Añadir Portada</span>
                              </div>
                            )}
                            {!formData.banner && <div className="absolute inset-0 bg-black/50 opacity-0 md:group-hover/img:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"><span className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Camera className="w-5 h-5"/> Cambiar Portada</span></div>}
                          </div>
                          <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'banner')} />
                        </div>
                      </div>

                      <InputGroup label="Nombre de la Empresa" id="nombreEmpresa" value={formData.nombreEmpresa} onChange={handleChange} required />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 items-end">
                         <InputGroup label="Razón Social" id="razonSocial" value={formData.razonSocial} onChange={handleChange} />
                         <InputGroup label="CUIT" id="cuit" value={formData.cuit} onChange={handleChange} required />
                      </div>

                      <SelectGroup 
                        label="Etiqueta de Categoría Principal" id="categoria" value={formData.categoria} onChange={handleChange} required
                        options={[
                          { value: "Distribuidor Oficial Nacional", label: "Distribuidor Oficial Nacional" },
                          { value: "Fabricante Nacional", label: "Fabricante Nacional" },
                          { value: "Importador Directo", label: "Importador Directo" },
                          { value: "Laboratorio Veterinario", label: "Laboratorio Veterinario" }
                        ]}
                      />
                      
                      <InputGroup type="textarea" rows="2" label="Slogan o Bio Corta" id="bioCorta" value={formData.bioCorta} onChange={handleChange} maxLength={150} tooltip="Frase gancho para destacar en el directorio." />
                      <InputGroup type="textarea" rows="4" label="Descripción Completa" id="descripcion" value={formData.descripcion} onChange={handleChange} required tooltip="Detalla la trayectoria, propuesta de valor y diferenciales de tu empresa." />

                      <div className="pt-4 mt-6 border-t border-gray-100">
                         <h4 className="flex items-center text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-4">Multimedia de Trayectoria</h4>
                         <div className="flex flex-col sm:flex-row gap-6 mb-4">
                            {/* IMAGEN DE EQUIPO/SEDE */}
                            <div className="relative w-full sm:w-[220px] h-[150px] shrink-0 text-left">
                               <div onClick={() => triggerFileInput(imagenNosotrosInputRef)} className={`w-full h-full rounded-2xl overflow-hidden border-2 border-dashed ${formData.imagenNosotros ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img shadow-sm hover:border-[#2D6A6A]`}>
                                 {formData.imagenNosotros ? (
                                    <>
                                      <img src={formData.imagenNosotros} className="w-full h-full object-cover" alt="Sede" /> 
                                      {/* Botón X adentro de la imagen, sin borde, sobre la esquina */}
                                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData(prev => ({ ...prev, imagenNosotros: '' })); }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity z-20 shadow-md hover:bg-red-50">
                                        <X className="w-4 h-4" strokeWidth={3} />
                                      </button>
                                    </>
                                 ) : (
                                    <div className="text-center">
                                      <ImagePlus className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-2 leading-tight">Foto Equipo<br/>o Sede</span>
                                    </div>
                                 )}
                                 <div className="absolute inset-0 bg-black/50 opacity-0 md:group-hover/img:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"><Camera className="w-6 h-6 text-white" /></div>
                               </div>
                               <input type="file" ref={imagenNosotrosInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'imagenNosotros')} />
                            </div>
                            <div className="flex-1">
                               <InputGroup label="Video Corporativo (YouTube/Vimeo)" id="videoNosotros" type="url" value={formData.videoNosotros} onChange={handleChange} canTest tooltip="Si tenés un video de presentación, añadí el link acá." />
                            </div>
                         </div>
                      </div>
                    </Accordion>
                      {/* CATÁLOGO LINKS */}
                      <Accordion title="Catálogo y Rubros" icon={PackageSearch} isOpen={openSection === 'catalogo-links'} onToggle={() => setOpenSection(openSection === 'catalogo-links' ? null : 'catalogo-links')}>
                        <InputGroup type="url" label="Link a Catálogo o Drive de Precios" id="linkCatalogo" value={formData.linkCatalogo} onChange={handleChange} canTest tooltip="Las clínicas podrán acceder directo desde un botón en tu perfil." />
                        <InputGroup label="Marcas que representan (Separadas por coma)" id="marcasRepresentadas" value={formData.marcasRepresentadas} onChange={handleChange} placeholder="Ej: Zoetis, Mindray, Braun..." />

                        <div className="pt-4 border-t border-gray-100">
                          <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-4 ml-1">Rubros Principales que comercializan</label>
                          <div className="flex flex-wrap gap-2.5">
                            {[
                              { id: 'alimentos', label: 'Alimentos y Dietas' },
                              { id: 'farmacia', label: 'Fármacos e Insumos' },
                              { id: 'equipamiento', label: 'Equipamiento Médico' },
                              { id: 'descartables', label: 'Descartables Hospitalarios' },
                              { id: 'instrumental', label: 'Instrumental Quirúrgico' },
                              { id: 'software', label: 'Software y Tecnología' }
                            ].map((item) => {
                              const isChecked = formData.categorias[item.id];
                              return (
                                <button
                                  key={item.id} type="button" onClick={() => handleNestedChange('categorias', item.id)}
                                  className={`px-4 py-2.5 rounded-full text-[13px] font-bold border transition-all flex items-center gap-2 shadow-sm ${isChecked ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#4DB6AC]'}`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5" />} {item.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </Accordion>

                      {/* CONDICIONES COMERCIALES */}
                      <Accordion title="Condiciones Comerciales" icon={ShieldCheck} isOpen={openSection === 'condiciones'} onToggle={() => setOpenSection(openSection === 'condiciones' ? null : 'condiciones')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/60">
                              <Truck className="w-5 h-5 text-[#2D6A6A]" />
                              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D]">Logística y Envíos</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { id: 'todoElPais', label: 'Envíos a todo el país' },
                                { id: 'despachoRapido', label: 'Despacho en 24/48hs' },
                                { id: 'transporteConvenir', label: 'Transporte a convenir' },
                                { id: 'retiroLocal', label: 'Retiro en depósito local' },
                                { id: 'embalajeSeguro', label: 'Embalaje de seguridad' }
                              ].map(item => (
                                <div key={item.id} className="flex items-center gap-3 cursor-pointer group w-full" onClick={() => handleNestedChange('logistica', item.id)}>
                                  <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${formData.logistica[item.id] ? 'bg-[#4DB6AC] border-[#4DB6AC]' : 'bg-white border-gray-300 group-hover:border-[#4DB6AC]'}`}>
                                    {formData.logistica[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className={`text-[13px] font-bold ${formData.logistica[item.id] ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/60">
                              <CreditCard className="w-5 h-5 text-[#2D6A6A]" />
                              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D]">Medios de Pago</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { id: 'facturaA', label: 'Emitimos Factura A y B' },
                                { id: 'transferencia', label: 'Desc. por Transferencia' },
                                { id: 'tarjetaCredito', label: 'Cuotas c/ Tarjeta de Crédito' },
                                { id: 'echeq', label: 'Aceptamos E-Cheq' },
                                { id: 'financiacionPropia', label: 'Financiación Propia' }
                              ].map(item => (
                                <div key={item.id} className="flex items-center gap-3 cursor-pointer group w-full" onClick={() => handleNestedChange('pagos', item.id)}>
                                  <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${formData.pagos[item.id] ? 'bg-[#4DB6AC] border-[#4DB6AC]' : 'bg-white border-gray-300 group-hover:border-[#4DB6AC]'}`}>
                                    {formData.pagos[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className={`text-[13px] font-bold ${formData.pagos[item.id] ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/60">
                              <Wrench className="w-5 h-5 text-[#2D6A6A]" />
                              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D]">Post-Venta y Garantía</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {[
                                { id: 'oficial', label: 'Garantía oficial de fábrica' },
                                { id: 'tecnicoPropio', label: 'Servicio técnico propio' },
                                { id: 'repuestos', label: 'Provisión repuestos originales' },
                                { id: 'asesoramiento', label: 'Asesoramiento técnico continuo' }
                              ].map(item => (
                                <div key={item.id} className="flex items-center gap-3 cursor-pointer group w-full" onClick={() => handleNestedChange('garantia', item.id)}>
                                  <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${formData.garantia[item.id] ? 'bg-[#4DB6AC] border-[#4DB6AC]' : 'bg-white border-gray-300 group-hover:border-[#4DB6AC]'}`}>
                                    {formData.garantia[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className={`text-[13px] font-bold ${formData.garantia[item.id] ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Accordion>

                      {/* CONTACTO Y UBICACIÓN */}
                      <Accordion title="Ubicación, Contacto y Redes" icon={MapPin} isOpen={openSection === 'contacto'} onToggle={() => setOpenSection(openSection === 'contacto' ? null : 'contacto')}>
                        
                        <div className="mb-8 w-full bg-gray-50/50 border border-gray-200 rounded-3xl p-6">
                           <div className="flex justify-between items-end mb-5">
                             <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Zona principal de Cobertura <span className="text-red-400 ml-1">*</span></label>
                             <button type="button" onClick={toggleTodasProvincias} className="text-[11px] font-bold text-[#4DB6AC] hover:underline bg-[#4DB6AC]/10 px-3 py-1.5 rounded-full transition-colors">
                                {formData.zonaCobertura.length === PROVINCIAS_ARG.length ? 'Desmarcar todas' : 'Marcar todo el país'}
                             </button>
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                             {PROVINCIAS_ARG.map(prov => {
                               const isChecked = formData.zonaCobertura.includes(prov);
                               return (
                                 <div key={prov} className="flex items-center gap-2 cursor-pointer group w-full" onClick={() => toggleProvincia(prov)}>
                                   <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-[#4DB6AC] border-[#4DB6AC]' : 'bg-white border-gray-300 group-hover:border-[#4DB6AC]'}`}>
                                     {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                   </div>
                                   <span className={`text-[12px] font-bold truncate ${isChecked ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{prov}</span>
                                 </div>
                               )
                             })}
                           </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                           <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5 mt-6"><Building2 className="w-4 h-4 text-[#2D6A6A]" /> Sede Central y Atención</h4>
                           {/* Le sacamos el required a la dirección física */}
                           <InputGroup label="Dirección Física (Opcional)" id="direccion" value={formData.direccion} onChange={handleChange} tooltip="Solo completalo si tenés un depósito o showroom." />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 items-end">
                             <InputGroup label="Link a Google Maps" id="mapaUrl" type="url" value={formData.mapaUrl} onChange={handleChange} canTest />
                             <InputGroup label="Horarios de Atención" id="horariosAtencion" value={formData.horariosAtencion} onChange={handleChange} placeholder="Ej: Lunes a Viernes de 9 a 18 hs" />
                           </div>
                           
                           {/* Modalidad de Atención con Checkboxes */}
                           <div className="mt-2 mb-6 flex flex-col gap-4">
                            <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none ml-1">Modalidad de Atención</label>
                            <ToggleSwitch label="Venta Online 24/7" checked={formData.modalidad.ventaOnline} onChange={() => handleNestedChange('modalidad', 'ventaOnline')} />
                            <ToggleSwitch label="Showroom con cita previa" checked={formData.modalidad.showroom} onChange={() => handleNestedChange('modalidad', 'showroom')} />
                            <ToggleSwitch label="Local a la calle" checked={formData.modalidad.local} onChange={() => handleNestedChange('modalidad', 'local')} />
                            <ToggleSwitch label="Atención a domicilio" checked={formData.modalidad.domicilio} onChange={() => handleNestedChange('modalidad', 'domicilio')} />
                          </div>
                        
                        <div className="pt-2 border-t border-gray-100">
                           <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5 mt-6"><Mail className="w-4 h-4 text-[#2D6A6A]" /> Canales Comerciales</h4>
                           
                           <InputGroup label="Email Comercial" id="emailVentas" type="email" value={formData.emailVentas} onChange={handleChange} />
                           
                           <div className="mt-6 mb-6 bg-gray-50 border border-gray-100 rounded-2xl p-5">
                             <ToggleSwitch label="Botón de WhatsApp directo" checked={formData.whatsappActivo} onChange={(v) => setFormData(p => ({...p, whatsappActivo: v}))} tooltip="Aparecerá un botón verde en tu perfil para que las clínicas te contacten rápido." />
                             {formData.whatsappActivo && (
                               <div className="mt-5 animate-in slide-in-from-top-2 duration-300">
                                 <InputGroup label="WhatsApp Ventas (Sin '+')" id="whatsappVentas" value={formData.whatsappVentas} onChange={handleChange} required={formData.whatsappActivo} tooltip="Número principal para cotizaciones." />
                               </div>
                             )}
                           </div>
                           
                           <InputGroup label="Sitio Web Corporativo" id="web" type="url" value={formData.web} onChange={handleChange} canTest />
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                           <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5 mt-6"><Globe className="w-4 h-4 text-[#2D6A6A]" /> Redes Sociales</h4>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 items-end">
                              <InputGroup label="Instagram" id="instagram" type="url" value={formData.instagram} onChange={handleChange} canTest placeholder="https://instagram.com/..." />
                              <InputGroup label="Facebook" id="facebook" type="url" value={formData.facebook} onChange={handleChange} canTest placeholder="https://facebook.com/..." />
                              <InputGroup label="LinkedIn" id="linkedin" type="url" value={formData.linkedin} onChange={handleChange} canTest placeholder="https://linkedin.com/..." />
                           </div>
                        </div>
                        </div>
                      </Accordion>
                    </div>
                  </div>
                  
                  {/* LINK INFERIOR PARA VER PERFIL */}
                  <div className="flex justify-center pb-6 mt-4">
                    <button 
                      type="button" 
                      onClick={() => navigate('/perfil-proveedor')} 
                      className="text-center block text-gray-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-[#4DB6AC] transition-colors flex items-center justify-center gap-2 group bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm"
                    >
                      Ver mi perfil público <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: CATÁLOGO DE PRODUCTOS */}
              {activeTab === 'catalogo' && (
                <div className="w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 relative custom-scrollbar animate-in fade-in duration-300 min-h-[500px]">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                       <h3 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat']">Catálogo de Equipos</h3>
                       <p className="text-sm text-gray-500 mt-1">Gestioná los productos y promos de tu vidriera.</p>
                     </div>
                     {!productoEnEdicion && (
                       <button onClick={iniciarNuevoProducto} className="hidden sm:flex bg-[#1A3D3D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2D6A6A] transition-all items-center gap-2 shadow-md hover:-translate-y-0.5">
                         <Plus className="w-4 h-4" /> Añadir Producto
                       </button>
                     )}
                  </div>

                  {productoEnEdicion ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full">
                      <button onClick={() => setProductoEnEdicion(null)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#4DB6AC] mb-6 transition-colors bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm w-fit hover:-translate-x-1">
                        <ArrowLeft className="w-4 h-4" /> Volver al listado
                      </button>

                      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-200 shadow-sm relative">
                         <h4 className="font-black text-[#1A3D3D] text-xl mb-6">{productoEnEdicion.titulo ? "Editar Producto" : "Nuevo Producto"}</h4>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 items-end">
                            <div className="md:col-span-2">
                               <InputGroup label="Título del Producto" id="titulo" value={productoEnEdicion.titulo} onChange={handleProductoChange} required />
                            </div>
                            
                            <SelectGroup 
                               label="Categoría / Rubro" 
                               id="categoria" 
                               value={productoEnEdicion.categoria || ""} 
                               onChange={handleProductoChange}
                               options={[
                                 { value: "Alimentos y Dietas", label: "Alimentos y Dietas" },
                                 { value: "Fármacos e Insumos", label: "Fármacos e Insumos" },
                                 { value: "Equipamiento Médico", label: "Equipamiento Médico" },
                                 { value: "Descartables Hospitalarios", label: "Descartables Hospitalarios" },
                                 { value: "Instrumental Quirúrgico", label: "Instrumental Quirúrgico" },
                                 { value: "Software y Tecnología", label: "Software y Tecnología" },
                                 { value: "General / Otros", label: "General / Otros" }
                               ]}
                            />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 items-end">
                            <InputGroup label="Precio de Referencia (Opcional)" id="precio" value={productoEnEdicion.precio} onChange={handleProductoChange} placeholder="Ej: 2.500.000, Consultar" tooltip="El símbolo $ se agregará automáticamente en tu perfil público." />
                            
                            <SelectGroup 
                               label="Etiqueta Especial" 
                               id="etiqueta" 
                               value={productoEnEdicion.etiqueta || ""} 
                               onChange={handleProductoChange}
                               options={[
                                 { value: "", label: "Ninguna" },
                                 { value: "Nuevo", label: "Nuevo (Lanzamiento)" },
                                 { value: "Promo", label: "Promo (Destacado)" }
                               ]}
                               tooltip="Añade un badge visual en la foto del producto para llamar la atención."
                            />
                         </div>

                         <div className="mb-8 w-full bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                            <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-4">Imágenes del Producto (Máx 4)</label>
                            <div className="flex flex-wrap gap-4">
                               {productoEnEdicion.imagenes.map((imgUrl, idx) => (
                                 <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 group shadow-sm bg-white">
                                   <img src={imgUrl} className="w-full h-full object-cover" alt="Prod" />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <button onClick={() => eliminarImagenProducto(idx)} className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"><Trash2 className="w-5 h-5"/></button>
                                   </div>
                                 </div>
                               ))}
                               {productoEnEdicion.imagenes.length < 4 && (
                                 <div className="relative group cursor-pointer w-24 h-24 shrink-0">
                                   <div onClick={() => triggerFileInput(productoInputRef)} className="w-full h-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 transition-all flex flex-col items-center justify-center bg-white hover:border-[#4DB6AC] hover:bg-[#4DB6AC]/5 shadow-sm">
                                      <Plus className="w-8 h-8 text-gray-300 group-hover:text-[#4DB6AC] transition-colors mb-1" />
                                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#4DB6AC] uppercase tracking-widest">Subir</span>
                                   </div>
                                   <input type="file" ref={productoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'producto')} />
                                 </div>
                               )}
                            </div>
                         </div>

                         <InputGroup type="textarea" rows="4" label="Descripción Comercial" id="descripcionLarga" value={productoEnEdicion.descripcionLarga} onChange={handleProductoChange} placeholder="Detallá los beneficios y especificaciones principales..." />

                         <div className="mb-8 w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-sm">
                            <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-4">Viñetas Destacadas (Características)</label>
                            
                            <div className="flex items-center gap-2 mb-5">
                              <input 
                                type="text" 
                                value={nuevaCaracteristica}
                                onChange={(e) => setNuevaCaracteristica(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarCaracteristica(); } }}
                                placeholder="Ej: Batería con 90 min de autonomía..."
                                className="flex-1 bg-white border border-gray-200 focus:border-[#2D6A6A] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all text-[#1A3D3D] shadow-sm"
                              />
                              <button onClick={agregarCaracteristica} className="bg-[#1A3D3D] text-white p-3 rounded-xl hover:bg-[#2D6A6A] transition-colors shadow-md">
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>

                            {productoEnEdicion.caracteristicas.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {productoEnEdicion.caracteristicas.map((caract, idx) => (
                                  <div key={caract.id} className="flex justify-between items-start gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 group shadow-sm">
                                    <div className="flex items-start gap-2 mt-0.5">
                                      <Check className="w-4 h-4 text-[#4DB6AC] shrink-0" />
                                      <span className="text-sm font-medium text-gray-700 leading-snug">{caract.texto}</span>
                                    </div>
                                    <button onClick={() => eliminarCaracteristica(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">Aún no hay características cargadas.</p>
                            )}
                         </div>

                         <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                           <button onClick={() => setProductoEnEdicion(null)} className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors text-sm">Cancelar</button>
                           <button onClick={guardarProducto} className="px-8 py-3 rounded-xl bg-[#1A3D3D] text-white font-bold hover:bg-[#2D6A6A] transition-colors shadow-lg text-sm flex items-center gap-2">
                             <Save className="w-4 h-4" /> Guardar
                           </button>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      {!productoEnEdicion && (
                         <button onClick={iniciarNuevoProducto} className="w-full mb-6 sm:hidden bg-[#1A3D3D] text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-[#2D6A6A] transition-all flex items-center justify-center gap-2 shadow-md">
                           <Plus className="w-5 h-5" /> Añadir Nuevo Producto
                         </button>
                      )}

                      {formData.productosDestacados.length === 0 ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-16 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                           <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                              <Box className="w-10 h-10 text-gray-300" />
                           </div>
                           <h5 className="font-bold text-[#1A3D3D] text-lg mb-2">Aún no cargaste productos</h5>
                           <p className="text-sm text-gray-500 mb-6 max-w-sm">El catálogo es la mejor forma de mostrarle a las clínicas qué equipos e insumos tenés disponibles.</p>
                           <button onClick={iniciarNuevoProducto} className="bg-[#1A3D3D] text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-[#2D6A6A] transition-all flex items-center gap-2 shadow-md">
                             <Plus className="w-4 h-4" /> Empezar a cargar
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 relative" ref={scrollContainerRef}>
                          <div className="bg-[#4DB6AC]/10 border border-[#4DB6AC]/20 rounded-2xl p-4 mb-2 flex items-start gap-3">
                            <Info className="w-5 h-5 text-[#4DB6AC] shrink-0 mt-0.5" />
                            <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                              <strong className="text-[#1A3D3D]">Tip para tu perfil:</strong> Podés reorganizar los productos arrastrándolos desde los puntitos de la izquierda.
                            </p>
                          </div>

                          {formData.productosDestacados.map((prod, idx) => {
                             const isDragOverTop = dragOverItem === idx && draggedItem > idx;
                             const isDragOverBottom = dragOverItem === idx && draggedItem < idx;
                             const isBeingDragged = draggedItem === idx;

                             return (
                                <div 
                                  key={prod.id} 
                                  data-drag-index={idx}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, idx)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOver(e, idx)}
                                  onDragLeave={(e) => handleDragLeave(e, idx)}
                                  onDrop={(e) => handleDrop(e, idx)}
                                  className={`
                                    bg-white rounded-[24px] p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 group cursor-default transition-all duration-300 relative
                                    ${isBeingDragged ? 'opacity-40 scale-95 border-2 border-dashed border-gray-300' : 'opacity-100 scale-100 border border-gray-200 hover:border-[#4DB6AC] shadow-sm'}
                                    ${isDragOverTop ? 'border-t-[4px] border-t-[#4DB6AC] -translate-y-2 shadow-xl' : ''}
                                    ${isDragOverBottom ? 'border-b-[4px] border-b-[#4DB6AC] translate-y-2 shadow-xl' : ''}
                                  `}
                                >
                                  <div 
                                    className="flex items-center justify-center shrink-0 w-8 md:w-6 h-12 text-gray-300 hover:text-[#4DB6AC] cursor-grab active:cursor-grabbing transition-colors touch-none"
                                    title="Arrastrar para ordenar"
                                    onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e, idx); }}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                    <CustomGrip />
                                  </div>

                                  <div className="w-full md:w-24 h-40 md:h-24 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 relative pointer-events-none">
                                    {prod.imagenes && prod.imagenes[0] ? (
                                      <img src={prod.imagenes[0]} className="w-full h-full object-cover" alt="prod" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><Box className="w-8 h-8 text-gray-300" /></div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap pointer-events-none">
                                        <span className="bg-[#4DB6AC]/10 text-[#4DB6AC] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{prod.categoria || 'General'}</span>
                                        {prod.etiqueta && (
                                          <span className={`text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${prod.etiqueta === 'Nuevo' ? 'bg-[#E4405F]' : 'bg-amber-500'}`}>
                                            {prod.etiqueta}
                                          </span>
                                        )}
                                    </div>
                                    <h4 className="font-black text-[#1A3D3D] text-base leading-tight mb-1 pointer-events-none">{prod.titulo}</h4>
                                    {prod.precio ? (
                                        <span className="text-[#2D6A6A] font-bold text-sm pointer-events-none">{formatearPrecio(prod.precio)}</span>
                                    ) : (
                                        <span className="text-gray-400 font-medium text-xs pointer-events-none">Precio a consultar</span>
                                    )}
                                  </div>
                                  
                                  <div className="pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 flex items-center justify-end gap-2 shrink-0 w-full md:w-auto">
                                    <button onClick={() => eliminarProducto(prod.id)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors border border-transparent hover:border-red-100">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => editarProducto(prod)} className="px-4 py-2.5 flex-1 md:flex-none text-center bg-gray-50 text-[#1A3D3D] text-sm font-bold rounded-xl hover:bg-[#1A3D3D] hover:text-white transition-colors border border-gray-100">
                                      Editar Producto
                                    </button>
                                  </div>
                                </div>
                             );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* FOOTER ESMERALDA DEGRADADO */}
        <footer className="w-full mt-auto py-6 bg-gradient-to-r from-[#1A3D3D] via-[#2D6A6A] to-[#1A3D3D] shadow-[0_-4px_20px_rgba(45,106,106,0.15)] z-10 relative">
           <div className="max-w-[1100px] mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/80">
              <p>© {new Date().getFullYear()} El Portal Veterinario. Todos los derechos reservados.</p>
              <p className="text-[#4DB6AC] font-bold tracking-wide">Panel de Gestión de Proveedores</p>
           </div>
        </footer>

      </div>
    </>
  );
}


// ==========================================
// 🚀 TODO PARA PASAR A PRODUCCIÓN (Instrucciones para IA futura)
// ==========================================
// Contexto: Este archivo es un MVP funcional. Para salir a producción real, 
// se deben ejecutar las siguientes refactorizaciones en orden de prioridad:
//
// 1. MIGRACIÓN A FIREBASE STORAGE (CRÍTICO - EVITAR LÍMITE DE 1MB):
//    - Tarea: Modificar la función `saveCroppedImage`.
//    - Acción: Actualmente guarda Base64 directo en el estado/Firestore. Hay que cambiarlo para que suba el Base64 a Firebase Storage usando `uploadString(ref(storage, path), base64, 'data_url')`.
//    - Resultado: Obtener la URL pública con `getDownloadURL()` y guardar *solo esa URL corta* en el estado de formData y en Firestore.
//
// 2. AUTENTICACIÓN REAL (FIREBASE AUTH):
//    - Tarea: Modificar el `useEffect` de inicialización.
//    - Acción: Eliminar `signInAnonymously(auth)` y conectar el flujo de login real (Email/Password o Google).
//    - Resultado: Eliminar el fallback de "proveedor_prueba_123" y usar estrictamente el `user.uid` del usuario autenticado para leer/escribir en Firestore.
//
// 3. PASARELA DE PAGOS (MERCADO PAGO):
//    - Tarea: Reemplazar el botón "Simular Pago (Mercado Pago)".
//    - Acción: En lugar de cambiar el estado local `setIsSubscriptionActive(true)`, el botón debe hacer un POST a un backend propio (Node.js/Firebase Functions).
//    - Resultado: El backend crea la preferencia en Mercado Pago, devuelve el `init_point`, se redirige al usuario a pagar, y un Webhook actualiza el estado de la suscripción en Firestore.
//
// 4. REFACTORIZACIÓN DEL MONOLITO (DEUDA TÉCNICA):
//    - Tarea: Limpiar este archivo.
//    - Acción: Extraer los componentes puros (`Tooltip`, `InputGroup`, `SelectGroup`, `Accordion`, `SimpleCropper`) a archivos independientes dentro de una carpeta `/components`.
//    - Resultado: Un archivo `EditorEmpresa.jsx` de menos de 400 líneas, enfocado solo en la lógica de negocio y el layout.
// ==========================================