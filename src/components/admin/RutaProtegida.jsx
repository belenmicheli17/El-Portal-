import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar';

export default function RutaProtegida({ useLayout = false }) {
  const { currentUser, loading } = useAuth();

  // Mientras Firebase confirma la sesión, mostramos pantalla en blanco
  // Esto evita el flasheo que redirige al login por error
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/Login" replace />;
  }

  if (useLayout) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="pt-[72px] flex-grow">
          <Outlet />
        </main>
      </div>
    );
  }

  return <Outlet />;
}