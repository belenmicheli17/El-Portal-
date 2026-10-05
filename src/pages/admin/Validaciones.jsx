import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, User, Calendar, Mail, AlertTriangle, Loader2,
  Hash, MapPin, FileText, ExternalLink, X
} from 'lucide-react';
import { db, storage, auth } from '../../firebase';
import { collection, getDocs, getDoc, doc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import emailjs from '@emailjs/browser';

// Motivos frecuentes: al tocarlos se completan solos en el cuadro de texto (después se pueden editar)
const MOTIVOS_RAPIDOS = [
  'No pudimos encontrar tu matrícula en el colegio profesional.',
  'La foto de tu título o carnet no se lee bien. Subila de nuevo con mejor luz.',
  'Los datos que cargaste no coinciden con tu título.'
];

// Convierte la fecha que guarda Firestore en un texto legible
const formatearFecha = (marca) => {
  const fecha = marca?.toDate ? marca.toDate() : null;
  return fecha ? fecha.toLocaleDateString('es-AR') : '—';
};

export default function Validaciones() {
  const [pendientes, setPendientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [abriendoTitulo, setAbriendoTitulo] = useState(null);

  // Ventana para escribir el motivo del rechazo: guarda a quién se está rechazando
  const [modalRechazo, setModalRechazo] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // ----- Carga: todas las solicitudes de verificación que están pendientes -----
  useEffect(() => {
    const cargarPendientes = async () => {
      try {
        const consulta = query(collection(db, 'verificaciones'), where('estado', '==', 'pendiente'));
        const snap = await getDocs(consulta);

        // Por cada solicitud traemos también los datos de la cuenta (email, link del perfil)
        const lista = await Promise.all(snap.docs.map(async (d) => {
          const verificacion = d.data();
          let usuario = {};
          try {
            const snapUsuario = await getDoc(doc(db, 'usuarios', d.id));
            if (snapUsuario.exists()) usuario = snapUsuario.data();
          } catch (e) {
            console.error('No se pudo leer el usuario', d.id, e);
          }
          return {
            uid: d.id,
            ...verificacion,
            email: usuario.email || '',
            slug: usuario.slug || '',
            nombrePila: usuario.nombre || '',
            nombre: verificacion.datosEnviados?.nombreCompleto || usuario.nombreCompleto || usuario.nombre || 'Sin nombre'
          };
        }));

        // Las más viejas primero, para que nadie espere de más
        lista.sort((a, b) => (a.enviadoEn?.seconds || 0) - (b.enviadoEn?.seconds || 0));
        setPendientes(lista);
      } catch (error) {
        console.error('Error cargando pendientes:', error);
        setErrorCarga('No pudimos cargar las solicitudes. Revisá tu conexión y recargá la página.');
      } finally {
        setIsLoading(false);
      }
    };
    cargarPendientes();
  }, []);

  // ----- Ver el título: el archivo es privado, así que pedimos un link temporal -----
  const handleVerTitulo = async (req) => {
    if (!req.tituloPath) return;
    setAbriendoTitulo(req.uid);
    // Abrimos la pestaña ya mismo (si esperamos, el navegador la puede bloquear) y después le ponemos el link
    const ventana = window.open('', '_blank');
    try {
      const url = await getDownloadURL(ref(storage, req.tituloPath));
      if (ventana) ventana.location.href = url;
      else window.open(url, '_blank');
    } catch (error) {
      console.error('Error abriendo el título:', error);
      if (ventana) ventana.close();
      alert('No pudimos abrir el archivo del título.');
    } finally {
      setAbriendoTitulo(null);
    }
  };

  // ----- Aprobar: todo junto o nada (si algo falla, no queda a medias) -----
  const handleAprobar = async (req) => {
    if (!window.confirm(`¿Aprobar a ${req.nombre}? Su perfil va a quedar visible en la cartilla.`)) return;
    setProcesando(req.uid);
    try {
      const lote = writeBatch(db);
      lote.update(doc(db, 'verificaciones', req.uid), { estado: 'verificado', motivoRechazo: '', revisadoEn: serverTimestamp() });
      lote.update(doc(db, 'usuarios', req.uid), { estado: 'activo' });
      lote.set(doc(db, 'profesionales', req.uid), { visible: true }, { merge: true });
      await lote.commit();
    } catch (error) {
      console.error('Error aprobando:', error);
      alert('Hubo un error al aprobar. No se cambió nada, probá de nuevo.');
      setProcesando(null);
      return;
    }

    // Mail de aviso (si falla, la aprobación igual queda hecha)
    try {
      await emailjs.send(
        'service_5flv9gx',
        'template_stfs1uh',
        { nombre: req.nombrePila || req.nombre, email: req.email },
        'awqjrLv96HD2QZx1C'
      );
    } catch (error) {
      console.error('Error enviando el mail de aprobación:', error);
      alert('La persona quedó aprobada, pero el mail de aviso no salió.');
    }

    setPendientes((prev) => prev.filter((u) => u.uid !== req.uid));
    setProcesando(null);
  };

  // ----- Rechazar: abre la ventana para escribir el motivo -----
  const abrirRechazo = (req) => {
    setModalRechazo({ uid: req.uid, nombre: req.nombre, nombrePila: req.nombrePila, email: req.email });
    setMotivo('');
    setErrorModal('');
  };

  const cerrarRechazo = () => {
    if (procesando) return;
    setModalRechazo(null);
    setMotivo('');
    setErrorModal('');
  };

  const confirmarRechazo = async () => {
    const motivoLimpio = motivo.trim();
    if (motivoLimpio.length < 10) {
      setErrorModal('Escribí un motivo de al menos 10 letras: es lo que va a leer la persona.');
      return;
    }
    setProcesando(modalRechazo.uid);
    try {
      // El perfil sigue oculto (visible: false) y no se borra ningún dato
      await writeBatch(db)
        .update(doc(db, 'verificaciones', modalRechazo.uid), {
          estado: 'rechazado',
          motivoRechazo: motivoLimpio,
          revisadoEn: serverTimestamp()
        })
        .commit();

      // Mail con el motivo (si falla, el rechazo igual queda guardado y la persona lo ve al entrar)
      try {
        const token = await auth.currentUser.getIdToken();
        const respuesta = await fetch('/api/enviar-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            tipo: 'rechazo',
            email: modalRechazo.email,
            nombre: modalRechazo.nombrePila || modalRechazo.nombre,
            motivo: motivoLimpio
          })
        });
        if (!respuesta.ok) throw new Error(`Respuesta ${respuesta.status}`);
      } catch (errorMail) {
        console.error('Error enviando el mail de rechazo:', errorMail);
        alert('La solicitud quedó rechazada, pero el mail de aviso no salió. La persona va a ver el motivo cuando entre.');
      }

      setPendientes((prev) => prev.filter((u) => u.uid !== modalRechazo.uid));
      setModalRechazo(null);
      setMotivo('');
    } catch (error) {
      console.error('Error rechazando:', error);
      setErrorModal('Hubo un error al rechazar. No se cambió nada, probá de nuevo.');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">

      {/* Ventana para escribir el motivo del rechazo */}
      {modalRechazo && (
        <div className="fixed inset-0 bg-[#1A3D3D]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
              <div>
                <h3 className="font-['Montserrat'] font-black text-xl text-[#1A3D3D]">Rechazar a {modalRechazo.nombre}</h3>
                <p className="text-[14px] text-[#666666] mt-1 leading-relaxed">
                  La persona va a ver este mensaje en su pantalla y podrá corregir sus datos y volver a enviarlos. No se borra nada.
                </p>
              </div>
              <button type="button" onClick={cerrarRechazo} className="p-2.5 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {MOTIVOS_RAPIDOS.map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => { setMotivo(texto); setErrorModal(''); }}
                    className="border border-gray-200 bg-white text-[#555555] rounded-xl px-3 py-2 text-[13px] font-medium text-left transition-all duration-300 ease-in-out hover:border-[#2D6A6A]"
                  >
                    {texto}
                  </button>
                ))}
              </div>

              <label htmlFor="motivo-rechazo" className="block text-[15px] font-semibold text-[#1A3D3D] mb-2">Motivo</label>
              <textarea
                id="motivo-rechazo"
                rows={4}
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); setErrorModal(''); }}
                placeholder="Contale qué tiene que corregir"
                className="w-full bg-[#F4F7F7] border border-transparent rounded-2xl px-5 py-4 text-[16px] font-medium text-[#1A3D3D] outline-none transition-all duration-300 ease-in-out focus:bg-white focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 placeholder:text-gray-400 resize-none"
              />
              <p className="min-h-[20px] text-sm font-medium text-red-500 mt-2" role="alert">{errorModal}</p>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3">
              <button type="button" onClick={cerrarRechazo} disabled={!!procesando} className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors text-[14px] disabled:opacity-60">
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={!!procesando}
                className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold text-[14px] hover:bg-red-600 transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
              >
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Rechazar y avisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2 flex items-center gap-3">
          Validaciones Pendientes
          {pendientes.length > 0 && (
            <span className="bg-orange-100 text-orange-600 text-[14px] px-3 py-1 rounded-xl font-bold">
              {pendientes.length}
            </span>
          )}
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Revisá la matrícula y el título de cada solicitud antes de darle acceso completo.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A6A]" />
        </div>
      ) : errorCarga ? (
        <div className="bg-red-50 border border-red-100 rounded-[32px] p-8 text-center text-red-500 font-medium">
          {errorCarga}
        </div>
      ) : pendientes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendientes.map((req) => {
            const datos = req.datosEnviados || {};
            const ocupado = procesando === req.uid;

            return (
              <div key={req.uid} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 flex-1">

                  {/* Encabezado de tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#2D6A6A]/10 text-[#2D6A6A]">
                        <User className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px] leading-tight mb-1 break-words">
                          {req.nombre}
                        </h3>
                        <span className="inline-block bg-[#F4F7F7] text-[#666666] text-[11px] md:text-[12px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest">
                          Nuevo profesional
                        </span>
                      </div>
                    </div>
                    <p className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5" /> {formatearFecha(req.enviadoEn)}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-3 mb-4">
                    <Mail className="w-4 h-4 text-[#666666] shrink-0" />
                    <span className="text-[#666666] text-[13px] font-medium w-20 shrink-0">Email:</span>
                    <span className="text-[#1A3D3D] text-[14px] font-bold break-all">{req.email || '—'}</span>
                  </div>

                  {/* Datos que mandó (para chequear en el colegio profesional) */}
                  <div className="space-y-2 bg-[#F4F7F7] rounded-2xl p-4">
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                      <Hash className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                      <span className="text-[#666666] text-[12px] font-medium w-24 shrink-0">Matrícula:</span>
                      <span className="text-[#1A3D3D] text-[13px] font-bold">
                        {datos.tipoMatricula} {datos.matricula || '—'}
                      </span>
                    </div>

                    {datos.matricula2 && (
                      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                        <Hash className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                        <span className="text-[#666666] text-[12px] font-medium w-24 shrink-0">2ª matrícula:</span>
                        <span className="text-[#1A3D3D] text-[13px] font-bold">
                          {datos.tipoMatricula2} {datos.matricula2}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                      <MapPin className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                      <span className="text-[#666666] text-[12px] font-medium w-24 shrink-0">Provincia:</span>
                      <span className="text-[#1A3D3D] text-[13px] font-bold">{datos.provincia || '—'}</span>
                    </div>

                    {/* Título o carnet */}
                    {req.tituloPath ? (
                      <button
                        type="button"
                        onClick={() => handleVerTitulo(req)}
                        disabled={abriendoTitulo === req.uid}
                        className="w-full bg-white border border-gray-200 text-[#1A3D3D] py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:border-[#2D6A6A] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {abriendoTitulo === req.uid
                          ? <Loader2 className="w-4 h-4 animate-spin text-[#2D6A6A]" />
                          : <FileText className="w-4 h-4 text-[#2D6A6A]" />}
                        Ver título o carnet
                      </button>
                    ) : (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                        <p className="text-orange-700 text-[13px] font-medium">No subió el título o carnet.</p>
                      </div>
                    )}

                    {/* Perfil que armó mientras espera */}
                    {req.slug && (
                      <a
                        href={`/profesional/${req.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-white border border-gray-200 text-[#1A3D3D] py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:border-[#2D6A6A] transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4 text-[#2D6A6A]" /> Ver el perfil que armó
                      </a>
                    )}
                  </div>
                </div>

                {/* Botones aprobar / rechazar */}
                <div className="bg-[#F4F7F7] p-4 flex items-center gap-3 border-t border-gray-100">
                  <button
                    onClick={() => abrirRechazo(req)}
                    disabled={ocupado}
                    className="flex-1 bg-white border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Rechazar
                  </button>
                  <button
                    onClick={() => handleAprobar(req)}
                    disabled={ocupado}
                    className="flex-1 bg-[#2D6A6A] text-white py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Aprobar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[32px] p-16 text-center flex flex-col items-center justify-center shadow-sm mt-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-[#1A3D3D] text-[22px] font-black font-['Montserrat'] mb-2">¡Todo al día!</h3>
          <p className="text-[#666666] text-[15px] font-medium max-w-md">
            No tenés solicitudes pendientes de validación.
          </p>
        </div>
      )}
    </div>
  );
}