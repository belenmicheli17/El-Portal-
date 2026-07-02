import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RutaProtegidaAdmin({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  const esAdmin = currentUser?.rol === 'admin';

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}