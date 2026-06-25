import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, BookOpen, Package, Newspaper, Bell, ChevronRight, 
  Clock, Briefcase, Users, LogOut, Eye, ChevronDown, ChevronUp, Store 
} from 'lucide-react';
import NotificationBox from '../components/NotificationBox';

// 💡 Subcomponente reutilizable para no repetir código (DRY)
const DashboardCard = ({ titulo, descripcion, icon: Icon, onClick, customBg = "bg-white/80" }) => (
  <button 
    onClick={onClick}
    type="button"
    className={`${customBg} backdrop-blur-xl border border-white/60 p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[180px] md:min-h-[210px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10`}
  >
    <Icon strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
    <h2 className="text-[17px] md:text-[21px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">{titulo}</h2>
    <p className="text-[#333333]/70 font-medium text-[14px] md:text-[15px] px-2 mb-3 leading-normal">{descripcion}</p>
    <span className="text-[13px] font-bold text-[#2D6A6A] group-hover:text-[#1A3D3D] flex items-center gap-1 transition-colors mt-auto">
      Ingresar <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
    </span>
  </button>
);

export default function Ecosistema() {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Extraemos 'logout' además de currentUser y loading
  const { currentUser, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login'); 
    }
  }, [currentUser, loading, navigate]);

  // Función para manejar el deslogueo correctamente
  const handleLogout = async () => {
    try {
      if (logout) await logout(); // Llama a la función de tu context
      navigate('/');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

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
        
        {/* GRILLA UNIFICADA */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 items-start">
          
          {/* 1. ENCABEZADO */}
          <div className="order-1 lg:col-span-2 w-full flex flex-col justify-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tight">
                ¡Hola, {currentUser.nombre ? currentUser.nombre.split(' ')[0] : 'Profesional'}! <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
                  Bienvenidx al ecosistema.
                </span>
              </h1>
              <h3 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] mb-2 mt-4">
                ¿Qué te gustaría hacer hoy?
              </h3>
            </div>
            
            {/* Acciones de Cuenta */}
            <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2">
              <button 
                onClick={() => navigate(`/profesional/${currentUser?.slug}`)}
                className="bg-white/60 backdrop-blur-md border border-white/50 text-[#1A3D3D] px-4 py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] uppercase tracking-wider hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
              >
                <Eye className="w-4 h-4 text-[#2D6A6A]" /> Ver mi perfil
              </button>

              <button 
                onClick={handleLogout}
                className="bg-[#1A3D3D]/5 hover:bg-red-50 text-[#1A3D3D]/70 hover:text-red-600 px-4 py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none border border-transparent hover:border-red-100"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          </div>

         <NotificationBox 
            isNotifOpen={isNotifOpen} 
            setIsNotifOpen={setIsNotifOpen} 
            userRole={currentUser?.rol || 'profesional'} 
          />
       {/* 3. HERRAMIENTAS (Cards adaptables) */}
          <div className={`order-3 w-full grid gap-3 md:gap-6 transition-all duration-500 ${isNotifOpen ? 'lg:col-span-2 grid-cols-2 lg:grid-cols-2' : 'lg:col-span-3 grid-cols-2 lg:grid-cols-3'}`}>
            
            <DashboardCard 
              titulo="Editar Perfil"
              descripcion="Actualizá tus datos profesionales y de contacto"
              icon={User}
              onClick={() => navigate(currentUser?.rol === 'clinica' ? '/editor-clinica' : currentUser?.rol === 'proveedor' ? '/editor-proveedores' : '/editor-profesional')}
            />

            {currentUser?.rol === 'proveedor' && (
              <DashboardCard 
                titulo="Mi Catálogo"
                descripcion="Gestioná tus productos y servicios veterinarios"
                icon={Store}
                customBg="bg-[#1A3D3D]/5"
                onClick={() => navigate('/editor-proveedores', { state: { tab: 'productos' } })}
              />
            )}

            {currentUser?.rol !== 'proveedor' && (
              <DashboardCard 
                titulo="Capacitaciones"
                descripcion="Enterate de los ultimos cursos y especializaciones para el sector"
                icon={BookOpen}
                onClick={() => navigate('/capacitaciones')}
              />
            )}

            {currentUser?.rol !== 'proveedor' && (
              <DashboardCard 
                titulo="Bolsa de trabajo"
                descripcion="Búsqueda de talentos activos"
                icon={Briefcase}
                onClick={() => navigate('/bolsa-de-trabajo')}
              />
            )}

            {currentUser?.rol !== 'proveedor' && (
              <DashboardCard 
                titulo="Colegas"
                descripcion="Red de contactos para derivaciones"
                icon={Users}
                onClick={() => navigate('/cartilla')}
              />
            )}

            <DashboardCard 
              titulo="Cartilla de Proveedores"
              descripcion="Directorio de distribuidores y laboratorios de confianza"
              icon={Package}
              onClick={() => navigate('/cartilla-proveedores')}
            />

            {currentUser?.rol !== 'proveedor' && (
              <DashboardCard 
                titulo="Publicaciones cientificas"
                descripcion="Encontra papers y actualizaciones del mundo veterinario"
                icon={Newspaper}
                onClick={() => navigate('/Papers')}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}