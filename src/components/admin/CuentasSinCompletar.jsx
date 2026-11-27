import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Copy, Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { auth } from '../../firebase';

// Lista de cuentas que existen en Authentication pero no tienen documento en "usuarios"
// (se registraron mientras las reglas de Firestore estaban incompletas y no pudieron terminar el alta).
// La arma la función /api/cuentas-sin-completar, que solo responde a la admin.
const formatearFechaHora = (iso) => {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return `${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function CuentasSinCompletar() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const respuesta = await fetch('/api/cuentas-sin-completar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!respuesta.ok) throw new Error(`Respondió ${respuesta.status}`);
      const datos = await respuesta.json();
      setCuentas(Array.isArray(datos.sinCompletar) ? datos.sinCompletar : []);
    } catch (e) {
      console.error('No se pudo cargar la lista de cuentas sin completar:', e);
      setError('No pudimos armar la lista. Probá de nuevo en un momento.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Copia todos los mails juntos, listos para pegar en el "Para" o "CCO" de un mail
  const copiarMails = async () => {
    const mails = cuentas.map((c) => c.email).filter(Boolean).join(', ');
    try {
      await navigator.clipboard.writeText(mails);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.error('No se pudo copiar:', e);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-amber-100 shadow-sm p-5 md:p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-[#1A3D3D] font-bold text-[16px] font-['Montserrat']">
              Cuentas sin completar
              {!cargando && !error && cuentas.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-600">{cuentas.length}</span>
              )}
            </h2>
            <p className="text-[#666666] text-[13px] font-medium">
              Crearon su cuenta pero no se guardaron sus datos (no pueden ingresar al cuestionario).
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {cuentas.length > 0 && (
            <button
              type="button"
              onClick={copiarMails}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-[#F4F7F7] text-[#1A3D3D] hover:bg-[#E8EFEF] transition-colors"
            >
              {copiado ? <Check className="w-4 h-4 text-[#2D6A6A]" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Copiados' : 'Copiar mails'}
            </button>
          )}
          <button
            type="button"
            onClick={cargar}
            disabled={cargando}
            aria-label="Actualizar la lista"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-[#F4F7F7] text-[#1A3D3D] hover:bg-[#E8EFEF] transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {cargando && cuentas.length === 0 && !error && (
        <div className="flex items-center gap-3 py-6 text-[#2D6A6A]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[14px] font-medium">Buscando cuentas…</span>
        </div>
      )}

      {error && (
        <p className="mt-4 text-[13px] font-medium text-red-600" role="alert">{error}</p>
      )}

      {!cargando && !error && cuentas.length === 0 && (
        <p className="mt-4 flex items-center gap-2 text-[13px] font-medium text-[#2D6A6A]">
          <CheckCircle2 className="w-4 h-4" /> No hay cuentas sin completar.
        </p>
      )}

      {cuentas.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 pr-4 text-[11px] font-bold text-[#666666] uppercase tracking-widest">Mail</th>
                <th className="py-3 pr-4 text-[11px] font-bold text-[#666666] uppercase tracking-widest whitespace-nowrap">Cuenta creada</th>
                <th className="py-3 text-[11px] font-bold text-[#666666] uppercase tracking-widest text-right">Escribirle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cuentas.map((c) => (
                <tr key={c.uid}>
                  <td className="py-3 pr-4 text-[14px] font-medium text-[#1A3D3D] break-all">{c.email || '—'}</td>
                  <td className="py-3 pr-4 text-[13px] text-[#666666] whitespace-nowrap">{formatearFechaHora(c.creada)}</td>
                  <td className="py-3 text-right">
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        aria-label={`Escribirle a ${c.email}`}
                        className="inline-flex p-2 rounded-lg text-[#2D6A6A] hover:bg-[#2D6A6A]/10 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
