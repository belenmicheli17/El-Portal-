import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import {
  BookOpen,
  Briefcase,
  Package,
  FlaskConical,
  ArrowRight,
  Stethoscope,
  PawPrint,
  Users,
  ArrowDown,
  Hospital,
  Store,
  LogIn
} from "lucide-react";
import { db } from "../firebase";
// Cartelito de inicio de sesión (el mismo que se usa en el resto del sitio, con el mail de recuperar contraseña por Brevo)
import LoginDropdown from "../components/LoginDropdown";
import BarraCupos from "../components/BarraCupos";

// ── Cajita zona pública ────────────────────────────────────────────────────
const CardPublica = ({ icono: Icono, titulo, descripcion, highlight }) => (
  <>
    <a
      href="/cartilla"
      target="_blank"
      rel="noreferrer"
      className={`bg-white border rounded-[24px] isolate overflow-visible max-w-[1080px] transition-all duration-700 relative flex flex-col no-underline cursor-pointer group hover:shadow-[0_8px_24px_rgba(255,152,0,0.18)] hover:border-[#FF9800]/30 hover:-translate-y-0.5 ${
        highlight
          ? 'shadow-[0_8px_24px_rgba(255,152,0,0.18)] border-[#FF9800]/30 -translate-y-0.5'
          : 'shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-gray-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row">

        {/* — Columna izquierda: texto — */}
        <div className="flex flex-col gap-3 p-5 sm:p-8 flex-1">
          <Icono size={24} className="text-[#FF9800]" strokeWidth={2.5} />
          <div>
            <h3 className="font-['Montserrat'] font-bold text-[#FF9800] text-[19px] md:text-[18px] mb-2">{titulo}</h3>
            <p className="text-[#333333] text-[17px] md:text-[16px] font-medium leading-relaxed">{descripcion}</p>
          </div>
        </div>

        {/* — Columna derecha: mockup cartilla — */}
        <div className="w-full sm:w-[55%] h-[140px] sm:h-auto sm:max-h-[240px] shrink-0 relative overflow-hidden rounded-b-[24px] sm:rounded-b-none sm:rounded-r-[24px]">
          <img
            src="/mockup-cartilla.png"
            alt="Vista previa de la Cartilla veterinaria"
            className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
          />
          {/* Degradado suave para integrar la imagen con el texto */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        </div>

      </div>
    </a>

    {/* Hint por fuera de la caja */}
    <div className="flex items-center justify-end gap-1.5 mt-3 pr-2 text-[#FF9800]">
      <ArrowRight size={25} strokeWidth={2} className="rotate-[225deg]" />
      <span className="text-[20px] font-bold">¡Presiona para ver la cartilla!</span>
    </div>
  </>
);

// ── Cajita zona exclusiva ──────────────────────────────────────────────────
const CardExclusiva = ({ icono: Icono, titulo, descripcion, highlight }) => (
  <div className={`bg-white border rounded-[24px] isolate p-4 sm:p-6 h-full transition-all duration-700 hover:shadow-[0_8px_24px_rgba(45,106,106,0.12)] hover:border-[#2D6A6A]/30 hover:-translate-y-0.5 ${
    highlight
      ? 'shadow-[0_8px_24px_rgba(45,106,106,0.12)] border-[#2D6A6A]/30 -translate-y-0.5'
      : 'shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-gray-200'
  }`}>
    <div className="flex flex-col gap-2 sm:gap-3">
      <Icono size={20} className="text-[#2D6A6A]" strokeWidth={2.5} />
      <div>
       <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[19px] md:text-[17px] mb-1 sm:mb-2">{titulo}</h3>
<p className="text-[#333333] text-[17px] md:text-[16px] font-medium leading-relaxed">{descripcion}</p>
      </div>
    </div>
  </div>
);

// ── Selector de tipo de cuenta (igual al de Login) ─────────────────────────
const OPCIONES_CUENTA = [
  { valor: 'profesional', label: 'Soy Profesional', sub: 'Veterinario/a que busca conectar y crecer.', Icono: Stethoscope, proximamente: false },
  { valor: 'clinica', label: 'Soy una Clínica', sub: 'Institución que busca talento y visibilidad.', Icono: Hospital, proximamente: true },
  { valor: 'proveedor', label: 'Proveedor o empresa', sub: 'Ofrezco insumos mayoristas, equipamiento o servicios para los usuarios mencionados anteriormente.', Icono: Store, proximamente: true },
];

const SelectorTipoCuenta = ({ onElegir }) => (
  <div className="w-full bg-white rounded-[28px] shadow-[0_8px_32px_rgba(26,61,61,0.08)] border border-gray-100 p-6">
    <h3 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-base text-center mb-5 uppercase tracking-wider">
      ¿Qué tipo de cuenta?
    </h3>
    <div className="space-y-3">
      {OPCIONES_CUENTA.map(({ valor, label, sub, Icono, proximamente }) => (
        <div key={valor} className="relative mt-4 first:mt-0 text-left">
          {proximamente && (
            <div className="absolute -top-2.5 right-2 flex items-center gap-1.5 bg-gray-400 text-white text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full z-10">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse shrink-0"></span>
              Próximamente
            </div>
          )}
          <button
            type="button"
            disabled={proximamente}
            onClick={() => { if (!proximamente) onElegir(valor); }}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              proximamente
                ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                : 'border-[#2D6A6A]/40 hover:border-[#2D6A6A] hover:bg-[#F4F7F7] group active:scale-[0.98]'
            }`}
          >
            <div className={`p-2.5 rounded-full transition-transform ${proximamente ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 group-hover:scale-110'}`}>
              <Icono size={18} />
            </div>
            <div>
              <h4 className={`font-bold text-[14px] ${proximamente ? 'text-gray-400' : 'text-[#1A3D3D]'}`}>{label}</h4>
              <p className="text-gray-400 text-[13px] leading-tight mt-0.5">{sub}</p>
            </div>
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ── Sección "Quiénes somos" con burbuja de cita ───────────────────────────
function QuienesSomos() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-5 max-w-xl mx-auto">
      <p className="text-[#2D6A6A] text-[13px] font-bold uppercase tracking-[0.2em]">Quiénes somos</p>

      {/* Burbuja de cita */}
      <div
        ref={ref}
        className={`relative bg-white border border-gray-100 rounded-[28px] px-8 py-7 shadow-[0_4px_24px_rgba(26,61,61,0.07)] transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Comilla decorativa */}
        <span className="absolute -top-4 left-7 text-[56px] leading-none text-[#4DB6AC]/30 font-['Montserrat'] font-black select-none">
          "
        </span>

        {/* Texto en cursiva */}
        <p className="text-[#555555] text-[16px] md:text-[17px] leading-loose font-['Inter',sans-serif] italic relative z-10">
          El Portal nació de una necesidad real: conectar el mundo veterinario argentino en un solo lugar, disponible en cualquier momento para todos los públicos. Lo construí con la convicción de que la salud animal merece una red profesional accesible y a la altura.
        </p>

        {/* Firma */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-[#4DB6AC]/40" />
          <p className="text-[#1A3D3D] text-[14px] font-bold tracking-wide font-['Montserrat']">
            Belén M. Arenas
          </p>
          <div className="h-px w-8 bg-[#4DB6AC]/40" />
        </div>

        {/* Colita de burbuja de diálogo — apunta hacia abajo */}
        <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-r border-b border-gray-100 rotate-45 shadow-[2px_2px_4px_rgba(0,0,0,0.03)]" />
      </div>
    </div>
  );
}


// ── Componente principal ───────────────────────────────────────────────────
export default function SalaDeEspera() {
  const navigate = useNavigate();

  // Estados formulario lista de espera
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  // Estado para destello visual al hacer scroll al CTA
  const [destelloCTA, setDestelloCTA] = useState(false);

  // Abre y cierra el cartelito de inicio de sesión (LoginDropdown)
  const [showLogin, setShowLogin] = useState(false);

  // — Refs y estados para animaciones de scroll en cards —
  const cardPublicaRef = useRef(null);
  const [cardPublicaVisible, setCardPublicaVisible] = useState(false);
  const [cardPublicaHighlight, setCardPublicaHighlight] = useState(false);
  const fila1Ref = useRef(null);
  const [fila1Visible, setFila1Visible] = useState(false);
  const [fila1Highlight, setFila1Highlight] = useState(false);
  const fila2Ref = useRef(null);
  const [fila2Visible, setFila2Visible] = useState(false);
  const [fila2Highlight, setFila2Highlight] = useState(false);

  useEffect(() => {
    // — Observer genérico reutilizable para cards —
    // — Enciende el highlight temporalmente al entrar en pantalla —
    const crearObserver = (setterVisible, setterHighlight) =>
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setterVisible(true);
            setterHighlight(true);
            setTimeout(() => setterHighlight(false), 1200);
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

    const obsPublica = crearObserver(setCardPublicaVisible, setCardPublicaHighlight);
    const obsFila1 = crearObserver(setFila1Visible, setFila1Highlight);
    const obsFila2 = crearObserver(setFila2Visible, setFila2Highlight);

    if (cardPublicaRef.current) obsPublica.observe(cardPublicaRef.current);
    if (fila1Ref.current) obsFila1.observe(fila1Ref.current);
    if (fila2Ref.current) obsFila2.observe(fila2Ref.current);

    return () => {
      obsPublica.disconnect();
      obsFila1.disconnect();
      obsFila2.disconnect();
    };
  }, []);


  // Guarda email en Firestore colección "lista_espera"
  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      setError("Ingresá un email válido.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      // Verificamos si el email ya está en la lista
      const q = query(collection(db, "lista_espera"), where("email", "==", email.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError("Este email ya está en la lista. ¡Te avisamos cuando lancemos!");
        return;
      }
      await addDoc(collection(db, "lista_espera"), {
        email: email.toLowerCase().trim(),
        fecha: serverTimestamp(),
      });
      setEnviado(true);
      setEmail("");
    } catch (err) {
      console.error("Error al guardar en Firestore:", err);
      if (err.code === 'unavailable' || err.message?.includes('network')) {
        setError("Error de conexión. Verificá tu internet e intentá de nuevo.");
      } else {
        setError("Hubo un problema. Intentá de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen font-['Inter',sans-serif] overflow-x-hidden snap-y snap-mandatory md:snap-none" style={{ backgroundColor: '#F9F5F0' }}>

      {/* Burbujas decorativas de fondo — cubren toda la página */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {/* Burbuja naranja — esquina superior derecha, zona pública */}
        <div className="absolute top-[15%] right-[27%] w-[60vw] h-[60vw] bg-[#FF9800]/15 rounded-full blur-[80px]"></div>
        {/* Burbuja esmeralda — zona media, cerca del título profesional */}
        <div className="absolute top-[35%] left-[-10%] w-[50vw] h-[50vw] bg-[#4DB6AC]/30 rounded-full blur-[130px]"></div>
      </div>

      

      {/* ── NAVBAR SIMPLE ─────────────────────────────────────────────────── */}
      <nav className="w-full px-6 md:px-10 h-[60px] md:h-[90px] flex items-center border-b border-gray-100 shadow-sm" style={{ backgroundColor: '#FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none', position: 'relative', zIndex: 110 }}>
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div
            className="cursor-pointer w-fit flex items-center gap-3"
            onClick={() => navigate("/sala-de-espera")}
          >
            {/* Isotipo — solo visible en móvil */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 md:hidden">
              <path d="M 18 85 V 45 A 32 32 0 0 1 82 45 V 85" stroke="#1A3D3D" strokeWidth="12" strokeLinecap="round" fill="none"/>
              <path d="M 38 85 V 55 A 12 12 0 0 1 62 55 V 85" stroke="#2D6A6A" strokeWidth="12" strokeLinecap="round" fill="none"/>
            </svg>

            {/* Logo tipográfico — solo visible en desktop */}
            <div
              className="hidden md:block font-['Montserrat'] font-extrabold tracking-tighter"
              style={{ lineHeight: 0.75 }}
            >
              <div className="text-[#1A3D3D] text-3xl" style={{ lineHeight: '1' }}>Portal</div>
              <div className="text-[#1A3D3D] text-3xl" style={{ lineHeight: '0.9' }}>
                Veterinario<span className="text-[#2D6A6A]">.</span>
              </div>
            </div>
          </div>

          {/* BOTÓN INICIAR SESIÓN + DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowLogin(v => !v)}
              className={`flex items-center gap-2 font-bold text-[13px] transition-colors border px-4 py-2 rounded-xl ${
                showLogin
                  ? 'bg-[#1A3D3D] text-white border-[#1A3D3D]'
                  : 'text-[#1A3D3D] bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar sesión</span>
            </button>

            {/* DROPDOWN: el cartelito compartido de inicio de sesión */}
            {showLogin && (
              <>
                {/* Capa invisible para cerrar al hacer click afuera */}
                <div
                  className="fixed inset-0 z-[100]"
                  style={{ backgroundColor: 'transparent' }}
                  onClick={() => setShowLogin(false)}
                />
                <LoginDropdown onClose={() => setShowLogin(false)} />
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
    <section className="snap-start pt-10 md:pt-15 md:pb-48 pb-55 relative z-10 overflow-hidden">
  {/* Burbuja naranja */}
  <div className="bubble-orange absolute top-[-80px] right-[-120px] md:top-[-60px] md:right-[-80px] w-[420px] h-[420px] bg-[#FF9800]/40 rounded-full blur-[90px] pointer-events-none z-[-1]" />

  {/* Burbuja esmeralda */}
  <div className="bubble-teal absolute bottom-[-80px] left-[-120px] md:bottom-[-40px] md:left-[-60px] w-[350px] h-[350px] bg-[#4DB6AC]/45 rounded-full blur-[100px] pointer-events-none z-[-1]" />

  <div className="max-w-5xl mx-auto px-6 relative">
    <div className="max-w-2xl">
      <h1 className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[50px] md:text-[56px] leading-tight mb-4">
        Tu presencia digital en el mundo veterinario.
      </h1>
      <p className="mt-4 text-[#555555] text-[23px] md:text-[19px] font-medium leading-relaxed max-w-lg">
          <span className="text-[#555555] font-bold">El primer Portal exclusivo para Veterinarios. </span>  <br />
Creá tu perfil, aparecé en búsquedas y conectate con colegas, clínicas y proveedores de todo el país. 
      </p>
      <div className="mt-6 flex items-center gap-2 flex-wrap">
        <a
          href="/cartilla"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-[#FF9800] text-white font-bold text-[16px] md:text-[15px] px-5 py-3 rounded-2xl hover:bg-[#e68900] transition-all duration-200 shadow-md hover:-translate-y-0.5 group"
        >
          <PawPrint className="w-5 h-5" />
          Ya podés ver la Cartilla
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
        </a>
      </div>
    </div>
  </div>

</section>


      {/* ── ZONA PÚBLICA ──────────────────────────────────────────────────── */}
      <section id="seccion-publica" className="snap-start min-h-screen md:min-h-0 flex flex-col justify-center md:block pt-25 pb-16 md:pt-24 md:pb-28 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-6 text-center">
            <h2 className="font-['Montserrat'] font-semibold text-[#2D6A6A] text-[23px] md:text-[19px] mt-2 mb-2 uppercase tracking-[0.08em]">
              Para el sector <span className="text-[#FF9800]">público</span>
            </h2>
            <p className="text-[#444444] text-[19px] md:text-[17px] font-normal mb-8 leading-relaxed">
              Cualquier persona puede encontrar al profesional ideal para su mascota.
            </p>
          </div>
          <div className="pl-0 sm:pl-4" ref={cardPublicaRef}>
            <div className={`transition-all duration-700 ease-out ${
              cardPublicaVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}>
              <CardPublica
                icono={Stethoscope}
                titulo="Cartilla veterinaria"
                descripcion="Encontrá profesionales y clínicas de alta complejidad cerca tuyo. Filtrá por especialidad, zona y servicios disponibles."
                highlight={cardPublicaHighlight}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── ZONA EXCLUSIVA ────────────────────────────────────────────────── */}
      <section className="snap-start pt-16 pb-20 md:pt-28 md:pb-28 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-8 text-center">
            <h2 className="font-['Montserrat'] font-semibold text-[#2D6A6A] text-[23px] md:text-[19px] mt-2 mb-2 uppercase tracking-[0.08em]">
              Exclusivo para veterinarios registrados
            </h2>
            <p className="text-[#444444] mt-1 text-[19px] md:text-[17px] font-normal leading-relaxed">
              Herramientas diseñadas para profesionales, clínicas y proveedores del sector.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-0 sm:pl-4">

            {/* — Fila 1: primeras 3 cards — se animan juntas al entrar en pantalla */}
            <div ref={fila1Ref} className="col-span-1 sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
               { icono: Package, titulo: 'Cartilla de proveedores', descripcion: 'Dedicado a mayoristas: insumos, equipamiento tecnológico y más. También para quienes ofrezcan servicios exclusivos para veterinarios.', delay: 'delay-[100ms]' },
                { icono: BookOpen, titulo: 'Capacitaciones', descripcion: 'Acá vas a poder encontrar todas las formaciones especializadas en medicina veterinaria, la publicacion de los cursos es gratuita.', delay: 'delay-[100ms]' },
                { icono: Briefcase, titulo: 'Bolsa de trabajo', descripcion: 'Las clínicas podrán publicar ofertas de empleo y los profesionales podrán marcarse como disponibles si buscan nuevas oportunidades laborales.', delay: 'delay-[200ms]' },
              ].map(({ icono, titulo, descripcion, delay }) => (
                <div
                  key={titulo}
                  className={`transition-all duration-700 ease-out h-full ${delay} ${
                    fila1Visible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  <CardExclusiva icono={icono} titulo={titulo} descripcion={descripcion} highlight={fila1Highlight} />
                </div>
              ))}
            </div>

            {/* — Fila 2: últimas 2 cards — se animan al llegar a pantalla */}
            <div ref={fila2Ref} className="col-span-1 sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icono: FlaskConical, titulo: 'Publicaciones científicas', descripcion: 'En este espacio podrás encontrar investigaciones de todo tipo. Desde tu perfil puedes compartir papers propios para que tus colegas puedan acceder a tus estudios.', delay: 'delay-[0ms]' },
               { icono: Users, titulo: 'Cartilla de colegas', descripcion: 'Tené los contactos siempre a mano y mantenete conectado con otros profesionales para invitaciones, derivaciones y trabajos en equipo.', delay: 'delay-[0ms]' },
              ].map(({ icono, titulo, descripcion, delay }) => (
                <div
                  key={titulo}
                  className={`transition-all duration-700 ease-out h-full ${delay} ${
                    fila2Visible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  <CardExclusiva icono={icono} titulo={titulo} descripcion={descripcion} highlight={fila2Highlight} />
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section
        id="cta-email"
        className="py-12 md:py-16 relative overflow-hidden"
        style={{ backgroundColor: '#F9F5F0' }}
      >
        {/* Recuadro contenedor naranja — sin burbujas, color más presente */}
        <div className="absolute inset-x-5 md:inset-x-28 inset-y-6 rounded-[40px] bg-[#FF9800]/60 shadow-[0_8px_32px_rgba(26,61,61,0.08)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-6 flex justify-center md:block">

          {/* ── Vista pública ── */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 w-full py-4">

            {/* — Registro: arriba en móvil, derecha en PC — */}
            <div className="order-1 lg:order-2 w-full lg:w-[360px] shrink-0 flex flex-col items-center">

              {/* Barra de cupos de socios vitalicios */}
              {/* En PC: la barra va suelta arriba del selector */}
              <div className="hidden lg:block w-full">
                <BarraCupos />
              </div>

              {/* Móvil: una sola caja Petróleo con la barra de cupos y el botón "Soy Profesional" */}
              <div className="lg:hidden w-[88%] max-w-[300px] bg-[#1A3D3D] rounded-[24px] shadow-[0_8px_24px_rgba(26,61,61,0.25)] p-5">
                <BarraCupos integrada />
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { registro: 'profesional' } })}
                  className="w-full text-left p-3 rounded-2xl bg-white border border-transparent hover:bg-[#F4F7F7] active:scale-[0.98] transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[14px] text-[#1A3D3D]">Soy Profesional</h4>
                    <p className="text-[#666666] text-[13px] leading-tight mt-0.5">Veterinario/a que busca conectar y crecer.</p>
                  </div>
                  <ArrowRight size={16} className="text-[#2D6A6A] shrink-0" />
                </button>
              </div>

              {/* PC: título + flecha + selector de cuenta */}
              <div className="hidden lg:flex flex-col items-center gap-2 w-full">
                <p className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[19px] text-center">
                  ¿Sos veterinario/a? Registrate acá
                </p>
                <ArrowDown className="w-6 h-6 text-[#1A3D3D] animate-bounce mb-1" strokeWidth={2.5} />
                <SelectorTipoCuenta
                  onElegir={(valor) => navigate('/login', { state: { registro: valor } })}
                />
              </div>
            </div>

            {/* — Instagram: abajo en móvil, izquierda en PC — */}
            <div className="order-3 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 flex-1">

              <span className="hidden lg:inline-flex items-center gap-2 bg-[#1A3D3D] border border-[#4DB6AC]/30 text-[#4DB6AC] text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4DB6AC] animate-pulse" />
                Seguinos en Instagram
              </span>

              <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-3xl md:text-4xl max-w-lg leading-snug">
                Mantenete al tanto de todas las novedades
              </h2>

              <p className="text-[#666666] text-[16px] md:text-[17px] leading-relaxed max-w-sm">
                Estamos construyendo algo grande para el sector veterinario argentino. Seguinos y sé el primero en enterarte todas las novedades.
              </p>

              <a
                href="https://www.instagram.com/portalveterinario.ar"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 bg-[#FF9800] text-white font-bold text-[15px] px-7 py-4 rounded-2xl hover:bg-[#e68900] transition-all duration-200 shadow-md hover:-translate-y-0.5 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                @portalveterinario.ar
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
              </a>
            </div>

          </div>

        </div>
      </section>

{/* ── QUIÉNES SOMOS ─────────────────────────────────────────────────── */}
      <section className="py-6 md:py-14 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <QuienesSomos />
        </div>
      </section>

   {/* ── FOOTER MÍNIMO ─────────────────────────────────────────────────── */}
      <footer className="bg-[#1A3D3D] border-t border-white/10 py-5 relative">
        {/* Botón secreto — pegado al borde izquierdo real */}
        <button
          onClick={() => navigate('/ecosistema')}
          className="absolute left-0 top-0 h-full w-50 transition-colors duration-200 cursor-default"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-2 text-center">
         <p className="text-white/70 text-[13px]">
            Hecho con <span className="text-red-400">♥</span> en Argentina
          </p>
          <p className="text-white/30 text-[12px]">
            © {new Date().getFullYear()} Portal Veterinario · Todos los derechos reservados
          </p>
          <a href="mailto:portalveterinario.ar@gmail.com" className="text-white/70 text-[13px] hover:text-white transition-colors duration-200">
            Contactanos · <span className="underline underline-offset-2">portalveterinario.ar@gmail.com</span>
          </a>
        </div>
      </footer>

    </div>
  );
}