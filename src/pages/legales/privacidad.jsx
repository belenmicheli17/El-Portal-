import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Edit, Info, Eye, UserCheck, Scale, FileSignature, Copyright, AlertCircle } from 'lucide-react';

export default function LegalPage() {
  const navigate = useNavigate();
  const location = useLocation();

  
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
    },
    {
      id: 4,
      title: "4. Cookies y medición del sitio",
      icon: <Info className="w-5 h-5 text-[#2D6A6A]" />,
      content: "Si usted lo acepta en el aviso de cookies, usamos Google Analytics (Google LLC) y Microsoft Clarity (Microsoft Corporation) para entender cómo se usa el sitio: páginas visitadas, tiempo de navegación, tipo de dispositivo, ubicación aproximada y cómo se interactúa con las pantallas (clics, desplazamientos y grabaciones anónimas de la sesión). Esta información es estadística, no la usamos para identificarlo personalmente y los campos donde se escriben datos se ocultan en las grabaciones. Estos servicios pueden procesar datos fuera de Argentina. Si no acepta, no se activan. Puede cambiar su decisión borrando las cookies y datos del sitio en su navegador."
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
    <div className="bg-[#F4F7F7] min-h-screen font-['Inter'] antialiased flex flex-col">
      {/* HEADER DINÁMICO */}
      <header className="pt-14 pb-16 bg-white border-b border-gray-100">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="inline-flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button 
              onClick={() => handleTabClick('privacidad')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'privacidad' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-gray-400 hover:text-[#666666]'}`}
            >
              Privacidad
            </button>
            <button 
              onClick={() => handleTabClick('terminos')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'terminos' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-gray-400 hover:text-[#666666]'}`}
            >
              Términos
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight leading-tight">
            {activeTab === 'privacidad' ? 'Política de Privacidad' : 'Términos y Condiciones'}
          </h1>
          <p className="mt-4 text-[#666666] font-medium">
            Última actualización: 26 de noviembre de 2026 • Versión 2.2
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
                  <p className="text-[#666666] leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </section>
          ))}

         
        </div>
      </main>

    </div>
  );
}