import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { pedirRecuperacionClave } from '../utils/recuperarClave';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader } from 'lucide-react';

// Cartelito de inicio de sesión (el mismo que usa la Sala de Espera).
// Se muestra pegado debajo del botón que lo abre. El cierre al hacer clic afuera lo maneja quien lo usa.
export default function LoginDropdown({ onClose }) {
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginView, setLoginView] = useState('login'); // 'login' | 'forgot' | 'sent'
  const [recuperando, setRecuperando] = useState(false);

  // Refs: algunos navegadores autocompletan los campos sin avisarle a React, así que leemos también el valor directo del input
  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);

  const handleLogin = async () => {
    const emailVal = loginEmailRef.current?.value || loginEmail;
    const passVal = loginPasswordRef.current?.value || loginPassword;

    if (!emailVal || !passVal) {
      setLoginError('Completá los dos campos para continuar.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, emailVal, passVal);
      const uid = userCredential.user.uid;
      const snap = await getDoc(doc(db, 'usuarios', uid));
      const rol = snap.data()?.rol;
      onClose();
      if (rol === 'admin') {
        navigate('/admin');
      } else {
        navigate('/ecosistema');
      }
    } catch (error) {
      console.error(error.code);
      setLoginError('Email o contraseña incorrectos. Intentá de nuevo.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailVal = loginEmailRef.current?.value || loginEmail;
    if (!emailVal) {
      setLoginError('Ingresá tu email para recuperar la contraseña.');
      return;
    }
    setLoginEmail(emailVal);
    setRecuperando(true);
    setLoginError('');
    try {
      // El mail sale por Brevo desde nuestra función de Vercel (con el diseño del Portal)
      await pedirRecuperacionClave(emailVal.trim());
      setLoginView('sent');
    } catch (error) {
      setLoginError('No pudimos enviar el correo. Revisá que el email esté bien escrito.');
    } finally {
      setRecuperando(false);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-3 w-[calc(100vw-64px)] md:w-[300px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(26,61,61,0.15)] border border-gray-100 p-6 z-[101] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-4">

      {/* ENCABEZADO */}
      <div>
        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px] leading-tight">
          {loginView === 'login' ? 'Bienvenido/a de vuelta' : loginView === 'forgot' ? 'Recuperar contraseña' : '¡Listo!'}
        </h3>
        <p className="text-gray-400 text-[12px] font-medium mt-0.5">
          {loginView === 'login' ? 'Ingresá con tu cuenta' : loginView === 'forgot' ? 'Te mandamos un link a tu correo' : 'Revisá tu bandeja de entrada'}
        </p>
      </div>

      {/* ERROR */}
      {loginError && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-600 text-[12px] font-medium">{loginError}</p>
        </div>
      )}

      {loginView === 'sent' ? (
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <CheckCircle className="w-10 h-10 text-[#2D6A6A]" strokeWidth={2} />
          <p className="text-[#555555] text-[13px] leading-relaxed">
            Te enviamos un link a<br />
            <span className="font-bold text-[#1A3D3D]">{loginEmail}</span>
          </p>
          <button
            onClick={() => { setLoginView('login'); setLoginError(''); }}
            className="mt-1 text-[#2D6A6A] text-[12px] font-bold hover:text-[#1A3D3D] transition-colors underline underline-offset-2"
          >
            Volver a iniciar sesión
          </button>
        </div>
      ) : (
        <>
          {/* FORMULARIO */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Email</label>
              <input
                ref={loginEmailRef}
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (loginView === 'forgot' ? handleForgotPassword() : handleLogin())}
                placeholder="tu@email.com"
                autoComplete="username"
                name="login-email"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium text-[#1A3D3D] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-colors"
              />
            </div>
            {loginView === 'login' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Contraseña</label>
                <div className="relative">
                  <input
                    ref={loginPasswordRef}
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    name="login-password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-[14px] font-medium text-[#1A3D3D] focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D6A6A] transition-colors p-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setLoginView('forgot'); setLoginError(''); }}
                  className="self-end mt-1 text-[11px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button
            onClick={loginView === 'forgot' ? handleForgotPassword : handleLogin}
            disabled={loginView === 'forgot' ? recuperando : loginLoading}
            className="w-full bg-[#1A3D3D] text-white font-bold text-[12px] uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#2D6A6A] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loginView === 'forgot'
              ? (recuperando ? <><Loader className="w-4 h-4 animate-spin" /> Enviando...</> : 'Enviar link')
              : (loginLoading ? <><Loader className="w-4 h-4 animate-spin" /> Ingresando...</> : 'Ingresar')
            }
          </button>

          {loginView === 'forgot' && (
            <button
              type="button"
              onClick={() => { setLoginView('login'); setLoginError(''); }}
              className="text-center text-[11px] font-semibold text-gray-400 hover:text-[#1A3D3D] transition-colors"
            >
              Volver a iniciar sesión
            </button>
          )}
        </>
      )}
    </div>
  );
}