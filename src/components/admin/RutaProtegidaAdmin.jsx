import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RutaProtegidaAdmin({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
      </div>
    );
  }

  const esAdmin = currentUser?.rol === 'admin';

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}