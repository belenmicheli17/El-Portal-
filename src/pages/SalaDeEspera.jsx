import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
   Lock, Eye, EyeOff,
  Loader2, AlertCircle, X, Hospital, Store
} from "lucide-react";
import { db } from "../firebase";
import {
  BookOpen,
  Briefcase,
  Package,
  FlaskConical,
  CheckCircle,
  ArrowRight,
  Stethoscope,
  PawPrint,
  Users
} from "lucide-react";

// Código de acceso beta — cambialo cuando quieras
const CODIGO_BETA = "beta";

// ── Cajita zona pública ────────────────────────────────────────────────────
// ── Traducción de errores Firebase ────────────────────────────────────────
const traducirError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Este correo ya está registrado. ¿Intentaste iniciar sesión?';
    case 'auth/invalid-email': return 'El formato del correo no es válido.';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed': return 'Error de conexión. Revisá tu internet.';
    default: return 'Ocurrió un error inesperado. Intentá de nuevo.';
  }
};


// ── Cajita zona pública ────────────────────────────────────────────────────
const CardPublica = ({ icono: Icono, titulo, descripcion, highlight }) => (
  <div className={`bg-white border rounded-[24px] isolate overflow-visible max-w-[1080px] transition-all duration-700 relative hover:shadow-[0_8px_24px_rgba(255,152,0,0.18)] hover:border-[#FF9800]/30 hover:-translate-y-0.5 ${
    highlight
      ? 'shadow-[0_8px_24px_rgba(255,152,0,0.18)] border-[#FF9800]/30 -translate-y-0.5'
      : 'shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-gray-200'
  }`}>

    {/* Pill próximamente — sobresale de la card, levemente rotada */}
    <div className="absolute -top-3 right-2 flex items-center gap-2 bg-[#FF9800] text-white text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-md  z-10">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>
      Próximamente
    </div>
    <div className="flex flex-col sm:flex-row">

      {/* — Columna izquierda: texto — */}
      <div className="flex flex-col gap-3 p-5 sm:p-8 flex-1">
        <Icono size={24} className="text-[#FF9800]" strokeWidth={2.5} />
        <div>
          <h3 className="font-['Montserrat'] font-bold text-[#FF9800] text-[17px] mb-2">{titulo}</h3>
          <p className="text-[#333333] text-[16px] font-medium leading-relaxed">{descripcion}</p>
        </div>
      </div>

      {/* — Columna derecha: mockup cartilla — */}
      <div className="w-full sm:w-[55%] h-[140px] sm:h-auto sm:max-h-[240px] shrink-0 relative overflow-hidden rounded-b-[24px] sm:rounded-b-none sm:rounded-r-[24px]">
        <img
          src="/mockup-cartilla.png"
          alt="Vista previa de la Cartilla veterinaria"
          className="w-full h-full object-cover object-center"
        />
        {/* Degradado suave para integrar la imagen con el texto */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>

       
      </div>


    </div>
  </div>
);

// ── Cajita zona exclusiva ──────────────────────────────────────────────────
const CardExclusiva = ({ icono: Icono, titulo, descripcion, highlight }) => (
  <div className={`bg-white border rounded-[24px] isolate p-4 sm:p-6 min-h-0 sm:min-h-[160px] transition-all duration-700 hover:shadow-[0_8px_24px_rgba(45,106,106,0.12)] hover:border-[#2D6A6A]/30 hover:-translate-y-0.5 ${
    highlight
      ? 'shadow-[0_8px_24px_rgba(45,106,106,0.12)] border-[#2D6A6A]/30 -translate-y-0.5'
      : 'shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-gray-200'
  }`}>
    <div className="flex flex-col gap-2 sm:gap-3">
      <Icono size={20} className="text-[#2D6A6A]" strokeWidth={2.5} />
      <div>
        <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[14px] sm:text-[17px] mb-1 sm:mb-2">{titulo}</h3>
        <p className="text-[#333333] text-[13px] sm:text-[16px] font-medium leading-relaxed">{descripcion}</p>
      </div>
    </div>
  </div>
);

// ── Componente principal ───────────────────────────────────────────────────
export default function SalaDeEspera() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Detecta acceso beta por URL
  const esBeta = searchParams.get("acceso") === CODIGO_BETA;

  // Estados formulario lista de espera
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  // Estado para destello visual al hacer scroll al CTA
  const [destelloCTA, setDestelloCTA] = useState(false);

  // — Estados del drawer de registro —
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [pasoDrawer, setPasoDrawer] = useState('rol');
  const [rolDrawer, setRolDrawer] = useState(null);
  const [formDrawer, setFormDrawer] = useState({ nombre: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorDrawer, setErrorDrawer] = useState('');
const [linkCopiado, setLinkCopiado] = useState(false);

  // — Lógica de registro del drawer —
  const handleRegistroDrawer = async () => {
    if (!formDrawer.nombre.trim() || !formDrawer.email.trim() || !formDrawer.password.trim()) {
      setErrorDrawer('Completá todos los campos para continuar.');
      return;
    }
    setCargando(true);
    setErrorDrawer('');
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formDrawer.email, formDrawer.password);
      const user = userCredential.user;
      const slugGenerado = formDrawer.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: formDrawer.nombre.trim(),
        email: formDrawer.email.toLowerCase().trim(),
        rol: rolDrawer,
        slug: slugGenerado,
        fechaRegistro: new Date().toISOString(),
        estado: 'activo',
        esBeta: true,
      });
      setPasoDrawer('exito');
    } catch (err) {
      setErrorDrawer(traducirError(err.code));
    } finally {
      setCargando(false);
    }
  };

  // — Animación de entrada de la tarjeta al hacer scroll —
  const tarjetaRef = useRef(null);
  const [tarjetaVisible, setTarjetaVisible] = useState(false);

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
    // — Observer para la tarjeta de registro beta —
    const observerTarjeta = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTarjetaVisible(true); },
      { threshold: 0, rootMargin: '0px 0px -50px 0px' }
    );
    if (tarjetaRef.current) {
      const rect = tarjetaRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setTimeout(() => setTarjetaVisible(true), 200);
      } else {
        observerTarjeta.observe(tarjetaRef.current);
      }
    }

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
      observerTarjeta.disconnect();
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
      setError("Hubo un problema. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen font-['Inter',sans-serif] overflow-x-hidden" style={{ backgroundColor: '#F9F5F0', position: 'relative', zIndex: 0 }}>

      {/* Burbujas decorativas de fondo — cubren toda la página */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Burbuja naranja — esquina superior derecha, zona pública */}
        <div className="absolute top-[-10%] right-[-7%] w-[50vw] h-[50vw] bg-[#FF9800]/15 rounded-full blur-[80px]"></div>
        {/* Burbuja esmeralda — zona media, cerca del título profesional */}
        <div className="absolute top-[35%] left-[-10%] w-[50vw] h-[50vw] bg-[#4DB6AC]/30 rounded-full blur-[130px]"></div>
      </div>

      {/* ── NAVBAR SIMPLE ─────────────────────────────────────────────────── */}
      <nav className="w-full px-6 md:px-10 h-[90px] flex items-center border-b border-gray-100 shadow-sm" style={{ backgroundColor: '#FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none', isolation: 'isolate', position: 'relative', zIndex: 1 }}>
        <div className="max-w-5xl mx-auto w-full">
          <div
            className="font-['Montserrat'] font-extrabold tracking-tighter cursor-pointer w-fit"
            style={{ lineHeight: 0.75 }}
            onClick={() => navigate("/sala-de-espera")}
          >
            <div className="text-[#1A3D3D] text-xl md:text-3xl" style={{ lineHeight: '1' }}>Portal</div>
            <div className="text-[#1A3D3D] text-xl md:text-3xl" style={{ lineHeight: '0.9' }}>
              Veterinario<span className="text-[#2D6A6A]">.</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── BANNER BETA (solo para usuarios invitados) ────────────────────── */}
      {esBeta && (
        <div className="w-full bg-[#1A3D3D]/90 backdrop-blur-sm border-b border-[#4DB6AC]/20 px-6 py-2.5 flex items-center justify-center gap-3 relative z-10">
          <span className="w-2 h-2 rounded-full bg-[#4DB6AC] animate-pulse shrink-0"></span>
          <p className="text-white/90 text-[13px] font-medium text-center">
            Esta página es exclusiva para <span className="text-[#4DB6AC] font-bold">usuarios invitados de prueba</span>. 
            Lo que veas puede cambiar antes del lanzamiento oficial.
          </p>
        </div>
      )}

      {/* ── HERO: subtítulo ───────────────────────────────────────────────── */}
      <section className="pt-9 pb-4">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-[#1A3D3D] font-['Montserrat'] font-extrabold text-4xl md:text-5xl max-w-2xl leading-[1.15] tracking-tight">
            Tu presencia digital en el mundo veterinario.
          </h1>
          <p className="mt-4 text-[#555555] text-[17px] md:text-[19px] font-medium leading-relaxed max-w-lg">
            Creá tu perfil, aparecé en búsquedas y conectate con colegas, clínicas y proveedores de todo el país.
          </p>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
            {!esBeta && (
              <p className="text-[#999999] text-[14px] font-normal">
                Estamos en etapa final de desarrollo.
              </p>
            )}
            {!esBeta && (
              <>
                <span className="text-[#2D6A6A] text-[20px] select-none">·</span>
                <button
                  onClick={() => {
                    const el = document.getElementById("cta-email");
                    if (!el) return;
                    // Scroll manual para mayor compatibilidad entre navegadores
                    const top = el.getBoundingClientRect().top + window.scrollY - 20;
                    window.scrollTo({ top, behavior: "smooth" });
                    // Destello cuando termina el scroll
                    setTimeout(() => {
                      setDestelloCTA(true);
                      setTimeout(() => setDestelloCTA(false), 2000);
                    }, 900);
                  }}
                  className="inline-flex items-center gap-1.5 text-[#2D6A6A] text-[17px] font-bold hover:text-[#1A3D3D] transition-colors duration-200 group"
                >
                  Avisarme el lanzamiento
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>


      {/* ── ZONA PÚBLICA ──────────────────────────────────────────────────── */}
      <section className="pb-2 md:pb-4">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-6 text-center">
            <h2 className="font-['Montserrat'] font-semibold text-[#2D6A6A] text-[19px] mt-2 mb-2 uppercase tracking-[0.08em]">
              Para el sector <span className="text-[#FF9800]">público</span>
            </h2>
            <p className="text-[#444444] text-[16px] font-normal mb-8 leading-relaxed">
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
      <section className="pt-4 pb-16 md:pt-6 md:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-8 text-center">
            <h2 className="font-['Montserrat'] font-semibold text-[#2D6A6A] text-[19px] mt-2 mb-2 uppercase tracking-[0.08em]">
              Exclusivo para profesionales registrados
            </h2>
            <p className="text-[#444444] mt-1 text-[16px] font-normal leading-relaxed">
              Herramientas diseñadas para veterinarios, clínicas y proveedores del sector.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pl-0 sm:pl-4">

            {/* — Fila 1: primeras 3 cards — se animan juntas al entrar en pantalla */}
            <div ref={fila1Ref} className="col-span-2 lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icono: Users, titulo: 'Cartilla de colegas', descripcion: 'Conectate con otros profesionales para consultas, derivaciones y trabajo en red.', delay: 'delay-[0ms]' },
                { icono: BookOpen, titulo: 'Capacitaciones', descripcion: 'Cursos y formaciones especializadas en medicina veterinaria de alta complejidad.', delay: 'delay-[100ms]' },
                { icono: Briefcase, titulo: 'Bolsa de trabajo', descripcion: 'Ofertas laborales para profesionales y clínicas que buscan incorporar talento.', delay: 'delay-[200ms]' },
              ].map(({ icono, titulo, descripcion, delay }) => (
                <div
                  key={titulo}
                  className={`transition-all duration-700 ease-out ${delay} ${
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
            <div ref={fila2Ref} className="col-span-2 lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icono: FlaskConical, titulo: 'Publicaciones científicas', descripcion: 'Espacio editorial y científico para compartir y acceder a conocimiento del sector.', delay: 'delay-[0ms]' },
                { icono: Package, titulo: 'Cartilla de proveedores', descripcion: 'Insumos, equipamiento y tecnología veterinaria de proveedores verificados.', delay: 'delay-[100ms]' },
              ].map(({ icono, titulo, descripcion, delay }) => (
                <div
                  key={titulo}
                  className={`transition-all duration-700 ease-out ${delay} ${
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
        {/* Burbujas decorativas — misma vibra que el resto de la página */}
        <div className="absolute bottom-[-80px] right-[-80px] w-[320px] h-[320px] bg-[#4DB6AC]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-[-60px] left-[-60px] w-[260px] h-[260px] bg-[#2D6A6A]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          {esBeta ? (

            /* ── Vista beta ── */
            <div className="flex flex-col-reverse md:flex-row items-start gap-10 md:gap-16">

              {/* — Columna izquierda: textos — */}
              <div className="flex flex-col items-start gap-6 flex-1">
                <span className="hidden md:inline-flex items-center gap-2 bg-[#1A3D3D] border border-[#4DB6AC]/30 text-[#4DB6AC] text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4DB6AC] animate-pulse" />
                  Acceso anticipado
                </span>
                <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-3xl md:text-4xl max-w-lg leading-snug">
                  Ya podés registrarte y ser el primero en explorar la plataforma.
                </h2>
                <div className="flex flex-col gap-2 max-w-sm">
                  <p className="text-[#1A3D3D] font-bold text-[16px]">Los que llegan primero, construyen la plataforma.</p>
                  <p className="text-[#666666] text-[16px] leading-relaxed">
                    Como beta tester vas a ser parte del grupo que le da forma a lo que viene. Tu perfil estará listo y activo desde el día del lanzamiento — solo necesitamos tu compromiso de completarlo y probarlo con nosotros.
                  </p>
                </div>
              </div>

              {/* — Tarjeta de registro — */}
              <div ref={tarjetaRef} className="w-full md:w-[360px] shrink-0">
                <div
                  className={`transition-all duration-700 ease-out ${
                    tarjetaVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-16'
                  }`}
                >
                  <div className="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(26,61,61,0.08)] border border-gray-100 overflow-hidden">
                    {/* Cabecera */}
                    <div className="px-6 py-5 border-b border-gray-100">
                      <p className="text-[#2D6A6A] text-[11px] font-bold uppercase tracking-[0.2em] mb-1">Registrate gratis</p>
                      <h3 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-[18px] leading-tight">
                        {pasoDrawer === 'rol' ? '¿Con qué perfil ingresás?' : pasoDrawer === 'datos' ? 'Completá tus datos' : '¡Bienvenido/a!'}
                      </h3>
                    </div>

                    <div className="p-6">
                      {/* Error */}
                      {errorDrawer && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-red-600 text-[12px] font-semibold">{errorDrawer}</p>
                        </div>
                      )}

                      {/* Paso 1: rol */}
                      {pasoDrawer === 'rol' && (
                        <div className="space-y-3">
                          {[
                            { valor: 'profesional', label: 'Soy Profesional', sub: 'Veterinario/a que busca conectar y crecer.', Icono: Stethoscope, color: 'blue' },
                            { valor: 'clinica', label: 'Soy una Clínica', sub: 'Institución que busca talento y visibilidad.', Icono: Hospital, color: 'emerald' },
                            { valor: 'proveedor', label: 'Proveedor o empresa', sub: 'Ofrezco insumos, equipamiento o servicios.', Icono: Store, color: 'purple' },
                          ].map(({ valor, label, sub, Icono, color }) => (
                            <button
                              key={valor}
                              onClick={() => { setRolDrawer(valor); setPasoDrawer('datos'); setErrorDrawer(''); }}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all group flex items-center gap-4 ${
                                rolDrawer === valor
                                  ? 'border-[#2D6A6A] bg-[#F4F7F7]'
                                  : 'border-gray-100 hover:border-[#2D6A6A] hover:bg-[#F4F7F7]'
                              }`}
                            >
                              <div className={`bg-${color}-50 p-2.5 rounded-full text-${color}-600 group-hover:scale-110 transition-transform`}>
                                <Icono size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-[#1A3D3D] text-[14px]">{label}</h4>
                                <p className="text-gray-500 text-[13px] leading-tight mt-0.5">{sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Paso 2: datos */}
                      {pasoDrawer === 'datos' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[#1A3D3D] text-[12px] font-bold uppercase tracking-widest block mb-1.5">
                              {rolDrawer === 'profesional' ? 'Tu nombre completo' : rolDrawer === 'clinica' ? 'Nombre de la clínica' : 'Nombre de la empresa'}
                            </label>
                            <input
                              type="text"
                              value={formDrawer.nombre}
                              onChange={(e) => { setFormDrawer({ ...formDrawer, nombre: e.target.value }); setErrorDrawer(''); }}
                              placeholder={rolDrawer === 'profesional' ? 'Ej: María González' : rolDrawer === 'clinica' ? 'Ej: Clínica Veterinaria Sur' : 'Ej: Laboratorio XYZ'}
                              className="w-full px-4 py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[#1A3D3D] text-[12px] font-bold uppercase tracking-widest block mb-1.5">Correo electrónico</label>
                            <input
                              type="email"
                              value={formDrawer.email}
                              onChange={(e) => { setFormDrawer({ ...formDrawer, email: e.target.value }); setErrorDrawer(''); }}
                              placeholder="tu@email.com"
                              className="w-full px-4 py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest block mb-1.5">Contraseña</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={formDrawer.password}
                                onChange={(e) => { setFormDrawer({ ...formDrawer, password: e.target.value }); setErrorDrawer(''); }}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-3 pr-11 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#2D6A6A] transition-colors">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => { setPasoDrawer('rol'); setErrorDrawer(''); }}
                              className="px-4 py-3 rounded-xl border border-gray-200 text-[#666666] text-[12px] font-bold hover:border-[#2D6A6A] transition-all"
                            >
                              Volver
                            </button>
                            <button
                              onClick={handleRegistroDrawer}
                              disabled={cargando}
                              className="flex-1 bg-[#2D6A6A] text-white font-bold py-3 rounded-xl text-[12px] uppercase tracking-widest hover:bg-[#1A3D3D] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Registrarme'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Paso 3: éxito */}
                      {pasoDrawer === 'exito' && (
                        <div className="flex flex-col items-center gap-4 text-center py-2">
                          <div className="w-14 h-14 rounded-full bg-[#F4F7F7] flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-[#2D6A6A]" strokeWidth={2} />
                          </div>
                          <div>
                            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[17px] mb-2">¡Listo!</h3>
                            <p className="text-[#555555] text-[14px] leading-relaxed">
                              Pronto esto va a cambiar la forma en que el sector se conecta.<br />
                              <span className="font-semibold text-[#1A3D3D]">Compartíselo a quien creás que le puede interesar.</span>
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const url = window.location.origin + '/sala-de-espera';
                              if (navigator.share) {
                                navigator.share({ title: 'Portal Veterinario', url });
                              } else {
                                navigator.clipboard.writeText(url);
                                setLinkCopiado(true);
                                setTimeout(() => setLinkCopiado(false), 2000);
                              }
                            }}
                            className={`w-full font-bold py-3 rounded-xl text-[12px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                              linkCopiado
                                ? 'bg-[#1A3D3D] text-[#4DB6AC]'
                                : 'bg-[#2D6A6A] text-white hover:bg-[#1A3D3D]'
                            }`}
                          >
                            <ArrowRight size={16} />
                            {linkCopiado ? '¡Link copiado!' : 'Compartir Portal Veterinario'}
                          </button>
                          <button
                            onClick={() => setTimeout(() => navigate('/ecosistema'), 300)}
                            className="text-[#2D6A6A] text-[13px] font-semibold hover:text-[#1A3D3D] transition-colors underline underline-offset-2"
                          >
                            Ir a mi perfil →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : (

            /* ── Vista pública ── */
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full">

              {/* — Columna izquierda: textos — */}
              <div className="flex flex-col items-start gap-5 flex-1 min-w-0">
                <span className="inline-flex items-center gap-2 bg-[#1A3D3D] border border-[#4DB6AC]/30 text-[#4DB6AC] text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4DB6AC] animate-pulse" />
                  Próximamente
                </span>
                <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-3xl md:text-4xl max-w-lg leading-snug">
                  ¿Querés ser de los primeros en entrar?
                </h2>
                <p className="text-[#666666] text-[16px] md:text-[17px] leading-relaxed max-w-sm">
                  Estamos en etapa final de desarrollo. Dejanos tu mail y te avisamos el día del lanzamiento.
                </p>
              </div>

              {/* — Tarjeta formulario — */}
              <div className="w-full md:w-[360px] shrink-0">
                <div className="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(26,61,61,0.08)] border border-gray-100 p-6">
                  <p className="text-[#2D6A6A] text-[12px] font-bold uppercase tracking-[0.2em] mb-1">Anotarme gratis</p>
                  <h3 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-[18px] mb-5 leading-tight">Avisarme el lanzamiento</h3>

                  {enviado ? (
                    <div className="flex items-center gap-3 bg-[#F4F7F7] rounded-2xl px-5 py-4">
                      <CheckCircle size={20} className="text-[#2D6A6A] shrink-0" />
                      <p className="text-[#1A3D3D] font-semibold text-[14px]">¡Listo! Te avisamos cuando lancemos.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        ref={(el) => { if (destelloCTA && el) el.focus(); }}
                        className={`w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all duration-500 ${
                          destelloCTA
                            ? 'bg-white border-2 border-[#4DB6AC] ring-4 ring-[#4DB6AC]/20 scale-105 text-[#1A3D3D]'
                            : 'bg-[#F4F7F7] border border-transparent text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20'
                        }`}
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={enviando}
                        className="w-full bg-[#2D6A6A] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#1A3D3D] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 text-[12px] uppercase tracking-widest"
                      >
                        {enviando ? "Enviando..." : "Anotarme para el lanzamiento"}
                      </button>
                      {error && <p className="text-red-500 text-[13px] text-center">{error}</p>}
                      <p className="text-[#999999] text-[13px] text-center">Sin spam. Solo te escribimos cuando estemos listos.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          )}
        </div>
      </section>

{/* ── QUIÉNES SOMOS ─────────────────────────────────────────────────── */}
      <section className="py-10 md:py-14 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center gap-5 max-w-xl mx-auto">
            <p className="text-[#2D6A6A] text-[11px] font-bold uppercase tracking-[0.2em]">Quiénes somos</p>
            <p className="text-[#555555] text-[17px] md:text-[18px] leading-loose font-['Inter',sans-serif] font-normal">
              Hola, soy Belén. El Portal nació de una necesidad real: conectar el mundo veterinario argentino en un solo lugar, disponible en cualquier momento para todos los públicos. Lo construí con la convicción de que la salud animal merece una red profesional accesible y a la altura.
            </p>
            <div className="flex items-center gap-3 mt-1">
            </div>
          </div>
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
         <p className="text-white/70 text-xs">
            Creado por <span className="text-white font-semibold tracking-wide">Belén M. Arenas</span> · Hecho con <span className="text-red-400">♥</span> en Argentina
          </p>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Portal Veterinario · Todos los derechos reservados
          </p>
        </div>
      </footer>

    </div>
  );
}