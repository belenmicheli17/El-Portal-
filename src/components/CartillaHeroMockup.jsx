import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Hospital, 
  ChevronRight, Award, Stethoscope, Layers, Filter, ArrowUpRight, ExternalLink

} from 'lucide-react';

const CartillaHeroMockup = () => {
  // Estado para controlar la animación de entrada
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Un pequeñísimo delay para que la animación empiece justo con la máquina de escribir
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    // 1. CONTENEDOR PRINCIPAL: Le agregamos 'perspective' para que el 3D funcione
    <div 
      className="relative w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto z-10"
      style={{ perspective: '1200px' }}
    >
      
      {/* Brillo exterior (Opcional, muy sutil para que el celular no quede "flotando en la nada") */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#4DB6AC]/20 to-[#FF9800]/10 rounded-[36px] blur-2xl opacity-50 pointer-events-none"></div>

      {/* 2. EL TELÉFONO: Acá aplicamos la transformación 3D (rotateX) */}
      <div 
        className="relative z-10 bg-[#F9F5F0] rounded-[38px] border-[8px] border-[#F8F9FA] shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[500px] sm:h-[550px] origin-bottom"
        style={{
          transform: isLoaded ? 'rotateX(0deg) translateY(0) scale(1)' : 'rotateX(15deg) translateY(60px) scale(0.95)',
          opacity: isLoaded ? 1 : 0,
          transition: 'all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' // Curva de animación súper suave
        }}
      >
        
        <div className="absolute top-[10%] right-[-20%] w-[500px] h-[400px] bg-[#FF9800]/25 rounded-full blur-[70px] pointer-events-none z-0"></div>
        
        {/* --- HARDWARE: ISLA DINÁMICA --- */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[24px] bg-black rounded-full z-50 flex items-center justify-end px-2 shadow-sm border border-black/90">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111] shadow-[inset_0_0_1px_rgba(255,255,255,0.3)]"></div>
        </div>

        {/* --- HARDWARE: HOME INDICATOR --- */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[110px] h-[4px] bg-gray-300 rounded-full z-50"></div>

        {/* CABECERA DE LA APP */}
        <div className="bg-white/90 backdrop-blur-md px-4 pt-10 pb-4 border-b border-gray-100 shadow-sm relative z-10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-montserrat font-black text-[#1A3D3D] text-[18px]">Ver la Cartilla completa</h3>
            <div className="w-8 h-8 rounded-full bg-[#F4F7F7] flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-[#2D6A6A]" />
            </div>
          </div>
          
          <div className="bg-[#F4F7F7] rounded-2xl p-2 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-2">
              <Search className="w-4 h-4 text-[#666666]" />
              <span className="text-[13px] text-[#666666] font-medium">Buscar en cartilla...</span>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <Filter className="w-4 h-4 text-[#1A3D3D]" />
            </div>
          </div>
        </div>

        {/* LISTA DE RESULTADOS */}
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative z-10">
          
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#F9F5F0] to-transparent z-10 pointer-events-none"></div>

          {/* --- 1. TARJETA CLÍNICA --- */}
          <article className="bg-white/95 backdrop-blur-sm rounded-[24px] p-4 border border-white/50 shadow-sm relative shrink-0">
            <div className="absolute -top-2 right-4">
              <span className="bg-red-50 text-red-600 font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded-full border border-red-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Guardia 24hs
              </span>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-2 mt-1">
              <div className="relative shrink-0">
                <div className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-[14px] sm:rounded-[16px] bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm">
                  <Hospital className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[14px] sm:text-[15px] leading-[1.2] line-clamp-2">
                  <span className="block truncate">Veterinaria</span>
                  <span className="block truncate">San Roque</span>
                </h2>
              </div>
            </div>

            <div className="flex mb-3 mt-1 w-full">
              <div className="flex items-center gap-1.5 flex-nowrap w-full overflow-hidden">
                <span className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[10px] font-medium border border-gray-100 truncate min-w-0">Ecografía</span>
                <span className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[10px] font-medium border border-gray-100 truncate min-w-0">Cirugía</span>
                <span className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[10px] font-medium border border-gray-100 truncate min-w-0">Cardiología</span>
                <span className="bg-[#F4F7F7] text-[#666666] px-2 py-1 rounded-[8px] text-[10px] font-medium border border-gray-100 truncate min-w-0">Traumatología</span>
                <span className="bg-gray-50 text-gray-400 px-1.5 py-1 rounded-[8px] text-[10px] font-medium shrink-0">+3</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 mt-auto">
              <div className="flex items-center gap-1 text-[#666666] text-[11px] min-w-0 max-w-[70%]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Av. Libertador, <span className="font-bold text-[#1A3D3D]">San Isidro</span></span>
              </div>
              <div className="flex items-center gap-0.5 text-[#9CA3AF] shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </article>

          {/* --- 2. DOS TARJETAS PROFESIONALES --- */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            
            {/* PROFESIONAL 1 */}
            <article className="bg-white/95 backdrop-blur-sm rounded-[24px] p-3 border border-white/50 shadow-sm relative flex flex-col text-center">
              <div className="absolute -top-2 right-2 flex items-center z-10">
                <div className="w-7 h-7 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="relative mx-auto mb-3 shrink-0 mt-2">
                <div className="w-[56px] h-[56px] rounded-full bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm">
                  <Stethoscope className="w-6 h-6 opacity-80" />
                </div>
              </div>
              
              <div className="mb-2">
                <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[13px] leading-[1.2] line-clamp-2">
                  <span className="block truncate">Dra. Valentinancia</span>
                  <span className="block truncate">López</span>
                </h2>
              </div>
              
              <div className="mb-2">
                <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-2 py-1.5 rounded-xl w-full">
                  <span className="text-[#2D6A6A] text-[10px] sm:text-[11px] font-semibold leading-[1.3] truncate">
                    Cardiología
                  </span>
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-1 text-[#666666] font-medium text-[10px] sm:text-[11px] min-w-0 max-w-[70%]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate font-bold text-[#1A3D3D]">Palermo</span>
                </div>
                <div className="flex items-center gap-1 text-[#9CA3AF] shrink-0">
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
            </article>

            {/* PROFESIONAL 2 */}
            <article className="bg-white/95 backdrop-blur-sm rounded-[24px] p-3 border border-white/50 shadow-sm relative flex flex-col text-center">
              <div className="absolute -top-2 right-2 flex items-center z-10">
                <div className="w-7 h-7 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="relative mx-auto mb-3 shrink-0 mt-2">
                <div className="w-[56px] h-[56px] rounded-full bg-[#FFF5EE] border border-[#FFE4D6] text-[#df803b] flex items-center justify-center shadow-sm">
                  <Stethoscope className="w-6 h-6 opacity-80" />
                </div>
              </div>
              <div className="mb-2">
                <h2 className="font-montserrat font-extrabold text-[#1A3D3D] text-[13px] leading-[1.2] line-clamp-2">
                  <span className="block truncate">Dr. Martín</span>
                  <span className="block truncate">Gómez</span>
                </h2>
              </div>
              
              <div className="mb-2">
                <span className="inline-flex flex-col justify-center bg-[#F4F7F7] px-2 py-1.5 rounded-xl w-full">
                  <span className="text-[#2D6A6A] text-[10px] sm:text-[11px] font-semibold leading-[1.3] truncate">
                    Clínico Médico
                  </span>
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-1 text-[#666666] font-medium text-[10px] sm:text-[11px] min-w-0 max-w-[70%]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate font-bold text-[#1A3D3D]">GBA Norte</span>
                </div>
                <div className="flex items-center gap-1 text-[#9CA3AF] shrink-0">
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
            </article>

          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F9F5F0] to-transparent z-10 pointer-events-none"></div>
        </div>

      </div>

    </div>
  );
};

export default CartillaHeroMockup;