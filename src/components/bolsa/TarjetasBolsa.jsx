import React from 'react';
import { MapPin, ChevronRight, Clock } from 'lucide-react';
import { tituloPuesto, etiquetaRol, tiempoDesde, zonaTexto } from '../../utils/bolsa';

const claseTarjeta = "group bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm hover:border-[#2D6A6A]/30 hover:shadow-[0_15px_30px_rgba(45,106,106,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-pointer flex items-start gap-4 h-full text-left w-full";
const clasePill = "bg-[#2D6A6A]/10 text-[#1A3D3D] text-[12px] lg:text-[13px] font-semibold px-2.5 py-0.5 rounded-full";
const claseEtiqueta = "bg-[#F4F7F7] text-[#666666] text-[12px] lg:text-[13px] font-medium px-2 py-0.5 rounded-lg";

const iniciales = (texto) => String(texto || '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'PV';

export function TarjetaOferta({ oferta, onAbrir }) {
  const jornadas = Array.isArray(oferta.jornada) ? oferta.jornada : [];
  return (
    <button type="button" onClick={onAbrir} className={claseTarjeta}>
      {oferta.clinicaFoto ? (
        <img src={oferta.clinicaFoto} alt={oferta.clinicaNombre} className="w-14 h-14 shrink-0 object-cover rounded-[16px] border border-gray-50 shadow-sm" />
      ) : (
        <div className="w-14 h-14 shrink-0 rounded-[16px] bg-[#1A3D3D] text-white font-['Montserrat'] font-extrabold text-[15px] flex items-center justify-center">
          {iniciales(oferta.clinicaNombre)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h2 className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[15px] leading-tight line-clamp-2">{tituloPuesto(oferta)}</h2>
        {oferta.rol === 'veterinario' && (oferta.areas || []).length > 0 && (
          <p className="text-[#666666] text-[12px] font-medium mt-0.5">{etiquetaRol(oferta.rol)}</p>
        )}
        <p className="text-[#2D6A6A] text-[13px] font-semibold leading-snug mt-0.5 truncate">{oferta.clinicaNombre}</p>
        {zonaTexto(oferta) && (
          <p className="flex items-center gap-1 text-[#666666] text-[13px] font-medium mt-0.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{zonaTexto(oferta)}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {jornadas.slice(0, 2).map((j) => <span key={j} className={clasePill}>{j}</span>)}
          <span className={`${claseEtiqueta} inline-flex items-center gap-1`}><Clock className="w-3 h-3" /> {tiempoDesde(oferta.publicadaEn)}</span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 shrink-0 self-center text-[#9CA3AF] group-hover:text-[#2D6A6A] group-hover:translate-x-0.5 transition-all duration-300" />
    </button>
  );
}

export function TarjetaDisponible({ disponible, onAbrir }) {
  const areas = Array.isArray(disponible.areas) ? disponible.areas : [];
  const jornadas = Array.isArray(disponible.jornada) ? disponible.jornada : [];
  const zonas = (disponible.zonas || []).map((z) => z.localidad || z.barrio).filter(Boolean);
  const lugar = [zonas.slice(0, 2).join(', '), disponible.provincia].filter(Boolean).join(' · ');
  return (
    <button type="button" onClick={onAbrir} className={claseTarjeta}>
      {disponible.foto ? (
        <img src={disponible.foto} alt={disponible.nombre} className="w-14 h-14 shrink-0 object-cover rounded-full border border-gray-50 shadow-sm" />
      ) : (
        <div className="w-14 h-14 shrink-0 rounded-full bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] font-['Montserrat'] font-extrabold text-[15px] flex items-center justify-center">
          {iniciales(disponible.nombre)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h2 className="font-['Montserrat'] font-extrabold text-[#1A3D3D] text-[15px] leading-tight truncate">{disponible.nombre}</h2>
        {areas.length > 0 && <p className="text-[#2D6A6A] text-[13px] font-semibold leading-snug mt-0.5 line-clamp-1">{areas.join(' · ')}</p>}
        {lugar && (
          <p className="flex items-center gap-1 text-[#666666] text-[13px] font-medium mt-0.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{lugar}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {jornadas.slice(0, 2).map((j) => <span key={j} className={clasePill}>{j}</span>)}
          {disponible.experiencia && <span className={claseEtiqueta}>{disponible.experiencia}</span>}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 shrink-0 self-center text-[#9CA3AF] group-hover:text-[#2D6A6A] group-hover:translate-x-0.5 transition-all duration-300" />
    </button>
  );
}
