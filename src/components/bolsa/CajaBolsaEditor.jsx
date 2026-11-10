import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ToggleSwitch } from '../editor/EditorComponents';
import CajaCV from './CajaCV';

// Bloque del editor profesional: CV guardado y avisos de ofertas por mail.
// Se guarda solo, sin el botón "Guardar" del editor (vive en el documento privado de "usuarios").
export default function CajaBolsaEditor({ uid }) {
  const [cv, setCv] = useState(null);
  const [avisos, setAvisos] = useState(true);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'usuarios', uid))
      .then((snap) => {
        const datos = snap.data() || {};
        setCv(datos.cv || null);
        setAvisos(datos.avisosBolsa !== false);
      })
      .catch((e) => console.error('Error leyendo datos de la Bolsa:', e))
      .finally(() => setCargado(true));
  }, [uid]);

  const cambiarAvisos = async (valor) => {
    setAvisos(valor);
    setError('');
    try {
      await updateDoc(doc(db, 'usuarios', uid), { avisosBolsa: valor });
    } catch (e) {
      console.error('Error guardando los avisos:', e);
      setAvisos(!valor);
      setError('No pudimos guardar el cambio. Intentá de nuevo.');
    }
  };

  if (!cargado) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-2 ml-1">Mi CV</p>
        <p className="text-sm text-[#666666] mb-3 ml-1">Lo usás para postularte en la Bolsa de Trabajo. Se guarda al subirlo.</p>
        <CajaCV uid={uid} cv={cv} setCv={setCv} />
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <ToggleSwitch
          label="Avisarme por mail de ofertas nuevas"
          checked={avisos}
          onChange={cambiarAvisos}
          tooltip="Te llega un mail cuando una clínica de tu provincia publica una oferta en alguna de las áreas de tus servicios."
        />
        {error && <p className="text-[12px] font-semibold text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
