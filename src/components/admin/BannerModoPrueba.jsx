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

  const claseCuenta = (activo) => `flex-1 min-w-0 px-4 py-2.5 rounded-xl text-[13px] font-bold text-left transition-all duration-300 ease-in-out disabled:opacity-60 ${
    activo ? 'bg-yellow-400 text-yellow-950 shadow-sm cursor-default' : 'bg-white text-yellow-950 hover:bg-yellow-100'
  }`;
  // Mini botón para volver a ver el cuestionario de alta de la cuenta de prueba en la que estás
  const puedeVerOnboarding = enModoPrueba && ['profesional', 'clinica', 'alumnx'].includes(currentUser?.rol);
  const irAlOnboarding = () => navigate(
    currentUser.rol === 'clinica' ? '/onboarding-clinica' : currentUser.rol === 'alumnx' ? '/onboarding-alumnx' : '/onboarding',
    { state: { correccion: true, vistaPrueba: true } }
  );

  return (
    // Solapa pegada al borde derecho: la pestañita y la cajita se deslizan juntas.
    // Cerrada, solo asoma la pestañita; abierta, entra la cajita detrás de ella.
    <div
      ref={panelRef}
      className="fixed right-0 top-1/2 z-[9999] flex items-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ transform: `translateY(-50%) translateX(${abierto ? '0' : '13rem'})` }}
    >
      {/* Pestañita: es la manija de la solapa */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Cambiar de cuenta de prueba"
        aria-expanded={abierto}
        className={`h-14 w-8 rounded-l-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${
          enModoPrueba ? 'bg-yellow-400 text-yellow-950' : 'bg-[#1A3D3D] text-white'
        }`}
      >
        <FlaskConical className="w-4 h-4" strokeWidth={2} />
      </button>

      {/* Cajita con las cuentas */}
      <div className={`w-52 bg-yellow-50 border-y border-l-4 border-yellow-400 rounded-l-2xl p-3 flex flex-col gap-2 transition-shadow duration-500 ${abierto ? 'shadow-[0_8px_30px_rgba(120,53,15,0.18)]' : 'shadow-none'}`} aria-hidden={!abierto}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-900 px-1 flex items-center gap-1.5">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" strokeWidth={2} />}
          {enModoPrueba ? 'Modo prueba' : 'Cuentas de prueba'}
        </p>
        {CUENTAS.map(({ rol, etiqueta }) => {
          const activo = currentUser?.rol === rol;
          return (
            <div key={rol} className="flex items-stretch gap-1.5">
              <button onClick={() => handleSaltar(rol)} disabled={isLoading} tabIndex={abierto ? 0 : -1} className={claseCuenta(activo)}>
                {etiqueta}
              </button>
              {activo && puedeVerOnboarding && (
                <button
                  type="button"
                  onClick={irAlOnboarding}
                  disabled={isLoading}
                  tabIndex={abierto ? 0 : -1}
                  title="Ver el cuestionario de alta"
                  aria-label="Ver el cuestionario de alta"
                  className="w-10 shrink-0 rounded-xl bg-white border border-yellow-300 text-yellow-900 hover:bg-yellow-100 flex items-center justify-center transition-colors disabled:opacity-60"
                >
                  <ClipboardList className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={handleAdmin}
          disabled={isLoading}
          tabIndex={abierto ? 0 : -1}
          className={`w-full px-4 py-2.5 rounded-xl text-[13px] font-bold text-left bg-yellow-900 text-white hover:bg-yellow-950 transition-all duration-300 ease-in-out disabled:opacity-60 ${esAdmin ? 'ring-2 ring-yellow-400' : ''}`}
        >
          Admin
        </button>
        {error && <p className="text-[11px] font-medium text-red-600 px-1">{error}</p>}
      </div>
    </div>
  );
}