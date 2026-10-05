import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';

// Traduce los errores de Firebase a mensajes simples
const traducirError = (code) => {
  switch (code) {
    case 'auth/weak-password': return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed': return 'Error de conexión. Revisá tu internet y volvé a intentar.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Intentá de nuevo en unos minutos.';
    default: return 'No pudimos guardar tu contraseña. Intentá de nuevo.';
  }
};

export default function RestablecerClave() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // El código secreto y el tipo de pedido vienen en el link del mail
  const codigo = searchParams.get('oobCode');
  const modo = searchParams.get('mode');

  // paso: 'verificando' | 'formulario' | 'exito' | 'invalido'
  const [paso, setPaso] = useState('verificando');
  const [emailCuenta, setEmailCuenta] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tipografías del Portal
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Al abrir la página comprobamos que el link sea válido (no vencido ni usado)
  useEffect(() => {
    const verificar = async () => {
      if (!codigo || (modo && modo !== 'resetPassword')) {
        setPaso('invalido');
        return;
      }
      try {
        const email = await verifyPasswordResetCode(auth, codigo);
        setEmailCuenta(email);
        setPaso('formulario');
      } catch (error) {
        console.error('Link de recuperación inválido:', error.code);
        setPaso('invalido');
      }
    };
    verificar();
  }, [codigo, modo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Las dos contraseñas no coinciden. Revisalas y volvé a intentar.');
      return;
    }
    setGuardando(true);
    setErrorMsg('');
    try {
      await confirmPasswordReset(auth, codigo, password);
      setPaso('exito');
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error.code);
      // Si el link venció o ya se usó mientras tanto, mostramos la pantalla de link inválido
      if (error.code === 'auth/expired-action-code' || error.code === 'auth/invalid-action-code') {
        setPaso('invalido');
      } else {
        setErrorMsg(traducirError(error.code));
      }
    } finally {
      setGuardando(false);
    }
  };

  const titulo =
    paso === 'exito' ? 'Contraseña cambiada' :
    paso === 'invalido' ? 'Link no válido' :
    'Nueva contraseña';

  return (
    <div className="min-h-screen bg-[#E8EFEF] flex justify-center items-center p-4 font-['Inter'] antialiased">
      <div className="w-full max-w-[440px] bg-[#F4F7F7] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        {/* CABECERA */}
        <div className="bg-[#1A3D3D] pt-8 pb-14 px-8 rounded-b-[40px] relative overflow-hidden shrink-0 shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-[#2D6A6A] p-3 rounded-2xl mb-3 shadow-inner border border-white/10">
              <KeyRound className="text-white w-8 h-8" />
            </div>
            <p className="text-white font-['Montserrat'] font-extrabold text-xl tracking-tight">
              Portal Veterinario<span className="text-[#4DB6AC]">.</span>
            </p>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="px-6 md:px-8 -mt-10 relative z-20 pb-8">
          <div className="bg-white rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] p-6 border border-gray-50">

            <h2 className="text-[#1A3D3D] font-['Montserrat'] font-bold text-lg text-center mb-5 uppercase tracking-wider">
              {titulo}
            </h2>

            {/* VERIFICANDO EL LINK */}
            {paso === 'verificando' && (
              <div className="flex flex-col items-center text-center gap-3 py-6">
                <Loader2 className="w-8 h-8 text-[#2D6A6A] animate-spin" />
                <p className="text-gray-500 text-[13px]">Verificando tu link...</p>
              </div>
            )}

            {/* LINK VENCIDO O YA USADO */}
            {paso === 'invalido' && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-500 text-[13px] leading-relaxed max-w-[280px]">
                  Este link ya no sirve: puede haber vencido o ya lo usaste. No pasa nada, pedí uno nuevo desde el inicio de sesión con la opción “¿Olvidaste tu contraseña?”.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-2 bg-[#2D6A6A] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Ir a iniciar sesión <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* TODO SALIÓ BIEN */}
            {paso === 'exito' && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-bold text-[#1A3D3D] text-[16px]">¡Listo!</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed max-w-[280px]">
                  Tu contraseña se cambió correctamente. Ya podés ingresar con la nueva.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-2 bg-[#2D6A6A] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Ingresar a mi cuenta <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* FORMULARIO */}
            {paso === 'formulario' && (
              <>
                <p className="text-center text-gray-500 text-[12px] mb-5 leading-relaxed">
                  Elegí una contraseña nueva para<br />
                  <strong className="text-[#1A3D3D]">{emailCuenta}</strong>
                </p>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-red-600 text-[11px] font-semibold">{errorMsg}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors"><Lock size={18} /></div>
                    <input
                      type={verPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(''); }}
                      placeholder="Nueva contraseña"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-12 py-3.5 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 transition-all outline-none"
                      required
                    />
                    <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#2D6A6A] transition-colors">
                      {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D6A6A] transition-colors"><Lock size={18} /></div>
                    <input
                      type={verPassword ? 'text' : 'password'}
                      value={password2}
                      onChange={(e) => { setPassword2(e.target.value); if (errorMsg) setErrorMsg(''); }}
                      placeholder="Repetí la contraseña"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F4F7F7] border border-transparent rounded-xl text-[13px] text-[#1A3D3D] placeholder-gray-400 focus:bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 transition-all outline-none"
                      required
                    />
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">Mínimo 6 caracteres.</p>

                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full bg-[#2D6A6A] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 tracking-[0.1em] text-[12px] uppercase shadow-lg shadow-[#2D6A6A]/30 hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {guardando ? (
                      <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                    ) : (
                      <>Guardar contraseña <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}