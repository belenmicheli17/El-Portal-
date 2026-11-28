import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import {
  ShieldCheck, Clock, Lock, Search, MapPin, MessageCircle, Stethoscope, Hospital,
  GraduationCap, Briefcase, ArrowRight, UserCheck, BadgeCheck, Quote, ChevronDown,
  ImageIcon, Check, X, Award, Flag, Link2, Store, BookOpen, FileText, Upload
} from 'lucide-react';
import { db } from '../firebase';
import { DIAS_DE_VIGENCIA } from '../data/bolsaOpciones';

// Página "Quiénes somos y cómo funciona" de Portal Veterinario. Funciona con pestañas (las pills):
// cada una muestra su contenido; abajo van las preguntas frecuentes, separadas por tipo de persona.
// La pestaña queda en la dirección (?seccion=...). /como-funciona abre "Cómo funciona".
// Cada pregunta tiene su propio link (#pregunta-...), para mandársela a alguien.

const NOMBRE = 'Portal Veterinario';

const PESTANAS = [
  { id: 'quienes-somos', label: 'Quiénes somos' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'bolsa', label: 'Bolsa de trabajo' }
];

// Preguntas frecuentes por tipo de persona (cada pestaña abre con el grupo que más le corresponde)
const GRUPOS_PREGUNTAS = [
  {
    id: 'tutores', label: 'Tutores', Icono: Search,
    preguntas: [
      { id: 'tutor-gratis', p: '¿Es gratis buscar? ¿Tengo que registrarme?', r: 'Es gratis y no hace falta registrarte. Buscás en la Cartilla, mirás los perfiles y contactás directo por WhatsApp o mail.' },
      { id: 'tutor-real', p: '¿Cómo sé que el profesional es real?', r: 'Cada perfil pasa por una revisión: una persona de nuestro equipo mira su matrícula y la foto de su título o carnet antes de que aparezca en la Cartilla.' },
      { id: 'tutor-guardias', p: '¿Hay guardias o atención de urgencia?', r: 'Sí. En la Cartilla podés filtrar clínicas con guardia 24 hs y profesionales que hacen urgencias a domicilio.' },
      { id: 'tutor-exoticos', p: '¿Atienden exóticos o animales de campo?', r: 'Algunos sí. En la Cartilla podés filtrar por tipo de animal y ver qué especies atiende cada profesional o clínica.' },
      { id: 'tutor-zona', p: 'No encuentro a nadie en mi zona, ¿qué hago?', r: 'Estamos sumando profesionales todos los días. Mientras tanto, probá con zonas cercanas, o buscá quien atienda a domicilio o haga consultas virtuales.' }
    ]
  },
  {
    id: 'profesionales', label: 'Profesionales', Icono: Stethoscope,
    preguntas: [
      { id: 'pro-gratis', p: '¿Es gratis? ¿Va a dejar de serlo?', r: `Por ahora, sumarte a ${NOMBRE} es gratis.` },
      { id: 'pro-gano', p: '¿Qué gano estando acá? ¿Me contacta gente de verdad?', r: 'Aparecés en la Cartilla, donde tutores de mascotas buscan profesionales y ya los están contactando. Además tenés tu página para compartir y la Bolsa de trabajo.' },
      { id: 'pro-datos', p: '¿Quién ve mis datos? ¿Mi teléfono queda a la vista de cualquiera?', r: 'Vos elegís: tu WhatsApp y tu mail pueden verse para todo el público o solo para colegas con cuenta. La foto de tu título nunca se muestra.' },
      { id: 'pro-varias', p: '¿Puedo estar si trabajo en varias clínicas o hago domicilios?', r: 'Sí. Podés cargar las veterinarias donde atendés, y marcar si hacés domicilio, urgencias a domicilio o consultas virtuales.' },
      { id: 'pro-baja', p: '¿Puedo ocultar mi perfil o darme de baja?', r: 'Sí. Escribinos y lo resolvemos.' },
      { id: 'pro-diferencia', p: '¿En qué se diferencia de Instagram o de Google?', r: 'Acá te buscan por especialidad, zona y tipo de animal, entre perfiles verificados. Y tu página está pensada para que Google también la encuentre.' }
    ]
  },
  {
    id: 'clinicas', label: 'Clínicas', Icono: Hospital,
    preguntas: [
      { id: 'cli-sedes', p: '¿Puedo cargar varias sedes?', r: 'Sí, cada sede con su dirección, y aparecen en la Cartilla según la zona.' },
      { id: 'cli-equipo', p: '¿Puedo sumar a mi equipo de veterinarios?', r: 'Sí, desde el editor de la clínica podés cargar a tu equipo.' },
      { id: 'cli-busqueda', p: '¿Cómo publico una búsqueda y quién se postula?', r: 'Desde la Bolsa de trabajo publicás la búsqueda. Se postulan profesionales y estudiantes verificados, y ves sus datos para contactarlos.' },
      { id: 'cli-google', p: '¿Sirve para que me encuentren en Google?', r: 'Sí. La página de la clínica está preparada para aparecer en Google, y te recomendamos sumar su link en la ficha de Google Maps.' }
    ]
  },
  {
    id: 'estudiantes', label: 'Estudiantes', Icono: GraduationCap,
    preguntas: [
      { id: 'est-sirve', p: '¿Para qué me sirve si todavía no me recibí?', r: 'Para armar tu perfil, mostrar tu experiencia y postularte a búsquedas de asistente en la Bolsa de trabajo.' },
      { id: 'est-recibo', p: '¿Qué pasa con mi perfil cuando me reciba?', r: 'Nos avisás y lo pasamos a perfil profesional, sin empezar de cero.' },
      { id: 'est-busquedas', p: '¿A qué búsquedas me puedo postular?', r: 'A las de asistente (alumno/a) de la Bolsa de trabajo.' }
    ]
  },
  {
    id: 'bolsa', label: 'Bolsa de trabajo', Icono: Briefcase,
    preguntas: [
      { id: 'bolsa-cuesta', p: '¿Publicar cuesta?', r: 'No, publicar en la Bolsa de trabajo es gratis.' },
      { id: 'bolsa-contacto', p: '¿Quién ve mis datos de contacto?', r: 'Solo las cuentas verificadas. Así, del otro lado siempre hay un colega o una clínica real.' },
      { id: 'bolsa-dura', p: '¿Cuánto dura una publicación?', r: `${DIAS_DE_VIGENCIA} días. Antes de que venza la podés renovar desde «Mis publicaciones».` }
    ]
  }
];

const GRUPO_POR_PESTANA = { 'quienes-somos': 'tutores', 'como-funciona': 'profesionales', bolsa: 'bolsa' };

// Qué pedimos según el tipo de cuenta
const TIPOS = {
  profesional: { label: 'Profesionales', Icono: Stethoscope, pedimos: ['Matrícula provincial o nacional', 'Foto del título o carnet'], nota: 'El perfil aparece en la Cartilla recién cuando queda verificado.' },
  clinica: { label: 'Clínicas', Icono: Hospital, pedimos: ['Matrícula del director/a técnico/a', 'Foto de su título o carnet', 'Ubicación desde Google Maps'], nota: 'La dirección sale de Google, así que la ubicación es la real.' },
  alumnx: { label: 'Estudiantes', Icono: GraduationCap, pedimos: ['Facultad donde cursa', 'Comprobante de que está cursando'], nota: 'No aparecen en la Cartilla: su perfil se comparte por link y pueden postularse como asistentes.' }
};

// ---------- Piezas reutilizables ----------

// Avisa cuando el bloque entra en pantalla (una sola vez)
function useAlVer() {
  const ref = useRef(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisto(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visto];
}

// Número que cuenta hasta su valor cuando aparece
function Contador({ valor }) {
  const [ref, visto] = useAlVer();
  const [mostrado, setMostrado] = useState(0);
  useEffect(() => {
    if (!visto || !valor) return undefined;
    let cuadro;
    const inicio = performance.now();
    const duracion = 1200;
    const paso = (ahora) => {
      const avance = Math.min(1, (ahora - inicio) / duracion);
      setMostrado(Math.round(valor * (1 - Math.pow(1 - avance, 3))));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [visto, valor]);
  return <span ref={ref}>{valor ? mostrado : '—'}</span>;
}

// Números reales: perfiles visibles en la Cartilla y provincias con al menos uno
function useNumeros() {
  const [numeros, setNumeros] = useState({ profesionales: 0, clinicas: 0, provincias: 0 });
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [pros, clis] = await Promise.all([getDocs(collection(db, 'profesionales')), getDocs(collection(db, 'clinicas'))]);
        const visibles = (snap) => snap.docs.map((d) => d.data()).filter((p) => p.visible !== false && (p.nombre || '').trim());
        const listaPros = visibles(pros);
        const listaClis = visibles(clis);
        const provincias = new Set([...listaPros, ...listaClis].map((p) => (p.provincia || '').trim()).filter(Boolean));
        if (!cancelado) setNumeros({ profesionales: listaPros.length, clinicas: listaClis.length, provincias: provincias.size });
      } catch (error) {
        console.warn('No se pudieron contar los perfiles:', error?.code || error);
      }
    })();
    return () => { cancelado = true; };
  }, []);
  return numeros;
}

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

// Sello "Verificado" con el mismo estilo que en los perfiles
function Sello({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 bg-[#2D6A6A] text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-md ${className}`}>
      <BadgeCheck className="w-4 h-4" /> Verificado
    </span>
  );
}

// ---------- Preguntas frecuentes ----------

function PreguntasFrecuentes({ grupoInicial }) {
  const location = useLocation();
  const desdeLink = location.hash.startsWith('#pregunta-') ? location.hash.slice(10) : '';
  const grupoDelLink = GRUPOS_PREGUNTAS.find((g) => g.preguntas.some((q) => q.id === desdeLink))?.id;
  const [grupo, setGrupo] = useState(grupoDelLink || grupoInicial);
  const [abierta, setAbierta] = useState(desdeLink || '');
  const [copiada, setCopiada] = useState('');
  const elegido = GRUPOS_PREGUNTAS.find((g) => g.id === grupo) || GRUPOS_PREGUNTAS[0];

  // Si llegaron con el link de una pregunta, bajamos hasta ella
  useEffect(() => {
    if (!desdeLink) return undefined;
    const t = setTimeout(() => document.getElementById(`pregunta-${desdeLink}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    return () => clearTimeout(t);
  }, [desdeLink]);

  const copiarLink = async (id) => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#pregunta-${id}`;
    try { await navigator.clipboard.writeText(url); setCopiada(id); setTimeout(() => setCopiada(''), 2000); } catch { /* sin portapapeles */ }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-16 md:py-20" id="preguntas">
      <h2 className="text-center font-['Montserrat'] font-black text-[#1A3D3D] text-[26px] md:text-[32px] tracking-tight">Preguntas frecuentes</h2>
      <div className="flex flex-wrap justify-center gap-2 mt-6 mb-8">
        {GRUPOS_PREGUNTAS.map(({ id, label, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setGrupo(id); setAbierta(''); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${grupo === id ? 'bg-[#2D6A6A] text-white' : 'bg-white text-[#1A3D3D] border border-gray-200 hover:border-[#2D6A6A]/50'}`}
          >
            <Icono className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm divide-y divide-gray-100 px-6 md:px-8">
        {elegido.preguntas.map(({ id, p, r }) => {
          const estaAbierta = abierta === id;
          return (
            <div key={id} id={`pregunta-${id}`} className="scroll-mt-40">
              <button type="button" onClick={() => setAbierta(estaAbierta ? '' : id)} aria-expanded={estaAbierta} className="w-full flex items-center justify-between gap-4 py-5 text-left">
                <span className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] md:text-[17px]">{p}</span>
                <ChevronDown className={`w-5 h-5 text-[#2D6A6A] shrink-0 transition-transform duration-300 ${estaAbierta ? 'rotate-180' : ''}`} />
              </button>
              {/* Se abre con animación (el alto pasa de 0 a su tamaño) */}
              <div className={`grid transition-all duration-300 ease-out ${estaAbierta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <p className="text-[15px] md:text-[16px] text-[#666666] leading-relaxed">{r}</p>
                  <button type="button" onClick={() => copiarLink(id)} className="inline-flex items-center gap-1.5 mt-3 mb-5 text-[12px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]">
                    {copiada === id ? <><Check className="w-3.5 h-3.5" /> Link copiado</> : <><Link2 className="w-3.5 h-3.5" /> Copiar link de esta respuesta</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Pestaña: Quiénes somos ----------

function QuienesSomos() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-20 text-center">
        <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-8">Quiénes somos</p>

        {/* Lugar para la foto (horizontal). Cuando esté, va acá. */}
        <div className="relative aspect-[16/9] w-full rounded-[32px] bg-white border-2 border-dashed border-[#2D6A6A]/25 flex flex-col items-center justify-center gap-3 text-[#2D6A6A]/50 overflow-hidden">
          <ImageIcon className="w-12 h-12" />
          <span className="text-[14px] font-semibold">Foto</span>
        </div>

        <Quote className="w-10 h-10 text-[#4DB6AC] mx-auto mt-12" />
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
            <p className="text-[14px] text-[#666666]">Creadora de {NOMBRE}</p>
          </div>
        </div>
      </section>

      {/* En qué estamos trabajando (la página se siente viva) */}
      <section className="max-w-4xl mx-auto px-6 pt-16">
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
          <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-4">En qué estamos trabajando</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { Icono: Store, titulo: 'Cartilla de proveedores', texto: 'Laboratorios, distribuidoras y servicios para veterinarias.' },
              { Icono: BookOpen, titulo: 'Cursos y capacitaciones', texto: 'Para seguir formándote dentro de la misma red.' }
            ].map(({ Icono, titulo, texto }) => (
              <div key={titulo} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F7F7] flex items-center justify-center shrink-0"><Icono className="w-5 h-5 text-[#2D6A6A]" /></div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[15px]">{titulo} <span className="ml-1 text-[11px] font-bold uppercase tracking-wider text-[#4DB6AC]">Próximamente</span></h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed mt-0.5">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ---------- Pestaña: Cómo funciona ----------

// Mini dibujos de cada paso (muestran en vez de contar)
const MiniPaso = {
  registro: () => (
    <div className="space-y-1.5">
      {['Profesional', 'Clínica', 'Estudiante'].map((t, i) => (
        <div key={t} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${i === 0 ? 'bg-[#2D6A6A] text-white' : 'bg-white text-[#1A3D3D] border border-gray-200'}`}>
          <span className={`w-3 h-3 rounded-full border-2 ${i === 0 ? 'border-white bg-white/40' : 'border-gray-300'}`} /> {t}
        </div>
      ))}
    </div>
  ),
  datos: () => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-[#1A3D3D]"><FileText className="w-3.5 h-3.5 text-[#2D6A6A]" /> Matrícula <Check className="w-3.5 h-3.5 ml-auto text-[#2D6A6A]" /></div>
      <div className="flex items-center gap-2 bg-white border border-dashed border-[#2D6A6A]/50 rounded-lg px-2.5 py-1.5 text-[11px] text-[#2D6A6A] font-semibold"><Upload className="w-3.5 h-3.5" /> Subir título</div>
    </div>
  ),
  revision: () => (
    <div className="space-y-1.5">
      {['Nombre coincide', 'Matrícula cargada', 'Título legible'].map((t) => (
        <div key={t} className="flex items-center gap-2 text-[11px] text-[#1A3D3D]"><span className="w-4 h-4 rounded-full bg-[#4DB6AC]/20 flex items-center justify-center"><Check className="w-3 h-3 text-[#2D6A6A]" /></span>{t}</div>
      ))}
    </div>
  ),
  publicado: () => (
    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-[#E8EFEF] flex items-center justify-center text-[11px] font-black text-[#2D6A6A]">MG</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[#1A3D3D] flex items-center gap-1 truncate">Dra. María Gómez <BadgeCheck className="w-3.5 h-3.5 text-[#2D6A6A] shrink-0" /></p>
        <p className="text-[10px] text-[#666666]">En la Cartilla</p>
      </div>
    </div>
  )
};

const PASOS = [
  { dibujo: 'registro', titulo: 'Te registrás', texto: 'Elegís si sos profesional, clínica o estudiante.' },
  { dibujo: 'datos', titulo: 'Subís tus datos', texto: 'Tu matrícula y la foto del título, carnet o comprobante.' },
  { dibujo: 'revision', titulo: 'Lo revisamos a mano', texto: 'Una persona de nuestro equipo mira cada solicitud.', destacado: '24 a 48 hs' },
  { dibujo: 'publicado', titulo: 'Tu perfil sale', texto: 'Aparece en la Cartilla con el sello de verificado.' }
];

// Los pasos se encienden uno por uno al bajar (antes se ven apagados, nunca invisibles)
function Pasos() {
  const [ref, visto] = useAlVer();
  return (
    <ol ref={ref} className="grid md:grid-cols-4 gap-4">
      {PASOS.map(({ dibujo, titulo, texto, destacado }, i) => {
        const Dibujo = MiniPaso[dibujo];
        return (
          <li
            key={titulo}
            style={{ transitionDelay: `${i * 180}ms` }}
            className={`relative bg-white rounded-[24px] border shadow-sm p-5 transition-all duration-700 ${visto ? 'opacity-100 translate-y-0 border-[#2D6A6A]/25 shadow-[0_10px_30px_rgba(26,61,61,0.08)]' : 'opacity-50 translate-y-2 border-gray-100'}`}
          >
            {i < PASOS.length - 1 && (
              <span className="hidden md:flex absolute top-1/2 -right-[14px] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#F4F7F7] border border-gray-200 items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-[#2D6A6A]" />
              </span>
            )}
            <div className="bg-[#F4F7F7] rounded-2xl p-3 h-[118px] flex flex-col justify-center"><Dibujo /></div>
            <p className="mt-4 text-[12px] font-bold text-[#4DB6AC]">PASO {i + 1}</p>
            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[18px] mt-1">{titulo}</h3>
            <p className="text-[15px] text-[#666666] leading-relaxed mt-2">{texto}</p>
            {destacado && (
              <span className="inline-flex items-center gap-1.5 mt-3 bg-[#4DB6AC]/15 text-[#1A3D3D] text-[12px] font-bold px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-[#2D6A6A]" /> {destacado}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Un documento de ejemplo (matrícula o título)
function Documento({ titulo, filas, className }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-[0_10px_30px_rgba(26,61,61,0.08)] p-5 w-full max-w-[300px] ${className}`}>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#666666] mb-3">{titulo}</p>
      <dl className="space-y-2.5">
        {filas.map(([k, v, resaltado]) => (
          <div key={k}>
            <dt className="text-[11px] text-gray-400">{k}</dt>
            <dd className={`text-[14px] font-semibold text-[#1A3D3D] ${resaltado ? 'bg-[#4DB6AC]/15 border border-[#4DB6AC]/40 rounded-md px-2 py-0.5 -mx-2' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Dibujo de la revisión: matrícula y título con el mismo nombre, y el sello encima
function DibujoRevision() {
  return (
    <div>
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-0 pt-4 pb-20">
        <Documento titulo="Matrícula" className="sm:-rotate-2 sm:translate-x-4" filas={[['Nombre', 'María Gómez', true], ['Matrícula', 'MP 1234'], ['Provincia', 'Buenos Aires']]} />
        <Documento titulo="Título" className="sm:rotate-2 sm:-translate-x-4 sm:translate-y-6" filas={[['Otorgado a', 'María Gómez', true], ['Título', 'Médica Veterinaria'], ['Universidad', 'Universidad de Buenos Aires']]} />
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rotate-[-6deg] border-2 border-[#2D6A6A] text-[#2D6A6A] bg-white/90 font-['Montserrat'] font-black tracking-widest text-[15px] px-4 py-1.5 rounded-lg shadow-md">
          VERIFICADO ✓
        </span>
      </div>
      <p className="text-center text-[13px] text-[#666666] mt-2">Ejemplo con datos ficticios. Lo resaltado tiene que coincidir en los dos documentos.</p>
    </div>
  );
}

function ComoFunciona() {
  const [tipo, setTipo] = useState('profesional');
  const elegido = TIPOS[tipo];
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-20">
        <TituloSeccion etiqueta="Cómo verificamos" titulo="De la inscripción a la Cartilla" bajada="Cada cuenta pasa por una revisión antes de hacerse pública." centrado />
        <Pasos />
      </section>

      {/* Así revisamos: honesto y mostrado */}
      <section className="max-w-6xl mx-auto px-6 pt-16">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div>
            <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#2D6A6A] mb-2">Así revisamos</p>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[26px] md:text-[32px] tracking-tight leading-tight">Persona por persona</h2>
            <p className="text-[16px] text-[#666666] leading-relaxed mt-4">
              No hay una base de datos oficial conectada para validar matrículas en línea. Por eso lo hacemos nosotros: comparamos que el nombre de la matrícula coincida con el del título o carnet. Si no pasa esta revisión, no aparece en {NOMBRE}.
            </p>
            <p className="text-[14px] text-[#666666] leading-relaxed mt-4 flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#2D6A6A] shrink-0 mt-0.5" /> Los documentos quedan en una carpeta privada: solo los ve nuestro equipo, nunca se muestran en tu perfil.
            </p>
          </div>
          <DibujoRevision />
        </div>
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
          <div key={tipo} className="bg-[#F4F7F7] rounded-[24px] p-7 md:p-9 animate-[aparecer_300ms_ease-out]">
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

      {/* Qué significa el sello */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
            <div className="mb-3"><Sello /></div>
            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[17px] flex items-center gap-2"><Check className="w-5 h-5 text-[#2D6A6A]" /> Significa</h3>
            <p className="text-[15px] text-[#666666] leading-relaxed mt-2">Que la persona detrás del perfil tiene matrícula y que ese título es suyo.</p>
          </div>
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
            <div className="mb-3"><Sello className="opacity-60" /></div>
            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[17px] flex items-center gap-2"><X className="w-5 h-5 text-[#FF9800]" /> No significa</h3>
            <p className="text-[15px] text-[#666666] leading-relaxed mt-2">Que evaluemos cómo atiende ni que garanticemos un resultado.</p>
          </div>
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[12px] font-bold px-3 py-1.5 rounded-full"><Award className="w-4 h-4" /> Socio fundador</span>
            </div>
            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[17px]">El sello «Fundador»</h3>
            <p className="text-[15px] text-[#666666] leading-relaxed mt-2">Lo tienen los primeros profesionales y clínicas que se sumaron a {NOMBRE}. No es un grado ni una especialidad.</p>
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

      {/* ¿Viste algo raro en un perfil? */}
      <section className="max-w-6xl mx-auto px-6 pt-12">
        <div className="bg-[#FFF6E6] border border-[#FF9800]/20 rounded-[24px] p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0"><Flag className="w-5 h-5 text-[#FF9800]" /></div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[17px]">¿Viste algo raro en un perfil?</h3>
              <p className="text-[15px] text-[#666666] mt-1">Escribinos y lo revisamos. Si un perfil no cumple, lo sacamos.</p>
            </div>
          </div>
          <a href="mailto:portalveterinario.ar@gmail.com?subject=Reporte%20de%20perfil" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-[#FF9800]/50 text-[#1A3D3D] px-5 py-3 rounded-2xl text-[14px] font-semibold transition-colors shrink-0">
            Reportar un perfil
          </a>
        </div>
      </section>
    </>
  );
}

// ---------- Pestaña: Bolsa de trabajo ----------

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
          <p className="text-[#666666] text-[16px] mt-3 max-w-xl mx-auto">Sumate a {NOMBRE}: armá tu perfil, aparecé en la Cartilla y usá la Bolsa de trabajo.</p>
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

// ---------- Página ----------

export default function Nosotros() {
  const location = useLocation();
  const navigate = useNavigate();
  const numeros = useNumeros();
  const menuRef = useRef(null);

  const pedida = new URLSearchParams(location.search).get('seccion')
    || (location.pathname.toLowerCase() === '/como-funciona' ? 'como-funciona' : 'quienes-somos');
  const activa = PESTANAS.some((p) => p.id === pedida) ? pedida : 'quienes-somos';

  useEffect(() => { if (!location.hash) window.scrollTo(0, 0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const elegir = (id) => {
    navigate({ pathname: '/nosotros', search: id === 'quienes-somos' ? '' : `?seccion=${id}` }, { replace: true });
    // Si ya había bajado, queda justo debajo de las pestañas (no salta arriba de todo)
    const menu = menuRef.current;
    if (menu && window.scrollY > menu.offsetTop - 72) window.scrollTo({ top: menu.offsetTop - 72, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#F4F7F7] font-['Inter'] antialiased text-[#333333] pb-4">
      <style>{'@keyframes aparecer { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }'}</style>

      {/* ENCABEZADO */}
      <header className="bg-[#1A3D3D] relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[520px] h-[520px] bg-[#2D6A6A]/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[-10%] w-[420px] h-[420px] bg-[#4DB6AC]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-20 md:pb-14 relative">
          <p className="text-[12px] font-bold tracking-[0.15em] uppercase text-[#4DB6AC] mb-4">{NOMBRE}</p>
          <h1 className="font-['Montserrat'] font-black text-white text-[36px] md:text-[52px] tracking-tighter leading-[1.05] max-w-3xl">
            Una red solo para el sector veterinario, <span className="text-[#4DB6AC]">con perfiles verificados.</span>
          </h1>
          <p className="text-white/70 text-[16px] md:text-[18px] leading-relaxed mt-5 max-w-2xl">
            Quiénes somos, cómo verificamos a cada cuenta y qué podés hacer en {NOMBRE}, seas tutor/a, profesional, clínica o estudiante.
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

          {/* Números en vivo (salen de la base: perfiles visibles en la Cartilla) */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-10 max-w-2xl">
            {[
              { valor: numeros.profesionales, texto: 'profesionales verificados' },
              { valor: numeros.clinicas, texto: 'clínicas verificadas' },
              { valor: numeros.provincias, texto: 'provincias' }
            ].map(({ valor, texto }) => (
              <div key={texto} className="bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-4">
                <p className="font-['Montserrat'] font-black text-white text-[28px] md:text-[36px] leading-none"><Contador valor={valor} /></p>
                <p className="text-white/60 text-[12px] md:text-[13px] font-medium mt-2 leading-snug">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* PESTAÑAS (fijas debajo de la barra de arriba al bajar) */}
      <nav ref={menuRef} className="sticky top-[72px] z-40 bg-[#F4F7F7]/90 backdrop-blur-md border-b border-gray-200/70" aria-label="Secciones">
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

      {/* Contenido de la pestaña (aparece con un fundido suave) */}
      <div key={activa} className="animate-[aparecer_350ms_ease-out]">
        {activa === 'quienes-somos' && <QuienesSomos />}
        {activa === 'como-funciona' && <ComoFunciona />}
        {activa === 'bolsa' && <Bolsa />}
        <PreguntasFrecuentes grupoInicial={GRUPO_POR_PESTANA[activa]} />
      </div>
    </div>
  );
}
