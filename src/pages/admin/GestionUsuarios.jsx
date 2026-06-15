import React, { useState } from 'react';
import { 
  Search, Filter, Edit2, Ban, 
  CheckCircle, X, Save, User, Building, ShieldAlert
} from 'lucide-react';

export default function GestionUsuarios() {
  // Datos mockeados temporalmente (luego vendrán de Firebase: collection('profesionales') y collection('clinicas'))
  const [usuarios, setUsuarios] = useState([
    { id: 'clara-valdez', nombre: 'Dra. Clara Valdez', tipo: 'profesional', provincia: 'Buenos Aires', plan: 'pro', estado: 'activo' },
    { id: 'mercedes-arenas', nombre: 'Dra. Mercedes Arenas', tipo: 'profesional', provincia: 'Buenos Aires', plan: 'pro', estado: 'activo' },
    { id: 'clinica-san-roque', nombre: 'Clínica Veterinaria San Roque', tipo: 'clinica', provincia: 'CABA', plan: 'pro', estado: 'activo' },
    { id: 'usuario-prueba', nombre: 'Dr. Juan Pérez', tipo: 'profesional', provincia: 'Córdoba', plan: 'gratis', estado: 'suspendido' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'profesional', 'clinica'
  const [usuarioEditando, setUsuarioEditando] = useState(null); // Controla el modal de edición

  // Lógica de filtrado y búsqueda
  const usuariosFiltrados = usuarios.filter(user => {
    const coincideBusqueda = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || user.provincia.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideFiltro = filtroTipo === 'todos' || user.tipo === filtroTipo;
    return coincideBusqueda && coincideFiltro;
  });

  // Función para simular el guardado de edición
  const handleGuardarEdicion = (e) => {
    e.preventDefault();
    // Acá harías un updateDoc() en Firebase
    setUsuarios(prev => prev.map(u => u.id === usuarioEditando.id ? usuarioEditando : u));
    setUsuarioEditando(null);
    alert("¡Usuario actualizado correctamente!");
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Directorio de Usuarios
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Buscá, editá o suspendé cuentas de la plataforma.
        </p>
      </div>

      {/* Barra de Controles (Buscador y Filtros) */}
      <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative flex items-center bg-[#F4F7F7] rounded-2xl px-4 py-3">
          <Search className="text-[#666666] w-5 h-5 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, clínica o provincia..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none pl-3 text-[15px] font-medium focus:outline-none text-[#333333] placeholder:text-[#666666]/60" 
          />
        </div>
        
        <div className="flex gap-2 bg-[#F4F7F7] p-1.5 rounded-2xl shrink-0 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setFiltroTipo('todos')}
            className={`px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filtroTipo === 'todos' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFiltroTipo('profesional')}
            className={`px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${filtroTipo === 'profesional' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
          >
            <User className="w-4 h-4" /> Profesionales
          </button>
          <button 
            onClick={() => setFiltroTipo('clinica')}
            className={`px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${filtroTipo === 'clinica' ? 'bg-white text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}
          >
            <Building className="w-4 h-4" /> Clínicas
          </button>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F7F7] border-b border-gray-100">
                <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Ubicación</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Plan</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Estado</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#666666] uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuariosFiltrados.length > 0 ? usuariosFiltrados.map((user) => (
                <tr key={user.id} className="hover:bg-[#F4F7F7]/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E8F0F0] flex items-center justify-center shrink-0">
                        {user.tipo === 'profesional' ? <User className="w-5 h-5 text-[#2D6A6A]" /> : <Building className="w-5 h-5 text-[#4DB6AC]" />}
                      </div>
                      <div>
                        <p className="text-[#1A3D3D] font-bold text-[14px]">{user.nombre}</p>
                        <p className="text-[#666666] text-[12px] font-medium capitalize">{user.tipo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[#333333] text-[14px] font-medium">{user.provincia}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest ${
                      user.plan === 'pro' ? 'bg-[#2D6A6A]/10 text-[#2D6A6A]' : 'bg-gray-100 text-[#666666]'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      {user.estado === 'activo' ? (
                        <><CheckCircle className="w-4 h-4 text-green-500" /> <span className="text-[13px] font-semibold text-green-600">Activo</span></>
                      ) : (
                        <><Ban className="w-4 h-4 text-red-500" /> <span className="text-[13px] font-semibold text-red-600">Suspendido</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setUsuarioEditando({...user})}
                        className="p-2 text-[#666666] hover:text-[#2D6A6A] hover:bg-[#2D6A6A]/10 rounded-xl transition-all"
                        title="Editar Perfil"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        className={`p-2 rounded-xl transition-all ${user.estado === 'activo' ? 'text-[#666666] hover:text-red-600 hover:bg-red-50' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
                        title={user.estado === 'activo' ? "Suspender Usuario" : "Usuario Suspendido"}
                        onClick={() => {
                          if(window.confirm(`¿Seguro querés cambiar el estado de ${user.nombre}?`)) {
                            setUsuarios(prev => prev.map(u => u.id === user.id ? {...u, estado: u.estado === 'activo' ? 'suspendido' : 'activo'} : u))
                          }
                        }}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#666666]">
                    <Search className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                    <p className="text-[15px] font-medium">No se encontraron usuarios con esos filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          MODAL DE EDICIÓN ("MODO DIOS")
          ========================================== */}
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
                <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Nombre / Razón Social</label>
                <input 
                  type="text" 
                  value={usuarioEditando.nombre} 
                  onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})}
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Provincia</label>
                  <input 
                    type="text" 
                    value={usuarioEditando.provincia} 
                    onChange={e => setUsuarioEditando({...usuarioEditando, provincia: e.target.value})}
                    className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Plan Actual</label>
                  <select 
                    value={usuarioEditando.plan} 
                    onChange={e => setUsuarioEditando({...usuarioEditando, plan: e.target.value})}
                    className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#2D6A6A]"
                  >
                    <option value="gratis">Gratis</option>
                    <option value="pro">Pro (Pago)</option>
                  </select>
                </div>
              </div>

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
                  className="px-6 py-3 bg-[#2D6A6A] text-white font-bold text-[12px] uppercase tracking-widest hover:bg-[#1A3D3D] rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}