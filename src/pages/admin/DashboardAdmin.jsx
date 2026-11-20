import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building, FileCheck, 
  Activity, ChevronRight, Clock, AlertCircle, Loader2,
  Repeat, Stethoscope, Store, UserPlus, ChevronDown, GraduationCap
} from 'lucide-react';
import { db, auth, functions } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { provinciaCorta } from '../../utils/bolsa';

// Traduce la fecha de registro a una fecha común.
// En Firebase puede venir como Timestamp, como texto (ISO) o como número en milisegundos.
const aFecha = (valor) => {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (typeof valor === 'object' && typeof valor.seconds === 'number') return new Date(valor.seconds * 1000);
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

// "Dorrego 242, S2000 Rosario, Santa Fe" → "Rosario"
const localidadDeDireccion = (direccion) => {
  const partes = (direccion || '').split(',').map((p) => p.trim()).filter(Boolean);
  return (partes[1] || '').replace(/^[A-Z]?\d{4}(?:\s?[A-Z]{3}(?![a-zA-Z]))?\s*/, '');
};
const normLugar = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Zonas del Gran Buenos Aires: los barrios y partidos se agrupan en una zona grande.
// Para sumar un lugar a una zona, agregalo a la lista correspondiente.
const ZONAS_GBA = {
  'Zona Oeste': ['Morón', 'Castelar', 'Haedo', 'Ituzaingó', 'Hurlingham', 'Villa Tesei', 'William Morris', 'Ramos Mejía', 'San Justo', 'La Matanza', 'Laferrere', 'González Catán', 'Isidro Casanova', 'Ciudadela', 'Villa Luzuriaga', 'San Antonio de Padua', 'Padua', 'Merlo', 'Libertad', 'Moreno', 'Paso del Rey', 'Francisco Álvarez', 'General Rodríguez', 'Marcos Paz', 'Tres de Febrero', 'Caseros', 'Santos Lugares', 'Martín Coronado', 'Villa Bosch', 'Ciudad Evita', 'El Palomar', 'Villa Sarmiento', 'Gregorio de Laferrere', 'Virrey del Pino', 'Rafael Castillo', 'Lomas del Mirador'],
  'Zona Norte': ['Vicente López', 'Olivos', 'Florida', 'Munro', 'La Lucila', 'Martínez', 'Acassuso', 'San Isidro', 'Beccar', 'Boulogne', 'Villa Adelina', 'San Fernando', 'Victoria', 'Tigre', 'Don Torcuato', 'General Pacheco', 'Benavídez', 'Nordelta', 'Rincón de Milberg', 'Pilar', 'Escobar', 'Garín', 'Maschwitz', 'Ingeniero Maschwitz', 'San Martín', 'Villa Ballester', 'José León Suárez', 'San Miguel', 'Muñiz', 'Bella Vista', 'Malvinas Argentinas', 'Grand Bourg', 'José C. Paz', 'Del Viso', 'Tortuguitas', 'Billinghurst', 'Villa Maipú', 'Loma Hermosa', 'Santos Lugares'],
  'Zona Sur': ['Juan María Gutiérrez', 'Avellaneda', 'Sarandí', 'Wilde', 'Lanús', 'Remedios de Escalada', 'Lomas de Zamora', 'Banfield', 'Temperley', 'Turdera', 'Adrogué', 'Burzaco', 'Almirante Brown', 'Claypole', 'Quilmes', 'Bernal', 'Ezpeleta', 'Berazategui', 'Florencio Varela', 'Ranelagh', 'Esteban Echeverría', 'Monte Grande', 'Canning', 'Ezeiza', 'Presidente Perón', 'San Vicente', 'Longchamps', 'Glew', 'Gerli', 'Valentín Alsina', 'Villa Domínico', 'Dock Sud', 'Don Bosco', 'Hudson', 'José Mármol', 'Rafael Calzada', 'Solano', 'San Francisco Solano'],
  'La Plata': ['La Plata', 'Gonnet', 'City Bell', 'Tolosa', 'Los Hornos', 'Villa Elisa', 'Ringuelet', 'Berisso', 'Ensenada', 'Manuel B. Gonnet']
};
const ZONA_DE_LUGAR = new Map(
  Object.entries(ZONAS_GBA).flatMap(([zona, lugares]) => lugares.map((l) => [normLugar(l), zona]))
);
// A qué grupo grande pertenece un lugar: CABA es una sola, el Gran Buenos Aires va por zonas y el resto queda con su nombre
const grupoDeLugar = (nombre, provincia) => {
  // CABA aparece escrita de muchas formas ("Cdad. Autónoma de Buenos Aires", "Capital Federal"...)
  if (provincia === 'CABA' || /autonoma|capital federal|^caba$/.test(normLugar(nombre))) return 'CABA';
  if (provincia === 'Buenos Aires') return ZONA_DE_LUGAR.get(normLugar(nombre)) || nombre;
  return nombre;
};

// Cuenta perfiles por provincia y por localidad donde atienden
const contarLugares = (perfiles) => {
  const provincias = new Map();
  const localidades = new Map();
  const sumar = (mapa, clave, nombre, provincia) => {
    const previo = mapa.get(clave) || { nombre, provincia, total: 0 };
    previo.total += 1;
    mapa.set(clave, previo);
  };
  perfiles.forEach(({ tipo, datos }) => {
    const prov = provinciaCorta(datos.provincia) || 'Sin dato';
    sumar(provincias, normLugar(prov), prov, prov);
    const lugares = [];
    const agregar = (p, loc, dir) => {
      const nombre = (loc || localidadDeDireccion(dir) || '').trim();
      // Si el nombre trae números es una dirección (calle y altura), no una localidad: se descarta
      if (nombre && !/\d/.test(nombre)) lugares.push({ nombre, provincia: provinciaCorta(p || datos.provincia) || 'Sin dato' });
    };
    if (tipo === 'profesional') {
      (datos.zonas || []).forEach((z) => (z.clinicas || []).forEach((c) => agregar(c.provincia, c.localidad, c.direccion)));
    } else {
      agregar(datos.provincia, datos.localidad, datos.direccion);
      (datos.sedes || []).forEach((s) => agregar(s.provincia, s.localidad, s.direccion));
    }
    const vistas = new Set();
    lugares.forEach((l) => {
      const grupo = grupoDeLugar(l.nombre, l.provincia);
      const clave = `${normLugar(grupo)}|${normLugar(l.provincia)}`;
      if (vistas.has(clave)) return;
      vistas.add(clave);
      sumar(localidades, clave, grupo, l.provincia);
    });
  });
  const ordenar = (m) => [...m.values()].sort((a, b) => b.total - a.total);
  return { provincias: ordenar(provincias), localidades: ordenar(localidades) };
};

// Clave de día "2026-11-19" en hora local, para agrupar los registros por día
const claveDia = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
const etiquetaDia = (clave, corta = false) => {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-AR', corta ? { day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    profesionales: 0,
    clinicas: 0,
    alumnos: 0,
    alumnosActivos: 0,
    proveedores: 0,
    pendientesValidacion: 0,
    // Cuántos se registraron hoy (desde las 00:00), para el "+N" de cada tarjeta
    nuevosHoy: { profesionales: 0, clinicas: 0, alumnos: 0, proveedores: 0, validaciones: 0 }
  });
  const [pendientes, setPendientes] = useState([]);
  const [llegaronPor, setLlegaronPor] = useState([]);
  const [lugares, setLugares] = useState({ provincias: [], localidades: [] });
  const [provSel, setProvSel] = useState('');
  const [registrosPorDia, setRegistrosPorDia] = useState([]); // [["2026-11-19", 4], ...] del más nuevo al más viejo
  const [verDias, setVerDias] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rolEntrando, setRolEntrando] = useState(null); // rol de la cuenta de prueba a la que se está entrando
  const [errorCuenta, setErrorCuenta] = useState('');
  // Cajitas desplegables y pestañita de cuentas de prueba
  const [verLugares, setVerLugares] = useState(false);
  const [verLlegada, setVerLlegada] = useState(false);
  const [cuentasAbierto, setCuentasAbierto] = useState(false);
  const cuentasRef = useRef(null);

  // Cierra la cajita de cuentas al tocar afuera o con Escape
  useEffect(() => {
    if (!cuentasAbierto) return undefined;
    const afuera = (e) => { if (cuentasRef.current && !cuentasRef.current.contains(e.target)) setCuentasAbierto(false); };
    const escape = (e) => { if (e.key === 'Escape') setCuentasAbierto(false); };
    document.addEventListener('mousedown', afuera);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', afuera);
      window.removeEventListener('keydown', escape);
    };
  }, [cuentasAbierto]);

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
setLugares(contarLugares([
  ...profesionalesSnap.docs.filter(d => d.data().visible !== false && !uidsPrueba.has(d.id)).map(d => ({ tipo: 'profesional', datos: d.data() })),
  ...clinicasSnap.docs.filter(d => d.data().visible !== false && d.data().nombre?.trim() && !uidsPrueba.has(d.id) && !uidsPrueba.has(d.data().uid)).map(d => ({ tipo: 'clinica', datos: d.data() }))
]));
        const usuarios = usuariosSnap.docs.map(d => d.data());
        
        const profesionales = usuarios.filter(u => u.rol === 'profesional').length;
        const clinicas = usuarios.filter(u => u.rol === 'clinica').length;
        const alumnos = usuarios.filter(u => u.rol === 'alumnx').length;
        // Alumnos/as verificados (los que ya se pueden postular)
        const alumnosActivos = usuarios.filter(u => u.rol === 'alumnx' && u.estado === 'activo').length;
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
          alumnos: usuarios.filter(u => u.rol === 'alumnx' && esDeHoy(u)).length,
          proveedores: usuarios.filter(u => u.rol === 'proveedor' && esDeHoy(u)).length,
          validaciones: usuarios.filter(u => u.estado === 'pendiente' && u.onboardingCompleto !== false && esDeHoy(u)).length
        };
        const pendientesList = usuariosSnap.docs
          .filter(d => d.data().estado === 'pendiente' && d.data().onboardingCompleto !== false)
          .map(d => ({ uid: d.id, ...d.data() }))
          .slice(0, 3);

               setMetricas({ profesionales, clinicas, alumnos, alumnosActivos, proveedores, pendientesValidacion, profesionalesActivos, clinicasActivas, nuevosHoy });
        setPendientes(pendientesList);
        // Registros por día (todos los tipos de cuenta, sin admin ni cuentas de prueba)
        const porDia = {};
        usuarios.filter(u => u.rol !== 'admin').forEach(u => {
          const fecha = aFecha(u.fechaRegistro);
          if (!fecha) return;
          const clave = claveDia(fecha);
          porDia[clave] = (porDia[clave] || 0) + 1;
        });
        setRegistrosPorDia(Object.entries(porDia).sort((a, b) => b[0].localeCompare(a[0])));
        // Cuántas personas eligieron cada opción de "¿Cómo llegaste?" (sin admin ni cuentas de prueba)
        const conteoLlegada = {};
        usuarios.filter(u => u.rol !== 'admin').forEach(u => {
          const clave = u.comoLlego || 'Sin dato';
          conteoLlegada[clave] = (conteoLlegada[clave] || 0) + 1;
        });
        setLlegaronPor(Object.entries(conteoLlegada).sort((a, b) => {
          if (a[0] === 'Sin dato') return 1;
          if (b[0] === 'Sin dato') return -1;
          return b[1] - a[1];
        }));
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

  // Nuevos usuarios: hoy y el día récord
  const nuevosDeHoy = (registrosPorDia.find(([clave]) => clave === claveDia(new Date())) || [null, 0])[1];
  const diaRecord = registrosPorDia.reduce((mejor, actual) => (actual[1] > (mejor?.[1] || 0) ? actual : mejor), null);
  const maximoDia = diaRecord ? diaRecord[1] : 0;

  const StatCard = ({ titulo, valor, icono, color, alerta, subtitulo, nuevosHoy, onClick }) => (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-[#2D6A6A]/30 hover:-translate-y-0.5' : ''}`}
    >
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

      </div>

      {/* Pestañita semioculta al costado: al tocarla se desliza una cajita con las cuentas de prueba, una arriba de la otra */}
      <div ref={cuentasRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-[9998] flex items-center">
        {cuentasAbierto && (
          <div className="mr-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.18)] p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#2D6A6A] px-1 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" /> Entrar como
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
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F4F7F7] text-[#1A3D3D] font-bold text-[13px] text-left hover:bg-[#2D6A6A] hover:text-white transition-all duration-300 ease-in-out disabled:opacity-60 group"
              >
                {rolEntrando === rol ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icono className="w-4 h-4 text-[#2D6A6A] group-hover:text-white" strokeWidth={1.75} />
                )}
                {etiqueta}
              </button>
            ))}
            {errorCuenta && <p className="text-[11px] text-red-500 font-medium px-1">{errorCuenta}</p>}
          </div>
        )}
        <button
          type="button"
          onClick={() => setCuentasAbierto((v) => !v)}
          aria-label="Entrar como otra cuenta de prueba"
          className={`h-14 rounded-l-xl flex items-center justify-center shadow-lg bg-[#1A3D3D] text-white transition-all duration-300 ease-in-out ${cuentasAbierto ? 'w-9' : 'w-6 hover:w-9'}`}
        >
          <Repeat className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard titulo="Profesionales" onClick={() => navigate('/admin/usuarios?rol=profesional')} valor={metricas.profesionalesActivos} nuevosHoy={metricas.nuevosHoy.profesionales} subtitulo={`de ${metricas.profesionales} registrados`} icono={<Users className="w-6 h-6 text-[#2D6A6A]" />} color="bg-[#2D6A6A]/10 border border-[#2D6A6A]/20" />
        <StatCard titulo="Clínicas" onClick={() => navigate('/admin/usuarios?rol=clinica')} valor={metricas.clinicasActivas} nuevosHoy={metricas.nuevosHoy.clinicas} subtitulo={`de ${metricas.clinicas} registradas`} icono={<Building className="w-6 h-6 text-[#4DB6AC]" />} color="bg-[#4DB6AC]/10 border border-[#4DB6AC]/20" />
        <StatCard titulo="Alumnos" onClick={() => navigate('/admin/usuarios?rol=alumnx')} valor={metricas.alumnosActivos} nuevosHoy={metricas.nuevosHoy.alumnos} subtitulo={`de ${metricas.alumnos} registrados`} icono={<GraduationCap className="w-6 h-6 text-rose-500" />} color="bg-rose-50 border border-rose-100" />
      {/* <StatCard titulo="Proveedores" onClick={() => navigate('/admin/usuarios?rol=proveedor')} valor={metricas.proveedores} nuevosHoy={metricas.nuevosHoy.proveedores} icono={<Briefcase className="w-6 h-6 text-purple-600" />} color="bg-purple-100 border border-purple-200" /> */}
        <StatCard titulo="Validaciones" onClick={() => navigate('/admin/validaciones')} valor={metricas.pendientesValidacion} nuevosHoy={metricas.nuevosHoy.validaciones} icono={<FileCheck className="w-6 h-6 text-[#e68900]" />} color="bg-[#FF9800]/20 border border-[#FF9800]/30" />
        <StatCard titulo="Nuevos hoy" onClick={() => setVerDias((v) => !v)} valor={nuevosDeHoy} subtitulo={diaRecord ? `Récord: ${maximoDia} el ${etiquetaDia(diaRecord[0], true)}` : 'Tocá para ver por día'} icono={<UserPlus className="w-6 h-6 text-green-600" />} color="bg-green-50 border border-green-100" />
      </div>

      {/* Usuarios nuevos por día (se abre al tocar la tarjeta "Nuevos hoy") */}
      {verDias && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm mb-8 animate-in fade-in duration-300">
          <h2 className="text-[18px] font-black font-['Montserrat'] text-[#1A3D3D] mb-6 border-b border-gray-50 pb-4">Usuarios nuevos por día</h2>
          {registrosPorDia.length === 0 ? (
            <p className="text-[14px] text-[#666666]">Todavía no hay registros con fecha guardada.</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {registrosPorDia.slice(0, 30).map(([clave, cantidad]) => (
                <div key={clave}>
                  <div className="flex items-center justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-[#1A3D3D] capitalize">
                      {etiquetaDia(clave)}
                      {clave === diaRecord?.[0] && <span className="ml-2 bg-green-50 text-green-600 text-[11px] font-bold px-2 py-0.5 rounded-md normal-case">Récord</span>}
                    </span>
                    <span className="text-[#2D6A6A] font-black">{cantidad}</span>
                  </div>
                  <div className="h-1.5 bg-[#F4F7F7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4DB6AC] rounded-full" style={{ width: `${(cantidad / maximoDia) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[12px] text-[#666666] mt-4">Se cuentan todos los tipos de cuenta. Solo aparecen quienes tienen la fecha de registro guardada.</p>
        </div>
      )}

      {/* En el celu, Validaciones pendientes va arriba de "De dónde son los perfiles"; en la compu queda como estaba */}
      <div className="flex flex-col">
      {/* De dónde son los perfiles (desplegable) */}
      <div className="order-2 lg:order-1 bg-white rounded-[32px] border border-gray-100 p-5 md:p-8 shadow-sm mb-8">
        <button
          type="button"
          onClick={() => setVerLugares((v) => !v)}
          aria-expanded={verLugares}
          className={`w-full flex items-center justify-between gap-3 text-left ${verLugares ? 'mb-6 border-b border-gray-50 pb-4' : ''}`}
        >
          <h2 className="text-[18px] font-black font-['Montserrat'] text-[#1A3D3D]">De dónde son los perfiles</h2>
          <ChevronDown className={`w-5 h-5 text-[#2D6A6A] shrink-0 transition-transform duration-300 ${verLugares ? 'rotate-180' : ''}`} />
        </button>
        {!verLugares ? null : isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-[#2D6A6A]" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <p className="text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] mb-3">Provincias</p>
              <div className="space-y-3">
                {lugares.provincias.slice(0, 8).map((p) => (
                  <button
                    key={p.nombre}
                    type="button"
                    onClick={() => setProvSel(provSel === p.nombre ? '' : p.nombre)}
                    className={`w-full flex items-center justify-between text-[14px] px-3 py-2 rounded-xl transition-colors ${provSel === p.nombre ? 'bg-[#2D6A6A] text-white' : 'hover:bg-[#F4F7F7] text-[#1A3D3D]'}`}
                  >
                    <span className="font-semibold">{p.nombre}</span>
                    <span className={`font-black ${provSel === p.nombre ? 'text-white' : 'text-[#2D6A6A]'}`}>{p.total}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#2D6A6A] uppercase tracking-[0.2em] mb-3">{provSel ? `Zonas y ciudades de ${provSel}` : 'Zonas y ciudades principales'}</p>
              <div className="space-y-3">
                {lugares.localidades
                  .filter((l) => l.nombre !== l.provincia && (!provSel || l.provincia === provSel))
                  .slice(0, 12)
                  .map((l) => (
                    <div key={`${l.nombre}-${l.provincia}`} className="flex items-center justify-between text-[14px]">
                      <span className="font-semibold text-[#1A3D3D]">{l.nombre}{!provSel && <span className="font-normal text-[#666666]"> · {l.provincia}</span>}</span>
                      <span className="font-black text-[#2D6A6A]">{l.total}</span>
                    </div>
                  ))}
                {lugares.localidades.filter((l) => l.nombre !== l.provincia && (!provSel || l.provincia === provSel)).length === 0 && (
                  <p className="text-[13px] text-[#666666]">{provSel ? 'Esta provincia no tiene localidades cargadas por separado.' : 'Todavía no hay localidades cargadas.'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="order-1 lg:order-2 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 lg:mb-0">
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
                  <div className="w-10 h-10 bg-[#FF9800]/20 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#e68900]" />
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
          <button
            type="button"
            onClick={() => setVerLlegada((v) => !v)}
            aria-expanded={verLlegada}
            className={`w-full flex items-center justify-between gap-3 text-left relative z-10 ${verLlegada ? 'mb-6' : ''}`}
          >
            <h2 className="text-[18px] font-black font-['Montserrat']">Llegaron por</h2>
            <ChevronDown className={`w-5 h-5 text-[#4DB6AC] shrink-0 transition-transform duration-300 ${verLlegada ? 'rotate-180' : ''}`} />
          </button>
          <div className={`space-y-4 relative z-10 ${verLlegada ? '' : 'hidden'}`}>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#4DB6AC]" />
            ) : llegaronPor.length > 0 ? (
              <>
                {llegaronPor.map(([nombre, cantidad]) => {
                  const total = llegaronPor.reduce((suma, [, n]) => suma + n, 0);
                  return (
                    <div key={nombre}>
                      <div className="flex items-center justify-between text-[13px] font-semibold mb-1.5">
                        <span className={nombre === 'Sin dato' ? 'text-white/50' : 'text-white'}>{nombre}</span>
                        <span className="text-[#4DB6AC] font-black">{cantidad}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${nombre === 'Sin dato' ? 'bg-white/30' : 'bg-[#4DB6AC]'}`}
                          style={{ width: `${(cantidad / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
               
              </>
            ) : (
              <p className="text-white/70 text-[13px] font-medium">Todavía no hay datos.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}