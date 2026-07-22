import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft,
  ArrowRight, KeyRound, CheckCircle2, Stethoscope,
  Hospital, Store, Loader2, AlertCircle
} from 'lucide-react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const traducirErrorFirebase = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use': return 'Este correo ya está registrado. ¿Intentaste iniciar sesión?';
    case 'auth/invalid-email': return 'El formato del correo no es válido. Revisá que no haya espacios al final.';
    case 'auth/weak-password': return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/user-not-found': return 'No encontramos ninguna cuenta con este correo.';
    case 'auth/wrong-password': return 'La contraseña es incorrecta.';
    case 'auth/invalid-credential': return 'El correo o la contraseña son incorrectos.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Por seguridad, intentá de nuevo más tarde.';
    case 'auth/network-request-failed': return 'Error de conexión. Revisá tu internet y volvé a intentar.';
    default: return `Ocurrió un error inesperado (${errorCode || 'Desconocido'}). Intentá de nuevo.`;
  }
};

export default function Login() {
  const [view, setView] = useState('login');
  const [accountType, setAccountType] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // ── Transición de entrada ──────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);

  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const navigate = useNavigate();

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
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          navigate(userData.rol === 'admin' ? '/admin' : '/ecosistema');
        } else {
          navigate('/ecosistema');
        }
      } catch (error) {
        setErrorMsg(traducirErrorFirebase(error.code));
      } finally {
        setIsLoading(false);
      }

    } else if (view === 'register') {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        const slugGenerado = formData.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const userDocRef = doc(db, 'usuarios', user.uid);
        const necesitaValidacion = accountType === 'profesional' || accountType === 'clinica';
        await setDoc(userDocRef, {
          nombre: formData.nombre,
          email: formData.email,
          rol: accountType,
          slug: slugGenerado,
          fechaRegistro: new Date().toISOString(),
          estado: necesitaValidacion ? 'pendiente' : 'activo'
        });
        navigate('/ecosistema');
      } catch (error) {
        setErrorMsg(traducirErrorFirebase(error.code));
      } finally {
        setIsLoading(false);
      }

    } else if (view === 'forgot_password') {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, formData.email);
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
    if (view === 'register') return accountType ? 'Completar Datos' : '¿Qué tipo de cuenta?';
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
    <div className={`min-h-screen bg-[#E8EFEF] flex font-['Inter'] antialiased relative transition-opacity duration-500 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}>

      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 w-full z-[100] h-[72px] flex items-center px-8 md:px-10 pointer-events-none">
        <div className="max-w-[1100px] mx-auto w-full flex justify-between items-center pointer-events-auto">
          <div
            onClick={() => navigate('/')}
            className="font-['Montserrat'] font-extrabold text-2xl tracking-tighter cursor-pointer text-[#1A3D3D] md:text-white transition-transform hover:scale-105"
          >
            El Portal<span className="text-[#2D6A6A] md:text-[#4DB6AC]">.</span>
          </div>
          {(view !== 'login' || accountType) && (
            <button onClick={handleBack} className="text-[#1A3D3D] bg-white/70 backdrop-blur-md p-2.5 md:p-2 rounded-full hover:bg-white hover:scale-105 transition-all shadow-sm border border-gray-200/50">
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
      </nav>

      {/* PANEL PROMOCIONAL (PC) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-[#1A3D3D] px-12 lg:px-20 pt-[120px] pb-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#2D6A6A]/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
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
          <p className="text-white/40 text-[12px] font-medium">© {new Date().getFullYear()} El Portal Veterinario.</p>
        </div>
      </div>

      {/* FORMULARIO — con transición de entrada */}
      <div className="w-full md:w-[55%] lg:w-[50%] flex justify-center items-center md:p-6 relative pt-20 md:pt-6">
        <div
          className={`w-full max-w-[412px] md:max-w-[440px] bg-[#F4F7F7] min-h-[calc(100vh-80px)] md:min-h-[auto] md:h-auto relative shadow-2xl flex flex-col md:rounded-[40px] overflow-hidden
           transition-none`}>

          <div className="bg-[#1A3D3D] pt-8 pb-14 px-8 md:pt-10 md:pb-12 rounded-b-[40px] md:rounded-t-[40px] relative overflow-hidden shrink-0 shadow-lg">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-[#2D6A6A] p-3 md:p-2.5 rounded-2xl mb-2 shadow-inner border border-white/10">
                {view === 'forgot_password' || view === 'recovery_sent'
                  ? <KeyRound className="text-white w-8 h-8 md:w-6 md:h-6" />
                  : <ShieldCheck className="text-white w-8 h-8 md:w-6 md:h-6" />}
              </div>
              <p className="text-white/80 text-[13px] font-medium max-w-[250px] leading-tight mt-2">
                {view === 'forgot_password' || view === 'recovery_sent'
                  ? 'Protegemos tu acceso profesional.'
                  : 'Bienvenido a tu espacio exclusivo.'}
              </p>
            </div>
          </div>

          <div className="flex-1 px-6 md:px-8 -mt-10 md:-mt-8 relative z-20 pb-8 flex flex-col">
            <div className="bg-white rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] p-6 md:p-6 border border-gray-50 flex-1 flex flex-col">

              <h2 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-lg md:text-base text-center mb-6 md:mb-4 uppercase tracking-wider">
                {renderHeader()}
              </h2>

              {view === 'register' && !accountType ? (
                <div className="space-y-4 md:space-y-3">
                  <button onClick={() => setAccountType('profesional')} className="w-full text-left p-4 md:p-3.5 rounded-2xl border-2 border-gray-100 hover:border-[#2D6A6A] hover:bg-[#F4F7F7] transition-all group flex items-center gap-4">
                    <div className="bg-blue-50 p-3 md:p-2.5 rounded-full text-blue-600 group-hover:scale-110 transition-transform"><Stethoscope size={20} /></div>
                    <div><h3 className="font-bold text-[#1A3D3D] text-[15px] md:text-[14px]">Soy Profesional</h3><p className="text-gray-500 text-[11px] leading-tight mt-1">Veterinario/a, busco conectar y acceder a recursos.</p></div>
                  </button>
                  <button onClick={() => setAccountType('clinica')} className="w-full text-left p-4 md:p-3.5 rounded-2xl border-2 border-gray-100 hover:border-[#2D6A6A] hover:bg-[#F4F7F7] transition-all group flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 md:p-2.5 rounded-full text-emerald-600 group-hover:scale-110 transition-transform"><Hospital size={20} /></div>
                    <div><h3 className="font-bold text-[#1A3D3D] text-[15px] md:text-[14px]">Soy una Clínica</h3><p className="text-gray-500 text-[11px] leading-tight mt-1">Busco publicar ofertas de empleo y derivaciones.</p></div>
                  </button>
                  <button onClick={() => setAccountType('proveedor')} className="w-full text-left p-4 md:p-3.5 rounded-2xl border-2 border-gray-100 hover:border-[#2D6A6A] hover:bg-[#F4F7F7] transition-all group flex items-center gap-4">
                    <div className="bg-purple-50 p-3 md:p-2.5 rounded-full text-purple-600 group-hover:scale-110 transition-transform"><Store size={20} /></div>
                    <div><h3 className="font-bold text-[#1A3D3D] text-[15px] md:text-[14px]">Proveedor</h3><p className="text-gray-500 text-[11px] leading-tight mt-1">Ofrezco insumos, equipamiento o servicios.</p></div>
                  </button>
                </div>
              ) : view === 'recovery_sent' ? (
                <div className="flex flex-col items-center text-center space-y-4 py-6">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-[#1A3D3D] text-[16px]">¡Revisa tu bandeja!</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed max-w-[280px]">Hemos enviado un enlace de recuperación a <br /><strong className="text-[#1A3D3D]">{formData.email}</strong></p>
                  <button onClick={() => setView('login')} className="w-full mt-6 bg-[#2D6A6A] text-white font-bold rounded-xl py-4 flex items-center justify-center tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] transition-all">Volver al inicio</button>
                </div>
              ) : (
                <>
                  {view === 'forgot_password' && (
                    <p className="text-center text-gray-500 text-[12px] mb-6 leading-relaxed">Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                  )}

                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-[11px] font-semibold">{errorMsg}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-3">
                    {view === 'register' && accountType && (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors">
                          {accountType === 'profesional' ? <Stethoscope size={18} /> : accountType === 'clinica' ? <Hospital size={18} /> : <Store size={18} />}
                        </div>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                          placeholder={accountType === 'profesional' ? 'Tu Matrícula Profesional' : accountType === 'clinica' ? 'Nombre de la Clínica' : 'Nombre de Proveedor'}
                          className="w-full pl-11 pr-4 py-3.5 md:py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 transition-all outline-none" required />
                      </div>
                    )}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors"><Mail size={18} /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Correo electrónico"
                        className="w-full pl-11 pr-4 py-3.5 md:py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 transition-all outline-none" required />
                    </div>
                    {(view === 'login' || view === 'register') && (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors"><Lock size={18} /></div>
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña"
                          className="w-full pl-11 pr-12 py-3.5 md:py-3 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 transition-all outline-none" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#2D6A6A] transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
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
              <div className="mt-8 md:mt-6 text-center shrink-0">
                <p className="text-[12px] text-gray-500 font-medium">{view === 'login' ? '¿Aún no eres parte de la red?' : '¿Ya tienes una cuenta?'}</p>
                <button
                  onClick={() => { setView(view === 'login' ? 'register' : 'login'); setAccountType(null); setErrorMsg(''); }}
                  className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#1A3D3D] hover:text-[#2D6A6A] transition-colors"
                >
                  {view === 'login' ? 'Solicitar Registro' : 'Iniciar Sesión'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}