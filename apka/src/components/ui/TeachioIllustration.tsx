export function TeachioIllustration() {
  return (
    <svg viewBox="0 0 380 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
      {/* Glow rings */}
      <circle cx="190" cy="160" r="140" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
      <circle cx="190" cy="160" r="100" stroke="white" strokeOpacity="0.06" strokeWidth="1" />

      {/* ── Open book ── */}
      <path d="M70 200 L190 182 L310 200 L310 255 L190 237 L70 255 Z" fill="#4f46e5" fillOpacity="0.75" />
      <path d="M70 200 L190 182 L190 237 L70 255 Z" fill="#3730a3" fillOpacity="0.9" />
      <path d="M190 182 L310 200 L310 255 L190 237 Z" fill="#6366f1" fillOpacity="0.85" />
      <line x1="190" y1="182" x2="190" y2="237" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* Left page lines */}
      <line x1="85" y1="208" x2="178" y2="200" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="85" y1="216" x2="178" y2="208" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="85" y1="224" x2="178" y2="216" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* Right page lines */}
      <line x1="202" y1="202" x2="295" y2="208" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="202" y1="210" x2="295" y2="216" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="202" y1="218" x2="295" y2="224" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />

      {/* ── Graduation cap ── */}
      <polygon points="190,75 238,93 190,112 142,93" fill="#a78bfa" fillOpacity="0.95" />
      <polygon points="190,75 238,93 190,112 142,93" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
      <rect x="187" y="110" width="6" height="22" rx="2" fill="#a78bfa" fillOpacity="0.95" />
      <rect x="235" y="91" width="4" height="26" rx="2" fill="#a78bfa" fillOpacity="0.95" />
      <circle cx="237" cy="118" r="6" fill="#c4b5fd" />

      {/* ── Lightbulb ── */}
      <ellipse cx="300" cy="118" rx="22" ry="26" fill="#fde68a" fillOpacity="0.9" />
      <path d="M282 136 Q281 146 286 149 L314 149 Q319 146 318 136" fill="#fde68a" fillOpacity="0.9" />
      <rect x="287" y="149" width="26" height="4" rx="2" fill="#f59e0b" />
      <rect x="290" y="153" width="20" height="4" rx="2" fill="#f59e0b" />
      {/* Rays */}
      <line x1="300" y1="89"  x2="300" y2="79"  stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      <line x1="320" y1="97"  x2="328" y2="89"  stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      <line x1="280" y1="97"  x2="272" y2="89"  stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      <line x1="327" y1="118" x2="337" y2="118" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      <line x1="273" y1="118" x2="263" y2="118" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />

      {/* ── Pencil ── */}
      <g transform="rotate(-38, 82, 145)">
        <rect x="68" y="90" width="14" height="65" rx="3" fill="#fbbf24" />
        <polygon points="68,155 82,155 75,174" fill="#fcd34d" />
        <polygon points="70,163 80,163 75,174" fill="#1e293b" />
        <rect x="68" y="90" width="14" height="9" rx="3" fill="#94a3b8" />
        <rect x="68" y="99" width="14" height="3" fill="#6b7280" />
      </g>

      {/* ── Stacked papers / notes ── */}
      <rect x="105" y="152" width="55" height="40" rx="4" fill="white" fillOpacity="0.12" transform="rotate(-8, 132, 172)" />
      <rect x="108" y="150" width="55" height="40" rx="4" fill="white" fillOpacity="0.1" transform="rotate(-3, 135, 170)" />
      <rect x="111" y="148" width="55" height="40" rx="4" fill="white" fillOpacity="0.15" />
      <line x1="118" y1="158" x2="158" y2="158" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
      <line x1="118" y1="165" x2="158" y2="165" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
      <line x1="118" y1="172" x2="145" y2="172" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* ── Stars / sparkles ── */}
      <circle cx="48"  cy="220" r="5"   fill="#f472b6" fillOpacity="0.9" />
      <circle cx="340" cy="175" r="4"   fill="#34d399" fillOpacity="0.9" />
      <circle cx="42"  cy="155" r="3"   fill="#60a5fa" fillOpacity="0.9" />
      <circle cx="348" cy="95"  r="3.5" fill="#fbbf24" fillOpacity="0.9" />
      <circle cx="355" cy="230" r="2.5" fill="#a78bfa" fillOpacity="0.9" />
      <circle cx="38"  cy="90"  r="2.5" fill="#f472b6" fillOpacity="0.7" />
      <circle cx="155" cy="55"  r="2"   fill="#34d399" fillOpacity="0.8" />
      <circle cx="235" cy="50"  r="3"   fill="#60a5fa" fillOpacity="0.8" />

      {/* Star shape */}
      <path
        d="M55 130 L57.5 122 L60 130 L68 130 L62 135 L64 143 L57.5 138 L51 143 L53 135 L47 130 Z"
        fill="white" fillOpacity="0.12"
      />
      <path
        d="M330 55 L332 49 L334 55 L340 55 L335.5 58.5 L337 64.5 L332 61 L327 64.5 L328.5 58.5 L324 55 Z"
        fill="white" fillOpacity="0.12"
      />
    </svg>
  )
}
