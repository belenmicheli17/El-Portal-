import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  User, BookOpen, Package, Newspaper, Bell, ChevronRight, 
  Clock, Briefcase, Users, LogOut, Eye, ChevronDown, ChevronUp, Store,
  ShieldCheck, AlertCircle, Upload, Loader2, Check, Camera
} from 'lucide-react';
import NotificationBox from '../components/NotificationBox';
import TourGuia from '../components/TourGuia';
// 💡 Subcomponente reutilizable para no repetir código (DRY)
const DashboardCard = ({ titulo, descripcion, icon: Icon, onClick, customBg = "bg-white/80" }) => (
  <button 
    onClick={onClick}
    type="button"
    className={`${customBg} backdrop-blur-xl border border-white/60 p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(26,61,61,0.12)] transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 min-h-[180px] md:min-h-[210px] flex flex-col justify-center items-center text-center group cursor-pointer w-full outline-none focus:ring-4 focus:ring-[#2D6A6A]/10`}
  >
    <Icon strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-3 group-hover:scale-110 group-hover:-translate-y-1 group-hover:text-[#1A3D3D] transition-all duration-300" />
    <h2 className="text-[17px] md:text-[21px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">{titulo}</h2>
    <p className="text-[#333333]/70 font-medium text-[14px] md:text-[15px] px-2 mb-3 leading-normal">{descripcion}</p>
    <span className="text-[13px] font-bold text-[#2D6A6A] group-hover:text-[#1A3D3D] flex items-center gap-1 transition-colors mt-auto">
      Ingresar <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
    </span>
  </button>
);

function PendingDocUpload({ currentUser }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!currentUser.documentoUrl);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar que Firebase Auth tenga usuario activo
    const { getAuth } = await import('firebase/auth');
    const authUser = getAuth().currentUser;
    if (!authUser) {
      setError('No se detectó tu sesión. Por favor cerrá sesión y volvé a ingresar.');
      return;
    }
    const uid = authUser.uid;

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const fileRef = ref(storage, `validaciones/${uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const pct = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
          setProgress(pct);
        },
        (err) => {
          console.error("Error subiendo:", err);
          setError('Hubo un error al subir el archivo. Intentá de nuevo.');
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'usuarios', uid), { documentoUrl: url });
          setUploaded(true);
          setUploading(false);
        }
      );
    } catch (err) {
      console.error("Error general:", err);
      setError('Error inesperado. Revisá tu conexión.');
      setUploading(false);
    }
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
      <label className={`w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${uploading ? 'border-[#2D6A6A] bg-[#2D6A6A]/5 cursor-not-allowed' : 'border-[#2D6A6A]/40 hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5 cursor-pointer'}`}>
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-[#2D6A6A] animate-spin" />
            <span className="text-sm font-bold text-[#2D6A6A]">{progress}% subiendo...</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-[#2D6A6A]" />
            <span className="text-sm font-bold text-[#2D6A6A]">Subir foto o PDF</span>
            <span className="text-xs text-[#666666] font-medium">JPG, PNG o PDF — máx. 10MB</span>
          </>
        )}
        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
      </label>
      <label className="mt-2 w-full py-3 rounded-xl border border-[#2D6A6A]/20 bg-white flex items-center justify-center gap-2 cursor-pointer hover:border-[#2D6A6A] hover:bg-[#2D6A6A]/5 transition-all md:hidden">
        <Camera className="w-5 h-5 text-[#2D6A6A]" />
        <span className="text-sm font-bold text-[#2D6A6A]">Sacar foto con cámara</span>
        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

export default function Ecosistema() {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { currentUser, loading, logout } = useAuth();
  
  const activeRole = currentUser?.rol || 'visitante';
  const [mostrarTour, setMostrarTour] = useState(false);

  useEffect(() => {
    setTimeout(() => setMostrarTour(true), 800);
  }, []);

const handlePasoTour = (paso) => {
    if (paso?.cerrarNotif) {
      setIsNotifOpen(false);
     setTimeout(() => {
        window.scrollBy({ top: 200, behavior: 'instant' });
      }, 50);
    }
  };

  const PASOS_TOUR = {
    profesional: [
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil profesional', desc: 'Desde acá completás tu portfolio: foto, trayectoria, servicios y casos clínicos para que te encuentren en la cartilla.' },
      { targetId: 'tour-cursos', titulo: 'Capacitaciones', desc: 'Explorá cursos y especializaciones del sector. También podés publicar los tuyos si sos docente.' },
      { targetId: 'tour-empleos', titulo: 'Bolsa de trabajo', desc: 'Encontrá oportunidades laborales o marcate como disponible para que las clínicas te contacten.' },
      { targetId: 'tour-colegas', titulo: 'Red de colegas', desc: 'Buscá especialistas para derivaciones e interconsultas dentro de la comunidad.' },
     { targetId: 'tour-proveedores', titulo: 'Cartilla de proveedores', desc: 'Directorio de distribuidores y laboratorios con los que podés trabajar.' },
      { targetId: 'tour-publicaciones', titulo: 'Publicaciones científicas', desc: 'Papers, novedades y actualizaciones del mundo veterinario para mantenerte al día.' },
      { targetId: 'tour-actividad', titulo: 'Tu actividad', desc: 'Acá aparecen las novedades importantes: cursos nuevos, inscripciones y actualizaciones de la red.', cerrarNotif: true },
     ],
    clinica: [
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil institucional', desc: 'Completá los datos de tu clínica: servicios, staff médico, horarios y contacto para aparecer en la cartilla.' },
      { targetId: 'tour-cursos', titulo: 'Capacitaciones', desc: 'Explorá y publicá cursos para la comunidad veterinaria.' },
      { targetId: 'tour-empleos', titulo: 'Bolsa de trabajo', desc: 'Publicá búsquedas de personal especializado para tu institución.' },
      { targetId: 'tour-colegas', titulo: 'Red de colegas', desc: 'Encontrá profesionales disponibles para sumar a tu equipo o para derivaciones.' },
     { targetId: 'tour-proveedores', titulo: 'Cartilla de proveedores', desc: 'Directorio de distribuidores y laboratorios de confianza.' },
      { targetId: 'tour-publicaciones', titulo: 'Publicaciones científicas', desc: 'Papers, novedades y actualizaciones del mundo veterinario para mantenerte al día.' },
      { targetId: 'tour-actividad', titulo: 'Tu actividad', desc: 'Novedades del sector, nuevos profesionales disponibles y actualizaciones importantes.' },
    ],
    alumnx: [
      { targetId: 'tour-editar-perfil', titulo: 'Tu perfil', desc: 'Completá tu perfil para aparecer en búsquedas y mostrar tu trayectoria académica.' },
      { targetId: 'tour-cursos', titulo: 'Capacitaciones', desc: 'Explorá cursos y especializaciones pensados para estudiantes y recién recibidos.' },
      { targetId: 'tour-empleos', titulo: 'Bolsa de trabajo', desc: 'Marcate como disponible para que las clínicas puedan encontrarte.' },
      { targetId: 'tour-actividad', titulo: 'Tu actividad', desc: 'Novedades y oportunidades relevantes para vos.' },
    ],
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login'); 
    }
  }, [currentUser, loading, navigate]);

  // Función para manejar el deslogueo correctamente
  const handleLogout = async () => {
    try {
      if (logout) await logout(); // Llama a la función de tu context
      navigate('/');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  // Pantalla de carga suave mientras valida la sesión
  if (loading) return <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center text-[#2D6A6A] font-bold">Cargando ecosistema...</div>;
  if (!currentUser) return null;

  const necesitaValidacion = currentUser.rol === 'profesional' || currentUser.rol === 'clinica';
  if (necesitaValidacion && currentUser.estado !== 'activo') {
    return (
      <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-[#2D6A6A]" />
          </div>
          <h1 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">Tu cuenta está siendo verificada</h1>
          <p className="text-[#666666] text-[15px] font-medium mb-8 leading-relaxed">
            Para garantizar la calidad de El Portal, verificamos la identidad de cada profesional y clínica antes de darles acceso completo. Este proceso tarda menos de 48 horas hábiles.
          </p>
          <div className="bg-[#F4F7F7] rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-[#1A3D3D] text-sm uppercase tracking-widest mb-4">
              {currentUser.rol === 'profesional' ? '📄 Subí tu título universitario' : '📄 Subí tu habilitación municipal'}
            </h3>
            <p className="text-[#666666] text-sm font-medium mb-4 leading-relaxed">
              {currentUser.rol === 'profesional' 
                ? 'Una foto o escaneo de tu título de Médico Veterinario. Debe verse claramente tu nombre y número de matrícula.' 
                : 'Una foto o escaneo de la habilitación municipal de la clínica a tu nombre.'}
            </p>
            <PendingDocUpload currentUser={currentUser} />
          </div>
          <p className="text-[#666666] text-xs font-medium mb-6 bg-[#F4F7F7] rounded-xl p-4">
            Si no tenés el documento a mano, podés cerrar sesión y volver a ingresar cuando lo tengas listo. Tu cuenta quedará guardada.
          </p>
          <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.estado === 'rechazado') {
    return (
      <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">Solicitud rechazada</h1>
          <p className="text-[#666666] text-[15px] font-medium mb-6 leading-relaxed">
            Tu solicitud de ingreso no fue aprobada. Si creés que es un error, escribinos a <strong>soporte@elportalvet.com</strong>.
          </p>
          <p className="text-[#666666] text-xs font-medium mb-6 bg-[#F4F7F7] rounded-xl p-4">
            Si no tenés el documento a mano, podés cerrar sesión y volver a ingresar cuando lo tengas listo. Tu cuenta quedará guardada.
          </p>
          <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.estado === 'pendiente') {
    return (
      <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-[#2D6A6A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-[#2D6A6A]" />
          </div>
          <h1 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">Tu cuenta está siendo verificada</h1>
          <p className="text-[#666666] text-[15px] font-medium mb-8 leading-relaxed">
            Para garantizar la calidad de El Portal, verificamos la identidad de cada profesional y clínica antes de darles acceso completo. Este proceso tarda menos de 48 horas hábiles.
          </p>
          <div className="bg-[#F4F7F7] rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-[#1A3D3D] text-sm uppercase tracking-widest mb-4">
              {currentUser.rol === 'profesional' ? '📄 Subí tu título universitario' : '📄 Subí tu habilitación municipal'}
            </h3>
            <p className="text-[#666666] text-sm font-medium mb-4 leading-relaxed">
              {currentUser.rol === 'profesional' 
                ? 'Una foto o escaneo de tu título de Médico Veterinario. Debe verse claramente tu nombre y número de matrícula.' 
                : 'Una foto o escaneo de la habilitación municipal de la clínica a tu nombre.'}
            </p>
            <PendingDocUpload currentUser={currentUser} />
          </div>
          <p className="text-[#666666] text-xs font-medium mb-6 bg-[#F4F7F7] rounded-xl p-4">
            Si no tenés el documento a mano, podés cerrar sesión y volver a ingresar cuando lo tengas listo. Tu cuenta quedará guardada.
          </p>
          <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.estado === 'rechazado') {
    return (
      <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-[#1A3D3D] font-['Montserrat'] mb-3">Solicitud rechazada</h1>
          <p className="text-[#666666] text-[15px] font-medium mb-6 leading-relaxed">
            Tu solicitud de ingreso no fue aprobada. Si creés que es un error, escribinos a <strong>soporte@elportalvet.com</strong>.
          </p>
          <p className="text-[#666666] text-xs font-medium mb-6 bg-[#F4F7F7] rounded-xl p-4">
            Si no tenés el documento a mano, podés cerrar sesión y volver a ingresar cuando lo tengas listo. Tu cuenta quedará guardada.
          </p>
          <button onClick={handleLogout} className="text-[#666666] text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" /> Cerrar sesión por ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] p-4 md:p-10 lg:p-12 relative overflow-hidden selection:bg-[#2D6A6A] selection:text-white">
      
      {/* Background Ambience (Burbujas generales de fondo) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[0%] left-[-10%] w-[50vw] h-[50vw] bg-[#2D6A6A]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] bg-[#4DB6AC]/15 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        {/* GRILLA UNIFICADA */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 items-start">
          
          {/* 1. ENCABEZADO */}
          <div className="order-1 lg:col-span-2 w-full flex flex-col justify-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A3D3D] font-['Montserrat'] leading-[1.1] tracking-tight">
                ¡Hola, {currentUser.nombre ? currentUser.nombre.split(' ')[0] : 'Profesional'}! <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D3D] to-[#2D6A6A]">
                  Bienvenidx al ecosistema.
                </span>
              </h1>
              <h3 className="text-[#2D6A6A] font-bold text-[12px] md:text-[13px] uppercase tracking-[0.2em] mb-2 mt-4">
                ¿Qué te gustaría hacer hoy?
              </h3>
            </div>
            
            {/* Acciones de Cuenta */}
            <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2">
              <button 
                onClick={() => navigate(`/profesional/${currentUser?.slug}`)}
                className="bg-white/60 backdrop-blur-md border border-white/50 text-[#1A3D3D] px-4 py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] uppercase tracking-wider hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
              >
                <Eye className="w-4 h-4 text-[#2D6A6A]" /> Ver mi perfil
              </button>

              <button 
                onClick={handleLogout}
                className="bg-[#1A3D3D]/5 hover:bg-red-50 text-[#1A3D3D]/70 hover:text-red-600 px-4 py-2.5 rounded-xl font-bold text-[12px] md:text-[13px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none border border-transparent hover:border-red-100"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          </div>

         {activeRole === 'proveedor' ? (
            <div className="order-2 lg:col-span-1 bg-[#E8EFEF]/80 backdrop-blur-xl border border-[#2D6A6A]/10 rounded-[24px] md:rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden w-full p-5 md:p-6 gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] md:text-[22px] font-black text-[#1A3D3D]/30 font-['Montserrat'] leading-none mt-1">Métricas</h2>
                <span className="bg-[#1A3D3D]/10 text-[#1A3D3D]/40 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                  Próximamente
                </span>
              </div>
              {/* Filas */}
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between bg-[#1A3D3D]/5 rounded-2xl px-4 py-3">
                  <span className="text-[13px] text-[#1A3D3D]/30 font-medium">Visitas a tu perfil</span>
                  <span className="text-[15px] font-black text-[#1A3D3D]/20">--</span>
                </div>
                <div className="flex items-center justify-between bg-[#1A3D3D]/[0.03] rounded-2xl px-4 py-3">
                  <span className="text-[13px] text-[#1A3D3D]/30 font-medium">Clicks a tu catálogo</span>
                  <span className="text-[15px] font-black text-[#1A3D3D]/20">--</span>
                </div>
                <div className="flex items-center justify-between bg-[#1A3D3D]/5 rounded-2xl px-4 py-3">
                  <span className="text-[13px] text-[#1A3D3D]/30 font-medium">Consultas recibidas</span>
                  <span className="text-[15px] font-black text-[#1A3D3D]/20">--</span>
                </div>
              </div>
            </div>
          ) : (
            // El id va directo en el NotificationBox wrapper para que el tour
            // apunte al elemento real y no a un div vacío flotando afuera de la grilla
            <div id="tour-actividad" className="order-2 lg:col-span-1 w-full">
              <NotificationBox 
                isNotifOpen={isNotifOpen} 
                setIsNotifOpen={setIsNotifOpen} 
                userRole={activeRole}
                userId={currentUser?.uid}
              />
            </div>
          )}
       {/* 3. HERRAMIENTAS (Cards adaptables) */}
          <div className={`order-3 w-full grid gap-3 md:gap-6 transition-all duration-500 ${isNotifOpen ? 'lg:col-span-2 grid-cols-2 lg:grid-cols-2' : 'lg:col-span-3 grid-cols-2 lg:grid-cols-3'}`}>
            
            <div id="tour-editar-perfil">
              <DashboardCard 
                titulo="Editar Perfil"
                descripcion="Actualizá tus datos profesionales y de contacto"
                icon={User}
                onClick={() => navigate(activeRole === 'clinica' ? '/editor-clinica' : activeRole === 'proveedor' ? '/editor-proveedores' : '/editor-profesional')}
              />
            </div>

          

            {activeRole === 'proveedor' && (
              <DashboardCard 
                titulo="Mi Catálogo"
                descripcion="Gestioná tus productos y servicios veterinarios"
                icon={Store}
                customBg="bg-white/80"
                onClick={() => navigate('/editor-proveedores', { state: { tab: 'productos' } })}
              />
            )}

            {activeRole !== 'proveedor' && (
              <div id="tour-cursos" className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[24px] md:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden min-h-[180px] md:min-h-[210px]">
                <button
                  onClick={() => navigate('/capacitaciones')}
                  className="flex-1 flex flex-col justify-center items-center text-center p-5 hover:bg-white/90 transition-all group"
                >
                  <BookOpen strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A6A] mb-2 group-hover:scale-110 group-hover:text-[#1A3D3D] transition-all duration-300" />
                  <h2 className="text-[17px] md:text-[19px] font-black text-[#1A3D3D] font-['Montserrat'] mb-1 leading-tight">Cursos</h2>
                  <p className="text-[#333333]/70 font-medium text-[13px] px-2 leading-normal">Especializaciones y capacitaciones</p>
                </button>
                <div className="border-t border-gray-100 px-4 py-3">
                  <button
                    onClick={() => navigate('/capacitaciones', { state: { vista: 'miscursos' } })}
                    className="w-full text-[11px] font-bold text-[#2D6A6A] uppercase tracking-widest hover:text-[#1A3D3D] transition-colors flex items-center justify-center gap-1.5 py-1"
                  >
                    <BookOpen className="w-3 h-3" /> Ver mis cursos publicados
                  </button>
                </div>
              </div>
            )}

            {activeRole !== 'proveedor' && (
              <div id="tour-empleos">
              <DashboardCard 
                titulo="Empleos"
                descripcion="Bolsa de trabajo y búsqueda de talentos activos"
                icon={Briefcase}
                onClick={() => navigate('/bolsa-de-trabajo')}
              />
               </div>
            )}

            {activeRole !== 'proveedor' && (
              <div id="tour-colegas">
                <DashboardCard 
                  titulo="Colegas"
                  descripcion="Red de contactos para derivaciones e interconsultas"
                  icon={Users}
                  onClick={() => navigate('/cartilla')}
                />
              </div>
            )}

            <div id="tour-proveedores">
              <DashboardCard 
                titulo="Proveedores"
                descripcion="Directorio de distribuidores y laboratorios de confianza"
                icon={Package}
                onClick={() => navigate('/cartilla-proveedores')}
              />
            </div>

           {activeRole !== 'proveedor' && (
              <div id="tour-publicaciones">
                <DashboardCard 
                  titulo="Publicaciones cientificas"
                  descripcion="Actualizaciones y papers de la comunidad veterinaria"
                  icon={Newspaper}
                  onClick={() => navigate('/papers')}
                />
              </div>
            )}

          </div>
        </div>
      </div>
   {mostrarTour && PASOS_TOUR[activeRole] && (
        <TourGuia
          pasos={PASOS_TOUR[activeRole]}
          userId={currentUser?.uid}
          claveStorage="ecosistema"
          onFin={() => setMostrarTour(false)}
          onPaso={handlePasoTour}
        />
      )}
    </div>
  );
}