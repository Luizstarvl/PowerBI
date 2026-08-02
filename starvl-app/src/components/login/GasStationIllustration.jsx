import React from 'react';

// Ilustração estilizada (não fotorrealista) de um posto Horse: canopy +
// bombas + totem de preço + tanques + loja + caminhão-tanque + carro,
// silhuetas escuras com contorno neon laranja. Só formas geométricas
// simples (rect/polygon/ellipse/circle/line), sem paths complexos.
export default function GasStationIllustration() {
  return (
    <svg viewBox="0 0 640 460" className="station-illustration" role="img" aria-label="Ilustração de um posto de combustível Horse">
      <defs>
        <filter id="stationGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="groundGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tankGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="55%" stopColor="#232323" />
          <stop offset="100%" stopColor="#151515" />
        </linearGradient>
      </defs>

      {/* Chão */}
      <ellipse cx="330" cy="404" rx="290" ry="34" fill="#0b0b0b" />
      <ellipse cx="260" cy="368" rx="170" ry="20" fill="url(#groundGlow)" />
      <ellipse cx="470" cy="380" rx="120" ry="16" fill="url(#groundGlow)" />

      {/* Tanques (fundo) */}
      <g filter="url(#stationGlow)">
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${372 + i * 40} 0)`}>
            <rect x="0" y="178" width="26" height="112" rx="13" fill="url(#tankGrad)" stroke="#FB923C" strokeOpacity="0.55" strokeWidth="1.2" />
            <ellipse cx="13" cy="178" rx="13" ry="6" fill="#3a3a3a" stroke="#FB923C" strokeOpacity="0.6" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* Loja de conveniência */}
      <g filter="url(#stationGlow)">
        <polygon points="452,232 620,232 632,214 464,214" fill="#161616" stroke="#FB923C" strokeWidth="1.4" />
        <rect x="452" y="232" width="168" height="96" fill="#131313" stroke="#FB923C" strokeOpacity="0.7" strokeWidth="1.4" />
        {[0, 1, 2, 3].map(i => (
          <rect key={i} x={468 + i * 38} y="252" width="24" height="26" rx="2" fill="#F97316" fillOpacity="0.30" stroke="#FB923C" strokeWidth="1" />
        ))}
        <rect x="468" y="292" width="30" height="36" fill="#0d0d0d" stroke="#FB923C" strokeOpacity="0.6" strokeWidth="1" />
        <text x="536" y="316" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FDBA74" fontFamily="Inter, sans-serif" letterSpacing="1.5">LOJA</text>
      </g>

      {/* Totem de preço */}
      <g filter="url(#stationGlow)">
        <rect x="96" y="176" width="34" height="150" rx="3" fill="#151515" stroke="#FB923C" strokeWidth="1.4" />
        <rect x="96" y="176" width="34" height="26" rx="3" fill="#F97316" fillOpacity="0.85" />
        <text x="113" y="194" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0d0d0d" fontFamily="Inter, sans-serif">H</text>
        {[0, 1, 2].map(i => (
          <rect key={i} x="103" y={214 + i * 24} width="20" height="14" rx="2" fill="#F97316" fillOpacity="0.18" stroke="#FB923C" strokeOpacity="0.5" strokeWidth="0.8" />
        ))}
      </g>

      {/* Canopy + bombas */}
      <g filter="url(#stationGlow)">
        {[168, 236, 304].map(x => (
          <rect key={x} x={x} y="60" width="10" height="200" fill="#1c1c1c" stroke="#FB923C" strokeOpacity="0.5" strokeWidth="1" />
        ))}
        <polygon points="150,60 400,60 430,96 120,96" fill="#171717" stroke="#FB923C" strokeWidth="1.6" />
        <rect x="120" y="96" width="310" height="6" fill="#F97316" fillOpacity="0.9" />
        <text x="275" y="80" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FDBA74" fontFamily="Inter, sans-serif" letterSpacing="2">HORSE</text>

        {[188, 256, 324].map(x => (
          <g key={x}>
            <rect x={x} y="230" width="34" height="86" rx="6" fill="#181818" stroke="#FB923C" strokeWidth="1.3" />
            <rect x={x + 6} y="242" width="22" height="16" rx="2" fill="#F97316" fillOpacity="0.35" />
            <rect x={x + 6} y="264" width="22" height="42" rx="2" fill="#0d0d0d" />
            <line x1={x + 17} y1="264" x2={x + 17} y2="306" stroke="#FB923C" strokeOpacity="0.6" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* Caminhão-tanque */}
      <g filter="url(#stationGlow)" transform="translate(30 268)">
        <rect x="0" y="18" width="46" height="34" rx="4" fill="#161616" stroke="#FB923C" strokeWidth="1.3" />
        <rect x="6" y="24" width="16" height="14" rx="2" fill="#F97316" fillOpacity="0.30" />
        <rect x="44" y="8" width="118" height="44" rx="18" fill="url(#tankGrad)" stroke="#FB923C" strokeWidth="1.3" />
        <circle cx="26" cy="56" r="9" fill="#0d0d0d" stroke="#FB923C" strokeWidth="1.2" />
        <circle cx="118" cy="56" r="9" fill="#0d0d0d" stroke="#FB923C" strokeWidth="1.2" />
        <circle cx="146" cy="56" r="9" fill="#0d0d0d" stroke="#FB923C" strokeWidth="1.2" />
      </g>

      {/* Carro */}
      <g filter="url(#stationGlow)" transform="translate(232 300)">
        <rect x="0" y="14" width="80" height="22" rx="8" fill="#171717" stroke="#FB923C" strokeWidth="1.2" />
        <polygon points="14,14 26,0 60,0 70,14" fill="#1c1c1c" stroke="#FB923C" strokeWidth="1.1" />
        <circle cx="16" cy="36" r="7" fill="#0d0d0d" stroke="#FB923C" strokeWidth="1" />
        <circle cx="64" cy="36" r="7" fill="#0d0d0d" stroke="#FB923C" strokeWidth="1" />
      </g>
    </svg>
  );
}
