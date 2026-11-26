import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { FlaskConical, Loader2, ClipboardList } from 'lucide-react';
import { auth, functions } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

// Cuentas de prueba a las que se puede saltar
const CUENTAS = [
  { rol: 'profesional', etiqueta: 'Profesional', onboarding: '/onboarding' },
  { rol: 'clinica', etiqueta: 'Clínica', onboarding: '/onboarding-clinica' },
  { rol: 'proveedor', etiqueta: 'Proveedor' }, // los proveedores no tienen cuestionario de alta
  { rol: 'alumnx', etiqueta: 'Estudiante', onboarding: '/onboarding-alumnx' },
];

// Para abrir el cuestionario de otra cuenta: primero se entra a esa cuenta (la página se recarga)
// y después se abre el cuestionario. Esto guarda adónde ir mientras tanto.
const CLAVE_IR_A = 'modoPruebaIrA';
// Altura donde dejaste la pestañita (se recuerda en este navegador)
const CLAVE_ALTURA = 'modoPruebaAltura';

// Barra fina fija abajo: aparece cuando estás en tu cuenta de admin o dentro de una cuenta de prueba
export default function BannerModoPrueba() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [enModoPrueba, setEnModoPrueba] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef(null);
  // Altura de la pestañita en la pantalla (en píxeles desde arriba). Se puede arrastrar.
  const [altura, setAltura] = useState(() => {
    try { const g = Number(localStorage.getItem(CLAVE_ALTURA)); if (g > 0) return g; } catch { /* sin memoria */ }
    return Math.round(window.innerHeight / 2);
  });
  const gesto = useRef(null); // datos del dedo/mouse mientras se arrastra la pestañita

  const esAdmin = currentUser?.rol === 'admin';
  // Es el único botón de modo prueba: se ve en todo el sitio, también dentro del panel admin
  const mostrar = esAdmin || enModoPrueba;

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

  // Si veníamos de tocar "cuestionario" de otra cuenta, al llegar lo abrimos
  useEffect(() => {
    if (!enModoPrueba || !currentUser?.rol) return;
    let destino = null;
    try { destino = JSON.parse(sessionStorage.getItem(CLAVE_IR_A) || 'null'); } catch { destino = null; }
    if (destino && destino.rol === currentUser.rol) {
      sessionStorage.removeItem(CLAVE_IR_A);
      navigate(destino.ruta, { state: { correccion: true, vistaPrueba: true } });
    }
  }, [enModoPrueba, currentUser?.rol, navigate]);

  // Abre el cuestionario de alta de un rol (si no estás en esa cuenta, primero entra a ella)
  const irAlOnboarding = (rol, ruta) => {
    if (currentUser?.rol === rol && enModoPrueba) {
      navigate(ruta, { state: { correccion: true, vistaPrueba: true } });
      setAbierto(false);
      return;
    }
    try { sessionStorage.setItem(CLAVE_IR_A, JSON.stringify({ rol, ruta })); } catch { /* sin memoria */ }
    handleSaltar(rol, true);
  };

  // ----- Pestañita: tocar abre/cierra; arrastrar arriba/abajo la mueve; deslizar hacia el borde la cierra -----
  const alApretar = (e) => {
    gesto.current = { x: e.clientX, y: e.clientY, alturaInicial: altura, movio: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const alMover = (e) => {
    const g = gesto.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.movio && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    g.movio = true;
    if (Math.abs(dy) >= Math.abs(dx)) {
      const minimo = 60;
      const maximo = window.innerHeight - 60;
      setAltura(Math.min(maximo, Math.max(minimo, g.alturaInicial + dy)));
    } else if (dx > 30 && abierto) {
      setAbierto(false); // deslizó hacia el borde
    }
  };
  const alSoltar = () => {
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;
    if (!g.movio) { setAbierto((v) => !v); return; }
    try { localStorage.setItem(CLAVE_ALTURA, String(Math.round(altura))); } catch { /* sin memoria */ }
  };
  // En la cajita: deslizar el dedo hacia el borde derecho la cierra
  const toqueCajita = useRef(null);

  // Salta directo a la cuenta de prueba de otro rol
  const handleSaltar = async (rol, aunqueSeaLaMisma = false) => {
    if (currentUser?.rol === rol && !aunqueSeaLaMisma) return; // ya estás en esa cuenta
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

  return (
    // Solapa pegada al borde derecho: la pestañita y la cajita se deslizan juntas.
    // Cerrada, solo asoma la pestañita; abierta, entra la cajita detrás de ella.
    <div
      ref={panelRef}
      className="fixed right-0 z-[9999] flex items-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ top: `${altura}px`, transform: `translateY(-50%) translateX(${abierto ? '0' : '13rem'})` }}
    >
      {/* Pestañita: es la manija de la solapa (también se arrastra para moverla) */}
      <button
        type="button"
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => { gesto.current = null; }}
        aria-label="Cambiar de cuenta de prueba (arrastrá para moverla)"
        aria-expanded={abierto}
        className={`h-14 w-8 rounded-l-xl flex items-center justify-center shadow-lg transition-colors duration-300 touch-none cursor-grab active:cursor-grabbing ${
          enModoPrueba ? 'bg-yellow-400 text-yellow-950' : 'bg-[#1A3D3D] text-white'
        }`}
      >
        <FlaskConical className="w-4 h-4" strokeWidth={2} />
      </button>

      {/* Cajita con las cuentas */}
      <div
        className={`w-52 bg-yellow-50 border-y border-l-4 border-yellow-400 rounded-l-2xl p-3 flex flex-col gap-2 transition-shadow duration-500 ${abierto ? 'shadow-[0_8px_30px_rgba(120,53,15,0.18)]' : 'shadow-none'}`}
        aria-hidden={!abierto}
        onTouchStart={(e) => { toqueCajita.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const inicio = toqueCajita.current;
          toqueCajita.current = null;
          if (inicio != null && e.changedTouches[0].clientX - inicio > 50) setAbierto(false);
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-900 px-1 flex items-center gap-1.5">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" strokeWidth={2} />}
          {enModoPrueba ? 'Modo prueba' : 'Cuentas de prueba'}
        </p>
        {CUENTAS.map(({ rol, etiqueta, onboarding }) => {
          const activo = currentUser?.rol === rol;
          return (
            // Un solo botón por cuenta, partido en dos: el nombre (entrar) | el ícono (cuestionario de alta)
            <div
              key={rol}
              className={`flex items-stretch rounded-xl overflow-hidden transition-all duration-300 ${
                activo ? 'bg-yellow-400 text-yellow-950 shadow-sm' : 'bg-white text-yellow-950'
              }`}
            >
              <button
                onClick={() => handleSaltar(rol)}
                disabled={isLoading}
                tabIndex={abierto ? 0 : -1}
                className={`flex-1 min-w-0 px-4 py-2.5 text-[13px] font-bold text-left disabled:opacity-60 transition-colors ${activo ? 'cursor-default' : 'hover:bg-yellow-100'}`}
              >
                {etiqueta}
              </button>
              {onboarding && (
                <button
                  type="button"
                  onClick={() => irAlOnboarding(rol, onboarding)}
                  disabled={isLoading}
                  tabIndex={abierto ? 0 : -1}
                  title={`Ver el cuestionario de alta de ${etiqueta}`}
                  aria-label={`Ver el cuestionario de alta de ${etiqueta}`}
                  className={`w-10 shrink-0 flex items-center justify-center border-l transition-colors disabled:opacity-60 ${activo ? 'border-yellow-600/40 hover:bg-yellow-500' : 'border-yellow-200 hover:bg-yellow-100'}`}
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