import React, { useState } from 'react';
import { 
  Briefcase, UserCheck, Trash2, PauseCircle, 
  PlayCircle, Clock, MapPin, Building, User, CalendarDays
} from 'lucide-react';

export default function GestionBolsa() {
  const [tabActiva, setTabActiva] = useState('ofertas'); // 'ofertas' o 'profesionales'

  // Mock de datos basados en nuestra estructura de Firebase
  const [ofertas, setOfertas] = useState([
    {
      id: 'oferta-san-roque-guardia',
      puesto: "Guardia / Urgencias",
      clinica: "Clínica Veterinaria San Roque",
      provincia: "CABA",
      fechaPublicacion: "Hace 2 días",
      diasRestantes: 28,
      estado: "activo", // activo, pausado
    },
    {
      id: 'oferta-norte',
      puesto: "Cirujano Especialista",
      clinica: "Hospital Veterinario Norte",
      provincia: "Buenos Aires",
      fechaPublicacion: "Hace 15 días",
      diasRestantes: 15,
      estado: "pausado",
    }
  ]);

  const [profesionales, setProfesionales] = useState([
    {
      id: 'dispo-mercedes-arenas',
      nombre: "Dra. Mercedes Arenas",
      especialidad: "Cirujana Traumatóloga",
      provincia: "Buenos Aires",
      tiempo: "Por turnos",
      fechaPublicacion: "Hace 5 días",
      diasRestantes: 25,
      estado: "activo",
    }
  ]);

  // Funciones de Moderación
  const handleToggleEstado = (coleccion, id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'pausado' : 'activo';
    if (coleccion === 'ofertas') {
      setOfertas(prev => prev.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o));
    } else {
      setProfesionales(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
    }
  };

  const handleEliminar = (coleccion, id) => {
    if (window.confirm('¿Estás segura de que querés eliminar esta publicación de la base de datos? Esta acción no se puede deshacer.')) {
      if (coleccion === 'ofertas') {
        setOfertas(prev => prev.filter(o => o.id !== id));
      } else {
        setProfesionales(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Moderación: Bolsa de Trabajo
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Administrá las ofertas de empleo y los perfiles de profesionales disponibles.
        </p>
      </div>

      {/* Tabs / Pestañas de Navegación */}
      <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm inline-flex mb-8">
        <button 
          onClick={() => setTabActiva('ofertas')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[13px] font-bold uppercase tracking-widest transition-all ${
            tabActiva === 'ofertas' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7] hover:text-[#1A3D3D]'
          }`}
        >
          <Building className="w-4 h-4" /> Ofertas de Clínicas ({ofertas.length})
        </button>
        <button 
          onClick={() => setTabActiva('profesionales')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[13px] font-bold uppercase tracking-widest transition-all ${
            tabActiva === 'profesionales' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7] hover:text-[#1A3D3D]'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Profesionales Disp. ({profesionales.length})
        </button>
      </div>

      {/* Contenido Dinámico según la Tab */}
      <div className="space-y-4">
        
        {/* ==========================================
            VISTA: OFERTAS DE CLÍNICAS
            ========================================== */}
        {tabActiva === 'ofertas' && (
          ofertas.length > 0 ? ofertas.map((oferta) => (
            <div key={oferta.id} className={`bg-white rounded-[24px] border ${oferta.estado === 'pausado' ? 'border-gray-200 bg-gray-50/50' : 'border-gray-100'} p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm transition-all hover:shadow-md`}>
              
              {/* Info de la oferta */}
              <div className="flex-1 flex gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${oferta.estado === 'activo' ? 'bg-[#2D6A6A]/10' : 'bg-gray-200'}`}>
                  <Briefcase className={`w-6 h-6 ${oferta.estado === 'activo' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-['Montserrat'] font-black text-[18px] ${oferta.estado === 'activo' ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>
                      {oferta.puesto}
                    </h3>
                    {oferta.estado === 'pausado' && (
                      <span className="bg-gray-200 text-gray-600 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md">Pausada</span>
                    )}
                  </div>
                  <p className="text-[#666666] text-[14px] font-medium mb-3">{oferta.clinica}</p>
                  <div className="flex items-center gap-4 text-[#666666] text-[12px] font-medium">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {oferta.provincia}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {oferta.fechaPublicacion}</span>
                  </div>
                </div>
              </div>

              {/* Controles Administrativos */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {/* Indicador de caducidad */}
                <div className="bg-[#F4F7F7] px-4 py-3 rounded-xl border border-gray-200 flex items-center gap-3 w-full sm:w-auto">
                  <Clock className={`w-5 h-5 ${oferta.diasRestantes < 5 ? 'text-red-500' : 'text-[#4DB6AC]'}`} />
                  <div>
                    <p className="text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest leading-none">Caduca en</p>
                    <p className={`text-[15px] font-black ${oferta.diasRestantes < 5 ? 'text-red-500' : 'text-[#2D6A6A]'}`}>{oferta.diasRestantes} días</p>
                  </div>
                </div>
                
                {/* Botones */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleToggleEstado('ofertas', oferta.id, oferta.estado)}
                    className="flex-1 sm:flex-none p-3.5 rounded-xl border border-gray-200 text-[#666666] hover:text-[#1A3D3D] hover:bg-gray-100 transition-colors flex items-center justify-center"
                    title={oferta.estado === 'activo' ? 'Pausar publicación' : 'Reactivar publicación'}
                  >
                    {oferta.estado === 'activo' ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => handleEliminar('ofertas', oferta.id)}
                    className="flex-1 sm:flex-none p-3.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="Eliminar de la base de datos"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-[#666666] py-10 bg-white rounded-[24px] border border-gray-100">No hay ofertas de clínicas publicadas.</p>
          )
        )}

        {/* ==========================================
            VISTA: PROFESIONALES DISPONIBLES
            ========================================== */}
        {tabActiva === 'profesionales' && (
          profesionales.length > 0 ? profesionales.map((prof) => (
            <div key={prof.id} className={`bg-white rounded-[24px] border ${prof.estado === 'pausado' ? 'border-gray-200 bg-gray-50/50' : 'border-gray-100'} p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm transition-all hover:shadow-md`}>
              
              <div className="flex-1 flex gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${prof.estado === 'activo' ? 'bg-[#4DB6AC]/10' : 'bg-gray-200'}`}>
                  <User className={`w-6 h-6 ${prof.estado === 'activo' ? 'text-[#2D6A6A]' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-['Montserrat'] font-black text-[18px] ${prof.estado === 'activo' ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>
                      {prof.nombre}
                    </h3>
                    {prof.estado === 'pausado' && (
                      <span className="bg-gray-200 text-gray-600 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md">Pausado</span>
                    )}
                  </div>
                  <p className="text-[#666666] text-[14px] font-medium mb-3">{prof.especialidad} • {prof.tiempo}</p>
                  <div className="flex items-center gap-4 text-[#666666] text-[12px] font-medium">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {prof.provincia}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {prof.fechaPublicacion}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="bg-[#F4F7F7] px-4 py-3 rounded-xl border border-gray-200 flex items-center gap-3 w-full sm:w-auto">
                  <Clock className={`w-5 h-5 ${prof.diasRestantes < 5 ? 'text-red-500' : 'text-[#4DB6AC]'}`} />
                  <div>
                    <p className="text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest leading-none">Caduca en</p>
                    <p className={`text-[15px] font-black ${prof.diasRestantes < 5 ? 'text-red-500' : 'text-[#2D6A6A]'}`}>{prof.diasRestantes} días</p>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleToggleEstado('profesionales', prof.id, prof.estado)}
                    className="flex-1 sm:flex-none p-3.5 rounded-xl border border-gray-200 text-[#666666] hover:text-[#1A3D3D] hover:bg-gray-100 transition-colors flex items-center justify-center"
                    title={prof.estado === 'activo' ? 'Pausar perfil' : 'Reactivar perfil'}
                  >
                    {prof.estado === 'activo' ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => handleEliminar('profesionales', prof.id)}
                    className="flex-1 sm:flex-none p-3.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="Eliminar de la base de datos"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-[#666666] py-10 bg-white rounded-[24px] border border-gray-100">No hay profesionales disponibles marcados.</p>
          )
        )}
      </div>

    </div>
  );
}