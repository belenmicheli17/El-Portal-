import { useState, useEffect } from 'react';

// Barra de cupos: muestra cuántos lugares quedan (ej. "Quedan 37 lugares de 60 para acceso vitalicio").
// El número se lo pedimos a una función de Vercel, así no dependemos de las reglas de seguridad de Firestore.
// Se puede reutilizar cambiando las propiedades (por ejemplo, para clínicas).
export default function BarraCupos({
  endpoint = '/api/cupos-vitalicios',
  limite = 60,
  textoQuedan = 'para ser socio vitalicio.',
  textoAgotado = 'lugares vitalicios ya fueron ocupados.',
  pie = <>Después del límite, el acceso será por suscripción. <strong className="text-white font-black">¡Registrate ahora!</strong></>,
  integrada = false, // true = sin caja propia, para usarla adentro de otra caja
  ancha = false, // true = versión grande, para usarla a lo ancho en PC
}) {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const cargarTotal = async () => {
      try {
        const respuesta = await fetch(endpoint);
        if (!respuesta.ok) throw new Error('Respuesta no válida: ' + respuesta.status);
        const datos = await respuesta.json();
        if (!cancelado) setTotal(Number(datos.total) || 0);
      } catch (error) {
        // Si falla, no mostramos la barra antes que mostrar un número incorrecto
        console.error('Error cargando los cupos:', error);
      }
    };
    cargarTotal();
    return () => { cancelado = true; };
  }, [endpoint]);

  if (total === null) return null;

  const quedan = Math.max(limite - total, 0);
  const porcentaje = Math.min((total / limite) * 100, 100);

  return (
    <div className={integrada ? 'mb-4' : `mb-5 bg-[#1A3D3D] rounded-2xl border border-[#1A3D3D] ${ancha ? 'p-6 md:p-7' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`${ancha ? 'text-[18px]' : 'text-[13px]'} font-black text-white leading-snug font-['Montserrat']`}>
          {quedan > 0
            ? <>Quedan <span className="text-[#4DB6AC]">{quedan} lugares</span> de {limite} {textoQuedan}</>
            : <>Los {limite} {textoAgotado}</>
          }
        </p>
      </div>
      <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${porcentaje > 80 ? 'bg-red-400' : 'bg-[#4DB6AC]'}`}
          style={{ width: `${porcentaje === 0 ? 2 : porcentaje}%` }}
        />
      </div>
      <p className={`${ancha ? 'text-[14px]' : 'text-[11px] md:text-[13px]'} text-white/50 font-medium`}>
        {pie}
      </p>
    </div>
  );
}