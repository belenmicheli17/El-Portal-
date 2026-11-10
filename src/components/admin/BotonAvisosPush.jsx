import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Loader2, Send } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_UID, avisosSoportados, activarAvisos, escucharAvisosEnPrimerPlano } from '../../utils/avisosPush';

// ============================================================
// Botón del panel de admin: activa las notificaciones en este dispositivo.
// Va en: src/components/admin/BotonAvisosPush.jsx
// ============================================================
export default function BotonAvisosPush() {
  const { currentUser } = useAuth();
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const esAdmin = currentUser?.uid === ADMIN_UID;

  // Mientras el panel esté abierto, escucha los avisos para mostrarlos
  useEffect(() => {
    const dejarDeEscuchar = escucharAvisosEnPrimerPlano();
    return () => dejarDeEscuchar();
  }, []);

  // Al entrar: si el permiso ya estaba dado, renovamos el dispositivo en silencio (sin preguntar)
  useEffect(() => {
    if (!esAdmin) return undefined;
    let cancelado = false;
    (async () => {
      const ok = await avisosSoportados();
      if (cancelado) return;
      setSoportado(ok);
      if (!ok) return;
      if (Notification.permission === 'denied') { setBloqueado(true); return; }
      if (Notification.permission === 'granted') {
        const r = await activarAvisos();
        if (!cancelado && r.ok) setActivo(true);
      }
    })();
    return () => { cancelado = true; };
  }, [esAdmin]);

  if (!esAdmin || !soportado) return null;

  const activar = async () => {
    setCargando(true);
    setMensaje('');
    const r = await activarAvisos();
    setCargando(false);
    if (r.ok) { setActivo(true); setBloqueado(false); return; }
    if (r.motivo === 'denegado') { setBloqueado(true); return; }
    setMensaje('No se pudo activar. Probá de nuevo.');
  };

  const probar = async () => {
    setProbando(true);
    setMensaje('');
    try {
      await httpsCallable(functions, 'enviarAvisoPrueba')();
      setMensaje('Aviso de prueba enviado.');
    } catch (e) {
      console.error(e);
      setMensaje('No se pudo mandar la prueba.');
    } finally {
      setProbando(false);
      setTimeout(() => setMensaje(''), 15000);
    }
  };

  if (bloqueado) {
    return (
      <p className="text-[11px] font-semibold text-red-500 max-w-[190px] leading-snug text-right" title="Tocá el candado de la barra de direcciones y permití las notificaciones">
        Avisos bloqueados: habilitá las notificaciones en el candado del navegador.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {mensaje && <span className="text-[11px] font-semibold text-[#2D6A6A] hidden md:inline">{mensaje}</span>}
      {activo ? (
        <>
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#2D6A6A] bg-[#2D6A6A]/10 px-3 py-2 rounded-xl">
            <BellRing className="w-4 h-4" /> <span className="hidden sm:inline">Avisos activados</span>
          </span>
          <button
            type="button"
            onClick={probar}
            disabled={probando}
            title="Mandarme un aviso de prueba"
            className="p-2 rounded-xl text-[#2D6A6A] hover:bg-[#2D6A6A]/10 transition-colors disabled:opacity-60"
          >
            {probando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={activar}
          disabled={cargando}
          className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#2D6A6A] hover:bg-[#1A3D3D] px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
        >
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          <span className="hidden sm:inline">Activar avisos</span>
        </button>
      )}
    </div>
  );
}