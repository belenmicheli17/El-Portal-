import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FileText, Eye, EyeOff, UploadCloud, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { db, storage } from '../../firebase';

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

// Si la persona figura como disponible y muestra su CV, actualizamos el link que ven las clínicas
const actualizarCVEnDisponible = async (uid, url) => {
  try {
    const refContacto = doc(db, 'profesionalesDisponibles', uid, 'privado', 'contacto');
    const snap = await getDoc(refContacto);
    if (snap.exists() && snap.data().mostrarCV !== false) await updateDoc(refContacto, { cvUrl: url });
  } catch (e) {
    console.error('No se pudo actualizar el CV en la Bolsa:', e);
  }
};

const formatearFecha = (ms) => new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
const formatearTamano = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Lee el CV guardado de la persona (vive en su documento privado de "usuarios")
export function useMiCV(uid) {
  const [cv, setCv] = useState(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    if (!uid) { setCargando(false); return; }
    let cancelado = false;
    setCargando(true);
    getDoc(doc(db, 'usuarios', uid))
      .then((snap) => { if (!cancelado) setCv(snap.data()?.cv || null); })
      .catch((e) => console.error('Error leyendo el CV:', e))
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [uid]);
  return { cv, setCv, cargando };
}

// Caja para subir, ver, reemplazar o borrar el CV. Se usa en el editor, en la postulación y al marcarse disponible.
export default function CajaCV({ uid, cv, setCv, compacta = false }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [verPdf, setVerPdf] = useState(false);

  const elegirArchivo = () => { setError(''); inputRef.current?.click(); };

  const subir = async (archivo) => {
    if (!archivo) return;
    if (archivo.type !== 'application/pdf') { setError('El CV tiene que ser un archivo PDF.'); return; }
    if (archivo.size > TAMANO_MAXIMO) { setError('El archivo pesa más de 5 MB. Probá con uno más liviano.'); return; }
    setSubiendo(true);
    setError('');
    try {
      const ruta = `cvs/${uid}/${Date.now()}.pdf`;
      const archivoRef = ref(storage, ruta);
      await uploadBytes(archivoRef, archivo, { contentType: 'application/pdf' });
      const url = await getDownloadURL(archivoRef);
      const nuevo = { url, ruta, nombre: archivo.name, tamano: archivo.size, subidoEn: Date.now() };
      await updateDoc(doc(db, 'usuarios', uid), { cv: nuevo });
      // Borramos el CV anterior para no dejar archivos viejos dando vueltas
      if (cv?.ruta) await deleteObject(ref(storage, cv.ruta)).catch(() => {});
      await actualizarCVEnDisponible(uid, url);
      setCv(nuevo);
      setVerPdf(false);
    } catch (e) {
      console.error('Error subiendo el CV:', e);
      setError('No pudimos subir el CV. Intentá de nuevo.');
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const borrar = async () => {
    if (!cv || !window.confirm('¿Borrar tu CV guardado?')) return;
    try {
      await updateDoc(doc(db, 'usuarios', uid), { cv: deleteField() });
      if (cv.ruta) await deleteObject(ref(storage, cv.ruta)).catch(() => {});
      await actualizarCVEnDisponible(uid, '');
      setCv(null);
      setVerPdf(false);
    } catch (e) {
      console.error('Error borrando el CV:', e);
      setError('No pudimos borrar el CV. Intentá de nuevo.');
    }
  };

  return (
    <div className="font-['Inter']">
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />

      {cv ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-12 shrink-0 rounded-lg bg-red-50 text-red-700 flex items-center justify-center text-[11px] font-bold">PDF</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#333333] truncate">{cv.nombre || 'Mi CV.pdf'}</p>
              <p className="text-[12px] text-[#666666]">Cargado el {formatearFecha(cv.subidoEn)}{cv.tamano ? ` · ${formatearTamano(cv.tamano)}` : ''}</p>
            </div>
            <button type="button" onClick={() => setVerPdf((v) => !v)} className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] px-2 py-1.5">
              {verPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {verPdf ? 'Ocultar' : 'Ver PDF'}
            </button>
          </div>

          {verPdf && (
            <div className="mt-3">
              <iframe src={cv.url} title="Tu CV" className="w-full h-[420px] rounded-xl border border-gray-100 bg-[#F4F7F7]" />
              <a href={cv.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2D6A6A] mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir en otra pestaña
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={elegirArchivo} disabled={subiendo} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]">
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Reemplazar CV
            </button>
            {!compacta && (
              <button type="button" onClick={borrar} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#666666] hover:text-red-600">
                <Trash2 className="w-4 h-4" /> Borrar
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={elegirArchivo}
          disabled={subiendo}
          className="w-full border-2 border-dashed border-gray-200 hover:border-[#2D6A6A] rounded-2xl p-4 flex items-center gap-3 text-left transition-all duration-300 bg-white"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center">
            {subiendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1A3D3D]">{subiendo ? 'Subiendo tu CV…' : 'Subir mi CV en PDF'}</p>
            <p className="text-[12px] text-[#666666]">Hasta 5 MB. Queda guardado en tu editor para la próxima.</p>
          </div>
        </button>
      )}

      {error && <p className="text-[12px] font-semibold text-red-600 mt-2">{error}</p>}
    </div>
  );
}
