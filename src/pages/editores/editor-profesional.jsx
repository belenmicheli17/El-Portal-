import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Info, AlertCircle, Save, X, Plus, Trash2, 
  ArrowUp, ArrowDown, MapPin, ShieldCheck, Check, Image as ImageIcon, ArrowLeft,
  Smartphone, Home, Mail, Award, ChevronDown, 
  ArrowRight, ChevronRight, Sparkles, Crop, Facebook, Instagram, Linkedin, Globe, ExternalLink, Heart,
  Menu, User, LayoutGrid, Edit, Briefcase, FileText, Undo2, Redo2, FileCheck
} from 'lucide-react';

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
        <Info className="w-3 h-3 text-[#2D6A6A] group-hover:text-white transition-colors" />
      </div>

      {/* Contenedor del Tooltip: Adaptado para móvil */}
      <div className={`
        transition-all duration-300 
        fixed sm:absolute 
        bottom-10 sm:bottom-full 
        left-1/2 -translate-x-1/2 
        sm:mb-3 
        w-[85vw] sm:w-64 
        text-left leading-relaxed transform normal-case tracking-normal font-normal z-[110]
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
      `}>
        {isSection ? (
           <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative text-left">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A]"></div>
                <span className="text-[10px] font-black text-[#2D6A6A] tracking-wide uppercase">Importante</span>
             </div>
             <p className="text-sm text-gray-600 font-medium leading-relaxed">{text}</p>
             {/* Flecha solo visible en escritorio */}
             <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white"></div>
           </div>
        ) : (
           <div className="bg-[#1A3D3D] text-white text-xs font-medium p-3 rounded-xl shadow-2xl relative text-left border border-white/10">
             {text}
             <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A3D3D]"></div>
           </div>
        )}
      </div>
    </div>
  );
};

const InputGroup = ({ label, id, type = "text", placeholder, value, onChange, tooltip, error, required, maxLength, disabled, canTest }) => (
  <div className="mb-5 w-full">
    <label htmlFor={id} className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
      {label} {required && <span className="text-red-400 ml-1">*</span>}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    <div className="relative text-left">
      {type === "textarea" ? (
        <textarea
          id={id} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} rows="4" disabled={disabled}
          className={`w-full bg-gray-50/50 border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-4 text-base font-medium focus:outline-none transition-all resize-none text-[#1A3D3D] disabled:opacity-50`}
        />
      ) : (
        <input
          id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
          className={`w-full bg-gray-50/50 border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#2D6A6A]'} rounded-2xl px-5 py-3.5 text-base font-medium focus:outline-none transition-all text-[#1A3D3D] disabled:opacity-50 ${canTest && value ? 'pr-12' : ''}`}
        />
      )}
      {error && <AlertCircle className="w-4 h-4 text-red-400 absolute right-4 top-4" />}
      
      {canTest && (
        <a 
          href={value ? (value.startsWith('http') ? value : `https://${value}`) : '#'} 
          target="_blank" 
          rel="noreferrer"
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border transition-all shadow-sm z-10 ${value ? 'bg-white border-gray-200 text-gray-400 hover:text-[#2D6A6A] hover:border-[#2D6A6A] cursor-pointer' : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'}`}
          title="Probar que el enlace funciona"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
    {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{error}</p>}
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, tooltip }) => (
  <div className="flex items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
    <div className="flex items-center flex-1">
      <span className="text-sm font-bold text-[#1A3D3D]">{label}</span>
      {tooltip && <Tooltip text={tooltip} />}
    </div>
    <button
      type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-[#25D366]' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const Accordion = ({ title, icon: Icon, children, isOpen, onToggle, tooltip, isBioWarning, bioLength }) => {
  return (
    <div className="border-b border-gray-100 last:border-0 group relative z-[1]">
      <button 
        type="button" 
        onClick={onToggle} 
        className={`w-full flex justify-between items-center transition-all duration-500 py-5 px-5 md:px-4 md:rounded-[24px] ${isOpen ? 'md:bg-gray-50/80 shadow-sm' : 'md:hover:bg-gray-50'}`}
      >
        <div className="flex items-center text-left gap-2 md:gap-3">
          <div className={`p-2 rounded-xl transition-all duration-500 ease-in-out ${isOpen ? 'bg-[#1A3D3D] text-white' : 'bg-transparent text-[#2D6A6A]'}`}>
            {Icon && <Icon className="w-[18px] h-[18px]" />}
          </div>
          <h3 className={`font-black text-sm uppercase tracking-wider transition-colors duration-500 ${isOpen ? 'text-[#1A3D3D]' : 'text-gray-400 md:text-[#1A3D3D]'}`}>
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
            <ChevronDown className={`w-5 h-5 transition-all duration-500 ease-in-out ${isOpen ? 'rotate-180 text-[#2D6A6A]' : 'rotate-0 text-gray-300 group-hover:text-[#2D6A6A]'}`} />
          </div>
        </div>
      </button>

      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100 py-6 px-5' : 'max-h-0 opacity-0 py-0'}`}
      >
        <div className="transition-opacity duration-500">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Editor() { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [openSection, setOpenSection] = useState('identidad');

  const initialData = {
    nombre: "Dra. Clara Valdez",
    especialidad: "Cirugía de Tejidos Blandos",
    matricula: "12345",
    provincia: "Buenos Aires",
    bio: "Especialista en cirugía de tejidos blandos y traumatología con más de 12 años de experiencia. Mi enfoque se centra en técnicas mínimamente invasivas para garantizar una recuperación rápida.",
    foto: "https://images.unsplash.com/photo-1594824436998-ef22cc372134?auto=format&fit=crop&w=400&q=80",
    fotosPerfil: ["https://images.unsplash.com/photo-1594824436998-ef22cc372134?auto=format&fit=crop&w=400&q=80"],
    atiendeDomicilio: true,
    emailContacto: "contacto@claravaldez.com",
    instagram: "",
    linkedin: "",
    facebook: "",
    whatsappActivo: false,
    whatsappNum: "",
    trayectoria: [
      { id: 1, titulo: "Especialidad en Cirugía", desc: "UBA - 2015", extra: "Graduada con Diploma de Honor" }
    ],
    servicios: [
      { id: 1, titulo: "Cirugía Avanzada", desc: "Recuperación rápida en caninos." }
    ],
    casos: [
      { id: 1, nombre: "Luna", patologia: "Cirugía de Cadera", desc: "Recuperación exitosa de dsiplasia severa.", fotos: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80"] }
    ],
    zonas: [
      { 
        id: 1, 
        nombre: "Zona Oeste", 
        clinicas: [
          { id: 101, nombre: "Veterinaria Patitos", direccion: "Morón, Centro", linkMaps: "https://maps.google.com" }
        ] 
      }
    ]
  };

  const [_formData, _setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, target: null, caseId: null });
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoRedAction = useRef(false);

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
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
  };

  const handleFileSelect = (e, target, caseId = null) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setCropModal({ isOpen: true, imageSrc: event.target.result, target, caseId });
      reader.readAsDataURL(file);
    }
  };

  const saveCroppedImage = () => {
    if (cropModal.target === 'perfil') {
      setFormData(prev => ({ 
        ...prev, foto: cropModal.imageSrc,
        fotosPerfil: prev.fotosPerfil.includes(cropModal.imageSrc) ? prev.fotosPerfil : [...prev.fotosPerfil, cropModal.imageSrc]
      }));
    } else if (cropModal.target === 'caso') {
      setFormData(prev => ({
        ...prev,
        casos: prev.casos.map(c => c.id === cropModal.caseId ? { ...c, fotos: [...c.fotos, cropModal.imageSrc] } : c)
      }));
    }
    setCropModal({ isOpen: false, imageSrc: null, target: null, caseId: null });
  };

  const deleteProfilePhoto = (url, e) => {
    e.stopPropagation();
    setFormData(prev => {
      const newHistory = prev.fotosPerfil.filter(p => p !== url);
      let newCurrent = prev.foto === url ? (newHistory[0] || "") : prev.foto;
      return { ...prev, fotosPerfil: newHistory, foto: newCurrent };
    });
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

  const updateClinica = (zonaId, clinicaId, field, value) => {
    setFormData(prev => ({
      ...prev,
      zonas: prev.zonas.map(z => z.id === zonaId ? {
        ...z, clinicas: z.clinicas.map(c => c.id === clinicaId ? { ...c, [field]: value } : c)
      } : z)
    }));
  };

  const navigate = (path) => setModalConfig({ isOpen: true, title: 'Navegación', message: `Yendo a: ${path}`, type: 'info' });

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased text-left text-[#1A3D3D] selection:bg-[#2D6A6A] selection:text-white relative overflow-x-clip w-full">
      
      {/* MODALES */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D] mb-2">{modalConfig.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{modalConfig.message}</p>
            <button onClick={() => setModalConfig({ isOpen: false })} className="px-8 py-2.5 rounded-xl font-bold bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] transition-colors shadow-lg text-sm">Entendido</button>
          </div>
        </div>
      )}

      {cropModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A3D3D]/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Montserrat'] text-xl text-[#1A3D3D]">Encuadre de Imagen</h3>
                <p className="text-xs text-gray-500">Ajusta tu foto antes de publicarla.</p>
              </div>
              <button onClick={() => setCropModal({ isOpen: false })} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-[#F4F7F7] p-8 flex justify-center items-center h-[400px] relative overflow-hidden">
              <img src={cropModal.imageSrc} className="max-w-full max-h-full object-contain opacity-40" alt="Recortar" />
              <div className={`absolute border-2 border-dashed border-[#2D6A6A] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${cropModal.target === 'perfil' ? 'w-48 h-48 rounded-full' : 'w-64 h-48 rounded-xl'}`}>
                <div className="absolute inset-0 flex items-center justify-center"><Crop className="w-8 h-8 text-white opacity-50" /></div>
              </div>
            </div>
            <div className="p-6 flex justify-end gap-3">
              <button onClick={() => setCropModal({ isOpen: false })} className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">Cancelar</button>
              <button onClick={saveCroppedImage} className="px-8 py-2 rounded-xl bg-[#1A3D3D] text-white font-bold hover:bg-[#2D6A6A] transition-colors shadow-lg flex items-center gap-2"><Check className="w-4 h-4" /> Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-40 h-[70px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-8 md:px-10 shadow-sm">
        <div className="max-w-[1100px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1A3D3D] rounded-lg flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-white" /></div>
            <div className="font-['Montserrat'] font-extrabold text-lg tracking-tight">Editor<span className="text-[#2D6A6A]">.</span></div>
          </div>
          <div className="flex items-center gap-4">
            {/* INDICADOR DE GUARDADO AUTO */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 mr-2 animate-in fade-in duration-500">
               <Check className="w-3 h-3 text-[#25D366]" />
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guardado auto</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-50/50 rounded-xl p-1 border border-gray-100">
              <button onClick={undo} disabled={past.length === 0} className={`p-2 rounded-lg transition-colors ${past.length > 0 ? 'text-[#1A3D3D] hover:bg-white shadow-sm' : 'text-gray-300'}`}><Undo2 className="w-4 h-4" /></button>
              <button onClick={redo} disabled={future.length === 0} className={`p-2 rounded-lg transition-colors ${future.length > 0 ? 'text-[#1A3D3D] hover:bg-white shadow-sm' : 'text-gray-300'}`}><Redo2 className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-[#1A3D3D] hover:bg-[#F4F7F7] transition-all">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-[100px] max-w-[1100px] mx-auto px-8 md:px-10 flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="w-full lg:w-[55%] flex flex-col">
          <div className="mb-6 px-5 md:px-0">
            <h1 className="text-3xl font-black font-['Montserrat'] uppercase tracking-tight mb-2 text-[#1A3D3D]">Configurar Perfil</h1>
            <p className="text-sm text-gray-500">Actualizá tu información para destacar en la red.</p>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 border-t-[6px] border-t-[#2D6A6A] mb-8 relative">
            
            <Accordion 
              title="Identidad Profesional" 
              icon={User} 
              isOpen={openSection === 'identidad'} 
              onToggle={() => setOpenSection(openSection === 'identidad' ? null : 'identidad')}
            >
              <div className="flex flex-col sm:flex-row gap-8 mb-8 mt-2 md:mt-0">
                <div className="relative group cursor-pointer shrink-0 text-left">
                  <label htmlFor="p-upload" className={`w-32 h-32 rounded-[28px] overflow-hidden border-2 border-dashed ${formData.foto ? 'border-transparent' : 'border-gray-200'} transition-all flex items-center justify-center bg-gray-50 block cursor-pointer`}>
                    {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> : <Camera className="w-8 h-8 text-gray-300" />}
                  </label>
                  <input type="file" id="p-upload" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'perfil')} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-bold text-[#1A3D3D] mb-1 uppercase tracking-wide flex items-center">
                    Fotografía <span className="text-red-400 ml-1">*</span>
                    <Tooltip text="Usa una foto vertical o cuadrada. Una buena iluminación transmite más confianza a los tutores y colegas." />
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">Sube una imagen profesional. Se recomienda formato cuadrado.</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.fotosPerfil.map((url, i) => (
                      <div key={i} className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${formData.foto === url ? 'border-[#2D6A6A]' : 'border-gray-100'}`} onClick={() => setFormData(prev => ({...prev, foto: url}))}>
                        <img src={url} className="w-full h-full object-cover" alt="Historial" />
                        <button onClick={(e) => deleteProfilePhoto(url, e)} className="absolute top-0 right-0 p-0.5 bg-white text-red-500 opacity-0 group-hover:opacity-100"><X className="w-2 h-2" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputGroup label="Nombre Completo" id="nombre" value={formData.nombre} onChange={handleChange} required tooltip="Asegúrate de usar correctamente las mayúsculas al inicio de tu nombre y apellido." />
                <InputGroup label="Especialidad" id="especialidad" value={formData.especialidad} onChange={handleChange} required tooltip="Escribe tu título principal. Es lo primero que verán los usuarios bajo tu nombre." />
                <InputGroup label="Matrícula" id="matricula" value={formData.matricula} onChange={handleChange} required tooltip="Ingresa únicamente los números de tu matrícula profesional." />
                <div className="mb-5 text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Provincia Base</label>
                  <select id="provincia" value={formData.provincia} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2D6A6A]">
                    {["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Entre Ríos"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </Accordion>

            <Accordion title="Sobre Mí" icon={Sparkles} isOpen={openSection === 'bio'} onToggle={() => setOpenSection(openSection === 'bio' ? null : 'bio')} bioLength={formData.bio.length} tooltip="Resume tu experiencia y pasión. Tienes 350 caracteres para contar qué te hace especial en tu rubro.">
              <InputGroup type="textarea" label="Resumen Profesional" id="bio" value={formData.bio} onChange={handleChange} maxLength={350} placeholder="Cuenta brevemente tu experiencia profesional..." />
            </Accordion>

            <Accordion title="Títulos y Trayectoria" icon={Award} isOpen={openSection === 'trayectoria'} onToggle={() => setOpenSection(openSection === 'trayectoria' ? null : 'trayectoria')} tooltip="Los títulos que agregues se mostrarán en formato de línea de tiempo en tu perfil público.">
              <div className="space-y-4">
                {formData.trayectoria.map((item, index) => (
                  <div key={item.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex gap-4 text-left">
                    <div className="flex flex-col gap-1 mt-1">
                      <button type="button" onClick={() => handleArrayMove('trayectoria', index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleArrayMove('trayectoria', index, 'down')} disabled={index === formData.trayectoria.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" placeholder="Título (Ej: Especialista)" value={item.titulo} onChange={(e) => handleArrayUpdate('trayectoria', item.id, 'titulo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold" />
                        <input type="text" placeholder="Entidad / Año" value={item.desc} onChange={(e) => handleArrayUpdate('trayectoria', item.id, 'desc', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm" />
                      </div>
                      <input type="text" placeholder="Dato extra (opcional)" value={item.extra || ""} onChange={(e) => handleArrayUpdate('trayectoria', item.id, 'extra', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs italic" />
                    </div>
                    <button onClick={() => handleArrayRemove('trayectoria', item.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('trayectoria', { titulo: "", desc: "", extra: "" })} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-[10px] font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest">+ Agregar Logro Académico</button>
              </div>
            </Accordion>

            <Accordion title="Servicios Médicos" icon={Briefcase} isOpen={openSection === 'servicios'} onToggle={() => setOpenSection(openSection === 'servicios' ? null : 'servicios')}>
              <div className="space-y-4">
                {formData.servicios.map((item, index) => (
                  <div key={item.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex gap-4 text-left">
                    <div className="flex flex-col gap-1 mt-1">
                      <button type="button" onClick={() => handleArrayMove('servicios', index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleArrayMove('servicios', index, 'down')} disabled={index === formData.servicios.length - 1} className="p-1 text-gray-300 hover:text-[#1A3D3D] disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" value={item.titulo} placeholder="Nombre del servicio" onChange={(e) => handleArrayUpdate('servicios', item.id, 'titulo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold" />
                      <textarea value={item.desc} placeholder="Descripción corta" onChange={(e) => handleArrayUpdate('servicios', item.id, 'desc', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs resize-none h-16" />
                    </div>
                    <button onClick={() => handleArrayRemove('servicios', item.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('servicios', { titulo: "", desc: "" })} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-[10px] font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest">+ Añadir Actividad Médica</button>
              </div>
            </Accordion>

            <Accordion title="Casos de Éxito" icon={Camera} isOpen={openSection === 'casos'} onToggle={() => setOpenSection(openSection === 'casos' ? null : 'casos')} tooltip="Los casos reales con fotos del antes y después generan muchísima confianza. Puedes subir varias fotos por caso.">
              <div className="space-y-6">
                {formData.casos.map((item, index) => (
                  <div key={item.id} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-4 relative text-left">
                    <button onClick={() => handleArrayRemove('casos', item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="w-full md:w-32 flex flex-wrap gap-2 shrink-0">
                        {item.fotos.map((f, fi) => (
                          <div key={fi} className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 group/img">
                            <img src={f} className="w-full h-full object-cover" alt="Thumb" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1">
                              <button onClick={() => moveCasoFoto(item.id, fi, 'left')} className="text-white"><ArrowLeft className="w-3 h-3" /></button>
                              <button onClick={() => removeCasoFoto(item.id, fi)} className="text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                        <label htmlFor={`c-img-${item.id}`} className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-[#2D6A6A] cursor-pointer"><Plus className="w-4 h-4" /></label>
                        <input type="file" id={`c-img-${item.id}`} className="hidden" onChange={(e) => handleFileSelect(e, 'caso', item.id)} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <input type="text" placeholder="Paciente" value={item.nombre} onChange={(e) => handleArrayUpdate('casos', item.id, 'nombre', e.target.value)} className="w-1/3 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold" />
                          <input type="text" placeholder="Patología" value={item.patologia} onChange={(e) => handleArrayUpdate('casos', item.id, 'patologia', e.target.value)} className="w-2/3 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-[#2D6A6A]" />
                        </div>
                        <textarea placeholder="Relato clínico del caso..." value={item.desc} onChange={(e) => handleArrayUpdate('casos', item.id, 'desc', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs h-24 resize-none" />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('casos', { nombre: "", patologia: "", desc: "", fotos: [] })} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-[10px] font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest">+ Publicar Nuevo Caso</button>
              </div>
            </Accordion>

            <Accordion title="Zonas de Atención" icon={MapPin} isOpen={openSection === 'zonas'} onToggle={() => setOpenSection(openSection === 'zonas' ? null : 'zonas')} tooltip="Permite que los tutores encuentren tu clínica en Google Maps rápidamente. Organízalas por zonas geográficas.">
              <div className="space-y-6">
                {formData.zonas.map((z) => (
                  <div key={z.id} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 relative pt-12 text-left">
                    <button onClick={() => handleArrayRemove('zonas', z.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <input type="text" placeholder="Nombre de Zona (Ej: CABA)" value={z.nombre} onChange={(e) => handleArrayUpdate('zonas', z.id, 'nombre', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black mb-4" />
                    <div className="space-y-3 pl-4 border-l-2 border-[#2D6A6A]/10">
                      {z.clinicas.map((c) => (
                        <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-100 space-y-2">
                          <input type="text" placeholder="Clínica" value={c.nombre} onChange={(e) => updateClinica(z.id, c.id, 'nombre', e.target.value)} className="w-full text-xs font-bold border-b border-gray-50 pb-1 outline-none" />
                          <input type="text" placeholder="Dirección" value={c.direccion} onChange={(e) => updateClinica(z.id, c.id, 'direccion', e.target.value)} className="w-full text-[11px] outline-none text-gray-500" />
                          <input type="url" placeholder="Link Google Maps" value={c.linkMaps} onChange={(e) => updateClinica(z.id, c.id, 'linkMaps', e.target.value)} className="w-full text-[10px] bg-gray-50 rounded-lg p-1.5 outline-none" />
                        </div>
                      ))}
                      <button onClick={() => {
                        const newClinicas = [...z.clinicas, { id: Date.now(), nombre: "", direccion: "", linkMaps: "" }];
                        handleArrayUpdate('zonas', z.id, 'clinicas', newClinicas);
                      }} className="text-[10px] font-bold text-[#2D6A6A]">+ Añadir Punto de Atención</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('zonas', { nombre: "", clinicas: [] })} className="w-full py-3 bg-[#1A3D3D] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#2D6A6A] transition-all">Crear Nueva Zona Geográfica</button>
              </div>
            </Accordion>

            <Accordion title="Contacto y Canales" icon={Smartphone} isOpen={openSection === 'contacto'} onToggle={() => setOpenSection(openSection === 'contacto' ? null : 'contacto')}>
              <InputGroup label="Email Público" id="emailContacto" type="email" value={formData.emailContacto} onChange={handleChange} required tooltip="Aquí llegarán los emails que te envíen desde el formulario de contacto." />
              <div className="flex items-center gap-2 mb-4 mt-6 border-t border-gray-100 pt-6 text-left">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Redes Sociales (Opcional)</h3>
                <Tooltip text="Entra a tu perfil, copia el link (URL) y pégalo aquí. O usa la opción 'Compartir perfil' de la app para obtener el enlace." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Instagram" id="instagram" value={formData.instagram} onChange={handleChange} placeholder="Link de perfil" canTest />
                <InputGroup label="LinkedIn" id="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="Link de perfil" canTest />
              </div>
              <div className="w-full h-px bg-gray-100 my-6"></div>
              <ToggleSwitch label="Ofrezco consultas a domicilio" checked={formData.atiendeDomicilio} onChange={(v) => setFormData(p => ({...p, atiendeDomicilio: v}))} tooltip="Añadirá un distintivo (badge) especial en tu perfil público." />
              <div className="mt-6">
                <ToggleSwitch label="Botón de WhatsApp en perfil" checked={formData.whatsappActivo} onChange={(v) => setFormData(p => ({...p, whatsappActivo: v}))} tooltip="Si lo activas, aparecerá un gran botón verde en tu perfil para chats rápidos." />
                {formData.whatsappActivo && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                    <InputGroup label="Número de WhatsApp (con código de país)" id="whatsappNum" value={formData.whatsappNum} onChange={handleChange} placeholder="Ej: 54911..." required={formData.whatsappActivo} />
                  </div>
                )}
              </div>
            </Accordion>
          </div>

          {/* ÁREA DE ACCIÓN CENTRALIZADA */}
          <div className="flex flex-col items-center gap-6 pb-12 w-full px-5 md:px-0">
            <button 
              onClick={() => setModalConfig({ isOpen: true, title: 'Publicación Exitosa', message: 'Tu perfil ha sido actualizado en la red de El Portal.', type: 'info' })} 
              className="w-full sm:w-auto bg-[#1A3D3D] text-white px-16 py-4 rounded-[20px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#2D6A6A] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" /> Publicar Perfil Profesional
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/perfil')} 
              className="text-center block text-[#2D6A6A] font-bold text-xs uppercase tracking-[0.2em] hover:text-[#1A3D3D] transition-colors flex items-center justify-center gap-2 group"
            >
              Ver mi perfil profesional <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: PREVIEW & PROGRESS */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-[85px] z-10 self-start">
          
          <div className="bg-white p-6 rounded-[24px] mb-6 border border-gray-100 shadow-sm transition-all duration-500">
            <div className="flex justify-between items-center mb-4 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#2D6A6A]/10 rounded-lg"><FileCheck className="w-4 h-4 text-[#2D6A6A]" /></div>
                <h4 className="text-[#1A3D3D] text-[11px] font-black uppercase tracking-[0.1em]">Estado de perfil completo</h4>
              </div>
              <span className="text-[#1A3D3D] font-bold text-sm">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2D6A6A] transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex items-start gap-3 text-left">
              <div className="w-1 h-1 rounded-full bg-[#2D6A6A] mt-1.5 shrink-0"></div>
              <p className="text-gray-500 text-[11px] leading-relaxed font-medium italic">
                {progress < 40 ? "Complete su biografía para mejorar su posicionamiento." : progress < 80 ? "Añadir casos clínicos genera mayor seguridad a sus colegas." : progress < 100 ? "Su perfil está casi listo para el nivel de visibilidad máximo." : "Su perfil se encuentra completamente optimizado."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(26,61,61,0.12)] border border-gray-100 overflow-hidden flex flex-col transition-all duration-500">
            <div className="bg-[#1A3D3D] p-6 flex flex-col items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="relative mb-3.5 z-10">
                <div className="w-24 h-24 rounded-[24px] overflow-hidden border-[4px] border-white/20 shadow-2xl bg-gray-100">
                  {formData.foto && <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" />}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#2D6A6A] p-1.5 rounded-xl border-2 border-[#1A3D3D]"><ShieldCheck className="w-3.5 h-3.5 text-white" /></div>
              </div>
              <div className="z-10 w-full">
                <h3 className="text-xl font-black font-['Montserrat'] text-white leading-tight mb-1">{formData.nombre || "Nombre Profesional"}</h3>
                <p className="text-[#2D6A6A] bg-[#2D6A6A]/10 px-3 py-0.5 rounded-full border border-[#2D6A6A]/20 font-bold text-[10px] uppercase tracking-wider mb-1.5 inline-block">{formData.especialidad || "Especialidad"}</p>
                {formData.matricula && <p className="text-white/40 text-[9px] uppercase font-bold">Mat: {formData.matricula}</p>}
              </div>
            </div>

            <div className="p-6 flex flex-col items-center">
              <p className="text-gray-500 text-[13px] leading-relaxed italic mb-6 text-center px-2">"{formData.bio || "Resumen profesional..."}"</p>
              <div className="flex gap-3 mb-6 w-full justify-center">
                <div className="flex-1 bg-[#F4F7F7] p-3 rounded-[16px] flex flex-col items-center text-center gap-1.5 border border-gray-100/50">
                  <MapPin className="w-4 h-4 text-[#2D6A6A]" />
                  <span className="text-[9px] font-bold text-[#1A3D3D] uppercase tracking-wider leading-tight">{formData.provincia}</span>
                </div>
                {formData.atiendeDomicilio && (
                  <div className="flex-1 bg-blue-50 p-3 rounded-[16px] flex flex-col items-center text-center gap-1.5 border border-blue-100/50">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider leading-tight">A Domicilio</span>
                  </div>
                )}
              </div>
              <div className="w-full">
                <div className={`w-full py-3.5 rounded-[16px] font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg ${formData.whatsappActivo ? 'bg-[#25D366] text-white' : 'bg-[#1A3D3D] text-white'}`}>
                  {formData.whatsappActivo ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  {formData.whatsappActivo ? 'WhatsApp' : 'Contacto'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-gradient-to-br from-[#1A3D3D] to-[#2D6A6A] relative overflow-hidden pt-20 pb-12 text-left print:hidden mt-auto">
              <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>
              <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                  
                  <div className="md:col-span-1">
                    <div onClick={() => navigate('/')} className="text-white font-['Montserrat'] font-bold text-2xl mb-6 leading-none cursor-pointer block hover:opacity-80 transition-opacity">
                      El Portal<span className="text-white/40">.</span>
                    </div>
                    <p className="text-white/50 text-[13px] leading-relaxed mb-6 font-medium">La red profesional exclusiva para medicina veterinaria de alta complejidad. Conectando talento con vocación.</p>
                    <div className="flex gap-3">
                      <button aria-label="Facebook de El Portal" className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all"><Facebook className="w-4 h-4" /></button>
                      <button aria-label="Instagram de El Portal" className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all"><Instagram className="w-4 h-4" /></button>
                      <button aria-label="Linkedin de El Portal" className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1A3D3D] transition-all"><Linkedin className="w-4 h-4" /></button>
                    </div>
                    <div className="text-white/40 text-[10px] font-medium space-y-1.5 flex flex-col items-start mt-6">
                      <p>&copy; {new Date().getFullYear()} El Portal. Todos los derechos reservados.</p>
                      <p className="flex items-center gap-2">
                        <button onClick={() => navigate('/terminos-y-condiciones')} className="underline hover:text-white transition-colors focus:outline-none">Términos</button>
                        <span>•</span>
                        <button onClick={() => navigate('/politica-de-privacidad')} className="underline hover:text-white transition-colors focus:outline-none">Privacidad</button>
                      </p>
                    </div>
                  </div>
      
                  <div>
                    <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Navegación</h4>
                    <ul className="space-y-4 text-white/40 text-sm">
                      <li><button onClick={() => navigate('/')} className="hover:text-white transition-colors">Inicio</button></li>
                      <li><button onClick={() => navigate('/perfil')} className="hover:text-white transition-colors">Mi Perfil</button></li>
                      <li><button onClick={() => navigate('/editor')} className="hover:text-white transition-colors">Editor de Perfil</button></li>
                    </ul>
                  </div>
      
                  <div>
                    <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Ecosistema</h4>
                    <ul className="space-y-4 text-white/40 text-sm">
                      <li><button onClick={() => navigate('/ecosistema')} className="hover:text-white transition-colors">Cursos y Seminarios</button></li>
                      <li><button onClick={() => navigate('/bolsa-de-trabajo')} className="hover:text-white transition-colors">Bolsa de Trabajo</button></li>
                      <li><button onClick={() => navigate('/novedades')} className="hover:text-white transition-colors">Novedades</button></li>
                    </ul>
                  </div>
      
                  <div>
                    <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Contacto</h4>
                    <ul className="space-y-4 mb-8 text-white/40 text-sm leading-none">
                      <li><a href="mailto:elportalveterinario.arg@gmail.com" className="flex items-center gap-3 hover:text-white transition-colors"><Mail className="w-4 h-4 shrink-0" /> <span>elportalveterinario.arg@gmail.com</span></a></li>
                      <li className="flex items-center gap-3"><Globe className="w-4 h-4" /> elportal.vet</li>
                    </ul>
                  </div>
                </div>
      
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.3em]">creado por Belén M. Arenas</p>
                  <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium flex items-center gap-1.5 group cursor-default">
                    <span>Hecho con</span>
                    <Heart className="w-3 h-3 text-red-400/50 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 fill-current" aria-hidden="true" />
                    <span>en Argentina.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] leading-none">Única plataforma veterinaria oficial</span>
                  </div>
                </div>
              </div>
            </footer>
    </div>
  );
}
