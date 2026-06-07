import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Clock, Users, Globe, Target,
  BookOpen, Briefcase, Package, Newspaper,
  Star, Building2, ShieldCheck, ArrowUpRight,
  Award, Bell, Building, Truck, User, MapPin, Activity,
  Chrome, Eye, EyeOff, Lock, Stethoscope, Tag, ShoppingCart, ArrowDown,
  TrendingUp, Network, ShoppingBag, Mail, LayoutGrid
} from 'lucide-react';
import CartillaHeroMockup from '../components/CartillaHeroMockup';

const Cookies = ({ isFooterVisible }) => null;

const strategicCardsData = [
  {
    id: 'profesionales',
    roleKey: 'profesional',
    icon: User,
    title: 'Profesionales',
    subtitle: 'Centralizá tu prestigio y accedé a oportunidades exclusivas.',
    features: [
      { icon: Stethoscope, title: 'Casos a tu medida:', desc: 'Atraé consultas y derivaciones alineadas con tu especialidad.' },
      { icon: TrendingUp, title: 'Evolución profesional:', desc: 'Destacá tu formación para ser descubierto por directores médicos.' },
      { icon: LayoutGrid, title: 'Llave al ecosistema:', desc: 'Usá tu cuenta para estar siempre al tanto de nuevas capacitaciones, ofertas laborales y siempre a mano los contactos de proveedores.' }
    ]
  },
  {
    id: 'clinicas',
    roleKey: 'clinica',
    icon: Building2,
    title: 'Centros Veterinarios',
    subtitle: 'Atraé nuevos pacientes y convertite en el centro de derivación de tu zona.',
    features: [
      { icon: MapPin, title: 'Visibilidad ante tutores:', desc: 'que exploren los servicios que ofreces y conozcan a tu equipo de profesionales.' },
      { icon: TrendingUp, title: 'Rentabilizá tu equipamiento:', desc: 'Atraé derivaciones directas de colegas.' },
      { icon: Briefcase, title: 'Reclutamiento ágil:', desc: 'Encontrá rápidamente a los especialistas que tu equipo necesita desde la Bolsa de Trabajo.' }
    ]
  },
  {
    id: 'proveedores',
    roleKey: 'proveedor',
    icon: Package,
    title: 'Proveedores',
    subtitle: 'Tu catálogo frente a los que toman las decisiones de compra.',
    features: [
      { icon: Target, title: 'Tráfico 100% calificado:', desc: 'Tu oferta llega directamente a profesionales matriculados y directores médicos interesados en tu catalogo.' },
      { icon: Network, title: 'Networking de Ventas:', desc: 'Conectá de forma directa a tus distribuidores con las clínicas.' },
      { icon: ShoppingBag, title: 'Exhibición de Alta Gama:', desc: 'Mostrá todos tus productos destacando ofertas.' }
    ]
  }
];

const StrategicCard = ({ data, isMobile, index, onSelectRole }) => {
  const { icon: Icon, title, subtitle, features, roleKey } = data;

  const getDesktopPosition = (idx) => {
    if (idx === 0) return '';
    if (idx === 1) return 'md:top-6 lg:top-8';
    return 'md:top-12 lg:top-16';
  };

  return (
    <div className={`bg-white/[0.96] backdrop-blur-2xl border border-white/80 p-6 md:px-8 md:py-8 rounded-[32px] md:rounded-[40px] transition-all flex flex-col items-start text-left relative overflow-hidden group hover:z-20 z-10 ${
      isMobile 
        ? "w-[85vw] max-w-[380px] snap-center shrink-0 shadow-[0_8px_25px_rgba(0,0,0,0.4)]" 
        : `w-full duration-500 shadow-[0_12px_35px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-3 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] hover:bg-white ${getDesktopPosition(index)}`
    }`}>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <Icon className="w-6 h-6 text-[#2D6A6A] shrink-0" />
        <h3 className="text-xl md:text-2xl font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">{title}</h3>
      </div>
      <h4 className="text-[#2D6A6A] font-bold text-[14px] leading-[1.6] mb-6 relative z-10">{subtitle}</h4>
      <ul className="flex flex-col gap-4 flex-1 relative z-10 w-full">
        {features.map((feature, idx) => (
          <li key={idx} className="block">
            <p className="text-[#333333]/90 text-[14px] md:text-[15px] leading-[1.6] font-medium">
              <feature.icon className="w-[18px] h-[18px] text-[#2D6A6A] inline-block mr-2 relative -top-[2px]" />
              <strong className="text-[#1A3D3D] font-bold">{feature.title}</strong> {feature.desc}
            </p>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={() => onSelectRole(roleKey)}
        className="mt-8 w-full bg-[#1A3D3D] hover:bg-[#2D6A6A] text-white font-bold py-3.5 rounded-xl transition-all duration-300 text-[14px] flex justify-center items-center gap-2 shadow-[0_4px_15px_rgba(26,61,61,0.15)] hover:shadow-[0_6px_20px_rgba(26,61,61,0.25)] relative z-10"
      >
        Unirme como {title.split(' ')[0]} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const StackedMockups = ({ navigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const mockups = [
    {
      id: 'profesionales',
      route: '/perfiles',
      content: (
        <div className="bg-white border border-[#1A3D3D]/10 rounded-[32px] md:rounded-[40px] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)] h-[400px] w-full flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-start mb-5">
            <span className="text-[13px] font-black text-[#2D6A6A] uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Profesionales
            </span>
          </div>
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-[24px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-[#1A3D3D]/5 shadow-sm mx-auto">
              <img src="https://images.unsplash.com/photo-1594824436951-7f12bc3ac92e?auto=format&fit=crop&w=300&q=80" alt="Dra. Arenas" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#789A9A] p-2 rounded-xl border-[3px] border-white shadow-sm text-white z-20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-yellow-50 text-yellow-700 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-3 border border-yellow-200/50 uppercase tracking-widest">
              <Award className="w-3.5 h-3.5 fill-current" /> Referente Destacada
          </div>
          <h3 className="text-[18px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">Dra. Mercedes Arenas</h3>
          <p className="text-[#2D6A6A] text-[12px] font-semibold uppercase tracking-widest mb-5">Cirujana Traumatóloga</p>
          
          <div className="flex flex-col gap-3 w-full mt-auto mb-5">
            <div className="bg-[#F4F7F7] px-4 py-3 rounded-2xl border border-[#1A3D3D]/5 flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-[#2D6A6A] shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-semibold text-[#1A3D3D]/60 uppercase tracking-widest leading-none mb-1">Modalidad</p>
                <p className="text-[14px] font-bold text-[#1A3D3D] leading-none">Derivaciones y Quirófano</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'clinicas',
      route: '/perfiles',
      content: (
        <div className="bg-white border border-[#1A3D3D]/10 rounded-[32px] md:rounded-[40px] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)] h-[400px] w-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-black text-[#2D6A6A] uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Clínicas
            </span>
            <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-bold border border-red-200/50">
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>GUARDIA 24HS
            </span>
          </div>
          <div className="relative mb-8">
            <div className="w-full h-[120px] rounded-[24px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-[#1A3D3D]/5 shadow-sm">
              <img src="https://images.unsplash.com/photo-1584820927498-cafe8c11a686?auto=format&fit=crop&w=400&q=80" alt="Hospital San Marcos" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A3D3D]/80 via-[#1A3D3D]/20 to-transparent"></div>
            </div>
            <div className="absolute -bottom-3 right-3 bg-[#789A9A] p-2 rounded-xl border-[3px] border-white shadow-sm text-white z-20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="pl-1 mb-4 text-left">
            <h3 className="text-[18px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-2">Hospital San Marcos</h3>
            <p className="text-[#1A3D3D]/70 text-[13px] font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2D6A6A]" /> CABA y GBA Norte
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full mt-auto mb-5">
            <div className="bg-[#F4F7F7] px-4 py-3 rounded-2xl border border-[#1A3D3D]/5 flex items-center gap-3">
              <Building className="w-6 h-6 text-[#2D6A6A] shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-semibold text-[#1A3D3D]/60 uppercase tracking-widest leading-none mb-1">Infraestructura</p>
                <p className="text-[14px] font-bold text-[#1A3D3D] leading-none">Tomógrafo y Quirófano</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'proveedores',
      route: '/perfiles',
      content: (
        <div className="bg-white border border-[#1A3D3D]/10 rounded-[32px] md:rounded-[40px] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)] h-[400px] w-full flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-start mb-5">
            <span className="text-[13px] font-black text-[#2D6A6A] uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4" /> Proveedores
            </span>
          </div>
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-[24px] bg-[#F4F7F7] overflow-hidden relative z-10 border border-[#1A3D3D]/5 shadow-sm mx-auto">
              <img src="https://images.unsplash.com/photo-1581594549595-35f6edc7b762?auto=format&fit=crop&w=300&q=80" alt="Equipamiento" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#789A9A] p-2 rounded-xl border-[3px] border-white shadow-sm text-white z-20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-[#4DB6AC]/10 text-[#4DB6AC] text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-3 border border-[#4DB6AC]/30 uppercase tracking-widest">
              <Tag className="w-3.5 h-3.5 fill-current" /> Distribuidor Oficial
          </div>
          <h3 className="text-[18px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">Mindray Argentina</h3>
          <p className="text-[#2D6A6A] text-[12px] font-semibold uppercase tracking-widest mb-5">Catálogo Mayorista</p>
          
          <div className="flex flex-col gap-3 w-full mt-auto mb-5">
            <div className="bg-[#F4F7F7] px-4 py-3 rounded-2xl border border-[#1A3D3D]/5 flex items-center gap-3 relative">
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider shadow-sm z-10">Oferta</div>
              <ShoppingCart className="w-6 h-6 text-[#2D6A6A] shrink-0" />
              <div className="text-left">
                <p className="text-[11px] font-semibold text-[#1A3D3D]/60 uppercase tracking-widest leading-none mb-1">Aparatología</p>
                <p className="text-[14px] font-bold text-[#1A3D3D] leading-none">Ecógrafo Doppler</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleCardClick = (e, index, route) => {
    e.stopPropagation();
    if (index === activeIndex) {
      navigate(route);
    } else {
      setActiveIndex(index);
    }
  };

  const nextMockup = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % mockups.length);
  };

  return (
    <div className="w-full flex flex-col items-center">
     
     <div className="text-[#1A3D3D] text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] mt-8 mb-6 text-center px-4 leading-relaxed">
  <span>Presioná la tarjeta para ver un ejemplo real</span>
  <ArrowDown className="w-4 h-4 text-[#1A3D3D] inline-block ml-1 align-middle" />
</div>

      <div className="relative w-full max-w-[320px] lg:max-w-[350px] h-[450px] perspective-1000">
        {mockups.map((m, idx) => {
          const offset = (idx - activeIndex + mockups.length) % mockups.length;
          const isFront = offset === 0;
          
          const zIndex = 30 - offset * 10;
          const scale = 1 - offset * 0.05;
          const translateY = offset * 20; 
          const translateX = offset * 15; 
          const opacity = 1 - offset * 0.2;

          return (
            <div 
              key={m.id}
              onClick={(e) => handleCardClick(e, idx, m.route)}
              /* TRANSICIÓN SUAVE Y FLUIDA (700ms ease-in-out) */
              className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out cursor-pointer ${isFront ? 'hover:-translate-y-2' : ''}`}
              style={{
                zIndex,
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                opacity,
              }}
            >
              {/* Eliminé el overlay interno que oscurecía la carta */}
              {m.content}
            </div>
          );
        })}

        {/* FLECHITA LATERAL con un z-index altísimo para que no se superponga con la sombra de las cards */}
        <button 
          onClick={nextMockup}
          className="absolute -right-[15px] md:-right-12 top-[40%] z-[60] bg-white border border-[#1A3D3D]/10 text-[#2D6A6A] p-3 md:p-4 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-[#1A3D3D] hover:text-white hover:scale-110 transition-all duration-300"
          aria-label="Siguiente perfil"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

const ZigZagSection = ({ title, subtitle, text, image, customMockup, isReversed, icon: Icon, bgClass = "bg-transparent", paddingClass = "py-12 md:py-20", badge, isDark = false, mobileMockup }) => {
  return (
    <section className={`${paddingClass} relative overflow-hidden ${bgClass}`}>
      {!isDark && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
           <div className={`absolute top-0 ${isReversed ? 'right-[-10%]' : 'left-[-10%]'} w-[40vw] h-[40vw] bg-[#2D6A6A]/5 rounded-full blur-[100px]`}></div>
        </div>
      )}
      
      <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10">
        <div className={`flex flex-col gap-8 lg:gap-16 items-center ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          <div className="flex-1 flex flex-col items-start text-left relative z-20">
            <Icon className={`w-6 h-6 mb-4 md:mb-5 ${isDark ? 'text-white' : 'text-[#2D6A6A]'} shrink-0`} />
            <h3 className={`${isDark ? 'text-white/60' : 'text-[#2D6A6A]'} font-bold text-[13px] uppercase tracking-[0.2em] mb-3`}>{subtitle}</h3>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black mb-5 tracking-tighter font-['Montserrat'] leading-[1.1] ${isDark ? 'text-white' : 'text-[#1A3D3D]'}`}>
              {title}
            </h2>
            <p className={`${isDark ? 'text-white/80' : 'text-[#333333]/90'} text-[15px] md:text-[16px] leading-[1.7] font-medium`}>
              {text}
            </p>
             {/* Badge en móvil si existiese */}
             {badge && (
               <div className="mt-8 z-30 relative block md:hidden w-full max-w-[320px]">
                  {badge}
               </div>
             )}
          </div>
          
          <div className="flex-1 w-full relative group mt-4 lg:mt-0 flex justify-center h-[450px]">
            {customMockup ? (
              <div className="relative w-full max-w-[320px] md:max-w-[380px] z-20 h-full flex items-center justify-center">
                {customMockup}
                {badge && (
                  <div className={`hidden md:block absolute ${isReversed ? '-left-2 md:-left-8' : '-right-2 md:-right-8'} -bottom-4 z-30 animate-float-delayed`}>
                    {badge}
                  </div>
                )}
              </div>
            ) : (
              <div className={`relative w-full ${mobileMockup ? 'hidden md:block' : 'block'} h-full`}>
                <div className={`absolute inset-0 bg-gradient-to-tr rounded-[32px] md:rounded-[40px] transform group-hover:scale-105 transition-transform duration-700 ${isDark ? 'from-black/40' : 'from-[#1A3D3D]/20'} to-transparent z-20 pointer-events-none`}></div>
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-full object-cover rounded-[32px] md:rounded-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] transform group-hover:-translate-y-2 transition-transform duration-700 relative z-10"
                />
                {badge && (
                  <div className={`hidden md:block absolute ${isReversed ? '-left-4 md:-left-8' : '-right-4 md:-right-8'} -bottom-6 z-30 animate-float-delayed`}>
                    {badge}
                  </div>
                )}
              </div>
            )}
            
            {mobileMockup && !customMockup && (
              <div className="block md:hidden w-full max-w-[360px] relative z-20">
                {mobileMockup}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const TypewriterTitle = () => {
  const [charIndex, setCharIndex] = useState(0);
  const text1 = "Enfocate en curar,";
  const text2 = "nosotros en conectarte.";
  const totalChars = text1.length + text2.length;

  useEffect(() => {
    const initialDelay = charIndex === 0 ? 400 : 0;
    if (charIndex < totalChars) {
      const timeout = setTimeout(() => {
        setCharIndex(prev => prev + 1);
      }, initialDelay || 45); 
      return () => clearTimeout(timeout);
    }
  }, [charIndex, totalChars]);

  const displayedText1 = text1.slice(0, charIndex);
  const displayedText2 = charIndex > text1.length ? text2.slice(0, charIndex - text1.length) : "";

  return (
    <div className="relative w-full mb-4 md:mb-6">
      <h1 className="text-[40px] md:text-[54px] lg:text-[62px] font-black tracking-tighter font-['Montserrat'] leading-[1.05] opacity-0 pointer-events-none select-none invisible">
        {text1}
        <br />
        {text2}
      </h1>
      <h1 className="absolute top-0 left-0 w-full text-[40px] md:text-[54px] lg:text-[62px] font-black text-[#1A3D3D] tracking-tighter font-['Montserrat'] leading-[1.05]">
        {displayedText1}
        {charIndex <= text1.length && (
          <span className="inline-block w-1 h-[32px] md:h-[48px] bg-[#2D6A6A] ml-1 animate-pulse align-middle"></span>
        )}
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
          {displayedText2}
        </span>
        {charIndex > text1.length && (
          <span className="inline-block w-1 h-[32px] md:h-[48px] bg-[#2D6A6A] ml-1 animate-pulse align-middle"></span>
        )}
      </h1>
    </div>
  );
};

export default function LandingPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState('profesional');
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);
  const navigate = useNavigate();
  const footerRef = useRef(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 2s; }
      
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);

    const observerFooter = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.5 } 
    );
    if (footerRef.current) observerFooter.observe(footerRef.current);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      if (footerRef.current) observerFooter.unobserve(footerRef.current);
    };
  }, []);

  const handleNav = (page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let path;
    switch (page) {
      case 'landing': path = '/'; break;
      case 'ecosistema': path = '/ecosistema'; break;
      case 'terminos': path = '/terminos-y-condiciones'; break;
      case 'privacidad': path = '/politica-de-privacidad'; break;
      default: path = `/${page}`;
    }
    navigate(path);
  };

  const getRoleSubtext = () => {
    if (activeRole === 'clinica') return "Mostrá tu infraestructura y recibí derivaciones.";
    if (activeRole === 'proveedor') return "Conectá tu catálogo directo con los profesionales.";
    return "Únete a la red profesional de Argentina.";
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY;
      const isMobile = window.innerWidth < 768;
      const offset = isMobile ? -50 : -41; 
      window.scrollTo({ top: y - offset, behavior: 'smooth' });
    }
  };

  const handleSelectRoleAndScroll = (role) => {
    setActiveRole(role);
    scrollToSection('registro-final');
    setTimeout(() => {
      setHighlightForm(true);
      setTimeout(() => { setHighlightForm(false); }, 2000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] overflow-x-hidden relative selection:bg-[#2D6A6A] selection:text-white antialiased">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#2D6A6A]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[60vw] h-[60vw] bg-[#4DB6AC]/15 rounded-full blur-[150px]"></div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.025] mix-blend-overlay" 
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <div>
        {/* 1. HERO SECTION LIMPIA */}
        <div className="relative w-full bg-transparent">
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(to bottom, transparent 70%, #F4F7F7 100%)' }}></div>
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[25%] md:top-[35%] right-[-20%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] bg-[#1A3D3D]/[0.12] rounded-full blur-[150px] mix-blend-multiply"></div>
            <div className="absolute top-[45%] md:top-[50%] right-[-10%] w-[80vw] md:w-[45vw] h-[80vw] md:h-[45vw] bg-[#2D6A6A]/[0.12] rounded-full blur-[120px] mix-blend-multiply"></div>
          </div>

          <main className="relative z-10 w-full pt-5 pb-2 md:pt-9 md:pb-16">
            <div className="max-w-[1100px] mx-auto px-8 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="flex flex-col items-start text-left">
              <div className="mb-6 inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#2D6A6A] animate-pulse"></span>
                <span className="text-[#2D6A6A] font-bold text-[12px] uppercase tracking-[0.2em] leading-none mt-0.5">Primera Cartilla veterinaria Argentina</span>
              </div>
                
                  <TypewriterTitle />
              
                <p className="text-[16px] md:text-[18px] text-[#333333]/90 font-medium leading-relaxed mb-8 max-w-[500px]">
                  La primera Cartilla pensada exclusivamente para el sector veterinario, diseñada para garantizar una máxima presencia digital con el mínimo mantenimiento. Un espacio que optimiza el uso de tu tiempo y asegura tu posicionamiento a futuro, conectando de forma orgánica con las audiencias clave de la profesión sin la exigencia de generar contenido constante.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-2 md:mb-0 relative z-10">
                  <button 
                    onClick={() => scrollToSection('registro-final')} 
                    className="bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[13px] hover:bg-[#2D6A6A] hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_20px_rgba(26,61,61,0.2)] text-center w-full sm:w-auto"
                  >
                    Crear Cuenta Gratis
                  </button>
                  <button 
                    onClick={() => scrollToSection('ecosistema-completo')} 
                    className="bg-white text-[#1A3D3D] border border-[#1A3D3D]/10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[13px] hover:bg-[#F4F7F7] hover:-translate-y-1 transition-all duration-300 shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    Beneficios de ser parte <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div 
                className="relative flex lg:hidden -mt-4 -mb-[80px] items-center justify-center w-full cursor-pointer z-0"
                onClick={() => navigate('/cartilla')}
              >
                <div className="transform scale-[0.80] sm:scale-90 origin-top"> 
                  <CartillaHeroMockup />
                </div>
              </div>

              <div 
                className="relative hidden lg:flex -mt-16 items-center justify-center w-full cursor-pointer transition-transform hover:scale-[1.02] duration-300"
                onClick={() => navigate('/cartilla')}
              >
                <CartillaHeroMockup />
              </div>

            </div>
          </main>
        </div>

       {/* 2. STORYTELLING ZIG-ZAG */}
        <div id="historia">
          
          <ZigZagSection 
            paddingClass="pt-6 pb-12 md:pt-10 md:pb-20"
            bgClass="bg-transparent"
            icon={Clock}
            subtitle="Atemporalidad"
            title="Foco en tu vocación, no en el algoritmo."
            text="El Portal está diseñado para que no pierdas tiempo en redes sociales que exigen creación de contenido constante y no están pensadas para profesionales de la salud. Acá, tu perfil es atemporal: no necesitás depender del algoritmo para que encuentren tu información esencial."
            isReversed={false}
            customMockup={<StackedMockups navigate={navigate} />}
            /* ACÁ ELIMINAMOS EL BADGE QUE FLOTABA ABAJO */
          />

          <ZigZagSection 
            bgClass="bg-[#1A3D3D]"
            isDark={true}
            icon={Users}
            subtitle="Comunidad"
            title="Rompé con el aislamiento del consultorio."
            text="Mantenete conectado con colegas y referentes de tu área. Encontrá el contacto exacto para derivar un caso complejo, armar equipos de trabajo o acceder a nuevas oportunidades de capacitación. Una red sólida te abre puertas reales."
            image="/2.consultorio.png"
            isReversed={true}
            badge={
              <div className="bg-white/10 backdrop-blur-xl p-4 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/10 text-left">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/20 backdrop-blur-md flex items-center justify-center text-[13px] font-bold text-white shadow-sm">+10k</div>
                </div>
                <div className="pr-2">
                  <p className="text-[13px] text-white/60 font-semibold uppercase tracking-widest leading-none mb-1">Networking</p>
                  <p className="text-[15px] font-black text-white leading-tight">Comunidad Activa</p>
                </div>
              </div>
            }
          />

          <ZigZagSection 
            bgClass="bg-transparent"
            icon={Star}
            subtitle="Presencia Virtual"
            title="Tu trayectoria, verificada y en un solo lugar."
            text="Te ofrecemos un espacio exclusivo donde tu perfil funciona como tu propia página institucional. Centralizá tu conocimiento, infraestructura o catálogo frente a la audiencia exacta que necesita contactarte."
            image="/3.perfil-verificado.png"
            isReversed={false}
          />
        </div>

       {/* 2.5 AUTO-SEGMENTACIÓN */}
        <section id="ecosistema-completo" className="pt-8 pb-12 md:py-20 bg-[#1A3D3D] relative overflow-hidden border-t border-white/10">
          <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] bg-[#2D6A6A]/30 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-[1200px] mx-auto px-8 md:px-10 relative z-10 text-center mb-8 md:mb-12">
            <h3 className="text-[#4DB6AC] font-bold text-[13px] uppercase tracking-[0.3em] mb-3 drop-shadow-md">Socios Estratégicos</h3>
            <h2 className="text-3xl md:text-5xl font-black text-white font-['Montserrat'] leading-[1.1] tracking-tighter drop-shadow-lg">
              Un ecosistema donde<br/>todos crecen.
            </h2>
          </div>
          
          <div className="w-full max-w-[1100px] mx-auto relative z-10">
            {/* Grid Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
              {[
                strategicCardsData.find(c => c.id === 'profesionales'),
                strategicCardsData.find(c => c.id === 'clinicas'),
                strategicCardsData.find(c => c.id === 'proveedores')
              ].map((data, idx) => (
                <StrategicCard key={`pc-${data.id}`} data={data} isMobile={false} index={idx} onSelectRole={handleSelectRoleAndScroll} />
              ))}
            </div>

            {/* Carrusel Mobile */}
            <div 
              className="flex md:hidden gap-5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pt-4 pb-12 px-[5vw]"
              onScroll={(e) => {
                const scrollLeft = e.target.scrollLeft;
                const cardWidth = e.target.offsetWidth;
                setActiveCardIndex(Math.round(scrollLeft / cardWidth));
              }}
            >
              {[
                strategicCardsData.find(c => c.id === 'profesionales'),
                strategicCardsData.find(c => c.id === 'clinicas'),
                strategicCardsData.find(c => c.id === 'proveedores')
              ].map((data, idx) => (
                <StrategicCard key={`mob-${data.id}`} data={data} isMobile={true} index={idx} onSelectRole={handleSelectRoleAndScroll} />
              ))}
            </div>
            
            {/* Puntos dinámicos */}
            <div className="flex md:hidden justify-center gap-2 -mt-6 mb-4 relative z-20">
                {[0, 1, 2].map((idx) => (
                  <span 
                    key={`dot-${idx}`} 
                    className={`h-2 rounded-full transition-all duration-300 ${activeCardIndex === idx ? 'bg-[#4DB6AC] w-4' : 'bg-white/30 w-2'}`}
                  ></span>
                ))}
            </div>
          </div>
        </section>

      {/* 3. ECOSISTEMA BENTO GRID */}
        <section id="ecosistema" className="py-12 md:py-20 bg-transparent relative overflow-hidden border-t border-white/30">
          <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10 text-center">
            <div className="text-center mb-10 md:mb-16">
              <h3 className="text-[#2D6A6A] font-bold text-[13px] uppercase tracking-[0.3em] mb-4 text-center">Contactos al instante</h3>
              <h2 className="text-3xl md:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tighter text-center">
                Espacios diseñados para<br/>agilizar tu práctica diaria.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Tarjeta Principal: Bolsa de Trabajo */}
              <div className="md:col-span-2 bg-white border border-[#1A3D3D]/10 p-8 md:p-10 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_40px_rgba(45,106,106,0.1)] transition-all duration-300 group flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative">
                <div className="absolute top-8 right-8 bg-[#F4F7F7] text-[#1A3D3D]/60 text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider hidden md:block">
                  Para Clínicas y Profesionales
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4 text-left">
                    <Briefcase className="w-6 h-6 text-[#2D6A6A]" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Bolsa de Trabajo</h3>
                  </div>
                  <p className="text-[#333333]/90 leading-[1.6] font-medium mb-8 text-[15px] md:text-[16px] max-w-lg text-left">
                    Accedé a oportunidades laborales de primer nivel. Conectamos talento con centros veterinarios que buscan especialidades específicas.
                  </p>
                </div>
                <div className="bg-[#F4F7F7] border border-[#1A3D3D]/5 rounded-[28px] p-6 w-full md:w-[85%] transform group-hover:-translate-y-2 transition-transform duration-300 relative text-left shadow-sm">
                  <div className="flex justify-between items-start mb-6 text-left">
                    <div className="flex gap-3 items-center text-left">
                      <Building2 className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                      <div className="text-left">
                        <p className="font-bold text-[14px] text-[#1A3D3D]">Clínica San Marcos</p>
                        <p className="text-[10px] text-[#1A3D3D]/50 uppercase tracking-widest font-semibold">Busca Especialista</p>
                      </div>
                    </div>
                    <span className="bg-[#2D6A6A] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider text-left border border-[#2D6A6A]">NUEVO</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 text-left">
                    <div className="flex gap-2 text-left">
                      <span className="bg-white border border-[#1A3D3D]/10 text-[11px] px-3 py-1 rounded-full text-[#333333] font-bold text-left shadow-sm">Cardiología</span>
                      <span className="bg-white border border-[#1A3D3D]/10 text-[11px] px-3 py-1 rounded-full text-[#333333] font-bold text-left shadow-sm">Part-Time</span>
                    </div>
                    <button className="bg-white border-2 border-[#1A3D3D] text-[#1A3D3D] px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ease-in-out hover:bg-[#F4F7F7] hover:translate-y-0.5 whitespace-nowrap text-left shadow-sm">
                      Postularme
                    </button>
                  </div>
                </div>
              </div>

              {/* Tarjeta Vertical: Servicios Holísticos */}
              <div className="md:col-span-1 md:row-span-2 bg-[#1A3D3D] border border-white/10 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col group relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="mb-4 text-left">
                  <span className="bg-gradient-to-r from-[#FFB74D] to-[#FF9800] text-[#1A3D3D] text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider inline-block mb-4 shadow-sm">
                    ¡Próximamente!
                  </span>
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6 text-[#4DB6AC]" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-white leading-tight">Servicios Holísticos</h3>
                  </div>
                </div>
                <p className="text-white/80 leading-[1.6] font-medium text-[15px] text-left mb-8">
                  Damos visibilidad a profesionales y servicios especializados difíciles de hallar: fisioterapia, terapias holísticas, etología y nutrición natural. Conectamos todo el ecosistema de bienestar animal.</p>
                <div className="mt-auto flex flex-col gap-3 relative z-10 text-left">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer shadow-sm flex justify-between">
                    <span className="text-white font-bold text-[15px]">Acupuntura</span><ChevronRight className="w-4 h-4 text-white/50" />
                  </div>
                </div>
              </div>

              {/* Tarjeta: Cursos */}
              <div className="md:col-span-1 bg-white border border-[#1A3D3D]/10 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_40px_rgba(45,106,106,0.1)] transition-all duration-300 group text-left shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative">
                <span className="absolute top-6 right-6 bg-[#F4F7F7] text-[#1A3D3D]/60 text-[11px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Capacitación</span>
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-[#2D6A6A]" />
                  <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Cursos</h3>
                </div>
                <div className="w-full bg-[#F4F7F7] border border-[#1A3D3D]/10 rounded-[24px] p-5 mb-6 transform group-hover:scale-[1.02] transition-transform duration-300 relative">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Bell className="w-10 h-10 text-[#1A3D3D]" /></div>
                  <p className="text-[#1A3D3D] font-bold text-[15px] leading-tight mb-2">Ecografía Doppler Avanzada</p>
                  <p className="text-[#1A3D3D]/60 text-[13px] font-semibold italic">Inicia el 15 de Abril</p>
                </div>
                <p className="text-[#333333]/90 leading-[1.6] font-medium text-[14px] text-left">
                  Mantenete al tanto de las ultimas novedades sobre cursos y charlas. Encontrá fácilmente quién dicta el próximo seminario, fechas y modalidades.
                </p>
              </div>

              {/* Tarjeta: Insumos */}
              <div className="md:col-span-1 bg-white border border-[#1A3D3D]/10 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_40px_rgba(45,106,106,0.1)] transition-all duration-300 group text-left shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative">
                <span className="absolute top-6 right-6 bg-[#F4F7F7] text-[#1A3D3D]/60 text-[11px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Clínicas/Empresas</span>
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-[#2D6A6A]" />
                  <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Insumos</h3>
                </div>
                <div className="bg-[#F4F7F7] border border-[#1A3D3D]/10 rounded-[24px] p-5 mb-6 flex items-center gap-4 shadow-sm">
                  <Truck className="w-6 h-6 text-[#2D6A6A] shrink-0" />
                  <div className="flex-1">
                         <p className="text-[10px] font-bold text-[#1A3D3D]/50 uppercase tracking-widest text-left">En camino • Prótesis</p>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#1A3D3D]/5"><div className="h-full w-[70%] bg-[#2D6A6A]"></div></div>
                  </div>
                </div>
                <p className="text-[#333333]/90 leading-[1.6] font-medium text-[14px] text-left">
                  Cartilla optimizado para contactar proveedores de insumos médicos complejos y aparatología.
                </p>
              </div>

              {/* Tarjeta: Grandes Animales */}
              <div className="md:col-span-1 bg-[#1A3D3D] border border-white/10 p-8 rounded-[32px] md:rounded-[40px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300 group flex flex-col justify-between text-left shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-[#4DB6AC]" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-white">Grandes Animales</h3>
                  </div>
                  <p className="text-white/70 leading-[1.6] font-medium text-[14px] text-left">
                    Encontrá especialistas en medicina rural, equinos y bovinos. Conectamos talento equipado para el trabajo en campo donde la distancia ya no es un límite.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-left">
                  <span className="bg-white/5 text-white px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider border border-white/10 shadow-sm">Rural</span>
                  <span className="bg-white/5 text-white px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider border border-white/10 shadow-sm">Equinos</span>
                </div>
              </div>

              {/* Tarjeta Inferior: Noticias */}
              <div className="md:col-span-2 bg-[#E8EFEF] border border-[#2D6A6A]/20 p-8 md:p-10 rounded-[32px] hover:bg-[#DCE7E7] transition-all duration-300 flex flex-col md:flex-row gap-8 items-center text-left overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="flex-1 text-left">
                  <span className="bg-gradient-to-r from-[#FFB74D] to-[#FF9800] text-[#1A3D3D] text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider inline-block mb-4 shadow-sm">
                    ¡Próximamente!
                  </span>
                  <div className="flex items-center gap-3 mb-4">
                    <Newspaper className="w-6 h-6 text-[#2D6A6A]" />
                    <h3 className="text-2xl font-bold font-['Montserrat'] text-[#1A3D3D]">Noticias</h3>
                  </div>
                  <p className="text-[#333333]/90 leading-[1.6] font-medium text-[15px]">
                    Mantenete al día con los avances de la medicina veterinaria en Argentina. Un feed exclusivo para descubrir innovaciones de colegas y más.
                  </p>
                </div>
                <div className="w-full md:w-[50%] flex flex-col gap-4 relative z-10 text-left">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#1A3D3D]/5 transform group-hover:-translate-y-1 transition-transform duration-300 w-full">
                    <div className="flex gap-2 items-center mb-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-[13px] text-[#2D6A6A] uppercase tracking-widest font-black">Tendencia</span>
                    </div>
                    <p className="font-bold text-[15px] leading-tight text-[#1A3D3D]">Nueva técnica en cirugía de tejidos blandos. Casos de éxito.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. CALL TO ACTION Y FORMULARIO */}
        <section 
          id="registro-final"
          className="py-12 md:py-20 relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #FFFFFF 20%, #ffffff 100%)' }}
        >
          <div className="max-w-[1100px] mx-auto px-8 md:px-10 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Mitad Izquierda: Textos */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] mb-6 font-['Montserrat'] tracking-tight leading-[1.1]">
                ¿Listo para darle a tu perfil el prestigio que merece?
              </h2>
              <p className="text-[#333333]/90 text-[16px] md:text-[18px] font-medium leading-relaxed mb-1">
                Formá parte de la primera cartilla veterinaria que potencia tu visibilidad mientras vos te enfocás en tu profesión.
              </p>
            </div>

            {/* Mitad Derecha: Formulario de Registro */}
            <div className="w-full max-w-[480px] lg:w-[500px]">
              <div className={`relative bg-white border border-[#1A3D3D]/10 rounded-[32px] p-6 md:px-8 md:py-8 flex flex-col items-center w-full transition-all duration-700 ease-out z-20 ${highlightForm ? 'scale-[1.03] shadow-[0_0_80px_rgba(45,106,106,0.3)] ring-4 ring-[#4DB6AC]/50 ring-offset-4 ring-offset-white' : 'scale-100 shadow-[0_15px_50px_rgba(0,0,0,0.08)]'}`}>
                <h2 className="text-[24px] font-black text-[#1A3D3D] mb-2 font-['Montserrat'] text-center leading-tight">Crear tu cuenta, es gratis.</h2>
                <p className="text-[#1A3D3D]/60 text-[14px] font-medium mb-6 text-center">{getRoleSubtext()}</p>
                
                {/* TABS DE ROLES */}
                <div className="w-full bg-[#F4F7F7] p-1.5 rounded-[16px] flex items-center mb-6 border border-[#1A3D3D]/5">
                  <button 
                    onClick={() => setActiveRole('profesional')}
                    className={`flex-1 py-2 text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${activeRole === 'profesional' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#1A3D3D]/50 hover:text-[#1A3D3D]'}`}
                  >
                    Profesional
                  </button>
                  <button 
                    onClick={() => setActiveRole('clinica')}
                    className={`flex-1 py-2 text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${activeRole === 'clinica' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#1A3D3D]/50 hover:text-[#1A3D3D]'}`}
                  >
                    Clínica
                  </button>
                  <button 
                    onClick={() => setActiveRole('proveedor')}
                    className={`flex-1 py-2 text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${activeRole === 'proveedor' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#1A3D3D]/50 hover:text-[#1A3D3D]'}`}
                  >
                    Empresa
                  </button>
                </div>

                {/* CAMPOS DEL FORMULARIO */}
                <div className="w-full flex flex-col items-center">
                  <button className="flex items-center justify-center gap-3 w-full border border-[#1A3D3D]/10 py-3 rounded-2xl bg-white text-[#1A3D3D] font-bold text-[15px] mb-5 transition-all hover:bg-[#F4F7F7] shadow-sm">
                      <Chrome className="w-5 h-5 text-red-500" /> Continuar con Google
                  </button>
                  
                  <div className="flex items-center gap-3 w-full mb-5 text-[#1A3D3D]/50">
                    <div className="h-px bg-black/5 flex-1"></div>
                    <span className="text-[12px] font-bold uppercase tracking-widest">o con tu email</span>
                    <div className="h-px bg-black/5 flex-1"></div>
                  </div>

                  <div className="w-full space-y-3 mb-6">
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A3D3D]/40" />
                      <input 
                        type="text" 
                        placeholder={activeRole === 'profesional' ? "Tu nombre completo" : "Nombre de la institución/empresa"} 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#1A3D3D]/10 focus:border-[#2D6A6A]/50 focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none font-medium text-[15px] text-[#333333] transition-all bg-[#F4F7F7]/50" 
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A3D3D]/40" />
                      <input 
                        type="email" 
                        placeholder={activeRole === 'profesional' ? "Tu email profesional" : "Email de contacto"} 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#1A3D3D]/10 focus:border-[#2D6A6A]/50 focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none font-medium text-[15px] text-[#333333] transition-all bg-[#F4F7F7]/50" 
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A3D3D]/40" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Crea una contraseña" 
                        className="w-full pl-12 pr-12 py-3 rounded-xl border border-[#1A3D3D]/10 focus:border-[#2D6A6A]/50 focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none font-medium text-[15px] text-[#333333] transition-all bg-[#F4F7F7]/50" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A3D3D]/50 hover:text-[#2D6A6A] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleNav(activeRole === 'profesional' ? 'editor' : activeRole === 'clinica' ? 'editor-clinica' : 'editor-proveedores')} 
                    className="w-full bg-[#2D6A6A] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[14px] transition-all duration-300 hover:bg-[#1A3D3D] hover:-translate-y-1 shadow-[0_8px_20px_rgba(45,106,106,0.3)] flex items-center justify-center gap-2"
                  >
                    Crear cuenta de {activeRole} <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <p className="text-[#1A3D3D]/60 text-[12px] font-medium text-center mt-4 w-full">
                    Al registrarte, aceptás nuestros <span onClick={() => navigate('/terminos-y-condiciones')} className="font-bold underline cursor-pointer hover:text-[#2D6A6A]">Términos</span> y la <span onClick={() => navigate('/politica-de-privacidad')} className="font-bold underline cursor-pointer hover:text-[#2D6A6A]">Política de Privacidad</span>.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* DIV INVISIBLE PARA LAS COOKIES */}
        <div ref={footerRef} className="h-1 w-full m-0 p-0"></div>
      </div>

      <Cookies isFooterVisible={isFooterVisible} />
    </div>
  );
}