import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Hospital, GraduationCap, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, registrarEvento } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MENSAJE_FALLA_DATOS } from '../utils/erroresLogin';
import { crearDocumentoUsuario, rutaCuestionario } from '../utils/completarCuenta';
import BotonAvisarProblema from '../components/BotonAvisarProblema';

// Pantalla para cuentas que existen en Authentication pero no tienen documento en "usuarios"
// (pasó cuando las reglas de Firestore estuvieron incompletas). La persona elige su tipo de cuenta,
// se crea su documento con los mismos campos que el registro y sigue a su cuestionario.
const OPCIONES = [
  { valor: 'profesional', label: 'Soy Profesional', sub: 'Veterinario/a que busca conectar y crecer.', Icono: Stethoscope, acento: 'bg-blue-50 text-blue-600' },
  { valor: 'clinica', label: 'Soy una Clínica', sub: 'Institución que busca talento y visibilidad.', Icono: Hospital, acento: 'bg-violet-50 text-violet-600' },
  { valor: 'alumnx', label: 'Soy Estudiante', sub: 'Estudiante de veterinaria que busca sus primeras experiencias.', Icono: GraduationCap, acento: 'bg-rose-50 text-rose-500' }
];

export default function CompletarCuenta() {
  const navigate = useNavigate();
  const { refreshUser, logout } = useAuth();

  const [estado, setEstado] = useState('verificando'); // verificando | elegir | error
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Código técnico del error (va en el aviso de "no funciona"). Vacío = no hubo error técnico.
  const [detalleError, setDetalleError] = useState('');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Al entrar: ¿hay sesión? ¿ya tiene documento? Si ya lo tiene no hay nada que completar.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        // Esperamos a que Firebase termine de confirmar la sesión (sirve también al recargar la página)
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) {
          navigate('/Login', { replace: true });
          return;
        }
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (cancelado) return;
        if (snap.exists()) {
          await refreshUser();
          navigate(snap.data()?.rol === 'admin' ? '/admin' : '/ecosistema', { replace: true });
          return;
        }
        setEmail(user.email || '');
        setEstado('elegir');
      } catch (error) {
        console.error('No se pudo revisar la cuenta:', error);
        if (!cancelado) {
          setDetalleError(`lectura usuarios: ${error?.code || error?.message || 'desconocido'}`);
          setErrorMsg(MENSAJE_FALLA_DATOS);
          setEstado('error');
        }
      }
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinuar = async () => {
    // Borramos el error técnico anterior: si ahora falta elegir algo, no corresponde el botón de avisar
    setDetalleError('');
    if (!tipo) {
      setErrorMsg('Elegí qué tipo de cuenta sos para continuar.');
      return;
    }
    if (!aceptaTerminos) {
      setErrorMsg('Para continuar tenés que aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      navigate('/Login', { replace: true });
      return;
    }
    setGuardando(true);
    setErrorMsg('');
    try {
      await crearDocumentoUsuario(user, tipo);
      registrarEvento('cuenta_recuperada', { tipo_cuenta: tipo });
      // Releemos los datos para que la app sepa qué tipo de cuenta es y la deje pasar al cuestionario
      await refreshUser();
      navigate(rutaCuestionario(tipo), { replace: true });
    } catch (error) {
      console.error('No se pudo crear el documento de la cuenta:', error);
      setDetalleError(`crear usuarios: ${error?.code || error?.message || 'desconocido'}`);
      setErrorMsg('No pudimos guardar tus datos. Intentá de nuevo y, si sigue pasando, avisanos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleSalir = async () => {
    try { await logout(); } catch (error) { console.error(error); }
    navigate('/Login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#E8EFEF] flex items-center justify-center p-4 font-['Inter'] antialiased">
      <div className="w-full max-w-[460px] bg-white rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-50 p-6 md:p-8">

        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-[#2D6A6A] p-3 rounded-2xl mb-3 shadow-inner border border-white/10">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <h1 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-lg uppercase tracking-wider">
            Completá tu cuenta
          </h1>
        </div>

        {estado === 'verificando' && (
          <div className="flex items-center justify-center gap-3 py-10 text-[#2D6A6A]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[14px] font-medium">Revisando tu cuenta…</span>
          </div>
        )}

        {estado === 'error' && (
          <div className="space-y-5">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-[12px] font-semibold">{errorMsg}</p>
            </div>
            <BotonAvisarProblema lugar="completar-cuenta" detalle={detalleError} />
            <button
              type="button"
              onClick={handleSalir}
              className="w-full text-center text-[12px] font-bold uppercase tracking-widest text-[#1A3D3D] hover:text-[#2D6A6A] transition-colors"
            >
              Salir
            </button>
          </div>
        )}

        {estado === 'elegir' && (
          <>
            <p className="text-center text-[#666666] text-[13px] leading-relaxed mb-5">
              Tu cuenta{email ? <> <strong className="text-[#1A3D3D]">{email}</strong></> : ''} ya existe, pero no pudimos guardar tus datos cuando te registraste.
              Elegí qué tipo de cuenta sos y seguí con tu cuestionario.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-[12px] font-semibold">{errorMsg}</p>
              </div>
            )}
            {/* Solo cuando falló el guardado (no cuando falta elegir una opción o tildar la casilla) */}
            {errorMsg && detalleError && (
              <BotonAvisarProblema lugar="completar-cuenta" detalle={detalleError} className="mb-4" />
            )}

            <div className="space-y-3">
              {OPCIONES.map(({ valor, label, sub, Icono, acento }) => {
                const elegido = tipo === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => { setTipo(valor); setErrorMsg(''); }}
                    aria-pressed={elegido}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 active:scale-[0.98] ${
                      elegido ? 'border-[#2D6A6A] bg-[#F4F7F7]' : 'border-[#2D6A6A]/40 hover:border-[#2D6A6A] hover:bg-[#F4F7F7]'
                    }`}
                  >
                    <div className={`p-2.5 rounded-full ${acento}`}>
                      <Icono size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-[#1A3D3D]">{label}</h4>
                      <p className="text-gray-400 text-[13px] leading-tight mt-0.5">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-5">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => { setAceptaTerminos(e.target.checked); setErrorMsg(''); }}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#2D6A6A] cursor-pointer"
              />
              <span className="text-[12px] text-[#666666] leading-relaxed">
                Acepto los{' '}
                <a href="/terminos-y-condiciones" target="_blank" rel="noreferrer" className="font-bold text-[#2D6A6A] underline underline-offset-2 hover:text-[#1A3D3D]">Términos y Condiciones</a>
                {' '}y la{' '}
                <a href="/politica-de-privacidad" target="_blank" rel="noreferrer" className="font-bold text-[#2D6A6A] underline underline-offset-2 hover:text-[#1A3D3D]">Política de Privacidad</a>.
              </span>
            </label>

            <button
              type="button"
              onClick={handleContinuar}
              disabled={guardando}
              className="w-full mt-5 bg-[#2D6A6A] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              ) : (
                <>Continuar <ArrowRight size={16} /></>
              )}
            </button>

            <button
              type="button"
              onClick={handleSalir}
              className="w-full mt-4 text-center text-[11px] font-semibold text-gray-400 hover:text-[#1A3D3D] transition-colors"
            >
              Salir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
