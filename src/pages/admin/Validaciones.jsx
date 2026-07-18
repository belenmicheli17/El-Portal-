import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Eye,
  User, Building, Calendar, Mail, AlertTriangle, Loader2,
  GraduationCap, Hash, ChevronDown, ChevronUp
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export default function Validaciones() {
  const [pendientes, setPendientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    const fetchPendientes = async () => {
      try {
        const q = query(collection(db, 'usuarios'), where('estado', '==', 'pendiente'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setPendientes(data);
      } catch (error) {
        console.error("Error cargando pendientes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPendientes();
  }, []);

  const handleAprobar = async (uid, nombre, email) => {
    if (!window.confirm(`¿Aprobar a ${nombre}?`)) return;
    setProcesando(uid);
    try {
      await updateDoc(doc(db, 'usuarios', uid), { estado: 'activo' });
      const resultado = await emailjs.send(
        'service_5flv9gx',
        'template_stfs1uh',
        { nombre: nombre, email: email },
        'awqjrLv96HD2QZx1C'
      );
      console.log("Resultado EmailJS:", resultado);
      setPendientes(prev => prev.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error aprobando:", error);
      alert("Hubo un error al aprobar.");
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (uid, nombre) => {
    const motivo = window.prompt(`Estás por rechazar a ${nombre}. Ingresá un motivo (opcional):`);
    if (motivo === null) return;
    setProcesando(uid);
    try {
      await updateDoc(doc(db, 'usuarios', uid), { estado: 'rechazado', motivoRechazo: motivo });
      setPendientes(prev => prev.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error rechazando:", error);
      alert("Hubo un error al rechazar.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">

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
          Revisá la documentación de los nuevos registros antes de darles acceso completo.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A6A]" />
        </div>
      ) : pendientes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendientes.map((req) => {
            const estaExpandido = expandido === req.uid;
            const tieneDocumento = !!req.documentoUrl;
            const tieneMatricula = !!req.matricula;
            const tieneDirector = !!req.directorNombre;
            const tieneDatos = tieneDocumento || tieneMatricula || tieneDirector;

            return (
              <div key={req.uid} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 flex-1">

                  {/* Encabezado de tarjeta */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${req.rol === 'profesional' ? 'bg-[#2D6A6A]/10 text-[#2D6A6A]' : 'bg-[#4DB6AC]/10 text-[#4DB6AC]'}`}>
                        {req.rol === 'profesional' ? <User className="w-7 h-7" /> : <Building className="w-7 h-7" />}
                      </div>
                      <div>
                        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px] leading-tight mb-1">
                          {req.nombre}
                        </h3>
                        <span className="inline-block bg-[#F4F7F7] text-[#666666] text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">
                          Nuevo {req.rol}
                        </span>
                      </div>
                    </div>
                    <p className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(req.fechaRegistro).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-3 mb-4">
                    <Mail className="w-4 h-4 text-[#666666]" />
                    <span className="text-[#666666] text-[13px] font-medium w-20">Email:</span>
                    <span className="text-[#1A3D3D] text-[14px] font-bold">{req.email}</span>
                  </div>

                  {/* Sin documentación */}
                  {!tieneDatos && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                      <p className="text-orange-700 text-[13px] font-medium">Aún no envió documentación.</p>
                    </div>
                  )}

                  {/* Documentación enviada (expandible) */}
                  {tieneDatos && (
                    <div className="mb-2">
                      <button
                        onClick={() => setExpandido(estaExpandido ? null : req.uid)}
                        className="w-full flex items-center justify-between bg-[#F4F7F7] hover:bg-gray-100 transition-colors px-4 py-3 rounded-2xl text-[12px] font-bold text-[#1A3D3D] uppercase tracking-widest"
                      >
                        Ver documentación enviada
                        {estaExpandido ? <ChevronUp className="w-4 h-4 text-[#2D6A6A]" /> : <ChevronDown className="w-4 h-4 text-[#2D6A6A]" />}
                      </button>

                      {estaExpandido && (
                        <div className="mt-3 space-y-3 bg-[#F4F7F7] rounded-2xl p-4">

                          {/* Documento subido */}
                          {tieneDocumento && (
                            <a
                              href={req.documentoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full bg-white border border-gray-200 text-[#1A3D3D] py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-[#2D6A6A]" /> Ver documento adjunto
                            </a>
                          )}

                          {/* Matrícula y facultad */}
                          {tieneMatricula && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                                <Hash className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                <span className="text-[#666666] text-[12px] font-medium w-24">Matrícula:</span>
                                <span className="text-[#1A3D3D] text-[13px] font-bold">{req.matricula}</span>
                              </div>
                              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                                <GraduationCap className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                <span className="text-[#666666] text-[12px] font-medium w-24">Facultad:</span>
                                <span className="text-[#1A3D3D] text-[13px] font-bold">{req.facultad}</span>
                              </div>
                            </div>
                          )}

                          {/* Director técnico */}
                          {tieneDirector && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                                <User className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                <span className="text-[#666666] text-[12px] font-medium w-24">Director:</span>
                                <span className="text-[#1A3D3D] text-[13px] font-bold">{req.directorNombre}</span>
                              </div>
                              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                                <Hash className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                <span className="text-[#666666] text-[12px] font-medium w-24">Matrícula:</span>
                                <span className="text-[#1A3D3D] text-[13px] font-bold">{req.directorMatricula}</span>
                              </div>
                              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                                <GraduationCap className="w-4 h-4 text-[#2D6A6A] shrink-0" />
                                <span className="text-[#666666] text-[12px] font-medium w-24">Facultad:</span>
                                <span className="text-[#1A3D3D] text-[13px] font-bold">{req.directorFacultad}</span>
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones aprobar / rechazar */}
                <div className="bg-[#F4F7F7] p-4 flex items-center gap-3 border-t border-gray-100">
                  <button
                    onClick={() => handleRechazar(req.uid, req.nombre)}
                    disabled={procesando === req.uid}
                    className="flex-1 bg-white border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {procesando === req.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Rechazar
                  </button>
                  <button
                    onClick={() => handleAprobar(req.uid, req.nombre, req.email)}
                    disabled={procesando === req.uid}
                    className="flex-1 bg-[#2D6A6A] text-white py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {procesando === req.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Aprobar
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
            No tenés registros pendientes de validación.
          </p>
        </div>
      )}
    </div>
  );
}