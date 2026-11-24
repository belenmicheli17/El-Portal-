import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { FlaskConical, Loader2, ClipboardList } from 'lucide-react';
import { auth, functions } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

// Cuentas de prueba a las que se puede saltar
const CUENTAS = [
  { rol: 'profesional', etiqueta: 'Profesional' },
  { rol: 'clinica', etiqueta: 'Clínica' },
  { rol: 'proveedor', etiqueta: 'Proveedor' },
  { rol: 'alumnx', etiqueta: 'Estudiante' },
];

// Barra fina fija abajo: aparece cuando estás en tu cuenta de admin o dentro de una cuenta de prueba
export default function BannerModoPrueba() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [enModoPrueba, setEnModoPrueba] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef(null);

  const esAdmin = currentUser?.rol === 'admin';
  const enPanelAdmin = location.pathname.startsWith('/admin');
  // Dentro del panel admin se esconde (ahí ya tenés el botón del Dashboard y el menú lateral)
  const mostrar = (esAdmin || enModoPrueba) && !enPanelAdmin;

  // Cada vez que cambia la cuenta, revisamos si la sesión trae la marca del servidor
  useEffect(() => {
    let cancelado = false;
    const revisarMarca = async () => {
      if (!auth.currentUser) {
        setEnModoPrueba(false);
        return;
      }
      try {
        const resultado = await auth.currentUser.getIdTokenResult();
        if (!cancelado) {
          setEnModoPrueba(Boolean(resultado.claims.impersonadaPor));
        }
      } catch (err) {
        console.error('Error revisando la sesión de prueba:', err);
        if (!cancelado) setEnModoPrueba(false);
      }
    };
    revisarMarca();
    return () => { cancelado = true; };
  }, [currentUser?.uid]);

    // Cierra la ventanita al tocar afuera o con Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const afuera = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setAbierto(false); };
    const escape = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', afuera);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', afuera);
      window.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  // Salta directo a la cuenta de prueba de otro rol
  const handleSaltar = async (rol) => {
    if (currentUser?.rol === rol) return; // ya estás en esa cuenta
    setIsLoading(true);
    setError('');
    try {
      const entrarComoPrueba = httpsCallable(functions, 'entrarComoPrueba');
      const respuesta = await entrarComoPrueba({ rolDestino: rol });
      await signInWithCustomToken(auth, respuesta.data.token);
      // Recarga completa para que toda la plataforma arranque con la cuenta nueva
      window.location.assign('/ecosistema');
    } catch (err) {
      console.error('Error saltando de cuenta de prueba:', err);
      setError('No hay una cuenta de prueba con ese rol o no pudimos entrar.');
      setIsLoading(false);
    }
  };

  // Botón Admin: si ya sos admin va al panel; si estás en una cuenta de prueba, vuelve a tu cuenta
  const handleAdmin = async () => {
    if (esAdmin) {
      navigate('/admin');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const volverDeCuentaPrueba = httpsCallable(functions, 'volverDeCuentaPrueba');
      const respuesta = await volverDeCuentaPrueba();
      await signInWithCustomToken(auth, respuesta.data.token);
      // Recarga completa: así toda la plataforma arranca ya como admin y no te rechaza la puerta del panel
      window.location.assign('/admin');
    } catch (err) {
      console.error('Error volviendo a la cuenta de la admin:', err);
      setError('No pudimos volver a tu cuenta. Probá de nuevo o cerrá sesión.');
      setIsLoading(false);
    }
  };

    if (!mostrar) return null;

  const claseCuenta = (activo) => `w-full px-4 py-2.5 rounded-xl text-[13px] font-bold text-left transition-all duration-300 ease-in-out disabled:opacity-60 ${
    activo ? 'bg-[#2D6A6A] text-white shadow-md cursor-default' : 'bg-[#F4F7F7] text-[#1A3D3D] hover:bg-gray-200'
  }`;

  return (
    <div ref={panelRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-[9999] flex items-center">
      {/* Ventanita con los botones, uno arriba del otro */}
      {abierto && (
        <div className="mr-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.18)] p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#2D6A6A] px-1 flex items-center gap-1.5">
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" strokeWidth={2} />}
            {enModoPrueba ? 'Modo prueba' : 'Cuentas de prueba'}
          </p>
          {CUENTAS.map(({ rol, etiqueta }) => (
            <button key={rol} onClick={() => handleSaltar(rol)} disabled={isLoading} className={claseCuenta(currentUser?.rol === rol)}>
              {etiqueta}
            </button>
          ))}
          {enModoPrueba && ['profesional', 'clinica', 'alumnx'].includes(currentUser?.rol) && (
            <button
              onClick={() => navigate(
                currentUser.rol === 'clinica' ? '/onboarding-clinica' : currentUser.rol === 'alumnx' ? '/onboarding-alumnx' : '/onboarding',
                { state: { correccion: true, vistaPrueba: true } }
              )}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl text-[13px] font-bold bg-white border border-gray-200 text-[#1A3D3D] hover:bg-gray-100 transition-all duration-300 ease-in-out disabled:opacity-60 flex items-center gap-1.5"
            >
              <ClipboardList className="w-3.5 h-3.5" strokeWidth={2} /> Onboarding
            </button>
          )}
          <button
            onClick={handleAdmin}
            disabled={isLoading}
            className={`w-full px-4 py-2.5 rounded-xl text-[13px] font-bold text-left bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] transition-all duration-300 ease-in-out disabled:opacity-60 ${esAdmin ? 'ring-2 ring-[#4DB6AC]' : ''}`}
          >
            Admin
          </button>
          {error && <p className="text-[11px] font-medium text-red-500 px-1">{error}</p>}
        </div>
      )}

      {/* Pestañita semioculta en el borde: se agranda al pasar el mouse */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Cambiar de cuenta de prueba"
        className={`h-14 rounded-l-xl flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out ${abierto ? 'w-9' : 'w-6 hover:w-9'} ${
          enModoPrueba ? 'bg-yellow-400 text-yellow-900' : 'bg-[#1A3D3D] text-white'
        }`}
      >
        <FlaskConical className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}