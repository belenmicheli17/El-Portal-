import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ChevronLeft, Loader2, Plus, MapPin, Check } from 'lucide-react';
import { db, auth } from '../../firebase';
import provincias from '../../data/provincias.js';
import { ROLES, ROLES_VISIBLES, rolSinAreas, ZONAS_BA, JORNADAS, HORARIOS, EXPERIENCIAS, REQUISITOS, EQUIPO } from '../../data/bolsaOpciones';
import { nuevoVencimiento, conPrefijo54 } from '../../utils/bolsa';
import { BuscadorDireccionGoogle, CampoWhatsapp, esEmailValido, whatsappCompleto } from '../editor/EditorComponents';
import { SelectorPills, SelectorAreas, CampoBolsa, irAlPrimerError } from './ElementosBolsa';

const claseCaja = "bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm mb-5";
const claseInput = "w-full border border-gray-200 focus:border-[#2D6A6A] rounded-2xl px-4 py-3 text-[15px] text-[#333333] focus:outline-none bg-gray-50/50";

const FORMULARIO_VACIO = {
  rol: 'veterinario',
  areas: [],
  jornada: [],
  notaJornada: '',
  horario: [],
  experiencia: '',
  descripcion: '',
  requisitos: [],
  equipo: [],
  ubicacionId: 'principal',
  otraDireccion: null,
  zonaBA: '',
  tipoContacto: ['whatsapp'],
  whatsapp: '',
  email: ''
};

// Lugares donde puede ser el puesto: sede principal, otras sedes, o una dirección solo para esta oferta
const lugaresDeClinica = (clinica) => {
  const lista = [];
  if (clinica?.direccion) {
    lista.push({ id: 'principal', nombre: 'Sede principal', direccion: clinica.direccion, provincia: clinica.provincia, localidad: clinica.localidad, barrio: clinica.barrio, placeId: clinica.placeId, lat: clinica.lat, lng: clinica.lng });
  }
  (clinica?.sedes || []).forEach((s) => {
    lista.push({ id: String(s.id), nombre: s.nombre || 'Otra sede', direccion: s.direccion, provincia: s.provincia, localidad: s.localidad, barrio: s.barrio, placeId: s.placeId, lat: s.lat, lng: s.lng });
  });
  return lista;
};

// El equipamiento que la clínica ya marcó en su página viene elegido de entrada
const equipoDeClinica = (clinica) => {
  const grupo = clinica?.servicios?.equipamiento_infraestructura;
  return grupo?.activo ? (grupo.subOpcionesSeleccionadas || []).filter((e) => EQUIPO.includes(e)) : [];
};

// Orden de los campos en la pantalla (para bajar hasta el primero que falta) y cómo se llaman en el aviso
const ORDEN_CAMPOS = ['rol', 'areas', 'jornada', 'experiencia', 'descripcion', 'ubicacionId', 'zonaBA', 'tipoContacto', 'whatsapp', 'email'];
const NOMBRES_CAMPOS = {
  rol: 'puesto', areas: 'especialidad', jornada: 'jornada', experiencia: 'experiencia', descripcion: 'sobre el puesto',
  ubicacionId: 'dónde es el puesto', zonaBA: 'zona de Buenos Aires', tipoContacto: 'forma de contacto', whatsapp: 'WhatsApp', email: 'mail'
};

export default function FormularioOferta({ currentUser, ofertaExistente, onVolver, onGuardada }) {
  const [clinica, setClinica] = useState(null);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [requisitoPropio, setRequisitoPropio] = useState('');
  const [equipoPropio, setEquipoPropio] = useState('');
  const [textoOtraDireccion, setTextoOtraDireccion] = useState('');

  const editando = !!ofertaExistente;
  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  // Traemos los datos de la clínica (nombre, logo, sedes, contacto) y, si se edita, la oferta y su contacto
  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, 'clinicas', currentUser.uid));
        const datos = snap.exists() ? snap.data() : {};
        if (cancelado) return;
        setClinica(datos);

        if (ofertaExistente) {
          const snapContacto = await getDoc(doc(db, 'ofertasEmpleo', ofertaExistente.id, 'privado', 'contacto'));
          const contacto = snapContacto.exists() ? snapContacto.data() : {};
          if (cancelado) return;
          const esOtra = ofertaExistente.ubicacionId === 'otra';
          setForm({
            ...FORMULARIO_VACIO,
            ...ofertaExistente,
            otraDireccion: esOtra ? ofertaExistente : null,
            tipoContacto: contacto.tipoContacto || ['whatsapp'],
            whatsapp: contacto.whatsapp || '',
            email: contacto.email || ''
          });
          if (esOtra) setTextoOtraDireccion(ofertaExistente.direccion || '');
        } else {
          const lugares = lugaresDeClinica(datos);
          setForm({
            ...FORMULARIO_VACIO,
            equipo: equipoDeClinica(datos),
            zonaBA: datos.zonaBA || '',
            ubicacionId: lugares[0]?.id || 'otra',
            whatsapp: conPrefijo54(datos.whatsapp),
            email: datos.email || '',
            tipoContacto: datos.whatsapp ? ['whatsapp'] : (datos.email ? ['email'] : ['whatsapp'])
          });
        }
      } catch (e) {
        console.error('Error cargando la clínica:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };
    cargar();
    return () => { cancelado = true; };
  }, [currentUser.uid, ofertaExistente]);

  const lugares = lugaresDeClinica(clinica);
  const lugarElegido = form.ubicacionId === 'otra' ? form.otraDireccion : lugares.find((l) => l.id === form.ubicacionId);

  const agregarPropio = (campo, texto, limpiar) => {
    const limpio = texto.trim();
    if (!limpio) return;
    if (!form[campo].includes(limpio)) cambiar(campo, [...form[campo], limpio]);
    limpiar('');
  };

  const sinAreas = rolSinAreas(form.rol);
  const enBuenosAires = lugarElegido?.provincia === 'Buenos Aires';

  const validar = () => {
    const e = {};
    if (!form.rol) e.rol = 'Elegí el puesto.';
    if (!sinAreas && form.areas.length === 0) e.areas = 'Marcá al menos una especialidad.';
    if (form.jornada.length === 0) e.jornada = 'Elegí al menos una jornada.';
    if (!form.experiencia) e.experiencia = 'Elegí la experiencia que buscás.';
    if (!form.descripcion.trim()) e.descripcion = 'Contá brevemente de qué se trata el puesto.';
    if (!lugarElegido?.direccion) e.ubicacionId = 'Elegí dónde es el puesto.';
    if (lugarElegido?.direccion && enBuenosAires && !form.zonaBA) e.zonaBA = 'Elegí la zona de Buenos Aires.';
    if (form.tipoContacto.length === 0) e.tipoContacto = 'Elegí al menos una forma de contacto.';
    if (form.tipoContacto.includes('whatsapp') && !whatsappCompleto(form.whatsapp)) e.whatsapp = 'Revisá el número de WhatsApp.';
    if (form.tipoContacto.includes('email') && !esEmailValido(form.email)) e.email = 'Revisá el mail.';
    setErrores(e);
    return e;
  };

  const guardar = async () => {
    const encontrados = validar();
    if (Object.keys(encontrados).length) { irAlPrimerError(ORDEN_CAMPOS, encontrados); return; }
    setGuardando(true);
    try {
      const refOferta = editando ? doc(db, 'ofertasEmpleo', ofertaExistente.id) : doc(collection(db, 'ofertasEmpleo'));
      const foto = typeof clinica?.foto === 'string' && !clinica.foto.startsWith('data:') ? clinica.foto : '';
      const datos = {
        creadorId: currentUser.uid,
        rol: form.rol,
        areas: sinAreas ? [] : form.areas,
        jornada: form.jornada,
        notaJornada: form.notaJornada.trim(),
        horario: form.horario,
        experiencia: form.experiencia,
        descripcion: form.descripcion.trim(),
        requisitos: form.requisitos,
        equipo: form.equipo,
        clinicaNombre: clinica?.nombre || currentUser.nombre || '',
        clinicaFoto: foto,
        clinicaSlug: clinica?.slug || currentUser.slug || '',
        ubicacionId: form.ubicacionId,
        direccion: lugarElegido.direccion || '',
        provincia: lugarElegido.provincia || '',
        localidad: lugarElegido.localidad || '',
        barrio: lugarElegido.barrio || '',
        zonaBA: enBuenosAires ? form.zonaBA : '',
        placeId: lugarElegido.placeId || '',
        lat: lugarElegido.lat ?? null,
        lng: lugarElegido.lng ?? null,
        actualizadaEn: serverTimestamp()
      };
      if (!editando) {
        Object.assign(datos, {
          estado: 'activo',
          vencimientoMillis: nuevoVencimiento(),
          publicadaEn: serverTimestamp(),
          createdAt: serverTimestamp(),
          avisoEnviado: false
        });
      }

      const lote = writeBatch(db);
      lote.set(refOferta, datos, { merge: editando });
      lote.set(doc(db, 'ofertasEmpleo', refOferta.id, 'privado', 'contacto'), {
        tipoContacto: form.tipoContacto,
        whatsapp: form.tipoContacto.includes('whatsapp') ? conPrefijo54(form.whatsapp) : '',
        email: form.tipoContacto.includes('email') ? form.email.trim() : ''
      });
      await lote.commit();

      // Aviso por mail a los profesionales que coinciden (no frena la publicación si falla)
      if (!editando) {
        auth.currentUser?.getIdToken()
          .then((token) => fetch('/api/aviso-oferta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ofertaId: refOferta.id })
          }))
          .catch((e) => console.error('No se pudo pedir el aviso por mail:', e));
      }

      onGuardada(editando ? 'La oferta se actualizó.' : 'Tu oferta ya está publicada por 30 días.');
    } catch (e) {
      console.error('Error guardando la oferta:', e);
      setErrores({ general: 'No pudimos guardar la oferta. Revisá tu conexión e intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-[#2D6A6A] animate-spin" /></div>;
  }

  const hayErrores = Object.values(errores).some(Boolean);
  const faltan = ORDEN_CAMPOS.filter((c) => errores[c]).map((c) => NOMBRES_CAMPOS[c]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 lg:pt-10 pb-16 font-['Inter'] relative z-10 animate-in fade-in duration-300">
      <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2D6A6A] hover:text-[#1A3D3D] mb-6">
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>

      <h1 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[28px] md:text-[36px] leading-tight tracking-tight mb-2">
        {editando ? 'Editar oferta' : 'Publicar oferta'}
      </h1>
      <p className="text-[15px] text-[#666666] mb-8">El logo y el nombre salen de la página de tu clínica. La oferta se ve 30 días y la podés extender gratis.</p>

      {hayErrores && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-[14px] font-semibold mb-5">
          {errores.general || `Faltan completar: ${faltan.join(', ')}.`}
        </div>
      )}

      {/* PUESTO */}
      <section className={claseCaja}>
        <CampoBolsa titulo="¿Qué puesto buscás cubrir?" requerido campo="rol" error={errores.rol}>
          <SelectorPills opciones={ROLES_VISIBLES.some((r) => r.id === form.rol) ? ROLES_VISIBLES : ROLES.filter((r) => !r.oculto || r.id === form.rol)} seleccion={form.rol} onCambio={(v) => cambiar('rol', v)} multiple={false} />
        </CampoBolsa>

        <CampoBolsa titulo="Especialidad" requerido={!sinAreas} campo="areas" ayuda={sinAreas ? '' : 'Marcá la especialidad del profesional que estás buscando. Podés elegir más de una.'} error={errores.areas}>
          <SelectorAreas
            seleccion={form.areas}
            onCambio={(v) => cambiar('areas', v)}
            deshabilitado={sinAreas}
            textoDeshabilitado="Para este puesto no hace falta elegir especialidades."
          />
        </CampoBolsa>

        <CampoBolsa titulo="Jornada" requerido campo="jornada" error={errores.jornada}>
          <SelectorPills opciones={JORNADAS} seleccion={form.jornada} onCambio={(v) => cambiar('jornada', v)} />
          <input
            value={form.notaJornada}
            onChange={(e) => cambiar('notaJornada', e.target.value)}
            maxLength={200}
            placeholder="Nota (opcional). Ej: el jueves de 9 a 13 h · reemplazo del 1 al 15 de enero"
            className={`${claseInput} mt-4`}
          />
        </CampoBolsa>

        <CampoBolsa titulo="Horario">
          <SelectorPills opciones={HORARIOS} seleccion={form.horario} onCambio={(v) => cambiar('horario', v)} />
        </CampoBolsa>

        <CampoBolsa titulo="Experiencia que buscás" requerido campo="experiencia" error={errores.experiencia}>
          <SelectorPills opciones={EXPERIENCIAS} seleccion={form.experiencia} onCambio={(v) => cambiar('experiencia', v)} multiple={false} />
        </CampoBolsa>

        <CampoBolsa titulo="Sobre el puesto" requerido campo="descripcion" ayuda="Contá qué experiencia buscás, las tareas, los días y cómo es el equipo. Corto y claro." error={errores.descripcion}>
          <textarea
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="Buscamos a alguien con experiencia en… para… Las tareas son… Trabajamos de lunes a viernes, en un equipo de…"
            className={`${claseInput} resize-none placeholder:text-gray-400`}
          />
          <p className="text-[12px] text-[#666666] text-right mt-1">{form.descripcion.length}/1500</p>
        </CampoBolsa>
      </section>

      {/* REQUISITOS Y EQUIPO */}
      <section className={claseCaja}>
        <CampoBolsa titulo="Requisitos">
          <SelectorPills opciones={[...REQUISITOS, ...form.requisitos.filter((r) => !REQUISITOS.includes(r))]} seleccion={form.requisitos} onCambio={(v) => cambiar('requisitos', v)} />
          <div className="flex gap-2 mt-3">
            <input value={requisitoPropio} onChange={(e) => setRequisitoPropio(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarPropio('requisitos', requisitoPropio, setRequisitoPropio); } }} placeholder="Otro requisito" maxLength={60} className={claseInput} />
            <button type="button" onClick={() => agregarPropio('requisitos', requisitoPropio, setRequisitoPropio)} className="shrink-0 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] rounded-2xl px-4 flex items-center gap-1.5 text-[14px] font-semibold"><Plus className="w-4 h-4" /> Sumar</button>
          </div>
        </CampoBolsa>

        <CampoBolsa titulo="Equipamiento de la clínica" ayuda="Lo que ya marcaste en la página de tu clínica viene elegido.">
          <SelectorPills opciones={[...EQUIPO, ...form.equipo.filter((x) => !EQUIPO.includes(x))]} seleccion={form.equipo} onCambio={(v) => cambiar('equipo', v)} />
          <div className="flex gap-2 mt-3">
            <input value={equipoPropio} onChange={(e) => setEquipoPropio(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarPropio('equipo', equipoPropio, setEquipoPropio); } }} placeholder="Otro equipo" maxLength={60} className={claseInput} />
            <button type="button" onClick={() => agregarPropio('equipo', equipoPropio, setEquipoPropio)} className="shrink-0 bg-[#F4F7F7] hover:bg-gray-200 text-[#1A3D3D] rounded-2xl px-4 flex items-center gap-1.5 text-[14px] font-semibold"><Plus className="w-4 h-4" /> Sumar</button>
          </div>
        </CampoBolsa>
      </section>

      {/* DÓNDE */}
      <section className={claseCaja}>
        <CampoBolsa titulo="¿Dónde es el puesto?" requerido campo="ubicacionId" ayuda="En la oferta se muestra el barrio y la zona; al tocarlo se abre el mapa." error={errores.ubicacionId}>
          <div className="flex flex-col gap-2">
            {[...lugares, { id: 'otra', nombre: 'Otra dirección', direccion: 'Solo para esta oferta' }].map((l) => {
              const activo = form.ubicacionId === l.id;
              return (
                <button key={l.id} type="button" onClick={() => cambiar('ubicacionId', l.id)} className={`w-full text-left border-2 rounded-2xl p-4 flex items-start gap-3 transition-all duration-300 ${activo ? 'border-[#2D6A6A] bg-[#F4F7F7]' : 'border-gray-200 bg-white hover:border-[#2D6A6A]/50'}`}>
                  <span className={`w-5 h-5 shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center ${activo ? 'border-[#2D6A6A] bg-[#2D6A6A]' : 'border-gray-300'}`}>
                    {activo && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-[#1A3D3D]">{l.nombre}</span>
                    <span className="block text-[13px] text-[#666666]">{l.direccion}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {form.ubicacionId === 'otra' && (
            <div className="mt-3">
              <BuscadorDireccionGoogle
                id="otraDireccionOferta"
                valor={textoOtraDireccion}
                onEscribir={(texto) => { setTextoOtraDireccion(texto); cambiar('otraDireccion', null); }}
                onElegir={(lugar) => { setTextoOtraDireccion(lugar.direccion); cambiar('otraDireccion', lugar); }}
                placeholder="Buscá la dirección"
                listaProvincias={provincias}
              />
              {form.otraDireccion?.direccion && (
                <p className="flex items-center gap-1.5 text-[13px] text-[#2D6A6A] font-semibold mt-2"><MapPin className="w-4 h-4" /> {form.otraDireccion.direccion}</p>
              )}
            </div>
          )}
        </CampoBolsa>

        {/* En Buenos Aires se muestra la zona en vez de la provincia */}
        {lugarElegido?.direccion && enBuenosAires && (
          <CampoBolsa titulo="Zona de Buenos Aires" requerido campo="zonaBA" ayuda="Es lo que ven los profesionales en vez de «Provincia de Buenos Aires»." error={errores.zonaBA}>
            <SelectorPills opciones={ZONAS_BA} seleccion={form.zonaBA} onCambio={(v) => cambiar('zonaBA', v)} multiple={false} />
          </CampoBolsa>
        )}
      </section>

      {/* CONTACTO */}
      <section className={claseCaja}>
        <CampoBolsa titulo="¿Cómo querés recibir las postulaciones?" requerido campo="tipoContacto" ayuda="Solo lo ven profesionales registrados en el Portal." error={errores.tipoContacto}>
          <SelectorPills opciones={[{ id: 'whatsapp', label: 'WhatsApp' }, { id: 'email', label: 'Mail' }]} seleccion={form.tipoContacto} onCambio={(v) => cambiar('tipoContacto', v)} />
        </CampoBolsa>

        {form.tipoContacto.includes('whatsapp') && (
          <div className="mb-5 scroll-mt-28" data-campo="whatsapp">
            <CampoWhatsapp id="whatsappOferta" label="WhatsApp" requerido valor={form.whatsapp} onCambio={(v) => cambiar('whatsapp', v)} />
            {errores.whatsapp && <p className="text-[12px] font-semibold text-red-600 mt-2">{errores.whatsapp}</p>}
          </div>
        )}
        {form.tipoContacto.includes('email') && (
          <div className="scroll-mt-28" data-campo="email">
            <p className="text-[14px] font-bold text-[#1A3D3D] mb-2">Mail <span className="text-red-500">*</span></p>
            <input type="email" value={form.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="rrhh@tuclinica.com" className={claseInput} />
            {errores.email && <p className="text-[12px] font-semibold text-red-600 mt-2">{errores.email}</p>}
          </div>
        )}
      </section>

      {hayErrores && (
        <p className="text-[14px] font-semibold text-red-600 text-center mb-3">{errores.general || `Faltan completar: ${faltan.join(', ')}.`}</p>
      )}
      <button type="button" onClick={guardar} disabled={guardando} className="w-full bg-[#2D6A6A] hover:bg-[#1A3D3D] disabled:opacity-70 text-white py-4 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-md">
        {guardando && <Loader2 className="w-5 h-5 animate-spin" />}
        {editando ? 'Guardar cambios' : 'Publicar oferta'}
      </button>
    </div>
  );
}
