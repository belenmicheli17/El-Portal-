import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Loader2, MousePointerClick, Search, UserX, SearchX, RefreshCw } from 'lucide-react';
import { db } from '../../firebase';

// Actividad de la Cartilla: quién contacta a los perfiles y qué se busca.
// Sale de la medición anónima (src/utils/medicion.js). No hay datos personales:
// "sin sesión" = alguien que no inició sesión, que casi seguro es un tutor/a.

const PERIODOS = [{ dias: 7, label: '7 días' }, { dias: 30, label: '30 días' }, { dias: 90, label: '90 días' }];
const NOMBRES_CANAL = { whatsapp: 'WhatsApp', mail: 'Mail', telefono: 'Teléfono', instagram: 'Instagram', mapa: 'Cómo llegar (mapa)', web: 'Sitio web' };
const NOMBRES_ORIGEN = { cartilla: 'Desde la Cartilla', directo: 'Link directo', sitio: 'Otra página del Portal', google: 'Google', instagram: 'Instagram', facebook: 'Facebook', whatsapp: 'WhatsApp', otro: 'Otro sitio' };
const MAXIMO = 3000; // tope de registros leídos por período (sobra para el volumen actual)

// Cuenta cuántas veces aparece cada valor y devuelve los más frecuentes
const ranking = (valores, cuantos = 8) => {
  const cuenta = new Map();
  valores.filter(Boolean).forEach((v) => cuenta.set(v, (cuenta.get(v) || 0) + 1));
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, cuantos);
};

function Tarjeta({ Icono, titulo, valor, ayuda }) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 text-[#666666] mb-2">
        <Icono className="w-4 h-4" />
        <h3 className="text-[12px] font-bold uppercase tracking-widest">{titulo}</h3>
      </div>
      <p className="text-[#1A3D3D] text-[32px] font-black font-['Montserrat'] leading-none">{valor}</p>
      {ayuda && <p className="text-[#666666] text-[13px] font-medium mt-2">{ayuda}</p>}
    </div>
  );
}

// Lista con barritas proporcionales
function Ranking({ titulo, filas, vacio = 'Todavía no hay datos.' }) {
  const maximo = Math.max(1, ...filas.map(([, n]) => n));
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
      <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] mb-4">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-[14px] text-[#666666]">{vacio}</p>
      ) : (
        <ul className="space-y-3">
          {filas.map(([etiqueta, n]) => (
            <li key={etiqueta}>
              <div className="flex justify-between gap-3 text-[14px] mb-1">
                <span className="text-[#1A3D3D] font-medium truncate">{etiqueta}</span>
                <span className="text-[#666666] font-semibold shrink-0">{n}</span>
              </div>
              <div className="h-2 rounded-full bg-[#F4F7F7]">
                <div className="h-2 rounded-full bg-[#2D6A6A]" style={{ width: `${Math.round((n / maximo) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ActividadCartilla() {
  const [dias, setDias] = useState(30);
  const [contactos, setContactos] = useState([]);
  const [busquedas, setBusquedas] = useState([]);
  const [nombres, setNombres] = useState({}); // id del perfil -> nombre
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargando(true);
      setError('');
      try {
        const desde = Timestamp.fromMillis(Date.now() - dias * 24 * 60 * 60 * 1000);
        const leer = (coleccion) => getDocs(query(collection(db, coleccion), where('fecha', '>=', desde), orderBy('fecha', 'desc'), limit(MAXIMO)));
        const [snapC, snapB] = await Promise.all([leer('contactos'), leer('busquedasCartilla')]);
        if (cancelado) return;
        const listaC = snapC.docs.map((d) => d.data());
        setContactos(listaC);
        setBusquedas(snapB.docs.map((d) => d.data()));

        // Nombres de los perfiles más contactados (son públicos)
        const ids = ranking(listaC.map((c) => `${c.tipoPerfil}|${c.perfilId}`), 10).map(([clave]) => clave);
        const pares = await Promise.all(ids.map(async (clave) => {
          const [tipo, id] = clave.split('|');
          try {
            const snap = await getDoc(doc(db, tipo === 'clinica' ? 'clinicas' : 'profesionales', id));
            const p = snap.data() || {};
            return [clave, `${p.nombre || ''} ${tipo === 'clinica' ? '' : (p.apellido || '')}`.trim() || 'Perfil sin nombre'];
          } catch {
            return [clave, 'Perfil'];
          }
        }));
        if (!cancelado) setNombres(Object.fromEntries(pares));
      } catch (e) {
        console.error('No se pudo leer la actividad:', e);
        if (!cancelado) setError('No pudimos cargar la actividad. Si es la primera vez, revisá que las reglas nuevas de Firestore estén pegadas.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, [dias, recarga]);

  const resumen = useMemo(() => {
    const sinSesion = contactos.filter((c) => !c.conSesion);
    const busquedasConTexto = busquedas.map((b) => b.texto).filter(Boolean);
    return {
      sinSesion: sinSesion.length,
      perfilesContactados: new Set(contactos.map((c) => c.perfilId)).size,
      porCanal: ranking(contactos.map((c) => NOMBRES_CANAL[c.canal] || c.canal)),
      porOrigen: ranking(contactos.map((c) => NOMBRES_ORIGEN[c.desde] || c.desde)),
      topPerfiles: ranking(contactos.map((c) => `${c.tipoPerfil}|${c.perfilId}`), 10)
        .map(([clave, n]) => [`${nombres[clave] || '…'}${clave.startsWith('clinica') ? ' (clínica)' : ''}`, n]),
      especialidades: ranking(busquedas.flatMap((b) => (b.especialidades?.length ? b.especialidades : [b.grupo]))),
      zonas: ranking(busquedas.flatMap((b) => b.zonas || [])),
      textos: ranking(busquedasConTexto),
      extras: ranking(busquedas.flatMap((b) => b.extras || [])),
      sinResultados: busquedas.filter((b) => b.resultados === 0).slice(0, 15)
    };
  }, [contactos, busquedas, nombres]);

  // Texto corto de lo que buscó alguien (para la lista de búsquedas sin resultados)
  const describir = (b) => [b.texto && `"${b.texto}"`, ...(b.especialidades || []), b.grupo, ...(b.zonas || []), ...(b.extras || [])].filter(Boolean).join(' · ') || 'Sin filtros';

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">Actividad de la Cartilla</h1>
          <p className="text-[#666666] text-[15px] font-medium max-w-2xl">
            Quién contacta a los perfiles y qué se busca. Es anónimo: «sin sesión» es alguien que no inició sesión, casi seguro un tutor/a.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl">
            {PERIODOS.map((p) => (
              <button key={p.dias} type="button" onClick={() => setDias(p.dias)}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all ${dias === p.dias ? 'bg-[#F4F7F7] text-[#1A3D3D] shadow-sm' : 'text-[#666666] hover:text-[#1A3D3D]'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setRecarga((n) => n + 1)} aria-label="Actualizar" className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm text-[#1A3D3D] hover:bg-[#F4F7F7]">
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {cargando && contactos.length === 0 && busquedas.length === 0 ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#2D6A6A]">
          <Loader2 className="w-6 h-6 animate-spin" /> <span className="font-medium">Cargando actividad...</span>
        </div>
      ) : error ? (
        <p className="bg-white rounded-[24px] border border-red-100 p-5 text-[14px] font-medium text-red-600" role="alert">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Tarjeta Icono={MousePointerClick} titulo="Contactos" valor={contactos.length} ayuda={`A ${resumen.perfilesContactados} perfiles distintos`} />
            <Tarjeta Icono={UserX} titulo="Sin sesión" valor={resumen.sinSesion} ayuda="Probables tutores/as" />
            <Tarjeta Icono={Search} titulo="Búsquedas" valor={busquedas.length} ayuda="Con algún filtro o texto" />
            <Tarjeta Icono={SearchX} titulo="Sin resultados" valor={busquedas.filter((b) => b.resultados === 0).length} ayuda="Búsquedas que no encontraron nada" />
          </div>

          <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[18px] mb-3 mt-8">Contactos a los perfiles</h2>
          <div className="grid lg:grid-cols-3 gap-4">
            <Ranking titulo="Perfiles más contactados" filas={resumen.topPerfiles} />
            <Ranking titulo="Por canal" filas={resumen.porCanal} />
            <Ranking titulo="De dónde venían" filas={resumen.porOrigen} />
          </div>

          <h2 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[18px] mb-3 mt-10">Qué se busca en la Cartilla</h2>
          <div className="grid lg:grid-cols-2 gap-4">
            <Ranking titulo="Especialidades" filas={resumen.especialidades} />
            <Ranking titulo="Zonas" filas={resumen.zonas} />
            <Ranking titulo="Texto escrito en el buscador" filas={resumen.textos} />
            <Ranking titulo="Otros filtros" filas={resumen.extras} />
          </div>

          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 mt-4">
            <h3 className="font-['Montserrat'] font-bold text-[#1A3D3D] text-[16px] mb-1">Búsquedas sin resultados</h3>
            <p className="text-[13px] text-[#666666] mb-4">Lo que alguien buscó y no encontró: muestra dónde faltan profesionales.</p>
            {resumen.sinResultados.length === 0 ? (
              <p className="text-[14px] text-[#666666]">Ninguna en este período.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {resumen.sinResultados.map((b, i) => (
                  <li key={i} className="py-2.5 flex justify-between gap-4 text-[14px]">
                    <span className="text-[#1A3D3D] font-medium">{describir(b)}</span>
                    <span className="text-[#666666] shrink-0">{b.fecha?.toDate ? b.fecha.toDate().toLocaleDateString('es-AR') : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
