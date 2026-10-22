import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building, Briefcase, FileCheck, 
  Activity, ChevronRight, Clock, AlertCircle, Loader2,
  Repeat, ChevronDown, Stethoscope, Store
} from 'lucide-react';
import { db, auth, functions } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

// Traduce la fecha de registro a una fecha común.
// En Firebase puede venir como Timestamp, como texto (ISO) o como número en milisegundos.
const aFecha = (valor) => {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (typeof valor === 'object' && typeof valor.seconds === 'number') return new Date(valor.seconds * 1000);
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    profesionales: 0,
    clinicas: 0,
    // alumnos: 0, // oculto por ahora (acá se comenta con //, no con llaves)
    proveedores: 0,
    pendientesValidacion: 0,
    // Cuántos se registraron hoy (desde las 00:00), para el "+N" de cada tarjeta
    nuevosHoy: { profesionales: 0, clinicas: 0, proveedores: 0, validaciones: 0 }
  });
  const [pendientes, setPendientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuCuentasAbierto, setMenuCuentasAbierto] = useState(false);
  const [rolEntrando, setRolEntrando] = useState(null); // rol de la cuenta de prueba a la que se está entrando
  const [errorCuenta, setErrorCuenta] = useState('');

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const usuariosSnapCompleto = await getDocs(collection(db, 'usuarios'));
        // Las cuentas de prueba no cuentan en ningún número del panel
        const uidsPrueba = new Set(
          usuariosSnapCompleto.docs.filter(d => d.data().esPrueba === true).map(d => d.id)
        );
        const usuariosSnap = { docs: usuariosSnapCompleto.docs.filter(d => d.data().esPrueba !== true) };
// Perfiles que realmente se ven en la Cartilla (misma regla que usa Cartilla.jsx)
const [profesionalesSnap, clinicasSnap] = await Promise.all([
  getDocs(collection(db, 'profesionales')),
  getDocs(collection(db, 'clinicas'))
]);
const profesionalesActivos = profesionalesSnap.docs.filter(d => d.data().visible !== false && !uidsPrueba.has(d.id)).length;
const clinicasActivas = clinicasSnap.docs.filter(d => d.data().visible !== false && d.data().nombre?.trim() && !uidsPrueba.has(d.id) && !uidsPrueba.has(d.data().uid)).length;
        const usuarios = usuariosSnap.docs.map(d => d.data());
        
        const profesionales = usuarios.filter(u => u.rol === 'profesional').length;
        const clinicas = usuarios.filter(u => u.rol === 'clinica').length;
        const alumnos = usuarios.filter(u => u.rol === 'alumno').length;
        const proveedores = usuarios.filter(u => u.rol === 'proveedor').length;
        const pendientesValidacion = usuarios.filter(u => u.estado === 'pendiente' && u.onboardingCompleto !== false).length;
        // Nuevos de hoy: usuarios cuya fechaRegistro es posterior a las 00:00 de hoy
        const inicioDeHoy = new Date();
        inicioDeHoy.setHours(0, 0, 0, 0);
        const esDeHoy = (u) => {
          const fecha = aFecha(u.fechaRegistro);
          return fecha !== null && fecha >= inicioDeHoy;
        };
        const nuevosHoy = {
          profesionales: usuarios.filter(u => u.rol === 'profesional' && esDeHoy(u)).length,
          clinicas: usuarios.filter(u => u.rol === 'clinica' && esDeHoy(u)).length,
          proveedores: usuarios.filter(u => u.rol === 'proveedor' && esDeHoy(u)).length,
          validaciones: usuarios.filter(u => u.estado === 'pendiente' && u.onboardingCompleto !== false && esDeHoy(u)).length
        };
        const pendientesList = usuariosSnap.docs
          .filter(d => d.data().estado === 'pendiente' && d.data().onboardingCompleto !== false)
          .map(d => ({ uid: d.id, ...d.data() }))
          .slice(0, 3);

               setMetricas({ profesionales, clinicas, alumnos, proveedores, pendientesValidacion, profesionalesActivos, clinicasActivas, nuevosHoy });
        setPendientes(pendientesList);
      } catch (error) {
        console.error("Error cargando métricas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetricas();
  }, []);

  // Entra a la cuenta de prueba del rol elegido, sin cerrar la sesión de la admin
  const handleCambiarCuenta = async (rol) => {
    setRolEntrando(rol);
    setErrorCuenta('');
    try {
      // El servidor verifica que seas admin y busca la cuenta de prueba de ese rol
      const entrarComoPrueba = httpsCallable(functions, 'entrarComoPrueba');
      const respuesta = await entrarComoPrueba({ rolDestino: rol });
      await signInWithCustomToken(auth, respuesta.data.token);
      // Recarga completa para que toda la plataforma arranque con la cuenta nueva
      window.location.assign('/ecosistema');
    } catch (error) {
      console.error("Error entrando a la cuenta de prueba:", error);
      setErrorCuenta(`No encontramos una cuenta de prueba de ${rol} o no pudimos entrar. Revisá que tenga rol y esPrueba: true.`);
      setRolEntrando(null);
    }
  };

  const StatCard = ({ titulo, valor, icono, color, alerta, subtitulo, nuevosHoy }) => (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        {icono}
      </div>
      <div>
        <h3 className="text-[#666666] text-[12px] font-bold uppercase tracking-widest mb-1">{titulo}</h3>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#2D6A6A]" />
          ) : (
            <p className="text-[#1A3D3D] text-[32px] font-black font-['Montserrat'] leading-none">{valor}</p>
          )}
          {!isLoading && nuevosHoy > 0 && (
            <span className="bg-green-50 text-green-600 text-[12px] font-bold px-2 py-1 rounded-lg">
              +{nuevosHoy} hoy
            </span>
          )}
          {!isLoading && alerta > 0 && (
            <span className="bg-red-100 text-red-600 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {alerta} pendientes
            </span>
          )}
        </div>
        {!isLoading && subtitulo && (
          <p className="text-[#666666] text-[12px] md:text-[13px] font-medium mt-1.5">{subtitulo}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
            Resumen General
          </h1>
          <p className="text-[#666666] text-[15px] font-medium">
            Monitoreá la actividad y el crecimiento de El Portal en tiempo real.
          </p>
        </div>

        {/* Botón para entrar a las cuentas de prueba sin cerrar sesión */}
        <div className="relative">
          <button
            onClick={() => setMenuCuentasAbierto(!menuCuentasAbierto)}
            className="bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] rounded-2xl px-5 py-3 text-[13px] font-bold flex items-center gap-2 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
          >
            <Repeat className="w-4 h-4" />
            Cambiar de cuenta
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${menuCuentasAbierto ? 'rotate-180' : ''}`} />
          </button>

          {menuCuentasAbierto && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-[24px] border border-gray-100 shadow-xl p-2 z-30">
              <p className="px-4 pt-3 pb-2 text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em]">
                Cuentas de prueba
              </p>
              {[
                { rol: 'profesional', etiqueta: 'Profesional', Icono: Stethoscope },
                { rol: 'clinica', etiqueta: 'Clínica', Icono: Building },
                { rol: 'proveedor', etiqueta: 'Proveedor', Icono: Store },
              ].map(({ rol, etiqueta, Icono }) => (
                <button
                  key={rol}
                  onClick={() => handleCambiarCuenta(rol)}
                  disabled={rolEntrando !== null}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-[#1A3D3D] font-bold text-[14px] hover:bg-[#F4F7F7] transition-all duration-300 ease-in-out disabled:opacity-60"
                >
                  {rolEntrando === rol ? (
                    <Loader2 className="w-5 h-5 text-[#2D6A6A] animate-spin" />
                  ) : (
                    <Icono className="w-5 h-5 text-[#2D6A6A]" strokeWidth={1.5} />
                  )}
                  {etiqueta}
                </button>
              ))}
              {errorCuenta && (
                <p className="px-4 pt-2 pb-3 text-[12px] text-red-500 font-medium">{errorCuenta}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard titulo="Profesionales" valor={metricas.profesionalesActivos} nuevosHoy={metricas.nuevosHoy.profesionales} subtitulo={`de ${metricas.profesionales} registrados`} icono={<Users className="w-6 h-6 text-[#2D6A6A]" />} color="bg-[#2D6A6A]/10 border border-[#2D6A6A]/20" />
        <StatCard titulo="Clínicas" valor={metricas.clinicasActivas} nuevosHoy={metricas.nuevosHoy.clinicas} subtitulo={`de ${metricas.clinicas} registradas`} icono={<Building className="w-6 h-6 text-[#4DB6AC]" />} color="bg-[#4DB6AC]/10 border border-[#4DB6AC]/20" />
      {/* <StatCard titulo="Alumnos" valor={metricas.alumnos} icono={<Users className="w-6 h-6 text-blue-500" />} color="bg-blue-50 border border-blue-100" /> */}
        <StatCard titulo="Proveedores" valor={metricas.proveedores} nuevosHoy={metricas.nuevosHoy.proveedores} icono={<Briefcase className="w-6 h-6 text-purple-600" />} color="bg-purple-100 border border-purple-200" />
        <StatCard titulo="Validaciones" valor={metricas.pendientesValidacion} nuevosHoy={metricas.nuevosHoy.validaciones} icono={<FileCheck className="w-6 h-6 text-orange-600" />} color="bg-orange-100 border border-orange-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
            <h2 className="text-[18px] font-black font-['Montserrat'] text-[#1A3D3D] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#4DB6AC]" /> Validaciones Pendientes
            </h2>
            <button onClick={() => navigate('/admin/validaciones')} className="text-[#2D6A6A] text-[12px] font-bold uppercase tracking-widest hover:underline">
              Ver todas
            </button>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A6A]" /></div>
            ) : pendientes.length > 0 ? pendientes.map(u => (
              <div key={u.uid} onClick={() => navigate('/admin/validaciones')} className="flex items-center justify-between p-4 bg-[#F4F7F7] rounded-2xl border border-gray-100 hover:border-[#2D6A6A]/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[#1A3D3D] font-bold text-[14px]">{u.nombre}</p>
                    <p className="text-[#666666] text-[12px] font-medium capitalize">{u.rol} — pendiente de validación</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#666666]/50 group-hover:text-[#2D6A6A] group-hover:translate-x-1 transition-all" />
              </div>
            )) : (
              <p className="text-center text-[#666666] py-8 text-[14px] font-medium">No hay validaciones pendientes.</p>
            )}
          </div>
        </div>

        <div className="bg-[#1A3D3D] rounded-[32px] p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[20px] -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-[18px] font-black font-['Montserrat'] mb-6 relative z-10">Estado del Sistema</h2>
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
                Revisá las validaciones pendientes al menos una vez al día para no demorar el ingreso de nuevos profesionales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}