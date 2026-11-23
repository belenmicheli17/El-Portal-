import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import {
  User, BookOpen, Package, Newspaper, ChevronRight,
  Briefcase, Users, LogOut, Eye, Store, PawPrint, Clock,
  ShieldCheck, AlertCircle, Upload, Loader2, Check, Camera, GraduationCap
} from 'lucide-react';
import FooterSimple from '../components/FooterSimple';
import TourGuia from '../components/TourGuia';
import PantallaCarga from '../components/PantallaCarga';
import { calcularProgresoPerfil, calcularProgresoClinica } from '../utils/progresoPerfil';
import { BotonCompartirPerfil } from '../components/CompartirPerfil';

// ── Tarjeta de una herramienta que ya funciona ─────────────────────────────
// En celular se ve como renglón (ícono a la izquierda, flecha a la derecha).
// En PC se ve como tarjeta alta centrada, como antes.
const TarjetaDisponible = ({ id, titulo, descripcion, icon: Icon, onClick, distintivo }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className="group w-full h-full bg-white/80 backdrop-blur-md border border-white/60 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 transition-all duration-300 ease-in-out p-4 md:p-6 flex flex-row md:flex-col items-center gap-4 md:gap-0 text-left md:text-center md:min-h-[210px] cursor-pointer outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
  >
    <Icon strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 shrink-0 text-[#2D6A6A] md:mb-3 group-hover:text-[#4DB6AC] md:group-hover:scale-110 md:group-hover:-translate-y-1 transition-all duration-300" />
    <div className="flex-1 min-w-0 flex flex-col md:items-center">
      <h3 className="text-[16px] md:text-[21px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight mb-1">{titulo}</h3>
      <p className="text-[#333333]/70 font-medium text-[13px] md:text-[15px] leading-snug md:leading-normal md:px-2">{descripcion}</p>
      {distintivo}
    </div>
    {/* Flecha a la derecha: solo celular */}
    <ChevronRight className="w-5 h-5 shrink-0 text-[#2D6A6A] md:hidden transition-transform group-hover:translate-x-0.5" />
    {/* "Ingresar" abajo: solo PC */}
    <span className="hidden md:flex mt-auto pt-3 text-[13px] font-bold text-[#2D6A6A] group-hover:text-[#4DB6AC] items-center gap-1 transition-colors">
      Ingresar <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
    </span>
  </button>
);

// ── Tarjeta de una herramienta que todavía no está activa ──────────────────
// Si recibe onClick se puede abrir (ej. bolsa de trabajo); si no, es solo un aviso.
const TarjetaProximamente = ({ id, titulo, descripcion, icon: Icon, onClick }) => {
  const contenido = (
    <>
      <Icon strokeWidth={1.5} className="w-7 h-7 shrink-0 text-[#2D6A6A]/60" />
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] md:text-[16px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">{titulo}</h3>
        <p className="text-[#666666] font-medium text-[13px] leading-snug mt-0.5">{descripcion}</p>
        {onClick && (
          <span className="inline-flex items-center gap-1 text-[12px] md:text-[13px] font-bold text-[#2D6A6A] mt-1.5">
            Ya podés entrar <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
      {!onClick && <Clock strokeWidth={1.5} className="w-4 h-4 shrink-0 text-[#2D6A6A]/40" aria-hidden="true" />}
    </>
  );

  const estiloBase = "w-full h-full bg-[#E8EFEF]/70 border border-dashed border-[#2D6A6A]/25 rounded-[20px] md:rounded-[24px] p-4 flex items-center gap-4 text-left";

  if (onClick) {
    return (
      <button
        id={id}
        type="button"
        onClick={onClick}
        className={`${estiloBase} group cursor-pointer hover:bg-white/80 hover:border-[#2D6A6A]/40 transition-all duration-300 ease-in-out outline-none focus:ring-4 focus:ring-[#2D6A6A]/10`}
      >
        {contenido}
      </button>
    );
  }

  return (
    <div id={id} aria-disabled="true" className={`${estiloBase} cursor-default`}>
      {contenido}
    </div>
  );
};

// ── Tarjeta de avance del perfil (va en el encabezado) ─────────────────────
// avance: { porcentaje, faltantes } o null si ese tipo de cuenta no tiene cálculo
function TarjetaAvance({ avance, cargando, onEditar, onVerPerfil, onIrA, compartir = null }) {
  

  return (
    <div id="tour-avance" className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-5 md:p-6">
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="text-[16px] md:text-[18px] font-black text-[#1A3D3D] font-['Montserrat']">Tu perfil</h2>
        {avance && !cargando && (
          <span className="text-[22px] md:text-[26px] font-black text-[#1A3D3D] font-['Montserrat'] leading-none">{avance.porcentaje}%</span>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-[#666666] text-[13px] font-medium mb-4">
          <Loader2 className="w-4 h-4 animate-spin text-[#2D6A6A]" /> Calculando tu avance...
        </div>
      ) : avance ? (
        <>
          <div className="h-2 w-full bg-[#F4F7F7] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#4DB6AC] rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${avance.porcentaje}%` }} />
          </div>
          {avance.pendientes?.length > 0 ? (
            <div className="mb-4">
              <p className="text-[13px] md:text-[14px] text-[#666666] font-medium mb-2">Te falta completar:</p>
              <div className="flex flex-wrap gap-2">
                {avance.pendientes.map((p) => (
                  <button
                    key={p.clave}
                    type="button"
                    onClick={() => onIrA(p.clave)}
                    className="inline-flex items-center gap-1 bg-[#2D6A6A]/10 text-[#1A3D3D] text-[13px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 ease-in-out hover:bg-[#2D6A6A] hover:text-white"
                  >
                    {p.texto} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px] md:text-[14px] text-[#666666] font-medium leading-snug mb-4">Tu perfil está completo. ¡Muy bien!</p>
          )}
        </>
      ) : (
        <p className="text-[13px] md:text-[14px] text-[#666666] font-medium leading-snug mb-4">
          Mantené tus datos al día para que te encuentren más fácil.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEditar}
          className="flex-1 bg-[#2D6A6A] text-white rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-0.5 hover:shadow-lg"
        >
          {avance && avance.faltantes.length === 0 ? 'Editar mi información' : 'Seguir editando'}
        </button>
        <button
          type="button"
          onClick={onVerPerfil}
          className="flex-1 bg-[#F4F7F7] text-[#1A3D3D] rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-300 ease-in-out hover:bg-gray-200 flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4 text-[#2D6A6A]" /> Ver mi perfil
        </button>
      </div>

      {compartir && <div className="mt-2">{compartir}</div>}
    </div>
  );
}

// ── Formulario de matrícula (datos de matrícula) ──────────────
function FormMatricula({ currentUser, onGuardado }) {
  const [matricula, setMatricula] = useState(currentUser.matricula || '');
  const [facultad, setFacultad] = useState(currentUser.facultad || '');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(!!(currentUser.matricula && currentUser.facultad));
  const [error, setError] = useState('');

  const handleGuardar = async () => {
    if (!matricula.trim() || !facultad.trim()) { setError('Completá los dos campos para continuar.'); return; }
    setError('');
    setGuardando(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (!uid) { setError('No se detectó tu sesión.'); setGuardando(false); return; }
      await updateDoc(doc(db, 'usuarios', uid), { matricula: matricula.trim(), facultad: facultad.trim() });
      setGuardado(true);
      if (onGuardado) onGuardado();
    } catch (err) { console.error(err); setError('Error al guardar. Revisá tu conexión.'); }
    finally { setGuardando(false); }
  };

  if (guardado) return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
      <Check className="w-5 h-5 text-green-500 shrink-0" />
      <div>
        <p className="text-green-700 font-bold text-sm">Datos recibidos</p>
        <p className="text-green-600 text-xs font-medium">Te avisaremos cuando sea aprobado.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Número de matrícula</label>
        <input
          type="text"
          value={matricula}
          onChange={e => setMatricula(e.target.value)}
          placeholder="Ej: 12345"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none transition-all"
        />
      </div>
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Facultad donde te recibiste</label>
        <input
          type="text"
          value={facultad}
          onChange={e => setFacultad(e.target.value)}
          placeholder="Ej: UBA, UNLP, UNR..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none transition-all"
        />
      </div>
      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full bg-[#2D6A6A] text-white font-bold py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-[#1A3D3D] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Check className="w-4 h-4" /> Enviar datos</>}
      </button>
    </div>
  );
}

// ── Formulario director técnico (para clínicas) ────────────────────────────
function FormDirectorTecnico({ currentUser, onGuardado }) {
  const [nombre, setNombre] = useState(currentUser.directorNombre || '');
  const [matricula, setMatricula] = useState(currentUser.directorMatricula || '');
  const [facultad, setFacultad] = useState(currentUser.directorFacultad || '');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(!!(currentUser.directorNombre && currentUser.directorMatricula));
  const [error, setError] = useState('');

  const handleGuardar = async () => {
    if (!nombre.trim() || !matricula.trim() || !facultad.trim()) { setError('Completá los tres campos para continuar.'); return; }
    setError('');
    setGuardando(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (!uid) { setError('No se detectó tu sesión.'); setGuardando(false); return; }
      await updateDoc(doc(db, 'usuarios', uid), {
        directorNombre: nombre.trim(),
        directorMatricula: matricula.trim(),
        directorFacultad: facultad.trim()
      });
      setGuardado(true);
      if (onGuardado) onGuardado();
    } catch (err) { console.error(err); setError('Error al guardar. Revisá tu conexión.'); }
    finally { setGuardando(false); }
  };

  if (guardado) return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
      <Check className="w-5 h-5 text-green-500 shrink-0" />
      <div>
        <p className="text-green-700 font-bold text-sm">Datos de director/a técnico/a recibidos</p>
        <p className="text-green-600 text-xs font-medium">Te avisaremos cuando sea aprobado.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Nombre completo de director/a técnico/a</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ej: María González"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none transition-all"
        />
      </div>
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Matrícula del director/a técnico/a</label>
        <input
          type="text"
          value={matricula}
          onChange={e => setMatricula(e.target.value)}
          placeholder="Ej: 12345"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none transition-all"
        />
      </div>
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Facultad donde se recibió</label>
        <input
          type="text"
          value={facultad}
          onChange={e => setFacultad(e.target.value)}
          placeholder="Ej: UBA, UNLP, UNR..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-4 focus:ring-[#2D6A6A]/10 outline-none transition-all"
        />
      </div>
      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full bg-[#2D6A6A] text-white font-bold py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-[#1A3D3D] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Check className="w-4 h-4" /> Enviar datos</>}
      </button>
    </div>
  );
}

// ── Pantalla de estado (verificación / rechazo) ────────────────────────────
const PantallaEstado = ({ tipo, currentUser, handleLogout }) => {
  const esRechazo = tipo === 'rechazado';
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  // Botón para reenviar solicitud (visible solo en estado rechazado)
  const handleReenviar = async () => {
    if (!window.confirm('¿Querés reenviar tu solicitud para que sea revisada nuevamente?')) return;
    setReenviando(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'usuarios', uid), { estado: 'pendiente', motivoRechazo: '' });
      setReenviado(true);
    } catch (err) { console.error(err); alert('Hubo un error al reenviar. Intentá de nuevo.'); }
    finally { setReenviando(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">

        {/* Ícono de estado */}
        <div className={`w-20 h-20 ${esRechazo ? 'bg-red-100' : 'bg-[#2D6A6A]/10'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {esRechazo ? <AlertCircle className="w-10 h-10 text-red-500" /> : <ShieldCheck className="w-10 h-10 text-[#2D6A6A]" />}
        </div>

        {/* Título */}
        <h1 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">
          {esRechazo ? 'Solicitud rechazada' : 'Tu cuenta está siendo verificada'}
        </h1>

        {/* Descripción */}
        <p className="text-[#666666] text-[15px] font-medium mb-8 leading-relaxed">
          {esRechazo
            ? 'Tu solicitud de ingreso no fue aprobada. Si creés que es un error, podés reenviarla o escribirnos a portalveterinario.ar@gmail.com.'
            : 'Verificamos la identidad de cada profesional y clínica antes de darles acceso completo. Este proceso tarda menos de 48 horas hábiles.'}
        </p>

        {/* Bloque de documentación (solo cuando está pendiente) */}
        {!esRechazo && (
          <div className="bg-[#F4F7F7] rounded-2xl p-6 mb-8 text-left">

            {/* PROFESIONAL: dos opciones */}
            {currentUser.rol === 'profesional' && (
              <>
                <h3 className="font-bold text-[#1A3D3D] text-sm uppercase tracking-widest mb-3">
                  📄 Acreditá tu identidad profesional
                </h3>
                <p className="text-[#666666] text-sm font-medium mb-4 leading-relaxed">
                  Completá los datos de tu matrícula para que podamos verificarte.
                </p>

                <FormMatricula currentUser={currentUser} />
              </>
            )}

            {/* CLÍNICA: datos del director técnico */}
            {currentUser.rol === 'clinica' && (
              <>
                <h3 className="font-bold text-[#1A3D3D] text-sm uppercase tracking-widest mb-3">
                  🏥 Datos de director/a técnico/a
                </h3>
                <p className="text-[#666666] text-sm font-medium mb-4 leading-relaxed">
                  Para verificar tu clínica necesitamos los datos de la persona a cargo del establecimiento.
                </p>
                <FormDirectorTecnico currentUser={currentUser} />
              </>
            )}

          </div>
        )}

        {/* Botón reenviar solicitud (solo en estado rechazado) */}
        {esRechazo && (
          <div className="mb-6">
            {reenviado ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-left">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-green-700 font-bold text-sm">Solicitud reenviada</p>
                  <p className="text-green-600 text-xs font-medium">Vamos a revisarla a la brevedad.</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleReenviar}
                disabled={reenviando}
                className="w-full bg-[#F4F7F7] border border-[#2D6A6A]/30 text-[#2D6A6A] font-bold py-3.5 rounded-xl text-sm uppercase tracking-widest hover:bg-[#2D6A6A]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {reenviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Reenviando...</> : '↩ Reenviar solicitud'}
              </button>
            )}
          </div>
        )}

        {/* Nota al pie */}
        <p className="text-[#666666] text-xs font-medium mb-6 bg-[#F4F7F7] rounded-xl p-4">
          Si no tenés el documento a mano, podés cerrar sesión y volver cuando lo tengas. Tu cuenta quedará guardada.
        </p>

        <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
        </button>

      </div>
    </div>
  );
};

// ── "Ya me recibí": el alumno/a pide pasar su cuenta a profesional ─────────
// Queda anotado en su usuario y la admin hace el cambio desde Gestión de usuarios
function AvisoMeRecibi({ currentUser }) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState(currentUser?.pideSerProfesional === true);
  const [error, setError] = useState('');

  const pedirCambio = async () => {
    setEnviando(true);
    setError('');
    try {
      await updateDoc(doc(db, 'usuarios', currentUser.uid), { pideSerProfesional: true, fechaPedidoProfesional: new Date().toISOString() });
      setPedido(true);
    } catch (e) {
      console.error('Error pidiendo el cambio a profesional:', e);
      setError('No pudimos enviar el pedido. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (pedido) {
    return (
      <div className="w-full mb-10 md:mb-12 -mt-6 md:-mt-8 bg-white/60 backdrop-blur-md border border-white/60 rounded-[20px] md:rounded-[24px] shadow-sm px-4 py-3 flex items-center gap-3">
        <Check className="w-5 h-5 shrink-0 text-[#2D6A6A]" strokeWidth={2.5} />
        <p className="text-[14px] md:text-[15px] font-medium text-[#1A3D3D]">
          <span className="font-black font-['Montserrat']">¡Felicitaciones!</span> Recibimos tu aviso: te escribimos para pasar tu cuenta a profesional con tu matrícula.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mb-10 md:mb-12 -mt-6 md:-mt-8 bg-white/60 backdrop-blur-md border border-white/60 rounded-[20px] md:rounded-[24px] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="group w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/90 transition-all duration-300 ease-in-out outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
      >
        <GraduationCap strokeWidth={1.5} className="w-5 h-5 shrink-0 text-rose-500" />
        <div className="flex-1 min-w-0">
          <span className="text-[14px] md:text-[15px] font-black text-[#1A3D3D] font-['Montserrat']">¿Ya te recibiste?</span>
          <span className="hidden md:inline text-[#666666] font-medium text-[13px] ml-3">Pasá tu cuenta a profesional</span>
        </div>
        <ChevronRight className={`w-4 h-4 shrink-0 text-[#2D6A6A] transition-transform ${abierto ? 'rotate-90' : ''}`} />
      </button>
      {abierto && (
        <div className="px-4 pb-4">
          <p className="text-[14px] text-[#666666] font-medium leading-relaxed mb-3">
            Te pasamos a una cuenta profesional: vas a cargar tu matrícula, la verificamos y aparecés en la Cartilla. Tu perfil de estudiante se oculta.
          </p>
          <button
            type="button"
            onClick={pedirCambio}
            disabled={enviando}
            className="bg-[#2D6A6A] text-white rounded-xl px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] disabled:opacity-50 inline-flex items-center gap-2"
          >
            {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Ya me recibí
          </button>
          {error && <p className="text-sm font-medium text-red-500 mt-2" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── Pantalla de espera (profesional que ya envió sus datos) ────────────────
const PantallaEspera = ({ verificacion, handleLogout, rol }) => {
  const navigate = useNavigate();
  const fechaEnvio = verificacion?.enviadoEn?.toDate
    ? verificacion.enviadoEn.toDate().toLocaleDateString('es-AR')
    : '';

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">

        <div className="w-20 h-20 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-[#2D6A6A]" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl md:text-[28px] font-black text-[#1A3D3D] font-['Montserrat'] mb-3 leading-tight">
          Tu cuenta está siendo verificada
        </h1>

        <p className="text-[#666666] text-[16px] md:text-[17px] font-medium mb-6 leading-relaxed">
          {rol === 'alumnx'
            ? 'Estamos revisando tu certificado de alumno regular. Tarda menos de 48 horas hábiles y te avisamos apenas esté listo.'
            : 'Estamos revisando tu matrícula y tu título. Tarda menos de 48 horas hábiles y te avisamos por mail apenas esté listo.'}
        </p>

        {/* Estado de la solicitud */}
        <div className="bg-[#F4F7F7] rounded-2xl p-5 mb-6 text-left flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white text-[#2D6A6A] flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-[#1A3D3D] font-bold text-[15px]">Recibimos tu solicitud</p>
            {fechaEnvio && <p className="text-[#666666] text-[14px] font-medium">Enviada el {fechaEnvio}</p>}
          </div>
          <span className="ml-auto shrink-0 inline-flex items-center gap-2 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[#2D6A6A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A6A] animate-pulse"></span>
            En revisión
          </span>
        </div>

        <p className="text-[#666666] text-[15px] font-medium mb-5 leading-relaxed">
          {rol === 'alumnx'
            ? 'Mientras esperás, podés sumar tu experiencia y tu foto. Apenas te verifiquemos, vas a poder postularte en la Bolsa.'
            : 'Mientras esperás, podés sumar tu trayectoria y tus fotos. Apenas te verifiquemos, tu perfil sale publicado.'}
        </p>

        <button
          type="button"
          onClick={() => navigate(rol === 'clinica' ? '/editor-clinica' : rol === 'alumnx' ? '/onboarding-alumnx' : '/editor-profesional')}
          className="w-full bg-[#2D6A6A] text-white rounded-xl px-7 py-4 text-[13px] font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 mb-6"
        >
          <User className="w-4 h-4" /> Completar mi perfil
        </button>

        <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
        </button>

      </div>
    </div>
  );
};

// ── Pantalla de rechazo (profesional al que no pudimos verificar) ──────────
const PantallaRechazo = ({ verificacion, handleLogout, rol }) => {
  const navigate = useNavigate();
  const motivo = (verificacion?.motivoRechazo || '').trim();

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">

        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl md:text-[28px] font-black text-[#1A3D3D] font-['Montserrat'] mb-3 leading-tight">
          Tu acceso fue denegado
        </h1>

        <p className="text-[#666666] text-[16px] md:text-[17px] font-medium mb-6 leading-relaxed">
          Revisamos tu solicitud y por ahora no pudimos verificarte. Tus datos están guardados: podés corregirlos y volver a enviarlos.
        </p>

        {/* Motivo escrito por el equipo */}
        <div className="bg-[#F4F7F7] rounded-2xl p-5 mb-6 text-left">
          <p className="text-[#1A3D3D] font-bold text-[15px] mb-2">Motivo</p>
          <p className="text-[#333333] text-[16px] font-medium leading-relaxed whitespace-pre-line">
            {motivo || 'No dejamos un motivo escrito. Escribinos y te contamos el detalle.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(rol === 'clinica' ? '/onboarding-clinica' : rol === 'alumnx' ? '/onboarding-alumnx' : '/onboarding', { state: { correccion: true } })}
          className="w-full bg-[#2D6A6A] text-white rounded-xl px-7 py-4 text-[13px] font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 ease-in-out hover:bg-[#1A3D3D] hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 mb-4"
        >
          Corregir mis datos y volver a enviar
        </button>

        <p className="text-[#666666] text-[14px] font-medium mb-6">
          ¿Dudas? Escribinos a{' '}
          <a href="mailto:portalveterinario.ar@gmail.com" className="text-[#2D6A6A] font-bold hover:underline">portalveterinario.ar@gmail.com</a>
        </p>

        <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
        </button>

      </div>
    </div>
  );
};

export default function Ecosistema() {
  const navigate = useNavigate();
  const { currentUser, loading, logout } = useAuth();
  const activeRole = currentUser?.rol || 'visitante';
  const [mostrarTour, setMostrarTour] = useState(false);

  // Estado de la solicitud de verificación (solo lo necesitan los profesionales sin aprobar)
  const [verificacion, setVerificacion] = useState(null);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(true);

  // Avance del perfil (por ahora solo existe el cálculo para profesionales)
  const [avance, setAvance] = useState(null);
  const [cargandoAvance, setCargandoAvance] = useState(true);
  // Datos que usa el cartel de "Compartir mi perfil" (nombre, especialidad o ubicación, foto)
  const [datosCompartir, setDatosCompartir] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    // Si ya está aprobado (o no es profesional) no hace falta buscar nada
    if (!['profesional', 'clinica', 'alumnx'].includes(currentUser.rol) || currentUser.estado === 'activo') {
      setCargandoVerificacion(false);
      return;
    }
    let cancelado = false;
    const cargarVerificacion = async () => {
      try {
        const snap = await getDoc(doc(db, 'verificaciones', currentUser.uid));
        if (!cancelado) setVerificacion(snap.exists() ? snap.data() : null);
      } catch (e) {
        console.error('Error leyendo la verificación:', e);
      } finally {
        if (!cancelado) setCargandoVerificacion(false);
      }
    };
    cargarVerificacion();
    return () => { cancelado = true; };
  }, [currentUser?.uid, currentUser?.rol, currentUser?.estado]);

// Cómo se identifica la persona (veterinaria / veterinario / vacío), para el saludo
  const [tituloGenero, setTituloGenero] = useState('');


  // Leemos el perfil profesional y calculamos el porcentaje con la misma cuenta que usa el editor
  useEffect(() => {
    if (!currentUser?.uid) return;
    if (!['profesional', 'clinica', 'alumnx'].includes(currentUser.rol)) {
      setCargandoAvance(false);
      return;
    }
    let cancelado = false;
    const cargarAvance = async () => {
      try {
        // Alumnos/as: por ahora sin porcentaje, solo leemos cómo se identifican para el saludo
        if (currentUser.rol === 'alumnx') {
          const snapAlumno = await getDoc(doc(db, 'alumnos', currentUser.uid));
          if (!cancelado) setTituloGenero(snapAlumno.exists() ? snapAlumno.data().tituloGenero || '' : '');
          return;
        }
        const coleccion = currentUser.rol === 'clinica' ? 'clinicas' : 'profesionales';
        const snap = await getDoc(doc(db, coleccion, currentUser.uid));
        if (cancelado) return;
        const datos = snap.exists() ? snap.data() : {};
        setTituloGenero(datos.tituloGenero || '');
        setDatosCompartir(currentUser.rol === 'clinica'
          ? { nombre: datos.nombre || '', subtitulo: [datos.localidad, datos.provincia].filter(Boolean).join(', '), foto: datos.foto || '' }
          : { nombre: `${datos.nombre || ''} ${datos.apellido || ''}`.trim(), subtitulo: datos.especialidad || '', foto: datos.foto || '' });
        if (currentUser.rol === 'clinica') {
          const esPro = currentUser.socioVitalicio === true || datos.socioVitalicio === true || datos.planActual === 'pro';
          setAvance(calcularProgresoClinica(datos, esPro));
        } else {
          const incluyeCasos = currentUser.socioVitalicio === true || datos.planActual !== 'gratis';
          setAvance(calcularProgresoPerfil(datos, incluyeCasos));
        }
      } catch (e) {
        console.error('Error calculando el avance del perfil:', e);
      } finally {
        if (!cancelado) setCargandoAvance(false);
      }
    };
    cargarAvance();
    return () => { cancelado = true; };
  }, [currentUser?.uid, currentUser?.rol, currentUser?.socioVitalicio]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchContador = async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', currentUser.uid));
        const visto = snap.data()?.tourVisto?.ecosistema || false;
        if (!visto) setTimeout(() => setMostrarTour(true), 800);
      } catch (e) { console.error('Error leyendo contador del tour:', e); }
    };
    fetchContador();
  }, [currentUser]);

  const handlePasoTour = (paso) => {
    if (paso?.abrirAccs) {
      window.dispatchEvent(new CustomEvent('tour:cerrarAccs'));
    }
  };

  // Pasos del tour guiado: cada targetId tiene que existir en la pantalla de ese rol
  const PASOS_TOUR = {
    profesional: [
      { targetId: 'tour-avance', titulo: 'Tu avance', desc: 'Acá ves qué tan completo está tu perfil y qué te falta. Un perfil completo da más confianza a tutores y colegas.' },
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil profesional', desc: 'Desde acá completás tu portfolio: foto, trayectoria, servicios y casos clínicos para que te encuentren en la Cartilla.' },
      { targetId: 'tour-colegas', titulo: 'Cartilla de colegas', desc: 'Buscá especialistas para derivaciones e interconsultas. Es la misma Cartilla que usan los tutores para encontrarte.' },
      { targetId: 'tour-bolsa', titulo: 'Bolsa de trabajo', desc: 'Mirá ofertas de clínicas, postulate con un toque o marcate como disponible para que te contacten.' },
      { targetId: 'tour-publicaciones', titulo: 'Publicaciones científicas', desc: 'Papers y actualizaciones de la comunidad. Podés publicar los tuyos desde tu perfil.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'Proveedores y cursos se van a ir activando a medida que se sume más gente.' },
      { targetId: 'tour-btn-accesibilidad', titulo: 'Opciones de accesibilidad', desc: 'Este botón te permite ajustar el tamaño del texto, activar modo escala de grises, resaltar enlaces y más.', abrirAccs: true, posicion: 'derecha' },
    ],
    clinica: [
      { targetId: 'tour-avance', titulo: 'Tu perfil', desc: 'Desde acá seguís editando tu clínica o ves cómo la ven los tutores.' },
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil institucional', desc: 'Completá los datos de tu clínica: servicios, equipo, horarios y contacto para aparecer en la Cartilla.' },
      { targetId: 'tour-colegas', titulo: 'Cartilla de colegas', desc: 'Encontrá profesionales para sumar a tu equipo o para derivaciones.' },
      { targetId: 'tour-bolsa', titulo: 'Bolsa de trabajo', desc: 'Publicá tus búsquedas y encontrá profesionales disponibles para sumar a tu equipo.' },
      { targetId: 'tour-publicaciones', titulo: 'Publicaciones científicas', desc: 'Papers y actualizaciones del mundo veterinario para mantenerte al día.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'Proveedores y cursos se van a ir activando a medida que se sume más gente.' },
      { targetId: 'tour-btn-accesibilidad', titulo: 'Opciones de accesibilidad', desc: 'Ajustá el tamaño del texto, activá modo escala de grises, resaltá enlaces y más.', abrirAccs: true, posicion: 'derecha' },
    ],
    alumnx: [
      { targetId: 'tour-avance', titulo: 'Tu perfil', desc: 'Desde acá seguís editando tu perfil o ves cómo lo ven los demás.' },
      { targetId: 'tour-editar-perfil', titulo: 'Editar tu perfil', desc: 'Completá tu perfil para aparecer en búsquedas y mostrar tu trayectoria académica.' },
      { targetId: 'tour-bolsa', titulo: 'Bolsa de trabajo', desc: 'Mirá ofertas de clínicas y postulate. Es el lugar para empezar a trabajar.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'Proveedores y cursos se van a ir activando a medida que se sume más gente.' },
      { targetId: 'tour-btn-accesibilidad', titulo: 'Opciones de accesibilidad', desc: 'Ajustá el tamaño del texto, activá modo escala de grises y más.', abrirAccs: true, posicion: 'derecha' },
    ],
    proveedor: [
      { targetId: 'tour-avance', titulo: 'Tu perfil', desc: 'Desde acá seguís editando tu marca o ves cómo te ven profesionales y clínicas.' },
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil de empresa', desc: 'Completá los datos de tu marca: descripción, contacto y redes para aparecer en la cartilla de proveedores.' },
      { targetId: 'tour-catalogo', titulo: 'Tu catálogo', desc: 'Cargá y ordená tus productos y servicios.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'La cartilla de proveedores y los cursos se van a activar a medida que se sume más gente.' },
      { targetId: 'tour-btn-accesibilidad', titulo: 'Opciones de accesibilidad', desc: 'Ajustá el tamaño del texto, activá modo escala de grises y más.', abrirAccs: true, posicion: 'derecha' },
    ],
  };

  const handleLogout = async () => {
    try { if (logout) await logout(); navigate('/'); }
    catch (error) { console.error("Error al cerrar sesión", error); }
  };

  if (loading) return <PantallaCarga />;
  if (!currentUser) return null;

  // Profesionales nuevos: primero completan el cuestionario de alta.
  // Los usuarios que ya existían no tienen este campo, así que pasan directo.
  if (['profesional', 'clinica', 'alumnx'].includes(currentUser.rol) && currentUser.onboardingCompleto === false) {
    return <Navigate to={currentUser.rol === 'clinica' ? '/onboarding-clinica' : currentUser.rol === 'alumnx' ? '/onboarding-alumnx' : '/onboarding'} replace />;
  }

  // Pantalla para usuarios dados de baja
  if (currentUser.estado === 'baja') {
    return (
      <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">
            Cuenta desactivada
          </h1>
          <p className="text-[#666666] text-[15px] font-medium mb-8 leading-relaxed">
            Tu cuenta fue desactivada. Si creés que es un error escribinos a{' '}
            <a href="mailto:portalveterinario.ar@gmail.com" className="text-[#2D6A6A] font-bold hover:underline">
              portalveterinario.ar@gmail.com
            </a>
          </p>
          <button
            onClick={handleLogout}
            className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Pantallas de estado (pendiente / rechazado)
  const necesitaValidacion = ['profesional', 'clinica', 'alumnx'].includes(currentUser.rol);
  if (necesitaValidacion && currentUser.estado !== 'activo') {
    // Flujo nuevo: manda lo que dice su solicitud de verificación
    if (cargandoVerificacion) return <PantallaCarga />;
    if (verificacion?.estado === 'rechazado') return <PantallaRechazo verificacion={verificacion} handleLogout={handleLogout} rol={currentUser.rol} />;
    if (verificacion?.estado === 'pendiente') return <PantallaEspera verificacion={verificacion} handleLogout={handleLogout} rol={currentUser.rol} />;
    // Cuentas viejas sin solicitud: queda la pantalla de antes
    return <PantallaEstado tipo={currentUser.estado} currentUser={currentUser} handleLogout={handleLogout} />;
  }

  // Rutas según el tipo de cuenta
  const rutaEditor = activeRole === 'clinica' ? '/editor-clinica' : activeRole === 'proveedor' ? '/editor-proveedores' : activeRole === 'alumnx' ? '/onboarding-alumnx' : '/editor-profesional';
  const rutaPerfilPublico = `/${activeRole === 'clinica' ? 'clinica' : activeRole === 'proveedor' ? 'proveedor' : activeRole === 'alumnx' ? 'alumno' : 'profesional'}/${currentUser?.slug}`;
  const esAlumnx = activeRole === 'alumnx';
  const esProveedor = activeRole === 'proveedor';

  // Etiqueta para la Cartilla de colegas: avisa que también la ven los tutores (huella naranja = mundo tutores)
  const distintivoTutores = (
    <span className="inline-flex items-center gap-1.5 self-start md:self-center mt-2 bg-[#FF9800]/10 text-[#666666] text-[12px] md:text-[13px] font-bold px-2.5 py-1 rounded-full">
      <PawPrint className="w-3.5 h-3.5 text-[#FF9800]" /> También la ven los tutores
    </span>
  );

  return (
    // Div raíz: flex-col para que el footer quede al fondo
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] relative overflow-x-hidden selection:bg-[#2D6A6A] selection:text-white flex flex-col">

      {/* Burbujas de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[0%] left-[-10%] w-[50vw] h-[50vw] bg-[#2D6A6A]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] bg-[#4DB6AC]/15 rounded-full blur-[120px]"></div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-4 md:p-10 lg:p-12 relative z-10">
        <div className="max-w-[1200px] mx-auto">

          {/* ENCABEZADO: saludo + tarjeta de avance */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 lg:items-center mb-10 md:mb-12">

            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tight">
                ¡Hola, {currentUser.nombre || (activeRole === 'clinica' ? 'Clínica' : activeRole === 'proveedor' ? 'Proveedor' : activeRole === 'alumnx' ? 'Estudiante' : 'Profesional')}! <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
                  {['veterinaria', 'alumna'].includes(tituloGenero) ? 'Bienvenida' : ['veterinario', 'alumno'].includes(tituloGenero) ? 'Bienvenido' : 'Bienvenido/a'} al ecosistema.
                </span>
              </h1>
              <h3 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] mt-4">
                ¿Qué te gustaría hacer hoy?
              </h3>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 text-[#666666] text-[13px] font-bold hover:text-red-500 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>

            <div className="lg:col-span-1 w-full">
              <TarjetaAvance
                avance={avance}
                cargando={cargandoAvance}
                onEditar={() => navigate(rutaEditor)}
                onVerPerfil={() => navigate(rutaPerfilPublico)}
                onIrA={(clave) => navigate(rutaEditor, { state: { seccion: clave } })}
                compartir={datosCompartir && currentUser.slug ? (
                  <BotonCompartirPerfil
                    tipo={activeRole === 'clinica' ? 'clinica' : 'profesional'}
                    slug={currentUser.slug}
                    variante="secundario"
                    texto={activeRole === 'clinica' ? 'Compartir mi página' : 'Compartir mi perfil'}
                    className="w-full !py-2.5 !px-3 !text-[13px] !normal-case !tracking-normal"
                                        {...datosCompartir}
                  />
                ) : null}
              />
            </div>
          </div>

          {/* BLOQUE 1: TU ESPACIO (lo que ya funciona) */}
          <h2 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] mb-4">
            Tu espacio
          </h2>
          <div className={`grid grid-cols-1 ${esAlumnx ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 md:gap-6 mb-10 md:mb-12`}>

            <TarjetaDisponible
              id="tour-editar-perfil"
              titulo="Editar mi información"
              descripcion="Actualizá tus datos para que el público conozca tus servicios y tu formación."
              icon={User}
              onClick={() => navigate(rutaEditor)}
            />

            {esProveedor ? (
              <TarjetaDisponible
                id="tour-catalogo"
                titulo="Mi catálogo"
                descripcion="Gestioná tus productos y servicios veterinarios."
                icon={Store}
                onClick={() => navigate('/editor-proveedores', { state: { tab: 'productos' } })}
              />
            ) : (
              <>
                {/* Los alumnos/as no están en la Cartilla: no les mostramos la tarjeta de colegas */}
                {!esAlumnx && (
                  <TarjetaDisponible
                    id="tour-colegas"
                    titulo="Cartilla de colegas"
                    descripcion="Los contactos de tus colegas, a mano."
                    icon={Users}
                    onClick={() => navigate('/cartilla')}
                    distintivo={distintivoTutores}
                  />
                )}
                <TarjetaDisponible
                  id="tour-bolsa"
                  titulo="Bolsa de trabajo"
                  descripcion={esAlumnx
                    ? 'Postulate a las búsquedas de asistente y mostrate disponible para las clínicas.'
                    : 'Encontrá tu próximo trabajo o a quien sumar a tu equipo.'}
                  icon={Briefcase}
                  onClick={() => navigate('/bolsa-de-trabajo')}
                />
              </>
            )}
          </div>

          {/* Publicaciones científicas: renglón finito debajo, para que no le saque lugar a la Bolsa */}
          {!esProveedor && (
            <button
              id="tour-publicaciones"
              type="button"
              onClick={() => navigate('/papers')}
              className="group w-full mb-10 md:mb-12 -mt-6 md:-mt-8 bg-white/60 backdrop-blur-md border border-white/60 rounded-[20px] md:rounded-[24px] shadow-sm hover:bg-white/90 hover:shadow-md transition-all duration-300 ease-in-out px-4 py-3 flex items-center gap-3 text-left cursor-pointer outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
            >
              <Newspaper strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[#2D6A6A] group-hover:text-[#4DB6AC] transition-colors" />
              <div className="flex-1 min-w-0">
                <span className="text-[14px] md:text-[15px] font-black text-[#1A3D3D] font-['Montserrat']">Publicaciones científicas</span>
                <span className="hidden md:inline text-[#666666] font-medium text-[13px] ml-3">Papers y actualizaciones de la comunidad</span>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-[#2D6A6A] transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* Alumnos/as: aviso de que ya se recibieron, para pasar la cuenta a profesional */}
          {esAlumnx && <AvisoMeRecibi currentUser={currentUser} />}

          {/* BLOQUE 2: PRÓXIMAMENTE (se activa con más usuarios) */}
          <div id="tour-proximamente">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] shrink-0">
                Próximamente
              </h2>
              <span className="flex-1 h-px bg-[#2D6A6A]/15"></span>
            </div>
            <p className="text-[#666666] text-[13px] md:text-[14px] font-medium mb-4">
              Se van a ir activando a medida que se sume más gente a la comunidad.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <TarjetaProximamente
                titulo="Cartilla de proveedores"
                descripcion="Distribuidores, laboratorios y rubros afines."
                icon={Package}
              />
              <TarjetaProximamente
                titulo="Cursos"
                descripcion="Capacitaciones y especializaciones del sector."
                icon={BookOpen}
              />
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER — fuera del div de contenido pero dentro del raíz flex-col */}
      <FooterSimple seccion="Ecosistema" />

      {/* TOUR */}
      {mostrarTour && PASOS_TOUR[activeRole] && (
        <TourGuia
          pasos={PASOS_TOUR[activeRole]}
          userId={currentUser?.uid}
          claveStorage="ecosistema"
          onFin={async () => {
            setMostrarTour(false);
            try {
              await updateDoc(doc(db, 'usuarios', currentUser.uid), { 'tourVisto.ecosistema': true });
            } catch (e) { console.error('Error guardando contador del tour:', e); }
          }}
          onPaso={handlePasoTour}
        />
      )}
    </div>
  );
}