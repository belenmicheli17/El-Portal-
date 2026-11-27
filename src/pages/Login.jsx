import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft,
  ArrowRight, KeyRound, CheckCircle2, Stethoscope,
  Hospital, Store, Loader2, AlertCircle, GraduationCap
} from 'lucide-react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { pedirRecuperacionClave } from '../utils/recuperarClave';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, registrarEvento } from '../firebase';
import { useAuth } from '../context/AuthContext';
import BarraCupos from '../components/BarraCupos';
import { traducirErrorFirebase, MENSAJE_FALLA_DATOS, ATRIBUTOS_CAMPO_LOGIN } from '../utils/erroresLogin';
import BotonAvisarProblema from '../components/BotonAvisarProblema';
import { vieneDeBolsa, olvidarVieneDeBolsa, rutaCuestionario, PARAM_DESPUES_BOLSA } from '../utils/bolsa';

// Tipos de cuenta que se pueden abrir directo desde la dirección (?registro=profesional).
// Proveedor queda afuera porque todavía figura como "Próximamente".
const TIPOS_REGISTRO = ['profesional', 'clinica', 'alumnx'];
// Lo que la persona ya escribió en el registro, para no perderlo si sale a leer los Términos y vuelve.
// La contraseña NO se guarda (por seguridad): solo el mail.
const CLAVE_BORRADOR = 'registroBorrador';
const leerBorrador = () => {
  try { return JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR) || '{}'); } catch { return {}; }
};
const guardarBorrador = (datos) => {
  try { sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos)); } catch { /* sin almacenamiento: no pasa nada */ }
};
const borrarBorrador = () => {
  try { sessionStorage.removeItem(CLAVE_BORRADOR); } catch { /* sin almacenamiento: no pasa nada */ }
};
// Lee de la dirección (o del aviso interno de la navbar) si hay que abrir el registro y con qué tipo
const registroPedido = (location) => new URLSearchParams(location.search).get('registro') || location.state?.registro || null;

export default function Login() {
  const location = useLocation();
  // Arrancamos ya en la pestaña correcta: así, al volver de los Términos (botón atrás), sigue en el registro
  const [view, setView] = useState(() => (registroPedido(location) ? 'register' : 'login'));
  const [accountType, setAccountType] = useState(() => {
    const registro = registroPedido(location);
    return TIPOS_REGISTRO.includes(registro) ? registro : null;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Código técnico del error de lectura de "usuarios" (va en el aviso de "no funciona")
  const [detalleError, setDetalleError] = useState('');
  // Casilla de "Acepto los Términos y la Política de Privacidad" (obligatoria para registrarse)
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  // ── Transición de entrada ──────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);

  // Si estaba registrándose y salió de la página, recuperamos el mail que ya había escrito
  const [formData, setFormData] = useState(() => ({
    nombre: '',
    email: registroPedido(location) ? (leerBorrador().email || '') : '',
    password: ''
  }));
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // ¿Llegó desde la Bolsa de Trabajo para publicar? (?despues=bolsa en la dirección)
  // Si entró al login por otro lado, olvidamos una marca vieja que haya quedado guardada.
  const deBolsa = new URLSearchParams(location.search).get('despues') === 'bolsa';
  useEffect(() => {
    if (!deBolsa) olvidarVieneDeBolsa();
  }, [deBolsa]);

  // Si llegan desde el botón "¿Sos veterinario? Registrate" de la navbar, abrimos el registro mostrando las opciones de tipo de cuenta
  // Medición: cuando elige el tipo de cuenta y ve el formulario, empezó el registro
  useEffect(() => {
    if (view === 'register' && accountType) registrarEvento('registro_iniciado', { tipo_cuenta: accountType });
  }, [view, accountType]);

  useEffect(() => {
    // El aviso de "ir a registro" puede venir de dos lugares:
    // 1) de adentro de la app (navbar, sala de espera) -> location.state.registro
    // 2) de un link externo (WhatsApp, mail, redes) -> en la dirección: ?registro=profesional
    const parametros = new URLSearchParams(location.search);
    const registroDesdeLink = parametros.get('registro');
    const registro = location.state?.registro || registroDesdeLink;

    if (registro) {
      setView('register');
      // Si el link trae un tipo de cuenta válido, saltamos directo al formulario.
      // Si no trae ninguno (o no es válido), mostramos las opciones para elegir.
      setAccountType(TIPOS_REGISTRO.includes(registro) ? registro : null);
    }
  }, [location.state, location.search]);

  // La pestaña en la que está queda escrita en la dirección (igual que los filtros de la Cartilla).
  // Ejemplo: /Login?registro=profesional. Así, si toca "Términos" y vuelve atrás, aparece donde estaba.
  useEffect(() => {
    const parametros = new URLSearchParams(location.search);
    const actual = parametros.get('registro');
    const deseado = view === 'register' ? (accountType || 'elegir') : null;
    if (actual === deseado) return;
    if (deseado) parametros.set('registro', deseado); else parametros.delete('registro');
    const busqueda = parametros.toString();
    // replace: no suma pasos al botón "atrás" del navegador
    navigate({ pathname: location.pathname, search: busqueda ? `?${busqueda}` : '' }, { replace: true });
  }, [view, accountType, location.pathname, location.search, navigate]);

  // Mientras se registra, guardamos el mail escrito (se borra al crear la cuenta)
  useEffect(() => {
    if (view === 'register') guardarBorrador({ email: formData.email });
  }, [view, formData.email]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Dispara la animación de entrada en el siguiente frame
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (view === 'login') {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const auth = getAuth();
        // El teclado del celular a veces deja un espacio al final del mail: lo sacamos
        const userCredential = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'usuarios', user.uid);

        // A partir de acá la contraseña ya estaba bien. Si falla la lectura de sus datos,
        // lo decimos aparte para que no parezca un problema de contraseña.
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (errorLectura) {
          console.error('Ingresó bien pero no se pudo leer usuarios:', errorLectura);
          setDetalleError(`lectura usuarios: ${errorLectura?.code || errorLectura?.message || 'desconocido'}`);
          setErrorMsg(MENSAJE_FALLA_DATOS);
          return;
        }

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const rolesBolsa = ['profesional', 'clinica', 'alumnx'];
          if (userData.rol !== 'admin' && rolesBolsa.includes(userData.rol) && vieneDeBolsa(location.search)) {
            if (userData.onboardingCompleto === false) {
              // Todavía no terminó el cuestionario: lo retoma y, al final, vuelve a la Bolsa
              navigate(`${rutaCuestionario(userData.rol)}?${PARAM_DESPUES_BOLSA}`);
            } else {
              // Ya tenía el perfil hecho: vuelve a la Bolsa en vez de ir al Ecosistema
              olvidarVieneDeBolsa();
              navigate('/bolsa-de-trabajo');
            }
            return;
          }
          navigate(userData.rol === 'admin' ? '/admin' : '/ecosistema');
        } else {
          // Cuenta creada en Authentication pero sin documento en "usuarios": elige su tipo de cuenta y lo crea
          navigate('/completar-cuenta');
        }
      } catch (error) {
        setErrorMsg(traducirErrorFirebase(error.code));
      } finally {
        setIsLoading(false);
      }

    } else if (view === 'register') {
      // Sin aceptar los términos no se puede crear la cuenta
      if (!aceptaTerminos) {
        setErrorMsg('Para crear tu cuenta tenés que aceptar los Términos y Condiciones y la Política de Privacidad.');
        return;
      }
      setIsLoading(true);
      setErrorMsg('');
      try {
        const auth = getAuth();
        const emailLimpio = formData.email.trim();
        const userCredential = await createUserWithEmailAndPassword(auth, emailLimpio, formData.password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'usuarios', user.uid);
        // El nombre y el resto de los datos se piden después, en el cuestionario de alta de cada tipo de cuenta.
        // OJO: si cambiás estos campos, cambialos también en src/utils/completarCuenta.js (recuperación de cuentas sin datos).
        await setDoc(userDocRef, {
          nombre: '',
          email: emailLimpio,
          rol: ['clinica', 'alumnx'].includes(accountType) ? accountType : 'profesional',
          slug: '',
          fechaRegistro: new Date().toISOString(),
          estado: 'pendiente',
          onboardingCompleto: false,
          onboardingPaso: 0,
          // Constancia de aceptación de términos (mismos nombres que en Capacitaciones)
          aceptaTerminos: true,
          fechaAceptacionTerminos: new Date().toISOString()
        });
        // Mail de bienvenida (si falla, no frena el registro)
        user.getIdToken()
          .then((token) => fetch('/api/enviar-mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tipo: 'bienvenida', rol: accountType })
          }))
          .catch((errorMail) => console.error('Error enviando el mail de bienvenida:', errorMail));

        // Releemos los datos del usuario para que la app sepa que es profesional y debe pasar por el cuestionario
        registrarEvento('registro_completado', { tipo_cuenta: accountType || 'profesional' });
        borrarBorrador();
        await refreshUser();
        // Si vino desde la Bolsa, el cuestionario lo sabe (?despues=bolsa) y al final le ofrece publicar
        navigate(`${rutaCuestionario(accountType)}${deBolsa ? `?${PARAM_DESPUES_BOLSA}` : ''}`);
      } catch (error) {
        setErrorMsg(traducirErrorFirebase(error.code));
      } finally {
        setIsLoading(false);
      }

    } else if (view === 'forgot_password') {
      setIsLoading(true);
      setErrorMsg('');
      try {
        // El mail sale por Brevo desde nuestra función de Vercel (con el diseño del Portal)
        await pedirRecuperacionClave(formData.email.trim());
        setView('recovery_sent'); 
      } catch (error) {
        setErrorMsg(traducirErrorFirebase(error.code));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderHeader = () => {
    if (view === 'forgot_password' || view === 'recovery_sent') return 'Recuperar Clave';
    if (view === 'register') return accountType ? 'Crear mi cuenta' : '¿Qué tipo de cuenta?';
    return 'Iniciar Sesión';
  };

  const handleBack = () => {
    if (view === 'register' && accountType) {
      setAccountType(null);
    } else {
      setView('login');
      setAccountType(null);
      setErrorMsg('');
    }
  };

  return (
    <div className={`min-h-screen md:h-screen md:overflow-hidden bg-[#E8EFEF] flex font-['Inter'] antialiased relative transition-opacity duration-500 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}>

      {/* En PC la pantalla no tiene scroll: si la ventana es baja, la tarjeta se achica un poco para entrar entera */}
      <style>{`
        @media (min-width: 768px) and (max-height: 640px) { .login-tarjeta { zoom: 0.9; } }
        @media (min-width: 768px) and (max-height: 560px) { .login-tarjeta { zoom: 0.78; } }
      `}</style>

      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 w-full z-[100] h-[72px] flex items-center px-8 md:px-10 pointer-events-none">
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center pointer-events-auto">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer transition-transform hover:scale-105 flex items-center gap-3"
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
              <div className="text-white text-3xl" style={{ lineHeight: '1' }}>Portal</div>
              <div className="text-white text-3xl" style={{ lineHeight: '0.9' }}>
                Veterinario<span className="text-[#4DB6AC]">.</span>
              </div>
            </div>
          </div>
               </div>
      </nav>

      {/* PANEL PROMOCIONAL (PC) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-[#1A3D3D] px-12 lg:px-20 pt-[120px] pb-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#2D6A6A]/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-white font-['Montserrat'] font-extrabold text-4xl lg:text-5xl tracking-tight leading-[1.1] mb-6">
            Una plataforma <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4DB6AC] to-[#2D6A6A]">pensada exclusivamente</span> <br />
            para la Veterinaria Argentina.
          </h2>
          <p className="text-white/70 text-[15px] lg:text-[16px] leading-relaxed max-w-[400px] mb-12">
            Unite a la primera cartilla diseñada exclusivamente para potenciar tu presencia, facilitar derivaciones y acceder a oportunidades laborales.
          </p>
        </div>
        <div className="relative z-10 mt-10">
          <p className="text-white/40 text-[12px] font-medium">© {new Date().getFullYear()} Portal Veterinario.</p>
        </div>
      </div>

      {/* FORMULARIO — con transición de entrada */}
      <div className="w-full md:w-[55%] lg:w-[50%] flex justify-center items-center md:p-3 relative pt-20 md:pt-3">
        <div
          className={`w-full max-w-[412px] md:max-w-[540px] bg-[#F4F7F7] min-h-[calc(100vh-80px)] md:min-h-[auto] md:h-auto relative shadow-2xl flex flex-col md:rounded-[40px] overflow-hidden md:max-h-[calc(100vh-24px)] md:overflow-y-auto login-tarjeta
           transition-none`}>

          <div className="bg-[#1A3D3D] pt-8 pb-14 px-8 md:pt-3 md:pb-7 rounded-b-[40px] md:rounded-t-[40px] relative overflow-hidden shrink-0 shadow-lg">
            {/* Flecha de volver: esquina superior izquierda de la tarjeta (celular y PC) */}
            {(view !== 'login' || accountType) && (
              <button
                onClick={handleBack}
                aria-label="Volver"
                className="absolute top-4 left-4 z-30 text-white bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md p-2 rounded-full hover:scale-105 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-[#2D6A6A] p-3 md:p-2 rounded-2xl mb-2 md:mb-0 shadow-inner border border-white/10">
                {view === 'forgot_password' || view === 'recovery_sent'
                  ? <KeyRound className="text-white w-8 h-8 md:w-6 md:h-6" />
                  : <ShieldCheck className="text-white w-8 h-8 md:w-6 md:h-6" />}
              </div>
              <p className="md:hidden text-white/80 text-[13px] font-medium max-w-[250px] leading-tight mt-2">
                {view === 'forgot_password' || view === 'recovery_sent'
                  ? 'Protegemos tu acceso profesional.'
                  : 'Bienvenido a tu espacio exclusivo.'}
              </p>
            </div>
          </div>

          <div className="flex-1 px-6 md:px-8 -mt-10 md:-mt-5 relative z-20 pb-8 md:pb-3 flex flex-col">
            <div className="bg-white rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] p-6 md:p-5 border border-gray-50 flex-1 flex flex-col">

              <h2 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-lg md:text-base text-center mb-6 md:mb-3 uppercase tracking-wider">
                {renderHeader()} 
              </h2>

              {/* Barra de cupos de socios vitalicios (solo en la pantalla de registro) */}
              {view === 'register' && (
                <div className="mb-5 md:mb-3 bg-[#1A3D3D] rounded-2xl border border-[#1A3D3D] p-5 md:px-4 md:py-3">
                  <BarraCupos integrada etiqueta="Profesionales" color="#60A5FA" pie={null} />
                  <BarraCupos
                    integrada
                    etiqueta="Clínicas"
                    endpoint="/api/cupos-clinicas"
                    limite={30}
                    color="#A78BFA"
                    textoQuedan="para ser clínica vitalicia."
                    textoAgotado="lugares vitalicios para clínicas ya fueron ocupados."
                    pie={null}
                  />
                  <p className="text-[11px] md:text-[11px] text-white/50 font-medium">
                    Después del límite, el acceso será por suscripción. <strong className="text-white font-black">¡Registrate ahora!</strong>
                  </p>
                </div>
              )}

                                   {view === 'register' && !accountType ? (
                <div className="space-y-3">
                  {[
                    { valor: 'profesional', label: 'Soy Profesional', sub: 'Veterinario/a que busca conectar y crecer.', Icono: Stethoscope, acento: 'bg-blue-50 text-blue-600', proximamente: false },
                    { valor: 'clinica', label: 'Soy una Clínica', sub: 'Institución que busca talento y visibilidad.', Icono: Hospital, acento: 'bg-violet-50 text-violet-600', proximamente: false },
                    { valor: 'alumnx', label: 'Soy Estudiante', sub: 'Estudiante de veterinaria que busca sus primeras experiencias.', Icono: GraduationCap, acento: 'bg-rose-50 text-rose-500', proximamente: false },
                    { valor: 'proveedor', label: 'Proveedor o empresa', sub: 'Insumos, equipamiento o servicios para el sector.', Icono: Store, acento: 'bg-emerald-50 text-emerald-600', proximamente: true },
                  ].map(({ valor, label, sub, Icono, acento, proximamente }) => (
                    <div key={valor} className="relative mt-4 md:mt-2.5 first:mt-0">
                      {proximamente && (
                        <div className="absolute -top-2.5 right-2 flex items-center gap-1.5 bg-gray-400 text-white text-[11px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full z-10">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse shrink-0"></span>
                          Próximamente
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={proximamente}
                        onClick={() => { if (proximamente) return; setAccountType(valor); setErrorMsg(''); }}
                        className={`w-full text-left p-4 md:p-3 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                          proximamente
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                            : 'border-[#2D6A6A]/40 hover:border-[#2D6A6A] hover:bg-[#F4F7F7] group active:scale-[0.98]'
                        }`}
                      >
                        <div className={`p-2.5 rounded-full transition-transform ${proximamente ? 'bg-gray-100 text-gray-400' : `${acento} group-hover:scale-110`}`}>
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
                              ) : view === 'recovery_sent' ? (
                <div className="flex flex-col items-center text-center space-y-4 py-6">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-[#1A3D3D] text-[16px]">¡Revisa tu bandeja!</h3>
                  <p className="text-[#666666] text-[13px] leading-relaxed max-w-[280px]">Hemos enviado un enlace de recuperación a <br /><strong className="text-[#1A3D3D]">{formData.email}</strong></p>
                  <button onClick={() => setView('login')} className="w-full mt-6 bg-[#2D6A6A] text-white font-bold rounded-xl py-4 flex items-center justify-center tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] transition-all">Volver al inicio</button>
                </div>
              ) : (
                <>
                  {view === 'forgot_password' && (
                    <p className="text-center text-[#666666] text-[12px] mb-6 leading-relaxed">Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                  )}

                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-[11px] font-semibold">{errorMsg}</p>
                    </div>
                  )}
                  {/* Si la contraseña estaba bien pero no cargaron sus datos, puede avisarnos con un toque */}
                  {errorMsg === MENSAJE_FALLA_DATOS && (
                    <BotonAvisarProblema lugar="ingreso" detalle={detalleError} className="mb-4" />
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-3">

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors"><Mail size={18} /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Correo electrónico" {...ATRIBUTOS_CAMPO_LOGIN}
                        className="w-full pl-11 pr-4 py-3.5 md:py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 transition-all outline-none" required />
                    </div>
                    {(view === 'login' || view === 'register') && (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors"><Lock size={18} /></div>
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" {...ATRIBUTOS_CAMPO_LOGIN}
                          className="w-full pl-11 pr-12 py-3.5 md:py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 transition-all outline-none" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#2D6A6A] transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    )}
                    {view === 'register' && (
                      <label className="flex items-start gap-3 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={aceptaTerminos}
                          onChange={(e) => { setAceptaTerminos(e.target.checked); if (errorMsg) setErrorMsg(''); }}
                          className="mt-0.5 w-4 h-4 shrink-0 accent-[#2D6A6A] cursor-pointer"
                        />
                        <span className="text-[12px] text-[#666666] leading-relaxed">
                          Acepto los{' '}
                          <a href="/terminos-y-condiciones" target="_blank" rel="noreferrer" className="font-bold text-[#2D6A6A] underline underline-offset-2 hover:text-[#1A3D3D]">Términos y Condiciones</a>
                          {' '}y la{' '}
                          <a href="/politica-de-privacidad" target="_blank" rel="noreferrer" className="font-bold text-[#2D6A6A] underline underline-offset-2 hover:text-[#1A3D3D]">Política de Privacidad</a>.
                        </span>
                      </label>
                    )}
                    {view === 'login' && (
                      <div className="flex justify-end pt-1">
                        <button type="button" onClick={() => setView('forgot_password')} className="text-[11px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] transition-colors">¿Olvidaste tu contraseña?</button>
                      </div>
                    )}
                    <button type="submit" disabled={isLoading}
                      className="w-full mt-2 bg-[#2D6A6A] text-white font-bold rounded-xl py-4 md:py-3 flex items-center justify-center gap-2 tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isLoading ? (
                        <><Loader2 size={16} className="animate-spin" /> Ingresando...</>
                      ) : (
                        <>
                          {view === 'login' && 'Ingresar a mi cuenta'}
                          {view === 'register' && 'Crear cuenta ahora'}
                          {view === 'forgot_password' && 'Enviar enlace'}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {(view === 'login' || view === 'register') && (
              <div className="mt-8 md:mt-2 text-center shrink-0">
                <p className="text-[12px] text-[#666666] font-medium">
                  {view === 'login' ? '¿Aún no eres parte de la red?' : '¿Ya tienes una cuenta?'}
                </p>
                {view === 'login' ? (
                  <button
                    onClick={() => { setView('register'); setAccountType(null); setErrorMsg(''); }}
                    className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#1A3D3D] hover:text-[#2D6A6A] transition-colors"
                  >
                    Solicitar Registro
                  </button>
                ) : (
                  <button
                    onClick={() => { setView('login'); setAccountType(null); setErrorMsg(''); }}
                    className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#1A3D3D] hover:text-[#2D6A6A] transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}