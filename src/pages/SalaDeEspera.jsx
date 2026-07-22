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
} from "lucide-react";

// Código de acceso beta — cambialo cuando quieras
const CODIGO_BETA = "beta";

// ── Cajita zona pública ────────────────────────────────────────────────────
const CardPublica = ({ icono: Icono, titulo, descripcion }) => (
  <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] hover:border-[#2D6A6A]/30 transition-all duration-300">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-[12px] bg-[#F4F7F7] flex items-center justify-center shrink-0">
        <Icono size={20} className="text-[#2D6A6A]" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-base mb-1">{titulo}</h3>
        <p className="text-[#666666] text-sm leading-relaxed">{descripcion}</p>
      </div>
    </div>
  </div>
);

// ── Cajita zona exclusiva ──────────────────────────────────────────────────
const CardExclusiva = ({ icono: Icono, titulo, descripcion }) => (
  <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] hover:border-[#2D6A6A]/30 transition-all duration-300">
    <div className="w-10 h-10 rounded-[12px] bg-[#F4F7F7] flex items-center justify-center mb-4">
      <Icono size={20} className="text-[#2D6A6A]" strokeWidth={1.5} />
    </div>
    <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-base mb-2">{titulo}</h3>
    <p className="text-[#666666] text-sm leading-relaxed">{descripcion}</p>
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

  // Guarda email en Firestore colección "lista_espera"
  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">

      {/* ── NAVBAR SIMPLE ─────────────────────────────────────────────────── */}
      <nav className="w-full px-6 md:px-10 h-[72px] flex items-center border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto w-full">
          <div
            className="font-['Montserrat'] font-extrabold tracking-tighter leading-[1.05] cursor-pointer w-fit"
            onClick={() => navigate("/sala-de-espera")}
          >
            <div className="text-[#1A3D3D] text-2xl">Portal</div>
            <div className="text-[#1A3D3D] text-2xl">
              Veterinario<span className="text-[#2D6A6A]">.</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO: subtítulo ───────────────────────────────────────────────── */}
      <section className="bg-white pt-14 pb-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#1A3D3D] font-['Montserrat'] font-bold text-3xl md:text-4xl max-w-2xl leading-snug">
            La plataforma que integra y conecta el mundo veterinario argentino.
          </p>
        </div>
      </section>

      {/* ── ZONA PÚBLICA ──────────────────────────────────────────────────── */}
      <section className="bg-white pb-16 md:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A6A]">
              Acceso libre
            </span>
            <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-2xl md:text-3xl mt-2">
              Para todos
            </h2>
            <p className="text-[#666666] mt-1 text-sm">
              Cualquier persona puede encontrar al profesional ideal para su mascota.
            </p>
          </div>
          <CardPublica
            icono={Stethoscope}
            titulo="Cartilla veterinaria"
            descripcion="Encontrá profesionales y clínicas de alta complejidad cerca tuyo. Filtrá por especialidad, zona y servicios disponibles."
          />
        </div>
      </section>

      {/* ── ZONA EXCLUSIVA ────────────────────────────────────────────────── */}
      <section className="bg-[#F4F7F7] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A6A]">
              Espacio profesional
            </span>
            <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-2xl md:text-3xl mt-2">
              Exclusivo para profesionales registrados
            </h2>
            <p className="text-[#666666] mt-1 text-sm">
              Herramientas diseñadas para veterinarios, clínicas y proveedores del sector.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardExclusiva
              icono={Stethoscope}
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
      <section className="bg-[#1A3D3D] py-16 md:py-20 relative overflow-hidden">

        {/* Burbujas decorativas */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#2D6A6A]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[60vw] h-[60vw] bg-[#4DB6AC]/15 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {esBeta ? (
            /* ── Vista beta ── */
            <div>
              <span className="inline-block text-[#4DB6AC] text-xs font-bold uppercase tracking-[0.2em] mb-4">
                Acceso anticipado
              </span>
              <h2 className="font-['Montserrat'] font-bold text-white text-2xl md:text-3xl mb-4">
                Ya podés registrarte.
              </h2>
              <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
                Sos parte del grupo que va a ser el primero en explorar la plataforma.
              </p>
              <button
                onClick={() => navigate("/Login")}
                className="inline-flex items-center gap-2 bg-[#2D6A6A] text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white hover:text-[#1A3D3D] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                Registrarme
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            /* ── Vista pública ── */
            <div>
              <span className="inline-block text-[#4DB6AC] text-xs font-bold uppercase tracking-[0.2em] mb-4">
                Próximamente
              </span>
              <h2 className="font-['Montserrat'] font-bold text-white text-2xl md:text-3xl mb-4">
                ¿Querés enterarte cuando lancemos?
              </h2>
              <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
                Dejanos tu mail y te avisamos el día del lanzamiento.
              </p>
              {enviado ? (
                <div className="inline-flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-4">
                  <CheckCircle size={20} className="text-[#4DB6AC] shrink-0" />
                  <p className="text-white text-sm">¡Listo! Te avisamos cuando lancemos.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#4DB6AC] focus:ring-4 focus:ring-[#4DB6AC]/20 transition-all duration-300"
                  />
                  <button
                    type="submit"
                    disabled={enviando}
                    className="bg-[#2D6A6A] text-white font-semibold px-6 py-4 rounded-2xl hover:bg-white hover:text-[#1A3D3D] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 whitespace-nowrap"
                  >
                    {enviando ? "Enviando..." : "Quiero enterarme del lanzamiento"}
                  </button>
                </form>
              )}
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER MÍNIMO ─────────────────────────────────────────────────── */}
      <footer className="bg-[#1A3D3D] border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-['Montserrat'] font-extrabold tracking-tighter text-white leading-[1.05]">
            <div className="text-base">Portal</div>
            <div className="text-base">Veterinario<span className="text-[#4DB6AC]">.</span></div>
          </div>
          <p className="text-white/40 text-xs text-center sm:text-right">
            © {new Date().getFullYear()} Portal Veterinario · Todos los derechos reservados
          </p>
        </div>
      </footer>

    </div>
  );
}