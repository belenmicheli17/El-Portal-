import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { BotonCompartirLink, armarLinkPerfil } from '../../components/CompartirPerfil';
import { etiquetaAlumnx, ADMIN_UID } from '../../utils/bolsa';
import { GraduationCap, MapPin, Instagram, Linkedin, Pencil, Clock, Briefcase } from 'lucide-react';

// Perfil público de alumno/a. Se abre solo con el link: no está en la Cartilla, ni en el sitemap, ni en Google.
export default function PerfilAlumnx() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'alumnos'), where('slug', '==', slug)));
        if (!cancelado) setData(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch (e) {
        console.error('Error cargando el perfil:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, [slug]);

  // Título de la pestaña y aviso a los buscadores de que no lo indexen
  useEffect(() => {
    const tituloAnterior = document.title;
    let robots = document.querySelector('meta[name="robots"]');
    const creado = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    const robotsAnterior = robots.content;
    robots.content = 'noindex, nofollow';
    if (data) document.title = `${data.nombreCompleto || 'Estudiante'} | ${etiquetaAlumnx(data.tituloGenero)} | Portal Veterinario`;
    return () => {
      document.title = tituloAnterior;
      if (creado) robots.remove();
      else robots.content = robotsAnterior;
    };
  }, [data]);

  const esDuena = !!data && currentUser?.uid === data.id;
  const esAdmin = currentUser?.uid === ADMIN_UID || currentUser?.rol === 'admin';
  // Mientras no está verificado, solo lo ven la dueña y la admin
  const puedeVerlo = !!data && (data.visible !== false || esDuena || esAdmin);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F4F7F7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2D6A6A]/20 border-t-[#2D6A6A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!puedeVerlo) {
    return (
      <div className="min-h-[70vh] bg-[#F4F7F7] flex items-center justify-center px-4 py-16 font-['Inter']">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 max-w-md w-full text-center flex flex-col items-center gap-4">
          <h2 className="text-[22px] font-black text-[#1A3D3D] font-['Montserrat'] leading-tight">Perfil no encontrado</h2>
          <p className="text-[#666666] text-[15px] leading-relaxed font-medium">El perfil que buscás no existe o el enlace es incorrecto.</p>
          <button type="button" onClick={() => navigate(-1)} className="w-full px-6 py-3 rounded-xl font-bold text-[13px] bg-[#2D6A6A] text-white hover:bg-[#1A3D3D] transition-colors shadow-md">
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  const ubicacion = [data.localidad, data.provincia].filter(Boolean).join(', ');
  const experiencias = (data.trayectoria || []).filter((t) => t.titulo);
  const link = armarLinkPerfil('alumnx', data.slug);

  return (
    <div className="min-h-screen bg-[#F4F7F7] font-['Inter'] text-[#333333] px-4 pt-10 pb-20">
      <div className="max-w-[720px] mx-auto flex flex-col gap-5">
        {/* Aviso para la dueña mientras espera la verificación */}
        {esDuena && data.visible === false && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-2xl px-4 py-3 text-[14px] font-medium leading-snug flex gap-2">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Tu perfil se va a poder ver con el link cuando verifiquemos tu certificado. Mientras, lo ves solo vos.</span>
          </div>
        )}

        {/* Encabezado */}
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgba(26,61,61,0.06)] p-6 md:p-10 text-center">
          {data.foto ? (
            <img src={data.foto} alt={data.nombreCompleto} className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto border-4 border-white shadow-md" />
          ) : (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center mx-auto">
              <GraduationCap className="w-12 h-12" strokeWidth={1.5} />
            </div>
          )}
          <span className="inline-block mt-5 bg-rose-50 text-rose-500 text-[12px] font-bold uppercase tracking-[0.12em] rounded-full px-3.5 py-1.5">
            {etiquetaAlumnx(data.tituloGenero)} de Veterinaria
          </span>
          <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[34px] leading-tight tracking-tight mt-3 break-words">
            {data.nombreCompleto}
          </h1>
          {data.universidad && (
            <p className="flex items-center justify-center gap-2 text-[16px] font-semibold text-[#2D6A6A] mt-3">
              <GraduationCap className="w-5 h-5 shrink-0" /> {data.universidad}
            </p>
          )}
          {ubicacion && (
            <p className="flex items-center justify-center gap-2 text-[15px] font-medium text-[#666666] mt-1.5">
              <MapPin className="w-4 h-4 shrink-0" /> {ubicacion}
            </p>
          )}

          {(data.redes?.instagram || data.redes?.linkedin) && (
            <div className="flex justify-center gap-2.5 mt-5">
              {data.redes?.instagram && (
                <a href={data.redes.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2.5 bg-[#F4F7F7] text-[#2D6A6A] rounded-xl hover:bg-[#2D6A6A] hover:text-white transition-all"><Instagram className="w-5 h-5" /></a>
              )}
              {data.redes?.linkedin && (
                <a href={data.redes.linkedin.startsWith('http') ? data.redes.linkedin : `https://${data.redes.linkedin}`} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="p-2.5 bg-[#F4F7F7] text-[#2D6A6A] rounded-xl hover:bg-[#2D6A6A] hover:text-white transition-all"><Linkedin className="w-5 h-5" /></a>
              )}
            </div>
          )}

          {esDuena && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
              <button type="button" onClick={() => navigate('/onboarding-alumnx')} className="inline-flex items-center justify-center gap-2 bg-white text-[#1A3D3D] border border-gray-200 rounded-xl px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-all hover:border-[#2D6A6A]">
                <Pencil className="w-4 h-4" /> Editar mi perfil
              </button>
              {data.visible !== false && (
                <BotonCompartirLink titulo={data.nombreCompleto} texto="Mirá mi perfil en el Portal Veterinario" url={link} variante="principal" etiqueta="Compartir mi perfil" />
              )}
            </div>
          )}
        </section>

        {/* Sobre mí */}
        {data.presentacion && (
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-3">Sobre mí</h2>
            <p className="text-[16px] md:text-[17px] leading-relaxed text-[#333333] whitespace-pre-line">{data.presentacion}</p>
          </section>
        )}

        {/* Experiencia */}
        {experiencias.length > 0 && (
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-[#2D6A6A] mb-4">Experiencia</h2>
            <ul className="flex flex-col gap-4">
              {experiencias.map((t) => (
                <li key={t.id || t.titulo} className="flex gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#F4F7F7] text-[#2D6A6A] flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4" /></span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-[#1A3D3D] leading-snug">{t.titulo}</p>
                    {t.desc && <p className="text-[14px] font-medium text-[#666666] mt-0.5">{t.desc}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-[13px] font-medium text-[#666666] mt-2">
          Perfil de estudiante del Portal Veterinario
        </p>
      </div>
    </div>
  );
}
