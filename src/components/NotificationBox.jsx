import React from 'react';
import { Bell, Clock, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import useNotifications from '../hooks/useNotifications'; // Ajustá la ruta si tu carpeta hooks está en otro lado
import { useNavigate } from 'react-router-dom';
export default function NotificationBox({ isNotifOpen, setIsNotifOpen, userRole, userId }) {
  const { notificaciones, cargando } = useNotifications(userRole, userId);
  const navigate = useNavigate();
  
  return (
    <div className={`order-2 lg:col-span-1 bg-[#E8EFEF]/80 backdrop-blur-xl border border-[#2D6A6A]/10 rounded-[24px] md:rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden w-full transition-all duration-500 ease-in-out ${isNotifOpen ? 'lg:row-span-2' : ''}`}>
      {/* 2. NOTIFICACIONES */}
      {/* Header Notificaciones (Fijo) */}
      <div className="w-full flex items-center gap-3 p-5 md:p-6 shrink-0">
        <div className="relative">
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#1A3D3D]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF9800] rounded-full border-2 border-[#E8EFEF]"></span>
        </div>
        <h2 className="text-[18px] md:text-[22px] font-black text-[#1A3D3D] font-['Montserrat'] leading-none mt-1">Actividad</h2>
      </div>

      {/* Contenedor dinámico de la lista (Límite visual de 10 notificaciones, con scroll) */}
      <div className={`px-5 md:px-6 flex flex-col gap-3 transition-all duration-500 ease-in-out overflow-hidden ${isNotifOpen ? 'max-h-[400px] overflow-y-auto pb-4 hide-scrollbar' : 'max-h-[170px]'}`}>
        
        {cargando ? (
          <p className="text-center text-[#1A3D3D]/50 text-[13px] font-medium py-4 animate-pulse">
            Buscando novedades...
          </p>
        ) : notificaciones.length > 0 ? (
          notificaciones.slice(0, 10).map((notif) => {
            const IconoActivo = notif.Icono;
            return (
             <div 
  key={notif.id} 
  onClick={() => notif.link ? navigate(notif.link) : null}
  className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-white hover:border-[#2D6A6A]/30 transition-colors cursor-pointer group shrink-0"
>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 ${notif.colorEtiq}`}>
                    <IconoActivo className="w-3 h-3" /> {notif.etiqueta}
                  </span>
                  <span className="text-[11px] text-[#1A3D3D]/50 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {notif.tiempo}
                  </span>
                </div>
                <p className={`text-[#1A3D3D] font-semibold text-[13px] leading-snug transition-colors ${notif.accion ? 'mb-2 ' + notif.colorHover : ''}`}>
                  {notif.texto}
                </p>
                {notif.accion && (
                  <div className="flex items-center gap-1 text-[12px] font-bold text-[#2D6A6A]">
                    {notif.accion} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-center text-[#1A3D3D]/50 text-[13px] font-medium py-4">
            No tenés notificaciones nuevas.
          </p>
        )}

      </div>

      {/* Flecha inferior */}
      <button 
        onClick={() => setIsNotifOpen(!isNotifOpen)}
        type="button"
        className="w-full py-3 bg-transparent hover:bg-[#2D6A6A]/5 flex justify-center items-center text-[#2D6A6A] transition-colors mt-auto cursor-pointer border-t border-[#2D6A6A]/10 shrink-0 outline-none"
      >
        {isNotifOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
    </div>
  );
}