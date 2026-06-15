import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RutaProtegidaAdmin({ children }) {
  // POR AHORA: Mantenemos el "Pase VIP" abierto (true) para que puedas seguir 
  // desarrollando y viendo el panel sin tener que loguearte a cada rato.
  const esAdmin = true; 

  if (!esAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  // IMPORTANTE: Esto es lo que faltaba. Si es admin, mostramos el contenido.
  return children;
}