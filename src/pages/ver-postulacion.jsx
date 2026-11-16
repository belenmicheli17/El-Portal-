import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { Loader2, Lock, ExternalLink, User, FileText, Check, ChevronLeft, MessageCircle, Mail } from 'lucide-react';
import { db, storage } from '../firebase';
import { linkWhatsapp } from '../utils/bolsa';
import { useAuth } from '../context/AuthContext';

const ESTADOS = [
  { id: 'nueva', label: 'Nueva', activo: 'bg-blue-600 text-white', ayuda: 'Todavía no la revisaste.' },
  { id: 'interesa', label: 'Me interesa', activo: 'bg-green-600 text-white', ayuda: 'La querés contactar o tener de reserva.' },
  { id: 'descartada', label: 'Descartada', activo: 'bg-gray-500 text-white', ayuda: 'Ya no la tenés en cuenta.' }
];

const fechaLarga = (valor) => {
  const ms = valor?.toMillis ? valor.toMillis() : 0;
  return ms ? new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
};

// Una postulación: la clínica ve a la persona, su mensaje y el currículum en la misma pantalla.
// Solo la abren la clínica dueña de la oferta y quien se postuló (lo controlan las reglas de Firestore).
export default function VerPostulacion() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: cargandoSesion } = useAuth();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin-sesion | sin-permiso | no-existe
  const [post, setPost] = useState(null);
  const [cvUrl, setCvUrl] = useState('');
  const [cvError, setCvError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorEstado, setErrorEstado] = useState('');
  const [perfil, setPerfil] = useState(null);

  useEffect(() => { document.title = 'Postulación | Portal Veterinario'; }, []);

  useEffect(() => {
    if (cargandoSesion) return;
    if (!currentUser) { setEstado('sin-sesion'); return; }
    let cancelado = false;
    setEstado('cargando');
    getDoc(doc(db, 'postulaciones', postId))
      .then(async (snap) => {
        if (cancelado) return;
        if (!snap.exists()) { setEstado('no-existe'); return; }
        const datos = snap.data();
        setPost(datos);
        setEstado('listo');
        // Perfil público de la persona: apellido, foto y contacto
        getDoc(doc(db, 'profesionales', datos.postulanteId))
          .then((s) => { if (!cancelado && s.exists()) setPerfil(s.data()); })
          .catch(() => {});
        if (datos.conCV && datos.cvRuta) {
          try { const link = await getDownloadURL(ref(storage, datos.cvRuta)); if (!cancelado) setCvUrl(link); }
          catch (e) { console.error('Error abriendo el CV:', e); if (!cancelado) setCvError(true); }
        }
      })
      .catch((e) => {
        if (cancelado) return;
        console.error('Error leyendo la postulación:', e);
        setEstado(e?.code === 'permission-denied' ? 'sin-permiso' : 'no-existe');
      });
    return () => { cancelado = true; };
  }, [cargandoSesion, currentUser, postId]);

  const esClinicaDuena = !!post && post.clinicaId === currentUser?.uid;
  const nombreCompleto = (perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() : '') || post?.nombre || 'Postulante';
  const mensajeContacto = `Hola ${nombreCompleto.split(' ')[0]}, te escribimos de ${post?.clinicaNombre || 'la clínica'}. Vimos tu postulación para ${post?.puesto || 'el puesto'} en Portal Veterinario y nos gustaría hablar con vos.`;
  const esFoto = post?.cvTipo ? post.cvTipo.startsWith('image/') : /\.(jpe?g|png|webp)$/i.test(post?.cvRuta || '');

    const cambiarEstado = async (nuevo) => {
    if (!esClinicaDuena || guardando || post.estado === nuevo) return;
    setGuardando(true);
    setErrorEstado('');
    try {
      await updateDoc(doc(db, 'postulaciones', postId), { estado: nuevo });
      setPost((p) => ({ ...p, estado: nuevo }));
    } catch (e) {
      console.error('No se pudo cambiar el estado:', e);
      setErrorEstado('No pudimos guardar el cambio. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const claseBoton = 'inline-flex items-center justify-center gap-2 bg-[#2D6A6A] hover:bg-[#1A3D3D] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5';
  const claseSecundario = 'inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-[#2D6A6A] text-[#1A3D3D] px-5 py-3 rounded-2xl text-[14px] font-semibold transition-colors';

  const mensajeCentrado = (icono, titulo, texto, boton) => (
    <div className="max-w-md mx-auto bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.06)] p-8 text-center">
      {icono}
      <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[22px] mb-2">{titulo}</h1>
      <p className="text-[14px] text-[#666666] leading-relaxed mb-6">{texto}</p>
      {boton}
    </div>
  );

  const contenido = () => {
    if (estado === 'cargando') return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#2D6A6A] animate-spin" /></div>;
    if (estado === 'sin-sesion') {
      return mensajeCentrado(
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2D6A6A]/10 text-[#2D6A6A] flex items-center justify-center mb-4"><Lock className="w-6 h-6" /></div>,
        'Iniciá sesión para ver la postulación',
        'Las postulaciones las ve solo la clínica que publicó la oferta. Después de iniciar sesión, volvé a tocar el link del mensaje.',
        <button type="button" onClick={() => navigate('/login')} className={claseBoton}>Iniciar sesión</button>
      );
    }
    if (estado === 'sin-permiso') return mensajeCentrado(null, 'No podemos mostrarte esta postulación', 'La ve solo la clínica que publicó la oferta. Si sos esa clínica, revisá que hayas iniciado sesión con tu cuenta.');
    if (estado === 'no-existe') return mensajeCentrado(null, 'Esta postulación ya no está disponible', 'Puede que la oferta se haya borrado.');

    return (
      <div className="max-w-3xl mx-auto">
        <button type="button" onClick={() => navigate(esClinicaDuena ? `/bolsa-de-trabajo?v=mis&postulantes=${post.ofertaId}` : '/bolsa-de-trabajo?v=mis')} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-5">
          <ChevronLeft className="w-4 h-4" /> {esClinicaDuena ? 'Volver a la lista de postulantes' : 'Volver a mis publicaciones'}
        </button>
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.06)] p-6 md:p-8">
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-1">Postulación · {post.puesto}</p>
          <div className="flex items-center gap-4">
            {perfil?.foto ? (
              <img src={perfil.foto} alt={nombreCompleto} className="w-16 h-16 shrink-0 rounded-full object-cover border border-gray-100" />
            ) : (
              <div className="w-16 h-16 shrink-0 rounded-full bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center"><User className="w-7 h-7" /></div>
            )}
            <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[26px] md:text-[32px] leading-tight">{nombreCompleto}</h1>
          </div>
          <p className="text-[13px] text-[#666666] mt-1">Se postuló el {fechaLarga(post.creadaEn)}{post.clinicaNombre ? ` a la oferta de ${post.clinicaNombre}` : ''}</p>

          {post.mensaje && <p className="text-[15px] text-[#333333] leading-relaxed whitespace-pre-line bg-[#F4F7F7] rounded-2xl px-4 py-3 mt-5">{post.mensaje}</p>}

          {esClinicaDuena && (
            <div className="mt-6">
              <p className="text-[13px] font-bold text-[#1A3D3D] mb-2">Estado</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((e) => (
                  <button key={e.id} type="button" onClick={() => cambiarEstado(e.id)} disabled={guardando}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl transition-colors ${post.estado === e.id ? `${e.activo} shadow-sm` : 'bg-white border border-gray-200 text-[#666666] hover:bg-gray-50'}`}>
                    {post.estado === e.id && <Check className="w-3.5 h-3.5" />} {e.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-[#666666] mt-2">{ESTADOS.find((e) => e.id === post.estado)?.ayuda}</p>
              {errorEstado && <p className="text-[13px] font-semibold text-red-600 mt-2">{errorEstado}</p>}
            </div>
          )}

          {esClinicaDuena && (perfil?.whatsappNum || perfil?.emailContacto) && (
            <div className="flex flex-wrap gap-2 mt-6">
              {perfil.whatsappNum && (
                <a href={linkWhatsapp(perfil.whatsappNum, mensajeContacto)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-colors">
                  <MessageCircle className="w-5 h-5" /> Contactar por WhatsApp
                </a>
              )}
              {perfil.emailContacto && (
                <a href={`mailto:${perfil.emailContacto}?subject=${encodeURIComponent('Tu postulación — Portal Veterinario')}&body=${encodeURIComponent(mensajeContacto)}`} className={claseSecundario}>
                  <Mail className="w-4 h-4" /> Contactar por mail
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {post.slug && <button type="button" onClick={() => navigate(`/profesional/${post.slug}`)} className={claseSecundario}><User className="w-4 h-4" /> Ver su perfil</button>}
            {post.perfilUrl && !post.slug && <a href={post.perfilUrl} target="_blank" rel="noopener noreferrer" className={claseSecundario}><User className="w-4 h-4" /> Ver su perfil</a>}
          </div>
        </div>

        {/* El currículum, a la vista en la misma pantalla */}
        {post.conCV && (
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.06)] p-6 md:p-8 mt-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px] flex items-center gap-2"><FileText className="w-5 h-5 text-[#2D6A6A]" /> Currículum</h2>
              {cvUrl && <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D]"><ExternalLink className="w-4 h-4" /> Abrir en otra pestaña</a>}
            </div>
            {cvError ? (
              <p className="text-[14px] text-[#666666] bg-[#F4F7F7] rounded-2xl p-4">No pudimos mostrar el currículum. Puede que la persona lo haya reemplazado por uno nuevo.</p>
            ) : !cvUrl ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" /></div>
            ) : esFoto ? (
              <img src={cvUrl} alt="Currículum" className="w-full rounded-2xl border border-gray-100 bg-[#F4F7F7]" />
            ) : (
              <iframe src={cvUrl} title="Currículum" className="w-full h-[70vh] rounded-2xl border border-gray-100 bg-[#F4F7F7]" />
            )}
          </div>
        )}
      </div>
    );
  };

  return <main className="min-h-screen bg-[#F4F7F7] px-4 pt-10 pb-24 font-['Inter']">{contenido()}</main>;
}