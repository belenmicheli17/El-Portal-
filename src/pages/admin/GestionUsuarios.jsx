import React, { useState, useEffect } from 'react';
import { 
  Search, Edit2, Ban, X, Save, Trash2,
  User, Building, ShieldAlert, Store, Loader2, Crown
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cargar usuarios reales de Firestore
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const snap = await getDocs(collection(db, 'usuarios'));
        const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setUsuarios(data);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter(user => {
    const coincideBusqueda = user.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideFiltro = filtroRol === 'todos' || user.rol === filtroRol;
    return coincideBusqueda && coincideFiltro;
  });

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const docRef = doc(db, 'usuarios', usuarioEditando.uid);
      const datosAGuardar = {
        nombre: usuarioEditando.nombre,
        rol: usuarioEditando.rol,
      };
      if (usuarioEditando.rol === 'profesional' && usuarioEditando.matricula) datosAGuardar.matricula = usuarioEditando.matricula;
      if (usuarioEditando.rol === 'clinica' && usuarioEditando.direccion) datosAGuardar.direccion = usuarioEditando.direccion;
      if (usuarioEditando.rol === 'proveedor' && usuarioEditando.cuit) datosAGuardar.cuit = usuarioEditando.cuit;
      if (usuarioEditando.rol === 'alumno' && usuarioEditando.universidad) datosAGuardar.universidad = usuarioEditando.universidad;
      await updateDoc(docRef, datosAGuardar);
      setUsuarios(prev => prev.map(u => u.uid === usuarioEditando.uid ? { ...u, ...usuarioEditando } : u));
      setUsuarioEditando(null);
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Hubo un error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const handleSuspender = async (uid, nombre) => {
    if (!window.confirm(`¿Suspender temporalmente a ${nombre}? Podrás reactivarla después.`)) return;
    try {
      await updateDoc(doc(db, 'usuarios', uid), { estado: 'suspendido' });
      setUsuarios(prev => prev.map(u => u.uid === uid ? { ...u, estado: 'suspendido' } : u));
    } catch (error) {
      console.error("Error suspendiendo:", error);
      alert("Hubo un error al suspender.");
    }
  };

  const handleEliminar = async (uid, nombre) => {
    if (!window.confirm(`⚠️ ¿Eliminar definitivamente a ${nombre}? Esta acción NO se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, 'usuarios', uid));
      setUsuarios(prev => prev.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("Hubo un error al eliminar.");
    }
  };

  const handleReactivar = async (uid, nombre) => {
    if (!window.confirm(`¿Reactivar la cuenta de ${nombre}?`)) return;
    try {
      await updateDoc(doc(db, 'usuarios', uid), { estado: 'activo' });
      setUsuarios(prev => prev.map(u => u.uid === uid ? { ...u, estado: 'activo' } : u));
    } catch (error) {
      console.error("Error reactivando:", error);
      alert("Hubo un error al reactivar.");
    }
  };

  const handleToggleSocio = async (uid, nombre, esSocioActual) => {
    try {
      await updateDoc(doc(db, 'usuarios', uid), { socioVitalicio: !esSocioActual });
      setUsuarios(prev => prev.map(u => u.uid === uid ? { ...u, socioVitalicio: !esSocioActual } : u));
    } catch (error) {
      console.error("Error actualizando socio vitalicio:", error);
    }
  };

  const iconoPorRol = (rol) => {
    if (rol === 'clinica') return <Building className="w-5 h-5 text-[#4DB6AC]" />;
    if (rol === 'proveedor') return <Store className="w-5 h-5 text-purple-400" />;
    return <User className="w-5 h-5 text-[#2D6A6A]" />;
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Directorio de Usuarios
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Buscá, editá roles o gestioná cuentas de la plataforma.
        </p>
      </div>

      <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative flex items-center bg-[#F4F7F7] rounded-2xl px-4 py-3">
          <Search className="text-[#666666] w-5 h-5 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none pl-3 text-[15px] font-medium focus:outline-none text-[#333333] placeholder:text-[#666666]/60" 
          />
        </div>
        <div className="flex gap-2 bg-[#F4F7F7] p-1.5 rounded-2xl shrink-0 overflow-x-auto">
          {['todos', 'profesional', 'clinica', 'proveedor', 'alumno'].map(rol => (
            <button
              key={rol}
              onClick={() => setFiltroRol(rol)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filtroRol === rol ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
            >
              {rol}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[#2D6A6A]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F7F7] border-b border-gray-100">
                  <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Usuario</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Rol</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Slug</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosFiltrados.length > 0 ? usuariosFiltrados.map((user) => (
                  <tr key={user.uid} className="hover:bg-[#F4F7F7]/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8F0F0] flex items-center justify-center shrink-0">
                          {iconoPorRol(user.rol)}
                        </div>
                        <div>
                          <p className="text-[#1A3D3D] font-bold text-[14px]">{user.nombre}</p>
                          <p className="text-[#666666] text-[12px] font-medium">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-[#2D6A6A]/10 text-[#2D6A6A]">
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[#666666] text-[13px] font-medium">{user.slug || '—'}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Badge de estado */}
                        {user.estado === 'suspendido' && (
                          <span className="text-[11px] font-bold uppercase tracking-widest bg-orange-50 text-orange-500 px-2.5 py-1 rounded-lg">
                            Suspendido
                          </span>
                        )}
                        {user.estado === 'baja' && (
                          <span className="text-[11px] font-bold uppercase tracking-widest bg-red-50 text-red-500 px-2.5 py-1 rounded-lg">
                            Baja
                          </span>
                        )}
                        {/* Botón corona (socio vitalicio) */}
                        <button
                          onClick={() => handleToggleSocio(user.uid, user.nombre, !!user.socioVitalicio)}
                          className={`p-2 rounded-xl transition-all ${user.socioVitalicio ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-[#666666] hover:text-yellow-500 hover:bg-yellow-50'}`}
                          title={user.socioVitalicio ? 'Quitar socio vitalicio' : 'Asignar socio vitalicio'}
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        {/* Botón editar */}
                        <button
                          onClick={() => setUsuarioEditando({...user})}
                          className="p-2 text-[#666666] hover:text-[#2D6A6A] hover:bg-[#2D6A6A]/10 rounded-xl transition-all"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Botón suspender / reactivar */}
                        {user.estado === 'suspendido' ? (
                          <button
                            onClick={() => handleReactivar(user.uid, user.nombre)}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-all"
                            title="Reactivar cuenta"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspender(user.uid, user.nombre)}
                            className="p-2 text-[#666666] hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                            title="Suspender temporalmente"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {/* Botón eliminar definitivo */}
                        <button
                          onClick={() => handleEliminar(user.uid, user.nombre)}
                          className="p-2 text-[#666666] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar usuario definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-[#666666]">
                      <Search className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                      <p className="text-[15px] font-medium">No se encontraron usuarios.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#F4F7F7] px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#2D6A6A]" /> Editar Usuario
              </h3>
              <button onClick={() => setUsuarioEditando(null)} className="text-[#666666] hover:text-[#1A3D3D] p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={usuarioEditando.nombre || ''} 
                  onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})}
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Rol</label>
                <select 
                  value={usuarioEditando.rol || 'profesional'} 
                  onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value})}
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                >
                  <option value="profesional">Profesional</option>
                  <option value="clinica">Clínica</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="alumno">Alumnx</option>
                 
                </select>
                <p className="text-[11px] text-[#666666] mt-2 font-medium">⚠️ Cambiar el rol afecta qué secciones ve el usuario al loguearse.</p>
              </div>

              {/* Campos extra según rol */}
              {usuarioEditando.rol === 'profesional' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Matrícula</label>
                  <input 
                    type="text"
                    value={usuarioEditando.matricula || ''}
                    onChange={e => setUsuarioEditando({...usuarioEditando, matricula: e.target.value})}
                    className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                    placeholder="Ej: 12345"
                  />
                </div>
              )}
              {usuarioEditando.rol === 'clinica' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Dirección</label>
                  <input 
                    type="text"
                    value={usuarioEditando.direccion || ''}
                    onChange={e => setUsuarioEditando({...usuarioEditando, direccion: e.target.value})}
                    className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                  />
                </div>
              )}
              {usuarioEditando.rol === 'proveedor' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">CUIT</label>
                  <input 
                    type="text"
                    value={usuarioEditando.cuit || ''}
                    onChange={e => setUsuarioEditando({...usuarioEditando, cuit: e.target.value})}
                    className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                    placeholder="Ej: 30-12345678-9"
                  />
                </div>
              )}
              {usuarioEditando.rol === 'alumno' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Universidad</label>
                  <input 
                    type="text"
                    value={usuarioEditando.universidad || ''}
                    onChange={e => setUsuarioEditando({...usuarioEditando, universidad: e.target.value})}
                    className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                    placeholder="Ej: UBA, UNLP..."
                  />
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setUsuarioEditando(null)}
                  className="px-6 py-3 text-[#666666] font-bold text-[12px] uppercase tracking-widest hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-3 bg-[#2D6A6A] text-white font-bold text-[12px] uppercase tracking-widest hover:bg-[#1A3D3D] rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}