import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { FileText, Loader2, ExternalLink, Lock } from 'lucide-react';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Página que abre el currículum de un postulante. Solo la ven cuentas con sesión;
// las reglas de Storage dejan pasar únicamente a clínicas verificadas, a la dueña y a la admin.
export default function VerCV() {
  const { uid, archivo } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: cargandoSesion } = useAuth();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin-sesion | sin-permiso | no-existe | error
  const [url, setUrl] = useState('');
  const [nombre, setNombre] = useState('');
  const esFoto = /\.(jpe?g|png|webp)$/i.test(archivo || '');

  useEffect(() => {
    document.title = 'Currículum | Portal Veterinario';
  }, []);

  useEffect(() => {
    if (cargandoSesion) return;
    if (!currentUser) { setEstado('sin-sesion'); return; }
    let cancelado = false;
    setEstado('cargando');

    // El nombre sale del perfil público (si tiene uno); si no hay, simplemente no se muestra
    getDoc(doc(db, 'profesionales', uid))
      .then((snap) => {
        if (cancelado || !snap.exists()) return;
        const d = snap.data();
        setNombre(`${d.nombre || ''} ${d.apellido || ''}`.trim());
      })
      .catch(() => {});

    // Pedimos el archivo a Storage: si la cuenta no tiene permiso, Storage lo rechaza acá
    getDownloadURL(ref(storage, `cvs/${uid}/${archivo}`))
      .then((link) => {
        if (cancelado) return;
        setUrl(link);
        setEstado('listo');
        // Abre el archivo directo, sin pedir otro toque (el botón queda de respaldo por si no se abre)
        window.location.replace(link);
      })
      .catch((e) => {
        if (cancelado) return;
        if (e?.code === 'storage/unauthorized') setEstado('sin-permiso');
        else if (e?.code === 'storage/object-not-found') setEstado('no-existe');
        else { console.error('Error abriendo el CV:', e); setEstado('error'); }
      });

    return () => { cancelado = true; };
  }, [cargandoSesion, currentUser, uid, archivo]);

  const claseBoton = 'inline-flex items-center justify-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5';

  const contenido = () => {
    if (estado === 'cargando') {
      return <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 text-[#2D6A6A] animate-spin" /></div>;
    }
    if (estado === 'sin-sesion') {
      return (
        <>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center mb-4"><Lock className="w-6 h-6" /></div>
          <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] mb-2">Iniciá sesión para ver el currículum</h1>
          <p className="text-[14px] text-[#666666] leading-relaxed mb-6">Los currículums solo los ven las clínicas registradas y verificadas.</p>
          <button type="button" onClick={() => navigate('/login')} className={claseBoton}>Iniciar sesión</button>
        </>
      );
    }
    if (estado === 'sin-permiso') {
      return (
        <>
          <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] mb-2">No podemos mostrarte este currículum</h1>
          <p className="text-[14px] text-[#666666] leading-relaxed">Es visible solo para clínicas con la cuenta verificada. Si ya lo es, escribinos y lo revisamos.</p>
        </>
      );
    }
    if (estado === 'no-existe') {
      return (
        <>
          <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] mb-2">Este currículum ya no está disponible</h1>
          <p className="text-[14px] text-[#666666] leading-relaxed">Puede que la persona lo haya reemplazado por uno nuevo. Pedile que te mande la postulación de nuevo.</p>
        </>
      );
    }
    if (estado === 'error') {
      return (
        <>
          <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] mb-2">No pudimos abrir el currículum</h1>
          <p className="text-[14px] text-[#666666] leading-relaxed">Probá recargar la página en un ratito.</p>
        </>
      );
    }
    return (
      <>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center mb-4"><FileText className="w-7 h-7" /></div>
        <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-1">Currículum</p>
        <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] md:text-[26px] leading-tight mb-6">{nombre || 'Postulante'}</h1>
        <a href={url} target="_blank" rel="noopener noreferrer" className={claseBoton}>
          <ExternalLink className="w-4 h-4" /> {esFoto ? 'Ver currículum (foto)' : 'Ver currículum (PDF)'}
        </a>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-[#F4F7F7] px-4 pt-24 pb-24 font-['Inter']">
      <div className="max-w-md mx-auto bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.06)] p-8 text-center">
        {contenido()}
      </div>
    </main>
  );
}