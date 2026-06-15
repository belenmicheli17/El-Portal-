import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Briefcase, FileCheck, 
  Activity, ChevronRight, Clock, AlertCircle 
} from 'lucide-react';

export default function DashboardAdmin() {
  // Estado para las métricas (por ahora estáticas, listas para conectar a Firebase)
  const [metricas, setMetricas] = useState({
    profesionales: 142,
    clinicas: 38,
    ofertasActivas: 24,
    pendientesValidacion: 5
  });

  /* // TODO: Conectar a Firebase más adelante
  useEffect(() => {
    const obtenerMetricas = async () => {
      // Acá haremos los getDocs() para contar documentos
    };
    obtenerMetricas();
  }, []);
  */

  // Tarjeta reutilizable para las métricas
  const StatCard = ({ titulo, valor, icono, color, alerta }) => (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        {icono}
      </div>
      <div>
        <h3 className="text-[#666666] text-[12px] font-bold uppercase tracking-widest mb-1">{titulo}</h3>
        <div className="flex items-center gap-3">
          <p className="text-[#1A3D3D] text-[32px] font-black font-['Montserrat'] leading-none">{valor}</p>
          {alerta > 0 && (
            <span className="bg-red-100 text-red-600 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> +{alerta} nuevos
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Encabezado de la página */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Resumen General
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Monitoreá la actividad y el crecimiento de El Portal en tiempo real.
        </p>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          titulo="Profesionales" 
          valor={metricas.profesionales} 
          icono={<Users className="w-6 h-6 text-[#2D6A6A]" />} 
          color="bg-[#2D6A6A]/10 border border-[#2D6A6A]/20"
        />
        <StatCard 
          titulo="Clínicas" 
          valor={metricas.clinicas} 
          icono={<Building className="w-6 h-6 text-[#4DB6AC]" />} 
          color="bg-[#4DB6AC]/10 border border-[#4DB6AC]/20"
        />
        <StatCard 
          titulo="Bolsa de Trabajo" 
          valor={metricas.ofertasActivas} 
          icono={<Briefcase className="w-6 h-6 text-purple-600" />} 
          color="bg-purple-100 border border-purple-200"
        />
        <StatCard 
          titulo="Validaciones" 
          valor={metricas.pendientesValidacion} 
          alerta={metricas.pendientesValidacion}
          icono={<FileCheck className="w-6 h-6 text-orange-600" />} 
          color="bg-orange-100 border border-orange-200"
        />
      </div>

      {/* Sección Inferior: Tablas y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Accesos Rápidos (Ocupa 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
            <h2 className="text-[18px] font-black font-['Montserrat'] text-[#1A3D3D] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#4DB6AC]" /> Acciones Requeridas
            </h2>
          </div>
          
          <div className="space-y-4">
            {/* Elemento de Acción Pendiente 1 */}
            <div className="flex items-center justify-between p-4 bg-[#F4F7F7] rounded-2xl border border-gray-100 hover:border-[#2D6A6A]/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[#1A3D3D] font-bold text-[14px]">Revisar nueva matrícula</p>
                  <p className="text-[#666666] text-[12px] font-medium">Dr. Carlos Mendoza (MP 54321)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#666666]/50 group-hover:text-[#2D6A6A] group-hover:translate-x-1 transition-all" />
            </div>

            {/* Elemento de Acción Pendiente 2 */}
            <div className="flex items-center justify-between p-4 bg-[#F4F7F7] rounded-2xl border border-gray-100 hover:border-[#2D6A6A]/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[#1A3D3D] font-bold text-[14px]">Alta de nueva Clínica</p>
                  <p className="text-[#666666] text-[12px] font-medium">Veterinaria El Sol (San Isidro)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#666666]/50 group-hover:text-[#2D6A6A] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tips o Estado del Sistema (Ocupa 1/3) */}
        <div className="bg-[#1A3D3D] rounded-[32px] p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[20px] -translate-y-1/2 translate-x-1/2"></div>
          
          <h2 className="text-[18px] font-black font-['Montserrat'] mb-6 relative z-10">
            Estado del Sistema
          </h2>
          
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1">Base de Datos</p>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#4DB6AC]">
                <span className="w-2 h-2 rounded-full bg-[#4DB6AC] animate-pulse"></span>
                Conectada (Firebase)
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-2">Tip de Moderación</p>
              <p className="text-white/80 text-[13px] font-medium leading-relaxed">
                Revisá las validaciones pendientes al menos una vez al día para no demorar el ingreso de nuevos profesionales a la cartilla.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}