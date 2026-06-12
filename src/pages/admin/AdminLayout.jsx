import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CheckSquare, Briefcase, 
  Settings, LogOut, Menu, X, ShieldAlert 
} from 'lucide-react';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Inyección de la fuente de Google (si no está global)
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Lista de rutas del panel
  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', exact: true },
    { path: '/admin/validaciones', icon: <CheckSquare className="w-5 h-5" />, label: 'Validaciones' },
    { path: '/admin/usuarios', icon: <Users className="w-5 h-5" />, label: 'Gestión Usuarios' },
    { path: '/admin/bolsa', icon: <Briefcase className="w-5 h-5" />, label: 'Bolsa de Trabajo' },
    { path: '/admin/configuracion', icon: <Settings className="w-5 h-5" />, label: 'Configuración' },
  ];

  const handleLogout = () => {
    // Acá a futuro irá la lógica de Firebase Auth: signOut(auth)
    alert("Cerrando sesión segura...");
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#F4F7F7] font-['Inter'] overflow-hidden">
      
      {/* ==========================================
          1. SIDEBAR (Navegación Lateral)
          ========================================== */}
      
      {/* Overlay oscuro para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#1A3D3D]/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Menú Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1A3D3D] text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-2xl ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Logo / Título del Panel */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-5 h-5 text-[#4DB6AC]" />
            </div>
            <div>
              <h1 className="font-['Montserrat'] font-black text-[16px] tracking-tight leading-none text-white">El Portal</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4DB6AC]">Admin Panel</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 hide-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-[13px] transition-all duration-200
                ${isActive 
                  ? 'bg-[#2D6A6A] text-white shadow-lg' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del Sidebar (Botón Salir) */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-[13px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión Segura
          </button>
        </div>
      </aside>

      {/* ==========================================
          2. ÁREA DE CONTENIDO PRINCIPAL
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-[#1A3D3D] hover:bg-gray-100 p-2 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px] md:text-[22px] hidden sm:block">
              Centro de Control
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-bold text-[#1A3D3D]">Hola, Belén</p>
              <p className="text-[11px] font-semibold text-[#2D6A6A] uppercase tracking-widest">Super Admin</p>
            </div>
            <div className="w-10 h-10 bg-[#1A3D3D] rounded-full flex items-center justify-center border-2 border-[#4DB6AC]/30 shadow-sm">
              <span className="font-['Montserrat'] font-black text-white text-[14px]">B</span>
            </div>
          </div>
        </header>

        {/* Contenedor Dinámico (Acá se renderizan las páginas) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* El componente Outlet inyecta el contenido de la ruta hija actual */}
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}