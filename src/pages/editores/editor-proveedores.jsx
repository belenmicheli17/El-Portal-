import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, 
  MapPin, ShieldCheck, Check, Video,
  Smartphone, Home, Mail, Award, ChevronDown, ChevronRight,
  ExternalLink, Heart, Undo2, Redo2, FileCheck, 
  Building2, AlertTriangle, Building, PackageSearch, ImagePlus,
  Globe, Truck, FileText, CreditCard, Wrench, Crop, Briefcase, User, Lock, Eye, EyeOff, Box, ArrowLeft, Tag, DollarSign, List, Clock, Loader2
} from 'lucide-react';

// ==========================================
// FIREBASE IMPORTS (Conectado a tu archivo central)
// ==========================================
import { signInAnonymously, onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyA9DsYU4-LEelrXFIiPpk9_nYErpZSqYTM",
  authDomain: "el-portal-veterinario-3ab72.firebaseapp.com",
  projectId: "el-portal-veterinario-3ab72",
  storageBucket: "el-portal-veterinario-3ab72.firebasestorage.app",
  messagingSenderId: "939343810474",
  appId: "1:939343810474:web:8e31c0f498330e85cfe5d3",
  measurementId: "G-6VQ6GT3ZQ9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D6A6A] transition-colors p-1 z-10"
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
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all shadow-sm z-10 ${value ? 'bg-white border-gray-200 text-gray-500 hover:text-[#2D6A6A] hover:border-[#2D6A6A] cursor-pointer' : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'}`}
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

// EL ACCORDION AHORA USA RENDERIZADO CONDICIONAL PURO PARA EVITAR SUPERPOSICIONES
const Accordion = ({ title, icon: Icon, children, isOpen, onToggle, tooltip }) => {
  return (
    <div className={`border-b border-gray-100 last:border-0 group relative ${isOpen ? 'z-20' : 'z-[1]'}`}>
      <button 
        type="button" 
        onClick={onToggle} 
        className={`w-full flex justify-between items-center transition-all duration-300 py-6 px-6 md:px-5 md:rounded-[24px] ${isOpen ? 'md:bg-gray-50/80 shadow-sm' : 'md:hover:bg-gray-50'}`}
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

      {isOpen && (
        <div className="py-6 px-6 md:px-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
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
  
  const isBanner = type === 'banner';
  const isNosotros = type === 'imagenNosotros';
  // Tamaños base de recorte en la UI
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
    // Generar imagen final en alta resolucion según el tipo
    canvas.width = isBanner ? 1200 : (isNosotros ? 800 : 800); 
    canvas.height = isBanner ? 400 : (isNosotros ? 600 : 800);
    const ctx = canvas.getContext('2d');

    const img = imgRef.current;
    
    // Escala base
    const baseScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const finalScale = baseScale * zoom;

    const drawWidth = img.naturalWidth * finalScale;
    const drawHeight = img.naturalHeight * finalScale;

    // Calcular proporción de movimiento
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
        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
          <span>Alejar</span><span>Acercar</span>
        </label>
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
// COMPONENTE: DRAG GRIP MODERNO (Tipo Notion)
// ==========================================
const CustomGrip = () => (
  <div className="flex w-[14px] flex-wrap gap-[3px] opacity-30 group-hover:opacity-100 transition-opacity items-center justify-center pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="w-[3.5px] h-[3.5px] rounded-full bg-gray-500"></div>
    ))}
  </div>
);


// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
export default function EditorEmpresa() { 
  const [user, setUser] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [openSection, setOpenSection] = useState(null);
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, type: null });

  // ESTADOS PARA EL CATÁLOGO MODAL (Con UX fluida)
  const [isCatalogoMounted, setIsCatalogoMounted] = useState(false);
  const [isCatalogoVisible, setIsCatalogoVisible] = useState(false);
  
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
    // Datos de Cuenta
    cuentaEmail: 'usuario@vetsur.com.ar',
    cuentaPassword: 'vetsur2026',
    cuentaTelefono: '5491145678901',
    // Datos Vidriera
    foto: '',
    banner: '',
    nombreEmpresa: 'VetSur Insumos Médicos',
    razonSocial: 'VetSur S.R.L.',
    cuit: '30-12345678-9',
    categoria: 'Distribuidor Oficial Nacional', 
    bioCorta: 'Más de 15 años equipando quirófanos y consultorios veterinarios en toda la Argentina con tecnología de punta.',
    descripcion: 'Entendemos que el equipamiento de tu clínica es el corazón de tus diagnósticos y cirugías. Por eso, en VetSur no solo somos distribuidores, somos socios estratégicos del profesional veterinario.',
    
    // Multimedia Trayectoria (NUEVO)
    imagenNosotros: '',
    videoNosotros: '',

    // Ubicacion y Horarios (NUEVO)
    direccion: 'Parque Industrial Morón, Nave 4, Buenos Aires',
    mapaUrl: 'https://maps.google.com',
    horariosAtencion: 'Lunes a Viernes de 09:00 a 17:00 hs',
    modalidadAtencion: 'Atención presencial exclusiva con cita previa.',
    zonaCobertura: ['CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe'], 
    
    // Contacto y Redes (NUEVO)
    whatsappVentas: '5491145678901',
    emailVentas: 'ventas@vetsur.com.ar',
    web: 'https://vetsur.com.ar',
    instagram: '',
    facebook: '',
    linkedin: '',

    // Catálogo y Condiciones
    linkCatalogo: 'https://drive.google.com/catalogo-vetsur', 
    marcasRepresentadas: 'Mindray, Zoetis, Braun, 3M',
    categorias: { alimentos: false, farmacia: true, equipamiento: true, descartables: true, instrumental: true, software: false },
    logistica: { todoElPais: true, despachoRapido: true, transporteConvenir: false, retiroLocal: true, embalajeSeguro: true },
    pagos: { transferencia: true, tarjetaCredito: true, echeq: true, facturaA: true, financiacionPropia: false },
    garantia: { oficial: true, tecnicoPropio: true, repuestos: true, asesoramiento: true },
    
    // Array de productos destacados
    productosDestacados: []
  };

  const [_formData, _setFormData] = useState(initialData);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoRedAction = useRef(false);

  const formData = _formData;

  // 1. INICIALIZAR USUARIO ANONIMO Y CONECTAR
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de autenticación:", error);
        setIsDataLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 2. CARGAR DATOS DE FIRESTORE
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
            categoria: "Distribuidor Oficial Nacional",
            zonaCobertura: ['CABA', 'Buenos Aires']
          });
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    setTimeout(loadDataFromCloud, 1000);
  }, [user]);

  // 3. GUARDAR DATOS EN FIRESTORE
  const handleGuardarEnLaNube = async () => {
    setIsSaving(true);
    try {
      const userId = user ? user.uid : "proveedor_prueba_123";
      const docRef = doc(db, 'proveedores', userId);
      await setDoc(docRef, formData);

      setModalConfig({ 
        isOpen: true, 
        title: '¡Guardado Exitoso!', 
        message: 'Tus datos se subieron a tu Base de Datos oficial en Firebase. Revisá tu consola.', 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error guardando:", error);
      setModalConfig({ 
        isOpen: true, 
        title: 'Error de Conexión', 
        message: `Firebase dice: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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

  // Cálculo de Progreso
  const progress = Math.round(
    [
      formData.nombreEmpresa, formData.categoria, formData.bioCorta, 
      formData.descripcion, formData.whatsappVentas, formData.emailVentas,
      formData.direccion,
      Object.values(formData.categorias).some(v => v),
      Object.values(formData.logistica).some(v => v),
      formData.productosDestacados.length > 0 
    ].filter(Boolean).length / 10 * 100
  );

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
      [categoryGroup]: {
        ...prev[categoryGroup],
        [item]: !prev[categoryGroup][item]
      }
    }));
  };

  const toggleProvincia = (provincia) => {
    setFormData(prev => {
      const current = prev.zonaCobertura || [];
      if (current.includes(provincia)) {
        return { ...prev, zonaCobertura: current.filter(p => p !== provincia) };
      } else {
        return { ...prev, zonaCobertura: [...current, provincia] };
      }
    });
  };

  const toggleTodasProvincias = () => {
    setFormData(prev => {
      if (prev.zonaCobertura?.length === PROVINCIAS_ARG.length) {
        return { ...prev, zonaCobertura: [] };
      } else {
        return { ...prev, zonaCobertura: [...PROVINCIAS_ARG] };
      }
    });
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setCropModal({ isOpen: true, imageSrc: event.target.result, type });
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const saveCroppedImage = (croppedBase64) => {
    if (cropModal.type === 'logo') {
      setFormData(prev => ({ ...prev, foto: croppedBase64 }));
    } else if (cropModal.type === 'banner') {
      setFormData(prev => ({ ...prev, banner: croppedBase64 }));
    } else if (cropModal.type === 'imagenNosotros') {
      setFormData(prev => ({ ...prev, imagenNosotros: croppedBase64 }));
    } else if (cropModal.type === 'producto' && productoEnEdicion) {
      setProductoEnEdicion(prev => ({ ...prev, imagenes: [...prev.imagenes, croppedBase64].slice(0, 4) }));
    }
    setCropModal({ isOpen: false, imageSrc: null, type: null });
  };

  const triggerFileInput = (ref) => {
    if (ref && ref.current) ref.current.click();
  };

  // ==========================================
  // LÓGICA DE APERTURA Y CIERRE (DRAWER)
  // ==========================================
  const openDrawer = () => {
    setIsCatalogoMounted(true);
    setTimeout(() => setIsCatalogoVisible(true), 10);
  };

  const closeDrawer = () => {
    setIsCatalogoVisible(false);
    setTimeout(() => {
      setIsCatalogoMounted(false);
      setProductoEnEdicion(null);
    }, 400); // 400ms para asegurar que termine la transición
  };

  // ==========================================
  // LÓGICA DE PRODUCTOS DESTACADOS
  // ==========================================
  const iniciarNuevoProducto = () => {
    setProductoEnEdicion({
      id: Date.now(),
      titulo: '',
      categoria: '',
      etiqueta: '', // NUEVO
      precio: '',
      imagenes: [],
      descripcionLarga: '',
      caracteristicas: []
    });
  };

  const editarProducto = (prod) => {
    setProductoEnEdicion({ ...prod }); 
  };

  const eliminarProducto = (id) => {
    setFormData(prev => ({ ...prev, productosDestacados: prev.productosDestacados.filter(p => p.id !== id) }));
  };

  const guardarProducto = () => {
    if (!productoEnEdicion.titulo) return; 
    
    setFormData(prev => {
      const existe = prev.productosDestacados.find(p => p.id === productoEnEdicion.id);
      if (existe) {
        return { ...prev, productosDestacados: prev.productosDestacados.map(p => p.id === productoEnEdicion.id ? productoEnEdicion : p) };
      } else {
        return { ...prev, productosDestacados: [...prev.productosDestacados, productoEnEdicion] };
      }
    });
    setProductoEnEdicion(null); 
  };

  const handleProductoChange = (e) => {
    const { id, value } = e.target;
    setProductoEnEdicion(prev => ({ ...prev, [id]: value }));
  };

  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim() === '') return;
    setProductoEnEdicion(prev => ({
      ...prev,
      caracteristicas: [...prev.caracteristicas, nuevaCaracteristica.trim()]
    }));
    setNuevaCaracteristica('');
  };

  const eliminarCaracteristica = (idx) => {
    setProductoEnEdicion(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.filter((_, index) => index !== idx)
    }));
  };

  const eliminarImagenProducto = (idx) => {
    setProductoEnEdicion(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, index) => index !== idx)
    }));
  };

  // ==========================================
  // LÓGICA AUTO-SCROLL DURANTE DRAG & DROP
  // ==========================================
  const startScrolling = (amount) => {
    if (scrollInterval.current) return;
    scrollInterval.current = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += amount;
      }
    }, 16);
  };

  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const checkAutoScroll = (clientY) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const edge = 80; 
    
    if (clientY >= rect.top && clientY <= rect.top + edge) {
      startScrolling(-10); 
    } else if (clientY <= rect.bottom && clientY >= rect.bottom - edge) {
      startScrolling(10); 
    } else {
      stopScrolling();
    }
  };

  // ==========================================
  // LÓGICA DRAG & DROP PARA PRODUCTOS
  // ==========================================
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, index) => {
    if (e.cancelable !== false) e.preventDefault(); 
    checkAutoScroll(e.clientY);
    if (draggedItem === index) return;
    setDragOverItem(index);
  };

  const handleDragLeave = (e, index) => {
    if (e.cancelable !== false) e.preventDefault();
    if (dragOverItem === index) {
      setDragOverItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    stopScrolling();
  };

  const handleDrop = (e, dropIndex) => {
    if (e && e.cancelable !== false && e.preventDefault) e.preventDefault();
    setDragOverItem(null);
    stopScrolling();
    
    if (draggedItem === null || draggedItem === dropIndex) return;

    setFormData(prev => {
      const nuevosProductos = [...prev.productosDestacados];
      const itemToMove = nuevosProductos[draggedItem];
      nuevosProductos.splice(draggedItem, 1);
      nuevosProductos.splice(dropIndex, 0, itemToMove);
      return { ...prev, productosDestacados: nuevosProductos };
    });
    setDraggedItem(null);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    checkAutoScroll(touch.clientY);
    
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = target?.closest('[data-drag-index]');
    if (card) {
      const dropIndex = parseInt(card.getAttribute('data-drag-index'), 10);
      if (!isNaN(dropIndex) && dropIndex !== draggedItem && dropIndex !== dragOverItem) {
        setDragOverItem(dropIndex);
      }
    }
  };

  const handleTouchEnd = (e) => {
    stopScrolling();
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      handleDrop(e, dragOverItem);
    } else {
      handleDragEnd();
    }
  };

  useEffect(() => {
    return () => stopScrolling();
  }, []);

  const formatearPrecio = (precioText) => {
    if (!precioText) return '';
    const numLimpiado = precioText.replace(/^\$\s*/, '');
    return `$ ${numLimpiado}`;
  };

  useEffect(() => {
    if (isCatalogoMounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => document.body.style.overflow = 'auto';
  }, [isCatalogoMounted]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F7] font-['Montserrat']">
        <Loader2 className="w-12 h-12 text-[#2D6A6A] animate-spin mb-4" />
        <h2 className="text-xl font-black text-[#1A3D3D]">Conectando con la base de datos...</h2>
        <p className="text-gray-500 font-medium">Buscando perfil de Firebase</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased text-left text-[#1A3D3D] selection:bg-[#2D6A6A] selection:text-white relative w-full overflow-x-hidden">
      
      {/* PANEL LATERAL (DRAWER) DEL CATÁLOGO DE PRODUCTOS */}
      {isCatalogoMounted && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className={`absolute inset-0 bg-[#1A3D3D]/80 backdrop-blur-sm transition-opacity duration-400 ease-in-out ${isCatalogoVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          ></div>

          <div className={`relative w-full md:w-[60%] lg:w-[50%] h-full bg-[#F4F7F7] shadow-[-20px_0_60px_rgba(26,61,61,0.3)] z-[101] flex flex-col transition-transform duration-400 ease-out ${isCatalogoVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            
            <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0 z-10 shadow-sm relative">
               <div>
                 <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight">Catálogo de Productos</h2>
                 <p className="text-sm text-gray-500 mt-1">Gestioná los equipos destacados de tu vidriera.</p>
               </div>
               <div className="flex items-center gap-4">
                 {!productoEnEdicion && (
                   <button onClick={iniciarNuevoProducto} className="hidden sm:flex bg-[#1A3D3D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2D6A6A] transition-all items-center gap-2 shadow-md hover:-translate-y-0.5">
                     <Plus className="w-4 h-4" /> Añadir
                   </button>
                 )}
                 <button onClick={closeDrawer} className="p-2.5 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors border border-gray-200">
                   <X className="w-6 h-6" />
                 </button>
               </div>
            </div>

            <div ref={scrollContainerRef} className="p-6 md:p-8 overflow-y-auto flex-1 relative custom-scrollbar">
              {productoEnEdicion ? (
                /* EDITOR DE UN PRODUCTO */
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 mx-auto w-full max-w-3xl">
                  <button onClick={() => setProductoEnEdicion(null)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#2D6A6A] mb-6 transition-colors bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm w-fit hover:-translate-x-1">
                    <ArrowLeft className="w-4 h-4" /> Volver al listado
                  </button>

                  <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-200 shadow-sm relative">
                     <h4 className="font-black text-[#1A3D3D] text-xl mb-6">{productoEnEdicion.titulo ? "Editar Producto" : "Nuevo Producto"}</h4>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                        <div className="md:col-span-2">
                           <InputGroup label="Título del Producto" id="titulo" value={productoEnEdicion.titulo} onChange={handleProductoChange} required />
                        </div>
                        <InputGroup label="Categoría / Rubro" id="categoria" value={productoEnEdicion.categoria} onChange={handleProductoChange} placeholder="Ej: Quirófano..." />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <InputGroup label="Precio de Referencia (Opcional)" id="precio" value={productoEnEdicion.precio} onChange={handleProductoChange} placeholder="Ej: 2.500.000, Consultar" tooltip="El símbolo $ se agregará automáticamente en tu perfil público." />
                        
                        {/* NUEVO CAMPO DE ETIQUETAS */}
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

                     {/* IMÁGENES DEL PRODUCTO */}
                     <div className="mb-8 w-full bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-4">
                          Imágenes del Producto (Máx 4)
                        </label>
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
                               <div onClick={() => triggerFileInput(productoInputRef)} className="w-full h-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 transition-all flex flex-col items-center justify-center bg-white hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5 shadow-sm">
                                  <Plus className="w-8 h-8 text-gray-300 group-hover:text-[#2D6A6A] transition-colors mb-1" />
                                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#2D6A6A] uppercase tracking-widest">Subir</span>
                               </div>
                               <input type="file" ref={productoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'producto')} />
                             </div>
                           )}
                        </div>
                     </div>

                     <InputGroup type="textarea" rows="4" label="Descripción Comercial" id="descripcionLarga" value={productoEnEdicion.descripcionLarga} onChange={handleProductoChange} placeholder="Detallá los beneficios y especificaciones principales..." />

                     {/* CARACTERÍSTICAS DINÁMICAS */}
                     <div className="mb-8 w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-sm">
                        <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-4">
                          Viñetas Destacadas (Características)
                        </label>
                        
                        <div className="flex items-center gap-2 mb-5">
                          <input 
                            type="text" 
                            value={nuevaCaracteristica}
                            onChange={(e) => setNuevaCaracteristica(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); agregarCaracteristica(); } }}
                            placeholder="Ej: Batería con 90 min de autonomía..."
                            className="flex-1 bg-white border border-gray-200 focus:border-[#2D6A6A] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all text-[#1A3D3D] shadow-sm"
                          />
                          <button onClick={agregarCaracteristica} className="bg-[#2D6A6A] text-white p-3 rounded-xl hover:bg-[#1A3D3D] transition-colors shadow-md">
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {productoEnEdicion.caracteristicas.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {productoEnEdicion.caracteristicas.map((caract, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 group shadow-sm">
                                <div className="flex items-start gap-2 mt-0.5">
                                  <Check className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                  <span className="text-sm font-medium text-gray-700 leading-snug">{caract}</span>
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
                       <button onClick={guardarProducto} className="px-8 py-3 rounded-xl bg-[#2D6A6A] text-white font-bold hover:bg-[#1A3D3D] transition-colors shadow-lg text-sm flex items-center gap-2">
                         <Save className="w-4 h-4" /> Guardar
                       </button>
                     </div>
                  </div>
                </div>
              ) : (
                /* LISTA DE PRODUCTOS */
                <div className="mx-auto w-full max-w-3xl">
                  {!productoEnEdicion && (
                     <button onClick={iniciarNuevoProducto} className="w-full mb-6 sm:hidden bg-[#1A3D3D] text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-[#2D6A6A] transition-all flex items-center justify-center gap-2 shadow-md">
                       <Plus className="w-5 h-5" /> Añadir Nuevo Producto
                     </button>
                  )}

                  {formData.productosDestacados.length === 0 ? (
                    <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-16 bg-white rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                       <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Box className="w-10 h-10 text-gray-300" />
                       </div>
                       <h5 className="font-bold text-[#1A3D3D] text-lg mb-2">Aún no cargaste productos</h5>
                       <p className="text-sm text-gray-500 mb-6 max-w-sm">El catálogo es la mejor forma de mostrarle a las clínicas qué equipos e insumos tenés disponibles.</p>
                       <button onClick={iniciarNuevoProducto} className="bg-[#2D6A6A] text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-[#1A3D3D] transition-all flex items-center gap-2 shadow-md">
                         <Plus className="w-4 h-4" /> Empezar a cargar
                       </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 relative">
                      
                      {/* SUBTÍTULO ACLARATORIO UX */}
                      <div className="bg-[#2D6A6A]/5 border border-[#2D6A6A]/10 rounded-2xl p-4 mb-2 flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#2D6A6A] shrink-0 mt-0.5" />
                        <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                          <strong className="text-[#1A3D3D]">Tip para tu perfil:</strong> Podés reorganizar los productos arrastrándolos desde los puntitos de la izquierda. El orden que elijas será exactamente el que vean las clínicas en tu vidriera.
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
                                ${isBeingDragged ? 'opacity-40 scale-95 border-2 border-dashed border-gray-300' : 'opacity-100 scale-100 border border-gray-200 hover:border-[#2D6A6A] shadow-sm'}
                                ${isDragOverTop ? 'border-t-[4px] border-t-[#2D6A6A] -translate-y-2 shadow-xl' : ''}
                                ${isDragOverBottom ? 'border-b-[4px] border-b-[#2D6A6A] translate-y-2 shadow-xl' : ''}
                              `}
                            >
                              <div 
                                className="flex items-center justify-center shrink-0 w-8 md:w-6 h-12 text-gray-300 hover:text-[#2D6A6A] cursor-grab active:cursor-grabbing transition-colors touch-none"
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
                                {prod.imagenes.length > 1 && (
                                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                    1/{prod.imagenes.length}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap pointer-events-none">
                                    <span className="bg-[#2D6A6A]/10 text-[#2D6A6A] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{prod.categoria || 'General'}</span>
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
          </div>
        </div>
      )}

      {/* MODAL DE RECORTE DE IMAGEN */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/95 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de Imagen ({cropModal.type === 'logo' ? 'Logo' : cropModal.type === 'producto' ? 'Producto' : cropModal.type === 'imagenNosotros' ? 'Empresa' : 'Portada'})</h3>
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

      {/* MODAL EXITOSO */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/95 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold font-['Montserrat'] text-2xl text-[#1A3D3D] mb-3">{modalConfig.title}</h3>
            <p className="text-base text-gray-500 mb-8">{modalConfig.message}</p>
            <button onClick={() => setModalConfig({ isOpen: false })} className="px-8 py-3.5 rounded-xl font-bold bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] transition-colors shadow-lg text-base w-full">Entendido</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-[80] h-[70px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-8 md:px-10 shadow-sm">
        <div className="max-w-[1200px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A3D3D] rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5 text-white" /></div>
            <div className="font-['Montserrat'] font-extrabold text-xl tracking-tight">Editor Proveedores<span className="text-[#2D6A6A]">.</span></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 mr-2">
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
          
          <div className="mb-6 px-2">
            <h1 className="text-4xl font-black font-['Montserrat'] uppercase tracking-tight mb-3 text-[#1A3D3D]">Configurar Vidriera B2B</h1>
            <p className="text-base text-gray-500">Actualizá los datos de tu empresa para que las clínicas te encuentren fácilmente.</p>
          </div>

          {/* DISCLAIMER DE CATÁLOGO (VERSIÓN MÓVIL: MÁS COMPACTO) */}
          <div className="lg:hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6 shadow-sm mx-2">
            <div className="bg-amber-100 p-2 rounded-xl shrink-0">
              <Info className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-amber-800 font-bold text-[10px] uppercase tracking-widest mb-0.5">Aviso</h4>
              <p className="text-amber-700/90 text-xs font-medium leading-snug">
                Esta plataforma es una <strong>vidriera publicitaria</strong>. No procesamos pagos, solo conectamos clínicas con tu equipo de ventas.
              </p>
            </div>
          </div>

          {/* SECCIÓN DE CUENTA INDEPENDIENTE */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 border-t-[8px] border-t-[#2D6A6A] mb-8 relative">
            <Accordion 
              title="Sobre mi perfil (Accesos)" 
              icon={User} 
              isOpen={openSection === 'cuenta'} 
              onToggle={() => setOpenSection(openSection === 'cuenta' ? null : 'cuenta')}
              tooltip="Datos privados para el inicio de sesión y recuperación de cuenta."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                 <InputGroup label="Email de Acceso" id="cuentaEmail" type="email" value={formData.cuentaEmail} readOnly tooltip="Este email está vinculado a tu cuenta y no puede modificarse desde aquí." />
                 <InputGroup label="Contraseña" id="cuentaPassword" type="password" value={formData.cuentaPassword} onChange={handleChange} placeholder="••••••••" tooltip="Modificá este campo solo si querés cambiar tu contraseña." />
                 <div className="md:col-span-2">
                   <InputGroup label="Teléfono de Recuperación" id="cuentaTelefono" type="tel" value={formData.cuentaTelefono} readOnly tooltip="Número validado para la recuperación de la cuenta." />
                 </div>
              </div>
            </Accordion>
          </div>

          {/* FORMULARIO PRINCIPAL */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 border-t-[8px] border-t-[#2D6A6A] mb-8 relative">
            
            {/* 1. IDENTIDAD VISUAL */}
            <Accordion 
              title="Identidad Visual e Info" 
              icon={Building} 
              isOpen={openSection === 'identidad'} 
              onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}
            >
              <div className="flex flex-col sm:flex-row gap-6 mb-8 mt-2 md:mt-0">
                {/* LOGO */}
                <div className="relative group cursor-pointer shrink-0 text-left">
                  <div onClick={() => triggerFileInput(logoInputRef)} className={`w-32 h-32 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img`}>
                    {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Logo" /> : <ImagePlus className="w-8 h-8 text-gray-300" />}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} />
                </div>
                
                {/* BANNER */}
                <div className="flex-1 relative group cursor-pointer text-left">
                  <div onClick={() => triggerFileInput(bannerInputRef)} className={`w-full h-32 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.banner ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img`}>
                    {formData.banner ? <img src={formData.banner} className="w-full h-full object-cover" alt="Banner" /> : <div className="text-center"><ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Banner Portada</span></div>}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Camera className="w-5 h-5"/> Cambiar Portada</span>
                    </div>
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'banner')} />
                </div>
              </div>

              <InputGroup label="Nombre de la Empresa" id="nombreEmpresa" value={formData.nombreEmpresa} onChange={handleChange} required />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
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

              {/* NUEVO BLOQUE: MULTIMEDIA DE LA EMPRESA */}
              <div className="pt-4 mt-6 border-t border-gray-100">
                 <h4 className="flex items-center text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-4">
                   Multimedia de Trayectoria
                 </h4>
                 <div className="flex flex-col sm:flex-row gap-6 mb-4">
                    <div className="relative group cursor-pointer w-full sm:w-[220px] h-[150px] shrink-0 text-left">
                       <div onClick={() => triggerFileInput(imagenNosotrosInputRef)} className={`w-full h-full rounded-2xl overflow-hidden border-2 border-dashed ${formData.imagenNosotros ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer relative group/img shadow-sm hover:border-[#2D6A6A]`}>
                         {formData.imagenNosotros ? <img src={formData.imagenNosotros} className="w-full h-full object-cover" alt="Nosotros" /> : <div className="text-center"><ImagePlus className="w-6 h-6 text-gray-300 mx-auto mb-2" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foto Equipo/Sede</span></div>}
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                           <Camera className="w-6 h-6 text-white" />
                         </div>
                       </div>
                       <input type="file" ref={imagenNosotrosInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'imagenNosotros')} />
                    </div>
                    <div className="flex-1">
                       <InputGroup label="Video Corporativo (YouTube/Vimeo)" id="videoNosotros" type="url" value={formData.videoNosotros} onChange={handleChange} canTest tooltip="Si tenés un video de presentación, añadí el link acá. Las clínicas verán un ícono de 'Play' sobre tu imagen." />
                    </div>
                 </div>
              </div>
            </Accordion>

            {/* 2. CATÁLOGO GENERAL (LINKS) */}
            <Accordion title="Catálogo y Rubros" icon={PackageSearch} isOpen={openSection === 'catalogo'} onToggle={() => setOpenSection(openSection === 'catalogo' ? null : 'catalogo')}>
              
              <InputGroup type="url" label="Link a Catálogo o Drive de Precios" id="linkCatalogo" value={formData.linkCatalogo} onChange={handleChange} canTest tooltip="Las clínicas podrán acceder directo desde un botón en tu perfil." />
              
              <InputGroup label="Marcas que representan (Separadas por coma)" id="marcasRepresentadas" value={formData.marcasRepresentadas} onChange={handleChange} placeholder="Ej: Zoetis, Mindray, Braun..." />

              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-4 ml-1">
                  Rubros Principales que comercializan
                </label>
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
                        className={`px-4 py-2.5 rounded-full text-[13px] font-bold border transition-all flex items-center gap-2 shadow-sm ${isChecked ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A6A]'}`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />} {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Accordion>

            {/* 3. CONDICIONES COMERCIALES */}
            <Accordion title="Condiciones Comerciales" icon={ShieldCheck} isOpen={openSection === 'condiciones'} onToggle={() => setOpenSection(openSection === 'condiciones' ? null : 'condiciones')} tooltip="Información estandarizada que da seguridad a los compradores (envíos, pagos y garantías).">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Logística */}
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
                        <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${formData.logistica[item.id] ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'bg-white border-gray-300 group-hover:border-[#2D6A6A]'}`}>
                          {formData.logistica[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-[13px] font-bold ${formData.logistica[item.id] ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagos */}
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
                        <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${formData.pagos[item.id] ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'bg-white border-gray-300 group-hover:border-[#2D6A6A]'}`}>
                          {formData.pagos[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-[13px] font-bold ${formData.pagos[item.id] ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Garantia */}
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
                        <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${formData.garantia[item.id] ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'bg-white border-gray-300 group-hover:border-[#2D6A6A]'}`}>
                          {formData.garantia[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-[13px] font-bold ${formData.garantia[item.id] ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Accordion>

            {/* 4. CONTACTO Y UBICACIÓN (MODIFICADO) */}
            <Accordion title="Ubicación, Contacto y Redes" icon={MapPin} isOpen={openSection === 'contacto'} onToggle={() => setOpenSection(openSection === 'contacto' ? null : 'contacto')}>
              
              {/* ZONA COBERTURA */}
              <div className="mb-8 w-full bg-gray-50/50 border border-gray-200 rounded-3xl p-6">
                 <div className="flex justify-between items-end mb-5">
                   <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                     Zona principal de Cobertura <span className="text-red-400 ml-1">*</span>
                   </label>
                   <button type="button" onClick={toggleTodasProvincias} className="text-[11px] font-bold text-[#2D6A6A] hover:underline bg-[#2D6A6A]/10 px-3 py-1.5 rounded-full transition-colors">
                      {formData.zonaCobertura.length === PROVINCIAS_ARG.length ? 'Desmarcar todas' : 'Marcar todo el país'}
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4 gap-x-2">
                   {PROVINCIAS_ARG.map(prov => {
                     const isChecked = formData.zonaCobertura.includes(prov);
                     return (
                       <div key={prov} className="flex items-center gap-2 cursor-pointer group w-full" onClick={() => toggleProvincia(prov)}>
                         <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-[#2D6A6A] border-[#2D6A6A]' : 'bg-white border-gray-300 group-hover:border-[#2D6A6A]'}`}>
                           {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                         </div>
                         <span className={`text-[12px] font-bold truncate ${isChecked ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>{prov}</span>
                       </div>
                     )
                   })}
                 </div>
              </div>

              {/* SEDE CENTRAL */}
              <div className="pt-2 border-t border-gray-100">
                 <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5 mt-6">
                   <Building2 className="w-4 h-4 text-[#2D6A6A]" /> Sede Central y Atención
                 </h4>
                 <InputGroup label="Dirección Física" id="direccion" value={formData.direccion} onChange={handleChange} required />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                   <InputGroup label="Link a Google Maps" id="mapaUrl" type="url" value={formData.mapaUrl} onChange={handleChange} canTest />
                   <InputGroup label="Horarios de Atención" id="horariosAtencion" value={formData.horariosAtencion} onChange={handleChange} placeholder="Ej: Lunes a Viernes de 9 a 18 hs" />
                 </div>
                 
                 <InputGroup label="Modalidad de Atención" id="modalidadAtencion" value={formData.modalidadAtencion} onChange={handleChange} placeholder="Ej: Venta online 24/7. Showroom con cita previa." />
              </div>
              
              {/* CANALES DIGITALES */}
              <div className="pt-2 border-t border-gray-100">
                 <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5 mt-6">
                   <Mail className="w-4 h-4 text-[#2D6A6A]" /> Canales Comerciales
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <InputGroup label="WhatsApp Ventas (Sin '+')" id="whatsappVentas" value={formData.whatsappVentas} onChange={handleChange} required tooltip="Número principal para recibir cotizaciones o consultas de clínicas." />
                    <InputGroup label="Email Comercial" id="emailVentas" type="email" value={formData.emailVentas} onChange={handleChange} />
                 </div>
                 <InputGroup label="Sitio Web Corporativo" id="web" type="url" value={formData.web} onChange={handleChange} canTest />
              </div>

              {/* REDES SOCIALES */}
              <div className="pt-2 border-t border-gray-100">
                 <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A3D3D] uppercase tracking-widest leading-none mb-5 mt-6">
                   <Globe className="w-4 h-4 text-[#2D6A6A]" /> Redes Sociales
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                    <InputGroup label="Instagram" id="instagram" type="url" value={formData.instagram} onChange={handleChange} canTest placeholder="https://instagram.com/..." />
                    <InputGroup label="Facebook" id="facebook" type="url" value={formData.facebook} onChange={handleChange} canTest placeholder="https://facebook.com/..." />
                    <InputGroup label="LinkedIn" id="linkedin" type="url" value={formData.linkedin} onChange={handleChange} canTest placeholder="https://linkedin.com/..." />
                 </div>
              </div>

            </Accordion>
          </div>

          {/* NUEVO: SECCIÓN DE CATÁLOGO INDEPENDIENTE (Abre Modal) */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 border-t-[8px] border-t-[#2D6A6A] mb-8 relative group hover:border-gray-300 transition-all cursor-pointer" onClick={openDrawer}>
             <div className="w-full flex justify-between items-center transition-all duration-300 py-6 px-6 md:px-5 rounded-[24px] bg-transparent hover:bg-gray-50">
               <div className="flex items-center text-left gap-3 md:gap-4">
                 <div className="p-2.5 rounded-xl transition-all duration-300 group-hover:bg-[#1A3D3D] bg-transparent text-[#2D6A6A] group-hover:text-white">
                   <Box className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="font-black text-sm md:text-base uppercase tracking-wider text-[#1A3D3D] transition-colors duration-300">
                     Catálogo de Productos
                   </h3>
                   <p className="text-[13px] text-gray-500 font-medium mt-0.5">Gestioná los equipos, insumos y promociones de tu vidriera.</p>
                 </div>
               </div>
               <div className="flex items-center gap-4 pl-4 border-l border-gray-100 h-10">
                 <div className="hidden sm:flex flex-col items-center justify-center">
                   <span className="text-lg font-black text-[#2D6A6A] leading-none mb-1">{formData.productosDestacados.length}</span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Cargados</span>
                 </div>
                 <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#2D6A6A] transition-all group-hover:translate-x-1" />
               </div>
             </div>
          </div>

          {/* BOTÓN GUARDAR */}
          <div className="flex flex-col items-center gap-6 pb-16 w-full px-5 md:px-0">
            <button 
              onClick={handleGuardarEnLaNube} 
              disabled={isSaving}
              className={`w-full sm:w-auto bg-[#1A3D3D] text-white px-16 py-5 rounded-[20px] font-bold text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#2D6A6A] hover:-translate-y-1 active:scale-95'}`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
              {isSaving ? 'Guardando en la nube...' : 'Guardar Todo'}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: PREVIEW & PROGRESS */}
        <div className="hidden lg:block w-full lg:w-[45%] lg:sticky lg:top-[110px] z-10 self-start">
          
          {/* DISCLAIMER DE CATÁLOGO */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 mb-8 shadow-sm">
            <div className="bg-amber-100 p-2.5 rounded-2xl shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-amber-800 font-bold text-[11px] uppercase tracking-widest mb-1.5">Aviso Importante</h4>
              <p className="text-amber-700/80 text-[13px] font-medium leading-relaxed">
                Esta plataforma funciona exclusivamente como <strong>catálogo y vidriera publicitaria</strong>. No se procesan ventas ni transacciones de pago a través de la web; nuestro objetivo es conectar a las clínicas directamente con su departamento comercial.
              </p>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[32px] mb-8 border border-gray-100 shadow-sm transition-all duration-500">
            <div className="flex justify-between items-center mb-5 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2D6A6A]/10 rounded-xl"><FileCheck className="w-5 h-5 text-[#2D6A6A]" /></div>
                <h4 className="text-[#1A3D3D] text-[13px] font-black uppercase tracking-[0.1em]">Visibilidad B2B</h4>
              </div>
              <span className="text-[#1A3D3D] font-bold text-lg">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2D6A6A] transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-5 flex items-start gap-3 text-left">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A] mt-1.5 shrink-0"></div>
              <p className="text-gray-500 text-[13px] leading-relaxed font-medium italic">
                {progress < 100 ? "Completá todas las secciones (incluida la dirección de tu sede) para destacar en las búsquedas." : "¡Tu perfil está completamente optimizado para B2B!"}
              </p>
            </div>
          </div>

          {/* TARJETA DE VISTA PREVIA B2B (TIPO LINKEDIN/VIDRIERA) */}
          <div className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(26,61,61,0.12)] border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 relative">
            
            {/* Banner Background */}
            <div className="h-32 md:h-40 bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] relative overflow-hidden">
               {formData.banner && <img src={formData.banner} className="w-full h-full object-cover mix-blend-overlay opacity-80" alt="Banner Preview" />}
               <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="px-8 pb-8 flex flex-col items-center text-center relative -mt-16">
              {/* Avatar/Logo superpuesto */}
              <div className="w-32 h-32 rounded-[28px] overflow-hidden border-[6px] border-white shadow-xl bg-white flex items-center justify-center mb-4 z-10">
                {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" /> : <Building className="w-12 h-12 text-gray-300" />}
              </div>
              
              <div className="z-10 w-full mb-6">
                <div className="inline-flex items-center justify-center gap-1.5 bg-[#2D6A6A]/10 text-[#2D6A6A] px-3 py-1.5 rounded-lg mb-3">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{formData.categoria || "Categoría"}</span>
                </div>
                <h3 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] leading-tight mb-2 tracking-tight">{formData.nombreEmpresa || "Nombre de la Empresa"}</h3>
                <p className="text-gray-500 font-medium text-sm px-4">"{formData.bioCorta || "Bio corta o slogan de la compañía"}"</p>
              </div>

              {/* Tags de Rubros Rápidos */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                 {Object.entries(formData.categorias).filter(([_, v]) => v).map(([key]) => (
                   <span key={key} className="bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full capitalize">
                     {key === 'equipamiento' ? 'Equipos' : key}
                   </span>
                 ))}
                 {formData.marcasRepresentadas && (
                   <span className="bg-[#1A3D3D] border border-[#1A3D3D] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                     + {formData.marcasRepresentadas.split(',').length} Marcas
                   </span>
                 )}
              </div>

              {/* Botones de Acción */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                 {formData.linkCatalogo && (
                   <div className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-[#2D6A6A] text-[#2D6A6A] bg-transparent">
                     <FileText className="w-4 h-4" /> Ver Catálogo
                   </div>
                 )}
                 <div className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl bg-[#25D366] text-white">
                   <Smartphone className="w-4 h-4" /> Contactar Ventas
                 </div>
              </div>

              {/* MINI-PREVIEW DE PRODUCTOS DESTACADOS */}
              {formData.productosDestacados.length > 0 && (
                <div className="w-full mb-8 text-left animate-in fade-in">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Productos Destacados</h4>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar" style={{scrollbarWidth: 'none'}}>
                    {formData.productosDestacados.map(prod => (
                      <div key={prod.id} className="min-w-[200px] w-[200px] bg-white border border-gray-100 rounded-[20px] p-3 shadow-sm snap-start shrink-0 flex flex-col transition-all duration-300 relative">
                        <div className="w-full h-[120px] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 relative">
                          {prod.etiqueta && (
                            <span className={`absolute top-1.5 right-1.5 text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm z-10 ${prod.etiqueta === 'Nuevo' ? 'bg-[#E4405F]' : 'bg-amber-500'}`}>
                              {prod.etiqueta}
                            </span>
                          )}
                          {prod.imagenes && prod.imagenes[0] ? (
                            <img src={prod.imagenes[0]} className="w-full h-full object-cover" alt="prod" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Box className="w-6 h-6 text-gray-300" /></div>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{prod.categoria || 'Producto'}</span>
                        <h5 className="font-bold text-[#1A3D3D] text-sm leading-snug line-clamp-2 mb-2">{prod.titulo}</h5>
                        {prod.precio && <div className="mt-auto text-[#2D6A6A] text-xs font-black">{formatearPrecio(prod.precio)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini-Resumen de Condiciones */}
              <div className="w-full bg-gray-50/50 rounded-3xl border border-gray-100 p-5 text-left grid grid-cols-2 gap-4">
                 <div>
                    <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                       <Truck className="w-3.5 h-3.5" /> <span className="text-[9px] font-bold uppercase tracking-widest">Logística</span>
                    </div>
                    <ul className="text-[11px] font-bold text-[#1A3D3D] space-y-1">
                      {formData.logistica.todoElPais && <li>• Envíos todo el país</li>}
                      {formData.logistica.despachoRapido && <li>• Despacho Rápido</li>}
                    </ul>
                 </div>
                 <div>
                    <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                       <CreditCard className="w-3.5 h-3.5" /> <span className="text-[9px] font-bold uppercase tracking-widest">Pagos</span>
                    </div>
                    <ul className="text-[11px] font-bold text-[#1A3D3D] space-y-1">
                      {formData.pagos.facturaA && <li>• Factura A y B</li>}
                      {formData.pagos.transferencia && <li>• Desc. Transferencia</li>}
                    </ul>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#1A3D3D] relative overflow-hidden pt-16 pb-12 text-left print:hidden mt-16 border-t-[6px] border-[#2D6A6A]">
        <div className="max-w-[1200px] mx-auto px-8 md:px-10 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3 opacity-60">
              <ShieldCheck className="w-6 h-6 text-white" />
              <p className="text-[12px] font-bold uppercase tracking-widest text-white">Red B2B · Validado</p>
           </div>
           <div className="text-white/50 text-[11px] uppercase tracking-[0.3em] font-medium flex items-center gap-2">
              <span>Hecho con</span>
              <Heart className="w-4 h-4 text-red-400/80 fill-current" />
              <span>en Argentina.</span>
           </div>
        </div>
      </footer>
    </div>
  );
}