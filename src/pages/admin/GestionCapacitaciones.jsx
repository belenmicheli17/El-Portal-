import React, { useState, useEffect } from 'react';
import {
  BookOpen, CheckCircle, XCircle, Trash2,
  Loader2, ChevronDown, ChevronUp, Mail, Clock, User, Edit, X, Save
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

// Función para enviar mails con Brevo
const enviarMailBrevo = async (destinatario, asunto, contenido) => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: 'El Portal Veterinario', email: 'portalveterinario.ar@gmail.com' },
      to: [{ email: destinatario }],
      subject: asunto,
      textContent: contenido,
    }),
  });
};

const crearNotificacion = async (datos) => {
  try {
    await addDoc(collection(db, 'notificaciones'), {
      ...datos,
      fecha: serverTimestamp(),
    });
  } catch (e) {
    console.error('Error creando notificación:', e);
  }
};

export default function GestionCapacitaciones() {
  const [cursos, setCursos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [tabActiva, setTabActiva] = useState('pendiente');
  const [editandoCurso, setEditandoCurso] = useState(null);
  const [formEdicion, setFormEdicion] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [inscriptosPorCurso, setInscriptosPorCurso] = useState({});

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const [snapCursos, snapInscriptos] = await Promise.all([
          getDocs(query(collection(db, 'capacitaciones'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'inscripciones'))
        ]);
        setCursos(snapCursos.docs.map(d => ({ id: d.id, ...d.data() })));
        // Agrupar inscriptos por cursoId
        const conteo = {};
        snapInscriptos.docs.forEach(d => {
          const { cursoId } = d.data();
          if (cursoId) conteo[cursoId] = (conteo[cursoId] || 0) + 1;
        });
        setInscriptosPorCurso(conteo);
      } catch (error) {
        console.error("Error cargando capacitaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCursos();
  }, []);

  const handleAprobar = async (curso) => {
    if (!window.confirm(`¿Aprobar el curso "${curso.titulo}"?`)) return;
    setProcesando(curso.id);
    try {
      await updateDoc(doc(db, 'capacitaciones', curso.id), { estado: 'aprobado' });
      setCursos(prev => prev.map(c => c.id === curso.id ? { ...c, estado: 'aprobado' } : c));

      // Notificación personal al docente
      if (curso.creadorId) {
        await crearNotificacion({
          tipo: 'curso_aprobado',
          userId: curso.creadorId,
          rolDestino: [],
          texto: `Tu curso "${curso.titulo}" fue aprobado y ya está visible en el listado.`,
        });
      }
      // Notificación broadcast a toda la comunidad
      await crearNotificacion({
        tipo: 'capacitacion',
        rolDestino: ['profesional', 'clinica', 'alumnx'],
        texto: `Nuevo curso disponible: "${curso.titulo}"`,
      });

      // Mail de aprobación
      if (curso.email) {
        await enviarMailBrevo(
          curso.email,
          '✅ Tu curso fue aprobado — El Portal',
          `Hola, ${curso.instructor || 'equipo docente'}.

Queríamos contarte que tu curso "${curso.titulo}" fue revisado y aprobado por nuestro equipo.

A partir de ahora está visible en el repertorio de capacitaciones de El Portal y los profesionales ya pueden inscribirse.

Si tenés alguna consulta, respondé este mail y te ayudamos.

¡Muchas gracias por ser parte de El Portal!
El equipo de El Portal Veterinario`
        );
      }
    } catch (error) {
      console.error("Error aprobando:", error);
      alert("Hubo un error al aprobar el curso.");
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (curso) => {
    const motivo = window.prompt(`¿Por qué rechazás "${curso.titulo}"?\nEste motivo se le va a enviar por mail a la institución:`);
    if (motivo === null) return;
    if (!motivo.trim()) {
      alert("Por favor ingresá un motivo antes de rechazar.");
      return;
    }
    setProcesando(curso.id);
    try {
      await updateDoc(doc(db, 'capacitaciones', curso.id), {
        estado: 'rechazado',
        motivoRechazo: motivo,
      });
      setCursos(prev => prev.map(c => c.id === curso.id ? { ...c, estado: 'rechazado', motivoRechazo: motivo } : c));

      // Notificación personal al docente
      if (curso.creadorId) {
        await crearNotificacion({
          tipo: 'curso_rechazado',
          userId: curso.creadorId,
          rolDestino: [],
          texto: `Tu curso "${curso.titulo}" necesita ajustes: ${motivo}`,
        });
      }

      // Mail de rechazo
      if (curso.email) {
        await enviarMailBrevo(
          curso.email,
          '⚠️ Tu curso necesita ajustes — El Portal',
          `Hola, ${curso.instructor || 'equipo docente'}.

Revisamos tu propuesta "${curso.titulo}" y por el momento no podemos publicarla porque encontramos lo siguiente:

${motivo}

No te preocupes, podés corregirlo y volver a enviarlo cuando esté listo. Si tenés dudas sobre los cambios necesarios, respondé este mail y te orientamos.

El equipo de El Portal Veterinario`
        );
      }
    } catch (error) {
      console.error("Error rechazando:", error);
      alert("Hubo un error al rechazar el curso.");
    } finally {
      setProcesando(null);
    }
  };

  const handleVolverAPendiente = async (curso) => {
    if (!window.confirm(`¿Volver "${curso.titulo}" a pendiente?`)) return;
    setProcesando(curso.id);
    try {
      await updateDoc(doc(db, 'capacitaciones', curso.id), {
        estado: 'pendiente',
        motivoRechazo: '',
      });
      setCursos(prev => prev.map(c => c.id === curso.id ? { ...c, estado: 'pendiente', motivoRechazo: '' } : c));
    } catch (error) {
      console.error("Error actualizando estado:", error);
      alert("Hubo un error.");
    } finally {
      setProcesando(null);
    }
  };

const handleAbrirEdicion = (curso) => {
    setFormEdicion({ ...curso, incluye: curso.incluye || [''] });
    setEditandoCurso(curso.id);
  };

  const handleCerrarEdicion = () => {
    setEditandoCurso(null);
    setFormEdicion(null);
  };

  const handleCambioEdicion = (campo, valor) => {
    setFormEdicion(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardarEdicion = async () => {
    if (!formEdicion) return;
    setGuardandoEdicion(true);
    try {
      const datosActualizados = {
        titulo: formEdicion.titulo,
        descripcion: formEdicion.descripcion,
        modalidad: formEdicion.modalidad,
        precio: Number(formEdicion.precio),
        nivel: formEdicion.nivel,
        duracion: formEdicion.duracion,
        categoria: formEdicion.categoria,
        incluye: (formEdicion.incluye || []).filter(i => i.trim()),
        email: formEdicion.email,
        linkExterno: formEdicion.linkExterno || '',
        tipoCurso: formEdicion.tipoCurso || 'grabado',
        fechaInscripcion: formEdicion.fechaInscripcion || null,
        fechaInicio: formEdicion.fechaInicio || null,
        instructor: formEdicion.instructor || '',
        instructorBio: formEdicion.instructorBio || '',
        marca: formEdicion.marca || '',
        responsableNombre: formEdicion.responsableNombre || '',
        responsableDNI: formEdicion.responsableDNI || '',
        responsableMatricula: formEdicion.responsableMatricula || '',
      };
      await updateDoc(doc(db, 'capacitaciones', formEdicion.id), datosActualizados);
      setCursos(prev => prev.map(c => c.id === formEdicion.id ? { ...c, ...datosActualizados } : c));
      handleCerrarEdicion();
    } catch (error) {
      console.error("Error guardando edición:", error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminar = async (curso) => {
    if (!window.confirm(`¿Eliminar definitivamente "${curso.titulo}"? Esta acción no se puede deshacer.`)) return;
    setProcesando(curso.id);
    try {
      await deleteDoc(doc(db, 'capacitaciones', curso.id));
      setCursos(prev => prev.filter(c => c.id !== curso.id));
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("Hubo un error al eliminar.");
    } finally {
      setProcesando(null);
    }
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cursosFiltrados = cursos.filter(c => {
    if (c.estado !== tabActiva) return false;
    if (filtroPeriodo === 'todos') return true;
    if (filtroPeriodo === 'proximos') {
      if (c.tipoCurso !== 'en_vivo') return false;
      const fechaInicio = c.fechaInicio ? new Date(c.fechaInicio) : null;
      return fechaInicio && fechaInicio >= hoy;
    }
    if (filtroPeriodo === 'finalizados') {
      if (c.tipoCurso !== 'en_vivo') return false;
      const fechaInicio = c.fechaInicio ? new Date(c.fechaInicio) : null;
      return fechaInicio && fechaInicio < hoy;
    }
    if (filtroPeriodo === 'grabados') return c.tipoCurso === 'grabado';
    return true;
  });

 const TABS = [
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'aprobado', label: 'Aprobados' },
    { key: 'rechazado', label: 'Rechazados' },
    { key: 'archivado', label: 'Archivados' },
  ];

  const BADGE = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-600',
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2">
          Moderación: Capacitaciones
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Revisá, aprobá o rechazá los cursos enviados por las instituciones.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm inline-flex mb-8 gap-1">
        {TABS.map(tab => {
          const cantidad = cursos.filter(c => c.estado === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[13px] font-bold uppercase tracking-widest transition-all ${tabActiva === tab.key ? 'bg-[#1A3D3D] text-white shadow-md' : 'text-[#666666] hover:bg-[#F4F7F7]'}`}
            >
              {tab.label}
              {cantidad > 0 && (
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${tabActiva === tab.key ? 'bg-white/20 text-white' : BADGE[tab.key]}`}>
                  {cantidad}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtro por período */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Filtrar:</span>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'proximos', label: 'Próximos (en vivo)' },
          { key: 'finalizados', label: 'Finalizados' },
          { key: 'grabados', label: 'Grabados' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroPeriodo(f.key)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${filtroPeriodo === f.key ? 'bg-[#2D6A6A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#2D6A6A] hover:text-[#2D6A6A]'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A6A]" />
        </div>
      ) : cursosFiltrados.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-gray-100 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-[#666666] font-medium">No hay cursos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cursosFiltrados.map(curso => (
            <div key={curso.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">

              {/* Fila principal */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={curso.imagen}
                    alt={curso.titulo}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-100"
                  />
                  <div>
                    <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px] leading-tight mb-1">
                      {curso.titulo}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[#666666] text-[12px] font-medium">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {curso.instructor}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {curso.email || 'Sin email'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {curso.duracion}</span>
                      <span className="flex items-center gap-1 font-bold text-[#2D6A6A]">
                        <BookOpen className="w-3.5 h-3.5" /> {inscriptosPorCurso[curso.id] || 0} inscripto{inscriptosPorCurso[curso.id] !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Motivo de rechazo visible */}
                    {curso.estado === 'rechazado' && curso.motivoRechazo && (
                      <p className="mt-2 text-red-500 text-[12px] font-semibold bg-red-50 px-3 py-1.5 rounded-lg">
                        Motivo: {curso.motivoRechazo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Expandir detalle */}
                  <button
                    onClick={() => setExpandido(expandido === curso.id ? null : curso.id)}
                    className="p-3 rounded-xl border border-gray-200 text-[#666666] hover:bg-gray-50 transition-colors"
                    title="Ver detalle"
                  >
                    {expandido === curso.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Botones según estado */}
                  {curso.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleRechazar(curso)}
                        disabled={procesando === curso.id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 text-[12px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {procesando === curso.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleAprobar(curso)}
                        disabled={procesando === curso.id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] text-[12px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {procesando === curso.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Aprobar
                      </button>
                    </>
                  )}

                  {curso.estado === 'rechazado' && (
                    <button
                      onClick={() => handleVolverAPendiente(curso)}
                      disabled={procesando === curso.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-[12px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      {procesando === curso.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Volver a pendiente
                    </button>
                  )}

                  {curso.estado === 'aprobado' && (
                    <button
                      onClick={() => handleRechazar(curso)}
                      disabled={procesando === curso.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 text-[12px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      {procesando === curso.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Dar de baja
                    </button>
                  )}

                  {/* Editar */}
                  <button
                    onClick={() => handleAbrirEdicion(curso)}
                    className="p-3 rounded-xl border border-gray-200 text-[#2D6A6A] hover:bg-[#2D6A6A]/10 transition-colors"
                    title="Editar curso"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Eliminar siempre disponible */}
                  <button
                    onClick={() => handleEliminar(curso)}
                    disabled={procesando === curso.id}
                    className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    title="Eliminar definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Panel expandible con detalle del curso */}
              {expandido === curso.id && (
                <div className="border-t border-gray-100 bg-[#F4F7F7] p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div>
                    <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-1">Descripción</p>
                    <p className="text-[14px] text-[#333333] font-medium leading-relaxed">{curso.descripcion || '—'}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-1">Modalidad</p>
                      <p className="text-[14px] text-[#333333] font-medium">{curso.modalidad}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-1">Precio</p>
                      <p className="text-[14px] text-[#333333] font-medium">${Number(curso.precio).toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-1">Nivel</p>
                      <p className="text-[14px] text-[#333333] font-medium">{curso.nivel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-1">Puntos clave</p>
                      <ul className="space-y-1">
                        {(curso.incluye || []).map((item, idx) => (
                          <li key={idx} className="text-[13px] text-[#333333] font-medium flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-[#2D6A6A] shrink-0" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                      <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Publicado por</p>
                      {curso.creadorId ? (
                        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                          <div>
                            <p className="text-[14px] font-black text-[#1A3D3D]">{curso.creadorNombre || 'Sin nombre registrado'}</p>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D6A6A] bg-[#2D6A6A]/10 px-2 py-0.5 rounded-md inline-block mt-1">
                              {curso.creadorRol || 'rol desconocido'}
                            </span>
                          </div>
                          {curso.creadorSlug && curso.creadorRol && (
                            <a href={`/${curso.creadorRol === 'clinica' ? 'clinica' : 'profesional'}/${curso.creadorSlug}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold uppercase tracking-widest text-[#2D6A6A] hover:underline shrink-0">
                              Ver perfil →
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-400 italic">Curso publicado antes de registrar esta información.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))}
     </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {editandoCurso && formEdicion && (
        <div className="fixed inset-0 bg-[#1A3D3D]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px]">Editar curso</h3>
                <p className="text-[#666666] text-[12px] font-medium mt-1">El curso mantiene su estado actual al guardar.</p>
              </div>
              <button onClick={handleCerrarEdicion} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Título</label>
                <input type="text" value={formEdicion.titulo || ''} onChange={(e) => handleCambioEdicion('titulo', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</label>
                <textarea value={formEdicion.descripcion || ''} onChange={(e) => handleCambioEdicion('descripcion', e.target.value)} rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D] resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Modalidad</label>
                  <select value={formEdicion.modalidad || ''} onChange={(e) => handleCambioEdicion('modalidad', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]">
                    <option value="Online">Online</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Precio (ARS)</label>
                  <input type="number" value={formEdicion.precio || ''} onChange={(e) => handleCambioEdicion('precio', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nivel</label>
                  <select value={formEdicion.nivel || ''} onChange={(e) => handleCambioEdicion('nivel', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]">
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Duración (texto libre)</label>
                  <input type="text" value={formEdicion.duracion || ''} onChange={(e) => handleCambioEdicion('duracion', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                <input type="text" value={formEdicion.categoria || ''} onChange={(e) => handleCambioEdicion('categoria', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del publicador (visible en el perfil del curso)</label>
                <input type="text" value={formEdicion.marca || ''} onChange={(e) => handleCambioEdicion('marca', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de curso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleCambioEdicion('tipoCurso', 'grabado')} className={`p-3 rounded-xl border-2 text-[12px] font-bold uppercase tracking-widest transition-all ${formEdicion.tipoCurso === 'grabado' ? 'border-[#2D6A6A] bg-[#2D6A6A]/5 text-[#2D6A6A]' : 'border-gray-200 text-gray-400'}`}>
                    Grabado
                  </button>
                  <button type="button" onClick={() => handleCambioEdicion('tipoCurso', 'en_vivo')} className={`p-3 rounded-xl border-2 text-[12px] font-bold uppercase tracking-widest transition-all ${formEdicion.tipoCurso === 'en_vivo' ? 'border-[#2D6A6A] bg-[#2D6A6A]/5 text-[#2D6A6A]' : 'border-gray-200 text-gray-400'}`}>
                    En vivo
                  </button>
                </div>
              </div>

              {formEdicion.tipoCurso === 'en_vivo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha límite de inscripción</label>
                    <input type="date" value={formEdicion.fechaInscripcion || ''} onChange={(e) => handleCambioEdicion('fechaInscripcion', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha de inicio</label>
                    <input type="date" value={formEdicion.fechaInicio || ''} onChange={(e) => handleCambioEdicion('fechaInicio', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email de contacto</label>
                <input type="email" value={formEdicion.email || ''} onChange={(e) => handleCambioEdicion('email', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Link externo (opcional)</label>
                <input type="url" value={formEdicion.linkExterno || ''} onChange={(e) => handleCambioEdicion('linkExterno', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-[10px] font-black text-[#2D6A6A] uppercase tracking-widest">Docente principal</p>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del docente</label>
                  <input type="text" value={formEdicion.instructor || ''} onChange={(e) => { handleCambioEdicion('instructor', e.target.value); handleCambioEdicion('marca', e.target.value); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bio del docente</label>
                  <textarea value={formEdicion.instructorBio || ''} onChange={(e) => handleCambioEdicion('instructorBio', e.target.value)} rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D] resize-none" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-[10px] font-black text-[#2D6A6A] uppercase tracking-widest">Datos del responsable</p>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre completo</label>
                  <input type="text" value={formEdicion.responsableNombre || ''} onChange={(e) => handleCambioEdicion('responsableNombre', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">DNI</label>
                    <input type="text" value={formEdicion.responsableDNI || ''} onChange={(e) => handleCambioEdicion('responsableDNI', e.target.value.replace(/\D/g, ''))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Matrícula</label>
                    <input type="text" value={formEdicion.responsableMatricula || ''} onChange={(e) => handleCambioEdicion('responsableMatricula', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white transition-all text-[#1A3D3D]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={handleCerrarEdicion} className="px-6 py-3 rounded-xl border border-gray-200 text-[#666666] font-bold text-[12px] uppercase tracking-widest hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarEdicion} disabled={guardandoEdicion} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D6A6A] text-white font-black text-[12px] uppercase tracking-widest hover:bg-[#1A3D3D] transition-colors disabled:opacity-50">
                {guardandoEdicion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}