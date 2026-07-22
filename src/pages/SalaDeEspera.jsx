import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
const CardPublica = ({ icono: Icono, titulo, descripcion }) => (
  <div className="bg-white border border-gray-200 rounded-[24px] isolate overflow-hidden max-w-[1080px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(255,152,0,0.12)] hover:border-[#FF9800]/30 hover:-translate-y-0.5 transition-all duration-300">
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
const CardExclusiva = ({ icono: Icono, titulo, descripcion }) => (
  <div className="bg-white border border-gray-200 rounded-[24px] isolate p-4 sm:p-6 min-h-0 sm:min-h-[160px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(45,106,106,0.12)] hover:border-[#2D6A6A]/30 hover:-translate-y-0.5 transition-all duration-300">
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

  // Guarda email en Firestore colección "lista_espera"
  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      setError("Ingresá un email válido.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
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
            Una plataforma que integra y conecta el mundo veterinario de Argentina.
          </h1>
          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <p className="text-[#555555] text-[17px] font-medium leading-relaxed">
              Estamos en etapa final de desarrollo.
            </p>
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
                  Avisarme cuando lancen
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
          <div className="mb-6">
            <div className="flex items-center gap-2 mt-2 mb-1">
              <h2 className="font-['Montserrat'] font-semibold text-[#2D6A6A] text-[19px] mt-2 uppercase tracking-[0.08em]">
  Para el sector <span className="text-[#FF9800]">público</span>
</h2>
            </div>
            <p className="text-[#444444] text-[16px] font-normal mb-8 leading-relaxed">
              Cualquier persona puede encontrar al profesional ideal para su mascota.
            </p>
          </div>
          <div className="pl-0 sm:pl-4">
  <CardPublica
              icono={Stethoscope}
              titulo="Cartilla veterinaria"
              descripcion="Encontrá profesionales y clínicas de alta complejidad cerca tuyo. Filtrá por especialidad, zona y servicios disponibles."
            />
          </div>
        </div>
      </section>

      {/* ── ZONA EXCLUSIVA ────────────────────────────────────────────────── */}
      <section className="pt-4 pb-16 md:pt-6 md:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="font-['Montserrat'] font-semibold text-[#2D6A6A] text-[19px] mt-2 uppercase tracking-[0.08em]">
              Exclusivo para profesionales registrados
            </h2>
            <p className="text-[#444444] mt-1 text-[16px] font-normal leading-relaxed">
              Herramientas diseñadas para veterinarios, clínicas y proveedores del sector.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pl-0 sm:pl-4">
            <CardExclusiva
              icono={Users}
              titulo="Cartilla de colegas"
              descripcion="Conectate con otros profesionales para consultas, derivaciones y trabajo en red."
            />
            <CardExclusiva
              icono={BookOpen}
              titulo="Capacitaciones"
              descripcion="Cursos y formaciones especializadas en medicina veterinaria de alta complejidad."
            />
            <CardExclusiva
              icono={Briefcase}
              titulo="Bolsa de trabajo"
              descripcion="Ofertas laborales para profesionales y clínicas que buscan incorporar talento."
            />
            <CardExclusiva
              icono={FlaskConical}
              titulo="Publicaciones científicas"
              descripcion="Espacio editorial y científico para compartir y acceder a conocimiento del sector."
            />
            <CardExclusiva
              icono={Package}
              titulo="Cartilla de proveedores"
              descripcion="Insumos, equipamiento y tecnología veterinaria de proveedores verificados."
            />
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section
        id="cta-email"
        className={`py-20 md:py-28 relative overflow-hidden transition-all duration-700 ease-out ${
  destelloCTA ? "bg-[#1E4F4F]" : "bg-[#1A3D3D]"
}`}
      >

        {/* Burbuja decorativa interna */}
        <div className="absolute top-[-40%] right-[-10%] w-[500px] h-[500px] bg-[#2D6A6A]/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[-10%] w-[400px] h-[400px] bg-[#4DB6AC]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {esBeta ? (

            /* ── Vista beta ── */
            <div className="flex flex-col items-center gap-6">
              <span className="inline-flex items-center gap-2 bg-[#4DB6AC]/15 border border-[#4DB6AC]/30 text-[#4DB6AC] text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4DB6AC] animate-pulse" />
                Acceso anticipado
              </span>
              <h2 className="font-['Montserrat'] font-bold text-white text-3xl md:text-4xl max-w-lg leading-snug">
                Ya podés registrarte y ser el primero en explorar la plataforma.
              </h2>
              <p className="text-white/50 text-[15px] max-w-sm leading-relaxed">
                Sos parte del grupo selecto que va a dar forma a lo que viene. Gracias por ser parte!
              </p>
              <button
                onClick={() => navigate("/Login")}
                className="inline-flex items-center gap-2 bg-white text-[#1A3D3D] font-bold px-8 py-4 rounded-2xl hover:bg-[#4DB6AC] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-[15px]"
              >
                Registrarme ahora
                <ArrowRight size={18} />
              </button>
            </div>

          ) : (

            /* ── Vista pública ── */
            <div className="flex flex-col items-center gap-6">
              <span className="inline-flex items-center gap-2 bg-[#4DB6AC]/15 border border-[#4DB6AC]/30 text-[#4DB6AC] text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4DB6AC] animate-pulse" />
                Próximamente
              </span>
              <h2 className="font-['Montserrat'] font-bold text-white text-3xl md:text-4xl max-w-lg leading-snug">
                ¿Querés ser de los primeros en entrar?
              </h2>
              <p className="text-white/50 text-[15px] max-w-xs leading-relaxed">
                Estamos en etapa final de desarrollo. Dejanos tu mail y te avisamos el día del lanzamiento.
              </p>

              {enviado ? (
                <div className="inline-flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-7 py-4 mt-2">
                  <CheckCircle size={20} className="text-[#4DB6AC] shrink-0" />
                  <p className="text-white text-[15px]">¡Listo! Te avisamos cuando lancemos.</p>
                </div>
              ) : (
                <div className="w-full max-w-xs flex flex-col gap-3 mt-2">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={(el) => { if (destelloCTA && el) el.focus(); }}
className={`w-full text-white placeholder:text-white/40 rounded-2xl px-5 py-4 text-[15px] focus:outline-none transition-all duration-500 text-center ${
  destelloCTA
    ? "bg-[#4DB6AC]/30 border-2 border-[#4DB6AC] ring-4 ring-[#4DB6AC]/40 scale-105"
    : "bg-white/10 border border-white/20 focus:border-[#4DB6AC] focus:ring-4 focus:ring-[#4DB6AC]/20"
}`}/>
                  <button
                    onClick={handleSubmit}
                    disabled={enviando}
                    className="w-full bg-white text-[#1A3D3D] font-bold px-6 py-4 rounded-2xl hover:bg-[#4DB6AC] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 text-[15px]"
                  >
                    {enviando ? "Enviando..." : "Anotarme para el lanzamiento"}
                  </button>
                  {error && <p className="text-red-400 text-[13px] text-center">{error}</p>}
                </div>
              )}
            </div>

          )}
        </div>
      </section>

      {/* ── FOOTER MÍNIMO ─────────────────────────────────────────────────── */}
      <footer className="bg-[#1A3D3D] border-t border-white/10 py-4">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="font-['Montserrat'] font-extrabold tracking-tighter text-white text-base">
  Portal Veterinario<span className="text-[#4DB6AC]">.</span>
</div>
          <p className="text-white/40 text-xs text-center sm:text-right">
            © {new Date().getFullYear()} Portal Veterinario · Todos los derechos reservados
          </p>
        </div>
      </footer>

    </div>
  );
}