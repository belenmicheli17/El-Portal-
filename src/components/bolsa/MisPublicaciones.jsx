import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { ChevronLeft, ChevronDown, Pencil, RefreshCw, Trash2, Plus, Briefcase, User, Users } from 'lucide-react';
import { db } from '../../firebase';
import { etiquetaRol, diasRestantes, estaVencida, nuevoVencimiento, zonaTexto, leerPerfilPostulante, etiquetaAlumnx } from '../../utils/bolsa';
import { VentanaConfirmar, BotonImagenOferta } from './ElementosBolsa';

function Estado({ item }) {
  if (item.estado === 'esperando') return <span className="bg-amber-50 text-amber-800 text-[12px] font-semibold px-2.5 py-0.5 rounded-full">Esperando la verificación de tu cuenta</span>;
  if (item.estado === 'pausado') return <span className="bg-amber-50 text-amber-800 text-[12px] font-semibold px-2.5 py-0.5 rounded-full">Pausada por el Portal</span>;
  if (estaVencida(item)) return <span className="bg-red-50 text-red-700 text-[12px] font-semibold px-2.5 py-0.5 rounded-full">Vencida</span>;
  const dias = diasRestantes(item);
  return <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${dias <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-[#2D6A6A]/10 text-[#1A3D3D]'}`}>Quedan {dias} {dias === 1 ? 'día' : 'días'}</span>;
}

const fechaCorta = (ms) => new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

// Los tres estados con los que la clínica ordena a sus postulantes
const ESTADOS_POST = {
  nueva: { label: 'Nueva', clase: 'bg-blue-50 text-blue-700' },
  interesa: { label: 'Me interesa', clase: 'bg-green-50 text-green-700' },
  descartada: { label: 'Descartada', clase: 'bg-gray-100 text-gray-500' }
};
const nombreCompleto = (p, perfil) => (perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() : '') || p.nombre || 'Postulante';
const fechaPost = (p) => (p.creadaEn?.toMillis ? fechaCorta(p.creadaEn.toMillis()) : '');

function Fila({ icono: Icono, titulo, subtitulo, item, coleccion, onEditar, onCambio, postulaciones = [], abierto = false, perfiles = {} }) {
  const navigate = useNavigate();
  const [verPostulantes, setVerPostulantes] = useState(abierto);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [error, setError] = useState('');
  const vencida = estaVencida(item);

  // Extender: vuelve a contar 30 días desde hoy
  const extender = async () => {
    setTrabajando(true);
    setError('');
    try {
      await actualizarPublicacion(coleccion, item.id, { vencimientoMillis: nuevoVencimiento() });
      onCambio();
    } catch (e) {
      console.error('Error extendiendo:', e);
      setError('No pudimos extenderla. Intentá de nuevo.');
    } finally {
      setTrabajando(false);
    }
  };

  const borrar = async () => {
    setTrabajando(true);
    setError('');
    try {
      await deleteDoc(doc(db, coleccion, item.id, 'privado', 'contacto')).catch(() => {});
      await deleteDoc(doc(db, coleccion, item.id));
      setConfirmarBorrar(false);
      onCambio();
    } catch (e) {
      console.error('Error borrando:', e);
      setError('No pudimos borrar la publicación. Intentá de nuevo.');
      setTrabajando(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center"><Icono className="w-5 h-5" /></div>
          <div className="min-w-0">
            <p className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[15px] leading-tight">{titulo}</p>
            {subtitulo && <p className="text-[13px] text-[#666666] mt-0.5 truncate">{subtitulo}</p>}
            <div className="mt-2"><Estado item={item} /></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!['pausado', 'esperando'].includes(item.estado) && (
            <button type="button" onClick={extender} disabled={trabajando} className="inline-flex items-center gap-1.5 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
              <RefreshCw className={`w-4 h-4 ${trabajando ? 'animate-spin' : ''}`} /> {vencida ? 'Volver a publicar' : 'Extender 30 días'}
            </button>
          )}
          <button type="button" onClick={onEditar} disabled={trabajando} className="inline-flex items-center gap-1.5 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button type="button" onClick={() => { setError(''); setConfirmarBorrar(true); }} disabled={trabajando} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 text-[#666666] rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
            <Trash2 className="w-4 h-4" /> Borrar
          </button>
        </div>
      </div>

      {/* Explicación de qué hace "Extender" */}
      {item.estado === 'esperando' && (
        <p className="text-[12px] text-[#666666] mt-3 md:pl-16">Todavía no se ve en la Bolsa. Se publica sola, por 30 días, apenas verifiquemos tu matrícula.</p>
      )}
      {!['pausado', 'esperando'].includes(item.estado) && (
        <p className="text-[12px] text-[#666666] mt-3 md:pl-16">
          {vencida
            ? 'Ya no se ve en la Bolsa. «Volver a publicar» la muestra de nuevo por 30 días, gratis.'
            : `Se ve en la Bolsa hasta el ${fechaCorta(item.vencimientoMillis)}. «Extender 30 días» le suma un mes más desde hoy, gratis.`}
        </p>
      )}
      {error && !confirmarBorrar && <p className="text-[13px] font-semibold text-red-600 mt-2 md:pl-16">{error}</p>}

      {/* Postulantes de esta oferta */}
      {coleccion === 'ofertasEmpleo' && (
        <div className="mt-4 md:pl-16">
          <div className="mb-3"><BotonImagenOferta oferta={item} /></div>
          <button type="button" onClick={() => setVerPostulantes((v) => !v)} className="inline-flex items-center gap-2 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors">
            <Users className="w-4 h-4 text-[#2D6A6A]" /> Postulantes · {postulaciones.length}
            {postulaciones.filter((p) => p.estado === 'nueva').length > 0 && (
              <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{postulaciones.filter((p) => p.estado === 'nueva').length} nuevas</span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${verPostulantes ? 'rotate-180' : ''}`} />
          </button>

          {verPostulantes && (
            postulaciones.length === 0 ? (
              <p className="text-[13px] text-[#666666] mt-3">Todavía nadie se postuló a esta oferta.</p>
            ) : (
              <div className="flex flex-col gap-2 mt-3">
                {[...postulaciones].sort((a, b) => (b.creadaEn?.toMillis?.() || 0) - (a.creadaEn?.toMillis?.() || 0)).map((p) => (
                  <button key={p.id} type="button" onClick={() => navigate(`/postulacion/${p.id}`)} className="flex items-center gap-3 text-left bg-white border border-gray-100 hover:border-[#2D6A6A]/40 rounded-2xl px-4 py-3 transition-colors">
                    {perfiles[p.postulanteId]?.foto ? (
                      <img src={perfiles[p.postulanteId].foto} alt="" className="w-9 h-9 shrink-0 rounded-full object-cover border border-gray-100" />
                    ) : (
                      <div className="w-9 h-9 shrink-0 rounded-full bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center"><User className="w-4 h-4" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-[#1A3D3D] truncate">
                        {nombreCompleto(p, perfiles[p.postulanteId])}
                        {perfiles[p.postulanteId]?.esAlumnx && <span className="ml-2 align-middle bg-rose-50 text-rose-500 text-[11px] font-bold uppercase tracking-[0.08em] rounded-full px-2 py-0.5">{etiquetaAlumnx(perfiles[p.postulanteId].tituloGenero)}</span>}
                      </p>
                      <p className="text-[12px] text-[#666666]">Se postuló el {fechaPost(p)}{p.conCV ? ' · con currículum' : ' · con perfil'}</p>
                    </div>
                    <span className={`shrink-0 text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${ESTADOS_POST[p.estado]?.clase || ESTADOS_POST.nueva.clase}`}>{ESTADOS_POST[p.estado]?.label || 'Nueva'}</span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      )}

      <VentanaConfirmar
        abierta={confirmarBorrar}
        titulo="¿Borrar esta publicación?"
        texto="Se borra de la Bolsa de Trabajo y no se puede deshacer."
        textoBoton="Sí, borrar"
        peligro
        trabajando={trabajando}
        error={error}
        onConfirmar={borrar}
        onCerrar={() => setConfirmarBorrar(false)}
      />
    </div>
  );
}

// Renovar solo toca la fecha de vencimiento (las reglas no dejan cambiar nada más de paso)
const actualizarPublicacion = (coleccion, id, cambios) => updateDoc(doc(db, coleccion, id), cambios);

export default function MisPublicaciones({ currentUser, misOfertas, miDisponible, abrirPostulantes = '', onVolver, onNuevaOferta, onEditarOferta, onEditarDisponible, onCambio }) {
  const esClinica = currentUser?.rol === 'clinica' || currentUser?.rol === 'admin';
  // Profesionales y alumnos/as: tienen disponibilidad y postulaciones propias
  const esProfesional = ['profesional', 'alumnx'].includes(currentUser?.rol);
  const [postulaciones, setPostulaciones] = useState([]);
  const [perfiles, setPerfiles] = useState({});

  // Clínica: las postulaciones que recibió. Profesional: las que mandó.
  useEffect(() => {
    if (!currentUser?.uid) return;
    const campo = esClinica ? 'clinicaId' : 'postulanteId';
    getDocs(query(collection(db, 'postulaciones'), where(campo, '==', currentUser.uid)))
      .then((snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPostulaciones(lista);
        // Perfil público de cada postulante (apellido y foto)
        [...new Set(lista.map((p) => p.postulanteId))].forEach((uid) => {
          leerPerfilPostulante(uid)
            .then((perfil) => { if (perfil) setPerfiles((prev) => ({ ...prev, [uid]: perfil })); })
            .catch(() => {});
        });
      })
      .catch((e) => console.error('Error leyendo las postulaciones:', e));
  }, [currentUser?.uid, esClinica]);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6 lg:pt-10 pb-16 font-['Inter'] relative z-10 animate-in fade-in duration-300">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-6">
        <ChevronLeft className="w-4 h-4" /> Volver a la Bolsa
      </button>
      <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[36px] leading-tight tracking-tight mb-2">Mis publicaciones</h1>
      <p className="text-[15px] text-[#666666] mb-8">Cada publicación se ve 30 días en la Bolsa. Extenderla es gratis.</p>

      {esClinica && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[#1A3D3D]">Mis ofertas · {misOfertas.length}</h2>
            <button type="button" onClick={onNuevaOferta} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]"><Plus className="w-4 h-4" /> Nueva oferta</button>
          </div>
          {misOfertas.length === 0 ? (
            <p className="bg-white rounded-[24px] border border-gray-100 p-6 text-[14px] text-[#666666]">Todavía no publicaste ofertas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {misOfertas.map((o) => (
                <Fila key={o.id} icono={Briefcase} titulo={`Puesto: ${o.puestoTexto?.trim() || etiquetaRol(o.rol)}`} subtitulo={[zonaTexto(o), (o.areas || []).join(', ')].filter(Boolean).join(' · ')} item={o} coleccion="ofertasEmpleo" onEditar={() => onEditarOferta(o)} onCambio={onCambio} postulaciones={postulaciones.filter((p) => p.ofertaId === o.id)} abierto={abrirPostulantes === o.id} perfiles={perfiles} />
              ))}
            </div>
          )}
        </section>
      )}

      {esProfesional && (
        <section>
          <h2 className="text-[14px] font-bold text-[#1A3D3D] mb-4">Mi disponibilidad</h2>
          {miDisponible ? (
            <Fila icono={User} titulo={miDisponible.puesto === 'asistente' ? 'Asistente (estudiante)' : (miDisponible.areas || []).join(' · ') || 'Disponible'} subtitulo={miDisponible.provincia} item={miDisponible} coleccion="profesionalesDisponibles" onEditar={onEditarDisponible} onCambio={onCambio} />
          ) : (
            <div className="bg-white rounded-[24px] border border-gray-100 p-6">
              <p className="text-[14px] text-[#666666] mb-4">Todavía no te marcaste como disponible.</p>
              <button type="button" onClick={onEditarDisponible} className="inline-flex items-center gap-1.5 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white rounded-2xl px-5 py-3 text-[14px] font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Marcarme como disponible
              </button>
            </div>
          )}
        </section>
      )}

      {esProfesional && (
        <section className="mt-10">
          <h2 className="text-[14px] font-bold text-[#1A3D3D] mb-4">Mis postulaciones · {postulaciones.length}</h2>
          {postulaciones.length === 0 ? (
            <p className="bg-white rounded-[24px] border border-gray-100 p-6 text-[14px] text-[#666666]">Todavía no te postulaste a ninguna oferta.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {[...postulaciones].sort((a, b) => (b.creadaEn?.toMillis?.() || 0) - (a.creadaEn?.toMillis?.() || 0)).map((p) => (
                <div key={p.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[15px] leading-tight">{p.puesto}{p.clinicaNombre ? ` en ${p.clinicaNombre}` : ''}</p>
                    <p className="text-[13px] text-[#666666] mt-0.5">Te postulaste el {fechaPost(p)} · {p.conCV ? 'con tu currículum' : 'con tu perfil'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
