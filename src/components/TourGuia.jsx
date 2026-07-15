import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const NAVBAR_SELECTOR_DEFAULT = 'nav';

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
  const navbarHeightRef = useRef(72);

  const vigenteRef = useRef(true);

  const paso = pasos[pasoActual];

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

    const posicionForzada = paso.posicion || 'auto';
    const hayEspacioArriba = rect.top - tooltipH - 24 >= navbarActual + margen;

    let top, left, triangulo;

    if (posicionForzada === 'derecha') {
      left = rect.right + 16;
      if (left + tooltipW > window.innerWidth - margen) {
        left = rect.left - tooltipW - 16;
        triangulo = 'derecha';
      } else {
        triangulo = 'izquierda';
      }
      top = rect.top + rect.height / 2 - tooltipH / 2;
      top = Math.max(navbarActual + margen, Math.min(top, window.innerHeight - tooltipH - margen));
    } else if (posicionForzada === 'izquierda') {
      left = rect.left - tooltipW - 16;
      triangulo = 'derecha';
      top = rect.top + rect.height / 2 - tooltipH / 2;
      top = Math.max(navbarActual + margen, Math.min(top, window.innerHeight - tooltipH - margen));
    } else if (posicionForzada === 'abajo') {
      left = rect.left + rect.width / 2 - tooltipW / 2;
      left = Math.max(margen, Math.min(left, window.innerWidth - tooltipW - margen));
      top = rect.bottom + 16;
      triangulo = 'arriba';
    } else if (posicionForzada === 'arriba') {
      left = rect.left + rect.width / 2 - tooltipW / 2;
      left = Math.max(margen, Math.min(left, window.innerWidth - tooltipW - margen));
      top = rect.top - tooltipH - 24;
      triangulo = 'abajo';
    } else {
      left = rect.left + rect.width / 2 - tooltipW / 2;
      left = Math.max(margen, Math.min(left, window.innerWidth - tooltipW - margen));
      top = hayEspacioArriba ? rect.top - tooltipH - 24 : rect.bottom + 16;
      triangulo = hayEspacioArriba ? 'abajo' : 'arriba';
    }

    setTooltipPos({ top, left, triangulo, width: tooltipW });
    setVisible(true);
  };

  const ajustarScrollYPosicionar = () => {
    if (!vigenteRef.current) return;

    const el = document.getElementById(paso?.targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const navbarActual = navbarHeightRef.current;
    const margen = 12;
    const tooltipH = tooltipRef.current?.offsetHeight || 180;
    const pad = 10;

    const espacioNecesarioArriba = navbarActual + margen + tooltipH + 24;
    const espacioNecesarioAbajo = window.innerHeight - margen;

    let necesitaScroll = false;
    let scrollDelta = 0;

    if (rect.top < espacioNecesarioArriba) {
     scrollDelta = rect.top - espacioNecesarioArriba - rect.height * 0.5;
      necesitaScroll = true;
    } else if (rect.bottom + pad > espacioNecesarioAbajo) {

      scrollDelta = rect.bottom + pad - espacioNecesarioAbajo;
      necesitaScroll = true;
    }

    if (necesitaScroll) {
      vigenteRef.current = false;
      window.scrollBy({ top: scrollDelta, behavior: 'instant' });

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
        {/* Triangulito izquierda (apunta hacia el elemento que está a la izquierda) */}
        {tooltipPos.triangulo === 'izquierda' && (
          <div className="absolute top-1/2 -translate-y-1/2" style={{
            left: -9,
            width: 0, height: 0,
            borderTop: '9px solid transparent',
            borderBottom: '9px solid transparent',
            borderRight: '9px solid white',
          }} />
        )}
        {/* Triangulito derecha (apunta hacia el elemento que está a la derecha) */}
        {tooltipPos.triangulo === 'derecha' && (
          <div className="absolute top-1/2 -translate-y-1/2" style={{
            right: -9,
            width: 0, height: 0,
            borderTop: '9px solid transparent',
            borderBottom: '9px solid transparent',
            borderLeft: '9px solid white',
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
        <p
          className="text-[14px] text-[#666666] leading-relaxed mb-4 tour-desc"
          dangerouslySetInnerHTML={{ __html: paso.desc }}
        />
        <style>{`
          .tour-desc { font-weight: 500; }
          .tour-desc strong { font-weight: 900; color: #1a3d3d; }
        `}</style>

      <div className="flex items-center justify-between gap-2">
          {/* Botón retroceder */}
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => setPasoActual(p => p - 1), 180);
            }}
            disabled={pasoActual === 0}
            className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all duration-200 ${
              pasoActual === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-[#2D6A6A] hover:bg-[#2D6A6A]/10'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </button>

          {/* Botón avanzar */}
          <button
            onClick={avanzar}
            className="flex items-center gap-1.5 bg-[#1A3D3D] text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-[#2D6A6A] transition-colors"
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