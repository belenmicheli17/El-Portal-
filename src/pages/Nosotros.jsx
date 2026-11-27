import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck, Clock, Lock, Search, MapPin, MessageCircle, Stethoscope, Hospital,
  GraduationCap, Store, CheckCircle2, Briefcase, ArrowRight, UserCheck, Mail
} from 'lucide-react';

// Página "Quiénes somos y cómo funciona": una sola página con varias secciones.
// Se entra por /nosotros (arriba de todo) o por /como-funciona (baja directo a "Cómo verificamos").
// Cada sección tiene un id para poder llegar con un link: /nosotros#para-tutores, etc.

// Secciones del menú de pastillas (id = el ancla de cada sección)
const SECCIONES = [
  { id: 'quienes-somos', label: 'Quiénes somos' },
  { id: 'para-tutores', label: 'Para tutores' },
  { id: 'como-verificamos', label: 'Cómo verificamos' },
  { id: 'tus-datos', label: 'Tus datos' },
  { id: 'bolsa', label: 'Bolsa de trabajo' }
];

// Qué pedimos a cada tipo de cuenta para verificarla
const VERIFICACIONES = [
  {
    titulo: 'Profesionales',
    Icono: Stethoscope,
    acento: 'bg-blue-50 text-blue-600',
    pedimos: ['Matrícula provincial o nacional', 'Foto del título o carnet'],
    resultado: 'Su perfil aparece en la Cartilla recién cuando queda verificado.'
  },
  {
    titulo: 'Clínicas',
    Icono: Hospital,
    acento: 'bg-violet-50 text-violet-600',
    pedimos: ['Matrícula del director/a técnico/a', 'Foto de su título o carnet', 'Ubicación desde Google Maps'],
    resultado: 'La dirección sale de Google, así que la ubicación es la real.'
  },
  {
    titulo: 'Estudiantes',
    Icono: GraduationCap,
    acento: 'bg-rose-50 text-rose-500',
    pedimos: ['Facultad donde cursa', 'Comprobante de que está cursando'],
    resultado: 'No aparecen en la Cartilla: su perfil se comparte por link y pueden postularse como asistentes.'
  }
];

// Título de sección con la línea decorativa de la guía de estilo (40 x 3 px)
function TituloSeccion({ etiqueta, titulo, bajada }) {
  return (
    <div className="mb-8">
      <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-2">{etiqueta}</p>
      <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[34px] tracking-tight leading-tight">{titulo}</h2>
      <div className="w-10 h-[3px] bg-[#2D6A6A] rounded-full mt-3" />
      {bajada && <p className="text-[#666666] text-[16px] leading-relaxed mt-4 max-w-2xl">{bajada}</p>}
    </div>
  );
}

export default function Nosotros() {
  const location = useLocation();
  const [activa, setActiva] = useState(SECCIONES[0].id);

  // Al entrar por /como-funciona (o con #seccion en la dirección), bajamos directo a esa parte
  useEffect(() => {
    const destino = location.hash ? location.hash.slice(1) : (location.pathname.toLowerCase() === '/como-funciona' ? 'como-verificamos' : '');
    if (!destino) { window.scrollTo(0, 0); return; }
    const t = setTimeout(() => document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  // Marca en el menú la sección que se está viendo
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => { if (e.isIntersecting) setActiva(e.target.id); }),
      { rootMargin: '-140px 0px -60% 0px' }
    );
    SECCIONES.forEach((s) => { const el = document.getElementById(s.id); if (el) observador.observe(el); });
    return () => observador.disconnect();
  }, []);

  const irA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="bg-[#F4F7F7] font-['Inter'] antialiased text-[#333333]">

      {/* ENCABEZADO */}
      <header className="bg-[#1A3D3D] relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[520px] h-[520px] bg-[#2D6A6A]/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[-10%] w-[420px] h-[420px] bg-[#4DB6AC]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 md:pt-20 md:pb-16 relative">
          <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#4DB6AC] mb-4">El Portal Veterinario</p>
          <h1 className="font-['Montserrat'] font-black text-white text-[36px] md:text-[52px] tracking-tighter leading-[1.05] max-w-3xl">
            Una red solo para el sector veterinario, <span className="text-[#4DB6AC]">con perfiles verificados.</span>
          </h1>
          <p className="text-white/70 text-[16px] md:text-[18px] leading-relaxed mt-5 max-w-2xl">
            Quiénes somos, cómo verificamos a cada cuenta y qué podés hacer en El Portal, seas tutor/a, profesional, clínica o estudiante.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { Icono: UserCheck, texto: 'Cada solicitud la revisa una persona' },
              { Icono: Clock, texto: 'Verificación en 24 a 48 horas' },
              { Icono: Lock, texto: 'Tus documentos son privados' }
            ].map(({ Icono, texto }) => (
              <span key={texto} className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-[13px] font-semibold px-4 py-2.5 rounded-full">
                <Icono className="w-4 h-4 text-[#4DB6AC]" /> {texto}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* MENÚ DE SECCIONES (queda fijo debajo de la barra de arriba al bajar) */}
      <nav className="sticky top-[72px] z-40 bg-[#F4F7F7]/90 backdrop-blur-md border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => irA(s.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${activa === s.id ? 'bg-[#1A3D3D] text-white' : 'bg-white text-[#1A3D3D] border border-gray-200 hover:border-[#2D6A6A]/50'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6">

        {/* QUIÉNES SOMOS (texto provisorio) */}
        <section id="quienes-somos" className="scroll-mt-[140px] py-16 md:py-20">
          <div className="grid md:grid-cols-[300px_1fr] gap-10 md:gap-14 items-center">
            <div className="mx-auto md:mx-0">
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-[40px] bg-white border border-gray-100 shadow-[0_10px_50px_rgba(0,0,0,0.08)] flex items-center justify-center">
                <span className="font-['Montserrat'] font-black text-[#1A3D3D]/15 text-[96px]">B</span>
              </div>
            </div>
            <div>
              <TituloSeccion etiqueta="Quiénes somos" titulo="Lorem ipsum dolor sit amet" />
              <div className="space-y-4 text-[16px] leading-relaxed text-[#444444] max-w-2xl">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus. Cras mattis consectetur purus sit amet fermentum, nulla vitae elit libero.</p>
                <p>Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper. Maecenas faucibus mollis interdum, sed posuere consectetur est at lobortis.</p>
              </div>
              <p className="mt-6 font-['Montserrat'] font-bold text-[#1A3D3D]">Lorem Ipsum</p>
              <p className="text-[14px] text-[#666666]">Creadora de El Portal Veterinario</p>
            </div>
          </div>
        </section>

        {/* PARA TUTORES */}
        <section id="para-tutores" className="scroll-mt-[140px] py-16 md:py-20 border-t border-gray-200/70">
          <TituloSeccion
            etiqueta="Para tutores de mascotas"
            titulo="Encontrá al profesional indicado"
            bajada="En la Cartilla están los veterinarios/as y las clínicas de todo el país. Solo aparecen perfiles verificados por nuestro equipo."
          />
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { Icono: Search, titulo: 'Buscá', texto: 'Por especialidad, zona y tipo de animal: perros, gatos, exóticos o de campo.' },
              { Icono: ShieldCheck, titulo: 'Elegí con confianza', texto: 'Cada perfil muestra su matrícula, su trayectoria y dónde atiende.' },
              { Icono: MessageCircle, titulo: 'Contactá directo', texto: 'Por WhatsApp o mail, sin intermediarios y sin costo.' }
            ].map(({ Icono, titulo, texto }, i) => (
              <div key={titulo} className="bg-white rounded-[24px] border border-gray-100 p-7 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#2D6A6A]/10 flex items-center justify-center">
                    <Icono className="w-6 h-6 text-[#2D6A6A]" />
                  </div>
                  <span className="font-['Montserrat'] font-black text-[#1A3D3D]/10 text-[40px] leading-none">0{i + 1}</span>
                </div>
                <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[19px] mb-2">{titulo}</h3>
                <p className="text-[15px] text-[#666666] leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
          <Link to="/Cartilla" className="inline-flex items-center gap-2 mt-8 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
            <MapPin className="w-4 h-4" /> Buscar en la Cartilla
          </Link>
        </section>

        {/* CÓMO VERIFICAMOS */}
        <section id="como-verificamos" className="scroll-mt-[140px] py-16 md:py-20 border-t border-gray-200/70">
          <TituloSeccion
            etiqueta="Cómo verificamos"
            titulo="Cada cuenta pasa por una revisión"
            bajada="Una persona de nuestro equipo revisa cada solicitud a mano. Recién cuando está todo en orden, el perfil se hace público."
          />
          <div className="grid md:grid-cols-3 gap-5">
            {VERIFICACIONES.map(({ titulo, Icono, acento, pedimos, resultado }) => (
              <div key={titulo} className="bg-white rounded-[24px] border border-gray-100 p-7 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${acento}`}><Icono className="w-6 h-6" /></div>
                  <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[20px]">{titulo}</h3>
                </div>
                <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#666666] mb-3">Qué pedimos</p>
                <ul className="space-y-2.5 mb-5">
                  {pedimos.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[15px] text-[#333333]">
                      <CheckCircle2 className="w-5 h-5 text-[#2D6A6A] shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-4 border-t border-gray-100 text-[14px] text-[#666666] leading-relaxed">{resultado}</p>
              </div>
            ))}
          </div>

          {/* Pasos de la verificación */}
          <div className="mt-6 bg-white rounded-[24px] border border-gray-100 shadow-sm p-7 md:p-8 grid md:grid-cols-3 gap-6">
            {[
              { Icono: UserCheck, titulo: 'Revisión a mano', texto: 'Miramos la matrícula y la foto del título o comprobante de cada solicitud.' },
              { Icono: Clock, titulo: '24 a 48 horas', texto: 'Es lo que tarda en general, de lunes a viernes.' },
              { Icono: Mail, titulo: 'Te avisamos por mail', texto: 'Cuando la cuenta queda verificada, o si falta corregir algo.' }
            ].map(({ Icono, titulo, texto }) => (
              <div key={titulo} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F4F7F7] flex items-center justify-center shrink-0"><Icono className="w-5 h-5 text-[#2D6A6A]" /></div>
                <div>
                  <h4 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px]">{titulo}</h4>
                  <p className="text-[14px] text-[#666666] leading-relaxed mt-1">{texto}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 flex items-center gap-2 text-[14px] text-[#666666]">
            <Store className="w-4 h-4 text-gray-400" /> Proveedores y empresas del sector: próximamente.
          </p>
        </section>

        {/* TUS DATOS */}
        <section id="tus-datos" className="scroll-mt-[140px] py-16 md:py-20 border-t border-gray-200/70">
          <div className="bg-[#1A3D3D] rounded-[32px] p-8 md:p-12 relative overflow-hidden grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="absolute top-[-40%] right-[-10%] w-[360px] h-[360px] bg-[#2D6A6A]/40 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative">
              <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#4DB6AC] mb-2">Tus datos</p>
              <h2 className="font-['Montserrat'] font-black text-white text-[28px] md:text-[34px] tracking-tight leading-tight">Tus documentos son privados</h2>
              <p className="text-white/70 text-[16px] leading-relaxed mt-4 max-w-2xl">
                La foto del título, del carnet o del comprobante de estudiante la ve solo nuestro equipo, para verificarte. Nunca se muestra en tu perfil ni se comparte con nadie.
              </p>
              <Link to="/politica-de-privacidad" className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-semibold text-[#4DB6AC] hover:text-white transition-colors">
                Leer la política de privacidad <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-[32px] bg-white/10 border border-white/15 flex items-center justify-center mx-auto">
              <Lock className="w-12 h-12 md:w-16 md:h-16 text-[#4DB6AC]" />
            </div>
          </div>
        </section>

        {/* BOLSA DE TRABAJO */}
        <section id="bolsa" className="scroll-mt-[140px] py-16 md:py-20 border-t border-gray-200/70">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <TituloSeccion
                etiqueta="Bolsa de trabajo"
                titulo="Del otro lado, siempre un colega real"
                bajada="Solo las cuentas verificadas pueden publicar ofertas y ver los datos de contacto. Las clínicas buscan equipo y los profesionales y estudiantes se muestran disponibles. Publicar es gratis."
              />
              <Link to="/bolsa-de-trabajo" className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
                <Briefcase className="w-4 h-4" /> Ver la Bolsa de trabajo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { Icono: Hospital, titulo: 'Clínicas', texto: 'Publican sus búsquedas y reciben postulaciones.' },
                { Icono: Stethoscope, titulo: 'Profesionales', texto: 'Se postulan o se marcan disponibles.' },
                { Icono: GraduationCap, titulo: 'Estudiantes', texto: 'Se postulan a búsquedas de asistente.' },
                { Icono: ShieldCheck, titulo: 'Contacto seguro', texto: 'Solo lo ven cuentas verificadas.' }
              ].map(({ Icono, titulo, texto }) => (
                <div key={titulo} className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
                  <Icono className="w-6 h-6 text-[#2D6A6A] mb-3" />
                  <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px]">{titulo}</h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed mt-1">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CIERRE */}
        <section className="pb-20">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_50px_rgba(0,0,0,0.06)] p-8 md:p-12 text-center">
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[26px] md:text-[32px] tracking-tight">¿Sos veterinario/a, tenés una clínica o estudiás veterinaria?</h2>
            <p className="text-[#666666] text-[16px] mt-3 max-w-xl mx-auto">Sumate a El Portal: armá tu perfil y aparecé en la Cartilla.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-7">
              <Link to="/Login?registro=elegir" className="inline-flex items-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-7 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
                Crear mi cuenta <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/Cartilla" className="inline-flex items-center gap-2 bg-[#F4F7F7] hover:bg-[#E8EFEF] text-[#1A3D3D] px-7 py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
                Buscar un profesional
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
