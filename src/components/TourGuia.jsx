import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Selector por defecto para encontrar la Navbar y medir su altura real.
// Si tu Navbar.jsx NO usa la etiqueta <nav> como contenedor principal,
// pasale el prop navbarSelector="#tu-id-o-clase" al usar <TourGuia />.
const NAVBAR_SELECTOR_DEFAULT = 'nav';

// Arma la forma del "agujero" redondeado en el fondo oscuro, como un molde de
// cortar galletitas: recorta un rectángulo con esquinas curvas del tamaño de
// la tarjeta resaltada, dejando esa zona visible y clickeable, y todo lo
// demás tapado con el fondo oscuro.
function construirFormaConAgujero(rect, pad, radio) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const r = Math.min(radio, w / 2, h / 2);

  const agujero = `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

  return `path(evenodd, "M0 0 H${W} V${H} H0 Z ${agujero}")`;
}

export default function TourGuia({ pasos, userId, claveStorage, onFin, onPaso, navbarSelector = NAVBAR_SELECTOR_DEFAULT }) {
  const [pasoActual, setPasoActual] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, triangulo: 'abajo' });
  const [targetRect, setTargetRect] = useState(null);
  const [navbarHeight, setNavbarHeight] = useState(72);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef(null);
  // Guardamos la altura de la Navbar también en una "cajita" que no genera
  // re-renders (useRef), para poder leerla desde las funciones sin que eso
  // obligue a reiniciar todo el proceso de búsqueda del elemento cada vez
  // que se mide la Navbar (antes esto hacía que el tour se cortara a mitad
  // de camino y la cajita del tip nunca terminara de aparecer).
  const navbarHeightRef = useRef(72);
  // Bandera para saber si el paso actual sigue "vigente" o ya se abandonó
  // (porque el usuario avanzó de paso o cerró el tour). Sirve para que
  // ningún timer atrasado pise el estado por error.
  const vigenteRef = useRef(true);

  const paso = pasos[pasoActual];

  // Detecta la altura real de la Navbar (distinta en mobile vs PC)
  // y se vuelve a medir cada vez que cambia el tamaño de la ventana.
  useEffect(() => {
    const detectarNavbar = () => {
      const nav = document.querySelector(navbarSelector);
      if (nav) {
        const altura = nav.getBoundingClientRect().height;
        navbarHeightRef.current = altura;
        setNavbarHeight(altura);
      }
    };
    detectarNavbar();
    window.addEventListener('resize', detectarNavbar);
    return () => window.removeEventListener('resize', detectarNavbar);
  }, [navbarSelector]);

  // Esta función SOLO mide dónde está el elemento y ubica el cartelito.
  // Nunca mueve la página. Es segura para llamarla todo el tiempo,
  // incluso mientras el usuario scrollea con la mano.
  const reposicionar = () => {
    if (!vigenteRef.current) return;

    const el = document.getElementById(paso?.targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const navbarActual = navbarHeightRef.current;

    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });

    const margen = 12;
    const tooltipW = Math.min(280, window.innerWidth - margen * 2);
    const tooltipH = tooltipRef.current?.offsetHeight || 180;

    let left = rect.left + rect.width / 2 - tooltipW / 2;
    left = Math.max(margen, Math.min(left, window.innerWidth - tooltipW - margen));

    // Siempre arriba del elemento, con un margen generoso de 24px
    // para que el tooltip no tape el borde superior de la caja resaltada.
    // El Math.max garantiza que nunca se suba por encima de la Navbar.
    const top = Math.max(navbarActual + margen, rect.top - tooltipH - 24);
    const triangulo = 'abajo';

    setTooltipPos({ top, left, triangulo, width: tooltipW });
    setVisible(true);
  };

  // Esta función SÍ puede mover la página, pero se usa una sola vez:
  // justo al abrir cada paso, para destapar el elemento si está
  // escondido detrás de la Navbar. Después llama a reposicionar().
  const ajustarScrollYPosicionar = () => {
    if (!vigenteRef.current) return;

    const el = document.getElementById(paso?.targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const navbarActual = navbarHeightRef.current;
    const margen = 12;
    const tooltipH = tooltipRef.current?.offsetHeight || 180;
    const pad = 10;

    // Necesitamos que arriba del elemento haya lugar suficiente para el tooltip,
    // Y que abajo del elemento la caja sea visible completa en pantalla.
    // 24px de margen extra (igual que en reposicionar) para que el tooltip
    // no quede pegado ni tape el borde superior de la caja resaltada.
    const espacioNecesarioArriba = navbarActual + margen + tooltipH + 24;
    const espacioNecesarioAbajo = window.innerHeight - margen;

    let necesitaScroll = false;
    let scrollDelta = 0;

    if (rect.top < espacioNecesarioArriba) {
      // Scrolleamos hacia abajo lo necesario para que el tooltip entre
      // cómodo arriba sin tapar la caja. El factor 0.5 agrega medio alto
      // de la caja como margen extra de aire visual.
      scrollDelta = rect.top - espacioNecesarioArriba - rect.height * 0.5;
      necesitaScroll = true;
    } else if (rect.bottom + pad > espacioNecesarioAbajo) {
      // La caja está muy abajo y se corta: subimos la página para verla completa
      scrollDelta = rect.bottom + pad - espacioNecesarioAbajo;
      necesitaScroll = true;
    }

    if (necesitaScroll) {
      // Desactivamos el listener de scroll manualmente antes de hacer el scroll
      // programático, para que no interfiera con nuestro propio reposicionamiento.
      vigenteRef.current = false;
      window.scrollBy({ top: scrollDelta, behavior: 'instant' });

      // Esperamos 3 frames: el primero aplica el scroll, el segundo recalcula
      // el layout, el tercero asegura que elementos con altura variable
      // (como NotificationBox) ya terminaron de pintarse con su tamaño real.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            vigenteRef.current = true;
            reposicionar();
          });
        });
      });
      return;
    }

    reposicionar();
  };

  // Busca el elemento del paso actual. Si todavía no existe en el DOM
  // (por ejemplo, está esperando datos de Firebase, o no existe en esa vista),
  // reintenta cada 300ms durante ~4.5s. Si nunca aparece, salta el paso solo.
  useEffect(() => {
    if (!paso?.targetId) return;

    // Este paso recién empieza: lo marcamos como "vigente" y arrancamos
    // sin ningún resabio de timers del paso anterior.
    vigenteRef.current = true;
    setVisible(false);

    let cancelado = false;
    let intentos = 0;
    const maxIntentos = 15; // ~4.5 segundos de reintento
    let timeoutBusqueda = null;
    let timeoutAjuste = null;
    let timeoutSeguridad = null;

    const intentarEncontrar = () => {
      if (cancelado) return;
      const el = document.getElementById(paso.targetId);

      if (el) {
      
  timeoutAjuste = setTimeout(ajustarScrollYPosicionar, 150);
      } else if (intentos < maxIntentos) {
        intentos += 1;
        timeoutBusqueda = setTimeout(intentarEncontrar, 300);
      } else {
        console.warn(`TourGuia: no se encontró el elemento con id "${paso.targetId}". Se salta este paso.`);
        avanzar();
      }
    };

    intentarEncontrar();

    timeoutSeguridad = setTimeout(() => {
      if (!cancelado) {
        reposicionar();
      }
    }, 2500);

    let solicitado = false;
    let scrollandose = false;
    let timerScrollFin = null;

    const alScrollear = () => {
     if (!vigenteRef.current) return;
      scrollandose = true;
      setVisible(false);

      clearTimeout(timerScrollFin);
      timerScrollFin = setTimeout(() => {
        scrollandose = false;
        if (vigenteRef.current) reposicionar();
      }, 150);
    };

    const alRedimensionar = () => {
      if (!solicitado) {
        solicitado = true;
        window.requestAnimationFrame(() => {
          if (!scrollandose) reposicionar();
          solicitado = false;
        });
      }
    };

    window.addEventListener('resize', alRedimensionar);
    window.addEventListener('scroll', alScrollear, true);

    return () => {
      cancelado = true;
      vigenteRef.current = false;
      clearTimeout(timeoutBusqueda);
      clearTimeout(timeoutAjuste);
      clearTimeout(timeoutSeguridad);
      clearTimeout(timerScrollFin);
      window.removeEventListener('resize', alRedimensionar);
      window.removeEventListener('scroll', alScrollear, true);
    };

  }, [pasoActual]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter') avanzar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pasoActual]);

  const guardarEnFirestore = async () => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'usuarios', userId), {
        [`tourVisto.${claveStorage}`]: true
      });
    } catch (e) {
      console.error('Error guardando tour:', e);
    }
  };

  const avanzar = () => {
    if (pasoActual < pasos.length - 1) {
     setVisible(false);
      setTimeout(() => {
        setPasoActual(p => {
          const siguiente = p + 1;
         if (onPaso) onPaso(pasos[siguiente]);
          return siguiente;
        });
      }, 180);
    } else {
      guardarEnFirestore();
      onFin();
    }
  };

  const saltar = () => {
    guardarEnFirestore();
    onFin();
  };

  if (!paso) return null;

  const pad = 10;
  const colorTinte = 'rgba(26,61,61,0.6)';
const rectSeguro = targetRect ? (() => {
    const topMinimo = navbarHeight + pad;
    const topClamp = Math.max(targetRect.top, topMinimo);
    const delta = topClamp - targetRect.top; // cuánto tuvimos que "recortar" arriba
    return {
      ...targetRect,
      top: topClamp,
      height: Math.max(0, targetRect.height - delta),
    };
  })() : null;

  return (
    <>
       {rectSeguro && (
        <>
         <div
            className="fixed inset-0 z-[500]"
            style={{
              background: colorTinte,
              clipPath: construirFormaConAgujero(rectSeguro, pad, 28),
            }}
            onClick={avanzar}
          />

          <div
            className="fixed z-[501] pointer-events-none rounded-[28px]"
            style={{
              top: rectSeguro.top - pad,
              left: rectSeguro.left - pad,
              width: rectSeguro.width + pad * 2,
              height: rectSeguro.height + pad * 2,
              boxShadow: '0 0 0 3px #4DB6AC, 0 0 40px rgba(77,182,172,0.5)',
            }}
          />
        </>
      )}
    

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[502] bg-white rounded-[24px] shadow-2xl border border-gray-100 p-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.width || 280,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
        }}
      >
        {/* Triangulito abajo (apunta hacia el elemento que está abajo) */}
        {tooltipPos.triangulo === 'abajo' && (
          <div className="absolute left-1/2 -translate-x-1/2" style={{
            bottom: -9,
            width: 0, height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '9px solid white',
          }} />
        )}
        {/* Triangulito arriba (apunta hacia el elemento que está arriba) */}
        {tooltipPos.triangulo === 'arriba' && (
          <div className="absolute left-1/2 -translate-x-1/2" style={{
            top: -9,
            width: 0, height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderBottom: '9px solid white',
          }} />
        )}

        {/* Indicador de pasos */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {pasos.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === pasoActual ? 'w-5 bg-[#2D6A6A]' : 'w-1.5 bg-gray-200'}`}
              />
            ))}
          </div>
          <button onClick={saltar} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[15px] mb-2 leading-tight">
          {paso.titulo}
        </h3>
        <p className="text-[13px] text-[#666666] font-medium leading-relaxed mb-4">
          {paso.desc}
        </p>

      <div className="flex items-center justify-between">
          {/* En mobile no tiene sentido mostrar "Enter para avanzar" */}
          <span className="hidden md:flex text-[11px] text-gray-400 font-medium items-center gap-1">
            <kbd className="bg-gray-100 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-gray-500">Enter</kbd> para avanzar
          </span>
          <button
            onClick={avanzar}
            className="flex items-center gap-1.5 bg-[#1A3D3D] text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-[#2D6A6A] transition-colors ml-auto"
          >
            {pasoActual < pasos.length - 1
              ? <><ChevronRight className="w-3.5 h-3.5" /> Siguiente</>
              : '¡Listo!'
            }
          </button>
        </div>
      </div>

    
    </>
  );
}