import React, { useState, useEffect } from 'react';
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
];

// Barra fina fija abajo: aparece cuando estás en tu cuenta de admin o dentro de una cuenta de prueba
export default function BannerModoPrueba() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [enModoPrueba, setEnModoPrueba] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Deja lugar abajo para que la barra no tape el final de las páginas
  useEffect(() => {
    if (!mostrar) return;
    const anterior = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '48px';
    return () => { document.body.style.paddingBottom = anterior; };
  }, [mostrar]);

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

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[9999] border-t shadow-[0_-4px_20px_rgba(26,61,61,0.08)] ${
      enModoPrueba
        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
        : 'bg-white border-gray-200 text-[#1A3D3D]'
    }`}>
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        {/* Etiqueta */}
        <div className="flex items-center gap-2 min-w-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          ) : (
            <FlaskConical className="w-4 h-4 shrink-0" strokeWidth={2} />
          )}
          <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest truncate">
            {enModoPrueba ? 'Modo prueba' : 'Cuentas de prueba'}
          </p>
          {error && (
            <p className="hidden sm:block text-[12px] font-medium text-red-500 truncate">{error}</p>
          )}
        </div>

        {/* Botones: tres cuentas de prueba + admin */}
        <div className="flex items-center gap-2 shrink-0">
          {CUENTAS.map(({ rol, etiqueta }) => {
            const activo = currentUser?.rol === rol;
            return (
              <button
                key={rol}
                onClick={() => handleSaltar(rol)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-300 ease-in-out disabled:opacity-60 ${
                  activo
                    ? 'bg-[#2D6A6A] text-white shadow-md cursor-default'
                    : enModoPrueba
                      ? 'bg-white text-[#1A3D3D] hover:bg-gray-200'
                      : 'bg-[#F4F7F7] text-[#1A3D3D] hover:bg-gray-200'
                }`}
              >
                {etiqueta}
              </button>
            );
          })}
          {/* Ver el cuestionario de alta de la cuenta de prueba (usa el modo corrección que ya existe) */}
          {enModoPrueba && (currentUser?.rol === 'profesional' || currentUser?.rol === 'clinica') && (
            <button
              onClick={() => navigate(
                currentUser.rol === 'clinica' ? '/onboarding-clinica' : '/onboarding',
                { state: { correccion: true, vistaPrueba: true } }
              )}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-[12px] font-bold bg-white text-[#1A3D3D] hover:bg-gray-200 transition-all duration-300 ease-in-out disabled:opacity-60 flex items-center gap-1.5"
            >
              <ClipboardList className="w-3.5 h-3.5" strokeWidth={2} />
              Onboarding
            </button>
          )}
          <button
            onClick={handleAdmin}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] transition-all duration-300 ease-in-out disabled:opacity-60 ${
              esAdmin ? 'ring-2 ring-[#4DB6AC]' : ''
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* En pantallas chicas el error va en una segunda línea */}
      {error && (
        <p className="sm:hidden px-4 pb-2 text-[11px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}