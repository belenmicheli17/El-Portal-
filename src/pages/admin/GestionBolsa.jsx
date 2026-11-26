import React, { useState, useEffect } from 'react';
import { 
  Briefcase, UserCheck, Trash2, PauseCircle, 
  PlayCircle, Clock, MapPin, Building, User, CalendarDays, Loader2, Activity
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { tituloPuesto, estaVigente, aMilisegundos, provinciaCorta } from '../../utils/bolsa';
import { BotonImagenOferta } from '../../components/bolsa/ElementosBolsa';

export default function GestionBolsa() {
  const [tabActiva, setTabActiva] = useState('metricas'); // abre primero en Métricas
  const [ofertas, setOfertas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [prueba, setPrueba] = useState(new Set()); // cuentas de prueba, que no cuentan en las métricas
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ofertasSnap, profSnap, postSnap, usuariosSnap] = await Promise.all([
          getDocs(query(collection(db, 'ofertasEmpleo'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'profesionalesDisponibles'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'postulaciones')).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'usuarios')).catch(() => ({ docs: [] }))
        ]);
        setOfertas(ofertasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setProfesionales(profSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPostulaciones(postSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPrueba(new Set(usuariosSnap.docs.filter(d => d.data().esPrueba === true).map(d => d.id)));
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
      // Primero el contacto privado, después la publicación
      await deleteDoc(doc(db, coleccion, id, 'privado', 'contacto')).catch(() => {});
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
              <h3 className={`font-['Montserrat'] font-black text-[18px] ${!esPausado ? 'text-[#1A3D3D]' : 'text-[#666666]'}`}>
                {nombre}
              </h3>
              {esPausado && <span className="bg-gray-200 text-[#666666] text-[11px] uppercase tracking-widest font-bold px-2 py-1 rounded-md">Pausado</span>}
            </div>
            <p className="text-[#666666] text-[14px] font-medium mb-3">{subtitulo}</p>
            <div className="flex items-center gap-4 text-[#666666] text-[12px] font-medium">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {item.provincia}</span>
            </div>
            {/* Compartir: arma la imagen para historias (de la oferta o del profesional disponible) */}
            <div className="mt-3">
              {coleccion === 'ofertasEmpleo' ? <BotonImagenOferta oferta={item} /> : <BotonImagenOferta disponible={item} />}
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

  // Métricas de la Bolsa: salen de lo que hay guardado, sin cuentas de prueba
  const DIA = 24 * 60 * 60 * 1000;
  const ofertasReales = ofertas.filter(o => !prueba.has(o.creadorId));
  const ofertasActivas = ofertasReales.filter(estaVigente);
  const dispActivos = profesionales.filter(p => !prueba.has(p.creadorId || p.id)).filter(estaVigente);
  const idsOfertas = new Set(ofertasReales.map(o => o.id));
  // Solo se cuentan postulaciones de ofertas que todavía existen
  const postsReales = postulaciones.filter(p => idsOfertas.has(p.ofertaId) && !prueba.has(p.postulanteId));
  const postsPorOferta = {};
  postsReales.forEach(p => { postsPorOferta[p.ofertaId] = (postsPorOferta[p.ofertaId] || 0) + 1; });
  const sinPostulantes = ofertasActivas.filter(o => !postsPorOferta[o.id]);
  const postsUlt7 = postsReales.filter(p => Date.now() - aMilisegundos(p.creadaEn) <= 7 * DIA).length;
  const provMapa = {};
  const sumarProv = (prov, campo) => {
    const nombre = provinciaCorta(prov) || 'Sin dato';
    provMapa[nombre] = provMapa[nombre] || { nombre, ofertas: 0, disponibles: 0, postulaciones: 0 };
    provMapa[nombre][campo] += 1;
  };
  ofertasActivas.forEach(o => sumarProv(o.provincia, 'ofertas'));
  dispActivos.forEach(p => sumarProv(p.provincia, 'disponibles'));
  postsReales.forEach(p => sumarProv(ofertasReales.find(o => o.id === p.ofertaId)?.provincia, 'postulaciones'));
  const provinciasMetricas = Object.values(provMapa).sort((a, b) => (b.ofertas + b.disponibles + b.postulaciones) - (a.ofertas + a.disponibles + a.postulaciones));

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

      <div className="bg-white p-1.5 sm:p-2 rounded-[24px] border border-gray-100 shadow-sm flex w-full sm:w-auto sm:inline-flex gap-1 mb-8 max-w-full">
        <button 
          onClick={() => setTabActiva('metricas')}
          className={`flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 sm:py-3.5 rounded-[18px] text-[10px] sm:text-[13px] leading-tight text-center font-bold uppercase tracking-normal sm:tracking-widest sm:whitespace-nowrap transition-all ${tabActiva === 'metricas' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7]'}`}
        >
          <Activity className="w-4 h-4 hidden sm:block shrink-0" /> Métricas
        </button>
        <button 
          onClick={() => setTabActiva('ofertas')}
          className={`flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 sm:py-3.5 rounded-[18px] text-[10px] sm:text-[13px] leading-tight text-center font-bold uppercase tracking-normal sm:tracking-widest sm:whitespace-nowrap transition-all ${tabActiva === 'ofertas' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7]'}`}
        >
          <Building className="w-4 h-4 hidden sm:block shrink-0" /> Ofertas ({ofertas.length})
        </button>
        <button 
          onClick={() => setTabActiva('profesionales')}
          className={`flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 sm:py-3.5 rounded-[18px] text-[10px] sm:text-[13px] leading-tight text-center font-bold uppercase tracking-normal sm:tracking-widest sm:whitespace-nowrap transition-all ${tabActiva === 'profesionales' ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7]'}`}
        >
          <UserCheck className="w-4 h-4 hidden sm:block shrink-0" /> Profesionales ({profesionales.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A6A]" />
        </div>
      ) : (
        <div className="space-y-4">
          {tabActiva === 'metricas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { titulo: 'Ofertas activas', valor: ofertasActivas.length, ayuda: 'Clínicas buscando personal hoy' },
                  { titulo: 'Disponibles', valor: dispActivos.length, ayuda: 'Profesionales buscando trabajo hoy' },
                  { titulo: 'Postulaciones', valor: postsReales.length, ayuda: `${postsUlt7} en los últimos 7 días` },
                  { titulo: 'Sin postulantes', valor: sinPostulantes.length, ayuda: 'Ofertas activas que nadie pidió' }
                ].map(t => (
                  <div key={t.titulo} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <h3 className="text-[#666666] text-[12px] font-bold uppercase tracking-widest mb-2">{t.titulo}</h3>
                    <p className="text-[#1A3D3D] text-[32px] font-black font-['Montserrat'] leading-none">{t.valor}</p>
                    <p className="text-[#666666] text-[13px] font-medium mt-2">{t.ayuda}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px] mb-1">Ofertas sin postulantes</h3>
                <p className="text-[#666666] text-[13px] mb-4">Son las que conviene mostrar en redes, entre profesionales de esa provincia.</p>
                {sinPostulantes.length === 0 ? (
                  <p className="text-[14px] text-[#666666]">Todas las ofertas activas tienen postulantes.</p>
                ) : (
                  <div className="space-y-2">
                    {sinPostulantes.slice(0, 8).map(o => (
                      <div key={o.id} className="flex items-center justify-between gap-3 p-4 bg-[#F4F7F7] rounded-2xl border border-gray-100">
                        <div className="min-w-0">
                          <p className="text-[#1A3D3D] font-bold text-[14px] truncate">{tituloPuesto(o)}</p>
                          <p className="text-[#666666] text-[13px] truncate">{[o.clinicaNombre, provinciaCorta(o.provincia)].filter(Boolean).join(' · ')}</p>
                        </div>
                        <span className="shrink-0 bg-[#FF9800]/20 text-[#e68900] text-[12px] font-bold px-2.5 py-1 rounded-lg">
                          {Math.floor((Date.now() - aMilisegundos(o.publicadaEn)) / DIA)} días
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px] mb-1">Por provincia</h3>
                <p className="text-[#666666] text-[13px] mb-4">Si hay más ofertas que profesionales disponibles, conviene difundir entre profesionales. Si hay más disponibles que ofertas, entre clínicas.</p>
                {provinciasMetricas.length === 0 ? (
                  <p className="text-[14px] text-[#666666]">Todavía no hay datos.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1.2fr] gap-2 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#666666]">
                      <span>Provincia</span><span>Ofertas</span><span>Disp.</span><span>Post.</span><span>Difundir en</span>
                    </div>
                    {provinciasMetricas.map(p => (
                      <div key={p.nombre} className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1.2fr] gap-2 py-3 text-[14px] items-center">
                        <span className="font-bold text-[#1A3D3D] truncate">{p.nombre}</span>
                        <span className="text-[#333333]">{p.ofertas}</span>
                        <span className="text-[#333333]">{p.disponibles}</span>
                        <span className="text-[#333333]">{p.postulaciones}</span>
                        <span className="text-[13px] font-semibold text-[#2D6A6A]">{p.ofertas > p.disponibles ? 'Profesionales' : p.disponibles > p.ofertas ? 'Clínicas' : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {tabActiva === 'ofertas' && (
            ofertas.length > 0 ? ofertas.map(oferta => (
              <CardItem 
                key={oferta.id}
                item={oferta}
                coleccion="ofertasEmpleo"
                nombre={tituloPuesto(oferta)}
                subtitulo={oferta.clinicaNombre}
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
                subtitulo={(prof.areas || []).join(' · ') || prof.especialidad}
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