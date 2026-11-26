import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async';

import './index.css'

// Si publicamos una versión nueva mientras alguien tenía la página abierta, los pedazos viejos
// ya no existen y la pantalla quedaba en blanco: en ese caso recargamos una sola vez.
window.addEventListener('vite:preloadError', (evento) => {
  if (recargarUnaVez()) evento.preventDefault();
});

// Recarga la página una sola vez (si ya recargó hace menos de 10 segundos, no lo hace de nuevo)
const recargarUnaVez = () => {
  const yaRecargo = sessionStorage.getItem('recargaPorVersionNueva');
  if (yaRecargo && Date.now() - Number(yaRecargo) < 10000) return false;
  sessionStorage.setItem('recargaPorVersionNueva', String(Date.now()));
  window.location.reload();
  return true;
};

// Red de seguridad general: si algo se rompe, en vez de la pantalla en blanco mostramos un cartel con «Recargar».
// Si el error es porque publicamos una versión nueva (falta un pedazo de la página), recarga sola una vez.
class ErrorGeneral extends Component {
  constructor(props) {
    super(props);
    this.state = { hayError: false };
  }

  static getDerivedStateFromError() {
    return { hayError: true };
  }

  componentDidCatch(error) {
    console.error('Error en la página:', error);
    const mensaje = String(error?.message || '');
    if (/dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(mensaje)) recargarUnaVez();
  }

  render() {
    if (!this.state.hayError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center px-6 font-['Inter']">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <h1 className="font-['Montserrat'] font-bold text-[22px] text-[#1A3D3D] mb-2">Algo no cargó bien</h1>
          <p className="text-[14px] text-[#666666] mb-6">Puede pasar si actualizamos el sitio mientras lo tenías abierto. Recargá la página y listo.</p>
          <button type="button" onClick={() => window.location.reload()} className="bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white font-semibold text-[14px] px-6 py-3 rounded-2xl transition-colors">
            Recargar
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorGeneral>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
    </ErrorGeneral>
  </StrictMode>,
)