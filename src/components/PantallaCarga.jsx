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
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-8"
      style={{
        background: '#ffffff',
        opacity: animar ? 0 : 1,
        transition: animar ? 'opacity 0.5s ease-in-out' : 'none',
        pointerEvents: animar ? 'none' : 'auto',
      }}
    >
      {/* ── Logo + destellos ── */}
      <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>

        {/* Rayos */}
  {[
  { rot: '-75deg', h: 20, color: '#4DB6AC', dur: '1.4s',  delay: '0.1s',  op: 0.25, bottom: '82%', left: '18%' },
  { rot: '-45deg', h: 16, color: '#2D6A6A', dur: '1.6s',  delay: '0.4s',  op: 0.2,  bottom: '90%', left: '28%' },
  { rot: '-15deg', h: 18, color: '#4DB6AC', dur: '1.5s',  delay: '0.0s',  op: 0.2,  bottom: '95%', left: '40%' },
  { rot:  '15deg', h: 18, color: '#2D6A6A', dur: '1.5s',  delay: '0.3s',  op: 0.2,  bottom: '95%', left: '56%' },
  { rot:  '45deg', h: 16, color: '#4DB6AC', dur: '1.6s',  delay: '0.5s',  op: 0.2,  bottom: '90%', left: '68%' },
  { rot:  '75deg', h: 20, color: '#2D6A6A', dur: '1.4s',  delay: '0.2s',  op: 0.25, bottom: '82%', left: '78%' },
  { rot:   '0deg', h: 22, color: '#4DB6AC', dur: '1.7s',  delay: '0.6s',  op: 0.18, bottom: '97%', left: '48%' },
].map((r, i) => (
  <div
    key={i}
    style={{
      position: 'absolute',
      width: 1.5,
      height: r.h,
      borderRadius: 2,
      background: `linear-gradient(to top, transparent, ${r.color})`,
      transformOrigin: 'bottom center',
      bottom: r.bottom,
      left: r.left,
      overflow: 'hidden',
      transform: `rotate(${r.rot})`,
      animation: `rayo ${r.dur} ease-in-out ${r.delay} infinite`,
    }}
  />
))}

        {/* SVG */}
        <svg
          width="90"
          height="90"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            animation: animar ? 'crecer 0.7s ease-in forwards' : 'latido3 2.8s ease-in-out forwards',
            transformOrigin: 'center',
          }}
        >
          <path
            d="M 18 85 V 45 A 32 32 0 0 1 82 45 V 85"
            stroke="#1A3D3D"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 38 85 V 55 A 12 12 0 0 1 62 55 V 85"
            stroke="#4DB6AC"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Texto */}
      <p
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: '11px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(26,61,61,0.35)',
          animation: 'parpadeo 1.8s ease-in-out infinite',
          opacity: animar ? 0 : undefined,
          transition: animar ? 'opacity 0.3s' : 'none',
        }}
      >
        Cargando {pagina}
      </p>

      {/* Botón solo en desarrollo */}
      {import.meta.env.DEV && !saliendo && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('pantallaCarga:simularSalida'))}
          style={{
            marginTop: 8,
            background: '#F4F7F7',
            border: '1px solid rgba(45,106,106,0.2)',
            color: '#2D6A6A',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '9px 22px',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          ↺ Simular entrada
        </button>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes latido3 {
  0%   { transform: scale(1);    opacity: 1; }
  12%  { transform: scale(1.12); opacity: 1; }
  24%  { transform: scale(1);    opacity: 1; }
  38%  { transform: scale(1.10); opacity: 1; }
  52%  { transform: scale(1);    opacity: 1; }
  68%  { transform: scale(1);    opacity: 1; }
  100% { transform: scale(2.8);  opacity: 0; }
}
        @keyframes crecer {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
     @keyframes rayo {
  0%   { opacity: 0;    max-height: 0; }
  25%  { opacity: 0.9;  max-height: 40px; }
  75%  { opacity: 0;    max-height: 40px; }
  100% { opacity: 0;    max-height: 0; }
}
        @keyframes parpadeo {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.85; }
        }
          [style*="--rot"] {
  transform: rotate(var(--rot)) scaleY(0);
}
      `}
      
      </style>
    </div>
  );
}