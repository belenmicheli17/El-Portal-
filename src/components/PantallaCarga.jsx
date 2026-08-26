import React, { useEffect, useState } from 'react';

export default function PantallaCarga({ saliendo = false, pagina = 'ecosistema' }) {
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    if (saliendo) {
      setTimeout(() => setAnimar(true), 50);
    }

    const handler = () => setTimeout(() => setAnimar(true), 50);
    window.addEventListener('pantallaCarga:simularSalida', handler);
    return () => window.removeEventListener('pantallaCarga:simularSalida', handler);
  }, [saliendo]);

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-6 bg-[#F4F7F7] overflow-visible"
      style={{
        opacity: animar ? 0 : 1,
        transition: animar ? 'opacity 0.5s ease-in-out' : 'none',
        pointerEvents: animar ? 'none' : 'auto',
      }}
    >
      {/* Logo animado — wrapper para el zoom final */}
      <div style={{ animation: 'zoomEntrada 0.5s ease-in 1.1s forwards', transformOrigin: 'center' }}>
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          overflow="visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* PUERTA EXTERIOR */}
          <path
            d="M 18 85 V 45 A 32 32 0 0 1 82 45 V 85"
            stroke="#1A3D3D"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="300"
            strokeDashoffset="300"
            style={{ animation: 'puerta1 0.5s ease-out 0.1s forwards' }}
          />
          {/* PUERTA INTERIOR */}
          <path
            d="M 38 85 V 55 A 12 12 0 0 1 62 55 V 85"
            stroke="#2D6A6A"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="150"
            strokeDashoffset="150"
            style={{ animation: 'puerta2 0.4s ease-out 0.5s forwards' }}
          />
        </svg>
      </div>

      <style>{`
             @keyframes puerta1 {
          from { stroke-dashoffset: 300; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes puerta2 {
          from { stroke-dashoffset: 150; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes zoomEntrada {
          0%   { transform: scale(1);    opacity: 1; }
          100% { transform: scale(12);   opacity: 0; }
        }
       
      `}</style>
    </div>
  );
}