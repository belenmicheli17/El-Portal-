import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Clock, Lock, Search, MapPin, MessageCircle, Stethoscope, Hospital,
  GraduationCap, Briefcase, ArrowRight, UserCheck, UserPlus, FileCheck2, BadgeCheck,
  Quote, ChevronDown
} from 'lucide-react';
import { DIAS_DE_VIGENCIA } from '../data/bolsaOpciones';

// Página "Quiénes somos y cómo funciona". Funciona con pestañas (las pills de arriba):
// cada una muestra su contenido y, abajo, sus preguntas frecuentes.
// La pestaña elegida queda en la dirección (?seccion=...), así se puede compartir el link.
// /como-funciona abre directo la pestaña "Cómo funciona".

const PESTANAS = [
  { id: 'quienes-somos', label: 'Quiénes somos' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'bolsa', label: 'Bolsa de trabajo' }
];

// Recorrido de una cuenta, de la inscripción a la Cartilla
const PASOS = [
  { Icono: UserPlus, titulo: 'Te registrás', texto: 'Elegís si sos profesional, clínica o estudiante.' },
  { Icono: FileCheck2, titulo: 'Subís tus datos', texto: 'Tu matrícula y la foto del título, carnet o comprobante.' },
  { Icono: UserCheck, titulo: 'Lo revisamos a mano', texto: 'Una persona de nuestro equipo mira cada solicitud.', destacado: '24 a 48 hs' },
  { Icono: BadgeCheck, titulo: 'Tu perfil sale', texto: 'Aparece en la Cartilla con el sello de verificado.' }
];

// Qué pedimos según el tipo de cuenta
const TIPOS = {
  profesional: { label: 'Profesionales', Icono: Stethoscope, pedimos: ['Matrícula provincial o nacional', 'Foto del título o carnet'], nota: 'El perfil aparece en la Cartilla recién cuando queda verificado.' },
  clinica: { label: 'Clínicas', Icono: Hospital, pedimos: ['Matrícula del director/a técnico/a', 'Foto de su título o carnet', 'Ubicación desde Google Maps'], nota: 'La dirección sale de Google, así que la ubicación es la real.' },
  alumnx: { label: 'Estudiantes', Icono: GraduationCap, pedimos: ['Facultad donde cursa', 'Comprobante de que está cursando'], nota: 'No aparecen en la Cartilla: su perfil se comparte por link y pueden postularse como asistentes.' }
};

// Preguntas frecuentes de cada pestaña
const PREGUNTAS = {
  'quienes-somos': [
    { p: '¿Qué es El Portal Veterinario?', r: 'Una red solo para el sector veterinario: profesionales, clínicas y estudiantes con perfiles verificados, y una Cartilla donde los tutores de mascotas los encuentran.' },
    { p: '¿Tiene costo?', r: 'Crear tu perfil y aparecer en la Cartilla es gratis. Buscar profesionales también.' },
    { p: '¿Cómo me comunico con ustedes?', r: 'Escribinos a portalveterinario.ar@gmail.com o por Instagram. Te respondemos nosotros, no un sistema automático.' }
  ],
  'como-funciona': [
    { p: '¿Quién ve la foto de mi título?', r: 'Solo nuestro equipo, para verificarte. Nunca se muestra en tu perfil ni se comparte con nadie.' },
    { p: '¿Cuánto tarda la verificación?', r: 'En general 24 a 48 horas, de lunes a viernes. Te avisamos por mail cuando está lista, o si falta corregir algo.' },
    { p: '¿Qué pasa si mis datos no coinciden?', r: 'Te escribimos para contarte qué falta y lo podés corregir desde tu cuenta.' },
    { p: 'Soy tutor/a: ¿tengo que registrarme?', r: 'No. La Cartilla es abierta: buscás, mirás los perfiles y contactás directo por WhatsApp o mail.' }
  ],
  bolsa: [
    { p: '¿Publicar cuesta?', r: 'No, publicar en la Bolsa de trabajo es gratis.' },
    { p: '¿Quién ve mis datos de contacto?', r: 'Solo las cuentas verificadas. Así, del otro lado siempre hay un colega o una clínica real.' },
    { p: '¿Cuánto dura una publicación?', r: `${DIAS_DE_VIGENCIA} días. Antes de que venza la podés renovar desde «Mis publicaciones».` },
    { p: '¿Los estudiantes pueden postularse?', r: 'Sí, a las búsquedas de asistente.' }
  ]
};

// Título de sección con la línea decorativa de la guía de estilo (40 x 3 px)
function TituloSeccion({ etiqueta, titulo, bajada, centrado = false }) {
  return (
    <div className={`mb-10 ${centrado ? 'text-center' : ''}`}>
      <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-2">{etiqueta}</p>
      <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[38px] tracking-tight leading-tight">{titulo}</h2>
      <div className={`w-10 h-[3px] bg-[#2D6A6A] rounded-full mt-3 ${centrado ? 'mx-auto' : ''}`} />
      {bajada && <p className={`text-[#666666] text-[16px] leading-relaxed mt-4 max-w-2xl ${centrado ? 'mx-auto' : ''}`}>{bajada}</p>}
    </div>
  );
}

// Preguntas frecuentes (acordeón: se abre una a la vez)
function PreguntasFrecuentes({ preguntas }) {
  const [abierta, setAbierta] = useState(0);
  return (
    <section className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <h2 className="text-center font-['Montserrat'] font-black text-[#1A3D3D] text-[26px] md:text-[32px] tracking-tight mb-8">Preguntas frecuentes</h2>
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm divide-y divide-gray-100 px-6 md:px-8">
        {preguntas.map(({ p, r }, i) => (
          <div key={p}>
            <button type="button" onClick={() => setAbierta(abierta === i ? -1 : i)} aria-expanded={abierta === i} className="w-full flex items-center justify-between gap-4 py-5 text-left">
              <span className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] md:text-[17px]">{p}</span>
              <ChevronDown className={`w-5 h-5 text-[#2D6A6A] shrink-0 transition-transform ${abierta === i ? 'rotate-180' : ''}`} />
            </button>
            {abierta === i && <p className="pb-5 -mt-1 text-[15px] md:text-[16px] text-[#666666] leading-relaxed">{r}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Contenido de cada pestaña ----------

function QuienesSomos() {
  return (
    <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-20 text-center">
      <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-6">Quiénes somos</p>
      <Quote className="w-10 h-10 text-[#4DB6AC] mx-auto" />
      <p className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[22px] md:text-[30px] leading-snug mt-6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, cras mattis consectetur purus.
      </p>
      <p className="text-[16px] md:text-[17px] text-[#666666] leading-relaxed mt-6 max-w-2xl mx-auto">
        Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper. Maecenas faucibus mollis interdum, sed posuere consectetur est at lobortis.
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center font-['Montserrat'] font-black text-[#2D6A6A] text-[22px]">B</div>
        <div className="text-left">
          <p className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px]">Lorem Ipsum</p>
          <p className="text-[14px] text-[#666666]">Creadora de El Portal Veterinario</p>
        </div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  const [tipo, setTipo] = useState('profesional');
  const elegido = TIPOS[tipo];
  return (
    <>
      {/* De la inscripción a la Cartilla */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-20">
        <TituloSeccion etiqueta="Cómo verificamos" titulo="De la inscripción a la Cartilla" bajada="Cada cuenta pasa por una revisión antes de hacerse pública." centrado />
        <ol className="grid md:grid-cols-4 gap-4">
          {PASOS.map(({ Icono, titulo, texto, destacado }, i) => (
            <li key={titulo} className="relative bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
              {/* Flecha hacia el paso siguiente (solo PC) */}
              {i < PASOS.length - 1 && (
                <span className="hidden md:flex absolute top-1/2 -right-[14px] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#F4F7F7] border border-gray-200 items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-[#2D6A6A]" />
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#2D6A6A]/10 flex items-center justify-center"><Icono className="w-6 h-6 text-[#2D6A6A]" /></div>
                <span className="font-['Montserrat'] font-black text-[#1A3D3D]/10 text-[40px] leading-none">{i + 1}</span>
              </div>
              <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[18px] mt-5">{titulo}</h3>
              <p className="text-[15px] text-[#666666] leading-relaxed mt-2">{texto}</p>
              {destacado && (
                <span className="inline-flex items-center gap-1.5 mt-4 bg-[#4DB6AC]/15 text-[#1A3D3D] text-[12px] font-bold px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-[#2D6A6A]" /> {destacado}
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Qué pedimos, según el tipo de cuenta */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10 grid md:grid-cols-[260px_1fr] gap-8">
          <div>
            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[22px]">¿Qué pedimos?</h3>
            <p className="text-[14px] text-[#666666] mt-2">Depende del tipo de cuenta.</p>
            <div className="flex md:flex-col gap-2 mt-6 overflow-x-auto">
              {Object.entries(TIPOS).map(([id, t]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTipo(id)}
                  className={`shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[14px] font-semibold text-left transition-colors ${tipo === id ? 'bg-[#1A3D3D] text-white' : 'bg-[#F4F7F7] text-[#1A3D3D] hover:bg-[#E8EFEF]'}`}
                >
                  <t.Icono className="w-5 h-5" /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#F4F7F7] rounded-[24px] p-7 md:p-9">
            <ul className="space-y-4">
              {elegido.pedimos.map((p, i) => (
                <li key={p} className="flex items-center gap-4">
                  <span className="w-9 h-9 rounded-xl bg-white text-[#2D6A6A] font-['Montserrat'] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-[17px] text-[#1A3D3D] font-medium">{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 pt-5 border-t border-gray-200 text-[15px] text-[#666666]">{elegido.nota}</p>
          </div>
        </div>
      </section>

      {/* Para tutores: encontrá al profesional indicado */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-20">
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
          ].map(({ Icono, titulo, texto }) => (
            <div key={titulo} className="bg-white rounded-[24px] border border-gray-100 p-7 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#2D6A6A]/10 flex items-center justify-center mb-5"><Icono className="w-6 h-6 text-[#2D6A6A]" /></div>
              <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[19px] mb-2">{titulo}</h3>
              <p className="text-[15px] text-[#666666] leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
        <Link to="/Cartilla" className="inline-flex items-center gap-2 mt-8 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-colors">
          <MapPin className="w-4 h-4" /> Buscar en la Cartilla
        </Link>
      </section>
    </>
  );
}

function Bolsa() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-20">
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

      <section className="max-w-6xl mx-auto px-6 pt-16">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_50px_rgba(0,0,0,0.06)] p-8 md:p-12 text-center">
          <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[24px] md:text-[32px] tracking-tight">¿Sos veterinario/a, tenés una clínica o estudiás veterinaria?</h2>
          <p className="text-[#666666] text-[16px] mt-3 max-w-xl mx-auto">Sumate a El Portal: armá tu perfil, aparecé en la Cartilla y usá la Bolsa de trabajo.</p>
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
    </>
  );
}

export default function Nosotros() {
  const location = useLocation();
  const navigate = useNavigate();

  // Pestaña activa: la de la dirección (?seccion=), o "Cómo funciona" si entraron por /como-funciona
  const pedida = new URLSearchParams(location.search).get('seccion')
    || (location.pathname.toLowerCase() === '/como-funciona' ? 'como-funciona' : 'quienes-somos');
  const activa = PESTANAS.some((p) => p.id === pedida) ? pedida : 'quienes-somos';

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const elegir = (id) => {
    // Cambia la pestaña sin sumar pasos al botón "atrás" del navegador
    navigate({ pathname: '/nosotros', search: id === 'quienes-somos' ? '' : `?seccion=${id}` }, { replace: true });
  };

  return (
    <div className="bg-[#F4F7F7] font-['Inter'] antialiased text-[#333333] pb-4">

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

      {/* PESTAÑAS (quedan fijas debajo de la barra de arriba al bajar) */}
      <nav className="sticky top-[72px] z-40 bg-[#F4F7F7]/90 backdrop-blur-md border-b border-gray-200/70" aria-label="Secciones">
        <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto" role="tablist">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={activa === p.id}
              onClick={() => elegir(p.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${activa === p.id ? 'bg-[#1A3D3D] text-white' : 'bg-white text-[#1A3D3D] border border-gray-200 hover:border-[#2D6A6A]/50'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Contenido de la pestaña elegida + sus preguntas frecuentes */}
      {activa === 'quienes-somos' && <QuienesSomos />}
      {activa === 'como-funciona' && <ComoFunciona />}
      {activa === 'bolsa' && <Bolsa />}
      {/* key: al cambiar de pestaña, las preguntas arrancan con la primera abierta */}
      <PreguntasFrecuentes key={activa} preguntas={PREGUNTAS[activa]} />
    </div>
  );
}
