import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async';

import './index.css'

// Si publicamos una versión nueva mientras alguien tenía la página abierta, los pedazos viejos
// ya no existen y la pantalla quedaba en blanco: en ese caso recargamos una sola vez.
window.addEventListener('vite:preloadError', (evento) => {
  const yaRecargo = sessionStorage.getItem('recargaPorVersionNueva');
  if (!yaRecargo || Date.now() - Number(yaRecargo) > 10000) {
    evento.preventDefault();
    sessionStorage.setItem('recargaPorVersionNueva', String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)