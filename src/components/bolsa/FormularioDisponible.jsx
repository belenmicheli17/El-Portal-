import React, { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ChevronLeft, Loader2, X, ChevronDown } from 'lucide-react';
import { db } from '../../firebase';
import provincias from '../../data/provincias.js';
import { GRUPOS_AREAS, TODAS_LAS_AREAS, JORNADAS, HORARIOS, EXPERIENCIAS, FORMAS_CONTACTO_DISPONIBLE, MAX_AREAS_DISPONIBLE } from '../../data/bolsaOpciones';
import { nuevoVencimiento, conPrefijo54, serviciosDePerfil } from '../../utils/bolsa';
import { BuscadorDireccionGoogle, CampoWhatsapp, esEmailValido, whatsappCompleto } from '../editor/EditorComponents';
import { SelectorPills, CampoBolsa } from './ElementosBolsa';
import CajaCV, { useMiCV } from './CajaCV';

const claseCaja = "bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm mb-5";
const claseInput = "w-full border border-gray-200 focus:border-[#2D6A6A] rounded-2xl px-4 py-3 text-[15px] text-[#333333] focus:outline-none bg-gray-50/50";

const FORMULARIO_VACIO = {
  areas: [],
  notaAreas: '',
  provincia: '',
  zonas: [],
  jornada: [],
  horario: [],
  experiencia: '',
  buscando: '',
  tipoContacto: ['whatsapp'],
  whatsapp: '',
  email: '',
  mostrarCV: true
};

export default function FormularioDisponible({ currentUser, onVolver, onGuardada }) {
  const uid = currentUser.uid;
  const { cv, setCv } = useMiCV(uid);
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [existe, setExiste] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [textoZona, setTextoZona] = useState('');
  const [verTodas, setVerTodas] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  // Precargamos todo lo que ya está en el perfil, o lo que cargó la vez anterior
  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      try {
        const [snapPerfil, snapDisp, snapContacto] = await Promise.all([
          getDoc(doc(db, 'profesionales', uid)),
          getDoc(doc(db, 'profesionalesDisponibles', uid)),
          getDoc(doc(db, 'profesionalesDisponibles', uid, 'privado', 'contacto')).catch(() => null)
        ]);
        if (cancelado) return;
        const datosPerfil = snapPerfil.exists() ? snapPerfil.data() : {};
        setPerfil(datosPerfil);

        if (snapDisp.exists()) {
          const d = snapDisp.data();
          const c = snapContacto?.exists() ? snapContacto.data() : {};
          setExiste(true);
          setForm({
            ...FORMULARIO_VACIO,
            areas: d.areas || [],
            notaAreas: d.notaAreas || '',
            provincia: d.provincia || '',
            zonas: d.zonas || [],
            jornada: d.jornada || [],
            horario: d.horario || [],
            experiencia: d.experiencia || '',
            buscando: d.buscando || '',
            tipoContacto: c.tipoContacto || ['whatsapp'],
            whatsapp: c.whatsapp || conPrefijo54(datosPerfil.whatsappNum),
            email: c.email || datosPerfil.emailContacto || '',
            mostrarCV: c.cvUrl ? true : (c.mostrarCV ?? true)
          });
        } else {
          const deSuPerfil = serviciosDePerfil(datosPerfil).filter((s) => TODAS_LAS_AREAS.includes(s));
          setForm({
            ...FORMULARIO_VACIO,
            areas: deSuPerfil.slice(0, MAX_AREAS_DISPONIBLE),
            provincia: datosPerfil.provincia || '',
            whatsapp: conPrefijo54(datosPerfil.whatsappNum),
            email: datosPerfil.emailContacto || '',
            tipoContacto: datosPerfil.whatsappNum ? ['whatsapp'] : ['perfil']
          });
        }
      } catch (e) {
        console.error('Error cargando el perfil:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };
    cargar();
    return () => { cancelado = true; };
  }, [uid]);

  // Áreas del perfil primero; el resto, en "Ver todas"
  const areasDelPerfil = [...new Set([...serviciosDePerfil(perfil).filter((s) => TODAS_LAS_AREAS.includes(s)), ...form.areas])];

  const agregarZona = (lugar) => {
    const zona = { localidad: lugar.localidad || lugar.nombre || '', barrio: lugar.barrio || '', provincia: lugar.provincia || '', placeId: lugar.placeId || '' };
    if (!zona.localidad && !zona.barrio) return;
    setForm((prev) => ({
      ...prev,
      provincia: prev.provincia || zona.provincia,
      zonas: prev.zonas.some((z) => z.placeId && z.placeId === zona.placeId) ? prev.zonas : [...prev.zonas, zona].slice(0, 6)
    }));
    setTextoZona('');
  };

  const validar = () => {
    const e = {};
    if (form.areas.length === 0) e.areas = 'Elegí al menos un área.';
    if (!form.provincia) e.provincia = 'Elegí la provincia.';
    if (form.jornada.length === 0) e.jornada = 'Elegí al menos una jornada.';
    if (!form.experiencia) e.experiencia = 'Elegí tu experiencia.';
    if (!form.buscando.trim()) e.buscando = 'Contá brevemente qué buscás.';
    if (form.tipoContacto.length === 0) e.tipoContacto = 'Elegí al menos una forma de contacto.';
    if (form.tipoContacto.includes('whatsapp') && !whatsappCompleto(form.whatsapp)) e.whatsapp = 'Revisá el número de WhatsApp.';
    if (form.tipoContacto.includes('email') && !esEmailValido(form.email)) e.email = 'Revisá el mail.';
    if (form.tipoContacto.includes('perfil') && !perfil?.slug && !currentUser.slug) e.tipoContacto = 'Tu perfil todavía no tiene link. Elegí WhatsApp o mail.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setGuardando(true);
    try {
      const nombre = `${perfil?.nombre || ''} ${perfil?.apellido || ''}`.trim() || currentUser.nombre || '';
      const foto = typeof perfil?.foto === 'string' && !perfil.foto.startsWith('data:') ? perfil.foto : '';
      const datos = {
        creadorId: uid,
        nombre,
        foto,
        slug: perfil?.slug || currentUser.slug || '',
        especialidad: perfil?.especialidad || '',
        areas: form.areas,
        notaAreas: form.notaAreas.trim(),
        provincia: form.provincia,
        zonas: form.zonas,
        jornada: form.jornada,
        horario: form.horario,
        experiencia: form.experiencia,
        buscando: form.buscando.trim(),
        actualizadaEn: serverTimestamp()
      };
      if (!existe) {
        Object.assign(datos, { estado: 'activo', vencimientoMillis: nuevoVencimiento(), publicadaEn: serverTimestamp(), createdAt: serverTimestamp() });
      }

      const lote = writeBatch(db);
      lote.set(doc(db, 'profesionalesDisponibles', uid), datos, { merge: existe });
      lote.set(doc(db, 'profesionalesDisponibles', uid, 'privado', 'contacto'), {
        tipoContacto: form.tipoContacto,
        whatsapp: form.tipoContacto.includes('whatsapp') ? conPrefijo54(form.whatsapp) : '',
        email: form.tipoContacto.includes('email') ? form.email.trim() : '',
        mostrarCV: form.mostrarCV,
        cvUrl: form.mostrarCV && cv?.url ? cv.url : ''
      });
      await lote.commit();
      onGuardada(existe ? 'Tus datos de disponible se actualizaron.' : 'Ya figurás como disponible por 30 días.');
    } catch (e) {
      console.error('Error guardando la disponibilidad:', e);
      setErrores({ general: 'No pudimos guardar. Revisá tu conexión e intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-[#2D6A6A] animate-spin" /></div>;
  }

  const hayErrores = Object.values(errores).some(Boolean);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 lg:pt-10 pb-16 font-['Inter'] relative z-10 animate-in fade-in duration-300">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-6">
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>

      <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[36px] leading-tight tracking-tight mb-2">
        {existe ? 'Editar mi disponibilidad' : 'Marcarme como disponible'}
      </h1>
      <p className="text-[15px] text-[#666666] mb-8">Tu nombre y tu foto salen de tu perfil. Figurás como disponible por 30 días y lo podés renovar gratis.</p>

      {hayErrores && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-[14px] font-semibold mb-5">
          {errores.general || 'Faltan completar algunos datos. Revisá los campos marcados en rojo.'}
        </div>
      )}

      <section className={claseCaja}>
        <CampoBolsa titulo="¿En qué áreas querés que te llamen?" requerido ayuda={`Elegí hasta ${MAX_AREAS_DISPONIBLE}, las principales. Vienen precargadas de tu perfil.`} error={errores.areas}>
          {areasDelPerfil.length > 0 && (
            <SelectorPills opciones={areasDelPerfil} seleccion={form.areas} onCambio={(v) => cambiar('areas', v)} maximo={MAX_AREAS_DISPONIBLE} />
          )}
          <button type="button" onClick={() => setVerTodas((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2D6A6A] mt-4">
            <ChevronDown className={`w-4 h-4 transition-transform ${verTodas ? 'rotate-180' : ''}`} /> {verTodas ? 'Ocultar el resto de las áreas' : 'Ver todas las áreas'}
          </button>
          {verTodas && (
            <div className="flex flex-col gap-5 mt-4">
              {GRUPOS_AREAS.map((g) => (
                <div key={g.id}>
                  <p className="text-[12px] font-bold text-[#666666] mb-2">{g.grupo}</p>
                  <SelectorPills
                    opciones={g.opciones}
                    seleccion={form.areas.filter((a) => g.opciones.includes(a))}
                    onCambio={(elegidasGrupo) => {
                      const resto = form.areas.filter((a) => !g.opciones.includes(a));
                      cambiar('areas', [...resto, ...elegidasGrupo].slice(0, MAX_AREAS_DISPONIBLE));
                    }}
                    maximo={MAX_AREAS_DISPONIBLE - form.areas.filter((a) => !g.opciones.includes(a)).length}
                  />
                </div>
              ))}
            </div>
          )}
        </CampoBolsa>

        <CampoBolsa titulo="Nota sobre tus áreas" ayuda="Opcional. Por ejemplo: «Ecografía abdominal, no cardíaca».">
          <input value={form.notaAreas} onChange={(e) => cambiar('notaAreas', e.target.value)} maxLength={200} className={claseInput} />
        </CampoBolsa>
      </section>

      <section className={claseCaja}>
        <CampoBolsa titulo="Provincia" requerido error={errores.provincia}>
          <select value={form.provincia} onChange={(e) => cambiar('provincia', e.target.value)} className={claseInput}>
            <option value="">Elegí una provincia</option>
            {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </CampoBolsa>

        <CampoBolsa titulo="Localidades o barrios donde querés trabajar" ayuda="Opcional. Podés sumar varias (hasta 6).">
          <BuscadorDireccionGoogle id="zonaDisponible" valor={textoZona} onEscribir={setTextoZona} onElegir={agregarZona} placeholder="Ej: Morón, Palermo, Rosario" listaProvincias={provincias} />
          {form.zonas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.zonas.map((z, i) => (
                <span key={`${z.placeId}-${i}`} className="inline-flex items-center gap-1.5 bg-[#2D6A6A]/10 text-[#1A3D3D] rounded-full pl-3.5 pr-2 py-1.5 text-[13px] font-semibold">
                  {z.localidad || z.barrio}
                  <button type="button" aria-label="Quitar" onClick={() => cambiar('zonas', form.zonas.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
          )}
        </CampoBolsa>

        <CampoBolsa titulo="Jornada" requerido error={errores.jornada}>
          <SelectorPills opciones={JORNADAS} seleccion={form.jornada} onCambio={(v) => cambiar('jornada', v)} />
        </CampoBolsa>

        <CampoBolsa titulo="Horario">
          <SelectorPills opciones={HORARIOS} seleccion={form.horario} onCambio={(v) => cambiar('horario', v)} />
        </CampoBolsa>

        <CampoBolsa titulo="Experiencia" requerido error={errores.experiencia}>
          <SelectorPills opciones={EXPERIENCIAS} seleccion={form.experiencia} onCambio={(v) => cambiar('experiencia', v)} multiple={false} />
        </CampoBolsa>

        <CampoBolsa titulo="¿Qué estás buscando?" requerido error={errores.buscando}>
          <textarea value={form.buscando} onChange={(e) => cambiar('buscando', e.target.value)} rows={3} maxLength={300} placeholder="Ej: Busco guardias de fin de semana en zona oeste." className={`${claseInput} resize-none`} />
          <p className="text-[12px] text-[#666666] text-right mt-1">{form.buscando.length}/300</p>
        </CampoBolsa>
      </section>

      <section className={claseCaja}>
        <CampoBolsa titulo="¿Cómo querés que te contacten?" requerido ayuda="Solo lo ven clínicas y profesionales registrados." error={errores.tipoContacto}>
          <SelectorPills opciones={FORMAS_CONTACTO_DISPONIBLE} seleccion={form.tipoContacto} onCambio={(v) => cambiar('tipoContacto', v)} />
          <p className="text-[12px] text-[#666666] mt-2">Te recomendamos WhatsApp: es lo que más usan las clínicas.</p>
        </CampoBolsa>

        {form.tipoContacto.includes('whatsapp') && (
          <div className="mb-5">
            <CampoWhatsapp id="whatsappDisponible" label="WhatsApp" requerido valor={form.whatsapp} onCambio={(v) => cambiar('whatsapp', v)} />
            {errores.whatsapp && <p className="text-[12px] font-semibold text-red-600 mt-2">{errores.whatsapp}</p>}
          </div>
        )}
        {form.tipoContacto.includes('email') && (
          <div className="mb-5">
            <p className="text-[14px] font-bold text-[#1A3D3D] mb-2">Mail <span className="text-red-500">*</span></p>
            <input type="email" value={form.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="tu@mail.com" className={claseInput} />
            {errores.email && <p className="text-[12px] font-semibold text-red-600 mt-2">{errores.email}</p>}
          </div>
        )}

        <CampoBolsa titulo="Tu CV" ayuda="Opcional. Es el mismo que se guarda en tu editor.">
          <CajaCV uid={uid} cv={cv} setCv={setCv} />
          {cv && (
            <label className="flex items-center gap-2 mt-3 text-[14px] text-[#333333] cursor-pointer">
              <input type="checkbox" checked={form.mostrarCV} onChange={(e) => cambiar('mostrarCV', e.target.checked)} className="w-4 h-4 accent-[#2D6A6A]" />
              Que las clínicas registradas puedan ver mi CV
            </label>
          )}
        </CampoBolsa>
      </section>

      <button type="button" onClick={guardar} disabled={guardando} className="w-full bg-[#2D6A6A] hover:bg-[#1A3D3D] disabled:opacity-70 text-white py-4 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-md">
        {guardando && <Loader2 className="w-5 h-5 animate-spin" />}
        {existe ? 'Guardar cambios' : 'Marcarme como disponible'}
      </button>
    </div>
  );
}
