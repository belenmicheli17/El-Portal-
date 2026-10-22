import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  User, BookOpen, Package, Newspaper, ChevronRight,
  Briefcase, Users, LogOut, Eye, Store, PawPrint, Clock,
  ShieldCheck, AlertCircle, Upload, Loader2, Check, Camera
} from 'lucide-react';
import FooterSimple from '../components/FooterSimple';
import TourGuia from '../components/TourGuia';
import PantallaCarga from '../components/PantallaCarga';
import { calcularProgresoPerfil } from '../utils/progresoPerfil';

// ── Tarjeta de una herramienta que ya funciona ─────────────────────────────
// En celular se ve como renglón (ícono a la izquierda, flecha a la derecha).
// En PC se ve como tarjeta alta centrada, como antes.
const TarjetaDisponible = ({ id, titulo, descripcion, icon: Icon, onClick, distintivo }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className="group w-full h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 transition-all duration-300 ease-in-out p-4 md:p-6 flex flex-row md:flex-col items-center gap-4 md:gap-0 text-left md:text-center md:min-h-[210px] cursor-pointer outline-none focus:ring-4 focus:ring-[#2D6A6A]/10"
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
function TarjetaAvance({ avance, cargando, onEditar, onVerPerfil }) {
  // Une la lista de faltantes en una frase: "foto y contacto", "foto, contacto y más"
  const textoFaltantes = () => {
    if (!avance) return '';
    const { faltantes } = avance;
    if (faltantes.length === 0) return 'Tu perfil está completo. ¡Muy bien!';
    const primeros = faltantes.slice(0, 2).join(' y ');
    return `Te falta: ${primeros}${faltantes.length > 2 ? ' y algo más' : ''}`;
  };

  return (
    <div id="tour-avance" className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-5 md:p-6">
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
          <p className="text-[13px] md:text-[14px] text-[#666666] font-medium leading-snug mb-4">{textoFaltantes()}</p>
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
          {avance && avance.faltantes.length === 0 ? 'Editar perfil' : 'Seguir editando'}
        </button>
        <button
          type="button"
          onClick={onVerPerfil}
          className="flex-1 bg-[#F4F7F7] text-[#1A3D3D] rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-300 ease-in-out hover:bg-gray-200 flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4 text-[#2D6A6A]" /> Ver mi perfil
        </button>
      </div>
    </div>
  );
}

// ── Subida de documento (foto/PDF) ─────────────────────────────────────────
function PendingDocUpload({ currentUser, onSubido }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!currentUser.documentoUrl);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { getAuth } = await import('firebase/auth');
    const authUser = getAuth().currentUser;
    if (!authUser) { setError('No se detectó tu sesión. Cerrá sesión y volvé a ingresar.'); return; }
    const uid = authUser.uid;
    if (file.size > 10 * 1024 * 1024) { setError('El archivo no puede superar los 10MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const fileRef = ref(storage, `validaciones/${uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on('state_changed',
        (snapshot) => { setProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)); },
        (err) => { console.error("Error subiendo:", err); setError('Hubo un error al subir. Intentá de nuevo.'); setUploading(false); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'usuarios', uid), { documentoUrl: url });
          setUploaded(true);
          setUploading(false);
          if (onSubido) onSubido();
        }
      );
    } catch (err) { console.error("Error general:", err); setError('Error inesperado. Revisá tu conexión.'); setUploading(false); }
  };

  if (uploaded) return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
      <Check className="w-5 h-5 text-green-500 shrink-0" />
      <div>
        <p className="text-green-700 font-bold text-sm">Documento recibido</p>
        <p className="text-green-600 text-xs font-medium">Te avisaremos cuando sea aprobado.</p>
      </div>
    </div>
  );

  return (
    <div>
      {error && <p className="text-red-500 text-xs font-bold mb-3">{error}</p>}
      {/* Botón principal: abre galería en móvil y PC */}
      <label className={`w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${uploading ? 'border-[#2D6A6A] bg-[#2D6A6A]/5 cursor-not-allowed' : 'border-[#2D6A6A]/40 hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5 cursor-pointer'}`}>
        {uploading
          ? (<><Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" /><span className="text-sm font-bold text-[#2D6A6A]">{progress}% subiendo...</span></>)
          : (<><Upload className="w-6 h-6 text-[#2D6A6A]" /><span className="text-sm font-bold text-[#2D6A6A]">Subir foto o PDF</span><span className="text-xs text-[#666666] font-medium">JPG, PNG o PDF — máx. 10MB</span></>)
        }
        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
      </label>
      {/* Botón cámara: solo visible en móvil */}
      <label className="mt-2 w-full py-3 rounded-xl border border-[#2D6A6A]/20 bg-white flex items-center justify-center gap-2 cursor-pointer hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5 transition-all md:hidden">
        <Camera className="w-5 h-5 text-[#2D6A6A]" />
        <span className="text-sm font-bold text-[#2D6A6A]">Sacar foto con la cámara</span>
        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

// ── Formulario de matrícula (alternativa sin documento físico) ──────────────
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
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
        />
      </div>
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Facultad donde te recibiste</label>
        <input
          type="text"
          value={facultad}
          onChange={e => setFacultad(e.target.value)}
          placeholder="Ej: UBA, UNLP, UNR..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
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
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
        />
      </div>
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Matrícula del director/a técnico/a</label>
        <input
          type="text"
          value={matricula}
          onChange={e => setMatricula(e.target.value)}
          placeholder="Ej: 12345"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
        />
      </div>
      <div>
        <label className="text-[#1A3D3D] text-xs font-bold uppercase tracking-widest block mb-1.5">Facultad donde se recibió</label>
        <input
          type="text"
          value={facultad}
          onChange={e => setFacultad(e.target.value)}
          placeholder="Ej: UBA, UNLP, UNR..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1A3D3D] placeholder-gray-400 focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/20 outline-none transition-all"
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
  const [metodoProf, setMetodoProf] = useState('documento'); // 'documento' | 'matricula'
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
                  Podés subir una foto o PDF de tu título o carnet veterinario, o completar tus datos de matrícula si no lo tenés a mano.
                </p>

                {/* Selector de método */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMetodoProf('documento')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${metodoProf === 'documento' ? 'bg-[#2D6A6A] text-white shadow-md' : 'bg-white border border-gray-200 text-[#666666] hover:border-[#2D6A6A]'}`}
                  >
                    Subir documento
                  </button>
                  <button
                    onClick={() => setMetodoProf('matricula')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${metodoProf === 'matricula' ? 'bg-[#2D6A6A] text-white shadow-md' : 'bg-white border border-gray-200 text-[#666666] hover:border-[#2D6A6A]'}`}
                  >
                    Cargar matrícula
                  </button>
                </div>

                {metodoProf === 'documento'
                  ? <PendingDocUpload currentUser={currentUser} />
                  : <FormMatricula currentUser={currentUser} />
                }
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
          Estamos revisando tu matrícula y tu título. Tarda menos de 48 horas hábiles y te avisamos por mail apenas esté listo.
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
          Mientras esperás, podés sumar tu trayectoria y tus fotos. Apenas te verifiquemos, tu perfil sale publicado.
        </p>

        <button
          type="button"
          onClick={() => navigate(rol === 'clinica' ? '/editor-clinica' : '/editor-profesional')}
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
          onClick={() => navigate(rol === 'clinica' ? '/onboarding-clinica' : '/onboarding', { state: { correccion: true } })}
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

  useEffect(() => {
    if (!currentUser) return;
    // Si ya está aprobado (o no es profesional) no hace falta buscar nada
    if ((currentUser.rol !== 'profesional' && currentUser.rol !== 'clinica') || currentUser.estado === 'activo') {
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

  // Leemos el perfil profesional y calculamos el porcentaje con la misma cuenta que usa el editor
  useEffect(() => {
    if (!currentUser?.uid) return;
    if (currentUser.rol !== 'profesional') {
      setCargandoAvance(false);
      return;
    }
    let cancelado = false;
    const cargarAvance = async () => {
      try {
        const snap = await getDoc(doc(db, 'profesionales', currentUser.uid));
        if (cancelado) return;
        const datos = snap.exists() ? snap.data() : {};
        // Igual que el editor: socio vitalicio o plan distinto de 'gratis' incluye casos clínicos
        const incluyeCasos = currentUser.socioVitalicio === true || datos.planActual !== 'gratis';
        setAvance(calcularProgresoPerfil(datos, incluyeCasos));
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
      { targetId: 'tour-publicaciones', titulo: 'Publicaciones científicas', desc: 'Papers y actualizaciones de la comunidad. Podés publicar los tuyos desde tu perfil.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'Bolsa de trabajo, proveedores y cursos se van a ir activando a medida que se sume más gente. A la bolsa ya podés entrar.' },
      { targetId: 'tour-btn-accesibilidad', titulo: 'Opciones de accesibilidad', desc: 'Este botón te permite ajustar el tamaño del texto, activar modo escala de grises, resaltar enlaces y más.', abrirAccs: true, posicion: 'derecha' },
    ],
    clinica: [
      { targetId: 'tour-avance', titulo: 'Tu perfil', desc: 'Desde acá seguís editando tu clínica o ves cómo la ven los tutores.' },
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil institucional', desc: 'Completá los datos de tu clínica: servicios, equipo, horarios y contacto para aparecer en la Cartilla.' },
      { targetId: 'tour-colegas', titulo: 'Cartilla de colegas', desc: 'Encontrá profesionales para sumar a tu equipo o para derivaciones.' },
      { targetId: 'tour-publicaciones', titulo: 'Publicaciones científicas', desc: 'Papers y actualizaciones del mundo veterinario para mantenerte al día.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'Bolsa de trabajo, proveedores y cursos se van a ir activando a medida que se sume más gente. A la bolsa ya podés entrar.' },
      { targetId: 'tour-btn-accesibilidad', titulo: 'Opciones de accesibilidad', desc: 'Ajustá el tamaño del texto, activá modo escala de grises, resaltá enlaces y más.', abrirAccs: true, posicion: 'derecha' },
    ],
    alumnx: [
      { targetId: 'tour-avance', titulo: 'Tu perfil', desc: 'Desde acá seguís editando tu perfil o ves cómo lo ven los demás.' },
      { targetId: 'tour-editar-perfil', titulo: 'Editar tu perfil', desc: 'Completá tu perfil para aparecer en búsquedas y mostrar tu trayectoria académica.' },
      { targetId: 'tour-proximamente', titulo: 'Próximamente', desc: 'Bolsa de trabajo, proveedores y cursos se van a ir activando a medida que se sume más gente. A la bolsa ya podés entrar.' },
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
  if ((currentUser.rol === 'profesional' || currentUser.rol === 'clinica') && currentUser.onboardingCompleto === false) {
    return <Navigate to={currentUser.rol === 'clinica' ? '/onboarding-clinica' : '/onboarding'} replace />;
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
  const necesitaValidacion = currentUser.rol === 'profesional' || currentUser.rol === 'clinica';
  if (necesitaValidacion && currentUser.estado !== 'activo') {
    // Profesionales del flujo nuevo: manda lo que dice su solicitud de verificación
    if (currentUser.rol === 'profesional' || currentUser.rol === 'clinica') {
      if (cargandoVerificacion) return <PantallaCarga />;
      if (verificacion?.estado === 'rechazado') return <PantallaRechazo verificacion={verificacion} handleLogout={handleLogout} rol={currentUser.rol} />;
      if (verificacion?.estado === 'pendiente') return <PantallaEspera verificacion={verificacion} handleLogout={handleLogout} rol={currentUser.rol} />;
    }
    // Clínicas (y cuentas viejas sin solicitud): queda la pantalla de antes
    return <PantallaEstado tipo={currentUser.estado} currentUser={currentUser} handleLogout={handleLogout} />;
  }

  // Rutas según el tipo de cuenta
  const rutaEditor = activeRole === 'clinica' ? '/editor-clinica' : activeRole === 'proveedor' ? '/editor-proveedores' : '/editor-profesional';
  const rutaPerfilPublico = `/${activeRole === 'clinica' ? 'clinica' : activeRole === 'proveedor' ? 'proveedor' : 'profesional'}/${currentUser?.slug}`;
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
        <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] bg-[#4DB6AC]/15 rounded-full blur-[150px]"></div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-4 md:p-10 lg:p-12 relative z-10">
        <div className="max-w-[1200px] mx-auto">

          {/* ENCABEZADO: saludo + tarjeta de avance */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 lg:items-center mb-10 md:mb-12">

            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tight">
                ¡Hola, {currentUser.nombre || 'Profesional'}! <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
                  Bienvenido/a al ecosistema.
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
              />
            </div>
          </div>

          {/* BLOQUE 1: TU ESPACIO (lo que ya funciona) */}
          <h2 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] mb-4">
            Tu espacio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-10 md:mb-12">

            <TarjetaDisponible
              id="tour-editar-perfil"
              titulo="Editar perfil"
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
                <TarjetaDisponible
                  id="tour-colegas"
                  titulo="Cartilla de colegas"
                  descripcion="Tené a mano los contactos de tus colegas para derivaciones o trabajos en equipo."
                  icon={Users}
                  onClick={() => navigate('/cartilla')}
                  distintivo={distintivoTutores}
                />
                <TarjetaDisponible
                  id="tour-publicaciones"
                  titulo="Publicaciones científicas"
                  descripcion="Papers y actualizaciones de la comunidad. Podés publicar los tuyos."
                  icon={Newspaper}
                  onClick={() => navigate('/papers')}
                />
              </>
            )}
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {!esProveedor && (
                <TarjetaProximamente
                  titulo="Bolsa de trabajo"
                  descripcion="Ofertas de clínicas y profesionales disponibles."
                  icon={Briefcase}
                  onClick={() => navigate('/bolsa-de-trabajo')}
                />
              )}
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