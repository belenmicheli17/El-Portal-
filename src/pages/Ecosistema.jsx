import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, BookOpen, Package, Newspaper, Bell, ChevronRight, 
  Clock, Briefcase, Users, LogOut, Eye, ChevronDown, ChevronUp, Store 
} from 'lucide-react';

export default function Ecosistema() {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login'); 
    }
  }, [currentUser, loading, navigate]);

  // Pantalla de carga suave mientras valida la sesión
  if (loading) return <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center text-[#2D6A6A] font-bold">Cargando ecosistema...</div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] p-4 md:p-10 lg:p-12 relative overflow-hidden selection:bg-[#2D6A6A] selection:text-white">
      
      {/* Background Ambience (Burbujas generales de fondo) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[0%] left-[-10%] w-[50vw] h-[50vw] bg-[#2D6A6A]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] bg-[#4DB6AC]/15 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        {/* Encabezado con Botones de Acción (Ahora visible en todas las pantallas) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 w-full lg:w-[calc(66.666%-1rem)]">
          <div>
           
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tight">
   ¡Hola, {currentUser.nombre ? currentUser.nombre.split(' ')[0] : 'Profesional'}! <br className="hidden md:block" />
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
                Bienvenidx al ecosistema.
              </span>
            </h1>
             <h3 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] mb-2">¿Que te gustaría hacer hoy?</h3>
          </div>
          
          {/* Acciones de Cuenta */}
          <div className="flex flex-row items-center gap-3 w-full md:w-auto">
           <button 
              onClick={() => navigate(`/profesional/${currentUser?.slug}`)}
              className="bg-white/60 backdrop-blur-md border border-white/50 text-[#1A3D3D] px-4 py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] uppercase tracking-wider hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
            >
              <Eye className="w-4 h-4 text-[#2D6A6A]" /> Ver mi perfil
            </button>

            <button 
              onClick={() => navigate('/')}
              className="bg-[#1A3D3D]/5 hover:bg-red-50 text-[#1A3D3D]/70 hover:text-red-600 px-4 py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none border border-transparent hover:border-red-100"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>

        {/* Layout Principal: Cambiamos flex-col para controlar el orden en móvil */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 items-start">
          
          {/* Bloque: Tira de Notificaciones (Arriba en móvil, Derecha en PC) */}
          <div className="order-1 lg:order-2 lg:col-span-1 bg-[#E8EFEF]/80 backdrop-blur-xl border border-[#2D6A6A]/10 rounded-[24px] md:rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] lg:sticky lg:top-8 overflow-hidden">
            
            {/* Header de Notificaciones (Clickeable en móvil) */}
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-full flex items-center justify-between p-5 md:p-8 cursor-pointer lg:cursor-default lg:pointer-events-none focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#1A3D3D]" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[#E8EFEF]"></span>
                </div>
                <h2 className="text-[18px] md:text-[22px] font-black text-[#1A3D3D] font-['Montserrat'] leading-none mt-1">Actividad</h2>
              </div>
              <div className="lg:hidden text-[#1A3D3D]/50">
                {isNotifOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Contenedor con Scroll de Notificaciones (Oculto/Visible en móvil) */}
            <div className={`px-5 pb-5 md:px-8 md:pb-8 transition-all duration-300 ease-in-out ${isNotifOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[60vh] lg:opacity-100'} overflow-y-auto hide-scrollbar flex flex-col gap-4`}>
              
              {/* Notificación 1 */}
              <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-white hover:border-[#2D6A6A]/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[12px] md:text-[11px] font-bold text-[#2D6A6A] uppercase tracking-widest flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Capacitación
                  </span>
                  <span className="text-[12px] md:text-[11px] text-[#1A3D3D]/50 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Hoy
                  </span>
                </div>
                <p className="text-[#1A3D3D] font-semibold text-[13px] md:text-[14px] leading-snug mb-2 group-hover:text-[#2D6A6A] transition-colors">
                  Nuevo curso disponible: Ecografía Doppler en pequeños animales.
                </p>
                <div className="flex items-center gap-1 text-[12px] font-bold text-[#2D6A6A]">
                  Ver detalles <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Notificación 2 */}
              <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-white hover:border-[#2D6A6A]/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[12px] md:text-[11px] font-bold text-[#FF9800] uppercase tracking-widest flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Empleo
                  </span>
                  <span className="text-[12px] md:text-[11px] text-[#1A3D3D]/50 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Ayer
                  </span>
                </div>
                <p className="text-[#1A3D3D] font-semibold text-[13px] md:text-[14px] leading-snug">
                  Nueva búsqueda: Clínica San Marcos solicita especialista en cardiología.
                </p>
              </div>

            </div>
          </div>

          {/* Bloque Izquierdo: Herramientas (Abajo en móvil, Izquierda en PC) */}
          <div className="order-2 lg:order-1 lg:col-span-2 grid grid-cols-2 gap-3 md:gap-6 w-full">
            
            {/* Card 1: Editar Perfil (Visible para todos) */}
            <button 
              onClick={() => navigate(currentUser?.rol === 'clinica' ? '/editor-clinica' : currentUser?.rol === 'proveedor' ? '/editor-proveedores' : '/editor-profesional')}
              type="button"
              className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
            >
              <User strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
              <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Editar Perfil</h2>
              <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Actualizá tu información</p>
            </button>

            {/* Card Nueva: Mi Catálogo (SÓLO para proveedores) */}
            {currentUser?.rol === 'proveedor' && (
              <button 
                onClick={() => navigate('/editor-proveedores', { state: { tab: 'productos' } })}
                type="button"
                className="bg-[#1A3D3D]/5 backdrop-blur-xl border border-[#2D6A6A]/20 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
              >
                <Store strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
                <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Mi Catálogo</h2>
                <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Gestioná tus productos</p>
              </button>
            )}

            {/* Card 2: Capacitaciones (Oculta para proveedores) */}
            {currentUser?.rol !== 'proveedor' && (
              <button 
                onClick={() => navigate('/capacitaciones')}
                type="button"
                className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
              >
                <BookOpen strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
                <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Cursos</h2>
                <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Catálogo formativo</p>
              </button>
            )}

            {/* Card 3: Bolsa de Trabajo (Oculta para proveedores) */}
            {currentUser?.rol !== 'proveedor' && (
              <button 
                onClick={() => navigate('/bolsa-de-trabajo')}
                type="button"
                className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
              >
                <Briefcase strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
                <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Empleos</h2>
                <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Búsqueda de talentos</p>
              </button>
            )}

            {/* Card 4: Cartilla de Colegas (Oculta para proveedores) */}
            {currentUser?.rol !== 'proveedor' && (
              <button 
                onClick={() => navigate('/cartilla')}
                type="button"
                className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
              >
                <Users strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
                <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Colegas</h2>
                <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Red de derivaciones</p>
              </button>
            )}

            {/* Card 5: Proveedores (Visible para todos) */}
            <button 
              onClick={() => navigate('/cartilla-proveedores')}
              type="button"
              className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
            >
              <Package strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
              <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Proveedores</h2>
              <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Tus distribuidores</p>
            </button>

            {/* Card 6: Novedades (Oculta para proveedores) */}
            {currentUser?.rol !== 'proveedor' && (
              <button 
                onClick={() => navigate('/novedades')}
                type="button"
                className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
              >
                <Newspaper strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
                <h2 className="text-[15px] md:text-[20px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Novedades</h2>
                <p className="text-[#333333]/70 font-medium text-[12px] md:text-[13px] px-1">Últimas noticias</p>
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}