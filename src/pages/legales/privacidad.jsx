import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, ChevronRight, Home, User, LayoutGrid, Briefcase, 
  Facebook, Instagram, Linkedin, Mail, Globe, Heart, ShieldCheck, 
  Sparkles, Edit, Info, Lock, Eye, FileText, UserCheck, Bell, Scale, 
  FileSignature, Copyright, AlertCircle
} from 'lucide-react';

export default function LegalPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  
  // El estado ahora se deriva de la URL para que los enlaces directos funcionen
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('terminos') ? 'terminos' : 'privacidad'
  );

  // Sincroniza el tab si el usuario navega entre las páginas (ej. con los botones del navegador)
  useEffect(() => {
    setActiveTab(location.pathname.includes('terminos') ? 'terminos' : 'privacidad');
  }, [location.pathname]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const handleScroll = () => setIsNavbarScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.head.removeChild(link);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const privacidadSections = [
    {
      id: 1,
      title: "1. Información que recopilamos",
      icon: <Eye className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Recopilamos datos personales necesarios para la prestación del servicio: nombre, matrícula profesional, universidad de egreso, correo electrónico y datos de contacto profesional. También recopilamos datos técnicos como dirección IP y cookies para mejorar la navegación."
    },
    {
      id: 2,
      title: "2. Uso de la Información",
      icon: <UserCheck className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Sus datos se utilizan para validar su identidad profesional, permitirle publicar en la bolsa de trabajo, gestionar su perfil público en el ecosistema y enviarle novedades relevantes del sector veterinario de alta complejidad."
    },
    {
      id: 3,
      title: "3. Derechos del Usuario (Ley 25.326)",
      icon: <Scale className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Usted tiene derecho a acceder, rectificar, actualizar o suprimir sus datos en cualquier momento. El Portal garantiza el ejercicio gratuito de estos derechos conforme a la normativa argentina vigente."
    }
  ];

  const terminosSections = [
    {
      id: 1,
      title: "1. Aceptación de los Términos",
      icon: <FileSignature className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Al acceder a El Portal, usted acepta quedar vinculado por estos términos. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio."
    },
    {
      id: 2,
      title: "2. Cuentas de Usuario",
      icon: <User className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Usted debe proporcionarnos información precisa, completa y actualizada en todo momento. El incumplimiento de esta condición constituye una violación de los Términos, lo que puede resultar en la terminación inmediata de su cuenta."
    },
    {
      id: 3,
      title: "3. Contenido y Responsabilidad",
      icon: <Edit className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Usted es responsable del contenido que publique en el Servicio, incluida su legalidad, fiabilidad y adecuación. El Portal se reserva el derecho de moderar contenidos que no cumplan con los estándares profesionales."
    },
    {
      id: 4,
      title: "4. Propiedad Intelectual",
      icon: <Copyright className="w-5 h-5 text-[#2D6A6A]" />,
      content: "El Servicio y su contenido original (excluyendo el contenido proporcionado por los usuarios), las características y la funcionalidad son y seguirán siendo propiedad exclusiva de El Portal y sus licenciantes. El Servicio está protegido por derechos de autor y marcas registradas tanto de Argentina como de países extranjeros."
    },
    {
      id: 5,
      title: "5. Publicación de Contenido Comercial (Capacitaciones, Bolsa de Trabajo y Proveedores)",
      icon: <AlertCircle className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Quienes publiquen capacitaciones, ofertas laborales o productos/servicios en El Portal declaran bajo su responsabilidad que los datos proporcionados (identidad, matrícula profesional, DNI, razón social, precios, condiciones y demás información comercial) son verídicos, exactos y vigentes al momento de la publicación. El Portal se reserva el derecho de solicitar documentación adicional que respalde dicha información, así como de suspender o eliminar de forma preventiva cualquier publicación que presente indicios de información falsa, engañosa o fraudulenta, sin necesidad de aviso previo. La responsabilidad por el contenido, la veracidad de los datos y el cumplimiento de las obligaciones comerciales asumidas frente a terceros (alumnos, postulantes o compradores) corresponde exclusivamente a quien publica. El Portal actúa únicamente como intermediario tecnológico de difusión y, en los casos donde corresponda, de procesamiento de pagos, y no garantiza ni se responsabiliza por la calidad, idoneidad o resultado de los servicios ofrecidos por terceros. Cualquier usuario que detecte una publicación sospechosa de fraude puede reportarla a través de los canales de contacto oficiales para su revisión inmediata."
    }
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Cambia la URL sin recargar la página para mantener la consistencia
    const path = tab === 'privacidad' ? '/politica-de-privacidad' : '/terminos-y-condiciones';
    navigate(path, { replace: true });
  };

  return (
    <div className="bg-[#F8F9F9] min-h-screen font-['Inter'] antialiased flex flex-col">
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 h-[80px] flex items-center px-6 md:px-10 transition-all duration-500 ${isNavbarScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white border-b border-gray-50'}`}>
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center">
          <div onClick={() => navigate('/')} className="text-[#1A3D3D] font-['Montserrat'] font-black text-2xl tracking-tighter cursor-pointer">
            El Portal<span className="text-[#2D6A6A]">.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              <button onClick={() => navigate('/ecosistema')} className="hover:text-[#1A3D3D] cursor-pointer transition-colors">Ecosistema</button>
              <button onClick={() => navigate('/bolsa-de-trabajo')} className="hover:text-[#1A3D3D] cursor-pointer transition-colors">Empleos</button>
              <button onClick={() => navigate('/editor')} className="bg-[#1A3D3D] text-white px-6 py-2.5 rounded-full hover:bg-[#2D6A6A] transition-all cursor-pointer">Publicar</button>
            </div>
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-11 h-11 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-[#1A3D3D]">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)}></div>
                  <nav className="absolute right-0 mt-4 w-64 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(26,61,61,0.15)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 py-3 border-b border-gray-50 mb-2 text-left">Navegación</p>
                      <button onClick={() => { navigate('/inicio'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><Home className="w-4 h-4 text-gray-400 group-hover:text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Inicio</span></button>
                      <button onClick={() => { navigate('/'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><Info className="w-4 h-4 text-gray-400 group-hover:text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Entrada</span></button>
                      <button onClick={() => { navigate('/perfil'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><div className="flex items-center gap-3"><User className="w-4 h-4 text-[#2D6A6A]" /><span className="text-sm font-bold text-[#1A3D3D]">Mi Perfil Público</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => { navigate('/ecosistema'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><div className="flex items-center gap-3"><LayoutGrid className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Repertorio Clínico</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => { navigate('/novedades'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><div className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Novedades</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => { navigate('/bolsa-de-trabajo'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><div className="flex items-center gap-3"><Briefcase className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Bolsa de Trabajo</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                      <button onClick={() => { navigate('/editor'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#F4F7F7] rounded-2xl transition-colors group"><div className="flex items-center gap-3"><Edit className="w-4 h-4 text-[#1A3D3D]" /><span className="text-sm font-bold text-[#1A3D3D]">Ir al Editor</span></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                    </div>
                  </nav>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HEADER DINÁMICO */}
      <header className="pt-32 pb-16 bg-white border-b border-gray-100">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="inline-flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button 
              onClick={() => handleTabClick('privacidad')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'privacidad' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Privacidad
            </button>
            <button 
              onClick={() => handleTabClick('terminos')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'terminos' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Términos
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight leading-tight">
            {activeTab === 'privacidad' ? 'Política de Privacidad' : 'Términos y Condiciones'}
          </h1>
          <p className="mt-4 text-gray-500 font-medium">
            Última actualización: 14 de Marzo, 2026 • Versión 2.1
          </p>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow w-full max-w-[800px] mx-auto px-6 py-16">
        <div className="space-y-12">
          {(activeTab === 'privacidad' ? privacidadSections : terminosSections).map((section) => (
            <section key={section.id} className="group">
              <div className="flex items-start gap-5">
                <div className="mt-1 w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:border-[#2D6A6A]/30 transition-colors">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold font-['Montserrat'] text-[#1A3D3D] mb-3">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </section>
          ))}

         
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1A3D3D] pt-20 pb-12">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-white/5 pb-16">
            <div className="md:col-span-1"> 
              <div className="text-white font-['Montserrat'] font-bold text-2xl mb-4 tracking-tighter">
                El Portal<span className="text-[#2D6A6A]">.</span>
              </div>
              <p className="text-white/40 text-[12px] leading-relaxed mb-6 font-medium">
                La red profesional exclusiva para medicina veterinaria de alta complejidad en Argentina.
              </p>
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"><Instagram size={16} /></div>
                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"><Linkedin size={16} /></div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Navegación</h4>
              <ul className="space-y-3 text-white/70 text-sm font-medium">
                <li><button onClick={() => navigate('/ecosistema')} className="hover:text-white cursor-pointer transition-colors">Ecosistema</button></li>
                <li><button onClick={() => navigate('/bolsa-de-trabajo')} className="hover:text-white cursor-pointer transition-colors">Bolsa de Empleo</button></li>
                <li><button onClick={() => navigate('/novedades')} className="hover:text-white cursor-pointer transition-colors">Novedades</button></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Legalidad Vigente</h4>
              <div className="bg-white/5 p-5 rounded-2xl flex gap-4 items-start">
                <ShieldCheck className="text-[#2D6A6A] shrink-0" size={20} />
                <p className="text-white/30 text-[11px] leading-relaxed">
                  Operamos bajo los estándares de la Agencia de Acceso a la Información Pública. Registro de Base de Datos Personales N° 2026-EPV. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">
              <Heart size={10} className="text-red-500/30" />
              Hecho con excelencia en Argentina
            </div>
            <div className="flex items-center gap-6 text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
              <button onClick={() => handleTabClick('privacidad')} className="hover:text-white cursor-pointer transition-colors">Privacidad</button>
              <button onClick={() => handleTabClick('terminos')} className="hover:text-white cursor-pointer transition-colors">Términos</button>
              <button className="hover:text-white cursor-pointer">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}