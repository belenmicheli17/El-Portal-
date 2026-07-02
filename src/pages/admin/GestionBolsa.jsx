import React, { useState, useEffect } from 'react';
import { 
  Briefcase, UserCheck, Trash2, PauseCircle, 
  PlayCircle, Clock, MapPin, Building, User, CalendarDays, Loader2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export default function GestionBolsa() {
  const [tabActiva, setTabActiva] = useState('ofertas');
  const [ofertas, setOfertas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ofertasSnap, profSnap] = await Promise.all([
          getDocs(query(collection(db, 'ofertasEmpleo'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'profesionalesDisponibles'), orderBy('createdAt', 'desc')))
        ]);
        setOfertas(ofertasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setProfesionales(profSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const calcularDiasRestantes = (vencimientoMillis) => {
    if (!vencimientoMillis) return null;
    const diff = vencimientoMillis - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const handleToggleEstado = async (coleccion, id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'pausado' : 'activo';
    try {
      await updateDoc(doc(db, coleccion, id), { estado: nuevoEstado });
      if (coleccion === 'ofertasEmpleo') {
        setOfertas(prev => prev.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o));
      } else {
        setProfesionales(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("Hubo un error al cambiar el estado.");
    }
  };

  const handleEliminar = async (coleccion, id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}" de la base de datos? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, coleccion, id));
      if (coleccion === 'ofertasEmpleo') {
        setOfertas(prev => prev.filter(o => o.id !== id));
      } else {
        setProfesionales(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("Hubo un error al eliminar.");
    }
  };

  const CardItem = ({ item, coleccion, nombre, subtitulo }) => {
    const diasRestantes = calcularDiasRestantes(item.vencimientoMillis);
    const esPausado = item.estado === 'pausado';

    return (
      <div className={`bg-white rounded-[24px] border ${esPausado ? 'border-gray-200 bg-gray-50/50' : 'border-gray-100'} p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm transition-all hover:shadow-md`}>
        <div className="flex-1 flex gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${!esPausado ? (coleccion === 'ofertasEmpleo' ? 'bg-[#2D6A6A]/10' : 'bg-[#4DB6AC]/10') : 'bg-gray-200'}`}>
            {coleccion === 'ofertasEmpleo' 
              ? <Briefcase className={`w-6 h-6 ${!esPausado ? 'text-[#2D6A6A]' : 'text-gray-400'}`} />
              : <User className={`w-6 h-6 ${!esPausado ? 'text-[#2D6A6A]' : 'text-gray-400'}`} />
            }
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className={`font-['Montserrat'] font-black text-[18px] ${!esPausado ? 'text-[#1A3D3D]' : 'text-gray-500'}`}>
                {nombre}
              </h3>
              {esPausado && <span className="bg-gray-200 text-gray-600 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md">Pausado</span>}
            </div>
            <p className="text-[#666666] text-[14px] font-medium mb-3">{subtitulo}</p>
            <div className="flex items-center gap-4 text-[#666666] text-[12px] font-medium">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {item.provincia}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {diasRestantes !== null && (
            <div className="bg-[#F4F7F7] px-4 py-3 rounded-xl border border-gray-200 flex items-center gap-3 w-full sm:w-auto">
              <Clock className={`w-5 h-5 ${diasRestantes < 5 ? 'text-red-500' : 'text-[#4DB6AC]'}`} />
              <div>
                <p className="text-[#1A3D3D] text-[11px] font-bold uppercase tracking-widest leading-none">Caduca en</p>
                <p className={`text-[15px] font-black ${diasRestantes < 5 ? 'text-red-500' : 'text-[#2D6A6A]'}`}>{diasRestantes} días</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => handleToggleEstado(coleccion, item.id, item.estado)}
              className="flex-1 sm:flex-none p-3.5 rounded-xl border border-gray-200 text-[#666666] hover:text-[#1A3D3D] hover:bg-gray-100 transition-colors flex items-center justify-center"
              title={!esPausado ? 'Pausar' : 'Reactivar'}
            >
              {!esPausado ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => handleEliminar(coleccion, item.id, nombre)}
              className="flex-1 sm:flex-none p-3.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
              title="Eliminar"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Moderación: Bolsa de Trabajo
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Administrá las ofertas y los perfiles de profesionales disponibles.
        </p>
      </div>

      <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm inline-flex mb-8">
        <button 
          onClick={() => setTabActiva('ofertas')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[13px] font-bold uppercase tracking-widest transition-all ${tabActiva === 'ofertas' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7]'}`}
        >
          <Building className="w-4 h-4" /> Ofertas ({ofertas.length})
        </button>
        <button 
          onClick={() => setTabActiva('profesionales')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[13px] font-bold uppercase tracking-widest transition-all ${tabActiva === 'profesionales' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7]'}`}
        >
          <UserCheck className="w-4 h-4" /> Profesionales ({profesionales.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A6A]" />
        </div>
      ) : (
        <div className="space-y-4">
          {tabActiva === 'ofertas' && (
            ofertas.length > 0 ? ofertas.map(oferta => (
              <CardItem 
                key={oferta.id}
                item={oferta}
                coleccion="ofertasEmpleo"
                nombre={oferta.puesto}
                subtitulo={oferta.clinica}
              />
            )) : (
              <p className="text-center text-[#666666] py-10 bg-white rounded-[24px] border border-gray-100">No hay ofertas publicadas.</p>
            )
          )}
          {tabActiva === 'profesionales' && (
            profesionales.length > 0 ? profesionales.map(prof => (
              <CardItem 
                key={prof.id}
                item={prof}
                coleccion="profesionalesDisponibles"
                nombre={prof.nombre}
                subtitulo={Array.isArray(prof.especialidad) ? prof.especialidad.join(', ') : prof.especialidad}
              />
            )) : (
              <p className="text-center text-[#666666] py-10 bg-white rounded-[24px] border border-gray-100">No hay profesionales disponibles.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}